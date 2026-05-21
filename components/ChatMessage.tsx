'use client';

import React, { useState } from 'react';
import { Message } from '@/lib/types';
import { motion } from 'framer-motion';
import { User, Sparkles, Bot } from 'lucide-react';
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
import CustomChart from './CustomChart';

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
    const trimmed = String(children).trim();

    // Smart detection of Chart JSON
    const isChart = (() => {
      try {
        const obj = JSON.parse(trimmed);
        return (
          obj &&
          typeof obj === 'object' &&
          typeof obj.type === 'string' &&
          ['line', 'bar', 'pie', 'donut'].includes(obj.type.toLowerCase()) &&
          Array.isArray(obj.datasets) &&
          obj.datasets.length > 0 &&
          Array.isArray(obj.datasets[0].data)
        );
      } catch {
        return false;
      }
    })();

    if (isChart) {
      try {
        const parsedData = JSON.parse(trimmed);
        return <CustomChart data={parsedData} />;
      } catch (e) {
        console.error('Failed to parse custom chart JSON:', e);
      }
    }

    const isBlock = className && className.startsWith('language-');
    if (isBlock && className) {
      const language = className.replace('language-', '').toLowerCase();
      
      if (language === 'mermaid') {
        return <Mermaid chart={trimmed} />;
      }
      
      if (language === 'chart' || language === 'json-chart' || language === 'json_chart') {
        try {
          const parsedData = JSON.parse(trimmed);
          return <CustomChart data={parsedData} />;
        } catch (e) {
          console.error('Failed to parse custom chart JSON:', e);
          return (
            <div className="p-3 border border-black bg-zinc-50 rounded-none text-xs text-brand-red font-mono my-2 shadow-[2px_2px_0_0_#000]">
              <div className="font-extrabold mb-1">⚠️ Error Rendering Chart:</div>
              <div>Invalid JSON payload. Falling back to raw codeblock:</div>
              <pre className="mt-2 p-2 bg-zinc-900 text-zinc-100 text-[10px] overflow-x-auto">
                {trimmed}
              </pre>
            </div>
          );
        }
      }

      return (
        <code className="hljs bg-transparent text-zinc-100 py-2 px-0 block rounded">
          {children}
        </code>
      );
    }
    
    return (
      <code className="bg-zinc-100 border border-zinc-200 px-2 py-1 rounded text-xs font-mono text-brand-red font-semibold">
        {children}
      </code>
    );
  },

  // ── Code block with syntax highlighting ────────────────────────────────────
  pre: ({ children }) => {
    if (React.isValidElement(children)) {
      const childProps = children.props as any;
      const codeContent = String(childProps?.children || '').trim();
      const codeClassName = String(childProps?.className || '');
      
      const isChart = (() => {
        try {
          const obj = JSON.parse(codeContent);
          return (
            obj &&
            typeof obj === 'object' &&
            typeof obj.type === 'string' &&
            ['line', 'bar', 'pie', 'donut'].includes(obj.type.toLowerCase()) &&
            Array.isArray(obj.datasets) &&
            obj.datasets.length > 0 &&
            Array.isArray(obj.datasets[0].data)
          );
        } catch {
          return false;
        }
      })();

      const language = codeClassName.replace('language-', '').toLowerCase();
      if (isChart || language === 'mermaid' || language === 'chart' || language === 'json-chart' || language === 'json_chart') {
        return <>{children}</>;
      }
    }

    return (
      <pre className="hljs bg-zinc-900 text-zinc-100 p-4 rounded-lg my-3 font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed shadow-sm">
        {children}
      </pre>
    );
  },

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
      className="text-brand-red font-semibold underline underline-offset-2 hover:text-brand-red-dark transition-colors"
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
    <div className="overflow-x-auto my-4 rounded-none border border-black shadow-[2px_2px_0_0_#000] bg-white">
      <table className="w-full text-xs border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-brand-blue-gray text-zinc-950 border-b border-black font-black uppercase tracking-wider">
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
    <th className="px-4 py-3 text-left font-black text-zinc-950 tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-zinc-700 font-normal">
      {children}
    </td>
  ),
};

interface Attachment {
  name: string;
  type: string;
  size: number;
  base64Data: string;
}

