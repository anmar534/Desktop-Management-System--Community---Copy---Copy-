const { app, BrowserWindow, Menu, dialog, shell, ipcMain, powerMonitor } = require('electron')
const path = require('path')
const crypto = require('crypto')
const keytar = require('keytar')
const isDev = process.env.NODE_ENV === 'development'
const isE2E = process.env.E2E_TEST === '1'
const { autoUpdater } = require('electron-updater')
let Store;
const fs = require('fs').promises
const fsSync = require('fs')
const { validateIpcPayload, redactArgs } = require('./ipcGuard.cjs')
const { buildContentSecurityPolicy, generateNonce } = require('./cspBuilder.cjs')
const { initTelemetry, captureException, addBreadcrumb, isTelemetryEnabled } = require('./telemetry.cjs')
const { initErrorReporter, logError, sendNow: sendErrorsNow, getErrorStats, cleanup: cleanupErrorReporter } = require('./errorReporter.cjs')

// إيقاف تحذيرات الأمان في وضع التطوير
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
}

// استيراد إعدادات التطوير المشتركة
const DEV_CONFIG = require('../../dev.config.cjs')

const resolveScopedAppName = () => {
  const rawName = app.getName() || 'ConstructionSystem'
  const suffix = isE2E ? '-E2E' : (isDev ? '-Dev' : '')
  return `${rawName}${suffix}`.replace(/[<>:"/\\|?*]/g, '_')
}

const PRODUCTION_INDEX_CANDIDATES = [
  path.join(__dirname, '../dist/index.html'),
  path.join(__dirname, '../build/index.html'),
  path.join(__dirname, '../../dist/index.html'),
  path.join(__dirname, '../../build/index.html'),
  path.join(process.cwd(), 'dist/index.html'),
  path.join(process.cwd(), 'build/index.html')
]

// تقليل اعتماد Electron على الكاش على الأجهزة التي بها قيود صلاحيات
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');
// توجيه كاش Chromium إلى مسار داخل userData (سيتم ضبط userData لاحقاً بعد ready)
try {
  const safeName = resolveScopedAppName();
  const base = app.getPath('appData');
  const cacheRoot = path.join(base, safeName);
  app.commandLine.appendSwitch('disk-cache-dir', path.join(cacheRoot, 'Cache'));
  app.commandLine.appendSwitch('disk-cache-size', '0');
} catch {}

// تهيئة مسارات آمنة وقابلة للكتابة للتخزين المؤقت وبيانات المستخدم لتفادي أخطاء الصلاحيات على ويندوز
function setupSafePaths() {
  try {
    const safeAppName = resolveScopedAppName();
    const userDataBase = app.getPath('appData');
    const userDataPath = path.join(userDataBase, safeAppName);

    // يجب استدعاء setPath بعد ready
    app.setPath('userData', userDataPath);
  } catch (e) {
    console.warn('⚠️ Failed to set safe userData/Cache paths:', e?.message || e);
  }
}

// استيراد ديناميكي لـ electron-store
async function initializeStore() {
  const ElectronStore = await import('electron-store');
  Store = ElectronStore.default || ElectronStore;
}

let store;
let mainWindow

const SECURE_STORE_PREFIX = '__secure__:';
const SECURE_STORE_VERSION = 'v1';
const SECURE_KEY_SERVICE = 'DesktopManagementSystem';
const SECURE_KEY_ACCOUNT = 'secure-store-master-key';
const AES_GCM_IV_LENGTH = 12;

const AUDIT_LOG_KEY = 'app_security_audit_log';
const MAX_AUDIT_LOG_ENTRIES = 500;

let activeCspNonce = generateNonce();

const LIFECYCLE_EVENT_CHANNEL = 'system-lifecycle';
const LIFECYCLE_ACK_TIMEOUT_MS = 2000;

const pendingLifecycleAcks = new Map();

const DESKTOP_ALLOWED_EXPORT_FORMATS = new Set([
  'csv',
  'json',
  'xlsx',
  'xls',
  'pdf',
  'docx',
  'doc',
  'pptx',
  'ppt',
  'binary'
]);
const DESKTOP_MAX_EXPORT_BYTES = 20 * 1024 * 1024;
const DESKTOP_TECHNICAL_FILE_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint'
]);
const DESKTOP_TECHNICAL_FILE_MAX_BYTES = 10 * 1024 * 1024;
const DESKTOP_DRAG_TOTAL_LIMIT = 50 * 1024 * 1024;
const SECURITY_UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

let autoUpdateIntervalHandle = null;

const getActiveCspNonce = () => {
  if (!activeCspNonce) {
    activeCspNonce = generateNonce();
  }
  return activeCspNonce;
};

const rotateCspNonce = () => {
  activeCspNonce = generateNonce();
  return activeCspNonce;
};

let cachedSecureKey = null;

const bufferToBase64 = (buffer) => buffer.toString('base64');
const base64ToBuffer = (value) => Buffer.from(value, 'base64');

async function ensureEncryptionKey() {
  if (cachedSecureKey) {
    return cachedSecureKey;
  }

  try {
    let storedKey = await keytar.getPassword(SECURE_KEY_SERVICE, SECURE_KEY_ACCOUNT);

    if (!storedKey) {
      const generatedKey = crypto.randomBytes(32);
      storedKey = bufferToBase64(generatedKey);
      await keytar.setPassword(SECURE_KEY_SERVICE, SECURE_KEY_ACCOUNT, storedKey);
      console.log('🔐 SecureStore key generated and stored via keytar');
    }

    cachedSecureKey = base64ToBuffer(storedKey);
    return cachedSecureKey;
  } catch (error) {
    console.error('❌ Failed to initialize SecureStore key:', error);
    throw error;
  }
}

