/**
 * Resilient Service Wrapper
 *
 * @module shared/utils/resilience/ResilientService
 * @description Provides retry logic with exponential backoff for service operations
 *
 * Features:
 * - Automatic retry on failure
 * - Exponential backoff strategy
 * - Configurable retry attempts
 * - Circuit breaker pattern (future)
 * - Logging and metrics
 *
 * Usage:
 * ```typescript
 * const resilient = new ResilientService({
 *   maxRetries: 3,
 *   baseDelay: 1000,
 *   maxDelay: 10000
 * })
 *
 * await resilient.execute(
 *   async () => await fetchData(),
 *   'fetch-data-operation'
 * )
 * ```
 */

import { recordAuditEvent } from '../storage/auditLog'

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number

  /** Base delay in milliseconds before first retry (default: 1000ms) */
  baseDelay?: number

  /** Maximum delay in milliseconds (default: 10000ms) */
  maxDelay?: number

  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number

  /** Jitter factor (0-1) to randomize delays (default: 0.1) */
  jitterFactor?: number

  /** Function to determine if error is retryable (default: retry all) */
  isRetryable?: (error: Error) => boolean
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean
  result?: T
  error?: Error
  attemptsUsed: number
  totalDuration: number
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  isRetryable: () => true, // Retry all errors by default
}

/**
 * Resilient Service Wrapper
 * Wraps service operations with retry logic and error recovery
 */
export class ResilientService {
  private options: Required<RetryOptions>

  constructor(options: RetryOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Execute an operation with retry logic
   *
   * @param operation - Async function to execute
   * @param operationName - Name for logging (default: 'operation')
   * @returns Promise with the operation result
   */
  async execute<T>(operation: () => Promise<T>, operationName = 'operation'): Promise<T> {
    const startTime = Date.now()
    let lastError: Error | undefined
    let attempt = 0

    while (attempt <= this.options.maxRetries) {
      try {
        // Execute the operation
        const result = await operation()

        // Log success
        if (attempt > 0) {
          recordAuditEvent({
            category: 'resilience',
            action: 'retry-succeeded',
            key: operationName,
            level: 'info',
            metadata: {
              attempt: attempt + 1,
              totalAttempts: this.options.maxRetries + 1,
              duration: Date.now() - startTime,
            },
          })
        }

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        attempt++

        // Check if we should retry
        if (attempt > this.options.maxRetries || !this.options.isRetryable(lastError)) {
          // No more retries or not retryable
          recordAuditEvent({
            category: 'resilience',
            action: 'retry-exhausted',
            key: operationName,
            level: 'error',
            status: 'error',
            metadata: {
              attempts: attempt,
              maxRetries: this.options.maxRetries,
              error: lastError.message,
              duration: Date.now() - startTime,
            },
          })
          throw lastError
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt)

        recordAuditEvent({
          category: 'resilience',
          action: 'retry-attempt',
          key: operationName,
          level: 'warning',
          metadata: {
            attempt,
            maxRetries: this.options.maxRetries,
            nextRetryIn: delay,
            error: lastError.message,
          },
        })

        // Wait before retrying
        await this.sleep(delay)
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('Retry failed')
  }

  /**
   * Execute with full result details (for advanced use cases)
   */
  async executeWithDetails<T>(
    operation: () => Promise<T>,
    operationName = 'operation',
  ): Promise<RetryResult<T>> {
    const startTime = Date.now()

    try {
      const result = await this.execute(operation, operationName)
      return {
        success: true,
        result,
        attemptsUsed: 1, // TODO: Track actual attempts
        totalDuration: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        attemptsUsed: this.options.maxRetries + 1,
        totalDuration: Date.now() - startTime,
      }
    }
  }

  /**
   * Calculate delay for retry with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (multiplier ^ (attempt - 1))
    let delay = this.options.baseDelay * Math.pow(this.options.backoffMultiplier, attempt - 1)

    // Apply max delay cap
    delay = Math.min(delay, this.options.maxDelay)

    // Add jitter (randomness) to prevent thundering herd
    const jitter = delay * this.options.jitterFactor * Math.random()
    delay = delay + jitter

    return Math.floor(delay)
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Update retry options
   */
  updateOptions(options: Partial<RetryOptions>): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Get current options
   */
  getOptions(): Readonly<Required<RetryOptions>> {
    return { ...this.options }
  }
}

/**
 * Helper: Create a resilient wrapper for a specific service
 *
 * @example
 * ```typescript
 * const resilientFetch = createResilient({
 *   maxRetries: 5,
 *   isRetryable: (error) => error.message.includes('network')
 * })
 *
 * const data = await resilientFetch(
 *   async () => await fetch('/api/data'),
 *   'fetch-api-data'
 * )
 * ```
 */
export function createResilient(options: RetryOptions = {}) {
  const service = new ResilientService(options)
  return <T>(operation: () => Promise<T>, name?: string) => service.execute(operation, name)
}
