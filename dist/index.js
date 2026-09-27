"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  estimateTokenCount: () => estimateTokenCount,
  extractSymbols: () => extractSymbols,
  minifyCode: () => minifyCode,
  packCodebase: () => packCodebase,
  truncateToTokenBudget: () => truncateToTokenBudget
});
module.exports = __toCommonJS(index_exports);

// src/tokens.ts
function estimateTokenCount(text) {
  if (!text || text.length === 0) return 0;
  const charEstimate = text.length / 4;
  const wordCount = text.trim().split(/\s+/).length;
  const wordEstimate = wordCount * 1.3;
  return Math.ceil((charEstimate + wordEstimate) / 2);
}
function truncateToTokenBudget(text, maxTokens) {
  const currentTokens = estimateTokenCount(text);
  if (currentTokens <= maxTokens) {
    return { text, truncated: false, tokens: currentTokens };
  }
  const lines = text.split("\n");
  let accumulated = "";
  let count = 0;
  for (const line of lines) {
    const candidate = accumulated ? accumulated + "\n" + line : line;
    const candidateTokens = estimateTokenCount(candidate);
    if (candidateTokens > maxTokens) {
      break;
    }
    accumulated = candidate;
    count = candidateTokens;
  }
  const suffix = "\n/* ... [Truncated due to token budget limit] ... */";
  return {
    text: accumulated ? accumulated + suffix : suffix,
    truncated: true,
    tokens: count + estimateTokenCount(suffix)
  };
}

// src/minifier.ts
function minifyCode(code, filenameOrLang, opts = {}) {
  const {
    removeComments = true,
    collapseBlankLines = true,
    trimWhitespace = true,
    normalizeIndent = true
  } = opts;
  const originalTokens = estimateTokenCount(code);
  let processed = code;
  const lang = (filenameOrLang || "").toLowerCase();
  const isPython = lang.endsWith(".py") || lang === "python" || lang === "py";
  const isHtml = lang.endsWith(".html") || lang.endsWith(".vue") || lang.endsWith(".svelte") || lang === "html";
  const isShell = lang.endsWith(".sh") || lang.endsWith(".yml") || lang.endsWith(".yaml") || lang === "yaml" || lang === "sh";
  if (removeComments) {
    if (isPython || isShell) {
      processed = processed.replace(/^[ \t]*#.*$/gm, "");
    } else if (isHtml) {
      processed = processed.replace(/<!--[\s\S]*?-->/g, "");
    } else {
      processed = processed.replace(/\/\*[\s\S]*?\*\//g, "");
      processed = processed.replace(/^[ \t]*\/\/.*/gm, "");
    }
  }
  if (normalizeIndent) {
    processed = processed.replace(/^([ \t]+)/gm, (match) => {
      const spaces = match.replace(/\t/g, "  ");
      const depth = Math.floor(spaces.length / 4);
      const remainder = spaces.length % 4;
      return "  ".repeat(depth) + " ".repeat(remainder);
    });
  }
  if (trimWhitespace) {
    processed = processed.split("\n").map((line) => line.trimEnd()).join("\n");
  }
  if (collapseBlankLines) {
    processed = processed.replace(/\n{3,}/g, "\n\n");
  }
  const minifiedTokens = estimateTokenCount(processed);
  const savedTokens = Math.max(0, originalTokens - minifiedTokens);
  const savingsPercentage = originalTokens > 0 ? Number((savedTokens / originalTokens * 100).toFixed(1)) : 0;
  return {
    code: processed.trim(),
    originalTokens,
    minifiedTokens,
    savedTokens,
    savingsPercentage
  };
}

// src/symbols.ts
function extractSymbols(code, filename) {
  const symbols = [];
  const lines = code.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("export ")) {
      if (trimmed.match(/export\s+(async\s+)?function\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+(async\s+)?function\s+([A-Za-z0-9_$]+)(\([^\)]*\))?/);
        if (match) {
          symbols.push({
            name: match[2],
            kind: "function",
            signature: `${match[1] ? "async " : ""}function ${match[2]}${match[3] || "()"}`
          });
        }
      } else if (trimmed.match(/export\s+class\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+class\s+([A-Za-z0-9_$]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: "class",
            signature: `class ${match[1]}`
          });
        }
      } else if (trimmed.match(/export\s+interface\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+interface\s+([A-Za-z0-9_$]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: "interface",
            signature: `interface ${match[1]}`
          });
        }
      } else if (trimmed.match(/export\s+type\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+type\s+([A-Za-z0-9_$]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: "type",
            signature: `type ${match[1]}`
          });
        }
      } else if (trimmed.match(/export\s+const\s+([A-Za-z0-9_$]+)/)) {
        const match = trimmed.match(/export\s+const\s+([A-Za-z0-9_$]+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: "const",
            signature: `const ${match[1]}`
          });
        }
      }
    }
    if (filename.endsWith(".py")) {
      if (trimmed.startsWith("def ")) {
        const match = trimmed.match(/def\s+([A-Za-z0-9_$]+)(\([^\)]*\))?:/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: "function",
            signature: `def ${match[1]}${match[2] || "()"}`
          });
        }
      } else if (trimmed.startsWith("class ")) {
        const match = trimmed.match(/class\s+([A-Za-z0-9_$]+):/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: "class",
            signature: `class ${match[1]}`
          });
        }
      }
    }
  }
  return symbols;
}

