#!/bin/bash

# Script to run the application in development mode with all logs suppressed
# This script sets environment variables to minimize console output
# 
# Usage: ./scripts/run-development-quiet.sh

# Set environment variables to suppress logs
export NODE_ENV=development
export PRISMA_LOG_QUERIES=false
export NEXT_TELEMETRY_DISABLED=1
export REACT_DEVTOOLS_GLOBAL_HOOK=false
export REACT_QUERY_DEVTOOLS=false
export LOG_LEVEL=error
export DEBUG=false
export NEXT_WEBPACK_DISABLE_PERFORMANCE_HINTS=1
export NEXT_DISABLE_BUILD_INDICATOR=1
export NEXT_DISABLE_SERVER_LOGS=1
export PRISMA_CLIENT_NO_LOGS=1
export NODE_OPTIONS="--no-warnings"

# Run the Prisma log suppression script
node scripts/suppress-prisma-logs.js

# Start the application in development mode with all logs suppressed
echo "Starting the application in development mode with all logs suppressed..."
next dev -p 3000
