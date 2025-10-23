// TenderPricingPage drives the full tender pricing workflow and persistence.
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '@/shared/utils/storage/storage'
import { pricingService } from '@/application/services/pricingService'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type {
  MaterialRow,
  LaborRow,
  EquipmentRow,
  SubcontractorRow,
  PricingRow,
  PricingData,
  PricingPercentages,
  ExecutionMethod,
  PricingViewItem,
} from '@/shared/types/pricing'
import { useUnifiedTenderPricing } from '@/application/hooks/useUnifiedTenderPricing'
import type {
  QuantityItem,
  TenderStatsPayload,
  TenderStatsRecord,
  TenderWithPricingSources,
  PricingViewName,
  TenderAttachment,
} from '@/presentation/pages/Tenders/TenderPricing/types'
// (Phase MVP Official/Draft) استيراد الهوك الجديد لإدارة المسودة والنسخة الرسمية
import { useEditableTenderPricing } from '@/application/hooks/useEditableTenderPricing'
// Phase 2 authoring engine adoption helpers (flag-guarded)
import { isPricingEntry } from '@/shared/utils/pricing/pricingHelpers'
import { useDomainPricingEngine } from '@/application/hooks/useDomainPricingEngine'
import { applyDefaultsToPricingMap } from '@/shared/utils/defaultPercentagesPropagation'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import { ConfirmationDialog } from '@/presentation/components/ui/confirmation-dialog'
import { confirmationMessages } from '@/shared/config/confirmationMessages'
import { toast } from 'sonner'
import { useTenderPricingState } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingState'
import { useTenderPricingCalculations } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingCalculations'
import { usePricingTemplates } from '@/presentation/pages/Tenders/TenderPricing/hooks/usePricingTemplates'
import { useTenderPricingBackup } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingBackup'
import { AlertCircle } from 'lucide-react'
import { useTenderPricingPersistence } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingPersistence'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { TenderPricingTabs } from '@/presentation/components/pricing/tender-pricing-process/views/TenderPricingTabs'
import {
  recordAuditEvent,
  type AuditEventLevel,
  type AuditEventStatus,
} from '@/shared/utils/storage/auditLog'
import { PricingHeader } from '@/presentation/pages/Tenders/TenderPricing/components/PricingHeader'
import { RestoreBackupDialog } from '@/presentation/pages/Tenders/TenderPricing/components/RestoreBackupDialog'
import { TemplateManagerDialog } from '@/presentation/pages/Tenders/TenderPricing/components/TemplateManagerDialog'

export type { TenderWithPricingSources } from '@/presentation/pages/Tenders/TenderPricing/types'

// ==== Types ====

type PricingSection = 'materials' | 'labor' | 'equipment' | 'subcontractors' | 'all'
type ActualPricingSection = Exclude<PricingSection, 'all'>
type RawQuantityItem = Partial<QuantityItem> & Record<string, unknown>

interface SectionRowMap {
  materials: MaterialRow
  labor: LaborRow
  equipment: EquipmentRow
  subcontractors: SubcontractorRow
}

type SectionRowField<Section extends ActualPricingSection> = keyof SectionRowMap[Section]

interface TenderPricingProcessProps {
  tender: TenderWithPricingSources
  onBack: () => void
}

type QuantityFormatOptions = Intl.NumberFormatOptions & { locale?: string }

