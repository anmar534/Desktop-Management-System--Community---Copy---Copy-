/**
 * Risk Management Service Tests
 * اختبارات خدمة إدارة المخاطر
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { riskManagementService } from '../../src/services/riskManagementService'
import type { CreateRiskRequest, UpdateRiskRequest } from '../../src/types/risk'

// Mock asyncStorage
const mockStorage = new Map()
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn((key: string, defaultValue: any) => {
      return Promise.resolve(mockStorage.get(key) || defaultValue)
    }),
    setItem: vi.fn((key: string, value: any) => {
      mockStorage.set(key, value)
      return Promise.resolve()
    }),
    removeItem: vi.fn((key: string) => {
      mockStorage.delete(key)
      return Promise.resolve()
    }),
    clear: vi.fn(() => {
      mockStorage.clear()
      return Promise.resolve()
    })
  }
}))

describe('RiskManagementService', () => {
  beforeEach(() => {
    mockStorage.clear()
    vi.clearAllMocks()
  })

  describe('Risk CRUD Operations', () => {
    it('should create a new risk', async () => {
      const riskRequest: CreateRiskRequest = {
        projectId: 'project_1',
        title: 'Test Risk',
        titleEn: 'مخاطر اختبار',
        description: 'Test risk description',
        descriptionEn: 'وصف مخاطر الاختبار',
        category: 'technical',
        probability: 'medium',
        impact: 'high',
        responseStrategy: 'mitigate',
        identifiedBy: 'user_1',
        identifiedByName: 'Test User'
      }

      const risk = await riskManagementService.createRisk(riskRequest)

      expect(risk).toBeDefined()
      expect(risk.id).toBeDefined()
      expect(risk.title).toBe(riskRequest.title)
      expect(risk.titleEn).toBe(riskRequest.titleEn)
      expect(risk.projectId).toBe(riskRequest.projectId)
      expect(risk.category).toBe(riskRequest.category)
      expect(risk.probability).toBe(riskRequest.probability)
      expect(risk.impact).toBe(riskRequest.impact)
      expect(risk.responseStrategy).toBe(riskRequest.responseStrategy)
      expect(risk.riskScore).toBe(12) // medium (3) * high (4)
      expect(risk.status).toBe('identified')
      expect(risk.createdAt).toBeDefined()
      expect(risk.updatedAt).toBeDefined()
      expect(risk.version).toBe(1)
    })

    it('should retrieve a risk by ID', async () => {
      const riskRequest: CreateRiskRequest = {
        projectId: 'project_1',
        title: 'Test Risk',
        titleEn: 'مخاطر اختبار',
        description: 'Test risk description',
        descriptionEn: 'وصف مخاطر الاختبار',
        category: 'technical',
        probability: 'medium',
        impact: 'high',
        responseStrategy: 'mitigate',
        identifiedBy: 'user_1',
        identifiedByName: 'Test User'
      }

      const createdRisk = await riskManagementService.createRisk(riskRequest)
      const retrievedRisk = await riskManagementService.getRisk(createdRisk.id)

      expect(retrievedRisk).toBeDefined()
      expect(retrievedRisk!.id).toBe(createdRisk.id)
      expect(retrievedRisk!.title).toBe(createdRisk.title)
    })

    it('should return null for non-existent risk', async () => {
      const risk = await riskManagementService.getRisk('non_existent_id')
      expect(risk).toBeNull()
    })

    it('should update a risk', async () => {
      const riskRequest: CreateRiskRequest = {
        projectId: 'project_1',
        title: 'Test Risk',
        titleEn: 'مخاطر اختبار',
        description: 'Test risk description',
        descriptionEn: 'وصف مخاطر الاختبار',
        category: 'technical',
        probability: 'medium',
        impact: 'high',
        responseStrategy: 'mitigate',
        identifiedBy: 'user_1',
        identifiedByName: 'Test User'
      }

      const createdRisk = await riskManagementService.createRisk(riskRequest)
      const updates: UpdateRiskRequest = {
        title: 'Updated Risk Title',
        probability: 'high',
        impact: 'very_high'
      }

      const updatedRisk = await riskManagementService.updateRisk(createdRisk.id, updates)

      expect(updatedRisk.title).toBe(updates.title)
      expect(updatedRisk.probability).toBe(updates.probability)
      expect(updatedRisk.impact).toBe(updates.impact)
      expect(updatedRisk.riskScore).toBe(20) // high (4) * very_high (5)
      expect(updatedRisk.version).toBe(createdRisk.version + 1)
      expect(new Date(updatedRisk.updatedAt).getTime()).toBeGreaterThan(new Date(createdRisk.updatedAt).getTime())
    })

    it('should delete a risk', async () => {
      const riskRequest: CreateRiskRequest = {
        projectId: 'project_1',
        title: 'Test Risk',
        titleEn: 'مخاطر اختبار',
        description: 'Test risk description',
        descriptionEn: 'وصف مخاطر الاختبار',
        category: 'technical',
        probability: 'medium',
        impact: 'high',
        responseStrategy: 'mitigate',
        identifiedBy: 'user_1',
        identifiedByName: 'Test User'
      }

      const createdRisk = await riskManagementService.createRisk(riskRequest)
      await riskManagementService.deleteRisk(createdRisk.id)

      const retrievedRisk = await riskManagementService.getRisk(createdRisk.id)
      expect(retrievedRisk).toBeNull()
    })

    it('should get risks by project', async () => {
      const project1Risks = [
        {
          projectId: 'project_1',
          title: 'Risk 1',
          titleEn: 'مخاطر 1',
          description: 'Description 1',
          descriptionEn: 'وصف 1',
          category: 'technical' as const,
          probability: 'high' as const,
          impact: 'very_high' as const,
          responseStrategy: 'mitigate' as const,
          identifiedBy: 'user_1',
          identifiedByName: 'User 1'
        },
        {
          projectId: 'project_1',
          title: 'Risk 2',
          titleEn: 'مخاطر 2',
          description: 'Description 2',
          descriptionEn: 'وصف 2',
          category: 'financial' as const,
          probability: 'medium' as const,
          impact: 'medium' as const,
          responseStrategy: 'monitor' as const,
          identifiedBy: 'user_2',
          identifiedByName: 'User 2'
        }
      ]

      const project2Risk = {
        projectId: 'project_2',
        title: 'Risk 3',
        titleEn: 'مخاطر 3',
        description: 'Description 3',
        descriptionEn: 'وصف 3',
        category: 'schedule' as const,
        probability: 'low' as const,
        impact: 'low' as const,
        responseStrategy: 'accept' as const,
        identifiedBy: 'user_3',
        identifiedByName: 'User 3'
      }

      // Create risks
      await Promise.all([
        ...project1Risks.map(risk => riskManagementService.createRisk(risk)),
        riskManagementService.createRisk(project2Risk)
      ])

      const project1RisksList = await riskManagementService.getRisksByProject('project_1')
      const project2RisksList = await riskManagementService.getRisksByProject('project_2')

      expect(project1RisksList).toHaveLength(2)
      expect(project2RisksList).toHaveLength(1)
      expect(project1RisksList.every(risk => risk.projectId === 'project_1')).toBe(true)
      expect(project2RisksList.every(risk => risk.projectId === 'project_2')).toBe(true)
    })
  })

  describe('Risk Assessment', () => {
    it('should assess a risk', async () => {
      const riskRequest: CreateRiskRequest = {
        projectId: 'project_1',
        title: 'Test Risk',
        titleEn: 'مخاطر اختبار',
        description: 'Test risk description',
        descriptionEn: 'وصف مخاطر الاختبار',
        category: 'technical',
        probability: 'medium',
        impact: 'medium',
        responseStrategy: 'mitigate',
        identifiedBy: 'user_1',
        identifiedByName: 'Test User'
      }

      const createdRisk = await riskManagementService.createRisk(riskRequest)
      const assessedRisk = await riskManagementService.assessRisk(createdRisk.id, 'high', 'very_high', 'assessor_1')

      expect(assessedRisk.probability).toBe('high')
      expect(assessedRisk.impact).toBe('very_high')
      expect(assessedRisk.riskScore).toBe(20) // high (4) * very_high (5)
      expect(assessedRisk.status).toBe('assessed')
      expect(assessedRisk.assessedBy).toBe('assessor_1')
      expect(assessedRisk.assessedDate).toBeDefined()
    })

    it('should calculate risk score correctly', () => {
      expect(riskManagementService.calculateRiskScore('very_low', 'very_low')).toBe(1)
      expect(riskManagementService.calculateRiskScore('medium', 'high')).toBe(12)
      expect(riskManagementService.calculateRiskScore('very_high', 'very_high')).toBe(25)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when updating non-existent risk', async () => {
      await expect(
        riskManagementService.updateRisk('non_existent_id', { title: 'Updated' })
      ).rejects.toThrow('المخاطرة غير موجودة')
    })

    it('should throw error when assessing non-existent risk', async () => {
      await expect(
        riskManagementService.assessRisk('non_existent_id', 'medium', 'high', 'assessor_1')
      ).rejects.toThrow('المخاطرة غير موجودة')
    })
  })
})
