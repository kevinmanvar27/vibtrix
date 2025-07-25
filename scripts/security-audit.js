#!/usr/bin/env node

/**
 * Comprehensive Security Audit Script for Vibtrix
 * Performs deep security analysis and generates audit report
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔍 Vibtrix Security Audit');
console.log('============================\n');

const auditResults = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  info: [],
  passed: 0,
  total: 0
};

function audit(level, name, condition, message = '') {
  auditResults.total++;

  if (condition) {
    auditResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    auditResults[level].push({ name, message });
    const emoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '🔶',
      low: '💡',
      info: 'ℹ️'
    }[level];
    console.log(`${emoji} ${name}${message ? ` - ${message}` : ''}`);
  }
}

// 1. Environment Security Audit
console.log('🔐 Environment Security Audit');
console.log('------------------------------');

const envExists = fs.existsSync('.env');
audit('critical', 'Environment file exists', envExists, 'Create .env file');

if (envExists) {
  const envContent = fs.readFileSync('.env', 'utf8');

  // Check for strong secrets
  const jwtSecret = envContent.match(/JWT_SECRET=(.+)/)?.[1];
  audit('critical', 'JWT secret is strong', jwtSecret && jwtSecret.length >= 32, 'Use at least 32 characters');

  const encryptionKey = envContent.match(/ENCRYPTION_KEY=(.+)/)?.[1];
  audit('critical', 'Encryption key is strong', encryptionKey && encryptionKey.length >= 32, 'Use at least 32 characters');

  // Check for placeholder values
  audit('high', 'No placeholder API keys', !envContent.includes('your-'), 'Replace placeholder values');
  audit('high', 'No test keys in production', !envContent.includes('test_') || process.env.NODE_ENV !== 'production', 'Use production keys');

  // Check for sensitive patterns
  const sensitivePatterns = [
    /sk_live_[a-zA-Z0-9]+/,
    /sk_test_[a-zA-Z0-9]+/,
    /rzp_live_[a-zA-Z0-9]+/,
    /AIza[a-zA-Z0-9_-]{35}/
  ];

  sensitivePatterns.forEach((pattern, index) => {
    audit('medium', `No exposed API key pattern ${index + 1}`, !pattern.test(envContent), 'Remove or secure API keys');
  });
}

console.log();

// 2. File Security Audit
console.log('📁 File Security Audit');
console.log('----------------------');

const sensitiveFiles = [
  'firebase-service-account.json',
  '.env.production',
  'secrets/',
  'private/',
  '*.key',
  '*.pem'
];

sensitiveFiles.forEach(file => {
  const exists = fs.existsSync(file);
  audit('critical', `${file} not in repository`, !exists, 'Remove sensitive files');
});

// Check gitignore
const gitignoreExists = fs.existsSync('.gitignore');
audit('high', '.gitignore exists', gitignoreExists);

if (gitignoreExists) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');

  const requiredIgnores = [
    '.env',
    'firebase-service-account.json',
    '*.key',
    '*.pem',
    'secrets/',
    'logs/'
  ];

  requiredIgnores.forEach(ignore => {
    audit('high', `${ignore} in .gitignore`, gitignoreContent.includes(ignore), 'Add to .gitignore');
  });
}

console.log();

// 3. Code Security Audit
console.log('💻 Code Security Audit');
console.log('----------------------');

// Check for security libraries
const securityLibs = [
  'src/lib/security.ts',
  'src/lib/rate-limit.ts',
  'src/lib/auth-security.ts',
  'src/lib/validation-security.ts',
  'src/lib/sql-security.ts',
  'src/lib/csrf-protection.ts'
];

securityLibs.forEach(lib => {
  audit('critical', `${lib} exists`, fs.existsSync(lib), 'Implement security library');
});

// Check middleware
const middlewareExists = fs.existsSync('src/middleware.ts');
audit('critical', 'Security middleware exists', middlewareExists);

if (middlewareExists) {
  const middlewareContent = fs.readFileSync('src/middleware.ts', 'utf8');

  audit('high', 'Rate limiting in middleware', middlewareContent.includes('applyRateLimit'), 'Add rate limiting');
  audit('high', 'Security headers in middleware', middlewareContent.includes('SECURITY_HEADERS'), 'Add security headers');
  audit('high', 'CSP nonce in middleware', middlewareContent.includes('generateCSPNonce'), 'Add CSP nonce');
}

console.log();

// 4. Dependencies Security Audit
console.log('📦 Dependencies Security Audit');
console.log('------------------------------');

const packageJsonExists = fs.existsSync('package.json');
audit('critical', 'package.json exists', packageJsonExists);

if (packageJsonExists) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const securityDeps = [
    'isomorphic-dompurify',
    '@node-rs/argon2',
    'jose',
    'zod'
  ];

  securityDeps.forEach(dep => {
    audit('high', `${dep} installed`, !!deps[dep], 'Install security dependency');
  });

  // Check for vulnerable packages (basic check)
  const vulnerablePackages = [
    'lodash', // Often has vulnerabilities
    'moment', // Deprecated
    'request' // Deprecated
  ];

  vulnerablePackages.forEach(pkg => {
    audit('medium', `No vulnerable ${pkg}`, !deps[pkg], 'Remove or replace vulnerable package');
  });
}

console.log();

// 5. API Security Audit
console.log('🔌 API Security Audit');
console.log('---------------------');

// Check auth endpoints
const authFiles = [
  'src/app/api/auth/token/route.ts',
  'src/app/api/auth/login/route.ts'
];

authFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');

    audit('critical', `Rate limiting in ${file}`, content.includes('applyRateLimit'), 'Add rate limiting');
    audit('critical', `Input validation in ${file}`, content.includes('Schema'), 'Add input validation');
    audit('high', `SQL injection prevention in ${file}`, content.includes('validateSQLInput'), 'Add SQL injection prevention');
  }
});

console.log();

// 6. Database Security Audit
console.log('🗄️ Database Security Audit');
console.log('---------------------------');

// Check for raw SQL usage
const findRawSQL = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let rawSQLFound = false;

  files.forEach(file => {
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      if (findRawSQL(path.join(dir, file.name))) {
        rawSQLFound = true;
      }
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
      const content = fs.readFileSync(path.join(dir, file.name), 'utf8');
      if (content.includes('$queryRaw') || content.includes('$executeRaw')) {
        console.log(`   Found raw SQL in: ${path.join(dir, file.name)}`);
        rawSQLFound = true;
      }
    }
  });

  return rawSQLFound;
};

const hasRawSQL = findRawSQL('src');
audit('medium', 'No unsafe raw SQL queries', !hasRawSQL, 'Review raw SQL usage for security');

console.log();

// 7. Configuration Security Audit
console.log('⚙️ Configuration Security Audit');
console.log('--------------------------------');

const nextConfigExists = fs.existsSync('next.config.mjs');
audit('high', 'Next.js config exists', nextConfigExists);

if (nextConfigExists) {
  const configContent = fs.readFileSync('next.config.mjs', 'utf8');

  audit('high', 'Security headers configured', configContent.includes('headers'), 'Configure security headers');
  audit('medium', 'CSP configured', configContent.includes('Content-Security-Policy'), 'Configure CSP');
}

console.log();

// 8. Documentation Audit
console.log('📚 Documentation Audit');
console.log('----------------------');

const docs = [
  'SECURITY.md',
  'README.md'
];

docs.forEach(doc => {
  audit('medium', `${doc} exists`, fs.existsSync(doc), 'Create documentation');
});

console.log();

// Generate Security Report
console.log('📊 Security Audit Summary');
console.log('=========================');

const score = Math.round((auditResults.passed / auditResults.total) * 100);

console.log(`✅ Passed: ${auditResults.passed}`);
console.log(`🚨 Critical: ${auditResults.critical.length}`);
console.log(`⚠️  High: ${auditResults.high.length}`);
console.log(`🔶 Medium: ${auditResults.medium.length}`);
console.log(`💡 Low: ${auditResults.low.length}`);
console.log(`📈 Security Score: ${score}%`);

if (auditResults.critical.length > 0) {
  console.log('\n🚨 Critical Issues:');
  auditResults.critical.forEach(issue => {
    console.log(`   - ${issue.name}: ${issue.message}`);
  });
}

if (auditResults.high.length > 0) {
  console.log('\n⚠️  High Priority Issues:');
  auditResults.high.forEach(issue => {
    console.log(`   - ${issue.name}: ${issue.message}`);
  });
}

if (score === 100) {
  console.log('\n🎉 Perfect Security Score! Your application is fully secured.');
  console.log('🔒 All security measures are properly implemented.');
} else if (score >= 90) {
  console.log('\n✅ Excellent security posture! Minor improvements needed.');
} else if (score >= 80) {
  console.log('\n⚠️  Good security, but important issues need attention.');
} else {
  console.log('\n🚨 Security improvements required before production deployment.');
}

console.log('\n🔍 Regular security audits recommended.');
console.log('📅 Schedule: Weekly for development, daily for production.');

// Generate audit report file
const reportData = {
  timestamp: new Date().toISOString(),
  score,
  results: auditResults,
  recommendations: [
    'Run security tests before each deployment',
    'Keep dependencies updated',
    'Monitor security advisories',
    'Perform regular penetration testing',
    'Review access logs regularly'
  ]
};

fs.writeFileSync('security-audit-report.json', JSON.stringify(reportData, null, 2));
console.log('\n📄 Detailed report saved to: security-audit-report.json');

process.exit(auditResults.critical.length > 0 ? 1 : 0);
