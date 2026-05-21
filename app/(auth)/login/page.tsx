'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Squares from '@/components/Squares';
import SpotlightCard from '@/components/SpotlightCard';
import ShinyText from '@/components/ShinyText';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-zinc-950 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Interactive Squares background overlay from ReactBits */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Squares 
          direction="diagonal"
          speed={0.4}
          borderColor="rgba(0, 0, 0, 0.04)"
          hoverFillColor="rgba(168, 44, 36, 0.06)"
        />
      </div>

      {/* Diagonal paper grain pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[440px] relative z-10"
      >
        <SpotlightCard className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#000] rounded-none relative overflow-hidden transition-all duration-300 hover:shadow-[10px_10px_0px_0px_#000] w-full">
          
          {/* Header Logo */}
          <div className="flex flex-col items-center mb-7 text-center">
            <Link 
              href="/" 
              className="flex items-center gap-1 text-xl font-extrabold tracking-tight text-brand-red mb-4 hover:scale-[1.01] transition-transform duration-200"
            >
              <span className="text-brand-red font-black">Resolve</span>
              <span className="text-black font-medium">.ai</span>
            </Link>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950 mt-1 font-display select-none">
              Welcome back
            </h2>
            <p className="text-zinc-500 text-xs font-bold mt-1.5 leading-relaxed max-w-[280px]">
              Please enter your credentials to access the platform.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border-2 border-red-500 text-red-950 px-3.5 py-2.5 rounded-none mb-5 flex items-start gap-2 text-xs font-bold shadow-[2px_2px_0px_0px_#ef4444]"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-white border-2 border-black text-zinc-950 placeholder-zinc-400 text-xs font-bold px-4 py-3.5 rounded-none outline-none focus:bg-zinc-50/50 transition-all"
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">
                  Password
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border-2 border-black text-zinc-950 placeholder-zinc-400 text-xs font-bold px-4 py-3.5 rounded-none outline-none focus:bg-zinc-50/50 transition-all"
                required
                disabled={loading}
              />
            </div>

            {/* Action Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6.5 bg-zinc-950 hover:bg-zinc-900 text-white font-extrabold text-sm text-center rounded-none flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0_0_0_0_#000] transition-all duration-200 cursor-pointer mt-4 hover:text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Screen Option */}
          <p className="text-center text-zinc-400 mt-6.5 text-xs font-bold">
            Don't have an account?{' '}
            <Link href="/signup" className="text-zinc-950 hover:underline font-extrabold transition-colors">
              Sign up
            </Link>
          </p>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}
