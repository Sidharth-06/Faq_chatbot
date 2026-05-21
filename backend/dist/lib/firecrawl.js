"use strict";
/**
 * Firecrawl API client helper for search and scraping
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectWebSearchIntent = detectWebSearchIntent;
exports.searchWeb = searchWeb;
exports.scrapeWeb = scrapeWeb;
exports.getWebContext = getWebContext;
/**
 * Detects if a user query requires live web search or market research.
 * Matches keywords related to finance, stocks, current news, weather, or real-time comparison.
 */
function detectWebSearchIntent(message) {
    const normalized = message.toLowerCase();
    // High-value search and research intent keywords
    const keywords = [
        'stock', 'invest', 'share price', 'stock price', 'market cap',
        'competitor', 'revenue', 'earnings', 'swot', 'market share',
        'latest price', 'current price', 'weather', 'latest news', 'current news',
        'trends in', 'market research', 'industry trend', 'valuation',
        'financial report', 'dividend', 'etf', 'index fund', 'portfolio',
        'gdp', 'inflation', 'economic', 'weather today', 'vs', 'compare',
        'nvidia', 'nvda', 'apple', 'aapl', 'microsoft', 'msft', 'google', 'goog',
        'tesla', 'tsla', 'amazon', 'amzn', 'meta', 'bitcoin', 'crypto'
    ];
    // Also match typical informational questions starting with "who is the current", "what is the price of", etc.
    const dynamicPatterns = [
        /\bwhat is the (price|value|status|weather) of\b/i,
        /\bcurrent (price|state|status|weather|news)\b/i,
        /\bwho is the current\b/i,
        /\bhow is .* stock performing\b/i,
        /\blatest (update|updates|news|events) on\b/i
    ];
    const hasKeyword = keywords.some(keyword => normalized.includes(keyword));
    const hasPattern = dynamicPatterns.some(pattern => pattern.test(normalized));
    return hasKeyword || hasPattern;
}
/**
 * Execute web search via Firecrawl POST /search
 */
async function searchWeb(query, limit = 3) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
        console.warn('FIRECRAWL_API_KEY is not defined in environment variables.');
        return [];
    }
    try {
        const response = await fetch('https://api.firecrawl.dev/v2/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ query, limit })
        });
        if (!response.ok) {
            console.error(`Firecrawl search failed with status ${response.status}`);
            return [];
        }
        const json = await response.json();
        if (json.success && json.data?.web) {
            return json.data.web.map((item) => ({
                url: item.url || '',
                title: item.title || 'Untitled Source',
                description: item.description || ''
            }));
        }
    }
    catch (error) {
        console.error('Error fetching search results from Firecrawl:', error);
    }
    return [];
}
/**
 * Scrape single page contents into clean markdown via Firecrawl POST /scrape
 */
async function scrapeWeb(url) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
        return null;
    }
    try {
        const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                url,
                formats: ['markdown']
            })
        });
        if (!response.ok) {
            console.error(`Firecrawl scrape failed with status ${response.status} for URL ${url}`);
            return null;
        }
        const json = await response.json();
        if (json.success && json.data?.markdown) {
            return json.data.markdown;
        }
    }
    catch (error) {
        console.error(`Error scraping URL ${url} via Firecrawl:`, error);
    }
    return null;
}
/**
 * Coordinates the full research cycle:
 * 1. Check intent
 * 2. Search web for top results
 * 3. Scrape the top result with a strict timeout
 * 4. Construct aggregate markdown context and citation source list
 */
async function getWebContext(message) {
    if (!detectWebSearchIntent(message)) {
        return null;
    }
    console.log(`[Firecrawl] Search intent detected for: "${message}"`);
    // Step 1: Perform Web Search
    const searchResults = await searchWeb(message, 3);
    if (searchResults.length === 0) {
        console.log('[Firecrawl] Search returned 0 results.');
        return null;
    }
    const sources = searchResults.map(res => ({
        title: res.title,
        url: res.url
    }));
    const topResult = searchResults[0];
    let scrapedMarkdown = null;
    // Step 2: Attempt concurrent scraping of top result with a 3500ms timeout
    console.log(`[Firecrawl] Scraping top search result: ${topResult.url}`);
    const scrapePromise = scrapeWeb(topResult.url);
    let timeoutId;
    const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => {
            console.warn(`[Firecrawl] Scrape request timed out for URL: ${topResult.url}`);
            resolve(null);
        }, 3500);
    });
    try {
        scrapedMarkdown = await Promise.race([scrapePromise, timeoutPromise]);
    }
    catch (error) {
        console.error('[Firecrawl] Scrape race condition failed:', error);
    }
    finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
    // Step 3: Assemble Context
    let contextBlock = `### LIVE WEB RESEARCH CONTEXT\n`;
    contextBlock += `Below is live real-time information fetched from the internet using Firecrawl. Use this data to provide a grounded, accurate, and up-to-date response. Keep in mind that we are currently in May 2026.\n\n`;
    if (scrapedMarkdown) {
        contextBlock += `#### Top Source Markdown Content (From ${topResult.title}):\n`;
        // Truncate to safe limit (approx 8000 characters) to avoid over-inflating context window
        const truncatedMarkdown = scrapedMarkdown.length > 8000
            ? scrapedMarkdown.slice(0, 8000) + '\n... [Content Truncated for Length] ...'
            : scrapedMarkdown;
        contextBlock += `\`\`\`markdown\n${truncatedMarkdown}\n\`\`\`\n\n`;
    }
    else {
        contextBlock += `*Note: Could not scrape full page markdown (timed out or failed). Relying on search snippets instead.*\n\n`;
    }
    contextBlock += `#### All Search Results Retrieved:\n`;
    searchResults.forEach((res, index) => {
        contextBlock += `${index + 1}. **${res.title}**\n`;
        contextBlock += `   - URL: ${res.url}\n`;
        contextBlock += `   - Snippet: ${res.description}\n\n`;
    });
    return {
        context: contextBlock,
        sources
    };
}
