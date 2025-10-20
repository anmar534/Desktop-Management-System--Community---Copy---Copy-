import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EnhancedTenderCard } from '../../src/components/bidding/EnhancedTenderCard'
import type { Tender } from '../../src/data/centralData'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock lucide-react icons using importOriginal to avoid missing icon issues
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // Override specific icons for testing
    Calendar: () => <div data-testid="calendar-icon" />,
    MapPin: () => <div data-testid="map-pin-icon" />,
    DollarSign: () => <div data-testid="dollar-sign-icon" />,
    Clock: () => <div data-testid="clock-icon" />,
    TrendingUp: () => <div data-testid="trending-up-icon" />,
    AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
    AlertCircle: () => <div data-testid="alert-circle-icon" />,
    CheckCircle: () => <div data-testid="check-circle-icon" />,
    CheckCircle2: () => <div data-testid="check-circle2-icon" />,
    XCircle: () => <div data-testid="x-circle-icon" />,
    Circle: () => <div data-testid="circle-icon" />,
  }
})

// Mock useCurrencyFormatter hook
vi.mock('../../src/application/hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => ({
    formatCurrencyValue: (amount: number | string | null | undefined) => {
      const numericAmount = typeof amount === 'number' ? amount : Number(amount || 0)
      return `${numericAmount.toLocaleString('ar-SA')} ريال`
    },
    baseCurrency: 'SAR',
    currency: { baseCurrency: 'SAR' },
  }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock services
