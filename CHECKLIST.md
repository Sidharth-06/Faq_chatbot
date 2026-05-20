# 📋 Setup Checklist - FAQ Chatbot

## ✅ Phase 1: Development Environment (COMPLETE)
- [x] Initialize Next.js 15 project
- [x] Configure TypeScript and Tailwind CSS
- [x] Install core dependencies
- [x] Set up project structure
- [x] Create authentication pages
- [x] Create chat interface components
- [x] Create API routes
- [x] Set up Supabase integration files
- [x] Create database schema
- [x] Write documentation

**Status:** ✅ Ready for Phase 2

---

## ⏳ Phase 2: Supabase Setup (NEXT)

### 2.1 Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Click "New Project"
- [ ] Fill in project name
- [ ] Create strong database password
- [ ] Select region closest to you
- [ ] Wait for initialization (1-2 minutes)

### 2.2 Get API Credentials
- [ ] Navigate to **Settings > API** in Supabase dashboard
- [ ] Copy **Project URL**
- [ ] Copy **anon** (public) key
- [ ] Keep these safe (don't commit to git)

### 2.3 Create OpenRouter API Key
- [ ] Go to [openrouter.ai](https://openrouter.ai)
- [ ] Sign up or log in
- [ ] Navigate to **Dashboard > Keys**
- [ ] Create new API key
- [ ] Copy the key

### 2.4 Configure Environment Variables
- [ ] Open `E:\faq-chatbot\.env.local`
- [ ] Replace `your_supabase_url_here` with actual Project URL
- [ ] Replace `your_supabase_anon_key_here` with actual anon key
- [ ] Replace `your_openrouter_api_key_here` with API key
- [ ] **DO NOT COMMIT** `.env.local` to git

```env
# Example (use your actual values):
NEXT_PUBLIC_SUPABASE_URL=https://abcxyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.5 Initialize Database Schema
- [ ] Log into Supabase dashboard
- [ ] Go to **SQL Editor** (left sidebar)
- [ ] Click **New Query**
- [ ] Open `E:\faq-chatbot\schema\init.sql`
- [ ] Copy entire contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click **Run**
- [ ] Verify: Should see "Success" messages

**Expected tables created:**
- [ ] `sessions` table
- [ ] `messages` table
- [ ] RLS policies enabled

### 2.6 Verify Database Setup
- [ ] In Supabase, go to **Table Editor**
- [ ] Verify `sessions` table exists and is empty
- [ ] Verify `messages` table exists and is empty
- [ ] Go to **Authentication** tab
- [ ] Note the Auth URL (you'll need it for testing)

---

## 🚀 Phase 3: Local Testing (AFTER SUPABASE SETUP)

### 3.1 Start Development Server
- [ ] Open PowerShell/Terminal
- [ ] Navigate to: `cd E:\faq-chatbot`
- [ ] Run: `npm run dev`
- [ ] Wait for message: "Ready in Xs"
- [ ] Open [http://localhost:3000](http://localhost:3000) in browser

### 3.2 Test Authentication
- [ ] Click **Sign Up**
- [ ] Enter test email: `test@example.com`
- [ ] Enter password: `TestPassword123!`
- [ ] Confirm password
- [ ] Click **Sign Up**
- [ ] Should see success message or redirect

### 3.3 Test Login
- [ ] Click **Sign In**
- [ ] Enter email: `test@example.com`
- [ ] Enter password: `TestPassword123!`
- [ ] Click **Sign In**
- [ ] Should be redirected to chat page

### 3.4 Test Chat Features
- [ ] Click **New Chat** button
- [ ] Should see new session in sidebar
- [ ] See message like: "Select a chat or create a new one"
- [ ] Click on the new chat in sidebar
- [ ] Type: "Hello, what is your name?"
- [ ] Click Send (or press Enter)
- [ ] Wait for response from OpenRouter

### 3.5 Test Session Management
- [ ] Create 2-3 different chats
- [ ] Switch between chats in sidebar
- [ ] Verify messages persist when switching
- [ ] Hover over a session and click delete icon
- [ ] Confirm deletion
- [ ] Verify session removed

### 3.6 Test Real-time Updates (Optional)
- [ ] Open same chat in 2 browser tabs
- [ ] Send message in Tab 1
- [ ] Verify message appears in Tab 2 automatically
- [ ] Refresh Tab 2 to confirm persistence

---

## 🔍 Debugging Checklist

If something doesn't work:

### Environment Variables Not Loaded
- [ ] Verify `.env.local` is in project root (`E:\faq-chatbot\.env.local`)
- [ ] Check all values are filled in (no "your_xxx_here" placeholders)
- [ ] Restart dev server: `Ctrl+C` then `npm run dev`
- [ ] Check browser console for errors

### Supabase Connection Failed
- [ ] Verify Supabase project is created
- [ ] Check Project URL format: `https://xxxxx.supabase.co`
- [ ] Verify anon key is not empty
- [ ] Test connection in Supabase dashboard
- [ ] Check network tab in browser dev tools

### OpenRouter API Errors
- [ ] Verify API key is valid and not expired
- [ ] Check OpenRouter account has available credits
- [ ] Review OpenRouter API logs
- [ ] Try a different model if current one fails
- [ ] Check rate limiting (max 10 requests/min free tier)

### Authentication Not Working
- [ ] Verify RLS policies are enabled
- [ ] Check Supabase Auth settings
- [ ] Verify email configuration in Supabase
- [ ] Check browser cookies are enabled
- [ ] Clear cache and cookies

### Messages Not Saving
- [ ] Verify `messages` table exists in Supabase
- [ ] Check RLS policies for `messages` table
- [ ] Look for errors in browser console
- [ ] Check Supabase logs
- [ ] Verify user is authenticated

### Real-time Updates Not Working
- [ ] Enable Supabase Realtime in Settings
- [ ] Verify `messages` table has realtime enabled
- [ ] Check browser WebSocket connection
- [ ] Look for CORS errors in console
- [ ] Restart dev server

---

## 📊 Database Verification Checklist

After running schema:

### Sessions Table
- [ ] Column `id` exists (UUID, primary key)
- [ ] Column `user_id` exists (UUID, foreign key)
- [ ] Column `title` exists (TEXT)
- [ ] Column `created_at` exists (TIMESTAMP)
- [ ] Column `updated_at` exists (TIMESTAMP)
- [ ] Column `is_deleted` exists (BOOLEAN)
- [ ] Index on `user_id` exists
- [ ] Index on `created_at` exists
- [ ] RLS is enabled
- [ ] 4 RLS policies exist (SELECT, INSERT, UPDATE, DELETE)

### Messages Table
- [ ] Column `id` exists (UUID, primary key)
- [ ] Column `session_id` exists (UUID, foreign key)
- [ ] Column `user_id` exists (UUID, foreign key)
- [ ] Column `role` exists (TEXT, CHECK constraint)
- [ ] Column `content` exists (TEXT)
- [ ] Column `tokens_used` exists (INTEGER)
- [ ] Column `created_at` exists (TIMESTAMP)
- [ ] Index on `session_id` exists
- [ ] Index on `user_id` exists
- [ ] Index on `created_at` exists
- [ ] RLS is enabled
- [ ] 2 RLS policies exist (SELECT, INSERT)

### FAQ Documents Table
- [ ] Column `id` exists (UUID, primary key)
- [ ] Column `title` exists (TEXT)
- [ ] Column `content` exists (TEXT)
- [ ] Column `category` exists (TEXT)
- [ ] Column `created_at` exists (TIMESTAMP)
- [ ] Column `updated_at` exists (TIMESTAMP)
- [ ] RLS is enabled
- [ ] 1 RLS policy exists (SELECT for all)

---

## 🎯 Success Criteria

### Authentication ✅ when:
- [ ] Can sign up with valid email
- [ ] Can log in with credentials
- [ ] Can log out successfully
- [ ] Protected routes require authentication
- [ ] JWT token stored in browser

### Chat ✅ when:
- [ ] Can create new chat session
- [ ] Can send message
- [ ] Receive response from OpenRouter
- [ ] Message appears in real-time
- [ ] Message persists in database

### Sessions ✅ when:
- [ ] Can create multiple sessions
- [ ] Can switch between sessions
- [ ] Can see session history
- [ ] Can delete sessions
- [ ] Messages isolated per session

### Database ✅ when:
- [ ] All tables created
- [ ] All indexes created
- [ ] All RLS policies working
- [ ] Data persists across restarts
- [ ] Real-time updates working

---

## 📝 Notes

**Important Reminders:**
- Never commit `.env.local` to git
- Keep OpenRouter API key secret
- Don't share Supabase anon key publicly
- Use strong passwords for Supabase project
- Monitor OpenRouter API usage and costs

**Useful Commands:**
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type check
npm run type-check

# View git log
git log --oneline

# Create a new branch
git checkout -b feature/your-feature-name
```

---

## ✅ Final Verification

Before considering setup complete:

- [ ] `npm run dev` runs without errors
- [ ] [http://localhost:3000](http://localhost:3000) loads
- [ ] Can complete full signup → chat → message → logout flow
- [ ] Can see messages in Supabase Table Editor
- [ ] No sensitive data in git history
- [ ] `.env.local` is in `.gitignore`
- [ ] All documentation reviewed

---

## 🎉 You're Ready!

Once all checkboxes are complete, your FAQ chatbot is ready for:
- [ ] Testing and feedback
- [ ] Additional features (Phase 3+)
- [ ] Deployment to Vercel
- [ ] User testing with real team
- [ ] Production deployment

**Next Steps:**
1. Follow this checklist
2. Come back when you hit any issues
3. Proceed to Phase 3 features
4. Deploy to Vercel

---

**Created:** May 19, 2026  
**Status:** Ready for User Setup  
**Questions?** Review SETUP.md and QUICK_REF.md
