#!/usr/bin/env node

/**
 * Script to find all console statements in the codebase
 * This helps identify any remaining console logs that need to be removed
 * 
 * Usage: node scripts/find-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  'public',
  'scripts',
];

// File extensions to process
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Get all files with the specified extensions
function getFiles(dir, extensions, excludeDirs) {
  let files = [];
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!excludeDirs.includes(entry.name)) {
        files = files.concat(getFiles(fullPath, extensions, excludeDirs));
      }
    } else if (extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Find console statements in a file
function findConsoleStatements(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const consoleRegex = /console\.(log|warn|error|info|debug|table|time|timeEnd|group|groupEnd|groupCollapsed|assert|count|countReset|dir|dirxml|trace|profile|profileEnd)\(/g;
  
  let match;
  const matches = [];
  
  while ((match = consoleRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const line = content.split('\n')[lineNumber - 1].trim();
    
    matches.push({
      type: match[1],
      lineNumber,
      line,
    });
  }
  
  return matches;
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const files = getFiles(srcDir, EXTENSIONS, EXCLUDE_DIRS);
  
  let totalFiles = 0;
  let totalMatches = 0;
  const fileMatches = {};
  
  for (const file of files) {
    totalFiles++;
    
    const matches = findConsoleStatements(file);
    
    if (matches.length > 0) {
      fileMatches[file] = matches;
      totalMatches += matches.length;
    }
  }
  
  console.log(`\nFound ${totalMatches} console statements in ${Object.keys(fileMatches).length} files (out of ${totalFiles} total files):\n`);
  
  for (const [file, matches] of Object.entries(fileMatches)) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`${relativePath} (${matches.length} statements):`);
    
    for (const match of matches) {
      console.log(`  Line ${match.lineNumber}: ${match.type} - ${match.line}`);
    }
    
    console.log('');
  }
}

main();
