#!/usr/bin/env node
import {
  packCodebase
} from "./chunk-TFXHOBD2.mjs";

// src/cli.ts
import fs from "fs";
import path from "path";
function scanDirectory(dirPath, rootDir = dirPath) {
  const files = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const ignoreDirs = /* @__PURE__ */ new Set(["node_modules", ".git", "dist", "build", ".next", ".cache", "coverage"]);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(rootDir, fullPath);
    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) {
        files.push(...scanDirectory(fullPath, rootDir));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const validExts = /* @__PURE__ */ new Set([".ts", ".js", ".tsx", ".jsx", ".py", ".json", ".md", ".html", ".css", ".yaml", ".yml"]);
      if (validExts.has(ext)) {
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          files.push({ path: relPath, content });
        } catch {
        }
      }
    }
  }
  return files;
}
function runCLI() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || ".";
  console.log(`\u{1F4E6} AI Context Packer \u2014 Scanning directory: ${targetDir}`);
  const absPath = path.resolve(targetDir);
  if (!fs.existsSync(absPath)) {
    console.error(`Error: Directory "${targetDir}" does not exist.`);
    process.exit(1);
  }
  const files = scanDirectory(absPath);
  console.log(`Found ${files.length} source files.`);
  const result = packCodebase(files, {
    minify: true,
    includeSymbolTree: true,
    format: "xml"
  });
  console.log(`
\u2728 Successfully packed ${result.totalFiles} files!`);
  console.log(`\u{1F4CA} Estimated Total Tokens: ${result.totalTokens}`);
  console.log(`\u{1F4A1} Tokens Saved via Minification: ${result.savedTokens} (${result.savingsPercentage}% savings)
`);
  console.log(result.formattedContext);
}
runCLI();
