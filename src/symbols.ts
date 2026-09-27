export interface SymbolItem {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'export';
  signature: string;
}

/**
 * Extract exported symbols (functions, classes, interfaces, types) from TS/JS/Python source code.
 */
export function extractSymbols(code: string, filename: string): SymbolItem[] {
  const symbols: SymbolItem[] = [];
  const lines = code.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // TypeScript / JavaScript Exports
    if (trimmed.startsWith('export ')) {
      if (trimmed.match(/export\s+(async\s+)?function\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+(async\s+)?function\s+([A-Za-z0-9_$]+)(\([^\)]*\))?/);
        if (match) {
          symbols.push({
            name: match[2],
            kind: 'function',
            signature: `${match[1] ? 'async ' : ''}function ${match[2]}${match[3] || '()'}`,
          });
        }
      } else if (trimmed.match(/export\s+class\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+class\s+([A-Za-z0-9_$]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'class',
            signature: `class ${match[1]}`,
          });
        }
      } else if (trimmed.match(/export\s+interface\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+interface\s+([A-Za-z0-9_$]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'interface',
            signature: `interface ${match[1]}`,
          });
        }
      } else if (trimmed.match(/export\s+type\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+type\s+([A-Za-z0-9_$]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'type',
            signature: `type ${match[1]}`,
          });
        }
      } else if (trimmed.match(/export\s+const\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+const\s+([A-Za-z0-9_$]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'const',
            signature: `const ${match[1]}`,
          });
        }
      }
    }

    // Python Definitions
    if (filename.endsWith('.py')) {
      if (trimmed.startsWith('def ')) {
        const match = trimmed.match(/def\s+([A-Za-z0-9_$]+)(\([^\)]*\))?:/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'function',
            signature: `def ${match[1]}${match[2] || '()'}`,
          });
        }
      } else if (trimmed.startsWith('class ')) {
        const match = trimmed.match(/class\s+([A-Za-z0-9_$]+):/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 'class',
            signature: `class ${match[1]}`,
          });
        }
      }
    }
  }

  return symbols;
}
