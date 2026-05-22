import { createServerSupabaseClient } from '@/lib/supabase-server';
import { assembleConversation, buildOpenAIMessages } from '@/lib/conversation-context';
import OpenAI from 'openai';
import { getWebContext } from '@/lib/firecrawl';

// Exponential backoff with jitter for rate limit handling
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Only retry on 429 (rate limit) or 5xx errors
      if (error.status !== 429 && (error.status && error.status < 500)) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter: delay = baseDelay * 2^attempt + random
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * exponentialDelay * 0.1;
        const delay = exponentialDelay + jitter;

        console.warn(
          `Attempt ${attempt + 1} failed with status ${error.status}. Retrying in ${Math.round(delay)}ms...`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}




interface Attachment {
  name: string;
  type: string;
  size: number;
  base64Data: string;
}

function processMessageAttachments(content: string): { cleanedText: string; extractedContext: string } {
  const attachmentRegex = /\[ATTACHMENT_START\]([\s\S]*?)\[ATTACHMENT_END\]/;
  const match = content.match(attachmentRegex);
  const cleanedText = content.replace(attachmentRegex, '').trim();
  let extractedContext = '';

  if (match) {
    try {
      const attachments: Attachment[] = JSON.parse(match[1]);
      attachments.forEach((file) => {
        const isText = 
          file.type.startsWith('text/') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.js') ||
          file.name.endsWith('.ts') ||
          file.name.endsWith('.tsx') ||
          file.name.endsWith('.py') ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.css') ||
          file.name.endsWith('.html') ||
          file.name.endsWith('.svg');

        if (isText && file.base64Data.includes('base64,')) {
          try {
            const base64Content = file.base64Data.split('base64,')[1];
            const decodedText = Buffer.from(base64Content, 'base64').toString('utf-8');
            
            extractedContext += `\n\n---\n[File Attached: ${file.name}]\n\`\`\`\n${decodedText}\n\`\`\`\n---`;
          } catch (decodeErr) {
            console.error(`Failed to decode file ${file.name}:`, decodeErr);
          }
        } else {
          extractedContext += `\n\n---\n[File Attached: ${file.name} (Binary/Image - Size: ${(file.size / 1024).toFixed(1)} KB)]\n---`;
        }
      });
    } catch (e) {
      console.error('Failed to parse attachments in API route', e);
    }
  }

  return { cleanedText, extractedContext };
}

