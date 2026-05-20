'use client';

import Link from 'next/link';
import { Sparkles, MessageSquare, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden flex flex-col justify-between">
      {/* Sleek ambient glow backdrop grid */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-indigo-600/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          {/* Elegant geometric SaaS Logo */}
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md select-none">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white font-display">
            Resolv<span className="text-indigo-400">.ai</span>
          </span>
        </div>

        {/* Top Actions in premium SaaS style */}
        <nav className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition duration-200">
            Sign in
          </Link>
          <Link href="/signup" className="px-4.5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 hover:shadow-lg transition duration-200">
            Start Free
          </Link>
        </nav>
      </header>

      {/* Hero Content Section */}
      <main className="max-w-5xl mx-auto w-full px-6 py-12 md:py-20 relative z-10 flex-grow flex flex-col items-center justify-center">
        
        {/* Intro Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold mb-6 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Intelligent AI Assistant</span>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center max-w-3xl mb-12">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white font-display leading-[1.1] mb-6">
            The Instant Assistant <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Assistant for Teams
            </span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Get fast, reliable answers and guidance in a clean, high-performance chat experience for your team.
          </p>
        </div>

        {/* Hero Preview Card Stack */}
        <div className="w-full max-w-3xl mb-14 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          
          {/* Card 1: Instant Answers */}
          <div className="p-6 bg-zinc-900/60 border border-zinc-850 rounded-2xl shadow-sm backdrop-blur-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-white mb-2">Instant Answers</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Ask anything and get clear, concise guidance in seconds with a streamlined AI assistant.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Zap className="w-4 h-4" /> Built for speed
            </div>
          </div>

          {/* Card 2: AI Querying */}
          <div className="p-6 bg-zinc-900/60 border border-zinc-850 rounded-2xl shadow-sm backdrop-blur-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-white mb-2">Live AI Conversations</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Chat assistant uses custom semantic context to respond instantly, citing matching sources while minimizing hallucinations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <Zap className="w-4 h-4" /> Near-zero latency streaming
            </div>
          </div>

        </div>

        {/* Action Button Decks */}
        <div className="w-full max-w-md mx-auto flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/chat"
            className="flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base text-center transition duration-150 rounded-xl flex items-center justify-center gap-2 shadow-md hover:translate-y-[-1px]"
          >
            <MessageSquare className="w-4.5 h-4.5" /> Start Chatting
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-zinc-900 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-zinc-500 font-normal">
          © {new Date().getFullYear()} Resolv.ai. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition">Documentation</a>
          <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition">Privacy Policy</a>
          <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition">Support</a>
        </div>
      </footer>
    </div>
  );
}
