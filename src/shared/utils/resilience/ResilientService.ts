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
  private lastAttemptsUsed = 0

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
      attempt++ // Increment attempt counter at the start of each iteration

      try {
        // Execute the operation
        const result = await operation()

        // Store actual attempts used for successful operation
        this.lastAttemptsUsed = attempt

        // Log success
        if (attempt > 1) {
          recordAuditEvent({
            category: 'resilience',
            action: 'retry-succeeded',
            key: operationName,
            level: 'info',
            metadata: {
              attempt,
              totalAttempts: this.options.maxRetries + 1,
              duration: Date.now() - startTime,
            },
          })
        }

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Check if we should retry
        if (attempt > this.options.maxRetries || !this.options.isRetryable(lastError)) {
          // No more retries or not retryable
          // Store actual attempts used for failed operation
          this.lastAttemptsUsed = attempt

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
    // Store attempts in case we somehow reach here
    this.lastAttemptsUsed = attempt
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
        attemptsUsed: this.lastAttemptsUsed, // Use tracked actual attempts
        totalDuration: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        attemptsUsed: this.lastAttemptsUsed, // Use tracked actual attempts
        totalDuration: Date.now() - startTime,
      }
    }
  }

  /**
   * Calculate delay for retry with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (multiplier ^ (attempt - 1))
    const baseDelay = this.options.baseDelay * Math.pow(this.options.backoffMultiplier, attempt - 1)

    // Add jitter (randomness) to prevent thundering herd
    // Jitter is calculated from the base delay before capping
    const jitter = baseDelay * this.options.jitterFactor * Math.random()
    const delayWithJitter = baseDelay + jitter

    // Apply max delay cap AFTER adding jitter to ensure we never exceed the limit
    const cappedDelay = Math.min(delayWithJitter, this.options.maxDelay)

    return Math.floor(cappedDelay)
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
