# 🔗 Week 4: Advanced Integration - خطة تفصيلية

**تاريخ البدء:** 27 أكتوبر 2025  
**المدة المتوقعة:** 5-7 أيام  
**الحالة:** 📋 جاهز للتنفيذ

---

## 📊 التحليل الأولي

### ✅ **ما هو موجود حالياً:**

#### 1. التكامل مع نظام المنافسات

```typescript
// ✅ موجود في الكود:
- projectAutoCreation.ts: خدمة إنشاء المشاريع من المنافسات الفائزة
- TenderProjectLink: interface للربط بين المنافسة والمشروع
- ProjectFromTender: interface لتتبع البيانات المنقولة
- EnhancedProjectDetails: يعرض المنافسة المرتبطة
- relationRepository: يدير العلاقات بين Tender ↔ Project

// ⚠️ المشاكل الحالية:
- createProjectFromWonTender موجود لكن غير مستخدم بشكل كامل
- linkToTender, unlinkFromTender, getProjectsFromTender: "Method not implemented"
- لا يوجد UI لإنشاء مشروع تلقائي عند الفوز بمنافسة
- نقل BOQ غير مكتمل
```

#### 2. التكامل مع نظام المشتريات

```typescript
// ✅ موجود في الكود:
- PurchaseOrder interface
- purchaseOrderService
- EnhancedProjectDetails: يعرض Purchase Orders المرتبطة
- getPurchaseOrderStats: إحصائيات المشتريات

// ⚠️ المشاكل الحالية:
- لا يوجد ربط تلقائي: Project ← PO
- لا يتم تحديث التكاليف الفعلية تلقائياً من POs
- لا يوجد تتبع للفواتير والمدفوعات
```

#### 3. Timeline Management

```typescript
// ✅ موجود في الكود:
- ProjectPhase interface
- ProjectMilestone interface
- useProjectTimeline hook

// ⚠️ المشاكل الحالية:
- لا يوجد UI لإدارة المراحل
- لا يوجد نظام تنبيهات للتأخير
- لا يوجد تتبع للتقدم الفعلي مقابل المخطط
```

---

## 🎯 الأهداف الرئيسية لـ Week 4

### **Day 1-2: تحسين التكامل مع نظام المنافسات**

1. ✅ إكمال تطبيق Tender-Project linking methods
2. ✅ إنشاء UI لإنشاء مشروع تلقائي من منافسة فائزة
3. ✅ نقل BOQ المُسعر من Tender إلى Project
4. ✅ تتبع العلاقة بين Tender ↔ Project في Dashboard

### **Day 3-4: تحسين التكامل مع نظام المشتريات**

1. ✅ ربط تلقائي: Purchase Orders → Project Costs
2. ✅ تحديث التكاليف الفعلية من POs
3. ✅ تتبع الفواتير والمدفوعات
4. ✅ تقارير المشتريات حسب المشروع

### **Day 5-7: Timeline Management & Notifications**

1. ✅ إنشاء UI لإدارة المراحل والمعالم
2. ✅ نظام تنبيهات للتأخير
3. ✅ مخطط جانت للجدول الزمني
4. ✅ تقارير التقدم

---

## 📋 الخطة التفصيلية

---

## 🔗 Day 1-2: Tender-Project Integration

### **المرحلة 1A: إكمال Repository Methods (4 ساعات)**

#### **Task 1.1: تطبيق Tender Linking Methods**

**الملف:** `src/repository/providers/enhancedProject.local.ts`

```typescript
// ✅ تطبيق الـ Methods المفقودة:

async linkToTender(
  projectId: string,
  tenderId: string,
  linkType: string
): Promise<TenderProjectLink> {
  const projects = this.loadProjects()
  const project = projects.find(p => p.id === projectId)

  if (!project) {
    throw new Error(`Project ${projectId} not found`)
  }

  const link: TenderProjectLink = {
    id: generateId(),
    tenderId,
    projectId,
    linkType: linkType as 'created_from' | 'related_to' | 'derived_from',
    linkDate: new Date().toISOString(),
    metadata: {}
  }

  project.tenderLink = link
  this.persist(projects)
  this.emitProjectsUpdated()

  return link
}

async unlinkFromTender(
  projectId: string,
  tenderId: string
): Promise<boolean> {
  const projects = this.loadProjects()
  const project = projects.find(p => p.id === projectId)

  if (!project || !project.tenderLink) {
    return false
  }

  if (project.tenderLink.tenderId !== tenderId) {
    return false
  }

  project.tenderLink = undefined
  this.persist(projects)
  this.emitProjectsUpdated()

  return true
}

async getProjectsFromTender(tenderId: string): Promise<EnhancedProject[]> {
  const projects = this.loadProjects()
  return projects.filter(p =>
    p.tenderLink?.tenderId === tenderId ||
    p.fromTender?.tenderId === tenderId
  )
}

async getTenderLink(projectId: string): Promise<TenderProjectLink | null> {
  const projects = this.loadProjects()
  const project = projects.find(p => p.id === projectId)
  return project?.tenderLink || null
}
```

