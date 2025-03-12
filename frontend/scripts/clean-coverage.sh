#!/bin/bash

# Clean up coverage directory
echo "Cleaning up coverage directory..."
rm -rf ./coverage

# Make sure iOS coverage directory doesn't exist
if [ -d "./coverage/ios" ]; then
  echo "Removing iOS coverage directory..."
  rm -rf ./coverage/ios
fi

echo "Coverage directory cleanup complete." 