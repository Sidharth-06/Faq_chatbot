'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function ChatDefaultPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const starterPrompts = [
    {
      title: 'Client Auth Flow',
      text: 'How does the client authentication work?',
      category: 'API & Devs',
    },
    {
      title: 'Session Limits',
      text: 'What is the token limit per session?',
      category: 'Billing & Plans',
    },
    {
      title: 'Data Syncing',
      text: 'Can I sync multiple data categories?',
      category: 'Troubleshooting',
    },
  ];

  const handlePromptClick = (promptText: string) => {
    localStorage.setItem('pendingPrompt', promptText);
    window.dispatchEvent(new CustomEvent('newChat'));
  };

  const startConversation = async (message: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (!response.ok) throw new Error('Failed to create session');
      const session = await response.json();
      localStorage.setItem('pendingPrompt', message);
      router.push(`/chat/${session.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    await startConversation(input);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-50 text-zinc-800 min-h-full selection:bg-zinc-900 selection:text-white">
      <div className="max-w-2xl w-full text-center relative z-10">
        <div className="relative mb-6 inline-flex items-center justify-center">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 font-display">
            Resolv<span className="text-indigo-600">.ai</span> Chat
          </h1>
          <p className="text-zinc-500 max-w-md mx-auto text-sm font-medium mt-2 leading-relaxed">
            Start a conversation in real time. Ask a question or launch a starter prompt below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8 flex gap-3 text-left">
          <div className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 transition duration-150 flex items-center shadow-xs focus-within:border-zinc-300/80 focus-within:shadow-sm">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent border-none min-h-[24px] h-auto p-0 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus-visible:ring-0 focus-visible:border-transparent resize-none max-h-32 pr-2 leading-relaxed font-medium"
              disabled={loading}
              rows={1}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-[44px] w-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-150 shadow-sm hover:translate-y-[-1px] flex items-center justify-center shrink-0 cursor-pointer border border-indigo-500 hover:text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
          {starterPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(prompt.text)}
              className="p-5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-350 shadow-xs hover:translate-y-[-1px] hover:shadow-sm transition-all duration-150 group cursor-pointer text-left"
            >
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block mb-2 font-mono">
                {prompt.category}
              </span>
              <h4 className="font-semibold text-sm text-zinc-900 group-hover:text-indigo-600 transition mb-1.5">
                {prompt.title}
              </h4>
              <p className="text-zinc-500 text-xs leading-relaxed font-medium line-clamp-3">
                '{prompt.text}'
              </p>
            </button>
          ))}
        </div>

        <div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('newChat'))}
            className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm rounded-xl transition duration-150 border border-zinc-800 shadow-sm cursor-pointer"
          >
            Start Custom Session
          </button>
        </div>
      </div>
    </div>
  );
}
