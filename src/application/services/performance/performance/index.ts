/**
 * Performance Services
 * خدمات الأداء
 * Sprint 5.6: التحسين النهائي والتجهيز للإنتاج
 */

export { performanceMonitor, type PerformanceMetric, type PerformanceReport } from './performance-monitor.service'
export {
  memoryCache,
  memoryMonitor,
  debounce,
  throttle,
  onNextFrame,
  createLazyLoader,
  BatchProcessor,
  type CacheEntry,
  type MemoryStats,
} from './optimization.service'