async function encryptPayload(plaintext) {
  const key = await ensureEncryptionKey();
  const iv = crypto.randomBytes(AES_GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    version: SECURE_STORE_VERSION,
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
    authTag: bufferToBase64(authTag)
  };
}

async function decryptPayload(envelope) {
  const key = await ensureEncryptionKey();
  const iv = base64ToBuffer(envelope.iv);
  const ciphertext = base64ToBuffer(envelope.ciphertext);
  const authTag = base64ToBuffer(envelope.authTag);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

const getSecureKeyName = (key) => `${SECURE_STORE_PREFIX}${key}`;

const isSecureEnvelope = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    typeof value.version === 'string' &&
    typeof value.iv === 'string' &&
    typeof value.ciphertext === 'string' &&
    typeof value.authTag === 'string'
  );
};

async function setSecureValue(key, value) {
  if (!store) {
    throw new Error('Store has not been initialized');
  }

  const payload = JSON.stringify(value ?? null);
  const envelope = await encryptPayload(payload);
  store.set(getSecureKeyName(key), {
    ...envelope,
    updatedAt: new Date().toISOString()
  });

  if (store.has(key)) {
    store.delete(key);
  }
}

async function migratePlainValueToSecure(key) {
  if (!store || !store.has(key)) {
    return null;
  }

  const legacyValue = store.get(key);
  await setSecureValue(key, legacyValue);
  console.log(`🔐 Migrated legacy value for ${key} into SecureStore`);
  return legacyValue;
}

async function getSecureValue(key) {
  if (!store) {
    throw new Error('Store has not been initialized');
  }

  const securePayload = store.get(getSecureKeyName(key));

  if (isSecureEnvelope(securePayload)) {
    try {
      const plaintext = await decryptPayload(securePayload);
      return JSON.parse(plaintext);
    } catch (error) {
      console.error(`❌ Failed to decrypt secure value for ${key}:`, error);
      throw error;
    }
  }

  return migratePlainValueToSecure(key);
}

async function deleteSecureValue(key) {
  if (!store) {
    return;
  }

  store.delete(getSecureKeyName(key));
  if (store.has(key)) {
    store.delete(key);
  }
}

async function clearSecureValues() {
  if (!store) {
    return;
  }

  const currentStore = store.store ?? {};
  for (const key of Object.keys(currentStore)) {
    if (key.startsWith(SECURE_STORE_PREFIX)) {
      store.delete(key);
    }
  }
}

const generateAuditEventId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ipc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const resolveLifecycleWindow = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  const [fallback] = BrowserWindow.getAllWindows();
  if (fallback && !fallback.isDestroyed()) {
    return fallback;
  }

  return null;
};

const wipeBuffer = (buffer) => {
  if (!buffer || typeof buffer.fill !== 'function') {
    return;
  }

  try {
    buffer.fill(0);
  } catch {
    /* noop */
  }
};

const releaseCachedSecureKey = () => {
  if (!cachedSecureKey) {
    return false;
  }

  wipeBuffer(cachedSecureKey);
  cachedSecureKey = null;
  console.log('🔒 [SecureStore] Cleared cached encryption key from memory');
  return true;
};

const logLifecycleResult = (action, result) => {
  if (!result) {
    return;
  }

  const baseMessage = `⚙️ [lifecycle] ${action}`;

  if (!result.acknowledged) {
    console.warn(`${baseMessage} not acknowledged (${result.reason ?? 'unspecified'})`);
    return;
  }

  const status = result.status ?? 'ok';
  console.log(`${baseMessage} acknowledged with status=${status}${
    result.elapsedMs !== undefined ? ` in ${result.elapsedMs}ms` : ''
  }`);
};

const requestRendererLifecycleAction = (action, metadata = {}) => {
  const targetWindow = resolveLifecycleWindow();
  if (!targetWindow) {
    return Promise.resolve({
      action,
      acknowledged: false,
      status: 'skipped',
      reason: 'no-window'
    });
  }

  const requestId = generateAuditEventId();

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      pendingLifecycleAcks.delete(requestId);
      resolve({
        action,
        acknowledged: false,
        status: 'timeout',
        reason: 'renderer-ack-timeout'
      });
    }, LIFECYCLE_ACK_TIMEOUT_MS);

    pendingLifecycleAcks.set(requestId, {
      resolve,
      timeout,
      action
    });

    try {
      targetWindow.webContents.send(LIFECYCLE_EVENT_CHANNEL, {
        id: requestId,
        action,
        timestamp: new Date().toISOString(),
        ...metadata
      });
    } catch (error) {
      clearTimeout(timeout);
      pendingLifecycleAcks.delete(requestId);
      resolve({
        action,
        acknowledged: false,
        status: 'error',
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  });
};

const sanitizeAuditMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const sanitized = {};

  for (const [rawKey, rawValue] of Object.entries(metadata)) {
    if (typeof rawKey !== 'string') {
      continue;
    }

    const key = rawKey.trim();
    if (!key) {
      continue;
    }

    if (rawValue === null || rawValue === undefined) {
      continue;
    }

    let value = rawValue;

    if (typeof rawValue === 'string') {
      value = rawValue;
    } else if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
      value = String(rawValue);
    } else {
      try {
        value = JSON.stringify(rawValue);
      } catch {
        value = String(rawValue);
      }
    }

    let normalized = typeof value === 'string' ? value : String(value);
    if (normalized.length > 256) {
      normalized = `${normalized.slice(0, 253)}...`;
    }

    sanitized[key.slice(0, 64)] = normalized;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

