#!/bin/bash

echo "🔍 Running comprehensive TypeScript check..."

# Run type check first
echo "Running: npm run type-check"
npm run type-check

echo -e "\n🔍 TypeScript check completed"
echo "If no errors above, the build should succeed"

echo -e "\n🏗️  Now running build..."
npm run build
