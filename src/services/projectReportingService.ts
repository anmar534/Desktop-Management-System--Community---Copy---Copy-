/**
 * Project Reporting Service
 * خدمة تقارير المشاريع المتقدمة
 */

import { enhancedProjectService } from './enhancedProjectService'
import { taskManagementService } from './taskManagementService'
import { earnedValueCalculator } from './earnedValueCalculator'
import { costTrackingService } from './costTrackingService'
import { EnhancedProject } from '../types/projects'
import { Task } from '../types/tasks'
import { EVMMetrics, EVMReport } from '../types/evm'

export interface ProjectStatusReport {
  projectId: string
  projectName: string
  reportDate: string
  
  // الملخص التنفيذي
  executiveSummary: {
    overallStatus: 'on_track' | 'at_risk' | 'delayed' | 'critical'
    completionPercentage: number
    daysRemaining: number
    budgetUtilization: number
    keyAchievements: string[]
    majorChallenges: string[]
    nextSteps: string[]
  }
  
  // تفاصيل الأداء
  performance: {
    schedule: {
      plannedProgress: number
      actualProgress: number
      variance: number
      criticalPath: string[]
    }
    budget: {
      totalBudget: number
      spentToDate: number
      remainingBudget: number
      forecastAtCompletion: number
    }
    quality: {
      defectRate: number
      reworkPercentage: number
      customerSatisfaction: number
    }
  }
  
  // المخاطر والقضايا
  risksAndIssues: {
    activeRisks: number
    resolvedRisks: number
    openIssues: number
    criticalIssues: number
  }
  
  // الموارد
  resources: {
    teamSize: number
    utilization: number
    skillGaps: string[]
    trainingNeeds: string[]
  }
}

export interface ProjectDashboardData {
  projectsOverview: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    delayedProjects: number
    onBudgetProjects: number
    overBudgetProjects: number
  }
  
  performanceMetrics: {
    averageCompletionRate: number
    averageBudgetUtilization: number
    averageSchedulePerformance: number
    customerSatisfactionScore: number
  }
  
  financialSummary: {
    totalPortfolioValue: number
    totalSpent: number
    totalRemaining: number
    projectedOverrun: number
  }
  
  resourceUtilization: {
    totalResources: number
    utilizedResources: number
    availableResources: number
    overallocatedResources: number
  }
  
  topPerformingProjects: {
    projectId: string
    projectName: string
    completionRate: number
    budgetPerformance: number
    schedulePerformance: number
  }[]
  
  projectsAtRisk: {
    projectId: string
    projectName: string
    riskLevel: 'high' | 'medium' | 'low'
    primaryRisk: string
    mitigationPlan: string
  }[]
}

export interface KPIMetrics {
  // مؤشرات الأداء المالي
  financial: {
    roi: number // العائد على الاستثمار
    npv: number // صافي القيمة الحالية
    paybackPeriod: number // فترة الاسترداد
    profitMargin: number // هامش الربح
    costVariance: number // انحراف التكلفة
    budgetAccuracy: number // دقة الميزانية
  }
  
  // مؤشرات الأداء الزمني
  schedule: {
    scheduleVariance: number // انحراف الجدولة
    schedulePerformanceIndex: number // مؤشر أداء الجدولة
    onTimeDelivery: number // التسليم في الوقت المحدد
    cycleTime: number // وقت الدورة
    leadTime: number // وقت التنفيذ
  }
  
  // مؤشرات الجودة
  quality: {
    defectDensity: number // كثافة العيوب
    customerSatisfaction: number // رضا العملاء
    reworkRate: number // معدل إعادة العمل
    firstTimeRight: number // الصحيح من المرة الأولى
    qualityScore: number // نقاط الجودة
  }
  
  // مؤشرات الموارد
  resources: {
    resourceUtilization: number // استخدام الموارد
    productivity: number // الإنتاجية
    skillEfficiency: number // كفاءة المهارات
    teamSatisfaction: number // رضا الفريق
    turnoverRate: number // معدل دوران الموظفين
  }
  
  // مؤشرات المخاطر
  risk: {
    riskExposure: number // التعرض للمخاطر
    riskMitigation: number // تخفيف المخاطر
    issueResolution: number // حل القضايا
    contingencyUtilization: number // استخدام الطوارئ
  }
}

