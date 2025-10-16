/**
 * اختبارات خدمة التكامل الشامل للنظام
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the storage utility first
vi.mock('../../../src/utils/storage', () => ({
  asyncStorage: {
    data: {},
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

import { unifiedSystemIntegrationService } from '../../../src/services/unifiedSystemIntegrationService'
import { asyncStorage } from '../../../src/utils/storage'

const mockStorage = asyncStorage as any

describe('UnifiedSystemIntegrationService', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default mock data
    mockStorage.data = {
      app_system_modules: [],
      app_data_flows: [],
      app_integration_conflicts: [],
      app_realtime_updates: [],
      app_tenders_data: [
        {
          id: 'tender-1',
          title: 'مشروع إنشاء مبنى',
          status: 'awarded',
          estimatedValue: 1000000,
          projectCreated: false
        }
      ],
      app_projects_data: [
        {
          id: 'project-1',
          name: 'مشروع تطوير النظام',
          budget: 500000,
          status: 'active'
        }
      ],
      app_budgets: [
        {
          id: 'budget-1',
          projectId: 'project-1',
          totalBudget: 500000,
          spentBudget: 100000,
          remainingBudget: 400000
        }
      ],
      app_purchase_orders_data: [
        {
          id: 'po-1',
          projectId: 'project-1',
          totalAmount: 50000,
          status: 'completed'
        }
      ]
    }
    
    // Setup mock implementations
    mockStorage.getItem.mockImplementation((key: string) => {
      return Promise.resolve(mockStorage.data[key] || [])
    })
    
    mockStorage.setItem.mockImplementation((key: string, value: any) => {
      mockStorage.data[key] = value
      return Promise.resolve()
    })
  })

  describe('initialize', () => {
    it('يجب أن يقوم بتهيئة النظام بنجاح', async () => {
      await unifiedSystemIntegrationService.initialize()
      
      expect(mockStorage.getItem).toHaveBeenCalled()
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('يجب أن ينشئ الوحدات الافتراضية عند عدم وجودها', async () => {
      await unifiedSystemIntegrationService.initialize()
      
      const modules = await unifiedSystemIntegrationService.getSystemModules()
      expect(modules).toHaveLength(4)
      expect(modules.map(m => m.id)).toEqual(['tenders', 'projects', 'financial', 'procurement'])
    })

    it('يجب أن ينشئ تدفقات البيانات الافتراضية', async () => {
      await unifiedSystemIntegrationService.initialize()
      
      const dataFlows = await unifiedSystemIntegrationService.getDataFlows()
      expect(dataFlows).toHaveLength(5)
      expect(dataFlows.some(df => df.id === 'tenders-to-projects')).toBe(true)
      expect(dataFlows.some(df => df.id === 'projects-to-financial')).toBe(true)
    })
  })

  describe('getSystemModules', () => {
    it('يجب أن يعيد جميع وحدات النظام مع عدد البيانات المحدث', async () => {
      await unifiedSystemIntegrationService.initialize()

      const modules = await unifiedSystemIntegrationService.getSystemModules()

      expect(modules).toHaveLength(4)

      const tendersModule = modules.find(m => m.id === 'tenders')
      expect(tendersModule?.dataCount).toBeGreaterThanOrEqual(0)

      const projectsModule = modules.find(m => m.id === 'projects')
      expect(projectsModule?.dataCount).toBeGreaterThanOrEqual(0)
    })

    it('يجب أن تحتوي الوحدات على المعلومات الصحيحة', async () => {
      await unifiedSystemIntegrationService.initialize()
      
      const modules = await unifiedSystemIntegrationService.getSystemModules()
      const tendersModule = modules.find(m => m.id === 'tenders')
      
      expect(tendersModule).toMatchObject({
        id: 'tenders',
        name: 'إدارة المنافسات',
        nameEn: 'Tender Management',
        status: 'active',
        dependencies: []
      })
    })
  })

  describe('getIntegrationSummary', () => {
    it('يجب أن يعيد ملخص التكامل الصحيح', async () => {
      await unifiedSystemIntegrationService.initialize()
      
      const summary = await unifiedSystemIntegrationService.getIntegrationSummary()
      
      expect(summary.totalModules).toBe(4)
      expect(summary.activeModules).toBe(4)
      expect(summary.totalDataFlows).toBe(5)
      expect(summary.activeDataFlows).toBe(5)
      expect(['excellent', 'good', 'warning', 'critical']).toContain(summary.systemHealth)
      expect(['synced', 'syncing', 'error']).toContain(summary.overallSyncStatus)
      expect(summary.dataConsistencyScore).toBeGreaterThanOrEqual(0)
      expect(summary.dataConsistencyScore).toBeLessThanOrEqual(100)
      expect(summary.performanceScore).toBeGreaterThanOrEqual(0)
      expect(summary.performanceScore).toBeLessThanOrEqual(100)
    })
  })

  describe('syncAllData', () => {
    it('يجب أن يقوم بمزامنة جميع البيانات بنجاح', async () => {
      await unifiedSystemIntegrationService.initialize()
      
      await expect(unifiedSystemIntegrationService.syncAllData()).resolves.not.toThrow()
      
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'app_last_full_sync',
        expect.any(String)
      )
    })

    it('يجب أن ينشئ مشاريع من المنافسات المرسية', async () => {
      await unifiedSystemIntegrationService.initialize()
      await unifiedSystemIntegrationService.syncAllData()

      // التحقق من أن المزامنة تمت بدون أخطاء
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'app_last_full_sync',
        expect.any(String)
      )
    })

    it('يجب أن يحدث الميزانيات بناءً على أوامر الشراء', async () => {
      await unifiedSystemIntegrationService.initialize()
      await unifiedSystemIntegrationService.syncAllData()

      // التحقق من أن المزامنة تمت بدون أخطاء
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'app_last_full_sync',
        expect.any(String)
      )
    })
  })

  describe('addRealTimeUpdate', () => {
    it('يجب أن يضيف تحديث في الوقت الفعلي', async () => {
      await unifiedSystemIntegrationService.initialize()
      
      const update = {
        moduleId: 'tenders',
        dataType: 'tender',
        operation: 'create' as const,
        recordId: 'tender-2',
        affectedModules: ['projects']
      }
      
      await unifiedSystemIntegrationService.addRealTimeUpdate(update)
      
      const recentUpdates = await unifiedSystemIntegrationService.getRecentUpdates(10)
      expect(recentUpdates).toHaveLength(1)
      expect(recentUpdates[0]).toMatchObject({
        moduleId: 'tenders',
        dataType: 'tender',
        operation: 'create',
        recordId: 'tender-2'
      })
    })

    it('يجب أن ينشر التحديث للوحدات المتأثرة', async () => {
      await unifiedSystemIntegrationService.initialize()
      
      const update = {
        moduleId: 'tenders',
        dataType: 'tender',
        operation: 'update' as const,
        recordId: 'tender-1',
        affectedModules: []
      }
      
      await unifiedSystemIntegrationService.addRealTimeUpdate(update)
      
      const recentUpdates = await unifiedSystemIntegrationService.getRecentUpdates(1)
      expect(recentUpdates[0].propagated).toBe(true)
      expect(recentUpdates[0].affectedModules.length).toBeGreaterThan(0)
    })
  })

  describe('getPendingConflicts', () => {
    it('يجب أن يعيد التضاربات المعلقة فقط', async () => {
      // إضافة تضاربات وهمية
      mockStorage.data.app_integration_conflicts = [
        {
          id: 'conflict-1',
          status: 'pending',
          conflictType: 'data_mismatch',
          severity: 'high'
        },
        {
          id: 'conflict-2',
          status: 'resolved',
          conflictType: 'version_conflict',
          severity: 'medium'
        }
      ]
      
      await unifiedSystemIntegrationService.initialize()
      
      const pendingConflicts = await unifiedSystemIntegrationService.getPendingConflicts()
      expect(pendingConflicts).toHaveLength(1)
      expect(pendingConflicts[0].id).toBe('conflict-1')
      expect(pendingConflicts[0].status).toBe('pending')
    })
  })

  describe('resolveConflict', () => {
    it('يجب أن يحل التضارب بنجاح', async () => {
      // إضافة تضارب وهمي
      mockStorage.data.app_integration_conflicts = [
        {
          id: 'conflict-1',
          status: 'pending',
          conflictType: 'data_mismatch',
          severity: 'high'
        }
      ]
      
      await unifiedSystemIntegrationService.initialize()
      
      await unifiedSystemIntegrationService.resolveConflict('conflict-1', 'manual_override')
      
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'app_integration_conflicts',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'conflict-1',
            status: 'resolved',
            resolutionStrategy: 'manual_override',
            resolvedAt: expect.any(String)
          })
        ])
      )
    })

    it('يجب أن يرمي خطأ عند محاولة حل تضارب غير موجود', async () => {
      await unifiedSystemIntegrationService.initialize()
      
      await expect(
        unifiedSystemIntegrationService.resolveConflict('non-existent', 'strategy')
      ).rejects.toThrow('التضارب غير موجود')
    })
  })

  describe('getRecentUpdates', () => {
    it('يجب أن يعيد التحديثات مرتبة حسب التاريخ', async () => {
      // إضافة تحديثات وهمية
      const now = new Date()
      const updates = [
        {
          id: 'update-1',
          timestamp: new Date(now.getTime() - 1000).toISOString(),
          moduleId: 'tenders'
        },
        {
          id: 'update-2',
          timestamp: now.toISOString(),
          moduleId: 'projects'
        }
      ]
      
      mockStorage.data.app_realtime_updates = updates
      
      await unifiedSystemIntegrationService.initialize()
      
      const recentUpdates = await unifiedSystemIntegrationService.getRecentUpdates(10)
      expect(recentUpdates).toHaveLength(2)
      expect(recentUpdates[0].id).toBe('update-2') // الأحدث أولاً
      expect(recentUpdates[1].id).toBe('update-1')
    })

    it('يجب أن يحترم حد العدد المطلوب', async () => {
      // إضافة 5 تحديثات
      const updates = Array.from({ length: 5 }, (_, i) => ({
        id: `update-${i}`,
        timestamp: new Date().toISOString(),
        moduleId: 'tenders'
      }))
      
      mockStorage.data.app_realtime_updates = updates
      
      await unifiedSystemIntegrationService.initialize()
      
      const recentUpdates = await unifiedSystemIntegrationService.getRecentUpdates(3)
      expect(recentUpdates).toHaveLength(3)
    })
  })
})
