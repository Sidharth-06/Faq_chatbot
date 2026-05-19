# 🚀 FAQ Chatbot - Quick Reference

## Project Location
```
E:\faq-chatbot
```

## 📊 Project Status
✅ **Phase 1 Complete** - Next.js + Auth Setup  
⏳ **Phase 2 Ready** - Supabase Configuration

## 🔧 Quick Start Commands

### Development
```bash
cd E:\faq-chatbot
npm run dev
# Open http://localhost:3000
```

### Build
```bash
npm run build
```

### Essential Setup Steps (REQUIRED)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project

2. **Get API Keys**
   - Copy Project URL
   - Copy anon key
   - Create OpenRouter key at https://openrouter.ai

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   OPENROUTER_API_KEY=your-api-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run Database Schema**
   - Copy `schema/init.sql` to Supabase SQL Editor
   - Execute

5. **Start Development**
   ```bash
   npm run dev
   ```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/(auth)/login/page.tsx` | Login page |
| `app/(auth)/signup/page.tsx` | Signup page |
| `app/(dashboard)/chat/[sessionId]/page.tsx` | Main chat page |
| `app/api/chat/route.ts` | OpenRouter integration |
| `app/api/sessions/route.ts` | Session CRUD |
| `components/ChatWindow.tsx` | Message display |
| `components/Sidebar.tsx` | Session list |
| `lib/supabase-client.ts` | Supabase client |
| `schema/init.sql` | Database schema |
| `.env.local` | Environment variables |

## 🎯 Project Structure

```
Components:
  ├── Navbar - Top nav with logout
  ├── Sidebar - Session list + new chat
  ├── ChatWindow - Message display area
  ├── ChatMessage - Individual message
  └── MessageInput - Message input box

Pages:
  ├── /login - Authentication
  ├── /signup - Registration
  ├── /chat - Session selection
  └── /chat/[sessionId] - Active chat

API Routes:
  ├── /api/auth/callback - OAuth
  ├── /api/chat - Send message (OpenRouter)
  └── /api/sessions - Manage sessions
```

## 💾 Database Schema

**Tables:**
- `sessions` - Chat sessions (user_id, title, created_at)
- `messages` - Chat messages (session_id, role, content, tokens)
- `faq_documents` - Optional knowledge base

**RLS Policies:**
- Users can only see their own sessions
- Users can only see messages from their sessions
- FAQs visible to everyone

## 🔐 Authentication Flow

```
Sign Up/Login → Supabase Auth
  → JWT Token
  → Redirect to /chat
  → Protected Routes
```

## 💬 Chat Flow

```
User Input → Save to DB
  → Fetch Context (last 10 messages)
  → Call OpenRouter API
  → Stream Response
  → Save Assistant Message
  → Real-time Update
```

## 🛠 Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| LLM | OpenRouter (multi-model) |
| Icons | lucide-react |
| Notifications | react-hot-toast |
| Real-time | Supabase Realtime |

## 📝 Environment Variables

Create `.env.local` in root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
OPENROUTER_API_KEY=your_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ✨ Current Features

✅ User authentication (signup/login)  
✅ Beautiful chat UI with animations  
✅ Session management (create/delete)  
✅ Message persistence  
✅ Real-time message updates  
✅ Responsive design (mobile-first)  
✅ Message input with auto-resize  
✅ Protected routes  
✅ Toast notifications  
✅ OpenRouter API integration  

## 🎨 UI Features

- **Modern Design** - Gradient backgrounds, smooth animations
- **Responsive** - Works on mobile, tablet, desktop
- **Dark Sidebar** - Easy on the eyes
- **Message Bubbles** - User vs Assistant differentiation
- **Loading States** - Spinner feedback
- **Toast Notifications** - Success/error messages

## 📊 Next Phase Tasks

- [ ] Configure Supabase
- [ ] Test authentication
- [ ] Add message streaming
- [ ] Implement chat history search
- [ ] Add conversation context memory
- [ ] Build settings page
- [ ] Deploy to Vercel
- [ ] Add analytics
- [ ] Create admin dashboard

## 🚀 Deployment Ready

To deploy to Vercel:
```bash
git push origin main
# Connect to Vercel from dashboard
# Add environment variables in Vercel settings
```

## 📞 Support

- Check `SETUP.md` for detailed setup
- Check `.env.local` configuration
- Verify Supabase project is created
- Ensure OpenRouter key is valid

---

**Created:** May 19, 2026  
**Status:** Ready for Supabase Configuration  
**Next:** Follow SETUP.md steps
