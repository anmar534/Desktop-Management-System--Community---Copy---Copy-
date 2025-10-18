import { asyncStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/storageKeys'

// واجهات التقارير
export interface ProcurementReport {
  id: string
  title: string
  titleEn?: string
  type: 'purchase_orders' | 'supplier_performance' | 'inventory_valuation' | 'trend_analysis' | 'cost_analysis'
  period: {
    startDate: string
    endDate: string
  }
  filters: {
    projectIds?: string[]
    supplierIds?: string[]
    categoryIds?: string[]
    status?: string[]
  }
  data: any
  summary: ReportSummary
  generatedAt: string
  generatedBy: string
}

export interface ReportSummary {
  totalRecords: number
  totalValue: number
  averageValue: number
  topPerformers: {
    id: string
    name: string
    value: number
    metric: string
  }[]
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable'
    percentage: number
    period: string
  }
}

export interface SupplierPerformanceMetrics {
  supplierId: string
  supplierName: string
  totalOrders: number
  totalValue: number
  averageOrderValue: number
  onTimeDeliveryRate: number
  qualityRating: number
  responseTime: number // بالساعات
  defectRate: number
  costSavings: number
  riskScore: number
  overallScore: number
  trend: 'improving' | 'stable' | 'declining'
  lastEvaluationDate: string
}

export interface InventoryValuationReport {
  itemId: string
  itemName: string
  category: string
  currentStock: number
  unitCost: number
  totalValue: number
  averageCost: number
  lastMovementDate: string
  turnoverRate: number
  daysInStock: number
  reorderLevel: number
  status: 'normal' | 'low_stock' | 'overstock' | 'obsolete'
}

export interface TrendAnalysisData {
  period: string
  metric: string
  value: number
  previousValue: number
  change: number
  changePercentage: number
  trend: 'up' | 'down' | 'stable'
}

export interface ProcurementKPI {
  name: string
  nameEn?: string
  value: number
  target: number
  unit: string
  status: 'excellent' | 'good' | 'warning' | 'critical'
  trend: 'improving' | 'stable' | 'declining'
  description: string
}

