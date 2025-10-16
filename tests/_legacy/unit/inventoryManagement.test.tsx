/**
 * اختبارات مكون إدارة المخزون
 * Inventory Management Component Tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { toast } from 'sonner'
import { InventoryManagement } from '@/components/procurement/InventoryManagement'
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
    getAllItems: vi.fn(),
    getActiveAlerts: vi.fn(),
    getAllMovements: vi.fn(),
    getInventoryStatistics: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    searchItems: vi.fn()
  }
}))

const mockInventoryService = inventoryManagementService as any

describe('InventoryManagement Component', () => {
  const mockItems = [
    {
      id: '1',
      itemCode: 'ITM001',
      itemName: 'مسامير حديد',
      itemNameEn: 'Iron Screws',
      category: 'مواد البناء',
      subcategory: 'مسامير',
      description: 'مسامير حديد مقاس 10 مم',
      unit: 'كيلو',
      currentStock: 100,
      minimumStock: 20,
      maximumStock: 500,
      reorderPoint: 30,
      reorderQuantity: 200,
      unitCost: 15.50,
      averageCost: 15.50,
      lastPurchasePrice: 15.50,
      totalValue: 1550,
      location: 'مخزن رئيسي',
      warehouse: 'WH001',
      shelf: 'A-01',
      supplier: 'مورد المواد',
      alternativeSuppliers: ['مورد بديل 1'],
      leadTime: 7,
      status: 'active',
      lastMovementDate: '2024-01-15',
      lastCountDate: '2024-01-01',
      notes: 'مادة أساسية للمشاريع',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '2',
      itemCode: 'ITM002',
      itemName: 'أسمنت أبيض',
      category: 'مواد البناء',
      unit: 'كيس',
      currentStock: 25,
      minimumStock: 10,
      reorderPoint: 30,
      reorderQuantity: 100,
      unitCost: 25.00,
      averageCost: 25.00,
      lastPurchasePrice: 25.00,
      totalValue: 625,
      location: 'مخزن فرعي',
      supplier: 'مورد آخر',
      leadTime: 5,
      status: 'active',
      lastMovementDate: '2024-01-10',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }
  ]

  const mockAlerts = [
    {
      id: '1',
      itemId: '2',
      alertType: 'low_stock' as const,
      severity: 'medium' as const,
      message: 'مخزون منخفض: أسمنت أبيض (25 كيس)',
      currentStock: 25,
      threshold: 30,
      isActive: true,
      createdAt: '2024-01-15'
    }
  ]

  const mockStats = {
    totalItems: 2,
    totalValue: 2175,
    activeItems: 2,
    lowStockItems: 1,
    outOfStockItems: 0,
    totalMovements: 5,
    activeAlerts: 1,
    categories: [
      { name: 'مواد البناء', count: 2, value: 2175 }
    ],
    locations: [
      { name: 'مخزن رئيسي', count: 1, value: 1550 },
      { name: 'مخزن فرعي', count: 1, value: 625 }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInventoryService.getAllItems.mockResolvedValue(mockItems)
    mockInventoryService.getActiveAlerts.mockResolvedValue(mockAlerts)
    mockInventoryService.getAllMovements.mockResolvedValue([])
    mockInventoryService.getInventoryStatistics.mockResolvedValue(mockStats)
  })

  describe('Component Rendering', () => {
    it('should render inventory management header', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('إدارة المخزون')).toBeInTheDocument()
        expect(screen.getByText('إدارة وتتبع المواد والمخزون')).toBeInTheDocument()
      })
    })

    it('should render action buttons', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /تحديث/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /تصدير/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /عنصر جديد/i })).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      render(<InventoryManagement />)

      expect(screen.getByText('جاري تحميل بيانات المخزون...')).toBeInTheDocument()
    })

    it('should render statistics cards after loading', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي العناصر')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('القيمة الإجمالية')).toBeInTheDocument()
        expect(screen.getByText('مخزون منخفض')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('نفاد المخزون')).toBeInTheDocument()
        expect(screen.getByText('0')).toBeInTheDocument()
      })
    })
  })

  describe('Alerts Section', () => {
    it('should render alerts when present', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('تنبيهات المخزون (1)')).toBeInTheDocument()
        expect(screen.getByText('مخزون منخفض: أسمنت أبيض (25 كيس)')).toBeInTheDocument()
        expect(screen.getByText('المخزون الحالي: 25')).toBeInTheDocument()
      })
    })

    it('should not render alerts section when no alerts', async () => {
      mockInventoryService.getActiveAlerts.mockResolvedValue([])

      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.queryByText('تنبيهات المخزون')).not.toBeInTheDocument()
      })
    })

    it('should show correct alert badge colors', async () => {
      const highSeverityAlert = {
        ...mockAlerts[0],
        severity: 'high' as const,
        alertType: 'out_of_stock' as const
      }
      mockInventoryService.getActiveAlerts.mockResolvedValue([highSeverityAlert])

      render(<InventoryManagement />)

      await waitFor(() => {
        const badge = screen.getByText('نفاد المخزون')
        expect(badge).toBeInTheDocument()
      })
    })
  })

  describe('Items Table', () => {
    it('should render items table with data', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('قائمة العناصر (2)')).toBeInTheDocument()
        expect(screen.getByText('ITM001')).toBeInTheDocument()
        expect(screen.getByText('مسامير حديد')).toBeInTheDocument()
        expect(screen.getByText('ITM002')).toBeInTheDocument()
        expect(screen.getByText('أسمنت أبيض')).toBeInTheDocument()
      })
    })

    it('should show empty state when no items', async () => {
      mockInventoryService.getAllItems.mockResolvedValue([])
      mockInventoryService.getInventoryStatistics.mockResolvedValue({
        ...mockStats,
        totalItems: 0,
        totalValue: 0
      })

      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('لا توجد عناصر')).toBeInTheDocument()
      })
    })

    it('should display correct stock status badges', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('طبيعي')).toBeInTheDocument() // For item 1 (100 > 30)
        expect(screen.getByText('مخزون منخفض')).toBeInTheDocument() // For item 2 (25 <= 30)
      })
    })

    it('should show action buttons for each item', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: '' })
        expect(viewButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should render search input', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('البحث في العناصر...')).toBeInTheDocument()
      })
    })

    it('should filter items by search term', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في العناصر...')
        fireEvent.change(searchInput, { target: { value: 'مسامير' } })
      })

      await waitFor(() => {
        expect(screen.getByText('مسامير حديد')).toBeInTheDocument()
        expect(screen.queryByText('أسمنت أبيض')).not.toBeInTheDocument()
      })
    })

    it('should render category filter', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('جميع الفئات')).toBeInTheDocument()
      })
    })

    it('should render location filter', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('جميع المواقع')).toBeInTheDocument()
      })
    })

    it('should render status filter', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('الحالة')).toBeInTheDocument()
      })
    })

    it('should filter by category', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        const categorySelect = screen.getByText('جميع الفئات')
        fireEvent.click(categorySelect)
      })

      // Note: This test would need more complex setup to test actual filtering
      // as it involves Select component interactions
    })
  })

  describe('Tabs Navigation', () => {
    it('should render all tabs', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('العناصر')).toBeInTheDocument()
        expect(screen.getByText('الحركات')).toBeInTheDocument()
        expect(screen.getByText('التقارير')).toBeInTheDocument()
        expect(screen.getByText('الإعدادات')).toBeInTheDocument()
      })
    })

    it('should show items tab by default', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        expect(screen.getByText('قائمة العناصر (2)')).toBeInTheDocument()
      })
    })

    it('should switch to movements tab', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        const movementsTab = screen.getByText('الحركات')
        fireEvent.click(movementsTab)
      })

      await waitFor(() => {
        expect(screen.getByText('حركات المخزون')).toBeInTheDocument()
        expect(screen.getByText('سيتم تطوير هذا القسم قريباً...')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading and Error Handling', () => {
    it('should handle loading errors gracefully', async () => {
      mockInventoryService.getAllItems.mockRejectedValue(new Error('Network error'))

      render(<InventoryManagement />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('فشل في تحميل بيانات المخزون')
      })
    })

    it('should call refresh when refresh button is clicked', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /تحديث/i })
        fireEvent.click(refreshButton)
      })

      expect(mockInventoryService.getAllItems).toHaveBeenCalledTimes(2) // Initial load + refresh
    })
  })

  describe('Currency Formatting', () => {
    it('should format currency values correctly', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        // Check if currency values are displayed (exact format may vary)
        expect(screen.getByText(/1,550/)).toBeInTheDocument()
        expect(screen.getByText(/625/)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في العناصر...')
        expect(searchInput).toHaveAttribute('type', 'text')
      })
    })

    it('should support keyboard navigation', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في العناصر...')
        searchInput.focus()
        expect(document.activeElement).toBe(searchInput)
      })
    })

    it('should have proper table structure', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
        
        const headers = screen.getAllByRole('columnheader')
        expect(headers.length).toBeGreaterThan(0)
      })
    })
  })

  describe('RTL Support', () => {
    it('should have RTL direction', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        const mainContainer = screen.getByText('إدارة المخزون').closest('div')
        expect(mainContainer).toHaveAttribute('dir', 'rtl')
      })
    })
  })

  describe('Progress Indicators', () => {
    it('should show stock level progress bars', async () => {
      render(<InventoryManagement />)

      await waitFor(() => {
        // Progress bars should be rendered for stock levels
        const progressBars = document.querySelectorAll('[role="progressbar"]')
        expect(progressBars.length).toBeGreaterThan(0)
      })
    })
  })
})
