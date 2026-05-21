'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import ShinyText from '@/components/ShinyText';
import SpotlightCard from '@/components/SpotlightCard';

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
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white text-zinc-900 min-h-full selection:bg-zinc-900 selection:text-white">
      <div className="max-w-2xl w-full text-center relative z-10">
        
        {/* Soothing Float Sparkles Icon */}
        <div className="w-12 h-12 bg-brand-cream border border-black text-brand-red rounded-none flex items-center justify-center mx-auto shadow-[2px_2px_0_0_#000] mb-6 animate-soothing-float">
          <Sparkles className="w-5 h-5 animate-slow-pulse" />
        </div>

        <div className="mb-10">
          <h1 className="text-2xl font-black tracking-tight text-zinc-950 uppercase tracking-wider font-display flex items-center justify-center gap-0.5">
            <span className="text-brand-red">Resolve</span>
            <span className="text-zinc-950 font-medium">.ai</span> Workspace
          </h1>
          <p className="text-zinc-500 max-w-md mx-auto text-xs font-bold leading-relaxed mt-2 uppercase tracking-wide">
            Start an interactive resolution session. Choose a system preset below or input a custom prompt.
          </p>
        </div>

        {/* Input prompt system container */}
        <form onSubmit={handleSubmit} className="mb-10 max-w-xl mx-auto flex items-end gap-3 bg-white border border-black p-2.5 rounded-none shadow-[2px_2px_0_0_#000] focus-within:shadow-[3px_3px_0_0_#000] focus-within:translate-x-[-0.5px] focus-within:translate-y-[-0.5px] transition-all duration-150">
          <div className="flex-1 min-h-[36px] flex items-center">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
              className="w-full bg-transparent border-none min-h-[28px] h-auto p-1.5 text-sm text-zinc-950 placeholder-zinc-400 outline-none focus-visible:ring-0 focus-visible:border-transparent resize-none max-h-32 pr-2 leading-relaxed font-medium font-sans"
              disabled={loading}
              rows={1}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-zinc-950 text-white hover:bg-zinc-900 border border-black text-[10px] font-black uppercase tracking-widest py-3 px-5 shadow-[2px_2px_0_0_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[0px_0px_0_0_#000] transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </form>

        {/* System Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-10">
          {starterPrompts.map((prompt, idx) => (
            <SpotlightCard
              key={idx}
              onClick={() => handlePromptClick(prompt.text)}
              className="bg-white border border-black rounded-none shadow-[2px_2px_0_0_#000] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#000] transition-all duration-150 group cursor-pointer p-5 flex flex-col justify-between select-none"
            >
              <div>
                <span className="text-[8px] font-black text-brand-red uppercase tracking-widest block mb-2 font-mono">
                  {prompt.category}
                </span>
                <h4 className="font-black text-xs text-zinc-900 group-hover:text-brand-red uppercase tracking-wider transition mb-1.5">
                  {prompt.title}
                </h4>
                <p className="text-zinc-500 text-[10px] leading-relaxed font-bold tracking-wide">
                  "{prompt.text}"
                </p>
              </div>
            </SpotlightCard>
          ))}
        </div>

        <div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('newChat'))}
            className="px-6 py-3 bg-zinc-950 hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-widest rounded-none border border-black shadow-[2.5px_2.5px_0_0_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0_0_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[0px_0px_0_0_#000] transition-all duration-150 cursor-pointer"
          >
            Start Custom Session
          </button>
        </div>
      </div>
    </div>
  );
}
