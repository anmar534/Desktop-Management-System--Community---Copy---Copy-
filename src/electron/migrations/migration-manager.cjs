/**
 * Migration Manager for Electron App
 * يدير ترحيل البيانات تلقائياً عند تحديث التطبيق
 * 
 * @module MigrationManager
 * @description
 * يتحقق من إصدار البيانات ويشغل Migrations المطلوبة تلقائياً
 * عند بدء التطبيق. يضمن توافق البيانات مع الإصدار الجديد.
 */

const { readFileSync, writeFileSync, existsSync } = require('fs')
const { readFile, writeFile } = require('fs').promises
const { join } = require('path')
const { app } = require('electron')

// ===========================
// Configuration
// ===========================

/**
 * الحصول على مسار بيانات التطبيق
 */
function getDataPath() {
  return app.getPath('userData')
}

/**
 * الحصول على مسار ملف حالة الـ Migrations
 */
function getMigrationStatePath() {
  return join(getDataPath(), 'migration-state.json')
}

/**
 * الحصول على مسار مجلد النسخ الاحتياطية
 */
function getBackupPath() {
  const backupDir = join(getDataPath(), 'backups', 'migrations')
  if (!existsSync(backupDir)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mkdirSync } = require('fs')
    mkdirSync(backupDir, { recursive: true })
  }
  return backupDir
}

// ===========================
// Version Comparison
// ===========================

/**
 * مقارنة رقمين إصدار (Semantic Versioning)
 * @returns 1 إذا v1 > v2, -1 إذا v1 < v2, 0 إذا متساويان
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0

    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }

  return 0
}

// ===========================
// Migration State Management
// ===========================

/**
 * قراءة حالة الـ Migration الحالية
 */
function readMigrationState() {
  const statePath = getMigrationStatePath()

  if (!existsSync(statePath)) {
    // إذا لم يكن موجود، ارجع الحالة الافتراضية
    return {
      version: '1.0.0',
      lastMigration: 'initial',
      timestamp: new Date().toISOString(),
      appliedMigrations: [],
    }
  }

  try {
    const content = readFileSync(statePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('❌ Failed to read migration state:', error)
    // ارجع الحالة الافتراضية
    return {
      version: '1.0.0',
      lastMigration: 'initial',
      timestamp: new Date().toISOString(),
      appliedMigrations: [],
    }
  }
}

/**
 * كتابة حالة الـ Migration الجديدة
 */
function writeMigrationState(state) {
  const statePath = getMigrationStatePath()

  try {
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8')
  } catch (error) {
    console.error('❌ Failed to write migration state:', error)
    throw error
  }
}

// ===========================
// Backup Management
// ===========================

/**
 * إنشاء نسخة احتياطية كاملة من البيانات
 */
async function createFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = getBackupPath()
  const backupFile = join(backupDir, `backup-${timestamp}.json`)

  console.log(`💾 Creating backup: ${backupFile}`)

  try {
    // اجمع كل البيانات المهمة
    const dataPath = getDataPath()
    const tendersPath = join(dataPath, 'tenders.json')
    const storePath = join(dataPath, 'config.json')

    const backup = {
      timestamp,
      version: app.getVersion(),
      files: {
        tenders: undefined,
        config: undefined,
      },
    }

    // انسخ ملف المنافسات (async)
    try {
      const tendersData = await readFile(tendersPath, 'utf-8')
      backup.files.tenders = JSON.parse(tendersData)
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`⚠️ Tenders file not found: ${tendersPath}`)
      } else if (error instanceof SyntaxError) {
        console.error(`❌ Failed to parse tenders JSON from ${tendersPath}:`, error.message)
        throw error
      } else {
        console.error(`⚠️ Failed to read tenders file ${tendersPath}:`, error)
      }
    }

    // انسخ الإعدادات (async)
    try {
      const configData = await readFile(storePath, 'utf-8')
      backup.files.config = JSON.parse(configData)
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`⚠️ Config file not found or inaccessible: ${storePath}`)
      } else if (error instanceof SyntaxError) {
        console.error(`❌ Failed to parse config JSON from ${storePath}:`, error)
        throw error
      } else {
        console.log(`⚠️ Config file not found or inaccessible: ${storePath}`)
      }
    }

    // احفظ النسخة الاحتياطية (async)
    await writeFile(backupFile, JSON.stringify(backup, null, 2), 'utf-8')

    console.log(`✅ Backup created successfully`)

    return backupFile
  } catch (error) {
    console.error('❌ Failed to create backup:', error)
    throw error
  }
}

