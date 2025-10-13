import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RiskAssessmentMatrix } from '../../src/components/bidding/RiskAssessmentMatrix'
import type { RiskAssessment } from '../../src/types/templates'

// Mock the risk assessment service
vi.mock('../../src/services/riskAssessmentService', () => ({
  riskAssessmentService: {
    getDefaultRiskFactors: vi.fn(),
    calculateRiskScore: vi.fn(),
    determineRiskLevel: vi.fn(),
    getRecommendedMargin: vi.fn(),
    createRiskAssessment: vi.fn(),
  },
}))

// Mock lucide-react icons using importOriginal
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // Override specific icons for testing
    AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
    TrendingUp: () => <div data-testid="trending-up-icon" />,
    Shield: () => <div data-testid="shield-icon" />,
    Target: () => <div data-testid="target-icon" />,
    Clock: () => <div data-testid="clock-icon" />,
    DollarSign: () => <div data-testid="dollar-sign-icon" />,
    Globe: () => <div data-testid="globe-icon" />,
    Save: () => <div data-testid="save-icon" />,
    X: () => <div data-testid="x-icon" />,
  }
})

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('RiskAssessmentMatrix', () => {
  const mockDefaultFactors = [
    {
      id: 'technical',
      name: 'التعقيد التقني',
      description: 'مستوى التعقيد التقني للمشروع',
      impact: 3,
      probability: 3,
      mitigation: 'توظيف خبراء متخصصين',
    },
    {
      id: 'financial',
      name: 'المخاطر المالية',
      description: 'مخاطر السيولة والدفع',
      impact: 4,
      probability: 2,
      mitigation: 'طلب دفعة مقدمة',
    },
  ]

  const mockAssessment: RiskAssessment = {
    factors: mockDefaultFactors,
    overallRiskLevel: 'medium',
    riskScore: 44,
    recommendedMargin: 20,
    mitigationPlan: 'خطة شاملة لإدارة المخاطر',
  }

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    initialAssessment: undefined,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock the risk assessment service methods
    vi.mock('../../src/services/riskAssessmentService', () => ({
      riskAssessmentService: {
        getDefaultRiskFactors: vi.fn().mockReturnValue(mockDefaultFactors),
        calculateRiskScore: vi.fn().mockReturnValue(44),
        getRiskLevel: vi.fn().mockReturnValue('medium'),
        getRecommendedMargin: vi.fn().mockReturnValue(20),
        createAssessment: vi.fn().mockReturnValue(mockAssessment),
        updateAssessment: vi.fn().mockReturnValue(mockAssessment),
        getAssessment: vi.fn().mockReturnValue(mockAssessment)
      }
    }))
  })

  describe('Rendering', () => {
    it('should render risk assessment dialog when open', () => {
      render(<RiskAssessmentMatrix {...defaultProps} />)

      expect(screen.getByText('تقييم المخاطر')).toBeInTheDocument()
      expect(screen.getByText('قم بتقييم عوامل المخاطر المختلفة للمشروع')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<RiskAssessmentMatrix {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('تقييم المخاطر')).not.toBeInTheDocument()
    })

    it('should display risk factors', () => {
      render(<RiskAssessmentMatrix {...defaultProps} />)

      expect(screen.getByText('التعقيد التقني')).toBeInTheDocument()
      expect(screen.getByText('المخاطر المالية')).toBeInTheDocument()
      expect(screen.getByText('مستوى التعقيد التقني للمشروع')).toBeInTheDocument()
    })

    it('should show risk summary', () => {
      render(<RiskAssessmentMatrix {...defaultProps} />)

      expect(screen.getByText('ملخص المخاطر')).toBeInTheDocument()
      expect(screen.getByText('44%')).toBeInTheDocument()
      expect(screen.getByText('متوسط')).toBeInTheDocument()
      expect(screen.getByText('20%')).toBeInTheDocument()
    })
  })

  describe('Risk Factor Interaction', () => {
    it('should update impact when slider is moved', async () => {
      const user = userEvent.setup()
      render(<RiskAssessmentMatrix {...defaultProps} />)

      const impactSliders = screen.getAllByRole('slider')
      const firstImpactSlider = impactSliders[0] // First factor's impact slider

      fireEvent.change(firstImpactSlider, { target: { value: '5' } })

      await waitFor(() => {
        expect(firstImpactSlider).toHaveValue('5')
      })
    })

    it('should update probability when slider is moved', async () => {
      render(<RiskAssessmentMatrix {...defaultProps} />)

      const probabilitySliders = screen.getAllByRole('slider')
      const firstProbabilitySlider = probabilitySliders[1] // First factor's probability slider

      fireEvent.change(firstProbabilitySlider, { target: { value: '4' } })

      await waitFor(() => {
        expect(firstProbabilitySlider).toHaveValue('4')
      })
    })

    it('should update mitigation text when changed', async () => {
      const user = userEvent.setup()
      render(<RiskAssessmentMatrix {...defaultProps} />)

      const mitigationInputs = screen.getAllByPlaceholderText('استراتيجية التخفيف...')
      const firstMitigationInput = mitigationInputs[0]

      await user.clear(firstMitigationInput)
      await user.type(firstMitigationInput, 'استراتيجية جديدة')

      expect(firstMitigationInput).toHaveValue('استراتيجية جديدة')
    })
  })

  describe('Risk Calculation', () => {
    it('should recalculate risk score when factors change', async () => {
      const { RiskAssessmentService } = require('../../src/services/riskAssessmentService')
      const mockInstance = new RiskAssessmentService()
      
      render(<RiskAssessmentMatrix {...defaultProps} />)

      const impactSlider = screen.getAllByRole('slider')[0]
      fireEvent.change(impactSlider, { target: { value: '5' } })

      await waitFor(() => {
        expect(mockInstance.calculateRiskScore).toHaveBeenCalled()
      })
    })

    it('should update risk level when score changes', async () => {
      const { RiskAssessmentService } = require('../../src/services/riskAssessmentService')
      const mockInstance = new RiskAssessmentService()
      mockInstance.calculateRiskScore.mockReturnValue(80)
      mockInstance.determineRiskLevel.mockReturnValue('critical')
      mockInstance.getRecommendedMargin.mockReturnValue(35)

      render(<RiskAssessmentMatrix {...defaultProps} />)

      const impactSlider = screen.getAllByRole('slider')[0]
      fireEvent.change(impactSlider, { target: { value: '5' } })

      await waitFor(() => {
        expect(screen.getByText('80%')).toBeInTheDocument()
        expect(screen.getByText('حرج')).toBeInTheDocument()
        expect(screen.getByText('35%')).toBeInTheDocument()
      })
    })
  })

  describe('Mitigation Plan', () => {
    it('should update mitigation plan when text area changes', async () => {
      const user = userEvent.setup()
      render(<RiskAssessmentMatrix {...defaultProps} />)

      const mitigationPlanTextarea = screen.getByPlaceholderText('اكتب خطة شاملة لإدارة المخاطر...')
      
      await user.type(mitigationPlanTextarea, 'خطة إدارة المخاطر الجديدة')

      expect(mitigationPlanTextarea).toHaveValue('خطة إدارة المخاطر الجديدة')
    })
  })

  describe('Save Functionality', () => {
    it('should call onSave with assessment data when save button is clicked', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<RiskAssessmentMatrix {...defaultProps} onSave={onSave} />)

      const saveButton = screen.getByText('حفظ التقييم')
      await user.click(saveButton)

      expect(onSave).toHaveBeenCalledWith(mockAssessment)
    })

    it('should close dialog after saving', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<RiskAssessmentMatrix {...defaultProps} onClose={onClose} />)

      const saveButton = screen.getByText('حفظ التقييم')
      await user.click(saveButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Initial Assessment', () => {
    it('should load initial assessment data when provided', () => {
      const initialAssessment: RiskAssessment = {
        factors: [
          {
            id: 'technical',
            name: 'التعقيد التقني',
            description: 'مستوى التعقيد التقني للمشروع',
            impact: 5,
            probability: 4,
            mitigation: 'استراتيجية محددة مسبقاً',
          },
        ],
        overallRiskLevel: 'high',
        riskScore: 80,
        recommendedMargin: 25,
        mitigationPlan: 'خطة موجودة مسبقاً',
      }

      render(<RiskAssessmentMatrix {...defaultProps} initialAssessment={initialAssessment} />)

      expect(screen.getByDisplayValue('استراتيجية محددة مسبقاً')).toBeInTheDocument()
      expect(screen.getByDisplayValue('خطة موجودة مسبقاً')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<RiskAssessmentMatrix {...defaultProps} />)

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby')
    })

    it('should have accessible slider labels', () => {
      render(<RiskAssessmentMatrix {...defaultProps} />)

      const sliders = screen.getAllByRole('slider')
      sliders.forEach(slider => {
        expect(slider).toHaveAttribute('aria-label')
      })
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<RiskAssessmentMatrix {...defaultProps} />)

      // Tab through interactive elements
      await user.tab()
      expect(screen.getAllByRole('slider')[0]).toHaveFocus()
    })
  })

  describe('Risk Level Indicators', () => {
    it('should display correct colors for different risk levels', () => {
      const { RiskAssessmentService } = require('../../src/services/riskAssessmentService')
      const mockInstance = new RiskAssessmentService()

      // Test low risk
      mockInstance.determineRiskLevel.mockReturnValue('low')
      const { rerender } = render(<RiskAssessmentMatrix {...defaultProps} />)
      expect(screen.getByText('منخفض')).toBeInTheDocument()

      // Test high risk
      mockInstance.determineRiskLevel.mockReturnValue('high')
      rerender(<RiskAssessmentMatrix {...defaultProps} />)
      expect(screen.getByText('عالي')).toBeInTheDocument()

      // Test critical risk
      mockInstance.determineRiskLevel.mockReturnValue('critical')
      rerender(<RiskAssessmentMatrix {...defaultProps} />)
      expect(screen.getByText('حرج')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing risk factors gracefully', () => {
      const { RiskAssessmentService } = require('../../src/services/riskAssessmentService')
      const mockInstance = new RiskAssessmentService()
      mockInstance.getDefaultRiskFactors.mockReturnValue([])

      render(<RiskAssessmentMatrix {...defaultProps} />)

      expect(screen.getByText('لا توجد عوامل مخاطر متاحة')).toBeInTheDocument()
    })

    it('should validate required fields before saving', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<RiskAssessmentMatrix {...defaultProps} onSave={onSave} />)

      // Clear mitigation plan
      const mitigationPlanTextarea = screen.getByPlaceholderText('اكتب خطة شاملة لإدارة المخاطر...')
      await user.clear(mitigationPlanTextarea)

      const saveButton = screen.getByText('حفظ التقييم')
      await user.click(saveButton)

      expect(screen.getByText('يرجى إدخال خطة إدارة المخاطر')).toBeInTheDocument()
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should debounce risk calculations', async () => {
      const { RiskAssessmentService } = require('../../src/services/riskAssessmentService')
      const mockInstance = new RiskAssessmentService()
      
      render(<RiskAssessmentMatrix {...defaultProps} />)

      const impactSlider = screen.getAllByRole('slider')[0]
      
      // Trigger multiple rapid changes
      fireEvent.change(impactSlider, { target: { value: '3' } })
      fireEvent.change(impactSlider, { target: { value: '4' } })
      fireEvent.change(impactSlider, { target: { value: '5' } })

      // Should debounce and only calculate once
      await waitFor(() => {
        expect(mockInstance.calculateRiskScore).toHaveBeenCalledTimes(1)
      }, { timeout: 1000 })
    })
  })
})
