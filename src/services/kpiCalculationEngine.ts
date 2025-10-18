/**
 * KPI Calculation Engine
 * محرك حساب مؤشرات الأداء الرئيسية
 */

import type { EnhancedProject } from '../types/projects'
import type { Task } from '../types/tasks'
import type { EVMMetrics } from '../types/evm'

export interface KPICalculationInput {
  projects: EnhancedProject[]
  tasks: Task[]
  evmMetrics?: EVMMetrics[]
  timeframe: {
    startDate: string
    endDate: string
  }
}

export interface KPIResult {
  id: string
  name: string
  nameEn: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  status: 'excellent' | 'good' | 'warning' | 'critical'
  category: 'financial' | 'schedule' | 'quality' | 'resources' | 'risk'
  description: string
  calculation: string
  lastUpdated: string
}

export interface KPIDashboard {
  summary: {
    totalKPIs: number
    excellentKPIs: number
    goodKPIs: number
    warningKPIs: number
    criticalKPIs: number
  }
  categories: {
    financial: KPIResult[]
    schedule: KPIResult[]
    quality: KPIResult[]
    resources: KPIResult[]
    risk: KPIResult[]
  }
  trends: {
    improving: KPIResult[]
    declining: KPIResult[]
    stable: KPIResult[]
  }
  alerts: {
    critical: KPIResult[]
    warning: KPIResult[]
  }
}

export class KPICalculationEngine {
  /**
   * حساب جميع مؤشرات الأداء الرئيسية
   */
  calculateAllKPIs(input: KPICalculationInput): KPIDashboard {
    const kpis: KPIResult[] = []

    // حساب المؤشرات المالية
    kpis.push(...this.calculateFinancialKPIs(input))
    
    // حساب مؤشرات الجدولة
    kpis.push(...this.calculateScheduleKPIs(input))
    
    // حساب مؤشرات الجودة
    kpis.push(...this.calculateQualityKPIs(input))
    
    // حساب مؤشرات الموارد
    kpis.push(...this.calculateResourceKPIs(input))
    
    // حساب مؤشرات المخاطر
    kpis.push(...this.calculateRiskKPIs(input))

    return this.organizeDashboard(kpis)
  }

  /**
   * حساب المؤشرات المالية
   */
  private calculateFinancialKPIs(input: KPICalculationInput): KPIResult[] {
    const { projects } = input
    const kpis: KPIResult[] = []

    // 1. العائد على الاستثمار (ROI)
    const roi = this.calculateROI(projects)
    kpis.push({
      id: 'roi',
      name: 'العائد على الاستثمار',
      nameEn: 'Return on Investment',
      value: roi,
      target: 15,
      unit: '%',
      trend: roi > 15 ? 'up' : roi < 10 ? 'down' : 'stable',
      status: this.getKPIStatus(roi, 15, 20, 10, 5),
      category: 'financial',
      description: 'نسبة العائد المحقق من الاستثمار في المشاريع',
      calculation: '(الأرباح - التكلفة) / التكلفة × 100',
      lastUpdated: new Date().toISOString()
    })

    // 2. دقة الميزانية
    const budgetAccuracy = this.calculateBudgetAccuracy(projects)
    kpis.push({
      id: 'budget_accuracy',
      name: 'دقة الميزانية',
      nameEn: 'Budget Accuracy',
      value: budgetAccuracy,
      target: 95,
      unit: '%',
      trend: budgetAccuracy > 95 ? 'up' : budgetAccuracy < 85 ? 'down' : 'stable',
      status: this.getKPIStatus(budgetAccuracy, 95, 98, 90, 80),
      category: 'financial',
      description: 'دقة تقدير الميزانية مقارنة بالتكلفة الفعلية',
      calculation: '(1 - |الميزانية المخططة - التكلفة الفعلية| / الميزانية المخططة) × 100',
      lastUpdated: new Date().toISOString()
    })

    // 3. هامش الربح
    const profitMargin = this.calculateProfitMargin(projects)
    kpis.push({
      id: 'profit_margin',
      name: 'هامش الربح',
      nameEn: 'Profit Margin',
      value: profitMargin,
      target: 20,
      unit: '%',
      trend: profitMargin > 20 ? 'up' : profitMargin < 15 ? 'down' : 'stable',
      status: this.getKPIStatus(profitMargin, 20, 25, 15, 10),
      category: 'financial',
      description: 'نسبة الربح من إجمالي الإيرادات',
      calculation: '(الإيرادات - التكاليف) / الإيرادات × 100',
      lastUpdated: new Date().toISOString()
    })

    // 4. مؤشر أداء التكلفة (CPI)
    if (input.evmMetrics && input.evmMetrics.length > 0) {
      const avgCPI = input.evmMetrics.reduce((sum, evm) => sum + evm.costPerformanceIndex, 0) / input.evmMetrics.length
      kpis.push({
        id: 'cpi',
        name: 'مؤشر أداء التكلفة',
        nameEn: 'Cost Performance Index',
        value: avgCPI,
        target: 1.0,
        unit: '',
        trend: avgCPI > 1.0 ? 'up' : avgCPI < 0.95 ? 'down' : 'stable',
        status: this.getKPIStatus(avgCPI, 1.0, 1.1, 0.95, 0.85),
        category: 'financial',
        description: 'كفاءة استخدام الميزانية في المشاريع',
        calculation: 'القيمة المكتسبة / التكلفة الفعلية',
        lastUpdated: new Date().toISOString()
      })
    }

    return kpis
  }

