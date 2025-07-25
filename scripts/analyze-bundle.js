const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Backup the original next.config.mjs
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
const nextConfigBackupPath = path.join(process.cwd(), 'next.config.mjs.bak');

// Copy the analyzer config to next.config.mjs
const nextConfigAnalyzerPath = path.join(process.cwd(), 'next.config.analyzer.mjs');

try {
  // Backup the original config
  fs.copyFileSync(nextConfigPath, nextConfigBackupPath);
  console.log('Backed up next.config.mjs');

  // Copy the analyzer config
  fs.copyFileSync(nextConfigAnalyzerPath, nextConfigPath);
  console.log('Copied analyzer config to next.config.mjs');

  // Run the build with analyzer enabled
  console.log('Running build with analyzer...');
  execSync('ANALYZE=true next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Error during analysis:', error);
} finally {
  // Restore the original config
  fs.copyFileSync(nextConfigBackupPath, nextConfigPath);
  console.log('Restored original next.config.mjs');

  // Remove the backup
  fs.unlinkSync(nextConfigBackupPath);
  console.log('Removed backup file');
}
