# Resolv.ai - FAQ Chatbot

A modern, intelligent FAQ chatbot built with Next.js, React, and AI-powered responses. Resolv.ai provides instant, contextually-aware answers with beautiful markdown rendering, real-time chat management, and enterprise-grade reliability.

## ✨ Features

### Core Functionality
- **AI-Powered Responses**: Leverages OpenRouter API for intelligent, context-aware answers
- **Dynamic Chat Titles**: Automatically generates meaningful conversation titles from user messages
- **Real-time Sidebar Updates**: Conversations update instantly across all tabs using Supabase real-time subscriptions
- **Persistent Chat History**: All conversations are saved to the database with full message context
- **Multi-model Support**: Switch between different AI models (stored in localStorage for user preference)

### Smart Context Management
- **Message Assembly Pattern**: Guarantees correct message ordering (system → chronological history → current message) to prevent outdated responses
- **Reasoning Details Extraction**: Automatically extracts and cleans AI reasoning metadata from responses
- **Context Normalization**: Normalizes message content for optimal LLM processing
- **Race Condition Prevention**: Explicit message ordering prevents database sync timing issues

### Advanced Rendering
- **Syntax Highlighting**: Code blocks with beautiful atom-one-dark theme via highlight.js
- **Math Support**: Inline and display math equations rendered with KaTeX
- **Diagrams**: Mermaid diagrams for flowcharts, sequence diagrams, and more
- **Markdown Features**: Tables, lists, blockquotes, and all standard markdown elements
- **Responsive Design**: Beautiful dark UI with Tailwind CSS

### Reliability & Performance
- **Exponential Backoff Retry Logic**: Automatic retries for rate-limited requests (429 errors)
- **Status-Specific Error Handling**: Different handling for 429 (rate limited), 401 (auth), and 5xx (server) errors
- **Streaming Responses**: Real-time message streaming for responsive UX
- **Optimistic UI Updates**: User messages appear instantly before server confirmation