  /**
   * حساب مؤشرات الجدولة
   */
  private calculateScheduleKPIs(input: KPICalculationInput): KPIResult[] {
    const { projects, tasks } = input
    const kpis: KPIResult[] = []

    // 1. التسليم في الوقت المحدد
    const onTimeDelivery = this.calculateOnTimeDelivery(projects)
    kpis.push({
      id: 'on_time_delivery',
      name: 'التسليم في الوقت المحدد',
      nameEn: 'On-Time Delivery',
      value: onTimeDelivery,
      target: 90,
      unit: '%',
      trend: onTimeDelivery > 90 ? 'up' : onTimeDelivery < 80 ? 'down' : 'stable',
      status: this.getKPIStatus(onTimeDelivery, 90, 95, 85, 75),
      category: 'schedule',
      description: 'نسبة المشاريع المسلمة في الوقت المحدد',
      calculation: 'عدد المشاريع المسلمة في الوقت / إجمالي المشاريع المكتملة × 100',
      lastUpdated: new Date().toISOString()
    })

    // 2. مؤشر أداء الجدولة (SPI)
    if (input.evmMetrics && input.evmMetrics.length > 0) {
      const avgSPI = input.evmMetrics.reduce((sum, evm) => sum + evm.schedulePerformanceIndex, 0) / input.evmMetrics.length
      kpis.push({
        id: 'spi',
        name: 'مؤشر أداء الجدولة',
        nameEn: 'Schedule Performance Index',
        value: avgSPI,
        target: 1.0,
        unit: '',
        trend: avgSPI > 1.0 ? 'up' : avgSPI < 0.95 ? 'down' : 'stable',
        status: this.getKPIStatus(avgSPI, 1.0, 1.1, 0.95, 0.85),
        category: 'schedule',
        description: 'كفاءة تنفيذ الجدولة الزمنية',
        calculation: 'القيمة المكتسبة / القيمة المخططة',
        lastUpdated: new Date().toISOString()
      })
    }

    // 3. متوسط وقت الدورة
    const cycleTime = this.calculateAverageCycleTime(projects)
    kpis.push({
      id: 'cycle_time',
      name: 'متوسط وقت الدورة',
      nameEn: 'Average Cycle Time',
      value: cycleTime,
      target: 60,
      unit: 'يوم',
      trend: cycleTime < 60 ? 'up' : cycleTime > 75 ? 'down' : 'stable',
      status: this.getKPIStatus(cycleTime, 60, 45, 75, 90, true), // true = lower is better
      category: 'schedule',
      description: 'متوسط الوقت المطلوب لإكمال المشاريع',
      calculation: 'مجموع أوقات إكمال المشاريع / عدد المشاريع المكتملة',
      lastUpdated: new Date().toISOString()
    })

    return kpis
  }

