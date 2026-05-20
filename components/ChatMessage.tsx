'use client';

import { Message } from '@/lib/types';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';
import dynamic from 'next/dynamic';

// Lazy load Mermaid diagram renderer
const Mermaid = dynamic(() => import('@/components/Mermaid'), {
  loading: () => <div className="text-xs text-zinc-400">Loading diagram...</div>,
  ssr: false,
});

interface ChatMessageProps {
  message: Message;
}

/** Shared markdown component map — styled for a clean premium SaaS dashboard */
const markdownComponents: Components = {
  // ── Headings ──────────────────────────────────────────────────────────────
  h1: ({ children }) => (
    <h1 className="text-base font-semibold text-zinc-900 mt-4 mb-2 leading-snug border-b border-zinc-100 pb-1">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold text-zinc-900 mt-3 mb-1.5 leading-snug">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold text-zinc-800 mt-3 mb-1 uppercase tracking-wider">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xs font-medium text-zinc-600 mt-2 mb-1 uppercase tracking-widest">
      {children}
    </h4>
  ),

  // ── Paragraph ─────────────────────────────────────────────────────────────
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-zinc-700 break-words mt-1 mb-2">
      {children}
    </p>
  ),

  // ── Lists ─────────────────────────────────────────────────────────────────
  ul: ({ children }) => (
    <ul className="my-2 pl-5 flex flex-col gap-1 list-disc marker:text-zinc-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 pl-5 flex flex-col gap-1 list-decimal marker:text-zinc-400">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-zinc-700 leading-relaxed pl-0.5">
      {children}
    </li>
  ),

  // ── Inline code ───────────────────────────────────────────────────────────
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="hljs bg-transparent text-zinc-100 py-2 px-0 block rounded">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-zinc-100 border border-zinc-200 px-2 py-1 rounded text-xs font-mono text-indigo-600 font-medium">
        {children}
      </code>
    );
  },

  // ── Code block with syntax highlighting ────────────────────────────────────
  pre: ({ children }) => (
    <pre className="hljs bg-zinc-900 text-zinc-100 p-4 rounded-lg my-3 font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed shadow-sm">
      {children}
    </pre>
  ),

  // ── Blockquote ────────────────────────────────────────────────────────────
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-zinc-800 pl-4 py-1 my-2 bg-zinc-50/50 rounded-r-md text-zinc-600 text-xs italic">
      {children}
    </blockquote>
  ),

  // ── Horizontal rule ───────────────────────────────────────────────────────
  hr: () => <hr className="my-4 border-t border-zinc-200" />,

  // ── Inline bold / italic ──────────────────────────────────────────────────
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-950">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-zinc-600">{children}</em>
  ),

  // ── Links ─────────────────────────────────────────────────────────────────
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 font-medium underline underline-offset-2 hover:text-indigo-800 transition-colors"
    >
      {children}
    </a>
  ),

  // ── Math (LaTeX) ───────────────────────────────────────────────────────────
  div: ({ children, className }) => {
    if (className?.includes('math')) {
      return <div className="my-2 overflow-x-auto">{children}</div>;
    }
    return <div>{children}</div>;
  },

  // ── Enhanced table styling ──────────────────────────────────────────────────
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-zinc-200/80 shadow-sm bg-white">
      <table className="w-full text-xs border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-indigo-50 text-indigo-900 border-b border-indigo-200 font-semibold">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-zinc-100">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-zinc-50 transition-colors duration-100">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-semibold text-indigo-900">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-zinc-700 font-normal">
      {children}
    </td>
  ),
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const rawContent = message.content || '';
  const cleanContent = isUser
    ? rawContent
    : rawContent
        .replace(/^\[(KB|GEN)\]\s*/, '')
        .replace(/<!-- REASONING_DETAILS:\n[\s\S]*?\n-->/, '')
        .trim();
  const isStreaming = message.id === '__streaming__';
  const isEmpty = !isUser && cleanContent.trim().length === 0;

  // Format timestamp — suppress on the in-flight streaming placeholder
  const timeLabel = isStreaming
    ? ''
    : new Date(message.created_at).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8.5 h-8.5 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-500">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">

        {/* Label row for assistant */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1 pl-1">
            <Badge variant="secondary" className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-50 text-indigo-800 text-[10px] font-medium tracking-normal py-0.5 px-2 flex items-center gap-1 rounded-full">
              Assistant
            </Badge>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`px-4.5 py-3 rounded-2xl shadow-xs border ${
            isUser
              ? 'bg-zinc-900 text-zinc-50 border-zinc-800 rounded-tr-sm'
              : 'bg-white text-zinc-800 border-zinc-200/80 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed break-words font-medium">{cleanContent}</p>
          ) : isEmpty ? (
            /* Typing indicator — shown before the first token arrives */
            <div className="flex items-center gap-1 py-1 px-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:300ms]" />
            </div>
          ) : (
            <div className="flex flex-col prose prose-sm max-w-none gap-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={markdownComponents}
              >
                {cleanContent}
              </ReactMarkdown>
              {/* Blinking cursor while still receiving tokens */}
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-zinc-400 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}

          {/* Footer: token count + timestamp — hidden during streaming */}
          {!isEmpty && !isStreaming && (
            <div className={`flex items-center justify-between gap-4 mt-2 border-t pt-1.5 ${isUser ? 'border-zinc-800' : 'border-zinc-100'}`}>
              {message.tokens_used > 0 && !isUser ? (
                <span className="text-[10px] text-zinc-400 font-mono">
                  {message.tokens_used} tokens
                </span>
              ) : <span />}
              <span className="text-[10px] font-normal font-mono text-zinc-400">
                {timeLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8.5 h-8.5 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 shadow-sm border border-zinc-700">
          <User className="w-4 h-4 text-zinc-300" />
        </div>
      )}
    </motion.div>
  );
}
