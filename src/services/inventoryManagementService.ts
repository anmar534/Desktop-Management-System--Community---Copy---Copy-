/**
 * خدمة إدارة المخزون الشاملة
 * Comprehensive Inventory Management Service
 */

import { asyncStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/storageKeys'

// ===== INTERFACES =====

export interface InventoryItem {
  id: string
  itemCode: string
  itemName: string
  itemNameEn?: string
  category: string
  subcategory?: string
  description?: string
  unit: string
  currentStock: number
  minimumStock: number
  maximumStock?: number
  reorderPoint: number
  reorderQuantity: number
  unitCost: number
  averageCost: number
  lastPurchasePrice: number
  totalValue: number
  location: string
  warehouse?: string
  shelf?: string
  supplier: string
  alternativeSuppliers?: string[]
  leadTime: number // days
  status: 'active' | 'inactive' | 'discontinued'
  lastMovementDate: string
  lastCountDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  itemId: string
  movementType: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  unitCost?: number
  totalCost?: number
  reference: string // PO number, project code, etc.
  referenceType: 'purchase_order' | 'project' | 'adjustment' | 'transfer' | 'return'
  fromLocation?: string
  toLocation?: string
  reason?: string
  performedBy: string
  approvedBy?: string
  movementDate: string
  notes?: string
  createdAt: string
}

export interface StockAlert {
  id: string
  itemId: string
  alertType: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiry_warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  messageEn?: string
  currentStock: number
  threshold: number
  isActive: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
  createdAt: string
}

export interface InventoryLocation {
  id: string
  locationCode: string
  locationName: string
  locationType: 'warehouse' | 'site' | 'office' | 'vehicle'
  address?: string
  manager?: string
  capacity?: number
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface StockCount {
  id: string
  countDate: string
  countType: 'full' | 'partial' | 'cycle'
  location: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  performedBy: string
  approvedBy?: string
  items: StockCountItem[]
  totalVariance: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface StockCountItem {
  itemId: string
  systemQuantity: number
  countedQuantity: number
  variance: number
  varianceValue: number
  reason?: string
  notes?: string
}

export interface InventoryReport {
  id: string
  reportType: 'stock_levels' | 'movements' | 'valuation' | 'alerts' | 'abc_analysis'
  reportDate: string
  dateRange: {
    from: string
    to: string
  }
  filters: {
    category?: string
    location?: string
    supplier?: string
    status?: string
  }
  data: any[]
  summary: {
    totalItems: number
    totalValue: number
    lowStockItems: number
    outOfStockItems: number
  }
  generatedBy: string
  createdAt: string
}

// ===== STORAGE KEYS =====
const INVENTORY_STORAGE_KEYS = {
  ITEMS: 'app_inventory_items',
  MOVEMENTS: 'app_inventory_movements',
  ALERTS: 'app_inventory_alerts',
  LOCATIONS: 'app_inventory_locations',
  COUNTS: 'app_inventory_counts',
  REPORTS: 'app_inventory_reports'
} as const

// ===== SERVICE CLASS =====

class InventoryManagementService {
  // ===== INVENTORY ITEMS =====

  async getAllItems(): Promise<InventoryItem[]> {
    try {
      const items = await asyncStorage.getItem(INVENTORY_STORAGE_KEYS.ITEMS, [])
      return items || []
    } catch (error) {
      console.error('خطأ في جلب عناصر المخزون:', error)
      throw error
    }
  }

  async getItemById(id: string): Promise<InventoryItem | null> {
    try {
      const items = await this.getAllItems()
      return items.find(item => item.id === id) || null
    } catch (error) {
      console.error('خطأ في جلب عنصر المخزون:', error)
      throw error
    }
  }

  async createItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    try {
      const items = await this.getAllItems()
      const newItem: InventoryItem = {
        ...itemData,
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        totalValue: itemData.currentStock * itemData.unitCost,
        averageCost: itemData.unitCost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      items.push(newItem)
      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.ITEMS, items)

      // Check for alerts
      await this.checkAndCreateAlerts(newItem)

      return newItem
    } catch (error) {
      console.error('خطأ في إنشاء عنصر المخزون:', error)
      throw error
    }
  }

  async updateItem(item: InventoryItem): Promise<InventoryItem> {
    try {
      const items = await this.getAllItems()
      const index = items.findIndex(i => i.id === item.id)
      
      if (index === -1) {
        throw new Error('عنصر المخزون غير موجود')
      }

      const updatedItem = {
        ...item,
        totalValue: item.currentStock * item.averageCost,
        updatedAt: new Date().toISOString()
      }

      items[index] = updatedItem
      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.ITEMS, items)

      // Check for alerts
      await this.checkAndCreateAlerts(updatedItem)

      return updatedItem
    } catch (error) {
      console.error('خطأ في تحديث عنصر المخزون:', error)
      throw error
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const items = await this.getAllItems()
      const filteredItems = items.filter(item => item.id !== id)
      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.ITEMS, filteredItems)

      // Remove related alerts
      await this.removeAlertsForItem(id)
    } catch (error) {
      console.error('خطأ في حذف عنصر المخزون:', error)
      throw error
    }
  }

  // ===== STOCK MOVEMENTS =====

  async getAllMovements(): Promise<StockMovement[]> {
    try {
      return await asyncStorage.getItem(INVENTORY_STORAGE_KEYS.MOVEMENTS, [])
    } catch (error) {
      console.error('خطأ في جلب حركات المخزون:', error)
      throw error
    }
  }

  async getMovementsByItem(itemId: string): Promise<StockMovement[]> {
    try {
      const movements = await this.getAllMovements()
      return movements.filter(movement => movement.itemId === itemId)
    } catch (error) {
      console.error('خطأ في جلب حركات العنصر:', error)
      throw error
    }
  }

  async createMovement(movementData: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    try {
      const movements = await this.getAllMovements()
      const newMovement: StockMovement = {
        ...movementData,
        id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      }

      movements.push(newMovement)
      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.MOVEMENTS, movements)

      // Update item stock
      await this.updateItemStock(newMovement)

      return newMovement
    } catch (error) {
      console.error('خطأ في إنشاء حركة المخزون:', error)
      throw error
    }
  }

  private async updateItemStock(movement: StockMovement): Promise<void> {
    try {
      const item = await this.getItemById(movement.itemId)
      if (!item) return

      let newStock = item.currentStock
      
      if (movement.movementType === 'in') {
        newStock += movement.quantity
        // Update average cost for incoming stock
        if (movement.unitCost) {
          const totalValue = (item.currentStock * item.averageCost) + (movement.quantity * movement.unitCost)
          const totalQuantity = item.currentStock + movement.quantity
          item.averageCost = totalValue / totalQuantity
          item.lastPurchasePrice = movement.unitCost
        }
      } else if (movement.movementType === 'out') {
        newStock -= movement.quantity
      } else if (movement.movementType === 'adjustment') {
        newStock = movement.quantity // Adjustment sets absolute quantity
      }

      item.currentStock = Math.max(0, newStock)
      item.lastMovementDate = movement.movementDate
      
      await this.updateItem(item)
    } catch (error) {
      console.error('خطأ في تحديث مخزون العنصر:', error)
      throw error
    }
  }

  // ===== ALERTS =====

  async getAllAlerts(): Promise<StockAlert[]> {
    try {
      return await asyncStorage.getItem(INVENTORY_STORAGE_KEYS.ALERTS, [])
    } catch (error) {
      console.error('خطأ في جلب تنبيهات المخزون:', error)
      throw error
    }
  }

  async getActiveAlerts(): Promise<StockAlert[]> {
    try {
      const alerts = await this.getAllAlerts()
      return alerts.filter(alert => alert.isActive)
    } catch (error) {
      console.error('خطأ في جلب التنبيهات النشطة:', error)
      throw error
    }
  }

  private async checkAndCreateAlerts(item: InventoryItem): Promise<void> {
    try {
      const alerts = await this.getAllAlerts()
      
      // Remove existing alerts for this item
      const filteredAlerts = alerts.filter(alert => alert.itemId !== item.id)

      // Check for low stock
      if (item.currentStock <= item.reorderPoint && item.currentStock > 0) {
        filteredAlerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          itemId: item.id,
          alertType: 'low_stock',
          severity: 'medium',
          message: `مخزون منخفض: ${item.itemName} (${item.currentStock} ${item.unit})`,
          messageEn: `Low stock: ${item.itemNameEn || item.itemName} (${item.currentStock} ${item.unit})`,
          currentStock: item.currentStock,
          threshold: item.reorderPoint,
          isActive: true,
          createdAt: new Date().toISOString()
        })
      }

      // Check for out of stock
      if (item.currentStock <= 0) {
        filteredAlerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          itemId: item.id,
          alertType: 'out_of_stock',
          severity: 'high',
          message: `نفاد المخزون: ${item.itemName}`,
          messageEn: `Out of stock: ${item.itemNameEn || item.itemName}`,
          currentStock: item.currentStock,
          threshold: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        })
      }

      // Check for overstock
      if (item.maximumStock && item.currentStock > item.maximumStock) {
        filteredAlerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          itemId: item.id,
          alertType: 'overstock',
          severity: 'low',
          message: `مخزون زائد: ${item.itemName} (${item.currentStock} ${item.unit})`,
          messageEn: `Overstock: ${item.itemNameEn || item.itemName} (${item.currentStock} ${item.unit})`,
          currentStock: item.currentStock,
          threshold: item.maximumStock,
          isActive: true,
          createdAt: new Date().toISOString()
        })
      }

      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.ALERTS, filteredAlerts)
    } catch (error) {
      console.error('خطأ في فحص وإنشاء التنبيهات:', error)
      throw error
    }
  }

  private async removeAlertsForItem(itemId: string): Promise<void> {
    try {
      const alerts = await this.getAllAlerts()
      const filteredAlerts = alerts.filter(alert => alert.itemId !== itemId)
      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.ALERTS, filteredAlerts)
    } catch (error) {
      console.error('خطأ في إزالة تنبيهات العنصر:', error)
      throw error
    }
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      const alerts = await this.getAllAlerts()
      const alert = alerts.find(a => a.id === alertId)
      
      if (alert) {
        alert.isActive = false
        alert.acknowledgedBy = acknowledgedBy
        alert.acknowledgedAt = new Date().toISOString()
        
        await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.ALERTS, alerts)
      }
    } catch (error) {
      console.error('خطأ في تأكيد التنبيه:', error)
      throw error
    }
  }

  // ===== LOCATIONS =====

  async getAllLocations(): Promise<InventoryLocation[]> {
    try {
      return await asyncStorage.getItem(INVENTORY_STORAGE_KEYS.LOCATIONS, [])
    } catch (error) {
      console.error('خطأ في جلب مواقع المخزون:', error)
      throw error
    }
  }

  async createLocation(locationData: Omit<InventoryLocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryLocation> {
    try {
      const locations = await this.getAllLocations()
      const newLocation: InventoryLocation = {
        ...locationData,
        id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      locations.push(newLocation)
      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.LOCATIONS, locations)

      return newLocation
    } catch (error) {
      console.error('خطأ في إنشاء موقع المخزون:', error)
      throw error
    }
  }

  // ===== STOCK COUNTS =====

  async getAllStockCounts(): Promise<StockCount[]> {
    try {
      return await asyncStorage.getItem(INVENTORY_STORAGE_KEYS.COUNTS, [])
    } catch (error) {
      console.error('خطأ في جلب عمليات الجرد:', error)
      throw error
    }
  }

  async createStockCount(countData: Omit<StockCount, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockCount> {
    try {
      const counts = await this.getAllStockCounts()
      const newCount: StockCount = {
        ...countData,
        id: `count_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      counts.push(newCount)
      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.COUNTS, counts)

      return newCount
    } catch (error) {
      console.error('خطأ في إنشاء عملية الجرد:', error)
      throw error
    }
  }

  async completeStockCount(countId: string, approvedBy: string): Promise<void> {
    try {
      const counts = await this.getAllStockCounts()
      const count = counts.find(c => c.id === countId)

      if (!count) {
        throw new Error('عملية الجرد غير موجودة')
      }

      count.status = 'completed'
      count.approvedBy = approvedBy
      count.updatedAt = new Date().toISOString()

      // Apply adjustments
      for (const item of count.items) {
        if (item.variance !== 0) {
          await this.createMovement({
            itemId: item.itemId,
            movementType: 'adjustment',
            quantity: item.countedQuantity,
            reference: `STOCK_COUNT_${count.id}`,
            referenceType: 'adjustment',
            reason: `جرد مخزون - ${item.reason || 'تعديل كمية'}`,
            performedBy: count.performedBy,
            approvedBy: approvedBy,
            movementDate: count.countDate,
            notes: `تعديل من الجرد: ${item.systemQuantity} → ${item.countedQuantity}`
          })
        }
      }

      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.COUNTS, counts)
    } catch (error) {
      console.error('خطأ في إكمال عملية الجرد:', error)
      throw error
    }
  }

  // ===== SEARCH AND FILTER =====

  async searchItems(query: string): Promise<InventoryItem[]> {
    try {
      const items = await this.getAllItems()
      const searchTerm = query.toLowerCase()

      return items.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm) ||
        item.itemCode.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        (item.itemNameEn && item.itemNameEn.toLowerCase().includes(searchTerm)) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
      )
    } catch (error) {
      console.error('خطأ في البحث عن العناصر:', error)
      throw error
    }
  }

  async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    try {
      const items = await this.getAllItems()
      return items.filter(item => item.category === category)
    } catch (error) {
      console.error('خطأ في جلب عناصر الفئة:', error)
      throw error
    }
  }

  async getItemsByLocation(location: string): Promise<InventoryItem[]> {
    try {
      const items = await this.getAllItems()
      return items.filter(item => item.location === location)
    } catch (error) {
      console.error('خطأ في جلب عناصر الموقع:', error)
      throw error
    }
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    try {
      const items = await this.getAllItems()
      return items.filter(item => item.currentStock <= item.reorderPoint)
    } catch (error) {
      console.error('خطأ في جلب العناصر منخفضة المخزون:', error)
      throw error
    }
  }

  async getOutOfStockItems(): Promise<InventoryItem[]> {
    try {
      const items = await this.getAllItems()
      return items.filter(item => item.currentStock <= 0)
    } catch (error) {
      console.error('خطأ في جلب العناصر نافدة المخزون:', error)
      throw error
    }
  }

  // ===== REPORTS =====

  async generateInventoryReport(reportType: InventoryReport['reportType'], filters: InventoryReport['filters'] = {}): Promise<InventoryReport> {
    try {
      const items = await this.getAllItems()
      let filteredItems = items

      // Apply filters
      if (filters.category) {
        filteredItems = filteredItems.filter(item => item.category === filters.category)
      }
      if (filters.location) {
        filteredItems = filteredItems.filter(item => item.location === filters.location)
      }
      if (filters.supplier) {
        filteredItems = filteredItems.filter(item => item.supplier === filters.supplier)
      }
      if (filters.status) {
        filteredItems = filteredItems.filter(item => item.status === filters.status)
      }

      const totalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0)
      const lowStockItems = filteredItems.filter(item => item.currentStock <= item.reorderPoint).length
      const outOfStockItems = filteredItems.filter(item => item.currentStock <= 0).length

      const report: InventoryReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reportType,
        reportDate: new Date().toISOString(),
        dateRange: {
          from: new Date().toISOString(),
          to: new Date().toISOString()
        },
        filters,
        data: filteredItems,
        summary: {
          totalItems: filteredItems.length,
          totalValue,
          lowStockItems,
          outOfStockItems
        },
        generatedBy: 'النظام',
        createdAt: new Date().toISOString()
      }

      // Save report
      const reports = await asyncStorage.getItem(INVENTORY_STORAGE_KEYS.REPORTS, [])
      reports.push(report)
      await asyncStorage.setItem(INVENTORY_STORAGE_KEYS.REPORTS, reports)

      return report
    } catch (error) {
      console.error('خطأ في توليد تقرير المخزون:', error)
      throw error
    }
  }

  // ===== UTILITY METHODS =====

  async getInventoryStatistics(): Promise<{
    totalItems: number
    totalValue: number
    activeItems: number
    lowStockItems: number
    outOfStockItems: number
    totalMovements: number
    activeAlerts: number
    categories: { name: string; count: number; value: number }[]
    locations: { name: string; count: number; value: number }[]
  }> {
    try {
      const [items, movements, alerts] = await Promise.all([
        this.getAllItems(),
        this.getAllMovements(),
        this.getActiveAlerts()
      ])

      const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0)
      const activeItems = items.filter(item => item.status === 'active').length
      const lowStockItems = items.filter(item => item.currentStock <= item.reorderPoint).length
      const outOfStockItems = items.filter(item => item.currentStock <= 0).length

      // Group by categories
      const categoryMap = new Map<string, { count: number; value: number }>()
      items.forEach(item => {
        const existing = categoryMap.get(item.category) || { count: 0, value: 0 }
        categoryMap.set(item.category, {
          count: existing.count + 1,
          value: existing.value + item.totalValue
        })
      })

      // Group by locations
      const locationMap = new Map<string, { count: number; value: number }>()
      items.forEach(item => {
        const existing = locationMap.get(item.location) || { count: 0, value: 0 }
        locationMap.set(item.location, {
          count: existing.count + 1,
          value: existing.value + item.totalValue
        })
      })

      return {
        totalItems: items.length,
        totalValue,
        activeItems,
        lowStockItems,
        outOfStockItems,
        totalMovements: movements.length,
        activeAlerts: alerts.length,
        categories: Array.from(categoryMap.entries()).map(([name, data]) => ({ name, ...data })),
        locations: Array.from(locationMap.entries()).map(([name, data]) => ({ name, ...data }))
      }
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المخزون:', error)
      throw error
    }
  }
}

export const inventoryManagementService = new InventoryManagementService()
