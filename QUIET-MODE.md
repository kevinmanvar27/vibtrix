# Running Vibtrix in Quiet Mode

This document explains how to run the Vibtrix application with suppressed logs to keep the terminal clean and production-ready.

## Available Scripts

The following scripts are available to run the application with suppressed logs:

### Development Mode

1. **Quiet Development Mode**
   ```bash
   npm run dev:quiet
   ```
   This script runs the application in development mode with minimal logging. It suppresses most console logs but still shows critical errors.

2. **Silent Development Mode**
   ```bash
   npm run dev:silent
   ```
   This script runs the application in development mode with all logs suppressed. It completely disables all console output, including Prisma query logs.

### Production Mode

1. **Quiet Production Mode**
   ```bash
   npm run start:quiet
   ```
   This script runs the application in production mode with minimal logging. It suppresses most console logs but still shows critical errors.

2. **Silent Production Mode**
   ```bash
   npm run start:production
   ```
   This script runs the application in production mode with all logs suppressed. It completely disables all console output, including Prisma query logs.

## How It Works

The quiet mode scripts work by:

1. Setting environment variables to disable logging
2. Patching the Prisma Client to disable query logging
3. Configuring Next.js to suppress warnings and logs
4. Using webpack configuration to remove console.* calls in production builds

## Troubleshooting

If you still see logs in the terminal, try the following:

1. Run the Prisma log suppression script manually:
   ```bash
   node scripts/suppress-prisma-logs.js
   ```

2. Restart the application with the NODE_ENV environment variable set to production:
   ```bash
   NODE_ENV=production npm run start:quiet
   ```

3. If you need to see logs for debugging, use the regular development mode:
   ```bash
   npm run dev
   ```

## Additional Configuration

You can further customize the logging behavior by modifying the following files:

- `.env.development` - Environment variables for development mode
- `scripts/start-quiet.js` - Script to start the application with suppressed logs
- `scripts/suppress-prisma-logs.js` - Script to patch the Prisma Client to disable logs
- `scripts/run-production-mode.sh` - Script to run the application in production mode with all logs suppressed
- `scripts/run-development-quiet.sh` - Script to run the application in development mode with all logs suppressed
