#!/usr/bin/env node

/**
 * Script to replace all console statements with debug utility functions
 * This helps clean up the codebase by using a consistent logging approach
 * 
 * Usage: node scripts/replace-console-statements.js
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

// Process a file to replace console statements with debug functions
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if the file already imports debug
  const hasDebugImport = content.includes('import debug from') || 
                         content.includes('import { debug }') ||
                         content.includes('import debug');
  
  // Replace console.log with debug.log
  let newContent = content.replace(/console\.log\((.*?)\);?/g, (match, args) => {
    modified = true;
    return `debug.log(${args});`;
  });
  
  // Replace console.error with debug.error
  newContent = newContent.replace(/console\.error\((.*?)\);?/g, (match, args) => {
    modified = true;
    return `debug.error(${args});`;
  });
  
  // Replace console.warn with debug.warn
  newContent = newContent.replace(/console\.warn\((.*?)\);?/g, (match, args) => {
    modified = true;
    return `debug.warn(${args});`;
  });
  
  // Replace console.info with debug.info
  newContent = newContent.replace(/console\.info\((.*?)\);?/g, (match, args) => {
    modified = true;
    return `debug.info(${args});`;
  });
  
  // If we made replacements but there's no debug import, add it
  if (modified && !hasDebugImport) {
    // Find the last import statement
    const importRegex = /^import .+ from .+;?\s*$/gm;
    let lastImportMatch;
    let lastImportIndex = 0;
    
    while ((match = importRegex.exec(newContent)) !== null) {
      lastImportMatch = match;
      lastImportIndex = match.index + match[0].length;
    }
    
    if (lastImportIndex > 0) {
      // Add the debug import after the last import
      const beforeImport = newContent.substring(0, lastImportIndex);
      const afterImport = newContent.substring(lastImportIndex);
      return beforeImport + '\nimport debug from "@/lib/debug";\n' + afterImport;
    } else {
      // If no imports found, add at the beginning of the file
      return 'import debug from "@/lib/debug";\n\n' + newContent;
    }
  }
  
  return newContent;
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const files = getFiles(srcDir, EXTENSIONS, EXCLUDE_DIRS);
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  for (const file of files) {
    totalFiles++;
    
    const originalContent = fs.readFileSync(file, 'utf8');
    const newContent = processFile(file);
    
    if (originalContent !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      modifiedFiles++;
      console.log(`Modified: ${file}`);
    }
  }
  
  console.log(`\nProcessed ${totalFiles} files, modified ${modifiedFiles} files.`);
}

main();