**Deliverables:**

- ✅ 4 methods مكتملة
- ✅ Tests: 12 unit tests

---

#### **Task 1.2: تحسين Auto-Creation Service**

**الملف:** `src/application/services/projectAutoCreation.ts`

```typescript
// ✅ تحسين الخدمة الموجودة:

// 1. إضافة نقل BOQ كامل
private static async copyBOQData(
  tenderId: string,
  projectId: string
): Promise<void> {
  const boqRepo = getBoqRepository()
  const tenderBOQ = await boqRepo.getByTenderId(tenderId)

  if (!tenderBOQ) {
    console.warn('No BOQ found for tender:', tenderId)
    return
  }

  // نسخ جميع البنود مع الأسعار
  const projectBOQ: BOQData = {
    ...tenderBOQ,
    id: generateId(),
    projectId,
    tenderId: undefined, // إزالة الربط بالمنافسة
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await boqRepo.create(projectBOQ)
  console.log('BOQ copied successfully:', projectBOQ.items.length, 'items')
}

// 2. إضافة نقل المرفقات
private static async copyAttachments(
  tender: Tender,
  projectId: string
): Promise<void> {
  // نسخ المرفقات المهمة فقط (عقود، مخططات)
  const importantCategories = ['contract', 'drawings', 'specifications']

  if (!tender.attachments) return

  const attachmentsToCoبy = tender.attachments.filter(a =>
    importantCategories.includes(a.category)
  )

  for (const attachment of attachmentsToCoبy) {
    // نسخ الملف وربطه بالمشروع
    console.log('Copying attachment:', attachment.name)
  }
}

// 3. إضافة إنشاء مراحل تلقائية
private static async generateProjectPhases(
  projectId: string,
  tenderData: Tender
): Promise<void> {
  const defaultPhases: ProjectPhase[] = [
    {
      id: generateId(),
      name: 'التخطيط والتصميم',
      nameEn: 'Planning & Design',
      order: 1,
      description: 'مرحلة التخطيط والتصاميم الأولية',
      estimatedDuration: 60,
      dependencies: [],
      milestones: []
    },
    {
      id: generateId(),
      name: 'التنفيذ',
      nameEn: 'Execution',
      order: 2,
      description: 'مرحلة التنفيذ الفعلي للمشروع',
      estimatedDuration: 180,
      dependencies: [],
      milestones: []
    },
    {
      id: generateId(),
      name: 'التسليم',
      nameEn: 'Handover',
      order: 3,
      description: 'مرحلة التسليم والإغلاق',
      estimatedDuration: 30,
      dependencies: [],
      milestones: []
    }
  ]

  // حفظ المراحل في المشروع
  const projectRepo = getProjectRepository()
  const project = await projectRepo.getById(projectId)

  if (project) {
    await projectRepo.update(projectId, {
      phases: defaultPhases
    })
  }
}
```

**Deliverables:**

- ✅ نقل BOQ كامل
- ✅ نقل المرفقات
- ✅ إنشاء مراحل تلقائية
- ✅ Tests: 8 tests

---

### **المرحلة 1B: Project Creation UI (4 ساعات)**

#### **Task 1.3: إنشاء CreateProjectFromTenderDialog**

**الملف:** `src/presentation/components/projects/CreateProjectFromTenderDialog.tsx`

