interface SourceFile {
    path: string;
    content: string;
}
interface PackOptions {
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
interface PackResult {
    formattedContext: string;
    totalFiles: number;
    totalTokens: number;
    savedTokens: number;
    savingsPercentage: number;
    truncatedFiles: number;
    fileSummaries: Array<{
        path: string;
        tokens: number;
        minified: boolean;
        truncated: boolean;
    }>;
}
/**
 * Pack a collection of source files into an AI-optimized prompt context XML/Markdown block.
 */
declare function packCodebase(files: SourceFile[], opts?: PackOptions): PackResult;

interface MinifyOptions {
    /** Remove inline and block comments */
    removeComments?: boolean;
    /** Collapse consecutive blank lines */
    collapseBlankLines?: boolean;
    /** Trim trailing whitespace */
    trimWhitespace?: boolean;
    /** Normalize indentation (e.g., 4 spaces -> 2 spaces) */
    normalizeIndent?: boolean;
}
interface MinifyResult {
    code: string;
    originalTokens: number;
    minifiedTokens: number;
    savedTokens: number;
    savingsPercentage: number;
}
/**
 * Minify source code specifically for LLM context prompts to reduce token count by 20-40%.
 */
declare function minifyCode(code: string, filenameOrLang?: string, opts?: MinifyOptions): MinifyResult;

interface SymbolItem {
    name: string;
    kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'export';
    signature: string;
}
/**
 * Extract exported symbols (functions, classes, interfaces, types) from TS/JS/Python source code.
 */
declare function extractSymbols(code: string, filename: string): SymbolItem[];

/**
 * Token counter and budget manager for AI LLM prompts.
 */
/**
 * Estimate the token count of a given string using standard BPE character/word heuristics (~4 chars/token).
 */
declare function estimateTokenCount(text: string): number;
/**
 * Truncate a text string to stay within a maximum token budget, terminating on line boundaries.
 */
declare function truncateToTokenBudget(text: string, maxTokens: number): {
    text: string;
    truncated: boolean;
    tokens: number;
};

export { type MinifyOptions, type MinifyResult, type PackOptions, type PackResult, type SourceFile, type SymbolItem, estimateTokenCount, extractSymbols, minifyCode, packCodebase, truncateToTokenBudget };
