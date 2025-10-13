/**
 * Analytics Service for Phase 2 Implementation
 * 
 * This service handles all analytics-related operations including bid performance
 * tracking, market intelligence, and competitive analysis data management.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation
 */

import { safeLocalStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/storageKeys'
import type {
  BidPerformance,
  MarketIntelligence,
  CompetitorData,
  PerformanceSummary,
  CompetitiveAnalysis,
  AnalyticsFilter,
  AnalyticsQuery,
  TimeSeriesPoint,
  ChartData
} from '../types/analytics'
import type { Tender } from '../types/contracts'

/**
 * Interface for the Analytics Service
 */
export interface IAnalyticsService {
  // Bid Performance Management
  createBidPerformance(performance: Omit<BidPerformance, 'id' | 'createdAt' | 'updatedAt'>): Promise<BidPerformance>
  updateBidPerformance(id: string, updates: Partial<BidPerformance>): Promise<BidPerformance>
  getBidPerformance(id: string): Promise<BidPerformance | null>
  getAllBidPerformances(query?: AnalyticsQuery): Promise<BidPerformance[]>
  deleteBidPerformance(id: string): Promise<boolean>

  // Performance Analytics
  getPerformanceSummary(filter?: AnalyticsFilter): Promise<PerformanceSummary>
  getWinRateTrend(filter?: AnalyticsFilter): Promise<TimeSeriesPoint[]>
  getMarginTrend(filter?: AnalyticsFilter): Promise<TimeSeriesPoint[]>
  getPerformanceByCategory(filter?: AnalyticsFilter): Promise<ChartData>
  getPerformanceByRegion(filter?: AnalyticsFilter): Promise<ChartData>

  // Market Intelligence
  createMarketIntelligence(intelligence: Omit<MarketIntelligence, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketIntelligence>
  updateMarketIntelligence(id: string, updates: Partial<MarketIntelligence>): Promise<MarketIntelligence>
  getMarketIntelligence(id: string): Promise<MarketIntelligence | null>
  getAllMarketIntelligence(filter?: AnalyticsFilter): Promise<MarketIntelligence[]>

  // Competitor Management
  createCompetitor(competitor: Omit<CompetitorData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompetitorData>
  updateCompetitor(id: string, updates: Partial<CompetitorData>): Promise<CompetitorData>
  getCompetitor(id: string): Promise<CompetitorData | null>
  getAllCompetitors(query?: AnalyticsQuery): Promise<CompetitorData[]>
  deleteCompetitor(id: string): Promise<boolean>

  // Competitive Analysis
  getCompetitiveAnalysis(filter?: AnalyticsFilter): Promise<CompetitiveAnalysis>
  getMarketShareData(filter?: AnalyticsFilter): Promise<ChartData>
  getCompetitorPerformance(competitorId: string, filter?: AnalyticsFilter): Promise<any>

  // Utility Methods
  generatePerformanceReport(filter?: AnalyticsFilter): Promise<any>
  exportAnalyticsData(type: 'performance' | 'competitors' | 'market', filter?: AnalyticsFilter): Promise<any>
  importTenderData(tender: Tender): Promise<BidPerformance>
}

/**
 * Analytics Service Implementation
 */
class AnalyticsServiceImpl implements IAnalyticsService {
  private readonly storageKeys = {
    bidPerformances: STORAGE_KEYS.BID_PERFORMANCES || 'app_bid_performances',
    marketIntelligence: STORAGE_KEYS.MARKET_INTELLIGENCE || 'app_market_intelligence',
    competitors: STORAGE_KEYS.COMPETITORS || 'app_competitors'
  }

  /**
   * Generate a unique ID for new records
   */
  private generateId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get current timestamp in ISO format
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString()
  }

  // ============================================================================
  // BID PERFORMANCE MANAGEMENT
  // ============================================================================

  /**
   * Create a new bid performance record
   */
  async createBidPerformance(performance: Omit<BidPerformance, 'id' | 'createdAt' | 'updatedAt'>): Promise<BidPerformance> {
    try {
      const newPerformance: BidPerformance = {
        ...performance,
        id: this.generateId(),
        createdAt: this.getCurrentTimestamp(),
        updatedAt: this.getCurrentTimestamp()
      }

      const existingPerformances = await this.getAllBidPerformances()
      const updatedPerformances = [...existingPerformances, newPerformance]
      
      await safeLocalStorage.setItem(this.storageKeys.bidPerformances, JSON.stringify(updatedPerformances))
      
      return newPerformance
    } catch (error) {
      console.error('Error creating bid performance:', error)
      throw new Error('Failed to create bid performance record')
    }
  }

  /**
   * Update an existing bid performance record
   */
  async updateBidPerformance(id: string, updates: Partial<BidPerformance>): Promise<BidPerformance> {
    try {
      const existingPerformances = await this.getAllBidPerformances()
      const performanceIndex = existingPerformances.findIndex(p => p.id === id)
      
      if (performanceIndex === -1) {
        throw new Error('Bid performance record not found')
      }

      const updatedPerformance: BidPerformance = {
        ...existingPerformances[performanceIndex],
        ...updates,
        updatedAt: this.getCurrentTimestamp()
      }

      existingPerformances[performanceIndex] = updatedPerformance
      await safeLocalStorage.setItem(this.storageKeys.bidPerformances, JSON.stringify(existingPerformances))
      
      return updatedPerformance
    } catch (error) {
      console.error('Error updating bid performance:', error)
      throw new Error('Failed to update bid performance record')
    }
  }

  /**
   * Get a specific bid performance record by ID
   */
  async getBidPerformance(id: string): Promise<BidPerformance | null> {
    try {
      const performances = await this.getAllBidPerformances()
      return performances.find(p => p.id === id) || null
    } catch (error) {
      console.error('Error getting bid performance:', error)
      return null
    }
  }

  /**
   * Get all bid performance records with optional filtering
   */
  async getAllBidPerformances(query?: AnalyticsQuery): Promise<BidPerformance[]> {
    try {
      const data = await safeLocalStorage.getItem(this.storageKeys.bidPerformances)
      let performances: BidPerformance[] = data ? JSON.parse(data) : []

      // Apply filters if provided
      if (query?.filters) {
        performances = this.applyFilters(performances, query.filters)
      }

      // Apply sorting if provided
      if (query?.sortBy) {
        performances = this.applySorting(performances, query.sortBy, query.sortOrder || 'desc')
      }

      // Apply pagination if provided
      if (query?.limit || query?.offset) {
        const offset = query.offset || 0
        const limit = query.limit || performances.length
        performances = performances.slice(offset, offset + limit)
      }

      return performances
    } catch (error) {
      console.error('Error getting bid performances:', error)
      return []
    }
  }

  /**
   * Delete a bid performance record
   */
  async deleteBidPerformance(id: string): Promise<boolean> {
    try {
      const existingPerformances = await this.getAllBidPerformances()
      const filteredPerformances = existingPerformances.filter(p => p.id !== id)
      
      if (filteredPerformances.length === existingPerformances.length) {
        return false // Record not found
      }

      await safeLocalStorage.setItem(this.storageKeys.bidPerformances, JSON.stringify(filteredPerformances))
      return true
    } catch (error) {
      console.error('Error deleting bid performance:', error)
      return false
    }
  }

  // ============================================================================
  // PERFORMANCE ANALYTICS
  // ============================================================================

  /**
   * Get comprehensive performance summary
   */
  async getPerformanceSummary(filter?: AnalyticsFilter): Promise<PerformanceSummary> {
    try {
      const performances = await this.getAllBidPerformances({ filters: filter })
      
      // Calculate overall metrics
      const totalBids = performances.length
      const wonBids = performances.filter(p => p.outcome === 'won').length
      const winRate = totalBids > 0 ? (wonBids / totalBids) * 100 : 0
      const totalValue = performances.reduce((sum, p) => sum + p.bidAmount, 0)
      const averageMargin = performances.length > 0 
        ? performances.reduce((sum, p) => sum + p.plannedMargin, 0) / performances.length 
        : 0

      // Calculate ROI (simplified calculation)
      const roi = wonBids > 0 
        ? performances
            .filter(p => p.outcome === 'won')
            .reduce((sum, p) => sum + (p.actualMargin || p.plannedMargin), 0) / wonBids
        : 0

      // Get date range
      const dates = performances.map(p => p.submissionDate).sort()
      const period = {
        start: dates[0] || new Date().toISOString(),
        end: dates[dates.length - 1] || new Date().toISOString()
      }

      // Calculate trends (simplified - would need historical comparison)
      const trends = {
        winRateTrend: 0, // Would calculate based on historical data
        marginTrend: 0,
        volumeTrend: 0,
        efficiencyTrend: 0
      }

      // Group by category
      const categoryGroups = this.groupBy(performances, 'category')
      const byCategory = Object.entries(categoryGroups).map(([category, items]) => ({
        category,
        bids: items.length,
        wins: items.filter(p => p.outcome === 'won').length,
        winRate: items.length > 0 ? (items.filter(p => p.outcome === 'won').length / items.length) * 100 : 0,
        averageValue: items.length > 0 ? items.reduce((sum, p) => sum + p.bidAmount, 0) / items.length : 0,
        margin: items.length > 0 ? items.reduce((sum, p) => sum + p.plannedMargin, 0) / items.length : 0
      }))

      // Group by region
      const regionGroups = this.groupBy(performances, 'region')
      const byRegion = Object.entries(regionGroups).map(([region, items]) => ({
        region,
        bids: items.length,
        wins: items.filter(p => p.outcome === 'won').length,
        winRate: items.length > 0 ? (items.filter(p => p.outcome === 'won').length / items.length) * 100 : 0,
        marketShare: 0 // Would calculate based on market data
      }))

      // Top performing segments (simplified)
      const topSegments = byCategory
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 5)
        .map(cat => ({
          segment: cat.category,
          performance: cat.winRate,
          growth: 0 // Would calculate based on historical data
        }))

      return {
        period,
        overall: {
          totalBids,
          wonBids,
          winRate,
          totalValue,
          averageMargin,
          roi
        },
        trends,
        byCategory,
        byRegion,
        topSegments
      }
    } catch (error) {
      console.error('Error generating performance summary:', error)
      throw new Error('Failed to generate performance summary')
    }
  }

  /**
   * Get win rate trend over time
   */
  async getWinRateTrend(filter?: AnalyticsFilter): Promise<TimeSeriesPoint[]> {
    try {
      const performances = await this.getAllBidPerformances({ filters: filter })
      
      // Group by month
      const monthlyGroups = this.groupByMonth(performances)
      
      return Object.entries(monthlyGroups).map(([month, items]) => ({
        date: month,
        value: items.length > 0 ? (items.filter(p => p.outcome === 'won').length / items.length) * 100 : 0,
        label: `${items.filter(p => p.outcome === 'won').length}/${items.length} won`,
        metadata: { totalBids: items.length, wonBids: items.filter(p => p.outcome === 'won').length }
      })).sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('Error getting win rate trend:', error)
      return []
    }
  }

  /**
   * Get margin trend over time
   */
  async getMarginTrend(filter?: AnalyticsFilter): Promise<TimeSeriesPoint[]> {
    try {
      const performances = await this.getAllBidPerformances({ filters: filter })
      
      // Group by month
      const monthlyGroups = this.groupByMonth(performances)
      
      return Object.entries(monthlyGroups).map(([month, items]) => ({
        date: month,
        value: items.length > 0 ? items.reduce((sum, p) => sum + p.plannedMargin, 0) / items.length : 0,
        label: `${items.length} bids`,
        metadata: { bidCount: items.length }
      })).sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('Error getting margin trend:', error)
      return []
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Apply filters to performance data
   */
  private applyFilters(performances: BidPerformance[], filters: AnalyticsFilter): BidPerformance[] {
    let filtered = [...performances]

    if (filters.dateRange) {
      filtered = filtered.filter(p => 
        p.submissionDate >= filters.dateRange!.start && 
        p.submissionDate <= filters.dateRange!.end
      )
    }

    if (filters.categories?.length) {
      filtered = filtered.filter(p => filters.categories!.includes(p.category))
    }

    if (filters.regions?.length) {
      filtered = filtered.filter(p => filters.regions!.includes(p.region))
    }

    if (filters.outcomes?.length) {
      filtered = filtered.filter(p => filters.outcomes!.includes(p.outcome))
    }

    if (filters.valueRange) {
      filtered = filtered.filter(p => 
        p.bidAmount >= filters.valueRange!.min && 
        p.bidAmount <= filters.valueRange!.max
      )
    }

    return filtered
  }

  /**
   * Apply sorting to performance data
   */
  private applySorting(performances: BidPerformance[], sortBy: string, sortOrder: 'asc' | 'desc'): BidPerformance[] {
    return [...performances].sort((a, b) => {
      const aValue = (a as any)[sortBy]
      const bValue = (b as any)[sortBy]
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  /**
   * Group array by property
   */
  private groupBy<T>(array: T[], property: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = String(item[property])
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  /**
   * Group performances by month
   */
  private groupByMonth(performances: BidPerformance[]): Record<string, BidPerformance[]> {
    return performances.reduce((groups, performance) => {
      const month = performance.submissionDate.substring(0, 7) // YYYY-MM
      if (!groups[month]) {
        groups[month] = []
      }
      groups[month].push(performance)
      return groups
    }, {} as Record<string, BidPerformance[]>)
  }

  // ============================================================================
  // PLACEHOLDER METHODS (TO BE IMPLEMENTED)
  // ============================================================================

  async getPerformanceByCategory(filter?: AnalyticsFilter): Promise<ChartData> {
    // Implementation placeholder
    return { labels: [], datasets: [] }
  }

  async getPerformanceByRegion(filter?: AnalyticsFilter): Promise<ChartData> {
    // Implementation placeholder
    return { labels: [], datasets: [] }
  }

  async createMarketIntelligence(intelligence: Omit<MarketIntelligence, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketIntelligence> {
    // Implementation placeholder
    throw new Error('Not implemented yet')
  }

  async updateMarketIntelligence(id: string, updates: Partial<MarketIntelligence>): Promise<MarketIntelligence> {
    // Implementation placeholder
    throw new Error('Not implemented yet')
  }

  async getMarketIntelligence(id: string): Promise<MarketIntelligence | null> {
    // Implementation placeholder
    return null
  }

  async getAllMarketIntelligence(filter?: AnalyticsFilter): Promise<MarketIntelligence[]> {
    // Implementation placeholder
    return []
  }

  async createCompetitor(competitor: Omit<CompetitorData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompetitorData> {
    // Implementation placeholder
    throw new Error('Not implemented yet')
  }

  async updateCompetitor(id: string, updates: Partial<CompetitorData>): Promise<CompetitorData> {
    // Implementation placeholder
    throw new Error('Not implemented yet')
  }

  async getCompetitor(id: string): Promise<CompetitorData | null> {
    // Implementation placeholder
    return null
  }

  async getAllCompetitors(query?: AnalyticsQuery): Promise<CompetitorData[]> {
    // Implementation placeholder
    return []
  }

  async deleteCompetitor(id: string): Promise<boolean> {
    // Implementation placeholder
    return false
  }

  async getCompetitiveAnalysis(filter?: AnalyticsFilter): Promise<CompetitiveAnalysis> {
    // Implementation placeholder
    throw new Error('Not implemented yet')
  }

  async getMarketShareData(filter?: AnalyticsFilter): Promise<ChartData> {
    // Implementation placeholder
    return { labels: [], datasets: [] }
  }

  async getCompetitorPerformance(competitorId: string, filter?: AnalyticsFilter): Promise<any> {
    // Implementation placeholder
    return {}
  }

  async generatePerformanceReport(filter?: AnalyticsFilter): Promise<any> {
    // Implementation placeholder
    return {}
  }

  async exportAnalyticsData(type: 'performance' | 'competitors' | 'market', filter?: AnalyticsFilter): Promise<any> {
    // Implementation placeholder
    return {}
  }

  async importTenderData(tender: Tender): Promise<BidPerformance> {
    // Implementation placeholder
    throw new Error('Not implemented yet')
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsServiceImpl()
