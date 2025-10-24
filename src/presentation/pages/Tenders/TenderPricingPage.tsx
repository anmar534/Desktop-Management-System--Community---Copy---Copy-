// TenderPricingPage drives the full tender pricing workflow and persistence.
import { pricingService } from '@/application/services/pricingService'
import { exportTenderPricingToExcel } from '@/presentation/pages/Tenders/TenderPricing/utils/exportUtils'
import { formatTimestamp as formatTimestampUtil } from '@/presentation/pages/Tenders/TenderPricing/utils/dateUtils'
import { parseQuantityItems } from '@/presentation/pages/Tenders/TenderPricing/utils/parseQuantityItems'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type {
  MaterialRow,
  LaborRow,
  EquipmentRow,
  SubcontractorRow,
  PricingData,
  PricingPercentages,
  PricingViewItem,
} from '@/shared/types/pricing'
import { useUnifiedTenderPricing } from '@/application/hooks/useUnifiedTenderPricing'
import type {
  QuantityItem,
  TenderWithPricingSources,
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
import { useTenderPricingBackup } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingBackup'
import { usePricingRowOperations } from '@/presentation/pages/Tenders/TenderPricing/hooks/usePricingRowOperations'
import { useSummaryOperations } from '@/presentation/pages/Tenders/TenderPricing/hooks/useSummaryOperations'
import { useItemNavigation } from '@/presentation/pages/Tenders/TenderPricing/hooks/useItemNavigation'
import { usePricingEventHandlers } from '@/presentation/pages/Tenders/TenderPricing/hooks/usePricingEventHandlers'
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

export type { TenderWithPricingSources } from '@/presentation/pages/Tenders/TenderPricing/types'

// ==== Types ====

type PricingSection = 'materials' | 'labor' | 'equipment' | 'subcontractors' | 'all'
type ActualPricingSection = Exclude<PricingSection, 'all'>

interface SectionRowMap {
  materials: MaterialRow
  labor: LaborRow
  equipment: EquipmentRow
  subcontractors: SubcontractorRow
}

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

  // Use imported timestamp formatter utility
  const formatTimestamp = useCallback(
    (value: string | number | Date | null | undefined) => formatTimestampUtil(value),
    [],
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
  // Uses parseQuantityItems utility for complex parsing logic
  const quantityItems: QuantityItem[] = useMemo(
    () => parseQuantityItems(tender, unifiedItems, unifiedSource, unifiedStatus),
    [tender, unifiedItems, unifiedSource, unifiedStatus],
  )

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

  // Event handlers hook - manages simple form event handlers
  const {
    handleViewChange,
    handleExecutionMethodChange,
    handlePercentageChange,
    handleTechnicalNotesChange,
  } = usePricingEventHandlers({
    setCurrentPricing,
    markDirty,
    changeView,
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

  const completedCount = useMemo(() => {
    // Count ONLY items explicitly marked as completed (saved items)
    return Array.from(pricingData.values()).filter((value) => value?.completed === true).length
  }, [pricingData])

  const completionPercentage = useMemo(() => {
    if (quantityItems.length === 0) {
      return 0
    }
    return (completedCount / quantityItems.length) * 100
  }, [completedCount, quantityItems.length])

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

  // تتبع آخر itemId لمنع auto-save عند التنقل بين البنود
  const lastItemIdRef = useRef<string | undefined>(undefined)

  // تشغيل الحفظ التلقائي عند تغيير البيانات - لكن ليس عند تحميل بند جديد
  useEffect(() => {
    if (!isLoaded || !currentItemId) return

    // إذا تغير البند، تحديث الـ ref وتجاهل debouncedSave
    if (lastItemIdRef.current !== currentItemId) {
      lastItemIdRef.current = currentItemId
      return // ← تجاهل debouncedSave عند تحميل بند جديد
    }

    // الآن فقط عند تعديل نفس البند
    debouncedSave(currentPricing)
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

  // Row operations hook - manages add, update, delete operations for pricing rows
  const { addRow, deleteRow, updateRow } = usePricingRowOperations({
    setCurrentPricing,
    currentItem,
    markDirty,
    updateTenderStatus,
    recordPricingAudit,
    getErrorMessage,
  })

  // Summary operations hook - manages row operations from summary view
  const { addRowFromSummary, updateRowFromSummary, deleteRowFromSummary, saveDirectPrice } =
    useSummaryOperations({
      pricingViewItems,
      setCurrentItemIndex,
      addRow,
      updateRow,
      deleteRow,
      markDirty,
      updateTenderStatus,
      pricingData,
      setPricingData,
      currentPricing,
    })

  // Item navigation hook - manages saving and navigation between items
  const { saveCurrentItem, saveItemById, handleNavigatePrev, handleNavigateNext } =
    useItemNavigation({
      currentItem,
      currentItemIndex,
      setCurrentItemIndex,
      currentPricing,
      setCurrentPricing,
      pricingData,
      setPricingData,
      quantityItems,
      isLoaded,
      tenderId: tender.id,
      tenderTitle,
      defaultPercentages,
      calculateTotals,
      calculateProjectTotal,
      formatCurrencyValue,
      persistPricingAndBOQ,
      notifyPricingUpdate,
      updateTenderStatus,
      recordPricingAudit,
    })

  // تصدير البيانات إلى Excel (using utility function)
  const exportPricingToExcel = useCallback(() => {
    exportTenderPricingToExcel({
      quantityItems: quantityItems.map((item) => ({
        id: item.id,
        itemNumber: item.itemNumber,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
      })),
      pricingData,
      recordAudit: (level, action, metadata, status) =>
        recordPricingAudit(level as AuditEventLevel, action, metadata, status as AuditEventStatus),
      getErrorMessage,
    })
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
    onSaveItem: saveItemById,
    onSaveDirectPrice: (itemId: string, unitPrice: number) => {
      const item = quantityItems.find((q) => q.id === itemId)
      if (item) {
        saveDirectPrice(itemId, unitPrice, item.quantity)
      }
    },
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
    </div>
  )
}

// Export alias for compatibility
export { TenderPricingProcess as TenderPricingPage }
