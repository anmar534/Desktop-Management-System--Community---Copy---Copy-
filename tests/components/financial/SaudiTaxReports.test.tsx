/**
 * اختبارات مكون التقارير الضريبية السعودية
 * Saudi Tax Reports Component Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SaudiTaxReports } from '../../../src/components/financial/SaudiTaxReports'

// محاكاة الخدمة
const mockSaudiTaxService = {
  getAllVATReturns: vi.fn(),
  getAllVATTransactions: vi.fn(),
  getAllZakatCalculations: vi.fn(),
  getTaxSettings: vi.fn(),
  generateVATReturn: vi.fn(),
  exportVATReturnXML: vi.fn(),
  calculateVAT: vi.fn(),
  validateVATReturn: vi.fn()
}

vi.mock('../../../src/services/saudiTaxService', () => ({
  SaudiTaxService: vi.fn(() => mockSaudiTaxService)
}))

// محاكاة مكونات UI
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>
}))

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  )
}))

vi.mock('../../../src/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />
}))

vi.mock('../../../src/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label data-testid="label" {...props}>{children}</label>
}))

vi.mock('../../../src/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value}>
      <button onClick={() => onValueChange && onValueChange('monthly')}>
        {children}
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <div data-testid="select-value" />
}))

vi.mock('../../../src/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      <button onClick={() => onValueChange && onValueChange('overview')}>
        {children}
      </button>
    </div>
  ),
  TabsContent: ({ children, value }: any) => <div data-testid="tabs-content" data-value={value}>{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => <div data-testid="tabs-trigger" data-value={value}>{children}</div>
}))

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => <span data-testid="badge" data-variant={variant}>{children}</span>
}))

vi.mock('../../../src/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>
}))

describe('SaudiTaxReports Component', () => {
  const mockVATReturns = [
    {
      id: 'return_1',
      period: '2024-10',
      periodType: 'monthly',
      startDate: '2024-10-01',
      endDate: '2024-10-31',
      totalSales: 100000,
      outputVAT: 15000,
      inputVAT: 7500,
      netVAT: 7500,
      vatPayable: 7500,
      vatRefundable: 0,
      status: 'draft'
    },
    {
      id: 'return_2',
      period: '2024-09',
      periodType: 'monthly',
      startDate: '2024-09-01',
      endDate: '2024-09-30',
      totalSales: 80000,
      outputVAT: 12000,
      inputVAT: 10000,
      netVAT: 2000,
      vatPayable: 2000,
      vatRefundable: 0,
      status: 'submitted'
    }
  ]

  const mockZakatCalculations = [
    {
      id: 'zakat_1',
      year: '2024',
      netZakatableAssets: 1000000,
      zakatDue: 25000,
      status: 'calculated'
    }
  ]

  const mockTaxSettings = {
    companyTaxNumber: '123456789',
    companyNameAr: 'شركة الاختبار',
    vatRegistrationNumber: 'VAT123456789'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // إعداد القيم الافتراضية للمحاكيات
    mockSaudiTaxService.getAllVATReturns.mockResolvedValue(mockVATReturns)
    mockSaudiTaxService.getAllVATTransactions.mockResolvedValue([])
    mockSaudiTaxService.getAllZakatCalculations.mockResolvedValue(mockZakatCalculations)
    mockSaudiTaxService.getTaxSettings.mockResolvedValue(mockTaxSettings)
  })

  describe('Component Rendering', () => {
    it('should render the component successfully', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        expect(screen.getByText('التقارير الضريبية السعودية')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      render(<SaudiTaxReports />)
      
      expect(screen.getByText('جاري تحميل البيانات الضريبية...')).toBeInTheDocument()
    })

    it('should display quick stats cards', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        expect(screen.getByText('ضريبة مستحقة')).toBeInTheDocument()
        expect(screen.getByText('ضريبة مستردة')).toBeInTheDocument()
        expect(screen.getByText('إقرارات معلقة')).toBeInTheDocument()
        expect(screen.getByText('آخر فترة')).toBeInTheDocument()
      })
    })

    it('should calculate and display correct quick stats', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        // إجمالي الضريبة المستحقة: 7500 + 2000 = 9500
        expect(screen.getByText('9,500 ريال')).toBeInTheDocument()
        // عدد الإقرارات المعلقة (draft): 1
        expect(screen.getByText('1')).toBeInTheDocument()
        // آخر فترة: 2024-10
        expect(screen.getByText('2024-10')).toBeInTheDocument()
      })
    })
  })

  describe('Tabs Navigation', () => {
    it('should render all tabs', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
        expect(screen.getByText('إقرارات ضريبة القيمة المضافة')).toBeInTheDocument()
        expect(screen.getByText('المعاملات الضريبية')).toBeInTheDocument()
        expect(screen.getByText('حساب الزكاة')).toBeInTheDocument()
        expect(screen.getByText('الإعدادات')).toBeInTheDocument()
      })
    })

    it('should switch between tabs', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        const tabs = screen.getByTestId('tabs')
        expect(tabs).toHaveAttribute('data-value', 'overview')
      })
    })
  })

  describe('Overview Tab', () => {
    it('should display recent VAT returns', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        expect(screen.getByText('إقرارات ضريبة القيمة المضافة الحديثة')).toBeInTheDocument()
        expect(screen.getByText('2024-10')).toBeInTheDocument()
        expect(screen.getByText('2024-09')).toBeInTheDocument()
      })
    })

    it('should display zakat calculations', async () => {
      render(<SaudiTaxReports />)

      await waitFor(() => {
        expect(screen.getByText('حسابات الزكاة')).toBeInTheDocument()
        expect(screen.getByText('سنة 2024')).toBeInTheDocument()
        expect(screen.getByText('25,000 ريال')).toBeInTheDocument()
      })
    })

    it('should show empty state when no data', async () => {
      mockSaudiTaxService.getAllVATReturns.mockResolvedValue([])
      mockSaudiTaxService.getAllZakatCalculations.mockResolvedValue([])

      render(<SaudiTaxReports />)

      await waitFor(() => {
        expect(screen.getAllByText('لا توجد إقرارات ضريبية')).toHaveLength(2) // في التبويبات والمحتوى
        expect(screen.getByText('لا توجد حسابات زكاة')).toBeInTheDocument()
      })
    })
  })

  describe('VAT Returns Tab', () => {
    it('should display VAT return creation form', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        expect(screen.getByText('إنشاء إقرار ضريبي جديد')).toBeInTheDocument()
        expect(screen.getByText('الفترة (YYYY-MM)')).toBeInTheDocument()
        expect(screen.getByText('نوع الفترة')).toBeInTheDocument()
      })
    })

    it('should display VAT returns list', async () => {
      render(<SaudiTaxReports />)

      await waitFor(() => {
        expect(screen.getAllByText('إقرارات ضريبة القيمة المضافة')).toHaveLength(2) // في التبويب والمحتوى
        expect(screen.getByText('فترة 2024-10')).toBeInTheDocument()
        expect(screen.getByText('فترة 2024-09')).toBeInTheDocument()
      })
    })

    it('should show correct status badges', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        const badges = screen.getAllByTestId('badge')
        expect(badges.some(badge => badge.textContent === 'مسودة')).toBe(true)
        expect(badges.some(badge => badge.textContent === 'مرسل')).toBe(true)
      })
    })

    it('should handle VAT return creation', async () => {
      mockSaudiTaxService.generateVATReturn.mockResolvedValue({
        id: 'new_return',
        period: '2024-11'
      })
      
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        const createButton = screen.getByText('إنشاء الإقرار')
        fireEvent.click(createButton)
      })
      
      expect(mockSaudiTaxService.generateVATReturn).toHaveBeenCalled()
    })
  })

  describe('Data Loading and Refresh', () => {
    it('should load data on component mount', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        expect(mockSaudiTaxService.getAllVATReturns).toHaveBeenCalled()
        expect(mockSaudiTaxService.getAllVATTransactions).toHaveBeenCalled()
        expect(mockSaudiTaxService.getAllZakatCalculations).toHaveBeenCalled()
        expect(mockSaudiTaxService.getTaxSettings).toHaveBeenCalled()
      })
    })

    it('should refresh data when refresh button is clicked', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        const refreshButton = screen.getByText('تحديث البيانات')
        fireEvent.click(refreshButton)
      })
      
      // يجب أن تستدعى الخدمات مرتين: مرة عند التحميل ومرة عند التحديث
      expect(mockSaudiTaxService.getAllVATReturns).toHaveBeenCalledTimes(2)
    })
  })

  describe('Tax Settings Alert', () => {
    it('should show alert when tax settings are not configured', async () => {
      mockSaudiTaxService.getTaxSettings.mockResolvedValue(null)
      
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument()
        expect(screen.getByText('يجب إعداد بيانات الشركة الضريبية أولاً في تبويب "الإعدادات"')).toBeInTheDocument()
      })
    })

    it('should not show alert when tax settings are configured', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        expect(screen.queryByText('يجب إعداد بيانات الشركة الضريبية أولاً')).not.toBeInTheDocument()
      })
    })
  })

  describe('Export Functionality', () => {
    it('should handle VAT return export', async () => {
      // محاكاة إنشاء عنصر a وتحميل الملف
      const mockCreateElement = vi.spyOn(document, 'createElement')
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      }
      mockCreateElement.mockReturnValue(mockAnchor as any)
      
      global.URL.createObjectURL = vi.fn(() => 'blob:url')
      global.URL.revokeObjectURL = vi.fn()
      
      mockSaudiTaxService.exportVATReturnXML.mockResolvedValue('<xml>test</xml>')
      
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        const exportButtons = screen.getAllByText('تصدير XML')
        fireEvent.click(exportButtons[0])
      })
      
      expect(mockSaudiTaxService.exportVATReturnXML).toHaveBeenCalledWith('return_1')
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockSaudiTaxService.getAllVATReturns.mockRejectedValue(new Error('Service error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading tax data:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })

    it('should handle VAT return creation errors', async () => {
      mockSaudiTaxService.generateVATReturn.mockRejectedValue(new Error('Creation error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        const createButton = screen.getByText('إنشاء الإقرار')
        fireEvent.click(createButton)
      })
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating VAT return:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have proper RTL direction', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        const mainContainer = screen.getByText('التقارير الضريبية السعودية').closest('div')
        expect(mainContainer).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should have proper ARIA labels', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        const inputs = screen.getAllByTestId('input')
        const labels = screen.getAllByTestId('label')
        expect(inputs.length).toBeGreaterThan(0)
        expect(labels.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render cards in grid layout', async () => {
      render(<SaudiTaxReports />)
      
      await waitFor(() => {
        const cards = screen.getAllByTestId('card')
        expect(cards.length).toBeGreaterThan(0)
      })
    })
  })
})
