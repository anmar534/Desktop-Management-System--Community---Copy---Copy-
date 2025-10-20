/**
 * Performance Configuration
 * إعدادات الأداء
 * Sprint 5.6: التحسين النهائي والتجهيز للإنتاج
 */

// ============================================================================
// Performance Thresholds
// ============================================================================

export const PERFORMANCE_THRESHOLDS = {
  /** First Contentful Paint (FCP) - milliseconds */
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  
  /** Largest Contentful Paint (LCP) - milliseconds */
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  
  /** First Input Delay (FID) - milliseconds */
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  
  /** Cumulative Layout Shift (CLS) - score */
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  
  /** Time to Interactive (TTI) - milliseconds */
  TTI: {
    good: 3800,
    needsImprovement: 7300,
  },
  
  /** Total Blocking Time (TBT) - milliseconds */
  TBT: {
    good: 200,
    needsImprovement: 600,
  },
} as const

// ============================================================================
// Code Splitting Configuration
// ============================================================================

export const CODE_SPLITTING = {
  /** Enable route-based code splitting */
  enableRouteSplitting: true,
  
  /** Enable component-based code splitting */
  enableComponentSplitting: true,
  
  /** Minimum chunk size for splitting (bytes) */
  minChunkSize: 20000,
  
  /** Maximum chunk size (bytes) */
  maxChunkSize: 244000,
  
  /** Prefetch priority routes */
  prefetchRoutes: [
    '/dashboard',
    '/tenders',
    '/projects',
    '/financial',
  ],
} as const

// ============================================================================
// Lazy Loading Configuration
// ============================================================================

export const LAZY_LOADING = {
  /** Enable image lazy loading */
  enableImageLazyLoading: true,
  
  /** Enable component lazy loading */
  enableComponentLazyLoading: true,
  
  /** Intersection observer root margin */
  rootMargin: '50px',
  
  /** Intersection observer threshold */
  threshold: 0.01,
  
  /** Components to lazy load */
  lazyComponents: [
    'Charts',
    'Reports',
    'Analytics',
    'ExcelProcessor',
    'PDFViewer',
  ],
} as const

// ============================================================================
// Caching Configuration
// ============================================================================

export const CACHING = {
  /** Enable service worker caching */
  enableServiceWorker: true,
  
  /** Cache version */
  cacheVersion: 'v1',
  
  /** Cache name */
  cacheName: 'dms-cache-v1',
  
  /** Cache strategies */
  strategies: {
    /** Static assets - Cache First */
    static: {
      pattern: /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp)$/,
      strategy: 'CacheFirst',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    
    /** API calls - Network First */
    api: {
      pattern: /\/api\//,
      strategy: 'NetworkFirst',
      maxAge: 5 * 60, // 5 minutes
    },
    
    /** HTML - Network First */
    html: {
      pattern: /\.html$/,
      strategy: 'NetworkFirst',
      maxAge: 24 * 60 * 60, // 1 day
    },
  },
} as const

// ============================================================================
// Memory Management
// ============================================================================

export const MEMORY_MANAGEMENT = {
  /** Maximum items in memory cache */
  maxCacheItems: 1000,
  
  /** Maximum memory usage (MB) */
  maxMemoryUsage: 100,
  
  /** Enable automatic garbage collection */
  enableAutoGC: true,
  
  /** GC interval (milliseconds) */
  gcInterval: 5 * 60 * 1000, // 5 minutes
  
  /** Clear cache on low memory */
  clearCacheOnLowMemory: true,
  
  /** Low memory threshold (MB) */
  lowMemoryThreshold: 50,
} as const

// ============================================================================
// Bundle Optimization
// ============================================================================

export const BUNDLE_OPTIMIZATION = {
  /** Enable tree shaking */
  enableTreeShaking: true,
  
  /** Enable minification */
  enableMinification: true,
  
  /** Enable compression */
  enableCompression: true,
  
  /** Compression algorithm */
  compressionAlgorithm: 'gzip' as 'gzip' | 'brotli',
  
  /** Enable source maps in production */
  enableSourceMaps: false,
  
  /** Target browsers */
  targets: {
    chrome: '90',
    firefox: '88',
    safari: '14',
    edge: '90',
  },
} as const

