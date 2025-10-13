/**
 * @fileoverview Competitor Database Service Implementation
 * @description Comprehensive service for managing competitor intelligence database in Phase 3.
 * Provides competitor profile management, historical tracking, and competitive analysis.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation
 *
 * @example
 * ```typescript
 * import { competitorDatabaseService } from '@/services/competitorDatabaseService'
 *
 * // Create a new competitor profile
 * const competitor = await competitorDatabaseService.createCompetitor({
 *   name: 'شركة المنافس الأول',
 *   type: 'direct',
 *   marketSegments: ['commercial', 'infrastructure'],
 *   headquarters: 'الرياض، المملكة العربية السعودية'
 * })
 *
 * // Get competitive analysis
 * const analysis = await competitorDatabaseService.getCompetitiveAnalysis('comp-001')
 * ```
 */

import { asyncStorage } from '../utils/storage'
import type {
  Competitor,
  CompetitorProject,
  CompetitorType,
  CompetitorStatus,
  MarketSegment,
  PricingStrategy,
  ConfidenceLevel,
  DataSource
} from '../types/competitive'

// ===== SERVICE INTERFACE =====

export interface CompetitorDatabaseService {
  // Competitor Management
  createCompetitor(data: CreateCompetitorData): Promise<Competitor>
  updateCompetitor(id: string, data: Partial<Competitor>): Promise<Competitor>
  deleteCompetitor(id: string): Promise<boolean>
  getCompetitor(id: string): Promise<Competitor | null>
  getAllCompetitors(): Promise<Competitor[]>
  searchCompetitors(filters: CompetitorSearchFilters): Promise<Competitor[]>

  // Project Tracking
  addCompetitorProject(competitorId: string, project: Omit<CompetitorProject, 'id'>): Promise<CompetitorProject>
  updateCompetitorProject(competitorId: string, projectId: string, data: Partial<CompetitorProject>): Promise<CompetitorProject>
  removeCompetitorProject(competitorId: string, projectId: string): Promise<boolean>
  getCompetitorProjects(competitorId: string): Promise<CompetitorProject[]>

  // Analysis and Intelligence
  getCompetitiveAnalysis(competitorId: string): Promise<CompetitiveAnalysisResult>
  getMarketShareAnalysis(): Promise<MarketShareAnalysis>
  getPricingIntelligence(competitorId: string): Promise<PricingIntelligence>
  getPerformanceComparison(competitorIds: string[]): Promise<PerformanceComparison>

  // Bulk Operations
  importCompetitors(competitors: CreateCompetitorData[]): Promise<ImportResult>
  exportCompetitors(format: 'json' | 'csv'): Promise<string>
  bulkUpdateCompetitors(updates: Array<{ id: string; data: Partial<Competitor> }>): Promise<BulkUpdateResult>

  // Utility Functions
  validateCompetitorData(data: Partial<Competitor>): ValidationResult
  calculateCompetitiveMetrics(competitorId: string): Promise<CompetitiveMetrics>
  generateCompetitorReport(competitorId: string): Promise<CompetitorReport>
}

// ===== DATA TYPES =====

export interface CreateCompetitorData {
  name: string
  nameEn?: string
  type: CompetitorType
  headquarters: string
  website?: string
  specializations?: string[]
  marketSegments?: MarketSegment[]
  geographicCoverage?: string[]
  marketShare?: number
  annualRevenue?: number
  employeeCount?: number
  pricingStrategy?: PricingStrategy
  strengths?: string[]
  weaknesses?: string[]
  opportunities?: string[]
  threats?: string[]
  notes?: string
  tags?: string[]
}

export interface CompetitorSearchFilters {
  type?: CompetitorType[]
  status?: CompetitorStatus[]
  marketSegments?: MarketSegment[]
  marketShareRange?: [number, number]
  winRateRange?: [number, number]
  specializations?: string[]
  geographicCoverage?: string[]
  lastUpdatedAfter?: string
  searchTerm?: string
}

export interface CompetitiveAnalysisResult {
  competitor: Competitor
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche'
  competitiveStrength: number // 0-100
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  opportunities: string[]
  recommendations: string[]
  keyInsights: string[]
  lastAnalyzed: string
}

export interface MarketShareAnalysis {
  totalMarket: number
  competitors: Array<{
    id: string
    name: string
    marketShare: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }>
  ourPosition: number
  topCompetitors: string[]
  marketConcentration: number
  analysisDate: string
}

