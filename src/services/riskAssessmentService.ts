/**
 * @fileoverview Risk Assessment Service Implementation
 * @description Comprehensive service for managing risk assessments in the bidding system.
 * Provides risk calculation, factor management, margin recommendations, and assessment persistence.
 *
 * @author Desktop Management System Team
 * @version 1.0.0
 * @since Phase 1 Implementation
 *
 * @example
 * ```typescript
 * import { riskAssessmentService } from '@/services/riskAssessmentService'
 *
 * // Create a risk assessment
 * const assessment = await riskAssessmentService.createAssessment('tender-123', {
 *   factors: [
 *     { name: 'التعقيد التقني', impact: 4, probability: 3, mitigation: 'خطة تقنية مفصلة' }
 *   ]
 * })
 *
 * // Calculate risk score
 * const score = riskAssessmentService.calculateRiskScore(assessment.factors)
 * ```
 */

import type {
  RiskAssessment,
  RiskAssessmentService,
  RiskFactor,
  RiskLevel
} from '@/types/templates'
import { STORAGE_KEYS, safeLocalStorage } from '@/utils/storage'

/**
 * Risk Assessment Service Implementation Class
 *
 * @class RiskAssessmentServiceImpl
 * @implements {RiskAssessmentService}
 * @description Manages risk assessments with local storage persistence.
 * Provides risk calculation, factor analysis, margin recommendations, and assessment lifecycle management.
 */
class RiskAssessmentServiceImpl implements RiskAssessmentService {
  /** Storage key for risk assessments in local storage */
  private readonly storageKey = STORAGE_KEYS.RISK_ASSESSMENTS

  /**
   * Creates a new risk assessment for a tender
   *
   * @param {string} tenderId - The unique identifier of the tender
   * @param {RiskAssessment} assessment - The risk assessment data
   * @returns {Promise<void>} Promise that resolves when assessment is saved
   * @throws {Error} When assessment creation fails
   *
   * @example
   * ```typescript
   * await riskAssessmentService.createAssessment('tender-123', {
   *   factors: [
   *     { name: 'مخاطر الطقس', impact: 3, probability: 4, mitigation: 'خطة طوارئ' }
   *   ],
   *   totalScore: 12,
   *   riskLevel: 'medium',
   *   recommendedMargin: 15
   * })
   * ```
   */
  async createAssessment(tenderId: string, assessment: RiskAssessment): Promise<void> {
    const assessments = await this.getAssessments()
    assessments[tenderId] = {
      ...assessment,
      riskScore: this.calculateRiskScore(assessment.factors),
      recommendedMargin: this.getRecommendedMargin(assessment.riskScore)
    }
    await this.saveAssessments(assessments)
  }

  async getAssessment(tenderId: string): Promise<RiskAssessment | null> {
    const assessments = await this.getAssessments()
    return assessments[tenderId] || null
  }

  async updateAssessment(tenderId: string, assessment: RiskAssessment): Promise<void> {
    const assessments = await this.getAssessments()
    if (!assessments[tenderId]) {
      throw new Error(`Risk assessment for tender ${tenderId} not found`)
    }
    
    assessments[tenderId] = {
      ...assessment,
      riskScore: this.calculateRiskScore(assessment.factors),
      recommendedMargin: this.getRecommendedMargin(assessment.riskScore)
    }
    await this.saveAssessments(assessments)
  }

  async deleteAssessment(tenderId: string): Promise<void> {
    const assessments = await this.getAssessments()
    delete assessments[tenderId]
    await this.saveAssessments(assessments)
  }

  calculateRiskScore(factors: RiskFactor[]): number {
    const totalRiskScore = factors.reduce((sum, factor) => {
      return sum + (factor.impact * factor.probability)
    }, 0)

    const maxPossibleScore = factors.length * 25 // 5 * 5 for each factor
    return maxPossibleScore > 0 ? (totalRiskScore / maxPossibleScore) * 100 : 0
  }

  getRecommendedMargin(riskScore: number): number {
    if (riskScore <= 25) return 15      // Low risk
    if (riskScore <= 50) return 20      // Medium risk
    if (riskScore <= 75) return 25      // High risk
    return 35                           // Critical risk
  }

  getRiskLevel(riskScore: number): RiskLevel {
    if (riskScore <= 25) return 'low'
    if (riskScore <= 50) return 'medium'
    if (riskScore <= 75) return 'high'
    return 'critical'
  }

  private async getAssessments(): Promise<Record<string, RiskAssessment>> {
    try {
      const stored = safeLocalStorage.getItem(this.storageKey, {})
      return typeof stored === 'string' ? JSON.parse(stored) : stored
    } catch (error) {
      console.error('Error loading risk assessments:', error)
      return {}
    }
  }

