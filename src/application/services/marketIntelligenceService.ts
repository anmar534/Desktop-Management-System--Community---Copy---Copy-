/**
 * @fileoverview Market Intelligence Service Implementation
 * @description Comprehensive service for market intelligence integration in Phase 3.
 * Provides material cost tracking, labor rate monitoring, economic indicators,
 * industry trends analysis, and market opportunity identification.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation
 *
 * @example
 * ```typescript
 * import { marketIntelligenceService } from '@/application/services/marketIntelligenceService'
 *
 * // Track material costs
 * const materialCosts = await marketIntelligenceService.getMaterialCosts('concrete')
 *
 * // Monitor labor rates
 * const laborRates = await marketIntelligenceService.getLaborRates('riyadh')
 *
 * // Get economic indicators
 * const indicators = await marketIntelligenceService.getEconomicIndicators()
 * ```
 */

import { asyncStorage } from '../utils/storage'

// ===== TYPE DEFINITIONS =====

export interface MaterialCost {
  id: string
  materialType: string
  materialName: string
  materialNameEn?: string
  unit: string
  currentPrice: number
  previousPrice: number
  priceChange: number
  priceChangePercent: number
  region: string
  supplier: string
  supplierRating: number
  lastUpdated: string
  priceHistory: PriceHistoryEntry[]
  qualityGrade: 'premium' | 'standard' | 'economy'
  availability: 'high' | 'medium' | 'low'
  leadTime: number // days
  minimumOrder: number
  currency: string
  notes?: string
}

export interface PriceHistoryEntry {
  date: string
  price: number
  supplier: string
  source: string
}

export interface LaborRate {
  id: string
  skillCategory: string
  skillLevel: 'entry' | 'intermediate' | 'senior' | 'expert'
  hourlyRate: number
  dailyRate: number
  monthlyRate: number
  region: string
  city: string
  currency: string
  lastUpdated: string
  rateHistory: RateHistoryEntry[]
  demand: 'high' | 'medium' | 'low'
  availability: 'abundant' | 'moderate' | 'scarce'
  seasonalVariation: number // percentage
  certificationRequired: boolean
  experienceRequired: number // years
}

export interface RateHistoryEntry {
  date: string
  hourlyRate: number
  source: string
  marketCondition: string
}

export interface EconomicIndicator {
  id: string
  indicatorType:
    | 'inflation'
    | 'gdp'
    | 'construction_index'
    | 'currency'
    | 'interest_rate'
    | 'oil_price'
  name: string
  nameEn?: string
  currentValue: number
  previousValue: number
  change: number
  changePercent: number
  unit: string
  period: string
  lastUpdated: string
  source: string
  trend: 'increasing' | 'decreasing' | 'stable'
  impact: 'positive' | 'negative' | 'neutral'
  confidence: 'high' | 'medium' | 'low'
  forecast?: EconomicForecast[]
}

export interface EconomicForecast {
  period: string
  predictedValue: number
  confidence: number
  scenario: 'optimistic' | 'realistic' | 'pessimistic'
}

export interface IndustryTrend {
  id: string
  trendType: 'technology' | 'regulation' | 'market' | 'sustainability' | 'innovation'
  title: string
  titleEn?: string
  description: string
  impact: 'high' | 'medium' | 'low'
  timeframe: 'short' | 'medium' | 'long'
  affectedSectors: string[]
  opportunities: string[]
  threats: string[]
  recommendations: string[]
  source: string
  publishedDate: string
  relevanceScore: number
  tags: string[]
}

export interface MarketOpportunity {
  id: string
  opportunityType: 'project' | 'sector' | 'technology' | 'partnership' | 'investment'
  title: string
  titleEn?: string
  description: string
  estimatedValue: number
  probability: number
  timeframe: string
  requirements: string[]
  risks: string[]
  benefits: string[]
  region: string
  sector: string
  competitionLevel: 'low' | 'medium' | 'high'
  entryBarriers: string[]
  successFactors: string[]
  source: string
  identifiedDate: string
  expiryDate?: string
  status: 'active' | 'pursuing' | 'won' | 'lost' | 'expired'
}

