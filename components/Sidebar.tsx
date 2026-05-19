'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChatSession } from '@/lib/types';

export default function Sidebar() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    fetchSessions();
  }, []);

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
      if (pathname.includes(sessionId)) {
        router.push('/chat');
      }
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete chat');
    }
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800 h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={handleNewChat}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-70"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Creating...' : 'New Chat'}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-gray-400 text-sm">No chats yet. Start a new one!</p>
        ) : (
          sessions.map((session) => (
            <Link
              key={session.id}
              href={`/chat/${session.id}`}
              className={`block p-3 rounded-lg transition truncate group ${
                pathname === `/chat/${session.id}`
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{session.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="p-1 hover:bg-red-600 rounded opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </Link>
          ))
        )}
      </div>
    </aside>
  );
}
