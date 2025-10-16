import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PricingTemplate, TemplateCategory } from '../../src/types/templates'

// Mock safeLocalStorage - must be defined before vi.mock due to hoisting
const mockSafeLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  hasItem: vi.fn(),
}

vi.mock('../../src/utils/storage', () => ({
  safeLocalStorage: mockSafeLocalStorage,
  STORAGE_KEYS: {
    PRICING_TEMPLATES: 'app_pricing_templates',
  },
}))

// Import after mocking
const { templateService } = await import('../../src/services/templateService')

describe('TemplateService', () => {
  beforeEach(() => {
    mockSafeLocalStorage.getItem.mockClear()
    mockSafeLocalStorage.setItem.mockClear()
    mockSafeLocalStorage.removeItem.mockClear()
    mockSafeLocalStorage.hasItem.mockClear()
  })

  describe('getTemplates', () => {
    it('should return default templates when storage is empty', async () => {
      mockSafeLocalStorage.getItem.mockReturnValue(null)

      const templates = await templateService.getTemplates()

      expect(templates).toHaveLength(3) // Default templates
      expect(templates[0].category).toBe('residential')
      expect(templates[1].category).toBe('commercial')
      expect(templates[2].category).toBe('infrastructure')
    })

    it('should return stored templates when storage has data', async () => {
      const storedTemplates: PricingTemplate[] = [
        {
          id: 'test-1',
          name: 'Test Template',
          description: 'Test Description',
          category: 'residential',
          isStarred: false,
          createdAt: '2024-01-01',
          usageCount: 5,
          averageAccuracy: 85,
          estimatedDuration: 120,
          defaultPercentages: {
            administrative: 10,
            operational: 15,
            profit: 20,
          },
          costBreakdown: {
            materials: 40,
            labor: 30,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['test'],
        },
      ]

      mockSafeLocalStorage.getItem.mockReturnValue(storedTemplates)

      const templates = await templateService.getTemplates()

      expect(templates).toHaveLength(1)
      expect(templates[0].id).toBe('test-1')
      expect(templates[0].name).toBe('Test Template')
    })
  })

  describe('createTemplate', () => {
    it('should create a new template with generated ID and timestamp', async () => {
      mockSafeLocalStorage.getItem.mockReturnValue([])

      const templateData = {
        name: 'New Template',
        description: 'New Description',
        category: 'commercial' as TemplateCategory,
        isStarred: false,
        defaultPercentages: {
          administrative: 12,
          operational: 18,
          profit: 25,
        },
        costBreakdown: {
          materials: 45,
          labor: 25,
          equipment: 20,
          subcontractors: 10,
        },
        tags: ['new'],
        averageAccuracy: 0,
        estimatedDuration: 90,
      }

      const createdTemplate = await templateService.createTemplate(templateData)

      expect(createdTemplate.id).toBeDefined()
      expect(createdTemplate.name).toBe('New Template')
      expect(createdTemplate.createdAt).toBeDefined()
      expect(createdTemplate.usageCount).toBe(0)
      expect(mockSafeLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      const existingTemplates: PricingTemplate[] = [
        {
          id: 'test-1',
          name: 'Original Name',
          description: 'Original Description',
          category: 'residential',
          isStarred: false,
          createdAt: '2024-01-01',
          usageCount: 5,
          averageAccuracy: 85,
          estimatedDuration: 120,
          defaultPercentages: {
            administrative: 10,
            operational: 15,
            profit: 20,
          },
          costBreakdown: {
            materials: 40,
            labor: 30,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['original'],
        },
      ]

      mockSafeLocalStorage.getItem.mockReturnValue(existingTemplates)

      const updatedTemplate = {
        ...existingTemplates[0],
        name: 'Updated Name',
        description: 'Updated Description',
      }

      const result = await templateService.updateTemplate(updatedTemplate)

      expect(result.name).toBe('Updated Name')
      expect(result.description).toBe('Updated Description')
      expect(mockSafeLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('deleteTemplate', () => {
    it('should delete a template by ID', async () => {
      const existingTemplates: PricingTemplate[] = [
        {
          id: 'test-1',
          name: 'Template 1',
          description: 'Description 1',
          category: 'residential',
          isStarred: false,
          createdAt: '2024-01-01',
          usageCount: 5,
          averageAccuracy: 85,
          estimatedDuration: 120,
          defaultPercentages: {
            administrative: 10,
            operational: 15,
            profit: 20,
          },
          costBreakdown: {
            materials: 40,
            labor: 30,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['test'],
        },
        {
          id: 'test-2',
          name: 'Template 2',
          description: 'Description 2',
          category: 'commercial',
          isStarred: false,
          createdAt: '2024-01-02',
          usageCount: 3,
          averageAccuracy: 90,
          estimatedDuration: 100,
          defaultPercentages: {
            administrative: 12,
            operational: 18,
            profit: 25,
          },
          costBreakdown: {
            materials: 45,
            labor: 25,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['test'],
        },
      ]

      mockSafeLocalStorage.getItem.mockReturnValue(existingTemplates)

      await templateService.deleteTemplate('test-1')

      const setItemCall = mockSafeLocalStorage.setItem.mock.calls[0]
      const savedTemplates = setItemCall[1]
      
      expect(savedTemplates).toHaveLength(1)
      expect(savedTemplates[0].id).toBe('test-2')
    })
  })

  describe('searchTemplates', () => {
    it('should search templates by name and description', async () => {
      const templates: PricingTemplate[] = [
        {
          id: 'test-1',
          name: 'Residential Villa',
          description: 'Template for luxury villas',
          category: 'residential',
          isStarred: false,
          createdAt: '2024-01-01',
          usageCount: 5,
          averageAccuracy: 85,
          estimatedDuration: 120,
          defaultPercentages: {
            administrative: 10,
            operational: 15,
            profit: 20,
          },
          costBreakdown: {
            materials: 40,
            labor: 30,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['luxury', 'villa'],
        },
        {
          id: 'test-2',
          name: 'Commercial Office',
          description: 'Template for office buildings',
          category: 'commercial',
          isStarred: false,
          createdAt: '2024-01-02',
          usageCount: 3,
          averageAccuracy: 90,
          estimatedDuration: 100,
          defaultPercentages: {
            administrative: 12,
            operational: 18,
            profit: 25,
          },
          costBreakdown: {
            materials: 45,
            labor: 25,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['office'],
        },
      ]

      mockSafeLocalStorage.getItem.mockReturnValue(templates)

      const results = await templateService.searchTemplates('villa')

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Residential Villa')
    })

    it('should filter templates by category', async () => {
      const templates: PricingTemplate[] = [
        {
          id: 'test-1',
          name: 'Residential Villa',
          description: 'Template for luxury villas',
          category: 'residential',
          isStarred: false,
          createdAt: '2024-01-01',
          usageCount: 5,
          averageAccuracy: 85,
          estimatedDuration: 120,
          defaultPercentages: {
            administrative: 10,
            operational: 15,
            profit: 20,
          },
          costBreakdown: {
            materials: 40,
            labor: 30,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['luxury', 'villa'],
        },
        {
          id: 'test-2',
          name: 'Commercial Office',
          description: 'Template for office buildings',
          category: 'commercial',
          isStarred: false,
          createdAt: '2024-01-02',
          usageCount: 3,
          averageAccuracy: 90,
          estimatedDuration: 100,
          defaultPercentages: {
            administrative: 12,
            operational: 18,
            profit: 25,
          },
          costBreakdown: {
            materials: 45,
            labor: 25,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['office'],
        },
      ]

      mockSafeLocalStorage.getItem.mockReturnValue(templates)

      const results = await templateService.searchTemplates('', 'commercial')

      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('commercial')
    })
  })

  describe('markTemplateUsed', () => {
    it('should increment usage count and update last used date', async () => {
      const templates: PricingTemplate[] = [
        {
          id: 'test-1',
          name: 'Test Template',
          description: 'Test Description',
          category: 'residential',
          isStarred: false,
          createdAt: '2024-01-01',
          usageCount: 5,
          averageAccuracy: 85,
          estimatedDuration: 120,
          defaultPercentages: {
            administrative: 10,
            operational: 15,
            profit: 20,
          },
          costBreakdown: {
            materials: 40,
            labor: 30,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['test'],
        },
      ]

      mockSafeLocalStorage.getItem.mockReturnValue(templates)

      await templateService.markTemplateUsed('test-1')

      const setItemCall = mockSafeLocalStorage.setItem.mock.calls[0]
      const savedTemplates = setItemCall[1]
      
      expect(savedTemplates[0].usageCount).toBe(6)
      expect(savedTemplates[0].lastUsed).toBeDefined()
    })
  })

  describe('updateTemplateAccuracy', () => {
    it('should update template accuracy with weighted average', async () => {
      const templates: PricingTemplate[] = [
        {
          id: 'test-1',
          name: 'Test Template',
          description: 'Test Description',
          category: 'residential',
          isStarred: false,
          createdAt: '2024-01-01',
          usageCount: 5,
          averageAccuracy: 80,
          estimatedDuration: 120,
          defaultPercentages: {
            administrative: 10,
            operational: 15,
            profit: 20,
          },
          costBreakdown: {
            materials: 40,
            labor: 30,
            equipment: 20,
            subcontractors: 10,
          },
          tags: ['test'],
        },
      ]

      mockSafeLocalStorage.getItem.mockReturnValue(templates)

      await templateService.updateTemplateAccuracy('test-1', 90)

      const setItemCall = mockSafeLocalStorage.setItem.mock.calls[0]
      const savedTemplates = setItemCall[1]
      
      // Weighted average: (80 * 5 + 90) / 6 = 81.67 (but implementation may round differently)
      expect(savedTemplates[0].averageAccuracy).toBeCloseTo(82, 0)
    })
  })
})
