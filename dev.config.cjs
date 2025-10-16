/**
 * إعدادات التطوير المشتركة
 * Development Configuration
 */

const DEV_CONFIG = {
  // البورت الافتراضي لخادم التطوير
  DEFAULT_DEV_PORT: 3003,
  
  // البورت البديل في حالة عدم التوفر
  FALLBACK_DEV_PORT: 3002,
  
  // نطاق البورت للبحث التلقائي
  PORT_RANGE: {
    MIN: 3002,
    MAX: 3010
  },
  
  // البورت لتطبيق الويب المستقل
  WEB_DEV_PORT: 3003,
  
  // إعدادات Electron
  ELECTRON_CONFIG: {
    DEV_TOOLS: true,
    SHOW_CONSOLE_LOGS: true,
    AUTO_RETRY: true,
    RETRY_DELAY: 2000 // 2 ثانية
  }
};

/**
 * فحص ما إذا كان المنفذ متاحاً
 * Check if port is available
 */
async function isPortAvailable(port) {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // المنفذ متاح
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // المنفذ مشغول
    });
  });
}

/**
 * العثور على أول منفذ متاح في النطاق
 * Find first available port in range
 */
async function findAvailablePort(startPort = DEV_CONFIG.DEFAULT_DEV_PORT) {
  for (let port = startPort; port <= DEV_CONFIG.PORT_RANGE.MAX; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  
  // إذا لم نجد منفذ في النطاق، نبحث بشكل عشوائي
  for (let port = 4000; port <= 4100; port++) {
    if (await isPortAvailable(port)) {
      console.log(`⚠️ Using fallback port range: ${port}`);
      return port;
    }
  }
  
  throw new Error('❌ No available ports found!');
}

// تصدير الوحدة
DEV_CONFIG.isPortAvailable = isPortAvailable;
DEV_CONFIG.findAvailablePort = findAvailablePort;

module.exports = DEV_CONFIG;
