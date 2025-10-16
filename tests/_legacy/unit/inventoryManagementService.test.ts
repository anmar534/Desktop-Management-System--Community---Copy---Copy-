/**
 * اختبارات خدمة إدارة المخزون
 * Inventory Management Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  inventoryManagementService,
  type InventoryItem,
  type StockMovement,
  type StockAlert
} from '@/services/inventoryManagementService'
import { asyncStorage } from '@/utils/storage'

// Mock asyncStorage
vi.mock('@/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

const mockAsyncStorage = asyncStorage as any

describe('InventoryManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAsyncStorage.getItem.mockResolvedValue([])
    mockAsyncStorage.setItem.mockResolvedValue(undefined)
  })

  describe('Inventory Items Management', () => {
    const mockItem: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> = {
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
      alternativeSuppliers: ['مورد بديل 1', 'مورد بديل 2'],
      leadTime: 7,
      status: 'active',
      lastMovementDate: '2024-01-15',
      lastCountDate: '2024-01-01',
      notes: 'مادة أساسية للمشاريع'
    }

    it('should get all items', async () => {
      const mockItems = [{ ...mockItem, id: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' }]
      mockAsyncStorage.getItem.mockResolvedValue(mockItems)

      const result = await inventoryManagementService.getAllItems()

      expect(result).toEqual(mockItems)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('app_inventory_items', [])
    })

    it('should get item by id', async () => {
      const mockItems = [
        { ...mockItem, id: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { ...mockItem, id: '2', itemCode: 'ITM002', createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]
      mockAsyncStorage.getItem.mockResolvedValue(mockItems)

      const result = await inventoryManagementService.getItemById('1')

      expect(result).toEqual(mockItems[0])
    })

    it('should return null for non-existent item', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await inventoryManagementService.getItemById('999')

      expect(result).toBeNull()
    })

    it('should create new item', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await inventoryManagementService.createItem(mockItem)

      expect(result).toMatchObject({
        ...mockItem,
        totalValue: mockItem.currentStock * mockItem.unitCost,
        averageCost: mockItem.unitCost
      })
      expect(result.id).toMatch(/^inv_\d+_[a-z0-9]+$/)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should update existing item', async () => {
      const existingItem = { ...mockItem, id: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      const updatedItem = { ...existingItem, currentStock: 150, unitCost: 16.00 }
      
      mockAsyncStorage.getItem.mockResolvedValue([existingItem])

      const result = await inventoryManagementService.updateItem(updatedItem)

      expect(result.currentStock).toBe(150)
      expect(result.totalValue).toBe(150 * updatedItem.averageCost)
      expect(result.updatedAt).not.toBe(existingItem.updatedAt)
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })

    it('should throw error when updating non-existent item', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      const nonExistentItem = { ...mockItem, id: '999', createdAt: '2024-01-01', updatedAt: '2024-01-01' }

      await expect(inventoryManagementService.updateItem(nonExistentItem))
        .rejects.toThrow('عنصر المخزون غير موجود')
    })

    it('should delete item', async () => {
      const existingItem = { ...mockItem, id: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      mockAsyncStorage.getItem.mockResolvedValue([existingItem])

      await inventoryManagementService.deleteItem('1')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('app_inventory_items', [])
    })
  })

  describe('Stock Movements Management', () => {
    const mockMovement: Omit<StockMovement, 'id' | 'createdAt'> = {
      itemId: 'item1',
      movementType: 'in',
      quantity: 50,
      unitCost: 15.50,
      totalCost: 775,
      reference: 'PO-001',
      referenceType: 'purchase_order',
      reason: 'شراء جديد',
      performedBy: 'أحمد محمد',
      movementDate: '2024-01-15',
      notes: 'وصول دفعة جديدة'
    }

    it('should get all movements', async () => {
      const mockMovements = [{ ...mockMovement, id: '1', createdAt: '2024-01-15' }]
      mockAsyncStorage.getItem.mockResolvedValue(mockMovements)

      const result = await inventoryManagementService.getAllMovements()

      expect(result).toEqual(mockMovements)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('app_inventory_movements', [])
    })

    it('should get movements by item', async () => {
      const mockMovements = [
        { ...mockMovement, id: '1', itemId: 'item1', createdAt: '2024-01-15' },
        { ...mockMovement, id: '2', itemId: 'item2', createdAt: '2024-01-15' }
      ]
      mockAsyncStorage.getItem.mockResolvedValue(mockMovements)

      const result = await inventoryManagementService.getMovementsByItem('item1')

      expect(result).toHaveLength(1)
      expect(result[0].itemId).toBe('item1')
    })

    it('should create new movement', async () => {
      mockAsyncStorage.getItem.mockResolvedValue([])

      const result = await inventoryManagementService.createMovement(mockMovement)

      expect(result).toMatchObject(mockMovement)
      expect(result.id).toMatch(/^mov_\d+_[a-z0-9]+$/)
      expect(result.createdAt).toBeDefined()
      expect(mockAsyncStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Stock Alerts Management', () => {
    it('should get all alerts', async () => {
      const mockAlerts: StockAlert[] = [
        {
          id: '1',
          itemId: 'item1',
          alertType: 'low_stock',
          severity: 'medium',
          message: 'مخزون منخفض: مسامير حديد (25 كيلو)',
          currentStock: 25,
          threshold: 30,
          isActive: true,
          createdAt: '2024-01-15'
        }
      ]
      mockAsyncStorage.getItem.mockResolvedValue(mockAlerts)

      const result = await inventoryManagementService.getAllAlerts()

      expect(result).toEqual(mockAlerts)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('app_inventory_alerts', [])
    })

    it('should get only active alerts', async () => {
      const mockAlerts: StockAlert[] = [
        {
          id: '1',
          itemId: 'item1',
          alertType: 'low_stock',
          severity: 'medium',
          message: 'مخزون منخفض',
          currentStock: 25,
          threshold: 30,
          isActive: true,
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          itemId: 'item2',
          alertType: 'out_of_stock',
          severity: 'high',
          message: 'نفاد المخزون',
          currentStock: 0,
          threshold: 0,
          isActive: false,
          acknowledgedBy: 'أحمد',
          acknowledgedAt: '2024-01-14',
          createdAt: '2024-01-13'
        }
      ]
      mockAsyncStorage.getItem.mockResolvedValue(mockAlerts)

      const result = await inventoryManagementService.getActiveAlerts()

      expect(result).toHaveLength(1)
      expect(result[0].isActive).toBe(true)
    })

    it('should acknowledge alert', async () => {
      const mockAlerts: StockAlert[] = [
        {
          id: '1',
          itemId: 'item1',
          alertType: 'low_stock',
          severity: 'medium',
          message: 'مخزون منخفض',
          currentStock: 25,
          threshold: 30,
          isActive: true,
          createdAt: '2024-01-15'
        }
      ]
      mockAsyncStorage.getItem.mockResolvedValue(mockAlerts)

      await inventoryManagementService.acknowledgeAlert('1', 'أحمد محمد')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'app_inventory_alerts',
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            isActive: false,
            acknowledgedBy: 'أحمد محمد'
          })
        ])
      )
    })
  })

  describe('Search and Filter Functions', () => {
    const mockItems: InventoryItem[] = [
      {
        id: '1',
        itemCode: 'ITM001',
        itemName: 'مسامير حديد',
        itemNameEn: 'Iron Screws',
        category: 'مواد البناء',
        location: 'مخزن رئيسي',
        status: 'active',
        currentStock: 100,
        minimumStock: 20,
        reorderPoint: 30,
        reorderQuantity: 200,
        unitCost: 15.50,
        averageCost: 15.50,
        lastPurchasePrice: 15.50,
        totalValue: 1550,
        unit: 'كيلو',
        supplier: 'مورد المواد',
        leadTime: 7,
        lastMovementDate: '2024-01-15',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      },
      {
        id: '2',
        itemCode: 'ITM002',
        itemName: 'أسمنت أبيض',
        category: 'مواد البناء',
        location: 'مخزن فرعي',
        status: 'active',
        currentStock: 50,
        minimumStock: 10,
        reorderPoint: 15,
        reorderQuantity: 100,
        unitCost: 25.00,
        averageCost: 25.00,
        lastPurchasePrice: 25.00,
        totalValue: 1250,
        unit: 'كيس',
        supplier: 'مورد آخر',
        leadTime: 5,
        lastMovementDate: '2024-01-10',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    ]

    it('should search items by name', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(mockItems)

      const result = await inventoryManagementService.searchItems('مسامير')

      expect(result).toHaveLength(1)
      expect(result[0].itemName).toContain('مسامير')
    })

    it('should search items by code', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(mockItems)

      const result = await inventoryManagementService.searchItems('ITM001')

      expect(result).toHaveLength(1)
      expect(result[0].itemCode).toBe('ITM001')
    })

    it('should get items by category', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(mockItems)

      const result = await inventoryManagementService.getItemsByCategory('مواد البناء')

      expect(result).toHaveLength(2)
      expect(result.every(item => item.category === 'مواد البناء')).toBe(true)
    })

    it('should get items by location', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(mockItems)

      const result = await inventoryManagementService.getItemsByLocation('مخزن رئيسي')

      expect(result).toHaveLength(1)
      expect(result[0].location).toBe('مخزن رئيسي')
    })

    it('should get low stock items', async () => {
      const lowStockItems = [
        { ...mockItems[0], currentStock: 25 }, // Below reorder point (30)
        { ...mockItems[1], currentStock: 50 }  // Above reorder point (15)
      ]
      mockAsyncStorage.getItem.mockResolvedValue(lowStockItems)

      const result = await inventoryManagementService.getLowStockItems()

      expect(result).toHaveLength(1)
      expect(result[0].currentStock).toBeLessThanOrEqual(result[0].reorderPoint)
    })

    it('should get out of stock items', async () => {
      const outOfStockItems = [
        { ...mockItems[0], currentStock: 0 },
        { ...mockItems[1], currentStock: 50 }
      ]
      mockAsyncStorage.getItem.mockResolvedValue(outOfStockItems)

      const result = await inventoryManagementService.getOutOfStockItems()

      expect(result).toHaveLength(1)
      expect(result[0].currentStock).toBe(0)
    })
  })

  describe('Inventory Statistics', () => {
    it('should calculate inventory statistics', async () => {
      const mockItems: InventoryItem[] = [
        {
          id: '1',
          itemCode: 'ITM001',
          itemName: 'مسامير حديد',
          category: 'مواد البناء',
          location: 'مخزن رئيسي',
          status: 'active',
          currentStock: 100,
          reorderPoint: 30,
          totalValue: 1550,
          minimumStock: 20,
          reorderQuantity: 200,
          unitCost: 15.50,
          averageCost: 15.50,
          lastPurchasePrice: 15.50,
          unit: 'كيلو',
          supplier: 'مورد المواد',
          leadTime: 7,
          lastMovementDate: '2024-01-15',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        },
        {
          id: '2',
          itemCode: 'ITM002',
          itemName: 'أسمنت أبيض',
          category: 'مواد البناء',
          location: 'مخزن فرعي',
          status: 'inactive',
          currentStock: 0,
          reorderPoint: 15,
          totalValue: 0,
          minimumStock: 10,
          reorderQuantity: 100,
          unitCost: 25.00,
          averageCost: 25.00,
          lastPurchasePrice: 25.00,
          unit: 'كيس',
          supplier: 'مورد آخر',
          leadTime: 5,
          lastMovementDate: '2024-01-10',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ]

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'app_inventory_items') return Promise.resolve(mockItems)
        if (key === 'app_inventory_movements') return Promise.resolve([])
        if (key === 'app_inventory_alerts') return Promise.resolve([])
        return Promise.resolve([])
      })

      const result = await inventoryManagementService.getInventoryStatistics()

      expect(result).toMatchObject({
        totalItems: 2,
        totalValue: 1550,
        activeItems: 1,
        lowStockItems: 1, // Item 2 has currentStock (0) <= reorderPoint (15)
        outOfStockItems: 1,
        totalMovements: 0,
        activeAlerts: 0
      })
      expect(result.categories).toHaveLength(1)
      expect(result.categories[0]).toMatchObject({
        name: 'مواد البناء',
        count: 2,
        value: 1550
      })
      expect(result.locations).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))

      await expect(inventoryManagementService.getAllItems())
        .rejects.toThrow('Storage error')
    })

    it('should handle invalid data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await inventoryManagementService.getAllItems()

      expect(result).toEqual([]) // Service returns empty array when storage returns null
    })
  })
})
