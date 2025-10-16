/**
 * Test Suite for Lessons Learned Service
 * 
 * Comprehensive tests for the lessons learned service functionality
 * including CRUD operations, search, analytics, and bid performance integration.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Historical Data Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { lessonsLearnedService, createLessonFromBid } from '../../src/services/lessonsLearnedService'
import type { LessonLearned, LessonCategory, LessonImpact } from '../../src/services/lessonsLearnedService'
import type { BidPerformance } from '../../src/types/analytics'

// Mock storage
vi.mock('../../src/utils/storage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

// Import after mocking
import { safeLocalStorage } from '../../src/utils/storage'

describe('LessonsLearnedService', () => {
  const mockLesson: Omit<LessonLearned, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
    title: 'تحسين استراتيجية التسعير',
    description: 'درس مستفاد من مناقصة مشروع البنية التحتية',
    category: 'pricing',
    impact: 'high',
    status: 'draft',
    relatedTenderId: 'tender_123',
    whatWentWrong: 'تسعير مرتفع أدى لخسارة المناقصة',
    whatWentWell: 'تقييم دقيق للمخاطر',
    correctiveActions: ['مراجعة استراتيجية التسعير'],
    preventiveMeasures: ['تحليل أسعار المنافسين'],
    recommendations: ['استخدام نماذج تسعير متقدمة'],
    tags: ['تسعير', 'منافسة', 'بنية تحتية'],
    stakeholders: [
      { name: 'أحمد محمد', role: 'مدير المشروع', department: 'الهندسة' }
    ],
    timeline: {
      discoveryDate: '2024-01-15',
      incidentDate: '2024-01-10'
    },
    attachments: [],
    createdBy: 'user_123',
    updatedBy: 'user_123'
  }

  const mockBidPerformance: BidPerformance = {
    id: 'bid_123',
    tenderId: 'tender_123',
    submissionDate: '2024-01-10',
    outcome: 'lost',
    bidAmount: 5000000,
    estimatedValue: 5000000,
    plannedMargin: 25,
    winProbability: 60,
    competitorCount: 8,
    preparationTime: 120,
    category: 'infrastructure',
    region: 'Riyadh',
    client: {
      id: 'client_123',
      name: 'وزارة النقل',
      type: 'government',
      paymentHistory: 'excellent'
    },
    riskScore: 45,
    metrics: {
      roi: 0,
      efficiency: 40,
      strategicValue: 80
    },
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation returns empty array
    vi.mocked(safeLocalStorage.getItem).mockResolvedValue(null)
    vi.mocked(safeLocalStorage.setItem).mockResolvedValue(undefined)
  })

  describe('Lesson CRUD Operations', () => {
    it('should create a new lesson successfully', async () => {
      const lesson = await lessonsLearnedService.createLesson(mockLesson)

      expect(lesson).toMatchObject(mockLesson)
      expect(lesson.id).toBeDefined()
      expect(lesson.createdAt).toBeDefined()
      expect(lesson.updatedAt).toBeDefined()
      expect(lesson.version).toBe(1)
      expect(safeLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should update an existing lesson', async () => {
      const existingLesson: LessonLearned = {
        ...mockLesson,
        id: 'lesson_123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1
      }

      vi.mocked(safeLocalStorage.getItem).mockResolvedValue(JSON.stringify([existingLesson]))

      const updates = {
        status: 'approved' as const,
        title: 'عنوان محدث'
      }

      const updatedLesson = await lessonsLearnedService.updateLesson('lesson_123', updates)

      expect(updatedLesson.status).toBe('approved')
      expect(updatedLesson.title).toBe('عنوان محدث')
      expect(updatedLesson.version).toBe(2)
      expect(updatedLesson.updatedAt).not.toBe(existingLesson.updatedAt)
    })

    it('should get a lesson by ID', async () => {
      const existingLesson: LessonLearned = {
        ...mockLesson,
        id: 'lesson_123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1
      }

      vi.mocked(safeLocalStorage.getItem).mockResolvedValue(JSON.stringify([existingLesson]))

      const lesson = await lessonsLearnedService.getLesson('lesson_123')

      expect(lesson).toEqual(existingLesson)
    })

    it('should return null for non-existent lesson', async () => {
      vi.mocked(safeLocalStorage.getItem).mockResolvedValue(JSON.stringify([]))

      const lesson = await lessonsLearnedService.getLesson('non_existent')

      expect(lesson).toBeNull()
    })

    it('should delete a lesson successfully', async () => {
      const existingLesson: LessonLearned = {
        ...mockLesson,
        id: 'lesson_123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1
      }

      vi.mocked(safeLocalStorage.getItem).mockResolvedValue(JSON.stringify([existingLesson]))

      const result = await lessonsLearnedService.deleteLesson('lesson_123')

      expect(result).toBe(true)
      expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify([])
      )
    })

    it('should return false when deleting non-existent lesson', async () => {
      vi.mocked(safeLocalStorage.getItem).mockResolvedValue(JSON.stringify([]))

      const result = await lessonsLearnedService.deleteLesson('non_existent')

      expect(result).toBe(false)
    })
  })

  describe('Lesson Search and Filtering', () => {
    const mockLessons: LessonLearned[] = [
      {
        ...mockLesson,
        id: 'lesson_1',
        title: 'درس التسعير الأول',
        category: 'pricing',
        impact: 'high',
        status: 'approved',
        tags: ['تسعير', 'منافسة'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1
      },
      {
        ...mockLesson,
        id: 'lesson_2',
        title: 'درس إدارة المخاطر',
        description: 'درس مستفاد من إدارة المخاطر في المشاريع',
        category: 'risk_management',
        impact: 'medium',
        status: 'draft',
        whatWentWrong: 'تقييم غير دقيق للمخاطر',
        whatWentWell: 'فريق عمل متميز',
        correctiveActions: ['تحسين تقييم المخاطر'],
        preventiveMeasures: ['استخدام أدوات تقييم متقدمة'],
        recommendations: ['تطوير نماذج إدارة المخاطر'],
        tags: ['مخاطر', 'تقييم', 'إدارة'],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        version: 1
      }
    ]

    beforeEach(() => {
      vi.mocked(safeLocalStorage.getItem).mockResolvedValue(JSON.stringify(mockLessons))
    })

    it('should search lessons by text', async () => {
      const results = await lessonsLearnedService.searchLessons('التسعير')

      expect(results).toHaveLength(1)
      expect(results[0].title).toContain('التسعير')
    })

    it('should get lessons by category', async () => {
      const results = await lessonsLearnedService.getLessonsByCategory('pricing')

      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('pricing')
    })

    it('should get lessons by tender ID', async () => {
      const results = await lessonsLearnedService.getLessonsByTender('tender_123')

      expect(results).toHaveLength(2)
      results.forEach(lesson => {
        expect(lesson.relatedTenderId).toBe('tender_123')
      })
    })

    it('should filter lessons by multiple criteria', async () => {
      const results = await lessonsLearnedService.getAllLessons({
        categories: ['pricing'],
        impacts: ['high'],
        statuses: ['approved']
      })

      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('pricing')
      expect(results[0].impact).toBe('high')
      expect(results[0].status).toBe('approved')
    })

    it('should sort lessons by creation date', async () => {
      const results = await lessonsLearnedService.getAllLessons({
        sortBy: 'createdAt',
        sortDirection: 'desc'
      })

      expect(results).toHaveLength(2)
      expect(new Date(results[0].createdAt).getTime()).toBeGreaterThan(
        new Date(results[1].createdAt).getTime()
      )
    })

    it('should paginate results', async () => {
      const results = await lessonsLearnedService.getAllLessons({
        page: 1,
        pageSize: 1
      })

      expect(results).toHaveLength(1)
    })
  })

  describe('Analytics and Reporting', () => {
    const mockLessons: LessonLearned[] = [
      {
        ...mockLesson,
        id: 'lesson_1',
        category: 'pricing',
        impact: 'high',
        status: 'implemented',
        financialImpact: {
          costSavings: 100000,
          currency: 'SAR'
        },
        timeline: {
          discoveryDate: '2024-01-01',
          resolutionDate: '2024-01-10'
        },
        createdAt: new Date().toISOString(), // Use current date for recent lessons test
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1
      },
      {
        ...mockLesson,
        id: 'lesson_2',
        category: 'risk_management',
        impact: 'medium',
        status: 'approved',
        financialImpact: {
          revenueLoss: 50000,
          currency: 'SAR'
        },
        timeline: {
          discoveryDate: '2024-01-05',
          resolutionDate: '2024-01-20'
        },
        createdAt: new Date().toISOString(), // Use current date for recent lessons test
        updatedAt: '2024-01-05T00:00:00Z',
        version: 1
      }
    ]

    beforeEach(() => {
      vi.mocked(safeLocalStorage.getItem).mockResolvedValue(JSON.stringify(mockLessons))
    })

    it('should generate analytics summary', async () => {
      const analytics = await lessonsLearnedService.getAnalytics()

      expect(analytics.totalLessons).toBe(2)
      expect(analytics.byCategory.pricing).toBe(1)
      expect(analytics.byCategory.risk_management).toBe(1)
      expect(analytics.byImpact.high).toBe(1)
      expect(analytics.byImpact.medium).toBe(1)
      expect(analytics.byStatus.implemented).toBe(1)
      expect(analytics.byStatus.approved).toBe(1)
    })

    it('should calculate implementation rate', async () => {
      const analytics = await lessonsLearnedService.getAnalytics()

      expect(analytics.implementationRate).toBe(50) // 1 out of 2 implemented
    })

    it('should calculate average resolution time', async () => {
      const analytics = await lessonsLearnedService.getAnalytics()

      expect(analytics.averageResolutionTime).toBe(12) // Average of 9 and 15 days (rounded)
    })

    it('should calculate financial impact', async () => {
      const analytics = await lessonsLearnedService.getAnalytics()

      expect(analytics.financialImpact.totalCostSavings).toBe(100000)
      expect(analytics.financialImpact.totalRevenueLoss).toBe(50000)
      expect(analytics.financialImpact.netImpact).toBe(50000)
    })

    it('should identify recent lessons', async () => {
      const analytics = await lessonsLearnedService.getAnalytics()

      expect(analytics.recentLessons).toHaveLength(2)
    })

    it('should identify high impact lessons', async () => {
      const analytics = await lessonsLearnedService.getAnalytics()

      expect(analytics.highImpactLessons).toHaveLength(1)
      expect(analytics.highImpactLessons[0].impact).toBe('high')
    })
  })

  describe('Bid Performance Integration', () => {
    it('should generate lesson from won bid performance', async () => {
      const wonBid: BidPerformance = {
        ...mockBidPerformance,
        outcome: 'won',
        plannedMargin: 15
      }

      const lessonTemplate = await lessonsLearnedService.generateLessonFromBidPerformance(wonBid)

      expect(lessonTemplate.title).toContain('نجاح في الفوز')
      expect(lessonTemplate.category).toBe('bidding_strategy')
      expect(lessonTemplate.impact).toBe('high') // Large bid amount
      expect(lessonTemplate.whatWentWell).toBeDefined()
      expect(lessonTemplate.recommendations).toContain('تطبيق نفس استراتيجية التسعير في مناقصات مشابهة')
    })

    it('should generate lesson from lost bid performance', async () => {
      const lostBid: BidPerformance = {
        ...mockBidPerformance,
        outcome: 'lost',
        competitorCount: 10,
        plannedMargin: 25
      }

      const lessonTemplate = await lessonsLearnedService.generateLessonFromBidPerformance(lostBid)

      expect(lessonTemplate.title).toContain('عدم الفوز')
      expect(lessonTemplate.whatWentWrong).toContain('منافسة شديدة')
      expect(lessonTemplate.whatWentWrong).toContain('هامش ربح مرتفع')
      expect(lessonTemplate.recommendations).toContain('تحسين استراتيجية اختيار المناقصات لتجنب المنافسة المفرطة')
    })

    it('should categorize lesson based on bid characteristics', async () => {
      const pricingBid: BidPerformance = {
        ...mockBidPerformance,
        plannedMargin: 35 // High margin
      }

      const lessonTemplate = await lessonsLearnedService.generateLessonFromBidPerformance(pricingBid)

      expect(lessonTemplate.category).toBe('pricing')
    })

    it('should set appropriate impact level based on bid value', async () => {
      const highValueBid: BidPerformance = {
        ...mockBidPerformance,
        bidAmount: 15000000, // High value
        outcome: 'lost'
      }

      const lessonTemplate = await lessonsLearnedService.generateLessonFromBidPerformance(highValueBid)

      expect(lessonTemplate.impact).toBe('critical')
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      vi.mocked(safeLocalStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const lessons = await lessonsLearnedService.getAllLessons()

      expect(lessons).toEqual([])
    })

    it('should throw error when updating non-existent lesson', async () => {
      vi.mocked(safeLocalStorage.getItem).mockResolvedValue(JSON.stringify([]))

      await expect(
        lessonsLearnedService.updateLesson('non_existent', { title: 'Updated' })
      ).rejects.toThrow('Failed to update lesson learned record')
    })

    it('should handle invalid JSON in storage', async () => {
      vi.mocked(safeLocalStorage.getItem).mockResolvedValue('invalid json')

      const lessons = await lessonsLearnedService.getAllLessons()

      expect(lessons).toEqual([])
    })
  })

  describe('Convenience Functions', () => {
    it('should create lesson from bid using convenience function', async () => {
      const lessonTemplate = await createLessonFromBid(mockBidPerformance)

      expect(lessonTemplate.relatedBidId).toBe(mockBidPerformance.id)
      expect(lessonTemplate.relatedTenderId).toBe(mockBidPerformance.tenderId)
    })
  })
})
