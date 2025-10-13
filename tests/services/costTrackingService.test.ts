/**
 * Cost Tracking Service Tests
 * اختبارات خدمة تتبع التكاليف
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { costTrackingService } from '../../src/services/costTrackingService'
import { CostEntry, CostCategory, CostEntryStatus, CreateCostEntryRequest } from '../../src/types/evm'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock safeLocalStorage
vi.mock('../../src/utils/storage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}))

describe('CostTrackingService', () => {
  const mockCostEntry: CostEntry = {
    id: 'cost-1',
    projectId: 'project-1',
    taskId: 'task-1',
    category: 'labor',
    description: 'أجور العمالة',
    descriptionEn: 'Labor costs',
    amount: 50000,
    currency: 'SAR',
    date: '2024-06-01',
    status: 'approved',
    approvedBy: 'manager-1',
    approvedAt: '2024-06-02T10:00:00Z',
    vendor: 'شركة المقاولات المحدودة',
    invoiceNumber: 'INV-2024-001',
    paymentMethod: 'bank_transfer',
    tags: ['عمالة', 'أساسي'],
    attachments: [
      {
        id: 'att-1',
        name: 'فاتورة العمالة.pdf',
        url: '/uploads/invoice-001.pdf',
        type: 'application/pdf',
        size: 1024000
      }
    ],
    notes: 'دفعة شهرية للعمالة',
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2024-06-02T10:00:00Z',
    createdBy: 'user-1',
    lastModifiedBy: 'manager-1',
    version: 2
  }

  const mockCostEntries: CostEntry[] = [
    mockCostEntry,
    {
      ...mockCostEntry,
      id: 'cost-2',
      category: 'materials',
      description: 'مواد البناء',
      amount: 75000,
      status: 'pending',
      approvedBy: undefined,
      approvedAt: undefined
    },
    {
      ...mockCostEntry,
      id: 'cost-3',
      category: 'equipment',
      description: 'إيجار المعدات',
      amount: 30000,
      status: 'rejected',
      rejectedBy: 'manager-1',
      rejectedAt: '2024-06-03T14:00:00Z',
      rejectionReason: 'فاتورة غير مكتملة'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default localStorage mock
    const { safeLocalStorage } = require('../../src/utils/storage')
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify(mockCostEntries))
    safeLocalStorage.setItem.mockImplementation(() => {})
  })

  describe('getAllCostEntries', () => {
    it('should return all cost entries', async () => {
      const result = await costTrackingService.getAllCostEntries()

      expect(result).toEqual(mockCostEntries)
      expect(result).toHaveLength(3)
    })

    it('should return filtered cost entries', async () => {
      const filters = { projectId: 'project-1', status: 'approved' as CostEntryStatus }
      
      const result = await costTrackingService.getAllCostEntries(filters)

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('approved')
    })

    it('should return sorted cost entries', async () => {
      const sortBy = { field: 'amount', direction: 'desc' as const }
      
      const result = await costTrackingService.getAllCostEntries(undefined, sortBy)

      expect(result[0].amount).toBe(75000) // أعلى مبلغ
      expect(result[1].amount).toBe(50000)
      expect(result[2].amount).toBe(30000)
    })

    it('should handle empty storage', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(null)

      const result = await costTrackingService.getAllCostEntries()

      expect(result).toEqual([])
    })
  })

  describe('createCostEntry', () => {
    it('should create a new cost entry', async () => {
      const createRequest: CreateCostEntryRequest = {
        projectId: 'project-1',
        taskId: 'task-2',
        category: 'materials',
        description: 'مواد جديدة',
        amount: 25000,
        currency: 'SAR',
        date: '2024-06-05',
        vendor: 'مورد جديد',
        invoiceNumber: 'INV-2024-002',
        tags: ['مواد', 'جديد']
      }

      const result = await costTrackingService.createCostEntry(createRequest)

      expect(result).toBeDefined()
      expect(result.projectId).toBe('project-1')
      expect(result.description).toBe('مواد جديدة')
      expect(result.amount).toBe(25000)
      expect(result.status).toBe('pending')
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.version).toBe(1)
    })

    it('should validate cost entry data', async () => {
      const invalidRequest = {
        projectId: '',
        category: 'invalid' as CostCategory,
        description: '',
        amount: -1000,
        currency: 'SAR',
        date: '2024-06-05'
      }

      await expect(
        costTrackingService.createCostEntry(invalidRequest as CreateCostEntryRequest)
      ).rejects.toThrow('بيانات التكلفة غير صحيحة')
    })

    it('should handle creation errors', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const createRequest: CreateCostEntryRequest = {
        projectId: 'project-1',
        category: 'materials',
        description: 'مواد جديدة',
        amount: 25000,
        currency: 'SAR',
        date: '2024-06-05'
      }

      await expect(
        costTrackingService.createCostEntry(createRequest)
      ).rejects.toThrow('فشل في إنشاء إدخال التكلفة')
    })
  })

  describe('updateCostEntry', () => {
    it('should update an existing cost entry', async () => {
      const updateRequest = {
        id: 'cost-1',
        description: 'أجور العمالة المحدثة',
        amount: 55000,
        version: 2
      }

      const result = await costTrackingService.updateCostEntry(updateRequest)

      expect(result.description).toBe('أجور العمالة المحدثة')
      expect(result.amount).toBe(55000)
      expect(result.version).toBe(3)
      expect(result.updatedAt).toBeDefined()
    })

    it('should handle version conflicts', async () => {
      const updateRequest = {
        id: 'cost-1',
        description: 'تحديث',
        version: 1 // إصدار قديم
      }

      await expect(
        costTrackingService.updateCostEntry(updateRequest)
      ).rejects.toThrow('تم تحديث إدخال التكلفة من قبل مستخدم آخر')
    })

    it('should handle non-existent cost entry', async () => {
      const updateRequest = {
        id: 'non-existent',
        description: 'تحديث',
        version: 1
      }

      await expect(
        costTrackingService.updateCostEntry(updateRequest)
      ).rejects.toThrow('إدخال التكلفة غير موجود')
    })

    it('should prevent updating approved entries', async () => {
      const updateRequest = {
        id: 'cost-1', // مُعتمد
        amount: 60000,
        version: 2
      }

      await expect(
        costTrackingService.updateCostEntry(updateRequest)
      ).rejects.toThrow('لا يمكن تعديل إدخال تكلفة معتمد')
    })
  })

  describe('approveCostEntry', () => {
    it('should approve a pending cost entry', async () => {
      const result = await costTrackingService.approveCostEntry('cost-2', 'manager-1', 'موافق عليه')

      expect(result.status).toBe('approved')
      expect(result.approvedBy).toBe('manager-1')
      expect(result.approvedAt).toBeDefined()
      expect(result.approvalNotes).toBe('موافق عليه')
    })

    it('should reject a cost entry', async () => {
      const result = await costTrackingService.rejectCostEntry('cost-2', 'manager-1', 'فاتورة غير صحيحة')

      expect(result.status).toBe('rejected')
      expect(result.rejectedBy).toBe('manager-1')
      expect(result.rejectedAt).toBeDefined()
      expect(result.rejectionReason).toBe('فاتورة غير صحيحة')
    })

    it('should handle already approved entries', async () => {
      await expect(
        costTrackingService.approveCostEntry('cost-1', 'manager-1') // مُعتمد مسبقاً
      ).rejects.toThrow('إدخال التكلفة معتمد مسبقاً')
    })

    it('should handle non-existent entries', async () => {
      await expect(
        costTrackingService.approveCostEntry('non-existent', 'manager-1')
      ).rejects.toThrow('إدخال التكلفة غير موجود')
    })
  })

  describe('getCostEntriesByTask', () => {
    it('should return cost entries for specific task', async () => {
      const result = await costTrackingService.getCostEntriesByTask('task-1')

      expect(result).toHaveLength(3) // جميع الإدخالات لها نفس task-1
      expect(result.every(entry => entry.taskId === 'task-1')).toBe(true)
    })

    it('should return empty array for non-existent task', async () => {
      const result = await costTrackingService.getCostEntriesByTask('non-existent-task')

      expect(result).toEqual([])
    })
  })

  describe('getProjectTotalCost', () => {
    it('should calculate total project cost', async () => {
      const result = await costTrackingService.getProjectTotalCost('project-1')

      expect(result.totalCost).toBe(155000) // 50000 + 75000 + 30000
      expect(result.approvedCost).toBe(50000) // فقط المعتمد
      expect(result.pendingCost).toBe(75000) // المعلق
      expect(result.rejectedCost).toBe(30000) // المرفوض
      expect(result.currency).toBe('SAR')
    })

    it('should handle project with no costs', async () => {
      const result = await costTrackingService.getProjectTotalCost('empty-project')

      expect(result.totalCost).toBe(0)
      expect(result.approvedCost).toBe(0)
      expect(result.pendingCost).toBe(0)
      expect(result.rejectedCost).toBe(0)
    })
  })

  describe('getMonthlyCostAnalysis', () => {
    it('should analyze monthly costs', async () => {
      const result = await costTrackingService.getMonthlyCostAnalysis('project-1', 2024)

      expect(result).toBeDefined()
      expect(result.year).toBe(2024)
      expect(result.projectId).toBe('project-1')
      expect(result.monthlyData).toHaveLength(12)
      
      // يونيو يجب أن يحتوي على التكاليف
      const juneData = result.monthlyData[5] // يونيو = الفهرس 5
      expect(juneData.month).toBe(6)
      expect(juneData.totalCost).toBe(155000)
      expect(juneData.approvedCost).toBe(50000)
    })

    it('should break down costs by category', async () => {
      const result = await costTrackingService.getMonthlyCostAnalysis('project-1', 2024)

      const juneData = result.monthlyData[5]
      expect(juneData.categoryBreakdown.labor).toBe(50000)
      expect(juneData.categoryBreakdown.materials).toBe(75000)
      expect(juneData.categoryBreakdown.equipment).toBe(30000)
    })

    it('should calculate trends', async () => {
      const result = await costTrackingService.getMonthlyCostAnalysis('project-1', 2024)

      expect(result.trends).toBeDefined()
      expect(result.trends.totalSpending).toBeDefined()
      expect(result.trends.approvalRate).toBeDefined()
      expect(result.trends.averageMonthlyCost).toBeDefined()
    })
  })

  describe('exportCostEntries', () => {
    it('should export cost entries to CSV', async () => {
      const result = await costTrackingService.exportCostEntries('project-1', 'csv')

      expect(result.format).toBe('csv')
      expect(result.filename).toContain('cost-entries')
      expect(result.filename).toContain('.csv')
      expect(result.data).toContain('التاريخ,الوصف,المبلغ,الحالة')
      expect(result.data).toContain('أجور العمالة')
      expect(result.data).toContain('50000')
    })

    it('should export cost entries to Excel', async () => {
      const result = await costTrackingService.exportCostEntries('project-1', 'excel')

      expect(result.format).toBe('excel')
      expect(result.filename).toContain('.xlsx')
      expect(result.data).toBeDefined() // Binary data for Excel
    })

    it('should filter exported data', async () => {
      const filters = { status: 'approved' as CostEntryStatus }
      const result = await costTrackingService.exportCostEntries('project-1', 'csv', filters)

      expect(result.data).toContain('أجور العمالة')
      expect(result.data).not.toContain('مواد البناء') // معلق
      expect(result.data).not.toContain('إيجار المعدات') // مرفوض
    })
  })

  describe('Cost Entry Validation', () => {
    it('should validate cost entry data', async () => {
      const validEntry = {
        projectId: 'project-1',
        category: 'labor' as CostCategory,
        description: 'تكلفة صحيحة',
        amount: 1000,
        currency: 'SAR',
        date: '2024-06-01'
      }

      const result = await costTrackingService.validateCostEntry(validEntry)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect validation errors', async () => {
      const invalidEntry = {
        projectId: '',
        category: 'invalid' as CostCategory,
        description: '',
        amount: -1000,
        currency: 'INVALID',
        date: 'invalid-date'
      }

      const result = await costTrackingService.validateCostEntry(invalidEntry)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContain('معرف المشروع مطلوب')
      expect(result.errors).toContain('فئة التكلفة غير صحيحة')
      expect(result.errors).toContain('وصف التكلفة مطلوب')
      expect(result.errors).toContain('المبلغ يجب أن يكون أكبر من صفر')
    })
  })

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', async () => {
      const largeCostEntries = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCostEntry,
        id: `cost-${i}`,
        description: `تكلفة ${i}`,
        amount: 1000 + i
      }))

      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify(largeCostEntries))

      const startTime = performance.now()
      const result = await costTrackingService.getAllCostEntries()
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // أقل من 100ms
      expect(result).toHaveLength(1000)
    })

    it('should cache calculation results', async () => {
      // الحساب الأول
      const result1 = await costTrackingService.getProjectTotalCost('project-1')
      
      // الحساب الثاني (يجب أن يكون من الذاكرة المؤقتة)
      const startTime = performance.now()
      const result2 = await costTrackingService.getProjectTotalCost('project-1')
      const endTime = performance.now()

      expect(result1).toEqual(result2)
      expect(endTime - startTime).toBeLessThan(10) // سريع جداً من الذاكرة المؤقتة
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      await expect(
        costTrackingService.getAllCostEntries()
      ).rejects.toThrow('فشل في تحميل إدخالات التكلفة')
    })

    it('should handle corrupted data', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue('invalid-json')

      const result = await costTrackingService.getAllCostEntries()

      expect(result).toEqual([]) // يعود إلى قائمة فارغة
    })

    it('should handle missing required fields', async () => {
      const incompleteEntry = {
        projectId: 'project-1',
        // category مفقود
        description: 'تكلفة ناقصة',
        amount: 1000
        // currency مفقود
      }

      await expect(
        costTrackingService.createCostEntry(incompleteEntry as CreateCostEntryRequest)
      ).rejects.toThrow('بيانات التكلفة غير صحيحة')
    })
  })
})
