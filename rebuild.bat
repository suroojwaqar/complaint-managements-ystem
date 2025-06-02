@echo off
echo 🧹 Cleaning build cache and rebuilding...
echo =======================================

if exist .next (
    echo Removing .next directory...
    rmdir /s /q .next
)

if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo 📦 Installing fresh dependencies...
npm install

echo 🔍 Running type check...
npm run type-check

echo 🏗️  Building application...
npm run build

if %errorlevel% equ 0 (
    echo ✅ Build completed successfully!
    echo 🚀 You can now run: npm start
) else (
    echo ❌ Build failed. Check errors above.
)

pause
