/**
 * Lessons Learned Service for Phase 2 Implementation
 * 
 * This service manages the capture, storage, and retrieval of lessons learned
 * from completed projects and bidding experiences.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Historical Data Integration
 */

import { safeLocalStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/storageKeys'
import type { BidPerformance } from '../types/analytics'

/**
 * Lesson learned category types
 */
export type LessonCategory = 
  | 'bidding_strategy' 
  | 'pricing' 
  | 'risk_management' 
  | 'project_execution' 
  | 'client_relations' 
  | 'team_management' 
  | 'technical' 
  | 'regulatory' 
  | 'market_intelligence'

/**
 * Lesson impact level
 */
export type LessonImpact = 'low' | 'medium' | 'high' | 'critical'

/**
 * Lesson status
 */
export type LessonStatus = 'draft' | 'reviewed' | 'approved' | 'implemented' | 'archived'

/**
 * Lesson learned data structure
 */
export interface LessonLearned {
  /** Unique identifier */
  id: string
  /** Lesson title */
  title: string
  /** Detailed description */
  description: string
  /** Category */
  category: LessonCategory
  /** Impact level */
  impact: LessonImpact
  /** Current status */
  status: LessonStatus
  /** Related tender/project ID */
  relatedTenderId?: string
  /** Related bid performance ID */
  relatedBidId?: string
  /** What went wrong (if applicable) */
  whatWentWrong?: string
  /** What went well */
  whatWentWell?: string
  /** Root cause analysis */
  rootCause?: string
  /** Corrective actions taken */
  correctiveActions: string[]
  /** Preventive measures */
  preventiveMeasures: string[]
  /** Recommendations for future */
  recommendations: string[]
  /** Tags for easy searching */
  tags: string[]
  /** Stakeholders involved */
  stakeholders: Array<{
    name: string
    role: string
    department?: string
  }>
  /** Financial impact */
  financialImpact?: {
    costSavings?: number
    revenueLoss?: number
    additionalCosts?: number
    currency: string
  }
  /** Timeline information */
  timeline: {
    incidentDate?: string
    discoveryDate: string
    resolutionDate?: string
    implementationDate?: string
  }
  /** Attachments and references */
  attachments: Array<{
    name: string
    type: string
    url?: string
    description?: string
  }>
  /** Review information */
  review?: {
    reviewedBy: string
    reviewDate: string
    reviewComments: string
    approvedBy?: string
    approvalDate?: string
  }
  /** Implementation tracking */
  implementation?: {
    implementedBy: string
    implementationDate: string
    implementationNotes: string
    effectivenessRating?: number
    followUpRequired: boolean
    followUpDate?: string
  }
  /** Metadata */
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  version: number
}

/**
 * Lesson search query
 */
export interface LessonQuery {
  /** Search term */
  searchTerm?: string
  /** Filter by category */
  categories?: LessonCategory[]
  /** Filter by impact */
  impacts?: LessonImpact[]
  /** Filter by status */
  statuses?: LessonStatus[]
  /** Filter by tags */
  tags?: string[]
  /** Filter by date range */
  dateRange?: {
    start: string
    end: string
  }
  /** Filter by related tender */
  relatedTenderId?: string
  /** Sort by field */
  sortBy?: 'createdAt' | 'updatedAt' | 'impact' | 'title'
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
  /** Pagination */
  page?: number
  pageSize?: number
}

/**
 * Lesson analytics summary
 */
export interface LessonAnalytics {
  /** Total lessons count */
  totalLessons: number
  /** Lessons by category */
  byCategory: Record<LessonCategory, number>
  /** Lessons by impact */
  byImpact: Record<LessonImpact, number>
  /** Lessons by status */
  byStatus: Record<LessonStatus, number>
  /** Recent lessons */
  recentLessons: LessonLearned[]
  /** Most impactful lessons */
  highImpactLessons: LessonLearned[]
  /** Implementation rate */
  implementationRate: number
  /** Average time to resolution */
  averageResolutionTime: number
  /** Financial impact summary */
  financialImpact: {
    totalCostSavings: number
    totalRevenueLoss: number
    totalAdditionalCosts: number
    netImpact: number
  }
}

/**
 * Lessons Learned Service Interface
 */
export interface ILessonsLearnedService {
  createLesson(lesson: Omit<LessonLearned, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<LessonLearned>
  updateLesson(id: string, updates: Partial<LessonLearned>): Promise<LessonLearned>
  getLesson(id: string): Promise<LessonLearned | null>
  getAllLessons(query?: LessonQuery): Promise<LessonLearned[]>
  deleteLesson(id: string): Promise<boolean>
  searchLessons(searchTerm: string): Promise<LessonLearned[]>
  getLessonsByCategory(category: LessonCategory): Promise<LessonLearned[]>
  getLessonsByTender(tenderId: string): Promise<LessonLearned[]>
  getAnalytics(): Promise<LessonAnalytics>
  generateLessonFromBidPerformance(bidPerformance: BidPerformance): Promise<Partial<LessonLearned>>
}

/**
 * Lessons Learned Service Implementation
 */
class LessonsLearnedService implements ILessonsLearnedService {
  private readonly storageKey = STORAGE_KEYS.LESSONS_LEARNED || 'app_lessons_learned'

  /**
   * Create a new lesson learned
   */
  async createLesson(
    lessonData: Omit<LessonLearned, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<LessonLearned> {
    try {
      const lesson: LessonLearned = {
        ...lessonData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      const lessons = await this.getAllLessons()
      lessons.push(lesson)
      
      await safeLocalStorage.setItem(this.storageKey, JSON.stringify(lessons))
      return lesson

    } catch (error) {
      console.error('Error creating lesson:', error)
      throw new Error('Failed to create lesson learned record')
    }
  }

  /**
   * Update an existing lesson
   */
  async updateLesson(id: string, updates: Partial<LessonLearned>): Promise<LessonLearned> {
    try {
      const lessons = await this.getAllLessons()
      const lessonIndex = lessons.findIndex(l => l.id === id)
      
      if (lessonIndex === -1) {
        throw new Error('Lesson not found')
      }

      const updatedLesson: LessonLearned = {
        ...lessons[lessonIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
        version: lessons[lessonIndex].version + 1
      }

      lessons[lessonIndex] = updatedLesson
      await safeLocalStorage.setItem(this.storageKey, JSON.stringify(lessons))
      
      return updatedLesson

    } catch (error) {
      console.error('Error updating lesson:', error)
      throw new Error('Failed to update lesson learned record')
    }
  }

  /**
   * Get a lesson by ID
   */
  async getLesson(id: string): Promise<LessonLearned | null> {
    try {
      const lessons = await this.getAllLessons()
      return lessons.find(l => l.id === id) || null

    } catch (error) {
      console.error('Error getting lesson:', error)
      return null
    }
  }

  /**
   * Get all lessons with optional filtering and sorting
   */
  async getAllLessons(query?: LessonQuery): Promise<LessonLearned[]> {
    try {
      const stored = await safeLocalStorage.getItem(this.storageKey)
      let lessons: LessonLearned[] = stored ? JSON.parse(stored) : []

      // Apply filters
      if (query) {
        lessons = this.applyFilters(lessons, query)
        lessons = this.applySorting(lessons, query)
        lessons = this.applyPagination(lessons, query)
      }

      return lessons

    } catch (error) {
      console.error('Error getting lessons:', error)
      return []
    }
  }

  /**
   * Delete a lesson
   */
  async deleteLesson(id: string): Promise<boolean> {
    try {
      const lessons = await this.getAllLessons()
      const filteredLessons = lessons.filter(l => l.id !== id)
      
      if (filteredLessons.length === lessons.length) {
        return false // Lesson not found
      }

      await safeLocalStorage.setItem(this.storageKey, JSON.stringify(filteredLessons))
      return true

    } catch (error) {
      console.error('Error deleting lesson:', error)
      return false
    }
  }

  /**
   * Search lessons by text
   */
  async searchLessons(searchTerm: string): Promise<LessonLearned[]> {
    try {
      const lessons = await this.getAllLessons()
      const term = searchTerm.toLowerCase()

      return lessons.filter(lesson => 
        lesson.title.toLowerCase().includes(term) ||
        lesson.description.toLowerCase().includes(term) ||
        lesson.tags.some(tag => tag.toLowerCase().includes(term)) ||
        lesson.correctiveActions.some(action => action.toLowerCase().includes(term)) ||
        lesson.recommendations.some(rec => rec.toLowerCase().includes(term))
      )

    } catch (error) {
      console.error('Error searching lessons:', error)
      return []
    }
  }

  /**
   * Get lessons by category
   */
  async getLessonsByCategory(category: LessonCategory): Promise<LessonLearned[]> {
    try {
      const lessons = await this.getAllLessons()
      return lessons.filter(lesson => lesson.category === category)

    } catch (error) {
      console.error('Error getting lessons by category:', error)
      return []
    }
  }

  /**
   * Get lessons related to a specific tender
   */
  async getLessonsByTender(tenderId: string): Promise<LessonLearned[]> {
    try {
      const lessons = await this.getAllLessons()
      return lessons.filter(lesson => lesson.relatedTenderId === tenderId)

    } catch (error) {
      console.error('Error getting lessons by tender:', error)
      return []
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalytics(): Promise<LessonAnalytics> {
    try {
      const lessons = await this.getAllLessons()

      // Count by category
      const byCategory = lessons.reduce((acc, lesson) => {
        acc[lesson.category] = (acc[lesson.category] || 0) + 1
        return acc
      }, {} as Record<LessonCategory, number>)

      // Count by impact
      const byImpact = lessons.reduce((acc, lesson) => {
        acc[lesson.impact] = (acc[lesson.impact] || 0) + 1
        return acc
      }, {} as Record<LessonImpact, number>)

      // Count by status
      const byStatus = lessons.reduce((acc, lesson) => {
        acc[lesson.status] = (acc[lesson.status] || 0) + 1
        return acc
      }, {} as Record<LessonStatus, number>)

      // Recent lessons (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentLessons = lessons
        .filter(lesson => new Date(lesson.createdAt) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)

      // High impact lessons
      const highImpactLessons = lessons
        .filter(lesson => lesson.impact === 'high' || lesson.impact === 'critical')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)

      // Implementation rate
      const implementedCount = lessons.filter(lesson => lesson.status === 'implemented').length
      const implementationRate = lessons.length > 0 ? (implementedCount / lessons.length) * 100 : 0

      // Average resolution time
      const resolvedLessons = lessons.filter(lesson => 
        lesson.timeline.discoveryDate && lesson.timeline.resolutionDate
      )
      const averageResolutionTime = resolvedLessons.length > 0 
        ? resolvedLessons.reduce((sum, lesson) => {
            const discovery = new Date(lesson.timeline.discoveryDate)
            const resolution = new Date(lesson.timeline.resolutionDate!)
            return sum + (resolution.getTime() - discovery.getTime()) / (1000 * 60 * 60 * 24) // days
          }, 0) / resolvedLessons.length
        : 0

      // Financial impact
      const financialImpact = lessons.reduce((acc, lesson) => {
        if (lesson.financialImpact) {
          acc.totalCostSavings += lesson.financialImpact.costSavings || 0
          acc.totalRevenueLoss += lesson.financialImpact.revenueLoss || 0
          acc.totalAdditionalCosts += lesson.financialImpact.additionalCosts || 0
        }
        return acc
      }, {
        totalCostSavings: 0,
        totalRevenueLoss: 0,
        totalAdditionalCosts: 0,
        netImpact: 0
      })

      financialImpact.netImpact = financialImpact.totalCostSavings - 
                                  financialImpact.totalRevenueLoss - 
                                  financialImpact.totalAdditionalCosts

      return {
        totalLessons: lessons.length,
        byCategory,
        byImpact,
        byStatus,
        recentLessons,
        highImpactLessons,
        implementationRate,
        averageResolutionTime,
        financialImpact
      }

    } catch (error) {
      console.error('Error getting analytics:', error)
      throw new Error('Failed to generate lessons learned analytics')
    }
  }

  /**
   * Generate a lesson template from bid performance data
   */
  async generateLessonFromBidPerformance(bidPerformance: BidPerformance): Promise<Partial<LessonLearned>> {
    try {
      const isWon = bidPerformance.outcome === 'won'
      const isLost = bidPerformance.outcome === 'lost'
      
      let category: LessonCategory = 'bidding_strategy'
      let impact: LessonImpact = 'medium'
      let title = ''
      let description = ''
      let whatWentWell = ''
      let whatWentWrong = ''
      let recommendations: string[] = []

      // Determine category based on performance characteristics
      if (bidPerformance.plannedMargin < 5 || bidPerformance.plannedMargin > 30) {
        category = 'pricing'
      } else if (bidPerformance.riskScore > 70) {
        category = 'risk_management'
      } else if (bidPerformance.competitorCount > 8) {
        category = 'market_intelligence'
      }

      // Determine impact based on bid value and outcome
      if (bidPerformance.bidAmount > 10000000) {
        impact = bidPerformance.outcome === 'lost' ? 'critical' : 'high'
      } else if (bidPerformance.bidAmount > 1000000) {
        impact = 'high'
      }

      // Generate content based on outcome
      if (isWon) {
        title = `نجاح في الفوز بمناقصة ${bidPerformance.category} - ${bidPerformance.region}`
        description = `تم الفوز بمناقصة بقيمة ${bidPerformance.bidAmount.toLocaleString()} ريال سعودي بهامش ربح ${bidPerformance.plannedMargin}%`
        whatWentWell = `استراتيجية التسعير كانت فعالة، وتم تقدير المخاطر بشكل صحيح`
        recommendations = [
          'تطبيق نفس استراتيجية التسعير في مناقصات مشابهة',
          'توثيق العوامل التي ساهمت في النجاح',
          'مشاركة أفضل الممارسات مع الفريق'
        ]
      } else if (isLost) {
        title = `عدم الفوز في مناقصة ${bidPerformance.category} - ${bidPerformance.region}`
        description = `لم يتم الفوز بمناقصة بقيمة ${bidPerformance.bidAmount.toLocaleString()} ريال سعودي`
        
        if (bidPerformance.competitorCount > 8) {
          whatWentWrong = 'منافسة شديدة مع عدد كبير من المنافسين'
          recommendations.push('تحسين استراتيجية اختيار المناقصات لتجنب المنافسة المفرطة')
        }
        
        if (bidPerformance.plannedMargin > 20) {
          whatWentWrong += (whatWentWrong ? '، ' : '') + 'هامش ربح مرتفع قد يكون أثر على التنافسية'
          recommendations.push('مراجعة استراتيجية التسعير لتحقيق توازن أفضل بين الربحية والتنافسية')
        }
        
        recommendations.push('تحليل عروض المنافسين لفهم نقاط القوة والضعف')
      }

      return {
        title,
        description,
        category,
        impact,
        status: 'draft',
        relatedTenderId: bidPerformance.tenderId,
        relatedBidId: bidPerformance.id,
        whatWentWell: whatWentWell || undefined,
        whatWentWrong: whatWentWrong || undefined,
        correctiveActions: [],
        preventiveMeasures: [],
        recommendations,
        tags: [bidPerformance.category, bidPerformance.region, bidPerformance.outcome],
        stakeholders: [],
        timeline: {
          discoveryDate: new Date().toISOString(),
          incidentDate: bidPerformance.submissionDate
        },
        attachments: [],
        createdBy: 'system',
        updatedBy: 'system'
      }

    } catch (error) {
      console.error('Error generating lesson from bid performance:', error)
      throw new Error('Failed to generate lesson from bid performance')
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateId(): string {
    return `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private applyFilters(lessons: LessonLearned[], query: LessonQuery): LessonLearned[] {
    let filtered = lessons

    if (query.searchTerm) {
      const term = query.searchTerm.toLowerCase()
      filtered = filtered.filter(lesson => 
        lesson.title.toLowerCase().includes(term) ||
        lesson.description.toLowerCase().includes(term) ||
        lesson.tags.some(tag => tag.toLowerCase().includes(term))
      )
    }

    if (query.categories && query.categories.length > 0) {
      filtered = filtered.filter(lesson => query.categories!.includes(lesson.category))
    }

    if (query.impacts && query.impacts.length > 0) {
      filtered = filtered.filter(lesson => query.impacts!.includes(lesson.impact))
    }

    if (query.statuses && query.statuses.length > 0) {
      filtered = filtered.filter(lesson => query.statuses!.includes(lesson.status))
    }

    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter(lesson => 
        query.tags!.some(tag => lesson.tags.includes(tag))
      )
    }

    if (query.dateRange) {
      filtered = filtered.filter(lesson => 
        lesson.createdAt >= query.dateRange!.start && 
        lesson.createdAt <= query.dateRange!.end
      )
    }

    if (query.relatedTenderId) {
      filtered = filtered.filter(lesson => lesson.relatedTenderId === query.relatedTenderId)
    }

    return filtered
  }

  private applySorting(lessons: LessonLearned[], query: LessonQuery): LessonLearned[] {
    if (!query.sortBy) return lessons

    const sortDirection = query.sortDirection || 'desc'
    
    return lessons.sort((a, b) => {
      let aValue: any, bValue: any

      switch (query.sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        case 'impact':
          const impactOrder = { low: 1, medium: 2, high: 3, critical: 4 }
          aValue = impactOrder[a.impact]
          bValue = impactOrder[b.impact]
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  private applyPagination(lessons: LessonLearned[], query: LessonQuery): LessonLearned[] {
    if (!query.page || !query.pageSize) return lessons

    const startIndex = (query.page - 1) * query.pageSize
    const endIndex = startIndex + query.pageSize
    
    return lessons.slice(startIndex, endIndex)
  }
}

// Export singleton instance
export const lessonsLearnedService = new LessonsLearnedService()

/**
 * Convenience functions
 */
export async function createLessonFromBid(bidPerformance: BidPerformance): Promise<Partial<LessonLearned>> {
  return lessonsLearnedService.generateLessonFromBidPerformance(bidPerformance)
}

export async function searchLessons(searchTerm: string): Promise<LessonLearned[]> {
  return lessonsLearnedService.searchLessons(searchTerm)
}

export async function getLessonsAnalytics(): Promise<LessonAnalytics> {
  return lessonsLearnedService.getAnalytics()
}
