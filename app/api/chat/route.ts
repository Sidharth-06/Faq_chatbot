import { createServerSupabaseClient } from '@/lib/supabase-server';
import { assembleConversation, buildOpenAIMessages } from '@/lib/conversation-context';
import OpenAI from 'openai';

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

// OpenRouter is fully OpenAI-compatible — just point baseURL at their endpoint
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Resolv.ai',
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, message, model = 'openai/gpt-oss-20b:free' } = body;

    const supabase = await createServerSupabaseClient();

    // Authenticate
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Save user message to DB
    await supabase.from('messages').insert({
      session_id,
      user_id: user.id,
      role: 'user',
      content: message,
      tokens_used: 0,
    });

    // Fetch conversation context (last 10 messages)
    const { data: history } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10);

    let systemInstruction = `You are a helpful, highly intelligent, general-purpose AI assistant named Resolv.ai.
    You answer user questions accurately, engagingly, and concisely.

    Answer directly and concisely.
    For simple factual questions, give the exact answer in one short sentence.
    Do not introduce yourself, do not ask how you can help, and do not answer with a table unless the user explicitly asks for one.
    Do not add system tags or prefixes.`;

    // Assemble conversation with guaranteed order: system → history → current
    const assembled = assembleConversation(systemInstruction, history || [], message);
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
