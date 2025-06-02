#!/bin/bash

# Build Verification Script
# This script performs pre-build checks and runs the build process

echo "🔍 Starting build verification process..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the correct directory?"
    exit 1
fi

echo "✅ package.json found"

# Check if .env file exists and has required variables
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Please edit .env file with your actual configuration values."
    else
        echo "❌ .env.example not found either. Please create .env file manually."
        exit 1
    fi
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

REQUIRED_VARS=("MONGODB_URI" "NEXTAUTH_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env || grep -q "^$var=$" .env || grep -q "^$var=your_" .env; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing or placeholder environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo "📝 Please update your .env file with actual values."
    exit 1
fi

echo "✅ Environment variables configured"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Run type check
echo "🔍 Running TypeScript type check..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript type check failed"
    echo "🔧 Please fix the TypeScript errors before building"
    exit 1
fi

echo "✅ TypeScript type check passed"

# Run linting
echo "🔍 Running linting..."
npm run lint
if [ $? -ne 0 ]; then
    echo "⚠️  Linting issues found. Continuing with build..."
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next

# Run the build
echo "🏗️  Starting Next.js build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🚀 You can now run 'npm start' to start the production server"
    echo "🔧 Or run 'npm run dev' to start the development server"
else
    echo "❌ Build failed!"
    echo "🔍 Check the error messages above for more details"
    exit 1
fi

echo "🎉 Build verification completed successfully!"
