/**
 * ConflictError - Optimistic Locking Conflict Detection
 *
 * This error is thrown when attempting to update a Tender that has been
 * modified by another user/process since it was last read.
 *
 * Phase 5: Security and Reliability
 * Related: TENDER_SYSTEM_ENHANCEMENT_PLAN.md Phase 5.1
 */

import type { Tender } from '@/data/centralData'

export type ConflictResolutionStrategy = 'merge' | 'overwrite' | 'cancel' | 'manual'

export interface ConflictDetails {
  message: string
  current: Tender // Current version in database
  attempted: Partial<Tender> // Version user tried to save
  conflictingFields?: string[] // Fields that differ
  resolution?: ConflictResolutionStrategy
}

/**
 * Error thrown when optimistic locking detects a conflict
 *
 * Example:
 * ```typescript
 * try {
 *   await tenderRepository.update(tender)
 * } catch (error) {
 *   if (error instanceof ConflictError) {
 *     // Show conflict resolution UI
 *     showConflictDialog(error.details)
 *   }
 * }
 * ```
 */
export class ConflictError extends Error {
  public readonly details: ConflictDetails

  constructor(details: ConflictDetails) {
    super(details.message)
    this.name = 'ConflictError'
    this.details = details

    // Maintain proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConflictError)
    }
  }

  /**
   * Get human-readable conflict summary
   */
  getConflictSummary(): string {
    const { current, attempted } = this.details

    // Type assertion for version control fields
    const currentWithVersion = current as Tender & {
      version?: number
      lastModified?: Date
      lastModifiedBy?: string
    }
    const attemptedWithVersion = attempted as Partial<Tender> & {
      version?: number
      lastModified?: Date
      lastModifiedBy?: string
    }

    return `
      Conflict detected for Tender: ${current.title} (${current.id})
      Current version: ${currentWithVersion.version ?? 'unknown'}
      Attempted version: ${attemptedWithVersion.version ?? 'unknown'}
      Last modified by: ${currentWithVersion.lastModifiedBy ?? 'unknown'}
      Last modified at: ${currentWithVersion.lastModified ?? 'unknown'}
    `.trim()
  }

  /**
   * Detect which fields have conflicts
   */
  getConflictingFields(): string[] {
    if (this.details.conflictingFields) {
      return this.details.conflictingFields
    }

    const conflicts: string[] = []
    const { current, attempted } = this.details

    // Compare relevant fields
    const fieldsToCheck: Array<keyof Tender> = [
      'status',
      'value',
      'deadline',
      'priority',
      'winChance',
      'progress',
      'notes',
      'requirements',
    ]

    for (const field of fieldsToCheck) {
      const currentValue = current[field]
      const attemptedValue = attempted[field]

      if (attemptedValue !== undefined && currentValue !== attemptedValue) {
        conflicts.push(field as string)
      }
    }

    return conflicts
  }

  /**
   * Check if conflict can be auto-merged
   */
  canAutoMerge(): boolean {
    const conflicts = this.getConflictingFields()

    // Auto-merge only if conflicts are in non-critical fields
    const nonCriticalFields = ['notes', 'lastAction']
    return conflicts.every((field) => nonCriticalFields.includes(field))
  }

  /**
   * Attempt automatic merge
   */
  autoMerge(): Tender {
    if (!this.canAutoMerge()) {
      throw new Error('Cannot auto-merge: conflicts in critical fields')
    }

    const { current, attempted } = this.details

    // Type assertion for version control fields
    const currentWithVersion = current as Tender & {
      version?: number
      lastModified?: Date
      lastModifiedBy?: string
    }

    // Merge: take current as base, apply non-conflicting changes from attempted
    return {
      ...current,
      ...attempted,
      version: (currentWithVersion.version ?? 0) + 1,
      lastModified: new Date(),
      // Preserve critical fields from current
      id: current.id,
      createdAt: current.createdAt,
    } as Tender
  }
}

/**
 * Helper function to create ConflictError with field detection
 */
export function createConflictError(
  current: Tender,
  attempted: Partial<Tender>,
  message?: string,
): ConflictError {
  const error = new ConflictError({
    message: message || 'تم تحديث المنافسة من مكان آخر',
    current,
    attempted,
  })

  // Auto-detect conflicting fields
  error.details.conflictingFields = error.getConflictingFields()

  return error
}