// ============================================================================
// Network Optimization
// ============================================================================

export const NETWORK_OPTIMIZATION = {
  /** Enable HTTP/2 */
  enableHTTP2: true,
  
  /** Enable resource hints */
  enableResourceHints: true,
  
  /** Preconnect domains */
  preconnectDomains: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],
  
  /** DNS prefetch domains */
  dnsPrefetchDomains: [
    'https://api.example.com',
  ],
  
  /** Enable request batching */
  enableRequestBatching: true,
  
  /** Batch interval (milliseconds) */
  batchInterval: 50,
  
  /** Maximum batch size */
  maxBatchSize: 10,
} as const

// ============================================================================
// Rendering Optimization
// ============================================================================

export const RENDERING_OPTIMIZATION = {
  /** Enable virtual scrolling */
  enableVirtualScrolling: true,
  
  /** Virtual scroll buffer size */
  virtualScrollBuffer: 5,
  
  /** Enable debouncing */
  enableDebouncing: true,
  
  /** Debounce delay (milliseconds) */
  debounceDelay: 300,
  
  /** Enable throttling */
  enableThrottling: true,
  
  /** Throttle delay (milliseconds) */
  throttleDelay: 100,
  
  /** Enable request animation frame */
  enableRAF: true,
  
  /** Maximum concurrent renders */
  maxConcurrentRenders: 3,
} as const

// ============================================================================
// Database Optimization
// ============================================================================

export const DATABASE_OPTIMIZATION = {
  /** Enable indexing */
  enableIndexing: true,
  
  /** Enable query caching */
  enableQueryCaching: true,
  
  /** Query cache size */
  queryCacheSize: 100,
  
  /** Query cache TTL (milliseconds) */
  queryCacheTTL: 5 * 60 * 1000, // 5 minutes
  
  /** Enable batch operations */
  enableBatchOperations: true,
  
  /** Batch size */
  batchSize: 100,
  
  /** Enable connection pooling */
  enableConnectionPooling: true,
  
  /** Connection pool size */
  connectionPoolSize: 10,
} as const

// ============================================================================
// Monitoring Configuration
// ============================================================================

export const MONITORING = {
  /** Enable performance monitoring */
  enableMonitoring: true,
  
  /** Sample rate (0-1) */
  sampleRate: 0.1,
  
  /** Enable error tracking */
  enableErrorTracking: true,
  
  /** Enable user timing */
  enableUserTiming: true,
  
  /** Enable resource timing */
  enableResourceTiming: true,
  
  /** Enable navigation timing */
  enableNavigationTiming: true,
  
  /** Report interval (milliseconds) */
  reportInterval: 60 * 1000, // 1 minute
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if performance metric is good
 * التحقق من أن مقياس الأداء جيد
 */
export function isGoodPerformance(metric: keyof typeof PERFORMANCE_THRESHOLDS, value: number): boolean {
  const threshold = PERFORMANCE_THRESHOLDS[metric]
  return value <= threshold.good
}

/**
 * Check if performance metric needs improvement
 * التحقق من أن مقياس الأداء يحتاج تحسين
 */
export function needsImprovement(metric: keyof typeof PERFORMANCE_THRESHOLDS, value: number): boolean {
  const threshold = PERFORMANCE_THRESHOLDS[metric]
  return value > threshold.good && value <= threshold.needsImprovement
}

/**
 * Check if performance metric is poor
 * التحقق من أن مقياس الأداء ضعيف
 */
export function isPoorPerformance(metric: keyof typeof PERFORMANCE_THRESHOLDS, value: number): boolean {
  const threshold = PERFORMANCE_THRESHOLDS[metric]
  return value > threshold.needsImprovement
}

/**
 * Get performance rating
 * الحصول على تقييم الأداء
 */
export function getPerformanceRating(metric: keyof typeof PERFORMANCE_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  if (isGoodPerformance(metric, value)) return 'good'
  if (needsImprovement(metric, value)) return 'needs-improvement'
  return 'poor'
}