export async function POST(request: Request) {
  // Lazy-init: client created inside handler so missing env vars don't crash build
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';
  const openai = new OpenAI({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
    apiKey: process.env.CLOUDFLARE_API_TOKEN ?? '',
  });

  try {
    const body = await request.json();
    const { session_id, message, model = '@cf/meta/llama-3.1-8b-instruct' } = body;

    const supabase = await createServerSupabaseClient();

    // Authenticate
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Save user message to DB (preserving original base64 tags for reloading)
    await supabase.from('messages').insert({
      session_id,
      user_id: user.id,
      role: 'user',
      content: message,
      tokens_used: 0,
    });

    // Parse current message attachments
    const { cleanedText: currentCleaned, extractedContext: currentExtracted } = processMessageAttachments(message);

    // Fetch conversation context (last 10 messages)
    const { data: history } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Clean up history messages to prevent massive base64 blocks from inflating context
    const cleanedHistory = (history || []).map((msg: any) => {
      if (msg.role === 'user') {
        const { cleanedText } = processMessageAttachments(msg.content);
        const attachmentRegex = /\[ATTACHMENT_START\]([\s\S]*?)\[ATTACHMENT_END\]/;
        const hasAttachments = msg.content.match(attachmentRegex);
        let historyText = cleanedText;
        if (hasAttachments) {
          try {
            const attachments: Attachment[] = JSON.parse(hasAttachments[1]);
            const names = attachments.map(a => a.name).join(', ');
            historyText += `\n\n[Attachments in history: ${names}]`;
          } catch {
            historyText += `\n\n[Attachments in history]`;
          }
        }
        return { ...msg, content: historyText };
      }
      return msg;
    });

    // Fetch live web context using Firecrawl if search intent matches
    let webContext = null;
    try {
      webContext = await getWebContext(currentCleaned);
    } catch (e) {
      console.error('Error fetching web context from Firecrawl in API route:', e);
    }

    let systemInstruction = `You are a helpful, highly intelligent, general-purpose AI assistant named Resolv.ai.
    You answer user questions accurately, engagingly, and concisely.

    Answer directly and concisely.
    For simple factual questions, give the exact answer in one short sentence.
    Do not introduce yourself, do not ask how you can help.
    Do not add system tags or prefixes.

    DATA VISUALIZATION & FLOWCHARTS:
    1. If comparing historical stock prices, market trends, financial statistics, or competitor percentages, you MUST represent this data visually using a custom chart block with the exact structure below. Do not use tables; use this JSON chart format instead:
       \`\`\`chart
       {
         "type": "bar" | "line" | "donut",
         "title": "Short Descriptive Title",
         "labels": ["Label A", "Label B", "Label C"],
         "datasets": [
           {
             "label": "Accompanying Unit Label",
             "data": [valueA, valueB, valueC]
           }
         ]
       }
       \`\`\`
       Choose "line" for sequential trends, "bar" for item comparisons, and "donut" for share/percentage distribution of assets. Ensure the JSON is perfectly valid and is wrapped in the \`\`\`chart ... \`\`\` code block.

    2. If describing workflows, sequential steps, architectural systems, or scraper cycles, you MUST output a standard Mermaid diagram block:
       \`\`\`mermaid
       graph TD
       A[Start] --> B[Next Step]
       \`\`\`
       Ensure the block starts with \`\`\`mermaid.`;

    if (webContext) {
      systemInstruction = `${systemInstruction}\n\n${webContext.context}`;
    }

    // Assemble conversation with guaranteed order: system → history → current
    const currentPrompt = currentCleaned + currentExtracted;
    const assembled = assembleConversation(systemInstruction, cleanedHistory, currentPrompt);
    const conversationMessages = buildOpenAIMessages(assembled);

    // ── Streaming with retry logic for rate limits ────────────────────────────
    const stream = (await withRetry(
      () =>
        openai.chat.completions.create({
          model,
          messages: conversationMessages,
          temperature: 0.2,
          max_tokens: 1024,
          stream: true,
        }),
      3,
      1000
    )) as any;

    let fullText = '';
    let tokensUsed = 0;
    let reasoning_details: any = undefined;
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              fullText += delta;
              // Send each chunk as a plain text SSE data line
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
            }

            // Capture reasoning deltas
            const rawDelta = chunk.choices[0]?.delta as any;
            if (rawDelta?.reasoning_details) {
              if (Array.isArray(rawDelta.reasoning_details)) {
                if (!reasoning_details) reasoning_details = [];
                reasoning_details.push(...rawDelta.reasoning_details);
              } else if (typeof rawDelta.reasoning_details === 'object') {
                if (!reasoning_details) reasoning_details = {};
                reasoning_details = { ...reasoning_details, ...rawDelta.reasoning_details };
              } else {
                reasoning_details = rawDelta.reasoning_details;
              }
            } else if (rawDelta?.reasoning) {
              if (typeof rawDelta.reasoning === 'string') {
                if (typeof reasoning_details !== 'string') reasoning_details = '';
                reasoning_details += rawDelta.reasoning;
              } else {
                reasoning_details = rawDelta.reasoning;
              }
            } else if (rawDelta?.reasoning_content) {
              if (typeof rawDelta.reasoning_content === 'string') {
                if (typeof reasoning_details !== 'string') reasoning_details = '';
                reasoning_details += rawDelta.reasoning_content;
              } else {
                reasoning_details = rawDelta.reasoning_content;
              }
            }

            if (chunk.usage) {
              tokensUsed = chunk.usage.total_tokens ?? 0;
            }
          }

          // If we had web context sources, append them to the stream and fullText at the end
          if (webContext && webContext.sources && webContext.sources.length > 0) {
            const sourcesTitle = `\n\n---\n### 🌐 Sources Reviewed\n`;
            let sourcesList = '';
            webContext.sources.forEach(source => {
              sourcesList += `- [${source.title}](${source.url})\n`;
            });
            
            const citationBlock = `${sourcesTitle}${sourcesList}`;
            fullText += citationBlock;
            
            // Stream the citation block to the client so it renders immediately
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: citationBlock })}\n\n`));
          }
        } catch (err) {
          controller.error(err);
          return;
        }

        // Append reasoning details block if we successfully captured it
        let persistedText = fullText;
        if (reasoning_details !== undefined) {
          persistedText = `${fullText}\n\n<!-- REASONING_DETAILS:\n${JSON.stringify(reasoning_details)}\n-->`;
        }

        // Send the final message so the client knows the prefix & can persist
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, fullText, tokens: tokensUsed })}\n\n`)
        );
        controller.close();

        // Persist the complete assistant message to Supabase
        await supabase.from('messages').insert({
          session_id,
          user_id: user.id,
          role: 'assistant',
          content: persistedText,
          tokens_used: tokensUsed,
        });

        // Update session timestamp
        await supabase
          .from('sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', session_id);
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // Provide better error messages based on error type
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if ('status' in error) {
        statusCode = (error as any).status || 500;
        if (statusCode === 429) {
          errorMessage = 'Rate limited by provider. Please wait a moment and try again.';
        } else if (statusCode === 401) {
          errorMessage = 'Invalid API key';
        } else if (statusCode >= 500) {
          errorMessage = 'Provider service temporarily unavailable. Please try again.';
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
