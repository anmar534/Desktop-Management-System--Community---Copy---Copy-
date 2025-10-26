/**
 * خدمة الرسوم البيانية التفاعلية المتقدمة
 * Interactive Charts Service
 *
 * توفر هذه الخدمة إمكانيات متقدمة لإنشاء وإدارة الرسوم البيانية التفاعلية
 * مع دعم التحديث في الوقت الفعلي والتفاعل المتقدم
 */

import { asyncStorage } from '@/shared/utils/storage/storage'

// أنواع البيانات للرسوم البيانية
export interface ChartDataPoint {
  id: string
  label: string
  labelEn: string
  value: number
  color?: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface TimeSeriesDataPoint {
  date: string
  value: number
  category?: string
  metadata?: Record<string, any>
}

export interface ChartConfiguration {
  id: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar' | 'treemap' | 'heatmap'
  title: string
  titleEn: string
  description?: string
  descriptionEn?: string
  dataSource: string
  refreshInterval?: number // بالثواني
  interactive: boolean
  zoomable: boolean
  exportable: boolean
  realTimeUpdates: boolean
  theme: 'light' | 'dark' | 'auto'
  colors: string[]
  dimensions: {
    width: number
    height: number
  }
  options: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ChartFilter {
  field: string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between'
  value: any
}

export interface ChartAggregation {
  field: string
  method: 'sum' | 'average' | 'count' | 'min' | 'max'
  groupBy?: string
}

export interface DrillDownLevel {
  field: string
  label: string
  labelEn: string
}

export interface ChartInteractionEvent {
  type: 'click' | 'hover' | 'zoom' | 'filter' | 'drilldown'
  data: any
  timestamp: string
}

export class InteractiveChartsService {
  private readonly STORAGE_KEY = 'interactive_charts'
  private readonly CONFIG_KEY = 'chart_configurations'
  private readonly CACHE_KEY = 'chart_data_cache'
  private updateIntervals = new Map<string, NodeJS.Timeout>()
  private eventListeners = new Map<string, ((...args: unknown[]) => void)[]>()

