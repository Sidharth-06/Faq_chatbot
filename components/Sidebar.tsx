'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus, MessageSquare, Trash2, Loader2,
  Settings, LogOut, User, ChevronUp, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChatSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

export default function Sidebar() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    fetchSessions();
    fetchUser();

    const handleNewChatEvent = () => handleNewChat();
    const handleTitleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { sessionId: updatedSessionId, title: newTitle } = customEvent.detail;
      setSessions(prev =>
        prev.map(s => s.id === updatedSessionId ? { ...s, title: newTitle } : s)
      );
    };

    // Subscribe to real-time session updates
    const channel = supabase
      .channel('sessions_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions' },
        (payload: any) => {
          const updatedSession = payload.new;
          setSessions(prev =>
            prev.map(s => s.id === updatedSession.id ? updatedSession : s)
          );
        }
      )
      .subscribe();

    window.addEventListener('newChat', handleNewChatEvent);
    window.addEventListener('sessionTitleUpdated', handleTitleUpdate);
    
    return () => {
      window.removeEventListener('newChat', handleNewChatEvent);
      window.removeEventListener('sessionTitleUpdated', handleTitleUpdate);
      channel.unsubscribe();
    };
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setEmail(user.email);
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (!response.ok) throw new Error('Failed to create session');
      const session = await response.json();
      setSessions([session, ...sessions]);
      router.push(`/chat/${session.id}`);
      toast.success('New chat created');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create chat');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this chat?')) return;
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ is_deleted: true })
        .eq('id', sessionId);
      if (error) throw error;
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (pathname.includes(sessionId)) router.push('/chat');
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    } finally {
      setLoggingOut(false);
    }
  };

  const username = email?.split('@')[0] ?? 'Account';

  return (
    <aside className="w-72 bg-zinc-950 text-zinc-200 flex flex-col border-r border-zinc-800 h-screen relative z-20 font-sans selection:bg-zinc-800 selection:text-white">

      {/* ── Brand Header ─────────────────────────────────────────────────── */}
      <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          {/* Elegant Geometric SaaS Logo */}
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md select-none">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white font-display">
            Resolv<span className="text-indigo-400">.ai</span>
          </span>
        </Link>
      </div>

      {/* ── Global Nav Links ──────────────────────────────────────────────── */}
      <div className="p-4 border-b border-zinc-800 flex flex-col gap-1.5">
        <Link
          href="/chat"
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            pathname.startsWith('/chat')
              ? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
              : 'bg-transparent border border-transparent hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${pathname.startsWith('/chat') ? 'text-indigo-400' : 'text-zinc-400'}`} />
          Chat Assistant
        </Link>
      </div>

      {/* ── New Chat Button ───────────────────────────────────────────────── */}
      <div className="p-4 border-b border-zinc-800">
        <Button
          onClick={handleNewChat}
          disabled={creating}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-sm hover:translate-y-[-1px] transition-all duration-150 cursor-pointer hover:text-white"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Plus className="w-4 h-4 text-white" data-icon="inline-start" />
          )}
          {creating ? 'Creating...' : 'New Chat Session'}
        </Button>
      </div>

      {/* ── Conversations Label ───────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
        Active Conversations
      </div>

      {/* ── Sessions List ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1.5 custom-scrollbar">
        {loading ? (
          <div className="py-4 flex flex-col gap-2">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-9 w-full rounded-lg bg-zinc-900" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-zinc-600">
            No active conversations
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = pathname === `/chat/${session.id}`;
            return (
              <Link
                key={session.id}
                href={`/chat/${session.id}`}
                className={`block p-2.5 rounded-lg transition-all duration-150 truncate group relative border ${
                  isActive
                    ? 'bg-zinc-900 border-zinc-800 text-white font-medium shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 font-normal'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                    <span className="text-sm truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-950/40 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 flex-shrink-0 cursor-pointer"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ── Profile / Account Footer ──────────────────────────────────────── */}
      <div className="border-t border-zinc-800 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-zinc-800 hover:bg-zinc-900/60 transition-all duration-150 group cursor-pointer text-zinc-300 hover:text-white">
                {/* Avatar */}
                <div className="w-7.5 h-7.5 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0 border border-zinc-800 shadow-inner">
                  <User className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300" />
                </div>
                {/* Name + email */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold truncate text-zinc-200">{username}</p>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">{email ?? '—'}</p>
                </div>
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
              </button>
            }
          />
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="w-64 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl shadow-xl text-zinc-200"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-semibold text-zinc-500 truncate px-2 py-1.5 text-[10px] uppercase tracking-wider font-mono">
                {email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-800 h-[1px] my-1" />
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800 h-[1px] my-1" />
            <DropdownMenuItem
              variant="destructive"
              disabled={loggingOut}
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
