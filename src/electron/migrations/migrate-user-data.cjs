/**
 * Migration Script: نقل البيانات من المجلد القديم إلى المجلد الجديد
 * 
 * هذا السكريبت يحل مشكلة v1.0.6 حيث كانت بيئة التطوير تستخدم مجلد مختلف
 * عن بيئة الإنتاج، مما أدى إلى فقدان ظاهري للبيانات عند الترقية.
 * 
 * المجلدات القديمة المحتملة:
 * - نظام إدارة شركة المقاولات-Dev
 * - نظام إدارة شركة المقاولات
 * - DesktopManagementSystem-Dev
 * - أي اسم آخر كان يستخدم
 * 
 * المجلد الجديد الموحد:
 * - desktop-management-system-community
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * قائمة بأسماء المجلدات القديمة المحتملة
 */
const OLD_FOLDER_NAMES = [
  'desktop-management-system-community-Dev',  // المجلد الأساسي الذي يحتوي على البيانات الحقيقية
  'نظام إدارة شركة المقاولات-Dev',
  'نظام إدارة شركة المقاولات',
  'نظام_إدارة_شركة_المقاولات-Dev',
  'نظام_إدارة_شركة_المقاولات',
  'DesktopManagementSystem-Dev',
  'DesktopManagementSystem',
  'ConstructionSystem-Dev',
  'ConstructionSystem',
  'Desktop Management System (Community)'  // المجلد القديم جداً
];

/**
 * اسم المجلد الجديد الموحد
 */
const NEW_FOLDER_NAME = 'desktop-management-system-community';

/**
 * ملفات يجب نسخها (جميع الملفات)
 */
const FILES_TO_MIGRATE = [
  'Local Storage',      // localStorage files
  'IndexedDB',          // IndexedDB data
  'Session Storage',    // sessionStorage
  'databases',          // SQLite databases
  'Preferences',        // User preferences
  'logs',              // Application logs
  'backups',           // Backup files
  'Cache',             // Cache (optional)
];

/**
 * سجل عمليات Migration
 */
const migrationLog = [];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  migrationLog.push(logEntry);
  console.log(logEntry);
}

/**
 * البحث عن المجلد القديم الموجود
 */
async function findOldDataFolder(appDataPath) {
  log('🔍 البحث عن مجلد البيانات القديم...');
  
  for (const oldName of OLD_FOLDER_NAMES) {
    const oldPath = path.join(appDataPath, oldName);
    
    try {
      const exists = await fs.pathExists(oldPath);
      if (exists) {
        const stats = await fs.stat(oldPath);
        if (stats.isDirectory()) {
          log(`✅ تم العثور على المجلد القديم: ${oldName}`, 'success');
          return oldPath;
        }
      }
    } catch (error) {
      // تجاهل الأخطاء، المجلد قد لا يكون موجوداً
    }
  }
  
  log('ℹ️ لم يتم العثور على مجلد بيانات قديم', 'info');
  return null;
}

/**
 * التحقق من وجود بيانات في المجلد
 */
async function hasMeaningfulData(folderPath) {
  try {
    const items = await fs.readdir(folderPath);
    
    // التحقق من وجود ملفات بيانات فعلية
    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        // التحقق من المجلدات المهمة
        if (['Local Storage', 'IndexedDB', 'databases'].includes(item)) {
          const subItems = await fs.readdir(itemPath);
          if (subItems.length > 0) {
            return true;
          }
        }
      } else if (stats.size > 0) {
        // أي ملف بحجم أكبر من 0
        return true;
      }
    }
    
    return false;
  } catch (error) {
    log(`⚠️ خطأ في فحص المجلد: ${error.message}`, 'warning');
    return false;
  }
}

/**
 * نسخ البيانات من المجلد القديم إلى الجديد
 */
