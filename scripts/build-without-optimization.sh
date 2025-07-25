#!/bin/bash

# Set environment to production
export NODE_ENV=production
# Skip custom JS optimization
export SKIP_JS_OPTIMIZATION=true

# Clean the .next directory
echo "Cleaning .next directory..."
rm -rf .next

# Run the Next.js build
echo "Building Next.js application..."
next build

# Skip JavaScript optimization
echo "Skipping custom JavaScript optimization..."

# Skip media optimization
echo "Skipping media optimization..."

echo "Build completed without custom optimizations"
