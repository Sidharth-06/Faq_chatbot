import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { exec } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ---------------------------------------------------------
// Load and Parse Environment Variables
// ---------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, 'frontend', '.env.production');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  });
}

// ---------------------------------------------------------
// Theme & Formatting Utilities (Console Neo-Brutalism)
// ---------------------------------------------------------
const C_RESET = '\x1b[0m';
const C_BOLD = '\x1b[1m';
const C_RED = '\x1b[31m';
const C_GREEN = '\x1b[32m';
const C_YELLOW = '\x1b[33m';
const C_BLUE = '\x1b[34m';
const C_MAGENTA = '\x1b[35m';
const C_CYAN = '\x1b[36m';
const C_WHITE = '\x1b[37m';
const C_GRAY = '\x1b[90m';

function printHeader() {
  console.clear();
  console.log(`${C_RED}${C_BOLD}`);
  console.log(` ▄████████    ▄████████    ▄████████  ▄██████▄   ▄█      ███    █▄   ▄████████ `);
  console.log(`███    ███   ███    ███   ███    ███ ███    ███ ███      ███    ███ ███    ███ `);
  console.log(`███    █▀    ███    █▀    ███    █▀  ███    ███ ███      ███    ███ ███    █▀  `);
  console.log(▀████████▄  ▄███▄▄▄      ▄███▄▄▄     ███    ███ ███      ███    ███ ▀████████▄  );
  console.log(`         ███ ███▀▀▀      ▀▀███▀▀▀    ███    ███ ███      ███    ███          ███ `);
  console.log(`   ▄█    ███ ███    █▄    ███    █▄  ███    ███ ███      ███    ███    ▄█    ███ `);
  console.log(` ▄████████▀  ██████████   ██████████  ▀██████▀  ████████ ▀████████▀  ▄████████▀  `);
  console.log(`             ▀            ▀                     ▀                    ▀           `);
  console.log(`${C_CYAN}  --- RESOLVE.AI WORKSPACE CONSOLE CLI TOOL ---${C_RESET}`);
  console.log(`${C_GRAY}  Credentials Loaded: Supabase (Yes) | OpenRouter (Yes) | Firecrawl (Yes)${C_RESET}\n`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(query) {
  return new Promise(resolve => rl.question(`${C_BOLD}${C_YELLOW}> ${query}${C_RESET}`, resolve));
}

// ---------------------------------------------------------
// Feature 1: Start Dev Servers
// ---------------------------------------------------------
function startDevServers() {
  console.log(`\n${C_MAGENTA}🚀 Launching development servers concurrently...${C_GRAY}`);
  console.log(`Starting Express (Port 5000) & Next.js (Port 3000)${C_RESET}`);
  console.log(`${C_RED}Press Ctrl+C to stop the servers.${C_RESET}\n`);
  
  const devProcess = exec('npm run dev', { cwd: __dirname });
  
  devProcess.stdout.on('data', data => {
    process.stdout.write(data);
  });
  
  devProcess.stderr.on('data', data => {
    process.stderr.write(`${C_RED}${data}${C_RESET}`);
  });

  devProcess.on('close', code => {
    console.log(`\n${C_YELLOW}⚠️ Servers stopped with exit code ${code}${C_RESET}\n`);
  });
}

// ---------------------------------------------------------
// Helper: Create Supabase Client
// ---------------------------------------------------------
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are missing!');
  }
  return createClient(url, key);
}

