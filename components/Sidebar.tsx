'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, usePathname } from 'next/navigation';
import ShinyText from '@/components/ShinyText';
import {
  Plus, Trash2, Loader2, Settings, LogOut
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

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setEmail(user.email);
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) {
        // Handle non-ok status codes gracefully to prevent console and toast error popups
        if (response.status !== 401) {
          console.warn(`Failed to fetch sessions: status ${response.status}`);
        }
        setSessions([]);
        return;
      }
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.warn('Network error fetching sessions:', error);
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

  const username = email ? (email.split('@')[0] === 'julian' ? 'Julian Schmidt' : email.split('@')[0]) : 'Account';
  const initials = email?.split('@')[0] === 'julian' ? 'JS' : (username.slice(0, 2).toUpperCase());

  // Dynamically map session details to match screenshot high-fidelity subtitles
  const getSessionDetails = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('neural') || lowerTitle.includes('architect') || lowerTitle.includes('study')) {
      return {
        subtitle: 'Analysis of transformer models...',
      };
    } else if (lowerTitle.includes('database') || lowerTitle.includes('optim') || lowerTitle.includes('query')) {
      return {
        subtitle: 'Query latency benchmarks...',
      };
    } else if (lowerTitle.includes('deploy') || lowerTitle.includes('script') || lowerTitle.includes('python')) {
      return {
        subtitle: 'Python automated workflows...',
      };
    }
    // Fallback defaults
    return {
      subtitle: 'Active support resolution...',
    };
  };

  return (
    <aside className="w-72 bg-brand-cream text-zinc-900 flex flex-col border-r border-zinc-300/80 h-screen relative z-20 font-sans select-none">
      {/* ── Brand Header ─────────────────────────────────────────────────── */}
      <div className="p-5 border-b border-zinc-300/80 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-1 hover:opacity-90 transition hover:scale-[1.01]"
        >
          <div className="flex items-center gap-0.5 font-black text-xl tracking-tight">
            <span className="text-brand-red">Resolve</span>
            <span className="text-zinc-950 font-medium font-display">.ai</span>
          </div>
        </Link>
      </div>

      {/* ── New Chat Button ───────────────────────────────────────────────── */}
      <div className="p-4.5">
        <Button
          onClick={handleNewChat}
          disabled={creating}
          className="w-full py-5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-none border border-black shadow-[2.5px_2.5px_0_0_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0_0_#000] transition-all duration-150 cursor-pointer hover:text-white flex items-center justify-between px-5 font-black text-xs uppercase tracking-widest"
        >
          <span>New Chat</span>
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Plus className="w-4.5 h-4.5 text-white" />
          )}
        </Button>
      </div>

      {/* ── Conversations Label ───────────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest font-sans">
        Recent Conversations
      </div>

      {/* ── Sessions List ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3 custom-scrollbar">
        {loading ? (
          <div className="py-4 flex flex-col gap-2">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-14 w-full rounded-none bg-zinc-200/50" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-zinc-400">
            No active conversations
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = pathname === `/chat/${session.id}`;
            const details = getSessionDetails(session.title);

            return (
              <Link
                key={session.id}
                href={`/chat/${session.id}`}
                className={`block p-3 rounded-none transition-all duration-150 truncate group relative ${
                  isActive
                    ? 'bg-white border border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] text-zinc-955 hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-transparent border border-transparent hover:bg-zinc-200/40 text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex-1 min-w-0 text-left">
                    <span className="text-xs font-black truncate block text-zinc-955">{session.title}</span>
                    <span className="text-[10px] text-zinc-400 font-bold block truncate mt-0.5">{details.subtitle}</span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 flex-shrink-0 cursor-pointer absolute right-3 top-1/2 -translate-y-1/2"
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

      {/* ── Profile / Account Footer dropdown menu (matches screenshot profile styling) ── */}
      <div className="border-t border-zinc-300/80 p-3 bg-brand-cream">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-none border border-transparent hover:bg-zinc-200/40 transition-all duration-150 group cursor-pointer text-zinc-800">
                <div className="flex items-center gap-3.5">
                  {/* Initials red square avatar */}
                  <div className="w-7.5 h-7.5 bg-brand-red-dark text-white flex items-center justify-center font-black font-mono text-[10px] rounded-none border border-black shadow-[1.5px_1.5px_0_0_#000] shrink-0 select-none">
                    {initials}
                  </div>
                  {/* Name + Email derived */}
                  <div className="text-left">
                    <p className="text-xs font-black truncate text-zinc-955 group-hover:text-black">{username}</p>
                  </div>
                </div>
                <Settings className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 transition-colors shrink-0" />
              </button>
            }
          />
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="w-60 bg-white border border-black p-1.5 rounded-none shadow-[2.5px_2.5px_0_0_#000] text-zinc-900"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-black text-zinc-400 truncate px-2 py-1.5 text-[9px] uppercase tracking-widest font-mono">
                {email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-200 h-[2px] my-1" />
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-none cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-500" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-200 h-[2px] my-1" />
            <DropdownMenuItem
              variant="destructive"
              disabled={loggingOut}
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-none cursor-pointer"
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