export const TenderPricingProcess: React.FC<TenderPricingProcessProps> = ({ tender, onBack }) => {
  const { formatCurrencyValue } = useCurrencyFormatter()
  const quantityFormatter = useMemo(
    () =>
      new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  )
  const formatQuantity = useCallback(
    (value: number | string | null | undefined, options?: QuantityFormatOptions) => {
      const numeric = typeof value === 'number' ? value : Number(value ?? 0)
      const safeValue = Number.isFinite(numeric) ? numeric : 0
      if (!options) {
        return quantityFormatter.format(safeValue)
      }
      const { locale = 'ar-SA', ...rest } = options
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...rest,
      }).format(safeValue)
    },
    [quantityFormatter],
  )
  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('ar-SA', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [],
  )
  const formatTimestamp = useCallback(
    (value: string | number | Date | null | undefined) => {
      if (value === null || value === undefined) {
        return '—'
      }
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) {
        return '—'
      }
      return timestampFormatter.format(date)
    },
    [timestampFormatter],
  )
  const tenderTitle = tender.title ?? tender.name ?? ''
  const recordPricingAudit = useCallback(
    (
      level: AuditEventLevel,
      action: string,
      metadata?: Record<string, unknown>,
      status?: AuditEventStatus,
    ) => {
      void recordAuditEvent({
        category: 'tender-pricing',
        action,
        key: tender.id ? String(tender.id) : 'unknown-tender',
        level,
        status,
        metadata,
      })
    },
    [tender.id],
  )

  const getErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof Error && error.message) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'unknown-error'
  }, [])
  // using unified storage utils instead of useStorage
  const [pricingData, setPricingData] = useState<Map<string, PricingData>>(new Map())
  // (Official/Draft MVP) دمج الهوك الجديد (قراءة فقط حالياً لعرض حالة الاعتماد)
  const editablePricing = useEditableTenderPricing(tender)
  // Unified BOQ read model to ensure central storage is the primary source for quantity items
  const unifiedPricing = useUnifiedTenderPricing(tender)
  const { items: unifiedItems, source: unifiedSource, status: unifiedStatus } = unifiedPricing
  const {
    currentItemIndex,
    setCurrentItemIndex,
    currentView,
    changeView,
    markDirty,
    isLeaveDialogOpen,
    requestLeave,
    cancelLeaveRequest,
    confirmLeave,
  } = useTenderPricingState({ editablePricing, onBack, tenderId: tender.id })
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false)

  const handleAttemptLeave = requestLeave

  // النسب الافتراضية العامة - MOVED HERE TO FIX TEMPORAL DEAD ZONE
  const [defaultPercentages, setDefaultPercentages] = useState<PricingPercentages>({
    administrative: 5,
    operational: 5,
    profit: 15,
  })
  // Track previous defaults to enable smart propagation (items that still matched old defaults only)
  const previousDefaultsRef = useRef({ administrative: 5, operational: 5, profit: 15 })
  // حالات نصية وسيطة للسماح بالكتابة الحرة ثم الاعتماد عند الخروج من الحقل
  const [defaultPercentagesInput, setDefaultPercentagesInput] = useState({
    administrative: '5',
    operational: '5',
    profit: '15',
  })

  // استخراج بيانات جدول الكميات من المنافسة مع البحث المحسّن
  // MOVED HERE TO FIX TEMPORAL DEAD ZONE - quantityItems must be declared before template callbacks
  const quantityItems: QuantityItem[] = useMemo(() => {
    const toTrimmedString = (value: unknown): string | undefined => {
      if (value === undefined || value === null) return undefined
      const text = String(value).trim()
      return text.length > 0 ? text : undefined
    }

    const toNumberOr = (value: unknown, fallback: number): number => {
      if (typeof value === 'number' && Number.isFinite(value)) return value
      if (typeof value === 'string') {
        const parsed = Number(value)
        if (Number.isFinite(parsed)) return parsed
      }
      return fallback
    }

    const scopeValue = tender?.scope
    const scopeItems = (() => {
      if (!scopeValue || typeof scopeValue === 'string' || Array.isArray(scopeValue)) {
        return undefined
      }
      const candidate = (scopeValue as { items?: QuantityItem[] }).items
      return Array.isArray(candidate) ? (candidate as RawQuantityItem[]) : undefined
    })()

    const asRaw = (source?: QuantityItem[] | null): RawQuantityItem[] | undefined =>
      Array.isArray(source) ? (source as RawQuantityItem[]) : undefined

    const centralCandidate =
      unifiedStatus === 'ready' &&
      unifiedSource === 'central-boq' &&
      Array.isArray(unifiedItems) &&
      unifiedItems.length > 0
        ? (unifiedItems as RawQuantityItem[])
        : undefined

    const candidateSources: (RawQuantityItem[] | undefined)[] = [
      centralCandidate,
      asRaw(tender?.quantityTable ?? undefined),
      asRaw(tender?.quantities ?? undefined),
      asRaw(tender?.items ?? undefined),
      asRaw(tender?.boqItems ?? undefined),
      asRaw(tender?.quantityItems ?? undefined),
      scopeItems,
    ]

    let quantityData: RawQuantityItem[] =
      candidateSources.find((source) => Array.isArray(source) && source.length > 0) ?? []

    if (quantityData.length === 0 && Array.isArray(tender?.attachments)) {
      const quantityAttachment = tender.attachments.find((att: TenderAttachment) => {
        const normalizedName = att.name?.toLowerCase() ?? ''
        return (
          att.type === 'quantity' ||
          normalizedName.includes('كمية') ||
          normalizedName.includes('boq') ||
          normalizedName.includes('quantity')
        )
      })

      if (Array.isArray(quantityAttachment?.data)) {
        quantityData = quantityAttachment.data as RawQuantityItem[]
      }
    }

    const normalizedItems = quantityData.map((item, index) => {
      const indexBasedId = `item-${index + 1}`
      const id =
        toTrimmedString(item.id) ??
        toTrimmedString(item.itemId) ??
        toTrimmedString(item.number) ??
        indexBasedId

      const itemNumber =
        toTrimmedString(item.itemNumber) ??
        toTrimmedString(item.number) ??
        String(index + 1).padStart(2, '0')

      const description =
        toTrimmedString(item.description) ??
        toTrimmedString(item.canonicalDescription) ??
        toTrimmedString((item as Record<string, unknown>).desc) ??
        toTrimmedString(item.name) ??
        ''

      const unit =
        toTrimmedString(item.unit) ??
        toTrimmedString((item as Record<string, unknown>).uom) ??
        'وحدة'
      const quantity = toNumberOr(item.quantity, 1)
      const specifications =
        toTrimmedString(item.specifications) ??
        toTrimmedString((item as Record<string, unknown>).spec) ??
        toTrimmedString((item as Record<string, unknown>).notes) ??
        'حسب المواصفات الفنية'

      const canonicalDescription =
        toTrimmedString(item.canonicalDescription) ??
        toTrimmedString(item.description) ??
        toTrimmedString(item.name) ??
        ''

      const normalizedItem: QuantityItem = {
        id,
        itemNumber,
        description,
        unit,
        quantity,
        specifications,
      }

      if (canonicalDescription) {
        normalizedItem.canonicalDescription = canonicalDescription
      }

      if ('rawDescription' in item) {
        const rawDescription = toTrimmedString((item as Record<string, unknown>).rawDescription)
        if (rawDescription) {
          normalizedItem.rawDescription = rawDescription
        }
      }

      if ('fullDescription' in item) {
        const fullDescription = toTrimmedString((item as Record<string, unknown>).fullDescription)
        if (fullDescription) {
          normalizedItem.fullDescription = fullDescription
        }
      }

      if ('estimated' in item && (item as Record<string, unknown>).estimated !== undefined) {
        normalizedItem.estimated = (item as Record<string, unknown>).estimated
      }

      const maybeUnitPrice = toNumberOr((item as Record<string, unknown>).unitPrice, NaN)
      if (Number.isFinite(maybeUnitPrice)) {
        normalizedItem.unitPrice = maybeUnitPrice
      } else if (
        typeof (item as Record<string, unknown>).estimated === 'object' &&
        (item as Record<string, unknown>).estimated !== null
      ) {
        const estimatedUnitPrice = toNumberOr(
          ((item as Record<string, unknown>).estimated as Record<string, unknown>).unitPrice,
          NaN,
        )
        if (Number.isFinite(estimatedUnitPrice)) {
          normalizedItem.unitPrice = estimatedUnitPrice
        }
      }

      const maybeTotalPrice = toNumberOr((item as Record<string, unknown>).totalPrice, NaN)
      if (Number.isFinite(maybeTotalPrice)) {
        normalizedItem.totalPrice = maybeTotalPrice
      } else if (
        typeof (item as Record<string, unknown>).estimated === 'object' &&
        (item as Record<string, unknown>).estimated !== null
      ) {
        const estimatedTotal = toNumberOr(
          ((item as Record<string, unknown>).estimated as Record<string, unknown>).totalPrice,
          NaN,
        )
        if (Number.isFinite(estimatedTotal)) {
          normalizedItem.totalPrice = estimatedTotal
        }
      }

      return normalizedItem
    })

    return normalizedItems
  }, [tender, unifiedItems, unifiedSource, unifiedStatus])

  // استخدام hook إدارة القوالب بدلاً من الـ handlers المكررة
  const { handleTemplateApply, handleTemplateSave, handleTemplateUpdate, handleTemplateDelete } =
    usePricingTemplates({
      pricingData,
      quantityItems,
      defaultPercentages,
      setPricingData,
      setDefaultPercentages,
      markDirty,
      setTemplateManagerOpen,
      tenderId: tender.id,
    })

  const leaveConfirmationDialog = (
    <ConfirmationDialog
      title={confirmationMessages.leaveDirty.title}
      description={confirmationMessages.leaveDirty.description}
      confirmText={confirmationMessages.leaveDirty.confirmText}
      cancelText={confirmationMessages.leaveDirty.cancelText}
      variant="warning"
      icon="warning"
      onConfirm={confirmLeave}
      onCancel={cancelLeaveRequest}
      open={isLeaveDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          cancelLeaveRequest()
        }
      }}
    />
  )

  // حالات الطي للجداول المختلفة في تبويب الملخص
  const [collapsedSections, setCollapsedSections] = useState<
    Record<
      string,
      {
        materials?: boolean
        labor?: boolean
        equipment?: boolean
        subcontractors?: boolean
        all?: boolean
      }
    >
  >({})

  // دالة لتبديل حالة الطي لقسم معين في بند معين
  const toggleCollapse = (itemId: string, section: PricingSection) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [section]: !prev[itemId]?.[section],
      },
    }))
  }

  const handleViewChange = useCallback(
    (value: PricingViewName) => {
      changeView(value)
    },
    [changeView],
  )

  const [isLoaded, setIsLoaded] = useState(false)

  // Transform pricingData to include id property for domain pricing engine
  const pricingMapWithIds = useMemo(() => {
    const transformedMap = new Map<string, PricingData & { id: string }>()
    pricingData.forEach((data, id) => {
      transformedMap.set(id, { ...data, id })
    })
    return transformedMap
  }, [pricingData])

  // Phase 2.5: Domain pricing engine (UI read path) — optional; no write path yet (moved after quantityItems definition)
  const domainPricing = useDomainPricingEngine({
    tenderId: tender?.id,
    quantityItems,
    pricingMap: pricingMapWithIds,
    defaults: {
      administrative: defaultPercentages.administrative,
      operational: defaultPercentages.operational,
      profit: defaultPercentages.profit,
    },
  })

  // Unified view items list (engine vs legacy) to reduce duplicate recomputation across totals & rendering
  const pricingViewItems = useMemo<PricingViewItem[]>(() => {
    // (Legacy Removal 2025-09-20) المسار القديم أزيل؛ الآن نعتمد فقط على domainPricing.
    // إذا لم يكن جاهزاً (loading أو error) نعيد قائمة بنود مبدئية بدون تسعير.
    if (domainPricing.enabled && domainPricing.status === 'ready') {
      return domainPricing.items as PricingViewItem[]
    }
    return quantityItems.map<PricingViewItem>((q) => ({
      ...q,
      isPriced: false,
      totalPrice: 0,
      unitPrice: 0,
    }))
  }, [domainPricing, quantityItems])

  const currentItem = quantityItems[currentItemIndex]
  const currentItemId = currentItem?.id
  const [currentPricing, setCurrentPricing] = useState<PricingData>({
    materials: [],
    labor: [],
    equipment: [],
    subcontractors: [],
    technicalNotes: '',
    additionalPercentages: {
      administrative: defaultPercentages.administrative,
      operational: defaultPercentages.operational,
      profit: defaultPercentages.profit,
    },
    completed: false,
  })

  const {
    calculateTotals,
    calculateAveragePercentages,
    calculateItemsTotal,
    calculateVAT,
    calculateProjectTotal,
    buildDraftPricingItems,
    calculateTotalAdministrative,
    calculateTotalOperational,
    calculateTotalProfit,
  } = useTenderPricingCalculations({
    currentPricing,
    pricingData,
    quantityItems,
    defaultPercentages,
    pricingViewItems,
    domainPricing,
    tenderId: tender.id,
  })

  const { notifyPricingUpdate, persistPricingAndBOQ, updateTenderStatus, debouncedSave } =
    useTenderPricingPersistence({
      tender,
      pricingData,
      quantityItems,
      defaultPercentages,
      pricingViewItems,
      domainPricing,
      calculateProjectTotal,
      isLoaded,
      currentItemId,
      setPricingData,
      formatCurrencyValue,
    })

  // Custom hook for backup management
  const { backupsList, createBackup, loadBackupsList, restoreBackup } = useTenderPricingBackup({
    tenderId: tender.id,
    tenderTitle,
    pricingData,
    quantityItemsCount: quantityItems.length,
    defaultPercentages,
    calculateProjectTotal,
    setPricingData,
    persistPricingAndBOQ,
    recordAudit: (level, action, details, status) =>
      recordPricingAudit(level as AuditEventLevel, action, details, status as AuditEventStatus),
    getErrorMessage,
  })

  const completedCount = useMemo(
    () => Array.from(pricingData.values()).filter((value) => value?.completed).length,
    [pricingData],
  )

  const completionPercentage = useMemo(() => {
    if (quantityItems.length === 0) {
      return 0
    }
    return (completedCount / quantityItems.length) * 100
  }, [completedCount, quantityItems.length])

  const handleExecutionMethodChange = useCallback(
    (value: ExecutionMethod) => {
      setCurrentPricing((prev) => {
        const next = { ...prev, executionMethod: value }
        markDirty()
        return next
      })
    },
    [markDirty],
  )

  const handlePercentageChange = useCallback(
    (key: keyof PricingPercentages, value: number) => {
      setCurrentPricing((prev) => {
        const next = {
          ...prev,
          additionalPercentages: {
            ...prev.additionalPercentages,
            [key]: Math.max(0, Math.min(100, value)),
          },
        }
        markDirty()
        return next
      })
    },
    [markDirty],
  )

  const handleTechnicalNotesChange = useCallback(
    (value: string) => {
      setCurrentPricing((prev) => {
        const next = { ...prev, technicalNotes: value }
        markDirty()
        return next
      })
    },
    [markDirty],
  )

  // حفظ يدوي للبند الحالي مع رسالة تأكيد وتحقق من صحة البيانات
  const saveCurrentItem = useCallback(() => {
    if (currentItem && isLoaded) {
      const totals = calculateTotals()
      // التحقق من وجود بيانات التسعير
      const hasData =
        currentPricing.materials.length > 0 ||
        currentPricing.labor.length > 0 ||
        currentPricing.equipment.length > 0 ||
        currentPricing.subcontractors.length > 0

      if (!hasData) {
        toast.error('لا توجد بيانات للحفظ', {
          description: 'يرجى إضافة بيانات التسعير قبل الحفظ',
          duration: 4000,
        })
        return
      }

      // تأكيد وسم البند كمكتمل فقط عند الحفظ الصريح
      const itemToSave: PricingData = { ...currentPricing, completed: true }
      const newMap = new Map(pricingData)
      newMap.set(currentItem.id, itemToSave)
      setPricingData(newMap)
      setCurrentPricing(itemToSave)

      // حساب التفاصيل المالية
      const itemTotals = {
        materials: itemToSave.materials.reduce((sum, mat) => sum + (mat.total || 0), 0),
        labor: itemToSave.labor.reduce((sum, lab) => sum + (lab.total || 0), 0),
        equipment: itemToSave.equipment.reduce((sum, eq) => sum + (eq.total || 0), 0),
        subcontractors: itemToSave.subcontractors.reduce((sum, sub) => sum + (sub.total || 0), 0),
      }

      const subtotal = Object.values(itemTotals).reduce((sum, val) => sum + val, 0)
      const unitPrice = totals.total / currentItem.quantity

      // حفظ في قاعدة البيانات
      void pricingService.saveTenderPricing(tender.id, {
        pricing: Array.from(newMap.entries()),
        defaultPercentages,
        lastUpdated: new Date().toISOString(),
      })
      // مزامنة لقطة BOQ المركزية بعد الحفظ اليدوي
      void persistPricingAndBOQ(newMap)
      // (Legacy Snapshot Removed) حذف إنشاء snapshot اليدوي.

      // حفظ تفاصيل البند في التخزين الموحد للتطبيق
      void saveToStorage(`tender-${tender.id}-pricing-item-${currentItem.id}`, {
        tenderId: tender.id,
        tenderTitle,
        itemId: currentItem.id,
        itemNumber: currentItem.itemNumber,
        description: currentItem.description,
        specifications: currentItem.specifications,
        unit: currentItem.unit,
        quantity: currentItem.quantity,
        pricingData: itemToSave,
        breakdown: itemTotals,
        subtotal: subtotal,
        additionalCosts: {
          administrative: totals.administrative,
          operational: totals.operational,
          profit: totals.profit,
        },
        unitPrice: unitPrice,
        totalValue: totals.total,
        executionMethod: currentPricing.executionMethod ?? 'ذاتي',
        technicalNotes: currentPricing.technicalNotes ?? '',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: 'completed',
        version: 1, // لتتبع إصدارات التسعير
      })

      // تحديث إحصائيات المنافسة
      const completionPercentage = (newMap.size / quantityItems.length) * 100
      const projectTotal = calculateProjectTotal()
      const statsPayload: TenderStatsPayload = {
        totalItems: quantityItems.length,
        pricedItems: newMap.size,
        completionPercentage: completionPercentage,
        totalValue: projectTotal,
        averageUnitPrice:
          projectTotal / quantityItems.reduce((sum, item) => sum + item.quantity, 0),
        lastUpdated: new Date().toISOString(),
      }
      // حفظ الإحصائيات بشكل مجمّع تحت STORAGE_KEYS.TENDER_STATS
      void (async () => {
        const allStats = await loadFromStorage<TenderStatsRecord>(STORAGE_KEYS.TENDER_STATS, {})
        allStats[tender.id] = statsPayload
        await saveToStorage(STORAGE_KEYS.TENDER_STATS, allStats)
      })()

      // عرض رسالة تأكيد مفصلة
      toast.success('تم الحفظ بنجاح', {
        description: `تم حفظ تسعير البند رقم ${currentItem.itemNumber} - القيمة: ${formatCurrencyValue(totals.total)}`,
        duration: 4000,
      })

      // إرسال إشعار تحديث للصفحات الأخرى (مثل صفحة تفاصيل المنافسة)
      notifyPricingUpdate()

      // تحديث حالة المنافسة فوراً بعد حفظ البند
      updateTenderStatus()
      recordPricingAudit('info', 'status-updated-after-save', {
        itemId: currentItem.id,
        completion: completionPercentage,
      })
    }
  }, [
    currentItem,
    currentPricing,
    pricingData,
    tender.id,
    isLoaded,
    quantityItems,
    calculateTotals,
    calculateProjectTotal,
    defaultPercentages,
    notifyPricingUpdate,
    persistPricingAndBOQ,
    recordPricingAudit,
    updateTenderStatus,
    tenderTitle,
    formatCurrencyValue,
  ])

  const handleNavigatePrev = useCallback(() => {
    if (currentItemIndex > 0) {
      saveCurrentItem()
      setCurrentItemIndex(currentItemIndex - 1)
    }
  }, [currentItemIndex, saveCurrentItem, setCurrentItemIndex])

  const handleNavigateNext = useCallback(() => {
    if (currentItemIndex < quantityItems.length - 1) {
      saveCurrentItem()
      setCurrentItemIndex(currentItemIndex + 1)
    }
  }, [currentItemIndex, quantityItems.length, saveCurrentItem, setCurrentItemIndex])

  // تحميل بيانات التسعير الافتراضية عند فتح الصفحة لأول مرة
  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const loaded = await pricingService.loadTenderPricing(tender.id)
        if (!mounted) return
        if (loaded) {
          const entries = Array.isArray(loaded.pricing) ? loaded.pricing.filter(isPricingEntry) : []
          setPricingData(new Map(entries))
          if (loaded.defaultPercentages) {
            setDefaultPercentages(loaded.defaultPercentages)
            setDefaultPercentagesInput({
              administrative: String(loaded.defaultPercentages.administrative ?? ''),
              operational: String(loaded.defaultPercentages.operational ?? ''),
              profit: String(loaded.defaultPercentages.profit ?? ''),
            })
          }
        } else {
          setPricingData(new Map())
        }
      } finally {
        if (mounted) setIsLoaded(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [tender.id])

  // تحميل بيانات التسعير للبند الحالي أو تهيئة بنود جديدة بالنسب الافتراضية
  useEffect(() => {
    if (!currentItem) return
    const saved = pricingData.get(currentItem.id)
    if (saved) {
      setCurrentPricing(saved)
    } else {
      setCurrentPricing({
        materials: [],
        labor: [],
        equipment: [],
        subcontractors: [],
        technicalNotes: '',
        additionalPercentages: {
          administrative: defaultPercentages.administrative,
          operational: defaultPercentages.operational,
          profit: defaultPercentages.profit,
        },
        completed: false,
      })
    }
  }, [currentItem, pricingData, defaultPercentages])

  // تطبيق النسب الافتراضية على البنود الموجودة
  const applyDefaultPercentagesToExistingItems = useCallback(() => {
    const updatedPricingData = new Map<string, PricingData>(pricingData)
    let updatedCount = 0

    pricingData.forEach((itemPricing, itemId) => {
      const updatedPricing: PricingData = {
        ...itemPricing,
        additionalPercentages: {
          administrative: defaultPercentages.administrative,
          operational: defaultPercentages.operational,
          profit: defaultPercentages.profit,
        },
      }

      updatedPricingData.set(itemId, updatedPricing)
      if (currentItem?.id === itemId) {
        setCurrentPricing(updatedPricing)
      }
      updatedCount += 1
    })

    setPricingData(updatedPricingData)
    void pricingService.saveTenderPricing(tender.id, {
      pricing: Array.from(updatedPricingData.entries()),
      defaultPercentages,
      lastUpdated: new Date().toISOString(),
    })
    void persistPricingAndBOQ(updatedPricingData)

    try {
      editablePricing.markDirty?.()
    } catch (error) {
      recordPricingAudit(
        'warning',
        'mark-dirty-after-defaults',
        {
          message: error instanceof Error ? error.message : 'unknown-error',
        },
        'skipped',
      )
    }

    toast.success(`تم تحديث النسب لـ ${updatedCount} بند`, {
      description: 'تم تطبيق النسب الافتراضية الجديدة على جميع البنود الموجودة',
      duration: 4000,
    })
  }, [
    currentItem,
    defaultPercentages,
    editablePricing,
    persistPricingAndBOQ,
    pricingData,
    recordPricingAudit,
    setCurrentPricing,
    setPricingData,
    tender.id,
  ])

  // حفظ النسب الافتراضية عند تعديلها لضمان اعتمادها للبنود الجديدة والجلسات القادمة
  useEffect(() => {
    if (!isLoaded) return

    const previousDefaults = previousDefaultsRef.current
    const defaultsChanged =
      previousDefaults.administrative !== defaultPercentages.administrative ||
      previousDefaults.operational !== defaultPercentages.operational ||
      previousDefaults.profit !== defaultPercentages.profit

    let mapForPersistence: Map<string, PricingData> = pricingData

    if (defaultsChanged && pricingData.size > 0) {
      const { updated, changedCount } = applyDefaultsToPricingMap(
        pricingData,
        previousDefaults,
        defaultPercentages,
      )
      if (changedCount > 0) {
        mapForPersistence = updated
        setPricingData(updated)
        void persistPricingAndBOQ(updated)
        recordPricingAudit('info', 'defaults-propagated', { changedCount })
      } else {
        void persistPricingAndBOQ(pricingData)
        recordPricingAudit('info', 'defaults-propagated', { changedCount: 0 }, 'skipped')
      }
    } else {
      void persistPricingAndBOQ(pricingData)
    }

    previousDefaultsRef.current = { ...defaultPercentages }

    void pricingService.saveTenderPricing(tender.id, {
      pricing: Array.from(mapForPersistence.entries()),
      defaultPercentages,
      lastUpdated: new Date().toISOString(),
    })
    // (Legacy Snapshot System Removed 2025-09): حذف منطق إنشاء/ترحيل snapshot نهائياً.
  }, [
    defaultPercentages,
    isLoaded,
    persistPricingAndBOQ,
    pricingData,
    recordPricingAudit,
    tender.id,
  ])

  // ملاحظة: تم إزالة دالة تنسيق العملة غير المستخدمة بعد تبسيط بطاقات الملخص.

  // تشغيل الحفظ التلقائي عند تغيير البيانات
  useEffect(() => {
    if (isLoaded && currentItemId) {
      debouncedSave(currentPricing)
    }
  }, [currentPricing, debouncedSave, isLoaded, currentItemId])

  // (Official/Draft MVP) حفظ مسودة تلقائي (debounced على مستوى الخريطة الكاملة)
  useEffect(() => {
    if (!isLoaded) return
    if (editablePricing.status !== 'ready') return
    if (pricingData.size === 0) return
    const t = setTimeout(() => {
      try {
        const items = buildDraftPricingItems()
        const totals = { totalValue: calculateProjectTotal() }
        if (editablePricing.saveDraft) {
          void editablePricing.saveDraft(items, totals, 'auto')
        }
      } catch (e) {
        recordPricingAudit(
          'warning',
          'autosave-draft-failed',
          {
            message: e instanceof Error ? e.message : 'unknown-error',
          },
          'error',
        )
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [
    pricingData,
    isLoaded,
    editablePricing,
    buildDraftPricingItems,
    calculateProjectTotal,
    recordPricingAudit,
  ])

  // (Official/Draft MVP) حفظ مسودة دوري كل 45 ثانية
  useEffect(() => {
    if (!isLoaded) return
    if (editablePricing.status !== 'ready') return
    const interval = setInterval(() => {
      try {
        const items = buildDraftPricingItems()
        const totals = { totalValue: calculateProjectTotal() }
        if (editablePricing.saveDraft) {
          void editablePricing.saveDraft(items, totals, 'auto')
        }
      } catch (e) {
        recordPricingAudit(
          'warning',
          'autosave-draft-interval-failed',
          {
            message: e instanceof Error ? e.message : 'unknown-error',
          },
          'error',
        )
      }
    }, 45000)
    return () => clearInterval(interval)
  }, [isLoaded, editablePricing, buildDraftPricingItems, calculateProjectTotal, recordPricingAudit])

  // تحذير عند محاولة مغادرة الصفحة مع تغييرات غير معتمدة رسمياً
  useEffect(() => {
    if (editablePricing.status !== 'ready') return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editablePricing.dirty || editablePricing.isDraftNewer) {
        const message = confirmationMessages.leaveDirty.description
        e.preventDefault()
        e.returnValue = message // لبعض المتصفحات
        return message
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [editablePricing])

  // تحديث حالة المنافسة عند تحميل المكون لأول مرة فقط
  useEffect(() => {
    if (!isLoaded) return

    updateTenderStatus()
    recordPricingAudit('info', 'pricing-session-started', {
      tenderId: tender.id,
    })
    toast.info('تم بدء عملية التسعير', {
      description: `تم تحديث حالة المنافسة "${tenderTitle}" إلى "تحت الإجراء"`,
      duration: 3000,
    })
  }, [isLoaded, tender.id, tenderTitle, updateTenderStatus, recordPricingAudit])

  const clampValue = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

  const toNonNegativeNumber = (input: unknown): number => {
    const parsed = Number(input)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0
    }
    return parsed
  }

  const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100

  const calculateRowTotal = (
    type: ActualPricingSection,
    row: MaterialRow | LaborRow | EquipmentRow | SubcontractorRow,
  ): number => {
    const quantity = toNonNegativeNumber(row.quantity)
    const price = toNonNegativeNumber(row.price ?? 0)

    if (type === 'materials') {
      const materialRow = row as MaterialRow
      const wastePercentage = materialRow.hasWaste
        ? clampValue(toNonNegativeNumber(materialRow.wastePercentage ?? 0), 0, 100)
        : 0
      const wasteMultiplier = materialRow.hasWaste ? 1 + wastePercentage / 100 : 1
      return roundToTwoDecimals(quantity * price * wasteMultiplier)
    }

    return roundToTwoDecimals(quantity * price)
  }

  const recalculateRow = <Section extends ActualPricingSection>(
    type: Section,
    row: SectionRowMap[Section],
  ): SectionRowMap[Section] => ({
    ...row,
    total: calculateRowTotal(type, row),
  })

  const sanitizeRowValue = <
    Section extends ActualPricingSection,
    Field extends SectionRowField<Section>,
  >(
    type: Section,
    field: Field,
    value: SectionRowMap[Section][Field],
  ): SectionRowMap[Section][Field] => {
    if (field === 'quantity' || field === 'price') {
      return toNonNegativeNumber(value) as SectionRowMap[Section][Field]
    }

    if (type === 'materials' && field === 'wastePercentage') {
      const sanitized = clampValue(toNonNegativeNumber(value), 0, 100)
      return sanitized as SectionRowMap[Section][Field]
    }

    return value
  }

  const mutateSectionRows = <Section extends ActualPricingSection>(
    data: PricingData,
    section: Section,
    mutate: (rows: SectionRowMap[Section][]) => SectionRowMap[Section][],
  ): PricingData => {
    switch (section) {
      case 'materials':
        return { ...data, materials: mutate(data.materials) }
      case 'labor':
        return { ...data, labor: mutate(data.labor) }
      case 'equipment':
        return { ...data, equipment: mutate(data.equipment) }
      case 'subcontractors':
        return { ...data, subcontractors: mutate(data.subcontractors) }
      default:
        return data
    }
  }

  // إنشاء صف فارغ
  const createEmptyRow = <Section extends ActualPricingSection>(
    type: Section,
  ): SectionRowMap[Section] => {
    const baseRow: PricingRow = {
      id: Date.now().toString(),
      description: '',
      unit: 'وحدة',
      quantity: 1,
      price: 0,
      total: 0,
    }

    if (type === 'materials') {
      const materialRow: MaterialRow = {
        ...baseRow,
        name: '',
        hasWaste: false,
        wastePercentage: 10,
      }
      return materialRow as SectionRowMap[Section]
    }

    return baseRow as SectionRowMap[Section]
  }

  // إضافة صف جديد
  const addRow = <Section extends ActualPricingSection>(type: Section) => {
    setCurrentPricing((prev) =>
      mutateSectionRows(prev, type, (rows) => {
        const newRow = createEmptyRow(type)
        if ((type === 'materials' || type === 'subcontractors') && currentItem) {
          newRow.quantity = currentItem.quantity
        }
        return [...rows, recalculateRow(type, newRow)]
      }),
    )
    markDirty()

    // تحديث فوري للحالة عند إضافة أول صف (يعني بدء العمل)
    updateTenderStatus()
    recordPricingAudit('info', 'status-updated-after-add-row', {
      section: type,
      itemId: currentItem?.id ?? 'unknown',
    })
  }

  // حذف صف
  const deleteRow = <Section extends ActualPricingSection>(type: Section, id: string) => {
    setCurrentPricing((prev) =>
      mutateSectionRows(prev, type, (rows) => rows.filter((row) => row.id !== id)),
    )
    markDirty()
  }

  // تحديث صف مع معالجة محسنة للأخطاء والتحقق من صحة البيانات
  const updateRow = <Section extends ActualPricingSection, Field extends SectionRowField<Section>>(
    type: Section,
    id: string,
    field: Field,
    value: SectionRowMap[Section][Field],
  ) => {
    try {
      setCurrentPricing((prev) =>
        mutateSectionRows(prev, type, (rows) =>
          rows.map((row) => {
            if (row.id !== id) {
              return row
            }

            const sanitizedValue = sanitizeRowValue(type, field, value)
            const nextRow: SectionRowMap[Section] = {
              ...row,
              [field]: sanitizedValue,
            }

            if (type === 'materials') {
              const materialRow = nextRow as MaterialRow
              if (field === 'hasWaste' && !sanitizedValue) {
                materialRow.hasWaste = false
                materialRow.wastePercentage = 0
              }
            }

            return recalculateRow(type, nextRow)
          }),
        ),
      )

      // تحديث فوري للحالة بعد تعديل البيانات
      updateTenderStatus()
      recordPricingAudit('info', 'status-updated-after-edit', {
        section: type,
        itemId: currentItem?.id ?? 'unknown',
        rowId: id,
      })
      markDirty()
    } catch (error) {
      recordPricingAudit(
        'error',
        'row-update-failed',
        {
          section: type,
          itemId: currentItem?.id ?? 'unknown',
          rowId: id,
          field,
          message: getErrorMessage(error),
        },
        'error',
      )
      toast.error('خطأ في تحديث البيانات', {
        description: 'حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى.',
        duration: 4000,
      })
    }
  }

  // وظائف التحرير من تبويب الملخص - Optimized for performance
  const addRowFromSummary = (itemId: string, section: ActualPricingSection) => {
    const itemIndex = pricingViewItems.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) return

    setCurrentItemIndex(itemIndex)

    // Update pricing data directly without setTimeout
    setCurrentPricing((prev) => {
      const newRow = createEmptyRow(section)
      const currentItem = pricingViewItems[itemIndex]

      if ((section === 'materials' || section === 'subcontractors') && currentItem) {
        newRow.quantity = currentItem.quantity
      }

      return mutateSectionRows(prev, section, (rows) => {
        return [...rows, recalculateRow(section, newRow)]
      })
    })

    markDirty()
    updateTenderStatus()

    toast.success(
      `تم إضافة صف جديد في ${
        section === 'materials'
          ? 'المواد'
          : section === 'labor'
            ? 'العمالة'
            : section === 'equipment'
              ? 'المعدات'
              : 'المقاولين من الباطن'
      }`,
    )
  }

  const updateRowFromSummary = (
    itemId: string,
    section: ActualPricingSection,
    rowId: string,
    field: string,
    value: unknown,
  ) => {
    const itemIndex = pricingViewItems.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) return

    setCurrentItemIndex(itemIndex)

    // Update directly without setTimeout for immediate response
    setCurrentPricing((prev) =>
      mutateSectionRows(prev, section, (rows) =>
        rows.map((row) => {
          if (row.id !== rowId) {
            return row
          }

          const sanitizedValue = sanitizeRowValue(
            section,
            field as keyof SectionRowMap[typeof section],
            value as string | number | undefined,
          )
          const updated = { ...row, [field]: sanitizedValue }
          return recalculateRow(section, updated)
        }),
      ),
    )

    // Mark dirty will trigger debounced save
    markDirty()
  }

  const deleteRowFromSummary = (itemId: string, section: ActualPricingSection, rowId: string) => {
    const itemIndex = pricingViewItems.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) return

    setCurrentItemIndex(itemIndex)

    // Delete immediately without setTimeout
    setCurrentPricing((prev) =>
      mutateSectionRows(prev, section, (rows) => rows.filter((row) => row.id !== rowId)),
    )

    toast.success('تم حذف الصف بنجاح')
  }

  // تصدير البيانات إلى Excel
  const exportPricingToExcel = useCallback(() => {
    try {
      const exportData = quantityItems.map((item) => {
        const itemPricing = pricingData.get(item.id)
        const totals = {
          materials: (itemPricing?.materials ?? []).reduce((sum, mat) => sum + (mat.total ?? 0), 0),
          labor: (itemPricing?.labor ?? []).reduce((sum, lab) => sum + (lab.total ?? 0), 0),
          equipment: (itemPricing?.equipment ?? []).reduce((sum, eq) => sum + (eq.total ?? 0), 0),
          subcontractors: (itemPricing?.subcontractors ?? []).reduce(
            (sum, sub) => sum + (sub.total ?? 0),
            0,
          ),
        }

        const subtotal = totals.materials + totals.labor + totals.equipment + totals.subcontractors
        const unitPrice = itemPricing ? subtotal / item.quantity : 0

        return {
          'رقم البند': item.itemNumber,
          'وصف البند': item.description,
          الوحدة: item.unit,
          الكمية: item.quantity,
          'سعر الوحدة': unitPrice.toFixed(2),
          'القيمة الإجمالية': subtotal.toFixed(2),
          'حالة التسعير': itemPricing ? 'مكتمل' : 'لم يبدأ',
        }
      })

      // هنا يمكن إضافة منطق التصدير الفعلي
      toast.info('جاري تطوير وظيفة التصدير', {
        description: 'هذه الوظيفة قيد التطوير وستكون متاحة قريباً',
        duration: 4000,
      })

      recordPricingAudit('info', 'export-pricing-requested', {
        items: exportData.length,
      })
    } catch (error) {
      recordPricingAudit(
        'error',
        'export-pricing-failed',
        {
          message: getErrorMessage(error),
        },
        'error',
      )
      toast.error('خطأ في التصدير', {
        description: 'حدث خطأ أثناء إعداد البيانات للتصدير',
        duration: 4000,
      })
    }
  }, [quantityItems, pricingData, recordPricingAudit, getErrorMessage])

  if (!currentItem) {
    return (
      <>
        <div className="p-6 max-w-4xl mx-auto" dir="rtl">
          <EmptyState
            icon={AlertCircle}
            title="لا توجد بنود للتسعير"
            description="يجب إضافة جدول الكميات للمناقصة قبل البدء في عملية التسعير."
            actionLabel="العودة"
            onAction={handleAttemptLeave}
          />
        </div>
        {leaveConfirmationDialog}
      </>
    )
  }

  const currentItemCompleted = Boolean(currentPricing.completed)

  const summaryViewProps = {
    quantityItems,
    pricingData,
    defaultPercentages,
    defaultPercentagesInput,
    setDefaultPercentagesInput,
    setDefaultPercentages,
    applyDefaultPercentagesToExistingItems,
    setCurrentItemIndex,
    setCurrentView: (view: 'summary' | 'pricing' | 'technical') => handleViewChange(view),
    formatCurrencyValue,
    formatQuantity,
    calculateProjectTotal,
    calculateAveragePercentages,
    calculateTotalAdministrative,
    calculateTotalOperational,
    calculateTotalProfit,
    calculateItemsTotal,
    calculateVAT,
    collapsedSections,
    toggleCollapse,
    addRowFromSummary,
    updateRowFromSummary,
    deleteRowFromSummary,
  } as const

  const pricingViewProps = {
    currentItem,
    currentPricing,
    calculateTotals,
    formatCurrency: formatCurrencyValue,
    formatQuantity: (value: string | number | null | undefined) => formatQuantity(value),
    onExecutionMethodChange: handleExecutionMethodChange,
    onPercentageChange: handlePercentageChange,
    onTechnicalNotesChange: handleTechnicalNotesChange,
    onAddRow: addRow,
    onUpdateRow: (section: string, id: string, field: string, value: unknown) => {
      const typedSection = section as ActualPricingSection
      type Field = keyof SectionRowMap[typeof typedSection]
      updateRow(
        typedSection,
        id,
        field as Field,
        value as SectionRowMap[typeof typedSection][Field],
      )
    },
    onDeleteRow: deleteRow,
    onSave: saveCurrentItem,
    onNavigatePrev: handleNavigatePrev,
    onNavigateNext: handleNavigateNext,
    canNavigatePrev: currentItemIndex > 0,
    canNavigateNext: currentItemIndex < quantityItems.length - 1,
    currentItemIndex,
    totalItems: quantityItems.length,
  } as const

  const technicalViewProps = {
    tenderId: tender?.id || '',
  } as const

  return (
    <div className="p-4 max-w-7xl mx-auto" dir="rtl">
      {/* Header Component */}
      <PricingHeader
        tender={tender}
        editablePricing={editablePricing}
        pricingData={pricingData}
        quantityItemsCount={quantityItems.length}
        onBack={handleAttemptLeave}
        onTemplateManagerOpen={() => setTemplateManagerOpen(true)}
        onSaveCurrentItem={saveCurrentItem}
        onCreateBackup={createBackup}
        onRestoreBackupOpen={() => {
          setRestoreOpen(true)
          void loadBackupsList()
        }}
        onExportToExcel={exportPricingToExcel}
        onUpdateStatus={updateTenderStatus}
        recordAudit={(level, action, metadata, status) =>
          recordPricingAudit(level as AuditEventLevel, action, metadata, status as AuditEventStatus)
        }
        getErrorMessage={getErrorMessage}
      />

      {/* Restore Backup Dialog Component */}
      <RestoreBackupDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        backupsList={backupsList}
        onLoadBackupsList={loadBackupsList}
        onRestoreBackup={restoreBackup}
        formatCurrencyValue={formatCurrencyValue}
        formatTimestamp={formatTimestamp}
      />

      <TenderPricingTabs
        currentView={currentView}
        onViewChange={handleViewChange}
        completionPercentage={completionPercentage}
        currentItemCompleted={currentItemCompleted}
        summaryProps={summaryViewProps}
        pricingProps={pricingViewProps}
        technicalProps={technicalViewProps}
      />
      {leaveConfirmationDialog}

      {/* Pricing Template Manager Dialog */}
      <TemplateManagerDialog
        open={templateManagerOpen}
        onOpenChange={setTemplateManagerOpen}
        onSelectTemplate={handleTemplateApply}
        onCreateTemplate={handleTemplateSave}
        onUpdateTemplate={handleTemplateUpdate}
        onDeleteTemplate={handleTemplateDelete}
      />
    </div>
  )
}

// Export alias for compatibility
export { TenderPricingProcess as TenderPricingPage }
