/**
 * Database Schema Migration - Week 4 Integration
 * Migration Script for Tender-Project and PO-Project Linking
 *
 * Changes:
 * 1. Add linkedPurchaseOrders array to EnhancedProject interface
 * 2. Ensure tenderLink and fromTender fields are properly initialized
 * 3. Add cost tracking fields to ProjectBudget
 * 4. Validate data integrity after migration
 */

import type { EnhancedProject } from '@/types/projects'

/**
 * Migration version
 */
export const MIGRATION_VERSION = '2025-01-27-week4-integration'

/**
 * Check if project needs migration
 */
export function needsMigration(project: EnhancedProject): boolean {
  // Check if linkedPurchaseOrders field exists
  if (!Array.isArray(project.linkedPurchaseOrders)) {
    return true
  }

  // Check if budget has all required fields
  if (!project.budget.spentBudget && project.budget.spentBudget !== 0) {
    return true
  }

  return false
}

/**
 * Migrate single project to new schema
 */
export function migrateProject(project: EnhancedProject): EnhancedProject {
  const migrated = { ...project }

  // 1. Add linkedPurchaseOrders if missing
  if (!Array.isArray(migrated.linkedPurchaseOrders)) {
    migrated.linkedPurchaseOrders = []
  }

  // 2. Ensure tenderLink is properly formatted
  if (migrated.tenderLink && typeof migrated.tenderLink === 'object') {
    // Validate tenderLink structure
    if (!migrated.tenderLink.id || !migrated.tenderLink.tenderId) {
      console.warn(`Project ${project.id}: Invalid tenderLink structure`)
      migrated.tenderLink = undefined
    }
  }

  // 3. Ensure fromTender is properly formatted
  if (migrated.fromTender && typeof migrated.fromTender === 'object') {
    // Validate fromTender structure
    if (!migrated.fromTender.tenderId || !migrated.fromTender.tenderName) {
      console.warn(`Project ${project.id}: Invalid fromTender structure`)
      migrated.fromTender = undefined
    }
  }

  // 4. Add budget fields if missing
  if (!migrated.budget.spentBudget && migrated.budget.spentBudget !== 0) {
    migrated.budget.spentBudget = 0
  }

  if (!migrated.budget.remainingBudget && migrated.budget.remainingBudget !== 0) {
    migrated.budget.remainingBudget = migrated.budget.allocatedBudget || 0
  }

  if (!migrated.budget.spendRate && migrated.budget.spendRate !== 0) {
    migrated.budget.spendRate = 0
  }

  // 5. Update version
  migrated.version = (migrated.version || 0) + 1
  migrated.updatedAt = new Date().toISOString()
  migrated.lastModifiedBy = 'System Migration'

  return migrated
}

/**
 * Validate migrated project
 */
export function validateMigratedProject(project: EnhancedProject): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check required fields
  if (!Array.isArray(project.linkedPurchaseOrders)) {
    errors.push('linkedPurchaseOrders must be an array')
  }

  // Check budget fields
  if (typeof project.budget.allocatedBudget !== 'number') {
    errors.push('budget.allocatedBudget must be a number')
  }

  if (typeof project.budget.spentBudget !== 'number') {
    errors.push('budget.spentBudget must be a number')
  }

  if (typeof project.budget.remainingBudget !== 'number') {
    errors.push('budget.remainingBudget must be a number')
  }

  // Check tenderLink if exists
  if (project.tenderLink) {
    if (!project.tenderLink.id) {
      errors.push('tenderLink.id is required')
    }
    if (!project.tenderLink.tenderId) {
      errors.push('tenderLink.tenderId is required')
    }
    if (!project.tenderLink.projectId) {
      errors.push('tenderLink.projectId is required')
    }
  }

  // Check fromTender if exists
  if (project.fromTender) {
    if (!project.fromTender.tenderId) {
      errors.push('fromTender.tenderId is required')
    }
    if (!project.fromTender.tenderName) {
      errors.push('fromTender.tenderName is required')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Migration statistics
 */
export interface MigrationStats {
  totalProjects: number
  migrated: number
  skipped: number
  failed: number
  errors: Array<{ projectId: string; error: string }>
}

/**
 * Run migration on all projects
 */
export async function runMigration(projects: EnhancedProject[]): Promise<{
  migratedProjects: EnhancedProject[]
  stats: MigrationStats
}> {
  const stats: MigrationStats = {
    totalProjects: projects.length,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  const migratedProjects: EnhancedProject[] = []

  console.log(`🔄 Starting migration for ${projects.length} projects...`)

  for (const project of projects) {
    try {
      // Check if migration is needed
      if (!needsMigration(project)) {
        migratedProjects.push(project)
        stats.skipped++
        continue
      }

      // Migrate project
      const migrated = migrateProject(project)

      // Validate migration
      const validation = validateMigratedProject(migrated)
      if (!validation.isValid) {
        console.error(
          `❌ Migration validation failed for project ${project.id}:`,
          validation.errors,
        )
        stats.failed++
        stats.errors.push({
          projectId: project.id,
          error: validation.errors.join(', '),
        })
        // Keep original project
        migratedProjects.push(project)
        continue
      }

      migratedProjects.push(migrated)
      stats.migrated++
      console.log(`✅ Migrated project ${project.id}`)
    } catch (error) {
      console.error(`❌ Error migrating project ${project.id}:`, error)
      stats.failed++
      stats.errors.push({
        projectId: project.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      // Keep original project
      migratedProjects.push(project)
    }
  }

  console.log(`
  📊 Migration Complete:
  - Total: ${stats.totalProjects}
  - Migrated: ${stats.migrated}
  - Skipped: ${stats.skipped}
  - Failed: ${stats.failed}
  `)

  if (stats.errors.length > 0) {
    console.error('❌ Migration errors:')
    stats.errors.forEach((err) => {
      console.error(`  - ${err.projectId}: ${err.error}`)
    })
  }

  return {
    migratedProjects,
    stats,
  }
}

/**
 * Rollback migration (restore from backup)
 */
export function rollbackMigration(backup: EnhancedProject[]): EnhancedProject[] {
  console.log(`🔄 Rolling back migration for ${backup.length} projects...`)
  return backup.map((project) => ({
    ...project,
    version: (project.version || 0) + 1,
    updatedAt: new Date().toISOString(),
    lastModifiedBy: 'System Rollback',
  }))
}
