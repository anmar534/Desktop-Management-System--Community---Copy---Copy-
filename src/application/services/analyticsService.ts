/**
 * Analytics Service implementation responsible for bid performance persistence
 * and derived analytical summaries used throughout the application.
 */

import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import type {
  AnalyticsFilter,
  BidPerformance,
  PerformanceSummary,
  TimeSeriesPoint,
} from '@/shared/types/analytics'

interface GetAllBidPerformancesOptions {
  filters?: AnalyticsFilter
}

class AnalyticsServiceImpl {
  private readonly storageKey = STORAGE_KEYS.BID_PERFORMANCES

  async getAllBidPerformances(options?: GetAllBidPerformancesOptions): Promise<BidPerformance[]> {
    const records = await this.loadRecords()
    const filtered = this.applyFilters(records, options?.filters)

    return filtered.sort((a, b) => {
      const aDate = this.parseDate(a.submissionDate)?.getTime() ?? 0
      const bDate = this.parseDate(b.submissionDate)?.getTime() ?? 0
      return bDate - aDate
    })
  }

  async createBidPerformance(
    performance: Omit<BidPerformance, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<BidPerformance> {
    const records = await this.loadRecords()
    const timestamp = this.getTimestamp()

    const newRecord: BidPerformance = {
      ...performance,
      id: this.generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
      metrics: {
        roi: performance.metrics?.roi ?? 0,
        efficiency: performance.metrics?.efficiency ?? 0,
        strategicValue: performance.metrics?.strategicValue ?? 0,
      },
    }

    records.push(newRecord)
    await this.saveRecords(records)
    return newRecord
  }

  async updateBidPerformance(
    id: string,
    updates: Partial<BidPerformance>,
  ): Promise<BidPerformance> {
    const records = await this.loadRecords()
    const index = records.findIndex((record) => record.id === id)

    if (index === -1) {
      throw new Error('Bid performance not found')
    }

    const timestamp = this.getTimestamp()
    const current = records[index]

    const updated: BidPerformance = {
      ...current,
      ...updates,
      metrics: {
        roi: updates.metrics?.roi ?? current.metrics.roi,
        efficiency: updates.metrics?.efficiency ?? current.metrics.efficiency,
        strategicValue: updates.metrics?.strategicValue ?? current.metrics.strategicValue,
      },
      client: updates.client ? { ...current.client, ...updates.client } : current.client,
      updatedAt: timestamp,
    }

    records[index] = updated
    await this.saveRecords(records)
    return updated
  }

  async deleteBidPerformance(id: string): Promise<boolean> {
    const records = await this.loadRecords()
    const filtered = records.filter((record) => record.id !== id)

    if (filtered.length === records.length) {
      return false
    }

    await this.saveRecords(filtered)
    return true
  }

  async getPerformanceSummary(filter?: AnalyticsFilter): Promise<PerformanceSummary> {
    const records = await this.getAllBidPerformances({ filters: filter })

    if (!records.length) {
      const today = this.formatDateKey(new Date())
      return {
        period: {
          start: filter?.dateRange?.start ?? today,
          end: filter?.dateRange?.end ?? today,
        },
        overall: {
          totalBids: 0,
          wonBids: 0,
          winRate: 0,
          totalValue: 0,
          averageMargin: 0,
          roi: 0,
        },
        trends: {
          winRateTrend: 0,
          marginTrend: 0,
          volumeTrend: 0,
          efficiencyTrend: 0,
        },
        byCategory: [],
        byRegion: [],
        topSegments: [],
      }
    }

    const period = this.resolvePeriod(records, filter)
    const totalBids = records.length
    const wonBids = records.filter((record) => record.outcome === 'won').length
    const totalValue = records.reduce((sum, record) => sum + (record.bidAmount || 0), 0)
    const averageMargin = this.calculateAverageMargin(records)
    const roi = this.calculateAverage(records, (record) => record.metrics?.roi ?? 0)

    const winRateTrendPoints = this.buildMonthlySeries(records, (items) =>
      this.calculateWinRate(items),
    )
    const marginTrendPoints = this.buildMonthlySeries(records, (items) =>
      this.calculateAverageMargin(items),
    )
    const volumeTrendPoints = this.buildMonthlySeries(records, (items) => items.length)
    const efficiencyTrendPoints = this.buildMonthlySeries(records, (items) =>
      this.calculateAverage(items, (item) => item.metrics?.efficiency ?? 0),
    )

    const byCategory = this.buildCategoryBreakdown(records)
    const byRegion = this.buildRegionBreakdown(records)
    const topSegments = this.buildTopSegments(byCategory, averageMargin)

    return {
      period,
      overall: {
        totalBids,
        wonBids,
        winRate: totalBids ? (wonBids / totalBids) * 100 : 0,
        totalValue,
        averageMargin,
        roi,
      },
      trends: {
        winRateTrend: this.calculateTrend(winRateTrendPoints),
        marginTrend: this.calculateTrend(marginTrendPoints),
        volumeTrend: this.calculateTrend(volumeTrendPoints),
        efficiencyTrend: this.calculateTrend(efficiencyTrendPoints),
      },
      byCategory,
      byRegion,
      topSegments,
    }
  }

  async getWinRateTrend(filter?: AnalyticsFilter): Promise<TimeSeriesPoint[]> {
    const records = await this.getAllBidPerformances({ filters: filter })
    return this.buildMonthlySeries(records, (items) => this.calculateWinRate(items))
  }

  async getMarginTrend(filter?: AnalyticsFilter): Promise<TimeSeriesPoint[]> {
    const records = await this.getAllBidPerformances({ filters: filter })
    return this.buildMonthlySeries(records, (items) => this.calculateAverageMargin(items))
  }

  private async loadRecords(): Promise<BidPerformance[]> {
    const stored = safeLocalStorage.getItem<string | null>(this.storageKey, null)

    if (!stored) {
      return []
    }

    if (typeof stored === 'string') {
      try {
        const parsed = JSON.parse(stored) as BidPerformance[]
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        console.error('Failed to parse stored bid performances:', error)
        return []
      }
    }

    if (Array.isArray(stored)) {
      return stored as BidPerformance[]
    }

    return []
  }

  private async saveRecords(records: BidPerformance[]): Promise<void> {
    safeLocalStorage.setItem(this.storageKey, JSON.stringify(records))
  }

  private applyFilters(records: BidPerformance[], filters?: AnalyticsFilter): BidPerformance[] {
    if (!filters) {
      return [...records]
    }

    return records.filter((record) => {
      const submissionDate = this.parseDate(record.submissionDate)

      if (filters.dateRange) {
        const start = filters.dateRange.start ? this.parseDate(filters.dateRange.start) : null
        const end = filters.dateRange.end ? this.parseDate(filters.dateRange.end) : null

        if (start && submissionDate && submissionDate < start) {
          return false
        }

        if (end && submissionDate && submissionDate > end) {
          return false
        }
      }

      if (filters.categories?.length && !filters.categories.includes(record.category)) {
        return false
      }

      if (filters.regions?.length && !filters.regions.includes(record.region)) {
        return false
      }

      if (filters.clients?.length) {
        const matchesClient =
          filters.clients.includes(record.client?.id ?? '') ||
          filters.clients.includes(record.client?.name ?? '')
        if (!matchesClient) {
          return false
        }
      }

      if (filters.outcomes?.length && !filters.outcomes.includes(record.outcome)) {
        return false
      }

      if (filters.valueRange) {
        const amount = record.bidAmount ?? 0
        if (filters.valueRange.min !== undefined && amount < filters.valueRange.min) {
          return false
        }
        if (filters.valueRange.max !== undefined && amount > filters.valueRange.max) {
          return false
        }
      }

      return true
    })
  }

  private buildMonthlySeries(
    records: BidPerformance[],
    valueSelector: (items: BidPerformance[]) => number,
  ): TimeSeriesPoint[] {
    if (!records.length) {
      return []
    }

    const groups = this.groupByMonth(records)
    const months = Array.from(groups.keys()).sort()

    return months.map((monthKey) => {
      const date = this.monthKeyToDate(monthKey)
      const items = groups.get(monthKey) ?? []
      const value = valueSelector(items)

      return {
        date: this.monthKeyToISO(monthKey),
        value: Number.isFinite(value) ? Number(value.toFixed(2)) : 0,
        label: this.formatMonthLabel(date),
      }
    })
  }

  private buildCategoryBreakdown(records: BidPerformance[]) {
    const categoryMap = new Map<
      string,
      { bids: number; wins: number; totalValue: number; marginSum: number }
    >()

    records.forEach((record) => {
      const entry = categoryMap.get(record.category) ?? {
        bids: 0,
        wins: 0,
        totalValue: 0,
        marginSum: 0,
      }

      entry.bids += 1
      entry.totalValue += record.bidAmount ?? 0
      entry.marginSum += this.extractMargin(record)
      if (record.outcome === 'won') {
        entry.wins += 1
      }

      categoryMap.set(record.category, entry)
    })

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      bids: stats.bids,
      wins: stats.wins,
      winRate: stats.bids ? (stats.wins / stats.bids) * 100 : 0,
      averageValue: stats.bids ? stats.totalValue / stats.bids : 0,
      margin: stats.bids ? stats.marginSum / stats.bids : 0,
    }))
  }

  private buildRegionBreakdown(records: BidPerformance[]) {
    const regionMap = new Map<string, { bids: number; wins: number; marketShare: number }>()

    records.forEach((record) => {
      const entry = regionMap.get(record.region) ?? {
        bids: 0,
        wins: 0,
        marketShare: 0,
      }

      entry.bids += 1
      entry.marketShare += record.estimatedValue ?? record.bidAmount ?? 0
      if (record.outcome === 'won') {
        entry.wins += 1
      }

      regionMap.set(record.region, entry)
    })

    const totalMarketShare = Array.from(regionMap.values()).reduce(
      (sum, entry) => sum + entry.marketShare,
      0,
    )

    return Array.from(regionMap.entries()).map(([region, stats]) => ({
      region,
      bids: stats.bids,
      wins: stats.wins,
      winRate: stats.bids ? (stats.wins / stats.bids) * 100 : 0,
      marketShare: totalMarketShare ? (stats.marketShare / totalMarketShare) * 100 : 0,
    }))
  }

  private buildTopSegments(
    categories: {
      category: string
      bids: number
      wins: number
      winRate: number
      averageValue: number
      margin: number
    }[],
    overallMargin: number,
  ) {
    return categories
      .filter((category) => category.bids > 0)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5)
      .map((category) => ({
        segment: category.category,
        performance: Number(category.winRate.toFixed(2)),
        growth: Number((category.margin - overallMargin).toFixed(2)),
      }))
  }

  private groupByMonth(records: BidPerformance[]): Map<string, BidPerformance[]> {
    const groups = new Map<string, BidPerformance[]>()

    records.forEach((record) => {
      const date = this.parseDate(record.submissionDate)
      if (!date) {
        return
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const bucket = groups.get(key) ?? []
      bucket.push(record)
      groups.set(key, bucket)
    })

    return groups
  }

  private calculateAverageMargin(records: BidPerformance[]): number {
    if (!records.length) {
      return 0
    }

    const total = records.reduce((sum, record) => sum + this.extractMargin(record), 0)
    return total / records.length
  }

  private calculateWinRate(records: BidPerformance[]): number {
    if (!records.length) {
      return 0
    }

    const wins = records.filter((record) => record.outcome === 'won').length
    return (wins / records.length) * 100
  }

  private calculateAverage(
    records: BidPerformance[],
    selector: (record: BidPerformance) => number,
  ): number {
    if (!records.length) {
      return 0
    }

    const total = records.reduce((sum, record) => sum + selector(record), 0)
    return total / records.length
  }

  private calculateTrend(points: TimeSeriesPoint[]): number {
    if (points.length < 2) {
      return 0
    }

    const first = points[0].value
    const last = points[points.length - 1].value

    if (first === 0) {
      return Number(last.toFixed(2))
    }

    return Number((((last - first) / Math.abs(first)) * 100).toFixed(2))
  }

  private extractMargin(record: BidPerformance): number {
    if (typeof record.actualMargin === 'number') {
      return record.actualMargin
    }
    if (typeof record.plannedMargin === 'number') {
      return record.plannedMargin
    }
    return 0
  }

  private resolvePeriod(records: BidPerformance[], filter?: AnalyticsFilter) {
    if (filter?.dateRange?.start || filter?.dateRange?.end) {
      return {
        start: filter.dateRange.start ?? this.formatDateKey(new Date()),
        end: filter.dateRange.end ?? this.formatDateKey(new Date()),
      }
    }

    const dates = records
      .map((record) => this.parseDate(record.submissionDate))
      .filter((date): date is Date => Boolean(date))

    if (!dates.length) {
      const today = this.formatDateKey(new Date())
      return { start: today, end: today }
    }

    const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
    return {
      start: this.formatDateKey(sorted[0]),
      end: this.formatDateKey(sorted[sorted.length - 1]),
    }
  }

  private monthKeyToISO(monthKey: string): string {
    return `${monthKey}-01`
  }

  private monthKeyToDate(monthKey: string): Date {
    const [year, month] = monthKey.split('-').map(Number)
    return new Date(year, (month || 1) - 1, 1)
  }

  private parseDate(value: string | undefined | null): Date | null {
    if (!value) {
      return null
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private formatMonthLabel(date: Date): string {
    try {
      return new Intl.DateTimeFormat('ar-EG', {
        month: 'short',
        year: 'numeric',
      }).format(date)
    } catch {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private generateId(): string {
    return `bid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }
}

export const analyticsService = new AnalyticsServiceImpl()

export type AnalyticsService = AnalyticsServiceImpl
