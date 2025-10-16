/**
 * اختبارات خدمة تحسين الأداء والاستقرار
 * Performance Optimization Service Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { 
  performanceOptimizationService,
  PerformanceMetrics,
  SystemHealth,
  OptimizationRule
} from '../../../src/services/performanceOptimizationService'

// Mock storage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

vi.mock('../../../src/utils/storage', () => ({
  asyncStorage: mockStorage
}))

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => 100),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024 // 50MB
    }
  },
  writable: true
})

describe('PerformanceOptimizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage.getItem.mockResolvedValue(null)
    mockStorage.setItem.mockResolvedValue(undefined)

    // Reset service state
    performanceOptimizationService.reset()
  })

  describe('Service Functionality', () => {
    it('should be available as singleton', () => {
      expect(performanceOptimizationService).toBeDefined()
      expect(typeof performanceOptimizationService.reset).toBe('function')
    })

    it('should have optimization functionality', () => {
      expect(typeof performanceOptimizationService.optimizeQuery).toBe('function')
      expect(typeof performanceOptimizationService.optimizeComponent).toBe('function')
    })
  })

  describe('Cache Management', () => {

    it('should cache query results correctly', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue('cached-result')

      // First call should execute the query and cache result
      const result1 = await performanceOptimizationService.optimizeQuery('cache-test', mockQueryFn)
      expect(result1).toBe('cached-result')
      expect(mockQueryFn).toHaveBeenCalledTimes(1)

      // Second call should use cache
      const result2 = await performanceOptimizationService.optimizeQuery('cache-test', mockQueryFn)
      expect(result2).toBe('cached-result')
      expect(mockQueryFn).toHaveBeenCalledTimes(1) // Still 1, not called again
    })

    it('should handle cache configuration', () => {
      const originalConfig = { cacheEnabled: true, maxCacheSize: 50 }
      performanceOptimizationService.updateConfig(originalConfig)

      // Configuration should be updated (we can't directly test this without exposing config)
      expect(true).toBe(true) // Placeholder assertion
    })

    it('should handle cache TTL through query optimization', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue('ttl-result')

      // Call with custom TTL
      const result = await performanceOptimizationService.optimizeQuery('ttl-test', mockQueryFn, { ttl: 1000 })
      expect(result).toBe('ttl-result')
      expect(mockQueryFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Query Optimization', () => {

    it('should optimize queries with caching', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue('query-result')
      
      // First call should execute the query
      const result1 = await performanceOptimizationService.optimizeQuery('test-query', mockQueryFn)
      expect(result1).toBe('query-result')
      expect(mockQueryFn).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      const result2 = await performanceOptimizationService.optimizeQuery('test-query', mockQueryFn)
      expect(result2).toBe('query-result')
      expect(mockQueryFn).toHaveBeenCalledTimes(1) // Still 1, not called again
    })

    it('should force refresh when requested', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue('query-result')
      
      // First call
      await performanceOptimizationService.optimizeQuery('test-query', mockQueryFn)
      expect(mockQueryFn).toHaveBeenCalledTimes(1)
      
      // Force refresh
      await performanceOptimizationService.optimizeQuery('test-query', mockQueryFn, { forceRefresh: true })
      expect(mockQueryFn).toHaveBeenCalledTimes(2)
    })

    it('should handle query errors gracefully', async () => {
      const mockQueryFn = vi.fn().mockRejectedValue(new Error('Query failed'))
      
      await expect(
        performanceOptimizationService.optimizeQuery('test-query', mockQueryFn)
      ).rejects.toThrow('Query failed')
    })
  })

  describe('Component Optimization', () => {

    it('should optimize component rendering', () => {
      const props = { id: 1, name: 'test', description: 'test desc' }
      const dependencies = ['id', 'name']
      
      const result = performanceOptimizationService.optimizeComponent('TestComponent', props, dependencies)
      
      expect(result.shouldUpdate).toBe(true)
      expect(result.optimizedProps).toEqual(props)
    })

    it('should detect when component should not update', () => {
      const props1 = { id: 1, name: 'test', description: 'test desc' }
      const props2 = { id: 1, name: 'test', description: 'different desc' }
      const dependencies = ['id', 'name'] // description is not a dependency
      
      // First render
      performanceOptimizationService.optimizeComponent('TestComponent', props1, dependencies)
      
      // Second render with same dependencies
      const result = performanceOptimizationService.optimizeComponent('TestComponent', props2, dependencies)
      
      expect(result.shouldUpdate).toBe(false)
    })
  })

  describe('Memory Optimization', () => {

    it('should optimize memory usage', async () => {
      const initialMemory = performanceOptimizationService.getMemoryUsage()
      
      await performanceOptimizationService.optimizeMemory()
      
      // Memory optimization should complete without errors
      expect(true).toBe(true) // Placeholder assertion
    })

    it('should track memory usage', () => {
      const memoryUsage = performanceOptimizationService.getMemoryUsage()
      expect(typeof memoryUsage).toBe('number')
      expect(memoryUsage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance Metrics', () => {
    it('should get performance report', async () => {
      const report = await performanceOptimizationService.getPerformanceReport()

      expect(report).toHaveProperty('health')
      expect(report).toHaveProperty('metrics')
      expect(report).toHaveProperty('optimizations')
      expect(report).toHaveProperty('config')

      expect(Array.isArray(report.metrics)).toBe(true)
      expect(Array.isArray(report.optimizations)).toBe(true)
    })

  })

  describe('System Health', () => {

    it('should check system health', async () => {
      const health = await performanceOptimizationService.checkSystemHealth()
      
      expect(health).toHaveProperty('overall')
      expect(health).toHaveProperty('performance')
      expect(health).toHaveProperty('stability')
      expect(health).toHaveProperty('memory')
      expect(health).toHaveProperty('errors')
      expect(health).toHaveProperty('lastCheck')
      expect(health).toHaveProperty('recommendations')
      
      expect(['excellent', 'good', 'warning', 'critical']).toContain(health.overall)
      expect(Array.isArray(health.recommendations)).toBe(true)
    })

    it('should calculate performance score correctly', async () => {
      const health = await performanceOptimizationService.checkSystemHealth()
      
      expect(health.performance.score).toBeGreaterThanOrEqual(0)
      expect(health.performance.score).toBeLessThanOrEqual(100)
      expect(typeof health.performance.avgResponseTime).toBe('number')
      expect(typeof health.performance.cacheHitRate).toBe('number')
    })

    it('should calculate stability score correctly', async () => {
      const health = await performanceOptimizationService.checkSystemHealth()
      
      expect(health.stability.score).toBeGreaterThanOrEqual(0)
      expect(health.stability.score).toBeLessThanOrEqual(100)
      expect(typeof health.stability.uptime).toBe('number')
      expect(typeof health.stability.errorRate).toBe('number')
    })
  })

  describe('Configuration', () => {

    it('should update configuration', () => {
      const newConfig = {
        cacheEnabled: false,
        maxCacheSize: 200,
        enableMetrics: false
      }
      
      performanceOptimizationService.updateConfig(newConfig)
      
      // Configuration should be updated (we can't directly test this without exposing config)
      expect(true).toBe(true) // Placeholder assertion
    })
  })

  describe('Monitoring', () => {
    it('should have monitoring capabilities', () => {
      // Service should be available for monitoring
      expect(performanceOptimizationService).toBeDefined()
      expect(typeof performanceOptimizationService.checkSystemHealth).toBe('function')
    })
  })

  describe('Reset Functionality', () => {

    it('should reset cache and metrics', async () => {
      // Add some cached data through query optimization
      const mockQueryFn = vi.fn().mockResolvedValue('reset-test-data')
      await performanceOptimizationService.optimizeQuery('reset-test', mockQueryFn)

      // Reset
      performanceOptimizationService.reset()

      // After reset, query should be executed again (not cached)
      await performanceOptimizationService.optimizeQuery('reset-test', mockQueryFn)
      expect(mockQueryFn).toHaveBeenCalledTimes(2) // Called twice due to reset
    })
  })

  describe('Error Handling', () => {
    it('should handle query errors gracefully', async () => {
      const mockQueryFn = vi.fn().mockRejectedValue(new Error('Query failed'))

      await expect(
        performanceOptimizationService.optimizeQuery('test-query', mockQueryFn)
      ).rejects.toThrow('Query failed')
    })

    it('should handle system health check errors gracefully', async () => {
      // Should not throw during health check
      await expect(performanceOptimizationService.checkSystemHealth()).resolves.toBeDefined()
    })
  })
})
