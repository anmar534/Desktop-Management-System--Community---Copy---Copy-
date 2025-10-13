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

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
// (Tooltip components removed with legacy CostsTable cleanup)
import { PageLayout, EmptyState } from './PageLayout'
import { 
  Building2,
  Calendar,
  DollarSign,
  User,
  MapPin,
  AlertTriangle,
  Edit,
  Trash2,
  BarChart3,
  Package,
  FileText,
  Link as LinkIcon
} from 'lucide-react'
import { useFinancialState } from '@/application/context'
import { SimplifiedProjectCostView } from './cost/SimplifiedProjectCostView'
import { useExpenses } from '@/application/hooks/useExpenses'
import { formatCurrency } from '../data/centralData'
import { toast } from 'sonner'
import type { Tender } from '@/data/centralData'
import type { PurchaseOrder } from '@/types/contracts'
import { getBOQRepository, getPurchaseOrderRepository, getTenderRepository } from '@/application/services/serviceRegistry'
import { useBOQ } from '@/application/hooks/useBOQ'
import { APP_EVENTS, emit } from '@/events/bus'
import { buildPricingMap } from '../utils/normalizePricing'
import { safeLocalStorage, whenStorageReady } from '../utils/storage'
import { projectBudgetService } from '@/application/services/projectBudgetService'
import type { ProjectBudgetComparison } from '@/application/services/projectBudgetService'
// Removed unused Expense type (legacy cost table eliminated)

// ===============================
// 📎 أنواع مساعدة داخلية للمرفقات وتكاليف الجدول
// ===============================

interface ProjectAttachment {
  id: string
  name: string
  size: number
  mimeType: string
  uploadedAt: string
  contentBase64: string
}

// Legacy CostRow interface removed (superseded by ProjectCostView domain model)

// واجهة البيانات
interface ProjectDetailsProps {
  projectId: string
  onBack: () => void
  onSectionChange?: (section: string) => void
}

// واجهة بيانات النموذج
interface EditFormData {
  name: string
  client: string
  description: string
  location: string
  budget: number
  contractValue?: number  // قيمة العقد (الإيرادات)
  estimatedCost?: number  // التكلفة التقديرية (الميزانية المخططة)
  expectedProfit?: number // الربح المتوقع
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'paused' | 'completed' | 'delayed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  progress: number
}

