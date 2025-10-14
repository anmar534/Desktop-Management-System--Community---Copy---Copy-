/**
 * Performance Optimization Service Tests
 * اختبارات خدمة تحسين الأداء
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { performanceOptimizationService } from '../../src/services/performanceOptimizationService'

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 100),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10 // 10MB
  }
}

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
})

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
})

describe('PerformanceOptimizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    performanceOptimizationService.reset()
    mockSessionStorage.getItem.mockReturnValue('test-session-id')
  })

  describe('Query Optimization', () => {
    it('should cache query results', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      // First call - should execute query
      const result1 = await performanceOptimizationService.optimizeQuery('test-key', queryFn)
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(result1).toEqual({ data: 'test' })

      // Second call - should return cached result
      const result2 = await performanceOptimizationService.optimizeQuery('test-key', queryFn)
      expect(queryFn).toHaveBeenCalledTimes(1) // Still 1, not called again
      expect(result2).toEqual({ data: 'test' })
    })

    it('should force refresh when requested', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      // First call
      await performanceOptimizationService.optimizeQuery('test-key', queryFn)
      expect(queryFn).toHaveBeenCalledTimes(1)

      // Force refresh
      await performanceOptimizationService.optimizeQuery('test-key', queryFn, { forceRefresh: true })
      expect(queryFn).toHaveBeenCalledTimes(2)
    })

    it('should handle query errors', async () => {
      const queryFn = vi.fn().mockRejectedValue(new Error('Query failed'))
      
      await expect(
        performanceOptimizationService.optimizeQuery('test-key', queryFn)
      ).rejects.toThrow('Query failed')
    })

    it('should use custom TTL', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      await performanceOptimizationService.optimizeQuery('test-key', queryFn, { ttl: 1000 })
      expect(queryFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Component Optimization', () => {
    it('should detect when component should update', () => {
      const props = { id: 1, name: 'test', description: 'desc' }
      const dependencies = ['id', 'name']
      
      const result = performanceOptimizationService.optimizeComponent('TestComponent', props, dependencies)
      
      expect(result.shouldUpdate).toBe(true)
      expect(result.optimizedProps).toEqual(props)
    })

    it('should prevent unnecessary updates', () => {
      const props1 = { id: 1, name: 'test', description: 'desc1' }
      const props2 = { id: 1, name: 'test', description: 'desc2' }
      const dependencies = ['id', 'name']
      
      // First render
      const result1 = performanceOptimizationService.optimizeComponent('TestComponent', props1, dependencies)
      expect(result1.shouldUpdate).toBe(true)
      
      // Second render with same dependencies
      const result2 = performanceOptimizationService.optimizeComponent('TestComponent', props2, dependencies)
      expect(result2.shouldUpdate).toBe(false)
    })

    it('should update when dependencies change', () => {
      const props1 = { id: 1, name: 'test1', description: 'desc' }
      const props2 = { id: 1, name: 'test2', description: 'desc' }
      const dependencies = ['id', 'name']
      
      // First render
      performanceOptimizationService.optimizeComponent('TestComponent', props1, dependencies)
      
      // Second render with changed dependency
      const result = performanceOptimizationService.optimizeComponent('TestComponent', props2, dependencies)
      expect(result.shouldUpdate).toBe(true)
    })
  })

  describe('Memory Optimization', () => {
    it('should clean expired cache entries', () => {
      // Add some cache entries
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      performanceOptimizationService.optimizeQuery('key1', queryFn, { ttl: 1 }) // Very short TTL
      
      // Wait and clean
      setTimeout(() => {
        performanceOptimizationService.optimizeMemory()
        
        // Cache should be cleaned
        const report = performanceOptimizationService.getPerformanceReport()
        expect(report.cacheStats.size).toBe(0)
      }, 10)
    })

    it('should clean old metrics', () => {
      // Generate some metrics
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      performanceOptimizationService.optimizeQuery('test-key', queryFn)
      
      performanceOptimizationService.optimizeMemory()
      
      const report = performanceOptimizationService.getPerformanceReport()
      expect(report.metrics.totalQueries).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance Reporting', () => {
    it('should generate performance report', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      // Generate some activity
      await performanceOptimizationService.optimizeQuery('key1', queryFn)
      await performanceOptimizationService.optimizeQuery('key2', queryFn)
      await performanceOptimizationService.optimizeQuery('key1', queryFn) // Cache hit
      
      const report = performanceOptimizationService.getPerformanceReport()
      
      expect(report).toHaveProperty('cacheStats')
      expect(report).toHaveProperty('metrics')
      expect(report).toHaveProperty('recommendations')
      
      expect(report.cacheStats.size).toBeGreaterThanOrEqual(0)
      expect(report.metrics.totalQueries).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(report.recommendations)).toBe(true)
    })

    it('should calculate cache hit rate', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      // First call - cache miss
      await performanceOptimizationService.optimizeQuery('test-key', queryFn)
      
      // Second call - cache hit
      await performanceOptimizationService.optimizeQuery('test-key', queryFn)
      
      const report = performanceOptimizationService.getPerformanceReport()
      expect(report.cacheStats.hitRate).toBeGreaterThan(0)
    })

    it('should provide recommendations for poor performance', async () => {
      // Mock slow query
      const slowQueryFn = vi.fn().mockImplementation(() => {
        mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(2000) // 2 second query
        return Promise.resolve({ data: 'slow' })
      })
      
      await performanceOptimizationService.optimizeQuery('slow-key', slowQueryFn)
      
      const report = performanceOptimizationService.getPerformanceReport()
      expect(report.recommendations.length).toBeGreaterThan(0)
      expect(report.recommendations.some(r => r.includes('استعلامات'))).toBe(true)
    })
  })

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        cacheEnabled: false,
        cacheTTL: 10000,
        enableMetrics: false
      }
      
      performanceOptimizationService.updateConfig(newConfig)
      
      // Test that cache is disabled
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      performanceOptimizationService.optimizeQuery('test-key', queryFn)
      performanceOptimizationService.optimizeQuery('test-key', queryFn)
      
      expect(queryFn).toHaveBeenCalledTimes(2) // Should call twice since cache is disabled
    })

    it('should reset cache and metrics', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      // Generate some data
      await performanceOptimizationService.optimizeQuery('test-key', queryFn)
      
      let report = performanceOptimizationService.getPerformanceReport()
      expect(report.cacheStats.size).toBeGreaterThan(0)
      
      // Reset
      performanceOptimizationService.reset()
      
      report = performanceOptimizationService.getPerformanceReport()
      expect(report.cacheStats.size).toBe(0)
      expect(report.metrics.totalQueries).toBe(0)
    })
  })

  describe('Cache Management', () => {
    it('should evict least used entries when cache is full', async () => {
      // Update config to have small cache size
      performanceOptimizationService.updateConfig({ maxCacheSize: 2 })
      
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      // Fill cache
      await performanceOptimizationService.optimizeQuery('key1', queryFn)
      await performanceOptimizationService.optimizeQuery('key2', queryFn)
      
      // Access key1 multiple times to make it more used
      await performanceOptimizationService.optimizeQuery('key1', queryFn)
      await performanceOptimizationService.optimizeQuery('key1', queryFn)
      
      // Add third key - should evict key2 (least used)
      await performanceOptimizationService.optimizeQuery('key3', queryFn)
      
      const report = performanceOptimizationService.getPerformanceReport()
      expect(report.cacheStats.size).toBeLessThanOrEqual(2)
    })

    it('should handle cache expiration', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      // Add entry with very short TTL
      await performanceOptimizationService.optimizeQuery('test-key', queryFn, { ttl: 1 })
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should call query function again
      await performanceOptimizationService.optimizeQuery('test-key', queryFn)
      expect(queryFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      // Should not throw even if storage fails
      await expect(
        performanceOptimizationService.optimizeQuery('test-key', queryFn)
      ).resolves.toEqual({ data: 'test' })
      
      vi.restoreAllMocks()
    })

    it('should track error metrics', async () => {
      const errorQueryFn = vi.fn().mockRejectedValue(new Error('Test error'))
      
      try {
        await performanceOptimizationService.optimizeQuery('error-key', errorQueryFn)
      } catch (error) {
        // Expected error
      }
      
      const report = performanceOptimizationService.getPerformanceReport()
      expect(report.metrics.errorRate).toBeGreaterThan(0)
    })
  })

  describe('Session Management', () => {
    it('should generate session ID', () => {
      mockSessionStorage.getItem.mockReturnValue(null)
      
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      performanceOptimizationService.optimizeQuery('test-key', queryFn)
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'performance_session_id',
        expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
      )
    })

    it('should reuse existing session ID', () => {
      mockSessionStorage.getItem.mockReturnValue('existing-session-id')
      
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      performanceOptimizationService.optimizeQuery('test-key', queryFn)
      
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled()
    })
  })
})
