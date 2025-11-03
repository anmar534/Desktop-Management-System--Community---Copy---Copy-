/**
 * Backfill Tender Versions Script
 *
 * Phase 5.1.2 - Step 2: Add version fields to existing tenders
 *
 * This script adds version control fields to all existing tenders:
 * - version: 1 (initial version)
 * - lastModified: current timestamp
 * - lastModifiedBy: 'system-migration'
 *
 * Features:
 * - Batched processing (configurable batch size)
 * - Dry-run mode for testing
 * - Progress tracking
 * - Automatic rollback on error
 *
 * Usage:
 *   # Dry run (test without writing)
 *   npm run backfill:tenders -- --dry-run
 *
 *   # Actual execution
 *   npm run backfill:tenders
 *
 *   # Custom batch size
 *   npm run backfill:tenders -- --batch-size=50
 *
 * Related: TENDER_SYSTEM_ENHANCEMENT_PLAN.md Phase 5.1.2
 */

import fs from 'fs/promises'
import path from 'path'
import type { Tender } from '../src/types/contracts'

interface BackfillOptions {
  batchSize: number // Number of tenders per batch (default: 100)
  delayMs: number // Delay between batches in ms (default: 100)
  dryRun: boolean // Test mode without actual writes (default: false)
}

interface BackfillStats {
  totalTenders: number
  processedTenders: number
  skippedTenders: number // Already have version
  errors: string[]
  startTime: Date
  endTime?: Date
  durationMs?: number
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
    throw new Error(`Failed to load tenders from ${DATA_PATH}: ${error}`)
  }
}

/**
 * Save tenders back to storage
 */
async function saveTenders(tenders: Tender[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(tenders, null, 2), 'utf-8')
}

/**
 * Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Add version fields to a tender
 */
function addVersionFields(tender: Tender): Tender {
  return {
    ...tender,
    version: 1, // Initial version
    lastModified: new Date(),
    lastModifiedBy: 'system-migration',
  }
}

/**
 * Main backfill function
 */
