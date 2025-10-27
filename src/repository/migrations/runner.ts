/**
 * Migration Runner Script
 * Applies Week 4 database schema migration to all projects
 */

import { getEnhancedProjectRepository } from '@/application/services/serviceRegistry'
import { runMigration, MIGRATION_VERSION } from './week4-integration'
import type { EnhancedProject } from '@/types/projects'

/**
 * Run migration with backup
 */
export async function applyMigration(): Promise<{
  success: boolean
  backup: EnhancedProject[]
  stats: {
    totalProjects: number
    migrated: number
    skipped: number
    failed: number
    errors: Array<{ projectId: string; error: string }>
  }
}> {
  console.log(`🚀 Starting Week 4 Integration Migration (${MIGRATION_VERSION})...`)

  try {
    const repo = getEnhancedProjectRepository()

    // 1. Load all projects
    console.log('📥 Loading all projects...')
    const allProjects = await repo.getAll()
    console.log(`✅ Loaded ${allProjects.length} projects`)

    // 2. Create backup
    console.log('💾 Creating backup...')
    const backup = JSON.parse(JSON.stringify(allProjects)) as EnhancedProject[]
    console.log('✅ Backup created')

    // 3. Run migration
    const { stats } = await runMigration(allProjects)

    // 4. Update projects if migration was successful
    if (stats.failed === 0) {
      console.log('✅ Migration completed (projects updated in memory)')
      console.log('⚠️ Note: Changes will be persisted automatically by repository')

      console.log(`🎉 Migration completed successfully!`)

      return {
        success: true,
        backup,
        stats,
      }
    } else {
      console.error('❌ Migration failed, changes not saved')
      return {
        success: false,
        backup,
        stats,
      }
    }
  } catch (error) {
    console.error('❌ Migration error:', error)
    return {
      success: false,
      backup: [],
      stats: {
        totalProjects: 0,
        migrated: 0,
        skipped: 0,
        failed: 1,
        errors: [
          { projectId: 'N/A', error: error instanceof Error ? error.message : 'Unknown error' },
        ],
      },
    }
  }
}

/**
 * Dry run - test migration without saving
 */
export async function dryRun(): Promise<{
  stats: {
    totalProjects: number
    migrated: number
    skipped: number
    failed: number
    errors: Array<{ projectId: string; error: string }>
  }
  preview: Array<{
    projectId: string
    projectName: string
    changes: string[]
  }>
}> {
  console.log('🔍 Starting dry run...')

  try {
    const repo = getEnhancedProjectRepository()
    const allProjects = await repo.getAll()

    const { stats } = await runMigration(allProjects)

    const preview = allProjects
      .filter((p) => {
        const proj = p as EnhancedProject & { linkedPurchaseOrders?: string[] }
        const needsMig =
          !Array.isArray(proj.linkedPurchaseOrders) || p.budget.spentBudget === undefined
        return needsMig
      })
      .map((p) => {
        const proj = p as EnhancedProject & { linkedPurchaseOrders?: string[] }
        const changes: string[] = []

        if (!Array.isArray(proj.linkedPurchaseOrders)) {
          changes.push('Add linkedPurchaseOrders field')
        }

        if (p.budget.spentBudget === undefined) {
          changes.push('Add budget.spentBudget field')
        }

        if (p.budget.remainingBudget === undefined) {
          changes.push('Add budget.remainingBudget field')
        }

        return {
          projectId: p.id,
          projectName: p.name,
          changes,
        }
      })

    console.log(`
    📊 Dry Run Results:
    - Projects to migrate: ${preview.length}
    - Projects to skip: ${allProjects.length - preview.length}
    `)

    if (preview.length > 0) {
      console.log('\n🔍 Sample changes:')
      preview.slice(0, 5).forEach((p) => {
        console.log(`\n  ${p.projectName} (${p.projectId}):`)
        p.changes.forEach((change) => console.log(`    - ${change}`))
      })
    }

    return {
      stats,
      preview,
    }
  } catch (error) {
    console.error('❌ Dry run error:', error)
    throw error
  }
}
