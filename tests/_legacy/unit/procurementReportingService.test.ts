import { describe, it, expect, beforeEach, vi } from 'vitest'
import { procurementReportingService } from '../../../src/services/procurementReportingService'
import { asyncStorage } from '../../../src/utils/storage'

// Mock asyncStorage
vi.mock('../../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

describe('ProcurementReportingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generatePurchaseOrderReport', () => {
    it('should generate purchase order report successfully', async () => {
      // Arrange
      const mockPurchaseOrders = [
        {
          id: '1',
          orderDate: '2024-01-15',
          totalAmount: 10000,
          supplierId: 'supplier1',
          projectId: 'project1',
          status: 'completed'
        },
        {
          id: '2',
          orderDate: '2024-01-20',
          totalAmount: 15000,
          supplierId: 'supplier2',
          projectId: 'project1',
          status: 'pending'
        }
      ]

      const mockSuppliers = [
        { id: 'supplier1', name: 'مورد أول' },
        { id: 'supplier2', name: 'مورد ثاني' }
      ]

      const mockProjects = [
        { id: 'project1', name: 'مشروع تجريبي' }
      ]

      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'app_purchase_orders_data') return Promise.resolve(mockPurchaseOrders)
        if (key === 'app_suppliers') return Promise.resolve(mockSuppliers)
        if (key === 'app_projects_data') return Promise.resolve(mockProjects)
        if (key === 'app_procurement_reports') return Promise.resolve([])
        return Promise.resolve([])
      })

      vi.mocked(asyncStorage.setItem).mockResolvedValue()

      // Act
      const report = await procurementReportingService.generatePurchaseOrderReport(
        '2024-01-01',
        '2024-01-31'
      )

      // Assert
      expect(report).toBeDefined()
      expect(report.type).toBe('purchase_orders')
      expect(report.title).toBe('تقرير أوامر الشراء')
      expect(report.summary.totalRecords).toBe(2)
      expect(report.summary.totalValue).toBe(25000)
      expect(report.summary.averageValue).toBe(12500)
      expect(report.data.orders).toHaveLength(2)
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('should filter purchase orders by date range', async () => {
      // Arrange
      const mockPurchaseOrders = [
        {
          id: '1',
          orderDate: '2024-01-15',
          totalAmount: 10000,
          supplierId: 'supplier1',
          status: 'completed'
        },
        {
          id: '2',
          orderDate: '2024-02-15', // خارج النطاق
          totalAmount: 15000,
          supplierId: 'supplier2',
          status: 'pending'
        }
      ]

      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'app_purchase_orders_data') return Promise.resolve(mockPurchaseOrders)
        return Promise.resolve([])
      })

      vi.mocked(asyncStorage.setItem).mockResolvedValue()

      // Act
      const report = await procurementReportingService.generatePurchaseOrderReport(
        '2024-01-01',
        '2024-01-31'
      )

      // Assert
      expect(report.summary.totalRecords).toBe(1)
      expect(report.summary.totalValue).toBe(10000)
    })

    it('should apply filters correctly', async () => {
      // Arrange
      const mockPurchaseOrders = [
        {
          id: '1',
          orderDate: '2024-01-15',
          totalAmount: 10000,
          supplierId: 'supplier1',
          projectId: 'project1',
          status: 'completed'
        },
        {
          id: '2',
          orderDate: '2024-01-20',
          totalAmount: 15000,
          supplierId: 'supplier2',
          projectId: 'project2',
          status: 'pending'
        }
      ]

      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'app_purchase_orders_data') return Promise.resolve(mockPurchaseOrders)
        return Promise.resolve([])
      })

      vi.mocked(asyncStorage.setItem).mockResolvedValue()

      // Act
      const report = await procurementReportingService.generatePurchaseOrderReport(
        '2024-01-01',
        '2024-01-31',
        {
          projectIds: ['project1'],
          status: ['completed']
        }
      )

      // Assert
      expect(report.summary.totalRecords).toBe(1)
      expect(report.data.orders[0].id).toBe('1')
    })

    it('should handle errors gracefully', async () => {
      // Arrange
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      // Act & Assert
      await expect(
        procurementReportingService.generatePurchaseOrderReport('2024-01-01', '2024-01-31')
      ).rejects.toThrow('فشل في إنشاء تقرير أوامر الشراء')
    })
  })

  describe('generateSupplierPerformanceReport', () => {
    it('should generate supplier performance report successfully', async () => {
      // Arrange
      const mockSuppliers = [
        { id: 'supplier1', name: 'مورد أول' },
        { id: 'supplier2', name: 'مورد ثاني' }
      ]

      const mockPurchaseOrders = [
        {
          id: '1',
          orderDate: '2024-01-15',
          totalAmount: 10000,
          supplierId: 'supplier1',
          deliveryDate: '2024-01-20',
          expectedDeliveryDate: '2024-01-22'
        }
      ]

      const mockEvaluations = [
        {
          id: '1',
          supplierId: 'supplier1',
          evaluationDate: '2024-01-25',
          qualityRating: 4.5
        }
      ]

      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'app_suppliers') return Promise.resolve(mockSuppliers)
        if (key === 'app_purchase_orders_data') return Promise.resolve(mockPurchaseOrders)
        if (key === 'app_supplier_evaluations') return Promise.resolve(mockEvaluations)
        if (key === 'app_procurement_reports') return Promise.resolve([])
        return Promise.resolve([])
      })

      vi.mocked(asyncStorage.setItem).mockResolvedValue()

      // Act
      const report = await procurementReportingService.generateSupplierPerformanceReport(
        '2024-01-01',
        '2024-01-31'
      )

      // Assert
      expect(report).toBeDefined()
      expect(report.type).toBe('supplier_performance')
      expect(report.title).toBe('تقرير أداء الموردين')
      expect(report.data.metrics).toBeDefined()
      expect(report.data.kpis).toBeDefined()
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('should filter suppliers by IDs', async () => {
      // Arrange
      const mockSuppliers = [
        { id: 'supplier1', name: 'مورد أول' },
        { id: 'supplier2', name: 'مورد ثاني' }
      ]

      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'app_suppliers') return Promise.resolve(mockSuppliers)
        return Promise.resolve([])
      })

      vi.mocked(asyncStorage.setItem).mockResolvedValue()

      // Act
      const report = await procurementReportingService.generateSupplierPerformanceReport(
        '2024-01-01',
        '2024-01-31',
        ['supplier1']
      )

      // Assert
      expect(report.data.metrics).toHaveLength(1)
      expect(report.data.metrics[0].supplierId).toBe('supplier1')
    })
  })

  describe('generateInventoryValuationReport', () => {
    it('should generate inventory valuation report successfully', async () => {
      // Arrange
      const mockInventory = [
        {
          id: 'item1',
          name: 'مادة أولى',
          currentStock: 100,
          unitCost: 50,
          category: 'مواد خام',
          reorderLevel: 20
        },
        {
          id: 'item2',
          name: 'مادة ثانية',
          currentStock: 200,
          unitCost: 30,
          category: 'مواد خام'
        }
      ]

      const mockMovements = [
        {
          id: '1',
          itemId: 'item1',
          type: 'out',
          quantity: 10,
          date: '2024-01-15'
        }
      ]

      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'app_inventory_items') return Promise.resolve(mockInventory)
        if (key === 'app_stock_movements') return Promise.resolve(mockMovements)
        if (key === 'app_procurement_reports') return Promise.resolve([])
        return Promise.resolve([])
      })

      vi.mocked(asyncStorage.setItem).mockResolvedValue()

      // Act
      const report = await procurementReportingService.generateInventoryValuationReport()

      // Assert
      expect(report).toBeDefined()
      expect(report.type).toBe('inventory_valuation')
      expect(report.title).toBe('تقرير تقييم المخزون')
      expect(report.data.items).toHaveLength(2)
      expect(report.summary.totalValue).toBe(11000) // (100*50) + (200*30)
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('generateTrendAnalysisReport', () => {
    it('should generate trend analysis report successfully', async () => {
      // Arrange
      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'app_procurement_reports') return Promise.resolve([])
        return Promise.resolve([])
      })

      vi.mocked(asyncStorage.setItem).mockResolvedValue()

      // Act
      const report = await procurementReportingService.generateTrendAnalysisReport(
        'purchase_value',
        'monthly',
        '2024-01-01',
        '2024-12-31'
      )

      // Assert
      expect(report).toBeDefined()
      expect(report.type).toBe('trend_analysis')
      expect(report.title).toContain('تحليل اتجاهات')
      expect(report.data.trends).toBeDefined()
      expect(report.data.forecasts).toBeDefined()
      expect(report.data.insights).toBeDefined()
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('getAllReports', () => {
    it('should return all saved reports', async () => {
      // Arrange
      const mockReports = [
        { id: '1', title: 'تقرير 1', type: 'purchase_orders' },
        { id: '2', title: 'تقرير 2', type: 'supplier_performance' }
      ]

      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockReports)

      // Act
      const reports = await procurementReportingService.getAllReports()

      // Assert
      expect(reports).toEqual(mockReports)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('app_procurement_reports')
    })

    it('should return empty array when no reports exist', async () => {
      // Arrange
      vi.mocked(asyncStorage.getItem).mockResolvedValue(null)

      // Act
      const reports = await procurementReportingService.getAllReports()

      // Assert
      expect(reports).toEqual([])
    })
  })

  describe('deleteReport', () => {
    it('should delete report successfully', async () => {
      // Arrange
      const mockReports = [
        { id: '1', title: 'تقرير 1' },
        { id: '2', title: 'تقرير 2' }
      ]

      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockReports)
      vi.mocked(asyncStorage.setItem).mockResolvedValue()

      // Act
      const result = await procurementReportingService.deleteReport('1')

      // Assert
      expect(result).toBe(true)
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'app_procurement_reports',
        [{ id: '2', title: 'تقرير 2' }]
      )
    })

    it('should handle deletion errors', async () => {
      // Arrange
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      // Act
      const result = await procurementReportingService.deleteReport('1')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('exportReport', () => {
    it('should export report successfully', async () => {
      // Arrange
      const mockReports = [
        { id: '1', title: 'تقرير 1', type: 'purchase_orders' }
      ]

      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockReports)

      // Act
      const result = await procurementReportingService.exportReport('1', 'pdf')

      // Assert
      expect(result).toBe('exported_1.pdf')
    })

    it('should throw error when report not found', async () => {
      // Arrange
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      // Act & Assert
      await expect(
        procurementReportingService.exportReport('nonexistent', 'pdf')
      ).rejects.toThrow('فشل في تصدير التقرير')
    })
  })
})