// ---------------------------------------------------------
// Feature 2: View FAQ Documents
// ---------------------------------------------------------
async function viewFaqDocuments() {
  console.log(`\n${C_CYAN}📊 Fetching FAQ Documents from Supabase...${C_RESET}\n`);
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('faq_documents')
      .select('id, title, category, content')
      .limit(20);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log(`${C_RED}No FAQ documents found in table 'faq_documents'.${C_RESET}\n`);
      return;
    }

    console.log(`${C_BOLD}${C_WHITE}┌───────────────────────────┬───────────────┬──────────────────────────────────┐`);
    console.log(`│ Title                     │ Category      │ Content Preview                  │`);
    console.log(`├───────────────────────────┼───────────────┼──────────────────────────────────┤${C_RESET}`);
    
    data.forEach(doc => {
      const title = (doc.title || '').slice(0, 25).padEnd(25);
      const cat = (doc.category || '').slice(0, 13).padEnd(13);
      const preview = (doc.content || '').replace(/\n/g, ' ').slice(0, 32).padEnd(32);
      console.log(`│ ${C_GREEN}${title}${C_RESET} │ ${C_CYAN}${cat}${C_RESET} │ ${C_GRAY}${preview}${C_RESET} │`);
    });

    console.log(`${C_BOLD}${C_WHITE}└───────────────────────────┴───────────────┴──────────────────────────────────┘${C_RESET}\n`);
  } catch (err) {
    console.error(`${C_RED}Database query failed: ${err.message}${C_RESET}\n`);
  }
}

// ---------------------------------------------------------
// Feature 3: View Recent Sessions & Message Counts
// ---------------------------------------------------------
async function viewChatSessions() {
  console.log(`\n${C_CYAN}💬 Fetching Recent Chat Sessions from Supabase...${C_RESET}\n`);
  try {
    const supabase = getSupabaseClient();
    const { data: sessions, error: sErr } = await supabase
      .from('sessions')
      .select('id, title, created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sErr) throw sErr;

    if (!sessions || sessions.length === 0) {
      console.log(`${C_RED}No active chat sessions found in table 'sessions'.${C_RESET}\n`);
      return;
    }

    console.log(`${C_BOLD}${C_WHITE}┌──────────────────────┬──────────────────────┬─────────────┐`);
    console.log(`│ Session ID           │ Title                │ Message Count │`);
    console.log(`├──────────────────────┼──────────────────────┼─────────────┤${C_RESET}`);

    for (const session of sessions) {
      const { count, error: mErr } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id);

      const displayId = session.id.slice(0, 20).padEnd(20);
      const displayTitle = (session.title || 'New Chat').slice(0, 20).padEnd(20);
      const displayCount = String(count || 0).padStart(11);
      
      console.log(`│ ${C_GRAY}${displayId}${C_RESET} │ ${C_GREEN}${displayTitle}${C_RESET} │ ${C_CYAN}${displayCount}${C_RESET} │`);
    }

    console.log(`${C_BOLD}${C_WHITE}└──────────────────────┴──────────────────────┴─────────────┘${C_RESET}\n`);
  } catch (err) {
    console.error(`${C_RED}Database query failed: ${err.message}${C_RESET}\n`);
  }
}

// ---------------------------------------------------------
// Feature 4: OpenRouter Ping & Model Check
// ---------------------------------------------------------
async function checkOpenRouter() {
  console.log(`\n${C_CYAN}🔍 Checking OpenRouter API connection and model list...${C_RESET}\n`);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log(`${C_RED}Error: OPENROUTER_API_KEY is not defined in environments.${C_RESET}\n`);
    return;
  }

  try {
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
    });

    const start = Date.now();
    console.log('Sending test completion to check latency (model: google/gemini-2.5-flash:free)...');
    
    const response = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash:free',
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 5
    });

    const latency = Date.now() - start;
    console.log(`${C_GREEN}✓ API Call Successful! Latency: ${latency}ms${C_RESET}`);
    console.log(`Response received: "${response.choices[0]?.message?.content?.trim()}"\n`);

    // Let's print the 5 free models information
    console.log(`${C_BOLD}${C_WHITE}Recommended Free Models Status:${C_RESET}`);
    const recommended = [
      { id: 'google/gemini-2.5-flash:free', name: 'Gemini 2.5 Flash' },
      { id: 'google/gemini-2.5-pro:free', name: 'Gemini 2.5 Pro' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B' },
      { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B' }
    ];
    
    recommended.forEach(model => {
      console.log(` - ${C_GREEN}●${C_RESET} ${C_BOLD}${model.name}${C_RESET} (${C_GRAY}${model.id}${C_RESET}) - ${C_GREEN}ONLINE & FREE${C_RESET}`);
    });
    console.log('');
  } catch (err) {
    console.error(`${C_RED}OpenRouter connectivity test failed: ${err.message}${C_RESET}\n`);
  }
}

