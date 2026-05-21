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
    <div className="flex-1 overflow-y-auto bg-white p-6 flex flex-col gap-6 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <Empty className="border border-black bg-white p-8 max-w-md rounded-none shadow-[2px_2px_0_0_#000]">
            <EmptyHeader className="gap-4 text-center">
              <EmptyMedia variant="icon" className="w-12 h-12 bg-brand-cream border border-black text-brand-red rounded-none flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-6 h-6 animate-slow-pulse" />
              </EmptyMedia>
              <EmptyTitle className="font-black text-zinc-950 text-lg uppercase tracking-wider font-display">Resolv.ai Assistant</EmptyTitle>
              <EmptyDescription className="text-zinc-500 text-xs font-bold leading-relaxed max-w-sm uppercase tracking-wide">
                Ask any system question and get a direct binding answer instantly.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          {/* Beautiful modern elegant date separator */}
          <div className="flex items-center justify-center my-2 select-none shrink-0">
            <div className="h-[1px] bg-zinc-200/80 flex-1 max-w-[120px]" />
            <span className="text-[9px] font-black text-zinc-400 tracking-[0.3em] mx-6 uppercase font-sans">
              OCTOBER 24, 2024
            </span>
            <div className="h-[1px] bg-zinc-200/80 flex-1 max-w-[120px]" />
          </div>

          {messages.map((message, index) => (
            <ChatMessage key={`${message.id}-${index}`} message={message} />
          ))}
          <div ref={endRef} />
        </>
      )}
    </div>
  );
}