  /**
   * حساب مؤشرات الجودة
   */
  private calculateQualityKPIs(input: KPICalculationInput): KPIResult[] {
    const { projects, tasks } = input
    const kpis: KPIResult[] = []

    // 1. رضا العملاء
    const customerSatisfaction = this.calculateCustomerSatisfaction(projects)
    kpis.push({
      id: 'customer_satisfaction',
      name: 'رضا العملاء',
      nameEn: 'Customer Satisfaction',
      value: customerSatisfaction,
      target: 4.5,
      unit: '/5',
      trend: customerSatisfaction > 4.5 ? 'up' : customerSatisfaction < 4.0 ? 'down' : 'stable',
      status: this.getKPIStatus(customerSatisfaction, 4.5, 4.8, 4.0, 3.5),
      category: 'quality',
      description: 'متوسط تقييم رضا العملاء عن المشاريع',
      calculation: 'مجموع تقييمات العملاء / عدد التقييمات',
      lastUpdated: new Date().toISOString()
    })

    // 2. معدل إعادة العمل
    const reworkRate = this.calculateReworkRate(tasks)
    kpis.push({
      id: 'rework_rate',
      name: 'معدل إعادة العمل',
      nameEn: 'Rework Rate',
      value: reworkRate,
      target: 5,
      unit: '%',
      trend: reworkRate < 5 ? 'up' : reworkRate > 10 ? 'down' : 'stable',
      status: this.getKPIStatus(reworkRate, 5, 3, 8, 15, true),
      category: 'quality',
      description: 'نسبة المهام التي تحتاج إعادة عمل',
      calculation: 'عدد المهام المعاد عملها / إجمالي المهام × 100',
      lastUpdated: new Date().toISOString()
    })

    // 3. الصحيح من المرة الأولى
    const firstTimeRight = this.calculateFirstTimeRight(tasks)
    kpis.push({
      id: 'first_time_right',
      name: 'الصحيح من المرة الأولى',
      nameEn: 'First Time Right',
      value: firstTimeRight,
      target: 95,
      unit: '%',
      trend: firstTimeRight > 95 ? 'up' : firstTimeRight < 90 ? 'down' : 'stable',
      status: this.getKPIStatus(firstTimeRight, 95, 98, 90, 85),
      category: 'quality',
      description: 'نسبة المهام المنجزة بشكل صحيح من المرة الأولى',
      calculation: '(إجمالي المهام - المهام المعاد عملها) / إجمالي المهام × 100',
      lastUpdated: new Date().toISOString()
    })

    return kpis
  }

  /**
   * حساب مؤشرات الموارد
   */
  private calculateResourceKPIs(input: KPICalculationInput): KPIResult[] {
    const { projects, tasks } = input
    const kpis: KPIResult[] = []

    // 1. استخدام الموارد
    const resourceUtilization = this.calculateResourceUtilization(projects)
    kpis.push({
      id: 'resource_utilization',
      name: 'استخدام الموارد',
      nameEn: 'Resource Utilization',
      value: resourceUtilization,
      target: 85,
      unit: '%',
      trend: resourceUtilization > 85 ? 'up' : resourceUtilization < 75 ? 'down' : 'stable',
      status: this.getKPIStatus(resourceUtilization, 85, 90, 80, 70),
      category: 'resources',
      description: 'نسبة استخدام الموارد المتاحة',
      calculation: 'الموارد المستخدمة / إجمالي الموارد المتاحة × 100',
      lastUpdated: new Date().toISOString()
    })

    // 2. الإنتاجية
    const productivity = this.calculateProductivity(tasks)
    kpis.push({
      id: 'productivity',
      name: 'الإنتاجية',
      nameEn: 'Productivity',
      value: productivity,
      target: 100,
      unit: '%',
      trend: productivity > 100 ? 'up' : productivity < 90 ? 'down' : 'stable',
      status: this.getKPIStatus(productivity, 100, 110, 95, 85),
      category: 'resources',
      description: 'مؤشر إنتاجية الفريق',
      calculation: 'المهام المكتملة الفعلية / المهام المخططة × 100',
      lastUpdated: new Date().toISOString()
    })

    // 3. كفاءة المهارات
    const skillEfficiency = this.calculateSkillEfficiency(projects)
    kpis.push({
      id: 'skill_efficiency',
      name: 'كفاءة المهارات',
      nameEn: 'Skill Efficiency',
      value: skillEfficiency,
      target: 90,
      unit: '%',
      trend: skillEfficiency > 90 ? 'up' : skillEfficiency < 80 ? 'down' : 'stable',
      status: this.getKPIStatus(skillEfficiency, 90, 95, 85, 75),
      category: 'resources',
      description: 'مدى توافق مهارات الفريق مع متطلبات المشاريع',
      calculation: 'المهارات المطلوبة المتوفرة / إجمالي المهارات المطلوبة × 100',
      lastUpdated: new Date().toISOString()
    })

    return kpis
  }

