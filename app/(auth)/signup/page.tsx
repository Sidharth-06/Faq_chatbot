'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const redirectOrigin = typeof window !== 'undefined' 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${redirectOrigin}/auth/callback`,
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

  return (
    <div className="min-h-screen bg-[#e05e55] text-zinc-900 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-zinc-900 selection:text-white">
      {/* Organic chalky overlay texture effect */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white border-3 border-zinc-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#18181b] relative overflow-hidden">
          
          {/* Brand Header with Hexagon */}
          <div className="flex flex-col items-center mb-8 gap-2.5">
            <Link href="/" className="flex items-center gap-3">
              <div 
                className="w-11 h-11 bg-zinc-900 flex items-center justify-center shadow-md animate-doodle-wiggle cursor-pointer select-none"
                style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
              >
                <div className="text-center text-[6.5px] font-extrabold tracking-widest text-white leading-none px-0.5 uppercase">
                  An Artful Science®
                </div>
              </div>
              <span className="font-extrabold text-2xl tracking-tight font-display text-zinc-900">
                Resolv<span className="text-zinc-900/60">.ai</span>
              </span>
            </Link>
            <p className="text-zinc-700 text-sm font-bold mt-1 text-center">
              Create your free account today.
            </p>
          </div>

          {/* Error Banner in hand-drawn design */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border-2 border-red-500 text-red-950 px-4 py-3 rounded-xl mb-6 flex items-start gap-2.5 text-sm font-bold shadow-[2px_2px_0px_0px_#ef4444]"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSignup}>
            <FieldGroup className="flex flex-col gap-5">
              
              <Field className="flex flex-col gap-1.5">
                <FieldLabel className="text-xs font-extrabold text-zinc-900 uppercase tracking-widest">
                  Email Address
                </FieldLabel>
                <InputGroup className="bg-white border-2 border-zinc-900 focus-within:border-zinc-900 focus-within:ring-0 py-6 rounded-xl transition duration-200 shadow-[2px_2px_0px_0px_#18181b]">
                  <InputGroupAddon align="inline-start" className="pl-4">
                    <Mail className="w-4 h-4 text-zinc-500" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="text-zinc-900 placeholder-zinc-400 text-sm font-bold"
                    required
                  />
                </InputGroup>
              </Field>

              <Field className="flex flex-col gap-1.5">
                <FieldLabel className="text-xs font-extrabold text-zinc-900 uppercase tracking-widest">
                  Password
                </FieldLabel>
                <InputGroup className="bg-white border-2 border-zinc-900 focus-within:border-zinc-900 focus-within:ring-0 py-6 rounded-xl transition duration-200 shadow-[2px_2px_0px_0px_#18181b]">
                  <InputGroupAddon align="inline-start" className="pl-4">
                    <Lock className="w-4 h-4 text-zinc-500" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-zinc-900 placeholder-zinc-400 text-sm font-bold"
                    required
                  />
                </InputGroup>
              </Field>

              <Field className="flex flex-col gap-1.5">
                <FieldLabel className="text-xs font-extrabold text-zinc-900 uppercase tracking-widest">
                  Confirm Password
                </FieldLabel>
                <InputGroup className="bg-white border-2 border-zinc-900 focus-within:border-zinc-900 focus-within:ring-0 py-6 rounded-xl transition duration-200 shadow-[2px_2px_0px_0px_#18181b]">
                  <InputGroupAddon align="inline-start" className="pl-4">
                    <Lock className="w-4 h-4 text-zinc-500" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-zinc-900 placeholder-zinc-400 text-sm font-bold"
                    required
                  />
                </InputGroup>
              </Field>

              {/* Doodle Action Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-lg text-center transition-all duration-200 rounded-xl flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_#475569] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#475569] cursor-pointer border-2 border-zinc-900 mt-2 hover:text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Sign Up</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </FieldGroup>
          </form>

          {/* Toggle Screen Option */}
          <p className="text-center text-zinc-600 mt-6 text-sm font-bold">
            Already have an account?{' '}
            <Link href="/login" className="text-zinc-900 hover:underline font-extrabold transition">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