/**
 * استعادة من نسخة احتياطية
 */
async function restoreFromBackup(backupPath) {
  console.log(`🔄 Restoring from backup: ${backupPath}`)

  try {
    // Read backup file asynchronously
    const backupData = await readFile(backupPath, 'utf-8')
    const backup = JSON.parse(backupData)
    
    // Validate backup structure
    if (!backup || typeof backup !== 'object') {
      const errorMsg = 'Invalid backup: backup is not an object'
      console.error(`❌ ${errorMsg}`)
      throw new Error(errorMsg)
    }
    
    if (!backup.files || typeof backup.files !== 'object') {
      const errorMsg = 'Invalid backup: backup.files is missing or not an object'
      console.error(`❌ ${errorMsg}`)
      throw new Error(errorMsg)
    }
    
    const dataPath = getDataPath()
    let restoredCount = 0

    // استعد ملف المنافسات (async)
    if (backup.files.tenders !== undefined) {
      if (!Array.isArray(backup.files.tenders)) {
        console.warn('⚠️ Skipping tenders restore: not an array')
      } else {
        const tendersPath = join(dataPath, 'tenders.json')
        await writeFile(tendersPath, JSON.stringify(backup.files.tenders, null, 2), 'utf-8')
        restoredCount++
      }
    } else {
      console.warn('⚠️ No tenders data in backup')
    }

    // استعد الإعدادات (async)
    if (backup.files.config !== undefined) {
      if (typeof backup.files.config !== 'object' || backup.files.config === null || Array.isArray(backup.files.config)) {
        console.warn('⚠️ Skipping config restore: not a plain object')
      } else {
        const storePath = join(dataPath, 'config.json')
        await writeFile(storePath, JSON.stringify(backup.files.config, null, 2), 'utf-8')
        restoredCount++
      }
    } else {
      console.warn('⚠️ No config data in backup')
    }

    if (restoredCount === 0) {
      console.warn('⚠️ No files were restored from backup')
    } else {
      console.log(`✅ Backup restored successfully (${restoredCount} file(s))`)
    }
  } catch (error) {
    console.error('❌ Failed to restore backup:', error)
    throw error
  }
}

// ===========================
// Migration Registry
// ===========================

/**
 * قائمة بجميع الـ Migrations (مرتبة حسب الإصدار)
 * 
 * ⚠️ مهم: يجب إضافة كل migration جديد هنا
 */
const MIGRATIONS = [
  {
    version: '1.1.0',
    name: 'add-tender-version-fields',
    description: 'إضافة حقول version control للمنافسات (Phase 5.1)',
    execute: async () => {
      try {
        const { backfillTenderVersions } = require('./phase5-backfill.cjs')

        const result = await backfillTenderVersions({ dryRun: false })

        return {
          success: result,
          message: result
            ? 'تم إضافة version fields لجميع المنافسات'
            : 'فشلت عملية الترحيل',
        }
      } catch (error) {
        return {
          success: false,
          error: (error && error.message) ? error.message : String(error),
        }
      }
    },
  },
  
  // ⚠️ Migrations المستقبلية تضاف هنا
  // مثال:
  // {
  //   version: '1.2.0',
  //   name: 'add-another-feature',
  //   description: 'إضافة ميزة أخرى',
  //   execute: async () => { ... }
  // }
]

// ===========================
// Main Migration Logic
// ===========================

/**
 * التحقق من الـ Migrations وتشغيل المطلوبة منها
 * 
 * @returns نتيجة عملية الترحيل
 */
