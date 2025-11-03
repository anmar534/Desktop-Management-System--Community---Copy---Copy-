/**
 * Tender Analytics Service
 *
 * @module application/services/data/TenderAnalyticsService
 * @description Specialized service for tender analytics and statistics
 *
 * Architecture Pattern: SERVICE + SINGLETON
 * Responsibilities:
 * - Calculate tender statistics
 * - Compute win rates and performance metrics
 * - Provide financial summaries
 * - Generate analytics insights
 *
 * Dependencies:
 * - tenderSelectors: Domain logic for calculations
 * - TenderDataService: Source of tender data
 *
 * Purpose:
 * - Separate analytics logic from data management
 * - Provide consistent, reusable calculations
 * - Use domain selectors for business logic
 */

import type { Tender } from '@/data/centralData'
import {
  selectWonTendersCount,
  selectLostTendersCount,
  selectActiveTendersCount,
  selectWinRate,
  selectWonTendersValue,
  selectLostTendersValue,
  selectSubmittedTendersValue,
  type TenderCalculations,
} from '@/domain/selectors/tenderSelectors'

/**
 * إحصائيات المنافسات حسب الحالة
 */
export interface TenderStatsByStatus {
  new: number
  underAction: number
  readyToSubmit: number
  submitted: number
  won: number
  lost: number
  expired: number
  cancelled: number
}

/**
 * إحصائيات شاملة للمنافسات
 */
export interface ComprehensiveTenderStats {
  total: number
  won: number
  lost: number
  active: number
  winRate: number
  byStatus: TenderStatsByStatus
}

/**
 * ملخص مالي للمنافسات
 */
export interface FinancialSummary {
  totalValue: number
  wonValue: number
  lostValue: number
  submittedValue: number
  potentialValue: number // submitted + active
  averageWinValue: number
  averageLostValue: number
}

/**
 * مقاييس الأداء
 */
export interface PerformanceMetrics {
  winRate: number
  lossRate: number
  activeRate: number
  conversionRate: number // (won + lost) / total
  submissionRate: number // submitted / total
}

/**
 * Tender Analytics Service
 * Single Responsibility: Analytics and Statistics
 */
