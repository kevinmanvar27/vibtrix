#!/usr/bin/env node

/**
 * Script to find potentially unused files in the codebase
 * This helps identify files that might be candidates for removal
 * 
 * Usage: node scripts/find-unused-files.js
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

// File extensions to check
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

// Check if a file is imported anywhere in the codebase
function isFileImported(filePath, allFiles) {
  // Get the file name without extension
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Skip index files, pages, and route handlers as they're typically entry points
  if (
    fileName === 'index' || 
    filePath.includes('/pages/') || 
    filePath.includes('/app/') ||
    filePath.includes('/route.') ||
    filePath.includes('/layout.') ||
    filePath.includes('/page.')
  ) {
    return true;
  }
  
  try {
    // Use grep to check if the file is imported anywhere
    const grepCommand = `grep -r "from ['\\\"].*${fileName}['\\\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" ./src`;
    const result = execSync(grepCommand, { encoding: 'utf8' });
    
    // If we found any imports, the file is used
    return result.trim().length > 0;
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    return false;
  }
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const files = getFiles(srcDir, EXTENSIONS, EXCLUDE_DIRS);
  
  console.log(`Found ${files.length} files to check...`);
  
  const potentiallyUnusedFiles = [];
  
  for (const file of files) {
    const isImported = isFileImported(file, files);
    
    if (!isImported) {
      potentiallyUnusedFiles.push(file);
    }
  }
  
  console.log('\nPotentially unused files:');
  potentiallyUnusedFiles.forEach(file => {
    console.log(`- ${file}`);
  });
  
  console.log(`\nFound ${potentiallyUnusedFiles.length} potentially unused files.`);
  console.log('Note: This is just a heuristic. Please manually verify before removing any files.');
}

main();
