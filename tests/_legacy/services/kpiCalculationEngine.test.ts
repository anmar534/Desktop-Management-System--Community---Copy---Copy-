/**
 * KPI Calculation Engine Tests
 * اختبارات محرك حساب مؤشرات الأداء
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { kpiCalculationEngine } from '../../src/services/kpiCalculationEngine'
import type { EnhancedProject } from '../../src/types/project'

const mockProjects: EnhancedProject[] = [
  {
    id: 'proj_1',
    name: 'مشروع البناء الأول',
    nameEn: 'First Construction Project',
    description: 'وصف المشروع الأول',
    status: 'active',
    priority: 'high',
    category: 'construction',
    progress: 75,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: {
      total: 1000000,
      spent: 750000,
      remaining: 250000,
      currency: 'SAR'
    },
    client: {
      id: 'client_1',
      name: 'العميل الأول',
      contact: 'contact@client1.com'
    },
    location: {
      city: 'الرياض',
      region: 'الرياض',
      coordinates: { lat: 24.7136, lng: 46.6753 }
    },
    team: [],
    documents: [],
    milestones: [],
    risks: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-10-13T00:00:00Z',
    version: 1
  },
  {
    id: 'proj_2',
    name: 'مشروع البنية التحتية',
    nameEn: 'Infrastructure Project',
    description: 'وصف مشروع البنية التحتية',
    status: 'completed',
    priority: 'medium',
    category: 'infrastructure',
    progress: 100,
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    budget: {
      total: 2000000,
      spent: 1950000,
      remaining: 50000,
      currency: 'SAR'
    },
    client: {
      id: 'client_2',
      name: 'العميل الثاني',
      contact: 'contact@client2.com'
    },
    location: {
      city: 'جدة',
      region: 'مكة المكرمة',
      coordinates: { lat: 21.4858, lng: 39.1925 }
    },
    team: [],
    documents: [],
    milestones: [],
    risks: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-30T00:00:00Z',
    version: 1
  }
]

const mockTasks = [
  {
    id: 'task_1',
    projectId: 'proj_1',
    title: 'مهمة تجريبية',
    status: 'completed',
    progress: 100,
    estimatedHours: 40,
    actualHours: 38
  },
  {
    id: 'task_2',
    projectId: 'proj_1',
    title: 'مهمة أخرى',
    status: 'in_progress',
    progress: 60,
    estimatedHours: 60,
    actualHours: 45
  }
]

describe('KPICalculationEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateDashboardKPIs', () => {
    it('should calculate dashboard KPIs successfully', async () => {
      const timeframe = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z'
      }

      const result = await kpiCalculationEngine.calculateDashboardKPIs({
        projects: mockProjects,
        tasks: mockTasks,
        timeframe
      })

      expect(result).toBeDefined()
      expect(result.summary).toBeDefined()
      expect(result.summary.totalKPIs).toBeGreaterThan(0)
      expect(result.categories).toBeDefined()
      expect(result.categories.financial).toBeInstanceOf(Array)
      expect(result.categories.schedule).toBeInstanceOf(Array)
      expect(result.categories.quality).toBeInstanceOf(Array)
      expect(result.categories.resources).toBeInstanceOf(Array)
      expect(result.categories.risk).toBeInstanceOf(Array)
    })

    it('should categorize KPIs correctly', async () => {
      const timeframe = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z'
      }

      const result = await kpiCalculationEngine.calculateDashboardKPIs({
        projects: mockProjects,
        tasks: mockTasks,
        timeframe
      })

      // Check that each category has KPIs
      expect(result.categories.financial.length).toBeGreaterThan(0)
      expect(result.categories.schedule.length).toBeGreaterThan(0)
      expect(result.categories.quality.length).toBeGreaterThan(0)
      expect(result.categories.resources.length).toBeGreaterThan(0)
      expect(result.categories.risk.length).toBeGreaterThan(0)
    })

    it('should calculate summary statistics correctly', async () => {
      const timeframe = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z'
      }

      const result = await kpiCalculationEngine.calculateDashboardKPIs({
        projects: mockProjects,
        tasks: mockTasks,
        timeframe
      })

      const summary = result.summary
      expect(summary.totalKPIs).toBe(
        summary.excellentKPIs + summary.goodKPIs + summary.warningKPIs + summary.criticalKPIs
      )
      expect(summary.excellentKPIs).toBeGreaterThanOrEqual(0)
      expect(summary.goodKPIs).toBeGreaterThanOrEqual(0)
      expect(summary.warningKPIs).toBeGreaterThanOrEqual(0)
      expect(summary.criticalKPIs).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty projects list', async () => {
      const timeframe = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z'
      }

      const result = await kpiCalculationEngine.calculateDashboardKPIs({
        projects: [],
        tasks: [],
        timeframe
      })

      expect(result.summary.totalKPIs).toBe(0)
      expect(result.categories.financial).toHaveLength(0)
      expect(result.categories.schedule).toHaveLength(0)
      expect(result.categories.quality).toHaveLength(0)
      expect(result.categories.resources).toHaveLength(0)
      expect(result.categories.risk).toHaveLength(0)
    })
  })

  describe('calculateProjectKPIs', () => {
    it('should calculate KPIs for a specific project', async () => {
      const result = await kpiCalculationEngine.calculateProjectKPIs({
        project: mockProjects[0],
        tasks: mockTasks.filter(t => t.projectId === 'proj_1'),
        timeframe: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        }
      })

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      
      // Check that each KPI has required properties
      result.forEach(kpi => {
        expect(kpi.id).toBeDefined()
        expect(kpi.name).toBeDefined()
        expect(kpi.nameEn).toBeDefined()
        expect(kpi.value).toBeDefined()
        expect(kpi.target).toBeDefined()
        expect(kpi.unit).toBeDefined()
        expect(['up', 'down', 'stable']).toContain(kpi.trend)
        expect(['excellent', 'good', 'warning', 'critical']).toContain(kpi.status)
        expect(['financial', 'schedule', 'quality', 'resources', 'risk']).toContain(kpi.category)
      })
    })

    it('should calculate financial KPIs correctly', async () => {
      const result = await kpiCalculationEngine.calculateProjectKPIs({
        project: mockProjects[0],
        tasks: mockTasks.filter(t => t.projectId === 'proj_1'),
        timeframe: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        }
      })

      const financialKPIs = result.filter(kpi => kpi.category === 'financial')
      expect(financialKPIs.length).toBeGreaterThan(0)

      // Check for specific financial KPIs
      const budgetUtilization = financialKPIs.find(kpi => kpi.id.includes('budget_utilization'))
      expect(budgetUtilization).toBeDefined()
      if (budgetUtilization) {
        expect(budgetUtilization.value).toBe(75) // 750000 / 1000000 * 100
        expect(budgetUtilization.unit).toBe('%')
      }
    })

    it('should calculate schedule KPIs correctly', async () => {
      const result = await kpiCalculationEngine.calculateProjectKPIs({
        project: mockProjects[0],
        tasks: mockTasks.filter(t => t.projectId === 'proj_1'),
        timeframe: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        }
      })

      const scheduleKPIs = result.filter(kpi => kpi.category === 'schedule')
      expect(scheduleKPIs.length).toBeGreaterThan(0)

      // Check for specific schedule KPIs
      const progressKPI = scheduleKPIs.find(kpi => kpi.id.includes('progress'))
      expect(progressKPI).toBeDefined()
      if (progressKPI) {
        expect(progressKPI.value).toBe(75)
        expect(progressKPI.unit).toBe('%')
      }
    })

    it('should determine KPI status correctly', async () => {
      const result = await kpiCalculationEngine.calculateProjectKPIs({
        project: mockProjects[0],
        tasks: mockTasks.filter(t => t.projectId === 'proj_1'),
        timeframe: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        }
      })

      // Check that status is determined based on value vs target
      result.forEach(kpi => {
        const performance = kpi.value / kpi.target
        if (performance >= 0.9) {
          expect(['excellent', 'good']).toContain(kpi.status)
        } else if (performance >= 0.7) {
          expect(['good', 'warning']).toContain(kpi.status)
        } else {
          expect(['warning', 'critical']).toContain(kpi.status)
        }
      })
    })
  })

  describe('calculateTrendAnalysis', () => {
    it('should calculate trend analysis correctly', async () => {
      const result = await kpiCalculationEngine.calculateTrendAnalysis({
        projects: mockProjects,
        timeframe: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        },
        period: 'monthly'
      })

      expect(result).toBeDefined()
      expect(result.periods).toBeInstanceOf(Array)
      expect(result.metrics).toBeDefined()
      expect(result.insights).toBeInstanceOf(Array)
    })

    it('should handle different time periods', async () => {
      const periods = ['weekly', 'monthly', 'quarterly'] as const

      for (const period of periods) {
        const result = await kpiCalculationEngine.calculateTrendAnalysis({
          projects: mockProjects,
          timeframe: {
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T23:59:59Z'
          },
          period
        })

        expect(result.periods.length).toBeGreaterThan(0)
        expect(result.metrics).toBeDefined()
      }
    })
  })

  describe('error handling', () => {
    it('should handle invalid project data', async () => {
      const invalidProject = {
        ...mockProjects[0],
        budget: null
      } as any

      const result = await kpiCalculationEngine.calculateProjectKPIs({
        project: invalidProject,
        tasks: [],
        timeframe: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        }
      })

      // Should still return some KPIs, even with invalid data
      expect(result).toBeInstanceOf(Array)
    })

    it('should handle invalid timeframe', async () => {
      const result = await kpiCalculationEngine.calculateDashboardKPIs({
        projects: mockProjects,
        tasks: mockTasks,
        timeframe: {
          startDate: '2024-12-31T00:00:00Z', // End before start
          endDate: '2024-01-01T23:59:59Z'
        }
      })

      // Should handle gracefully
      expect(result).toBeDefined()
      expect(result.summary.totalKPIs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('KPI calculations', () => {
    it('should calculate budget utilization correctly', async () => {
      const project = mockProjects[0] // 750000 spent out of 1000000 total
      const result = await kpiCalculationEngine.calculateProjectKPIs({
        project,
        tasks: [],
        timeframe: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        }
      })

      const budgetKPI = result.find(kpi => kpi.id.includes('budget_utilization'))
      expect(budgetKPI?.value).toBe(75)
    })

    it('should calculate task completion rate correctly', async () => {
      const projectTasks = mockTasks.filter(t => t.projectId === 'proj_1')
      const completedTasks = projectTasks.filter(t => t.status === 'completed')
      const expectedRate = (completedTasks.length / projectTasks.length) * 100

      const result = await kpiCalculationEngine.calculateProjectKPIs({
        project: mockProjects[0],
        tasks: projectTasks,
        timeframe: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        }
      })

      const taskCompletionKPI = result.find(kpi => kpi.id.includes('task_completion'))
      expect(taskCompletionKPI?.value).toBe(expectedRate)
    })

    it('should calculate resource efficiency correctly', async () => {
      const projectTasks = mockTasks.filter(t => t.projectId === 'proj_1')
      const totalEstimated = projectTasks.reduce((sum, t) => sum + t.estimatedHours, 0)
      const totalActual = projectTasks.reduce((sum, t) => sum + t.actualHours, 0)
      const expectedEfficiency = totalEstimated > 0 ? (totalEstimated / totalActual) * 100 : 100

      const result = await kpiCalculationEngine.calculateProjectKPIs({
        project: mockProjects[0],
        tasks: projectTasks,
        timeframe: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z'
        }
      })

      const efficiencyKPI = result.find(kpi => kpi.id.includes('resource_efficiency'))
      expect(efficiencyKPI?.value).toBeCloseTo(expectedEfficiency, 1)
    })
  })
})