### Authentication & Security
- **Supabase Auth**: Email/password authentication with secure session management
- **Protected Routes**: Dashboard and chat routes require authentication
- **Server-side Validation**: All API endpoints validate user context

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 16.2.6 (with Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- React Hot Toast (notifications)

**Backend:**
- Next.js API Routes
- Node.js 20+
- Express middleware patterns

**Database & Auth:**
- Supabase (PostgreSQL + Auth)
- Real-time subscriptions
- RLS (Row Level Security)

**AI & Rendering:**
- OpenRouter API
- React Markdown with plugins
- rehype-highlight + highlight.js (code syntax)
- remark-math + rehype-katex (math equations)
- Mermaid (diagrams)

### Project Structure

```
faq-chatbot/
├── app/
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── (dashboard)/         # Dashboard layout
│   │   ├── chat/
│   │   │   ├── [sessionId]/ # Chat page for specific conversation
│   │   │   └── page.tsx     # Chat list
│   │   ├── settings/        # User settings
│   │   └── layout.tsx       # Dashboard layout with sidebar
│   ├── api/
│   │   ├── chat/route.ts    # Chat message handler (core logic)
│   │   ├── sessions/        # Session management
│   │   └── auth/            # Auth callbacks
│   ├── globals.css          # Global styles (syntax highlighting, math, etc.)
│   └── layout.tsx           # Root layout
├── components/
│   ├── ChatMessage.tsx      # Individual message component (renders markdown)
│   ├── ChatWindow.tsx       # Chat message container
│   ├── MessageInput.tsx     # Message input with model selector
│   ├── Sidebar.tsx          # Navigation sidebar with sessions
│   ├── Navbar.tsx           # Top navigation
│   ├── Mermaid.tsx          # Diagram rendering wrapper
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── conversation-context.ts  # Message assembly pattern (core logic)
│   ├── chat-title.ts            # Title generation utilities
│   ├── supabase-client.ts       # Client-side Supabase config
│   ├── supabase-server.ts       # Server-side Supabase config
│   ├── types.ts                 # TypeScript interfaces
│   └── utils.ts                 # Utility functions
├── __tests__/
│   └── conversation-context.test.ts  # Comprehensive test suite
└── schema/
    └── init.sql             # Database schema
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account (free tier available)
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sidharth-06/Faq_chatbot.git
   cd Faq_chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the project root:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # OpenRouter API
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

   # Next.js
   NODE_ENV=development
   ```

4. **Set up the database**
   
   a. Create a new Supabase project
   
   b. Run the schema initialization:
   ```bash
   # Use Supabase SQL editor to run schema/init.sql
   ```
   
   c. Enable real-time notifications on tables:
   - Go to Supabase Dashboard → Replication
   - Enable for `public.sessions` and `public.messages`

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 📖 Usage

### Create an Account
1. Visit the signup page at `/signup`
2. Enter email and password
3. Confirm your email (check spam folder)

### Start Chatting
1. Login to your account
2. Click "New Chat Session" to start a conversation
3. Type your question or request
4. Wait for the AI response with beautiful rendering

### Manage Conversations
- **View History**: All chats appear in the left sidebar with dynamic titles
- **Switch Chats**: Click any conversation to view or continue it
- **Delete Chats**: Click the trash icon to remove a conversation
- **Multiple Models**: Select different AI models from the model dropdown

### Settings
- Access user settings from the account menu (top right)
- View current AI model selection
- Access logout functionality

## 🔑 Key Components Explained

### Message Assembly Pattern (`lib/conversation-context.ts`)

The heart of reliable context management. This pattern ensures:

1. **Chronological Ordering**: Messages are sorted by `created_at`
2. **Explicit Current Message**: The current user message is always added last
3. **System Message First**: System context always goes first
4. **Race Condition Prevention**: Database sync timing doesn't affect message order

```typescript
// Guaranteed order: System → History → Current
const messages = assembleConversation(systemPrompt, history, currentMessage);
```

### Chat Title Generation (`lib/chat-title.ts`)

Automatically generates meaningful titles:

- Extracts first sentence or first 50 characters (whichever is shorter)
- Removes markdown formatting and extra whitespace
- Falls back to "New Chat" if message is empty
- Triggers on first message in a conversation

```typescript
generateChatTitle("What's the best way to learn React?")
// → "What's the best way to learn React"
```

### Real-time Updates

The sidebar subscribes to Supabase real-time events:

```typescript
// Sidebar automatically updates when sessions change
supabase
  .channel('sessions_changes')
  .on('postgres_changes', { event: 'UPDATE', table: 'sessions' }, (payload) => {
    setSessions(prev => 
      prev.map(s => s.id === payload.new.id ? payload.new : s)
    );
  })
  .subscribe();
```

### Chat Message Rendering (`components/ChatMessage.tsx`)

Enhanced markdown rendering with multiple plugins:

- **Code Syntax Highlighting**: Automatic language detection and styling
- **Math Equations**: KaTeX for beautiful mathematical notation
- **Diagrams**: Mermaid for flowcharts, sequence diagrams, etc.
- **Tables**: Styled with Tailwind for responsive display
- **Blockquotes & Lists**: Semantic HTML with consistent styling

## 🔄 API Routes

### POST `/api/chat`
Sends a message and receives an AI response.

**Request:**
```json
{
  "session_id": "uuid",
  "message": "Your question here",
  "model": "openai/gpt-4-turbo" // optional, uses default if not provided
}
```

**Response:** Server-sent events (SSE) stream of response chunks

**Features:**
- Exponential backoff retry for rate limits (up to 3 attempts)
- Automatic message persistence to database
- Real-time streaming for responsive UX
- Error handling with user-friendly messages

### GET/POST `/api/sessions`
Manages chat sessions.

**GET:** Fetch all sessions for the current user
**POST:** Create a new session

## 🗄️ Database Schema

### `sessions` table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- title (text) - Dynamic title generated from first message
- created_at (timestamp)
- updated_at (timestamp)
```

### `messages` table
```sql
- id (uuid, primary key)
- session_id (uuid, foreign key to sessions)
- user_id (uuid, foreign key to auth.users)
- role (enum: 'user' | 'assistant') - Who sent the message
- content (text) - Message content (may include HTML reasoning metadata)
- tokens_used (integer) - Token count from OpenRouter
- created_at (timestamp)
```

## 🛡️ Error Handling

### Rate Limiting (429)
- Automatic retry with exponential backoff: 1s → 2s → 4s
- Added jitter (±10%) to prevent thundering herd
- Friendly user message: "Rate limited by provider. Please wait a moment and try again."

### Authentication (401)
- User redirected to login
- Error message shown in chat
- Session cleared for security

### Server Errors (5xx)
- Automatic retry with exponential backoff
- User notified if all retries fail
- Error logged for debugging

### Client Errors (4xx)
- Fast fail (no retries for non-recoverable errors)
- Descriptive error messages shown to user

## 🧪 Testing

Run the test suite:
```bash
npm test
```

The test suite includes:
- Message assembly pattern validation
- Context normalization verification
- Title generation edge cases
- Chronological ordering tests
- Race condition prevention tests

## 📦 Dependencies

### Core
- `next`: 16.2.6 - React framework with SSR
- `react`: ^19 - UI library
- `typescript`: Latest - Type safety

### Styling & UI
- `tailwindcss`: ^3 - Utility-first CSS
- `shadcn/ui`: Latest - Component library
- `lucide-react`: ^0.x - Icon library

### Markdown & Rendering
- `react-markdown`: ^9 - Markdown parser
- `remark-gfm`: ^4 - GitHub-flavored markdown
- `remark-math`: ^6 - Math support
- `rehype-highlight`: ^7 - Syntax highlighting
- `rehype-katex`: ^7 - Math rendering
- `highlight.js`: ^11 - Highlighting engine
- `mermaid`: ^10 - Diagram rendering

### Data & Auth
- `@supabase/supabase-js`: Latest - Database & auth client
- `react-hot-toast`: ^2 - Notifications

## 🚦 Running the App

**Development:**
```bash
npm run dev
```
Opens at `http://localhost:3000` with hot reload

**Production Build:**
```bash
npm run build
npm run start
```

**Linting:**
```bash
npm run lint
```

**Type Checking:**
```bash
npx tsc --noEmit
```

## 🔐 Environment Variables

All required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJh...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) | `eyJh...` |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI | `sk-or-...` |
| `OPENROUTER_BASE_URL` | OpenRouter API endpoint | `https://openrouter.ai/api/v1` |
| `NODE_ENV` | Environment | `development` or `production` |