  private async saveAssessments(assessments: Record<string, RiskAssessment>): Promise<void> {
    try {
      safeLocalStorage.setItem(this.storageKey, assessments)
    } catch (error) {
      console.error('Error saving risk assessments:', error)
      throw new Error('Failed to save risk assessments')
    }
  }

  // Risk analysis utilities
  async getRiskStatistics(): Promise<{
    totalAssessments: number
    averageRiskScore: number
    riskDistribution: Record<RiskLevel, number>
    highRiskTenders: string[]
  }> {
    const assessments = await this.getAssessments()
    const entries = Object.entries(assessments)
    
    if (entries.length === 0) {
      return {
        totalAssessments: 0,
        averageRiskScore: 0,
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        highRiskTenders: []
      }
    }

    const totalRiskScore = entries.reduce((sum, [, assessment]) => sum + assessment.riskScore, 0)
    const averageRiskScore = totalRiskScore / entries.length

    const riskDistribution = entries.reduce((dist, [, assessment]) => {
      const level = this.getRiskLevel(assessment.riskScore)
      dist[level]++
      return dist
    }, { low: 0, medium: 0, high: 0, critical: 0 })

    const highRiskTenders = entries
      .filter(([, assessment]) => assessment.riskScore > 50)
      .map(([tenderId]) => tenderId)

    return {
      totalAssessments: entries.length,
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      riskDistribution,
      highRiskTenders
    }
  }

  async getDefaultRiskFactors(): Promise<RiskFactor[]> {
    // This would typically come from a configuration or database
    // For now, returning a default set
    return [
      {
        id: 'technical_complexity',
        name: 'التعقيد التقني',
        description: 'مستوى التعقيد التقني للمشروع والتقنيات المطلوبة',
        category: 'technical',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null // Will be set by the component
      },
      {
        id: 'project_size',
        name: 'حجم المشروع',
        description: 'حجم وقيمة المشروع مقارنة بقدرات الشركة',
        category: 'technical',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null
      },
      {
        id: 'client_payment_history',
        name: 'تاريخ دفع العميل',
        description: 'سجل العميل في الدفع والالتزام بالعقود السابقة',
        category: 'financial',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null
      },
      {
        id: 'cash_flow_impact',
        name: 'تأثير التدفق النقدي',
        description: 'تأثير المشروع على التدفق النقدي للشركة',
        category: 'financial',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null
      },
      {
        id: 'timeline_pressure',
        name: 'ضغط الجدول الزمني',
        description: 'مدى ضيق الجدول الزمني المطلوب للتنفيذ',
        category: 'schedule',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null
      },
      {
        id: 'resource_availability',
        name: 'توفر الموارد',
        description: 'توفر العمالة والمعدات والمواد المطلوبة',
        category: 'schedule',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null
      },
      {
        id: 'contract_terms',
        name: 'شروط العقد',
        description: 'مدى عدالة وقابلية تنفيذ شروط العقد',
        category: 'commercial',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null
      },
      {
        id: 'competition_level',
        name: 'مستوى المنافسة',
        description: 'عدد وقوة المنافسين في هذه المناقصة',
        category: 'commercial',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null
      },
      {
        id: 'market_conditions',
        name: 'ظروف السوق',
        description: 'الظروف الاقتصادية والسوقية العامة',
        category: 'external',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null
      },
      {
        id: 'regulatory_changes',
        name: 'التغييرات التنظيمية',
        description: 'احتمالية تغيير القوانين أو اللوائح المؤثرة',
        category: 'external',
        impact: 3,
        probability: 3,
        mitigation: '',
        icon: () => null
      }
    ]
  }

  async createAssessmentFromTemplate(tenderId: string, templateId?: string): Promise<RiskAssessment> {
    const defaultFactors = await this.getDefaultRiskFactors()
    
    // If a template is provided, you could adjust the default factors based on the template
    // For now, just using the default factors
    
    const assessment: RiskAssessment = {
      factors: defaultFactors,
      overallRiskLevel: 'medium',
      riskScore: this.calculateRiskScore(defaultFactors),
      recommendedMargin: 20,
      mitigationPlan: ''
    }

    assessment.overallRiskLevel = this.getRiskLevel(assessment.riskScore)
    assessment.recommendedMargin = this.getRecommendedMargin(assessment.riskScore)

    return assessment
  }
}

export const riskAssessmentService = new RiskAssessmentServiceImpl()
export type { RiskAssessmentService }
