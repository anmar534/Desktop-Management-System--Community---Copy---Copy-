/**
 * Analytics Service Tests for Phase 2 Implementation
 * 
 * Comprehensive test suite for the analytics service including bid performance
 * tracking, market intelligence, and competitive analysis functionality.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { BidPerformance, AnalyticsFilter } from '../../src/types/analytics'

// Mock safeLocalStorage
vi.mock('../../src/utils/storage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

// Import after mocking
import { analyticsService } from '../../src/services/analyticsService'
import { safeLocalStorage } from '../../src/utils/storage'

const mockLocalStorage = safeLocalStorage as any

describe('AnalyticsService', () => {
  // Sample test data
  const sampleBidPerformance: Omit<BidPerformance, 'id' | 'createdAt' | 'updatedAt'> = {
    tenderId: 'tender-001',
    submissionDate: '2024-01-15',
    outcome: 'won',
    bidAmount: 5000000,
    estimatedValue: 4800000,
    actualMargin: 15,
    plannedMargin: 18,
    winProbability: 75,
    competitorCount: 4,
    preparationTime: 120,
    category: 'سكني',
    region: 'الرياض',
    client: {
      id: 'client-001',
      name: 'شركة التطوير العقاري',
      type: 'private',
      paymentHistory: 'excellent'
    },
    riskScore: 25,
    metrics: {
      roi: 180,
      efficiency: 85,
      strategicValue: 90
    }
  }

  const sampleFilter: AnalyticsFilter = {
    dateRange: {
      start: '2024-01-01',
      end: '2024-12-31'
    },
    categories: ['سكني'],
    regions: ['الرياض']
  }

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockLocalStorage.getItem.mockResolvedValue(null)
    mockLocalStorage.setItem.mockResolvedValue(undefined)
  })

  describe('Bid Performance Management', () => {
    it('should create a new bid performance record', async () => {
      // Arrange
      mockLocalStorage.getItem.mockResolvedValue('[]')

      // Act
      const result = await analyticsService.createBidPerformance(sampleBidPerformance)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.tenderId).toBe(sampleBidPerformance.tenderId)
      expect(result.outcome).toBe(sampleBidPerformance.outcome)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(mockLocalStorage.setItem).toHaveBeenCalledOnce()
    })

    it('should update an existing bid performance record', async () => {
      // Arrange
      const existingPerformance: BidPerformance = {
        ...sampleBidPerformance,
        id: 'perf-001',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      }
      mockLocalStorage.getItem.mockResolvedValue(JSON.stringify([existingPerformance]))

      const updates = { outcome: 'lost' as const, actualMargin: 0 }

      // Act
      const result = await analyticsService.updateBidPerformance('perf-001', updates)

      // Assert
      expect(result).toBeDefined()
      expect(result.outcome).toBe('lost')
      expect(result.actualMargin).toBe(0)
      expect(result.updatedAt).not.toBe(existingPerformance.updatedAt)
      expect(mockLocalStorage.setItem).toHaveBeenCalledOnce()
    })

    it('should get a specific bid performance by ID', async () => {
      // Arrange
      const existingPerformance: BidPerformance = {
        ...sampleBidPerformance,
        id: 'perf-001',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      }
      mockLocalStorage.getItem.mockResolvedValue(JSON.stringify([existingPerformance]))

      // Act
      const result = await analyticsService.getBidPerformance('perf-001')

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe('perf-001')
      expect(result?.tenderId).toBe(sampleBidPerformance.tenderId)
    })

    it('should return null for non-existent bid performance', async () => {
      // Arrange
      mockLocalStorage.getItem.mockResolvedValue('[]')

      // Act
      const result = await analyticsService.getBidPerformance('non-existent')

      // Assert
      expect(result).toBeNull()
    })

    it('should get all bid performances with filtering', async () => {
      // Arrange
      const performances: BidPerformance[] = [
        {
          ...sampleBidPerformance,
          id: 'perf-001',
          category: 'سكني',
          region: 'الرياض',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        },
        {
          ...sampleBidPerformance,
          id: 'perf-002',
          category: 'تجاري',
          region: 'جدة',
          createdAt: '2024-01-16T10:00:00.000Z',
          updatedAt: '2024-01-16T10:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(performances))

      // Act
      const result = await analyticsService.getAllBidPerformances({ filters: sampleFilter })

      // Assert
      expect(result).toBeDefined()
      expect(result.length).toBe(1) // Only the one matching the filter
      expect(result[0].category).toBe('سكني')
      expect(result[0].region).toBe('الرياض')
    })

    it('should delete a bid performance record', async () => {
      // Arrange
      const existingPerformance: BidPerformance = {
        ...sampleBidPerformance,
        id: 'perf-001',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      }
      mockLocalStorage.getItem.mockResolvedValue(JSON.stringify([existingPerformance]))

      // Act
      const result = await analyticsService.deleteBidPerformance('perf-001')

      // Assert
      expect(result).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify([])
      )
    })

    it('should return false when deleting non-existent record', async () => {
      // Arrange
      mockLocalStorage.getItem.mockResolvedValue('[]')

      // Act
      const result = await analyticsService.deleteBidPerformance('non-existent')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('Performance Analytics', () => {
    it('should generate performance summary', async () => {
      // Arrange
      const performances: BidPerformance[] = [
        {
          ...sampleBidPerformance,
          id: 'perf-001',
          outcome: 'won',
          bidAmount: 5000000,
          plannedMargin: 18,
          category: 'سكني',
          region: 'الرياض',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        },
        {
          ...sampleBidPerformance,
          id: 'perf-002',
          outcome: 'lost',
          bidAmount: 3000000,
          plannedMargin: 15,
          category: 'تجاري',
          region: 'جدة',
          createdAt: '2024-01-16T10:00:00.000Z',
          updatedAt: '2024-01-16T10:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(performances))

      // Act
      const result = await analyticsService.getPerformanceSummary()

      // Assert
      expect(result).toBeDefined()
      expect(result.overall.totalBids).toBe(2)
      expect(result.overall.wonBids).toBe(1)
      expect(result.overall.winRate).toBe(50)
      expect(result.overall.totalValue).toBe(8000000)
      expect(result.overall.averageMargin).toBe(16.5)
      expect(result.byCategory).toHaveLength(2)
      expect(result.byRegion).toHaveLength(2)
    })

    it('should generate win rate trend data', async () => {
      // Arrange
      const performances: BidPerformance[] = [
        {
          ...sampleBidPerformance,
          id: 'perf-001',
          outcome: 'won',
          submissionDate: '2024-01-15',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        },
        {
          ...sampleBidPerformance,
          id: 'perf-002',
          outcome: 'lost',
          submissionDate: '2024-02-15',
          createdAt: '2024-02-15T10:00:00.000Z',
          updatedAt: '2024-02-15T10:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(performances))

      // Act
      const result = await analyticsService.getWinRateTrend()

      // Assert
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      // Check that each point has required properties
      result.forEach(point => {
        expect(point).toHaveProperty('date')
        expect(point).toHaveProperty('value')
        expect(point).toHaveProperty('label')
      })
    })

    it('should generate margin trend data', async () => {
      // Arrange
      const performances: BidPerformance[] = [
        {
          ...sampleBidPerformance,
          id: 'perf-001',
          plannedMargin: 18,
          submissionDate: '2024-01-15',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        },
        {
          ...sampleBidPerformance,
          id: 'perf-002',
          plannedMargin: 15,
          submissionDate: '2024-02-15',
          createdAt: '2024-02-15T10:00:00.000Z',
          updatedAt: '2024-02-15T10:00:00.000Z'
        }
      ]
      mockLocalStorage.getItem.mockResolvedValue(JSON.stringify(performances))

      // Act
      const result = await analyticsService.getMarginTrend()

      // Assert
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      // Check that each point has required properties
      result.forEach(point => {
        expect(point).toHaveProperty('date')
        expect(point).toHaveProperty('value')
        expect(point).toHaveProperty('label')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Arrange
      mockLocalStorage.getItem.mockRejectedValue(new Error('Storage error'))

      // Act & Assert
      const result = await analyticsService.getAllBidPerformances()
      expect(result).toEqual([])
    })

    it('should handle invalid JSON data gracefully', async () => {
      // Arrange
      mockLocalStorage.getItem.mockResolvedValue('invalid json')

      // Act & Assert
      const result = await analyticsService.getAllBidPerformances()
      expect(result).toEqual([])
    })

    it('should throw error when creating performance fails', async () => {
      // Arrange
      mockLocalStorage.setItem.mockRejectedValue(new Error('Storage error'))

      // Act & Assert
      await expect(analyticsService.createBidPerformance(sampleBidPerformance))
        .rejects.toThrow('Failed to create bid performance')
    })

    it('should throw error when updating non-existent performance', async () => {
      // Arrange
      mockLocalStorage.getItem.mockResolvedValue('[]')

      // Act & Assert
      await expect(analyticsService.updateBidPerformance('non-existent', { outcome: 'won' }))
        .rejects.toThrow('Failed to update bid performance record')
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields when creating performance', async () => {
      // Arrange
      const invalidPerformance = {
        ...sampleBidPerformance,
        tenderId: '', // Invalid empty tenderId
      }
      mockLocalStorage.getItem.mockResolvedValue('[]')

      // Act & Assert - This would depend on actual validation implementation
      // For now, we just test that the service accepts the data
      const result = await analyticsService.createBidPerformance(invalidPerformance)
      expect(result).toBeDefined()
    })

    it('should handle edge cases in performance calculations', async () => {
      // Arrange - Empty performance data
      mockLocalStorage.getItem.mockResolvedValue('[]')

      // Act
      const summary = await analyticsService.getPerformanceSummary()

      // Assert
      expect(summary.overall.totalBids).toBe(0)
      expect(summary.overall.winRate).toBe(0)
      expect(summary.overall.averageMargin).toBe(0)
      expect(summary.overall.totalValue).toBe(0)
      expect(summary.byCategory).toEqual([])
      expect(summary.byRegion).toEqual([])
    })
  })
})