export interface MarketAlert {
  id: string
  alertType: 'price_change' | 'rate_change' | 'trend_shift' | 'opportunity' | 'threat'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  affectedItems: string[]
  actionRequired: boolean
  recommendations: string[]
  createdAt: string
  expiresAt?: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export interface MarketIntelligenceFilters {
  materialTypes?: string[]
  regions?: string[]
  skillCategories?: string[]
  indicatorTypes?: string[]
  trendTypes?: string[]
  opportunityTypes?: string[]
  dateRange?: [string, string]
  priceRange?: [number, number]
  rateRange?: [number, number]
  searchTerm?: string
}

export interface MarketAnalysisResult {
  summary: {
    totalMaterials: number
    avgPriceChange: number
    totalLaborCategories: number
    avgRateChange: number
    activeOpportunities: number
    criticalAlerts: number
  }
  trends: {
    materialCostTrend: 'increasing' | 'decreasing' | 'stable'
    laborRateTrend: 'increasing' | 'decreasing' | 'stable'
    marketSentiment: 'positive' | 'negative' | 'neutral'
    competitionLevel: 'low' | 'medium' | 'high'
  }
  recommendations: string[]
  alerts: MarketAlert[]
  lastAnalyzed: string
}

// ===== SERVICE INTERFACE =====

export interface MarketIntelligenceService {
  // Material Cost Management
  getMaterialCosts(filters?: MarketIntelligenceFilters): Promise<MaterialCost[]>
  getMaterialCost(id: string): Promise<MaterialCost | null>
  updateMaterialCost(id: string, data: Partial<MaterialCost>): Promise<MaterialCost>
  addMaterialCost(data: Omit<MaterialCost, 'id' | 'lastUpdated'>): Promise<MaterialCost>
  deleteMaterialCost(id: string): Promise<boolean>

  // Labor Rate Management
  getLaborRates(filters?: MarketIntelligenceFilters): Promise<LaborRate[]>
  getLaborRate(id: string): Promise<LaborRate | null>
  updateLaborRate(id: string, data: Partial<LaborRate>): Promise<LaborRate>
  addLaborRate(data: Omit<LaborRate, 'id' | 'lastUpdated'>): Promise<LaborRate>
  deleteLaborRate(id: string): Promise<boolean>

  // Economic Indicators
  getEconomicIndicators(filters?: MarketIntelligenceFilters): Promise<EconomicIndicator[]>
  getEconomicIndicator(id: string): Promise<EconomicIndicator | null>
  updateEconomicIndicator(id: string, data: Partial<EconomicIndicator>): Promise<EconomicIndicator>

  // Industry Trends
  getIndustryTrends(filters?: MarketIntelligenceFilters): Promise<IndustryTrend[]>
  getIndustryTrend(id: string): Promise<IndustryTrend | null>
  addIndustryTrend(data: Omit<IndustryTrend, 'id' | 'publishedDate'>): Promise<IndustryTrend>

  // Market Opportunities
  getMarketOpportunities(filters?: MarketIntelligenceFilters): Promise<MarketOpportunity[]>
  getMarketOpportunity(id: string): Promise<MarketOpportunity | null>
  addMarketOpportunity(
    data: Omit<MarketOpportunity, 'id' | 'identifiedDate'>,
  ): Promise<MarketOpportunity>
  updateOpportunityStatus(
    id: string,
    status: MarketOpportunity['status'],
  ): Promise<MarketOpportunity>

  // Market Analysis
  getMarketAnalysis(): Promise<MarketAnalysisResult>
  getMarketAlerts(): Promise<MarketAlert[]>
  acknowledgeAlert(alertId: string, userId: string): Promise<boolean>
  createAlert(alert: Omit<MarketAlert, 'id' | 'createdAt' | 'acknowledged'>): Promise<MarketAlert>

  // Data Import/Export
  importMarketData(data: any, type: 'materials' | 'labor' | 'indicators'): Promise<boolean>
  exportMarketData(
    type: 'materials' | 'labor' | 'indicators',
    format: 'json' | 'csv',
  ): Promise<string>

  // Utility Functions
  calculatePriceTrends(materialId: string, days: number): Promise<any>
  calculateRateTrends(laborId: string, days: number): Promise<any>
  generateMarketReport(filters?: MarketIntelligenceFilters): Promise<string>
}

// ===== SERVICE IMPLEMENTATION =====

class MarketIntelligenceServiceImpl implements MarketIntelligenceService {
  private readonly MATERIALS_KEY = 'market_materials'
  private readonly LABOR_KEY = 'market_labor'
  private readonly INDICATORS_KEY = 'market_indicators'
  private readonly TRENDS_KEY = 'market_trends'
  private readonly OPPORTUNITIES_KEY = 'market_opportunities'
  private readonly ALERTS_KEY = 'market_alerts'

  // ===== MATERIAL COST MANAGEMENT =====

  async getMaterialCosts(filters?: MarketIntelligenceFilters): Promise<MaterialCost[]> {
    try {
      const materials = await asyncStorage.getItem(this.MATERIALS_KEY, [])

      if (!filters) return materials

      return materials.filter((material: MaterialCost) => {
        // Material type filter
        if (filters.materialTypes && !filters.materialTypes.includes(material.materialType)) {
          return false
        }

        // Region filter
        if (filters.regions && !filters.regions.includes(material.region)) {
          return false
        }

        // Price range filter
        if (filters.priceRange) {
          const [min, max] = filters.priceRange
          if (material.currentPrice < min || material.currentPrice > max) {
            return false
          }
        }

        // Date range filter
        if (filters.dateRange) {
          const [startDate, endDate] = filters.dateRange
          const materialDate = new Date(material.lastUpdated)
          if (materialDate < new Date(startDate) || materialDate > new Date(endDate)) {
            return false
          }
        }

        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          return (
            material.materialName.toLowerCase().includes(searchLower) ||
            material.materialNameEn?.toLowerCase().includes(searchLower) ||
            material.supplier.toLowerCase().includes(searchLower)
          )
        }

        return true
      })
    } catch (error) {
      console.error('Error loading material costs:', error)
      return []
    }
  }