export function EnhancedProjectDetails({ projectId, onBack, onSectionChange }: ProjectDetailsProps) {
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
  const [isUploading, setIsUploading] = useState(false)
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([])
  const [boqRefreshTick, setBoqRefreshTick] = useState(0)
  const [boqAvailability, setBoqAvailability] = useState({ hasProjectBOQ: false, hasTenderBOQ: false })
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [relatedTender, setRelatedTender] = useState<Tender | null>(null)
  const quantityFormatter = useMemo(() => new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }), [])
  const formatQuantity = useCallback((value: number | string | null | undefined) => {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0)
    const safeValue = Number.isFinite(numeric) ? numeric : 0
    return quantityFormatter.format(safeValue)
  }, [quantityFormatter])
  const timestampFormatter = useMemo(() => new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'short',
    timeStyle: 'short',
  }), [])
  const formatTimestamp = useCallback((value: string | number | Date | null | undefined) => {
    if (value === null || value === undefined) {
      return '—'
    }
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '—'
    }
    return timestampFormatter.format(date)
  }, [timestampFormatter])
  const dateOnlyFormatter = useMemo(() => new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }), [])
  const formatDateOnly = useCallback((value: string | number | Date | null | undefined, fallback = 'غير محدد') => {
    if (value === null || value === undefined) {
      return fallback
    }
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return fallback
    }
    return dateOnlyFormatter.format(date)
  }, [dateOnlyFormatter])
  
  // بيانات النموذج للتحرير
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    client: '',
    description: '',
    location: '',
    budget: 0,
    contractValue: 0,
    estimatedCost: 0,
    expectedProfit: 0,
    startDate: '',
    endDate: '',
    status: 'active',
    priority: 'medium',
    progress: 0
  })

  // البحث عن المشروع
  const project = projects.find(p => p.id === projectId)

  const currentProjectId = project?.id ?? ''
  const currentTenderId = relatedTender?.id
  const { syncWithPricingData } = useBOQ({
    projectId: currentProjectId,
    tenderId: currentTenderId,
    purchaseOrders
  })

  useEffect(() => {
    console.log('🧭 [EnhancedProjectDetails] relatedTender resolved:', relatedTender?.id ?? '<none>', 'for project', project?.id ?? '<none>')
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
        const tenderPromise = typeof tenderRepository.getByProjectId === 'function'
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
      if ((currentProjectId && detail.projectId === currentProjectId) || (currentTenderId && detail.tenderId === currentTenderId)) {
        setBoqRefreshTick(v => v + 1)
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
        const tenderPromise = currentTenderId ? boqRepository.getByTenderId(currentTenderId) : Promise.resolve(null)
        const [projectBOQ, tenderBOQ] = await Promise.all([projectPromise, tenderPromise])

        if (!cancelled) {
          setBoqAvailability({
            hasProjectBOQ: Boolean(projectBOQ),
            hasTenderBOQ: Boolean(tenderBOQ?.items?.length)
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
              lastUpdated: new Date().toISOString()
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
        items: tenderBOQ.items.map(item => ({
          ...item,
          originalId: item.id,
          actualQuantity: item.actualQuantity ?? item.quantity,
          actualUnitPrice: item.actualUnitPrice ?? item.unitPrice
        })),
        projectId: project.id,
        tenderId: undefined,
        lastUpdated: new Date().toISOString()
      }

      await boqRepository.createOrUpdate(projectBOQ as any)
      toast.success('تم استيراد جدول الكميات من المنافسة إلى هذا المشروع')
      setBoqRefreshTick(v => v + 1)
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
        setBoqRefreshTick(v => v + 1)
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
      const { repairBOQ } = await import('../utils/normalizePricing')
      const result = repairBOQ(projectBOQ, pricingMap)

      if (result.updated && result.repairedItems > 0) {
        // تحديث BOQ بالبيانات المصلحة
        const updatedBOQ = {
          ...projectBOQ,
          items: result.newItems,
          lastUpdated: new Date().toISOString()
        }
        await boqRepository.createOrUpdate(updatedBOQ as any)
        
        // حذف مفتاح الإصلاح لإعادة تطبيقه
        const { safeLocalStorage } = await import('../utils/storage')
        safeLocalStorage.removeItem(`boq_repair_applied_${projectBOQ.id}`)
        
        setBoqRefreshTick(v => v + 1)
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

  // مفاتيح التخزين للمرفقات والتكاليف التقديرية
  const ATTACHMENTS_KEY = project ? `project_attachments_${project.id}` : ''
  // Removed: legacy local cost plan key (superseded by cost envelopes)

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
        expectedProfit: project.expectedProfit || 0,
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        status: project.status || 'active',
        priority: project.priority || 'medium',
        progress: project.progress || 0
      })
    }
  }, [project])

  // تحميل المرفقات (تمت إزالة تحميل خطة التكلفة القديمة)
  useEffect(() => {
    if (!project) return
    try {
      const savedAtt = safeLocalStorage.getItem<ProjectAttachment[]>(ATTACHMENTS_KEY, [])
      setAttachments(savedAtt)
    } catch (error) {
      console.warn('تعذر تحميل المرفقات المخزنة محلياً:', error)
    }
  }, [projectId, project, ATTACHMENTS_KEY])
  
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
          projectBudgetService.getProjectBudgetSummary(currentProjectId)
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
  // 📎 إدارة المرفقات (رفع/عرض/حذف/تنزيل)
  // ===============================
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result as string
      const base64 = res.includes(',') ? res.split(',')[1] : res
      resolve(base64)
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!project) return
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const base64 = await toBase64(file)
      const att: ProjectAttachment = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        contentBase64: base64
      }
      const updated = [...attachments, att]
      setAttachments(updated)
      safeLocalStorage.setItem(ATTACHMENTS_KEY, updated)
      toast.success('تم رفع الملف بنجاح')
    } catch (err) {
      console.error(err)
      toast.error('فشل في رفع الملف')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const refreshAttachments = () => {
    if (!project) return
    const saved = safeLocalStorage.getItem<ProjectAttachment[]>(ATTACHMENTS_KEY, [])
    setAttachments(saved)
  }

  const handleDeleteAttachment = (id: string) => {
    const updated = attachments.filter(a => a.id !== id)
    setAttachments(updated)
    safeLocalStorage.setItem(ATTACHMENTS_KEY, updated)
  }

  const handleDownloadAttachment = (att: ProjectAttachment) => {
    try {
      const dataUrl = `data:${att.mimeType};base64,${att.contentBase64}`
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = att.name
      a.click()
    } catch (e) {
      console.error(e)
      toast.error('تعذر تنزيل الملف')
    }
  }

  // الإحصائيات السريعة
  const quickStats = [
    {
      label: 'نسبة الإنجاز',
      value: `${project.progress || 0}%`,
      trend: 'up' as const,
      trendValue: '+5.2%',
      color: 'text-success',
      bgColor: 'bg-success/10 dark:bg-success/20'
    },
    {
      label: 'التكلفة الفعلية',
      value: formatCurrency(actualCost),
      trend: 'up' as const,
      trendValue: `${spentPercentage.toFixed(1)}%`,
      color: 'text-info',
      bgColor: 'bg-info/10 dark:bg-info/20'
    },
    {
      label: 'الربح الفعلي',
      value: formatCurrency(actualProfit),
      trend: actualProfit >= expectedProfit ? 'up' as const : 'down' as const,
      trendValue: `${profitMargin.toFixed(1)}%`,
      color: actualProfit >= 0 ? 'text-success' : 'text-destructive',
      bgColor: actualProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'
    },
    {
      label: 'عدد المشتريات',
      value: projectExpenses.length.toString(),
      trend: 'stable' as const,
      trendValue: '0',
      color: 'text-accent',
      bgColor: 'bg-accent/10 dark:bg-accent/20'
    }
    ,
    {
      label: 'الانحراف المالي',
      value: `${financialVariance >= 0 ? '+' : ''}${formatCurrency(financialVariance)}`,
      trend: financialVariance <= 0 ? 'up' as const : 'down' as const,
      trendValue: financialVariance.toFixed(0),
      color: financialVariance <= 0 ? 'text-success' : 'text-destructive',
      bgColor: financialVariance <= 0 ? 'bg-success/10' : 'bg-destructive/10'
    }
  ]

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'تعديل المشروع',
      icon: Edit,
      onClick: () => setShowEditDialog(true),
      primary: true
    },
    {
      label: 'إعادة مزامنة التسعير',
      icon: () => <span>🔄</span>,
      onClick: handleSyncPricingData,
      variant: 'default' as const
    },
    {
      label: 'حذف المشروع',
      icon: Trash2,
      onClick: () => setShowDeleteDialog(true),
      variant: 'outline' as const
    }
  ]

  // دوال المعالجة
  const handleSaveEdit = async () => {
    try {
      const updatedProject = {
        ...project,
        ...editFormData,
        updatedAt: new Date().toISOString()
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
        return { text: 'متوقف مؤقتاً', variant: 'secondary' as const, color: 'text-muted-foreground' }
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
                    <Label className="text-sm font-medium text-muted-foreground">تاريخ البداية</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDateOnly(project.startDate)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">تاريخ الانتهاء</Label>
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
                      <Button variant="ghost" size="sm" className="px-2" onClick={() => handleNavigateTo('clients')}>
                        <LinkIcon className="h-4 w-4" />
                        <span className="sr-only">فتح العميل</span>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">الموقع</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {project.location || 'غير محدد'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">الحالة</Label>
                      <div className="mt-1">
                        <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">نسبة الإنجاز</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={project.progress || 0} className="h-2 w-40" />
                        <span className="text-sm font-medium">{project.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ملخص مالي سريع */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  ملخص مالي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">قيمة العقد (الإيرادات)</span>
                    <span className="font-semibold text-info">{formatCurrency(contractValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">التكلفة التقديرية (الميزانية المخططة)</span>
                    <span className="font-semibold text-warning">{formatCurrency(estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">التكلفة الفعلية</span>
                    <span className="font-semibold text-destructive">{formatCurrency(actualCost)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm text-muted-foreground">الربح الفعلي</span>
                    <span className={`font-semibold ${actualProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(actualProfit)} ({profitMargin.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">الانحراف المالي</span>
                    <span className={`font-semibold ${financialVariance <= 0 ? 'text-success' : 'text-destructive'}`}>
                      {financialVariance >= 0 ? '+' : ''}{formatCurrency(financialVariance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* التكاليف التفصيلية */}
        <TabsContent value="costs" className="space-y-4">
          <div className="space-y-4">
            {relatedTender && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-muted bg-muted/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  أدوات تسعير المشروع
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={handleSyncPricingData}>
                    🔄 إعادة مزامنة التسعير
                  </Button>
                  {!boqAvailability.hasProjectBOQ && boqAvailability.hasTenderBOQ && (
                    <Button size="sm" onClick={handleImportBOQFromTender}>
                      📥 استيراد BOQ من المنافسة
                    </Button>
                  )}
                </div>
              </div>
            )}

            <SimplifiedProjectCostView projectId={project.id} tenderId={relatedTender?.id} />
            <div className="text-xs text-muted-foreground leading-relaxed border border-dashed border-muted rounded-lg px-4 py-3">
              تم تطبيق العرض المبسط الجديد لإدارة التكاليف المستوحى من تصميم صفحات التسعير في المناقصات. التصميم يركز على الوضوح والبساطة.
            </div>
          </div>
        </TabsContent>

        {/* مقارنة الميزانية */}
        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  مقارنة الميزانية - التقديرية مقابل الفعلية
                </CardTitle>
                {relatedTender && (
                  <Button size="sm" variant="secondary" onClick={handleSyncPricingData}>
                    🔄 إعادة مزامنة التسعير
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {budgetLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">جاري تحميل بيانات المقارنة...</p>
                  </div>
                </div>
              ) : budgetSummary ? (
                <div className="space-y-6">
                  {/* ملخص المقارنة */}
                  <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/10 p-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-info">{budgetSummary.totalItems}</div>
                      <div className="text-sm text-muted-foreground">إجمالي البنود</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${budgetSummary.totalVariance > 0 ? 'text-destructive' : budgetSummary.totalVariance < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                        {budgetSummary.totalVariancePercentage > 0 ? '+' : ''}{budgetSummary.totalVariancePercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">إجمالي الفارق</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">{budgetSummary.overBudgetItems}</div>
                      <div className="text-sm text-muted-foreground">بنود تجاوزت الميزانية</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{budgetSummary.criticalAlerts}</div>
                      <div className="text-sm text-muted-foreground">تنبيهات حرجة</div>
                    </div>
                  </div>

                  {/* جدول المقارنة التفصيلي */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-muted/20">
                          <th className="border border-border p-2 text-right">البند</th>
                          <th className="border border-border p-2 text-center">الوحدة</th>
                          <th className="border border-border p-2 text-center">الكمية</th>
                          <th className="border border-border p-2 text-center">التكلفة التقديرية</th>
                          <th className="border border-border p-2 text-center">التكلفة الفعلية</th>
                          <th className="border border-border p-2 text-center">الفارق</th>
                          <th className="border border-border p-2 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetComparison.map((item) => (
                          <tr key={item.itemId} className="transition-colors hover:bg-muted/40">
                            <td className="border border-border p-2">
                              <div className="font-medium">{item.description}</div>
                              {item.variance.alerts.length > 0 && (
                                <div className="mt-1 text-xs text-warning">
                                  {item.variance.alerts.map((alert, i) => (
                                    <div key={i}>{alert}</div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="border border-border p-2 text-center">{item.unit}</td>
                            <td className="border border-border p-2 text-center">{formatQuantity(item.quantity)}</td>
                            <td className="border border-border p-2 text-center">
                              <div className="text-sm">
                                <div>{formatCurrency(item.estimated.total)}</div>
                                <div className="text-xs text-muted-foreground">
                                  ({formatCurrency(item.estimated.unitPrice)}/وحدة)
                                </div>
                              </div>
                            </td>
                            <td className="border border-border p-2 text-center">
                              <div className="text-sm">
                                <div>{formatCurrency(item.actual.total)}</div>
                                <div className="text-xs text-muted-foreground">
                                  ({formatCurrency(item.actual.unitPrice)}/وحدة)
                                </div>
                              </div>
                            </td>
                            <td className="border border-border p-2 text-center">
                              <div className={`font-medium ${
                                item.variance.amount > 0 ? 'text-destructive' : 
                                item.variance.amount < 0 ? 'text-success' : 'text-muted-foreground'
                              }`}>
                                {item.variance.amount > 0 ? '+' : ''}{formatCurrency(item.variance.amount)}
                              </div>
                              <div className={`text-xs ${
                                item.variance.percentage > 0 ? 'text-destructive' : 
                                item.variance.percentage < 0 ? 'text-success' : 'text-muted-foreground'
                              }`}>
                                ({item.variance.percentage > 0 ? '+' : ''}{item.variance.percentage.toFixed(1)}%)
                              </div>
                            </td>
                            <td className="border border-border p-2 text-center">
                              <Badge 
                                variant={
                                  item.variance.status === 'over-budget' ? 'destructive' : 
                                  item.variance.status === 'under-budget' ? 'secondary' : 'outline'
                                }
                                className={item.variance.status === 'under-budget' ? 'bg-success/10 text-success' : ''}
                              >
                                {item.variance.status === 'over-budget' ? 'تجاوز الميزانية' :
                                 item.variance.status === 'under-budget' ? 'توفير' : 'ضمن الميزانية'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={AlertTriangle}
                  title="لا توجد بيانات مقارنة"
                  description={`لعرض مقارنة الميزانية، يجب ربط المشروع بمنافسة مكتملة التسعير${relatedTender ? ` (المنافسة الحالية: ${relatedTender.name})` : ''}.`}
                  {...(onSectionChange
                    ? {
                        actionLabel: 'إدارة المنافسات',
                        onAction: () => onSectionChange('tenders')
                      }
                    : {})}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الجدول الزمني */}
        <TabsContent value="timeline" className="space-y-4">
          <TimelineCard project={{ startDate: project.startDate, endDate: project.endDate, progress: project.progress || 0 }} />
        </TabsContent>

        {/* المشتريات المرتبطة */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                أوامر الشراء المرتبطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PurchasesTable orders={purchaseOrders} formatDateOnly={formatDateOnly} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* المستندات والمرفقات */}
        <TabsContent value="attachments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                المستندات والمرفقات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <input aria-label="رفع ملف" type="file" onChange={handleFileUpload} disabled={isUploading} />
                <Button variant="outline" size="sm" onClick={() => refreshAttachments()}>
                  تحديث القائمة
                </Button>
              </div>
              <AttachmentsList
                attachments={attachments}
                onDelete={handleDeleteAttachment}
                onDownload={handleDownloadAttachment}
                formatTimestamp={formatTimestamp}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نموذج تعديل المشروع */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المشروع</DialogTitle>
            <DialogDescription>
              تحديث بيانات ومعلومات المشروع
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم المشروع *</Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="client">العميل *</Label>
                <Input
                  id="client"
                  value={editFormData.client}
                  onChange={(e) => setEditFormData(prev => ({...prev, client: e.target.value}))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">وصف المشروع</Label>
              <Textarea
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({...prev, description: e.target.value}))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">الموقع</Label>
                <Input
                  id="location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData(prev => ({...prev, location: e.target.value}))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractValue">قيمة العقد (الإيرادات) - ريال</Label>
                <Input
                  id="contractValue"
                  type="number"
                  value={editFormData.contractValue ?? editFormData.budget ?? 0}
                  onChange={(e) => setEditFormData(prev => ({...prev, contractValue: Number(e.target.value)}))}
                />
              </div>
              <div>
                <Label htmlFor="estimatedCost">التكلفة التقديرية (الميزانية المخططة) - ريال</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  value={editFormData.estimatedCost ?? 0}
                  onChange={(e) => setEditFormData(prev => ({...prev, estimatedCost: Number(e.target.value)}))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData(prev => ({...prev, startDate: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">تاريخ الانتهاء</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData(prev => ({...prev, endDate: e.target.value}))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">الحالة</Label>
                <Select value={editFormData.status} onValueChange={(value: any) => 
                  setEditFormData(prev => ({...prev, status: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">تحت التخطيط</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="paused">متوقف مؤقتاً</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="delayed">متأخر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">الأولوية</Label>
                <Select value={editFormData.priority} onValueChange={(value: any) => 
                  setEditFormData(prev => ({...prev, priority: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="critical">حرجة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="progress">نسبة الإنجاز (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={editFormData.progress}
                  onChange={(e) => setEditFormData(prev => ({...prev, progress: Number(e.target.value)}))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveEdit}>
              حفظ التحديثات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              هل أنت متأكد من حذف مشروع &quot;{project?.name}&quot;؟ سيتم حذف جميع البيانات المرتبطة.
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

// (Removed legacy CostsTable component – superseded by ProjectCostView)

// ===============================
// 🧾 جدول المشتريات المرتبطة
// ===============================
function PurchasesTable(props: { orders: any[]; formatDateOnly: (value: string | number | Date | null | undefined, fallback?: string) => string }) {
  const { orders, formatDateOnly } = props
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>رقم أمر الشراء</TableHead>
          <TableHead>المورد/العميل</TableHead>
          <TableHead>التاريخ</TableHead>
          <TableHead>المبلغ</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>بنود</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(orders || []).map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-medium">{o.id}</TableCell>
            <TableCell>{o.client || '—'}</TableCell>
            <TableCell>{formatDateOnly(o.createdDate, '—')}</TableCell>
            <TableCell className="font-medium">{formatCurrency(o.value || 0)}</TableCell>
            <TableCell><Badge variant="secondary">{o.status || '—'}</Badge></TableCell>
            <TableCell>{o.items?.length || 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ===============================
// ⏱️ الجدول الزمني (Timeline)
// ===============================
function TimelineCard(props: { project: { startDate: string; endDate: string; progress: number } }) {
  const { startDate, endDate, progress } = props.project
  const start = startDate ? new Date(startDate).getTime() : Date.now()
  const end = endDate ? new Date(endDate).getTime() : (start + 30 * 24 * 3600 * 1000)
  const dateFormatter = new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  // تقسيم تقريبي للمراحل
  const planning = Math.round((0.2 * 100))
  const execution = Math.round((0.7 * 100))
  const handover = 100 - planning - execution
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          الجدول الزمني
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground flex justify-between">
          <span>البداية: {dateFormatter.format(new Date(start))}</span>
          <span>النهاية: {dateFormatter.format(new Date(end))}</span>
        </div>
        <div className="w-full h-4 rounded overflow-hidden flex">
          <div className="h-full bg-info flex-[2]" title="تخطيط" />
          <div className="h-full bg-success flex-[7]" title="تنفيذ" />
          <div className="h-full bg-warning flex-[1]" title="تسليم" />
        </div>
        <div className="text-sm flex justify-between">
          <span>تخطيط: {planning}%</span>
          <span>تنفيذ: {execution}%</span>
          <span>تسليم: {handover}%</span>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1"><span>نسبة الإنجاز</span><span>{progress}%</span></div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}

// ===============================
// 📎 قائمة المرفقات
// ===============================
function AttachmentsList(props: {
  attachments: ProjectAttachment[]
  onDelete: (id: string) => void
  onDownload: (att: ProjectAttachment) => void
  formatTimestamp: (value: string | number | Date | null | undefined) => string
}) {
  const { attachments, onDelete, onDownload, formatTimestamp } = props
  if (!attachments || attachments.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="لا توجد مرفقات"
        description="ابدأ برفع ملفات المشروع لحفظ الوثائق المهمة في مكان واحد."
      />
    )
  }
  return (
    <div className="space-y-2">
      {attachments.map(att => (
        <div key={att.id} className="flex items-center justify-between border rounded-md p-2">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{att.name}</span>
              <span className="text-xs text-muted-foreground">{formatTimestamp(att.uploadedAt)} • {(att.size/1024).toFixed(1)} ك.ب</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onDownload(att)}>تحميل</Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(att.id)}>حذف</Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// دالة تطبيع عناصر التسعير للاستخدام في BOQ
// تم نقل normalizePricingItem إلى util مشترك (normalizePricing.ts)
