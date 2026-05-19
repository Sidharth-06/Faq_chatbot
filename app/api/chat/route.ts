import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { Message, OpenRouterResponse } from '@/lib/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, message, model = 'meta-llama/llama-2-7b-chat' } = body;

    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Save user message
    await supabase
      .from('messages')
      .insert({
        session_id,
        user_id: user.id,
        role: 'user',
        content: message,
        tokens_used: 0,
      });

    // Fetch conversation context (last 10 messages)
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Build messages array for OpenRouter
    const conversationMessages = [
      {
        role: 'system',
        content: 'You are a helpful FAQ chatbot assistant. Answer questions concisely and accurately.',
      },
      ...(messages || []),
    ];

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'FAQ Chatbot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save assistant message
    await supabase
      .from('messages')
      .insert({
        session_id,
        user_id: user.id,
        role: 'assistant',
        content: assistantMessage,
        tokens_used: data.usage?.total_tokens || 0,
      });

    // Update session timestamp
    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id);

    return NextResponse.json({
      message: assistantMessage,
      tokens: data.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
