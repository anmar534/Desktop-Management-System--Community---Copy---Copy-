/**
 * نظام تسجيل وإرسال الأخطاء إلى GitHub Issues
 * يتم جمع الأخطاء محلياً وإرسالها دورياً إلى GitHub
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { app } = require('electron');
const os = require('os');

// إعدادات GitHub
const GITHUB_CONFIG = {
  owner: 'anmar534',
  repo: 'Desktop-Management-System--Community---Copy---Copy-',
  token: process.env.GITHUB_ERROR_REPORT_TOKEN || '', // يجب تعيينه في متغيرات البيئة
  enabled: process.env.ENABLE_ERROR_REPORTING !== 'false' // تفعيل/تعطيل الإرسال
};

// إعدادات التسجيل
const ERROR_LOG_CONFIG = {
  maxLogSize: 5 * 1024 * 1024, // 5 MB
  maxLogsToKeep: 10,
  reportingInterval: 6 * 60 * 60 * 1000, // 6 ساعات
  batchSize: 50, // عدد الأخطاء المرسلة في المرة الواحدة
};

let errorLogPath = null;
let reportingIntervalHandle = null;
let errorBuffer = [];

/**
 * تهيئة نظام تسجيل الأخطاء
 */
async function initErrorReporter() {
  try {
    const userDataPath = app.getPath('userData');
    const logsDir = path.join(userDataPath, 'error-logs');
    
    // إنشاء مجلد السجلات
    await fs.mkdir(logsDir, { recursive: true });
    
    // إنشاء ملف السجل الحالي
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    errorLogPath = path.join(logsDir, `error-log-${timestamp}.json`);
    
    // تنظيف السجلات القديمة
    await cleanOldLogs(logsDir);
    
    // تحميل الأخطاء غير المرسلة
    await loadPendingErrors();
    
    // بدء الإرسال الدوري
    if (GITHUB_CONFIG.enabled && GITHUB_CONFIG.token) {
      startPeriodicReporting();
    }
    
    console.log('✅ Error Reporter initialized:', errorLogPath);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Error Reporter:', error);
    return false;
  }
}

/**
 * تسجيل خطأ جديد
 */
async function logError(error, context = {}) {
  try {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      type: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack || '',
      context: {
        ...context,
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        platform: process.platform,
        arch: process.arch,
        osVersion: os.release(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
      },
      sent: false,
      id: generateErrorId()
    };

    // إضافة إلى المخزن المؤقت
    errorBuffer.push(errorEntry);

    // حفظ في الملف
    if (errorLogPath) {
      await appendToLogFile(errorEntry);
    }

    console.log('📝 Error logged:', errorEntry.id, errorEntry.message);
    return errorEntry;
  } catch (logError) {
    console.error('❌ Failed to log error:', logError);
    return null;
  }
}

/**
 * إضافة خطأ إلى ملف السجل
 */
async function appendToLogFile(errorEntry) {
  try {
    // قراءة الملف الحالي
    let logs = [];
    if (fsSync.existsSync(errorLogPath)) {
      const content = await fs.readFile(errorLogPath, 'utf-8');
      if (content.trim()) {
        logs = JSON.parse(content);
      }
    }

    // إضافة الخطأ الجديد
    logs.push(errorEntry);

    // حفظ مع تنسيق جميل
    await fs.writeFile(errorLogPath, JSON.stringify(logs, null, 2), 'utf-8');

    // التحقق من حجم الملف
    const stats = await fs.stat(errorLogPath);
    if (stats.size > ERROR_LOG_CONFIG.maxLogSize) {
      await rotateLogFile();
    }
  } catch (error) {
    console.error('❌ Failed to append to log file:', error);
  }
}

/**
 * تدوير ملف السجل عند امتلائه
 */
async function rotateLogFile() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsDir = path.dirname(errorLogPath);
    const newLogPath = path.join(logsDir, `error-log-${timestamp}.json`);
    
    errorLogPath = newLogPath;
    console.log('🔄 Log file rotated:', errorLogPath);
  } catch (error) {
    console.error('❌ Failed to rotate log file:', error);
  }
}

/**
 * تنظيف السجلات القديمة
 */
