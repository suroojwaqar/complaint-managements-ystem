@echo off
echo 🚀 Preparing for Vercel deployment...

REM Clean build artifacts
echo 1. Cleaning build artifacts...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul

REM Install dependencies
echo 2. Installing dependencies...
npm ci
if %errorlevel% neq 0 (
    echo ❌ npm ci failed!
    pause
    exit /b 1
)

REM Run type checking
echo 3. Running TypeScript type check...
npm run type-check
if %errorlevel% neq 0 (
    echo ❌ TypeScript errors found! Fix them before deploying.
    pause
    exit /b 1
)

REM Run linting
echo 4. Running ESLint...
npm run lint
if %errorlevel% neq 0 (
    echo ❌ ESLint errors found! Fix them before deploying.
    pause
    exit /b 1
)

REM Test build
echo 5. Testing build process...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Check the errors above.
    pause
    exit /b 1
)

echo ✅ All checks passed! Ready for Vercel deployment.
echo.
echo 📋 Deployment Checklist:
echo ✅ TypeScript errors fixed
echo ✅ ESLint errors fixed
echo ✅ Build successful
echo.
echo 🔧 Make sure you have these environment variables set in Vercel:
echo    - MONGODB_URI
echo    - NEXTAUTH_SECRET
echo    - NEXTAUTH_URL (will be auto-set by Vercel)
echo.
echo 🚀 Run: vercel --prod
pause