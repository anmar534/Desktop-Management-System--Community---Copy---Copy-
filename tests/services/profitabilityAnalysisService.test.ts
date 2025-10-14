/**
 * اختبارات خدمة تحليل الربحية
 * Profitability Analysis Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProfitabilityAnalysisService, ProjectProfitability, ClientProfitability } from '../../src/services/profitabilityAnalysisService'
import { asyncStorage } from '../../src/utils/storage'

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

describe('ProfitabilityAnalysisService', () => {
  let service: ProfitabilityAnalysisService
  let mockAsyncStorage: any

  beforeEach(() => {
    service = new ProfitabilityAnalysisService()
    mockAsyncStorage = asyncStorage as any
    vi.clearAllMocks()
  })

  describe('calculateProjectProfitability', () => {
    it('should calculate project profitability correctly', async () => {
      // إعداد البيانات الوهمية
      const mockProject = {
        id: 'project-1',
        name: 'مشروع اختبار',
        nameEn: 'Test Project',
        clientId: 'client-1',
        clientName: 'عميل اختبار',
        clientNameEn: 'Test Client',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        status: 'completed'
      }

      const mockCosts = {
        totalCosts: 800000,
        directCosts: 600000,
        indirectCosts: 200000,
        laborCosts: 400000,
        materialCosts: 300000,
        equipmentCosts: 100000,
        overheadCosts: 100000
      }

      const mockRevenue = {
        totalRevenue: 1000000,
        contractValue: 950000,
        additionalRevenue: 50000
      }

      // إعداد المحاكيات
      mockAsyncStorage.getItem
        .mockResolvedValueOnce([mockProject]) // projects
        .mockResolvedValueOnce([mockCosts]) // project_costs
        .mockResolvedValueOnce([mockRevenue]) // project_revenues
        .mockResolvedValueOnce([]) // existing profitabilities

      // تنفيذ الاختبار
      const result = await service.calculateProjectProfitability('project-1')

      // التحقق من النتائج
      expect(result).toBeDefined()
      expect(result.projectId).toBe('project-1')
      expect(result.projectName).toBe('مشروع اختبار')
      expect(result.totalRevenue).toBeGreaterThan(0)
      expect(result.netProfit).toBeGreaterThan(0)
      expect(result.netProfitMargin).toBeGreaterThan(0)
      expect(result.roi).toBeGreaterThan(0)
    })

    it('should handle zero revenue correctly', async () => {
      const mockProject = {
        id: 'project-2',
        name: 'مشروع بدون إيرادات',
        nameEn: 'No Revenue Project',
        clientId: 'client-1',
        clientName: 'عميل اختبار',
        clientNameEn: 'Test Client',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        status: 'active'
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([mockProject])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await service.calculateProjectProfitability('project-2')

      expect(result.grossProfitMargin).toBe(0)
      expect(result.netProfitMargin).toBe(0)
      expect(result.roi).toBe(0)
    })

    it('should throw error for non-existent project', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce([])

      await expect(service.calculateProjectProfitability('non-existent'))
        .rejects.toThrow('المشروع غير موجود')
    })
  })

  describe('calculateClientProfitability', () => {
    it('should calculate client profitability correctly', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'عميل اختبار',
        nameEn: 'Test Client'
      }

      const mockProjects = [
        {
          id: 'project-1',
          clientId: 'client-1',
          name: 'مشروع 1',
          nameEn: 'Project 1'
        },
        {
          id: 'project-2',
          clientId: 'client-1',
          name: 'مشروع 2',
          nameEn: 'Project 2'
        }
      ]

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(mockProjects) // client projects
        .mockResolvedValueOnce([mockClient]) // clients

      // محاكاة حساب ربحية المشاريع
      vi.spyOn(service, 'calculateProjectProfitability')
        .mockResolvedValueOnce({
          id: 'prof-1',
          projectId: 'project-1',
          projectName: 'مشروع 1',
          projectNameEn: 'Project 1',
          clientId: 'client-1',
          clientName: 'عميل اختبار',
          clientNameEn: 'Test Client',
          totalRevenue: 500000,
          totalCosts: 400000,
          netProfit: 100000,
          netProfitMargin: 20,
          duration: 150,
          roi: 25,
          startDate: '2024-01-01',
          endDate: '2024-06-01',
          status: 'completed'
        } as ProjectProfitability)
        .mockResolvedValueOnce({
          id: 'prof-2',
          projectId: 'project-2',
          projectName: 'مشروع 2',
          projectNameEn: 'Project 2',
          clientId: 'client-1',
          clientName: 'عميل اختبار',
          clientNameEn: 'Test Client',
          totalRevenue: 300000,
          totalCosts: 250000,
          netProfit: 50000,
          netProfitMargin: 16.67,
          duration: 100,
          roi: 20,
          startDate: '2024-02-01',
          endDate: '2024-05-01',
          status: 'completed'
        } as ProjectProfitability)

      const result = await service.calculateClientProfitability('client-1')

      expect(result).toBeDefined()
      expect(result.clientId).toBe('client-1')
      expect(result.totalProjects).toBe(2)
      expect(result.totalRevenue).toBe(800000)
      expect(result.totalProfit).toBe(150000)
      expect(result.averageProfitMargin).toBeCloseTo(18.75, 1)
    })

    it('should handle client with no projects', async () => {
      const mockClient = {
        id: 'client-empty',
        name: 'عميل بدون مشاريع',
        nameEn: 'Empty Client'
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([]) // no projects
        .mockResolvedValueOnce([mockClient]) // clients

      const result = await service.calculateClientProfitability('client-empty')

      expect(result.totalProjects).toBe(0)
      expect(result.totalRevenue).toBe(0)
      expect(result.totalProfit).toBe(0)
      expect(result.averageProfitMargin).toBe(0)
    })
  })

  describe('createProfitabilityComparison', () => {
    it('should create project comparison correctly', async () => {
      // محاكاة حساب ربحية المشاريع
      vi.spyOn(service, 'calculateProjectProfitability')
        .mockResolvedValueOnce({
          projectId: 'project-1',
          projectName: 'مشروع أ',
          projectNameEn: 'Project A',
          totalRevenue: 1000000,
          totalCosts: 800000,
          netProfit: 200000,
          netProfitMargin: 20,
          roi: 25
        } as ProjectProfitability)
        .mockResolvedValueOnce({
          projectId: 'project-2',
          projectName: 'مشروع ب',
          projectNameEn: 'Project B',
          totalRevenue: 800000,
          totalCosts: 700000,
          netProfit: 100000,
          netProfitMargin: 12.5,
          roi: 14.3
        } as ProjectProfitability)

      mockAsyncStorage.getItem.mockResolvedValueOnce([]) // existing comparisons

      const result = await service.createProfitabilityComparison(
        'projects',
        ['project-1', 'project-2']
      )

      expect(result).toBeDefined()
      expect(result.comparisonType).toBe('projects')
      expect(result.items).toHaveLength(2)
      expect(result.totalRevenue).toBe(1800000)
      expect(result.totalProfit).toBe(300000)
      expect(result.bestPerformer).toBe('مشروع أ')
      expect(result.worstPerformer).toBe('مشروع ب')
    })

    it('should create client comparison correctly', async () => {
      // محاكاة حساب ربحية العملاء
      vi.spyOn(service, 'calculateClientProfitability')
        .mockResolvedValueOnce({
          clientId: 'client-1',
          clientName: 'عميل أ',
          clientNameEn: 'Client A',
          totalRevenue: 2000000,
          totalCosts: 1600000,
          totalProfit: 400000,
          averageProfitMargin: 20
        } as ClientProfitability)
        .mockResolvedValueOnce({
          clientId: 'client-2',
          clientName: 'عميل ب',
          clientNameEn: 'Client B',
          totalRevenue: 1500000,
          totalCosts: 1350000,
          totalProfit: 150000,
          averageProfitMargin: 10
        } as ClientProfitability)

      mockAsyncStorage.getItem.mockResolvedValueOnce([])

      const result = await service.createProfitabilityComparison(
        'clients',
        ['client-1', 'client-2']
      )

      expect(result.comparisonType).toBe('clients')
      expect(result.items).toHaveLength(2)
      expect(result.bestPerformer).toBe('عميل أ')
      expect(result.worstPerformer).toBe('عميل ب')
    })
  })

  describe('analyzeProfitabilityTrend', () => {
    it('should analyze project trend correctly', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'مشروع الاتجاه',
        nameEn: 'Trend Project'
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([mockProject]) // projects
        .mockResolvedValueOnce([]) // existing trends

      const result = await service.analyzeProfitabilityTrend('project-1', 'project', 6)

      expect(result).toBeDefined()
      expect(result.entityId).toBe('project-1')
      expect(result.entityType).toBe('project')
      expect(result.monthlyData).toHaveLength(6)
      expect(result.revenueGrowthRate).toBeDefined()
      expect(result.profitGrowthRate).toBeDefined()
      expect(['improving', 'stable', 'declining']).toContain(result.marginTrend)
    })

    it('should analyze client trend correctly', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'عميل الاتجاه',
        nameEn: 'Trend Client'
      }

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([mockClient]) // clients
        .mockResolvedValueOnce([]) // existing trends

      const result = await service.analyzeProfitabilityTrend('client-1', 'client', 12)

      expect(result.entityType).toBe('client')
      expect(result.monthlyData).toHaveLength(12)
      expect(result.projectedRevenue).toBeGreaterThan(0)
      expect(result.projectedProfit).toBeGreaterThan(0)
      expect(result.confidenceLevel).toBeGreaterThanOrEqual(0)
      expect(result.confidenceLevel).toBeLessThanOrEqual(100)
    })
  })

  describe('getMostProfitableProjects', () => {
    it('should return most profitable projects', async () => {
      const mockProfitabilities = [
        { projectId: 'project-1', netProfit: 200000, projectName: 'مشروع أ' },
        { projectId: 'project-2', netProfit: 150000, projectName: 'مشروع ب' },
        { projectId: 'project-3', netProfit: 300000, projectName: 'مشروع ج' }
      ]

      mockAsyncStorage.getItem.mockResolvedValueOnce(mockProfitabilities)

      const result = await service.getMostProfitableProjects(2)

      expect(result).toHaveLength(2)
      expect(result[0].netProfit).toBe(300000) // الأعلى ربحاً
      expect(result[1].netProfit).toBe(200000) // الثاني
    })

    it('should handle empty profitabilities', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce([])

      const result = await service.getMostProfitableProjects(5)

      expect(result).toHaveLength(0)
    })
  })

  describe('getMostProfitableClients', () => {
    it('should return most profitable clients', async () => {
      const mockProfitabilities = [
        { clientId: 'client-1', totalProfit: 400000, clientName: 'عميل أ' },
        { clientId: 'client-2', totalProfit: 250000, clientName: 'عميل ب' },
        { clientId: 'client-3', totalProfit: 600000, clientName: 'عميل ج' }
      ]

      mockAsyncStorage.getItem.mockResolvedValueOnce(mockProfitabilities)

      const result = await service.getMostProfitableClients(2)

      expect(result).toHaveLength(2)
      expect(result[0].totalProfit).toBe(600000)
      expect(result[1].totalProfit).toBe(400000)
    })
  })

  describe('Data persistence', () => {
    it('should save and retrieve project profitability', async () => {
      const mockProfitability: ProjectProfitability = {
        id: 'prof-1',
        projectId: 'project-1',
        projectName: 'مشروع اختبار',
        projectNameEn: 'Test Project',
        clientId: 'client-1',
        clientName: 'عميل اختبار',
        clientNameEn: 'Test Client',
        totalRevenue: 1000000,
        contractValue: 950000,
        additionalRevenue: 50000,
        totalCosts: 800000,
        directCosts: 600000,
        indirectCosts: 200000,
        laborCosts: 400000,
        materialCosts: 300000,
        equipmentCosts: 100000,
        overheadCosts: 100000,
        grossProfit: 400000,
        grossProfitMargin: 40,
        netProfit: 200000,
        netProfitMargin: 20,
        roi: 25,
        costEfficiency: 80,
        revenuePerDay: 6667,
        profitPerDay: 1333,
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        duration: 150,
        status: 'completed',
        createdAt: '2024-10-14T00:00:00.000Z',
        updatedAt: '2024-10-14T00:00:00.000Z',
        version: 1
      }

      mockAsyncStorage.getItem.mockResolvedValueOnce([mockProfitability])

      const result = await service.getProjectProfitability('project-1')

      expect(result).toEqual(mockProfitability)
    })

    it('should return null for non-existent profitability', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce([])

      const result = await service.getProjectProfitability('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('Error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

      const result = await service.getProjectProfitability('project-1')

      expect(result).toBeNull()
    })

    it('should throw error when calculation fails', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Calculation error'))

      await expect(service.calculateProjectProfitability('project-1'))
        .rejects.toThrow('فشل في حساب ربحية المشروع')
    })
  })

  describe('Data refresh', () => {
    it('should refresh all data successfully', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'مشروع 1' },
        { id: 'project-2', name: 'مشروع 2' }
      ]

      const mockClients = [
        { id: 'client-1', name: 'عميل 1' },
        { id: 'client-2', name: 'عميل 2' }
      ]

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(mockProjects) // projects
        .mockResolvedValueOnce(mockClients) // clients

      vi.spyOn(service, 'calculateProjectProfitability').mockResolvedValue({} as ProjectProfitability)
      vi.spyOn(service, 'calculateClientProfitability').mockResolvedValue({} as ClientProfitability)

      await expect(service.refreshAllData()).resolves.not.toThrow()

      expect(service.calculateProjectProfitability).toHaveBeenCalledTimes(2)
      expect(service.calculateClientProfitability).toHaveBeenCalledTimes(2)
    })
  })
})
