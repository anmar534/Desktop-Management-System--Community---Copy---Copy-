/**
 * Project Reporting Service Tests
 * اختبارات خدمة تقارير المشاريع
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { projectReportingService } from '../../src/services/projectReportingService'
import { EnhancedProject } from '../../src/types/projects'
import { EVMMetrics } from '../../src/types/evm'

// Mock dependencies
vi.mock('../../src/services/enhancedProjectService', () => ({
  enhancedProjectService: {
    getAllProjects: vi.fn(),
    getProjectById: vi.fn()
  }
}))

vi.mock('../../src/services/earnedValueCalculator', () => ({
  earnedValueCalculator: {
    calculateEVMMetrics: vi.fn(),
    analyzeTrends: vi.fn(),
    generateAlerts: vi.fn()
  }
}))

vi.mock('../../src/services/kpiCalculationEngine', () => ({
  kpiCalculationEngine: {
    calculateAllKPIs: vi.fn()
  }
}))

describe('ProjectReportingService', () => {
  const mockProject: EnhancedProject = {
    id: 'project-1',
    name: 'مشروع إنشاء مجمع سكني',
    nameEn: 'Residential Complex Project',
    description: 'مشروع إنشاء مجمع سكني متكامل',
    client: 'شركة التطوير العقاري',
    status: 'in_progress',
    priority: 'high',
    category: 'construction',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    location: 'الرياض',
    budget: {
      total: 10000000,
      spent: 4000000,
      remaining: 6000000,
      contingency: 1000000,
      currency: 'SAR'
    },
    team: {
      projectManager: 'أحمد محمد',
      members: [
        { id: 'user-1', name: 'فاطمة علي', role: 'developer', email: 'fatima@example.com' },
        { id: 'user-2', name: 'محمد سالم', role: 'designer', email: 'mohammed@example.com' }
      ]
    },
    phases: [
      {
        id: 'phase-1',
        name: 'التخطيط',
        description: 'مرحلة التخطيط والتصميم',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        status: 'completed',
        progress: 100,
        budget: 2000000,
        dependencies: []
      },
      {
        id: 'phase-2',
        name: 'التنفيذ',
        description: 'مرحلة التنفيذ والبناء',
        startDate: '2024-04-01',
        endDate: '2024-10-31',
        status: 'in_progress',
        progress: 60,
        budget: 6000000,
        dependencies: ['phase-1']
      }
    ],
    milestones: [
      {
        id: 'milestone-1',
        title: 'إنهاء التصميم',
        description: 'إنهاء جميع المخططات والتصاميم',
        targetDate: '2024-03-31',
        status: 'completed',
        progress: 100
      }
    ],
    risks: [
      {
        id: 'risk-1',
        title: 'تأخير في التراخيص',
        description: 'احتمالية تأخير في الحصول على التراخيص',
        probability: 'medium',
        impact: 'high',
        status: 'active',
        mitigation: 'متابعة مستمرة مع الجهات المختصة'
      }
    ],
    tags: ['إنشاءات', 'سكني'],
    metadata: {
      createdBy: 'user-1',
      lastModifiedBy: 'user-1',
      version: 1
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z'
  }

  const mockEVMMetrics: EVMMetrics = {
    plannedValue: 5000000,
    earnedValue: 4500000,
    actualCost: 4000000,
    budgetAtCompletion: 10000000,
    costVariance: 500000,
    scheduleVariance: -500000,
    costPerformanceIndex: 1.125,
    schedulePerformanceIndex: 0.9,
    estimateAtCompletion: 8888889,
    estimateToComplete: 4888889,
    varianceAtCompletion: 1111111,
    toCompletePerformanceIndex: 1.13,
    percentComplete: 45,
    percentPlanned: 50,
    statusDate: '2024-06-01',
    plannedCompletionDate: '2024-12-31',
    forecastCompletionDate: '2025-01-15'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    const { enhancedProjectService } = require('../../src/services/enhancedProjectService')
    const { earnedValueCalculator } = require('../../src/services/earnedValueCalculator')
    const { kpiCalculationEngine } = require('../../src/services/kpiCalculationEngine')

    enhancedProjectService.getAllProjects.mockResolvedValue([mockProject])
    enhancedProjectService.getProjectById.mockResolvedValue(mockProject)
    earnedValueCalculator.calculateEVMMetrics.mockReturnValue(mockEVMMetrics)
    earnedValueCalculator.analyzeTrends.mockReturnValue({
      costTrend: 'improving',
      scheduleTrend: 'declining',
      overallTrend: 'stable'
    })
    earnedValueCalculator.generateAlerts.mockReturnValue([])
    kpiCalculationEngine.calculateAllKPIs.mockReturnValue({
      financial: { roi: 15, budgetAccuracy: 95, profitMargin: 20, cpi: 1.125 },
      schedule: { onTimeDelivery: 80, spi: 0.9, cycleTime: 365 },
      quality: { customerSatisfaction: 90, reworkRate: 5, firstTimeRight: 85 },
      resource: { utilization: 85, productivity: 110, skillEfficiency: 90 },
      risk: { exposure: 25, mitigationEffectiveness: 80, issueResolution: 75 }
    })
  })

  describe('generateProjectStatusReport', () => {
    it('should generate comprehensive project status report', async () => {
      const report = await projectReportingService.generateProjectStatusReport('project-1')

      expect(report).toBeDefined()
      expect(report.projectId).toBe('project-1')
      expect(report.projectName).toBe('مشروع إنشاء مجمع سكني')
      expect(report.reportDate).toBeDefined()
      expect(report.reportType).toBe('status')

      // التحقق من الملخص التنفيذي
      expect(report.executiveSummary).toBeDefined()
      expect(report.executiveSummary.overallStatus).toBe('in_progress')
      expect(report.executiveSummary.completionPercentage).toBe(45)
      expect(report.executiveSummary.budgetUtilization).toBe(40) // 4M / 10M
      expect(report.executiveSummary.schedulePerformance).toBe('behind')

      // التحقق من أداء المشروع
      expect(report.performance).toBeDefined()
      expect(report.performance.costPerformance).toBe('ahead')
      expect(report.performance.schedulePerformance).toBe('behind')
      expect(report.performance.qualityMetrics).toBeDefined()

      // التحقق من المخاطر
      expect(report.risks).toBeDefined()
      expect(report.risks.activeRisks).toHaveLength(1)
      expect(report.risks.riskLevel).toBe('medium')

      // التحقق من الموارد
      expect(report.resources).toBeDefined()
      expect(report.resources.teamSize).toBe(2)
      expect(report.resources.budgetStatus).toBeDefined()
    })

    it('should handle project not found', async () => {
      const { enhancedProjectService } = require('../../src/services/enhancedProjectService')
      enhancedProjectService.getProjectById.mockResolvedValue(null)

      await expect(
        projectReportingService.generateProjectStatusReport('non-existent')
      ).rejects.toThrow('المشروع غير موجود')
    })

    it('should calculate correct performance indicators', async () => {
      const report = await projectReportingService.generateProjectStatusReport('project-1')

      expect(report.performance.costPerformance).toBe('ahead') // CPI > 1
      expect(report.performance.schedulePerformance).toBe('behind') // SPI < 1
      expect(report.performance.overallHealth).toBe('good')
    })

    it('should identify critical issues', async () => {
      // Mock project with critical issues
      const criticalProject = {
        ...mockProject,
        status: 'at_risk',
        budget: { ...mockProject.budget, spent: 9000000 } // 90% budget spent
      }

      const { enhancedProjectService } = require('../../src/services/enhancedProjectService')
      enhancedProjectService.getProjectById.mockResolvedValue(criticalProject)

      const report = await projectReportingService.generateProjectStatusReport('project-1')

      expect(report.executiveSummary.criticalIssues).toContain('تجاوز الميزانية')
    })
  })

  describe('generateEVMReport', () => {
    it('should generate detailed EVM report', async () => {
      const report = await projectReportingService.generateEVMReport('project-1')

      expect(report).toBeDefined()
      expect(report.projectId).toBe('project-1')
      expect(report.reportType).toBe('evm')
      expect(report.reportDate).toBeDefined()

      // التحقق من مقاييس EVM
      expect(report.metrics).toEqual(mockEVMMetrics)

      // التحقق من التحليل
      expect(report.analysis).toBeDefined()
      expect(report.analysis.costAnalysis).toBeDefined()
      expect(report.analysis.scheduleAnalysis).toBeDefined()
      expect(report.analysis.performanceAnalysis).toBeDefined()

      // التحقق من التوقعات
      expect(report.forecasts).toBeDefined()
      expect(report.forecasts.completionDate).toBeDefined()
      expect(report.forecasts.finalCost).toBeDefined()

      // التحقق من التوصيات
      expect(report.recommendations).toBeDefined()
      expect(Array.isArray(report.recommendations)).toBe(true)
    })

    it('should analyze cost performance correctly', async () => {
      const report = await projectReportingService.generateEVMReport('project-1')

      expect(report.analysis.costAnalysis.status).toBe('under_budget')
      expect(report.analysis.costAnalysis.variance).toBe(500000)
      expect(report.analysis.costAnalysis.variancePercentage).toBeCloseTo(12.5, 1)
    })

    it('should analyze schedule performance correctly', async () => {
      const report = await projectReportingService.generateEVMReport('project-1')

      expect(report.analysis.scheduleAnalysis.status).toBe('behind_schedule')
      expect(report.analysis.scheduleAnalysis.variance).toBe(-500000)
      expect(report.analysis.scheduleAnalysis.variancePercentage).toBeCloseTo(-10, 1)
    })

    it('should provide actionable recommendations', async () => {
      const report = await projectReportingService.generateEVMReport('project-1')

      expect(report.recommendations).toContain('تسريع الأنشطة الحرجة لتعويض التأخير')
      expect(report.recommendations).toContain('مراجعة تخصيص الموارد')
    })
  })

  describe('generateProjectsDashboard', () => {
    it('should generate portfolio dashboard', async () => {
      const dashboard = await projectReportingService.generateProjectsDashboard()

      expect(dashboard).toBeDefined()
      expect(dashboard.reportDate).toBeDefined()
      expect(dashboard.reportType).toBe('dashboard')

      // التحقق من الملخص العام
      expect(dashboard.summary).toBeDefined()
      expect(dashboard.summary.totalProjects).toBe(1)
      expect(dashboard.summary.activeProjects).toBe(1)
      expect(dashboard.summary.completedProjects).toBe(0)
      expect(dashboard.summary.totalBudget).toBe(10000000)

      // التحقق من الأداء المالي
      expect(dashboard.financialSummary).toBeDefined()
      expect(dashboard.financialSummary.totalBudget).toBe(10000000)
      expect(dashboard.financialSummary.totalSpent).toBe(4000000)
      expect(dashboard.financialSummary.totalRemaining).toBe(6000000)

      // التحقق من أفضل المشاريع أداءً
      expect(dashboard.topPerformers).toBeDefined()
      expect(Array.isArray(dashboard.topPerformers)).toBe(true)

      // التحقق من المشاريع المعرضة للخطر
      expect(dashboard.atRiskProjects).toBeDefined()
      expect(Array.isArray(dashboard.atRiskProjects)).toBe(true)
    })

    it('should calculate portfolio metrics correctly', async () => {
      const multipleProjects = [
        mockProject,
        {
          ...mockProject,
          id: 'project-2',
          name: 'مشروع آخر',
          status: 'completed',
          budget: { ...mockProject.budget, total: 5000000, spent: 5000000 }
        }
      ]

      const { enhancedProjectService } = require('../../src/services/enhancedProjectService')
      enhancedProjectService.getAllProjects.mockResolvedValue(multipleProjects)

      const dashboard = await projectReportingService.generateProjectsDashboard()

      expect(dashboard.summary.totalProjects).toBe(2)
      expect(dashboard.summary.activeProjects).toBe(1)
      expect(dashboard.summary.completedProjects).toBe(1)
      expect(dashboard.summary.totalBudget).toBe(15000000)
      expect(dashboard.financialSummary.totalSpent).toBe(9000000)
    })

    it('should identify at-risk projects', async () => {
      const atRiskProject = {
        ...mockProject,
        status: 'at_risk',
        budget: { ...mockProject.budget, spent: 8000000 } // 80% spent
      }

      const { enhancedProjectService } = require('../../src/services/enhancedProjectService')
      enhancedProjectService.getAllProjects.mockResolvedValue([atRiskProject])

      const dashboard = await projectReportingService.generateProjectsDashboard()

      expect(dashboard.atRiskProjects).toHaveLength(1)
      expect(dashboard.atRiskProjects[0].id).toBe('project-1')
      expect(dashboard.atRiskProjects[0].riskFactors).toContain('budget_overrun')
    })
  })

  describe('calculateKPIs', () => {
    it('should calculate comprehensive KPIs', async () => {
      const kpis = await projectReportingService.calculateKPIs()

      expect(kpis).toBeDefined()
      expect(kpis.financial).toBeDefined()
      expect(kpis.schedule).toBeDefined()
      expect(kpis.quality).toBeDefined()
      expect(kpis.resource).toBeDefined()
      expect(kpis.risk).toBeDefined()

      // التحقق من المقاييس المالية
      expect(kpis.financial.roi).toBe(15)
      expect(kpis.financial.budgetAccuracy).toBe(95)
      expect(kpis.financial.profitMargin).toBe(20)
      expect(kpis.financial.cpi).toBe(1.125)

      // التحقق من مقاييس الجدولة
      expect(kpis.schedule.onTimeDelivery).toBe(80)
      expect(kpis.schedule.spi).toBe(0.9)
      expect(kpis.schedule.cycleTime).toBe(365)
    })

    it('should calculate project-specific KPIs', async () => {
      const kpis = await projectReportingService.calculateKPIs('project-1')

      expect(kpis).toBeDefined()
      
      const { kpiCalculationEngine } = require('../../src/services/kpiCalculationEngine')
      expect(kpiCalculationEngine.calculateAllKPIs).toHaveBeenCalledWith('project-1')
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const { enhancedProjectService } = require('../../src/services/enhancedProjectService')
      enhancedProjectService.getProjectById.mockRejectedValue(new Error('Database error'))

      await expect(
        projectReportingService.generateProjectStatusReport('project-1')
      ).rejects.toThrow('فشل في إنشاء تقرير حالة المشروع')
    })

    it('should handle EVM calculation errors', async () => {
      const { earnedValueCalculator } = require('../../src/services/earnedValueCalculator')
      earnedValueCalculator.calculateEVMMetrics.mockImplementation(() => {
        throw new Error('EVM calculation error')
      })

      await expect(
        projectReportingService.generateEVMReport('project-1')
      ).rejects.toThrow('فشل في إنشاء تقرير إدارة القيمة المكتسبة')
    })

    it('should handle empty project list', async () => {
      const { enhancedProjectService } = require('../../src/services/enhancedProjectService')
      enhancedProjectService.getAllProjects.mockResolvedValue([])

      const dashboard = await projectReportingService.generateProjectsDashboard()

      expect(dashboard.summary.totalProjects).toBe(0)
      expect(dashboard.summary.activeProjects).toBe(0)
      expect(dashboard.summary.totalBudget).toBe(0)
      expect(dashboard.topPerformers).toHaveLength(0)
      expect(dashboard.atRiskProjects).toHaveLength(0)
    })
  })

  describe('Performance', () => {
    it('should generate reports efficiently', async () => {
      const startTime = performance.now()
      await projectReportingService.generateProjectStatusReport('project-1')
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // أقل من 100ms
    })

    it('should handle large project portfolios', async () => {
      const largeProjectList = Array.from({ length: 100 }, (_, i) => ({
        ...mockProject,
        id: `project-${i}`,
        name: `مشروع ${i}`
      }))

      const { enhancedProjectService } = require('../../src/services/enhancedProjectService')
      enhancedProjectService.getAllProjects.mockResolvedValue(largeProjectList)

      const startTime = performance.now()
      const dashboard = await projectReportingService.generateProjectsDashboard()
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(500) // أقل من 500ms
      expect(dashboard.summary.totalProjects).toBe(100)
    })
  })
})