```typescript
/**
 * Dialog لإنشاء مشروع من منافسة فائزة
 */
interface CreateProjectFromTenderDialogProps {
  tender: Tender
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (project: EnhancedProject) => void
}

export function CreateProjectFromTenderDialog({
  tender,
  open,
  onOpenChange,
  onSuccess
}: CreateProjectFromTenderDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [options, setOptions] = useState({
    copyBOQ: true,
    copyAttachments: true,
    generatePhases: true,
    notifyTeam: true
  })

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const result = await EnhancedProjectAutoCreationService
        .createProjectFromWonTender(tender, options)

      if (result.success && result.project) {
        toast.success('تم إنشاء المشروع بنجاح')
        onSuccess?.(result.project)
        onOpenChange(false)
      } else {
        toast.error(result.errors?.join('\n') || 'فشل في إنشاء المشروع')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('حدث خطأ أثناء إنشاء المشروع')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>إنشاء مشروع من منافسة فائزة</DialogTitle>
          <DialogDescription>
            سيتم إنشاء مشروع جديد من المنافسة: {tender.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* معاينة البيانات */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">معلومات المنافسة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">العميل:</span>
                  <span className="mr-2 font-medium">{tender.client}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">القيمة:</span>
                  <span className="mr-2 font-medium">
                    {formatCurrency(tender.value)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">تاريخ البدء:</span>
                  <span className="mr-2">{formatDate(tender.startDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">تاريخ الانتهاء:</span>
                  <span className="mr-2">{formatDate(tender.deadline)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* خيارات الإنشاء */}
          <div className="space-y-3">
            <Label>خيارات الإنشاء</Label>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="copyBOQ"
                checked={options.copyBOQ}
                onCheckedChange={(checked) =>
                  setOptions(prev => ({ ...prev, copyBOQ: !!checked }))
                }
              />
              <Label htmlFor="copyBOQ" className="text-sm font-normal cursor-pointer">
                نسخ جدول الكميات والأسعار
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="copyAttachments"
                checked={options.copyAttachments}
                onCheckedChange={(checked) =>
                  setOptions(prev => ({ ...prev, copyAttachments: !!checked }))
                }
              />
              <Label htmlFor="copyAttachments" className="text-sm font-normal cursor-pointer">
                نسخ المرفقات (عقود، مخططات)
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="generatePhases"
                checked={options.generatePhases}
                onCheckedChange={(checked) =>
                  setOptions(prev => ({ ...prev, generatePhases: !!checked }))
                }
              />
              <Label htmlFor="generatePhases" className="text-sm font-normal cursor-pointer">
                إنشاء مراحل افتراضية
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="notifyTeam"
                checked={options.notifyTeam}
                onCheckedChange={(checked) =>
                  setOptions(prev => ({ ...prev, notifyTeam: !!checked }))
                }
              />
              <Label htmlFor="notifyTeam" className="text-sm font-normal cursor-pointer">
                إرسال إشعارات للفريق
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              'إنشاء المشروع'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Deliverables:**

- ✅ CreateProjectFromTenderDialog.tsx (180 LOC)
- ✅ Integration في TenderDetailsPage
- ✅ Tests: 6 tests

---

#### **Task 1.4: إضافة زر في TenderDetailsPage**

**الملف:** `src/presentation/pages/Tenders/TenderDetailsPage.tsx` (أو المكان المناسب)

```typescript
// إضافة الزر في صفحة تفاصيل المنافسة

{tender.status === 'won' && !hasLinkedProject && (
  <Button
    onClick={() => setShowCreateProjectDialog(true)}
    className="gap-2"
  >
    <Plus className="h-4 w-4" />
    إنشاء مشروع
  </Button>
)}

{/* Dialog */}
<CreateProjectFromTenderDialog
  tender={tender}
  open={showCreateProjectDialog}
  onOpenChange={setShowCreateProjectDialog}
  onSuccess={(project) => {
    // Navigate to project details
    navigate(`/projects/${project.id}`)
  }}
/>
```

**Deliverables:**

- ✅ زر إنشاء مشروع
- ✅ تكامل مع Dialog

---

### **المرحلة 1C: Dashboard Integration (2 ساعات)**

#### **Task 1.5: إنشاء TenderProjectLinkCard**

**الملف:** `src/presentation/components/projects/TenderProjectLinkCard.tsx`

```typescript
/**
 * بطاقة لعرض الربط بين المنافسة والمشروع
 */
interface TenderProjectLinkCardProps {
  tender: Tender
  project: EnhancedProject
  link: TenderProjectLink
}