const appendAuditLogEvent = async (details) => {
  try {
    const current = await getSecureValue(AUDIT_LOG_KEY);
    let events = [];
    let schemaVersion = 1;

    if (current && typeof current === 'object') {
      if (Array.isArray(current.data)) {
        events = current.data.slice();
        if (current.__meta && typeof current.__meta.schemaVersion === 'number') {
          schemaVersion = current.__meta.schemaVersion;
        }
      } else if (Array.isArray(current)) {
        events = current.slice();
      }
    }

    const event = {
      id: generateAuditEventId(),
      timestamp: new Date().toISOString(),
      category: details.category ?? 'ipc',
      action: details.action ?? 'payload-rejected',
      key: details.key ?? 'unknown',
      status: details.status ?? 'error',
      level: details.level ?? 'warning',
      actor: details.actor ?? 'renderer',
      origin: details.origin ?? 'main-process'
    };

    const metadata = sanitizeAuditMetadata(details.metadata);
    if (metadata) {
      event.metadata = metadata;
    }

    events.push(event);
    if (events.length > MAX_AUDIT_LOG_ENTRIES) {
      events = events.slice(events.length - MAX_AUDIT_LOG_ENTRIES);
    }

    const envelope = {
      __meta: {
        schemaVersion,
        storedAt: new Date().toISOString()
      },
      data: events
    };

    await setSecureValue(AUDIT_LOG_KEY, envelope);
  } catch (error) {
    console.warn('⚠️ [IPC Guard] Failed to append audit log event:', error?.message || error);
  }
};

const sanitizeDesktopFilename = (value, fallback = 'file') => {
  const raw = value === undefined || value === null ? fallback : String(value);
  let name = raw.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');

  if (!name) {
    name = fallback;
  }

  if (name.length > 120) {
    name = name.slice(0, 120);
  }

  while (name.endsWith('.')) {
    name = name.slice(0, -1);
  }

  if (!name) {
    name = fallback;
  }

  return name;
};

const handleDesktopDragIntent = async (payload = {}) => {
  if (!payload || !Array.isArray(payload.files)) {
    return {
      allowed: false,
      reason: 'invalid-files',
      payload: {
        intent: payload?.intent,
        source: payload?.source,
        tenderId: payload?.tenderId,
        files: []
      }
    };
  }

  let totalBytes = 0;

  const files = payload.files.map((file) => {
    const name = sanitizeDesktopFilename(file.name, 'file');
    const size = typeof file.size === 'number' && Number.isFinite(file.size) && file.size >= 0 ? Math.floor(file.size) : 0;
    totalBytes += size;

    const typeAllowed = DESKTOP_TECHNICAL_FILE_TYPES.has(file.type);
    const sizeAllowed = size <= DESKTOP_TECHNICAL_FILE_MAX_BYTES;

    let allowed = typeAllowed && sizeAllowed;
    let reason;

    if (!typeAllowed) {
      allowed = false;
      reason = 'unsupported-type';
    } else if (!sizeAllowed) {
      allowed = false;
      reason = 'file-too-large';
    }

    const descriptor = {
      name,
      type: file.type,
      size,
      allowed
    };

    if (reason) {
      descriptor.reason = reason;
    }

    if (file.metadata !== undefined) {
      descriptor.metadata = file.metadata;
    }

    return descriptor;
  });

  if (totalBytes > DESKTOP_DRAG_TOTAL_LIMIT) {
    const blockedFiles = files.map((file) => ({
      ...file,
      allowed: false,
      reason: 'aggregate-limit-exceeded'
    }));

    void appendAuditLogEvent({
      category: 'desktop',
      action: 'drag-intent',
      key: sanitizeDesktopFilename(payload.intent ?? 'unspecified'),
      status: 'error',
      level: 'warning',
      metadata: {
        source: payload.source ?? 'unknown',
        tenderId: payload.tenderId ?? '',
        files: String(blockedFiles.length),
        reason: 'aggregate-limit-exceeded'
      }
    }).catch(() => {});

    return {
      allowed: false,
      reason: 'aggregate-limit-exceeded',
      payload: {
        intent: payload.intent,
        source: payload.source,
        tenderId: payload.tenderId,
        files: blockedFiles
      }
    };
  }

  const allowedFiles = files.filter((file) => file.allowed);
  const allowed = allowedFiles.length > 0;

  void appendAuditLogEvent({
    category: 'desktop',
    action: 'drag-intent',
    key: sanitizeDesktopFilename(payload.intent ?? 'unspecified'),
    status: allowed ? 'success' : 'error',
    level: allowed ? 'info' : 'warning',
    metadata: {
      source: payload.source ?? 'unknown',
      tenderId: payload.tenderId ?? '',
      files: String(files.length),
      allowedFiles: String(allowedFiles.length),
      blockedFiles: String(files.length - allowedFiles.length)
    }
  }).catch(() => {});

  return {
    allowed,
    reason: allowed ? undefined : 'no-files-allowed',
    payload: {
      intent: payload.intent,
      source: payload.source,
      tenderId: payload.tenderId,
      files
    }
  };
};

