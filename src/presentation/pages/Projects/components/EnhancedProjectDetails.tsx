/**
 * 🏗️ تفاصيل المشروع مع إدارة المشتريات والتكاليف
 * Enhanced Project Details with Purchases & Cost Management
 */

'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Progress } from '@/presentation/components/ui/progress'
import { Label } from '@/presentation/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/presentation/components/ui/dialog'
// (Tooltip components removed with legacy CostsTable cleanup)
import { PageLayout, EmptyState } from '@/presentation/components/layout/PageLayout'
import { Building2, Calendar, User, MapPin, AlertTriangle, Edit, Trash2 } from 'lucide-react'
import { useFinancialState } from '@/application/context'
import { ProjectOverviewTab } from './tabs/ProjectOverviewTab'
import { ProjectCostsTab } from './tabs/ProjectCostsTab'
import { ProjectBudgetTab } from './tabs/ProjectBudgetTab'
import { ProjectTimelineTab } from './tabs/ProjectTimelineTab'
import { ProjectPurchasesTab } from './tabs/ProjectPurchasesTab'
import { ProjectAttachmentsTab } from './tabs/ProjectAttachmentsTab'
import { ProjectEditDialog } from './dialogs/ProjectEditDialog'
import type { ProjectEditFormData } from './dialogs/ProjectEditDialog'
import { useExpenses } from '@/application/hooks/useExpenses'
import { formatCurrency } from '@/data/centralData'
import { toast } from 'sonner'
import { useProjectFormatters } from './hooks/useProjectFormatters'
import type { Tender } from '@/data/centralData'
import type { PurchaseOrder } from '@/shared/types/contracts'
import {
  getBOQRepository,
  getPurchaseOrderRepository,
  getTenderRepository,
} from '@/application/services/serviceRegistry'
import { useBOQ } from '@/application/hooks/useBOQ'
import { APP_EVENTS, emit } from '@/events/bus'
import { buildPricingMap } from '@/shared/utils/pricing/normalizePricing'
import { whenStorageReady } from '@/shared/utils/storage/storage'
import { projectBudgetService } from '@/application/services/projectBudgetService'
import type { ProjectBudgetComparison } from '@/application/services/projectBudgetService'
// Removed unused Expense type (legacy cost table eliminated)
// Removed ProjectAttachment interface (moved to useProjectAttachments hook)

// واجهة البيانات
interface ProjectDetailsProps {
  projectId: string
  onBack: () => void
  onSectionChange?: (section: string) => void
}

// استخدام النوع من ProjectEditDialog
type EditFormData = ProjectEditFormData

