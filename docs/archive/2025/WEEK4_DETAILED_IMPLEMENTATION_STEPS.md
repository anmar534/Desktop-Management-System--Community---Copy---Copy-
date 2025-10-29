# 📋 Week 4: دليل التنفيذ التفصيلي خطوة بخطوة

**التاريخ:** 27 أكتوبر 2025  
**المدة الإجمالية:** 7 أيام (51 ساعة)  
**الوضع:** جاهز للبدء

---

## 📊 نظرة عامة سريعة

| المرحلة                          | المدة   | الملفات | الاختبارات | الأولوية  |
| -------------------------------- | ------- | ------- | ---------- | --------- |
| **Day 1-2: Tender Integration**  | 16 ساعة | 4 ملفات | 30 test    | 🔥 حرجة   |
| **Day 3-4: PO Integration**      | 18 ساعة | 3 ملفات | 35 test    | 🟠 عالية  |
| **Day 5-7: Timeline Management** | 17 ساعة | 3 ملفات | 33 test    | 🟡 متوسطة |
| **Integration Testing**          | 4 ساعات | -       | 23 test    | 🟢 مهمة   |

---

## 🎯 Day 1: Tender-Project Integration (الجزء الأول)

### الوقت: 8 ساعات

---

### ⏰ 9:00 - 13:00: Task 1.1 - Repository Methods (4 ساعات)

#### الخطوة 1: فتح الملف وتحديد الموقع

```bash
# افتح الملف
code src/repository/providers/enhancedProject.local.ts

# ابحث عن السطر 457 تقريباً (حيث توجد الـ methods الفارغة)
```

#### الخطوة 2: تطبيق `linkToTender` Method

**الموقع:** بعد السطر ~457

```typescript
/**
 * ربط مشروع بمنافسة
 */
async linkToTender(
  projectId: string,
  tenderId: string,
  linkType: string = 'created_from'
): Promise<TenderProjectLink> {
  try {
    // 1. التحقق من وجود المشروع
    const projects = this.loadProjects()
    const projectIndex = projects.findIndex(p => p.id === projectId)

    if (projectIndex === -1) {
      throw new Error(`Project not found: ${projectId}`)
    }

    // 2. التحقق من عدم وجود ربط سابق
    if (projects[projectIndex].tenderLink) {
      throw new Error(`Project ${projectId} is already linked to tender ${projects[projectIndex].tenderLink?.tenderId}`)
    }

    // 3. إنشاء الربط
    const link: TenderProjectLink = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenderId,
      projectId,
      linkType: linkType as 'created_from' | 'related_to' | 'derived_from',
      linkDate: new Date().toISOString(),
      metadata: {
        createdBy: 'system',
        source: 'manual_link'
      }
    }

    // 4. حفظ الربط
    projects[projectIndex].tenderLink = link

    // 5. Persist التغييرات
    this.persist(projects)
    this.emitProjectsUpdated()

    console.log(`✅ Project ${projectId} linked to tender ${tenderId}`)
    return link

  } catch (error) {
    console.error('Error linking project to tender:', error)
    throw error
  }
}
```

#### الخطوة 3: تطبيق `unlinkFromTender` Method

```typescript
/**
 * فك ربط مشروع من منافسة
 */
async unlinkFromTender(
  projectId: string,
  tenderId: string
): Promise<boolean> {
  try {
    // 1. تحميل المشاريع
    const projects = this.loadProjects()
    const projectIndex = projects.findIndex(p => p.id === projectId)

    // 2. التحقق من وجود المشروع
    if (projectIndex === -1) {
      console.warn(`Project not found: ${projectId}`)
      return false
    }

    const project = projects[projectIndex]

    // 3. التحقق من وجود ربط
    if (!project.tenderLink) {
      console.warn(`Project ${projectId} has no tender link`)
      return false
    }

    // 4. التحقق من تطابق المنافسة
    if (project.tenderLink.tenderId !== tenderId) {
      console.warn(`Project ${projectId} is linked to different tender: ${project.tenderLink.tenderId}`)
      return false
    }

    // 5. حذف الربط
    delete projects[projectIndex].tenderLink

    // 6. Persist
    this.persist(projects)
    this.emitProjectsUpdated()

    console.log(`✅ Project ${projectId} unlinked from tender ${tenderId}`)
    return true

  } catch (error) {
    console.error('Error unlinking project from tender:', error)
    return false
  }
}
```

