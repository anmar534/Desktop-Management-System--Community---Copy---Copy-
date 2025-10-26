/**
 * 🧮 خدمة الحسابات الموحدة - Unified Calculations Service
 * DRY Principle Implementation - إزالة التكرار في الحسابات
 *
 * تجمع هذه الخدمة جميع الحسابات في مكان واحد:
 * ✅ حسابات نسبة الفوز
 * ✅ حسابات الربح والخسارة
 * ✅ حسابات التقدم في المشاريع
 * ✅ حسابات الميزانيات والتكاليف
 * ✅ مؤشرات الأداء الرئيسية (KPIs)
 */

import type { Tender, Project } from '@/data/centralData'
import { getProjectRepository, getTenderRepository } from '@/application/services/serviceRegistry'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { APP_EVENTS } from '@/events/bus'
import {
  formatDateValue,
  formatPercentage as formatPercentageLocalized,
} from '@/shared/utils/formatters/formatters'

// Types for calculation results
export interface TenderAnalytics {
  totalTenders: number
  submittedTenders: number
  wonTenders: number
  lostTenders: number
  pendingTenders: number
  winRate: number
  totalValue: number
  wonValue: number
  averageTenderValue: number
}

export interface ProjectAnalytics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  delayedProjects: number
  totalContractValue: number
  totalActualCost: number
  totalProfit: number
  averageProgress: number
  onTimeCompletionRate: number
}

export interface FinancialMetrics {
  totalRevenue: number
  totalCosts: number
  grossProfit: number
  grossProfitMargin: number
  netProfit: number
  netProfitMargin: number
  returnOnInvestment: number
}

export interface KPIMetrics {
  winRate: number
  averageProjectValue: number
  projectCompletionRate: number
  costOverrunRate: number
  timeOverrunRate: number
  clientSatisfactionScore: number
  revenueGrowthRate: number
}

/**
 * خدمة الحسابات الموحدة
 * Single source for all business calculations
 */
export class UnifiedCalculationsService {
  private static instance: UnifiedCalculationsService
  private cachedTenders: Tender[] = []
  private cachedProjects: Project[] = []
  private hasLoadedFromRepositories = false
  private loadingPromise: Promise<void> | null = null

  private constructor() {
    this.initializeCache()
  }

  private isTestEnvironment(): boolean {
    const hasVitestGlobal =
      typeof (globalThis as unknown as { vitest?: unknown })?.vitest !== 'undefined'
    if (hasVitestGlobal) {
      return true
    }
    if (typeof process === 'undefined' || !process?.env) {
      return false
    }
    return (
      process.env.NODE_ENV === 'test' ||
      process.env.VITEST === 'true' ||
      typeof process.env.VITEST_WORKER_ID !== 'undefined'
    )
  }

  public static getInstance(): UnifiedCalculationsService {
    if (!UnifiedCalculationsService.instance) {
      UnifiedCalculationsService.instance = new UnifiedCalculationsService()
    }
    return UnifiedCalculationsService.instance
  }

  private initializeCache() {
    this.cachedTenders = this.readTenderFallback()
    this.cachedProjects = this.readProjectFallback()
    if (typeof window !== 'undefined' && !this.isTestEnvironment()) {
      const refreshHandler: EventListener = () => {
        this.ensureCacheWarm()
      }
      try {
        window.addEventListener(APP_EVENTS.TENDERS_UPDATED, refreshHandler)
        window.addEventListener(APP_EVENTS.TENDER_UPDATED, refreshHandler)
        window.addEventListener(APP_EVENTS.PROJECTS_UPDATED, refreshHandler)
      } catch (error) {
        console.debug('تعذر تسجيل مستمعي تحديث الحسابات الموحدة', error)
      }
    }
    if (!this.isTestEnvironment()) {
      this.ensureCacheWarm()
    }
  }

  private readTenderFallback(): Tender[] {
    const stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
    return Array.isArray(stored) ? stored : []
  }

