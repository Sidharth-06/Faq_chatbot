'use client';

import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    }
    getProfile();
  }, [supabase]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <nav className="bg-[#fdf6f2]/90 backdrop-blur-md border-b-2 border-zinc-900 px-6 py-4 flex items-center justify-between relative z-10 transition duration-300 font-sans selection:bg-zinc-900 selection:text-white">
      
      {/* Title / Info Indicator */}
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <h2 className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest font-sans">
          FAQ Resolution Workspace — Active
        </h2>
      </div>

      {/* Account Settings / Meta Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="text-zinc-700 border-2 border-zinc-900 hover:bg-zinc-100 rounded-xl shadow-[2px_2px_0px_0px_#18181b] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#18181b] transition-all cursor-pointer bg-white h-9 w-9 flex items-center justify-center"
          onClick={() => router.push('/settings')}
        >
          <Settings className="w-4 h-4 text-zinc-900" />
        </Button>

        {email ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 bg-white border-2 border-zinc-900 text-zinc-900 font-extrabold rounded-xl shadow-[2px_2px_0px_0px_#18181b] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#18181b] transition-all cursor-pointer"
                >
                  <User className="text-zinc-900 w-4 h-4" data-icon="inline-start" />
                  <span>{email.split('@')[0]}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 bg-white border-3 border-zinc-900 p-2 rounded-xl shadow-[4px_4px_0px_0px_#18181b]">
              <DropdownMenuLabel className="font-extrabold text-zinc-400 truncate px-2 py-1.5 text-[9px] uppercase tracking-widest font-mono">
                {email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-200 h-[2px] my-1" />
              <DropdownMenuItem onClick={() => router.push('/settings')} className="flex items-center gap-2 px-2 py-1.5 text-sm font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg cursor-pointer">
                <Settings className="w-4 h-4 text-zinc-900" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-200 h-[2px] my-1" />
              <DropdownMenuItem
                variant="destructive"
                disabled={loading}
                onClick={handleLogout}
                className="flex items-center gap-2 px-2 py-1.5 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            disabled={loading}
            onClick={handleLogout}
            className="font-extrabold bg-red-600 hover:bg-red-500 border-2 border-zinc-900 text-white rounded-xl text-xs py-2 px-4 shadow-[2px_2px_0px_0px_#18181b] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#18181b] transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-white" data-icon="inline-start" />
            {loading ? 'Leaving...' : 'Sign Out'}
          </Button>
        )}
      </div>
    </nav>
  );
}
