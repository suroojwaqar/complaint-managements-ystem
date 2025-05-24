#!/bin/bash

echo "🔍 Pre-Deployment Verification Script"
echo "====================================="

# Check if required files exist
echo "📁 Checking critical files..."

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

if [ ! -f "next.config.js" ]; then
    echo "❌ next.config.js not found"
    exit 1
fi

if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found"
    exit 1
fi

if [ ! -f "src/app/api/auth/[...nextauth]/route.ts" ]; then
    echo "❌ NextAuth route not found"
    exit 1
fi

if [ -f "src/app/api/auth/[...nextauth]/auth.config.ts" ]; then
    echo "❌ Duplicate auth.config.ts still exists - this will cause conflicts!"
    exit 1
fi

echo "✅ All critical files present"

# Check environment variables
echo "🔐 Checking environment variables..."

if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found - create it from .env.example"
else
    echo "✅ .env.local exists"
    
    if grep -q "your-next-auth-secret-key-here" .env.local; then
        echo "⚠️  NEXTAUTH_SECRET is still placeholder - generate a new one!"
    fi
    
    if grep -q "localhost:3000" .env.local; then
        echo "ℹ️  NEXTAUTH_URL is set to localhost (update for production)"
    fi
fi

# Run type check
echo "🔨 Running TypeScript check..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found - fix before deploying"
    exit 1
fi
echo "✅ TypeScript check passed"

# Run build test
echo "🏗️  Running build test..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed - fix errors before deploying"
    exit 1
fi
echo "✅ Build successful"

echo ""
echo "🎉 All checks passed! Ready for Vercel deployment"
echo ""
echo "Next steps:"
echo "1. Generate new NEXTAUTH_SECRET: openssl rand -base64 32"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Deploy to Vercel"
echo "4. Update NEXTAUTH_URL to your Vercel domain"
echo "5. Test the deployed application"
