'use client';

import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">FB</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800">FAQ Bot</h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-70"
        >
          <LogOut className="w-4 h-4" />
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </nav>
  );
}