const handleDesktopExport = async (payload = {}) => {
  if (!payload || typeof payload !== 'object') {
    return {
      allowed: false,
      reason: 'invalid-payload'
    };
  }

  if (!DESKTOP_ALLOWED_EXPORT_FORMATS.has(payload.format)) {
    return {
      allowed: false,
      reason: 'unsupported-format'
    };
  }

  if (payload.bytes !== undefined && payload.bytes > DESKTOP_MAX_EXPORT_BYTES) {
    return {
      allowed: false,
      reason: 'payload-too-large'
    };
  }

  const filename = sanitizeDesktopFilename(payload.filename, 'export');

  void appendAuditLogEvent({
    category: 'desktop',
    action: 'export',
    key: filename,
    status: 'success',
    level: 'info',
    metadata: {
      format: payload.format,
      rows: payload.rows !== undefined ? String(payload.rows) : undefined,
      origin: payload.origin ?? 'renderer'
    }
  }).catch(() => {});

  return {
    allowed: true,
    payload: {
      ...payload,
      filename
    }
  };
};

const handleDesktopNotify = async (payload = {}) => {
  if (!payload || typeof payload !== 'object') {
    return {
      allowed: false,
      reason: 'invalid-payload'
    };
  }

  void appendAuditLogEvent({
    category: 'desktop',
    action: 'notify',
    key: sanitizeDesktopFilename(payload.scope ?? 'global'),
    status: 'success',
    level: 'info',
    metadata: {
      severity: payload.severity ?? 'info',
      title: payload.title ?? '',
      correlationId: payload.correlationId ?? ''
    }
  }).catch(() => {});

  return {
    allowed: true,
    payload
  };
};

const handleDesktopSecureAction = async (request = {}) => {
  if (!request || typeof request !== 'object') {
    return {
      allowed: false,
      reason: 'invalid-request'
    };
  }

  const { action, payload } = request;

  if (action === 'drag-intent') {
    return handleDesktopDragIntent(payload);
  }

  if (action === 'export') {
    return handleDesktopExport(payload);
  }

  if (action === 'notify') {
    return handleDesktopNotify(payload);
  }

  return {
    allowed: false,
    reason: 'unsupported-action'
  };
};

  const emitUpdateEventToRenderer = (channel, payload = {}) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, payload);
      }
    } catch (error) {
      console.warn('⚠️ Failed to forward update event to renderer:', error?.message || error);
    }
  };

  const logAutoUpdaterEvent = (action, status, metadata = {}) => {
    void appendAuditLogEvent({
      category: 'auto-updater',
      action,
      key: metadata.version || app.getVersion(),
      status,
      level: status === 'error' ? 'error' : 'info',
      actor: 'system',
      origin: 'main-process',
      metadata: {
        ...metadata,
        appVersion: app.getVersion()
      }
    }).catch(() => {
      /* noop */
    });

    if (status === 'error') {
      addBreadcrumb({
        category: 'auto-updater',
        level: 'error',
        message: `auto-updater:${action}`,
        data: metadata
      });
    } else {
      addBreadcrumb({
        category: 'auto-updater',
        level: 'info',
        message: `auto-updater:${action}`,
        data: metadata
      });
    }
  };

const logIpcViolation = (channel, reason, args) => {
  try {
    queueMicrotask(() => {
      appendAuditLogEvent({
        category: 'ipc',
        action: 'payload-rejected',
        key: channel,
        status: 'error',
        level: 'warning',
        actor: 'renderer',
        origin: 'main-process',
        metadata: {
          reason,
          sample: redactArgs(args)
        }
      }).catch(() => {
        /* noop */
      });
    });
  } catch {
    appendAuditLogEvent({
      category: 'ipc',
      action: 'payload-rejected',
      key: channel,
      status: 'error',
      level: 'warning',
      actor: 'renderer',
      origin: 'main-process',
      metadata: {
        reason,
        sample: redactArgs(args)
      }
    }).catch(() => {
      /* noop */
    });
  }
};

const registerGuardedHandler = (channel, handler) => {
  ipcMain.handle(channel, async (event, ...rawArgs) => {
    const verdict = validateIpcPayload(channel, rawArgs);

    if (!verdict.ok) {
      console.warn(`⚠️ [IPC Guard] Rejected payload on ${channel}: ${verdict.error}`);
      logIpcViolation(channel, verdict.error, rawArgs);
      throw new Error(`Rejected IPC payload for ${channel}: ${verdict.error}`);
    }

    return handler(event, ...verdict.args);
  });
};

const registerGuardedSyncHandler = (channel, handler) => {
  ipcMain.on(channel, (event, ...rawArgs) => {
    const verdict = validateIpcPayload(channel, rawArgs);

    if (!verdict.ok) {
      console.warn(`⚠️ [IPC Guard] Rejected sync payload on ${channel}: ${verdict.error}`);
      logIpcViolation(channel, verdict.error, rawArgs);
      event.returnValue = null;
      return;
    }

    try {
      event.returnValue = handler(event, ...verdict.args);
    } catch (error) {
      const reason = error && typeof error.message === 'string' ? error.message : String(error);
      console.warn(`⚠️ [IPC Guard] Sync handler on ${channel} threw: ${reason}`);
      logIpcViolation(channel, reason, rawArgs);
      event.returnValue = null;
    }
  });
};

const requireStore = () => {
  if (!store) {
    throw new Error('Store has not been initialized');
  }
  return store;
};

// تهيئة التخزين المحلي
async function createStore() {
  await initializeStore();
  store = new Store({
    defaults: {
      windowBounds: { width: 1400, height: 900 },
      darkMode: false,
      activeSection: 'dashboard',
      appSettings: {
        language: 'ar',
        autoSave: true,
        notifications: true
      }
    }
  });
}

