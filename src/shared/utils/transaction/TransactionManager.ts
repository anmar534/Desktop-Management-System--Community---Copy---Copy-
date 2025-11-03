/**
 * Transaction Manager
 *
 * @module shared/utils/transaction/TransactionManager
 * @description Provides transaction support with rollback capabilities
 *
 * Features:
 * - Track operations in a transaction
 * - Rollback on failure
 * - Commit on success
 * - Audit logging
 *
 * Usage:
 * ```typescript
 * const tx = new TransactionManager('save-pricing')
 *
 * try {
 *   // Execute operations with rollback functions
 *   await tx.execute(
 *     async () => { await saveData() },
 *     async () => { await restoreOldData() }
 *   )
 *
 *   await tx.execute(
 *     async () => { await syncBOQ() },
 *     async () => { await restoreOldBOQ() }
 *   )
 *
 *   await tx.commit() // Success
 * } catch (error) {
 *   await tx.rollback() // Automatic rollback all operations
 *   throw error
 * }
 * ```
 */

import { recordAuditEvent } from '../storage/auditLog'

/**
 * Operation in a transaction
 */
interface TransactionOperation {
  name: string
  execute: () => Promise<void>
  rollback: () => Promise<void>
  executedAt?: Date
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean
  operationsExecuted: number
  operationsRolledBack: number
  error?: Error
  duration: number
}

/**
 * Transaction Manager
 * Manages a series of operations with rollback capability
 */
export class TransactionManager {
  private operations: TransactionOperation[] = []
  private executedOperations: TransactionOperation[] = []
  private transactionId: string
  private startTime: Date
  private committed = false
  private rolledBack = false

  constructor(transactionName: string) {
    this.transactionId = `${transactionName}-${Date.now()}`
    this.startTime = new Date()

    recordAuditEvent({
      category: 'transaction',
      action: 'transaction-started',
      key: this.transactionId,
      level: 'info',
      metadata: { transactionName },
    })
  }

  /**
   * Add and execute an operation to the transaction
   *
   * @param execute - Function to execute
   * @param rollback - Function to rollback this operation
   * @param name - Operation name (for logging)
   */
  async execute(
    execute: () => Promise<void>,
    rollback: () => Promise<void>,
    name = `operation-${this.operations.length + 1}`,
  ): Promise<void> {
    if (this.committed) {
      throw new Error('Cannot execute operation: transaction already committed')
    }
    if (this.rolledBack) {
      throw new Error('Cannot execute operation: transaction already rolled back')
    }

    const operation: TransactionOperation = {
      name,
      execute,
      rollback,
    }

    this.operations.push(operation)

    try {
      await execute()
      operation.executedAt = new Date()
      this.executedOperations.push(operation)

      recordAuditEvent({
        category: 'transaction',
        action: 'operation-executed',
        key: this.transactionId,
        level: 'info',
        metadata: { operationName: name },
      })
    } catch (error) {
      recordAuditEvent({
        category: 'transaction',
        action: 'operation-failed',
        key: this.transactionId,
        level: 'error',
        status: 'error',
        metadata: {
          operationName: name,
          error: error instanceof Error ? error.message : 'unknown',
        },
      })
      throw error
    }
  }

  /**
   * Commit the transaction (mark as successful)
   */
  async commit(): Promise<TransactionResult> {
    if (this.committed) {
      throw new Error('Transaction already committed')
    }
    if (this.rolledBack) {
      throw new Error('Cannot commit: transaction was rolled back')
    }

    this.committed = true
    const duration = Date.now() - this.startTime.getTime()

    recordAuditEvent({
      category: 'transaction',
      action: 'transaction-committed',
      key: this.transactionId,
      level: 'info',
      metadata: {
        operationsExecuted: this.executedOperations.length,
        duration,
      },
    })

    return {
      success: true,
      operationsExecuted: this.executedOperations.length,
      operationsRolledBack: 0,
      duration,
    }
  }

  /**
   * Rollback all executed operations in reverse order
   */
  async rollback(): Promise<TransactionResult> {
    if (this.committed) {
      throw new Error('Cannot rollback: transaction already committed')
    }
    if (this.rolledBack) {
      throw new Error('Transaction already rolled back')
    }

    this.rolledBack = true
    const duration = Date.now() - this.startTime.getTime()
    let rolledBackCount = 0
    const errors: Error[] = []

    // Rollback in reverse order (LIFO)
    for (let i = this.executedOperations.length - 1; i >= 0; i--) {
      const operation = this.executedOperations[i]
      try {
        await operation.rollback()
        rolledBackCount++

        recordAuditEvent({
          category: 'transaction',
          action: 'operation-rolled-back',
          key: this.transactionId,
          level: 'info',
          metadata: { operationName: operation.name },
        })
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error('Rollback failed'))

        recordAuditEvent({
          category: 'transaction',
          action: 'rollback-failed',
          key: this.transactionId,
          level: 'error',
          status: 'error',
          metadata: {
            operationName: operation.name,
            error: error instanceof Error ? error.message : 'unknown',
          },
        })
      }
    }

    recordAuditEvent({
      category: 'transaction',
      action: 'transaction-rolled-back',
      key: this.transactionId,
      level: 'warning',
      metadata: {
        operationsExecuted: this.executedOperations.length,
        operationsRolledBack: rolledBackCount,
        rollbackErrors: errors.length,
        duration,
      },
    })

    return {
      success: false,
      operationsExecuted: this.executedOperations.length,
      operationsRolledBack: rolledBackCount,
      error: errors.length > 0 ? errors[0] : undefined,
      duration,
    }
  }

  /**
   * Get transaction status
   */
  getStatus(): {
    transactionId: string
    committed: boolean
    rolledBack: boolean
    operationsExecuted: number
    operationsTotal: number
  } {
    return {
      transactionId: this.transactionId,
      committed: this.committed,
      rolledBack: this.rolledBack,
      operationsExecuted: this.executedOperations.length,
      operationsTotal: this.operations.length,
    }
  }
}
