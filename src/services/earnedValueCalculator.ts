/**
 * Earned Value Management Calculator
 * حاسبة إدارة القيمة المكتسبة
 */

import type { 
  EVMMetrics, 
  EVMCalculationInput, 
  EVMTaskData, 
  EVMTrend, 
  EVMForecast, 
  EVMAlert,
  EVMThresholds,
  CostTrackingEntry,
  VarianceAnalysis
} from '../types/evm'

export class EarnedValueCalculator {
  private defaultThresholds: EVMThresholds = {
    cpiWarning: 0.9,
    cpiCritical: 0.8,
    spiWarning: 0.9,
    spiCritical: 0.8,
    cvWarning: -10000,
    cvCritical: -50000,
    svWarning: -5,
    svCritical: -15
  }

  /**
   * حساب مقاييس EVM الأساسية
   */
  calculateEVMMetrics(input: EVMCalculationInput): EVMMetrics {
    const { tasks, totalBudget, statusDate, plannedStartDate, plannedEndDate } = input

    // حساب القيم الأساسية
    const plannedValue = this.calculatePlannedValue(tasks, statusDate, plannedStartDate, plannedEndDate)
    const earnedValue = this.calculateEarnedValue(tasks)
    const actualCost = this.calculateActualCost(tasks)
    const budgetAtCompletion = totalBudget

    // حساب الانحرافات
    const costVariance = earnedValue - actualCost
    const scheduleVariance = earnedValue - plannedValue

    // حساب مؤشرات الأداء
    const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 0
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 0

    // حساب التوقعات
    const estimateAtCompletion = this.calculateEAC(budgetAtCompletion, earnedValue, actualCost, costPerformanceIndex)
    const estimateToComplete = estimateAtCompletion - actualCost
    const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion
    const toCompletePerformanceIndex = this.calculateTCPI(budgetAtCompletion, earnedValue, actualCost)

    // حساب النسب المئوية
    const percentComplete = budgetAtCompletion > 0 ? (earnedValue / budgetAtCompletion) * 100 : 0
    const percentPlanned = budgetAtCompletion > 0 ? (plannedValue / budgetAtCompletion) * 100 : 0

    // حساب التواريخ المتوقعة
    const forecastCompletionDate = this.calculateForecastCompletionDate(
      plannedEndDate, 
      schedulePerformanceIndex,
      percentComplete
    )

    return {
      plannedValue,
      earnedValue,
      actualCost,
      budgetAtCompletion,
      costVariance,
      scheduleVariance,
      costPerformanceIndex,
      schedulePerformanceIndex,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion,
      toCompletePerformanceIndex,
      percentComplete,
      percentPlanned,
      statusDate,
      plannedCompletionDate: plannedEndDate,
      forecastCompletionDate
    }
  }

  /**
   * حساب القيمة المخططة (PV)
   */
  private calculatePlannedValue(
    tasks: EVMTaskData[], 
    statusDate: string, 
    projectStart: string, 
    projectEnd: string
  ): number {
    const status = new Date(statusDate)
    const start = new Date(projectStart)
    const end = new Date(projectEnd)
    
    // حساب النسبة المئوية للوقت المنقضي
    const totalDuration = end.getTime() - start.getTime()
    const elapsedDuration = status.getTime() - start.getTime()
    const timeProgress = Math.max(0, Math.min(1, elapsedDuration / totalDuration))

    return tasks.reduce((total, task) => {
      const taskStart = new Date(task.plannedStartDate)
      const taskEnd = new Date(task.plannedEndDate)
      
      if (status < taskStart) {
        // المهمة لم تبدأ بعد
        return total
      } else if (status >= taskEnd) {
        // المهمة انتهت حسب الخطة
        return total + task.plannedValue
      } else {
        // المهمة قيد التنفيذ
        const taskDuration = taskEnd.getTime() - taskStart.getTime()
        const taskElapsed = status.getTime() - taskStart.getTime()
        const taskProgress = taskElapsed / taskDuration
        return total + (task.plannedValue * taskProgress)
      }
    }, 0)
  }

