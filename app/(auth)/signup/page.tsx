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

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const redirectOrigin = typeof window !== 'undefined' 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${redirectOrigin}/api/auth/callback`,
          data: {
            full_name: fullName,
          }
        },
      });

      if (error) throw error;

      router.push('/login?message=Check your email to confirm your account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const redirectOrigin = typeof window !== 'undefined' 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin}/api/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed');
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
              Create an account
            </h2>
            <p className="text-zinc-500 text-xs font-bold mt-1.5 leading-relaxed max-w-[280px]">
              Join the next generation of scientific rigor.
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
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white border-2 border-black text-zinc-950 placeholder-zinc-400 text-xs font-bold px-4 py-3.5 rounded-none outline-none focus:bg-zinc-50/50 transition-all"
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@resolve.ai"
                className="w-full bg-white border-2 border-black text-zinc-950 placeholder-zinc-400 text-xs font-bold px-4 py-3.5 rounded-none outline-none focus:bg-zinc-50/50 transition-all"
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">
                Password
              </label>
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-zinc-200"></div>
            </div>
            <div className="relative bg-white px-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              or
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-6.5 bg-white hover:bg-zinc-50 text-zinc-950 font-extrabold text-sm text-center rounded-none flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0_0_0_0_#000] transition-all duration-200 cursor-pointer hover:text-zinc-950"
          >
            <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </Button>

          {/* Toggle Screen Option */}
          <p className="text-center text-zinc-400 mt-6.5 text-xs font-bold">
            Already have an account?{' '}
            <Link href="/login" className="text-zinc-950 hover:underline font-extrabold transition-colors">
              Sign in
            </Link>
          </p>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}
