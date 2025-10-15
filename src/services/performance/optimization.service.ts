/**
 * Optimization Service
 * خدمة التحسين
 * Sprint 5.6: التحسين النهائي والتجهيز للإنتاج
 */

import { MEMORY_MANAGEMENT, RENDERING_OPTIMIZATION } from '@/config/performance.config'

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  size: number
  hits: number
}

export interface MemoryStats {
  totalSize: number
  itemCount: number
  hitRate: number
  missRate: number
}

// ============================================================================
// Memory Cache
// ============================================================================

class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private hits = 0
  private misses = 0

  /**
   * Set cache entry
   * تعيين إدخال ذاكرة التخزين المؤقت
   */
  set<T>(key: string, value: T): void {
    const size = this.estimateSize(value)
    
    // Check if we need to evict entries
    if (this.cache.size >= MEMORY_MANAGEMENT.maxCacheItems) {
      this.evictLRU()
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      size,
      hits: 0,
    })
  }

  /**
   * Get cache entry
   * الحصول على إدخال ذاكرة التخزين المؤقت
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (entry) {
      entry.hits++
      entry.timestamp = Date.now()
      this.hits++
      return entry.value as T
    }

    this.misses++
    return null
  }

  /**
   * Check if key exists
   * التحقق من وجود المفتاح
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Delete cache entry
   * حذف إدخال ذاكرة التخزين المؤقت
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   * مسح جميع ذاكرة التخزين المؤقت
   */
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * Evict least recently used entry
   * إزالة الإدخال الأقل استخداماً مؤخراً
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Estimate size of value
   * تقدير حجم القيمة
   */
  private estimateSize(value: any): number {
    const str = JSON.stringify(value)
    return new Blob([str]).size
  }

  /**
   * Get memory statistics
   * الحصول على إحصائيات الذاكرة
   */
  getStats(): MemoryStats {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += entry.size
    }

    const total = this.hits + this.misses
    const hitRate = total > 0 ? this.hits / total : 0
    const missRate = total > 0 ? this.misses / total : 0

    return {
      totalSize,
      itemCount: this.cache.size,
      hitRate,
      missRate,
    }
  }

  /**
   * Get all entries
   * الحصول على جميع الإدخالات
   */
  getEntries(): CacheEntry[] {
    return Array.from(this.cache.values())
  }
}

// ============================================================================
// Debounce Function
// ============================================================================

/**
 * Debounce function execution
 * تأخير تنفيذ الدالة
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = RENDERING_OPTIMIZATION.debounceDelay
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

// ============================================================================
// Throttle Function
// ============================================================================

/**
 * Throttle function execution
 * تقييد تنفيذ الدالة
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = RENDERING_OPTIMIZATION.throttleDelay
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      func.apply(this, args)
    }
  }
}

// ============================================================================
// Request Animation Frame Wrapper
// ============================================================================

/**
 * Execute function on next animation frame
 * تنفيذ الدالة في الإطار التالي
 */
export function onNextFrame(callback: () => void): void {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(callback)
  } else {
    setTimeout(callback, 16) // ~60fps
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

class BatchProcessor<T = any> {
  private queue: T[] = []
  private processing = false
  private batchSize: number
  private processor: (items: T[]) => Promise<void>

  constructor(processor: (items: T[]) => Promise<void>, batchSize: number = 100) {
    this.processor = processor
    this.batchSize = batchSize
  }

  /**
   * Add item to queue
   * إضافة عنصر إلى قائمة الانتظار
   */
  add(item: T): void {
    this.queue.push(item)

    if (!this.processing) {
      this.process()
    }
  }

  /**
   * Process queue
   * معالجة قائمة الانتظار
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize)
      await this.processor(batch)
    }

    this.processing = false
  }

  /**
   * Get queue size
   * الحصول على حجم قائمة الانتظار
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Clear queue
   * مسح قائمة الانتظار
   */
  clear(): void {
    this.queue = []
  }
}

// ============================================================================
// Lazy Load Helper
// ============================================================================

/**
 * Create lazy loader for images
 * إنشاء محمل كسول للصور
 */
export function createLazyLoader(options?: IntersectionObserverInit): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01,
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement

        if (target.dataset.src) {
          target.src = target.dataset.src
          delete target.dataset.src
        }

        observer.unobserve(target)
      }
    })
  }, { ...defaultOptions, ...options })

  return observer
}

// ============================================================================
// Memory Monitor
// ============================================================================

class MemoryMonitor {
  private interval: NodeJS.Timeout | null = null

  /**
   * Start monitoring memory
   * بدء مراقبة الذاكرة
   */
  start(callback: (info: any) => void, intervalMs: number = 60000): void {
    if (this.interval) {
      this.stop()
    }

    this.interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        callback({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        })
      }
    }, intervalMs)
  }

  /**
   * Stop monitoring memory
   * إيقاف مراقبة الذاكرة
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

// ============================================================================
// Export Instances
// ============================================================================

export const memoryCache = new MemoryCache()
export const memoryMonitor = new MemoryMonitor()

export { BatchProcessor }

// ============================================================================
// Auto Cleanup
// ============================================================================

if (typeof window !== 'undefined') {
  // Clear cache on low memory
  if (MEMORY_MANAGEMENT.clearCacheOnLowMemory) {
    memoryMonitor.start((info) => {
      const usedMB = info.usedJSHeapSize / (1024 * 1024)
      
      if (usedMB > MEMORY_MANAGEMENT.lowMemoryThreshold) {
        console.warn('Low memory detected, clearing cache')
        memoryCache.clear()
      }
    })
  }

  // Periodic garbage collection
  if (MEMORY_MANAGEMENT.enableAutoGC) {
    setInterval(() => {
      const stats = memoryCache.getStats()
      
      // Remove entries with low hit rate
      const entries = memoryCache.getEntries()
      for (const entry of entries) {
        if (entry.hits === 0 && Date.now() - entry.timestamp > 5 * 60 * 1000) {
          memoryCache.delete(entry.key)
        }
      }
    }, MEMORY_MANAGEMENT.gcInterval)
  }
}

