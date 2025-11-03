/**
 * Phase 5.1 Migration: Add Version Fields to Tenders
 * إضافة حقول version control للمنافسات الموجودة
 * 
 * @module Phase5Backfill
 * @description
 * يضيف version, lastModified, lastModifiedBy لكل منافسة موجودة
 * يعمل تلقائياً عند ترقية التطبيق من v1.0.x إلى v1.1.0+
 */

const { readFileSync, writeFileSync, existsSync } = require('fs')
const { join } = require('path')
const { app } = require('electron')

// ===========================
// Configuration
// ===========================

/**
 * الحصول على مسار ملف المنافسات
 */
function getTendersFilePath() {
  const dataPath = app.getPath('userData')
  return join(dataPath, 'tenders.json')
}

// ===========================
// Data Access
// ===========================

/**
 * قراءة جميع المنافسات من الملف
 */
function loadTenders() {
  const tendersPath = getTendersFilePath()

  if (!existsSync(tendersPath)) {
    console.log('ℹ️  No tenders file found - creating empty array')
    return []
  }

  try {
    const content = readFileSync(tendersPath, 'utf-8')
    const data = JSON.parse(content)

    if (!Array.isArray(data)) {
      console.error('❌ Invalid tenders data format - expected array')
      throw new Error('Tenders data is not an array')
    }

    return data
  } catch (error) {
    console.error('❌ Failed to load tenders:', error)
    throw error
  }
}

/**
 * حفظ المنافسات في الملف
 */
function saveTenders(tenders) {
  const tendersPath = getTendersFilePath()

  try {
    writeFileSync(tendersPath, JSON.stringify(tenders, null, 2), 'utf-8')
  } catch (error) {
    console.error('❌ Failed to save tenders:', error)
    throw error
  }
}

// ===========================
// Migration Logic
// ===========================

/**
 * إضافة version fields لمنافسة واحدة
 */
function addVersionFields(tender) {
  // إذا عندها version مسبقاً، ارجعها كما هي
  if ('version' in tender && tender.version !== undefined) {
    return tender
  }

  // أضف الحقول الجديدة
  return {
    ...tender,
    version: 1, // البداية من version 1
    lastModified: new Date(),
    lastModifiedBy: 'system-migration',
  }
}

/**
 * تنفيذ عملية الـ Backfill
 */
async function backfillTenderVersions(options = {}) {
  const { dryRun = false } = options

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔄 Phase 5.1 Migration: Add Version Fields')
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'EXECUTE (will modify data)'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  try {
    // 1. تحميل المنافسات
    console.log('📦 Loading tenders...')
    const tenders = loadTenders()
    stats.total = tenders.length

    console.log(`   Found ${tenders.length} tender(s)`)

    if (tenders.length === 0) {
      console.log('ℹ️  No tenders to migrate')
      return true
    }

    // 2. التحقق من حاجة الترحيل
    const alreadyMigrated = tenders.every((t) => 'version' in t && t.version !== undefined)

    if (alreadyMigrated) {
      console.log('✅ All tenders already have version fields - migration not needed')
      stats.skipped = tenders.length
      printStats(stats)
      return true
    }

    // 3. معالجة كل منافسة
    console.log('\n🔄 Processing tenders...')

    const updatedTenders = tenders.map((tender, index) => {
      try {
        // تحقق إذا عندها version مسبقاً
        if ('version' in tender && tender.version !== undefined) {
          stats.skipped++
          return tender
        }

        // أضف version fields
        const updated = addVersionFields(tender)
        stats.updated++

        // اطبع تقدم كل 100 منافسة
        if ((index + 1) % 100 === 0) {
          console.log(`   Processed ${index + 1}/${tenders.length}...`)
        }

        return updated
      } catch (error) {
        const errorMsg = `Failed to process tender ${tender.id || index}: ${
          error instanceof Error ? error.message : String(error)
        }`
        stats.errors.push(errorMsg)
        console.error(`   ⚠️  ${errorMsg}`)
        return tender // ارجع المنافسة الأصلية إذا فشلت
      }
    })

    console.log(`   Completed processing ${tenders.length} tender(s)`)

    // 4. الحفظ (إلا إذا كان dry-run)
    if (!dryRun) {
      console.log('\n💾 Saving updated tenders...')
      saveTenders(updatedTenders)
      console.log('✅ Tenders saved successfully')
    } else {
      console.log('\n🧪 DRY RUN - No changes written to disk')
    }

    // 5. التحقق من النجاح
    if (!dryRun) {
      console.log('\n🔍 Verifying migration...')

      const reloaded = loadTenders()
      const allHaveVersion = reloaded.every((t) => 'version' in t && t.version !== undefined)

      if (!allHaveVersion) {
        throw new Error('Post-migration verification failed: some tenders still missing version')
      }

      console.log('✅ Verification passed - all tenders have version fields')
    }

    // 6. طباعة الإحصائيات
    printStats(stats)

    // نجحت العملية إذا لم تكن هناك أخطاء
    return stats.errors.length === 0
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    stats.errors.push(error instanceof Error ? error.message : String(error))
    printStats(stats)
    return false
  }
}

/**
 * طباعة إحصائيات الترحيل
 */
function printStats(stats) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Migration Statistics')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   Total tenders:   ${stats.total}`)
  console.log(`   Updated:         ${stats.updated}`)
  console.log(`   Skipped:         ${stats.skipped}`)
  console.log(`   Errors:          ${stats.errors.length}`)

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:')
    stats.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`)
    })
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

// ===========================
// Manual Testing (if needed)
// ===========================

/**
 * دالة مساعدة للاختبار اليدوي
 * يمكن استدعاءها من Console للاختبار
 */
async function testBackfill(dryRun = true) {
  console.log('🧪 Testing Phase 5.1 Migration...\n')

  const result = await backfillTenderVersions({ dryRun })

  if (result) {
    console.log('✅ Test completed successfully')
  } else {
    console.log('❌ Test failed')
  }
}

// ===========================
// Exports
// ===========================

module.exports = {
  backfillTenderVersions,
  testBackfill,
}
