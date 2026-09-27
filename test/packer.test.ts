import { describe, test, expect } from 'vitest';
import { packCodebase } from '../src/packer.js';
import { minifyCode } from '../src/minifier.js';
import { extractSymbols } from '../src/symbols.js';
import { estimateTokenCount, truncateToTokenBudget } from '../src/tokens.js';

describe('AI Context Packer & Token Minifier Suite', () => {
  test('estimateTokenCount provides reasonable token estimates', () => {
    const text = 'function helloWorld() { console.log("Hello, World!"); }';
    const tokens = estimateTokenCount(text);
    expect(tokens).toBeGreaterThan(5);
    expect(tokens).toBeLessThan(30);
  });

  test('minifyCode strips JS/TS comments and collapses blank lines', () => {
    const rawCode = `
      // This is a comment
      export function add(a: number, b: number): number {
        /* Block comment */
        return a + b;


      }
    `;
    const minResult = minifyCode(rawCode, 'sample.ts');
    expect(minResult.code).not.toContain('This is a comment');
    expect(minResult.code).not.toContain('Block comment');
    expect(minResult.savedTokens).toBeGreaterThan(0);
    expect(minResult.savingsPercentage).toBeGreaterThan(0);
  });

  test('extractSymbols correctly identifies exported TS declarations', () => {
    const code = `
      export function calculateTotal(items: number[]) {}
      export class OrderProcessor {}
      export interface UserProfile {}
      export type ID = string;
      export const DEFAULT_TIMEOUT = 5000;
    `;
    const symbols = extractSymbols(code, 'services.ts');
    expect(symbols.length).toBe(5);
    expect(symbols.map(s => s.name)).toEqual([
      'calculateTotal',
      'OrderProcessor',
      'UserProfile',
      'ID',
      'DEFAULT_TIMEOUT',
    ]);
  });

  test('packCodebase formats files into valid XML context with symbol map', () => {
    const files = [
      {
        path: 'src/math.ts',
        content: '// Helper\nexport function multiply(a: number, b: number): number { return a * b; }',
      },
      {
        path: 'src/index.ts',
        content: 'import { multiply } from "./math";\nexport function main() { return multiply(2, 3); }',
      },
    ];

    const result = packCodebase(files, {
      minify: true,
      includeSymbolTree: true,
      format: 'xml',
    });

    expect(result.totalFiles).toBe(2);
    expect(result.formattedContext).toContain('<codebase>');
    expect(result.formattedContext).toContain('<symbol_map>');
    expect(result.formattedContext).toContain('<file path="src/math.ts">');
    expect(result.formattedContext).toContain('function multiply');
    expect(result.savingsPercentage).toBeGreaterThan(0);
  });

  test('truncateToTokenBudget respects maximum token limit', () => {
    const longText = 'Line of code;\n'.repeat(100);
    const result = truncateToTokenBudget(longText, 50);
    expect(result.truncated).toBe(true);
    expect(result.text).toContain('Truncated due to token budget limit');
  });
});