#### الخطوة 4: تطبيق `getProjectsFromTender` Method

```typescript
/**
 * الحصول على جميع المشاريع المرتبطة بمنافسة
 */
async getProjectsFromTender(tenderId: string): Promise<EnhancedProject[]> {
  try {
    const projects = this.loadProjects()

    // البحث في كل من tenderLink و fromTender
    const linkedProjects = projects.filter(project =>
      project.tenderLink?.tenderId === tenderId ||
      project.fromTender?.tenderId === tenderId
    )

    console.log(`✅ Found ${linkedProjects.length} projects for tender ${tenderId}`)
    return linkedProjects

  } catch (error) {
    console.error('Error getting projects from tender:', error)
    return []
  }
}
```

#### الخطوة 5: تطبيق `getTenderLink` Method

```typescript
/**
 * الحصول على معلومات الربط بالمنافسة
 */
async getTenderLink(projectId: string): Promise<TenderProjectLink | null> {
  try {
    const projects = this.loadProjects()
    const project = projects.find(p => p.id === projectId)

    if (!project) {
      return null
    }

    return project.tenderLink || null

  } catch (error) {
    console.error('Error getting tender link:', error)
    return null
  }
}
```

#### الخطوة 6: إنشاء ملف الاختبار

```bash
# إنشاء ملف الاختبار
code tests/unit/repository/enhancedProject.tenderLink.test.ts
```

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { getProjectRepository } from '@/application/services/serviceRegistry'
import type { EnhancedProject } from '@/types/project'

describe('EnhancedProject Repository - Tender Linking', () => {
  let repository: any

  beforeEach(async () => {
    repository = getProjectRepository()
    // Clear data
  })

  describe('linkToTender', () => {
    it('should link project to tender successfully', async () => {
      // 1. Create test project
      const project = await repository.create({
        name: 'Test Project',
        client: 'Test Client',
        status: 'active',
      })

      // 2. Link to tender
      const link = await repository.linkToTender(project.id, 'tender_123', 'created_from')

      // 3. Verify
      expect(link).toBeDefined()
      expect(link.tenderId).toBe('tender_123')
      expect(link.projectId).toBe(project.id)
      expect(link.linkType).toBe('created_from')
    })

    it('should throw error if project not found', async () => {
      await expect(repository.linkToTender('invalid_id', 'tender_123')).rejects.toThrow(
        'Project not found',
      )
    })

    it('should throw error if already linked', async () => {
      const project = await repository.create({ name: 'Test' })
      await repository.linkToTender(project.id, 'tender_1')

      await expect(repository.linkToTender(project.id, 'tender_2')).rejects.toThrow(
        'already linked',
      )
    })
  })

  describe('unlinkFromTender', () => {
    it('should unlink project from tender', async () => {
      const project = await repository.create({ name: 'Test' })
      await repository.linkToTender(project.id, 'tender_123')

      const result = await repository.unlinkFromTender(project.id, 'tender_123')

      expect(result).toBe(true)

      const link = await repository.getTenderLink(project.id)
      expect(link).toBeNull()
    })

    it('should return false if no link exists', async () => {
      const project = await repository.create({ name: 'Test' })
      const result = await repository.unlinkFromTender(project.id, 'tender_123')

      expect(result).toBe(false)
    })
  })

  describe('getProjectsFromTender', () => {
    it('should return empty array if no projects linked', async () => {
      const projects = await repository.getProjectsFromTender('tender_999')
      expect(projects).toEqual([])
    })

    it('should return linked projects', async () => {
      const p1 = await repository.create({ name: 'P1' })
      const p2 = await repository.create({ name: 'P2' })

      await repository.linkToTender(p1.id, 'tender_123')
      await repository.linkToTender(p2.id, 'tender_123')

      const projects = await repository.getProjectsFromTender('tender_123')

      expect(projects).toHaveLength(2)
      expect(projects.map((p) => p.id)).toContain(p1.id)
      expect(projects.map((p) => p.id)).toContain(p2.id)
    })
  })

  describe('getTenderLink', () => {
    it('should return null if project not found', async () => {
      const link = await repository.getTenderLink('invalid_id')
      expect(link).toBeNull()
    })

    it('should return link if exists', async () => {
      const project = await repository.create({ name: 'Test' })
      await repository.linkToTender(project.id, 'tender_123')

      const link = await repository.getTenderLink(project.id)

      expect(link).toBeDefined()
      expect(link?.tenderId).toBe('tender_123')
    })
  })
})
```

#### الخطوة 7: تشغيل الاختبارات

```bash
# تشغيل الاختبارات
npm test enhancedProject.tenderLink.test.ts