async function migrateData(oldPath, newPath) {
  log(`� نقل البيانات من ${path.basename(oldPath)} إلى ${path.basename(newPath)}...`, 'info');
  
  try {
    // التأكد من عدم وجود بيانات في المجلد الجديد
    const newPathExists = await fs.pathExists(newPath);
    
    if (newPathExists) {
      const hasData = await hasMeaningfulData(newPath);
      
      // التحقق: هل البيانات في المجلد الجديد هي نفسها القديمة؟
      if (hasData) {
        const oldSize = await getFolderSize(path.join(oldPath, 'Local Storage', 'leveldb'));
        const newSize = await getFolderSize(path.join(newPath, 'Local Storage', 'leveldb'));
        
        // إذا كان الحجم متطابق تقريباً، البيانات تم نقلها بالفعل
        if (Math.abs(oldSize - newSize) < 100000) { // فرق أقل من 100KB
          log('✅ البيانات موجودة بالفعل في المجلد الجديد (تم الترحيل مسبقاً)', 'success');
          return true;
        }
        
        log('⚠️ المجلد الجديد يحتوي على بيانات (بيانات تجريبية من v1.0.6)، سيتم استبدالها بالبيانات الحقيقية', 'warning');
        
        // حذف بيانات localStorage بشكل آمن (تجنب مشكلة lockfile)
        const localStoragePath = path.join(newPath, 'Local Storage', 'leveldb');
        if (await fs.pathExists(localStoragePath)) {
          try {
            // محاولة حذف ملفات LevelDB فقط (تجنب الملفات المقفلة)
            const files = await fs.readdir(localStoragePath);
            for (const file of files) {
              try {
                if (file.endsWith('.ldb') || file.endsWith('.log')) {
                  await fs.remove(path.join(localStoragePath, file));
                }
              } catch (err) {
                // تجاهل الملفات المقفلة
                log(`⚠️ تخطي ملف مقفل: ${file}`, 'warning');
              }
            }
            log('✅ تم حذف البيانات التجريبية', 'success');
          } catch (err) {
            log(`⚠️ بعض الملفات مقفلة، سيتم الكتابة فوقها: ${err.message}`, 'warning');
          }
        }
        
        // نسخ البيانات الحقيقية فوق الموجودة
        await fs.copy(oldPath, newPath, {
          overwrite: true
        });
        
        log('✅ تم نقل البيانات الحقيقية بنجاح', 'success');
      } else {
        // المجلد موجود لكنه فارغ، نسخ كل شيء
        await fs.copy(oldPath, newPath, {
          overwrite: true
        });
        
        log('✅ تم نسخ جميع البيانات بنجاح', 'success');
      }
    } else {
      // المجلد الجديد غير موجود، إنشاؤه ونسخ البيانات
      await fs.ensureDir(newPath);
      await fs.copy(oldPath, newPath);
      
      log('✅ تم نسخ جميع البيانات بنجاح', 'success');
    }
    
    // حساب حجم البيانات المنسوخة
    const size = await getFolderSize(newPath);
    log(`📊 حجم البيانات المنسوخة: ${formatBytes(size)}`, 'info');
    
    return true;
  } catch (error) {
    log(`❌ خطأ في نسخ البيانات: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * حساب حجم المجلد
 */
async function getFolderSize(folderPath) {
  let totalSize = 0;
  
  try {
    const items = await fs.readdir(folderPath);
    
    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        totalSize += await getFolderSize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // تجاهل الأخطاء
  }
  
  return totalSize;
}

/**
 * تنسيق الحجم بالبايتات
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * حفظ سجل Migration
 */
async function saveMigrationLog(appDataPath) {
  try {
    const logPath = path.join(appDataPath, NEW_FOLDER_NAME, 'migration-log.txt');
    await fs.writeFile(logPath, migrationLog.join('\n'), 'utf8');
    log(`📝 تم حفظ سجل Migration في: ${logPath}`, 'success');
  } catch (error) {
    log(`⚠️ فشل حفظ سجل Migration: ${error.message}`, 'warning');
  }
}

/**
 * الدالة الرئيسية للـ Migration
 */
async function migrateUserData(app) {
  log('🚀 بدء عملية Migration للبيانات...');
  
  try {
    const appDataPath = app.getPath('appData');
    log(`📂 مسار AppData: ${appDataPath}`);
    
    // البحث عن المجلد القديم
    const oldPath = await findOldDataFolder(appDataPath);
    
    if (!oldPath) {
      log('ℹ️ لا توجد بيانات قديمة للنقل، هذا تثبيت جديد', 'info');
      return { success: true, migrated: false, reason: 'no_old_data' };
    }
    
    // التحقق من وجود بيانات فعلية
    const hasData = await hasMeaningfulData(oldPath);
    
    if (!hasData) {
      log('ℹ️ المجلد القديم فارغ، لا حاجة للنقل', 'info');
      return { success: true, migrated: false, reason: 'old_folder_empty' };
    }
    
    // مسار المجلد الجديد
    const newPath = path.join(appDataPath, NEW_FOLDER_NAME);
    
    // التحقق: إذا كان المجلد القديم هو نفسه الجديد
    if (oldPath === newPath) {
      log('✅ المجلد القديم والجديد متطابقان، لا حاجة للنقل', 'success');
      return { success: true, migrated: false, reason: 'same_folder' };
    }
    
    // إنشاء نسخة احتياطية قبل Migration
    log('💾 إنشاء نسخة احتياطية...');
    const backupPath = `${oldPath}-backup-${Date.now()}`;
    await fs.copy(oldPath, backupPath);
    log(`✅ تم إنشاء نسخة احتياطية في: ${backupPath}`, 'success');
    
    // نقل البيانات
    await migrateData(oldPath, newPath);
    
    // حفظ سجل Migration
    await saveMigrationLog(appDataPath);
    
    log('🎉 اكتملت عملية Migration بنجاح!', 'success');
    
    return {
      success: true,
      migrated: true,
      oldPath,
      newPath,
      backupPath
    };
    
  } catch (error) {
    log(`❌ فشلت عملية Migration: ${error.message}`, 'error');
    log(`Stack: ${error.stack}`, 'error');
    
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  migrateUserData
};