export class ProjectReportingService {
  /**
   * إنشاء تقرير حالة المشروع
   */
  async generateProjectStatusReport(projectId: string): Promise<ProjectStatusReport> {
    try {
      const project = await enhancedProjectService.getProjectById(projectId)
      if (!project) {
        throw new Error('المشروع غير موجود')
      }

      const tasks = await taskManagementService.getProjectTasks(projectId)
      const taskStats = await taskManagementService.getTaskStatistics(projectId)
      const costData = await costTrackingService.getProjectTotalCost(projectId)

      // حساب الملخص التنفيذي
      const executiveSummary = this.calculateExecutiveSummary(project, tasks, taskStats)
      
      // حساب تفاصيل الأداء
      const performance = this.calculatePerformanceMetrics(project, tasks, costData)
      
      // تحليل المخاطر والقضايا
      const risksAndIssues = this.analyzeRisksAndIssues(project, tasks)
      
      // تحليل الموارد
      const resources = this.analyzeResources(project, tasks)

      return {
        projectId,
        projectName: project.name,
        reportDate: new Date().toISOString(),
        executiveSummary,
        performance,
        risksAndIssues,
        resources
      }
    } catch (error) {
      console.error('خطأ في إنشاء تقرير حالة المشروع:', error)
      throw new Error('فشل في إنشاء تقرير حالة المشروع')
    }
  }

