#!/usr/bin/env node

/**
 * نص برمجي ذكي لتشغيل Electron مع اكتشاف المنفذ التلقائي
 * Smart Electron launcher with automatic port detection
 */

const { spawn } = require('child_process');
const path = require('path');

// Robust resolution of dev.config.js supporting both root and src locations
let DEV_CONFIG;
const candidatePaths = [
  path.join(__dirname, 'dev.config.js'),
  path.join(__dirname, 'config', 'dev.config.js'),
  path.join(__dirname, 'src', 'dev.config.js')
];
for (const p of candidatePaths) {
  try {
    DEV_CONFIG = require(p);
    break;
  } catch (e) { /* continue */ }
}
if (!DEV_CONFIG) {
  console.error('❌ لم يتم العثور على dev.config.js في أي من المسارات المتوقعة');
  console.error('❌ Could not locate dev.config.js in expected paths');
  process.exit(1);
}

async function startSmartElectron() {
  console.log('🔍 البحث عن منفذ متاح...');
  console.log('🔍 Searching for available port...');
  console.log('ℹ️  ملاحظة: إغلاق هذه الجلسة أو الضغط على زر الإيقاف في VSCode سيغلق Electron. اترك النافذة تعمل للتشخيص.');
  if (process.env.DETACH_ON_SIGINT === '1') {
    console.log('🔧 وضع الفصل DETACH_ON_SIGINT=1 مُفعل – سيُتجنب قتل العمليات عند SIGINT (تجريبي).');
  }
  
  try {
    const availablePort = await DEV_CONFIG.findAvailablePort();
    console.log(`✅ تم العثور على منفذ متاح: ${availablePort}`);
    console.log(`✅ Found available port: ${availablePort}`);

    // Compose commands - Fixed for Windows
    const viteCmd = `vite --port ${availablePort}`;
    const electronCmd = `"wait-on http://localhost:${availablePort} && cross-env NODE_ENV=development ELECTRON_DEV_PORT=${availablePort} electron ."`;

    console.log('📋 الأوامر المشغلة:');
    console.log('📋 Commands being executed:');
    console.log(`   [0] ${viteCmd}`);
    console.log(`   [1] ${electronCmd}`);

    const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
      'concurrently',
      '--prefix', '[{index}]',
      '--prefix-colors', 'blue,green',
      '--kill-others',
      `"${viteCmd}"`,
      electronCmd
    ], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        ELECTRON_DEV_PORT: availablePort,
        NODE_ENV: 'development'
      },
      cwd: process.cwd()
    });

    child.on('error', (error) => {
      console.error('❌ خطأ في تشغيل العملية:', error.message);
      console.error('❌ Process error:', error.message);
      console.log('💡 تأكد من تثبيت الحزم: npm install');
      console.log('💡 Make sure dependencies are installed: npm install');
    });

    child.on('exit', (code, signal) => {
      console.log('ℹ️  launcher child exit event code=%s signal=%s', code, signal);
      if (code !== 0 && code !== null) {
        console.log(`⚠️ العملية انتهت برمز الخروج: ${code}`);
      } else {
        console.log('✅ تم إنهاء التطبيق (launcher finished)');
      }
      if (signal) console.log('⚠️ Signal:', signal);
      console.log('💡 إذا كان هذا غير مقصود جرّب تشغيل: DETACH_ON_SIGINT=1 node smart-electron-launcher.js');
    });

    const shutdown = (signal) => {
      console.log(`\n🛑 Received ${signal} – shutdown sequence starting...`);
      if (process.env.DETACH_ON_SIGINT === '1') {
        console.log('↪️  Detach mode: لن يتم قتل العمليات (قد تظل Electron/Vite تعمل).');
        return process.exit(0);
      }
      try {
        console.log('🔪 Killing child process tree (concurrently & its children)...');
        child.kill('SIGTERM');
      } catch (e) {
        console.log('⚠️ Failed to send SIGTERM:', e?.message || e);
      }
      setTimeout(() => process.exit(0), 300);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    if (process.platform === 'win32') process.on('SIGBREAK', () => shutdown('SIGBREAK'));

  } catch (error) {
    console.error('💥 فشل في العثور على منفذ متاح:', error.message);
    console.error('💥 Failed to find available port:', error.message);
    console.log('🔄 المحاولة مع الإعدادات الافتراضية...');
    console.log('🔄 Trying with default settings...');

    const fallbackChild = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
      'run', 'dev:electron:safe'
    ], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    fallbackChild.on('error', (fallbackError) => {
      console.error('💥 الحل البديل فشل أيضاً:', fallbackError.message);
      console.error('💥 Fallback solution also failed:', fallbackError.message);
      process.exit(1);
    });
  }
}

if (require.main === module) {
  startSmartElectron().catch(err => {
    console.error('💥 فشل تشغيل التطبيق:', err.message);
    console.error('💥 Failed to start application:', err.message);
    process.exit(1);
  });
}

module.exports = { startSmartElectron };
// ملاحظة: التصدير أعلاه لبيئة Node فقط. لإتاحة backfill داخل الواجهة سنضيف ملف مستقل في src يربط الدالة بالنافذة.
