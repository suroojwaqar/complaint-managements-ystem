@echo off
echo.
echo ================================================================
echo           FIXED ALL 4 TYPESCRIPT ERRORS - TESTING BUILD
echo ================================================================
echo.

cd /d "D:\Next js App\complaint-managements-ystem"

echo ✅ ERRORS FIXED:
echo 1. Fixed duplicate $ne properties in MongoDB queries
echo 2. Fixed Set iteration with Array.from()
echo 3. Fixed missing @/types/auth import
echo.

echo 🔍 Running TypeScript check again...
call npx tsc --noEmit --pretty
if %errorlevel% neq 0 (
    echo.
    echo ❌ Still have TypeScript errors. See above for details.
    pause
    exit /b 1
) else (
    echo ✅ TypeScript check PASSED!
)
echo.

echo 🏗️ Building project...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ BUILD FAILED! See errors above.
    pause
    exit /b 1
) else (
    echo.
    echo ================================================================
    echo                    🎉 BUILD SUCCESS! 🎉
    echo ================================================================
    echo.
    echo ✅ All TypeScript errors resolved
    echo ✅ Build completed successfully
    echo ✅ Ready for deployment
    echo.
    echo 🚀 DEPLOY NOW:
    echo    vercel --prod
    echo.
)

pause