  async getMaterialCost(id: string): Promise<MaterialCost | null> {
    const materials = await this.getMaterialCosts()
    return materials.find((m) => m.id === id) || null
  }

  async updateMaterialCost(id: string, data: Partial<MaterialCost>): Promise<MaterialCost> {
    const materials = await this.getMaterialCosts()
    const index = materials.findIndex((m) => m.id === id)

    if (index === -1) {
      throw new Error(`Material cost with id ${id} not found`)
    }

    const updatedMaterial = {
      ...materials[index],
      ...data,
      lastUpdated: new Date().toISOString(),
    }

    materials[index] = updatedMaterial
    await asyncStorage.setItem(this.MATERIALS_KEY, materials)

    return updatedMaterial
  }

  async addMaterialCost(data: Omit<MaterialCost, 'id' | 'lastUpdated'>): Promise<MaterialCost> {
    const materials = await this.getMaterialCosts()

    const newMaterial: MaterialCost = {
      id: this.generateId(),
      ...data,
      lastUpdated: new Date().toISOString(),
    }

    materials.push(newMaterial)
    await asyncStorage.setItem(this.MATERIALS_KEY, materials)

    return newMaterial
  }

  async deleteMaterialCost(id: string): Promise<boolean> {
    const materials = await this.getMaterialCosts()
    const filteredMaterials = materials.filter((m) => m.id !== id)

    if (filteredMaterials.length === materials.length) {
      return false
    }

    await asyncStorage.setItem(this.MATERIALS_KEY, filteredMaterials)
    return true
  }

  // ===== LABOR RATE MANAGEMENT =====

