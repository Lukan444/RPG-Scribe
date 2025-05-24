#!/bin/bash

echo "Checking TypeScript installation in node_modules..."
ls -la node_modules/.bin/ | grep tsc || echo "TypeScript binary not found"

echo ""
echo "Checking if TypeScript is in package.json..."
grep -A 5 -B 5 "typescript" package.json

echo ""
echo "Reinstalling TypeScript..."
npm install typescript@5.3.3 --save-dev --legacy-peer-deps

echo ""
echo "Verifying TypeScript installation..."
ls -la node_modules/.bin/ | grep tsc

echo ""
echo "Testing TypeScript compilation..."
npx tsc --project . --noEmit 2>&1 | head -20

echo ""
echo "Running the npm typecheck script..."
npm run typecheck 2>&1 | head -20