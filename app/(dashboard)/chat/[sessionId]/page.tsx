'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { generateChatTitle, updateSessionTitle } from '@/lib/chat-title';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import { Message } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const STREAMING_ID = '__streaming__';

const POPULAR_MODELS = [
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free', name: 'Nemotron Nano 12B V2 VL' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen3 Next 80B A3B' },
  { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'Nemotron Nano 9B V2' },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B' },
  { id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B' },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air' },
];

const DEFAULT_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
];

export default function ChatPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(!!sessionId);
  const [sending, setSending] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('nvidia/nemotron-nano-12b-v2-vl:free');
  const supabase = createClient();

  // Track if we've already generated a title for this session
  const titleGeneratedRef = useRef(false);

  // While streaming is in flight, suppress real-time assistant inserts
  const isStreamingRef = useRef(false);
  const sendLockRef = useRef(false);

  useEffect(() => {
    // Load custom models
    const savedModelsRaw = localStorage.getItem('resolv_custom_models');
    let loadedModelIds: string[] = DEFAULT_MODELS;
    
    if (savedModelsRaw) {
      try {
        const parsed = JSON.parse(savedModelsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedModelIds = parsed;
        }
      } catch (e) {
        console.error('Error parsing custom models:', e);
      }
    }
    
    // Map to full model info
    const modelsMapped = loadedModelIds.map(id => {
      const match = POPULAR_MODELS.find(pm => pm.id === id);
      return {
        id,
        name: match ? match.name : id.split('/').pop()?.split(':')[0]?.toUpperCase() || id
      };
    });
    setAvailableModels(modelsMapped);

    // Load active model selection
    const activeModel = localStorage.getItem('resolv_selected_model');
    if (activeModel && loadedModelIds.includes(activeModel)) {
      setSelectedModel(activeModel);
    } else {
      setSelectedModel(loadedModelIds[0]);
      localStorage.setItem('resolv_selected_model', loadedModelIds[0]);
    }
  }, []);

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    localStorage.setItem('resolv_selected_model', newModel);
  };

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
        
        const messages = data || [];
        setMessages(messages);

        // Generate title from first user message if still "New Chat"
        if (messages.length > 0 && !titleGeneratedRef.current) {
          const firstUserMsg = messages.find((m: Message) => m.role === 'user');
          if (firstUserMsg && firstUserMsg.content) {
            titleGeneratedRef.current = true;
            const generatedTitle = generateChatTitle(firstUserMsg.content);
            
            // Update session title if it's still "New Chat"
            const { data: sessionData } = await supabase
              .from('sessions')
              .select('title')
              .eq('id', sessionId)
              .single();
            
            if (sessionData?.title === 'New Chat') {
              await updateSessionTitle(sessionId, generatedTitle, supabase);
              // Dispatch event for sidebar update
              window.dispatchEvent(new CustomEvent('sessionTitleUpdated', {
                detail: { sessionId, title: generatedTitle }
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

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
          const incoming = payload.new as Message;

          // User messages are already shown optimistically — skip
          if (incoming.role === 'user') return;

          // If we are currently streaming we already have the content in state;
          // the DB insert will arrive here once streaming finishes.
          // At that point replace the STREAMING_ID placeholder with the real DB row
          // (it has the correct id, created_at, tokens_used, etc.)
          if (incoming.role === 'assistant') {
            setMessages((prev) => {
              const hasPlaceholder = prev.some((m) => m.id === STREAMING_ID);
              if (hasPlaceholder) {
                // Swap placeholder for the real persisted message
                return prev.map((m) => (m.id === STREAMING_ID ? incoming : m));
              }
              // No placeholder — this is a message from another session/tab
              return [...prev, incoming];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  const handleSendMessage = async (content: string) => {
    if (!sessionId || sendLockRef.current) return;
    sendLockRef.current = true;
    setSending(true);
    isStreamingRef.current = true;

    // Optimistic user bubble
    const tempUserId = crypto.randomUUID();
    const userMessage: Message = {
      id: tempUserId,
      session_id: sessionId,
      user_id: '',
      role: 'user',
      content,
      tokens_used: 0,
      created_at: new Date().toISOString(),
    };

    // Empty assistant placeholder that will be filled chunk-by-chunk
    const placeholder: Message = {
      id: STREAMING_ID,
      session_id: sessionId,
      user_id: '',
      role: 'assistant',
      content: '',
      tokens_used: 0,
      created_at: new Date().toISOString(),
    };

    // If this is the first message and no title was generated yet, generate one
    if (messages.length === 0 && !titleGeneratedRef.current) {
      titleGeneratedRef.current = true;
      const generatedTitle = generateChatTitle(content);
      // Dispatch event immediately so sidebar updates
      window.dispatchEvent(new CustomEvent('sessionTitleUpdated', {
        detail: { sessionId, title: generatedTitle }
      }));
      // Update DB in background
      updateSessionTitle(sessionId, generatedTitle, supabase).catch(console.error);
    }

    setMessages((prev) => {
      if (prev.some((m) => m.id === STREAMING_ID)) {
        return prev;
      }
      return [...prev, userMessage, placeholder];
    });

    try {
      const savedModel = typeof window !== 'undefined' ? localStorage.getItem('resolv_selected_model') : null;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sessionId, 
          message: content,
          model: savedModel || undefined
        }),
      });

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({}));
        const errorMsg = errData.error ?? 'Failed to send message';
        
        // Show more helpful error message for rate limits
        if (response.status === 429) {
          alert('⏳ Rate limited. Please wait a moment and try again.');
        } else {
          alert(`❌ ${errorMsg}`);
        }
        
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      // SSE buffer — chunks may be split mid-event
      let sseBuffer = '';
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Append raw bytes to buffer
        sseBuffer += decoder.decode(value, { stream: true });

        // Split on double-newline (SSE event boundary)
        const events = sseBuffer.split('\n\n');
        // Keep the last (possibly incomplete) segment in the buffer
        sseBuffer = events.pop() ?? '';

        for (const event of events) {
          const line = event.trim();
          if (!line.startsWith('data: ')) continue;

          let json: Record<string, unknown>;
          try {
            json = JSON.parse(line.slice(6));
          } catch {
            continue; // Malformed — skip
          }

          if (typeof json.delta === 'string') {
            accumulated += json.delta;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === STREAMING_ID ? { ...m, content: accumulated } : m
              )
            );
          }

          // `done` event carries the final text + token count.
          // The real-time subscription will replace STREAMING_ID once the DB
          // insert arrives — we just need to ensure accumulated stays correct.
          if (json.done && typeof json.fullText === 'string') {
            accumulated = json.fullText as string;
            // Pre-update with final text so there's no flash before DB row arrives
            setMessages((prev) =>
              prev.map((m) =>
                m.id === STREAMING_ID
                  ? { ...m, content: accumulated, tokens_used: (json.tokens as number) ?? 0 }
                  : m
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Clean up — remove both optimistic messages
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempUserId && m.id !== STREAMING_ID)
      );
    } finally {
      isStreamingRef.current = false;
      sendLockRef.current = false;
      setSending(false);
    }
  };

  // Auto-send a prompt that was stored before navigating to this session
  useEffect(() => {
    if (loading) return;
    const pendingPrompt = localStorage.getItem('pendingPrompt');
    if (pendingPrompt && messages.length === 0) {
      localStorage.removeItem('pendingPrompt');
      handleSendMessage(pendingPrompt);
    }
  }, [loading, messages, sessionId]);

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 bg-[#fdf6f2]">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#475569]">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 font-display">Resolv.ai Assistant</h1>
        <p className="text-zinc-500 text-sm font-semibold">Select a chat or create a new one to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            <span className="text-xs font-extrabold text-zinc-400 tracking-widest uppercase font-mono">
              Loading history...
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Neo-brutalist Model Selector Header */}
          <div className="border-b-2 border-black bg-brand-cream px-6 py-3 flex flex-row justify-between items-center gap-3 relative z-20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-red border border-black animate-pulse shrink-0" />
              <h2 className="text-xs font-black tracking-widest uppercase text-zinc-950 font-mono">
                Active Session
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                Model:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-white border-2 border-black text-zinc-950 text-xs font-bold px-3 py-1.5 rounded-none outline-none shadow-[2px_2px_0px_0px_#000] focus:shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-zinc-50 cursor-pointer"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ChatWindow messages={messages} />
          <MessageInput onSendMessage={handleSendMessage} disabled={sending} />
        </>
      )}
    </div>
  );
}
