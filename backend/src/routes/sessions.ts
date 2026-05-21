import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/sessions
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = req.supabase;
    const user = req.user;

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return res.json(sessions);
  } catch (error: any) {
    console.error('Sessions GET error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/sessions
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = req.supabase;
    const user = req.user;
    const { title = 'New Chat' } = req.body;

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        title,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(session);
  } catch (error: any) {
    console.error('Sessions POST error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
