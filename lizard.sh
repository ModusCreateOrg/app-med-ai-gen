#!/bin/bash

# Check if lizard is installed
if ! command -v lizard &> /dev/null; then
    echo "❌ lizard is not installed."
    echo "To install lizard globally, run:"
    echo "  pip install lizard"
    exit 1
fi

# Set the complexity threshold
COMPLEXITY_LIMIT=10
NLOC_LIMIT=250

# Get the list of files staged for commit
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.tsx$|\.ts$')

# Check if there are any files to analyze
if [[ -z "$FILES" ]]; then
    echo "No Typescript files to check"
    exit 0  # No files to check, allow commit
fi

echo "Running lizard check..."

# Initialize error list
ERROR_LIST=""

# Run lizard and capture output
for FILE in $FILES; do
    # Run lizard analysis for the file
    OUTPUT=$(lizard -C $COMPLEXITY_LIMIT -Tnloc=$NLOC_LIMIT -w --warning-msvs "$FILE")
    ERROR_CODE=$?

    if [[ "$ERROR_CODE" -ne 0 ]]; then
        ERROR_LIST+="$OUTPUT\n"
    fi
done

# Check if there were any errors
if [[ -n "$ERROR_LIST" ]]; then
    echo "❌ Commit aborted due to the errors in the following files:"
    echo "$ERROR_LIST"
    echo "Limits are: Code Complexity (CCN)=$COMPLEXITY_LIMIT and Number of Lines (NLOC)=$NLOC_LIMIT"
    exit 1
else
    echo "✅ Complexity check passed."
    exit 0
fi


