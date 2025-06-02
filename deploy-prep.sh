#!/bin/bash

echo "🚀 Preparing for Vercel deployment..."

# Clean build artifacts
echo "1. Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "2. Installing dependencies..."
npm ci

# Run type checking
echo "3. Running TypeScript type check..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found! Fix them before deploying."
  exit 1
fi

# Run linting
echo "4. Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors found! Fix them before deploying."
  exit 1
fi

# Test build
echo "5. Testing build process..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed! Check the errors above."
  exit 1
fi

echo "✅ All checks passed! Ready for Vercel deployment."
echo ""
echo "📋 Deployment Checklist:"
echo "✅ TypeScript errors fixed"
echo "✅ ESLint errors fixed"
echo "✅ Build successful"
echo ""
echo "🔧 Make sure you have these environment variables set in Vercel:"
echo "   - MONGODB_URI"
echo "   - NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL (will be auto-set by Vercel)"
echo ""
echo "🚀 Run: vercel --prod"