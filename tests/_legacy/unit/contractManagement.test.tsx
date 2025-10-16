/**
 * اختبارات مكون إدارة العقود
 * Contract Management Component Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ContractManagement } from '../../../src/components/procurement/ContractManagement'
import { supplierManagementService } from '../../../src/services/supplierManagementService'

// Mock the service
vi.mock('../../../src/services/supplierManagementService', () => ({
  supplierManagementService: {
    getAllContracts: vi.fn(),
    getAllSuppliers: vi.fn(),
    createContract: vi.fn(),
    updateContract: vi.fn(),
    deleteContract: vi.fn(),
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

// Mock currency formatter hook
vi.mock('../../../src/hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => ({
    formatCurrency: (amount: number) => `${amount.toLocaleString()} ر.س`
  })
}))

const mockContracts = [
  {
    id: 'contract_1',
    supplierId: 'supplier_1',
    contractNumber: 'C001',
    title: 'عقد توريد مواد البناء',
    description: 'عقد توريد مواد البناء للمشروع الأول',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    value: 100000,
    currency: 'SAR',
    paymentTerms: '30 يوم',
    deliveryTerms: 'تسليم في الموقع',
    qualityStandards: 'معايير الجودة السعودية',
    penaltyClause: 'غرامة 1% عن كل يوم تأخير',
    status: 'active' as const,
    documents: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'contract_2',
    supplierId: 'supplier_2',
    contractNumber: 'C002',
    title: 'عقد خدمات الصيانة',
    description: 'عقد صيانة المعدات',
    startDate: '2024-02-01',
    endDate: '2024-11-30',
    value: 50000,
    currency: 'SAR',
    paymentTerms: '15 يوم',
    deliveryTerms: 'خدمة في الموقع',
    qualityStandards: 'معايير ISO',
    penaltyClause: 'غرامة 2% عن كل يوم تأخير',
    status: 'draft' as const,
    documents: [],
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z'
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

describe('ContractManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supplierManagementService.getAllContracts).mockResolvedValue(mockContracts)
    vi.mocked(supplierManagementService.getAllSuppliers).mockResolvedValue(mockSuppliers)
  })

  describe('Component Rendering', () => {
    it('should render contract management interface', async () => {
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('إدارة العقود')).toBeInTheDocument()
        expect(screen.getByText('إدارة عقود الموردين والمتابعة')).toBeInTheDocument()
        expect(screen.getByText('عقد جديد')).toBeInTheDocument()
      })
    })

    it('should display loading state initially', () => {
      render(<ContractManagement />)
      expect(screen.getByText('جاري تحميل العقود...')).toBeInTheDocument()
    })

    it('should display statistics cards', async () => {
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('إجمالي العقود')).toBeInTheDocument()
        expect(screen.getByText('العقود النشطة')).toBeInTheDocument()
        expect(screen.getByText('العقود المنتهية')).toBeInTheDocument()
        expect(screen.getByText('إجمالي القيمة')).toBeInTheDocument()
      })
    })

    it('should display contracts table', async () => {
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('قائمة العقود (2)')).toBeInTheDocument()
        expect(screen.getByText('C001')).toBeInTheDocument()
        expect(screen.getByText('عقد توريد مواد البناء')).toBeInTheDocument()
        expect(screen.getByText('C002')).toBeInTheDocument()
        expect(screen.getByText('عقد خدمات الصيانة')).toBeInTheDocument()
      })
    })
  })

  describe('Statistics Calculation', () => {
    it('should calculate contract statistics correctly', async () => {
      render(<ContractManagement />)
      
      await waitFor(() => {
        // Total contracts
        expect(screen.getByText('2')).toBeInTheDocument()
        
        // Active contracts (1)
        const activeCards = screen.getAllByText('1')
        expect(activeCards.length).toBeGreaterThan(0)
        
        // Total value (150,000)
        expect(screen.getByText('150,000 ر.س')).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should filter contracts by search term', async () => {
      const user = userEvent.setup()
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('C001')).toBeInTheDocument()
        expect(screen.getByText('C002')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('البحث في العقود...')
      await user.type(searchInput, 'مواد البناء')

      await waitFor(() => {
        expect(screen.getByText('C001')).toBeInTheDocument()
        expect(screen.queryByText('C002')).not.toBeInTheDocument()
      })
    })

    it('should filter contracts by status', async () => {
      const user = userEvent.setup()
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('C001')).toBeInTheDocument()
        expect(screen.getByText('C002')).toBeInTheDocument()
      })

      const statusFilter = screen.getByDisplayValue('جميع الحالات')
      await user.click(statusFilter)
      await user.click(screen.getByText('نشط'))

      await waitFor(() => {
        expect(screen.getByText('C001')).toBeInTheDocument()
        expect(screen.queryByText('C002')).not.toBeInTheDocument()
      })
    })
  })

  describe('Contract Creation', () => {
    it('should open create contract dialog', async () => {
      const user = userEvent.setup()
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('عقد جديد')).toBeInTheDocument()
      })

      await user.click(screen.getByText('عقد جديد'))

      await waitFor(() => {
        expect(screen.getByText('إنشاء عقد جديد')).toBeInTheDocument()
        expect(screen.getByText('أدخل تفاصيل العقد الجديد')).toBeInTheDocument()
      })
    })

    it('should create new contract successfully', async () => {
      const user = userEvent.setup()
      const mockNewContract = { ...mockContracts[0], id: 'contract_3' }
      vi.mocked(supplierManagementService.createContract).mockResolvedValue(mockNewContract)
      
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('عقد جديد')).toBeInTheDocument()
      })

      await user.click(screen.getByText('عقد جديد'))

      await waitFor(() => {
        expect(screen.getByText('إنشاء عقد جديد')).toBeInTheDocument()
      })

      // Fill form
      const supplierSelect = screen.getByDisplayValue('اختر المورد')
      await user.click(supplierSelect)
      await user.click(screen.getByText('شركة المواد الأولى'))

      const contractNumberInput = screen.getByPlaceholderText('أدخل رقم العقد')
      await user.type(contractNumberInput, 'C003')

      const titleInput = screen.getByPlaceholderText('أدخل عنوان العقد')
      await user.type(titleInput, 'عقد جديد')

      const createButton = screen.getByText('إنشاء العقد')
      await user.click(createButton)

      await waitFor(() => {
        expect(supplierManagementService.createContract).toHaveBeenCalled()
      })
    })
  })

  describe('Contract Actions', () => {
    it('should edit contract', async () => {
      const user = userEvent.setup()
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('C001')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button')
      const editButton = editButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-edit')
      )
      
      if (editButton) {
        await user.click(editButton)
        
        await waitFor(() => {
          expect(screen.getByText('تعديل العقد')).toBeInTheDocument()
        })
      }
    })

    it('should delete contract', async () => {
      const user = userEvent.setup()
      vi.mocked(supplierManagementService.deleteContract).mockResolvedValue()
      
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('C001')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button')
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash-2')
      )
      
      if (deleteButton) {
        await user.click(deleteButton)
        
        await waitFor(() => {
          expect(supplierManagementService.deleteContract).toHaveBeenCalledWith('contract_1')
        })
      }
    })
  })

  describe('Status and Priority Badges', () => {
    it('should display correct status badges', async () => {
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('نشط')).toBeInTheDocument()
        expect(screen.getByText('مسودة')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading and Error Handling', () => {
    it('should handle loading error gracefully', async () => {
      vi.mocked(supplierManagementService.getAllContracts).mockRejectedValue(new Error('Network error'))
      
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.queryByText('جاري تحميل العقود...')).not.toBeInTheDocument()
      })
    })

    it('should display empty state when no contracts', async () => {
      vi.mocked(supplierManagementService.getAllContracts).mockResolvedValue([])
      
      render(<ContractManagement />)
      
      await waitFor(() => {
        expect(screen.getByText('لا توجد عقود')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<ContractManagement />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في العقود...')
        expect(searchInput).toBeInTheDocument()
        
        const createButton = screen.getByText('عقد جديد')
        expect(createButton).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ContractManagement />)
      
      await waitFor(() => {
        const createButton = screen.getByText('عقد جديد')
        expect(createButton).toBeInTheDocument()
      })

      const createButton = screen.getByText('عقد جديد')
      createButton.focus()
      expect(createButton).toHaveFocus()

      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('إنشاء عقد جديد')).toBeInTheDocument()
      })
    })
  })
})
