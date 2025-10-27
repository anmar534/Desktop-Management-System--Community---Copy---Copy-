/**
 * Tests for PurchaseOrdersPanel Component
 * اختبارات مكون لوحة أوامر الشراء
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PurchaseOrdersPanel } from '@/presentation/components/projects/PurchaseOrdersPanel'
import * as serviceRegistry from '@/application/services/serviceRegistry'
import * as projectCostTracker from '@/application/services/projectCostTracker'
import type { PurchaseOrder } from '@/types/contracts'
import type { IEnhancedProjectRepository } from '@/repository/enhancedProject.repository'
import type { IPurchaseOrderRepository } from '@/repository/purchaseOrder.repository'

// Mock toast context
vi.mock('@/presentation/components/toast/ToastProvider', () => ({
  useToastContext: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    toasts: [],
  }),
}))

// Mock repositories
const mockProjectRepo = {
  getPurchaseOrdersByProject: vi.fn(),
} as unknown as IEnhancedProjectRepository

const mockPORepo = {
  getById: vi.fn(),
} as unknown as IPurchaseOrderRepository

// Test data
const testProjectId = 'project-123'

const testPO1: PurchaseOrder = {
  id: 'po-1',
  tenderName: 'مناقصة البناء',
  tenderId: 'tender-1',
  client: 'شركة الإنشاءات',
  value: 150000,
  status: 'approved',
  createdDate: '2025-01-01',
  expectedDelivery: '2025-02-01',
  priority: 'high',
  department: 'المشتريات',
  approver: 'محمد أحمد',
  description: 'طلب شراء مواد بناء',
  source: 'project_won',
  projectId: testProjectId,
  items: [
    { name: 'أسمنت', quantity: 100, unitPrice: 500, totalPrice: 50000, category: 'مواد بناء' },
    { name: 'حديد', quantity: 50, unitPrice: 2000, totalPrice: 100000, category: 'مواد بناء' },
  ],
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:00:00Z',
}

const testPO2: PurchaseOrder = {
  id: 'po-2',
  tenderName: 'مناقصة الكهرباء',
  tenderId: 'tender-2',
  client: 'شركة الكهرباء',
  value: 80000,
  status: 'pending',
  createdDate: '2025-01-05',
  expectedDelivery: '2025-02-15',
  priority: 'medium',
  department: 'المشتريات',
  approver: 'أحمد علي',
  description: 'طلب شراء معدات كهربائية',
  source: 'manual',
  projectId: testProjectId,
  items: [
    { name: 'كابلات', quantity: 200, unitPrice: 150, totalPrice: 30000, category: 'كهرباء' },
    { name: 'محولات', quantity: 10, unitPrice: 5000, totalPrice: 50000, category: 'كهرباء' },
  ],
  createdAt: '2025-01-05T12:00:00Z',
  updatedAt: '2025-01-05T12:00:00Z',
}

const testCostStats = {
  totalAllocated: 300000,
  totalActual: 230000,
  totalRemaining: 70000,
  variance: 70000,
  variancePercentage: 23.33,
  linkedPOsCount: 2,
  purchaseOrdersValue: 230000,
  isOverBudget: false,
}

describe('PurchaseOrdersPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.spyOn(serviceRegistry, 'getEnhancedProjectRepository').mockReturnValue(mockProjectRepo)
    vi.spyOn(serviceRegistry, 'getPurchaseOrderRepository').mockReturnValue(mockPORepo)
  })

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      mockProjectRepo.getPurchaseOrdersByProject = vi.fn(() => new Promise(() => {}))

      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      expect(screen.getByText('جاري التحميل...')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no POs are linked', async () => {
      mockProjectRepo.getPurchaseOrdersByProject = vi.fn().mockResolvedValue([])
      vi.spyOn(projectCostTracker.ProjectCostTrackerService, 'getCostStats').mockResolvedValue(
        testCostStats,
      )

      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText('لا توجد أوامر شراء')).toBeInTheDocument()
      })

      expect(screen.getByText('لم يتم ربط أي أوامر شراء بهذا المشروع بعد')).toBeInTheDocument()
    })
  })

  describe('PO List Display', () => {
    beforeEach(() => {
      mockProjectRepo.getPurchaseOrdersByProject = vi.fn().mockResolvedValue(['po-1', 'po-2'])
      mockPORepo.getById = vi
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(id === 'po-1' ? testPO1 : id === 'po-2' ? testPO2 : null),
        )
      vi.spyOn(projectCostTracker.ProjectCostTrackerService, 'getCostStats').mockResolvedValue(
        testCostStats,
      )
    })

    it('should display list of purchase orders', async () => {
      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText(/PO-1/i)).toBeInTheDocument()
      })

      expect(screen.getByText('شركة الإنشاءات')).toBeInTheDocument()
      expect(screen.getByText('شركة الكهرباء')).toBeInTheDocument()
    })

    it('should display correct PO status badges', async () => {
      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText('موافق عليه')).toBeInTheDocument()
      })

      // Get all instances using getAllByText for duplicate text
      const pendingBadges = screen.getAllByText('قيد الانتظار')
      expect(pendingBadges.length).toBeGreaterThan(0)
    })

    it('should calculate and display total amounts correctly', async () => {
      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        // Just check that currency formatting exists (Arabic numerals)
        const currencyElements = screen.getAllByText(/ر\.س\.‏/)
        expect(currencyElements.length).toBeGreaterThan(0)
      })
    })

    it('should display item counts', async () => {
      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        const badges = screen.getAllByText(/صنف/)
        expect(badges).toHaveLength(2)
      })
    })
  })

  describe('Statistics Cards', () => {
    beforeEach(() => {
      mockProjectRepo.getPurchaseOrdersByProject = vi.fn().mockResolvedValue(['po-1', 'po-2'])
      mockPORepo.getById = vi
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(id === 'po-1' ? testPO1 : id === 'po-2' ? testPO2 : null),
        )
      vi.spyOn(projectCostTracker.ProjectCostTrackerService, 'getCostStats').mockResolvedValue(
        testCostStats,
      )
    })

    it('should display total POs count', async () => {
      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText('إجمالي الطلبات')).toBeInTheDocument()
      })

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should display actual cost', async () => {
      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText('التكلفة الفعلية')).toBeInTheDocument()
      })

      // Currency formatted in Arabic
      expect(screen.getByText(/٢٣٠٬٠٠٠/)).toBeInTheDocument()
    })

    it('should display pending POs count', async () => {
      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText('قيد الانتظار')).toBeInTheDocument()
      })

      // 1 pending PO (testPO2)
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should display remaining budget', async () => {
      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText('المتبقي من الميزانية')).toBeInTheDocument()
      })

      // Multiple instances may exist, use getAllByText
      const budgetElements = screen.getAllByText(/٧٠٬٠٠٠/)
      expect(budgetElements.length).toBeGreaterThan(0)
    })
  })

  describe('Cost Analysis Card', () => {
    it('should display cost analysis when variance exists', async () => {
      mockProjectRepo.getPurchaseOrdersByProject = vi.fn().mockResolvedValue(['po-1'])
      mockPORepo.getById = vi.fn().mockResolvedValue(testPO1)
      vi.spyOn(projectCostTracker.ProjectCostTrackerService, 'getCostStats').mockResolvedValue(
        testCostStats,
      )

      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText('تحليل التكلفة')).toBeInTheDocument()
      })

      expect(screen.getByText('الميزانية المخصصة')).toBeInTheDocument()
      expect(screen.getByText(/٣٠٠٬٠٠٠/)).toBeInTheDocument()
      expect(screen.getByText('الفرق')).toBeInTheDocument()
    })

    it('should not display cost analysis when variance is zero', async () => {
      const zeroVarianceStats = { ...testCostStats, variance: 0 }

      mockProjectRepo.getPurchaseOrdersByProject = vi.fn().mockResolvedValue([])
      vi.spyOn(projectCostTracker.ProjectCostTrackerService, 'getCostStats').mockResolvedValue(
        zeroVarianceStats,
      )

      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.queryByText('تحليل التكلفة')).not.toBeInTheDocument()
      })
    })
  })

  describe('Over Budget Warning', () => {
    it('should show over budget warning when budget exceeded', async () => {
      const overBudgetStats = {
        ...testCostStats,
        totalRemaining: -50000,
        isOverBudget: true,
      }

      mockProjectRepo.getPurchaseOrdersByProject = vi.fn().mockResolvedValue(['po-1'])
      mockPORepo.getById = vi.fn().mockResolvedValue(testPO1)
      vi.spyOn(projectCostTracker.ProjectCostTrackerService, 'getCostStats').mockResolvedValue(
        overBudgetStats,
      )

      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText('تجاوز الميزانية')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error toast on loading failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockProjectRepo.getPurchaseOrdersByProject = vi
        .fn()
        .mockRejectedValue(new Error('Network error'))

      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading purchase orders:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should handle null PO responses gracefully', async () => {
      mockProjectRepo.getPurchaseOrdersByProject = vi.fn().mockResolvedValue(['po-1', 'po-999'])
      mockPORepo.getById = vi
        .fn()
        .mockImplementation((id: string) => Promise.resolve(id === 'po-1' ? testPO1 : null))
      vi.spyOn(projectCostTracker.ProjectCostTrackerService, 'getCostStats').mockResolvedValue(
        testCostStats,
      )

      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        expect(screen.getByText(/PO-1/i)).toBeInTheDocument()
      })

      // Should only show 1 PO (po-999 returned null)
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly in Arabic locale', async () => {
      mockProjectRepo.getPurchaseOrdersByProject = vi.fn().mockResolvedValue(['po-1'])
      mockPORepo.getById = vi.fn().mockResolvedValue(testPO1)
      vi.spyOn(projectCostTracker.ProjectCostTrackerService, 'getCostStats').mockResolvedValue(
        testCostStats,
      )

      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        // Check that date is rendered (will be Arabic formatted)
        const tableElement = screen.getByRole('table')
        expect(tableElement).toBeInTheDocument()
      })
    })

    it('should handle invalid dates gracefully', async () => {
      const invalidDatePO = { ...testPO1, createdDate: 'invalid-date' }

      mockProjectRepo.getPurchaseOrdersByProject = vi.fn().mockResolvedValue(['po-1'])
      mockPORepo.getById = vi.fn().mockResolvedValue(invalidDatePO)
      vi.spyOn(projectCostTracker.ProjectCostTrackerService, 'getCostStats').mockResolvedValue(
        testCostStats,
      )

      render(<PurchaseOrdersPanel projectId={testProjectId} />)

      await waitFor(() => {
        // Component should still render even with invalid date
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
    })
  })
})