  /**
   * إنشاء تقرير EVM
   */
  async generateEVMReport(projectId: string): Promise<EVMReport> {
    try {
      const project = await enhancedProjectService.getProjectById(projectId)
      if (!project) {
        throw new Error('المشروع غير موجود')
      }

      const tasks = await taskManagementService.getProjectTasks(projectId)
      const costEntries = await costTrackingService.getAllCostEntries(projectId)

      // تحضير بيانات EVM
      const evmInput = {
        projectId,
        statusDate: new Date().toISOString(),
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          plannedValue: task.estimatedCost,
          earnedValue: task.actualCost * (task.progress / 100),
          actualCost: task.actualCost,
          percentComplete: task.progress,
          plannedStartDate: task.plannedStartDate,
          plannedEndDate: task.plannedEndDate,
          actualStartDate: task.actualStartDate,
          actualEndDate: task.actualEndDate,
          weight: task.estimatedCost / project.budget.total
        })),
        totalBudget: project.budget.total,
        plannedStartDate: project.startDate,
        plannedEndDate: project.endDate
      }

      // حساب مقاييس EVM
      const metrics = earnedValueCalculator.calculateEVMMetrics(evmInput)
      
      // تحليل الانحرافات
      const varianceAnalysis = earnedValueCalculator.analyzeVariances(
        projectId, 
        metrics, 
        evmInput.tasks, 
        costEntries
      )

      return {
        projectId,
        projectName: project.name,
        reportDate: new Date().toISOString(),
        period: {
          startDate: project.startDate,
          endDate: new Date().toISOString()
        },
        executiveSummary: {
          overallHealth: this.determineProjectHealth(metrics),
          keyFindings: this.generateKeyFindings(metrics),
          recommendations: this.generateRecommendations(metrics),
          riskLevel: this.assessRiskLevel(metrics)
        },
        currentMetrics: metrics,
        trends: [], // سيتم تطويرها لاحقاً
        forecasts: earnedValueCalculator.calculateForecasts(metrics, []),
        analysis: {
          costAnalysis: {
            status: metrics.costVariance >= 0 ? 'under_budget' : 'over_budget',
            variance: metrics.costVariance,
            variantPercentage: (metrics.costVariance / metrics.budgetAtCompletion) * 100,
            majorCostDrivers: []
          },
          scheduleAnalysis: {
            status: metrics.scheduleVariance >= 0 ? 'ahead_of_schedule' : 'behind_schedule',
            variance: metrics.scheduleVariance,
            varianceDays: this.calculateVarianceDays(metrics.scheduleVariance, project),
            criticalPath: []
          },
          performanceAnalysis: {
            efficiency: metrics.costPerformanceIndex,
            productivity: metrics.schedulePerformanceIndex,
            qualityMetrics: []
          }
        },
        risks: [],
        recommendations: []
      }
    } catch (error) {
      console.error('خطأ في إنشاء تقرير EVM:', error)
      throw new Error('فشل في إنشاء تقرير EVM')
    }
  }

  /**
   * إنشاء لوحة معلومات المشاريع
   */
  async generateProjectsDashboard(): Promise<ProjectDashboardData> {
    try {
      const allProjects = await enhancedProjectService.getAllProjects()
      
      // نظرة عامة على المشاريع
      const projectsOverview = this.calculateProjectsOverview(allProjects)
      
      // مقاييس الأداء
      const performanceMetrics = await this.calculatePerformanceMetrics(allProjects)
      
      // الملخص المالي
      const financialSummary = this.calculateFinancialSummary(allProjects)
      
      // استخدام الموارد
      const resourceUtilization = await this.calculateResourceUtilization(allProjects)
      
      // أفضل المشاريع أداءً
      const topPerformingProjects = await this.getTopPerformingProjects(allProjects)
      
      // المشاريع المعرضة للخطر
      const projectsAtRisk = await this.getProjectsAtRisk(allProjects)

      return {
        projectsOverview,
        performanceMetrics,
        financialSummary,
        resourceUtilization,
        topPerformingProjects,
        projectsAtRisk
      }
    } catch (error) {
      console.error('خطأ في إنشاء لوحة معلومات المشاريع:', error)
      throw new Error('فشل في إنشاء لوحة معلومات المشاريع')
    }
  }

  /**
   * حساب مؤشرات الأداء الرئيسية
   */
  async calculateKPIs(projectId?: string): Promise<KPIMetrics> {
    try {
      const projects = projectId 
        ? [await enhancedProjectService.getProjectById(projectId)].filter(Boolean)
        : await enhancedProjectService.getAllProjects()

      if (projects.length === 0) {
        throw new Error('لا توجد مشاريع للتحليل')
      }

      // حساب المؤشرات المالية
      const financial = await this.calculateFinancialKPIs(projects)
      
      // حساب مؤشرات الجدولة
      const schedule = await this.calculateScheduleKPIs(projects)
      
      // حساب مؤشرات الجودة
      const quality = await this.calculateQualityKPIs(projects)
      
      // حساب مؤشرات الموارد
      const resources = await this.calculateResourceKPIs(projects)
      
      // حساب مؤشرات المخاطر
      const risk = await this.calculateRiskKPIs(projects)

      return {
        financial,
        schedule,
        quality,
        resources,
        risk
      }
    } catch (error) {
      console.error('خطأ في حساب مؤشرات الأداء الرئيسية:', error)
      throw new Error('فشل في حساب مؤشرات الأداء الرئيسية')
    }
  }

  // الطرق المساعدة
  private calculateExecutiveSummary(project: EnhancedProject, tasks: Task[], taskStats: any) {
    const completionPercentage = taskStats.completionRate
    const overallStatus = this.determineOverallStatus(project, taskStats)
    
    return {
      overallStatus,
      completionPercentage,
      daysRemaining: this.calculateDaysRemaining(project.endDate),
      budgetUtilization: (project.budget.spent / project.budget.total) * 100,
      keyAchievements: this.extractKeyAchievements(tasks),
      majorChallenges: this.identifyMajorChallenges(tasks),
      nextSteps: this.generateNextSteps(tasks)
    }
  }

  private calculatePerformanceMetrics(project: EnhancedProject, tasks: Task[], costData: any) {
    return {
      schedule: {
        plannedProgress: this.calculatePlannedProgress(project),
        actualProgress: project.progress,
        variance: project.progress - this.calculatePlannedProgress(project),
        criticalPath: this.identifyCriticalPath(tasks)
      },
      budget: {
        totalBudget: project.budget.total,
        spentToDate: costData.approvedCost,
        remainingBudget: project.budget.total - costData.approvedCost,
        forecastAtCompletion: this.forecastFinalCost(project, costData)
      },
      quality: {
        defectRate: 0, // سيتم تطويرها لاحقاً
        reworkPercentage: 0,
        customerSatisfaction: 0
      }
    }
  }

  private analyzeRisksAndIssues(project: EnhancedProject, tasks: Task[]) {
    return {
      activeRisks: project.risks?.filter(r => r.status === 'active').length || 0,
      resolvedRisks: project.risks?.filter(r => r.status === 'resolved').length || 0,
      openIssues: 0, // سيتم تطويرها لاحقاً
      criticalIssues: 0
    }
  }

  private analyzeResources(project: EnhancedProject, tasks: Task[]) {
    return {
      teamSize: project.team?.members?.length || 0,
      utilization: 85, // سيتم حسابها لاحقاً
      skillGaps: [],
      trainingNeeds: []
    }
  }

  // طرق مساعدة إضافية
  private determineProjectHealth(metrics: EVMMetrics): 'excellent' | 'good' | 'warning' | 'critical' {
    if (metrics.costPerformanceIndex >= 0.95 && metrics.schedulePerformanceIndex >= 0.95) {
      return 'excellent'
    } else if (metrics.costPerformanceIndex >= 0.90 && metrics.schedulePerformanceIndex >= 0.90) {
      return 'good'
    } else if (metrics.costPerformanceIndex >= 0.80 || metrics.schedulePerformanceIndex >= 0.80) {
      return 'warning'
    } else {
      return 'critical'
    }
  }

  private generateKeyFindings(metrics: EVMMetrics): string[] {
    const findings: string[] = []
    
    if (metrics.costPerformanceIndex < 1) {
      findings.push(`تجاوز في التكلفة بنسبة ${((1 - metrics.costPerformanceIndex) * 100).toFixed(1)}%`)
    }
    
    if (metrics.schedulePerformanceIndex < 1) {
      findings.push(`تأخير في الجدولة بنسبة ${((1 - metrics.schedulePerformanceIndex) * 100).toFixed(1)}%`)
    }
    
    return findings
  }

  private generateRecommendations(metrics: EVMMetrics): string[] {
    const recommendations: string[] = []
    
    if (metrics.costPerformanceIndex < 0.9) {
      recommendations.push('مراجعة فورية للتكاليف وتطبيق إجراءات توفير')
    }
    
    if (metrics.schedulePerformanceIndex < 0.9) {
      recommendations.push('إعادة تخصيص الموارد للمهام الحرجة')
    }
    
    return recommendations
  }

  private assessRiskLevel(metrics: EVMMetrics): 'low' | 'medium' | 'high' | 'critical' {
    if (metrics.costPerformanceIndex < 0.8 || metrics.schedulePerformanceIndex < 0.8) {
      return 'critical'
    } else if (metrics.costPerformanceIndex < 0.9 || metrics.schedulePerformanceIndex < 0.9) {
      return 'high'
    } else if (metrics.costPerformanceIndex < 0.95 || metrics.schedulePerformanceIndex < 0.95) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  private calculateVarianceDays(scheduleVariance: number, project: EnhancedProject): number {
    // تحويل انحراف الجدولة إلى أيام
    const totalDuration = new Date(project.endDate).getTime() - new Date(project.startDate).getTime()
    const totalDays = totalDuration / (1000 * 60 * 60 * 24)
    return Math.round((scheduleVariance / project.budget.total) * totalDays)
  }

  // طرق مساعدة أخرى - تنفيذ مؤقت
  private determineOverallStatus(project: EnhancedProject, taskStats: any): 'on_track' | 'at_risk' | 'delayed' | 'critical' {
    if (taskStats.completionRate >= 90) return 'on_track'
    if (taskStats.overdueTasks > 5) return 'critical'
    if (taskStats.overdueTasks > 0) return 'delayed'
    return 'at_risk'
  }

  private calculateDaysRemaining(endDate: string): number {
    const end = new Date(endDate)
    const today = new Date()
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  private calculatePlannedProgress(project: EnhancedProject): number {
    const start = new Date(project.startDate)
    const end = new Date(project.endDate)
    const today = new Date()
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = today.getTime() - start.getTime()
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
  }

  private extractKeyAchievements(tasks: Task[]): string[] {
    return tasks
      .filter(task => task.status === 'completed')
      .slice(0, 5)
      .map(task => `إكمال ${task.title}`)
  }

  private identifyMajorChallenges(tasks: Task[]): string[] {
    return tasks
      .filter(task => task.status === 'on_hold' || this.isOverdue(task))
      .slice(0, 3)
      .map(task => `تأخير في ${task.title}`)
  }

  private generateNextSteps(tasks: Task[]): string[] {
    return tasks
      .filter(task => task.status === 'in_progress')
      .slice(0, 3)
      .map(task => `متابعة ${task.title}`)
  }

  private identifyCriticalPath(tasks: Task[]): string[] {
    // تنفيذ مؤقت - سيتم تطوير خوارزمية المسار الحرج لاحقاً
    return tasks
      .filter(task => task.priority === 'critical')
      .map(task => task.title)
  }

  private forecastFinalCost(project: EnhancedProject, costData: any): number {
    // تنفيذ مؤقت - توقع بسيط بناءً على الاتجاه الحالي
    const spentRatio = costData.approvedCost / project.budget.total
    const progressRatio = project.progress / 100
    
    if (progressRatio > 0) {
      return (costData.approvedCost / progressRatio)
    }
    
    return project.budget.total
  }

  private isOverdue(task: Task): boolean {
    const today = new Date()
    const endDate = new Date(task.plannedEndDate)
    return endDate < today && task.status !== 'completed'
  }

  // طرق حساب المؤشرات - تنفيذ مؤقت
  private async calculateFinancialKPIs(projects: EnhancedProject[]): Promise<KPIMetrics['financial']> {
    return {
      roi: 15.5,
      npv: 250000,
      paybackPeriod: 18,
      profitMargin: 12.3,
      costVariance: -25000,
      budgetAccuracy: 92.5
    }
  }

  private async calculateScheduleKPIs(projects: EnhancedProject[]): Promise<KPIMetrics['schedule']> {
    return {
      scheduleVariance: -5,
      schedulePerformanceIndex: 0.95,
      onTimeDelivery: 85,
      cycleTime: 45,
      leadTime: 60
    }
  }

  private async calculateQualityKPIs(projects: EnhancedProject[]): Promise<KPIMetrics['quality']> {
    return {
      defectDensity: 2.1,
      customerSatisfaction: 4.2,
      reworkRate: 8.5,
      firstTimeRight: 91.5,
      qualityScore: 88
    }
  }

  private async calculateResourceKPIs(projects: EnhancedProject[]): Promise<KPIMetrics['resources']> {
    return {
      resourceUtilization: 87,
      productivity: 92,
      skillEfficiency: 85,
      teamSatisfaction: 4.1,
      turnoverRate: 12
    }
  }

  private async calculateRiskKPIs(projects: EnhancedProject[]): Promise<KPIMetrics['risk']> {
    return {
      riskExposure: 15,
      riskMitigation: 78,
      issueResolution: 85,
      contingencyUtilization: 35
    }
  }

  // طرق لوحة المعلومات - تنفيذ مؤقت
  private calculateProjectsOverview(projects: EnhancedProject[]) {
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      delayedProjects: 0,
      onBudgetProjects: 0,
      overBudgetProjects: 0
    }
  }

  private async calculatePerformanceMetrics(projects: EnhancedProject[]) {
    return {
      averageCompletionRate: 75,
      averageBudgetUtilization: 68,
      averageSchedulePerformance: 85,
      customerSatisfactionScore: 4.2
    }
  }

  private calculateFinancialSummary(projects: EnhancedProject[]) {
    const totalValue = projects.reduce((sum, p) => sum + p.budget.total, 0)
    const totalSpent = projects.reduce((sum, p) => sum + p.budget.spent, 0)
    
    return {
      totalPortfolioValue: totalValue,
      totalSpent,
      totalRemaining: totalValue - totalSpent,
      projectedOverrun: 0
    }
  }

  private async calculateResourceUtilization(projects: EnhancedProject[]) {
    return {
      totalResources: 50,
      utilizedResources: 42,
      availableResources: 8,
      overallocatedResources: 3
    }
  }

  private async getTopPerformingProjects(projects: EnhancedProject[]) {
    return projects.slice(0, 5).map(p => ({
      projectId: p.id,
      projectName: p.name,
      completionRate: p.progress,
      budgetPerformance: 95,
      schedulePerformance: 90
    }))
  }

  private async getProjectsAtRisk(projects: EnhancedProject[]) {
    return projects
      .filter(p => p.progress < 50)
      .slice(0, 5)
      .map(p => ({
        projectId: p.id,
        projectName: p.name,
        riskLevel: 'medium' as const,
        primaryRisk: 'تأخير في الجدولة',
        mitigationPlan: 'إعادة تخصيص الموارد'
      }))
  }
}

export const projectReportingService = new ProjectReportingService()
