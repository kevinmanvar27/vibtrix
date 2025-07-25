#!/usr/bin/env node

/**
 * This script checks if the application is running correctly
 * It makes requests to both the proxy server (port 3000) and the Next.js server (port 3001)
 * to verify that both are working properly.
 */

const http = require('http');
const https = require('https');

// Configuration
const PROXY_URL = 'http://localhost:3000/api/health';
const NEXT_URL = 'http://localhost:3001/api/health';
const TIMEOUT = 10000; // 10 seconds

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Make an HTTP request with timeout
 * @param {string} url - The URL to request
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} - Response data
 */
function makeRequest(url, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}Making request to ${url}${colors.reset}`);

    // Determine which protocol to use
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, (res) => {
      let data = '';

      // Handle response data
      res.on('data', (chunk) => {
        data += chunk;
      });

      // Handle response end
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    // Handle request timeout
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request to ${url} timed out after ${timeout}ms`));
    });

    // Handle request error
    req.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Check if the application is running correctly
 */
async function checkAppStatus() {
  console.log(`${colors.cyan}=== Vibtrix Application Status Check ===${colors.reset}`);
  console.log(`${colors.cyan}Checking application status...${colors.reset}`);

  let proxyStatus = false;
  let nextStatus = false;

  // Check proxy server
  try {
    console.log(`\n${colors.magenta}Checking proxy server (port 3000)...${colors.reset}`);
    const proxyResponse = await makeRequest(PROXY_URL);

    if (proxyResponse.statusCode === 200 && proxyResponse.data.status === 'ok') {
      console.log(`${colors.green}✓ Proxy server is running correctly${colors.reset}`);
      console.log(`${colors.green}✓ Database status: ${proxyResponse.data.database.status}${colors.reset}`);
      console.log(`${colors.green}✓ Response time: ${proxyResponse.data.performance.responseTime}${colors.reset}`);
      proxyStatus = true;
    } else {
      console.log(`${colors.red}✗ Proxy server returned unexpected response:${colors.reset}`);
      console.log(proxyResponse.data);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Failed to connect to proxy server: ${error.message}${colors.reset}`);
  }

  // Check Next.js server
  try {
    console.log(`\n${colors.magenta}Checking Next.js server (port 3001)...${colors.reset}`);
    const nextResponse = await makeRequest(NEXT_URL);

    if (nextResponse.statusCode === 200 && nextResponse.data.status === 'ok') {
      console.log(`${colors.green}✓ Next.js server is running correctly${colors.reset}`);
      console.log(`${colors.green}✓ Database status: ${nextResponse.data.database.status}${colors.reset}`);
      console.log(`${colors.green}✓ Response time: ${nextResponse.data.performance.responseTime}${colors.reset}`);
      nextStatus = true;
    } else {
      console.log(`${colors.red}✗ Next.js server returned unexpected response:${colors.reset}`);
      console.log(nextResponse.data);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Failed to connect to Next.js server: ${error.message}${colors.reset}`);
  }

  // Overall status
  console.log(`\n${colors.cyan}=== Overall Status ===${colors.reset}`);

  if (proxyStatus && nextStatus) {
    console.log(`${colors.green}✓ Application is running correctly${colors.reset}`);
    return 0; // Success exit code
  } else {
    console.log(`${colors.red}✗ Application has issues${colors.reset}`);

    if (!proxyStatus && !nextStatus) {
      console.log(`${colors.red}✗ Both proxy server and Next.js server are not responding${colors.reset}`);
      console.log(`${colors.yellow}Try starting the application with:${colors.reset}`);
      console.log(`${colors.yellow}  npm run dev:with-proxy${colors.reset}`);
    } else if (!proxyStatus) {
      console.log(`${colors.red}✗ Proxy server is not responding${colors.reset}`);
      console.log(`${colors.yellow}Try starting the proxy server with:${colors.reset}`);
      console.log(`${colors.yellow}  npm run dev:proxy${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Next.js server is not responding${colors.reset}`);
      console.log(`${colors.yellow}Try starting the Next.js server with:${colors.reset}`);
      console.log(`${colors.yellow}  npm run dev${colors.reset}`);
    }

    return 1; // Error exit code
  }
}

// Run the check
checkAppStatus()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
