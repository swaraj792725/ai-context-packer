#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { packCodebase, SourceFile } from './packer.js';

function scanDirectory(dirPath: string, rootDir: string = dirPath): SourceFile[] {
  const files: SourceFile[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.cache', 'coverage']);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) {
        files.push(...scanDirectory(fullPath, rootDir));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const validExts = new Set(['.ts', '.js', '.tsx', '.jsx', '.py', '.json', '.md', '.html', '.css', '.yaml', '.yml']);
      if (validExts.has(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          files.push({ path: relPath, content });
        } catch {
          // Ignore unreadable files
        }
      }
    }
  }
  return files;
}

function runCLI() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || '.';

  console.log(`📦 AI Context Packer — Scanning directory: ${targetDir}`);
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
    format: 'xml',
  });

  console.log(`\n✨ Successfully packed ${result.totalFiles} files!`);
  console.log(`📊 Estimated Total Tokens: ${result.totalTokens}`);
  console.log(`💡 Tokens Saved via Minification: ${result.savedTokens} (${result.savingsPercentage}% savings)\n`);

  console.log(result.formattedContext);
}

runCLI();
