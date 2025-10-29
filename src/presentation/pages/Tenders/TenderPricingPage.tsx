// TenderPricingPage drives the full tender pricing workflow and persistence.
import { pricingService } from '@/application/services/pricingService'
import { exportTenderPricingToExcel } from '@/presentation/pages/Tenders/TenderPricing/utils/exportUtils'
import { formatTimestamp as formatTimestampUtil } from '@/presentation/pages/Tenders/TenderPricing/utils/dateUtils'
import { parseQuantityItems } from '@/presentation/pages/Tenders/TenderPricing/utils/parseQuantityItems'
import {
  createQuantityFormatter,
  createPricingAuditLogger,
  getErrorMessage,
  DEFAULT_PRICING_PERCENTAGES,
  percentagesToInputStrings,
} from '@/presentation/pages/Tenders/TenderPricing/utils/tenderPricingHelpers'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import type { PricingData, PricingPercentages, PricingViewItem } from '@/shared/types/pricing'
// Zustand Store for unified pricing state management
import { useTenderPricingStore } from '@/stores/tenderPricingStore'
import type {
  QuantityItem,
  TenderWithPricingSources,
  PricingSection,
  ActualPricingSection,
  SectionRowMap,
} from '@/presentation/pages/Tenders/TenderPricing/types'
import type { Tender } from '@/data/centralData'
// Phase 2 authoring engine adoption helpers (flag-guarded)
import { useDomainPricingEngine } from '@/application/hooks/useDomainPricingEngine'
// REMOVED: applyDefaultsToPricingMap - no longer auto-applying after Draft removal
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
import { TenderPricingRepository } from '@/infrastructure/repositories/TenderPricingRepository.js'
import { APP_EVENTS } from '@/events/bus.js'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { TenderPricingTabs } from '@/presentation/components/pricing/tender-pricing-process/views/TenderPricingTabs'
import { type AuditEventLevel, type AuditEventStatus } from '@/shared/utils/storage/auditLog'
import { PricingHeader } from '@/presentation/pages/Tenders/TenderPricing/components/PricingHeader'
import { RestoreBackupDialog } from '@/presentation/pages/Tenders/TenderPricing/components/RestoreBackupDialog'

export type { TenderWithPricingSources } from '@/presentation/pages/Tenders/TenderPricing/types'

// ==== Types ====

interface TenderPricingProcessProps {
  tender: TenderWithPricingSources
  onBack: () => void
}