  async getLaborRates(filters?: MarketIntelligenceFilters): Promise<LaborRate[]> {
    try {
      const laborRates = await asyncStorage.getItem(this.LABOR_KEY, [])

      if (!filters) return laborRates

      return laborRates.filter((rate: LaborRate) => {
        // Skill category filter
        if (filters.skillCategories && !filters.skillCategories.includes(rate.skillCategory)) {
          return false
        }

        // Region filter
        if (filters.regions && !filters.regions.includes(rate.region)) {
          return false
        }

        // Rate range filter
        if (filters.rateRange) {
          const [min, max] = filters.rateRange
          if (rate.hourlyRate < min || rate.hourlyRate > max) {
            return false
          }
        }

        // Date range filter
        if (filters.dateRange) {
          const [startDate, endDate] = filters.dateRange
          const rateDate = new Date(rate.lastUpdated)
          if (rateDate < new Date(startDate) || rateDate > new Date(endDate)) {
            return false
          }
        }

        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          return (
            rate.skillCategory.toLowerCase().includes(searchLower) ||
            rate.city.toLowerCase().includes(searchLower) ||
            rate.region.toLowerCase().includes(searchLower)
          )
        }

        return true
      })
    } catch (error) {
      console.error('Error loading labor rates:', error)
      return []
    }
  }

  async getLaborRate(id: string): Promise<LaborRate | null> {
    const rates = await this.getLaborRates()
    return rates.find((r) => r.id === id) || null
  }

  async updateLaborRate(id: string, data: Partial<LaborRate>): Promise<LaborRate> {
    const rates = await this.getLaborRates()
    const index = rates.findIndex((r) => r.id === id)

    if (index === -1) {
      throw new Error(`Labor rate with id ${id} not found`)
    }

    const updatedRate = {
      ...rates[index],
      ...data,
      lastUpdated: new Date().toISOString(),
    }

    rates[index] = updatedRate
    await asyncStorage.setItem(this.LABOR_KEY, rates)

    return updatedRate
  }

  async addLaborRate(data: Omit<LaborRate, 'id' | 'lastUpdated'>): Promise<LaborRate> {
    const rates = await this.getLaborRates()

    const newRate: LaborRate = {
      id: this.generateId(),
      ...data,
      lastUpdated: new Date().toISOString(),
    }

    rates.push(newRate)
    await asyncStorage.setItem(this.LABOR_KEY, rates)

    return newRate
  }

  async deleteLaborRate(id: string): Promise<boolean> {
    const rates = await this.getLaborRates()
    const filteredRates = rates.filter((r) => r.id !== id)

    if (filteredRates.length === rates.length) {
      return false
    }

    await asyncStorage.setItem(this.LABOR_KEY, filteredRates)
    return true
  }

  // ===== ECONOMIC INDICATORS =====

  async getEconomicIndicators(filters?: MarketIntelligenceFilters): Promise<EconomicIndicator[]> {
    try {
      const indicators = await asyncStorage.getItem(this.INDICATORS_KEY, [])

      if (!filters) return indicators

      return indicators.filter((indicator: EconomicIndicator) => {
        // Indicator type filter
        if (filters.indicatorTypes && !filters.indicatorTypes.includes(indicator.indicatorType)) {
          return false
        }

        // Date range filter
        if (filters.dateRange) {
          const [startDate, endDate] = filters.dateRange
          const indicatorDate = new Date(indicator.lastUpdated)
          if (indicatorDate < new Date(startDate) || indicatorDate > new Date(endDate)) {
            return false
          }
        }

        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          return (
            indicator.name.toLowerCase().includes(searchLower) ||
            indicator.nameEn?.toLowerCase().includes(searchLower) ||
            indicator.source.toLowerCase().includes(searchLower)
          )
        }

        return true
      })
    } catch (error) {
      console.error('Error loading economic indicators:', error)
      return []
    }
  }

  async getEconomicIndicator(id: string): Promise<EconomicIndicator | null> {
    const indicators = await this.getEconomicIndicators()
    return indicators.find((i) => i.id === id) || null
  }

  async updateEconomicIndicator(
    id: string,
    data: Partial<EconomicIndicator>,
  ): Promise<EconomicIndicator> {
    const indicators = await this.getEconomicIndicators()
    const index = indicators.findIndex((i) => i.id === id)

    if (index === -1) {
      throw new Error(`Economic indicator with id ${id} not found`)
    }

    const updatedIndicator = {
      ...indicators[index],
      ...data,
      lastUpdated: new Date().toISOString(),
    }

    indicators[index] = updatedIndicator
    await asyncStorage.setItem(this.INDICATORS_KEY, indicators)

    return updatedIndicator
  }

  // ===== INDUSTRY TRENDS =====

  async getIndustryTrends(filters?: MarketIntelligenceFilters): Promise<IndustryTrend[]> {
    try {
      const trends = await asyncStorage.getItem(this.TRENDS_KEY, [])

      if (!filters) return trends

      return trends.filter((trend: IndustryTrend) => {
        // Trend type filter
        if (filters.trendTypes && !filters.trendTypes.includes(trend.trendType)) {
          return false
        }

        // Date range filter
        if (filters.dateRange) {
          const [startDate, endDate] = filters.dateRange
          const trendDate = new Date(trend.publishedDate)
          if (trendDate < new Date(startDate) || trendDate > new Date(endDate)) {
            return false
          }
        }

        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          return (
            trend.title.toLowerCase().includes(searchLower) ||
            trend.titleEn?.toLowerCase().includes(searchLower) ||
            trend.description.toLowerCase().includes(searchLower) ||
            trend.tags.some((tag) => tag.toLowerCase().includes(searchLower))
          )
        }

        return true
      })
    } catch (error) {
      console.error('Error loading industry trends:', error)
      return []
    }
  }

  async getIndustryTrend(id: string): Promise<IndustryTrend | null> {
    const trends = await this.getIndustryTrends()
    return trends.find((t) => t.id === id) || null
  }

  async addIndustryTrend(
    data: Omit<IndustryTrend, 'id' | 'publishedDate'>,
  ): Promise<IndustryTrend> {
    const trends = await this.getIndustryTrends()

    const newTrend: IndustryTrend = {
      id: this.generateId(),
      ...data,
      publishedDate: new Date().toISOString(),
    }

    trends.push(newTrend)
    await asyncStorage.setItem(this.TRENDS_KEY, trends)

    return newTrend
  }

  // ===== MARKET OPPORTUNITIES =====

  async getMarketOpportunities(filters?: MarketIntelligenceFilters): Promise<MarketOpportunity[]> {
    try {
      const opportunities = await asyncStorage.getItem(this.OPPORTUNITIES_KEY, [])

      if (!filters) return opportunities

      return opportunities.filter((opportunity: MarketOpportunity) => {
        // Opportunity type filter
        if (
          filters.opportunityTypes &&
          !filters.opportunityTypes.includes(opportunity.opportunityType)
        ) {
          return false
        }

        // Region filter
        if (filters.regions && !filters.regions.includes(opportunity.region)) {
          return false
        }

        // Date range filter
        if (filters.dateRange) {
          const [startDate, endDate] = filters.dateRange
          const opportunityDate = new Date(opportunity.identifiedDate)
          if (opportunityDate < new Date(startDate) || opportunityDate > new Date(endDate)) {
            return false
          }
        }

        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          return (
            opportunity.title.toLowerCase().includes(searchLower) ||
            opportunity.titleEn?.toLowerCase().includes(searchLower) ||
            opportunity.description.toLowerCase().includes(searchLower) ||
            opportunity.sector.toLowerCase().includes(searchLower)
          )
        }

        return true
      })
    } catch (error) {
      console.error('Error loading market opportunities:', error)
      return []
    }
  }

  async getMarketOpportunity(id: string): Promise<MarketOpportunity | null> {
    const opportunities = await this.getMarketOpportunities()
    return opportunities.find((o) => o.id === id) || null
  }

  async addMarketOpportunity(
    data: Omit<MarketOpportunity, 'id' | 'identifiedDate'>,
  ): Promise<MarketOpportunity> {
    const opportunities = await this.getMarketOpportunities()

    const newOpportunity: MarketOpportunity = {
      id: this.generateId(),
      ...data,
      identifiedDate: new Date().toISOString(),
    }

    opportunities.push(newOpportunity)
    await asyncStorage.setItem(this.OPPORTUNITIES_KEY, opportunities)

    return newOpportunity
  }

  async updateOpportunityStatus(
    id: string,
    status: MarketOpportunity['status'],
  ): Promise<MarketOpportunity> {
    const opportunities = await this.getMarketOpportunities()
    const index = opportunities.findIndex((o) => o.id === id)

    if (index === -1) {
      throw new Error(`Market opportunity with id ${id} not found`)
    }

    opportunities[index].status = status
    await asyncStorage.setItem(this.OPPORTUNITIES_KEY, opportunities)

    return opportunities[index]
  }

  // ===== MARKET ANALYSIS =====

  async getMarketAnalysis(): Promise<MarketAnalysisResult> {
    try {
      const [materials, laborRates, opportunities, alerts] = await Promise.all([
        this.getMaterialCosts(),
        this.getLaborRates(),
        this.getMarketOpportunities(),
        this.getMarketAlerts(),
      ])

      // Calculate summary statistics
      const totalMaterials = materials.length
      const avgPriceChange =
        materials.length > 0
          ? materials.reduce((sum, m) => sum + m.priceChangePercent, 0) / materials.length
          : 0

      const totalLaborCategories = laborRates.length
      const avgRateChange =
        laborRates.length > 0
          ? laborRates.reduce((sum, r) => {
              const change =
                r.rateHistory.length > 1
                  ? ((r.hourlyRate - r.rateHistory[r.rateHistory.length - 2].hourlyRate) /
                      r.rateHistory[r.rateHistory.length - 2].hourlyRate) *
                    100
                  : 0
              return sum + change
            }, 0) / laborRates.length
          : 0

      const activeOpportunities = opportunities.filter((o) => o.status === 'active').length
      const criticalAlerts = alerts.filter(
        (a) => a.severity === 'critical' && !a.acknowledged,
      ).length

      // Determine trends
      const materialCostTrend =
        avgPriceChange > 2 ? 'increasing' : avgPriceChange < -2 ? 'decreasing' : 'stable'
      const laborRateTrend =
        avgRateChange > 2 ? 'increasing' : avgRateChange < -2 ? 'decreasing' : 'stable'

      // Market sentiment analysis
      let marketSentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
      if (activeOpportunities > 5 && criticalAlerts < 3) {
        marketSentiment = 'positive'
      } else if (criticalAlerts > 5 || avgPriceChange > 10) {
        marketSentiment = 'negative'
      }

      // Competition level assessment
      const competitionLevel =
        activeOpportunities > 10 ? 'high' : activeOpportunities > 5 ? 'medium' : 'low'

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        materialCostTrend,
        laborRateTrend,
        marketSentiment,
        criticalAlerts,
      )

      return {
        summary: {
          totalMaterials,
          avgPriceChange: Math.round(avgPriceChange * 100) / 100,
          totalLaborCategories,
          avgRateChange: Math.round(avgRateChange * 100) / 100,
          activeOpportunities,
          criticalAlerts,
        },
        trends: {
          materialCostTrend,
          laborRateTrend,
          marketSentiment,
          competitionLevel,
        },
        recommendations,
        alerts: alerts.filter((a) => !a.acknowledged).slice(0, 10), // Top 10 unacknowledged alerts
        lastAnalyzed: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error generating market analysis:', error)
      throw error
    }
  }

  async getMarketAlerts(): Promise<MarketAlert[]> {
    try {
      return await asyncStorage.getItem(this.ALERTS_KEY, [])
    } catch (error) {
      console.error('Error loading market alerts:', error)
      return []
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const alerts = await this.getMarketAlerts()
      const index = alerts.findIndex((a) => a.id === alertId)

      if (index === -1) {
        return false
      }

      alerts[index].acknowledged = true
      alerts[index].acknowledgedBy = userId
      alerts[index].acknowledgedAt = new Date().toISOString()

      await asyncStorage.setItem(this.ALERTS_KEY, alerts)
      return true
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      return false
    }
  }

  async createAlert(
    alert: Omit<MarketAlert, 'id' | 'createdAt' | 'acknowledged'>,
  ): Promise<MarketAlert> {
    try {
      const alerts = await this.getMarketAlerts()

      const newAlert: MarketAlert = {
        id: this.generateId(),
        ...alert,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      }

      alerts.push(newAlert)
      await asyncStorage.setItem(this.ALERTS_KEY, alerts)

      return newAlert
    } catch (error) {
      console.error('Error creating alert:', error)
      throw error
    }
  }

  // ===== DATA IMPORT/EXPORT =====

  async importMarketData(data: any, type: 'materials' | 'labor' | 'indicators'): Promise<boolean> {
    try {
      const storageKey =
        type === 'materials'
          ? this.MATERIALS_KEY
          : type === 'labor'
            ? this.LABOR_KEY
            : this.INDICATORS_KEY

      if (!Array.isArray(data)) {
        throw new Error('Import data must be an array')
      }

      // Validate data structure
      for (const item of data) {
        if (!item.id) {
          item.id = this.generateId()
        }
        if (!item.lastUpdated) {
          item.lastUpdated = new Date().toISOString()
        }
      }

      await asyncStorage.setItem(storageKey, data)
      return true
    } catch (error) {
      console.error('Error importing market data:', error)
      return false
    }
  }

  async exportMarketData(
    type: 'materials' | 'labor' | 'indicators',
    format: 'json' | 'csv',
  ): Promise<string> {
    try {
      let data: any[]

      switch (type) {
        case 'materials':
          data = await this.getMaterialCosts()
          break
        case 'labor':
          data = await this.getLaborRates()
          break
        case 'indicators':
          data = await this.getEconomicIndicators()
          break
        default:
          throw new Error(`Unknown export type: ${type}`)
      }

      if (format === 'json') {
        return JSON.stringify(data, null, 2)
      } else {
        // CSV format
        if (data.length === 0) return ''

        const headers = Object.keys(data[0]).join(',')
        const rows = data.map((item) =>
          Object.values(item)
            .map((value) => (typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value))
            .join(','),
        )

        return [headers, ...rows].join('\n')
      }
    } catch (error) {
      console.error('Error exporting market data:', error)
      throw error
    }
  }

  // ===== UTILITY FUNCTIONS =====

  async calculatePriceTrends(materialId: string, days: number): Promise<any> {
    try {
      const material = await this.getMaterialCost(materialId)
      if (!material) {
        throw new Error(`Material with id ${materialId} not found`)
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const relevantHistory = material.priceHistory.filter(
        (entry) => new Date(entry.date) >= cutoffDate,
      )

      if (relevantHistory.length < 2) {
        return {
          trend: 'insufficient_data',
          change: 0,
          changePercent: 0,
          volatility: 0,
        }
      }

      // Calculate trend
      const prices = relevantHistory.map((h) => h.price)
      const firstPrice = prices[0]
      const lastPrice = prices[prices.length - 1]
      const change = lastPrice - firstPrice
      const changePercent = (change / firstPrice) * 100

      // Calculate volatility (standard deviation)
      const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const variance =
        prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length
      const volatility = Math.sqrt(variance)

      return {
        trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        dataPoints: relevantHistory.length,
      }
    } catch (error) {
      console.error('Error calculating price trends:', error)
      throw error
    }
  }

  async calculateRateTrends(laborId: string, days: number): Promise<any> {
    try {
      const laborRate = await this.getLaborRate(laborId)
      if (!laborRate) {
        throw new Error(`Labor rate with id ${laborId} not found`)
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const relevantHistory = laborRate.rateHistory.filter(
        (entry) => new Date(entry.date) >= cutoffDate,
      )

      if (relevantHistory.length < 2) {
        return {
          trend: 'insufficient_data',
          change: 0,
          changePercent: 0,
          volatility: 0,
        }
      }

      // Calculate trend
      const rates = relevantHistory.map((h) => h.hourlyRate)
      const firstRate = rates[0]
      const lastRate = rates[rates.length - 1]
      const change = lastRate - firstRate
      const changePercent = (change / firstRate) * 100

      // Calculate volatility
      const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
      const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length
      const volatility = Math.sqrt(variance)

      return {
        trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        dataPoints: relevantHistory.length,
      }
    } catch (error) {
      console.error('Error calculating rate trends:', error)
      throw error
    }
  }

  async generateMarketReport(filters?: MarketIntelligenceFilters): Promise<string> {
    try {
      const analysis = await this.getMarketAnalysis()
      const materials = await this.getMaterialCosts(filters)
      const laborRates = await this.getLaborRates(filters)
      const opportunities = await this.getMarketOpportunities(filters)
      const trends = await this.getIndustryTrends(filters)

      const reportDate = new Date().toLocaleDateString('ar-SA')

      let report = `# ?Ò?é???è?? ???â?Ï?É ?Ï?????ê?é - Market Intelligence Report\n\n`
      report += `**?Ò?Ï???è?« ?Ï???Ò?é???è?? / Report Date:** ${reportDate}\n\n`

      // Executive Summary
      report += `## ?Ï???à???«?? ?Ï???Ò?????è???è / Executive Summary\n\n`
      report += `- ?Í?Ô?à?Ï???è ?Ï???à?ê?Ï?» ?Ï???à?Ò?Ò?Ð???Ñ / Total Materials Tracked: ${analysis.summary.totalMaterials}\n`
      report += `- ?à?Ò?ê???? ?Ò???è?è?? ?Ï???Ë?????Ï?? / Average Price Change: ${analysis.summary.avgPriceChange}%\n`
      report += `- ?Í?Ô?à?Ï???è ???Î?Ï?Ò ?Ï?????à?Ï???Ñ / Total Labor Categories: ${analysis.summary.totalLaborCategories}\n`
      report += `- ?à?Ò?ê???? ?Ò???è?è?? ?Ï???Ë?Ô?ê?? / Average Rate Change: ${analysis.summary.avgRateChange}%\n`
      report += `- ?Ï???????? ?Ï?????????Ñ / Active Opportunities: ${analysis.summary.activeOpportunities}\n`
      report += `- ?Ï???Ò???Ð?è?ç?Ï?Ò ?Ï???Õ???Ô?Ñ / Critical Alerts: ${analysis.summary.criticalAlerts}\n\n`

      // Market Trends
      report += `## ?Ï?Ò?Ô?Ï?ç?Ï?Ò ?Ï?????ê?é / Market Trends\n\n`
      report += `- ?Ï?Ò?Ô?Ï?ç ?Ò?â?????Ñ ?Ï???à?ê?Ï?» / Material Cost Trend: ${this.translateTrend(analysis.trends.materialCostTrend)}\n`
      report += `- ?Ï?Ò?Ô?Ï?ç ?Ë?Ô?ê?? ?Ï?????à?Ï???Ñ / Labor Rate Trend: ${this.translateTrend(analysis.trends.laborRateTrend)}\n`
      report += `- ?à?????ê?è?Ï?Ò ?Ï?????ê?é / Market Sentiment: ${this.translateSentiment(analysis.trends.marketSentiment)}\n`
      report += `- ?à???Ò?ê?ë ?Ï???à???Ï?????Ñ / Competition Level: ${this.translateCompetition(analysis.trends.competitionLevel)}\n\n`

      // Top Materials by Price Change
      if (materials.length > 0) {
        report += `## ?Ë?ç?à ?Ï???à?ê?Ï?» ?Õ???Ð ?Ò???è?è?? ?Ï???????? / Top Materials by Price Change\n\n`
        const topMaterials = materials
          .sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))
          .slice(0, 5)

        topMaterials.forEach((material, index) => {
          report += `${index + 1}. **${material.materialName}** - ${material.priceChangePercent > 0 ? '+' : ''}${material.priceChangePercent}%\n`
        })
        report += `\n`
      }

      // Top Labor Rates
      if (laborRates.length > 0) {
        report += `## ?Ë?????ë ?Ë?Ô?ê?? ?Ï?????à?Ï???Ñ / Highest Labor Rates\n\n`
        const topRates = laborRates.sort((a, b) => b.hourlyRate - a.hourlyRate).slice(0, 5)

        topRates.forEach((rate, index) => {
          report += `${index + 1}. **${rate.skillCategory}** (${rate.skillLevel}) - ${rate.hourlyRate} ${rate.currency}/???Ï???Ñ\n`
        })
        report += `\n`
      }

      // Market Opportunities
      if (opportunities.length > 0) {
        report += `## ?Ï???????? ?Ï?????ê?é?è?Ñ / Market Opportunities\n\n`
        const activeOpps = opportunities.filter((o) => o.status === 'active').slice(0, 5)

        activeOpps.forEach((opp, index) => {
          report += `${index + 1}. **${opp.title}** - ${opp.estimatedValue.toLocaleString()} (?Ï?Õ?Ò?à?Ï???è?Ñ: ${opp.probability}%)\n`
        })
        report += `\n`
      }

      // Recommendations
      if (analysis.recommendations.length > 0) {
        report += `## ?Ï???Ò?ê???è?Ï?Ò / Recommendations\n\n`
        analysis.recommendations.forEach((rec, index) => {
          report += `${index + 1}. ${rec}\n`
        })
        report += `\n`
      }

      // Industry Trends
      if (trends.length > 0) {
        report += `## ?Ï???Ï?Ò?Ô?Ï?ç?Ï?Ò ?Ï???????Ï???è?Ñ / Industry Trends\n\n`
        trends.slice(0, 3).forEach((trend, index) => {
          report += `${index + 1}. **${trend.title}** - ${this.translateImpact(trend.impact)} Impact\n`
          report += `   ${trend.description.substring(0, 100)}...\n\n`
        })
      }

      report += `---\n\n`
      report += `*?Ò?à ?Í?????Ï?É ?ç???Ï ?Ï???Ò?é???è?? ?Ð?ê?Ï?????Ñ ?????Ï?à ?Í?»?Ï???Ñ ?????Õ ?Ï???à?â?Ò?Ð / Generated by Desktop Management System*\n`
      report += `*?Ê?«?? ?Ò?Õ???è??: ${analysis.lastAnalyzed} / Last Analysis: ${analysis.lastAnalyzed}*`

      return report
    } catch (error) {
      console.error('Error generating market report:', error)
      throw error
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private generateRecommendations(
    materialTrend: string,
    laborTrend: string,
    sentiment: string,
    criticalAlerts: number,
  ): string[] {
    const recommendations: string[] = []

    if (materialTrend === 'increasing') {
      recommendations.push(
        '???â?? ???è ?Ò?Ë?à?è?? ?Ï???à?ê?Ï?» ?à???Ð?é?Ï?ï ???Ò?Ô???Ð ???è?Ï?»?Ï?Ò ?Ï???Ë?????Ï?? ?Ï???à???Ò?é?Ð???è?Ñ',
      )
      recommendations.push('Consider securing materials in advance to avoid future price increases')
    }

    if (laborTrend === 'increasing') {
      recommendations.push(
        '???Ï?Ô?? ?Ï???Ò???Ï?Ò?è?Ô?è?Ï?Ò ?Ï???Ò?ê???è?? ?ê???â?? ???è ?Ï???Ò?»???è?Ð ?Ï???»?Ï?«???è',
      )
      recommendations.push('Review hiring strategies and consider internal training programs')
    }

    if (sentiment === 'negative') {
      recommendations.push(
        '?Ï?Ò?«?? ?à?ê?é???Ï?ï ?»???Ï???è?Ï?ï ???è ?Ï?????ê?é ?ê???â?? ?????ë ?Ï???à???Ï???è?? ?Ï???à???à?ê???Ñ',
      )
      recommendations.push('Take a defensive market position and focus on secured projects')
    }

    if (sentiment === 'positive') {
      recommendations.push(
        '?Ï???Ò?â???? ?????? ?Ï???Ò?ê???? ?ê?Ï???Ï???Ò?Ó?à?Ï?? ???è ?é???Ï???Ï?Ò ?Ô?»?è?»?Ñ',
      )
      recommendations.push('Explore expansion opportunities and investment in new sectors')
    }

    if (criticalAlerts > 3) {
      recommendations.push(
        '???Ï?Ô?? ?Ï???Ò???Ð?è?ç?Ï?Ò ?Ï???Õ???Ô?Ñ ???ê???Ï?ï ?ê?Ï?Ò?«?? ?Í?Ô???Ï?É?Ï?Ò ?Ò???Õ?è?Õ?è?Ñ',
      )
      recommendations.push('Review critical alerts immediately and take corrective actions')
    }

    return recommendations
  }

  private translateTrend(trend: string): string {
    switch (trend) {
      case 'increasing':
        return '?à?Ò???Ï?è?» / Increasing'
      case 'decreasing':
        return '?à?Ò???Ï?é?? / Decreasing'
      case 'stable':
        return '?à???Ò?é?? / Stable'
      default:
        return trend
    }
  }

  private translateSentiment(sentiment: string): string {
    switch (sentiment) {
      case 'positive':
        return '?Í?è?Ô?Ï?Ð?è / Positive'
      case 'negative':
        return '?????Ð?è / Negative'
      case 'neutral':
        return '?à?Õ?Ï?è?» / Neutral'
      default:
        return sentiment
    }
  }

  private translateCompetition(level: string): string {
    switch (level) {
      case 'high':
        return '???Ï???è / High'
      case 'medium':
        return '?à?Ò?ê???? / Medium'
      case 'low':
        return '?à???«???? / Low'
      default:
        return level
    }
  }

  private translateImpact(impact: string): string {
    switch (impact) {
      case 'high':
        return '???Ï???è / High'
      case 'medium':
        return '?à?Ò?ê???? / Medium'
      case 'low':
        return '?à???«???? / Low'
      default:
        return impact
    }
  }
}

// ===== EXPORT SINGLETON INSTANCE =====

export const marketIntelligenceService = new MarketIntelligenceServiceImpl()
export type { MarketIntelligenceService }
