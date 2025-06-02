#!/bin/bash

# Final Build Test and Summary Script
# This script runs all checks and provides a comprehensive summary

echo "🎯 Final Build Verification & Summary"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$2" = "success" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "warning" ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    elif [ "$2" = "error" ]; then
        echo -e "${RED}❌ $1${NC}"
    else
        echo -e "${BLUE}ℹ️  $1${NC}"
    fi
}

# Check Node.js version
NODE_VERSION=$(node -v)
print_status "Node.js version: $NODE_VERSION" "info"

# Check if package.json exists
if [ -f "package.json" ]; then
    print_status "package.json found" "success"
else
    print_status "package.json not found" "error"
    exit 1
fi

# Check environment file
if [ -f ".env" ]; then
    print_status ".env file exists" "success"
    
    # Check for required variables
    if grep -q "MONGODB_URI=" .env && ! grep -q "MONGODB_URI=$" .env; then
        print_status "MONGODB_URI configured" "success"
    else
        print_status "MONGODB_URI needs configuration" "warning"
    fi
    
    if grep -q "NEXTAUTH_SECRET=" .env && ! grep -q "NEXTAUTH_SECRET=$" .env; then
        print_status "NEXTAUTH_SECRET configured" "success"
    else
        print_status "NEXTAUTH_SECRET needs configuration" "warning"
    fi
else
    print_status ".env file missing" "warning"
fi

echo ""
echo "🔍 Running Build Checks..."
echo "========================="

# Install dependencies
print_status "Installing dependencies..." "info"
npm install --silent
if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully" "success"
else
    print_status "Failed to install dependencies" "error"
    exit 1
fi

# TypeScript check
print_status "Running TypeScript check..." "info"
npm run type-check --silent
if [ $? -eq 0 ]; then
    print_status "TypeScript check passed" "success"
else
    print_status "TypeScript errors found" "error"
    echo "Run 'npm run type-check' for details"
fi

# Linting
print_status "Running ESLint..." "info"
npm run lint --silent
if [ $? -eq 0 ]; then
    print_status "Linting passed" "success"
else
    print_status "Linting issues found" "warning"
    echo "Run 'npm run lint' for details"
fi

# Clean and build
print_status "Cleaning previous build..." "info"
npm run clean

print_status "Building application..." "info"
npm run build
if [ $? -eq 0 ]; then
    print_status "Build completed successfully!" "success"
    BUILD_SUCCESS=true
else
    print_status "Build failed!" "error"
    BUILD_SUCCESS=false
fi

echo ""
echo "📊 Build Summary"
echo "==============="

if [ "$BUILD_SUCCESS" = true ]; then
    print_status "✨ All checks passed! Your application is ready for deployment." "success"
    echo ""
    echo "🚀 Next Steps:"
    echo "  - Start development server: npm run dev"
    echo "  - Start production server: npm start"
    echo "  - Deploy to production: npm run build:production"
    echo ""
    echo "📖 For deployment help, see: BUILD_FIX_DOCUMENTATION.md"
else
    print_status "❌ Build failed. Please check the errors above." "error"
    echo ""
    echo "🔧 Common fixes:"
    echo "  1. Fix TypeScript errors: npm run type-check"
    echo "  2. Fix linting issues: npm run lint:fix"
    echo "  3. Check environment variables in .env file"
    echo "  4. Ensure MongoDB connection is valid"
fi

echo ""
echo "📁 Project Structure Summary:"
echo "  - Pages: app/ (Next.js App Router)"
echo "  - Components: src/components/"
echo "  - API Routes: src/app/api/"
echo "  - Models: src/models/"
echo "  - Utilities: src/lib/"
echo ""

# Check build size if build was successful
if [ "$BUILD_SUCCESS" = true ] && [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    print_status "Build size: $BUILD_SIZE" "info"
fi

echo "✅ Build verification completed!"
