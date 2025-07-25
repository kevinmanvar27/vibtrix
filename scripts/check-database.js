#!/usr/bin/env node

/**
 * This script checks the database connection directly
 * It's useful for debugging connection issues
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new Prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

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

async function checkDatabase() {
  console.log(`${colors.cyan}Checking database connection...${colors.reset}`);

  // Log connection details (with password masked)
  const connectionUrl = process.env.POSTGRES_PRISMA_URL || 'Not set';
  const maskedUrl = connectionUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`${colors.blue}Connection URL: ${maskedUrl}${colors.reset}`);

  try {
    // Connect to the database
    console.log(`${colors.yellow}Connecting to database...${colors.reset}`);
    await prisma.$connect();
    console.log(`${colors.green}✓ Connected to database${colors.reset}`);

    // Run a simple query
    console.log(`${colors.yellow}Running test query...${colors.reset}`);
    const result = await prisma.$queryRaw`SELECT current_database() as database, version() as version`;
    console.log(`${colors.green}✓ Query successful${colors.reset}`);
    console.log(`${colors.green}✓ Database: ${result[0].database}${colors.reset}`);
    console.log(`${colors.green}✓ Version: ${result[0].version}${colors.reset}`);

    // Check if we can access the users table
    console.log(`${colors.yellow}Checking users table...${colors.reset}`);
    const userCount = await prisma.user.count();
    console.log(`${colors.green}✓ Users table accessible (${userCount} users)${colors.reset}`);

    // Check if we can access the site_settings table
    console.log(`${colors.yellow}Checking site_settings table...${colors.reset}`);
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
      select: { id: true }
    });

    if (settings) {
      console.log(`${colors.green}✓ Site settings found${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Site settings not found${colors.reset}`);
    }

    console.log(`${colors.green}✓ All database checks passed${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Database connection failed:${colors.reset}`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);

    if (error.code) {
      console.error(`${colors.red}Error code: ${error.code}${colors.reset}`);
    }

    // Provide troubleshooting tips based on the error
    console.log(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);

    if (error.message.includes('ECONNREFUSED')) {
      console.log(`${colors.yellow}• Make sure the database server is running${colors.reset}`);
      console.log(`${colors.yellow}• Check if the host and port are correct${colors.reset}`);
      console.log(`${colors.yellow}• Try connecting with another tool like psql${colors.reset}`);
    } else if (error.message.includes('authentication')) {
      console.log(`${colors.yellow}• Check if the username and password are correct${colors.reset}`);
      console.log(`${colors.yellow}• Verify that the user has access to the database${colors.reset}`);
    } else if (error.message.includes('does not exist')) {
      console.log(`${colors.yellow}• The database does not exist, you may need to create it${colors.reset}`);
      console.log(`${colors.yellow}• Run: createdb vibtrix${colors.reset}`);
    }

    process.exit(1);
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabase();
