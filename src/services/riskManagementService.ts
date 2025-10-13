/**
 * Risk Management Service
 * خدمة إدارة المخاطر
 */

import { asyncStorage } from '../utils/storage'
import type {
  Risk,
  RiskRegister,
  RiskMatrix,
  RiskAnalysis,
  RiskMitigationAction,
  RiskComment,
  RiskAttachment,
  CreateRiskRequest,
  UpdateRiskRequest,
  RiskFilters,
  RiskSortOptions,
  RiskManagementServiceInterface,
  RiskProbability,
  RiskImpact,
  RiskCategory,
  RiskStatus
} from '../types/risk'

class RiskManagementServiceImpl implements RiskManagementServiceInterface {
  private readonly STORAGE_KEYS = {
    RISKS: 'risks',
    RISK_REGISTERS: 'risk_registers',
    RISK_MATRICES: 'risk_matrices',
    MITIGATION_ACTIONS: 'mitigation_actions',
    RISK_COMMENTS: 'risk_comments',
    RISK_ATTACHMENTS: 'risk_attachments'
  } as const

  /**
   * إنشاء مخاطرة جديدة
   */
  async createRisk(request: CreateRiskRequest): Promise<Risk> {
    try {
      const risks = await this.getAllRisks()
      
      const newRisk: Risk = {
        id: this.generateId(),
        projectId: request.projectId,
        title: request.title,
        titleEn: request.titleEn,
        description: request.description,
        descriptionEn: request.descriptionEn,
        category: request.category,
        probability: request.probability,
        impact: request.impact,
        riskScore: this.calculateRiskScore(request.probability, request.impact),
        status: 'identified',
        responseStrategy: request.responseStrategy,
        identifiedBy: 'current-user', // TODO: Get from auth context
        identifiedDate: new Date().toISOString(),
        potentialCost: request.potentialCost,
        potentialDelay: request.potentialDelay,
        responsePlan: request.responsePlan,
        responsePlanEn: request.responsePlanEn,
        mitigationActions: [],
        monitoringFrequency: request.monitoringFrequency || 'monthly',
        attachments: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      risks.push(newRisk)
      await asyncStorage.setItem(this.STORAGE_KEYS.RISKS, risks)

      // تحديث سجل المخاطر
      await this.updateRiskRegister(request.projectId)

      return newRisk
    } catch (error) {
      console.error('Error creating risk:', error)
      throw new Error('فشل في إنشاء المخاطرة')
    }
  }

  /**
   * جلب مخاطرة محددة
   */
  async getRisk(riskId: string): Promise<Risk | null> {
    try {
      const risks = await this.getAllRisks()
      return risks.find(risk => risk.id === riskId) || null
    } catch (error) {
      console.error('Error getting risk:', error)
      return null
    }
  }

  /**
   * تحديث مخاطرة
   */
  async updateRisk(riskId: string, updates: UpdateRiskRequest): Promise<Risk> {
    try {
      const risks = await this.getAllRisks()
      const riskIndex = risks.findIndex(risk => risk.id === riskId)
      
      if (riskIndex === -1) {
        throw new Error('المخاطرة غير موجودة')
      }

      const existingRisk = risks[riskIndex]
      const updatedRisk: Risk = {
        ...existingRisk,
        ...updates,
        riskScore: updates.probability && updates.impact 
          ? this.calculateRiskScore(updates.probability, updates.impact)
          : updates.probability 
            ? this.calculateRiskScore(updates.probability, existingRisk.impact)
            : updates.impact
              ? this.calculateRiskScore(existingRisk.probability, updates.impact)
              : existingRisk.riskScore,
        updatedAt: new Date().toISOString(),
        version: existingRisk.version + 1
      }

      risks[riskIndex] = updatedRisk
      await asyncStorage.setItem(this.STORAGE_KEYS.RISKS, risks)

      // تحديث سجل المخاطر
      await this.updateRiskRegister(updatedRisk.projectId)

      return updatedRisk
    } catch (error) {
      console.error('Error updating risk:', error)
      throw new Error('فشل في تحديث المخاطرة')
    }
  }

  /**
   * حذف مخاطرة
   */
  async deleteRisk(riskId: string): Promise<void> {
    try {
      const risks = await this.getAllRisks()
      const riskIndex = risks.findIndex(risk => risk.id === riskId)
      
      if (riskIndex === -1) {
        throw new Error('المخاطرة غير موجودة')
      }

      const risk = risks[riskIndex]
      risks.splice(riskIndex, 1)
      await asyncStorage.setItem(this.STORAGE_KEYS.RISKS, risks)

      // حذف الإجراءات والتعليقات والمرفقات المرتبطة
      await this.deleteMitigationActionsByRisk(riskId)
      await this.deleteCommentsByRisk(riskId)
      await this.deleteAttachmentsByRisk(riskId)

      // تحديث سجل المخاطر
      await this.updateRiskRegister(risk.projectId)
    } catch (error) {
      console.error('Error deleting risk:', error)
      throw new Error('فشل في حذف المخاطرة')
    }
  }

  /**
   * جلب مخاطر المشروع
   */
  async getRisksByProject(
    projectId: string, 
    filters?: RiskFilters, 
    sort?: RiskSortOptions
  ): Promise<Risk[]> {
    try {
      const allRisks = await this.getAllRisks()
      let projectRisks = allRisks.filter(risk => risk.projectId === projectId)

      // تطبيق الفلاتر
      if (filters) {
        projectRisks = this.applyFilters(projectRisks, filters)
      }

      // تطبيق الترتيب
      if (sort) {
        projectRisks = this.applySorting(projectRisks, sort)
      }

      return projectRisks
    } catch (error) {
      console.error('Error getting project risks:', error)
      return []
    }
  }

  /**
   * جلب سجل المخاطر
   */
  async getRiskRegister(projectId: string): Promise<RiskRegister> {
    try {
      const registers = await asyncStorage.getItem<RiskRegister[]>(this.STORAGE_KEYS.RISK_REGISTERS) || []
      let register = registers.find(r => r.projectId === projectId)

      if (!register) {
        register = await this.createRiskRegister(projectId)
      }

      return register
    } catch (error) {
      console.error('Error getting risk register:', error)
      throw new Error('فشل في جلب سجل المخاطر')
    }
  }

  /**
   * تقييم المخاطرة
   */
  async assessRisk(
    riskId: string, 
    probability: RiskProbability, 
    impact: RiskImpact, 
    assessedBy: string
  ): Promise<Risk> {
    try {
      const updatedRisk = await this.updateRisk(riskId, {
        probability,
        impact,
        status: 'assessed',
        assessedBy,
        assessedDate: new Date().toISOString()
      })

      return updatedRisk
    } catch (error) {
      console.error('Error assessing risk:', error)
      throw new Error('فشل في تقييم المخاطرة')
    }
  }

  /**
   * حساب نقاط المخاطرة
   */
  calculateRiskScore(probability: RiskProbability, impact: RiskImpact): number {
    const probabilityScores = {
      very_low: 1,
      low: 2,
      medium: 3,
      high: 4,
      very_high: 5
    }

    const impactScores = {
      very_low: 1,
      low: 2,
      medium: 3,
      high: 4,
      very_high: 5
    }

    return probabilityScores[probability] * impactScores[impact]
  }

  /**
   * إضافة إجراء تخفيف
   */
  async addMitigationAction(
    riskId: string, 
    action: Omit<RiskMitigationAction, 'id' | 'riskId' | 'createdAt' | 'updatedAt'>
  ): Promise<RiskMitigationAction> {
    try {
      const actions = await asyncStorage.getItem<RiskMitigationAction[]>(this.STORAGE_KEYS.MITIGATION_ACTIONS) || []
      
      const newAction: RiskMitigationAction = {
        ...action,
        id: this.generateId(),
        riskId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      actions.push(newAction)
      await asyncStorage.setItem(this.STORAGE_KEYS.MITIGATION_ACTIONS, actions)

      // تحديث المخاطرة
      const risk = await this.getRisk(riskId)
      if (risk) {
        risk.mitigationActions.push(newAction)
        await this.updateRisk(riskId, { status: 'mitigated' })
      }

      return newAction
    } catch (error) {
      console.error('Error adding mitigation action:', error)
      throw new Error('فشل في إضافة إجراء التخفيف')
    }
  }

  /**
   * تحديث إجراء تخفيف
   */
  async updateMitigationAction(
    actionId: string, 
    updates: Partial<RiskMitigationAction>
  ): Promise<RiskMitigationAction> {
    try {
      const actions = await asyncStorage.getItem<RiskMitigationAction[]>(this.STORAGE_KEYS.MITIGATION_ACTIONS) || []
      const actionIndex = actions.findIndex(action => action.id === actionId)
      
      if (actionIndex === -1) {
        throw new Error('إجراء التخفيف غير موجود')
      }

      const updatedAction = {
        ...actions[actionIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      actions[actionIndex] = updatedAction
      await asyncStorage.setItem(this.STORAGE_KEYS.MITIGATION_ACTIONS, actions)

      return updatedAction
    } catch (error) {
      console.error('Error updating mitigation action:', error)
      throw new Error('فشل في تحديث إجراء التخفيف')
    }
  }

  /**
   * حذف إجراء تخفيف
   */
  async deleteMitigationAction(actionId: string): Promise<void> {
    try {
      const actions = await asyncStorage.getItem<RiskMitigationAction[]>(this.STORAGE_KEYS.MITIGATION_ACTIONS) || []
      const filteredActions = actions.filter(action => action.id !== actionId)
      await asyncStorage.setItem(this.STORAGE_KEYS.MITIGATION_ACTIONS, filteredActions)
    } catch (error) {
      console.error('Error deleting mitigation action:', error)
      throw new Error('فشل في حذف إجراء التخفيف')
    }
  }

  /**
   * جلب مصفوفة المخاطر
   */
  async getRiskMatrix(projectId: string): Promise<RiskMatrix> {
    try {
      const matrices = await asyncStorage.getItem<RiskMatrix[]>(this.STORAGE_KEYS.RISK_MATRICES) || []
      let matrix = matrices.find(m => m.projectId === projectId)

      if (!matrix) {
        matrix = this.createDefaultRiskMatrix(projectId)
        matrices.push(matrix)
        await asyncStorage.setItem(this.STORAGE_KEYS.RISK_MATRICES, matrices)
      }

      return matrix
    } catch (error) {
      console.error('Error getting risk matrix:', error)
      throw new Error('فشل في جلب مصفوفة المخاطر')
    }
  }

  /**
   * تحديث مصفوفة المخاطر
   */
  async updateRiskMatrix(projectId: string, updates: Partial<RiskMatrix>): Promise<RiskMatrix> {
    try {
      const matrices = await asyncStorage.getItem<RiskMatrix[]>(this.STORAGE_KEYS.RISK_MATRICES) || []
      const matrixIndex = matrices.findIndex(m => m.projectId === projectId)
      
      if (matrixIndex === -1) {
        throw new Error('مصفوفة المخاطر غير موجودة')
      }

      const updatedMatrix = {
        ...matrices[matrixIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
        version: matrices[matrixIndex].version + 1
      }

      matrices[matrixIndex] = updatedMatrix
      await asyncStorage.setItem(this.STORAGE_KEYS.RISK_MATRICES, matrices)

      return updatedMatrix
    } catch (error) {
      console.error('Error updating risk matrix:', error)
      throw new Error('فشل في تحديث مصفوفة المخاطر')
    }
  }

  // المزيد من الطرق سيتم إضافتها في الجزء التالي...

  /**
   * طرق مساعدة خاصة
   */
  private async getAllRisks(): Promise<Risk[]> {
    return await asyncStorage.getItem<Risk[]>(this.STORAGE_KEYS.RISKS) || []
  }

  private generateId(): string {
    return `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private applyFilters(risks: Risk[], filters: RiskFilters): Risk[] {
    return risks.filter(risk => {
      if (filters.category && !filters.category.includes(risk.category)) return false
      if (filters.status && !filters.status.includes(risk.status)) return false
      if (filters.probability && !filters.probability.includes(risk.probability)) return false
      if (filters.impact && !filters.impact.includes(risk.impact)) return false
      
      if (filters.level) {
        const level = this.getRiskLevel(risk.riskScore)
        if (!filters.level.includes(level)) return false
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        if (!risk.title.toLowerCase().includes(query) && 
            !risk.description.toLowerCase().includes(query)) return false
      }

      return true
    })
  }

  private applySorting(risks: Risk[], sort: RiskSortOptions): Risk[] {
    return risks.sort((a, b) => {
      let aValue: any = a[sort.field]
      let bValue: any = b[sort.field]

      if (sort.field === 'identifiedDate' || sort.field === 'nextReviewDate') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 4) return 'low'
    if (score <= 9) return 'medium'
    if (score <= 16) return 'high'
    return 'critical'
  }

  private async createRiskRegister(projectId: string): Promise<RiskRegister> {
    const register: RiskRegister = {
      id: this.generateId(),
      projectId,
      name: 'سجل مخاطر المشروع',
      nameEn: 'Project Risk Register',
      risks: [],
      totalRisks: 0,
      risksByCategory: {} as Record<RiskCategory, number>,
      risksByStatus: {} as Record<RiskStatus, number>,
      risksByLevel: { low: 0, medium: 0, high: 0, critical: 0 },
      averageRiskScore: 0,
      highestRiskScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    }

    const registers = await asyncStorage.getItem<RiskRegister[]>(this.STORAGE_KEYS.RISK_REGISTERS) || []
    registers.push(register)
    await asyncStorage.setItem(this.STORAGE_KEYS.RISK_REGISTERS, registers)

    return register
  }

  private async updateRiskRegister(projectId: string): Promise<void> {
    try {
      const registers = await asyncStorage.getItem<RiskRegister[]>(this.STORAGE_KEYS.RISK_REGISTERS) || []
      const registerIndex = registers.findIndex(r => r.projectId === projectId)

      if (registerIndex === -1) return

      const risks = await this.getRisksByProject(projectId)
      const register = registers[registerIndex]

      // تحديث الإحصائيات
      register.risks = risks
      register.totalRisks = risks.length
      register.risksByCategory = this.calculateRisksByCategory(risks)
      register.risksByStatus = this.calculateRisksByStatus(risks)
      register.risksByLevel = this.calculateRisksByLevel(risks)
      register.averageRiskScore = this.calculateAverageRiskScore(risks)
      register.highestRiskScore = this.calculateHighestRiskScore(risks)
      register.updatedAt = new Date().toISOString()
      register.version += 1

      registers[registerIndex] = register
      await asyncStorage.setItem(this.STORAGE_KEYS.RISK_REGISTERS, registers)
    } catch (error) {
      console.error('Error updating risk register:', error)
    }
  }

  private createDefaultRiskMatrix(projectId: string): RiskMatrix {
    return {
      id: this.generateId(),
      projectId,
      name: 'مصفوفة المخاطر الافتراضية',
      nameEn: 'Default Risk Matrix',
      description: 'مصفوفة تقييم المخاطر الافتراضية للمشروع',
      matrix: {
        very_low: {
          very_low: { level: 'low', color: '#22c55e', actionRequired: 'مراقبة دورية' },
          low: { level: 'low', color: '#22c55e', actionRequired: 'مراقبة دورية' },
          medium: { level: 'low', color: '#eab308', actionRequired: 'مراقبة شهرية' },
          high: { level: 'medium', color: '#f97316', actionRequired: 'خطة تخفيف' },
          very_high: { level: 'medium', color: '#f97316', actionRequired: 'خطة تخفيف فورية' }
        },
        low: {
          very_low: { level: 'low', color: '#22c55e', actionRequired: 'مراقبة دورية' },
          low: { level: 'low', color: '#eab308', actionRequired: 'مراقبة شهرية' },
          medium: { level: 'medium', color: '#f97316', actionRequired: 'خطة تخفيف' },
          high: { level: 'medium', color: '#f97316', actionRequired: 'خطة تخفيف فورية' },
          very_high: { level: 'high', color: '#ef4444', actionRequired: 'إجراء فوري' }
        },
        medium: {
          very_low: { level: 'low', color: '#eab308', actionRequired: 'مراقبة شهرية' },
          low: { level: 'medium', color: '#f97316', actionRequired: 'خطة تخفيف' },
          medium: { level: 'medium', color: '#f97316', actionRequired: 'خطة تخفيف فورية' },
          high: { level: 'high', color: '#ef4444', actionRequired: 'إجراء فوري' },
          very_high: { level: 'critical', color: '#dc2626', actionRequired: 'تصعيد فوري' }
        },
        high: {
          very_low: { level: 'medium', color: '#f97316', actionRequired: 'خطة تخفيف' },
          low: { level: 'medium', color: '#f97316', actionRequired: 'خطة تخفيف فورية' },
          medium: { level: 'high', color: '#ef4444', actionRequired: 'إجراء فوري' },
          high: { level: 'critical', color: '#dc2626', actionRequired: 'تصعيد فوري' },
          very_high: { level: 'critical', color: '#dc2626', actionRequired: 'إيقاف المشروع' }
        },
        very_high: {
          very_low: { level: 'medium', color: '#f97316', actionRequired: 'خطة تخفيف فورية' },
          low: { level: 'high', color: '#ef4444', actionRequired: 'إجراء فوري' },
          medium: { level: 'critical', color: '#dc2626', actionRequired: 'تصعيد فوري' },
          high: { level: 'critical', color: '#dc2626', actionRequired: 'إيقاف المشروع' },
          very_high: { level: 'critical', color: '#dc2626', actionRequired: 'إيقاف المشروع' }
        }
      },
      thresholds: {
        low: { min: 1, max: 4, color: '#22c55e' },
        medium: { min: 5, max: 9, color: '#f97316' },
        high: { min: 10, max: 16, color: '#ef4444' },
        critical: { min: 17, max: 25, color: '#dc2626' }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    }
  }

  private async deleteMitigationActionsByRisk(riskId: string): Promise<void> {
    try {
      const actions = await asyncStorage.getItem<RiskMitigationAction[]>(this.STORAGE_KEYS.MITIGATION_ACTIONS) || []
      const filteredActions = actions.filter(action => action.riskId !== riskId)
      await asyncStorage.setItem(this.STORAGE_KEYS.MITIGATION_ACTIONS, filteredActions)
    } catch (error) {
      console.error('Error deleting mitigation actions:', error)
    }
  }

  private async deleteCommentsByRisk(riskId: string): Promise<void> {
    try {
      const comments = await asyncStorage.getItem<RiskComment[]>(this.STORAGE_KEYS.RISK_COMMENTS) || []
      const filteredComments = comments.filter(comment => comment.riskId !== riskId)
      await asyncStorage.setItem(this.STORAGE_KEYS.RISK_COMMENTS, filteredComments)
    } catch (error) {
      console.error('Error deleting comments:', error)
    }
  }

  private async deleteAttachmentsByRisk(riskId: string): Promise<void> {
    try {
      const attachments = await asyncStorage.getItem<RiskAttachment[]>(this.STORAGE_KEYS.RISK_ATTACHMENTS) || []
      const filteredAttachments = attachments.filter(attachment => attachment.riskId !== riskId)
      await asyncStorage.setItem(this.STORAGE_KEYS.RISK_ATTACHMENTS, filteredAttachments)
    } catch (error) {
      console.error('Error deleting attachments:', error)
    }
  }

  private calculateRisksByCategory(risks: Risk[]): Record<RiskCategory, number> {
    const categories: Record<RiskCategory, number> = {
      technical: 0, financial: 0, schedule: 0, resource: 0, quality: 0,
      safety: 0, environmental: 0, regulatory: 0, external: 0, operational: 0
    }

    risks.forEach(risk => {
      categories[risk.category] = (categories[risk.category] || 0) + 1
    })

    return categories
  }

  private calculateRisksByStatus(risks: Risk[]): Record<RiskStatus, number> {
    const statuses: Record<RiskStatus, number> = {
      identified: 0, assessed: 0, mitigated: 0, monitored: 0, closed: 0, escalated: 0
    }

    risks.forEach(risk => {
      statuses[risk.status] = (statuses[risk.status] || 0) + 1
    })

    return statuses
  }

  private calculateRisksByLevel(risks: Risk[]): Record<'low' | 'medium' | 'high' | 'critical', number> {
    const levels = { low: 0, medium: 0, high: 0, critical: 0 }

    risks.forEach(risk => {
      const level = this.getRiskLevel(risk.riskScore)
      levels[level] += 1
    })

    return levels
  }

  private calculateAverageRiskScore(risks: Risk[]): number {
    if (risks.length === 0) return 0
    const total = risks.reduce((sum, risk) => sum + risk.riskScore, 0)
    return Math.round((total / risks.length) * 100) / 100
  }

  private calculateHighestRiskScore(risks: Risk[]): number {
    if (risks.length === 0) return 0
    return Math.max(...risks.map(risk => risk.riskScore))
  }

  /**
   * تحليل المخاطر
   */
  async analyzeRisks(projectId: string): Promise<RiskAnalysis> {
    try {
      const risks = await this.getRisksByProject(projectId)
      const currentDate = new Date()
      const oneMonthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)

      const analysis: RiskAnalysis = {
        projectId,
        analysisDate: currentDate.toISOString(),
        totalRisks: risks.length,
        distributionByCategory: this.calculateRisksByCategory(risks),
        distributionByStatus: this.calculateRisksByStatus(risks),
        distributionByLevel: this.calculateRisksByLevel(risks),
        averageRiskScore: this.calculateAverageRiskScore(risks),
        medianRiskScore: this.calculateMedianRiskScore(risks),
        highestRiskScore: this.calculateHighestRiskScore(risks),
        lowestRiskScore: this.calculateLowestRiskScore(risks),
        trends: {
          newRisksThisMonth: risks.filter(r => new Date(r.createdAt) >= oneMonthAgo).length,
          closedRisksThisMonth: risks.filter(r => r.status === 'closed' && r.closedAt && new Date(r.closedAt) >= oneMonthAgo).length,
          escalatedRisksThisMonth: risks.filter(r => r.status === 'escalated' && new Date(r.updatedAt) >= oneMonthAgo).length,
          riskScoreChange: 0 // TODO: Calculate based on historical data
        },
        recommendations: {
          criticalRisks: risks.filter(r => this.getRiskLevel(r.riskScore) === 'critical'),
          overdueActions: [], // TODO: Get from mitigation actions
          upcomingReviews: risks.filter(r => r.nextReviewDate && new Date(r.nextReviewDate) <= new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)),
          budgetImpact: risks.reduce((sum, r) => sum + (r.potentialCost || 0), 0),
          scheduleImpact: risks.reduce((sum, r) => sum + (r.potentialDelay || 0), 0)
        }
      }

      return analysis
    } catch (error) {
      console.error('Error analyzing risks:', error)
      throw new Error('فشل في تحليل المخاطر')
    }
  }

  /**
   * إنتاج تقرير المخاطر
   */
  async generateRiskReport(projectId: string, format: 'pdf' | 'excel'): Promise<Blob> {
    try {
      const risks = await this.getRisksByProject(projectId)
      const analysis = await this.analyzeRisks(projectId)

      // TODO: Implement actual report generation
      const reportData = {
        projectId,
        risks,
        analysis,
        generatedAt: new Date().toISOString()
      }

      const content = JSON.stringify(reportData, null, 2)
      return new Blob([content], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    } catch (error) {
      console.error('Error generating risk report:', error)
      throw new Error('فشل في إنتاج تقرير المخاطر')
    }
  }

  /**
   * جلب المراجعات المتأخرة
   */
  async getOverdueReviews(projectId: string): Promise<Risk[]> {
    try {
      const risks = await this.getRisksByProject(projectId)
      const currentDate = new Date()

      return risks.filter(risk =>
        risk.nextReviewDate &&
        new Date(risk.nextReviewDate) < currentDate &&
        risk.status !== 'closed'
      )
    } catch (error) {
      console.error('Error getting overdue reviews:', error)
      return []
    }
  }

  /**
   * جلب المراجعات القادمة
   */
  async getUpcomingReviews(projectId: string, days: number): Promise<Risk[]> {
    try {
      const risks = await this.getRisksByProject(projectId)
      const currentDate = new Date()
      const futureDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000)

      return risks.filter(risk =>
        risk.nextReviewDate &&
        new Date(risk.nextReviewDate) >= currentDate &&
        new Date(risk.nextReviewDate) <= futureDate &&
        risk.status !== 'closed'
      )
    } catch (error) {
      console.error('Error getting upcoming reviews:', error)
      return []
    }
  }

  /**
   * تصعيد المخاطرة
   */
  async escalateRisk(riskId: string, reason: string): Promise<Risk> {
    try {
      const updatedRisk = await this.updateRisk(riskId, {
        status: 'escalated'
      })

      // إضافة تعليق حول التصعيد
      await this.addComment(riskId, `تم تصعيد المخاطرة: ${reason}`, 'system')

      return updatedRisk
    } catch (error) {
      console.error('Error escalating risk:', error)
      throw new Error('فشل في تصعيد المخاطرة')
    }
  }

  /**
   * إضافة تعليق
   */
  async addComment(riskId: string, content: string, author: string): Promise<RiskComment> {
    try {
      const comments = await asyncStorage.getItem<RiskComment[]>(this.STORAGE_KEYS.RISK_COMMENTS) || []

      const newComment: RiskComment = {
        id: this.generateId(),
        riskId,
        content,
        author,
        createdAt: new Date().toISOString()
      }

      comments.push(newComment)
      await asyncStorage.setItem(this.STORAGE_KEYS.RISK_COMMENTS, comments)

      return newComment
    } catch (error) {
      console.error('Error adding comment:', error)
      throw new Error('فشل في إضافة التعليق')
    }
  }

  /**
   * إضافة مرفق
   */
  async addAttachment(riskId: string, file: File, description?: string): Promise<RiskAttachment> {
    try {
      const attachments = await asyncStorage.getItem<RiskAttachment[]>(this.STORAGE_KEYS.RISK_ATTACHMENTS) || []

      // TODO: Implement actual file upload
      const filePath = `risks/${riskId}/${file.name}`

      const newAttachment: RiskAttachment = {
        id: this.generateId(),
        riskId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath,
        uploadedBy: 'current-user', // TODO: Get from auth context
        uploadedAt: new Date().toISOString(),
        description
      }

      attachments.push(newAttachment)
      await asyncStorage.setItem(this.STORAGE_KEYS.RISK_ATTACHMENTS, attachments)

      return newAttachment
    } catch (error) {
      console.error('Error adding attachment:', error)
      throw new Error('فشل في إضافة المرفق')
    }
  }

  /**
   * حذف مرفق
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      const attachments = await asyncStorage.getItem<RiskAttachment[]>(this.STORAGE_KEYS.RISK_ATTACHMENTS) || []
      const filteredAttachments = attachments.filter(attachment => attachment.id !== attachmentId)
      await asyncStorage.setItem(this.STORAGE_KEYS.RISK_ATTACHMENTS, filteredAttachments)
    } catch (error) {
      console.error('Error deleting attachment:', error)
      throw new Error('فشل في حذف المرفق')
    }
  }

  private calculateMedianRiskScore(risks: Risk[]): number {
    if (risks.length === 0) return 0
    const scores = risks.map(r => r.riskScore).sort((a, b) => a - b)
    const mid = Math.floor(scores.length / 2)
    return scores.length % 2 === 0 ? (scores[mid - 1] + scores[mid]) / 2 : scores[mid]
  }

  private calculateLowestRiskScore(risks: Risk[]): number {
    if (risks.length === 0) return 0
    return Math.min(...risks.map(risk => risk.riskScore))
  }
}

// تصدير مثيل واحد من الخدمة
export const riskManagementService = new RiskManagementServiceImpl()
