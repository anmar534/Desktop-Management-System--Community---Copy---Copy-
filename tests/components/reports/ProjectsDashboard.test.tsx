/**
 * Projects Dashboard Component Tests
 * اختبارات مكون لوحة معلومات المشاريع
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ProjectsDashboard from '../../../src/components/reports/ProjectsDashboard'
import { projectReportingService } from '../../../src/services/projectReportingService'
import { kpiCalculationEngine } from '../../../src/services/kpiCalculationEngine'
import { enhancedProjectService } from '../../../src/services/enhancedProjectService'
import { reportExportService } from '../../../src/services/reportExportService'

// Mock the services
vi.mock('../../../src/services/projectReportingService', () => ({
  projectReportingService: {
    generateProjectsDashboard: vi.fn()
  }
}))

vi.mock('../../../src/services/kpiCalculationEngine', () => ({
  kpiCalculationEngine: {
    calculateDashboardKPIs: vi.fn()
  }
}))

vi.mock('../../../src/services/enhancedProjectService', () => ({
  enhancedProjectService: {
    getAllProjects: vi.fn()
  }
}))

vi.mock('../../../src/services/reportExportService', () => ({
  reportExportService: {
    exportDashboard: vi.fn()
  }
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockDashboardData = {
  summary: {
    totalProjects: 10,
    activeProjects: 7,
    completedProjects: 2,
    delayedProjects: 1,
    onBudgetProjects: 8,
    overBudgetProjects: 2,
    totalBudget: 5000000,
    averageProgress: 75
  },
  performanceMetrics: {
    averageCompletionRate: 75,
    averageBudgetUtilization: 68,
    averageSchedulePerformance: 85,
    customerSatisfactionScore: 4.2
  },
  financialSummary: {
    totalPortfolioValue: 5000000,
    totalSpent: 3400000,
    totalRemaining: 1600000,
    projectedOverrun: 0
  },
  resourceUtilization: {
    totalResources: 50,
    utilizedResources: 42,
    availableResources: 8,
    overallocatedResources: 3
  },
  charts: {
    statusDistribution: [
      { name: 'نشط', value: 7 },
      { name: 'مكتمل', value: 2 },
      { name: 'معلق', value: 1 }
    ],
    progressTrend: [
      { month: 'يناير', progress: 65 },
      { month: 'فبراير', progress: 70 },
      { month: 'مارس', progress: 75 }
    ],
    financialTrend: [
      { month: 'يناير', budget: 1000000, spent: 800000 },
      { month: 'فبراير', budget: 1200000, spent: 950000 }
    ],
    budgetDistribution: [
      { category: 'إنشاءات', allocated: 5000000, spent: 4200000 }
    ]
  },
  risks: {
    highPriorityRisks: [
      { title: 'تأخير في توريد المواد', level: 'عالي' }
    ],
    mitigationActions: [
      { title: 'البحث عن موردين بديلين', status: 'قيد التنفيذ' }
    ]
  },
  topPerformingProjects: [],
  projectsAtRisk: []
}

const mockKPIData = {
  summary: {
    totalKPIs: 20,
    excellentKPIs: 8,
    goodKPIs: 7,
    warningKPIs: 3,
    criticalKPIs: 2
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

const mockProjects = [
  {
    id: 'proj1',
    name: 'مشروع تجريبي',
    status: 'active',
    priority: 'high',
    category: 'construction',
    progress: 75,
    budget: { total: 1000000, spent: 750000 }
  }
]

describe('ProjectsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup service mocks
    const { projectReportingService } = require('../../../src/services/projectReportingService')
    const { kpiCalculationEngine } = require('../../../src/services/kpiCalculationEngine')
    const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
    const { reportExportService } = require('../../../src/services/reportExportService')

    projectReportingService.generateProjectsDashboard.mockResolvedValue(mockDashboardData)
    kpiCalculationEngine.calculateDashboardKPIs.mockResolvedValue(mockKPIData)
    enhancedProjectService.getAllProjects.mockResolvedValue(mockProjects as any)
    reportExportService.exportDashboard.mockResolvedValue({
      success: true,
      fileName: 'dashboard_export.pdf',
      downloadUrl: '/downloads/dashboard_export.pdf'
    })
  })

  it('should render dashboard with loading state initially', () => {
    render(<ProjectsDashboard />)
    
    expect(screen.getByText('جاري تحميل لوحة المعلومات...')).toBeInTheDocument()
  })

  it('should render dashboard data after loading', async () => {
    render(<ProjectsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات المشاريع')).toBeInTheDocument()
    })

    // Check summary cards
    expect(screen.getByText('إجمالي المشاريع')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('المشاريع النشطة')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('should handle filter changes', async () => {
    render(<ProjectsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات المشاريع')).toBeInTheDocument()
    })

    // Change timeframe filter
    const timeframeSelect = screen.getByDisplayValue('شهر')
    fireEvent.click(timeframeSelect)
    
    const quarterOption = screen.getByText('ربع سنة')
    fireEvent.click(quarterOption)

    await waitFor(() => {
      expect(projectReportingService.generateProjectsDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          timeframe: 'quarter'
        })
      )
    })
  })

  it('should export dashboard to PDF', async () => {
    render(<ProjectsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات المشاريع')).toBeInTheDocument()
    })

    const exportPDFButton = screen.getByText('تصدير PDF')
    fireEvent.click(exportPDFButton)

    await waitFor(() => {
      expect(reportExportService.exportDashboard).toHaveBeenCalledWith(
        mockDashboardData,
        expect.objectContaining({
          format: 'pdf',
          includeCharts: true,
          includeDetails: true,
          language: 'ar'
        })
      )
    })
  })

  it('should export dashboard to Excel', async () => {
    render(<ProjectsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات المشاريع')).toBeInTheDocument()
    })

    const exportExcelButton = screen.getByText('تصدير Excel')
    fireEvent.click(exportExcelButton)

    await waitFor(() => {
      expect(reportExportService.exportDashboard).toHaveBeenCalledWith(
        mockDashboardData,
        expect.objectContaining({
          format: 'excel'
        })
      )
    })
  })

  it('should refresh dashboard data', async () => {
    render(<ProjectsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات المشاريع')).toBeInTheDocument()
    })

    const refreshButton = screen.getByText('تحديث')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(projectReportingService.generateProjectsDashboard).toHaveBeenCalledTimes(2)
    })
  })

  it('should switch between dashboard tabs', async () => {
    render(<ProjectsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات المشاريع')).toBeInTheDocument()
    })

    // Switch to performance tab
    const performanceTab = screen.getByText('الأداء')
    fireEvent.click(performanceTab)

    expect(screen.getByText('financial')).toBeInTheDocument()

    // Switch to financial tab
    const financialTab = screen.getByText('المالية')
    fireEvent.click(financialTab)

    expect(screen.getByText('الأداء المالي الشهري')).toBeInTheDocument()

    // Switch to risks tab
    const risksTab = screen.getByText('المخاطر')
    fireEvent.click(risksTab)

    expect(screen.getByText('تحليل المخاطر')).toBeInTheDocument()
  })

  it('should handle service errors gracefully', async () => {
    vi.mocked(projectReportingService.generateProjectsDashboard).mockRejectedValue(
      new Error('Service error')
    )

    render(<ProjectsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('جاري تحميل لوحة المعلومات...')).toBeInTheDocument()
    })

    // Should show loading state when error occurs
    expect(screen.queryByText('لوحة معلومات المشاريع')).not.toBeInTheDocument()
  })

  it('should handle export errors gracefully', async () => {
    vi.mocked(reportExportService.exportDashboard).mockResolvedValue({
      success: false,
      fileName: '',
      error: 'Export failed'
    })

    render(<ProjectsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات المشاريع')).toBeInTheDocument()
    })

    const exportPDFButton = screen.getByText('تصدير PDF')
    fireEvent.click(exportPDFButton)

    await waitFor(() => {
      expect(reportExportService.exportDashboard).toHaveBeenCalled()
    })
  })

  it('should apply multiple filters correctly', async () => {
    render(<ProjectsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات المشاريع')).toBeInTheDocument()
    })

    // Change status filter
    const statusSelects = screen.getAllByRole('combobox')
    const statusSelect = statusSelects[1] // Second select is status
    fireEvent.click(statusSelect)
    
    const activeOption = screen.getByText('نشط')
    fireEvent.click(activeOption)

    await waitFor(() => {
      expect(projectReportingService.generateProjectsDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active'
        })
      )
    })
  })

  it('should display correct RTL layout', () => {
    render(<ProjectsDashboard />)
    
    const dashboardContainer = screen.getByText('جاري تحميل لوحة المعلومات...').closest('div')
    expect(dashboardContainer).toHaveAttribute('dir', 'rtl')
  })
})