export const TenderPricingProcess: React.FC<TenderPricingProcessProps> = ({ tender, onBack }) => {
  const { formatCurrencyValue } = useCurrencyFormatter()

  // Create formatters
  const formatQuantity = useMemo(() => createQuantityFormatter(), [])
  const formatTimestamp = useCallback(
    (value: string | number | Date | null | undefined) => formatTimestampUtil(value),
    [],
  )

  // Create audit logger
  const tenderTitle = tender.title ?? tender.name ?? ''
  const recordPricingAudit = useMemo(() => createPricingAuditLogger(tender.id), [tender.id])
  // using unified storage utils instead of useStorage
  const [pricingData, setPricingData] = useState<Map<string, PricingData>>(new Map())
  // Zustand Store: unified BOQ and pricing state
  const {
    boqItems,
    loadPricing,
    savePricing: storeSavePricing,
    isDirty,
    markDirty: storeMarkDirty,
  } = useTenderPricingStore()

  // Load pricing data when component mounts or tender changes
  useEffect(() => {
    if (tender?.id) {
      void loadPricing(tender.id)
    }
  }, [tender?.id, loadPricing])

  const {
    currentItemIndex,
    setCurrentItemIndex,
    currentView,
    changeView,
    markDirty: _markDirtyFromHook,
    isLeaveDialogOpen,
    requestLeave,
    cancelLeaveRequest,
    confirmLeave,
  } = useTenderPricingState({ isDirty, onBack, tenderId: tender.id })
  const [restoreOpen, setRestoreOpen] = useState(false)

  // Use store's markDirty instead of the no-op one from hook
  const markDirty = storeMarkDirty

  const handleAttemptLeave = requestLeave

  // Default pricing percentages with input state
  const [defaultPercentages, setDefaultPercentages] = useState<PricingPercentages>(
    DEFAULT_PRICING_PERCENTAGES,
  )
  const [defaultPercentagesInput, setDefaultPercentagesInput] = useState(
    percentagesToInputStrings(DEFAULT_PRICING_PERCENTAGES),
  )

  // استخراج بيانات جدول الكميات من المنافسة مع البحث المحسّن
  // Uses Zustand Store boqItems as primary source, with fallback to legacy parseQuantityItems
  const quantityItems: QuantityItem[] = useMemo(() => {
    // If Store has data, use it directly (preferred path)
    if (boqItems && boqItems.length > 0) {
      return boqItems.map((item, index) => ({
        id: item.id || `item-${index + 1}`,
        itemNumber: String(index + 1).padStart(2, '0'),
        description: item.description || '',
        unit: item.unit || 'وحدة',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        specifications: 'حسب المواصفات الفنية',
        canonicalDescription: item.description || '',
      }))
    }

    // Fallback: use parseQuantityItems with legacy data
    // This will be removed in Week 6 (Legacy Cleanup)
    return parseQuantityItems(tender, [], 'legacy', 'loading')
  }, [boqItems, tender])

  // Wrapper to pass pricingData and quantityItems to store before saving
  const savePricing = useCallback(async () => {
    await storeSavePricing(pricingData, quantityItems)
  }, [storeSavePricing, pricingData, quantityItems])

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

  // === Phase 2.3: Repository-based persistence replacing useTenderPricingPersistence hook ===
  const tenderPricingRepository = useMemo(() => new TenderPricingRepository(), [])

  const notifyPricingUpdate = useCallback(async () => {
    // Dispatch event to notify other components of pricing updates
    // ONLY called after explicit Save action
    window.dispatchEvent(
      new CustomEvent(APP_EVENTS.TENDER_UPDATED, {
        detail: {
          tenderId: tender.id,
          skipRefresh: true, // Don't reload the page - changes already in memory
        },
      }),
    )
  }, [tender.id])

  const persistPricingAndBOQ = useCallback(
    async (updatedPricingData: Map<string, PricingData>) => {
      await tenderPricingRepository.persistPricingAndBOQ(
        tender.id,
        updatedPricingData,
        quantityItems,
        defaultPercentages,
      )
      await notifyPricingUpdate()
    },
    [tenderPricingRepository, tender.id, quantityItems, defaultPercentages, notifyPricingUpdate],
  )

  const updateTenderStatus = useCallback(
    async (newStatus?: string) => {
      const completedCount = Array.from(pricingData.values()).filter(
        (p) => p?.completed === true,
      ).length
      const totalValue = calculateProjectTotal()

      // If newStatus provided, just use repository logic. Otherwise calculate from completedCount
      if (newStatus === undefined) {
        await tenderPricingRepository.updateTenderStatus(
          tender.id,
          completedCount,
          quantityItems.length,
          totalValue,
        )
      } else {
        // Manual status override (not typical, but keeping for compatibility)
        const tenderRepo = (
          await import('@/application/services/serviceRegistry')
        ).getTenderRepository()
        await tenderRepo.update(tender.id, { status: newStatus as unknown as Tender['status'] })
      }
    },
    [tenderPricingRepository, tender.id, quantityItems.length, pricingData, calculateProjectTotal],
  )

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

  // تحميل بيانات التسعير الكاملة من pricingService
  // Store يخزن فقط BOQ (الأساسيات)، pricingService يخزن التفاصيل الكاملة
  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        console.log(
          '[TenderPricingPage] Loading pricing from pricingService for tender:',
          tender.id,
        )
        const loaded = await pricingService.loadTenderPricing(tender.id)
        console.log(
          '[TenderPricingPage] Loaded pricing data:',
          loaded
            ? {
                hasPricing: !!loaded.pricing,
                pricingCount: loaded.pricing?.length || 0,
                hasDefaultPercentages: !!loaded.defaultPercentages,
              }
            : 'null',
        )

        if (!mounted) return

        if (loaded && loaded.pricing) {
          // Use saved pricing data from pricingService
          const pricingMap = new Map(loaded.pricing) as Map<string, PricingData>
          console.log('[TenderPricingPage] Setting pricingData with', pricingMap.size, 'items')
          setPricingData(pricingMap)

          if (loaded.defaultPercentages) {
            setDefaultPercentages(loaded.defaultPercentages)
            setDefaultPercentagesInput({
              administrative: String(loaded.defaultPercentages.administrative ?? ''),
              operational: String(loaded.defaultPercentages.operational ?? ''),
              profit: String(loaded.defaultPercentages.profit ?? ''),
            })
          }
        } else {
          // No saved pricing - use empty Map
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
      const item = quantityItems.find((q) => q.id === itemId)
      if (!item) return

      // Update percentages for all items
      let updatedPricing: PricingData = {
        ...itemPricing,
        additionalPercentages: {
          administrative: defaultPercentages.administrative,
          operational: defaultPercentages.operational,
          profit: defaultPercentages.profit,
        },
      }

      // If this is a direct pricing item, recalculate based on NEW percentages
      // KEEPING SUBTOTAL CONSTANT, NOT TOTAL PRICE
      if (itemPricing.pricingMethod === 'direct' && itemPricing.directUnitPrice) {
        const oldPercentages = itemPricing.derivedPercentages ||
          itemPricing.additionalPercentages || {
            administrative: 0,
            operational: 0,
            profit: 0,
          }

        // Calculate original subtotal from old percentages
        const oldTotalPercentage =
          oldPercentages.administrative + oldPercentages.operational + oldPercentages.profit
        const oldItemTotal = itemPricing.directUnitPrice * item.quantity
        const subtotal = oldItemTotal / (1 + oldTotalPercentage / 100)

        // Calculate NEW total based on subtotal + new percentages
        const newTotalPercentage =
          defaultPercentages.administrative +
          defaultPercentages.operational +
          defaultPercentages.profit
        const newItemTotal = subtotal * (1 + newTotalPercentage / 100)
        const newUnitPrice = item.quantity > 0 ? newItemTotal / item.quantity : 0

        updatedPricing = {
          ...updatedPricing,
          directUnitPrice: newUnitPrice,
          derivedPercentages: {
            administrative: defaultPercentages.administrative,
            operational: defaultPercentages.operational,
            profit: defaultPercentages.profit,
          },
        }
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
    // Don't call persistPricingAndBOQ here - this is not the main Save button
    // User must click Save to persist changes
    // void persistPricingAndBOQ(updatedPricingData)

    try {
      markDirty()
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
      description: 'تم إعادة حساب الأسعار بناءً على النسب الجديدة مع الحفاظ على التكلفة الأساسية',
      duration: 4000,
    })
  }, [
    currentItem,
    defaultPercentages,
    pricingData,
    quantityItems,
    recordPricingAudit,
    setCurrentPricing,
    setPricingData,
    tender.id,
    markDirty,
  ])

  // REMOVED: Auto-save useEffect for defaultPercentages - causes infinite loop
  // كان هذا useEffect يحفظ تلقائياً عند تغيير النسب الافتراضية
  // مما يسبب حلقة لانهائية بعد إزالة Draft System
  //
  // النسب الافتراضية سيتم حفظها الآن فقط عند:
  // 1. الضغط على زر "حفظ" صراحةً
  // 2. الضغط على زر "اعتماد" لتقديم العرض

  // ملاحظة: تم إزالة دالة تنسيق العملة غير المستخدمة بعد تبسيط بطاقات الملخص.

  // REMOVED: Auto-save useEffect - causes infinite loop after Draft System removal
  // كان هذا useEffect يستدعي debouncedSave() عند كل تغيير في currentPricing
  // مما يسبب حلقة لانهائية: change → save → event → reload → change again
  //
  // الحفظ الآن فقط عند الضغط على زر "حفظ" أو "اعتماد" صراحةً

  // Domain pricing integration (removed auto-save logic)

  // تحذير عند محاولة مغادرة الصفحة مع تغييرات غير محفوظة
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if user has entered any pricing data (not necessarily saved)
      if (pricingData.size > 0) {
        const message = confirmationMessages.leaveDirty.description
        e.preventDefault()
        e.returnValue = message // لبعض المتصفحات
        return message
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pricingData.size])

  // REMOVED: Auto-update tender status on load - causes unnecessary saves
  // تحديث حالة المنافسة عند تحميل المكون كان يستدعي tenderRepo.update() بدون skipRefresh
  // مما يسبب حفظ تلقائي وحلقة لانهائية
  //
  // الآن: حالة المنافسة تُحدّث فقط عند الضغط على "حفظ" أو "اعتماد"

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
  }, [quantityItems, pricingData, recordPricingAudit])

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
        isDirty={isDirty}
        pricingData={pricingData}
        quantityItemsCount={quantityItems.length}
        onBack={handleAttemptLeave}
        onSave={savePricing}
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
