/**
 * Decision Support Component Tests
 * Comprehensive test suite for the decision support UI component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import DecisionSupport from '../../../src/components/competitive/DecisionSupport'
import type { DecisionScenario, BidNoBidFramework, DecisionAnalytics } from '../../../src/types/decisionSupport'

// Mock the decision support service
vi.mock('../../../src/services/decisionSupportService', () => ({
  decisionSupportService: {
    getAllScenarios: vi.fn(),
    getAllFrameworks: vi.fn(),
    getDecisionAnalytics: vi.fn(),
    analyzeScenario: vi.fn(),
    generateRecommendations: vi.fn(),
    exportScenario: vi.fn()
  }
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  BarChart3: () => <div data-testid="barchart-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />
}))

describe('DecisionSupport Component', () => {
  const mockScenarios: DecisionScenario[] = [
    {
      id: 'scenario_1',
      name: 'سيناريو مشروع البناء',
      nameEn: 'Construction Project Scenario',
      description: 'تحليل مشروع بناء سكني',
      projectId: 'project_123',
      projectName: 'مشروع الإسكان الجديد',
      tenderId: 'tender_456',
      tenderName: 'مناقصة البناء',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      createdBy: 'user123',
      status: 'completed',
      criteriaValues: {},
      analysisResults: {
        overallScore: 85,
        recommendation: 'bid',
        riskLevel: 'low',
        categoryScores: {
          financial: 90,
          strategic: 80,
          operational: 85,
          risk: 75,
          market: 95
        },
        keyFactors: {
          positive: ['عائد مالي ممتاز', 'فرصة سوقية جيدة'],
          negative: ['مخاطر تشغيلية محدودة'],
          neutral: ['ظروف السوق مستقرة']
        },
        criticalIssues: [],
        opportunities: ['توسع في السوق'],
        threats: ['منافسة قوية'],
        assumptions: ['استقرار الأسعار']
      },
      recommendations: [],
      confidenceScore: 90,
      lastAnalyzed: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'scenario_2',
      name: 'سيناريو مشروع الطرق',
      description: 'تحليل مشروع إنشاء طرق',
      projectId: 'project_456',
      projectName: 'مشروع الطرق الجديدة',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      createdBy: 'user123',
      status: 'draft',
      criteriaValues: {},
      analysisResults: {
        overallScore: 45,
        recommendation: 'no_bid',
        riskLevel: 'high',
        categoryScores: {
          financial: 40,
          strategic: 50,
          operational: 45,
          risk: 30,
          market: 60
        },
        keyFactors: {
          positive: ['خبرة في المجال'],
          negative: ['مخاطر مالية عالية', 'تحديات تشغيلية'],
          neutral: []
        },
        criticalIssues: ['نقص في الموارد'],
        opportunities: [],
        threats: ['تقلبات الأسعار'],
        assumptions: []
      },
      recommendations: [],
      confidenceScore: 60,
      lastAnalyzed: '2024-01-02T00:00:00.000Z'
    }
  ]

  const mockFrameworks: BidNoBidFramework[] = [
    {
      id: 'framework_1',
      name: 'إطار عمل المناقصات الأساسي',
      description: 'إطار عمل شامل لاتخاذ قرارات المناقصات',
      version: '1.0',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      createdBy: 'user123',
      criteria: [],
      weightingScheme: {
        financial: 30,
        strategic: 25,
        operational: 20,
        risk: 15,
        market: 10,
        total: 100
      },
      thresholds: {
        bidThreshold: 70,
        noBidThreshold: 40,
        conditionalRange: { min: 40, max: 70 },
        riskToleranceLevel: 'moderate'
      },
      rules: []
    }
  ]

  const mockAnalytics: DecisionAnalytics = {
    totalDecisions: 25,
    bidDecisions: 15,
    noBidDecisions: 8,
    conditionalDecisions: 2,
    winRate: 68.5,
    averageAccuracy: 82.3,
    categoryPerformance: {
      financial: 75,
      strategic: 80,
      operational: 70,
      risk: 65,
      market: 85
    },
    trendAnalysis: [
      {
        period: 'يناير 2024',
        decisions: 5,
        accuracy: 85,
        winRate: 70
      }
    ],
    improvementAreas: ['تحسين تقييم المخاطر']
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the component with header and tabs', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('نظام دعم القرار')).toBeInTheDocument()
        expect(screen.getByText('إطار عمل شامل لاتخاذ قرارات المناقصات والتخطيط للسيناريوهات')).toBeInTheDocument()
      })

      // Check tabs
      expect(screen.getByText('السيناريوهات')).toBeInTheDocument()
      expect(screen.getByText('التحليل')).toBeInTheDocument()
      expect(screen.getByText('التوصيات')).toBeInTheDocument()
      expect(screen.getByText('الأطر')).toBeInTheDocument()
    })

    it('should render analytics cards when showAnalytics is true', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport showAnalytics={true} />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي القرارات')).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument()
        expect(screen.getByText('معدل الفوز')).toBeInTheDocument()
        expect(screen.getByText('68.5%')).toBeInTheDocument()
        expect(screen.getByText('دقة التنبؤ')).toBeInTheDocument()
        expect(screen.getByText('82.3%')).toBeInTheDocument()
        expect(screen.getByText('قرارات المناقصة')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })

    it('should not render analytics cards when showAnalytics is false', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(null)

      render(<DecisionSupport showAnalytics={false} />)

      await waitFor(() => {
        expect(screen.queryByText('إجمالي القرارات')).not.toBeInTheDocument()
      })
    })

    it('should render loading state initially', () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockImplementation(() => new Promise(() => {}))
      vi.mocked(decisionSupportService.getAllFrameworks).mockImplementation(() => new Promise(() => {}))
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockImplementation(() => new Promise(() => {}))

      render(<DecisionSupport />)

      expect(screen.getByText('جاري تحميل بيانات دعم القرار...')).toBeInTheDocument()
    })

    it('should render error state when loading fails', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockRejectedValue(new Error('Load error'))
      vi.mocked(decisionSupportService.getAllFrameworks).mockRejectedValue(new Error('Load error'))
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockRejectedValue(new Error('Load error'))

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('فشل في تحميل بيانات دعم القرار')).toBeInTheDocument()
      })
    })
  })

  describe('Scenarios Tab', () => {
    it('should display scenarios list', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
        expect(screen.getByText('مشروع الإسكان الجديد')).toBeInTheDocument()
        expect(screen.getByText('سيناريو مشروع الطرق')).toBeInTheDocument()
        expect(screen.getByText('مشروع الطرق الجديدة')).toBeInTheDocument()
      })
    })

    it('should filter scenarios by search term', async () => {
      const user = userEvent.setup()
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('البحث في السيناريوهات...')
      await user.type(searchInput, 'البناء')

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
        expect(screen.queryByText('سيناريو مشروع الطرق')).not.toBeInTheDocument()
      })
    })

    it('should filter scenarios by status', async () => {
      const user = userEvent.setup()
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
      })

      // Open status filter dropdown
      const statusFilter = screen.getByDisplayValue('جميع الحالات')
      await user.click(statusFilter)

      // Select 'completed' status
      const completedOption = screen.getByText('مكتمل')
      await user.click(completedOption)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
        expect(screen.queryByText('سيناريو مشروع الطرق')).not.toBeInTheDocument()
      })
    })

    it('should display recommendation badges correctly', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('مناقصة / Bid')).toBeInTheDocument()
        expect(screen.getByText('عدم مناقصة / No Bid')).toBeInTheDocument()
      })
    })

    it('should display progress bars for scenario scores', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('85/100')).toBeInTheDocument()
        expect(screen.getByText('45/100')).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should handle scenario analysis', async () => {
      const user = userEvent.setup()
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)
      vi.mocked(decisionSupportService.analyzeScenario).mockResolvedValue(mockScenarios[0].analysisResults)
      vi.mocked(decisionSupportService.generateRecommendations).mockResolvedValue([])

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
      })

      const analyzeButtons = screen.getAllByText('تحليل')
      await user.click(analyzeButtons[0])

      await waitFor(() => {
        expect(decisionSupportService.analyzeScenario).toHaveBeenCalledWith('scenario_1', 'framework_1')
        expect(decisionSupportService.generateRecommendations).toHaveBeenCalledWith('scenario_1')
      })
    })

    it('should handle scenario export', async () => {
      const user = userEvent.setup()
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)
      vi.mocked(decisionSupportService.exportScenario).mockResolvedValue('{"id": "scenario_1"}')

      // Mock URL.createObjectURL and related functions
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()
      
      // Mock document.createElement and appendChild
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
      })

      const exportButtons = screen.getAllByTestId('download-icon')
      await user.click(exportButtons[0].closest('button')!)

      await waitFor(() => {
        expect(decisionSupportService.exportScenario).toHaveBeenCalledWith('scenario_1', 'json')
      })
    })

    it('should switch between tabs', async () => {
      const user = userEvent.setup()
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
      })

      // Switch to Analysis tab
      const analysisTab = screen.getByText('التحليل')
      await user.click(analysisTab)

      expect(screen.getByText('لا توجد نتائج تحليل')).toBeInTheDocument()

      // Switch to Recommendations tab
      const recommendationsTab = screen.getByText('التوصيات')
      await user.click(recommendationsTab)

      expect(screen.getByText('لا توجد توصيات')).toBeInTheDocument()

      // Switch to Frameworks tab
      const frameworksTab = screen.getByText('الأطر')
      await user.click(frameworksTab)

      expect(screen.getByText('إدارة أطر العمل')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should display empty state when no scenarios exist', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue([])
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('لا توجد سيناريوهات')).toBeInTheDocument()
        expect(screen.getByText('ابدأ بإنشاء سيناريو جديد لتحليل قرارات المناقصات')).toBeInTheDocument()
      })
    })

    it('should display empty state for analysis tab', async () => {
      const user = userEvent.setup()
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
      })

      const analysisTab = screen.getByText('التحليل')
      await user.click(analysisTab)

      expect(screen.getByText('لا توجد نتائج تحليل')).toBeInTheDocument()
      expect(screen.getByText('اختر سيناريو وقم بتحليله لعرض النتائج هنا')).toBeInTheDocument()
    })

    it('should display empty state for recommendations tab', async () => {
      const user = userEvent.setup()
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport />)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
      })

      const recommendationsTab = screen.getByText('التوصيات')
      await user.click(recommendationsTab)

      expect(screen.getByText('لا توجد توصيات')).toBeInTheDocument()
      expect(screen.getByText('قم بتحليل سيناريو للحصول على توصيات مخصصة')).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('should call onScenarioUpdate when scenario is updated', async () => {
      const onScenarioUpdate = vi.fn()
      const user = userEvent.setup()
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)
      vi.mocked(decisionSupportService.analyzeScenario).mockResolvedValue(mockScenarios[0].analysisResults)
      vi.mocked(decisionSupportService.generateRecommendations).mockResolvedValue([])

      // Mock getScenario to return updated scenario
      const updatedScenario = { ...mockScenarios[0], status: 'completed' as const }
      vi.mocked(decisionSupportService.getScenario).mockResolvedValue(updatedScenario)

      render(<DecisionSupport onScenarioUpdate={onScenarioUpdate} />)

      await waitFor(() => {
        expect(screen.getByText('سيناريو مشروع البناء')).toBeInTheDocument()
      })

      const analyzeButtons = screen.getAllByText('تحليل')
      await user.click(analyzeButtons[0])

      await waitFor(() => {
        expect(onScenarioUpdate).toHaveBeenCalledWith(updatedScenario)
      })
    })

    it('should filter scenarios by projectId when provided', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(mockAnalytics)

      render(<DecisionSupport projectId="project_123" />)

      await waitFor(() => {
        expect(decisionSupportService.getAllScenarios).toHaveBeenCalledWith({ projectId: 'project_123' })
      })
    })

    it('should apply compact mode styling when compactMode is true', async () => {
      const { decisionSupportService } = await import('../../../src/services/decisionSupportService')
      vi.mocked(decisionSupportService.getAllScenarios).mockResolvedValue(mockScenarios)
      vi.mocked(decisionSupportService.getAllFrameworks).mockResolvedValue(mockFrameworks)
      vi.mocked(decisionSupportService.getDecisionAnalytics).mockResolvedValue(null)

      render(<DecisionSupport compactMode={true} showAnalytics={true} />)

      await waitFor(() => {
        // In compact mode, analytics cards should not be shown even if showAnalytics is true
        expect(screen.queryByText('إجمالي القرارات')).not.toBeInTheDocument()
      })
    })
  })
})