  /**
   * إنشاء تكوين رسم بياني جديد
   */
  async createChartConfiguration(
    config: Omit<ChartConfiguration, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ChartConfiguration> {
    const newConfig: ChartConfiguration = {
      ...config,
      id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const configurations = await this.getChartConfigurations()
    configurations.push(newConfig)
    await asyncStorage.setItem(this.CONFIG_KEY, configurations)

    return newConfig
  }

  /**
   * الحصول على جميع تكوينات الرسوم البيانية
   */
  async getChartConfigurations(): Promise<ChartConfiguration[]> {
    return (await asyncStorage.getItem(this.CONFIG_KEY)) || []
  }

  /**
   * الحصول على تكوين رسم بياني محدد
   */
  async getChartConfiguration(chartId: string): Promise<ChartConfiguration | null> {
    const configurations = await this.getChartConfigurations()
    return configurations.find((config) => config.id === chartId) || null
  }

  /**
   * تحديث تكوين رسم بياني
   */
  async updateChartConfiguration(
    chartId: string,
    updates: Partial<ChartConfiguration>,
  ): Promise<ChartConfiguration | null> {
    const configurations = await this.getChartConfigurations()
    const index = configurations.findIndex((config) => config.id === chartId)

    if (index === -1) return null

    configurations[index] = {
      ...configurations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await asyncStorage.setItem(this.CONFIG_KEY, configurations)
    return configurations[index]
  }

  /**
   * حذف تكوين رسم بياني
   */
  async deleteChartConfiguration(chartId: string): Promise<boolean> {
    const configurations = await this.getChartConfigurations()
    const filteredConfigurations = configurations.filter((config) => config.id !== chartId)

    if (filteredConfigurations.length === configurations.length) return false

    await asyncStorage.setItem(this.CONFIG_KEY, filteredConfigurations)
    this.stopRealTimeUpdates(chartId)
    return true
  }

  /**
   * الحصول على بيانات الرسم البياني للمشاريع
   */
  async getProjectChartData(chartType: string, filters?: ChartFilter[]): Promise<ChartDataPoint[]> {
    const projects = (await asyncStorage.getItem('projects')) || []
    let data: ChartDataPoint[] = []

    switch (chartType) {
      case 'project_status':
        data = this.aggregateProjectsByStatus(projects)
        break
      case 'project_budget':
        data = this.aggregateProjectsByBudget(projects)
        break
      case 'project_progress':
        data = this.aggregateProjectsByProgress(projects)
        break
      case 'project_timeline':
        data = this.aggregateProjectsByTimeline(projects)
        break
      default:
        data = []
    }

    return this.applyFilters(data, filters)
  }

  /**
   * الحصول على بيانات الرسم البياني للمنافسات
   */
  async getTenderChartData(chartType: string, filters?: ChartFilter[]): Promise<ChartDataPoint[]> {
    const tenders = (await asyncStorage.getItem('tenders')) || []
    let data: ChartDataPoint[] = []

    switch (chartType) {
      case 'tender_status':
        data = this.aggregateTendersByStatus(tenders)
        break
      case 'tender_value':
        data = this.aggregateTendersByValue(tenders)
        break
      case 'tender_success_rate':
        data = this.aggregateTendersBySuccessRate(tenders)
        break
      case 'tender_timeline':
        data = this.aggregateTendersByTimeline(tenders)
        break
      default:
        data = []
    }

    return this.applyFilters(data, filters)
  }

  /**
   * الحصول على بيانات الرسم البياني المالية
   */
  async getFinancialChartData(
    chartType: string,
    filters?: ChartFilter[],
  ): Promise<ChartDataPoint[]> {
    const financialData = (await asyncStorage.getItem('financial_data')) || {}
    let data: ChartDataPoint[] = []

    switch (chartType) {
      case 'revenue_trend':
        data = this.aggregateRevenueByPeriod(financialData)
        break
      case 'expense_breakdown':
        data = this.aggregateExpensesByCategory(financialData)
        break
      case 'profit_margin':
        data = this.aggregateProfitMarginByPeriod(financialData)
        break
      case 'cash_flow':
        data = this.aggregateCashFlowByPeriod(financialData)
        break
      default:
        data = []
    }

    return this.applyFilters(data, filters)
  }

  /**
   * الحصول على بيانات السلاسل الزمنية
   */
  async getTimeSeriesData(
    dataSource: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
  ): Promise<TimeSeriesDataPoint[]> {
    const cacheKey = `timeseries_${dataSource}_${period}`
    const cached = await asyncStorage.getItem(cacheKey)

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data
    }

    let data: TimeSeriesDataPoint[] = []

    switch (dataSource) {
      case 'projects':
        data = await this.getProjectTimeSeriesData(period)
        break
      case 'tenders':
        data = await this.getTenderTimeSeriesData(period)
        break
      case 'financial':
        data = await this.getFinancialTimeSeriesData(period)
        break
    }

    // تخزين في الكاش
    await asyncStorage.setItem(cacheKey, {
      data,
      timestamp: new Date().toISOString(),
    })

    return data
  }

  /**
   * بدء التحديثات في الوقت الفعلي
   */
  startRealTimeUpdates(chartId: string, intervalSeconds = 30): void {
    this.stopRealTimeUpdates(chartId)

    const interval = setInterval(async () => {
      try {
        const config = await this.getChartConfiguration(chartId)
        if (!config?.realTimeUpdates) {
          this.stopRealTimeUpdates(chartId)
          return
        }

        // تحديث البيانات وإشعار المستمعين
        await this.refreshChartData(chartId)
        this.emitEvent(chartId, {
          type: 'refresh',
          data: { chartId },
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error(`Error updating chart ${chartId}:`, error)
      }
    }, intervalSeconds * 1000)

    this.updateIntervals.set(chartId, interval)
  }

  /**
   * إيقاف التحديثات في الوقت الفعلي
   */
  stopRealTimeUpdates(chartId: string): void {
    const interval = this.updateIntervals.get(chartId)
    if (interval) {
      clearInterval(interval)
      this.updateIntervals.delete(chartId)
    }
  }

  /**
   * تحديث بيانات الرسم البياني
   */
  async refreshChartData(chartId: string): Promise<void> {
    const config = await this.getChartConfiguration(chartId)
    if (!config) return

    // مسح الكاش للبيانات المرتبطة بهذا الرسم البياني
    const cacheKeys = await this.getCacheKeysForChart(chartId)
    for (const key of cacheKeys) {
      await asyncStorage.removeItem(key)
    }
  }

  /**
   * إضافة مستمع للأحداث
   */
  addEventListener(chartId: string, listener: (...args: unknown[]) => void): void {
    if (!this.eventListeners.has(chartId)) {
      this.eventListeners.set(chartId, [])
    }
    this.eventListeners.get(chartId)!.push(listener)
  }

  /**
   * إزالة مستمع للأحداث
   */
  removeEventListener(chartId: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.eventListeners.get(chartId)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * إرسال حدث للمستمعين
   */
  private emitEvent(chartId: string, event: ChartInteractionEvent): void {
    const listeners = this.eventListeners.get(chartId)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in chart event listener:', error)
        }
      })
    }
  }

  // دوال مساعدة لتجميع البيانات
  private aggregateProjectsByStatus(projects: any[]): ChartDataPoint[] {
    const statusCounts: Record<string, number> = {}

    projects.forEach((project) => {
      const status = project.status || 'غير محدد'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    return Object.entries(statusCounts).map(([status, count]) => ({
      id: `status_${status}`,
      label: status,
      labelEn: this.translateStatus(status),
      value: count,
      timestamp: new Date().toISOString(),
    }))
  }

  private aggregateProjectsByBudget(projects: any[]): ChartDataPoint[] {
    const budgetRanges = [
      { min: 0, max: 100000, label: 'أقل من 100 ألف', labelEn: 'Less than 100K' },
      { min: 100000, max: 500000, label: '100-500 ألف', labelEn: '100K-500K' },
      { min: 500000, max: 1000000, label: '500 ألف - مليون', labelEn: '500K-1M' },
      { min: 1000000, max: Infinity, label: 'أكثر من مليون', labelEn: 'More than 1M' },
    ]

    const rangeCounts = budgetRanges.map((range) => ({
      ...range,
      count: 0,
    }))

    projects.forEach((project) => {
      const budget = project.budget || 0
      const range = rangeCounts.find((r) => budget >= r.min && budget < r.max)
      if (range) range.count++
    })

    return rangeCounts.map((range, index) => ({
      id: `budget_range_${index}`,
      label: range.label,
      labelEn: range.labelEn,
      value: range.count,
      timestamp: new Date().toISOString(),
    }))
  }

  private aggregateProjectsByProgress(projects: any[]): ChartDataPoint[] {
    const progressRanges = [
      { min: 0, max: 25, label: '0-25%', labelEn: '0-25%' },
      { min: 25, max: 50, label: '25-50%', labelEn: '25-50%' },
      { min: 50, max: 75, label: '50-75%', labelEn: '50-75%' },
      { min: 75, max: 100, label: '75-100%', labelEn: '75-100%' },
    ]

    const rangeCounts = progressRanges.map((range) => ({
      ...range,
      count: 0,
    }))

    projects.forEach((project) => {
      const progress = project.progress || 0
      const range = rangeCounts.find((r) => progress >= r.min && progress < r.max)
      if (range) range.count++
    })

    return rangeCounts.map((range, index) => ({
      id: `progress_range_${index}`,
      label: range.label,
      labelEn: range.labelEn,
      value: range.count,
      timestamp: new Date().toISOString(),
    }))
  }

  private aggregateProjectsByTimeline(projects: any[]): ChartDataPoint[] {
    const timelineData: Record<string, number> = {}

    projects.forEach((project) => {
      if (project.startDate) {
        const month = new Date(project.startDate).toISOString().substr(0, 7)
        timelineData[month] = (timelineData[month] || 0) + 1
      }
    })

    return Object.entries(timelineData).map(([month, count]) => ({
      id: `timeline_${month}`,
      label: month,
      labelEn: month,
      value: count,
      timestamp: new Date().toISOString(),
    }))
  }

  private aggregateTendersByStatus(tenders: any[]): ChartDataPoint[] {
    const statusCounts: Record<string, number> = {}

    tenders.forEach((tender) => {
      const status = tender.status || 'غير محدد'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    return Object.entries(statusCounts).map(([status, count]) => ({
      id: `tender_status_${status}`,
      label: status,
      labelEn: this.translateTenderStatus(status),
      value: count,
      timestamp: new Date().toISOString(),
    }))
  }

  private aggregateTendersByValue(tenders: any[]): ChartDataPoint[] {
    const valueRanges = [
      { min: 0, max: 500000, label: 'أقل من 500 ألف', labelEn: 'Less than 500K' },
      { min: 500000, max: 2000000, label: '500 ألف - 2 مليون', labelEn: '500K-2M' },
      { min: 2000000, max: 10000000, label: '2-10 مليون', labelEn: '2M-10M' },
      { min: 10000000, max: Infinity, label: 'أكثر من 10 مليون', labelEn: 'More than 10M' },
    ]

    const rangeCounts = valueRanges.map((range) => ({
      ...range,
      count: 0,
    }))

    tenders.forEach((tender) => {
      const value = tender.estimatedValue || 0
      const range = rangeCounts.find((r) => value >= r.min && value < r.max)
      if (range) range.count++
    })

    return rangeCounts.map((range, index) => ({
      id: `tender_value_range_${index}`,
      label: range.label,
      labelEn: range.labelEn,
      value: range.count,
      timestamp: new Date().toISOString(),
    }))
  }

  private aggregateTendersBySuccessRate(tenders: any[]): ChartDataPoint[] {
    const wonTenders = tenders.filter((t) => t.status === 'فائز' || t.status === 'won').length
    const lostTenders = tenders.filter((t) => t.status === 'خاسر' || t.status === 'lost').length
    const pendingTenders = tenders.filter(
      (t) => t.status === 'قيد المراجعة' || t.status === 'pending',
    ).length

    return [
      {
        id: 'won_tenders',
        label: 'منافسات فائزة',
        labelEn: 'Won Tenders',
        value: wonTenders,
        color: '#10b981',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'lost_tenders',
        label: 'منافسات خاسرة',
        labelEn: 'Lost Tenders',
        value: lostTenders,
        color: '#ef4444',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'pending_tenders',
        label: 'منافسات قيد المراجعة',
        labelEn: 'Pending Tenders',
        value: pendingTenders,
        color: '#f59e0b',
        timestamp: new Date().toISOString(),
      },
    ]
  }

  private aggregateTendersByTimeline(tenders: any[]): ChartDataPoint[] {
    const timelineData: Record<string, number> = {}

    tenders.forEach((tender) => {
      if (tender.submissionDate) {
        const month = new Date(tender.submissionDate).toISOString().substr(0, 7)
        timelineData[month] = (timelineData[month] || 0) + 1
      }
    })

    return Object.entries(timelineData).map(([month, count]) => ({
      id: `tender_timeline_${month}`,
      label: month,
      labelEn: month,
      value: count,
      timestamp: new Date().toISOString(),
    }))
  }

  private aggregateRevenueByPeriod(financialData: any): ChartDataPoint[] {
    // تنفيذ تجميع الإيرادات حسب الفترة
    const revenues = financialData.revenues || []
    const monthlyRevenue: Record<string, number> = {}

    revenues.forEach((revenue: any) => {
      const month = new Date(revenue.date).toISOString().substr(0, 7)
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenue.amount
    })

    return Object.entries(monthlyRevenue).map(([month, amount]) => ({
      id: `revenue_${month}`,
      label: month,
      labelEn: month,
      value: amount,
      timestamp: new Date().toISOString(),
    }))
  }

  private aggregateExpensesByCategory(financialData: any): ChartDataPoint[] {
    // تنفيذ تجميع المصروفات حسب الفئة
    const expenses = financialData.expenses || []
    const categoryExpenses: Record<string, number> = {}

    expenses.forEach((expense: any) => {
      const category = expense.category || 'غير مصنف'
      categoryExpenses[category] = (categoryExpenses[category] || 0) + expense.amount
    })

    return Object.entries(categoryExpenses).map(([category, amount]) => ({
      id: `expense_${category}`,
      label: category,
      labelEn: this.translateExpenseCategory(category),
      value: amount,
      timestamp: new Date().toISOString(),
    }))
  }

  private aggregateProfitMarginByPeriod(financialData: any): ChartDataPoint[] {
    // تنفيذ تجميع هامش الربح حسب الفترة
    const revenues = financialData.revenues || []
    const expenses = financialData.expenses || []

    const monthlyData: Record<string, { revenue: number; expense: number }> = {}

    revenues.forEach((revenue: any) => {
      const month = new Date(revenue.date).toISOString().substr(0, 7)
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expense: 0 }
      monthlyData[month].revenue += revenue.amount
    })

    expenses.forEach((expense: any) => {
      const month = new Date(expense.date).toISOString().substr(0, 7)
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expense: 0 }
      monthlyData[month].expense += expense.amount
    })

    return Object.entries(monthlyData).map(([month, data]) => {
      const profitMargin =
        data.revenue > 0 ? ((data.revenue - data.expense) / data.revenue) * 100 : 0
      return {
        id: `profit_margin_${month}`,
        label: month,
        labelEn: month,
        value: profitMargin,
        timestamp: new Date().toISOString(),
      }
    })
  }

  private aggregateCashFlowByPeriod(financialData: any): ChartDataPoint[] {
    // تنفيذ تجميع التدفق النقدي حسب الفترة
    const cashFlows = financialData.cashFlows || []
    const monthlyCashFlow: Record<string, number> = {}

    cashFlows.forEach((flow: any) => {
      const month = new Date(flow.date).toISOString().substr(0, 7)
      monthlyCashFlow[month] = (monthlyCashFlow[month] || 0) + flow.amount
    })

    return Object.entries(monthlyCashFlow).map(([month, amount]) => ({
      id: `cash_flow_${month}`,
      label: month,
      labelEn: month,
      value: amount,
      timestamp: new Date().toISOString(),
    }))
  }

  // دوال مساعدة للسلاسل الزمنية
  private async getProjectTimeSeriesData(period: string): Promise<TimeSeriesDataPoint[]> {
    const projects = (await asyncStorage.getItem('projects')) || []
    // تنفيذ منطق السلاسل الزمنية للمشاريع
    return []
  }

  private async getTenderTimeSeriesData(period: string): Promise<TimeSeriesDataPoint[]> {
    const tenders = (await asyncStorage.getItem('tenders')) || []
    // تنفيذ منطق السلاسل الزمنية للمنافسات
    return []
  }

  private async getFinancialTimeSeriesData(period: string): Promise<TimeSeriesDataPoint[]> {
    const financialData = (await asyncStorage.getItem('financial_data')) || {}
    // تنفيذ منطق السلاسل الزمنية للبيانات المالية
    return []
  }

  // دوال مساعدة أخرى
  private applyFilters(data: ChartDataPoint[], filters?: ChartFilter[]): ChartDataPoint[] {
    if (!filters || filters.length === 0) return data

    return data.filter((point) => {
      return filters.every((filter) => {
        const value = (point as any)[filter.field]
        switch (filter.operator) {
          case 'equals':
            return value === filter.value
          case 'contains':
            return String(value).includes(String(filter.value))
          case 'greaterThan':
            return Number(value) > Number(filter.value)
          case 'lessThan':
            return Number(value) < Number(filter.value)
          case 'between':
            return (
              Number(value) >= Number(filter.value[0]) && Number(value) <= Number(filter.value[1])
            )
          default:
            return true
        }
      })
    })
  }

  private isCacheValid(timestamp: string, maxAgeMinutes = 5): boolean {
    const cacheTime = new Date(timestamp).getTime()
    const now = new Date().getTime()
    return now - cacheTime < maxAgeMinutes * 60 * 1000
  }

  private async getCacheKeysForChart(chartId: string): Promise<string[]> {
    // إرجاع مفاتيح الكاش المرتبطة بالرسم البياني
    return [`chart_data_${chartId}`, `timeseries_${chartId}`]
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'قيد التنفيذ': 'In Progress',
      مكتمل: 'Completed',
      متوقف: 'Paused',
      ملغي: 'Cancelled',
      'غير محدد': 'Undefined',
    }
    return translations[status] || status
  }

  private translateTenderStatus(status: string): string {
    const translations: Record<string, string> = {
      فائز: 'Won',
      خاسر: 'Lost',
      'قيد المراجعة': 'Pending',
      مرفوض: 'Rejected',
      'غير محدد': 'Undefined',
    }
    return translations[status] || status
  }

  private translateExpenseCategory(category: string): string {
    const translations: Record<string, string> = {
      مواد: 'Materials',
      عمالة: 'Labor',
      معدات: 'Equipment',
      إدارية: 'Administrative',
      تسويق: 'Marketing',
      'غير مصنف': 'Uncategorized',
    }
    return translations[category] || category
  }
}

export const interactiveChartsService = new InteractiveChartsService()