// إنشاء النافذة الرئيسية
function createWindow() {
  console.log('📱 Creating main window...');
  console.log('🔧 isDev:', isDev);
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔧 ELECTRON_DEV_PORT:', process.env.ELECTRON_DEV_PORT);
  console.log('🔧 E2E_TEST:', isE2E);
  
  // إضافة معاملات لحل مشاكل GPU و cache
  app.commandLine.appendSwitch('--disable-gpu-sandbox');
  app.commandLine.appendSwitch('--disable-software-rasterizer');
  app.commandLine.appendSwitch('--disable-background-timer-throttling');
  app.commandLine.appendSwitch('--disable-renderer-backgrounding');
  app.commandLine.appendSwitch('--disable-features', 'TranslateUI');
  app.commandLine.appendSwitch('--disable-dev-shm-usage');
  app.commandLine.appendSwitch('--no-sandbox');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'نظام إدارة شركة المقاولات المتطور',
    titleBarStyle: 'default',
    show: true, // إظهار النافذة فوراً للتشخيص
    backgroundColor: '#ffffff', // لون الخلفية أثناء التحميل
    webSecurity: true
  })

  // إضافة Content Security Policy للأمان مع Nonce ديناميكي
  const session = mainWindow.webContents.session;
  rotateCspNonce();

  // فلترة الطلبات - تطبيق CSP فقط على المستندات HTML الرئيسية
  session.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
    try {
      // تطبيق CSP فقط على المستندات الرئيسية، وليس على الموارد (scripts, styles, images, etc)
      const isMainDocument = details.resourceType === 'mainFrame' || 
                             details.resourceType === 'subFrame' ||
                             details.url.includes('index.html');
      
      if (isMainDocument) {
        const nonce = getActiveCspNonce();
        const policy = buildContentSecurityPolicy({ isDev, nonce });
        console.log('🛡️ Applying CSP for document:', details.url.substring(0, 80));
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [policy]
          }
        });
      } else {
        // تمرير الموارد الأخرى بدون تعديل
        callback({ responseHeaders: details.responseHeaders });
      }
    } catch (error) {
      console.warn('⚠️ Failed to apply CSP header:', error?.message || error);
      callback({ responseHeaders: details.responseHeaders });
    }
  });

  mainWindow.webContents.on('did-start-navigation', () => {
    rotateCspNonce();
  });

// تحميل التطبيق مع آلية البحث التلقائي عن المنفذ
if (isDev && !isE2E) {
  console.log('🚀 Development mode detected');
  
  // الحصول على البورت من متغير البيئة أو الإعدادات المشتركة
  const configuredPort = process.env.ELECTRON_DEV_PORT || DEV_CONFIG.DEFAULT_DEV_PORT;
  
  console.log(`🔍 Checking configured port: ${configuredPort}`);
  
  // فحص المنفذ المطلوب
  DEV_CONFIG.isPortAvailable(configuredPort).then(isAvailable => {
    let finalPort = configuredPort;
    
    if (!isAvailable) {
      console.log(`⚠️ Port ${configuredPort} is busy, searching for alternative...`);
      
      // البحث عن منفذ متاح
      return DEV_CONFIG.findAvailablePort(configuredPort + 1);
    }
    
    return Promise.resolve(finalPort);
  }).then(port => {
    const devUrl = `http://localhost:${port}`;
    
    console.log(`🚀 Loading Electron app from: ${devUrl}`);
    console.log(`📡 Port source: ${process.env.ELECTRON_DEV_PORT ? 'Environment Variable' : 'Auto-discovered'}`);
    
    // إضافة تأخير قصير للتأكد من أن السيرفر جاهز تماماً
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          resolve(mainWindow.loadURL(devUrl));
        } else {
          reject(new Error('Main window was destroyed during wait'));
        }
      }, 1000); // تأخير ثانية واحدة
    });
  }).catch(err => {
    console.error('❌ Failed to load development URL:', err);
    
    // محاولة أخيرة مع البورت البديل الثابت
    console.log(`🔄 Final attempt with fallback port: ${DEV_CONFIG.FALLBACK_DEV_PORT}`);
    const fallbackUrl = `http://localhost:${DEV_CONFIG.FALLBACK_DEV_PORT}`;
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(fallbackUrl).catch(finalErr => {
        console.error('💥 All connection attempts failed!');
        console.error('🔧 Please check if Vite development server is running');
        
        // إظهار رسالة خطأ للمستخدم فقط إذا كانت النافذة ما زالت موجودة
        if (mainWindow && !mainWindow.isDestroyed()) {
          dialog.showErrorBox(
            'خطأ في الاتصال - Connection Error',
            `فشل في الاتصال بخادم التطوير.\nيرجى التأكد من تشغيل:\nnpm run dev\n\nFailed to connect to development server.\nPlease make sure to run:\nnpm run dev`
          );
        }
      });
    }
  });
  
  // فتح أدوات المطور إذا كانت مفعلة في الإعدادات
  if (DEV_CONFIG.ELECTRON_CONFIG.DEV_TOOLS) {
    mainWindow.webContents.openDevTools()
  }
} else {
  const staticTarget = PRODUCTION_INDEX_CANDIDATES.find((candidate) => {
    try {
      return fsSync.existsSync(candidate);
    } catch (error) {
      console.warn('⚠️ Error while checking static bundle path:', error?.message || error);
      return false;
    }
  });

  if (!staticTarget) {
    const triedPaths = PRODUCTION_INDEX_CANDIDATES.join('\n');
    const message = `لم يتم العثور على حزمة الواجهة للإنتاج/الاختبار. المسارات التي تمت تجربتها:\n${triedPaths}`;
    console.error('❌ Static bundle not found for production/e2e run.');
    console.error(message);

    if (!isE2E) {
      dialog.showErrorBox('Static bundle not found', message);
    }
  } else {
    console.log(`📦 Loading Electron app from static bundle: ${staticTarget}`);
    mainWindow.loadFile(staticTarget).catch((error) => {
      console.error('❌ Failed to load static bundle:', error?.message || error);
    });
  }
}  // إظهار النافذة عند انتهاء التحميل
  mainWindow.once('ready-to-show', () => {
    console.log('✅ Window ready to show');
    mainWindow.show();
    
    // فحص التحديثات في الإنتاج
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // تتبع أخطاء التحميل
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('❌ Failed to load:', errorDescription, validatedURL);
  });

  // تتبع انتهاء التحميل
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
    
    // إدراج CSS إضافي للتأكد من عمل التصاميم
    mainWindow.webContents.insertCSS(`
      * {
        -webkit-font-smoothing: antialiased !important;
      }
      html {
        font-size: 16px !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
    `)
  })

  // حفظ أبعاد النافذة عند تغييرها
  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds()
    store.set('windowBounds', bounds)
  })

  // منع الروابط الخارجية من الفتح داخل التطبيق
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // معالجة إغلاق النافذة
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

