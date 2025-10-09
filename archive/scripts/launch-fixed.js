#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Complete Desktop Application...\n');

// الحصول على مسار المشروع
const projectPath = process.cwd();
console.log('📁 Project path:', projectPath);

// بدء Vite Dev Server
console.log('1️⃣ Starting Vite Dev Server...');
const viteProcess = spawn('npm', ['run', 'dev', '--', '--port', '3010', '--host'], {
  cwd: projectPath,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

let viteReady = false;

// مراقبة مخرجات Vite
viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('📡 [Vite]', output.trim());
  
  // تحقق من أن Vite جاهز
  if (output.includes('ready in') || output.includes('Local:')) {
    viteReady = true;
    console.log('✅ Vite Dev Server is ready!\n');
    
    // بدء Electron بعد تأخير قصير
    setTimeout(startElectron, 2000);
  }
});

viteProcess.stderr.on('data', (data) => {
  const error = data.toString();
  if (!error.includes('deprecated') && !error.includes('warn')) {
    console.error('❌ [Vite Error]', error.trim());
  }
});

// دالة بدء Electron
function startElectron() {
  if (!viteReady) {
    console.log('⏳ Waiting for Vite to be ready...');
    setTimeout(startElectron, 1000);
    return;
  }
  
  console.log('2️⃣ Starting Electron...');
  
  // تحديد مسار Electron
  const electronPath = path.join(projectPath, 'node_modules', '.bin', 'electron.cmd');
  
  console.log('🔍 Checking Electron path:', electronPath);
  
  if (!fs.existsSync(electronPath)) {
    console.error('❌ Electron not found at:', electronPath);
    // محاولة مسار بديل
    const altPath = path.join(projectPath, 'node_modules', 'electron', 'dist', 'electron.exe');
    if (fs.existsSync(altPath)) {
      console.log('✅ Found Electron at alternative path:', altPath);
      startElectronWithPath(altPath);
    } else {
      console.error('❌ Electron not found at alternative path either');
    }
    return;
  }
  
  startElectronWithPath(electronPath);
}

function startElectronWithPath(electronPath) {
  console.log('🚀 Starting Electron with path:', electronPath);
  
  // تشغيل Electron
  const electronProcess = spawn(electronPath, ['.'], {
    cwd: projectPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ELECTRON_DEV_PORT: '3010',
      NODE_ENV: 'development',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true'
    }
  });
  
  electronProcess.stdout.on('data', (data) => {
    console.log('🖥️ [Electron]', data.toString().trim());
  });
  
  electronProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('gpu') && !error.includes('WARNING')) {
      console.error('❌ [Electron Error]', error.trim());
    }
  });
  
  electronProcess.on('close', (code) => {
    console.log(`🛑 Electron closed with code: ${code}`);
    // إيقاف Vite عند إغلاق Electron
    if (viteProcess && !viteProcess.killed) {
      viteProcess.kill();
    }
    process.exit(code);
  });
  
  console.log('✅ Electron started successfully!');
}

// معالجة إغلاق البرنامج
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
  }
  process.exit(0);
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
  }
  process.exit(1);
});

// تأكد من عدم بدء Electron مبكراً جداً
setTimeout(() => {
  if (!viteReady) {
    console.log('⚠️ Vite taking longer than expected. Checking again...');
  }
}, 10000);