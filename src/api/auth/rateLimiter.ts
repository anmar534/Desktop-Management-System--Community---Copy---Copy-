/**
 * Rate Limiter Service
 * Sprint 5.3.2: تطوير نظام مصادقة وتفويض
 */

import type { RateLimitConfig, RateLimitInfo } from '../types'
import { RATE_LIMIT_CONFIG } from '../config'

// ============================================================================
// Types
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

type RateLimitStore = Record<string, RateLimitEntry>

// ============================================================================
// Rate Limiter Class
// ============================================================================

export class RateLimiter {
  private store: RateLimitStore = {}
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval to remove expired entries
    this.startCleanup()
  }

  /**
   * Check if request is allowed
   * التحقق من السماح بالطلب
   */
  async checkLimit(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIG.default,
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const now = Date.now()
    const entry = this.store[key]

    // If no entry exists, create one
    if (!entry) {
      this.store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      }

      return {
        allowed: true,
        info: {
          limit: config.maxRequests,
          remaining: config.maxRequests - 1,
          reset: Math.floor((now + config.windowMs) / 1000),
        },
      }
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      }

      return {
        allowed: true,
        info: {
          limit: config.maxRequests,
          remaining: config.maxRequests - 1,
          reset: Math.floor((now + config.windowMs) / 1000),
        },
      }
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

      return {
        allowed: false,
        info: {
          limit: config.maxRequests,
          remaining: 0,
          reset: Math.floor(entry.resetTime / 1000),
          retryAfter,
        },
      }
    }

    // Increment count
    entry.count++

    return {
      allowed: true,
      info: {
        limit: config.maxRequests,
        remaining: config.maxRequests - entry.count,
        reset: Math.floor(entry.resetTime / 1000),
      },
    }
  }

  /**
   * Get rate limit info for a key
   * الحصول على معلومات حد المعدل لمفتاح
   */
  getInfo(key: string, config: RateLimitConfig = RATE_LIMIT_CONFIG.default): RateLimitInfo {
    const entry = this.store[key]
    const now = Date.now()

    if (!entry || now > entry.resetTime) {
      return {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: Math.floor((now + config.windowMs) / 1000),
      }
    }

    return {
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      reset: Math.floor(entry.resetTime / 1000),
    }
  }

  /**
   * Reset rate limit for a key
   * إعادة تعيين حد المعدل لمفتاح
   */
  reset(key: string): void {
    delete this.store[key]
  }

  /**
   * Reset all rate limits
   * إعادة تعيين جميع حدود المعدل
   */
  resetAll(): void {
    this.store = {}
  }

  /**
   * Get all active rate limit entries
   * الحصول على جميع إدخالات حد المعدل النشطة
   */
  getActiveEntries(): { key: string; entry: RateLimitEntry }[] {
    const now = Date.now()
    return Object.entries(this.store)
      .filter(([, entry]) => now <= entry.resetTime)
      .map(([key, entry]) => ({ key, entry }))
  }

  /**
   * Start cleanup interval
   * بدء فترة التنظيف
   */
  private startCleanup(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  /**
   * Stop cleanup interval
   * إيقاف فترة التنظيف
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Clean up expired entries
   * تنظيف الإدخالات المنتهية
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of Object.entries(this.store)) {
      if (now > entry.resetTime) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => delete this.store[key])
  }

  /**
   * Destroy rate limiter
   * تدمير محدد المعدل
   */
  destroy(): void {
    this.stopCleanup()
    this.resetAll()
  }
}

// ============================================================================
// Default Rate Limiter Instance
// ============================================================================

export const rateLimiter = new RateLimiter()

// ============================================================================
// Rate Limiter Middleware Functions
// ============================================================================

/**
 * Generate rate limit key from request
 * إنشاء مفتاح حد المعدل من الطلب
 */
export function generateRateLimitKey(identifier: string, endpoint?: string): string {
  if (endpoint) {
    return `${identifier}:${endpoint}`
  }
  return identifier
}

/**
 * Check rate limit for user
 * التحقق من حد المعدل للمستخدم
 */
export async function checkUserRateLimit(
  userId: string,
  endpoint?: string,
  config?: RateLimitConfig,
): Promise<{ allowed: boolean; info: RateLimitInfo }> {
  const key = generateRateLimitKey(userId, endpoint)
  return rateLimiter.checkLimit(key, config)
}

/**
 * Check rate limit for API key
 * التحقق من حد المعدل لمفتاح API
 */
export async function checkApiKeyRateLimit(
  apiKeyId: string,
  endpoint?: string,
  customLimit?: number,
): Promise<{ allowed: boolean; info: RateLimitInfo }> {
  const key = generateRateLimitKey(apiKeyId, endpoint)

  const config: RateLimitConfig = customLimit
    ? {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: customLimit,
      }
    : RATE_LIMIT_CONFIG.default

  return rateLimiter.checkLimit(key, config)
}

/**
 * Check rate limit for IP address
 * التحقق من حد المعدل لعنوان IP
 */
export async function checkIpRateLimit(
  ipAddress: string,
  endpoint?: string,
  config?: RateLimitConfig,
): Promise<{ allowed: boolean; info: RateLimitInfo }> {
  const key = generateRateLimitKey(ipAddress, endpoint)
  return rateLimiter.checkLimit(key, config)
}

/**
 * Get rate limit headers
 * الحصول على رؤوس حد المعدل
 */
export function getRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': info.limit.toString(),
    'X-RateLimit-Remaining': info.remaining.toString(),
    'X-RateLimit-Reset': info.reset.toString(),
  }

  if (info.retryAfter !== undefined) {
    headers['Retry-After'] = info.retryAfter.toString()
  }

  return headers
}

/**
 * Create rate limit error response
 * إنشاء استجابة خطأ حد المعدل
 */
export function createRateLimitError(info: RateLimitInfo): {
  code: string
  message: string
  messageAr: string
  retryAfter?: number
} {
  return {
    code: '4001',
    message: 'Rate limit exceeded. Please try again later.',
    messageAr: 'تم تجاوز حد الطلبات. يرجى المحاولة مرة أخرى لاحقاً.',
    retryAfter: info.retryAfter,
  }
}
