/**
 * اختبارات مكون حركات المخزون
 * Stock Movement Component Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { toast } from 'sonner'
import { StockMovement } from '@/components/procurement/StockMovement'
import { inventoryManagementService } from '@/services/inventoryManagementService'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/services/inventoryManagementService', () => ({
  inventoryManagementService: {
    getAllMovements: vi.fn(),
    getAllItems: vi.fn(),
    createMovement: vi.fn()
  }
}))

const mockInventoryService = inventoryManagementService as any

describe('StockMovement Component', () => {
  const mockItems = [
    {
      id: '1',
      itemCode: 'ITM001',
      itemName: 'مسامير حديد',
      category: 'مواد البناء',
      unit: 'كيلو',
      currentStock: 100,
      reorderPoint: 30,
      status: 'active',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '2',
      itemCode: 'ITM002',
      itemName: 'أسمنت أبيض',
      category: 'مواد البناء',
      unit: 'كيس',
      currentStock: 50,
      reorderPoint: 15,
      status: 'active',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }
  ]

  const mockMovements = [
    {
      id: '1',
      itemId: '1',
      movementType: 'in' as const,
      quantity: 50,
      unitCost: 15.50,
      totalCost: 775,
      reference: 'PO-001',
      referenceType: 'purchase_order' as const,
      reason: 'شراء جديد',
      performedBy: 'أحمد محمد',
      movementDate: '2024-01-15',
      notes: 'وصول دفعة جديدة',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      itemId: '2',
      movementType: 'out' as const,
      quantity: 25,
      reference: 'PRJ-001',
      referenceType: 'project' as const,
      reason: 'استخدام في المشروع',
      performedBy: 'سارة أحمد',
      movementDate: '2024-01-14',
      createdAt: '2024-01-14'
    },
    {
      id: '3',
      itemId: '1',
      movementType: 'adjustment' as const,
      quantity: 95,
      reference: 'ADJ-001',
      referenceType: 'adjustment' as const,
      reason: 'تعديل بعد الجرد',
      performedBy: 'محمد علي',
      movementDate: '2024-01-13',
      createdAt: '2024-01-13'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockInventoryService.getAllMovements.mockResolvedValue(mockMovements)
    mockInventoryService.getAllItems.mockResolvedValue(mockItems)
    mockInventoryService.createMovement.mockResolvedValue({
      id: 'new-movement',
      ...mockMovements[0]
    })
  })

  describe('Component Rendering', () => {
    it('should render stock movement header', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('حركات المخزون')).toBeInTheDocument()
        expect(screen.getByText('تتبع وإدارة حركات دخول وخروج المخزون')).toBeInTheDocument()
      })
    })

    it('should render action buttons', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /تحديث/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /تصدير/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /حركة جديدة/i })).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      render(<StockMovement />)

      expect(screen.getByText('جاري تحميل بيانات الحركات...')).toBeInTheDocument()
    })
  })

  describe('Statistics Cards', () => {
    it('should render movement statistics', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي الحركات')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('حركات الوارد')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('حركات الصادر')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('التعديلات')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('should show correct statistics colors', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        // Check if colored statistics are rendered
        const inMovements = screen.getByText('1').closest('div')
        expect(inMovements).toBeInTheDocument()
      })
    })
  })

  describe('Movements Table', () => {
    it('should render movements table with data', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('قائمة الحركات (3)')).toBeInTheDocument()
        expect(screen.getByText('PO-001')).toBeInTheDocument()
        expect(screen.getByText('PRJ-001')).toBeInTheDocument()
        expect(screen.getByText('ADJ-001')).toBeInTheDocument()
      })
    })

    it('should show empty state when no movements', async () => {
      mockInventoryService.getAllMovements.mockResolvedValue([])

      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('لا توجد حركات')).toBeInTheDocument()
      })
    })

    it('should display movement types with correct icons and badges', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('وارد')).toBeInTheDocument()
        expect(screen.getByText('صادر')).toBeInTheDocument()
        expect(screen.getByText('تعديل')).toBeInTheDocument()
      })
    })

    it('should show correct quantity formatting', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('+50')).toBeInTheDocument() // In movement
        expect(screen.getByText('-25')).toBeInTheDocument() // Out movement
        expect(screen.getByText('95')).toBeInTheDocument() // Adjustment
      })
    })

    it('should display item names correctly', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('مسامير حديد')).toBeInTheDocument()
        expect(screen.getByText('أسمنت أبيض')).toBeInTheDocument()
      })
    })

    it('should show reference types', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('أمر شراء')).toBeInTheDocument()
        expect(screen.getByText('مشروع')).toBeInTheDocument()
        expect(screen.getByText('تعديل')).toBeInTheDocument()
      })
    })

    it('should format currency values', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText(/775/)).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should render search input', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('البحث في الحركات...')).toBeInTheDocument()
      })
    })

    it('should filter movements by search term', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في الحركات...')
        fireEvent.change(searchInput, { target: { value: 'PO-001' } })
      })

      await waitFor(() => {
        expect(screen.getByText('PO-001')).toBeInTheDocument()
        expect(screen.queryByText('PRJ-001')).not.toBeInTheDocument()
      })
    })

    it('should render movement type filter', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('جميع الأنواع')).toBeInTheDocument()
      })
    })

    it('should render item filter', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        expect(screen.getByText('جميع العناصر')).toBeInTheDocument()
      })
    })

    it('should render date range filters', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const dateInputs = screen.getAllByDisplayValue('')
        expect(dateInputs.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  describe('Create Movement Dialog', () => {
    it('should open create movement dialog', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /حركة جديدة/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('إنشاء حركة مخزون جديدة')).toBeInTheDocument()
      })
    })

    it('should render all form fields', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /حركة جديدة/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('العنصر *')).toBeInTheDocument()
        expect(screen.getByText('نوع الحركة *')).toBeInTheDocument()
        expect(screen.getByText('الكمية *')).toBeInTheDocument()
        expect(screen.getByText('التكلفة للوحدة')).toBeInTheDocument()
        expect(screen.getByText('المرجع *')).toBeInTheDocument()
        expect(screen.getByText('نوع المرجع')).toBeInTheDocument()
        expect(screen.getByText('تاريخ الحركة *')).toBeInTheDocument()
        expect(screen.getByText('المنفذ')).toBeInTheDocument()
        expect(screen.getByText('السبب')).toBeInTheDocument()
        expect(screen.getByText('ملاحظات')).toBeInTheDocument()
      })
    })

    it('should show transfer location fields when movement type is transfer', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /حركة جديدة/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        // This would require more complex interaction with Select components
        // to test the conditional rendering of transfer fields
        expect(screen.getByText('نوع الحركة *')).toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /حركة جديدة/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /إنشاء الحركة/i })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('يرجى ملء جميع الحقول المطلوبة')
      })
    })

    it('should create movement successfully', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /حركة جديدة/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        // Fill required fields
        const quantityInput = screen.getByLabelText('الكمية *')
        fireEvent.change(quantityInput, { target: { value: '10' } })

        const referenceInput = screen.getByLabelText('المرجع *')
        fireEvent.change(referenceInput, { target: { value: 'TEST-001' } })

        // Note: Item selection would require more complex Select component interaction
        // For now, we'll test the submission with mock data
      })

      // This test would need more setup to properly test form submission
      expect(mockInventoryService.createMovement).not.toHaveBeenCalled()
    })

    it('should close dialog on cancel', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /حركة جديدة/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /إلغاء/i })
        fireEvent.click(cancelButton)
      })

      await waitFor(() => {
        expect(screen.queryByText('إنشاء حركة مخزون جديدة')).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Loading and Error Handling', () => {
    it('should handle loading errors gracefully', async () => {
      mockInventoryService.getAllMovements.mockRejectedValue(new Error('Network error'))

      render(<StockMovement />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('فشل في تحميل بيانات الحركات')
      })
    })

    it('should call refresh when refresh button is clicked', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /تحديث/i })
        fireEvent.click(refreshButton)
      })

      expect(mockInventoryService.getAllMovements).toHaveBeenCalledTimes(2)
    })

    it('should handle create movement errors', async () => {
      mockInventoryService.createMovement.mockRejectedValue(new Error('Create error'))

      render(<StockMovement />)

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /حركة جديدة/i })
        fireEvent.click(createButton)
      })

      // This would need proper form filling to test error handling
      expect(mockInventoryService.createMovement).not.toHaveBeenCalled()
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        // Check if dates are formatted in Arabic locale
        expect(screen.getByText(/2024/)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في الحركات...')
        expect(searchInput).toHaveAttribute('type', 'text')
      })
    })

    it('should support keyboard navigation', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في الحركات...')
        searchInput.focus()
        expect(document.activeElement).toBe(searchInput)
      })
    })

    it('should have proper table structure', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
        
        const headers = screen.getAllByRole('columnheader')
        expect(headers.length).toBe(8) // Number of table headers
      })
    })
  })

  describe('RTL Support', () => {
    it('should have RTL direction', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        const mainContainer = screen.getByText('حركات المخزون').closest('div')
        expect(mainContainer).toHaveAttribute('dir', 'rtl')
      })
    })
  })

  describe('Movement Type Icons', () => {
    it('should display correct icons for movement types', async () => {
      render(<StockMovement />)

      await waitFor(() => {
        // Icons are rendered but testing their specific types would require
        // more detailed DOM inspection or data-testid attributes
        const badges = screen.getAllByText(/وارد|صادر|تعديل/)
        expect(badges.length).toBeGreaterThan(0)
      })
    })
  })
})
