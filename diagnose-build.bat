@echo off
echo 🔍 Running comprehensive build diagnosis...
echo.

cd /d "D:\Next js App\complaint-managements-ystem"

echo Current directory: %CD%
echo.

echo 📋 Node.js Version:
node --version
echo.

echo 📋 npm Version:
npm --version
echo.

echo 🧹 Cleaning build artifacts...
rmdir /s /q .next 2>nul
echo Build artifacts cleaned.
echo.

echo 📦 Installing dependencies...
call npm ci
if %errorlevel% neq 0 (
    echo ❌ npm ci failed!
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully.
echo.

echo 🔍 Running TypeScript check...
call npx tsc --noEmit --pretty
if %errorlevel% neq 0 (
    echo ❌ TypeScript errors found!
    echo.
    echo 🚨 You must fix all TypeScript errors before building.
    echo Common fixes needed:
    echo 1. Add missing return types to functions
    echo 2. Fix import paths
    echo 3. Add proper type annotations
    echo 4. Handle null/undefined values properly
    echo.
    pause
    exit /b 1
) else (
    echo ✅ TypeScript check passed!
)
echo.

echo 🔍 Running ESLint...
call npm run lint
if %errorlevel% neq 0 (
    echo ⚠️ ESLint errors found. Running auto-fix...
    call npm run lint -- --fix
)
echo.

echo 🏗️ Attempting build...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    echo.
    echo 💡 Check the errors above and:
    echo 1. Fix all TypeScript errors first
    echo 2. Ensure all imports are correct
    echo 3. Check environment variables are set
    echo 4. Verify all dependencies are installed
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Build successful!
    echo.
    echo 🎉 Your app is ready for deployment!
    echo 🚀 Next steps:
    echo    1. Set environment variables in Vercel
    echo    2. Deploy with: vercel --prod
    echo.
)

pause
