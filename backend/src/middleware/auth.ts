import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: any;
  supabase?: any;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Extract from cookies forwarded by Next.js proxy
      const cookies = req.cookies || {};
      
      // Dynamically extract the Supabase project reference to find the auth cookie
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const match = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/);
      const projectRef = match ? match[1] : '';
      const expectedCookieName = projectRef ? `sb-${projectRef}-auth-token` : '';

      if (expectedCookieName && cookies[expectedCookieName]) {
        try {
          const cookieVal = JSON.parse(cookies[expectedCookieName]);
          token = cookieVal.access_token;
        } catch {
          token = cookies[expectedCookieName];
        }
      }

      if (!token) {
        // Fallback to searching any cookie that matches the Supabase auth-token pattern
        const supabaseCookieKey = Object.keys(cookies).find(
          key => key.startsWith('sb-') && key.endsWith('-auth-token')
        );
        
        if (supabaseCookieKey) {
          try {
            const cookieVal = JSON.parse(cookies[supabaseCookieKey]);
            token = cookieVal.access_token;
          } catch {
            token = cookies[supabaseCookieKey];
          }
        }
      }

      if (!token) {
        token = cookies['sb-access-token'];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Server configuration error: Supabase env vars missing' });
    }

    // Client with the user's specific token to enforce Row Level Security (RLS)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = user;
    req.supabase = supabase;
    next();
  } catch (error) {
    console.error('Authentication error in middleware:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
