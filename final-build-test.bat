@echo off
echo.
echo ================================================================
echo               FINAL BUILD TEST - COMPLAINT MANAGEMENT SYSTEM
echo ================================================================
echo.

cd /d "D:\Next js App\complaint-managements-ystem"

echo 🔧 APPLIED FIXES:
echo ✅ Created missing sonner-toaster component
echo ✅ Updated global type definitions  
echo ✅ Fixed auth.ts return types
echo ✅ Fixed useCurrentUser hook types
echo ✅ Fixed DashboardLayout component types
echo.

echo 📋 Current directory: %CD%
echo.

echo 🧹 Cleaning previous build...
if exist ".next" rmdir /s /q .next
echo ✅ Cleaned
echo.

echo 🔍 Running TypeScript check...
call npx tsc --noEmit --pretty
if %errorlevel% neq 0 (
    echo.
    echo ❌ TYPESCRIPT ERRORS FOUND!
    echo.
    echo 🚨 CRITICAL: You must fix these TypeScript errors:
    echo 1. Check the error messages above
    echo 2. Fix missing return types on functions
    echo 3. Fix any import path errors
    echo 4. Ensure all components have proper prop types
    echo.
    echo 💡 Common fixes:
    echo    - Add ": Promise<void>" to async functions
    echo    - Add ": JSX.Element" to React components  
    echo    - Fix import paths with "@/" prefix
    echo    - Handle null/undefined values properly
    echo.
    pause
    exit /b 1
) else (
    echo ✅ TypeScript check PASSED!
)
echo.

echo 🔍 Running ESLint...
call npm run lint
if %errorlevel% neq 0 (
    echo ⚠️ ESLint errors found - running auto-fix...
    call npm run lint -- --fix
)
echo.

echo 🏗️ Building project...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ BUILD FAILED!
    echo.
    echo 🚨 BUILD ERRORS DETECTED:
    echo.
    echo 💡 TROUBLESHOOTING STEPS:
    echo 1. Check error messages above carefully
    echo 2. Look for "Module not found" errors - fix import paths
    echo 3. Look for "Type error" messages - add missing types
    echo 4. Check if all required environment variables are set:
    echo    - MONGODB_URI
    echo    - NEXTAUTH_SECRET  
    echo 5. Verify all dependencies are installed: npm ci
    echo.
    echo 🆘 IF ALL ELSE FAILS - EMERGENCY WORKAROUND:
    echo Edit next.config.js and temporarily add:
    echo   typescript: { ignoreBuildErrors: true }
    echo (Fix the actual errors later!)
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ================================================================
    echo                           🎉 BUILD SUCCESS! 🎉
    echo ================================================================
    echo.
    echo ✅ TypeScript compiled successfully
    echo ✅ All components built without errors
    echo ✅ Static pages generated
    echo ✅ Build artifacts created in .next folder
    echo.
    echo 🚀 YOUR APP IS READY FOR DEPLOYMENT!
    echo.
    echo 📋 NEXT STEPS:
    echo 1. Test locally: npm run dev
    echo 2. Set environment variables in Vercel:
    echo    - MONGODB_URI=your_mongodb_connection
    echo    - NEXTAUTH_SECRET=your_32char_secret
    echo 3. Deploy: vercel --prod
    echo.
    echo 🎯 Build completed successfully at: %date% %time%
    echo.
)

pause
