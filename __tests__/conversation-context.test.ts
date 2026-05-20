import { describe, it, expect } from '@jest/globals';
import { assembleConversation, buildOpenAIMessages } from '@/lib/conversation-context';
import { Message } from '@/lib/types';

describe('Conversation Assembly Pattern', () => {
  const systemInstruction = 'You are a helpful assistant.';
  const now = new Date().toISOString();

  it('should place current message last', () => {
    const history: Message[] = [
      {
        id: '1',
        session_id: 'sess-1',
        user_id: 'user-1',
        role: 'user',
        content: 'What is 2+2?',
        tokens_used: 10,
        created_at: now,
      },
      {
        id: '2',
        session_id: 'sess-1',
        user_id: 'user-1',
        role: 'assistant',
        content: '4',
        tokens_used: 5,
        created_at: new Date(new Date(now).getTime() + 1000).toISOString(),
      },
    ];

    const assembled = assembleConversation(
      systemInstruction,
      history,
      'Now what is 2+3?'
    );
    const messages = buildOpenAIMessages(assembled);

    // Last message should be the current query
    expect(messages[messages.length - 1].role).toBe('user');
    expect(messages[messages.length - 1].content).toBe('Now what is 2+3?');
  });

  it('should maintain chronological order', () => {
    const history: Message[] = [
      {
        id: '1',
        session_id: 'sess-1',
        user_id: 'user-1',
        role: 'user',
        content: 'Q1',
        tokens_used: 0,
        created_at: new Date('2026-05-20T10:00:00Z').toISOString(),
      },
      {
        id: '2',
        session_id: 'sess-1',
        user_id: 'user-1',
        role: 'assistant',
        content: 'A1',
        tokens_used: 0,
        created_at: new Date('2026-05-20T10:01:00Z').toISOString(),
      },
      {
        id: '3',
        session_id: 'sess-1',
        user_id: 'user-1',
        role: 'user',
        content: 'Q2',
        tokens_used: 0,
        created_at: new Date('2026-05-20T10:02:00Z').toISOString(),
      },
    ];

    const assembled = assembleConversation(
      systemInstruction,
      history,
      'Q3'
    );
    const messages = buildOpenAIMessages(assembled);

    // Check order: system, Q1, A1, Q2, Q3 (current)
    expect(messages[0].role).toBe('system');
    expect(messages[1].content).toBe('Q1');
    expect(messages[2].content).toBe('A1');
    expect(messages[3].content).toBe('Q2');
    expect(messages[4].content).toBe('Q3');
  });

  it('should handle messages with reasoning details', () => {
    const history: Message[] = [
      {
        id: '1',
        session_id: 'sess-1',
        user_id: 'user-1',
        role: 'assistant',
        content: 'Madrid is the capital of Spain.\n\n<!-- REASONING_DETAILS:\n{"thinking":"This is obvious"}\n-->',
        tokens_used: 10,
        created_at: now,
      },
    ];

    const assembled = assembleConversation(
      systemInstruction,
      history,
      'What is the capital?'
    );
    const messages = buildOpenAIMessages(assembled);

    // Reasoning details should be extracted
    const assistantMsg = messages.find((m) => m.role === 'assistant');
    expect(assistantMsg?.content).toBe('Madrid is the capital of Spain.');
  });

  it('should handle empty history', () => {
    const assembled = assembleConversation(
      systemInstruction,
      [],
      'Hello!'
    );
    const messages = buildOpenAIMessages(assembled);

    // Should have: system + current
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('Hello!');
  });
});
