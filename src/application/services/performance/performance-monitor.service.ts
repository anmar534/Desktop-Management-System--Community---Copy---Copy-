/**
 * Performance Monitor Service
 * خدمة مراقبة الأداء
 * Sprint 5.6: التحسين النهائي والتجهيز للإنتاج
 */

import { PERFORMANCE_THRESHOLDS, getPerformanceRating } from '@/config/performance.config'

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: Date
}

export interface PerformanceReport {
  metrics: PerformanceMetric[]
  summary: {
    good: number
    needsImprovement: number
    poor: number
  }
  timestamp: Date
}

// ============================================================================
// Performance Monitor
// ============================================================================

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observer: PerformanceObserver | null = null

  /**
   * Initialize performance monitoring
   * تهيئة مراقبة الأداء
   */
  initialize(): void {
    if (typeof window === 'undefined' || !window.performance) {
      console.warn('Performance API not available')
      return
    }

    // Observe performance entries
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordEntry(entry)
        }
      })

      // Observe different entry types
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'measure'] })
    } catch (error) {
      console.error('Failed to initialize PerformanceObserver:', error)
    }

    // Record Web Vitals
    this.recordWebVitals()
  }

  /**
   * Record performance entry
   * تسجيل إدخال الأداء
   */
  private recordEntry(entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration || (entry as any).value || 0,
      rating: this.getRating(entry),
      timestamp: new Date(),
    }

    this.metrics.push(metric)

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  /**
   * Get rating for performance entry
   * الحصول على تقييم لإدخال الأداء
   */
  private getRating(entry: PerformanceEntry): 'good' | 'needs-improvement' | 'poor' {
    const value = entry.duration || (entry as any).value || 0

    // Map entry types to threshold keys
    if (entry.entryType === 'paint') {
      if (entry.name === 'first-contentful-paint') {
        return getPerformanceRating('FCP', value)
      }
    }

    // Default to good if no specific threshold
    return 'good'
  }

  /**
   * Record Web Vitals
   * تسجيل Web Vitals
   */
  private recordWebVitals(): void {
    // First Contentful Paint (FCP)
    this.observePaint('first-contentful-paint', 'FCP')

    // Largest Contentful Paint (LCP)
    this.observeLCP()

    // First Input Delay (FID)
    this.observeFID()

    // Cumulative Layout Shift (CLS)
    this.observeCLS()
  }

  /**
   * Observe paint timing
   * مراقبة توقيت الرسم
   */
  private observePaint(name: string, metricName: string): void {
    const paintEntries = performance.getEntriesByType('paint')
    const entry = paintEntries.find((e) => e.name === name)

    if (entry) {
      this.metrics.push({
        name: metricName,
        value: entry.startTime,
        rating: getPerformanceRating('FCP', entry.startTime),
        timestamp: new Date(),
      })
    }
  }

  /**
   * Observe Largest Contentful Paint
   * مراقبة أكبر رسم للمحتوى
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any

        if (lastEntry) {
          this.metrics.push({
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            rating: getPerformanceRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
            timestamp: new Date(),
          })
        }
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (error) {
      console.warn('LCP observation not supported')
    }
  }

  /**
   * Observe First Input Delay
   * مراقبة تأخير الإدخال الأول
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstInput = entries[0] as any

        if (firstInput) {
          const fid = firstInput.processingStart - firstInput.startTime

          this.metrics.push({
            name: 'FID',
            value: fid,
            rating: getPerformanceRating('FID', fid),
            timestamp: new Date(),
          })
        }
      })

      observer.observe({ entryTypes: ['first-input'] })
    } catch (error) {
      console.warn('FID observation not supported')
    }
  }

  /**
   * Observe Cumulative Layout Shift
   * مراقبة التحول التراكمي للتخطيط
   */
  private observeCLS(): void {
    try {
      let clsValue = 0

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }

        this.metrics.push({
          name: 'CLS',
          value: clsValue,
          rating: getPerformanceRating('CLS', clsValue),
          timestamp: new Date(),
        })
      })

      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (error) {
      console.warn('CLS observation not supported')
    }
  }

  /**
   * Mark custom timing
   * تحديد توقيت مخصص
   */
  mark(name: string): void {
    if (typeof window === 'undefined' || !window.performance) return

    try {
      performance.mark(name)
    } catch (error) {
      console.error('Failed to mark performance:', error)
    }
  }

  /**
   * Measure custom timing
   * قياس توقيت مخصص
   */
  measure(name: string, startMark: string, endMark?: string): void {
    if (typeof window === 'undefined' || !window.performance) return

    try {
      performance.measure(name, startMark, endMark)

      const measures = performance.getEntriesByName(name, 'measure')
      const measure = measures[measures.length - 1]

      if (measure) {
        this.metrics.push({
          name,
          value: measure.duration,
          rating: 'good',
          timestamp: new Date(),
        })
      }
    } catch (error) {
      console.error('Failed to measure performance:', error)
    }
  }

  /**
   * Get all metrics
   * الحصول على جميع المقاييس
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics by name
   * الحصول على المقاييس بالاسم
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Get performance report
   * الحصول على تقرير الأداء
   */
  getReport(): PerformanceReport {
    const summary = {
      good: 0,
      needsImprovement: 0,
      poor: 0,
    }

    for (const metric of this.metrics) {
      if (metric.rating === 'good') summary.good++
      else if (metric.rating === 'needs-improvement') summary.needsImprovement++
      else summary.poor++
    }

    return {
      metrics: [...this.metrics],
      summary,
      timestamp: new Date(),
    }
  }

  /**
   * Clear all metrics
   * مسح جميع المقاييس
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Disconnect observer
   * فصل المراقب
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const performanceMonitor = new PerformanceMonitor()

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  performanceMonitor.initialize()
}
