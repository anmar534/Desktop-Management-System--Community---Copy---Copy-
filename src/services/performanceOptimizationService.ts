/**
 * Performance Optimization Service
 * خدمة تحسين الأداء
 */

import { asyncStorage } from '../utils/storage'

export interface PerformanceMetrics {
  id: string
  timestamp: string
  operation: string
  duration: number
  memoryUsage: number
  cacheHitRate: number
  queryCount: number
  errorRate: number
  userAgent: string
  sessionId: string
}

export interface CacheEntry<T = any> {
  key: string
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

export interface OptimizationConfig {
  cacheEnabled: boolean
  cacheTTL: number
  maxCacheSize: number
  enableMetrics: boolean
  enableQueryOptimization: boolean
  enableComponentOptimization: boolean
  enableMemoryOptimization: boolean
}

class PerformanceOptimizationService {
  private cache = new Map<string, CacheEntry>()
  private metrics: PerformanceMetrics[] = []
  private config: OptimizationConfig = {
    cacheEnabled: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 100,
    enableMetrics: true,
    enableQueryOptimization: true,
    enableComponentOptimization: true,
    enableMemoryOptimization: true
  }

  /**
   * تحسين أداء الاستعلامات
   */
  async optimizeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      // التحقق من الكاش أولاً
      if (this.config.cacheEnabled && !options?.forceRefresh) {
        const cached = this.getFromCache<T>(queryKey)
        if (cached) {
          this.recordMetrics('cache_hit', performance.now() - startTime)
          return cached
        }
      }

      // تنفيذ الاستعلام
      const result = await queryFn()
      
      // حفظ في الكاش
      if (this.config.cacheEnabled) {
        this.setCache(queryKey, result, options?.ttl)
      }

      this.recordMetrics('query_execution', performance.now() - startTime)
      return result

    } catch (error) {
      this.recordMetrics('query_error', performance.now() - startTime, true)
      throw error
    }
  }

  /**
   * تحسين أداء المكونات
   */
  optimizeComponent<T extends Record<string, any>>(
    componentName: string,
    props: T,
    dependencies: (keyof T)[]
  ): { shouldUpdate: boolean; optimizedProps: T } {
    const cacheKey = `component_${componentName}_${JSON.stringify(dependencies.map(dep => props[dep]))}`
    
    // التحقق من تغيير الخصائص المهمة فقط
    const cached = this.getFromCache<T>(cacheKey)
    const shouldUpdate = !cached || dependencies.some(dep => cached[dep] !== props[dep])

    if (shouldUpdate) {
      this.setCache(cacheKey, props, 60000) // 1 minute cache
    }

    return {
      shouldUpdate,
      optimizedProps: shouldUpdate ? props : cached || props
    }
  }

  /**
   * تحسين استخدام الذاكرة
   */
  optimizeMemory(): void {
    // تنظيف الكاش المنتهي الصلاحية
    this.cleanExpiredCache()
    
    // تنظيف المقاييس القديمة
    this.cleanOldMetrics()
    
    // تشغيل garbage collection إذا كان متاحاً
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc()
    }
  }

  /**
   * الحصول من الكاش
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    
    // التحقق من انتهاء الصلاحية
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // تحديث إحصائيات الوصول
    entry.accessCount++
    entry.lastAccessed = now

    return entry.data as T
  }

  /**
   * حفظ في الكاش
   */
  private setCache<T>(key: string, data: T, ttl?: number): void {
    // التحقق من حجم الكاش
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictLeastUsed()
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL,
      accessCount: 1,
      lastAccessed: Date.now()
    }

    this.cache.set(key, entry)
  }

  /**
   * إزالة العناصر الأقل استخداماً
   */
  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let leastAccessCount = Infinity
    let oldestAccess = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastAccessCount || 
          (entry.accessCount === leastAccessCount && entry.lastAccessed < oldestAccess)) {
        leastUsedKey = key
        leastAccessCount = entry.accessCount
        oldestAccess = entry.lastAccessed
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  /**
   * تنظيف الكاش المنتهي الصلاحية
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key))
  }

  /**
   * تسجيل المقاييس
   */
  private recordMetrics(operation: string, duration: number, isError = false): void {
    if (!this.config.enableMetrics) return

    const metric: PerformanceMetrics = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operation,
      duration,
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate: this.calculateCacheHitRate(),
      queryCount: this.metrics.filter(m => m.operation.includes('query')).length,
      errorRate: isError ? 1 : 0,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      sessionId: this.getSessionId()
    }

    this.metrics.push(metric)
  }

  /**
   * تنظيف المقاييس القديمة
   */
  private cleanOldMetrics(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    this.metrics = this.metrics.filter(metric => 
      new Date(metric.timestamp).getTime() > oneHourAgo
    )
  }

  /**
   * حساب معدل نجاح الكاش
   */
  private calculateCacheHitRate(): number {
    const cacheMetrics = this.metrics.filter(m => m.operation.includes('cache'))
    const hits = cacheMetrics.filter(m => m.operation === 'cache_hit').length
    const total = cacheMetrics.length
    
    return total > 0 ? (hits / total) * 100 : 0
  }

  /**
   * الحصول على استخدام الذاكرة
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0
    }
    return 0
  }

  /**
   * الحصول على معرف الجلسة
   */
  private getSessionId(): string {
    if (typeof sessionStorage !== 'undefined') {
      let sessionId = sessionStorage.getItem('performance_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('performance_session_id', sessionId)
      }
      return sessionId
    }
    return 'unknown'
  }

  /**
   * الحصول على تقرير الأداء
   */
  getPerformanceReport(): {
    cacheStats: {
      size: number
      hitRate: number
      totalEntries: number
    }
    metrics: {
      averageQueryTime: number
      totalQueries: number
      errorRate: number
      memoryUsage: number
    }
    recommendations: string[]
  } {
    const queryMetrics = this.metrics.filter(m => m.operation.includes('query'))
    const averageQueryTime = queryMetrics.length > 0 
      ? queryMetrics.reduce((sum, m) => sum + m.duration, 0) / queryMetrics.length 
      : 0

    const errorMetrics = this.metrics.filter(m => m.errorRate > 0)
    const errorRate = this.metrics.length > 0 
      ? (errorMetrics.length / this.metrics.length) * 100 
      : 0

    const recommendations: string[] = []
    
    if (averageQueryTime > 1000) {
      recommendations.push('تحسين استعلامات قاعدة البيانات - الوقت المتوسط مرتفع')
    }
    
    if (this.calculateCacheHitRate() < 50) {
      recommendations.push('تحسين استراتيجية التخزين المؤقت - معدل النجاح منخفض')
    }
    
    if (errorRate > 5) {
      recommendations.push('مراجعة معالجة الأخطاء - معدل الأخطاء مرتفع')
    }

    return {
      cacheStats: {
        size: this.cache.size,
        hitRate: this.calculateCacheHitRate(),
        totalEntries: this.cache.size
      },
      metrics: {
        averageQueryTime,
        totalQueries: queryMetrics.length,
        errorRate,
        memoryUsage: this.getMemoryUsage()
      },
      recommendations
    }
  }

  /**
   * تحديث إعدادات التحسين
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * إعادة تعيين الكاش والمقاييس
   */
  reset(): void {
    this.cache.clear()
    this.metrics = []
  }
}

export const performanceOptimizationService = new PerformanceOptimizationService()
