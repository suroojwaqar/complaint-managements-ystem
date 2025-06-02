const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running comprehensive build diagnosis...\n');

const projectRoot = process.cwd();
console.log('Project root:', projectRoot);

// Function to run command and capture output
function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  console.log(`Running: ${command}`);
  console.log('─'.repeat(50));
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: projectRoot 
    });
    console.log(output);
    return { success: true, output };
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stdout) {
      console.log('STDOUT:', error.stdout);
    }
    if (error.stderr) {
      console.error('STDERR:', error.stderr);
    }
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

// Run diagnostics
async function runDiagnostics() {
  // 1. Check Node.js and npm versions
  runCommand('node --version', 'Node.js Version Check');
  runCommand('npm --version', 'npm Version Check');
  
  // 2. Clean build artifacts
  console.log('\n🧹 Cleaning build artifacts...');
  try {
    execSync('rmdir /s /q .next 2>nul || rm -rf .next', { stdio: 'ignore' });
    console.log('✅ Build artifacts cleaned');
  } catch (e) {
    console.log('No build artifacts to clean');
  }
  
  // 3. Install dependencies
  const installResult = runCommand('npm ci', 'Installing Dependencies');
  if (!installResult.success) {
    console.log('❌ Dependency installation failed. Cannot proceed.');
    return;
  }
  
  // 4. TypeScript check
  const typeCheck = runCommand('npx tsc --noEmit --pretty', 'TypeScript Type Check');
  
  // 5. ESLint check  
  const lintCheck = runCommand('npm run lint', 'ESLint Check');
  
  // 6. Build attempt
  const buildResult = runCommand('npm run build', 'Next.js Build');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSIS SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`TypeScript Check: ${typeCheck.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`ESLint Check: ${lintCheck.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Build Check: ${buildResult.success ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!typeCheck.success) {
    console.log('\n🚨 TypeScript errors must be fixed before building!');
  }
  
  if (!lintCheck.success) {
    console.log('\n⚠️ ESLint errors should be fixed for clean code.');
  }
  
  if (!buildResult.success) {
    console.log('\n💥 Build failed - see errors above for details.');
  }
  
  if (typeCheck.success && lintCheck.success && buildResult.success) {
    console.log('\n🎉 All checks passed! Your app is ready for deployment.');
  }
}

runDiagnostics().catch(console.error);