  /**
   * حساب مؤشرات المخاطر
   */
  private calculateRiskKPIs(input: KPICalculationInput): KPIResult[] {
    const { projects } = input
    const kpis: KPIResult[] = []

    // 1. التعرض للمخاطر
    const riskExposure = this.calculateRiskExposure(projects)
    kpis.push({
      id: 'risk_exposure',
      name: 'التعرض للمخاطر',
      nameEn: 'Risk Exposure',
      value: riskExposure,
      target: 20,
      unit: '%',
      trend: riskExposure < 20 ? 'up' : riskExposure > 30 ? 'down' : 'stable',
      status: this.getKPIStatus(riskExposure, 20, 15, 25, 35, true),
      category: 'risk',
      description: 'نسبة التعرض للمخاطر في المحفظة',
      calculation: 'قيمة المخاطر المحتملة / إجمالي قيمة المحفظة × 100',
      lastUpdated: new Date().toISOString()
    })

    // 2. فعالية تخفيف المخاطر
    const riskMitigation = this.calculateRiskMitigation(projects)
    kpis.push({
      id: 'risk_mitigation',
      name: 'فعالية تخفيف المخاطر',
      nameEn: 'Risk Mitigation Effectiveness',
      value: riskMitigation,
      target: 80,
      unit: '%',
      trend: riskMitigation > 80 ? 'up' : riskMitigation < 70 ? 'down' : 'stable',
      status: this.getKPIStatus(riskMitigation, 80, 90, 75, 65),
      category: 'risk',
      description: 'فعالية إجراءات تخفيف المخاطر',
      calculation: 'المخاطر المخففة بنجاح / إجمالي المخاطر المحددة × 100',
      lastUpdated: new Date().toISOString()
    })

    // 3. سرعة حل القضايا
    const issueResolution = this.calculateIssueResolution(projects)
    kpis.push({
      id: 'issue_resolution',
      name: 'سرعة حل القضايا',
      nameEn: 'Issue Resolution Speed',
      value: issueResolution,
      target: 5,
      unit: 'أيام',
      trend: issueResolution < 5 ? 'up' : issueResolution > 7 ? 'down' : 'stable',
      status: this.getKPIStatus(issueResolution, 5, 3, 7, 10, true),
      category: 'risk',
      description: 'متوسط الوقت المطلوب لحل القضايا',
      calculation: 'مجموع أوقات حل القضايا / عدد القضايا المحلولة',
      lastUpdated: new Date().toISOString()
    })

    return kpis
  }

