#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Stable Electron Launcher...');

// إعدادات محسنة لـ Electron
const electronArgs = [
  '.',
  '--no-sandbox',                    // تعطيل sandbox لتجنب مشاكل الأمان
  '--disable-gpu-sandbox',           // تعطيل GPU sandbox
  '--disable-software-rasterizer',   // تعطيل software rasterizer
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--disable-features=TranslateUI',
  '--disable-ipc-flooding-protection'
];

// إعداد متغيرات البيئة
const env = {
  ...process.env,
  ELECTRON_DEV_PORT: '3010',
  NODE_ENV: 'development',
  ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
  ELECTRON_ENABLE_LOGGING: 'true'
};

console.log('⚙️ Environment configured:', {
  port: env.ELECTRON_DEV_PORT,
  nodeEnv: env.NODE_ENV
});

// تشغيل Electron مع المعاملات المحسنة
const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron.cmd');

const electronProcess = spawn(`"${electronPath}"`, electronArgs, {
  env,
  stdio: 'inherit',
  shell: true
});

// معالجة الأحداث
electronProcess.on('error', (error) => {
  console.error('❌ Electron process error:', error);
});

electronProcess.on('exit', (code, signal) => {
  console.log(`🔄 Electron process exited with code ${code} and signal ${signal}`);
  if (code !== 0) {
    console.log('💡 Try restarting if the exit was unexpected');
  }
});

electronProcess.on('close', (code) => {
  console.log(`🏁 Electron process closed with code ${code}`);
});

// معالجة إشارات النظام
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, closing Electron...');
  electronProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, closing Electron...');
  electronProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Electron launcher started successfully');