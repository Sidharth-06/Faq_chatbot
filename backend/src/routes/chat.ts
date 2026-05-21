import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import OpenAI from 'openai';
import { getWebContext } from '../lib/firecrawl';
import { assembleConversation, buildOpenAIMessages } from '../lib/conversation-context';

const router = Router();

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

// POST /api/chat
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Resolv.ai',
    },
  });

  try {
    const { session_id, message, model = 'openai/gpt-oss-20b:free' } = req.body;
    const supabase = req.supabase;
    const user = req.user;

    if (!session_id || !message) {
      return res.status(400).json({ error: 'Missing session_id or message' });
    }

    // Set headers for Server-Sent Events (SSE) streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

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

    // Fetch conversation history (last 10 messages)
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
          ...({
            reasoning: { enabled: true },
            include_reasoning: true,
          } as any),
        }),
      3,
      1000
    )) as any;

    let fullText = '';
    let tokensUsed = 0;
    let reasoning_details: any = undefined;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullText += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
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
      res.write(`data: ${JSON.stringify({ delta: citationBlock })}\n\n`);
    }

    // Append reasoning details block if we successfully captured it
    let persistedText = fullText;
    if (reasoning_details !== undefined) {
      persistedText = `${fullText}\n\n<!-- REASONING_DETAILS:\n${JSON.stringify(reasoning_details)}\n-->`;
    }

    // Send final payload
    res.write(`data: ${JSON.stringify({ done: true, fullText, tokens: tokensUsed })}\n\n`);
    res.end();

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

  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Express streaming error handling (write error chunk and close connection)
    res.write(`data: ${JSON.stringify({ error: error.message || 'Internal server error' })}\n\n`);
    res.end();
  }
});

export default router;
