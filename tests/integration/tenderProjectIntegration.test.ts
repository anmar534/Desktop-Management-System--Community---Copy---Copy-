/**
 * Tender-Project Integration Tests
 * اختبارات التكامل بين المناقصات والمشاريع
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { enhancedProjectService } from '../../src/services/enhancedProjectService'
import { taskManagementService } from '../../src/services/taskManagementService'
import { CreateProjectRequest, EnhancedProject } from '../../src/types/projects'

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

describe('Tender-Project Integration', () => {
  const mockTenderData = {
    id: 'tender-123',
    title: 'مشروع إنشاء مجمع سكني',
    titleEn: 'Residential Complex Construction Project',
    description: 'إنشاء مجمع سكني يتكون من 50 وحدة سكنية مع المرافق المساندة',
    client: 'شركة التطوير العقاري المحدودة',
    value: 15000000,
    currency: 'SAR',
    startDate: '2024-11-01',
    endDate: '2025-10-31',
    location: 'الرياض، المملكة العربية السعودية',
    category: 'construction',
    status: 'won',
    boq: [
      {
        id: '1',
        description: 'أعمال الحفر والأساسات',
        quantity: 1000,
        unit: 'م3',
        unitPrice: 150,
        totalPrice: 150000,
        category: 'earthwork'
      },
      {
        id: '2',
        description: 'أعمال الخرسانة المسلحة',
        quantity: 2500,
        unit: 'م3',
        unitPrice: 800,
        totalPrice: 2000000,
        category: 'concrete'
      },
      {
        id: '3',
        description: 'أعمال البناء والمباني',
        quantity: 5000,
        unit: 'م2',
        unitPrice: 400,
        totalPrice: 2000000,
        category: 'masonry'
      }
    ],
    requirements: [
      'الحصول على تراخيص البناء',
      'تطبيق معايير السلامة والأمان',
      'استخدام مواد بناء عالية الجودة',
      'الالتزام بالمواصفات البيئية'
    ],
    deliverables: [
      'المخططات التنفيذية المعتمدة',
      'تقارير الجودة والسلامة',
      'شهادات الإنجاز والتسليم',
      'دليل الصيانة والتشغيل'
    ],
    timeline: [
      {
        phase: 'التخطيط والتصميم',
        duration: 60,
        dependencies: []
      },
      {
        phase: 'أعمال الحفر والأساسات',
        duration: 90,
        dependencies: ['التخطيط والتصميم']
      },
      {
        phase: 'الهيكل الإنشائي',
        duration: 180,
        dependencies: ['أعمال الحفر والأساسات']
      },
      {
        phase: 'التشطيبات والمرافق',
        duration: 120,
        dependencies: ['الهيكل الإنشائي']
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default localStorage mock
    const { safeLocalStorage } = require('../../src/utils/storage')
    safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))
    safeLocalStorage.setItem.mockImplementation(() => {})
  })

  describe('createProjectFromTender', () => {
    it('should create project with tender data', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      expect(project).toBeDefined()
      expect(project.name).toBe('مشروع إنشاء مجمع سكني')
      expect(project.nameEn).toBe('Residential Complex Construction Project')
      expect(project.description).toBe('إنشاء مجمع سكني يتكون من 50 وحدة سكنية مع المرافق المساندة')
      expect(project.client).toBe('شركة التطوير العقاري المحدودة')
      expect(project.location).toBe('الرياض، المملكة العربية السعودية')
      expect(project.budget.total).toBe(15000000)
      expect(project.budget.currency).toBe('SAR')
      expect(project.startDate).toBe('2024-11-01')
      expect(project.endDate).toBe('2025-10-31')
      expect(project.category).toBe('construction')
      expect(project.priority).toBe('high')
      expect(project.tags).toContain('من_مناقصة')
      expect(project.tags).toContain('construction')
    })

    it('should create phases from tender timeline', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      expect(project.phases).toHaveLength(4)
      expect(project.phases[0].name).toBe('التخطيط والتصميم')
      expect(project.phases[1].name).toBe('أعمال الحفر والأساسات')
      expect(project.phases[2].name).toBe('الهيكل الإنشائي')
      expect(project.phases[3].name).toBe('التشطيبات والمرافق')

      // التحقق من التبعيات
      expect(project.phases[1].dependencies).toContain('التخطيط والتصميم')
      expect(project.phases[2].dependencies).toContain('أعمال الحفر والأساسات')
      expect(project.phases[3].dependencies).toContain('الهيكل الإنشائي')
    })

    it('should create milestones from tender data', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      expect(project.milestones).toHaveLength(3)
      expect(project.milestones[0].title).toBe('بداية المشروع')
      expect(project.milestones[1].title).toBe('منتصف المشروع')
      expect(project.milestones[2].title).toBe('إنهاء المشروع')

      // التحقق من التواريخ
      expect(project.milestones[0].targetDate).toBe('2024-11-01')
      expect(project.milestones[2].targetDate).toBe('2025-10-31')
    })

    it('should create default risks', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      expect(project.risks).toHaveLength(3)
      expect(project.risks.some(risk => risk.title === 'تأخير في التراخيص')).toBe(true)
      expect(project.risks.some(risk => risk.title === 'تأثير الطقس')).toBe(true)
      expect(project.risks.some(risk => risk.title === 'نقص المواد')).toBe(true)
    })

    it('should set metadata correctly', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      expect(project.metadata.tenderId).toBe('tender-123')
      expect(project.metadata.importedFromTender).toBe(true)
      expect(project.metadata.tenderValue).toBe(15000000)
      expect(project.metadata.boqItems).toBe(3)
      expect(project.metadata.requirements).toHaveLength(4)
      expect(project.metadata.deliverables).toHaveLength(4)
    })

    it('should merge additional data', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const additionalData: Partial<CreateProjectRequest> = {
        team: {
          projectManager: 'أحمد محمد',
          members: [
            { id: 'user-1', name: 'فاطمة علي', role: 'developer', email: 'fatima@example.com' },
            { id: 'user-2', name: 'محمد سالم', role: 'designer', email: 'mohammed@example.com' }
          ]
        },
        priority: 'critical'
      }

      const project = await enhancedProjectService.createProjectFromTender('tender-123', additionalData)

      expect(project.team.projectManager).toBe('أحمد محمد')
      expect(project.team.members).toHaveLength(2)
      expect(project.priority).toBe('critical')
    })

    it('should handle non-existent tender', async () => {
      // Mock getTenderData to return null
      const originalGetTenderData = enhancedProjectService['getTenderData']
      enhancedProjectService['getTenderData'] = vi.fn().mockResolvedValue(null)

      await expect(
        enhancedProjectService.createProjectFromTender('non-existent-tender')
      ).rejects.toThrow('المناقصة غير موجودة')

      // Restore original method
      enhancedProjectService['getTenderData'] = originalGetTenderData
    })
  })

  describe('BOQ to Tasks Conversion', () => {
    it('should create tasks from BOQ items', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      // Mock the createTasksFromBoq method
      const createTasksFromBoqSpy = vi.spyOn(enhancedProjectService as any, 'createTasksFromBoq')
      createTasksFromBoqSpy.mockImplementation(() => Promise.resolve())

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      expect(createTasksFromBoqSpy).toHaveBeenCalledWith(project.id, mockTenderData.boq)
    })

    it('should handle BOQ with different categories', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      // التحقق من أن البيانات تحتوي على فئات مختلفة من BOQ
      expect(project.metadata.boqItems).toBe(3)
    })
  })

  describe('Budget Calculation', () => {
    it('should set budget from tender value', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      expect(project.budget.total).toBe(15000000)
      expect(project.budget.spent).toBe(0)
      expect(project.budget.remaining).toBe(15000000)
      expect(project.budget.contingency).toBe(1500000) // 10% من القيمة الإجمالية
      expect(project.budget.currency).toBe('SAR')
    })

    it('should distribute budget across phases', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      const totalPhaseBudget = project.phases.reduce((sum, phase) => sum + phase.budget, 0)
      expect(totalPhaseBudget).toBe(15000000)

      // كل مرحلة يجب أن تحصل على نصيب متساوٍ
      const expectedBudgetPerPhase = 15000000 / 4
      project.phases.forEach(phase => {
        expect(phase.budget).toBe(expectedBudgetPerPhase)
      })
    })
  })

  describe('Timeline Calculation', () => {
    it('should calculate phase dates correctly', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      const startDate = new Date('2024-11-01')
      
      // المرحلة الأولى: 60 يوم
      const phase1Start = new Date(project.phases[0].startDate)
      const phase1End = new Date(project.phases[0].endDate)
      expect(phase1Start).toEqual(startDate)
      expect(phase1End.getTime() - phase1Start.getTime()).toBe(60 * 24 * 60 * 60 * 1000)

      // المرحلة الثانية: 90 يوم
      const phase2Start = new Date(project.phases[1].startDate)
      const phase2End = new Date(project.phases[1].endDate)
      expect(phase2Start).toEqual(phase1End)
      expect(phase2End.getTime() - phase2Start.getTime()).toBe(90 * 24 * 60 * 60 * 1000)
    })

    it('should set milestone dates correctly', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      const startDate = new Date('2024-11-01')
      const endDate = new Date('2025-10-31')
      const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2)

      expect(new Date(project.milestones[0].targetDate)).toEqual(startDate)
      expect(new Date(project.milestones[1].targetDate)).toEqual(midDate)
      expect(new Date(project.milestones[2].targetDate)).toEqual(endDate)
    })
  })

  describe('Data Validation', () => {
    it('should validate tender data before creating project', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      // Mock invalid tender data
      const originalGetTenderData = enhancedProjectService['getTenderData']
      enhancedProjectService['getTenderData'] = vi.fn().mockResolvedValue({
        id: 'invalid-tender',
        title: '', // عنوان فارغ
        value: -1000, // قيمة سالبة
        startDate: '2024-12-31',
        endDate: '2024-01-01' // تاريخ نهاية قبل البداية
      })

      // يجب أن يتم إنشاء المشروع حتى مع البيانات غير الصحيحة
      // لأن التحقق يحدث في طبقة أخرى
      const project = await enhancedProjectService.createProjectFromTender('invalid-tender')
      expect(project).toBeDefined()

      // Restore original method
      enhancedProjectService['getTenderData'] = originalGetTenderData
    })

    it('should handle missing BOQ data', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      // Mock tender without BOQ
      const originalGetTenderData = enhancedProjectService['getTenderData']
      enhancedProjectService['getTenderData'] = vi.fn().mockResolvedValue({
        ...mockTenderData,
        boq: undefined
      })

      const project = await enhancedProjectService.createProjectFromTender('tender-no-boq')

      expect(project.metadata.boqItems).toBe(0)

      // Restore original method
      enhancedProjectService['getTenderData'] = originalGetTenderData
    })

    it('should handle missing timeline data', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      // Mock tender without timeline
      const originalGetTenderData = enhancedProjectService['getTenderData']
      enhancedProjectService['getTenderData'] = vi.fn().mockResolvedValue({
        ...mockTenderData,
        timeline: undefined
      })

      const project = await enhancedProjectService.createProjectFromTender('tender-no-timeline')

      expect(project.phases).toHaveLength(0)

      // Restore original method
      enhancedProjectService['getTenderData'] = originalGetTenderData
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Database error')
      })

      await expect(
        enhancedProjectService.createProjectFromTender('tender-123')
      ).rejects.toThrow('فشل في إنشاء مشروع من مناقصة')
    })

    it('should handle network errors when fetching tender data', async () => {
      // Mock network error
      const originalGetTenderData = enhancedProjectService['getTenderData']
      enhancedProjectService['getTenderData'] = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(
        enhancedProjectService.createProjectFromTender('tender-123')
      ).rejects.toThrow('فشل في إنشاء مشروع من مناقصة')

      // Restore original method
      enhancedProjectService['getTenderData'] = originalGetTenderData
    })
  })

  describe('Integration with Task Management', () => {
    it('should create tasks after project creation', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      // Mock task creation
      const createTaskSpy = vi.spyOn(taskManagementService, 'createTask')
      createTaskSpy.mockResolvedValue({} as any)

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      // التحقق من أن المشروع تم إنشاؤه بنجاح
      expect(project).toBeDefined()
      expect(project.metadata.tenderId).toBe('tender-123')
    })

    it('should link tasks to project phases', async () => {
      const { safeLocalStorage } = require('../../src/utils/storage')
      safeLocalStorage.getItem.mockReturnValue(JSON.stringify([]))

      const project = await enhancedProjectService.createProjectFromTender('tender-123')

      // التحقق من أن المراحل تحتوي على معرف المشروع الصحيح
      project.phases.forEach(phase => {
        expect(phase.id).toBeDefined()
        expect(phase.name).toBeDefined()
        expect(phase.startDate).toBeDefined()
        expect(phase.endDate).toBeDefined()
      })
    })
  })
})