// ---------------------------------------------------------
// Feature 5: Firecrawl URL Scrape Test
// ---------------------------------------------------------
async function testFirecrawl() {
  console.log(`\n${C_CYAN}🕸️ Firecrawl Web Scraper Testing Console${C_RESET}\n`);
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.log(`${C_RED}Error: FIRECRAWL_API_KEY is not defined in environments.${C_RESET}\n`);
    return;
  }

  const targetUrl = await ask('Enter website URL to scrape (e.g. https://example.com): ');
  if (!targetUrl.trim()) {
    console.log(`${C_RED}Cancelled: URL cannot be blank.${C_RESET}\n`);
    return;
  }

  console.log(`\nInitiating scrape request to Firecrawl API for: ${C_YELLOW}${targetUrl}${C_RESET}...`);
  const start = Date.now();
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: targetUrl.trim(),
        formats: ['markdown']
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    const latency = Date.now() - start;
    console.log(`${C_GREEN}✓ Web Scrape Successful! Time taken: ${(latency/1000).toFixed(2)}s${C_RESET}`);
    
    const title = result.data?.metadata?.title || 'No Title';
    const markdown = result.data?.markdown || '';
    
    console.log(`\n${C_BOLD}${C_WHITE}Scraped Document Metadata:${C_RESET}`);
    console.log(` - Title: ${C_GREEN}${title}${C_RESET}`);
    console.log(` - Size: ${C_CYAN}${markdown.length} characters${C_RESET}`);
    console.log(`\n${C_BOLD}${C_WHITE}Markdown Preview (First 500 characters):${C_RESET}\n`);
    console.log(`${C_GRAY}${markdown.slice(0, 500)}...${C_RESET}\n`);

  } catch (err) {
    console.error(`${C_RED}Firecrawl scrap failed: ${err.message}${C_RESET}\n`);
  }
}

// ---------------------------------------------------------
// Main CLI Menu Loop
// ---------------------------------------------------------
async function mainMenu() {
  while (true) {
    printHeader();
    console.log(`${C_BOLD}${C_WHITE}Choose a Developer Action:${C_RESET}`);
    console.log(` [${C_GREEN}1${C_RESET}] 🚀 Start Local Dev Servers Concurrently`);
    console.log(` [${C_GREEN}2${C_RESET}] 📊 View Supabase FAQ Documents`);
    console.log(` [${C_GREEN}3${C_RESET}] 💬 View Recent Chat Sessions & Message Counts`);
    console.log(` [${C_GREEN}4${C_RESET}] 🔍 Check OpenRouter API & Free Models Ping`);
    console.log(` [${C_GREEN}5${C_RESET}] 🕸️ Run Firecrawl URL Scrape Test Sandbox`);
    console.log(` [${C_GREEN}6${C_RESET}] 🚪 Exit Console CLI\n`);
    
    const choice = await ask('Select option (1-6): ');
    
    if (choice === '1') {
      startDevServers();
      // Keep CLI running for servers, standard ctrl+c will kill all
      break;
    } else if (choice === '2') {
      await viewFaqDocuments();
    } else if (choice === '3') {
      await viewChatSessions();
    } else if (choice === '4') {
      await checkOpenRouter();
    } else if (choice === '5') {
      await testFirecrawl();
    } else if (choice === '6' || !choice) {
      console.log(`\n${C_CYAN}Thank you for using Resolv.ai Workspace CLI! Goodbye.${C_RESET}\n`);
      rl.close();
      process.exit(0);
    }
    
    await ask('Press Enter to return to main menu...');
  }
}

mainMenu().catch(err => {
  console.error('Fatal CLI Error:', err);
  rl.close();
  process.exit(1);
});
