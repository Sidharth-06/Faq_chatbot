'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-50 pb-6 px-6 pt-3 relative z-10 transition duration-300 border-t border-zinc-200/60">
      <div className="max-w-4xl mx-auto flex gap-3 items-end">
        <div className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 transition duration-150 flex items-center shadow-xs focus-within:border-zinc-300/80 focus-within:shadow-sm">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question... (Shift+Enter for new line)"
            className="flex-1 bg-transparent border-none min-h-[24px] h-auto p-0 md:text-sm text-zinc-800 placeholder-zinc-400 outline-none focus-visible:ring-0 focus-visible:border-transparent resize-none max-h-32 pr-2 leading-relaxed font-medium"
            disabled={disabled}
            rows={1}
          />
        </div>
        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          className="h-[44px] w-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-150 shadow-sm hover:translate-y-[-1px] flex items-center justify-center shrink-0 cursor-pointer border border-indigo-500 hover:text-white"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