export function TenderProjectLinkCard({
  tender,
  project,
  link
}: TenderProjectLinkCardProps) {
  const linkTypeLabels = {
    created_from: 'تم إنشاؤه من المنافسة',
    related_to: 'مرتبط بالمنافسة',
    derived_from: 'مشتق من المنافسة'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Link2 className="h-4 w-4" />
          ارتباط بمنافسة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">المنافسة:</span>
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => navigate(`/tenders/${tender.id}`)}
          >
            {tender.name}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">نوع الربط:</span>
          <Badge variant="outline">
            {linkTypeLabels[link.linkType]}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">تاريخ الربط:</span>
          <span className="text-sm">{formatDate(link.linkDate)}</span>
        </div>

        <Separator />

        {/* إحصائيات المقارنة */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">قيمة المنافسة:</span>
            <span className="font-medium">{formatCurrency(tender.value)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ميزانية المشروع:</span>
            <span className="font-medium">{formatCurrency(project.budget?.total || 0)}</span>
          </div>
          {Math.abs(tender.value - (project.budget?.total || 0)) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الفرق:</span>
              <span className={cn(
                "font-medium",
                tender.value > (project.budget?.total || 0)
                  ? "text-warning"
                  : "text-success"
              )}>
                {formatCurrency(Math.abs(tender.value - (project.budget?.total || 0)))}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Deliverables:**

- ✅ TenderProjectLinkCard.tsx (120 LOC)
- ✅ Integration في ProjectDetailsPage
- ✅ Tests: 4 tests

---

## 🛒 Day 3-4: Purchase Orders Integration

### **المرحلة 2A: Auto-Linking POs to Projects (3 ساعات)**

#### **Task 2.1: إنشاء PO-Project Auto-Linker**

**الملف:** `src/application/services/purchaseOrderProjectLinker.ts`

```typescript
/**
 * خدمة ربط أوامر الشراء بالمشاريع تلقائياً
 */
export class PurchaseOrderProjectLinker {
  /**
   * ربط PO بمشروع تلقائياً
   */
  static async linkPOToProject(poId: string, projectId: string): Promise<boolean> {
    try {
      const poRepo = getPurchaseOrderRepository()
      const po = await poRepo.getById(poId)

      if (!po) {
        throw new Error(`PO ${poId} not found`)
      }

      // تحديث PO لإضافة projectId
      await poRepo.update(poId, {
        projectId,
        metadata: {
          ...po.metadata,
          linkedAt: new Date().toISOString(),
          linkedBy: 'system', // أو user ID
        },
      })

      console.log(`PO ${poId} linked to project ${projectId}`)
      return true
    } catch (error) {
      console.error('Error linking PO to project:', error)
      return false
    }
  }

  /**
   * تحديث تكاليف المشروع من POs
   */
  static async updateProjectCostsFromPOs(projectId: string): Promise<void> {
    try {
      const poRepo = getPurchaseOrderRepository()
      const projectRepo = getProjectRepository()

      // جلب جميع POs للمشروع
      const pos = await poRepo.getByProjectId(projectId)

      // حساب التكلفة الفعلية
      const totalActualCost = pos.reduce((sum, po) => {
        return sum + (po.totalAmount || 0)
      }, 0)

      // تحديث المشروع
      await projectRepo.update(projectId, {
        actualCost: totalActualCost,
        remaining: (project.contractValue || 0) - totalActualCost,
      })

      console.log(`Project ${projectId} costs updated from ${pos.length} POs`)
    } catch (error) {
      console.error('Error updating project costs from POs:', error)
    }
  }

  /**
   * مزامنة تلقائية لجميع POs
   */
  static async syncAllPOs(): Promise<void> {
    try {
      const poRepo = getPurchaseOrderRepository()
      const allPOs = await poRepo.getAll()

      // فلترة POs التي لها projectId
      const projectPOs = allPOs.filter((po) => po.projectId)

      // تجميع حسب المشروع
      const posByProject = new Map<string, PurchaseOrder[]>()
      for (const po of projectPOs) {
        if (!po.projectId) continue

        const pos = posByProject.get(po.projectId) || []
        pos.push(po)
        posByProject.set(po.projectId, pos)
      }

      // تحديث كل مشروع
      for (const [projectId, pos] of posByProject) {
        await this.updateProjectCostsFromPOs(projectId)
      }

      console.log(`Synced ${posByProject.size} projects with POs`)
    } catch (error) {
      console.error('Error syncing all POs:', error)
    }
  }
}
```

**Deliverables:**

- ✅ purchaseOrderProjectLinker.ts (200 LOC)
- ✅ Auto-linking mechanism
- ✅ Cost sync functionality
- ✅ Tests: 10 tests

---

#### **Task 2.2: إنشاء PurchaseOrdersPanel**

**الملف:** `src/presentation/components/projects/PurchaseOrdersPanel.tsx`

```typescript
/**
 * لوحة أوامر الشراء للمشروع
 */
interface PurchaseOrdersPanelProps {
  projectId: string
}

export function PurchaseOrdersPanel({ projectId }: PurchaseOrdersPanelProps) {
  const [pos, setPOs] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadPOs()
  }, [projectId])

  const loadPOs = async () => {
    setIsLoading(true)
    try {
      const poRepo = getPurchaseOrderRepository()
      const projectPOs = await poRepo.getByProjectId(projectId)
      setPOs(projectPOs)
    } catch (error) {
      console.error('Error loading POs:', error)
      toast.error('فشل في تحميل أوامر الشراء')
    } finally {
      setIsLoading(false)
    }
  }

  const totalPOValue = pos.reduce((sum, po) => sum + po.totalAmount, 0)
  const pendingPOs = pos.filter(po => po.status === 'pending').length
  const completedPOs = pos.filter(po => po.status === 'completed').length

  return (
    <div className="space-y-4">
      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{pos.length}</div>
              <div className="text-sm text-muted-foreground">
                إجمالي الطلبات
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold">
                {formatCurrency(totalPOValue)}
              </div>
              <div className="text-sm text-muted-foreground">
                القيمة الإجمالية
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
              <div className="text-2xl font-bold">{pendingPOs}</div>
              <div className="text-sm text-muted-foreground">
                قيد الانتظار
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة POs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>أوامر الشراء</CardTitle>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 ml-2" />
              طلب جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : pos.length === 0 ? (
            <EmptyState
              icon={Package}
              title="لا توجد أوامر شراء"
              description="لم يتم إنشاء أي أوامر شراء لهذا المشروع بعد"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.supplier}</TableCell>
                    <TableCell>{formatDate(po.orderDate)}</TableCell>
                    <TableCell>{formatCurrency(po.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        po.status === 'completed' ? 'success' :
                        po.status === 'pending' ? 'warning' : 'secondary'
                      }>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Deliverables:**

- ✅ PurchaseOrdersPanel.tsx (280 LOC)
- ✅ Statistics cards
- ✅ PO list table
- ✅ Create PO button
- ✅ Tests: 8 tests

---

### **المرحلة 2B: Cost Tracking from POs (2 ساعات)**

#### **Task 2.3: إنشاء ProjectCostTracker**

**الملف:** `src/application/hooks/useProjectCostTracking.ts`

```typescript
/**
 * Hook لتتبع تكاليف المشروع من أوامر الشراء
 */
export function useProjectCostTracking(projectId: string) {
  const [costs, setCosts] = useState({
    estimated: 0,
    actual: 0,
    fromPOs: 0,
    variance: 0,
    variancePercentage: 0,
  })

  const [breakdown, setBreakdown] = useState<CostBreakdown[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCosts()
  }, [projectId])

  const loadCosts = async () => {
    setIsLoading(true)
    try {
      const projectRepo = getProjectRepository()
      const poRepo = getPurchaseOrderRepository()

      const [project, pos] = await Promise.all([
        projectRepo.getById(projectId),
        poRepo.getByProjectId(projectId),
      ])

      if (!project) {
        throw new Error('Project not found')
      }

      // حساب التكاليف الفعلية من POs
      const actualFromPOs = pos.reduce((sum, po) => {
        return sum + (po.status === 'completed' ? po.totalAmount : 0)
      }, 0)

      // حساب الالتزامات (POs المعلقة)
      const commitments = pos.reduce((sum, po) => {
        return sum + (po.status === 'pending' ? po.totalAmount : 0)
      }, 0)

      const variance = project.estimatedCost - actualFromPOs
      const variancePercentage =
        project.estimatedCost > 0 ? (variance / project.estimatedCost) * 100 : 0

      setCosts({
        estimated: project.estimatedCost || 0,
        actual: actualFromPOs,
        fromPOs: actualFromPOs + commitments,
        variance,
        variancePercentage,
      })

      // تحليل حسب الفئة
      const categoryBreakdown = new Map<string, number>()
      for (const po of pos) {
        const category = po.category || 'أخرى'
        const current = categoryBreakdown.get(category) || 0
        categoryBreakdown.set(category, current + po.totalAmount)
      }

      setBreakdown(
        Array.from(categoryBreakdown.entries()).map(([category, amount]) => ({
          category,
          amount,
          percentage: costs.actual > 0 ? (amount / costs.actual) * 100 : 0,
        })),
      )
    } catch (error) {
      console.error('Error loading costs:', error)
      toast.error('فشل في تحميل بيانات التكاليف')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCosts = () => loadCosts()

  return {
    costs,
    breakdown,
    isLoading,
    refreshCosts,
  }
}
```

**Deliverables:**

- ✅ useProjectCostTracking.ts (150 LOC)
- ✅ Real-time cost calculation
- ✅ Category breakdown
- ✅ Tests: 12 tests

---

## 📅 Day 5-7: Timeline Management

### **المرحلة 3A: Phase & Milestone Management (4 ساعات)**

#### **Task 3.1: إنشاء ProjectTimelineEditor**

**الملف:** `src/presentation/components/projects/ProjectTimelineEditor.tsx`

```typescript
/**
 * محرر الجدول الزمني للمشروع
 */
interface ProjectTimelineEditorProps {
  projectId: string
  phases: ProjectPhase[]
  onUpdate?: (phases: ProjectPhase[]) => void
}

export function ProjectTimelineEditor({
  projectId,
  phases: initialPhases,
  onUpdate
}: ProjectTimelineEditorProps) {
  const [phases, setPhases] = useState<ProjectPhase[]>(initialPhases)
  const [editingPhase, setEditingPhase] = useState<string | null>(null)
  const [showAddPhase, setShowAddPhase] = useState(false)

  const handleAddPhase = (phaseData: Partial<ProjectPhase>) => {
    const newPhase: ProjectPhase = {
      id: generateId(),
      name: phaseData.name || '',
      nameEn: phaseData.nameEn || '',
      order: phases.length + 1,
      description: phaseData.description || '',
      estimatedDuration: phaseData.estimatedDuration || 30,
      dependencies: [],
      milestones: []
    }

    const updated = [...phases, newPhase]
    setPhases(updated)
    onUpdate?.(updated)
    setShowAddPhase(false)
  }

  const handleUpdatePhase = (
    phaseId: string,
    updates: Partial<ProjectPhase>
  ) => {
    const updated = phases.map(p =>
      p.id === phaseId ? { ...p, ...updates } : p
    )
    setPhases(updated)
    onUpdate?.(updated)
    setEditingPhase(null)
  }

  const handleDeletePhase = (phaseId: string) => {
    const updated = phases.filter(p => p.id !== phaseId)
    setPhases(updated)
    onUpdate?.(updated)
  }

  const handleAddMilestone = (
    phaseId: string,
    milestoneData: Partial<ProjectMilestone>
  ) => {
    const updated = phases.map(p => {
      if (p.id === phaseId) {
        const newMilestone: ProjectMilestone = {
          id: generateId(),
          name: milestoneData.name || '',
          nameEn: milestoneData.nameEn || '',
          description: milestoneData.description || '',
          targetDate: milestoneData.targetDate || '',
          status: 'pending',
          progress: 0,
          deliverables: [],
          dependencies: []
        }
        return {
          ...p,
          milestones: [...p.milestones, newMilestone]
        }
      }
      return p
    })

    setPhases(updated)
    onUpdate?.(updated)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">مراحل المشروع</h3>
        <Button onClick={() => setShowAddPhase(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مرحلة
        </Button>
      </div>

      {/* Phases List */}
      <div className="space-y-4">
        {phases.map((phase, index) => (
          <Card key={phase.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base">{phase.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {phase.estimatedDuration} يوم
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPhase(phase.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePhase(phase.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {phase.description}
              </p>

              {/* Milestones */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">المعالم الرئيسية</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddMilestone(phase.id, {})}
                  >
                    <Plus className="h-3 w-3 ml-2" />
                    إضافة معلم
                  </Button>
                </div>

                {phase.milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد معالم لهذه المرحلة
                  </p>
                ) : (
                  <div className="space-y-2">
                    {phase.milestones.map(milestone => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={milestone.status === 'completed'}
                            onCheckedChange={(checked) => {
                              // Update milestone status
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium">{milestone.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(milestone.targetDate)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          milestone.status === 'completed' ? 'success' :
                          milestone.status === 'in_progress' ? 'warning' :
                          milestone.status === 'delayed' ? 'destructive' :
                          'secondary'
                        }>
                          {milestone.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Phase Dialog */}
      {showAddPhase && (
        <Dialog open={showAddPhase} onOpenChange={setShowAddPhase}>
          {/* Dialog content for adding phase */}
        </Dialog>
      )}
    </div>
  )
}
```

**Deliverables:**

- ✅ ProjectTimelineEditor.tsx (400 LOC)
- ✅ Phase CRUD operations
- ✅ Milestone management
- ✅ Tests: 15 tests

---

#### **Task 3.2: إنشاء GanttChart Component**

**الملف:** `src/presentation/components/projects/GanttChart.tsx`

```typescript
/**
 * مخطط جانت للجدول الزمني
 * (استخدام مكتبة مثل react-gantt-chart أو تطبيق بسيط)
 */
interface GanttChartProps {
  phases: ProjectPhase[]
  startDate: string
  endDate: string
}

export function GanttChart({
  phases,
  startDate,
  endDate
}: GanttChartProps) {
  // تنفيذ مخطط جانت بسيط
  // أو استخدام مكتبة خارجية

  return (
    <Card>
      <CardHeader>
        <CardTitle>المخطط الزمني</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Gantt chart implementation */}
        <div className="relative">
          {/* Timeline header */}
          {/* Phase bars */}
          {/* Milestone markers */}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Deliverables:**

- ✅ GanttChart.tsx (250 LOC)
- ✅ Visual timeline
- ✅ Interactive features

---

### **المرحلة 3B: Notifications & Alerts (3 ساعات)**

#### **Task 3.3: إنشاء ProjectDelayNotifier**

**الملف:** `src/application/services/projectDelayNotifier.ts`

```typescript
/**
 * خدمة تنبيهات تأخير المشاريع
 */
export class ProjectDelayNotifier {
  static async checkAllProjects(): Promise<DelayNotification[]> {
    const projectRepo = getProjectRepository()
    const allProjects = await projectRepo.getAll()
    const notifications: DelayNotification[] = []

    for (const project of allProjects) {
      const delays = await this.checkProjectDelays(project)
      notifications.push(...delays)
    }

    return notifications
  }

  static async checkProjectDelays(project: EnhancedProject): Promise<DelayNotification[]> {
    const notifications: DelayNotification[] = []
    const now = new Date()

    // فحص المراحل
    for (const phase of project.phases || []) {
      // فحص المعالم المتأخرة
      for (const milestone of phase.milestones) {
        if (milestone.status !== 'completed') {
          const targetDate = new Date(milestone.targetDate)

          if (now > targetDate) {
            const daysLate = Math.floor(
              (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24),
            )

            notifications.push({
              id: generateId(),
              type: 'milestone_delayed',
              severity: daysLate > 30 ? 'high' : daysLate > 7 ? 'medium' : 'low',
              projectId: project.id,
              projectName: project.name,
              message: `المعلم "${milestone.name}" متأخر بـ ${daysLate} يوم`,
              daysLate,
              targetDate: milestone.targetDate,
              relatedItem: {
                type: 'milestone',
                id: milestone.id,
                name: milestone.name,
              },
            })
          }
        }
      }
    }

    // فحص نهاية المشروع
    if (project.endDate) {
      const endDate = new Date(project.endDate)
      if (now > endDate && project.status !== 'completed') {
        const daysLate = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))

        notifications.push({
          id: generateId(),
          type: 'project_overdue',
          severity: 'high',
          projectId: project.id,
          projectName: project.name,
          message: `المشروع متأخر عن موعد التسليم بـ ${daysLate} يوم`,
          daysLate,
          targetDate: project.endDate,
        })
      }
    }

    return notifications
  }

  static async sendNotifications(notifications: DelayNotification[]): Promise<void> {
    for (const notification of notifications) {
      // إرسال إشعار (email, SMS, push notification, etc.)
      console.log('Sending notification:', notification)

      // يمكن استخدام خدمة الإشعارات
      // await notificationService.send(notification)
    }
  }
}

interface DelayNotification {
  id: string
  type: 'milestone_delayed' | 'phase_delayed' | 'project_overdue'
  severity: 'low' | 'medium' | 'high'
  projectId: string
  projectName: string
  message: string
  daysLate: number
  targetDate: string
  relatedItem?: {
    type: 'milestone' | 'phase'
    id: string
    name: string
  }
}
```

**Deliverables:**

- ✅ projectDelayNotifier.ts (200 LOC)
- ✅ Delay detection
- ✅ Notification system
- ✅ Tests: 10 tests

---

## 📊 Summary & Metrics

### **تفصيل الوقت المتوقع:**

| اليوم | المهام                         | الوقت   |
| ----- | ------------------------------ | ------- |
| Day 1 | Tender Integration - Part 1    | 8 ساعات |
| Day 2 | Tender Integration - Part 2    | 6 ساعات |
| Day 3 | PO Integration - Part 1        | 8 ساعات |
| Day 4 | PO Integration - Part 2        | 5 ساعات |
| Day 5 | Timeline Management - Part 1   | 8 ساعات |
| Day 6 | Timeline Management - Part 2   | 8 ساعات |
| Day 7 | Testing, Documentation, Polish | 8 ساعات |

**المجموع:** 51 ساعة (~7 أيام عمل)

---

### **الملفات الجديدة المتوقعة:**

```
src/
├── application/
│   └── services/
│       ├── purchaseOrderProjectLinker.ts (200 LOC)
│       └── projectDelayNotifier.ts (200 LOC)
├── application/
│   └── hooks/
│       └── useProjectCostTracking.ts (150 LOC)
└── presentation/
    └── components/
        └── projects/
            ├── CreateProjectFromTenderDialog.tsx (180 LOC)
            ├── TenderProjectLinkCard.tsx (120 LOC)
            ├── PurchaseOrdersPanel.tsx (280 LOC)
            ├── ProjectTimelineEditor.tsx (400 LOC)
            └── GanttChart.tsx (250 LOC)

Total New Code: ~1,780 LOC
```

---

### **الملفات المُحدَّثة:**

```
- src/repository/providers/enhancedProject.local.ts (4 methods)
- src/application/services/projectAutoCreation.ts (3 methods)
- src/presentation/pages/Tenders/TenderDetailsPage.tsx (button + dialog)
- src/presentation/pages/Projects/ProjectDetailsPage.tsx (new panels)
```

---

### **Tests المطلوبة:**

| المكون              | Unit Tests | Integration Tests | Total   |
| ------------------- | ---------- | ----------------- | ------- |
| Tender Integration  | 30         | 5                 | 35      |
| PO Integration      | 30         | 8                 | 38      |
| Timeline Management | 35         | 10                | 45      |
| **المجموع**         | **95**     | **23**            | **118** |

---

## ✅ Success Criteria

### **يعتبر Week 4 ناجح إذا:**

1. ✅ **Tender Integration:**

   - يمكن إنشاء مشروع من منافسة فائزة بنقرة واحدة
   - ينتقل BOQ كاملاً من Tender إلى Project
   - تُعرض العلاقة بين Tender-Project في Dashboard

2. ✅ **PO Integration:**

   - POs ترتبط تلقائياً بالمشروع
   - التكاليف الفعلية تُحدَّث تلقائياً من POs
   - يمكن عرض جميع POs المرتبطة بالمشروع

3. ✅ **Timeline Management:**

   - يمكن إنشاء وتعديل المراحل والمعالم
   - مخطط جانت يعرض الجدول الزمني
   - التنبيهات تُرسل للتأخيرات

4. ✅ **Quality:**
   - جميع الاختبارات تمر (118 tests)
   - صفر TypeScript errors
   - البناء ينجح بدون warnings

---

## 🚀 Next Steps After Week 4

### **Week 5 (Optional):**

1. Reports & Analytics
2. Advanced Dashboards
3. Export to PDF/Excel
4. Email Notifications

---

**هل أبدأ التنفيذ؟** 🚀
