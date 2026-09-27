import { minifyCode } from './minifier.js';
import { extractSymbols } from './symbols.js';
import { estimateTokenCount, truncateToTokenBudget } from './tokens.js';

export interface SourceFile {
  path: string;
  content: string;
}

export interface PackOptions {
  /** Maximum token budget for the packed prompt output */
  maxTokens?: number;
  /** Whether to minify code (strip comments, collapse blank lines, normalize indentation) */
  minify?: boolean;
  /** Whether to include a symbol tree overview of exported declarations at the top */
  includeSymbolTree?: boolean;
  /** List of file paths to prioritize when packing under token budget */
  prioritizeFiles?: string[];
  /** Output format for LLM prompt context ('xml' | 'markdown') */
  format?: 'xml' | 'markdown';
}

export interface PackResult {
  formattedContext: string;
  totalFiles: number;
  totalTokens: number;
  savedTokens: number;
  savingsPercentage: number;
  truncatedFiles: number;
  fileSummaries: Array<{ path: string; tokens: number; minified: boolean; truncated: boolean }>;
}

/**
 * Pack a collection of source files into an AI-optimized prompt context XML/Markdown block.
 */
export function packCodebase(files: SourceFile[], opts: PackOptions = {}): PackResult {
  const {
    maxTokens,
    minify = true,
    includeSymbolTree = true,
    prioritizeFiles = [],
    format = 'xml',
  } = opts;

  // Sort files so prioritized files are packed first
  const sortedFiles = [...files].sort((a, b) => {
    const aPri = prioritizeFiles.includes(a.path) ? 0 : 1;
    const bPri = prioritizeFiles.includes(b.path) ? 0 : 1;
    if (aPri !== bPri) return aPri - bPri;
    return a.path.localeCompare(b.path);
  });

  let totalSavedTokens = 0;
  let totalOriginalTokens = 0;
  let truncatedFilesCount = 0;
  const fileSummaries: PackResult['fileSummaries'] = [];

  const fileBlocks: string[] = [];
  const symbolEntries: string[] = [];

  for (const file of sortedFiles) {
    const origTokens = estimateTokenCount(file.content);
    totalOriginalTokens += origTokens;

    let processedContent = file.content;
    let fileMinified = false;

    if (minify) {
      const minResult = minifyCode(file.content, file.path);
      processedContent = minResult.code;
      totalSavedTokens += minResult.savedTokens;
      fileMinified = minResult.savedTokens > 0;
    }

    if (includeSymbolTree) {
      const symbols = extractSymbols(file.content, file.path);
      if (symbols.length > 0) {
        symbolEntries.push(`File: ${file.path}\n` + symbols.map((s) => `  - ${s.signature}`).join('\n'));
      }
    }

    const fileTokens = estimateTokenCount(processedContent);
    fileSummaries.push({
      path: file.path,
      tokens: fileTokens,
      minified: fileMinified,
      truncated: false,
    });

    if (format === 'markdown') {
      const ext = file.path.split('.').pop() || '';
      fileBlocks.push(`### File: \`${file.path}\`\n\`\`\`${ext}\n${processedContent}\n\`\`\``);
    } else {
      fileBlocks.push(`<file path="${file.path}">\n${processedContent}\n</file>`);
    }
  }

  let symbolTreeBlock = '';
  if (includeSymbolTree && symbolEntries.length > 0) {
    if (format === 'markdown') {
      symbolTreeBlock = `## Codebase Symbol Map\n\`\`\`yaml\n${symbolEntries.join('\n\n')}\n\`\`\`\n\n`;
    } else {
      symbolTreeBlock = `<symbol_map>\n${symbolEntries.join('\n\n')}\n</symbol_map>\n\n`;
    }
  }

  let finalBody = fileBlocks.join('\n\n');
  let isTruncated = false;

  if (maxTokens) {
    const headerTokens = estimateTokenCount(symbolTreeBlock) + 100;
    const availableBudget = maxTokens - headerTokens;
    if (availableBudget > 0) {
      const budgetResult = truncateToTokenBudget(finalBody, availableBudget);
      finalBody = budgetResult.text;
      isTruncated = budgetResult.truncated;
      if (isTruncated) {
        truncatedFilesCount = Math.max(1, Math.floor(fileSummaries.length / 2));
      }
    }
  }

  let formattedContext = '';
  if (format === 'markdown') {
    formattedContext = `# Codebase Context\n\n${symbolTreeBlock}${finalBody}`;
  } else {
    formattedContext = `<codebase>\n${symbolTreeBlock}${finalBody}\n</codebase>`;
  }

  const finalTotalTokens = estimateTokenCount(formattedContext);
  const savingsPercentage = totalOriginalTokens > 0
    ? Number(((totalSavedTokens / totalOriginalTokens) * 100).toFixed(1))
    : 0;

  return {
    formattedContext,
    totalFiles: files.length,
    totalTokens: finalTotalTokens,
    savedTokens: totalSavedTokens,
    savingsPercentage,
    truncatedFiles: truncatedFilesCount,
    fileSummaries,
  };
}
