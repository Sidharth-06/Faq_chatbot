'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import { Message } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(!!sessionId);
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  const handleSendMessage = async (content: string) => {
    if (!sessionId) return;

    setSending(true);
    try {
      // Add user message to state immediately (optimistic update)
      const userMessage: Message = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        user_id: '',
        role: 'user',
        content,
        tokens_used: 0,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: content,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
          <span className="text-white text-2xl font-bold">FB</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome to FAQ Chatbot</h1>
        <p className="text-gray-600">Select a chat or create a new one to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <ChatWindow messages={messages} />
          <MessageInput onSendMessage={handleSendMessage} disabled={sending} />
        </>
      )}
    </div>
  );
}
