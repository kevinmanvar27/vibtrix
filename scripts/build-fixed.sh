#!/bin/bash

# Set environment to production
export NODE_ENV=production

# Clean the .next directory
echo "Cleaning .next directory..."
rm -rf .next

# Run the Next.js build without custom optimizations
echo "Building Next.js application..."
next build

echo "Build completed successfully!"
