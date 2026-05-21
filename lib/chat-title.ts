/**
 * Generate a concise chat title from the first user message
 * Extracts first 50 chars or first sentence, whichever is shorter
 */
export function generateChatTitle(userMessage: string): string {
  if (!userMessage || userMessage.trim().length === 0) {
    return 'New Chat';
  }

  // Remove any markdown or special formatting
  const cleaned = userMessage
    .replace(/[*_~`\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  // Find first sentence (ends with . ! ?)
  const firstSentenceMatch = cleaned.match(/^[^.!?]*[.!?]/);
  const firstSentence = firstSentenceMatch ? firstSentenceMatch[0] : cleaned;

  // Limit to 50 characters max, or first sentence
  const title = firstSentence.substring(0, 50).trim();

  // Remove trailing punctuation if too short
  return title.replace(/[.!?]+$/, '').trim() || 'New Chat';
}

/**
 * Update session title in the database
 */
export async function updateSessionTitle(
  sessionId: string,
  title: string,
  supabase: any
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ title })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session title:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to update session title:', err);
    return false;
  }
}