export interface PricingIntelligence {
  competitor: Competitor
  averageMargin: number
  pricingTrends: Array<{
    period: string
    averagePrice: number
    marginRange: [number, number]
  }>
  discountPatterns: Array<{
    projectType: string
    averageDiscount: number
    frequency: number
  }>
  competitivePricing: {
    vsMarketAverage: number
    vsOurPricing: number
    pricePosition: 'premium' | 'competitive' | 'discount'
  }
  recommendations: string[]
}

export interface PerformanceComparison {
  competitors: Competitor[]
  metrics: Array<{
    name: string
    unit: string
    values: Array<{
      competitorId: string
      value: number
      rank: number
    }>
  }>
  summary: {
    topPerformer: string
    averagePerformance: number
    performanceGaps: Array<{
      metric: string
      gap: number
      significance: 'high' | 'medium' | 'low'
    }>
  }
}

export interface ImportResult {
  successful: number
  failed: number
  errors: Array<{
    row: number
    error: string
    data: any
  }>
  importedIds: string[]
}

export interface BulkUpdateResult {
  successful: number
  failed: number
  errors: Array<{
    id: string
    error: string
  }>
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface CompetitiveMetrics {
  competitorId: string
  metrics: {
    marketShare: number
    winRate: number
    averageBidValue: number
    projectsPerYear: number
    growthRate: number
    competitiveStrength: number
  }
  trends: {
    marketShareTrend: 'up' | 'down' | 'stable'
    performanceTrend: 'improving' | 'declining' | 'stable'
  }
  calculatedAt: string
}

export interface CompetitorReport {
  competitor: Competitor
  executiveSummary: string
  keyFindings: string[]
  swotAnalysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  marketPosition: string
  competitiveThreats: string[]
  strategicRecommendations: string[]
  dataQuality: {
    completeness: number
    accuracy: number
    freshness: number
  }
  generatedAt: string
}

// ===== SERVICE IMPLEMENTATION =====

class CompetitorDatabaseServiceImpl implements CompetitorDatabaseService {
  private readonly STORAGE_KEY = 'competitor_database'
  private readonly PROJECTS_KEY = 'competitor_projects'

  // ===== COMPETITOR MANAGEMENT =====

  async createCompetitor(data: CreateCompetitorData): Promise<Competitor> {
    const validation = this.validateCompetitorData(data)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    const competitor: Competitor = {
      id: this.generateId(),
      ...data,
      status: 'active',
      marketShare: data.marketShare || 0,
      winRate: 0,
      averageBidValue: 0,
      recentProjects: [],
      dataSource: ['manual'],
      confidenceLevel: 'medium',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current_user', // TODO: Get from auth context
      specializations: data.specializations || [],
      marketSegments: data.marketSegments || [],
      geographicCoverage: data.geographicCoverage || [],
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      opportunities: data.opportunities || [],
      threats: data.threats || [],
      tags: data.tags || []
    }

    const competitors = await this.getAllCompetitors()
    competitors.push(competitor)
    await asyncStorage.setItem(this.STORAGE_KEY, competitors)

    return competitor
  }

