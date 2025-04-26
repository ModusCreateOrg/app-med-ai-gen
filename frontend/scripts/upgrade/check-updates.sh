#!/bin/bash

# Script to check for package updates with different filters
# Usage: ./check-updates.sh [filter]
# Example: ./check-updates.sh @aws to show only AWS packages

FILTER=$1

echo "🔍 Checking for package updates..."

if [ -n "$FILTER" ]; then
  echo "Filtering packages by: $FILTER"
  npx npm-check-updates --filter "$FILTER" --format group
else
  echo "Showing all available updates..."
  npx npm-check-updates --format group
fi

echo ""
echo "To upgrade specific packages, run:"
echo "npx npm-check-updates -u --filter \"package-name\""
echo ""
echo "After upgrading, run 'npm install' to update the node_modules"
echo "Then run './scripts/upgrade/verify-upgrade.sh' to verify the application"