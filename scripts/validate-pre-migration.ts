/**
 * Pre-Migration Validation Script
 *
 * Phase 5.1.2 - Step 1: Validate data before migration
 *
 * This script validates that:
 * 1. All tenders exist and are accessible
 * 2. No tenders already have version fields
 * 3. Data integrity is intact
 * 4. Backup is created before migration
 *
 * Usage:
 *   npm run validate:pre-migration
 *
 * Related: TENDER_SYSTEM_ENHANCEMENT_PLAN.md Phase 5.1.2
 */

import fs from 'fs/promises'
import path from 'path'
import type { Tender } from '../src/types/contracts'

interface PreMigrationReport {
  totalTenders: number
  tendersWithVersion: number // Should be 0
  tendersWithoutVersion: number // Should equal totalTenders
  dataIntegrityIssues: string[]
  backupCreated: boolean
  backupPath?: string
  readyForMigration: boolean
  timestamp: string
}

const DATA_PATH = path.join(process.cwd(), 'app-data', 'tenders.json')
const BACKUP_DIR = path.join(process.cwd(), 'backups', 'phase5')

/**
 * Load all tenders from storage
 */
async function getAllTenders(): Promise<Tender[]> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8')
    const tenders = JSON.parse(data)
    return Array.isArray(tenders) ? tenders : []
  } catch (error) {
    console.error('❌ Error loading tenders:', error)
    throw new Error(`Failed to load tenders from ${DATA_PATH}`)
  }
}

/**
 * Validate single tender data integrity
 */
function validateTender(tender: Tender, index: number): string[] {
  const issues: string[] = []

  // Required fields
  if (!tender.id) {
    issues.push(`Tender at index ${index}: missing 'id' field`)
  }

  if (!tender.title && !tender.name) {
    issues.push(`Tender ${tender.id || index}: missing both 'title' and 'name'`)
  }

  if (!tender.status) {
    issues.push(`Tender ${tender.id || index}: missing 'status' field`)
  }

  if (typeof tender.value !== 'number') {
    issues.push(`Tender ${tender.id || index}: 'value' is not a number`)
  }

  if (!tender.createdAt) {
    issues.push(`Tender ${tender.id || index}: missing 'createdAt' timestamp`)
  }

  // Check for unexpected version fields
  if ('version' in tender) {
    issues.push(`Tender ${tender.id || index}: already has 'version' field (unexpected)`)
  }

  return issues
}

/**
 * Create backup before migration
 */
async function createBackup(tenders: Tender[]): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFilename = `tenders_pre-phase5_${timestamp}.json`

  // Ensure backup directory exists
  await fs.mkdir(BACKUP_DIR, { recursive: true })

  const backupPath = path.join(BACKUP_DIR, backupFilename)

  // Write backup with pretty formatting
  await fs.writeFile(backupPath, JSON.stringify(tenders, null, 2), 'utf-8')

  // Also create a metadata file
  const metadataPath = path.join(BACKUP_DIR, `${backupFilename}.meta.json`)
  await fs.writeFile(
    metadataPath,
    JSON.stringify(
      {
        timestamp,
        totalTenders: tenders.length,
        backupType: 'pre-phase5-migration',
        dataPath: DATA_PATH,
      },
      null,
      2,
    ),
    'utf-8',
  )

  return backupPath
}

/**
 * Main validation function
 */
async function validatePreMigration(): Promise<PreMigrationReport> {
  console.log('🔍 Phase 5 Pre-Migration Validation Started...\n')

  const timestamp = new Date().toISOString()

  try {
    // 1. Load all tenders
    console.log('📂 Loading tenders from storage...')
    const tenders = await getAllTenders()
    console.log(`✅ Loaded ${tenders.length} tenders\n`)

    // 2. Check for existing version fields
    console.log('🔎 Checking for existing version fields...')
    const tendersWithVersion = tenders.filter((t) => 'version' in t)

    if (tendersWithVersion.length > 0) {
      console.error(`❌ Found ${tendersWithVersion.length} tenders with version field!`)
      console.error('   This is unexpected. Migration may have already run.')
      console.error('   Affected tender IDs:', tendersWithVersion.map((t) => t.id).slice(0, 10))

      return {
        totalTenders: tenders.length,
        tendersWithVersion: tendersWithVersion.length,
        tendersWithoutVersion: tenders.length - tendersWithVersion.length,
        dataIntegrityIssues: ['Some tenders already have version field'],
        backupCreated: false,
        readyForMigration: false,
        timestamp,
      }
    }
    console.log('✅ No tenders have version field (as expected)\n')

    // 3. Validate data integrity
    console.log('🧪 Validating data integrity...')
    const allIssues: string[] = []

    tenders.forEach((tender, index) => {
      const issues = validateTender(tender, index)
      allIssues.push(...issues)
    })

    if (allIssues.length > 0) {
      console.error(`❌ Found ${allIssues.length} data integrity issues:`)
      allIssues.slice(0, 20).forEach((issue) => {
        console.error(`   - ${issue}`)
      })

      if (allIssues.length > 20) {
        console.error(`   ... and ${allIssues.length - 20} more issues`)
      }

      return {
        totalTenders: tenders.length,
        tendersWithVersion: 0,
        tendersWithoutVersion: tenders.length,
        dataIntegrityIssues: allIssues,
        backupCreated: false,
        readyForMigration: false,
        timestamp,
      }
    }
    console.log('✅ All tenders pass data integrity checks\n')

    // 4. Create backup
    console.log('📦 Creating backup...')
    const backupPath = await createBackup(tenders)
    console.log(`✅ Backup created: ${backupPath}\n`)

    // 5. Final report
    const report: PreMigrationReport = {
      totalTenders: tenders.length,
      tendersWithVersion: 0,
      tendersWithoutVersion: tenders.length,
      dataIntegrityIssues: [],
      backupCreated: true,
      backupPath,
      readyForMigration: true,
      timestamp,
    }

    console.log('═══════════════════════════════════════')
    console.log('✅ PRE-MIGRATION VALIDATION SUCCESSFUL')
    console.log('═══════════════════════════════════════')
    console.log(`Total Tenders: ${report.totalTenders}`)
    console.log(`Backup Path: ${backupPath}`)
    console.log(`Ready for Migration: YES ✅`)
    console.log('═══════════════════════════════════════\n')

    // Save report
    const reportPath = path.join(
      BACKUP_DIR,
      `pre-migration-report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    )
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8')
    console.log(`📄 Report saved: ${reportPath}\n`)

    return report
  } catch (error) {
    console.error('❌ Validation failed with error:', error)
    throw error
  }
}

// Run validation if executed directly
if (require.main === module) {
  validatePreMigration()
    .then((report) => {
      process.exit(report.readyForMigration ? 0 : 1)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { validatePreMigration, type PreMigrationReport }