  /**
   * حساب القيمة المكتسبة (EV)
   */
  private calculateEarnedValue(tasks: EVMTaskData[]): number {
    return tasks.reduce((total, task) => {
      return total + (task.plannedValue * (task.percentComplete / 100))
    }, 0)
  }

  /**
   * حساب التكلفة الفعلية (AC)
   */
  private calculateActualCost(tasks: EVMTaskData[]): number {
    return tasks.reduce((total, task) => total + task.actualCost, 0)
  }

  /**
   * حساب التقدير عند الإكمال (EAC)
   */
  private calculateEAC(bac: number, ev: number, ac: number, cpi: number): number {
    if (cpi <= 0) return bac // إذا كان CPI صفر أو سالب، استخدم الميزانية الأصلية
    
    // EAC = AC + (BAC - EV) / CPI
    return ac + ((bac - ev) / cpi)
  }

  /**
   * حساب مؤشر الأداء للإكمال (TCPI)
   */
  private calculateTCPI(bac: number, ev: number, ac: number): number {
    const remainingBudget = bac - ac
    const remainingWork = bac - ev
    
    if (remainingBudget <= 0) return Infinity
    return remainingWork / remainingBudget
  }

  /**
   * حساب تاريخ الإكمال المتوقع
   */
  private calculateForecastCompletionDate(
    plannedEndDate: string, 
    spi: number, 
    percentComplete: number
  ): string {
    const plannedEnd = new Date(plannedEndDate)
    
    if (spi <= 0 || percentComplete <= 0) {
      return plannedEndDate // لا يمكن التنبؤ
    }

    // حساب الوقت المتبقي بناءً على الأداء الحالي
    const remainingWork = 100 - percentComplete
    const adjustedDuration = remainingWork / spi
    
    // إضافة الوقت المتوقع للتاريخ الحالي
    const today = new Date()
    const forecastEnd = new Date(today.getTime() + (adjustedDuration * 24 * 60 * 60 * 1000))
    
    return forecastEnd.toISOString()
  }

  /**
   * تحليل الاتجاهات
   */
  analyzeTrends(historicalData: EVMTrend[]): {
    costTrend: 'improving' | 'stable' | 'declining'
    scheduleTrend: 'improving' | 'stable' | 'declining'
    overallTrend: 'improving' | 'stable' | 'declining'
  } {
    if (historicalData.length < 2) {
      return { costTrend: 'stable', scheduleTrend: 'stable', overallTrend: 'stable' }
    }

    const recent = historicalData.slice(-3) // آخر 3 نقاط
    
    // تحليل اتجاه التكلفة (CPI)
    const cpiTrend = this.calculateTrendDirection(recent.map(d => d.cpi))
    
    // تحليل اتجاه الجدولة (SPI)
    const spiTrend = this.calculateTrendDirection(recent.map(d => d.spi))
    
    // تحليل الاتجاه العام
    const overallTrend = cpiTrend === 'improving' && spiTrend === 'improving' 
      ? 'improving' 
      : cpiTrend === 'declining' || spiTrend === 'declining' 
        ? 'declining' 
        : 'stable'

    return {
      costTrend: cpiTrend,
      scheduleTrend: spiTrend,
      overallTrend
    }
  }

  /**
   * حساب اتجاه البيانات
   */
  private calculateTrendDirection(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable'
    
    const first = values[0]
    const last = values[values.length - 1]
    const change = (last - first) / first
    
    if (change > 0.05) return 'improving'
    if (change < -0.05) return 'declining'
    return 'stable'
  }

