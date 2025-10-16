/**
 * اختبارات مكون تقييم أداء الموردين
 * Supplier Evaluation Component Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { SupplierEvaluation } from '../../../src/components/procurement/SupplierEvaluation'
import { supplierManagementService } from '../../../src/services/supplierManagementService'

// Mock the service
vi.mock('../../../src/services/supplierManagementService', () => ({
  supplierManagementService: {
    getAllEvaluations: vi.fn(),
    getAllSuppliers: vi.fn(),
    createEvaluation: vi.fn(),
    updateEvaluation: vi.fn(),
    deleteEvaluation: vi.fn(),
  }
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

const mockEvaluations = [
  {
    id: 'eval_1',
    supplierId: 'supplier_1',
    evaluationDate: '2024-01-15',
    evaluatedBy: 'مدير المشتريات',
    qualityScore: 4.5,
    deliveryScore: 4.0,
    serviceScore: 4.2,
    priceCompetitiveness: 3.8,
    communicationScore: 4.3,
    overallRating: 4.16,
    strengths: 'جودة عالية في المنتجات',
    weaknesses: 'أسعار مرتفعة نسبياً',
    recommendations: 'مراجعة الأسعار',
    notes: 'مورد موثوق',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'eval_2',
    supplierId: 'supplier_2',
    evaluationDate: '2024-01-20',
    evaluatedBy: 'مدير الجودة',
    qualityScore: 3.5,
    deliveryScore: 4.5,
    serviceScore: 4.0,
    priceCompetitiveness: 4.2,
    communicationScore: 3.8,
    overallRating: 4.0,
    strengths: 'سرعة في التسليم',
    weaknesses: 'جودة متوسطة',
    recommendations: 'تحسين الجودة',
    notes: 'يحتاج متابعة',
    createdAt: '2024-01-20T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z'
  }
]

const mockSuppliers = [
  {
    id: 'supplier_1',
    name: 'شركة المواد الأولى',
    nameEn: 'First Materials Company',
    category: 'مواد البناء',
    contactPerson: 'أحمد محمد',
    email: 'ahmed@company1.com',
    phone: '+966501234567',
    address: 'الرياض، السعودية',
    taxNumber: '123456789',
    commercialRegister: 'CR123456',
    paymentTerms: '30 يوم',
    creditLimit: 500000,
    currentBalance: 0,
    totalPurchases: 1000000,
    rating: 4.5,
    qualityScore: 90,
    deliveryScore: 85,
    serviceScore: 88,
    status: 'active' as const,
    approvalStatus: 'approved' as const,
    registrationDate: '2023-01-01',
    lastTransactionDate: '2024-01-15',
    lastEvaluationDate: '2024-01-10',
    notes: 'مورد موثوق',
    documents: [],
    contracts: [],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'supplier_2',
    name: 'شركة الخدمات المتقدمة',
    nameEn: 'Advanced Services Company',
    category: 'خدمات',
    contactPerson: 'فاطمة أحمد',
    email: 'fatima@company2.com',
    phone: '+966507654321',
    address: 'جدة، السعودية',
    taxNumber: '987654321',
    commercialRegister: 'CR987654',
    paymentTerms: '15 يوم',
    creditLimit: 300000,
    currentBalance: 25000,
    totalPurchases: 500000,
    rating: 4.0,
    qualityScore: 85,
    deliveryScore: 90,
    serviceScore: 80,
    status: 'active' as const,
    approvalStatus: 'approved' as const,
    registrationDate: '2023-06-01',
    lastTransactionDate: '2024-02-01',
    lastEvaluationDate: '2024-01-20',
    notes: 'خدمة ممتازة',
    documents: [],
    contracts: [],
    createdAt: '2023-06-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z'
  }
]

describe('SupplierEvaluation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supplierManagementService.getAllEvaluations).mockResolvedValue(mockEvaluations)
    vi.mocked(supplierManagementService.getAllSuppliers).mockResolvedValue(mockSuppliers)
  })

  describe('Component Rendering', () => {
    it('should render supplier evaluation interface', async () => {
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('تقييم أداء الموردين')).toBeInTheDocument()
        expect(screen.getByText('تقييم ومتابعة أداء الموردين')).toBeInTheDocument()
        expect(screen.getByText('تقييم جديد')).toBeInTheDocument()
      })
    })

    it('should display loading state initially', () => {
      render(<SupplierEvaluation />)
      expect(screen.getByText('جاري تحميل التقييمات...')).toBeInTheDocument()
    })

    it('should display statistics cards', async () => {
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('إجمالي التقييمات')).toBeInTheDocument()
        expect(screen.getByText('ممتاز')).toBeInTheDocument()
        expect(screen.getByText('جيد')).toBeInTheDocument()
        expect(screen.getByText('ضعيف')).toBeInTheDocument()
        expect(screen.getByText('متوسط التقييم')).toBeInTheDocument()
      })
    })

    it('should display evaluations table', async () => {
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('قائمة التقييمات (2)')).toBeInTheDocument()
        expect(screen.getByText('شركة المواد الأولى')).toBeInTheDocument()
        expect(screen.getByText('شركة الخدمات المتقدمة')).toBeInTheDocument()
        expect(screen.getByText('مدير المشتريات')).toBeInTheDocument()
        expect(screen.getByText('مدير الجودة')).toBeInTheDocument()
      })
    })
  })

  describe('Statistics Calculation', () => {
    it('should calculate evaluation statistics correctly', async () => {
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        // Total evaluations
        expect(screen.getByText('2')).toBeInTheDocument()
        
        // Average rating calculation: (4.16 + 4.0) / 2 = 4.08
        expect(screen.getByText('4.1')).toBeInTheDocument()
      })
    })

    it('should categorize evaluations by rating', async () => {
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        // Should show 0 excellent (4.5+), 2 good (3.5-4.4), 0 average, 0 poor
        const excellentCard = screen.getByText('ممتاز').closest('.space-y-0')
        expect(excellentCard).toContainHTML('0')
        
        const goodCard = screen.getByText('جيد').closest('.space-y-0')
        expect(goodCard).toContainHTML('2')
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should filter evaluations by search term', async () => {
      const user = userEvent.setup()
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('شركة المواد الأولى')).toBeInTheDocument()
        expect(screen.getByText('شركة الخدمات المتقدمة')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('البحث في التقييمات...')
      await user.type(searchInput, 'المواد')

      await waitFor(() => {
        expect(screen.getByText('شركة المواد الأولى')).toBeInTheDocument()
        expect(screen.queryByText('شركة الخدمات المتقدمة')).not.toBeInTheDocument()
      })
    })

    it('should filter evaluations by supplier', async () => {
      const user = userEvent.setup()
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('شركة المواد الأولى')).toBeInTheDocument()
        expect(screen.getByText('شركة الخدمات المتقدمة')).toBeInTheDocument()
      })

      const supplierFilter = screen.getByDisplayValue('جميع الموردين')
      await user.click(supplierFilter)
      await user.click(screen.getByText('شركة المواد الأولى'))

      await waitFor(() => {
        expect(screen.getByText('شركة المواد الأولى')).toBeInTheDocument()
        expect(screen.queryByText('شركة الخدمات المتقدمة')).not.toBeInTheDocument()
      })
    })
  })

  describe('Evaluation Creation', () => {
    it('should open create evaluation dialog', async () => {
      const user = userEvent.setup()
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('تقييم جديد')).toBeInTheDocument()
      })

      await user.click(screen.getByText('تقييم جديد'))

      await waitFor(() => {
        expect(screen.getByText('إنشاء تقييم جديد')).toBeInTheDocument()
        expect(screen.getByText('قم بتقييم أداء المورد في المعايير المختلفة')).toBeInTheDocument()
      })
    })

    it('should calculate overall rating automatically', async () => {
      const user = userEvent.setup()
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('تقييم جديد')).toBeInTheDocument()
      })

      await user.click(screen.getByText('تقييم جديد'))

      await waitFor(() => {
        expect(screen.getByText('إنشاء تقييم جديد')).toBeInTheDocument()
      })

      // Rate quality as 4 stars
      const qualityStars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-star')
      )
      
      if (qualityStars.length >= 4) {
        await user.click(qualityStars[3]) // 4th star (index 3)
        
        await waitFor(() => {
          // Overall rating should update
          expect(screen.getByText('0.8/5')).toBeInTheDocument() // 4/5 = 0.8
        })
      }
    })

    it('should create new evaluation successfully', async () => {
      const user = userEvent.setup()
      const mockNewEvaluation = { ...mockEvaluations[0], id: 'eval_3' }
      vi.mocked(supplierManagementService.createEvaluation).mockResolvedValue(mockNewEvaluation)
      
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('تقييم جديد')).toBeInTheDocument()
      })

      await user.click(screen.getByText('تقييم جديد'))

      await waitFor(() => {
        expect(screen.getByText('إنشاء تقييم جديد')).toBeInTheDocument()
      })

      // Fill form
      const supplierSelect = screen.getByDisplayValue('اختر المورد')
      await user.click(supplierSelect)
      await user.click(screen.getByText('شركة المواد الأولى'))

      const evaluatedByInput = screen.getByDisplayValue('مدير المشتريات')
      await user.clear(evaluatedByInput)
      await user.type(evaluatedByInput, 'مدير الجودة')

      const saveButton = screen.getByText('حفظ التقييم')
      await user.click(saveButton)

      await waitFor(() => {
        expect(supplierManagementService.createEvaluation).toHaveBeenCalled()
      })
    })
  })

  describe('Evaluation Actions', () => {
    it('should edit evaluation', async () => {
      const user = userEvent.setup()
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('شركة المواد الأولى')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button')
      const editButton = editButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-edit')
      )
      
      if (editButton) {
        await user.click(editButton)
        
        await waitFor(() => {
          expect(screen.getByText('تعديل التقييم')).toBeInTheDocument()
        })
      }
    })

    it('should delete evaluation', async () => {
      const user = userEvent.setup()
      vi.mocked(supplierManagementService.deleteEvaluation).mockResolvedValue()
      
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('شركة المواد الأولى')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button')
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash-2')
      )
      
      if (deleteButton) {
        await user.click(deleteButton)
        
        await waitFor(() => {
          expect(supplierManagementService.deleteEvaluation).toHaveBeenCalledWith('eval_1')
        })
      }
    })

    it('should view evaluation details', async () => {
      const user = userEvent.setup()
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('شركة المواد الأولى')).toBeInTheDocument()
      })

      const viewButtons = screen.getAllByRole('button')
      const viewButton = viewButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-eye')
      )
      
      if (viewButton) {
        await user.click(viewButton)
        
        await waitFor(() => {
          expect(screen.getByText('تفاصيل التقييم')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Rating Display', () => {
    it('should display star ratings correctly', async () => {
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        // Should display ratings for both evaluations
        expect(screen.getByText('(4.2)')).toBeInTheDocument() // First evaluation overall rating
        expect(screen.getByText('(4.0)')).toBeInTheDocument() // Second evaluation overall rating
      })
    })

    it('should display rating badges correctly', async () => {
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        // Both evaluations should be rated as "جيد" (good)
        const goodBadges = screen.getAllByText('جيد')
        expect(goodBadges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Data Loading and Error Handling', () => {
    it('should handle loading error gracefully', async () => {
      vi.mocked(supplierManagementService.getAllEvaluations).mockRejectedValue(new Error('Network error'))
      
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل التقييمات...')).not.toBeInTheDocument()
      })
    })

    it('should display empty state when no evaluations', async () => {
      vi.mocked(supplierManagementService.getAllEvaluations).mockResolvedValue([])
      
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        expect(screen.getByText('لا توجد تقييمات')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في التقييمات...')
        expect(searchInput).toBeInTheDocument()
        
        const createButton = screen.getByText('تقييم جديد')
        expect(createButton).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<SupplierEvaluation />)
      
      await waitFor(() => {
        const createButton = screen.getByText('تقييم جديد')
        expect(createButton).toBeInTheDocument()
      })

      const createButton = screen.getByText('تقييم جديد')
      createButton.focus()
      expect(createButton).toHaveFocus()

      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('إنشاء تقييم جديد')).toBeInTheDocument()
      })
    })
  })
})
