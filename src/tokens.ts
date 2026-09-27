/**
 * Token counter and budget manager for AI LLM prompts.
 */

/**
 * Estimate the token count of a given string using standard BPE character/word heuristics (~4 chars/token).
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.length === 0) return 0;
  // BPE heuristic: 1 token is roughly 4 characters or ~0.75 words.
  const charEstimate = text.length / 4;
  const wordCount = text.trim().split(/\s+/).length;
  const wordEstimate = wordCount * 1.3;
  return Math.ceil((charEstimate + wordEstimate) / 2);
}

/**
 * Truncate a text string to stay within a maximum token budget, terminating on line boundaries.
 */
export function truncateToTokenBudget(text: string, maxTokens: number): { text: string; truncated: boolean; tokens: number } {
  const currentTokens = estimateTokenCount(text);
  if (currentTokens <= maxTokens) {
    return { text, truncated: false, tokens: currentTokens };
  }

  const lines = text.split('\n');
  let accumulated = '';
  let count = 0;

  for (const line of lines) {
    const candidate = accumulated ? accumulated + '\n' + line : line;
    const candidateTokens = estimateTokenCount(candidate);
    if (candidateTokens > maxTokens) {
      break;
    }
    accumulated = candidate;
    count = candidateTokens;
  }

  const suffix = '\n/* ... [Truncated due to token budget limit] ... */';
  return {
    text: accumulated ? accumulated + suffix : suffix,
    truncated: true,
    tokens: count + estimateTokenCount(suffix),
  };
}