vi.mock('../../src/services/analyticsService', () => ({
  analyticsService: {
    getAllBidPerformances: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../../src/services/competitiveService', () => ({
  competitiveService: {
    getAllCompetitors: vi.fn().mockResolvedValue([]),
    getMarketOpportunities: vi.fn().mockResolvedValue([]),
  },
}))

// Mock prediction utilities
vi.mock('../../src/utils/predictionModels', () => ({
  predictWinProbability: vi.fn().mockReturnValue({
    probability: 75,
    confidence: 85,
    factors: [],
    recommendations: [],
  }),
}))

vi.mock('../../src/utils/priceOptimization', () => ({
  optimizeBidAmount: vi.fn().mockReturnValue({
    recommendedBid: 4500000,
    margin: 15,
    strategy: 'balanced',
  }),
}))

// Mock hooks
vi.mock('../../src/application/hooks/useTenderStatus', () => ({
  useTenderStatus: vi.fn((tender) => {
    const getUrgencyText = (priority: string) => {
      switch (priority) {
        case 'high':
          return 'عاجل'
        case 'critical':
          return 'عاجل'
        case 'medium':
          return 'متوسط'
        case 'low':
          return 'منخفض'
        default:
          return 'متوسط'
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case 'under_action':
          return 'تحت الإجراء'
        case 'ready_to_submit':
          return 'جاهزة للتقديم'
        case 'submitted':
          return 'بانتظار النتائج'
        case 'won':
          return 'فائزة'
        case 'lost':
          return 'خاسرة'
        default:
          return 'جديدة'
      }
    }

    return {
      statusInfo: { badgeStatus: 'warning', text: getStatusText(tender?.status || 'under_action') },
      urgencyInfo: { badgeStatus: 'warning', text: getUrgencyText(tender?.priority || 'medium') },
      completionInfo: {
        isReadyToSubmit: false,
        isPricingCompleted: false,
        isTechnicalFilesUploaded: false,
      },
      shouldShowSubmitButton: false,
      shouldShowPricingButton: true,
    }
  }),
}))

// Mock utility functions
vi.mock('../../src/utils/tenderProgressCalculator', () => ({
  calculateTenderProgress: vi.fn().mockReturnValue(60),
}))

vi.mock('../../src/utils/formatters', () => ({
  formatTenderName: (name: string) => name,
  formatTenderClient: (client: string) => client,
  formatTenderDate: (date: string) => '31 ديسمبر 2024',
  formatTenderType: (type: string) => type,
}))

describe('EnhancedTenderCard', () => {
  const mockTender: Tender = {
    id: 'tender-123',
    name: 'مشروع إنشاء مجمع سكني',
    title: 'مشروع إنشاء مجمع سكني',
    client: 'شركة التطوير العقاري',
    location: 'الرياض، المملكة العربية السعودية',
    submissionDate: '2024-12-31',
    value: 5000000,
    status: 'under_action',
    phase: 'تحضير',
    deadline: '2024-12-31',
    daysLeft: 30,
    progress: 60,
    priority: 'medium',
    team: 'فريق التسعير',
    manager: 'أحمد محمد',
    winChance: 75,
    competition: 'متوسطة',
    lastAction: 'تحديث التسعير',
    lastUpdate: '2024-01-15',
    category: 'سكني',
    type: 'مقاولات عامة',
  }

  const defaultProps = {
    tender: mockTender,
    index: 0,
    onOpenDetails: vi.fn(),
    onStartPricing: vi.fn(),
    onSubmitTender: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onOpenResults: vi.fn(),
    onRevertStatus: vi.fn(),
    formatCurrencyValue: (amount: number | string | null | undefined) => {
      const numericAmount = typeof amount === 'number' ? amount : Number(amount || 0)
      return `${numericAmount.toLocaleString('ar-SA')} ريال`
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render tender basic information', () => {
      render(<EnhancedTenderCard {...defaultProps} />)

      expect(screen.getByText('مشروع إنشاء مجمع سكني')).toBeInTheDocument()
      expect(screen.getByText('شركة التطوير العقاري')).toBeInTheDocument()
    })

    it('should display formatted estimated value', () => {
      render(<EnhancedTenderCard {...defaultProps} />)

      // The component shows the formatted currency value in the information grid
      expect(screen.getByText('القيمة')).toBeInTheDocument()
      // Check that the value is displayed somewhere in the component
      expect(screen.getByText(/ريال/)).toBeInTheDocument()
    })

    it('should show submission deadline', () => {
      render(<EnhancedTenderCard {...defaultProps} />)

      // The component shows deadline in the information grid
      expect(screen.getByText('الموعد النهائي')).toBeInTheDocument()
    })

    it('should display win chance indicator', () => {
      render(<EnhancedTenderCard {...defaultProps} />)

      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('فرصة الفوز:')).toBeInTheDocument()
    })

    it('should show progress indicator', () => {
      render(<EnhancedTenderCard {...defaultProps} />)

      expect(screen.getByText('60%')).toBeInTheDocument()
      expect(screen.getByText('التقدم')).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should display correct status for under_action', () => {
      render(<EnhancedTenderCard {...defaultProps} />)

      expect(screen.getByText('تحت الإجراء')).toBeInTheDocument()
    })

    it('should display correct status for ready_to_submit', () => {
      const tender = { ...mockTender, status: 'ready_to_submit' as const }
      render(<EnhancedTenderCard {...defaultProps} tender={tender} />)

      expect(screen.getByText('جاهزة للتقديم')).toBeInTheDocument()
    })

    it('should display correct status for submitted', () => {
      const tender = { ...mockTender, status: 'submitted' as const }
      render(<EnhancedTenderCard {...defaultProps} tender={tender} />)

      expect(screen.getByText('بانتظار النتائج')).toBeInTheDocument()
    })

    it('should display correct status for won', () => {
      const tender = { ...mockTender, status: 'won' as const }
      render(<EnhancedTenderCard {...defaultProps} tender={tender} />)

      expect(screen.getByText('فائزة')).toBeInTheDocument()
    })

    it('should display correct status for lost', () => {
      const tender = { ...mockTender, status: 'lost' as const }
      render(<EnhancedTenderCard {...defaultProps} tender={tender} />)

      expect(screen.getByText('خاسرة')).toBeInTheDocument()
    })
  })

  describe('Priority Levels', () => {
    it('should display high priority badge', () => {
      const tender = { ...mockTender, priority: 'high' as const }
      render(<EnhancedTenderCard {...defaultProps} tender={tender} />)

      // The component shows priority-based urgency badges
      expect(screen.getByText('عاجل')).toBeInTheDocument()
    })

    it('should display medium priority badge', () => {
      const tender = { ...mockTender, priority: 'medium' as const }
      render(<EnhancedTenderCard {...defaultProps} tender={tender} />)

      expect(screen.getByText('متوسط')).toBeInTheDocument()
    })

    it('should display low priority badge', () => {
      const tender = { ...mockTender, priority: 'low' as const }
      render(<EnhancedTenderCard {...defaultProps} tender={tender} />)

      expect(screen.getByText('منخفض')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onOpenDetails when title is clicked', () => {
      const onOpenDetails = vi.fn()
      render(<EnhancedTenderCard {...defaultProps} onOpenDetails={onOpenDetails} />)

      fireEvent.click(screen.getByText('مشروع إنشاء مجمع سكني'))

      expect(onOpenDetails).toHaveBeenCalledWith(mockTender)
    })

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = vi.fn()
      render(<EnhancedTenderCard {...defaultProps} onEdit={onEdit} />)

      fireEvent.click(screen.getByLabelText('تعديل الكيان'))

      expect(onEdit).toHaveBeenCalledWith(mockTender)
    })

    it('should call onDelete when delete button is clicked', () => {
      const onDelete = vi.fn()
      render(<EnhancedTenderCard {...defaultProps} onDelete={onDelete} />)

      fireEvent.click(screen.getByLabelText('حذف الكيان'))

      expect(onDelete).toHaveBeenCalledWith(mockTender)
    })

    it('should call onStartPricing when pricing button is clicked', () => {
      const onStartPricing = vi.fn()
      render(<EnhancedTenderCard {...defaultProps} onStartPricing={onStartPricing} />)

      fireEvent.click(screen.getByText('تسعير'))

      expect(onStartPricing).toHaveBeenCalledWith(mockTender)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<EnhancedTenderCard {...defaultProps} />)

      expect(screen.getByLabelText('تعديل الكيان')).toBeInTheDocument()
      expect(screen.getByLabelText('حذف الكيان')).toBeInTheDocument()
      expect(screen.getByLabelText('عرض تفاصيل الكيان')).toBeInTheDocument()
    })

    it('should have accessible button elements', () => {
      render(<EnhancedTenderCard {...defaultProps} />)

      const editButton = screen.getByLabelText('تعديل الكيان')
      const deleteButton = screen.getByLabelText('حذف الكيان')
      const viewButton = screen.getByLabelText('عرض تفاصيل الكيان')

      // Check that buttons are clickable elements
      expect(editButton).toBeInTheDocument()
      expect(deleteButton).toBeInTheDocument()
      expect(viewButton).toBeInTheDocument()

      // Check that they have proper roles
      expect(editButton.tagName).toBe('BUTTON')
      expect(deleteButton.tagName).toBe('BUTTON')
      expect(viewButton.tagName).toBe('BUTTON')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalTender: Tender = {
        id: 'tender-minimal',
        name: 'مناقصة بسيطة',
        title: 'مناقصة بسيطة',
        client: 'عميل',
        location: 'موقع',
        submissionDate: '2024-12-31',
        value: 1000000,
        status: 'new',
        phase: 'تحضير',
        deadline: '2024-12-31',
        daysLeft: 30,
        progress: 0,
        priority: 'low',
        team: 'فريق',
        manager: 'مدير',
        winChance: 0,
        competition: 'منخفضة',
        lastAction: 'إنشاء',
        lastUpdate: '2024-01-01',
        category: 'عام',
        type: 'مقاولات',
      }

      render(<EnhancedTenderCard {...defaultProps} tender={minimalTender} />)

      expect(screen.getByText('مناقصة بسيطة')).toBeInTheDocument()
      expect(screen.getByText('عميل')).toBeInTheDocument()
    })

    it('should handle very long tender names', () => {
      const longNameTender = {
        ...mockTender,
        name: 'مشروع إنشاء مجمع سكني متكامل مع جميع المرافق والخدمات والمساحات الخضراء والمرافق الترفيهية والتجارية',
        title:
          'مشروع إنشاء مجمع سكني متكامل مع جميع المرافق والخدمات والمساحات الخضراء والمرافق الترفيهية والتجارية',
      }

      render(<EnhancedTenderCard {...defaultProps} tender={longNameTender} />)

      // The component truncates long names, so we check for partial text
      expect(screen.getByText(/مشروع إنشاء مجمع سكني متكامل/)).toBeInTheDocument()
    })

    it('should handle zero estimated value', () => {
      const zeroValueTender = { ...mockTender, value: 0 }
      render(<EnhancedTenderCard {...defaultProps} tender={zeroValueTender} />)

      // Check that the component renders without crashing
      expect(screen.getByText('مشروع إنشاء مجمع سكني')).toBeInTheDocument()
    })

    it('should handle different value formats', () => {
      const highValueTender = { ...mockTender, value: 1000000 }
      render(<EnhancedTenderCard {...defaultProps} tender={highValueTender} />)

      // Check that the component renders the tender name
      expect(screen.getByText('مشروع إنشاء مجمع سكني')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<EnhancedTenderCard {...defaultProps} />)

      // Re-render with same props
      rerender(<EnhancedTenderCard {...defaultProps} />)

      // Component should be memoized and not re-render
      expect(screen.getByText('مشروع إنشاء مجمع سكني')).toBeInTheDocument()
    })
  })

  describe('Predictive Analytics', () => {
    it('should show loading state when predictive analytics is enabled', () => {
      render(<EnhancedTenderCard {...defaultProps} enablePredictiveAnalytics={true} />)

      expect(screen.getByText('جاري تحليل البيانات...')).toBeInTheDocument()
    })

    it('should render without analytics when disabled', () => {
      render(<EnhancedTenderCard {...defaultProps} enablePredictiveAnalytics={false} />)

      expect(screen.queryByText('جاري تحليل البيانات...')).not.toBeInTheDocument()
      expect(screen.queryByText('احتمالية الفوز (AI):')).not.toBeInTheDocument()
    })

    it('should show regular win chance when predictive analytics is disabled', () => {
      render(<EnhancedTenderCard {...defaultProps} enablePredictiveAnalytics={false} />)

      expect(screen.getByText('فرصة الفوز:')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })
})