  async updateCompetitor(id: string, data: Partial<Competitor>): Promise<Competitor> {
    const competitors = await this.getAllCompetitors()
    const index = competitors.findIndex(c => c.id === id)
    
    if (index === -1) {
      throw new Error(`Competitor with id ${id} not found`)
    }

    const updatedCompetitor = {
      ...competitors[index],
      ...data,
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    competitors[index] = updatedCompetitor
    await asyncStorage.setItem(this.STORAGE_KEY, competitors)

    return updatedCompetitor
  }

  async deleteCompetitor(id: string): Promise<boolean> {
    const competitors = await this.getAllCompetitors()
    const filteredCompetitors = competitors.filter(c => c.id !== id)
    
    if (filteredCompetitors.length === competitors.length) {
      return false // Competitor not found
    }

    await asyncStorage.setItem(this.STORAGE_KEY, filteredCompetitors)

    // Also remove associated projects
    const projects = await this.getCompetitorProjects(id)
    if (projects.length > 0) {
      const allProjects = await asyncStorage.getItem(this.PROJECTS_KEY, {})
      delete allProjects[id]
      await asyncStorage.setItem(this.PROJECTS_KEY, allProjects)
    }

    return true
  }

  async getCompetitor(id: string): Promise<Competitor | null> {
    const competitors = await this.getAllCompetitors()
    return competitors.find(c => c.id === id) || null
  }

  async getAllCompetitors(): Promise<Competitor[]> {
    try {
      const competitors = await asyncStorage.getItem(this.STORAGE_KEY, [])
      return competitors as Competitor[]
    } catch (error) {
      console.error('Error loading competitors:', error)
      return []
    }
  }

  async searchCompetitors(filters: CompetitorSearchFilters): Promise<Competitor[]> {
    const competitors = await this.getAllCompetitors()
    
    return competitors.filter(competitor => {
      // Type filter
      if (filters.type && !filters.type.includes(competitor.type)) {
        return false
      }

      // Status filter
      if (filters.status && !filters.status.includes(competitor.status)) {
        return false
      }

      // Market segments filter
      if (filters.marketSegments && !filters.marketSegments.some(segment => 
        competitor.marketSegments.includes(segment))) {
        return false
      }

      // Market share range filter
      if (filters.marketShareRange) {
        const [min, max] = filters.marketShareRange
        if (competitor.marketShare < min || competitor.marketShare > max) {
          return false
        }
      }

      // Win rate range filter
      if (filters.winRateRange) {
        const [min, max] = filters.winRateRange
        if (competitor.winRate < min || competitor.winRate > max) {
          return false
        }
      }

      // Specializations filter
      if (filters.specializations && !filters.specializations.some(spec => 
        competitor.specializations.includes(spec))) {
        return false
      }

      // Geographic coverage filter
      if (filters.geographicCoverage && !filters.geographicCoverage.some(geo => 
        competitor.geographicCoverage.includes(geo))) {
        return false
      }

      // Last updated filter
      if (filters.lastUpdatedAfter) {
        if (new Date(competitor.lastUpdated) < new Date(filters.lastUpdatedAfter)) {
          return false
        }
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        const searchableText = [
          competitor.name,
          competitor.nameEn,
          competitor.headquarters,
          ...competitor.specializations,
          ...competitor.tags || []
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      return true
    })
  }

  // ===== UTILITY FUNCTIONS =====

  validateCompetitorData(data: Partial<Competitor>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('اسم الشركة مطلوب')
    }

    if (!data.headquarters || data.headquarters.trim().length === 0) {
      errors.push('موقع المقر الرئيسي مطلوب')
    }

    if (data.marketShare !== undefined && (data.marketShare < 0 || data.marketShare > 100)) {
      errors.push('الحصة السوقية يجب أن تكون بين 0 و 100')
    }

    if (data.winRate !== undefined && (data.winRate < 0 || data.winRate > 100)) {
      errors.push('معدل الفوز يجب أن يكون بين 0 و 100')
    }

    // Warnings for incomplete data
    if (!data.website) {
      warnings.push('الموقع الإلكتروني غير محدد')
    }

    if (!data.specializations || data.specializations.length === 0) {
      warnings.push('التخصصات غير محددة')
    }

    if (!data.marketSegments || data.marketSegments.length === 0) {
      warnings.push('القطاعات السوقية غير محددة')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private generateId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ===== PROJECT TRACKING =====

  async addCompetitorProject(competitorId: string, project: Omit<CompetitorProject, 'id'>): Promise<CompetitorProject> {
    const competitor = await this.getCompetitor(competitorId)
    if (!competitor) {
      throw new Error(`Competitor with id ${competitorId} not found`)
    }

    const newProject: CompetitorProject = {
      ...project,
      id: this.generateProjectId()
    }

    // Update competitor's recent projects
    competitor.recentProjects = competitor.recentProjects || []
    competitor.recentProjects.unshift(newProject)

    // Keep only the 10 most recent projects
    if (competitor.recentProjects.length > 10) {
      competitor.recentProjects = competitor.recentProjects.slice(0, 10)
    }

    // Recalculate metrics
    await this.recalculateCompetitorMetrics(competitor)
    await this.updateCompetitor(competitorId, competitor)

    // Store in projects database
    const allProjects = await asyncStorage.getItem(this.PROJECTS_KEY, {})
    if (!allProjects[competitorId]) {
      allProjects[competitorId] = []
    }
    allProjects[competitorId].push(newProject)
    await asyncStorage.setItem(this.PROJECTS_KEY, allProjects)

    return newProject
  }

  async updateCompetitorProject(competitorId: string, projectId: string, data: Partial<CompetitorProject>): Promise<CompetitorProject> {
    const allProjects = await asyncStorage.getItem(this.PROJECTS_KEY, {})
    const competitorProjects = allProjects[competitorId] || []

    const projectIndex = competitorProjects.findIndex((p: CompetitorProject) => p.id === projectId)
    if (projectIndex === -1) {
      throw new Error(`Project with id ${projectId} not found for competitor ${competitorId}`)
    }

    const updatedProject = { ...competitorProjects[projectIndex], ...data }
    competitorProjects[projectIndex] = updatedProject
    allProjects[competitorId] = competitorProjects

    await asyncStorage.setItem(this.PROJECTS_KEY, allProjects)

    // Update competitor's recent projects and recalculate metrics
    const competitor = await this.getCompetitor(competitorId)
    if (competitor) {
      const recentProjectIndex = competitor.recentProjects.findIndex(p => p.id === projectId)
      if (recentProjectIndex !== -1) {
        competitor.recentProjects[recentProjectIndex] = updatedProject
        await this.recalculateCompetitorMetrics(competitor)
        await this.updateCompetitor(competitorId, competitor)
      }
    }

    return updatedProject
  }

  async removeCompetitorProject(competitorId: string, projectId: string): Promise<boolean> {
    const allProjects = await asyncStorage.getItem(this.PROJECTS_KEY, {})
    const competitorProjects = allProjects[competitorId] || []

    const filteredProjects = competitorProjects.filter((p: CompetitorProject) => p.id !== projectId)
    if (filteredProjects.length === competitorProjects.length) {
      return false // Project not found
    }

    allProjects[competitorId] = filteredProjects
    await asyncStorage.setItem(this.PROJECTS_KEY, allProjects)

    // Update competitor's recent projects
    const competitor = await this.getCompetitor(competitorId)
    if (competitor) {
      competitor.recentProjects = competitor.recentProjects.filter(p => p.id !== projectId)
      await this.recalculateCompetitorMetrics(competitor)
      await this.updateCompetitor(competitorId, competitor)
    }

    return true
  }

  async getCompetitorProjects(competitorId: string): Promise<CompetitorProject[]> {
    try {
      const allProjects = await asyncStorage.getItem(this.PROJECTS_KEY, {})
      return allProjects[competitorId] || []
    } catch (error) {
      console.error('Error loading competitor projects:', error)
      return []
    }
  }

  // ===== ANALYSIS AND INTELLIGENCE =====

  async getCompetitiveAnalysis(competitorId: string): Promise<CompetitiveAnalysisResult> {
    const competitor = await this.getCompetitor(competitorId)
    if (!competitor) {
      throw new Error(`Competitor with id ${competitorId} not found`)
    }

    const allCompetitors = await this.getAllCompetitors()
    const marketPosition = this.calculateMarketPosition(competitor, allCompetitors)
    const competitiveStrength = this.calculateCompetitiveStrength(competitor)
    const threatLevel = this.assessThreatLevel(competitor)

    return {
      competitor,
      marketPosition,
      competitiveStrength,
      threatLevel,
      opportunities: this.identifyOpportunities(competitor),
      recommendations: this.generateRecommendations(competitor),
      keyInsights: this.generateKeyInsights(competitor),
      lastAnalyzed: new Date().toISOString()
    }
  }

  async getMarketShareAnalysis(): Promise<MarketShareAnalysis> {
    const competitors = await this.getAllCompetitors()
    const totalMarket = competitors.reduce((sum, c) => sum + c.marketShare, 0)

    const competitorData = competitors
      .filter(c => c.marketShare > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        marketShare: c.marketShare,
        trend: this.calculateMarketShareTrend(c)
      }))
      .sort((a, b) => b.marketShare - a.marketShare)

    return {
      totalMarket,
      competitors: competitorData,
      ourPosition: 0, // TODO: Calculate our position
      topCompetitors: competitorData.slice(0, 5).map(c => c.id),
      marketConcentration: this.calculateMarketConcentration(competitorData),
      analysisDate: new Date().toISOString()
    }
  }

  async getPricingIntelligence(competitorId: string): Promise<PricingIntelligence> {
    const competitor = await this.getCompetitor(competitorId)
    if (!competitor) {
      throw new Error(`Competitor with id ${competitorId} not found`)
    }

    const projects = await this.getCompetitorProjects(competitorId)
    const pricingTrends = this.analyzePricingTrends(projects)
    const discountPatterns = competitor.discountPatterns || []

    return {
      competitor,
      averageMargin: competitor.averageMargin || 0,
      pricingTrends,
      discountPatterns,
      competitivePricing: await this.analyzeCompetitivePricing(competitor),
      recommendations: this.generatePricingRecommendations(competitor)
    }
  }

  async getPerformanceComparison(competitorIds: string[]): Promise<PerformanceComparison> {
    const competitors = await Promise.all(
      competitorIds.map(id => this.getCompetitor(id))
    )
    const validCompetitors = competitors.filter(c => c !== null) as Competitor[]

    const metrics = [
      {
        name: 'Market Share',
        unit: '%',
        values: validCompetitors.map((c, index) => ({
          competitorId: c.id,
          value: c.marketShare,
          rank: index + 1
        }))
      },
      {
        name: 'Win Rate',
        unit: '%',
        values: validCompetitors.map((c, index) => ({
          competitorId: c.id,
          value: c.winRate,
          rank: index + 1
        }))
      },
      {
        name: 'Average Bid Value',
        unit: 'SAR',
        values: validCompetitors.map((c, index) => ({
          competitorId: c.id,
          value: c.averageBidValue,
          rank: index + 1
        }))
      }
    ]

    // Sort and rank each metric
    metrics.forEach(metric => {
      metric.values.sort((a, b) => b.value - a.value)
      metric.values.forEach((value, index) => {
        value.rank = index + 1
      })
    })

    const topPerformer = this.identifyTopPerformer(validCompetitors)
    const averagePerformance = this.calculateAveragePerformance(validCompetitors)
    const performanceGaps = this.identifyPerformanceGaps(validCompetitors)

    return {
      competitors: validCompetitors,
      metrics,
      summary: {
        topPerformer,
        averagePerformance,
        performanceGaps
      }
    }
  }

  // ===== BULK OPERATIONS =====

  async importCompetitors(competitors: CreateCompetitorData[]): Promise<ImportResult> {
    const result: ImportResult = {
      successful: 0,
      failed: 0,
      errors: [],
      importedIds: []
    }

    for (let i = 0; i < competitors.length; i++) {
      try {
        const competitor = await this.createCompetitor(competitors[i])
        result.successful++
        result.importedIds.push(competitor.id)
      } catch (error) {
        result.failed++
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: competitors[i]
        })
      }
    }

    return result
  }