async function checkAndRunMigrations() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔄 Migration Manager Starting...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. اقرأ حالة الـ Migration الحالية
  const currentState = readMigrationState()
  const currentDataVersion = currentState.version
  const appVersion = app.getVersion()

  console.log(`📊 Current data version: ${currentDataVersion}`)
  console.log(`📦 App version: ${appVersion}`)
  console.log(`📋 Applied migrations: ${currentState.appliedMigrations.length}`)

  // 2. حدد أي Migrations يجب تطبيقها
  const pendingMigrations = MIGRATIONS.filter(
    (m) =>
      compareVersions(m.version, currentDataVersion) > 0 &&
      !currentState.appliedMigrations.includes(m.name),
  )

  if (pendingMigrations.length === 0) {
    console.log('✅ No migrations needed - data is up to date\n')
    return {
      success: true,
      migrationsRun: 0,
    }
  }

  console.log(`\n🔄 Found ${pendingMigrations.length} pending migration(s):`)
  pendingMigrations.forEach((m) => {
    console.log(`   • ${m.name} (v${m.version}): ${m.description}`)
  })

  // 3. أنشئ backup قبل أي تعديل
  let backupPath
  try {
    backupPath = await createFullBackup()
  } catch (error) {
    console.error('❌ Failed to create backup - aborting migrations')
    console.error(error) // Log full error for debugging
    return {
      success: false,
      migrationsRun: 0,
      error: {
        message: String(error?.message || error),
        name: String(error?.name || 'Error'),
      },
    }
  }

  // 4. شغّل كل Migration بالترتيب
  let migrationsRun = 0

  for (const migration of pendingMigrations) {
    console.log(`\n➡️  Running migration: ${migration.name}`)
    console.log(`   Version: ${migration.version}`)
    console.log(`   Description: ${migration.description}`)

    try {
      const result = await migration.execute()

      if (!result.success) {
        console.error(`❌ Migration failed: ${migration.name}`)
        if (result.error) {
          console.error(`   Error:`, result.error) // Log full error for debugging
        }

        // استعد من النسخة الاحتياطية
        console.log('\n🔄 Rolling back to backup...')
        await restoreFromBackup(backupPath)

        return {
          success: false,
          migrationsRun,
          failedMigration: migration.name,
          error: {
            message: String(result.error?.message || result.error),
            name: String(result.error?.name || 'MigrationError'),
          },
          backupPath,
        }
      }

      console.log(`✅ Migration successful: ${migration.name}`)
      if (result.message) {
        console.log(`   ${result.message}`)
      }

      // حدّث حالة الـ Migration
      currentState.version = migration.version
      currentState.lastMigration = migration.name
      currentState.timestamp = new Date().toISOString()
      currentState.appliedMigrations.push(migration.name)

      writeMigrationState(currentState)

      migrationsRun++
    } catch (error) {
      console.error(`💥 Unexpected error in migration: ${migration.name}`)
      console.error(error) // Log full error with stack trace for debugging

      // استعد من النسخة الاحتياطية
      console.log('\n🔄 Rolling back to backup...')
      await restoreFromBackup(backupPath)

      return {
        success: false,
        migrationsRun,
        failedMigration: migration.name,
        error: {
          message: String(error?.message || error),
          name: String(error?.name || 'Error'),
        },
        backupPath,
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ All migrations completed successfully!`)
  console.log(`   Migrations run: ${migrationsRun}`)
  console.log(`   New data version: ${currentState.version}`)
  console.log(`   Backup: ${backupPath}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  return {
    success: true,
    migrationsRun,
    backupPath,
  }
}

/**
 * فرض تشغيل migration معينة (للاختبار/الصيانة)
 */
async function runMigration(migrationName) {
  const migration = MIGRATIONS.find((m) => m.name === migrationName)

  if (!migration) {
    return {
      success: false,
      error: new Error(`Migration not found: ${migrationName}`),
    }
  }

  console.log(`🔧 Manually running migration: ${migrationName}`)

  try {
    const result = await migration.execute()
    return result
  } catch (error) {
    return {
      success: false,
      error: error,
    }
  }
}

/**
 * الحصول على حالة الـ Migrations الحالية
 */
function getMigrationStatus() {
  const state = readMigrationState()
  return {
    ...state,
    appVersion: app.getVersion(),
  }
}

// ===========================
// Exports
// ===========================

module.exports = {
  checkAndRunMigrations,
  runMigration,
  getMigrationStatus,
}
