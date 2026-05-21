'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Paperclip, Send, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  base64Data: string;
}

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        setAttachments((prev) => {
          // Avoid duplicate attachments
          if (prev.some((a) => a.name === file.name && a.size === file.size)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              name: file.name,
              type: file.type,
              size: file.size,
              base64Data,
            },
          ];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || disabled) return;

    let compiledMessage = input;
    if (attachments.length > 0) {
      const serialized = JSON.stringify(
        attachments.map(({ name, type, size, base64Data }) => ({
          name,
          type,
          size,
          base64Data,
        }))
      );
      compiledMessage = `${input}\n\n[ATTACHMENT_START]${serialized}[ATTACHMENT_END]`;
    }

    onSendMessage(compiledMessage);
    setInput('');
    setAttachments([]);
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
    <form onSubmit={handleSubmit} className="bg-white pb-6 px-6 pt-4 relative z-10 border-t border-zinc-200/80 shrink-0">
      <div className="max-w-4xl mx-auto flex flex-col">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.txt,.pdf,.js,.ts,.tsx,.py,.json,.csv,.md,.css,.html,.svg"
        />

        {/* Input Bar Wrapper with premium borders and flat shadows */}
        <div className="flex flex-col gap-2.5 bg-white border border-black p-2.5 rounded-none shadow-[2px_2px_0_0_#000] transition-all duration-150 focus-within:shadow-[3px_3px_0_0_#000] focus-within:translate-x-[-0.5px] focus-within:translate-y-[-0.5px]">
          
          {/* File Attachments Preview Row */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 pb-2 border-b border-zinc-200">
              {attachments.map((file) => {
                const isImage = file.type.startsWith('image/');
                return (
                  <div
                    key={file.id}
                    className="relative flex items-center gap-2.5 bg-brand-cream border border-black p-2 shadow-[1.5px_1.5px_0_0_#000] text-xs transition-all select-none"
                  >
                    {isImage ? (
                      <img
                        src={file.base64Data}
                        alt={file.name}
                        className="w-8.5 h-8.5 object-cover border border-black"
                      />
                    ) : (
                      <div className="w-8.5 h-8.5 flex items-center justify-center bg-brand-red text-white border border-black font-black text-[9px] uppercase font-mono">
                        {file.name.split('.').pop()?.slice(0, 3) || 'FILE'}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-black text-[10px] text-zinc-900 truncate max-w-[130px] font-sans">
                        {file.name}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-bold font-mono">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    {/* Delete Attachment Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(file.id)}
                      className="absolute -top-1.5 -right-1.5 bg-zinc-950 text-white w-4.5 h-4.5 rounded-none border border-black flex items-center justify-center text-[9px] font-black cursor-pointer hover:bg-brand-red transition-colors"
                      title="Remove attachment"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Input controls row */}
          <div className="flex items-end gap-3.5">
            {/* Paperclip upload icon */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors duration-200 cursor-pointer mb-0.5 shrink-0 hover:rotate-3"
              title="Attach file"
            >
              <Paperclip className="w-4.5 h-4.5" />
            </button>

            {/* Prompt Textarea */}
            <div className="flex-1 min-h-[36px] flex items-center">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                className="w-full bg-transparent border-none min-h-[28px] h-auto p-1.5 md:text-sm text-zinc-950 placeholder-zinc-400 outline-none focus-visible:ring-0 focus-visible:border-transparent resize-none max-h-32 pr-2 leading-relaxed font-medium font-sans"
                disabled={disabled}
                rows={1}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={disabled || (!input.trim() && attachments.length === 0)}
              className="bg-zinc-950 text-white hover:bg-zinc-900 border border-black text-[10px] font-black uppercase tracking-widest py-3 px-5 shadow-[2px_2px_0_0_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[0px_0px_0_0_#000] transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-0"
            >
              {disabled ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </form>
  );
}