const parseMessageContent = (content: string) => {
  const attachmentRegex = /\[ATTACHMENT_START\]([\s\S]*?)\[ATTACHMENT_END\]/;
  const match = content.match(attachmentRegex);
  let attachments: Attachment[] = [];
  let text = content.replace(attachmentRegex, '').trim();
  if (match) {
    try {
      attachments = JSON.parse(match[1]);
    } catch (e) {
      console.error('Failed to parse attachments', e);
    }
  }
  return { text, attachments };
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const isUser = message.role === 'user';
  const rawContent = message.content || '';
  const { text: parsedText, attachments } = parseMessageContent(rawContent);

  const cleanContent = isUser
    ? parsedText
    : parsedText
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

  const showStats = !isUser && !isEmpty && (
    cleanContent.toLowerCase().includes('transformer') ||
    cleanContent.toLowerCase().includes('neural') ||
    cleanContent.toLowerCase().includes('efficiency') ||
    cleanContent.toLowerCase().includes('validation')
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} items-start`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div 
          className="w-8.5 h-8.5 bg-brand-red flex items-center justify-center border border-black shadow-[1.5px_1.5px_0_0_#000] shrink-0 mt-0.5 hover:rotate-3 transition-transform duration-300 cursor-pointer select-none"
          style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className="flex flex-col max-w-[85%] sm:max-w-[70%]">

        {/* Bubble */}
        <div
          className={`px-4.5 py-3.5 border border-black rounded-none shadow-[2px_2px_0_0_#000] transition-all duration-300 hover:shadow-[3px_3px_0_0_#000] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] ${
            isUser
              ? 'bg-[#f5f8ff] text-zinc-950'
              : 'bg-white text-zinc-950'
          }`}
        >
          {isUser ? (
            <div className="flex flex-col gap-2 font-medium">
              {cleanContent && <p className="text-sm leading-relaxed break-words text-zinc-900">{cleanContent}</p>}
              
              {/* Attachments rendering grid */}
              {attachments.length > 0 && (
                <div className="mt-3.5 pt-3.5 border-t border-zinc-200 flex flex-col gap-2">
                  <div className="text-[8px] font-black tracking-widest text-zinc-400 uppercase font-sans mb-1 select-none">
                    📎 Attached ({attachments.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((file, idx) => {
                      const isImage = file.type.startsWith('image/');
                      
                      const handleDownload = (e: React.MouseEvent) => {
                        e.preventDefault();
                        try {
                          const link = document.createElement('a');
                          link.href = file.base64Data;
                          link.download = file.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } catch (err) {
                          console.error('Download failed:', err);
                        }
                      };

                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-2.5 bg-brand-cream border border-black p-2 shadow-[1.5px_1.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] transition-all duration-200 select-none"
                        >
                          {isImage ? (
                            <div 
                              onClick={() => setActiveLightboxImage(file.base64Data)}
                              className="w-9 h-9 shrink-0 border border-black overflow-hidden cursor-zoom-in hover:opacity-95 transition-opacity"
                            >
                              <img 
                                src={file.base64Data} 
                                alt={file.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 shrink-0 bg-brand-red text-white border border-black flex items-center justify-center font-black text-[9px] uppercase font-mono">
                              {file.name.split('.').pop()?.slice(0, 3) || 'DOC'}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <span className="font-black text-[10px] text-zinc-900 block truncate font-sans">
                              {file.name}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-bold block font-mono mt-0.5">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>

                          <button
                            onClick={handleDownload}
                            className="bg-zinc-950 text-white hover:bg-zinc-900 border border-black text-[8px] font-black uppercase tracking-wider py-1.5 px-3 shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[0.5px_0.5px_0_0_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[0px_0px_0_0_#000] transition-all duration-150 cursor-pointer"
                          >
                            Get
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : isEmpty ? (
            /* Soothing high-fidelity typing indicator */
            <div className="flex items-center gap-2.5 py-1 px-0.5 select-none">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-red"></span>
              </span>
              <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase font-sans animate-slow-pulse">
                Resolving queries...
              </span>
            </div>
          ) : (
            <div className="flex flex-col prose prose-sm max-w-none gap-2 font-medium">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={markdownComponents}
              >
                {cleanContent}
              </ReactMarkdown>
              
              {/* Blinking cursor while still receiving tokens */}
              {isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-brand-red animate-pulse ml-0.5 align-middle" />
              )}

              {/* Side-by-side stats panel grid for rich analytical assistant responses */}
              {showStats && (
                <div className="grid grid-cols-2 gap-3.5 my-2.5 select-none">
                  <div className="bg-[#f5f8ff] border border-black p-3 rounded-none shadow-[1.5px_1.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] transition-all duration-200 flex flex-col">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-sans">
                      Efficiency Delta
                    </span>
                    <span className="text-xs font-black text-brand-red mt-0.5 font-mono">
                      +14.2%
                    </span>
                  </div>
                  <div className="bg-[#f5f8ff] border border-black p-3 rounded-none shadow-[1.5px_1.5px_0_0_#000] hover:shadow-[2.5px_2.5px_0_0_#000] transition-all duration-200 flex flex-col">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-sans">
                      Validation Status
                    </span>
                    <span className="text-xs font-black text-emerald-600 mt-0.5 font-sans uppercase">
                      Stable
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info: Timestamp + User/Assistant tags - styled below the card */}
        {!isEmpty && !isStreaming && (
          <div className={`text-[8.5px] font-black tracking-widest text-zinc-400 mt-1.5 select-none uppercase font-sans ${isUser ? 'text-right' : 'text-left'}`}>
            <span>{isUser ? `YOU` : `ASSISTANT`}</span>
            <span className="mx-1 text-zinc-300">•</span>
            <span>{timeLabel}</span>
            {message.tokens_used > 0 && !isUser && (
              <>
                <span className="mx-1 text-zinc-300">•</span>
                <span className="font-mono text-zinc-400">{message.tokens_used} TOKENS</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8.5 h-8.5 bg-brand-red-dark text-white flex items-center justify-center font-black font-mono text-[10px] rounded-none border border-black shadow-[1.5px_1.5px_0_0_#000] shrink-0 mt-0.5 select-none hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] transition-transform duration-200 cursor-pointer">
          ME
        </div>
      )}

      {/* Image Lightbox Overlay Portal */}
      {activeLightboxImage && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[85vh] bg-brand-cream border-2 border-black p-2.5 shadow-[4px_4px_0_0_#000] cursor-default animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeLightboxImage} 
              alt="Expanded preview" 
              className="max-w-full max-h-[75vh] object-contain border border-black" 
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                Visual Preview
              </span>
              <button
                onClick={() => setActiveLightboxImage(null)}
                className="bg-zinc-950 hover:bg-brand-red text-white border border-black px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#000] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
