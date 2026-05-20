import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-please-set-env-vars.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                  'placeholder-please-set-env-vars';
  
  return createBrowserClient(url, anonKey);
};