  /**
   * تنظيم لوحة المعلومات
   */
  private organizeDashboard(kpis: KPIResult[]): KPIDashboard {
    const summary = {
      totalKPIs: kpis.length,
      excellentKPIs: kpis.filter(k => k.status === 'excellent').length,
      goodKPIs: kpis.filter(k => k.status === 'good').length,
      warningKPIs: kpis.filter(k => k.status === 'warning').length,
      criticalKPIs: kpis.filter(k => k.status === 'critical').length
    }

    const categories = {
      financial: kpis.filter(k => k.category === 'financial'),
      schedule: kpis.filter(k => k.category === 'schedule'),
      quality: kpis.filter(k => k.category === 'quality'),
      resources: kpis.filter(k => k.category === 'resources'),
      risk: kpis.filter(k => k.category === 'risk')
    }

    const trends = {
      improving: kpis.filter(k => k.trend === 'up'),
      declining: kpis.filter(k => k.trend === 'down'),
      stable: kpis.filter(k => k.trend === 'stable')
    }

    const alerts = {
      critical: kpis.filter(k => k.status === 'critical'),
      warning: kpis.filter(k => k.status === 'warning')
    }

    return {
      summary,
      categories,
      trends,
      alerts
    }
  }

  /**
   * تحديد حالة المؤشر
   */
  private getKPIStatus(
    value: number, 
    target: number, 
    excellent: number, 
    warning: number, 
    critical: number,
    lowerIsBetter = false
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    if (lowerIsBetter) {
      if (value <= excellent) return 'excellent'
      if (value <= target) return 'good'
      if (value <= warning) return 'warning'
      return 'critical'
    } else {
      if (value >= excellent) return 'excellent'
      if (value >= target) return 'good'
      if (value >= warning) return 'warning'
      return 'critical'
    }
  }

  // طرق الحساب المساعدة - تنفيذ مؤقت
  private calculateROI(projects: EnhancedProject[]): number {
    // حساب مؤقت
    return 15.5
  }

  private calculateBudgetAccuracy(projects: EnhancedProject[]): number {
    if (projects.length === 0) return 0
    
    const accuracies = projects.map(project => {
      const variance = Math.abs(project.budget.total - project.budget.spent)
      return (1 - variance / project.budget.total) * 100
    })
    
    return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
  }

  private calculateProfitMargin(projects: EnhancedProject[]): number {
    // حساب مؤقت
    return 18.5
  }

  private calculateOnTimeDelivery(projects: EnhancedProject[]): number {
    const completedProjects = projects.filter(p => p.status === 'completed')
    if (completedProjects.length === 0) return 0
    
    const onTimeProjects = completedProjects.filter(project => {
      // تحقق من التسليم في الوقت المحدد
      return new Date(project.actualEndDate || project.endDate) <= new Date(project.endDate)
    })
    
    return (onTimeProjects.length / completedProjects.length) * 100
  }

  private calculateAverageCycleTime(projects: EnhancedProject[]): number {
    const completedProjects = projects.filter(p => p.status === 'completed')
    if (completedProjects.length === 0) return 0
    
    const cycleTimes = completedProjects.map(project => {
      const start = new Date(project.startDate)
      const end = new Date(project.actualEndDate || project.endDate)
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    })
    
    return cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length
  }

  private calculateCustomerSatisfaction(projects: EnhancedProject[]): number {
    // حساب مؤقت - سيتم ربطه بنظام التقييمات لاحقاً
    return 4.2
  }

  private calculateReworkRate(tasks: Task[]): number {
    // حساب مؤقت - سيتم تطويره عند إضافة تتبع إعادة العمل
    return 8.5
  }

  private calculateFirstTimeRight(tasks: Task[]): number {
    // حساب مؤقت
    return 91.5
  }

  private calculateResourceUtilization(projects: EnhancedProject[]): number {
    // حساب مؤقت
    return 87
  }

  private calculateProductivity(tasks: Task[]): number {
    if (tasks.length === 0) return 0
    
    const completedTasks = tasks.filter(t => t.status === 'completed')
    const plannedTasks = tasks.length
    
    return (completedTasks.length / plannedTasks) * 100
  }

  private calculateSkillEfficiency(projects: EnhancedProject[]): number {
    // حساب مؤقت
    return 85
  }

  private calculateRiskExposure(projects: EnhancedProject[]): number {
    // حساب مؤقت
    return 15
  }

  private calculateRiskMitigation(projects: EnhancedProject[]): number {
    // حساب مؤقت
    return 78
  }

  private calculateIssueResolution(projects: EnhancedProject[]): number {
    // حساب مؤقت
    return 5.2
  }