// إعداد القائمة الرئيسية
function createMenu() {
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'مشروع جديد',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'new-project')
          }
        },
        {
          label: 'استيراد من Excel',
          accelerator: 'CmdOrCtrl+I',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
                { name: 'CSV Files', extensions: ['csv'] }
              ]
            })
            
            if (!result.canceled) {
              mainWindow.webContents.send('import-file', result.filePaths[0])
            }
          }
        },
        { type: 'separator' },
        {
          label: 'تصدير التقرير',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('export-report')
          }
        },
        { type: 'separator' },
        {
          label: 'إعدادات',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'settings')
          }
        },
        { type: 'separator' },
        {
          label: 'خروج',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'تحرير',
      submenu: [
        { label: 'تراجع', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'إعادة', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'قص', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'نسخ', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'لصق', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'تحديد الكل', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        {
          label: 'لوحة التحكم',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'dashboard')
          }
        },
        {
          label: 'المشاريع',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'projects')
          }
        },
        {
          label: 'المنافسات',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'tenders')
          }
        },
        {
          label: 'العملاء',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'clients')
          }
        },
        { type: 'separator' },
        {
          label: 'إعادة تحميل',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload()
          }
        },
        {
          label: 'ملء الشاشة',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen())
          }
        },
        {
          label: 'أدوات المطور',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools()
          }
        }
      ]
    },
    {
      label: 'نافذة',
      submenu: [
        {
          label: 'تصغير',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.minimize()
          }
        },
        {
          label: 'إغلاق',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.close()
          }
        }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'حول التطبيق',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول التطبيق',
              message: 'نظام إدارة شركة المقاولات المتطور',
              detail: `الإصدار: ${app.getVersion()}\n\nنظام شامل لإدارة جميع جوانب شركات المقاولات والبناء مع دعم كامل للغة العربية.`,
              buttons: ['موافق']
            })
          }
        },
        {
          label: 'دليل المستخدم',
          click: () => {
            shell.openExternal('https://construction-system.com/help')
          }
        },
        {
          label: 'الدعم الفني',
          click: () => {
            shell.openExternal('https://construction-system.com/support')
          }
        },
        { type: 'separator' },
        {
          label: 'فحص التحديثات',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify()
          }
        }
      ]
    }
  ]

  // تخصيصات خاصة بـ macOS
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'حول ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'خدمات', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'إخفاء ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'إخفاء الآخرين', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'إظهار الكل', role: 'unhide' },
        { type: 'separator' },
        { label: 'خروج', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// معالجات IPC للتواصل مع العملية المرئية
function setupIPC() {
  const resolveWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      return mainWindow
    }
    return BrowserWindow.getFocusedWindow()
  }

  registerGuardedHandler('desktop-secure-action', async (_event, request) => {
    try {
      return await handleDesktopSecureAction(request);
    } catch (error) {
      console.warn('⚠️ [DesktopSecurity] secure action failed:', error?.message || error);
      return {
        allowed: false,
        reason: error instanceof Error ? error.message : String(error)
      };
    }
  });

  registerGuardedHandler('lifecycle-ack', (_event, payload) => {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const entry = pendingLifecycleAcks.get(payload.id);
    if (!entry) {
      return true;
    }

    clearTimeout(entry.timeout);
    pendingLifecycleAcks.delete(payload.id);

    entry.resolve({
      action: entry.action,
      acknowledged: true,
      status: payload.status ?? 'ok',
      details: payload.details ?? null,
      elapsedMs: typeof payload.elapsedMs === 'number' ? payload.elapsedMs : undefined
    });

    return true;
  });

  // معالج للتخزين
  registerGuardedHandler('store-get', (_event, key) => {
    return requireStore().get(key)
  })

  registerGuardedHandler('store-set', (_event, key, value) => {
    requireStore().set(key, value)
    return true
  })

  registerGuardedHandler('store-delete', (_event, key) => {
    requireStore().delete(key)
    return true
  })

  registerGuardedHandler('store-clear', () => {
    requireStore().clear()
    return true
  })

  // معالجات التخزين المؤمَّن
  registerGuardedHandler('secure-store-set', async (_event, key, value) => {
    try {
      await setSecureValue(key, value)
      return true
    } catch (error) {
      console.error(`❌ [SecureStore] Failed to set value for ${key}:`, error)
      throw error
    }
  })

  registerGuardedHandler('secure-store-get', async (_event, key) => {
    try {
      const value = await getSecureValue(key)
      return value ?? null
    } catch (error) {
      console.error(`❌ [SecureStore] Failed to get value for ${key}:`, error)
      throw error
    }
  })

  registerGuardedHandler('secure-store-delete', async (_event, key) => {
    try {
      await deleteSecureValue(key)
      return true
    } catch (error) {
      console.error(`❌ [SecureStore] Failed to delete value for ${key}:`, error)
      throw error
    }
  })

  registerGuardedHandler('secure-store-clear', async () => {
    try {
      await clearSecureValues()
      return true
    } catch (error) {
      console.error('❌ [SecureStore] Failed to clear secure values:', error)
      throw error
    }
  })

  // معالج لعمليات التطبيق
  registerGuardedHandler('app-quit', () => {
    app.quit()
    return true
  })

  registerGuardedHandler('app-minimize', () => {
    const target = resolveWindow()
    if (target) {
      target.minimize()
    }
    return true
  })

  registerGuardedHandler('app-maximize', () => {
    const target = resolveWindow()
    if (!target) {
      return false
    }
    if (target.isMaximized()) {
      target.unmaximize()
    } else {
      target.maximize()
    }
    return target.isMaximized()
  })

  registerGuardedHandler('app-close', () => {
    const target = resolveWindow()
    if (target) {
      target.close()
    }
    return true
  })

  registerGuardedHandler('app-get-version', () => {
    return app.getVersion()
  })

  registerGuardedHandler('security-get-csp-nonce', () => {
    return getActiveCspNonce()
  })

  registerGuardedSyncHandler('security-get-csp-nonce-sync', () => {
    return getActiveCspNonce()
  })

  // معالج لعمليات الملفات
  registerGuardedHandler('fs-read-file', async (_event, filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf8')
      return data
    } catch (error) {
      throw new Error(`فشل في قراءة الملف: ${error.message}`)
    }
  })

  registerGuardedHandler('fs-write-file', async (_event, filePath, data) => {
    try {
      await fs.writeFile(filePath, data, 'utf8')
      return true
    } catch (error) {
      throw new Error(`فشل في كتابة الملف: ${error.message}`)
    }
  })

  registerGuardedHandler('fs-file-exists', async (_event, filePath) => {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  })

  // معالج حوار اختيار الملفات
  registerGuardedHandler('dialog-open-file', async (_event, options = {}) => {
    const target = resolveWindow()
    const result = await dialog.showOpenDialog(target, options)
    return result
  })

  registerGuardedHandler('dialog-save-file', async (_event, options = {}) => {
    const target = resolveWindow()
    const result = await dialog.showSaveDialog(target, options)
    return result
  })

  // معالجات نظام تسجيل الأخطاء
  registerGuardedHandler('error-reporter-stats', async () => {
    return getErrorStats();
  })

  registerGuardedHandler('error-reporter-send-now', async () => {
    return await sendErrorsNow();
  })

  registerGuardedHandler('error-reporter-log', async (_event, error, context) => {
    return await logError(error, context);
  })
}

