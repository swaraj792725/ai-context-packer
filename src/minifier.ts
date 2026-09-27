import { estimateTokenCount } from './tokens.js';

export interface MinifyOptions {
  /** Remove inline and block comments */
  removeComments?: boolean;
  /** Collapse consecutive blank lines */
  collapseBlankLines?: boolean;
  /** Trim trailing whitespace */
  trimWhitespace?: boolean;
  /** Normalize indentation (e.g., 4 spaces -> 2 spaces) */
  normalizeIndent?: boolean;
}

export interface MinifyResult {
  code: string;
  originalTokens: number;
  minifiedTokens: number;
  savedTokens: number;
  savingsPercentage: number;
}

/**
 * Minify source code specifically for LLM context prompts to reduce token count by 20-40%.
 */
export function minifyCode(code: string, filenameOrLang?: string, opts: MinifyOptions = {}): MinifyResult {
  const {
    removeComments = true,
    collapseBlankLines = true,
    trimWhitespace = true,
    normalizeIndent = true,
  } = opts;

  const originalTokens = estimateTokenCount(code);
  let processed = code;

  const lang = (filenameOrLang || '').toLowerCase();
  const isPython = lang.endsWith('.py') || lang === 'python' || lang === 'py';
  const isHtml = lang.endsWith('.html') || lang.endsWith('.vue') || lang.endsWith('.svelte') || lang === 'html';
  const isShell = lang.endsWith('.sh') || lang.endsWith('.yml') || lang.endsWith('.yaml') || lang === 'yaml' || lang === 'sh';

  if (removeComments) {
    if (isPython || isShell) {
      // Remove Python/Shell single-line comments (# ...)
      processed = processed.replace(/^[ \t]*#.*$/gm, '');
    } else if (isHtml) {
      // Remove HTML comments (<!-- ... -->)
      processed = processed.replace(/<!--[\s\S]*?-->/g, '');
    } else {
      // JS/TS/C-style comments
      // Block comments /* ... */
      processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');
      // Single-line comments // ...
      processed = processed.replace(/^[ \t]*\/\/.*/gm, '');
    }
  }

  if (normalizeIndent) {
    // Convert 4 spaces to 2 spaces for token efficiency
    processed = processed.replace(/^([ \t]+)/gm, (match) => {
      const spaces = match.replace(/\t/g, '  ');
      const depth = Math.floor(spaces.length / 4);
      const remainder = spaces.length % 4;
      return '  '.repeat(depth) + ' '.repeat(remainder);
    });
  }

  if (trimWhitespace) {
    processed = processed
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');
  }

  if (collapseBlankLines) {
    // Replace 2+ consecutive blank lines with a single blank line
    processed = processed.replace(/\n{3,}/g, '\n\n');
  }

  const minifiedTokens = estimateTokenCount(processed);
  const savedTokens = Math.max(0, originalTokens - minifiedTokens);
  const savingsPercentage = originalTokens > 0
    ? Number(((savedTokens / originalTokens) * 100).toFixed(1))
    : 0;

  return {
    code: processed.trim(),
    originalTokens,
    minifiedTokens,
    savedTokens,
    savingsPercentage,
  };
}
