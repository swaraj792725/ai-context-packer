# `@swaraj792725/ai-context-packer` 📦⚡

> **Zero-dependency, AI token-saving codebase context packer, minifier & symbol tree builder for Claude, Gemini, and GPT agents.**

`@swaraj792725/ai-context-packer` packs source code repositories into clean, AI-optimized prompt context XML/Markdown payloads. It compresses code indentation, strips comments, and extracts codebase symbol maps to save **20–45% of AI context tokens** while providing LLM agents with an immediate structural overview.

---

## Features

- 🚀 **Zero Dependencies**: Pure Node.js & TypeScript for ultra-fast, lightweight execution.
- 💡 **AI Token Minification**: Strips comments, collapses duplicate blank lines, normalizes indentation to cut token usage by 20–45%.
- 🌲 **Symbol Tree Map**: Automatically extracts exported functions, classes, interfaces, and types to build a top-level `<symbol_map>` for LLMs.
- 💰 **Token Budget Enforcer**: Accurately estimates token usage and gracefully truncates content if it exceeds the maximum prompt budget.
- 📦 **Dual XML & Markdown Formatting**: Formats code blocks using standard LLM XML tags (`<codebase>`, `<file path="...">`) or Markdown codeblocks.
- 💻 **CLI & Programmatic API**: Use as an npm package or invoke via CLI `npx @swaraj792725/ai-context-packer`.

---

## Installation

```bash
npm install @swaraj792725/ai-context-packer
```

---

## Quick Start (Programmatic API)

```typescript
import { packCodebase, minifyCode } from '@swaraj792725/ai-context-packer';

const files = [
  {
    path: 'src/services/user.ts',
    content: `
      // Fetch user profile from database
      export async function getUserProfile(userId: string): Promise<User> {
        /* Block comment */
        return await db.users.findUnique({ where: { id: userId } });
      }
    `,
  },
];

const packed = packCodebase(files, {
  minify: true,
  includeSymbolTree: true,
  format: 'xml',
});

console.log(packed.formattedContext);
console.log(`Tokens Saved: ${packed.savedTokens} (${packed.savingsPercentage}%)`);
```

### Output Prompt Context:

```xml
<codebase>
<symbol_map>
File: src/services/user.ts
  - async function getUserProfile()
</symbol_map>

<file path="src/services/user.ts">
export async function getUserProfile(userId: string): Promise<User> {
  return await db.users.findUnique({ where: { id: userId } });
}
</file>
</codebase>
```

---

## Token Minification Utility

Minify individual code strings for AI prompts on the fly:

```typescript
import { minifyCode } from '@swaraj792725/ai-context-packer';

const result = minifyCode(rawCode, 'index.ts', {
  removeComments: true,
  collapseBlankLines: true,
  normalizeIndent: true,
});

console.log(result.code);
console.log(`Saved ${result.savingsPercentage}% tokens!`);
```

---

## CLI Usage

Pack a local codebase directory directly into an AI prompt payload:

```bash
npx @swaraj792725/ai-context-packer ./src
```

---

## License

MIT © [Swaraj](https://github.com/swaraj792725)
