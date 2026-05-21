"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/sessions
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const supabase = req.supabase;
        const user = req.user;
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .order('updated_at', { ascending: false });
        if (error)
            throw error;
        return res.json(sessions);
    }
    catch (error) {
        console.error('Sessions GET error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// POST /api/sessions
router.post('/', auth_1.requireAuth, async (req, res) => {
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
        if (error)
            throw error;
        return res.status(201).json(session);
    }
    catch (error) {
        console.error('Sessions POST error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
exports.default = router;