  private readProjectFallback(): Project[] {
    const stored = safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, [])
    return Array.isArray(stored) ? stored : []
  }

  private ensureCacheWarm() {
    if (this.loadingPromise || this.hasLoadedFromRepositories) {
      return
    }
    this.loadingPromise = this.refreshCaches()
      .catch((error) => {
        console.error('تعذر تحديث المخزون الخاص بالحسابات الموحدة', error)
      })
      .finally(() => {
        this.loadingPromise = null
      })
  }

  public async warmCachesForTesting(): Promise<void> {
    if (!this.isTestEnvironment()) {
      return
    }
    await this.refreshCaches()
  }

  private async refreshCaches(): Promise<void> {
    try {
      const [tenders, projects] = await Promise.all([
        getTenderRepository().getAll(),
        getProjectRepository().getAll(),
      ])
      if (Array.isArray(tenders)) {
        this.cachedTenders = tenders
      }
      if (Array.isArray(projects)) {
        this.cachedProjects = projects
      }
      this.hasLoadedFromRepositories = true
    } catch (error) {
      console.error('تعذر تحميل البيانات من المستودعات في unifiedCalculationsService', error)
      if (!this.hasLoadedFromRepositories) {
        this.cachedTenders = this.readTenderFallback()
        this.cachedProjects = this.readProjectFallback()
      }
    }
  }

  private resolveTenders(tenders?: Tender[]): Tender[] {
    if (Array.isArray(tenders)) {
      return tenders
    }
    if (!this.isTestEnvironment()) {
      this.ensureCacheWarm()
    }
    if (this.cachedTenders.length > 0) {
      return this.cachedTenders
    }
    return this.readTenderFallback()
  }

  private resolveProjects(projects?: Project[]): Project[] {
    if (Array.isArray(projects)) {
      return projects
    }
    if (!this.isTestEnvironment()) {
      this.ensureCacheWarm()
    }
    if (this.cachedProjects.length > 0) {
      return this.cachedProjects
    }
    return this.readProjectFallback()
  }

  // ===========================
  // 🏆 Tender Calculations
  // ===========================

  /**
   * حساب نسبة الفوز الصحيحة
   * Win Rate = (Won Tenders / Submitted Tenders) × 100
   */
  public calculateWinRate(tenders?: Tender[]): number {
    const dataset = this.resolveTenders(tenders)

    const submittedTenders = dataset.filter((t: Tender) =>
      ['submitted', 'won', 'lost'].includes(t.status),
    )

    const wonTenders = dataset.filter((t: Tender) => t.status === 'won')

    if (submittedTenders.length === 0) return 0

    return Math.round((wonTenders.length / submittedTenders.length) * 100)
  }

  /**
   * تحليل شامل للمنافسات
   */
  public analyzeTenders(tenders?: Tender[]): TenderAnalytics {
    const dataset = this.resolveTenders(tenders)

    const total = dataset.length
    const submitted = dataset.filter((t: Tender) => ['submitted', 'won', 'lost'].includes(t.status))
    const won = dataset.filter((t: Tender) => t.status === 'won')
    const lost = dataset.filter((t: Tender) => t.status === 'lost')
    const pending = dataset.filter((t: Tender) => t.status === 'submitted')

    const totalValue = dataset.reduce((sum: number, t: Tender) => sum + (t.value || 0), 0)
    const wonValue = won.reduce((sum: number, t: Tender) => sum + (t.value || 0), 0)

    return {
      totalTenders: total,
      submittedTenders: submitted.length,
      wonTenders: won.length,
      lostTenders: lost.length,
      pendingTenders: pending.length,
      winRate: this.calculateWinRate(dataset),
      totalValue,
      wonValue,
      averageTenderValue: total > 0 ? totalValue / total : 0,
    }
  }

  /**
   * حساب اتجاه نسبة الفوز (تحسن أم تراجع)
   */
  public calculateWinRateTrend(periodMonths = 6): {
    current: number
    previous: number
    trend: 'up' | 'down' | 'stable'
  } {
    const tenders = this.resolveTenders()
    const now = new Date()
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - periodMonths, now.getDate())

    const recentTenders = tenders.filter((t: Tender) => {
      const tenderDate = new Date(t.submissionDate || t.lastUpdate)
      return tenderDate >= cutoffDate
    })

    const olderTenders = tenders.filter((t: Tender) => {
      const tenderDate = new Date(t.submissionDate || t.lastUpdate)
      return tenderDate < cutoffDate
    })

    const currentWinRate = this.calculateWinRate(recentTenders)
    const previousWinRate = this.calculateWinRate(olderTenders)

    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (currentWinRate > previousWinRate + 2) trend = 'up'
    else if (currentWinRate < previousWinRate - 2) trend = 'down'

    return {
      current: currentWinRate,
      previous: previousWinRate,
      trend,
    }
  }

  // ===========================
  // 🏗️ Project Calculations
  // ===========================

  /**
   * تحليل شامل للمشاريع
   */
  public analyzeProjects(projects?: Project[]): ProjectAnalytics {
    const dataset = this.resolveProjects(projects)

    const total = dataset.length
    const active = dataset.filter((p: Project) => p.status === 'active')
    const completed = dataset.filter((p: Project) => p.status === 'completed')
    const delayed = dataset.filter((p: Project) => p.status === 'delayed')

    const totalContractValue = dataset.reduce(
      (sum: number, p: Project) => sum + (p.contractValue || 0),
      0,
    )
    const totalActualCost = dataset.reduce(
      (sum: number, p: Project) => sum + (p.actualCost || 0),
      0,
    )
    const totalProfit = totalContractValue - totalActualCost

    const averageProgress =
      total > 0
        ? dataset.reduce((sum: number, p: Project) => sum + (p.progress || 0), 0) / total
        : 0

    // حساب معدل الإنجاز في الوقت المحدد
    const completedOnTime = completed.filter((p) => {
      if (!p.endDate) return false
      // افتراض أن المشاريع المكتملة انتهت في الوقت المحدد إذا لم يكن هناك حقل actualEndDate
      return true // في التطبيق الحقيقي، نحتاج حقل actualEndDate
    })

    const onTimeCompletionRate =
      completed.length > 0 ? (completedOnTime.length / completed.length) * 100 : 0

    return {
      totalProjects: total,
      activeProjects: active.length,
      completedProjects: completed.length,
      delayedProjects: delayed.length,
      totalContractValue,
      totalActualCost,
      totalProfit,
      averageProgress,
      onTimeCompletionRate,
    }
  }

  /**
   * حساب كفاءة تنفيذ المشروع
   */
  public calculateProjectEfficiency(project: Project): {
    costEfficiency: number
    timeEfficiency: number
    overallEfficiency: number
  } {
    // كفاءة التكلفة = (التكلفة المخططة / التكلفة الفعلية) × 100
    const costEfficiency =
      project.actualCost && project.actualCost > 0
        ? Math.min(((project.estimatedCost || 0) / project.actualCost) * 100, 100)
        : 100

    // كفاءة الوقت - حساب بناءً على التقدم والزمن المتبقي
    let timeEfficiency = 100
    if (project.startDate && project.endDate) {
      const startDate = new Date(project.startDate)
      const endDate = new Date(project.endDate)
      const now = new Date()

      const totalDuration = endDate.getTime() - startDate.getTime()
      const elapsedTime = now.getTime() - startDate.getTime()
      const expectedProgress = Math.min((elapsedTime / totalDuration) * 100, 100)

      if (expectedProgress > 0) {
        timeEfficiency = Math.min(((project.progress || 0) / expectedProgress) * 100, 100)
      }
    }

    const overallEfficiency = (costEfficiency + timeEfficiency) / 2

    return {
      costEfficiency: Math.round(costEfficiency),
      timeEfficiency: Math.round(timeEfficiency),
      overallEfficiency: Math.round(overallEfficiency),
    }
  }

  // ===========================
  // 💰 Financial Calculations
  // ===========================

  /**
   * حساب المؤشرات المالية الشاملة
   */
  public calculateFinancialMetrics(): FinancialMetrics {
    const projects = this.resolveProjects()

    // الإيرادات من المشاريع المكتملة والنشطة
    const totalRevenue = projects
      .filter((p: Project) => ['completed', 'active'].includes(p.status))
      .reduce((sum: number, p: Project) => sum + (p.contractValue || 0), 0)

    // التكاليف الفعلية
    const totalCosts = projects.reduce((sum: number, p: Project) => sum + (p.actualCost || 0), 0)

    // الربح الإجمالي
    const grossProfit = totalRevenue - totalCosts
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // الربح الصافي (بعد خصم التكاليف الإدارية - تقدير 10%)
    const administrativeCosts = totalRevenue * 0.1
    const netProfit = grossProfit - administrativeCosts
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // العائد على الاستثمار
    const totalInvestment = projects.reduce(
      (sum: number, p: Project) => sum + (p.estimatedCost || 0),
      0,
    )
    const returnOnInvestment = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0

    return {
      totalRevenue,
      totalCosts,
      grossProfit,
      grossProfitMargin,
      netProfit,
      netProfitMargin,
      returnOnInvestment,
    }
  }

  /**
   * حساب التدفق النقدي المتوقع
   */
  public calculateCashFlow(
    months = 12,
  ): { month: string; inflow: number; outflow: number; net: number }[] {
    const projects = this.resolveProjects().filter((p: Project) => p.status === 'active')
    const results = []

    for (let i = 0; i < months; i++) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() + i)

      const monthName = formatDateValue(targetDate, {
        locale: 'ar-SA',
        year: 'numeric',
        month: 'long',
      })

      // تدفق داخل مقدر (من المشاريع النشطة)
      const monthlyInflow = projects.reduce((sum: number, p: Project) => {
        const monthlyRevenue = (p.contractValue || 0) / 12 // توزيع سنوي
        return sum + monthlyRevenue
      }, 0)

      // تدفق خارج مقدر (التكاليف التشغيلية)
      const monthlyOutflow = projects.reduce((sum: number, p: Project) => {
        const monthlyCost = (p.estimatedCost || 0) / 12
        return sum + monthlyCost
      }, 0)

      results.push({
        month: monthName,
        inflow: Math.round(monthlyInflow),
        outflow: Math.round(monthlyOutflow),
        net: Math.round(monthlyInflow - monthlyOutflow),
      })
    }

    return results
  }

  // ===========================
  // 📊 KPI Calculations
  // ===========================

  /**
   * حساب مؤشرات الأداء الرئيسية
   */
  public calculateKPIs(): KPIMetrics {
    const tenderAnalytics = this.analyzeTenders()
    const projectAnalytics = this.analyzeProjects()

    // معدل تجاوز التكلفة
    const projects = this.resolveProjects()
    const projectsWithCostOverrun = projects.filter(
      (p: Project) => p.actualCost && p.estimatedCost && p.actualCost > p.estimatedCost,
    )
    const costOverrunRate =
      projects.length > 0 ? (projectsWithCostOverrun.length / projects.length) * 100 : 0

    // معدل تجاوز الوقت (مبسط - يمكن تحسينه لاحقاً)
    const completedProjects = projects.filter((p: Project) => p.status === 'completed')
    const delayedProjects = projects.filter((p: Project) => p.status === 'delayed')
    const timeOverrunRate =
      completedProjects.length + delayedProjects.length > 0
        ? (delayedProjects.length / (completedProjects.length + delayedProjects.length)) * 100
        : 0

    // نقاط رضا العملاء (مقدرة بناءً على نسبة المشاريع المكتملة في الوقت والميزانية)
    const satisfactoryProjects = completedProjects.filter((p) => {
      const onBudget = !p.actualCost || !p.estimatedCost || p.actualCost <= p.estimatedCost * 1.1 // سماح 10%
      // في غياب actualEndDate، نفترض أن المشاريع المكتملة كانت في الوقت المحدد
      return onBudget
    })
    const clientSatisfactionScore =
      completedProjects.length > 0
        ? (satisfactoryProjects.length / completedProjects.length) * 100
        : 100

    // معدل نمو الإيرادات (مقارنة بالسنة الماضية - مقدر)
    const revenueGrowthRate = 15 // قيمة مقدرة - يمكن حسابها لاحقاً من البيانات التاريخية

    return {
      winRate: tenderAnalytics.winRate,
      averageProjectValue:
        projectAnalytics.totalContractValue / Math.max(projectAnalytics.totalProjects, 1),
      projectCompletionRate: projectAnalytics.onTimeCompletionRate,
      costOverrunRate,
      timeOverrunRate,
      clientSatisfactionScore,
      revenueGrowthRate,
    }
  }

  // ===========================
  // 🎯 Goal Tracking
  // ===========================

  /**
   * حساب التقدم نحو الأهداف
   */
  public calculateGoalProgress(targets: {
    monthlyTenders?: number
    yearlyRevenue?: number
    winRateTarget?: number
    profitMarginTarget?: number
  }) {
    const tenderAnalytics = this.analyzeTenders()
    const financialMetrics = this.calculateFinancialMetrics()
    const currentDate = new Date()
    const monthsElapsed = currentDate.getMonth() + 1

    // تقدم المنافسات الشهرية
    const monthlyTenderProgress = targets.monthlyTenders
      ? Math.min((tenderAnalytics.totalTenders / monthsElapsed / targets.monthlyTenders) * 100, 100)
      : 0

    // تقدم الإيرادات السنوية
    const yearlyRevenueProgress = targets.yearlyRevenue
      ? Math.min((financialMetrics.totalRevenue / targets.yearlyRevenue) * 100, 100)
      : 0

    // تحقيق هدف نسبة الفوز
    const winRateAchievement = targets.winRateTarget
      ? Math.min((tenderAnalytics.winRate / targets.winRateTarget) * 100, 100)
      : 0

    // تحقيق هدف هامش الربح
    const profitMarginAchievement = targets.profitMarginTarget
      ? Math.min((financialMetrics.netProfitMargin / targets.profitMarginTarget) * 100, 100)
      : 0

    return {
      monthlyTenders: {
        current: Math.round(tenderAnalytics.totalTenders / monthsElapsed),
        target: targets.monthlyTenders ?? 0,
        progress: Math.round(monthlyTenderProgress),
      },
      yearlyRevenue: {
        current: financialMetrics.totalRevenue,
        target: targets.yearlyRevenue ?? 0,
        progress: Math.round(yearlyRevenueProgress),
      },
      winRate: {
        current: tenderAnalytics.winRate,
        target: targets.winRateTarget ?? 0,
        progress: Math.round(winRateAchievement),
      },
      profitMargin: {
        current: Math.round(financialMetrics.netProfitMargin),
        target: targets.profitMarginTarget ?? 0,
        progress: Math.round(profitMarginAchievement),
      },
    }
  }

  // ===========================
  // 🔍 Comparison & Benchmarking
  // ===========================

  /**
   * مقارنة الأداء بين فترات زمنية
   */
  public comparePerformance(_periodMonths = 6): {
    current: KPIMetrics
    previous: KPIMetrics
    improvements: string[]
    concerns: string[]
  } {
    // هذه وظيفة مبدئية - تحتاج تطوير أكثر للمقارنة الزمنية الفعلية
    const currentKPIs = this.calculateKPIs()

    // محاكاة بيانات الفترة السابقة (في التطبيق الحقيقي، ستأتي من البيانات التاريخية)
    const previousKPIs: KPIMetrics = {
      ...currentKPIs,
      winRate: currentKPIs.winRate - 5,
      projectCompletionRate: currentKPIs.projectCompletionRate - 3,
      costOverrunRate: currentKPIs.costOverrunRate + 2,
    }

    const improvements: string[] = []
    const concerns: string[] = []

    if (currentKPIs.winRate > previousKPIs.winRate) {
      improvements.push(`تحسن نسبة الفوز بمقدار ${currentKPIs.winRate - previousKPIs.winRate}%`)
    } else if (currentKPIs.winRate < previousKPIs.winRate) {
      concerns.push(`انخفاض نسبة الفوز بمقدار ${previousKPIs.winRate - currentKPIs.winRate}%`)
    }

    if (currentKPIs.projectCompletionRate > previousKPIs.projectCompletionRate) {
      improvements.push(`تحسن معدل إنجاز المشاريع في الوقت المحدد`)
    }

    if (currentKPIs.costOverrunRate < previousKPIs.costOverrunRate) {
      improvements.push(`انخفاض معدل تجاوز التكلفة`)
    } else if (currentKPIs.costOverrunRate > previousKPIs.costOverrunRate) {
      concerns.push(`زيادة معدل تجاوز التكلفة`)
    }

    return {
      current: currentKPIs,
      previous: previousKPIs,
      improvements,
      concerns,
    }
  }

  // ===========================
  // 🛠️ Utility Methods
  // ===========================

  /**
   * تنسيق العملة للعرض
   */
  public formatCurrency(amount: number, currency = 'SAR'): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  /**
   * تنسيق النسبة المئوية
   */
  public formatPercentage(value: number, decimals = 1): string {
    return formatPercentageLocalized(value, decimals)
  }

  /**
   * تحديد لون المؤشر حسب القيمة
   */
  public getIndicatorColor(
    value: number,
    thresholds: { good: number; warning: number },
  ): 'green' | 'yellow' | 'red' {
    if (value >= thresholds.good) return 'green'
    if (value >= thresholds.warning) return 'yellow'
    return 'red'
  }
}

// تصدير نسخة واحدة (Singleton)
export const unifiedCalculationsService = UnifiedCalculationsService.getInstance()
