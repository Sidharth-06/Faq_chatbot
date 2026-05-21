"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assembleConversation = assembleConversation;
exports.buildOpenAIMessages = buildOpenAIMessages;
/**
 * Normalize a message from the database into OpenAI-compatible format
 * Handles reasoning_details extraction and content cleaning
 */
function normalizeMessage(message) {
    const contentStr = message.content;
    // Search for HTML comment block containing reasoning details
    const reasoningMatch = contentStr.match(/<!-- REASONING_DETAILS:\n([\s\S]*?)\n-->/);
    const cleanContent = contentStr
        .replace(/^\[(KB|GEN)\]\s*/, '')
        .replace(/<!-- REASONING_DETAILS:\n[\s\S]*?\n-->/, '')
        .trim();
    const msgObj = {
        role: message.role,
        content: cleanContent,
    };
    if (message.role === 'assistant' && reasoningMatch) {
        try {
            msgObj.reasoning_details = JSON.parse(reasoningMatch[1]);
        }
        catch (e) {
            console.error('Failed to parse reasoning_details from history:', e);
        }
    }
    return msgObj;
}
/**
 * Assemble a complete conversation from system instruction, history, and current query
 * Ensures chronological order and always places current message last
 */
function assembleConversation(systemInstruction, history, currentUserMessage) {
    // Sort history by creation time (ascending) to maintain chronological order
    const sorted = [...history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return {
        system: systemInstruction,
        history: sorted.map(normalizeMessage),
        current: { role: 'user', content: currentUserMessage },
    };
}
/**
 * Build the final message array for OpenAI API
 * Structure: [system, ...history, current]
 * This guarantees the current query is always the last user message
 */
function buildOpenAIMessages(assembled) {
    return [
        { role: 'system', content: assembled.system },
        ...assembled.history,
        assembled.current,
    ];
}