  /**
   * حساب مؤشرات الأداء للوحة المعلومات
   */
  async calculateDashboardKPIs(input: {
    projects: EnhancedProject[]
    tasks: any[]
    timeframe: {
      startDate: string
      endDate: string
    }
  }): Promise<KPIDashboard> {
    try {
      if (input.projects.length === 0) {
        return {
          summary: {
            totalKPIs: 0,
            excellentKPIs: 0,
            goodKPIs: 0,
            warningKPIs: 0,
            criticalKPIs: 0
          },
          categories: {
            financial: [],
            schedule: [],
            quality: [],
            resources: [],
            risk: []
          },
          trends: {}
        }
      }

      const kpiInput: KPICalculationInput = {
        projects: input.projects,
        tasks: input.tasks,
        timeframe: input.timeframe
      }

      return this.calculateAllKPIs(kpiInput)
    } catch (error) {
      console.error('خطأ في حساب مؤشرات الأداء:', error)
      throw new Error('فشل في حساب مؤشرات الأداء')
    }
  }

  /**
   * حساب مؤشرات الأداء لمشروع محدد
   */
  async calculateProjectKPIs(input: {
    project: EnhancedProject
    tasks: any[]
    timeframe: {
      startDate: string
      endDate: string
    }
  }): Promise<KPIResult[]> {
    try {
      const kpiInput: KPICalculationInput = {
        projects: [input.project],
        tasks: input.tasks,
        timeframe: input.timeframe
      }

      const dashboard = this.calculateAllKPIs(kpiInput)

      // جمع جميع مؤشرات الأداء من جميع الفئات
      const allKPIs = [
        ...dashboard.categories.financial,
        ...dashboard.categories.schedule,
        ...dashboard.categories.quality,
        ...dashboard.categories.resources,
        ...dashboard.categories.risk
      ]

      return allKPIs
    } catch (error) {
      console.error('خطأ في حساب مؤشرات أداء المشروع:', error)
      return []
    }
  }

  /**
   * تحليل الاتجاهات
   */
  async calculateTrendAnalysis(input: {
    projects: EnhancedProject[]
    timeframe: {
      startDate: string
      endDate: string
    }
    period: 'weekly' | 'monthly' | 'quarterly'
  }): Promise<{
    periods: string[]
    metrics: Record<string, number[]>
    insights: string[]
  }> {
    try {
      // تحليل مؤقت للاتجاهات
      const periods = this.generatePeriods(input.timeframe, input.period)

      const metrics = {
        budget_utilization: periods.map(() => Math.random() * 100),
        schedule_performance: periods.map(() => Math.random() * 100),
        quality_score: periods.map(() => Math.random() * 100)
      }

      const insights = [
        'تحسن في الأداء المالي خلال الفترة الأخيرة',
        'انخفاض طفيف في الأداء الزمني',
        'استقرار في مؤشرات الجودة'
      ]

      return {
        periods,
        metrics,
        insights
      }
    } catch (error) {
      console.error('خطأ في تحليل الاتجاهات:', error)
      return {
        periods: [],
        metrics: {},
        insights: []
      }
    }
  }

  private generatePeriods(timeframe: { startDate: string; endDate: string }, period: string): string[] {
    const start = new Date(timeframe.startDate)
    const end = new Date(timeframe.endDate)
    const periods: string[] = []

    const current = new Date(start)
    while (current <= end) {
      switch (period) {
        case 'weekly':
          periods.push(`أسبوع ${Math.ceil((current.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`)
          current.setDate(current.getDate() + 7)
          break
        case 'monthly':
          periods.push(current.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }))
          current.setMonth(current.getMonth() + 1)
          break
        case 'quarterly':
          const quarter = Math.floor(current.getMonth() / 3) + 1
          periods.push(`الربع ${quarter} - ${current.getFullYear()}`)
          current.setMonth(current.getMonth() + 3)
          break
      }

      // تجنب الحلقة اللانهائية
      if (periods.length > 50) break
    }

    return periods
  }
}

export const kpiCalculationEngine = new KPICalculationEngine()
