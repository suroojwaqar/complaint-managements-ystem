#!/bin/bash

# Build Fix Script for Complaint Management System
echo "🔧 Starting build fix process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🧹 Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "🔍 Running TypeScript type check..."
npx tsc --noEmit

echo "🔨 Attempting to build..."
npm run build

echo "✅ Build fix script completed!"