  /**
   * توليد التنبيهات
   */
  generateAlerts(
    projectId: string, 
    metrics: EVMMetrics, 
    thresholds: EVMThresholds = this.defaultThresholds
  ): EVMAlert[] {
    const alerts: EVMAlert[] = []

    // تنبيهات CPI
    if (metrics.costPerformanceIndex <= thresholds.cpiCritical) {
      alerts.push({
        id: this.generateAlertId(),
        projectId,
        type: 'cost_overrun',
        severity: 'critical',
        title: 'تجاوز حرج في التكلفة',
        message: `مؤشر أداء التكلفة (${metrics.costPerformanceIndex.toFixed(2)}) أقل من الحد الحرج (${thresholds.cpiCritical})`,
        threshold: thresholds.cpiCritical,
        currentValue: metrics.costPerformanceIndex,
        createdAt: new Date().toISOString(),
        isRead: false,
        isActive: true
      })
    } else if (metrics.costPerformanceIndex <= thresholds.cpiWarning) {
      alerts.push({
        id: this.generateAlertId(),
        projectId,
        type: 'cost_overrun',
        severity: 'high',
        title: 'تحذير تجاوز التكلفة',
        message: `مؤشر أداء التكلفة (${metrics.costPerformanceIndex.toFixed(2)}) أقل من حد التحذير (${thresholds.cpiWarning})`,
        threshold: thresholds.cpiWarning,
        currentValue: metrics.costPerformanceIndex,
        createdAt: new Date().toISOString(),
        isRead: false,
        isActive: true
      })
    }

    // تنبيهات SPI
    if (metrics.schedulePerformanceIndex <= thresholds.spiCritical) {
      alerts.push({
        id: this.generateAlertId(),
        projectId,
        type: 'schedule_delay',
        severity: 'critical',
        title: 'تأخير حرج في الجدولة',
        message: `مؤشر أداء الجدولة (${metrics.schedulePerformanceIndex.toFixed(2)}) أقل من الحد الحرج (${thresholds.spiCritical})`,
        threshold: thresholds.spiCritical,
        currentValue: metrics.schedulePerformanceIndex,
        createdAt: new Date().toISOString(),
        isRead: false,
        isActive: true
      })
    } else if (metrics.schedulePerformanceIndex <= thresholds.spiWarning) {
      alerts.push({
        id: this.generateAlertId(),
        projectId,
        type: 'schedule_delay',
        severity: 'high',
        title: 'تحذير تأخير الجدولة',
        message: `مؤشر أداء الجدولة (${metrics.schedulePerformanceIndex.toFixed(2)}) أقل من حد التحذير (${thresholds.spiWarning})`,
        threshold: thresholds.spiWarning,
        currentValue: metrics.schedulePerformanceIndex,
        createdAt: new Date().toISOString(),
        isRead: false,
        isActive: true
      })
    }

    // تنبيهات انحراف التكلفة
    if (metrics.costVariance <= thresholds.cvCritical) {
      alerts.push({
        id: this.generateAlertId(),
        projectId,
        type: 'cost_overrun',
        severity: 'critical',
        title: 'انحراف حرج في التكلفة',
        message: `انحراف التكلفة (${this.formatCurrency(metrics.costVariance)}) تجاوز الحد الحرج`,
        threshold: thresholds.cvCritical,
        currentValue: metrics.costVariance,
        createdAt: new Date().toISOString(),
        isRead: false,
        isActive: true
      })
    }

    return alerts
  }

  /**
   * حساب التوقعات المتعددة
   */
  calculateForecasts(metrics: EVMMetrics, historicalData: EVMTrend[]): EVMForecast[] {
    const forecasts: EVMForecast[] = []

    // توقع بناءً على الأداء الحالي
    forecasts.push({
      method: 'current_performance',
      estimateAtCompletion: metrics.estimateAtCompletion,
      estimateToComplete: metrics.estimateToComplete,
      forecastCompletionDate: metrics.forecastCompletionDate,
      confidence: this.calculateConfidence(metrics.costPerformanceIndex, metrics.schedulePerformanceIndex),
      assumptions: [
        'الأداء الحالي سيستمر',
        'لا توجد تغييرات في النطاق',
        'الموارد متاحة كما هو مخطط'
      ]
    })

    // توقع بناءً على الأداء المخطط
    const plannedEAC = metrics.budgetAtCompletion
    forecasts.push({
      method: 'planned_performance',
      estimateAtCompletion: plannedEAC,
      estimateToComplete: plannedEAC - metrics.actualCost,
      forecastCompletionDate: metrics.plannedCompletionDate,
      confidence: 50, // ثقة متوسطة
      assumptions: [
        'سيتم تحسين الأداء للوصول للخطة الأصلية',
        'ستتم معالجة جميع المشاكل الحالية',
        'لن تحدث مخاطر إضافية'
      ]
    })

    return forecasts
  }

