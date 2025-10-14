/**
 * System Integration Service Tests
 * اختبارات خدمة التكامل مع الأنظمة
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { systemIntegrationService } from '../../src/services/systemIntegrationService'

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

// Mock enhancedProjectService
vi.mock('../../src/services/enhancedProjectService', () => ({
  enhancedProjectService: {
    getAllProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn()
  }
}))

import { asyncStorage } from '../../src/utils/storage'
import { enhancedProjectService } from '../../src/services/enhancedProjectService'

describe('SystemIntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    ;(asyncStorage.getItem as any).mockResolvedValue([])
    ;(asyncStorage.setItem as any).mockResolvedValue(undefined)
    ;(enhancedProjectService.getAllProjects as any).mockResolvedValue([])
    ;(enhancedProjectService.createProject as any).mockResolvedValue({ id: 'new-project' })
    ;(enhancedProjectService.updateProject as any).mockResolvedValue({ id: 'updated-project' })
  })

  describe('Tender System Setup', () => {
    it('should setup tender system successfully', async () => {
      const systemData = {
        name: 'نظام المنافسات الحكومية',
        nameEn: 'Government Tenders System',
        endpoint: 'https://api.tenders.gov.sa',
        apiKey: 'test-api-key',
        isActive: true
      }

      const result = await systemIntegrationService.setupTenderSystem(systemData)

      expect(result).toMatchObject({
        ...systemData,
        id: expect.stringMatching(/^tender_\d+_[a-z0-9]+$/),
        lastSync: expect.any(String),
        syncStatus: 'pending'
      })

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'tender_systems',
        expect.arrayContaining([result])
      )
    })

    it('should handle setup errors', async () => {
      ;(asyncStorage.setItem as any).mockRejectedValue(new Error('Storage error'))

      const systemData = {
        name: 'نظام المنافسات',
        nameEn: 'Tenders System',
        endpoint: 'https://api.example.com',
        isActive: true
      }

      await expect(
        systemIntegrationService.setupTenderSystem(systemData)
      ).rejects.toThrow('فشل في إعداد نظام المنافسات')
    })
  })

  describe('Financial System Setup', () => {
    it('should setup financial system successfully', async () => {
      const systemData = {
        name: 'النظام المالي المتكامل',
        nameEn: 'Integrated Financial System',
        endpoint: 'https://api.finance.company.com',
        credentials: {
          username: 'admin',
          password: 'password',
          apiKey: 'finance-api-key'
        },
        isActive: true,
        supportedOperations: ['expenses', 'budgets', 'reports']
      }

      const result = await systemIntegrationService.setupFinancialSystem(systemData)

      expect(result).toMatchObject({
        ...systemData,
        id: expect.stringMatching(/^financial_\d+_[a-z0-9]+$/),
        lastSync: expect.any(String),
        syncStatus: 'pending'
      })

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'financial_systems',
        expect.arrayContaining([result])
      )
    })

    it('should handle setup errors', async () => {
      ;(asyncStorage.setItem as any).mockRejectedValue(new Error('Storage error'))

      const systemData = {
        name: 'النظام المالي',
        nameEn: 'Financial System',
        endpoint: 'https://api.example.com',
        isActive: true,
        supportedOperations: ['expenses']
      }

      await expect(
        systemIntegrationService.setupFinancialSystem(systemData)
      ).rejects.toThrow('فشل في إعداد النظام المالي')
    })
  })

  describe('Tender Projects Sync', () => {
    it('should sync projects from tender system successfully', async () => {
      const tenderSystem = {
        id: 'tender-system-1',
        name: 'نظام المنافسات',
        nameEn: 'Tenders System',
        endpoint: 'https://api.tenders.gov.sa',
        isActive: true,
        lastSync: '2024-01-01T00:00:00.000Z',
        syncStatus: 'success' as const
      }

      ;(asyncStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'tender_systems') {
          return Promise.resolve([tenderSystem])
        }
        return Promise.resolve([])
      })

      ;(enhancedProjectService.getAllProjects as any).mockResolvedValue([])

      const result = await systemIntegrationService.syncProjectsFromTender('tender-system-1')

      expect(result.success).toBe(true)
      expect(result.recordsProcessed).toBeGreaterThan(0)
      expect(result.recordsCreated).toBeGreaterThan(0)
      expect(result.errors).toHaveLength(0)
      expect(enhancedProjectService.createProject).toHaveBeenCalled()
    })

    it('should update existing projects during sync', async () => {
      const tenderSystem = {
        id: 'tender-system-1',
        name: 'نظام المنافسات',
        nameEn: 'Tenders System',
        endpoint: 'https://api.tenders.gov.sa',
        isActive: true,
        lastSync: '2024-01-01T00:00:00.000Z',
        syncStatus: 'success' as const
      }

      const existingProject = {
        id: 'existing-project-1',
        name: 'مشروع موجود',
        tenderReference: 'T2024001'
      }

      ;(asyncStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'tender_systems') {
          return Promise.resolve([tenderSystem])
        }
        return Promise.resolve([])
      })

      ;(enhancedProjectService.getAllProjects as any).mockResolvedValue([existingProject])

      const result = await systemIntegrationService.syncProjectsFromTender('tender-system-1')

      expect(result.success).toBe(true)
      expect(result.recordsUpdated).toBeGreaterThan(0)
      expect(enhancedProjectService.updateProject).toHaveBeenCalled()
    })

    it('should handle sync errors gracefully', async () => {
      const tenderSystem = {
        id: 'tender-system-1',
        name: 'نظام المنافسات',
        nameEn: 'Tenders System',
        endpoint: 'https://api.tenders.gov.sa',
        isActive: true,
        lastSync: '2024-01-01T00:00:00.000Z',
        syncStatus: 'success' as const
      }

      ;(asyncStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'tender_systems') {
          return Promise.resolve([tenderSystem])
        }
        return Promise.resolve([])
      })

      ;(enhancedProjectService.getAllProjects as any).mockRejectedValue(new Error('Database error'))

      const result = await systemIntegrationService.syncProjectsFromTender('tender-system-1')

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('خطأ عام في المزامنة')
    })

    it('should fail for non-existent system', async () => {
      ;(asyncStorage.getItem as any).mockResolvedValue([])

      const result = await systemIntegrationService.syncProjectsFromTender('non-existent-system')

      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('نظام المنافسات غير موجود')
    })

    it('should fail for inactive system', async () => {
      const inactiveSystem = {
        id: 'tender-system-1',
        name: 'نظام المنافسات',
        nameEn: 'Tenders System',
        endpoint: 'https://api.tenders.gov.sa',
        isActive: false,
        lastSync: '2024-01-01T00:00:00.000Z',
        syncStatus: 'success' as const
      }

      ;(asyncStorage.getItem as any).mockResolvedValue([inactiveSystem])

      const result = await systemIntegrationService.syncProjectsFromTender('tender-system-1')

      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('نظام المنافسات غير نشط')
    })
  })

  describe('Financial Data Sync', () => {
    it('should sync financial data successfully', async () => {
      const financialSystem = {
        id: 'financial-system-1',
        name: 'النظام المالي',
        nameEn: 'Financial System',
        endpoint: 'https://api.finance.com',
        isActive: true,
        lastSync: '2024-01-01T00:00:00.000Z',
        syncStatus: 'success' as const,
        supportedOperations: ['expenses']
      }

      const project = {
        id: 'project-1',
        name: 'مشروع اختبار',
        actualCost: 100000
      }

      ;(asyncStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'financial_systems') {
          return Promise.resolve([financialSystem])
        }
        return Promise.resolve([])
      })

      ;(enhancedProjectService.getProject as any).mockResolvedValue(project)

      const result = await systemIntegrationService.syncFinancialData('financial-system-1', 'project-1')

      expect(result.success).toBe(true)
      expect(result.recordsUpdated).toBe(1)
      expect(enhancedProjectService.updateProject).toHaveBeenCalled()
    })

    it('should handle financial sync errors', async () => {
      ;(asyncStorage.getItem as any).mockResolvedValue([])

      const result = await systemIntegrationService.syncFinancialData('non-existent-system', 'project-1')

      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('النظام المالي غير موجود')
    })
  })

  describe('System Retrieval', () => {
    it('should get tender systems', async () => {
      const systems = [
        { id: 'system-1', name: 'نظام 1' },
        { id: 'system-2', name: 'نظام 2' }
      ]

      ;(asyncStorage.getItem as any).mockResolvedValue(systems)

      const result = await systemIntegrationService.getTenderSystems()

      expect(result).toEqual(systems)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('tender_systems')
    })

    it('should get financial systems', async () => {
      const systems = [
        { id: 'system-1', name: 'نظام مالي 1' },
        { id: 'system-2', name: 'نظام مالي 2' }
      ]

      ;(asyncStorage.getItem as any).mockResolvedValue(systems)

      const result = await systemIntegrationService.getFinancialSystems()

      expect(result).toEqual(systems)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('financial_systems')
    })

    it('should handle retrieval errors gracefully', async () => {
      ;(asyncStorage.getItem as any).mockRejectedValue(new Error('Storage error'))

      const tenderSystems = await systemIntegrationService.getTenderSystems()
      const financialSystems = await systemIntegrationService.getFinancialSystems()

      expect(tenderSystems).toEqual([])
      expect(financialSystems).toEqual([])
    })
  })

  describe('Connection Testing', () => {
    it('should test tender system connection successfully', async () => {
      const system = {
        id: 'tender-system-1',
        name: 'نظام المنافسات',
        isActive: true
      }

      ;(asyncStorage.getItem as any).mockResolvedValue([system])

      const result = await systemIntegrationService.testConnection('tender', 'tender-system-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('تم الاتصال بنجاح')
    })

    it('should test financial system connection successfully', async () => {
      const system = {
        id: 'financial-system-1',
        name: 'النظام المالي',
        isActive: true
      }

      ;(asyncStorage.getItem as any).mockResolvedValue([system])

      const result = await systemIntegrationService.testConnection('financial', 'financial-system-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('تم الاتصال بنجاح')
    })

    it('should fail connection test for non-existent system', async () => {
      ;(asyncStorage.getItem as any).mockResolvedValue([])

      const result = await systemIntegrationService.testConnection('tender', 'non-existent')

      expect(result.success).toBe(false)
      expect(result.message).toBe('النظام غير موجود')
    })
  })

  describe('Sync History', () => {
    it('should get sync history', async () => {
      const history = [
        {
          id: 'sync-1',
          type: 'tender',
          systemId: 'system-1',
          result: { success: true, recordsProcessed: 5 },
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      ]

      ;(asyncStorage.getItem as any).mockResolvedValue(history)

      const result = await systemIntegrationService.getSyncHistory(10)

      expect(result).toEqual(history.reverse())
      expect(asyncStorage.getItem).toHaveBeenCalledWith('sync_history')
    })

    it('should handle sync history errors gracefully', async () => {
      ;(asyncStorage.getItem as any).mockRejectedValue(new Error('Storage error'))

      const result = await systemIntegrationService.getSyncHistory()

      expect(result).toEqual([])
    })

    it('should limit sync history results', async () => {
      const history = Array.from({ length: 50 }, (_, i) => ({
        id: `sync-${i}`,
        type: 'tender',
        systemId: 'system-1',
        result: { success: true },
        timestamp: new Date().toISOString()
      }))

      ;(asyncStorage.getItem as any).mockResolvedValue(history)

      const result = await systemIntegrationService.getSyncHistory(5)

      expect(result).toHaveLength(5)
    })
  })

  describe('Data Mapping', () => {
    it('should map tender status correctly', async () => {
      const tenderSystem = {
        id: 'tender-system-1',
        name: 'نظام المنافسات',
        nameEn: 'Tenders System',
        endpoint: 'https://api.tenders.gov.sa',
        isActive: true,
        lastSync: '2024-01-01T00:00:00.000Z',
        syncStatus: 'success' as const
      }

      ;(asyncStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'tender_systems') {
          return Promise.resolve([tenderSystem])
        }
        return Promise.resolve([])
      })

      ;(enhancedProjectService.getAllProjects as any).mockResolvedValue([])

      const result = await systemIntegrationService.syncProjectsFromTender('tender-system-1')

      expect(result.success).toBe(true)
      expect(enhancedProjectService.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.stringMatching(/^(active|completed|cancelled|planning)$/)
        })
      )
    })
  })
})
