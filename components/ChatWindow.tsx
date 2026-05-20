'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import ChatMessage from './ChatMessage';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { Sparkles } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 p-6 flex flex-col gap-6 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full animate-fade-in">
          <Empty className="border border-zinc-200/80 bg-white p-8 max-w-md rounded-2xl shadow-sm">
            <EmptyHeader className="gap-4 text-center">
              <EmptyMedia variant="icon" className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-6 h-6" />
              </EmptyMedia>
              <EmptyTitle className="font-semibold text-zinc-900 text-lg">Resolv.ai Assistant</EmptyTitle>
              <EmptyDescription className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                Ask any question and get a direct answer instantly.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <ChatMessage key={`${message.id}-${index}`} message={message} />
          ))}
          <div ref={endRef} />
        </>
      )}
    </div>
  );
}