  /**
   * حساب مستوى الثقة
   */
  private calculateConfidence(cpi: number, spi: number): number {
    // حساب الثقة بناءً على استقرار المؤشرات
    const cpiConfidence = Math.max(0, Math.min(100, (cpi - 0.5) * 100))
    const spiConfidence = Math.max(0, Math.min(100, (spi - 0.5) * 100))
    
    return Math.round((cpiConfidence + spiConfidence) / 2)
  }

  /**
   * تنسيق العملة
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  /**
   * توليد معرف التنبيه
   */
  private generateAlertId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * تحليل الانحرافات التفصيلي
   */
  analyzeVariances(
    projectId: string,
    currentMetrics: EVMMetrics,
    tasks: EVMTaskData[],
    costEntries: CostTrackingEntry[]
  ): VarianceAnalysis {
    // تحليل انحراف التكلفة
    const costVarianceAnalysis = this.analyzeCostVariances(tasks, costEntries)
    
    // تحليل انحراف الجدولة
    const scheduleVarianceAnalysis = this.analyzeScheduleVariances(tasks)
    
    // تحليل الأداء
    const performanceAnalysis = this.analyzePerformance(currentMetrics, tasks)

    return {
      projectId,
      analysisDate: new Date().toISOString(),
      costVarianceAnalysis,
      scheduleVarianceAnalysis,
      performanceAnalysis,
      recommendations: this.generateRecommendations(currentMetrics),
      actionPlan: this.generateActionPlan(currentMetrics)
    }
  }

  private analyzeCostVariances(tasks: EVMTaskData[], costEntries: CostTrackingEntry[]) {
    // تنفيذ مؤقت
    return {
      totalVariance: 0,
      variancePercentage: 0,
      majorVariances: [],
      trends: []
    }
  }

  private analyzeScheduleVariances(tasks: EVMTaskData[]) {
    // تنفيذ مؤقت
    return {
      totalVariance: 0,
      varianceDays: 0,
      criticalPathImpact: 0,
      delayedTasks: [],
      mitigationActions: []
    }
  }

  private analyzePerformance(metrics: EVMMetrics, tasks: EVMTaskData[]) {
    // تنفيذ مؤقت
    return {
      efficiencyTrend: metrics.costPerformanceIndex,
      productivityIndex: metrics.schedulePerformanceIndex,
      qualityMetrics: {
        defectRate: 0,
        reworkPercentage: 0,
        customerSatisfaction: 0
      },
      resourceUtilization: {
        planned: 100,
        actual: 85,
        efficiency: 85
      }
    }
  }

  private generateRecommendations(metrics: EVMMetrics): { immediate: string[], shortTerm: string[], longTerm: string[] } {
    const recommendations = { immediate: [], shortTerm: [], longTerm: [] }
    
    if (metrics.costPerformanceIndex < 0.9) {
      recommendations.immediate.push('مراجعة فورية للتكاليف وتحديد أسباب التجاوز')
      recommendations.shortTerm.push('تطبيق إجراءات توفير التكلفة')
    }
    
    if (metrics.schedulePerformanceIndex < 0.9) {
      recommendations.immediate.push('مراجعة الجدولة وتحديد المهام المتأخرة')
      recommendations.shortTerm.push('إعادة تخصيص الموارد للمهام الحرجة')
    }
    
    return recommendations
  }

  private generateActionPlan(metrics: EVMMetrics) {
    // تنفيذ مؤقت
    return []
  }
}

export const earnedValueCalculator = new EarnedValueCalculator()