class ProcurementReportingService {
  // تقارير أوامر الشراء
  async generatePurchaseOrderReport(
    startDate: string,
    endDate: string,
    filters: {
      projectIds?: string[]
      supplierIds?: string[]
      status?: string[]
    } = {}
  ): Promise<ProcurementReport> {
    try {
      const purchaseOrders = await asyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || []
      const suppliers = await asyncStorage.getItem(STORAGE_KEYS.SUPPLIERS) || []
      const projects = await asyncStorage.getItem(STORAGE_KEYS.PROJECTS) || []

      // تصفية البيانات حسب التاريخ والمرشحات
      const filteredOrders = purchaseOrders.filter((order: any) => {
        const orderDate = new Date(order.orderDate)
        const start = new Date(startDate)
        const end = new Date(endDate)

        const dateMatch = orderDate >= start && orderDate <= end
        const projectMatch = !filters.projectIds || filters.projectIds.includes(order.projectId)
        const supplierMatch = !filters.supplierIds || filters.supplierIds.includes(order.supplierId)
        const statusMatch = !filters.status || filters.status.includes(order.status)

        return dateMatch && projectMatch && supplierMatch && statusMatch
      })

      // حساب الإحصائيات
      const totalValue = filteredOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
      const averageValue = filteredOrders.length > 0 ? totalValue / filteredOrders.length : 0

      // أفضل الموردين
      const supplierStats = this.calculateSupplierStats(filteredOrders, suppliers)
      const topSuppliers = supplierStats
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5)
        .map(supplier => ({
          id: supplier.supplierId,
          name: supplier.supplierName,
          value: supplier.totalValue,
          metric: 'إجمالي القيمة'
        }))

      // تحليل الاتجاه
      const trends = await this.calculateTrends('purchase_orders', startDate, endDate)

      const report: ProcurementReport = {
        id: `po_report_${Date.now()}`,
        title: 'تقرير أوامر الشراء',
        titleEn: 'Purchase Orders Report',
        type: 'purchase_orders',
        period: { startDate, endDate },
        filters,
        data: {
          orders: filteredOrders,
          supplierStats,
          projectStats: this.calculateProjectStats(filteredOrders, projects),
          monthlyBreakdown: this.calculateMonthlyBreakdown(filteredOrders)
        },
        summary: {
          totalRecords: filteredOrders.length,
          totalValue,
          averageValue,
          topPerformers: topSuppliers,
          trends
        },
        generatedAt: new Date().toISOString(),
        generatedBy: 'system'
      }

      // حفظ التقرير
      await this.saveReport(report)
      return report

    } catch (error) {
      console.error('خطأ في إنشاء تقرير أوامر الشراء:', error)
      throw new Error('فشل في إنشاء تقرير أوامر الشراء')
    }
  }

  // تقرير أداء الموردين
  async generateSupplierPerformanceReport(
    startDate: string,
    endDate: string,
    supplierIds?: string[]
  ): Promise<ProcurementReport> {
    try {
      const suppliers = await asyncStorage.getItem(STORAGE_KEYS.SUPPLIERS) || []
      const purchaseOrders = await asyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || []
      const evaluations = await asyncStorage.getItem(STORAGE_KEYS.SUPPLIER_EVALUATIONS) || []

      const filteredSuppliers = supplierIds 
        ? suppliers.filter((s: any) => supplierIds.includes(s.id))
        : suppliers

      const performanceMetrics: SupplierPerformanceMetrics[] = []

      for (const supplier of filteredSuppliers) {
        const supplierOrders = purchaseOrders.filter((order: any) => 
          order.supplierId === supplier.id &&
          new Date(order.orderDate) >= new Date(startDate) &&
          new Date(order.orderDate) <= new Date(endDate)
        )

        const supplierEvaluations = evaluations.filter((evaluation: any) =>
          evaluation.supplierId === supplier.id &&
          new Date(evaluation.evaluationDate) >= new Date(startDate) &&
          new Date(evaluation.evaluationDate) <= new Date(endDate)
        )

        const metrics = this.calculateSupplierPerformanceMetrics(
          supplier,
          supplierOrders,
          supplierEvaluations
        )
        performanceMetrics.push(metrics)
      }

      // ترتيب حسب الأداء الإجمالي
      performanceMetrics.sort((a, b) => b.overallScore - a.overallScore)

      const totalValue = performanceMetrics.reduce((sum, metrics) => sum + metrics.totalValue, 0)
      const averageScore = performanceMetrics.length > 0 
        ? performanceMetrics.reduce((sum, metrics) => sum + metrics.overallScore, 0) / performanceMetrics.length
        : 0

      const topPerformers = performanceMetrics.slice(0, 5).map(metrics => ({
        id: metrics.supplierId,
        name: metrics.supplierName,
        value: metrics.overallScore,
        metric: 'نقاط الأداء'
      }))

      const trends = await this.calculateTrends('supplier_performance', startDate, endDate)

      const report: ProcurementReport = {
        id: `sp_report_${Date.now()}`,
        title: 'تقرير أداء الموردين',
        titleEn: 'Supplier Performance Report',
        type: 'supplier_performance',
        period: { startDate, endDate },
        filters: { supplierIds },
        data: {
          metrics: performanceMetrics,
          kpis: this.calculateSupplierKPIs(performanceMetrics),
          benchmarks: this.calculateBenchmarks(performanceMetrics)
        },
        summary: {
          totalRecords: performanceMetrics.length,
          totalValue,
          averageValue: averageScore,
          topPerformers,
          trends
        },
        generatedAt: new Date().toISOString(),
        generatedBy: 'system'
      }

      await this.saveReport(report)
      return report

    } catch (error) {
      console.error('خطأ في إنشاء تقرير أداء الموردين:', error)
      throw new Error('فشل في إنشاء تقرير أداء الموردين')
    }
  }

  // تقرير تقييم المخزون
  async generateInventoryValuationReport(): Promise<ProcurementReport> {
    try {
      const inventory = await asyncStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS) || []
      const movements = await asyncStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS) || []

      const valuationData: InventoryValuationReport[] = []

      for (const item of inventory) {
        const itemMovements = movements.filter((movement: any) => movement.itemId === item.id)
        const valuation = this.calculateItemValuation(item, itemMovements)
        valuationData.push(valuation)
      }

      // ترتيب حسب القيمة الإجمالية
      valuationData.sort((a, b) => b.totalValue - a.totalValue)

      const totalValue = valuationData.reduce((sum, item) => sum + item.totalValue, 0)
      const totalItems = valuationData.reduce((sum, item) => sum + item.currentStock, 0)

      const topItems = valuationData.slice(0, 10).map(item => ({
        id: item.itemId,
        name: item.itemName,
        value: item.totalValue,
        metric: 'القيمة الإجمالية'
      }))

      const trends = await this.calculateTrends('inventory_valuation', '', '')

      const report: ProcurementReport = {
        id: `iv_report_${Date.now()}`,
        title: 'تقرير تقييم المخزون',
        titleEn: 'Inventory Valuation Report',
        type: 'inventory_valuation',
        period: { startDate: '', endDate: '' },
        filters: {},
        data: {
          items: valuationData,
          categories: this.groupByCategory(valuationData),
          alerts: this.generateInventoryAlerts(valuationData)
        },
        summary: {
          totalRecords: valuationData.length,
          totalValue,
          averageValue: totalItems > 0 ? totalValue / totalItems : 0,
          topPerformers: topItems,
          trends
        },
        generatedAt: new Date().toISOString(),
        generatedBy: 'system'
      }

      await this.saveReport(report)
      return report

    } catch (error) {
      console.error('خطأ في إنشاء تقرير تقييم المخزون:', error)
      throw new Error('فشل في إنشاء تقرير تقييم المخزون')
    }
  }

  // تحليل الاتجاهات
  async generateTrendAnalysisReport(
    metric: string,
    period: 'monthly' | 'quarterly' | 'yearly',
    startDate: string,
    endDate: string
  ): Promise<ProcurementReport> {
    try {
      const trendData = await this.calculateDetailedTrends(metric, period, startDate, endDate)
      
      const report: ProcurementReport = {
        id: `trend_report_${Date.now()}`,
        title: `تحليل اتجاهات ${metric}`,
        titleEn: `${metric} Trend Analysis`,
        type: 'trend_analysis',
        period: { startDate, endDate },
        filters: { metric: [metric] },
        data: {
          trends: trendData,
          forecasts: this.generateForecasts(trendData),
          insights: this.generateInsights(trendData)
        },
        summary: {
          totalRecords: trendData.length,
          totalValue: trendData.reduce((sum, trend) => sum + trend.value, 0),
          averageValue: trendData.length > 0 ? trendData.reduce((sum, trend) => sum + trend.value, 0) / trendData.length : 0,
          topPerformers: [],
          trends: {
            direction: this.determineTrendDirection(trendData),
            percentage: this.calculateTrendPercentage(trendData),
            period: `${startDate} - ${endDate}`
          }
        },
        generatedAt: new Date().toISOString(),
        generatedBy: 'system'
      }

      await this.saveReport(report)
      return report

    } catch (error) {
      console.error('خطأ في إنشاء تقرير تحليل الاتجاهات:', error)
      throw new Error('فشل في إنشاء تقرير تحليل الاتجاهات')
    }
  }

  // حفظ التقرير
  private async saveReport(report: ProcurementReport): Promise<void> {
    try {
      const reports = await asyncStorage.getItem(STORAGE_KEYS.PROCUREMENT_REPORTS) || []
      reports.push(report)
      await asyncStorage.setItem(STORAGE_KEYS.PROCUREMENT_REPORTS, reports)
    } catch (error) {
      console.error('خطأ في حفظ التقرير:', error)
    }
  }

  // الحصول على جميع التقارير
  async getAllReports(): Promise<ProcurementReport[]> {
    try {
      return await asyncStorage.getItem(STORAGE_KEYS.PROCUREMENT_REPORTS) || []
    } catch (error) {
      console.error('خطأ في جلب التقارير:', error)
      return []
    }
  }

  // حذف تقرير
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      const reports = await asyncStorage.getItem(STORAGE_KEYS.PROCUREMENT_REPORTS) || []
      const updatedReports = reports.filter((report: ProcurementReport) => report.id !== reportId)
      await asyncStorage.setItem(STORAGE_KEYS.PROCUREMENT_REPORTS, updatedReports)
      return true
    } catch (error) {
      console.error('خطأ في حذف التقرير:', error)
      return false
    }
  }

  // تصدير التقرير
  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<string> {
    try {
      const reports = await asyncStorage.getItem(STORAGE_KEYS.PROCUREMENT_REPORTS) || []
      const report = reports.find((r: ProcurementReport) => r.id === reportId)

      if (!report) {
        throw new Error('التقرير غير موجود')
      }

      // هنا يمكن إضافة منطق التصدير الفعلي
      // للآن سنعيد رابط وهمي
      return `exported_${reportId}.${format}`
    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error)
      throw new Error('فشل في تصدير التقرير')
    }
  }

  // دوال مساعدة خاصة
  private calculateSupplierStats(orders: any[], suppliers: any[]) {
    const stats = new Map()

    orders.forEach(order => {
      const supplier = suppliers.find(s => s.id === order.supplierId)
      if (!supplier) return

      if (!stats.has(order.supplierId)) {
        stats.set(order.supplierId, {
          supplierId: order.supplierId,
          supplierName: supplier.name,
          totalOrders: 0,
          totalValue: 0,
          averageValue: 0
        })
      }

      const stat = stats.get(order.supplierId)
      stat.totalOrders++
      stat.totalValue += order.totalAmount
      stat.averageValue = stat.totalValue / stat.totalOrders
    })

    return Array.from(stats.values())
  }

  private calculateProjectStats(orders: any[], projects: any[]) {
    const stats = new Map()

    orders.forEach(order => {
      if (!order.projectId) return

      const project = projects.find(p => p.id === order.projectId)
      if (!project) return

      if (!stats.has(order.projectId)) {
        stats.set(order.projectId, {
          projectId: order.projectId,
          projectName: project.name,
          totalOrders: 0,
          totalValue: 0,
          averageValue: 0
        })
      }

      const stat = stats.get(order.projectId)
      stat.totalOrders++
      stat.totalValue += order.totalAmount
      stat.averageValue = stat.totalValue / stat.totalOrders
    })

    return Array.from(stats.values())
  }

  private calculateMonthlyBreakdown(orders: any[]) {
    const breakdown = new Map()

    orders.forEach(order => {
      const date = new Date(order.orderDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!breakdown.has(monthKey)) {
        breakdown.set(monthKey, {
          month: monthKey,
          totalOrders: 0,
          totalValue: 0,
          averageValue: 0
        })
      }

      const stat = breakdown.get(monthKey)
      stat.totalOrders++
      stat.totalValue += order.totalAmount
      stat.averageValue = stat.totalValue / stat.totalOrders
    })

    return Array.from(breakdown.values()).sort((a, b) => a.month.localeCompare(b.month))
  }

  private async calculateTrends(type: string, startDate: string, endDate: string) {
    // حساب الاتجاه بناءً على البيانات التاريخية
    // هذا مثال مبسط - يمكن تطويره أكثر
    return {
      direction: 'increasing' as const,
      percentage: 15.5,
      period: `${startDate} - ${endDate}`
    }
  }

  private calculateSupplierPerformanceMetrics(
    supplier: any,
    orders: any[],
    evaluations: any[]
  ): SupplierPerformanceMetrics {
    const totalOrders = orders.length
    const totalValue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0

    // حساب معدل التسليم في الوقت المحدد
    const onTimeOrders = orders.filter(order =>
      new Date(order.deliveryDate) <= new Date(order.expectedDeliveryDate)
    ).length
    const onTimeDeliveryRate = totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0

    // حساب متوسط التقييمات
    const avgQuality = evaluations.length > 0
      ? evaluations.reduce((sum, evaluation) => sum + evaluation.qualityRating, 0) / evaluations.length
      : 0

    // حساب النقاط الإجمالية
    const overallScore = (onTimeDeliveryRate * 0.3) + (avgQuality * 0.4) +
                        (Math.min(averageOrderValue / 10000, 1) * 0.3) * 100

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalOrders,
      totalValue,
      averageOrderValue,
      onTimeDeliveryRate,
      qualityRating: avgQuality,
      responseTime: 24, // افتراضي
      defectRate: Math.random() * 5, // افتراضي
      costSavings: totalValue * 0.05, // افتراضي 5%
      riskScore: Math.random() * 100,
      overallScore,
      trend: overallScore > 80 ? 'improving' : overallScore > 60 ? 'stable' : 'declining',
      lastEvaluationDate: evaluations.length > 0 ? evaluations[evaluations.length - 1].evaluationDate : ''
    }
  }

  private calculateSupplierKPIs(metrics: SupplierPerformanceMetrics[]): ProcurementKPI[] {
    if (metrics.length === 0) return []

    const avgOnTimeDelivery = metrics.reduce((sum, m) => sum + m.onTimeDeliveryRate, 0) / metrics.length
    const avgQuality = metrics.reduce((sum, m) => sum + m.qualityRating, 0) / metrics.length
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length

    return [
      {
        name: 'معدل التسليم في الوقت المحدد',
        nameEn: 'On-Time Delivery Rate',
        value: avgOnTimeDelivery,
        target: 95,
        unit: '%',
        status: avgOnTimeDelivery >= 95 ? 'excellent' : avgOnTimeDelivery >= 85 ? 'good' : avgOnTimeDelivery >= 70 ? 'warning' : 'critical',
        trend: 'stable',
        description: 'نسبة الطلبات المسلمة في الوقت المحدد'
      },
      {
        name: 'متوسط تقييم الجودة',
        nameEn: 'Average Quality Rating',
        value: avgQuality,
        target: 4.5,
        unit: '/5',
        status: avgQuality >= 4.5 ? 'excellent' : avgQuality >= 4 ? 'good' : avgQuality >= 3 ? 'warning' : 'critical',
        trend: 'improving',
        description: 'متوسط تقييمات جودة المنتجات والخدمات'
      },
      {
        name: 'متوسط وقت الاستجابة',
        nameEn: 'Average Response Time',
        value: avgResponseTime,
        target: 24,
        unit: 'ساعة',
        status: avgResponseTime <= 24 ? 'excellent' : avgResponseTime <= 48 ? 'good' : avgResponseTime <= 72 ? 'warning' : 'critical',
        trend: 'stable',
        description: 'متوسط وقت استجابة الموردين للاستفسارات'
      }
    ]
  }

  private calculateBenchmarks(metrics: SupplierPerformanceMetrics[]) {
    if (metrics.length === 0) return {}

    return {
      topPerformer: metrics[0],
      industryAverage: {
        onTimeDeliveryRate: 85,
        qualityRating: 4.0,
        responseTime: 48
      },
      companyAverage: {
        onTimeDeliveryRate: metrics.reduce((sum, m) => sum + m.onTimeDeliveryRate, 0) / metrics.length,
        qualityRating: metrics.reduce((sum, m) => sum + m.qualityRating, 0) / metrics.length,
        responseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
      }
    }
  }

  private calculateItemValuation(item: any, movements: any[]): InventoryValuationReport {
    const currentStock = item.currentStock || 0
    const unitCost = item.unitCost || 0
    const totalValue = currentStock * unitCost

    // حساب معدل الدوران
    const outgoingMovements = movements.filter(m => m.type === 'out')
    const totalOutgoing = outgoingMovements.reduce((sum, m) => sum + m.quantity, 0)
    const turnoverRate = currentStock > 0 ? totalOutgoing / currentStock : 0

    // حساب أيام المخزون
    const daysInStock = turnoverRate > 0 ? 365 / turnoverRate : 365

    // تحديد الحالة
    let status: 'normal' | 'low_stock' | 'overstock' | 'obsolete' = 'normal'
    if (currentStock <= (item.reorderLevel || 0)) {
      status = 'low_stock'
    } else if (daysInStock > 180) {
      status = 'obsolete'
    } else if (currentStock > (item.maxStock || 1000)) {
      status = 'overstock'
    }

    return {
      itemId: item.id,
      itemName: item.name,
      category: item.category || 'غير محدد',
      currentStock,
      unitCost,
      totalValue,
      averageCost: unitCost, // يمكن حسابه من الحركات
      lastMovementDate: movements.length > 0 ? movements[movements.length - 1].date : '',
      turnoverRate,
      daysInStock,
      reorderLevel: item.reorderLevel || 0,
      status
    }
  }

  private groupByCategory(items: InventoryValuationReport[]) {
    const categories = new Map()

    items.forEach(item => {
      if (!categories.has(item.category)) {
        categories.set(item.category, {
          category: item.category,
          totalItems: 0,
          totalValue: 0,
          averageValue: 0
        })
      }

      const cat = categories.get(item.category)
      cat.totalItems++
      cat.totalValue += item.totalValue
      cat.averageValue = cat.totalValue / cat.totalItems
    })

    return Array.from(categories.values())
  }

  private generateInventoryAlerts(items: InventoryValuationReport[]) {
    const alerts = []

    items.forEach(item => {
      if (item.status === 'low_stock') {
        alerts.push({
          type: 'low_stock',
          severity: 'high',
          message: `مخزون منخفض: ${item.itemName}`,
          itemId: item.itemId
        })
      } else if (item.status === 'obsolete') {
        alerts.push({
          type: 'obsolete',
          severity: 'medium',
          message: `مخزون راكد: ${item.itemName}`,
          itemId: item.itemId
        })
      } else if (item.status === 'overstock') {
        alerts.push({
          type: 'overstock',
          severity: 'low',
          message: `مخزون زائد: ${item.itemName}`,
          itemId: item.itemId
        })
      }
    })

    return alerts
  }

  private async calculateDetailedTrends(
    metric: string,
    period: 'monthly' | 'quarterly' | 'yearly',
    startDate: string,
    endDate: string
  ): Promise<TrendAnalysisData[]> {
    // هذا مثال مبسط - يمكن تطويره لحساب الاتجاهات الفعلية
    const trends: TrendAnalysisData[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    // إنشاء بيانات وهمية للاتجاهات
    for (let i = 0; i < 12; i++) {
      const periodDate = new Date(start)
      periodDate.setMonth(start.getMonth() + i)

      if (periodDate > end) break

      const value = Math.random() * 100000 + 50000
      const previousValue = value * (0.9 + Math.random() * 0.2)
      const change = value - previousValue
      const changePercentage = (change / previousValue) * 100

      trends.push({
        period: periodDate.toISOString().substring(0, 7),
        metric,
        value,
        previousValue,
        change,
        changePercentage,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      })
    }

    return trends
  }

  private generateForecasts(trends: TrendAnalysisData[]) {
    if (trends.length < 3) return []

    // حساب توقعات بسيطة بناءً على الاتجاه
    const lastThree = trends.slice(-3)
    const avgGrowth = lastThree.reduce((sum, trend) => sum + trend.changePercentage, 0) / lastThree.length

    const forecasts = []
    let lastValue = trends[trends.length - 1].value

    for (let i = 1; i <= 3; i++) {
      lastValue = lastValue * (1 + avgGrowth / 100)
      forecasts.push({
        period: `توقع ${i}`,
        value: lastValue,
        confidence: Math.max(0.5, 1 - (i * 0.15))
      })
    }

    return forecasts
  }

  private generateInsights(trends: TrendAnalysisData[]) {
    const insights = []

    if (trends.length === 0) return insights

    // تحليل الاتجاه العام
    const positiveChanges = trends.filter(t => t.changePercentage > 0).length
    const totalChanges = trends.length

    if (positiveChanges / totalChanges > 0.7) {
      insights.push({
        type: 'positive',
        message: 'اتجاه إيجابي مستمر في الأداء',
        recommendation: 'استمر في الاستراتيجية الحالية'
      })
    } else if (positiveChanges / totalChanges < 0.3) {
      insights.push({
        type: 'negative',
        message: 'اتجاه سلبي يتطلب التدخل',
        recommendation: 'مراجعة الاستراتيجية والعمليات'
      })
    }

    // تحليل التقلبات
    const volatility = this.calculateVolatility(trends)
    if (volatility > 20) {
      insights.push({
        type: 'warning',
        message: 'تقلبات عالية في الأداء',
        recommendation: 'تحسين استقرار العمليات'
      })
    }

    return insights
  }

  private calculateVolatility(trends: TrendAnalysisData[]): number {
    if (trends.length < 2) return 0

    const changes = trends.map(t => t.changePercentage)
    const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length

    return Math.sqrt(variance)
  }

  private determineTrendDirection(trends: TrendAnalysisData[]): 'increasing' | 'decreasing' | 'stable' {
    if (trends.length < 2) return 'stable'

    const lastTrend = trends[trends.length - 1]
    const firstTrend = trends[0]

    const overallChange = ((lastTrend.value - firstTrend.value) / firstTrend.value) * 100

    if (overallChange > 5) return 'increasing'
    if (overallChange < -5) return 'decreasing'
    return 'stable'
  }

  private calculateTrendPercentage(trends: TrendAnalysisData[]): number {
    if (trends.length < 2) return 0

    const lastTrend = trends[trends.length - 1]
    const firstTrend = trends[0]

    return ((lastTrend.value - firstTrend.value) / firstTrend.value) * 100
  }
}

export const procurementReportingService = new ProcurementReportingService()