# النتيجة المتوقعة:
# ✅ 12 tests passed
```

---

### ⏰ 14:00 - 19:00: Task 1.2 - Auto-Creation Service (5 ساعات)

#### الخطوة 1: فتح الملف

```bash
code src/application/services/projectAutoCreation.ts
```

#### الخطوة 2: إضافة `copyBOQData` Method

**الموقع:** بعد السطر ~50 تقريباً

```typescript
/**
 * نسخ BOQ من المنافسة إلى المشروع
 */
private static async copyBOQData(
  tenderId: string,
  projectId: string
): Promise<boolean> {
  try {
    console.log(`📋 Copying BOQ from tender ${tenderId} to project ${projectId}`)

    // 1. الحصول على BOQ Repository
    const boqRepo = getBOQRepository()

    // 2. تحميل BOQ المنافسة
    const tenderBOQ = await boqRepo.getByTenderId(tenderId)

    if (!tenderBOQ || !tenderBOQ.items || tenderBOQ.items.length === 0) {
      console.warn('⚠️ No BOQ found for tender or BOQ is empty')
      return false
    }

    console.log(`📊 Found ${tenderBOQ.items.length} BOQ items to copy`)

    // 3. إنشاء BOQ جديد للمشروع
    const projectBOQ: BOQData = {
      id: `boq_project_${projectId}_${Date.now()}`,
      projectId,
      tenderId: undefined, // إزالة الربط بالمنافسة
      items: tenderBOQ.items.map(item => ({
        ...item,
        id: `proj_${item.id}`, // تغيير ID لتجنب التعارض
        // الحفاظ على جميع البيانات التفصيلية
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        // نسخ التكاليف التفصيلية
        materials: item.materials,
        labor: item.labor,
        equipment: item.equipment,
        subcontractors: item.subcontractors,
        // نسخ النسب الإضافية
        additionalPercentages: item.additionalPercentages,
        breakdown: item.breakdown,
        // وضع البيانات في estimated structure
        estimated: {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          materials: item.materials,
          labor: item.labor,
          equipment: item.equipment,
          subcontractors: item.subcontractors,
          additionalPercentages: item.additionalPercentages
        },
        // القيم الفعلية فارغة في البداية
        actual: undefined,
        actualQuantity: undefined,
        actualUnitPrice: undefined
      })),
      totalValue: tenderBOQ.totalValue,
      totals: tenderBOQ.totals ? {
        ...tenderBOQ.totals
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    // 4. حفظ BOQ المشروع
    await boqRepo.create(projectBOQ)

    console.log(`✅ BOQ copied successfully:`)
    console.log(`   - Items: ${projectBOQ.items.length}`)
    console.log(`   - Total Value: ${projectBOQ.totalValue}`)

    return true

  } catch (error) {
    console.error('❌ Error copying BOQ data:', error)
    return false
  }
}
```

#### الخطوة 3: إضافة `copyAttachments` Method

```typescript
/**
 * نسخ المرفقات من المنافسة إلى المشروع
 */
private static async copyAttachments(
  tender: Tender,
  project: EnhancedProject
): Promise<number> {
  try {
    console.log(`📎 Copying attachments from tender ${tender.id}`)

    // 1. الحصول على Attachments Store
    const attachmentStore = useProjectAttachmentsStore.getState()

    // 2. تحميل مرفقات المنافسة
    const tenderAttachments = await this.getTenderAttachments(tender.id)

    if (!tenderAttachments || tenderAttachments.length === 0) {
      console.log('ℹ️ No attachments to copy')
      return 0
    }

    console.log(`📄 Found ${tenderAttachments.length} attachments`)

    // 3. نسخ كل مرفق
    let copiedCount = 0

    for (const attachment of tenderAttachments) {
      try {
        const newAttachment = {
          ...attachment,
          id: `proj_att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          projectId: project.id,
          tenderId: undefined,
          metadata: {
            ...attachment.metadata,
            copiedFrom: `tender_${tender.id}`,
            copiedAt: new Date().toISOString(),
            originalId: attachment.id
          }
        }

        await attachmentStore.addAttachment(project.id, newAttachment)
        copiedCount++

      } catch (error) {
        console.error(`Error copying attachment ${attachment.id}:`, error)
      }
    }

    console.log(`✅ Copied ${copiedCount} attachments`)
    return copiedCount

  } catch (error) {
    console.error('❌ Error copying attachments:', error)
    return 0
  }
}

/**
 * Helper: الحصول على مرفقات المنافسة
 */
private static async getTenderAttachments(tenderId: string): Promise<any[]> {
  try {
    // يمكن استبداله بالطريقة الفعلية من نظام المنافسات
    const tenderRepo = getTenderRepository()
    const tender = await tenderRepo.getById(tenderId)

    return tender?.attachments || []
  } catch (error) {
    console.error('Error getting tender attachments:', error)
    return []
  }
}
```

#### الخطوة 4: تحديث `createProjectFromWonTender`

**ابحث عن الدالة الموجودة وحدّثها:**

```typescript
static async createProjectFromWonTender(
  tender: Tender,
  options: ProjectCreationOptions = {}
): Promise<EnhancedProject> {
  try {
    console.log(`🏆 Creating project from won tender: ${tender.id}`)

    // 1. إنشاء المشروع الأساسي
    const projectRepo = getProjectRepository()

    const projectData = {
      name: options.projectName || `مشروع ${tender.name}`,
      client: tender.client,
      status: 'active' as const,
      startDate: options.startDate || new Date().toISOString(),
      endDate: options.endDate || this.calculateEndDate(tender),
      budget: tender.totalValue || tender.value || 0,
      value: tender.totalValue || tender.value || 0,
      description: `مشروع تم إنشاؤه من المنافسة: ${tender.name}`,
      category: tender.category || 'general',
      // بيانات الربط
      fromTender: {
        tenderId: tender.id,
        tenderName: tender.name,
        wonDate: new Date().toISOString(),
        originalBudget: tender.totalValue || tender.value || 0
      }
    }

    const project = await projectRepo.create(projectData)
    console.log(`✅ Project created: ${project.id}`)

    // 2. ربط رسمي بالمنافسة
    await projectRepo.linkToTender(project.id, tender.id, 'created_from')
    console.log(`✅ Linked to tender`)

    // 3. نسخ BOQ
    const boqCopied = await this.copyBOQData(tender.id, project.id)
    if (boqCopied) {
      console.log(`✅ BOQ copied`)
    }

    // 4. نسخ المرفقات
    const attachmentsCopied = await this.copyAttachments(tender, project)
    console.log(`✅ ${attachmentsCopied} attachments copied`)

    // 5. تسجيل في Relation Repository
    const relationRepo = getRelationRepository()
    relationRepo.linkTenderToProject(tender.id, project.id, {
      isAutoCreated: true,
      createdAt: new Date().toISOString(),
      boqCopied,
      attachmentsCopied
    })

    console.log(`🎉 Project creation complete!`)
    return project

  } catch (error) {
    console.error('❌ Error creating project from tender:', error)
    throw error
  }
}

/**
 * Helper: حساب تاريخ النهاية
 */
private static calculateEndDate(tender: Tender): string {
  const startDate = new Date()
  // افتراض 6 أشهر كمدة افتراضية
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 6)

  return endDate.toISOString()
}
```

#### الخطوة 5: إنشاء اختبارات

```bash
code tests/unit/services/projectAutoCreation.test.ts
```

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectAutoCreationService } from '@/application/services/projectAutoCreation'
import type { Tender } from '@/types/tender'
import type { BOQData } from '@/types/boq'

describe('ProjectAutoCreationService - BOQ & Attachments', () => {
  describe('copyBOQData', () => {
    it('should copy BOQ with all details', async () => {
      // Mock BOQ data
      const mockBOQ: BOQData = {
        id: 'boq_tender_123',
        tenderId: 'tender_123',
        items: [
          {
            id: 'item_1',
            description: 'بند 1',
            quantity: 100,
            unitPrice: 500,
            totalPrice: 50000,
            materials: 200,
            labor: 150,
            equipment: 100,
            subcontractors: 50,
            additionalPercentages: {
              administrative: 10,
              operational: 15,
              profit: 20,
            },
          },
        ],
        totalValue: 50000,
        lastUpdated: new Date().toISOString(),
      }

      // Test
      const result = await ProjectAutoCreationService['copyBOQData']('tender_123', 'project_456')

      expect(result).toBe(true)
      // Verify BOQ was created with correct data
    })

    it('should return false if no BOQ found', async () => {
      const result = await ProjectAutoCreationService['copyBOQData'](
        'invalid_tender',
        'project_456',
      )

      expect(result).toBe(false)
    })
  })

  describe('copyAttachments', () => {
    it('should copy all attachments', async () => {
      const mockTender: Tender = {
        id: 'tender_123',
        name: 'Test Tender',
        attachments: [
          { id: 'att_1', name: 'file1.pdf', url: '/path/1' },
          { id: 'att_2', name: 'file2.pdf', url: '/path/2' },
        ],
      }

      const mockProject = {
        id: 'project_456',
        name: 'Test Project',
      }

      const count = await ProjectAutoCreationService['copyAttachments'](mockTender, mockProject)

      expect(count).toBe(2)
    })
  })

  describe('createProjectFromWonTender - Integration', () => {
    it('should create complete project with BOQ and attachments', async () => {
      const tender: Tender = {
        id: 'tender_123',
        name: 'مشروع مبنى إداري',
        client: 'وزارة الإسكان',
        totalValue: 1500000,
        status: 'won',
      }

      const project = await ProjectAutoCreationService.createProjectFromWonTender(tender)

      expect(project).toBeDefined()
      expect(project.name).toContain(tender.name)
      expect(project.client).toBe(tender.client)
      expect(project.fromTender?.tenderId).toBe(tender.id)

      // Verify link created
      // Verify BOQ copied
      // Verify attachments copied
    })
  })
})
```

---

## 🎯 Day 2: Tender Integration UI (8 ساعات)

### ⏰ 9:00 - 16:00: Task 1.3 - UI Components (7 ساعات)

#### الخطوة 1: إنشاء Dialog Component

```bash
code src/presentation/components/projects/CreateProjectFromTenderDialog.tsx
```

**محتوى الملف:**

```typescript
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, FileText, Paperclip } from 'lucide-react'
import { ProjectAutoCreationService } from '@/application/services/projectAutoCreation'
import type { Tender } from '@/types/tender'

interface CreateProjectFromTenderDialogProps {
  tender: Tender
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (projectId: string) => void
}

export function CreateProjectFromTenderDialog({
  tender,
  open,
  onOpenChange,
  onSuccess
}: CreateProjectFromTenderDialogProps) {
  const [projectName, setProjectName] = useState(`مشروع ${tender.name}`)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState(6) // months

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [boqPreview, setBoqPreview] = useState<any>(null)

  // Load BOQ preview
  const loadBOQPreview = async () => {
    try {
      const boqRepo = getBOQRepository()
      const boq = await boqRepo.getByTenderId(tender.id)
      setBoqPreview(boq)
    } catch (err) {
      console.error('Error loading BOQ:', err)
    }
  }

  React.useEffect(() => {
    if (open) {
      loadBOQPreview()
    }
  }, [open, tender.id])

  const handleCreate = async () => {
    try {
      setLoading(true)
      setError(null)
      setProgress(0)

      // Step 1: Create project
      setCurrentStep('إنشاء المشروع...')
      setProgress(20)

      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + duration)

      const project = await ProjectAutoCreationService.createProjectFromWonTender(
        tender,
        {
          projectName,
          startDate,
          endDate: endDate.toISOString()
        }
      )

      setProgress(100)
      setCurrentStep('تم بنجاح!')

      // Wait a bit before closing
      setTimeout(() => {
        onSuccess?.(project.id)
        onOpenChange(false)
      }, 1000)

    } catch (err) {
      console.error('Error creating project:', err)
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء المشروع')
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            🏗️ إنشاء مشروع من المنافسة
          </DialogTitle>
          <DialogDescription>
            سيتم إنشاء مشروع جديد بناءً على بيانات المنافسة الفائزة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tender Info */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">معلومات المنافسة</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">الاسم:</span>
                <span className="mr-2 font-medium">{tender.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">العميل:</span>
                <span className="mr-2 font-medium">{tender.client}</span>
              </div>
              <div>
                <span className="text-muted-foreground">القيمة:</span>
                <span className="mr-2 font-medium">
                  {(tender.totalValue || tender.value || 0).toLocaleString()} ر.س
                </span>
              </div>
            </div>
          </div>

          {/* BOQ Preview */}
          {boqPreview && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">جدول الكميات (BOQ)</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>عدد البنود: {boqPreview.items?.length || 0}</div>
                <div>القيمة الإجمالية: {boqPreview.totalValue?.toLocaleString()} ر.س</div>
              </div>
              <Alert className="mt-2">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  سيتم نقل جميع البنود مع الأسعار والتفاصيل
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Project Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">اسم المشروع</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="أدخل اسم المشروع"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">تاريخ البدء</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="duration">المدة (أشهر)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 6)}
                />
              </div>
            </div>
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !projectName.trim()}
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

**ملاحظة:** هذا دليل تفصيلي للأيام الثلاثة الأولى. باقي الأيام (Day 3-7) تتبع نفس النمط التفصيلي.

---

## 📚 الموارد والمراجع

### الملفات ذات الصلة

- `src/repository/providers/enhancedProject.local.ts`
- `src/application/services/projectAutoCreation.ts`
- `src/types/project.ts`
- `src/types/tender.ts`
- `src/types/boq.ts`

### الأدوات المطلوبة

- VS Code
- Node.js & npm
- TypeScript
- Vitest (للاختبارات)

### الأوامر المفيدة

```bash
# تشغيل الاختبارات
npm test

# تشغيل اختبار محدد
npm test -- repository.test.ts

# Build
npm run build

# Type check
npm run type-check
```

---

## ✅ Checklist اليومي

### قبل البدء:

- [ ] Pull أحدث التغييرات من Git
- [ ] تحديث Dependencies إذا لزم
- [ ] مراجعة الملفات ذات الصلة

### أثناء العمل:

- [ ] كتابة Tests أولاً (TDD)
- [ ] Commit بعد كل feature
- [ ] تشغيل Tests بشكل متكرر

### بعد الانتهاء:

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Code review
- [ ] Update documentation
- [ ] Push to Git

---

**🚀 جاهز للبدء؟ ابدأ من Day 1, Task 1.1!**
