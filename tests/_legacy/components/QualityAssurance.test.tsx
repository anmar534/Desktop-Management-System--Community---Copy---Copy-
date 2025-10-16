import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QualityAssurance from '../../../src/components/automation/QualityAssurance'
import qualityAssuranceService from '../../../src/services/qualityAssuranceService'
import type { QualityMetrics, BackupRecord } from '../../../src/types/qualityAssurance'

// Mock the quality assurance service
vi.mock('../../../src/services/qualityAssuranceService', () => ({
  default: {
    getQualityMetrics: vi.fn(),
    getBackupHistory: vi.fn(),
    validatePricing: vi.fn(),
    checkCompleteness: vi.fn(),
    detectErrors: vi.fn(),
    verifyConsistency: vi.fn(),
    createBackup: vi.fn(),
    generateQualityReport: vi.fn()
  }
}))

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={`card ${className}`}>{children}</div>,
  CardContent: ({ children }: any) => <div className="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div className="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div className="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div className="card-title">{children}</div>
}))

vi.mock('../../../src/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value} onClick={() => onValueChange?.('test')}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div className="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-trigger-${value}`}>{children}</button>
  )
}))

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className="button"
    >
      {children}
    </button>
  )
}))

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span className={`badge badge-${variant}`}>{children}</span>
  )
}))

vi.mock('../../../src/components/ui/progress', () => ({
  Progress: ({ value }: any) => (
    <div className="progress" data-value={value}>
      <div className="progress-bar" style={{ width: `${value}%` }} />
    </div>
  )
}))

vi.mock('../../../src/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div className={`alert alert-${variant}`}>{children}</div>
  ),
  AlertDescription: ({ children }: any) => <div className="alert-description">{children}</div>
}))

vi.mock('../../../src/components/ui/input', () => ({
  Input: (props: any) => <input {...props} className="input" />
}))

vi.mock('../../../src/components/ui/label', () => ({
  Label: ({ children }: any) => <label className="label">{children}</label>
}))