function setupLifecycleObservers() {
  try {
    powerMonitor.on('suspend', () => {
      console.log('⚙️ [lifecycle] powerMonitor suspend detected');
      void requestRendererLifecycleAction('prepare-suspend', { source: 'powerMonitor:suspend' }).then((result) => {
        logLifecycleResult('prepare-suspend', result);
      });
      releaseCachedSecureKey();
    });

    powerMonitor.on('resume', () => {
      console.log('⚙️ [lifecycle] powerMonitor resume detected');
      releaseCachedSecureKey();
      void ensureEncryptionKey()
        .then(() => {
          console.log('🔐 [SecureStore] Encryption key rehydrated after resume');
        })
        .catch((error) => {
          console.warn('⚠️ [SecureStore] Failed to rehydrate key after resume:', error?.message || error);
        });
      void requestRendererLifecycleAction('resume', { source: 'powerMonitor:resume' }).then((result) => {
        logLifecycleResult('resume', result);
      });
    });
  } catch (error) {
    console.warn('⚠️ Failed to setup lifecycle observers:', error?.message || error);
  }
}

// معالج التحديث التلقائي مع سجل أمني
function setupAutoUpdater() {
  try {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
  } catch (error) {
    console.warn('⚠️ Failed to configure autoUpdater defaults:', error?.message || error);
  }

  const performCheck = async (reason = 'interval') => {
    logAutoUpdaterEvent('check-scheduled', 'success', { reason });
    try {
      const result = await autoUpdater.checkForUpdatesAndNotify();
      if (result && result.updateInfo) {
        logAutoUpdaterEvent('check-completed', 'success', {
          reason,
          version: result.updateInfo.version,
          stagingPercentage: result.updateInfo.stagingPercentage
        });
      } else {
        logAutoUpdaterEvent('check-completed', 'success', {
          reason,
          version: app.getVersion(),
          outcome: 'no-update'
        });
      }
    } catch (error) {
      logAutoUpdaterEvent('check-failed', 'error', {
        reason,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  };

  autoUpdater.on('checking-for-update', () => {
    logAutoUpdaterEvent('checking-for-update', 'success', {});
  });

  autoUpdater.on('update-available', (info) => {
    const payload = {
      version: info?.version,
      releaseDate: info?.releaseDate,
      files: info?.files?.length
    };
    logAutoUpdaterEvent('update-available', 'success', payload);
    emitUpdateEventToRenderer('update-available', payload);
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'تحديث متاح',
        message: `تحديث جديد متاح (Electron ${info?.version ?? ''}). سيتم تحميله في الخلفية.`,
        buttons: ['موافق']
      })
      .catch(() => {
        /* noop */
      });
  });

  autoUpdater.on('update-not-available', (info) => {
    logAutoUpdaterEvent('update-not-available', 'success', {
      version: info?.version || app.getVersion()
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    const payload = {
      version: info?.version,
      releaseDate: info?.releaseDate
    };
    logAutoUpdaterEvent('update-downloaded', 'success', payload);
    emitUpdateEventToRenderer('update-downloaded', payload);
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'تحديث جاهز للتثبيت',
        message: 'تم تحميل التحديث، سيتم إعادة تشغيل التطبيق لتطبيق التحديث.',
        buttons: ['إعادة التشغيل', 'لاحقاً']
      })
      .then((result) => {
        if (result.response === 0) {
          logAutoUpdaterEvent('install-requested', 'success', payload);
          autoUpdater.quitAndInstall();
        } else {
          logAutoUpdaterEvent('install-deferred', 'success', payload);
        }
      })
      .catch((error) => {
        logAutoUpdaterEvent('prompt-error', 'error', {
          version: info?.version,
          message: error instanceof Error ? error.message : String(error)
        });
      });
  });

  autoUpdater.on('error', (error) => {
    logAutoUpdaterEvent('error', 'error', {
      message: error?.message || String(error)
    });
  });

  void performCheck('startup');

  if (autoUpdateIntervalHandle) {
    clearInterval(autoUpdateIntervalHandle);
  }

  autoUpdateIntervalHandle = setInterval(() => {
    void performCheck('scheduled');
  }, SECURITY_UPDATE_CHECK_INTERVAL_MS);

  app.on('before-quit', () => {
    if (autoUpdateIntervalHandle) {
      clearInterval(autoUpdateIntervalHandle);
      autoUpdateIntervalHandle = null;
    }
  });
}

// إعداد التطبيق
app.whenReady().then(async () => {
  const telemetry = initTelemetry({
    release: app.getVersion(),
    environment: isDev ? 'development' : 'production'
  });

  if (telemetry.enabled) {
    addBreadcrumb({
      category: 'lifecycle',
      message: 'app.whenReady() resolved',
      level: 'info'
    });
  }

  // اضبط المسارات الآمنة بعد ready وقبل تهيئة أي موارد تعتمد على userData
  setupSafePaths();
  
  // تهيئة نظام تسجيل الأخطاء
  await initErrorReporter();
  
  await createStore();
  await ensureEncryptionKey();
  setupIPC();
  createWindow();
  createMenu();
  setupLifecycleObservers();
  
  if (!isDev && !isE2E) {
    setupAutoUpdater();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// إغلاق التطبيق عند إغلاق جميع النوافذ (إلا في macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// منع إنشاء أكثر من نسخة واحدة من التطبيق
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('🛑 requestSingleInstanceLock returned false – another instance detected, quitting.');
  app.quit()
} else {
  app.on('second-instance', () => {
    // إذا حاول المستخدم فتح نسخة ثانية، ركز على النافذة الموجودة
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (error) => {
  console.error('خطأ غير متوقع:', error)
  logError(error, { scope: 'uncaughtException' });
  captureException(error, { scope: 'uncaughtException' });
  dialog.showErrorBox('خطأ في التطبيق', `حدث خطأ غير متوقع: ${error.message}`)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise مرفوض:', promise, 'السبب:', reason)
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logError(error, { scope: 'unhandledRejection' });
  captureException(error, { scope: 'unhandledRejection' });
})

// إضافات لوج تفصيلية لدورة الحياة
app.on('before-quit', () => {
  console.log('⚙️ [lifecycle] before-quit fired');
  void requestRendererLifecycleAction('prepare-before-quit', { source: 'app:before-quit' }).then((result) => {
    logLifecycleResult('prepare-before-quit', result);
  });
  releaseCachedSecureKey();
  cleanupErrorReporter();
});
app.on('will-quit', () => {
  console.log('⚙️ [lifecycle] will-quit fired – cleaning up');
  releaseCachedSecureKey();
  cleanupErrorReporter();
});
app.on('quit', (event, exitCode) => {
  console.log('⚙️ [lifecycle] quit event exitCode=', exitCode);
});
process.on('exit', (code) => {
  console.log('⚙️ [process] exit code=', code);
});
app.on('render-process-gone', (event, wc, details) => {
  console.log('🚨 render-process-gone reason=%s exitCode=%s', details.reason, details.exitCode);
  if (isTelemetryEnabled()) {
    captureException(new Error('render-process-gone'), {
      reason: details.reason,
      exitCode: details.exitCode,
      url: wc?.getURL?.()
    });
  }
});
app.on('child-process-gone', (event, details) => {
  console.log('🚨 child-process-gone type=%s reason=%s exitCode=%s', details.type, details.reason, details.exitCode);
  if (isTelemetryEnabled()) {
    captureException(new Error('child-process-gone'), details);
  }
});
app.on('gpu-process-crashed', () => {
  console.log('🚨 GPU process crashed');
  if (isTelemetryEnabled()) {
    captureException(new Error('gpu-process-crashed'));
  }
});

module.exports = { mainWindow }