/**
 * Quality Control Dashboard Component Tests
 * اختبارات مكون لوحة معلومات مراقبة الجودة
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QualityControlDashboard } from '../../../src/components/quality/QualityControlDashboard'
import type { QualityDashboard, QualityMetrics, QualityAlert } from '../../../src/types/quality'

// Mock the quality assurance service
const mockQualityAssuranceService = {
  getQualityDashboard: vi.fn(),
  getQualityMetrics: vi.fn(),
  getQualityAlerts: vi.fn()
}

vi.mock('../../../src/services/qualityAssuranceService', () => ({
  qualityAssuranceService: mockQualityAssuranceService
}))

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>
}))

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  )
}))

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button onClick={onClick} className={`button ${variant} ${className}`}>
      {children}
    </button>
  )
}))

vi.mock('../../../src/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={`progress ${className}`} data-value={value}>
      <div style={{ width: `${value}%` }}></div>
    </div>
  )
}))

vi.mock('../../../src/components/ui/tabs', () => ({
  Tabs: ({ value, onValueChange, children }: any) => (
    <div data-value={value} onChange={onValueChange}>{children}</div>
  ),
  TabsContent: ({ value, children }: any) => <div data-tab-content={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ value, children }: any) => (
    <button data-tab-trigger={value}>{children}</button>
  )
}))

// Mock Recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ dataKey }: any) => <div data-testid={`bar-${dataKey}`}></div>,
  XAxis: ({ dataKey }: any) => <div data-testid={`x-axis-${dataKey}`}></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`}></div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ dataKey }: any) => <div data-testid={`pie-${dataKey}`}></div>,
  Cell: () => <div data-testid="cell"></div>,
  Legend: () => <div data-testid="legend"></div>
}))

describe('QualityControlDashboard', () => {
  const mockDashboard: QualityDashboard = {
    projectId: 'project_1',
    kpis: {
      overallQualityScore: 92,
      passRate: 88.5,
      activeNonConformities: 5,
      correctiveActionsCompleted: 12,
      correctiveActionsTotal: 15,
      checksCompleted: 45,
      checksInProgress: 8,
      checksPlanned: 12
    },
    qualityTrends: [
      {
        date: '2024-01-01',
        qualityScore: 85,
        checksCompleted: 10,
        nonConformitiesRaised: 3
      },
      {
        date: '2024-01-15',
        qualityScore: 92,
        checksCompleted: 15,
        nonConformitiesRaised: 2
      }
    ],
    nonConformityTrends: [
      {
        month: '2024-01-01',
        criticalCount: 1,
        majorCount: 2,
        minorCount: 5
      },
      {
        month: '2024-02-01',
        criticalCount: 0,
        majorCount: 1,
        minorCount: 3
      }
    ],
    standardsCompliance: [
      {
        standardId: 'ISO_9001',
        standardName: 'ISO 9001',
        standardNameAr: 'آيزو 9001',
        complianceRate: 95
      },
      {
        standardId: 'ISO_14001',
        standardName: 'ISO 14001',
        standardNameAr: 'آيزو 14001',
        complianceRate: 88
      }
    ],
    recentActivities: [
      {
        id: 'activity_1',
        type: 'quality_check_completed',
        description: 'Quality check completed for Foundation Phase',
        descriptionAr: 'تم إكمال فحص الجودة لمرحلة الأساسات',
        performedBy: 'inspector_1',
        performedByName: 'Inspector 1',
        performedAt: '2024-01-15T10:00:00Z',
        entityId: 'check_1',
        entityType: 'quality_check'
      }
    ],
    lastUpdated: '2024-01-15T12:00:00Z'
  }

  const mockMetrics: QualityMetrics = {
    overallScore: 92,
    totalChecks: 65,
    passedChecks: 58,
    failedChecks: 7,
    nonConformityRate: 0.12,
    correctiveActionCompletionRate: 0.8,
    averageCheckDuration: 2.5,
    trendsData: []
  }

  const mockAlerts: QualityAlert[] = [
    {
      id: 'alert_1',
      projectId: 'project_1',
      type: 'non_conformity_overdue',
      severity: 'high',
      title: 'Overdue Non-Conformity',
      titleAr: 'عدم مطابقة متأخرة',
      description: 'Non-conformity NC-001 is overdue for corrective action',
      descriptionAr: 'عدم المطابقة NC-001 متأخرة للإجراء التصحيحي',
      entityId: 'nc_1',
      entityType: 'non_conformity',
      isAcknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      createdAt: '2024-01-10T08:00:00Z'
    },
    {
      id: 'alert_2',
      projectId: 'project_1',
      type: 'quality_score_drop',
      severity: 'medium',
      title: 'Quality Score Drop',
      titleAr: 'انخفاض نقاط الجودة',
      description: 'Quality score dropped below threshold',
      descriptionAr: 'انخفضت نقاط الجودة تحت الحد المطلوب',
      entityId: 'project_1',
      entityType: 'project',
      isAcknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      createdAt: '2024-01-12T14:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockQualityAssuranceService.getQualityDashboard.mockResolvedValue(mockDashboard)
    mockQualityAssuranceService.getQualityMetrics.mockResolvedValue(mockMetrics)
    mockQualityAssuranceService.getQualityAlerts.mockResolvedValue(mockAlerts)
  })

  it('should render loading state initially', async () => {
    mockQualityAssuranceService.getQualityDashboard.mockImplementation(() => new Promise(() => {}))
    mockQualityAssuranceService.getQualityMetrics.mockImplementation(() => new Promise(() => {}))
    mockQualityAssuranceService.getQualityAlerts.mockImplementation(() => new Promise(() => {}))

    render(<QualityControlDashboard projectId="project_1" />)

    expect(screen.getByText('جاري تحميل بيانات الجودة...')).toBeInTheDocument()
  })

  it('should render error state when loading fails', async () => {
    mockQualityAssuranceService.getQualityDashboard.mockRejectedValue(new Error('Network error'))
    mockQualityAssuranceService.getQualityMetrics.mockRejectedValue(new Error('Network error'))
    mockQualityAssuranceService.getQualityAlerts.mockRejectedValue(new Error('Network error'))

    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('فشل في تحميل بيانات الجودة')).toBeInTheDocument()
    })

    expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument()
  })

  it('should render dashboard with data', async () => {
    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات مراقبة الجودة')).toBeInTheDocument()
    })

    // Check KPIs are displayed
    expect(screen.getByText('نقاط الجودة الإجمالية')).toBeInTheDocument()
    expect(screen.getByText('92')).toBeInTheDocument()
    expect(screen.getByText('معدل النجاح')).toBeInTheDocument()
    expect(screen.getByText('89%')).toBeInTheDocument() // Rounded from 88.5%
    expect(screen.getByText('عدم المطابقات النشطة')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('الإجراءات المكتملة')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('should display quality score with correct color and label', async () => {
    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('92')).toBeInTheDocument()
    })

    // Score of 92 should be labeled as "ممتاز" (excellent)
    expect(screen.getByText('ممتاز')).toBeInTheDocument()
  })

  it('should display alerts when available', async () => {
    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('تنبيهات الجودة')).toBeInTheDocument()
    })

    // Check that alerts are displayed
    expect(screen.getByText('عدم مطابقة متأخرة')).toBeInTheDocument()
    expect(screen.getByText('انخفاض نقاط الجودة')).toBeInTheDocument()
    expect(screen.getByText('عالي')).toBeInTheDocument() // High severity
    expect(screen.getByText('متوسط')).toBeInTheDocument() // Medium severity
  })

  it('should not display alerts section when no alerts', async () => {
    mockQualityAssuranceService.getQualityAlerts.mockResolvedValue([])

    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات مراقبة الجودة')).toBeInTheDocument()
    })

    expect(screen.queryByText('تنبيهات الجودة')).not.toBeInTheDocument()
  })

  it('should render charts in overview tab', async () => {
    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات مراقبة الجودة')).toBeInTheDocument()
    })

    // Check that chart components are rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByText('اتجاه نقاط الجودة')).toBeInTheDocument()
    expect(screen.getByText('توزيع حالة الفحوصات')).toBeInTheDocument()
  })

  it('should switch between tabs', async () => {
    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات مراقبة الجودة')).toBeInTheDocument()
    })

    // Check that tab triggers are present
    expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
    expect(screen.getByText('الاتجاهات')).toBeInTheDocument()
    expect(screen.getByText('التحليل')).toBeInTheDocument()
  })

  it('should display standards compliance in analysis tab', async () => {
    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات مراقبة الجودة')).toBeInTheDocument()
    })

    // Check standards compliance section
    expect(screen.getByText('الامتثال لمعايير الجودة')).toBeInTheDocument()
    expect(screen.getByText('آيزو 9001')).toBeInTheDocument()
    expect(screen.getByText('آيزو 14001')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
  })

  it('should display recent activities', async () => {
    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات مراقبة الجودة')).toBeInTheDocument()
    })

    expect(screen.getByText('الأنشطة الأخيرة')).toBeInTheDocument()
    expect(screen.getByText('تم إكمال فحص الجودة لمرحلة الأساسات')).toBeInTheDocument()
  })

  it('should retry loading data when retry button is clicked', async () => {
    // First, make the service fail
    mockQualityAssuranceService.getQualityDashboard.mockRejectedValueOnce(new Error('Network error'))
    mockQualityAssuranceService.getQualityMetrics.mockRejectedValueOnce(new Error('Network error'))
    mockQualityAssuranceService.getQualityAlerts.mockRejectedValueOnce(new Error('Network error'))

    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('فشل في تحميل بيانات الجودة')).toBeInTheDocument()
    })

    // Now make the service succeed
    mockQualityAssuranceService.getQualityDashboard.mockResolvedValue(mockDashboard)
    mockQualityAssuranceService.getQualityMetrics.mockResolvedValue(mockMetrics)
    mockQualityAssuranceService.getQualityAlerts.mockResolvedValue(mockAlerts)

    // Click retry button
    const retryButton = screen.getByText('إعادة المحاولة')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات مراقبة الجودة')).toBeInTheDocument()
    })

    // Verify services were called again
    expect(mockQualityAssuranceService.getQualityDashboard).toHaveBeenCalledTimes(2)
    expect(mockQualityAssuranceService.getQualityMetrics).toHaveBeenCalledTimes(2)
    expect(mockQualityAssuranceService.getQualityAlerts).toHaveBeenCalledTimes(2)
  })

  it('should apply custom className', () => {
    render(<QualityControlDashboard projectId="project_1" className="custom-class" />)

    const container = screen.getByText('لوحة معلومات مراقبة الجودة').closest('.custom-class')
    expect(container).toBeInTheDocument()
  })

  it('should load data when projectId changes', async () => {
    const { rerender } = render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(mockQualityAssuranceService.getQualityDashboard).toHaveBeenCalledWith('project_1')
      expect(mockQualityAssuranceService.getQualityMetrics).toHaveBeenCalledWith('project_1', expect.any(Object))
      expect(mockQualityAssuranceService.getQualityAlerts).toHaveBeenCalledWith('project_1')
    })

    // Change projectId
    rerender(<QualityControlDashboard projectId="project_2" />)

    await waitFor(() => {
      expect(mockQualityAssuranceService.getQualityDashboard).toHaveBeenCalledWith('project_2')
      expect(mockQualityAssuranceService.getQualityMetrics).toHaveBeenCalledWith('project_2', expect.any(Object))
      expect(mockQualityAssuranceService.getQualityAlerts).toHaveBeenCalledWith('project_2')
    })
  })

  it('should handle no data state', async () => {
    mockQualityAssuranceService.getQualityDashboard.mockResolvedValue(null)
    mockQualityAssuranceService.getQualityMetrics.mockResolvedValue(null)

    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('لا توجد بيانات جودة متاحة')).toBeInTheDocument()
    })
  })

  it('should format percentage values correctly', async () => {
    render(<QualityControlDashboard projectId="project_1" />)

    await waitFor(() => {
      expect(screen.getByText('لوحة معلومات مراقبة الجودة')).toBeInTheDocument()
    })

    // Check that percentage values are rounded correctly
    expect(screen.getByText('89%')).toBeInTheDocument() // 88.5% rounded to 89%
  })

  it('should display correct quality score labels for different scores', () => {
    // Test different score ranges
    const testCases = [
      { score: 95, expected: 'ممتاز' },
      { score: 85, expected: 'جيد' },
      { score: 75, expected: 'مقبول' },
      { score: 65, expected: 'يحتاج تحسين' }
    ]

    testCases.forEach(({ score, expected }) => {
      const mockDashboardWithScore = {
        ...mockDashboard,
        kpis: { ...mockDashboard.kpis, overallQualityScore: score }
      }
      
      mockQualityAssuranceService.getQualityDashboard.mockResolvedValue(mockDashboardWithScore)
      
      const { unmount } = render(<QualityControlDashboard projectId="project_1" />)
      
      waitFor(() => {
        expect(screen.getByText(expected)).toBeInTheDocument()
      })
      
      unmount()
    })
  })
})