export function EnhancedProjectDetails({
  projectId,
  onBack,
  onSectionChange,
}: ProjectDetailsProps) {
  const { projects: projectsState, financial } = useFinancialState()
  const { projects, updateProject, deleteProject } = projectsState
  const { getExpensesByProject } = useExpenses()
  const { getProjectActualCost } = financial

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [budgetComparison, setBudgetComparison] = useState<ProjectBudgetComparison[]>([])
  const [budgetSummary, setBudgetSummary] = useState<any>(null)
  const [budgetLoading, setBudgetLoading] = useState(false)
  // Legacy sorting & per-expense state removed (handled by new ProjectCostView)
  const [boqRefreshTick, setBoqRefreshTick] = useState(0)
  const [boqAvailability, setBoqAvailability] = useState({
    hasProjectBOQ: false,
    hasTenderBOQ: false,
  })
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [relatedTender, setRelatedTender] = useState<Tender | null>(null)

  // Use shared formatters from hook
  const { formatDateOnly } = useProjectFormatters()

  // بيانات النموذج للتحرير
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    client: '',
    description: '',
    location: '',
    budget: 0,
    contractValue: 0,
    estimatedCost: 0,
    startDate: '',
    endDate: '',
    status: 'active',
    priority: 'medium',
    progress: 0,
  })

  // البحث عن المشروع
  const project = projects.find((p) => p.id === projectId)

  const currentProjectId = project?.id ?? ''
  const currentTenderId = relatedTender?.id
  const { syncWithPricingData } = useBOQ({
    projectId: currentProjectId,
    tenderId: currentTenderId,
    purchaseOrders,
  })

  useEffect(() => {
    console.log(
      '🧭 [EnhancedProjectDetails] relatedTender resolved:',
      relatedTender?.id ?? '<none>',
      'for project',
      project?.id ?? '<none>',
    )
  }, [relatedTender, project?.id])

  // الحصول على مصروفات المشروع
  useEffect(() => {
    let cancelled = false

    if (!project) {
      setRelatedTender(null)
      setPurchaseOrders([])
      return () => {
        cancelled = true
      }
    }

    const tenderRepository = getTenderRepository()
    const purchaseOrderRepository = getPurchaseOrderRepository()

    const load = async () => {
      try {
        await whenStorageReady()
        const tenderPromise =
          typeof tenderRepository.getByProjectId === 'function'
            ? tenderRepository.getByProjectId(project.id)
            : Promise.resolve(null)
        const ordersPromise = purchaseOrderRepository.getByProjectId(project.id)
        const [tenderResult, ordersResult] = await Promise.all([tenderPromise, ordersPromise])

        if (!cancelled) {
          setRelatedTender(tenderResult ?? null)
          setPurchaseOrders(Array.isArray(ordersResult) ? ordersResult : [])
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('تعذر تحميل بيانات المنافسة أو أوامر الشراء:', error)
          setRelatedTender(null)
          setPurchaseOrders([])
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [project])

  const projectExpenses = project ? getExpensesByProject(project.id) : []
  const actualCost = project ? getProjectActualCost(project.id) : 0

  // الاستماع لتحديثات BOQ من النظام المركزي لتحديث العرض فورًا
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handler = (event: CustomEvent<{ projectId?: string; tenderId?: string }>) => {
      const detail = event?.detail ?? {}
      if (
        (currentProjectId && detail.projectId === currentProjectId) ||
        (currentTenderId && detail.tenderId === currentTenderId)
      ) {
        setBoqRefreshTick((v) => v + 1)
      }
    }

    try {
      window.addEventListener(APP_EVENTS.BOQ_UPDATED, handler as EventListener)
    } catch (error) {
      console.warn('تعذر تسجيل مستمع تحديث BOQ:', error)
    }

    return () => {
      try {
        window.removeEventListener(APP_EVENTS.BOQ_UPDATED, handler as EventListener)
      } catch (error) {
        console.warn('تعذر إزالة مستمع تحديث BOQ:', error)
      }
    }
  }, [currentProjectId, currentTenderId])

  // تحديث حالة توفر BOQ للمشروع والمنافسة المرتبطة
  useEffect(() => {
    if (!currentProjectId) {
      setBoqAvailability({ hasProjectBOQ: false, hasTenderBOQ: false })
      return
    }

    let cancelled = false
    const boqRepository = getBOQRepository()

    void (async () => {
      try {
        const projectPromise = boqRepository.getByProjectId(currentProjectId)
        const tenderPromise = currentTenderId
          ? boqRepository.getByTenderId(currentTenderId)
          : Promise.resolve(null)
        const [projectBOQ, tenderBOQ] = await Promise.all([projectPromise, tenderPromise])

        if (!cancelled) {
          setBoqAvailability({
            hasProjectBOQ: Boolean(projectBOQ),
            hasTenderBOQ: Boolean(tenderBOQ?.items?.length),
          })
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('تعذر تحديث توفر BOQ:', error)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentProjectId, currentTenderId, boqRefreshTick])

  // استيراد جدول الكميات من المنافسة إلى المشروع
  const handleImportBOQFromTender = async () => {
    try {
      if (!project || !relatedTender) return

      const boqRepository = getBOQRepository()
      let tenderBOQ = await boqRepository.getByTenderId(relatedTender.id)

      if (!tenderBOQ) {
        const { pricingService } = await import('@/application/services/pricingService')
        const pricingData = await pricingService.loadTenderPricing(relatedTender.id)
        const pricingArray = pricingData?.pricing

        if (pricingArray && pricingArray.length > 0) {
          const pricingMap = buildPricingMap(pricingArray)
          const boqItems: any[] = []
          let totalValue = 0

          for (const [, normalized] of pricingMap.entries()) {
            boqItems.push(normalized)
            totalValue += normalized.totalPrice
          }

          if (boqItems.length > 0) {
            const existingTenderBOQ = await boqRepository.getByTenderId(relatedTender.id)
            tenderBOQ = {
              id: existingTenderBOQ?.id ?? `boq_tender_${relatedTender.id}`,
              tenderId: relatedTender.id,
              projectId: undefined,
              items: boqItems,
              totalValue,
              lastUpdated: new Date().toISOString(),
            }
            await boqRepository.createOrUpdate(tenderBOQ as any)
            console.log('✅ تم إنشاء BOQ للمنافسة من بيانات التسعير (normalizePricing)')
          }
        }
      }

      if (!tenderBOQ) {
        toast.info('لا يوجد جدول كميات أو بيانات تسعير مرتبطة بهذه المنافسة')
        return
      }

      const existingProjectBOQ = await boqRepository.getByProjectId(project.id)
      const projectBOQ = {
        id: existingProjectBOQ?.id ?? `boq_project_${project.id}`,
        totalValue: tenderBOQ.totalValue,
        items: tenderBOQ.items.map((item) => ({
          ...item,
          originalId: item.id,
          actualQuantity: item.actualQuantity ?? item.quantity,
          actualUnitPrice: item.actualUnitPrice ?? item.unitPrice,
        })),
        projectId: project.id,
        tenderId: undefined,
        lastUpdated: new Date().toISOString(),
      }

      await boqRepository.createOrUpdate(projectBOQ as any)
      toast.success('تم استيراد جدول الكميات من المنافسة إلى هذا المشروع')
      setBoqRefreshTick((v) => v + 1)
    } catch (e) {
      console.error(e)
      toast.error('تعذر استيراد جدول الكميات')
    }
  }

  // إعادة مزامنة بيانات التسعير للمشروع الحالي
  const handleSyncPricingData = async () => {
    try {
      if (!project || !relatedTender) {
        toast.error('لا يوجد مشروع أو منافسة مرتبطة')
        return
      }

      toast.info('جاري إعادة مزامنة بيانات التسعير من تبويب الملخص...')

      // استخدام الدالة المحدثة لمزامنة بيانات التسعير مباشرة عبر طبقة المستودعات
      const directSyncSucceeded = await syncWithPricingData()

      if (directSyncSucceeded) {
        setBoqRefreshTick((v) => v + 1)
        toast.success('تمت مزامنة بيانات التسعير بنجاح')
        return
      }

      // في حالة فشل المزامنة المباشرة، استخدام الطريقة التقليدية
      console.log('⚠️ تعذرت المزامنة المباشرة، محاولة الطريقة التقليدية...')

      const boqRepository = getBOQRepository()
      const projectBOQ = await boqRepository.getByProjectId(project.id)
      if (!projectBOQ) {
        toast.error('لا يوجد جدول كميات للمشروع')
        return
      }

      // جلب بيانات التسعير من المنافسة
      const { pricingService } = await import('@/application/services/pricingService')
      const pricingData = await pricingService.loadTenderPricing(relatedTender.id)

      if (!pricingData?.pricing || pricingData.pricing.length === 0) {
        toast.error('لا توجد بيانات تسعير في المنافسة المرتبطة')
        return
      }

      // بناء خريطة التسعير
      const pricingMap = buildPricingMap(pricingData.pricing)
      console.log('🔄 خريطة التسعير:', pricingMap)

      // تطبيق الإصلاح على جميع البنود
      const { repairBOQ } = await import('@/shared/utils/pricing/normalizePricing')
      const result = repairBOQ(projectBOQ, pricingMap)

      if (result.updated && result.repairedItems > 0) {
        // تحديث BOQ بالبيانات المصلحة
        const updatedBOQ = {
          ...projectBOQ,
          items: result.newItems,
          lastUpdated: new Date().toISOString(),
        }
        await boqRepository.createOrUpdate(updatedBOQ as any)

        // حذف مفتاح الإصلاح لإعادة تطبيقه
        const { safeLocalStorage } = await import('@/shared/utils/storage/storage')
        safeLocalStorage.removeItem(`boq_repair_applied_${projectBOQ.id}`)

        setBoqRefreshTick((v) => v + 1)
        toast.success(`تم إصلاح ${result.repairedItems} بند وإعادة مزامنة البيانات بنجاح`)
        console.log('✅ إعادة المزامنة مكتملة:', { repairedItems: result.repairedItems })
      } else {
        toast.info('جميع البيانات محدثة بالفعل - لا حاجة للإصلاح')
      }
    } catch (error) {
      console.error('خطأ في إعادة مزامنة التسعير:', error)
      toast.error('تعذرت إعادة مزامنة بيانات التسعير')
    }
  }

  // تهيئة بيانات النموذج عند العثور على المشروع
  useEffect(() => {
    if (project) {
      setEditFormData({
        name: project.name,
        client: project.client,
        description: project.phase || '',
        location: project.location || '',
        budget: project.budget || 0,
        contractValue: project.contractValue || project.value || project.budget || 0,
        estimatedCost: project.estimatedCost || 0,
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        status: project.status || 'active',
        priority: project.priority || 'medium',
        progress: project.progress || 0,
      })
    }
  }, [project])

  // تحميل بيانات مقارنة الميزانية
  useEffect(() => {
    if (!currentProjectId || activeTab !== 'budget') {
      return
    }

    let cancelled = false

    const loadBudgetComparison = async () => {
      setBudgetLoading(true)
      try {
        const [comparison, summary] = await Promise.all([
          projectBudgetService.compareProjectBudget(currentProjectId),
          projectBudgetService.getProjectBudgetSummary(currentProjectId),
        ])

        if (!cancelled) {
          setBudgetComparison(comparison)
          setBudgetSummary(summary)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('خطأ في تحميل مقارنة الميزانية:', error)
          toast.error('تعذر تحميل بيانات مقارنة الميزانية')
        }
      } finally {
        if (!cancelled) {
          setBudgetLoading(false)
        }
      }
    }

    void loadBudgetComparison()

    return () => {
      cancelled = true
    }
  }, [currentProjectId, activeTab])

  if (!project) {
    return (
      <PageLayout
        tone="destructive"
        title="تفاصيل المشروع"
        description="المشروع غير موجود"
        icon={Building2}
        quickStats={[]}
        quickActions={[]}
        showSearch={false}
        onBack={onBack}
        backLabel="العودة للمشاريع"
      >
        <EmptyState
          icon={AlertTriangle}
          title="المشروع غير موجود"
          description="لم يتم العثور على المشروع المطلوب. يمكنك العودة لقائمة المشاريع للتحقق من المعرف أو اختيار مشروع آخر."
          actionLabel="العودة للمشاريع"
          onAction={onBack}
        />
      </PageLayout>
    )
  }

  // حساب الإحصائيات المالية بالمفاهيم الصحيحة
  const contractValue = project.contractValue || project.value || project.budget || 0 // قيمة العقد (الإيرادات)
  const estimatedCost = project.estimatedCost || 0 // التكلفة التقديرية (الميزانية المخططة)
  const actualProfit = contractValue - actualCost // الربح الفعلي
  const expectedProfit = contractValue - estimatedCost // الربح المتوقع
  const spentPercentage = estimatedCost > 0 ? (actualCost / estimatedCost) * 100 : 0
  const profitMargin = contractValue > 0 ? (actualProfit / contractValue) * 100 : 0
  const financialVariance = actualCost - estimatedCost // الانحراف المالي (Actual vs Budget)

  // ===============================
  // 🧭 تنقل مختصر
  // ===============================
  const handleNavigateTo = (section: string) => {
    try {
      // أولوية: التنقل عبر خاصية onSectionChange في واجهة الويب
      if (onSectionChange) {
        onSectionChange(section)
        // إذا كان الهدف هو المنافسات ولدينا منافسة مرتبطة، أصدر حدث فتح التفاصيل
        if (section === 'tenders' && relatedTender) {
          emit(APP_EVENTS.OPEN_TENDER_DETAILS, { tenderId: relatedTender.id })
        }
        toast.success('تم فتح القسم المطلوب')
        return
      }
      // إرسال حدث موحّد في بيئة Electron
      if (typeof window !== 'undefined' && (window as any).electronAPI?.send) {
        ;(window as any).electronAPI.send('section-changed', section)
        toast.success('تم فتح القسم المطلوب')
        return
      }
    } catch (error) {
      console.warn('تعذر تنفيذ التنقل السريع:', error)
    }
    toast.info('سيتم دعم التنقل المباشر في بيئة Electron أثناء التشغيل الفعلي')
  }

  // ===============================
  // (Legacy saveCostPlan removed – cost persistence now via project cost envelopes)

  // ===============================
  // ↕️ الفرز
  // ===============================
  // Sorting removed with legacy table

  // ===============================
  // Removed legacy per-item estimated/quantity sync (handled inside ProjectCostView)

  // ===============================
  // 🗑️ حذف مصروف (من بنود التكاليف)
  // ===============================
  // Expense deletion logic tied to legacy mixed table removed.

  // ===============================
  // 📎 إدارة المرفقات - تمت إزالتها (تم نقلها إلى useProjectAttachments hook)
  // ===============================

  // الإحصائيات السريعة
  const quickStats = [
    {
      label: 'نسبة الإنجاز',
      value: `${project.progress || 0}%`,
      trend: 'up' as const,
      trendValue: '+5.2%',
      color: 'text-success',
      bgColor: 'bg-success/10 dark:bg-success/20',
    },
    {
      label: 'التكلفة الفعلية',
      value: formatCurrency(actualCost),
      trend: 'up' as const,
      trendValue: `${spentPercentage.toFixed(1)}%`,
      color: 'text-info',
      bgColor: 'bg-info/10 dark:bg-info/20',
    },
    {
      label: 'الربح الفعلي',
      value: formatCurrency(actualProfit),
      trend: actualProfit >= expectedProfit ? ('up' as const) : ('down' as const),
      trendValue: `${profitMargin.toFixed(1)}%`,
      color: actualProfit >= 0 ? 'text-success' : 'text-destructive',
      bgColor: actualProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10',
    },
    {
      label: 'عدد المشتريات',
      value: projectExpenses.length.toString(),
      trend: 'stable' as const,
      trendValue: '0',
      color: 'text-accent',
      bgColor: 'bg-accent/10 dark:bg-accent/20',
    },
    {
      label: 'الانحراف المالي',
      value: `${financialVariance >= 0 ? '+' : ''}${formatCurrency(financialVariance)}`,
      trend: financialVariance <= 0 ? ('up' as const) : ('down' as const),
      trendValue: financialVariance.toFixed(0),
      color: financialVariance <= 0 ? 'text-success' : 'text-destructive',
      bgColor: financialVariance <= 0 ? 'bg-success/10' : 'bg-destructive/10',
    },
  ]

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'تعديل المشروع',
      icon: Edit,
      onClick: () => setShowEditDialog(true),
      primary: true,
    },
    {
      label: 'إعادة مزامنة التسعير',
      icon: () => <span>🔄</span>,
      onClick: handleSyncPricingData,
      variant: 'default' as const,
    },
    {
      label: 'حذف المشروع',
      icon: Trash2,
      onClick: () => setShowDeleteDialog(true),
      variant: 'outline' as const,
    },
  ]

  // دوال المعالجة
  const handleSaveEdit = async () => {
    if (!project) return

    try {
      const updatedProject = {
        ...project,
        name: editFormData.name,
        client: editFormData.client,
        description: editFormData.description,
        location: editFormData.location,
        budget: editFormData.budget ?? 0,
        contractValue: editFormData.contractValue ?? 0,
        estimatedCost: editFormData.estimatedCost ?? 0,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        status: editFormData.status as typeof project.status,
        priority: editFormData.priority as typeof project.priority,
        progress: editFormData.progress,
        updatedAt: new Date().toISOString(),
      }

      await updateProject(updatedProject)
      toast.success('تم تحديث المشروع بنجاح')
      setShowEditDialog(false)
    } catch (error) {
      console.error('خطأ في تحديث المشروع:', error)
      toast.error('حدث خطأ في تحديث المشروع')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProject(project.id)
      toast.success('تم حذف المشروع بنجاح')
      setShowDeleteDialog(false)
      onBack()
    } catch (error) {
      console.error('خطأ في حذف المشروع:', error)
      toast.error('حدث خطأ في حذف المشروع')
    }
  }

  // معلومات الحالة
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { text: 'نشط', variant: 'default' as const, color: 'text-success' }
      case 'completed':
        return { text: 'مكتمل', variant: 'default' as const, color: 'text-info' }
      case 'planning':
        return { text: 'تحت التخطيط', variant: 'secondary' as const, color: 'text-warning' }
      case 'paused':
        return {
          text: 'متوقف مؤقتاً',
          variant: 'secondary' as const,
          color: 'text-muted-foreground',
        }
      case 'delayed':
        return { text: 'متأخر', variant: 'destructive' as const, color: 'text-destructive' }
      default:
        return { text: 'غير محدد', variant: 'secondary' as const, color: 'text-muted-foreground' }
    }
  }

  const statusInfo = getStatusInfo(project.status || 'active')

  return (
    <PageLayout
      tone="primary"
      title={`تفاصيل المشروع: ${project.name}`}
      description="عرض شامل لجميع تفاصيل ومعلومات المشروع والتكاليف"
      icon={Building2}
      quickStats={quickStats}
      quickActions={quickActions}
      showSearch={false}
      onBack={onBack}
      backLabel="العودة للمشاريع"
    >
      {/* تبويبات الصفحة الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="costs">التكاليف التفصيلية</TabsTrigger>
          <TabsTrigger value="budget">مقارنة الميزانية</TabsTrigger>
          <TabsTrigger value="timeline">الجدول الزمني</TabsTrigger>
          <TabsTrigger value="purchases">المشتريات المرتبطة</TabsTrigger>
          <TabsTrigger value="attachments">المستندات والمرفقات</TabsTrigger>
        </TabsList>

        {/* المعلومات العامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* المعلومات الأساسية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  المعلومات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">اسم المشروع</Label>
                    <div className="text-lg font-semibold mt-1">{project.name}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">العميل</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {project.client}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">الموقع</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {project.location || 'غير محدد'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">الحالة</Label>
                    <Badge variant={statusInfo.variant} className="mt-1">
                      {statusInfo.text}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* التقدم والجدولة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  التقدم والجدولة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>نسبة الإنجاز</span>
                    <span className="font-medium">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-3" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      تاريخ البداية
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDateOnly(project.startDate)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      تاريخ الانتهاء
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDateOnly(project.endDate)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* نظرة عامة + مؤشرات مالية مختصرة */}
        <TabsContent value="overview" className="space-y-6">
          <ProjectOverviewTab
            project={project}
            financialMetrics={{
              contractValue,
              estimatedCost,
              actualCost,
              actualProfit,
              expectedProfit,
              profitMargin,
              financialVariance,
              spentPercentage,
            }}
            financialHealth={
              financialVariance <= 0
                ? 'green'
                : financialVariance <= estimatedCost * 0.1
                  ? 'yellow'
                  : 'red'
            }
            onNavigateTo={handleNavigateTo}
          />
        </TabsContent>

        {/* التكاليف التفصيلية */}
        <TabsContent value="costs" className="space-y-4">
          <ProjectCostsTab
            projectId={project.id}
            relatedTender={relatedTender}
            boqAvailability={boqAvailability}
            onSyncPricing={handleSyncPricingData}
            onImportBOQ={handleImportBOQFromTender}
          />
        </TabsContent>

        {/* مقارنة الميزانية */}
        <TabsContent value="budget" className="space-y-4">
          <ProjectBudgetTab
            budgetComparison={budgetComparison}
            budgetSummary={budgetSummary}
            budgetLoading={budgetLoading}
            relatedTender={relatedTender}
            onSyncPricing={handleSyncPricingData}
            onNavigateToTenders={onSectionChange ? () => onSectionChange('tenders') : undefined}
          />
        </TabsContent>

        {/* الجدول الزمني */}
        <TabsContent value="timeline" className="space-y-4">
          <ProjectTimelineTab
            startDate={project.startDate}
            endDate={project.endDate}
            progress={project.progress || 0}
          />
        </TabsContent>

        {/* المشتريات المرتبطة */}
        <TabsContent value="purchases" className="space-y-4">
          <ProjectPurchasesTab purchaseOrders={purchaseOrders} />
        </TabsContent>

        {/* المستندات والمرفقات */}
        <TabsContent value="attachments" className="space-y-4">
          <ProjectAttachmentsTab projectId={project.id} />
        </TabsContent>
      </Tabs>

      {/* نموذج تعديل المشروع */}
      <ProjectEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        formData={editFormData}
        onFormDataChange={setEditFormData}
        onSave={handleSaveEdit}
      />

      {/* نموذج إضافة مشترى */}
      {/* تأكيد الحذف */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              تأكيد حذف المشروع
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف مشروع &quot;{project?.name}&quot;؟ سيتم حذف جميع البيانات
              المرتبطة.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف المشروع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}

// دالة تطبيع عناصر التسعير للاستخدام في BOQ
// تم نقل normalizePricingItem إلى util مشترك (normalizePricing.ts)