## 🎨 Customization

### Change AI Model
Edit the default model in the UI or store preference in localStorage:
```typescript
localStorage.setItem('resolv_selected_model', 'openai/gpt-4-turbo');
```

### Modify System Prompt
Update the system prompt in `app/api/chat/route.ts`:
```typescript
const systemPrompt = `You are Resolv.ai, an intelligent FAQ assistant...`;
```

### Styling
- Global styles: `app/globals.css`
- Component styles: Use Tailwind classes in JSX
- Dark theme configured in `tailwind.config.ts`

### Markdown Rendering
Modify markdown plugins in `components/ChatMessage.tsx`:
```typescript
<ReactMarkdown
  plugins={[
    remarkGfm,
    remarkMath,
    [rehypeHighlight, { detect: true }],
    rehypeKatex,
  ]}
>
  {content}
</ReactMarkdown>
```

## 🐛 Troubleshooting

### "Failed to send message" error
- Check OpenRouter API key is valid
- Verify rate limiting (wait a moment and retry)
- Check browser console for detailed errors

### Chat history not loading
- Verify Supabase connection
- Check database tables exist (run schema/init.sql)
- Verify row-level security policies

### Real-time updates not working
- Check Supabase replication enabled for tables
- Verify user is authenticated
- Check browser console for websocket errors

### Markdown not rendering correctly
- Verify all rendering packages are installed: `npm install`
- Check `globals.css` has syntax highlighting styles
- Verify mermaid is properly initialized

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenRouter API](https://openrouter.ai/docs)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

For questions or suggestions, please open an issue on GitHub or reach out to the maintainers.

---

**Made with ❤️ by the Resolv.ai team**
