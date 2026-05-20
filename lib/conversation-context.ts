import { Message } from '@/lib/types';
import OpenAI from 'openai';

export interface AssembledConversation {
  system: string;
  history: OpenAI.Chat.ChatCompletionMessageParam[];
  current: { role: 'user'; content: string };
}

/**
 * Normalize a message from the database into OpenAI-compatible format
 * Handles reasoning_details extraction and content cleaning
 */
function normalizeMessage(
  message: Message
): OpenAI.Chat.ChatCompletionMessageParam {
  const contentStr = message.content as string;
  
  // Search for HTML comment block containing reasoning details
  const reasoningMatch = contentStr.match(/<!-- REASONING_DETAILS:\n([\s\S]*?)\n-->/);
  const cleanContent = contentStr
    .replace(/^\[(KB|GEN)\]\s*/, '')
    .replace(/<!-- REASONING_DETAILS:\n[\s\S]*?\n-->/, '')
    .trim();

  const msgObj: any = {
    role: message.role as 'user' | 'assistant',
    content: cleanContent,
  };

  if (message.role === 'assistant' && reasoningMatch) {
    try {
      msgObj.reasoning_details = JSON.parse(reasoningMatch[1]);
    } catch (e) {
      console.error('Failed to parse reasoning_details from history:', e);
    }
  }

  return msgObj;
}

/**
 * Assemble a complete conversation from system instruction, history, and current query
 * Ensures chronological order and always places current message last
 */
export function assembleConversation(
  systemInstruction: string,
  history: Message[],
  currentUserMessage: string
): AssembledConversation {
  // Sort history by creation time (ascending) to maintain chronological order
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return {
    system: systemInstruction,
    history: sorted.map(normalizeMessage),
    current: { role: 'user', content: currentUserMessage },
  };
}

/**
 * Build the final message array for OpenAI API
 * Structure: [system, ...history, current]
 * This guarantees the current query is always the last user message
 */
export function buildOpenAIMessages(
  assembled: AssembledConversation
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: assembled.system },
    ...assembled.history,
    assembled.current,
  ];
}