export class TenderAnalyticsService {
  private static instance: TenderAnalyticsService

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): TenderAnalyticsService {
    if (!TenderAnalyticsService.instance) {
      TenderAnalyticsService.instance = new TenderAnalyticsService()
    }
    return TenderAnalyticsService.instance
  }

  /**
   * الحصول على إحصائيات شاملة للمنافسات
   * Comprehensive tender statistics
   */
  public getComprehensiveStats(tenders: Tender[]): ComprehensiveTenderStats {
    return {
      total: tenders.length,
      won: selectWonTendersCount(tenders),
      lost: selectLostTendersCount(tenders),
      active: selectActiveTendersCount(tenders),
      winRate: selectWinRate(tenders),
      byStatus: this.getStatsByStatus(tenders),
    }
  }

  /**
   * الحصول على إحصائيات حسب الحالة
   * Statistics grouped by status
   */
  public getStatsByStatus(tenders: Tender[]): TenderStatsByStatus {
    return {
      new: tenders.filter((t) => t.status === 'new').length,
      underAction: tenders.filter((t) => t.status === 'under_action').length,
      readyToSubmit: tenders.filter((t) => t.status === 'ready_to_submit').length,
      submitted: tenders.filter((t) => t.status === 'submitted').length,
      won: tenders.filter((t) => t.status === 'won').length,
      lost: tenders.filter((t) => t.status === 'lost').length,
      expired: tenders.filter((t) => t.status === 'expired').length,
      cancelled: tenders.filter((t) => t.status === 'cancelled').length,
    }
  }

  /**
   * الحصول على معدل الفوز
   * Get win rate percentage
   */
  public getWinRate(tenders: Tender[]): number {
    return selectWinRate(tenders)
  }

  /**
   * الحصول على ملخص مالي
   * Get financial summary
   */
  public getFinancialSummary(tenders: Tender[]): FinancialSummary {
    const wonValue = selectWonTendersValue(tenders)
    const lostValue = selectLostTendersValue(tenders)
    const submittedValue = selectSubmittedTendersValue(tenders)
    const totalValue = tenders.reduce((sum, t) => sum + (t.value || 0), 0)

    const wonCount = selectWonTendersCount(tenders)
    const lostCount = selectLostTendersCount(tenders)

    // Calculate active value (tenders that are not won/lost/expired/cancelled)
    const activeValue = tenders
      .filter(
        (t) =>
          t.status === 'new' ||
          t.status === 'under_action' ||
          t.status === 'ready_to_submit' ||
          t.status === 'submitted',
      )
      .reduce((sum, t) => sum + (t.value || 0), 0)

    return {
      totalValue,
      wonValue,
      lostValue,
      submittedValue,
      potentialValue: submittedValue + activeValue,
      averageWinValue: wonCount > 0 ? wonValue / wonCount : 0,
      averageLostValue: lostCount > 0 ? lostValue / lostCount : 0,
    }
  }

  /**
   * الحصول على مقاييس الأداء
   * Get performance metrics
   */
  public getPerformanceMetrics(tenders: Tender[]): PerformanceMetrics {
    const total = tenders.length
    const won = selectWonTendersCount(tenders)
    const lost = selectLostTendersCount(tenders)
    const active = selectActiveTendersCount(tenders)
    const submitted = tenders.filter((t) => t.status === 'submitted').length

    const decided = won + lost // Tenders with final decision

    return {
      winRate: selectWinRate(tenders),
      lossRate: decided > 0 ? (lost / decided) * 100 : 0,
      activeRate: total > 0 ? (active / total) * 100 : 0,
      conversionRate: total > 0 ? (decided / total) * 100 : 0,
      submissionRate: total > 0 ? (submitted / total) * 100 : 0,
    }
  }

  /**
   * الحصول على حسابات المنافسات (Domain Calculations)
   * Get tender calculations using domain selectors
   */
  public getTenderCalculations(tenders: Tender[]): TenderCalculations {
    const won = selectWonTendersCount(tenders)
    const lost = selectLostTendersCount(tenders)
    const active = selectActiveTendersCount(tenders)

    return {
      // العدادات الأساسية
      total: tenders.length,
      won,
      lost,
      active,

      // الحالات المحددة
      new: tenders.filter((t) => t.status === 'new').length,
      underAction: tenders.filter((t) => t.status === 'under_action').length,
      submitted: tenders.filter((t) => t.status === 'submitted').length,

      // الحسابات المالية
      wonValue: selectWonTendersValue(tenders),
      lostValue: selectLostTendersValue(tenders),
      submittedValue: selectSubmittedTendersValue(tenders),

      // النسب المئوية
      winRate: selectWinRate(tenders),
      averageWinChance:
        tenders.reduce((sum, t) => sum + (t.winChance || 0), 0) / (tenders.length || 1),
    }
  }

  /**
   * الحصول على اتجاهات النمو
   * Get growth trends (requires time-series data)
   */
  public getGrowthTrends(
    tenders: Tender[],
    periodDays = 30,
  ): {
    newTenders: number
    wonTenders: number
    lostTenders: number
    growthRate: number
  } {
    const now = Date.now()
    const periodStart = now - periodDays * 24 * 60 * 60 * 1000

    const recentTenders = tenders.filter((t) => {
      const createdAt = new Date(t.submissionDate || now).getTime()
      return createdAt >= periodStart
    })

    const previousPeriodStart = periodStart - periodDays * 24 * 60 * 60 * 1000
    const previousTenders = tenders.filter((t) => {
      const createdAt = new Date(t.submissionDate || now).getTime()
      return createdAt >= previousPeriodStart && createdAt < periodStart
    })

    const growthRate =
      previousTenders.length > 0
        ? ((recentTenders.length - previousTenders.length) / previousTenders.length) * 100
        : recentTenders.length > 0
          ? 100
          : 0

    return {
      newTenders: recentTenders.length,
      wonTenders: recentTenders.filter((t) => t.status === 'won').length,
      lostTenders: recentTenders.filter((t) => t.status === 'lost').length,
      growthRate,
    }
  }

  /**
   * تصفية المنافسات حسب نطاق زمني
   * Filter tenders by date range
   */
  public filterByDateRange(tenders: Tender[], startDate: Date, endDate: Date): Tender[] {
    const start = startDate.getTime()
    const end = endDate.getTime()

    return tenders.filter((t) => {
      const date = new Date(t.submissionDate || 0).getTime()
      return date >= start && date <= end
    })
  }

  /**
   * الحصول على أفضل المنافسات (حسب القيمة)
   * Get top tenders by value
   */
  public getTopTendersByValue(tenders: Tender[], limit = 10): Tender[] {
    return [...tenders].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, limit)
  }

  /**
   * الحصول على المنافسات الأكثر احتمالية للفوز
   * Get tenders most likely to win
   */
  public getTopTendersByWinChance(tenders: Tender[], limit = 10): Tender[] {
    return [...tenders]
      .filter((t) => t.status === 'submitted' || t.status === 'under_action')
      .sort((a, b) => (b.winChance || 0) - (a.winChance || 0))
      .slice(0, limit)
  }
}

// Export singleton instance
export const tenderAnalyticsService = TenderAnalyticsService.getInstance()