// src/packer.ts
function packCodebase(files, opts = {}) {
  const {
    maxTokens,
    minify = true,
    includeSymbolTree = true,
    prioritizeFiles = [],
    format = "xml"
  } = opts;
  const sortedFiles = [...files].sort((a, b) => {
    const aPri = prioritizeFiles.includes(a.path) ? 0 : 1;
    const bPri = prioritizeFiles.includes(b.path) ? 0 : 1;
    if (aPri !== bPri) return aPri - bPri;
    return a.path.localeCompare(b.path);
  });
  let totalSavedTokens = 0;
  let totalOriginalTokens = 0;
  let truncatedFilesCount = 0;
  const fileSummaries = [];
  const fileBlocks = [];
  const symbolEntries = [];
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
        symbolEntries.push(`File: ${file.path}
` + symbols.map((s) => `  - ${s.signature}`).join("\n"));
      }
    }
    const fileTokens = estimateTokenCount(processedContent);
    fileSummaries.push({
      path: file.path,
      tokens: fileTokens,
      minified: fileMinified,
      truncated: false
    });
    if (format === "markdown") {
      const ext = file.path.split(".").pop() || "";
      fileBlocks.push(`### File: \`${file.path}\`
\`\`\`${ext}
${processedContent}
\`\`\``);
    } else {
      fileBlocks.push(`<file path="${file.path}">
${processedContent}
</file>`);
    }
  }
  let symbolTreeBlock = "";
  if (includeSymbolTree && symbolEntries.length > 0) {
    if (format === "markdown") {
      symbolTreeBlock = `## Codebase Symbol Map
\`\`\`yaml
${symbolEntries.join("\n\n")}
\`\`\`

`;
    } else {
      symbolTreeBlock = `<symbol_map>
${symbolEntries.join("\n\n")}
</symbol_map>

`;
    }
  }
  let finalBody = fileBlocks.join("\n\n");
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
  let formattedContext = "";
  if (format === "markdown") {
    formattedContext = `# Codebase Context

${symbolTreeBlock}${finalBody}`;
  } else {
    formattedContext = `<codebase>
${symbolTreeBlock}${finalBody}
</codebase>`;
  }
  const finalTotalTokens = estimateTokenCount(formattedContext);
  const savingsPercentage = totalOriginalTokens > 0 ? Number((totalSavedTokens / totalOriginalTokens * 100).toFixed(1)) : 0;
  return {
    formattedContext,
    totalFiles: files.length,
    totalTokens: finalTotalTokens,
    savedTokens: totalSavedTokens,
    savingsPercentage,
    truncatedFiles: truncatedFilesCount,
    fileSummaries
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  estimateTokenCount,
  extractSymbols,
  minifyCode,
  packCodebase,
  truncateToTokenBudget
});