  async exportCompetitors(format: 'json' | 'csv'): Promise<string> {
    const competitors = await this.getAllCompetitors()

    if (format === 'json') {
      return JSON.stringify(competitors, null, 2)
    } else {
      // CSV format
      const headers = [
        'ID', 'Name', 'Type', 'Status', 'Market Share', 'Win Rate',
        'Headquarters', 'Website', 'Specializations', 'Market Segments'
      ]

      const rows = competitors.map(c => [
        c.id,
        c.name,
        c.type,
        c.status,
        c.marketShare.toString(),
        c.winRate.toString(),
        c.headquarters,
        c.website || '',
        c.specializations.join(';'),
        c.marketSegments.join(';')
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
  }

  async bulkUpdateCompetitors(updates: Array<{ id: string; data: Partial<Competitor> }>): Promise<BulkUpdateResult> {
    const result: BulkUpdateResult = {
      successful: 0,
      failed: 0,
      errors: []
    }

    for (const update of updates) {
      try {
        await this.updateCompetitor(update.id, update.data)
        result.successful++
      } catch (error) {
        result.failed++
        result.errors.push({
          id: update.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return result
  }

  // ===== ADVANCED ANALYSIS METHODS =====

  async calculateCompetitiveMetrics(competitorId: string): Promise<CompetitiveMetrics> {
    const competitor = await this.getCompetitor(competitorId)
    if (!competitor) {
      throw new Error(`Competitor with id ${competitorId} not found`)
    }

    const projects = await this.getCompetitorProjects(competitorId)
    const currentYear = new Date().getFullYear()
    const thisYearProjects = projects.filter(p =>
      p.startDate && new Date(p.startDate).getFullYear() === currentYear
    )

    const metrics = {
      marketShare: competitor.marketShare,
      winRate: competitor.winRate,
      averageBidValue: competitor.averageBidValue,
      projectsPerYear: thisYearProjects.length,
      growthRate: this.calculateGrowthRate(competitor, projects),
      competitiveStrength: this.calculateCompetitiveStrength(competitor)
    }

    const trends = {
      marketShareTrend: this.calculateMarketShareTrend(competitor),
      performanceTrend: this.calculatePerformanceTrend(competitor, projects)
    }

    return {
      competitorId,
      metrics,
      trends,
      calculatedAt: new Date().toISOString()
    }
  }

  async generateCompetitorReport(competitorId: string): Promise<CompetitorReport> {
    const competitor = await this.getCompetitor(competitorId)
    if (!competitor) {
      throw new Error(`Competitor with id ${competitorId} not found`)
    }

    const analysis = await this.getCompetitiveAnalysis(competitorId)
    const metrics = await this.calculateCompetitiveMetrics(competitorId)

    return {
      competitor,
      executiveSummary: this.generateExecutiveSummary(competitor, analysis),
      keyFindings: analysis.keyInsights,
      swotAnalysis: {
        strengths: competitor.strengths,
        weaknesses: competitor.weaknesses,
        opportunities: competitor.opportunities,
        threats: competitor.threats
      },
      marketPosition: analysis.marketPosition,
      competitiveThreats: this.identifyCompetitiveThreats(competitor),
      strategicRecommendations: analysis.recommendations,
      dataQuality: this.assessDataQuality(competitor),
      generatedAt: new Date().toISOString()
    }
  }

  // ===== PRIVATE UTILITY METHODS =====

  private generateProjectId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async recalculateCompetitorMetrics(competitor: Competitor): Promise<void> {
    const projects = competitor.recentProjects || []

    // Calculate win rate
    const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'awarded')
    const wonProjects = projects.filter(p => p.status === 'awarded' || p.status === 'completed')
    competitor.winRate = completedProjects.length > 0 ? (wonProjects.length / completedProjects.length) * 100 : 0

    // Calculate average bid value
    const projectsWithValues = projects.filter(p => p.bidValue > 0)
    competitor.averageBidValue = projectsWithValues.length > 0
      ? projectsWithValues.reduce((sum, p) => sum + p.bidValue, 0) / projectsWithValues.length
      : 0

    // Update projects completed count
    competitor.projectsCompleted = wonProjects.length
  }

  private calculateMarketPosition(competitor: Competitor, allCompetitors: Competitor[]): 'leader' | 'challenger' | 'follower' | 'niche' {
    const sortedByMarketShare = allCompetitors
      .filter(c => c.marketShare > 0)
      .sort((a, b) => b.marketShare - a.marketShare)

    const position = sortedByMarketShare.findIndex(c => c.id === competitor.id)
    const totalCompetitors = sortedByMarketShare.length

    if (position === 0) return 'leader'
    if (position < totalCompetitors * 0.2) return 'challenger'
    if (position < totalCompetitors * 0.8) return 'follower'
    return 'niche'
  }

  private calculateCompetitiveStrength(competitor: Competitor): number {
    let strength = 0

    // Market share component (40%)
    strength += (competitor.marketShare / 100) * 40

    // Win rate component (30%)
    strength += (competitor.winRate / 100) * 30

    // Experience component (20%) - based on projects completed
    const experienceScore = Math.min((competitor.projectsCompleted || 0) / 100, 1)
    strength += experienceScore * 20

    // Strengths vs weaknesses component (10%)
    const strengthsCount = competitor.strengths.length
    const weaknessesCount = competitor.weaknesses.length
    const balanceScore = strengthsCount > 0 ? strengthsCount / (strengthsCount + weaknessesCount) : 0
    strength += balanceScore * 10

    return Math.round(strength)
  }

  private assessThreatLevel(competitor: Competitor): 'low' | 'medium' | 'high' | 'critical' {
    const strength = this.calculateCompetitiveStrength(competitor)
    const marketShare = competitor.marketShare
    const winRate = competitor.winRate

    if (strength > 80 && marketShare > 20) return 'critical'
    if (strength > 60 && marketShare > 10) return 'high'
    if (strength > 40 || winRate > 50) return 'medium'
    return 'low'
  }

  private identifyOpportunities(competitor: Competitor): string[] {
    const opportunities: string[] = []

    if (competitor.weaknesses.length > competitor.strengths.length) {
      opportunities.push('استغلال نقاط الضعف في استراتيجية التسعير')
    }

    if (competitor.marketShare < 10) {
      opportunities.push('منافسة في المشاريع الصغيرة والمتوسطة')
    }

    if (competitor.winRate < 30) {
      opportunities.push('تحسين العروض في القطاعات التي يضعف فيها المنافس')
    }

    if (competitor.geographicCoverage.length < 3) {
      opportunities.push('التوسع في المناطق غير المغطاة من قبل المنافس')
    }

    return opportunities
  }

  private generateRecommendations(competitor: Competitor): string[] {
    const recommendations: string[] = []
    const strength = this.calculateCompetitiveStrength(competitor)

    if (strength > 70) {
      recommendations.push('مراقبة دقيقة لاستراتيجيات التسعير والعروض')
      recommendations.push('تطوير ميزات تنافسية فريدة للتفوق')
    } else if (strength > 40) {
      recommendations.push('تحليل نقاط القوة والاستفادة منها')
      recommendations.push('تحسين الكفاءة التشغيلية للمنافسة')
    } else {
      recommendations.push('استغلال نقاط الضعف في العروض المباشرة')
      recommendations.push('التركيز على القطاعات التي يضعف فيها المنافس')
    }

    return recommendations
  }

  private generateKeyInsights(competitor: Competitor): string[] {
    const insights: string[] = []

    insights.push(`حصة سوقية: ${competitor.marketShare}% - ${this.getMarketShareInsight(competitor.marketShare)}`)
    insights.push(`معدل الفوز: ${competitor.winRate}% - ${this.getWinRateInsight(competitor.winRate)}`)

    if (competitor.pricingStrategy) {
      insights.push(`استراتيجية التسعير: ${this.getPricingStrategyInsight(competitor.pricingStrategy)}`)
    }

    if (competitor.specializations.length > 0) {
      insights.push(`التخصصات الرئيسية: ${competitor.specializations.slice(0, 3).join('، ')}`)
    }

    return insights
  }

  private calculateMarketShareTrend(competitor: Competitor): 'increasing' | 'decreasing' | 'stable' {
    // This would typically analyze historical data
    // For now, return stable as default
    return 'stable'
  }

  private calculateMarketConcentration(competitors: Array<{ marketShare: number }>): number {
    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = competitors.reduce((sum, c) => sum + Math.pow(c.marketShare, 2), 0)
    return Math.round(hhi)
  }

  private analyzePricingTrends(projects: CompetitorProject[]): Array<{ period: string; averagePrice: number; marginRange: [number, number] }> {
    // Group projects by year and calculate trends
    const yearlyData: { [year: string]: { prices: number[]; margins: number[] } } = {}

    projects.forEach(project => {
      if (project.startDate && project.bidValue > 0) {
        const year = new Date(project.startDate).getFullYear().toString()
        if (!yearlyData[year]) {
          yearlyData[year] = { prices: [], margins: [] }
        }
        yearlyData[year].prices.push(project.bidValue)
        if (project.margin !== undefined) {
          yearlyData[year].margins.push(project.margin)
        }
      }
    })

    return Object.entries(yearlyData).map(([year, data]) => ({
      period: year,
      averagePrice: data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length,
      marginRange: data.margins.length > 0
        ? [Math.min(...data.margins), Math.max(...data.margins)]
        : [0, 0]
    }))
  }

  private async analyzeCompetitivePricing(competitor: Competitor): Promise<{
    vsMarketAverage: number;
    vsOurPricing: number;
    pricePosition: 'premium' | 'competitive' | 'discount';
  }> {
    // This would compare against market averages and our pricing
    // For now, return default values
    return {
      vsMarketAverage: 0,
      vsOurPricing: 0,
      pricePosition: 'competitive'
    }
  }

  private generatePricingRecommendations(competitor: Competitor): string[] {
    const recommendations: string[] = []

    if (competitor.pricingStrategy === 'premium') {
      recommendations.push('التركيز على القيمة المضافة في العروض')
      recommendations.push('تبرير الأسعار المرتفعة بالجودة والخبرة')
    } else if (competitor.pricingStrategy === 'competitive') {
      recommendations.push('مراقبة التغيرات في أسعار السوق')
      recommendations.push('تحسين الكفاءة لتقليل التكاليف')
    } else if (competitor.pricingStrategy === 'penetration') {
      recommendations.push('الحذر من حرب الأسعار')
      recommendations.push('التركيز على الميزات التنافسية غير السعرية')
    }

    return recommendations
  }

  private identifyTopPerformer(competitors: Competitor[]): string {
    if (competitors.length === 0) return ''

    const scored = competitors.map(c => ({
      id: c.id,
      score: this.calculateCompetitiveStrength(c)
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored[0].id
  }

  private calculateAveragePerformance(competitors: Competitor[]): number {
    if (competitors.length === 0) return 0

    const totalStrength = competitors.reduce((sum, c) => sum + this.calculateCompetitiveStrength(c), 0)
    return Math.round(totalStrength / competitors.length)
  }

  private identifyPerformanceGaps(competitors: Competitor[]): Array<{
    metric: string;
    gap: number;
    significance: 'high' | 'medium' | 'low';
  }> {
    // Analyze performance gaps between competitors
    const gaps: Array<{ metric: string; gap: number; significance: 'high' | 'medium' | 'low' }> = []

    const marketShares = competitors.map(c => c.marketShare)
    const winRates = competitors.map(c => c.winRate)

    const marketShareGap = Math.max(...marketShares) - Math.min(...marketShares)
    const winRateGap = Math.max(...winRates) - Math.min(...winRates)

    gaps.push({
      metric: 'Market Share',
      gap: marketShareGap,
      significance: marketShareGap > 20 ? 'high' : marketShareGap > 10 ? 'medium' : 'low'
    })

    gaps.push({
      metric: 'Win Rate',
      gap: winRateGap,
      significance: winRateGap > 30 ? 'high' : winRateGap > 15 ? 'medium' : 'low'
    })

    return gaps
  }

  private calculateGrowthRate(competitor: Competitor, projects: CompetitorProject[]): number {
    // Calculate year-over-year growth based on project values
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    const currentYearValue = projects
      .filter(p => p.startDate && new Date(p.startDate).getFullYear() === currentYear)
      .reduce((sum, p) => sum + p.bidValue, 0)

    const lastYearValue = projects
      .filter(p => p.startDate && new Date(p.startDate).getFullYear() === lastYear)
      .reduce((sum, p) => sum + p.bidValue, 0)

    if (lastYearValue === 0) return 0
    return Math.round(((currentYearValue - lastYearValue) / lastYearValue) * 100)
  }

  private calculatePerformanceTrend(competitor: Competitor, projects: CompetitorProject[]): 'improving' | 'declining' | 'stable' {
    const growthRate = this.calculateGrowthRate(competitor, projects)

    if (growthRate > 10) return 'improving'
    if (growthRate < -10) return 'declining'
    return 'stable'
  }

  private generateExecutiveSummary(competitor: Competitor, analysis: CompetitiveAnalysisResult): string {
    return `${competitor.name} هو منافس ${analysis.marketPosition} في السوق بحصة سوقية ${competitor.marketShare}% ومعدل فوز ${competitor.winRate}%. ` +
           `مستوى التهديد: ${analysis.threatLevel}. القوة التنافسية: ${analysis.competitiveStrength}/100. ` +
           `يتخصص في ${competitor.specializations.slice(0, 2).join(' و')} ويعمل في ${competitor.marketSegments.slice(0, 2).join(' و')}.`
  }

  private identifyCompetitiveThreats(competitor: Competitor): string[] {
    const threats: string[] = []

    if (competitor.marketShare > 15) {
      threats.push('هيمنة على حصة كبيرة من السوق')
    }

    if (competitor.winRate > 60) {
      threats.push('معدل فوز عالي في المناقصات')
    }

    if (competitor.strengths.length > competitor.weaknesses.length) {
      threats.push('نقاط قوة متعددة مقابل نقاط ضعف قليلة')
    }

    return threats
  }

  private assessDataQuality(competitor: Competitor): { completeness: number; accuracy: number; freshness: number } {
    let completeness = 0
    const fields = [
      competitor.name, competitor.headquarters, competitor.marketShare,
      competitor.winRate, competitor.specializations.length > 0,
      competitor.marketSegments.length > 0
    ]

    completeness = (fields.filter(f => f).length / fields.length) * 100

    const daysSinceUpdate = Math.floor((Date.now() - new Date(competitor.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
    const freshness = Math.max(0, 100 - daysSinceUpdate)

    return {
      completeness: Math.round(completeness),
      accuracy: competitor.confidenceLevel === 'high' ? 90 : competitor.confidenceLevel === 'medium' ? 70 : 50,
      freshness: Math.round(freshness)
    }
  }

  private getMarketShareInsight(marketShare: number): string {
    if (marketShare > 20) return 'مهيمن'
    if (marketShare > 10) return 'قوي'
    if (marketShare > 5) return 'متوسط'
    return 'ضعيف'
  }

  private getWinRateInsight(winRate: number): string {
    if (winRate > 70) return 'ممتاز'
    if (winRate > 50) return 'جيد'
    if (winRate > 30) return 'متوسط'
    return 'ضعيف'
  }

  private getPricingStrategyInsight(strategy: PricingStrategy): string {
    const strategies = {
      cost_plus: 'التكلفة زائد الربح',
      competitive: 'تنافسية',
      value_based: 'قائمة على القيمة',
      penetration: 'اختراق السوق',
      premium: 'مميزة',
      unknown: 'غير محددة'
    }
    return strategies[strategy]
  }
}

// Export singleton instance
export const competitorDatabaseService = new CompetitorDatabaseServiceImpl()
export type { CompetitorDatabaseService }
