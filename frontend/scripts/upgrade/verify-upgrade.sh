#!/bin/bash

# Script to verify application functionality after package upgrades
echo "🔍 Verifying application after package upgrades..."

# Check for TypeScript errors
echo "Checking TypeScript compilation..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ TypeScript compilation successful"
else
  echo "❌ TypeScript compilation failed"
  exit 1
fi

# Run unit tests
echo "Running unit tests..."
npm run test:ci

if [ $? -eq 0 ]; then
  echo "✅ Unit tests passed"
else
  echo "❌ Unit tests failed"
  exit 1
fi

# Build the application
echo "Testing build process..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi

echo "✅ All verification checks passed!"
exit 0