async function cleanOldLogs(logsDir) {
  try {
    const files = await fs.readdir(logsDir);
    const logFiles = files
      .filter(f => f.startsWith('error-log-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(logsDir, f),
        time: fsSync.statSync(path.join(logsDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // حذف السجلات القديمة
    if (logFiles.length > ERROR_LOG_CONFIG.maxLogsToKeep) {
      const filesToDelete = logFiles.slice(ERROR_LOG_CONFIG.maxLogsToKeep);
      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log('🗑️ Deleted old log file:', file.name);
      }
    }
  } catch (error) {
    console.error('❌ Failed to clean old logs:', error);
  }
}

/**
 * تحميل الأخطاء غير المرسلة
 */
async function loadPendingErrors() {
  try {
    errorBuffer = [];
    const logsDir = path.dirname(errorLogPath || app.getPath('userData'));
    const files = await fs.readdir(logsDir);

    for (const file of files) {
      if (file.startsWith('error-log-') && file.endsWith('.json')) {
        const filePath = path.join(logsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        if (content.trim()) {
          const logs = JSON.parse(content);
          const unsent = logs.filter(log => !log.sent);
          errorBuffer.push(...unsent);
        }
      }
    }

    console.log(`📦 Loaded ${errorBuffer.length} pending errors`);
  } catch (error) {
    console.error('❌ Failed to load pending errors:', error);
  }
}

/**
 * إرسال الأخطاء إلى GitHub Issues
 */
async function sendErrorsToGitHub() {
  if (!GITHUB_CONFIG.enabled || !GITHUB_CONFIG.token) {
    console.log('⏭️ Error reporting disabled or token missing');
    return { success: false, reason: 'disabled' };
  }

  if (errorBuffer.length === 0) {
    console.log('✅ No errors to report');
    return { success: true, sent: 0 };
  }

  try {
    // تجميع الأخطاء حسب النوع
    const errorsByType = groupErrorsByType(errorBuffer);
    let sentCount = 0;

    for (const [errorType, errors] of Object.entries(errorsByType)) {
      if (sentCount >= ERROR_LOG_CONFIG.batchSize) break;

      const issueBody = formatErrorsAsIssue(errorType, errors);
      const issueTitle = `[Auto-Report] ${errorType} (${errors.length} occurrences)`;

      const success = await createGitHubIssue(issueTitle, issueBody, errors);
      
      if (success) {
        // تحديث حالة الأخطاء المرسلة
        errors.forEach(error => {
          error.sent = true;
          error.sentAt = new Date().toISOString();
        });
        sentCount += errors.length;
      }
    }

    // تحديث الملفات
    await updateLogFiles();
    
    // تنظيف المخزن المؤقت
    errorBuffer = errorBuffer.filter(e => !e.sent);

    console.log(`✅ Sent ${sentCount} errors to GitHub`);
    return { success: true, sent: sentCount };
  } catch (error) {
    console.error('❌ Failed to send errors to GitHub:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تجميع الأخطاء حسب النوع
 */
function groupErrorsByType(errors) {
  const grouped = {};
  
  errors.forEach(error => {
    const key = `${error.type}: ${error.message}`.substring(0, 100);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(error);
  });

  return grouped;
}

/**
 * تنسيق الأخطاء كـ GitHub Issue
 */
function formatErrorsAsIssue(errorType, errors) {
  const firstError = errors[0];
  const platforms = [...new Set(errors.map(e => e.context.platform))];
  const versions = [...new Set(errors.map(e => e.context.appVersion))];

  let body = `## 🐛 تقرير خطأ تلقائي\n\n`;
  body += `**عدد المرات:** ${errors.length}\n`;
  body += `**الأنظمة المتأثرة:** ${platforms.join(', ')}\n`;
  body += `**الإصدارات:** ${versions.join(', ')}\n`;
  body += `**آخر حدوث:** ${errors[errors.length - 1].timestamp}\n\n`;
  
  body += `### 📋 تفاصيل الخطأ\n\n`;
  body += `**النوع:** ${firstError.type}\n`;
  body += `**الرسالة:** ${firstError.message}\n\n`;
  
  if (firstError.stack) {
    body += `### 📚 Stack Trace\n\n`;
    body += '```\n' + firstError.stack + '\n```\n\n';
  }

  body += `### 🖥️ معلومات النظام\n\n`;
  body += `- **المنصة:** ${firstError.context.platform} (${firstError.context.arch})\n`;
  body += `- **إصدار النظام:** ${firstError.context.osVersion}\n`;
  body += `- **إصدار Electron:** ${firstError.context.electronVersion}\n`;
  body += `- **إصدار Node:** ${firstError.context.nodeVersion}\n`;
  body += `- **إصدار التطبيق:** ${firstError.context.appVersion}\n\n`;

  if (errors.length > 1) {
    body += `### 📊 تفاصيل الحدوث\n\n`;
    body += `<details>\n<summary>عرض جميع الأخطاء (${errors.length})</summary>\n\n`;
    errors.slice(0, 10).forEach((error, index) => {
      body += `${index + 1}. ${error.timestamp} - ${error.context.platform}\n`;
    });
    if (errors.length > 10) {
      body += `\n... و ${errors.length - 10} أخرى\n`;
    }
    body += `\n</details>\n\n`;
  }

  body += `---\n`;
  body += `*تم إنشاء هذا التقرير تلقائياً بواسطة نظام تسجيل الأخطاء*\n`;

  return body;
}

/**
 * إنشاء GitHub Issue
 */
async function createGitHubIssue(title, body, errors) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body,
          labels: ['bug', 'auto-report', `platform:${errors[0].context.platform}`]
        })
      }
    );

    if (response.ok) {
      const issue = await response.json();
      console.log('✅ Created GitHub issue:', issue.html_url);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Failed to create GitHub issue:', response.status, error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating GitHub issue:', error);
    return false;
  }
}

/**
 * تحديث ملفات السجلات بحالة الإرسال
 */
async function updateLogFiles() {
  try {
    if (!errorLogPath) return;

    const logsDir = path.dirname(errorLogPath);
    const files = await fs.readdir(logsDir);

    for (const file of files) {
      if (file.startsWith('error-log-') && file.endsWith('.json')) {
        const filePath = path.join(logsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        if (content.trim()) {
          const logs = JSON.parse(content);
          
          // تحديث حالة الأخطاء المرسلة
          logs.forEach(log => {
            const sentError = errorBuffer.find(e => e.id === log.id && e.sent);
            if (sentError) {
              log.sent = sentError.sent;
              log.sentAt = sentError.sentAt;
            }
          });

          await fs.writeFile(filePath, JSON.stringify(logs, null, 2), 'utf-8');
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to update log files:', error);
  }
}

/**
 * بدء الإرسال الدوري
 */
function startPeriodicReporting() {
  if (reportingIntervalHandle) {
    clearInterval(reportingIntervalHandle);
  }

  // إرسال فوري للأخطاء المتراكمة
  setTimeout(() => sendErrorsToGitHub(), 60000); // بعد دقيقة من البدء

  // إرسال دوري
  reportingIntervalHandle = setInterval(() => {
    sendErrorsToGitHub();
  }, ERROR_LOG_CONFIG.reportingInterval);

  console.log('⏰ Periodic error reporting started');
}

/**
 * إيقاف الإرسال الدوري
 */
function stopPeriodicReporting() {
  if (reportingIntervalHandle) {
    clearInterval(reportingIntervalHandle);
    reportingIntervalHandle = null;
    console.log('⏸️ Periodic error reporting stopped');
  }
}

/**
 * إنشاء معرف فريد للخطأ
 */
function generateErrorId() {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * الحصول على إحصائيات الأخطاء
 */
function getErrorStats() {
  return {
    totalPending: errorBuffer.length,
    totalSent: errorBuffer.filter(e => e.sent).length,
    logFilePath: errorLogPath,
    reportingEnabled: GITHUB_CONFIG.enabled && !!GITHUB_CONFIG.token
  };
}

/**
 * إرسال يدوي للأخطاء
 */
async function sendNow() {
  return await sendErrorsToGitHub();
}

/**
 * التنظيف عند إغلاق التطبيق
 */
function cleanup() {
  stopPeriodicReporting();
  console.log('🧹 Error Reporter cleaned up');
}

module.exports = {
  initErrorReporter,
  logError,
  sendErrorsToGitHub,
  sendNow,
  getErrorStats,
  cleanup,
  startPeriodicReporting,
  stopPeriodicReporting
};
