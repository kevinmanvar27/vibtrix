#!/usr/bin/env node

/**
 * Comprehensive Security Scanner for Vibtrix
 * Performs automated security checks and vulnerability scanning
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let securityScore = 100;
let criticalIssues = 0;
let highIssues = 0;
let mediumIssues = 0;
let lowIssues = 0;

function log(level, message, passed = true, recommendation = '') {
  const timestamp = new Date().toISOString();
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;

  console.log(`[${timestamp}] ${status} ${level.toUpperCase()}: ${message}`);

  if (!passed) {
    if (recommendation) {
      console.log(`${colors.yellow}   → Recommendation: ${recommendation}${colors.reset}`);
    }

    // Deduct points based on severity
    switch (level.toLowerCase()) {
      case 'critical':
        securityScore -= 20;
        criticalIssues++;
        break;
      case 'high':
        securityScore -= 10;
        highIssues++;
        break;
      case 'medium':
        securityScore -= 5;
        mediumIssues++;
        break;
      case 'low':
        securityScore -= 2;
        lowIssues++;
        break;
    }
  }
}

function scanForVulnerablePatterns() {
  console.log(`\n${colors.bold}🔍 Scanning for Vulnerable Code Patterns${colors.reset}`);
  console.log('=' .repeat(50));

  const vulnerablePatterns = [
    {
      pattern: /eval\s*\(/g,
      severity: 'critical',
      description: 'eval() usage detected',
      recommendation: 'Replace eval() with safer alternatives'
    },
    {
      pattern: /innerHTML\s*=/g,
      severity: 'high',
      description: 'innerHTML usage detected',
      recommendation: 'Use textContent or sanitize HTML content'
    },
    {
      pattern: /document\.write\s*\(/g,
      severity: 'high',
      description: 'document.write() usage detected',
      recommendation: 'Use modern DOM manipulation methods'
    },
    {
      pattern: /\$\{.*\}/g,
      severity: 'medium',
      description: 'Template literal interpolation',
      recommendation: 'Ensure user input is sanitized before interpolation'
    },
    {
      pattern: /console\.(log|warn|error|info)/g,
      severity: 'low',
      description: 'Console statements found',
      recommendation: 'Remove console statements in production'
    }
  ];

  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

  let totalVulnerabilities = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');

    vulnerablePatterns.forEach(({ pattern, severity, description, recommendation }) => {
      const matches = content.match(pattern);
      if (matches) {
        totalVulnerabilities += matches.length;
        log(severity, `${description} in ${path.relative(process.cwd(), file)} (${matches.length} occurrences)`, false, recommendation);
      }
    });
  });

  if (totalVulnerabilities === 0) {
    log('info', 'No vulnerable code patterns detected', true);
  }
}

function scanDependencies() {
  console.log(`\n${colors.bold}📦 Scanning Dependencies for Vulnerabilities${colors.reset}`);
  console.log('=' .repeat(50));

  try {
    // Run npm audit
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);

    if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
      Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
        const severity = vuln.severity || 'unknown';
        log(severity, `Vulnerable dependency: ${pkg} (${severity})`, false, 'Run npm audit fix');
      });
    } else {
      log('info', 'No dependency vulnerabilities found', true);
    }
  } catch (error) {
    log('medium', 'Could not run dependency audit', false, 'Ensure npm is available and run npm audit manually');
  }
}

function scanEnvironmentSecurity() {
  console.log(`\n${colors.bold}🔐 Scanning Environment Security${colors.reset}`);
  console.log('=' .repeat(50));

  const envFile = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envFile)) {
    log('medium', 'No .env file found', false, 'Create .env file for environment variables');
    return;
  }

  const envContent = fs.readFileSync(envFile, 'utf8');

  // Check for placeholder values
  const placeholderPatterns = [
    /your-.*-key/gi,
    /placeholder/gi,
    /changeme/gi,
    /default/gi
  ];

  placeholderPatterns.forEach(pattern => {
    if (pattern.test(envContent)) {
      log('high', 'Placeholder values found in .env file', false, 'Replace placeholder values with real credentials');
    }
  });

  // Check for weak secrets
  const lines = envContent.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('SECRET') || line.includes('KEY')) {
      const value = line.split('=')[1];
      if (value && value.length < 32) {
        log('medium', `Weak secret on line ${index + 1}: ${line.split('=')[0]}`, false, 'Use secrets with at least 32 characters');
      }
    }
  });

  log('info', 'Environment security scan completed', true);
}

function scanFilePermissions() {
  console.log(`\n${colors.bold}📁 Scanning File Permissions${colors.reset}`);
  console.log('=' .repeat(50));

  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'firebase-service-account.json'
  ];

  sensitiveFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        const mode = stats.mode & parseInt('777', 8);

        if (mode > parseInt('600', 8)) {
          log('medium', `File ${file} has overly permissive permissions (${mode.toString(8)})`, false, 'Set file permissions to 600 or less');
        } else {
          log('info', `File ${file} has secure permissions`, true);
        }
      } catch (error) {
        log('low', `Could not check permissions for ${file}`, false, 'Manually verify file permissions');
      }
    }
  });
}

function getAllFiles(dir, extensions) {
  let files = [];

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach(item => {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        files = files.concat(getAllFiles(fullPath, extensions));
      } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  } catch (error) {
    // Ignore permission errors
  }

  return files;
}

function generateSecurityReport() {
  console.log(`\n${colors.bold}📊 Security Scan Report${colors.reset}`);
  console.log('=' .repeat(50));

  const grade = securityScore >= 95 ? 'A+' :
                securityScore >= 90 ? 'A' :
                securityScore >= 85 ? 'B+' :
                securityScore >= 80 ? 'B' :
                securityScore >= 75 ? 'C+' :
                securityScore >= 70 ? 'C' :
                securityScore >= 65 ? 'D+' :
                securityScore >= 60 ? 'D' : 'F';

  const gradeColor = securityScore >= 90 ? colors.green :
                     securityScore >= 75 ? colors.yellow :
                     colors.red;

  console.log(`${colors.bold}Security Score: ${gradeColor}${securityScore}/100 (Grade: ${grade})${colors.reset}`);
  console.log(`${colors.red}Critical Issues: ${criticalIssues}${colors.reset}`);
  console.log(`${colors.yellow}High Issues: ${highIssues}${colors.reset}`);
  console.log(`${colors.blue}Medium Issues: ${mediumIssues}${colors.reset}`);
  console.log(`${colors.cyan}Low Issues: ${lowIssues}${colors.reset}`);

  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    securityScore,
    grade,
    issues: {
      critical: criticalIssues,
      high: highIssues,
      medium: mediumIssues,
      low: lowIssues
    }
  };

  fs.writeFileSync('security-scan-report.json', JSON.stringify(report, null, 2));
  console.log(`\n${colors.green}Security report saved to security-scan-report.json${colors.reset}`);
}

// Main execution
function main() {
  console.log(`${colors.bold}🛡️  Vibtrix Security Scanner${colors.reset}`);
  console.log(`${colors.bold}Starting comprehensive security scan...${colors.reset}\n`);

  scanForVulnerablePatterns();
  scanDependencies();
  scanEnvironmentSecurity();
  scanFilePermissions();
  generateSecurityReport();

  console.log(`\n${colors.bold}Security scan completed!${colors.reset}`);

  if (criticalIssues > 0) {
    console.log(`${colors.red}⚠️  Critical security issues found! Address immediately.${colors.reset}`);
    process.exit(1);
  } else if (securityScore < 90) {
    console.log(`${colors.yellow}⚠️  Security improvements recommended.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ Security scan passed!${colors.reset}`);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