describe('QualityAssurance Component', () => {
  const mockQualityMetrics: QualityMetrics = {
    overallQualityScore: 85.5,
    pricingValidationMetrics: {
      validationScore: 90.2,
      totalValidations: 150,
      passedValidations: 135,
      failedValidations: 15,
      averageValidationTime: 2.5,
      commonErrors: []
    },
    completenessMetrics: {
      averageCompleteness: 88.7,
      totalChecks: 200,
      completeDocuments: 177,
      incompleteDocuments: 23,
      averageCompletionTime: 1.8,
      commonMissingItems: []
    },
    consistencyMetrics: {
      consistencyScore: 92.1,
      totalChecks: 100,
      consistentItems: 92,
      inconsistentItems: 8,
      averageCheckTime: 3.2,
      commonInconsistencies: []
    },
    errorMetrics: {
      errorRate: 2.5,
      totalErrors: 25,
      criticalErrors: 2,
      majorErrors: 8,
      minorErrors: 15,
      resolvedErrors: 20,
      averageResolutionTime: 4.5,
      errorTrends: []
    },
    trends: [
      { period: 'هذا الأسبوع', score: 85.5, change: 2.3 },
      { period: 'الأسبوع الماضي', score: 83.2, change: -1.1 }
    ],
    benchmarks: {
      industryAverage: 75.0,
      bestPractice: 95.0,
      previousPeriod: 83.2
    },
    lastUpdated: new Date().toISOString()
  }

  const mockBackupHistory: BackupRecord[] = [
    {
      id: 'backup-1',
      scope: 'full',
      status: 'completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      size: 1024000,
      itemCount: 500,
      compression: true,
      encryption: false,
      metadata: {}
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders quality assurance component correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)

    render(<QualityAssurance />)

    await waitFor(() => {
      expect(screen.getByText('ضمان الجودة')).toBeInTheDocument()
    })

    expect(screen.getByText('نظام شامل لضمان دقة واكتمال البيانات')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    render(<QualityAssurance />)

    expect(screen.getByText('جاري تحميل بيانات ضمان الجودة...')).toBeInTheDocument()
  })

  it('displays quality metrics correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)

    render(<QualityAssurance />)

    await waitFor(() => {
      const scoreElements = screen.getAllByText('85.5%')
      expect(scoreElements.length).toBeGreaterThan(0)
    })

    expect(screen.getByText('90.2%')).toBeInTheDocument()
    expect(screen.getByText('88.7%')).toBeInTheDocument()
    expect(screen.getByText('2.50%')).toBeInTheDocument()
  })

  it('handles error state correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockRejectedValue(new Error('Test error'))
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue([])

    render(<QualityAssurance />)

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })
  })

  it('handles tab navigation correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)

    render(<QualityAssurance />)

    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument()
    })

    expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-validation')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-completeness')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-errors')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-consistency')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-backups')).toBeInTheDocument()
  })

  it('handles backup creation correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)
    vi.mocked(qualityAssuranceService.createBackup).mockResolvedValue({
      id: 'backup-2',
      status: 'completed',
      message: 'Backup created successfully'
    })

    render(<QualityAssurance />)

    await waitFor(() => {
      expect(screen.getByText('نسخة احتياطية')).toBeInTheDocument()
    })

    const backupButton = screen.getByText('نسخة احتياطية')
    fireEvent.click(backupButton)

    await waitFor(() => {
      expect(qualityAssuranceService.createBackup).toHaveBeenCalledWith({
        scope: 'full',
        includeMetadata: true,
        compression: true,
        encryption: false
      })
    })
  })

  it('handles report generation correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)
    vi.mocked(qualityAssuranceService.generateQualityReport).mockResolvedValue({
      id: 'report-1',
      title: 'تقرير ضمان الجودة',
      generatedAt: new Date().toISOString(),
      format: 'comprehensive',
      language: 'ar',
      content: {},
      summary: {},
      recommendations: []
    })

    render(<QualityAssurance />)

    await waitFor(() => {
      expect(screen.getByText('إنشاء تقرير')).toBeInTheDocument()
    })

    const reportButton = screen.getByText('إنشاء تقرير')
    fireEvent.click(reportButton)

    await waitFor(() => {
      expect(qualityAssuranceService.generateQualityReport).toHaveBeenCalledWith({
        includeMetrics: true,
        includeTrends: true,
        includeRecommendations: true,
        format: 'comprehensive',
        language: 'ar'
      })
    })
  })

  it('displays backup history correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)

    render(<QualityAssurance />)

    await waitFor(() => {
      expect(screen.getByTestId('tab-content-backups')).toBeInTheDocument()
    })
  })

  it('handles quality score color coding correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)

    render(<QualityAssurance />)

    await waitFor(() => {
      const scoreElements = screen.getAllByText('85.5%')
      expect(scoreElements.length).toBeGreaterThan(0)
    })
  })

  it('displays trends correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)

    render(<QualityAssurance />)

    await waitFor(() => {
      expect(screen.getByText('اتجاهات الجودة')).toBeInTheDocument()
    })

    expect(screen.getByText('هذا الأسبوع')).toBeInTheDocument()
    expect(screen.getByText('الأسبوع الماضي')).toBeInTheDocument()
  })

  it('handles empty data states correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue({
      ...mockQualityMetrics,
      trends: []
    })
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue([])

    render(<QualityAssurance />)

    await waitFor(() => {
      expect(screen.getByText('اتجاهات الجودة')).toBeInTheDocument()
    })

    // Check that the component renders without errors even with empty data
    expect(screen.getByText('ضمان الجودة')).toBeInTheDocument()
  })

  it('applies RTL direction correctly', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)

    const { container } = render(<QualityAssurance />)

    await waitFor(() => {
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveAttribute('dir', 'rtl')
    })
  })

  it('handles custom className prop', async () => {
    vi.mocked(qualityAssuranceService.getQualityMetrics).mockResolvedValue(mockQualityMetrics)
    vi.mocked(qualityAssuranceService.getBackupHistory).mockResolvedValue(mockBackupHistory)

    const { container } = render(<QualityAssurance className="custom-class" />)

    await waitFor(() => {
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('custom-class')
    })
  })

  it('displays component name correctly', () => {
    expect(QualityAssurance.displayName).toBe('QualityAssurance')
  })
})