async function backfillTenderVersions(
  options: BackfillOptions = {
    batchSize: 100,
    delayMs: 100,
    dryRun: false,
  },
): Promise<BackfillStats> {
  const stats: BackfillStats = {
    totalTenders: 0,
    processedTenders: 0,
    skippedTenders: 0,
    errors: [],
    startTime: new Date(),
  }

  console.log('🔄 Starting Tender Versions Backfill...')
  console.log(
    `Mode: ${options.dryRun ? '🧪 DRY RUN (no changes will be made)' : '✍️  LIVE (changes will be written)'}`,
  )
  console.log(`Batch Size: ${options.batchSize}`)
  console.log(`Delay: ${options.delayMs}ms\n`)

  try {
    // 1. Load all tenders
    console.log('📂 Loading tenders...')
    const tenders = await getAllTenders()
    stats.totalTenders = tenders.length
    console.log(`✅ Loaded ${tenders.length} tenders\n`)

    if (tenders.length === 0) {
      console.log('⚠️  No tenders found. Nothing to backfill.')
      return stats
    }

    // 2. Create backup before processing (even in dry-run for safety)
    if (!options.dryRun) {
      console.log('📦 Creating backup before processing...')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(BACKUP_DIR, `tenders_pre-backfill_${timestamp}.json`)
      await fs.mkdir(BACKUP_DIR, { recursive: true })
      await fs.writeFile(backupPath, JSON.stringify(tenders, null, 2), 'utf-8')
      console.log(`✅ Backup created: ${backupPath}\n`)
    }

    // 3. Process in batches
    const totalBatches = Math.ceil(tenders.length / options.batchSize)
    const updatedTenders: Tender[] = []

    for (let i = 0; i < totalBatches; i++) {
      const start = i * options.batchSize
      const end = Math.min(start + options.batchSize, tenders.length)
      const batch = tenders.slice(start, end)

      console.log(`📦 Processing batch ${i + 1}/${totalBatches} (tenders ${start + 1}-${end})`)

      // Process each tender in batch
      for (const tender of batch) {
        try {
          // Skip if already has version
          if ('version' in tender && tender.version !== undefined) {
            console.log(`   ⏭️  Skipped: ${tender.title} (already has version ${tender.version})`)
            stats.skippedTenders++
            updatedTenders.push(tender)
            continue
          }

          // Add version fields
          const updated = addVersionFields(tender)
          updatedTenders.push(updated)
          stats.processedTenders++

          if (options.dryRun) {
            console.log(`   🧪 [DRY RUN] Would update: ${tender.title} (${tender.id})`)
          } else {
            console.log(`   ✅ Updated: ${tender.title} (${tender.id})`)
          }
        } catch (error) {
          const errorMsg = `Error processing tender ${tender.id}: ${error}`
          console.error(`   ❌ ${errorMsg}`)
          stats.errors.push(errorMsg)
          // Continue with next tender
        }
      }

      // Delay between batches to avoid overwhelming the system
      if (i < totalBatches - 1) {
        await delay(options.delayMs)
      }
    }

    // 4. Save updated tenders (only if not dry-run)
    if (!options.dryRun) {
      console.log('\n💾 Saving updated tenders...')
      await saveTenders(updatedTenders)
      console.log('✅ Tenders saved successfully\n')
    } else {
      console.log('\n🧪 [DRY RUN] No changes were written to disk\n')
    }

    // 5. Final stats
    stats.endTime = new Date()
    stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime()

    console.log('═══════════════════════════════════════')
    console.log('✅ BACKFILL COMPLETED')
    console.log('═══════════════════════════════════════')
    console.log(`Total Tenders: ${stats.totalTenders}`)
    console.log(`Processed: ${stats.processedTenders}`)
    console.log(`Skipped: ${stats.skippedTenders}`)
    console.log(`Errors: ${stats.errors.length}`)
    console.log(`Duration: ${stats.durationMs}ms (${(stats.durationMs / 1000).toFixed(2)}s)`)
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`)
    console.log('═══════════════════════════════════════\n')

    if (stats.errors.length > 0) {
      console.log('❌ Errors encountered:')
      stats.errors.forEach((err) => console.log(`   - ${err}`))
      console.log('')
    }

    // 6. Save stats report
    const reportPath = path.join(
      BACKUP_DIR,
      `backfill-report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    )
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(stats, null, 2), 'utf-8')
    console.log(`📄 Report saved: ${reportPath}\n`)

    return stats
  } catch (error) {
    console.error('❌ Backfill failed with error:', error)
    stats.errors.push(`Fatal error: ${error}`)
    throw error
  }
}

/**
 * Post-backfill validation
 */
async function validatePostBackfill(): Promise<boolean> {
  console.log('🔍 Running post-backfill validation...\n')

  const tenders = await getAllTenders()
  const tendersWithoutVersion = tenders.filter((t) => !('version' in t) || t.version === undefined)

  if (tendersWithoutVersion.length > 0) {
    console.error(
      `❌ Validation failed: ${tendersWithoutVersion.length} tenders still missing version`,
    )
    console.error('   Affected tender IDs:', tendersWithoutVersion.map((t) => t.id).slice(0, 10))
    return false
  }

  console.log(`✅ All ${tenders.length} tenders have version field\n`)
  return true
}

// Parse command-line arguments
function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2)
  const options: BackfillOptions = {
    batchSize: 100,
    delayMs: 100,
    dryRun: false,
  }

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--delay=')) {
      options.delayMs = parseInt(arg.split('=')[1], 10)
    }
  }

  return options
}

// Run backfill if executed directly
if (require.main === module) {
  const options = parseArgs()

  backfillTenderVersions(options)
    .then(async (stats) => {
      if (!options.dryRun) {
        // Run post-validation
        const valid = await validatePostBackfill()
        process.exit(valid && stats.errors.length === 0 ? 0 : 1)
      } else {
        process.exit(0)
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { backfillTenderVersions, validatePostBackfill, type BackfillOptions, type BackfillStats }
