const fs = require('fs');
const path = require('path');

// Function to recursively find all JS files in the .next directory
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js') && !file.endsWith('.min.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to check for obfuscated code patterns
function checkForObfuscatedCode(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    
    // Check for patterns like _0x1234 which are common in obfuscated code
    const obfuscatedVarPattern = /_0x[a-f0-9]{4,}/g;
    const matches = code.match(obfuscatedVarPattern);
    
    if (matches && matches.length > 0) {
      console.log(`Found potential obfuscated code in ${filePath}`);
      console.log(`Obfuscated variables: ${Array.from(new Set(matches)).join(', ')}`);
      
      // Get a snippet of the code around the first match
      const firstMatch = matches[0];
      const index = code.indexOf(firstMatch);
      const start = Math.max(0, index - 100);
      const end = Math.min(code.length, index + 100);
      const snippet = code.substring(start, end);
      
      console.log(`\nCode snippet around first match:\n${snippet}\n`);
      
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return false;
  }
}

// Main function
function main() {
  console.log('Checking for obfuscated code in JavaScript files...');
  
  // Check .next directory
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    const jsFiles = findJsFiles(nextDir);
    console.log(`Found ${jsFiles.length} JavaScript files in .next directory`);
    
    let foundObfuscatedCode = false;
    
    jsFiles.forEach(filePath => {
      if (checkForObfuscatedCode(filePath)) {
        foundObfuscatedCode = true;
      }
    });
    
    if (!foundObfuscatedCode) {
      console.log('No obfuscated code found in .next directory');
    }
  } else {
    console.log('.next directory not found. Run a build first.');
  }
  
  // Check public directory
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    const jsFiles = findJsFiles(publicDir);
    console.log(`Found ${jsFiles.length} JavaScript files in public directory`);
    
    let foundObfuscatedCode = false;
    
    jsFiles.forEach(filePath => {
      if (checkForObfuscatedCode(filePath)) {
        foundObfuscatedCode = true;
      }
    });
    
    if (!foundObfuscatedCode) {
      console.log('No obfuscated code found in public directory');
    }
  } else {
    console.log('public directory not found');
  }
}

main();
