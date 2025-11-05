// TenderPricingPage drives the full tender pricing workflow and persistence.
// Week 4 Day 3: pricingService import removed - no longer used for saveDefaultPercentages
import { exportTenderPricingToExcel } from '@/presentation/pages/Tenders/TenderPricing/utils/exportUtils'
import { parseQuantityItems } from '@/presentation/pages/Tenders/TenderPricing/utils/parseQuantityItems'
import {
  createQuantityFormatter,
  createPricingAuditLogger,
  getErrorMessage,
} from '@/presentation/pages/Tenders/TenderPricing/utils/tenderPricingHelpers'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import type { PricingData, PricingViewItem } from '@/shared/types/pricing'
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
// Phase 2 authoring engine adoption helpers
import { useDomainPricingEngine } from '@/application/hooks/useDomainPricingEngine'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import { ConfirmationDialog } from '@/presentation/components/ui/confirmation-dialog'
import { confirmationMessages } from '@/shared/config/confirmationMessages'
import { toast } from 'sonner'
import { useTenderPricingState } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingState'
// ✅ Migrated to unified pricing calculations (Single Source of Truth)
import { usePricingCalculations } from '@/shared/hooks/usePricingCalculations'
// import { useTenderPricingCalculations } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingCalculations' // LEGACY - replaced
import { usePricingRowOperations } from '@/presentation/pages/Tenders/TenderPricing/hooks/usePricingRowOperations'
import { useSummaryOperations } from '@/presentation/pages/Tenders/TenderPricing/hooks/useSummaryOperations'
import { useItemNavigation } from '@/presentation/pages/Tenders/TenderPricing/hooks/useItemNavigation'
import { usePricingEventHandlers } from '@/presentation/pages/Tenders/TenderPricing/hooks/usePricingEventHandlers'
import { usePricingForm } from '@/presentation/pages/Tenders/TenderPricing/hooks/usePricingForm'
import { usePricingValidation } from '@/presentation/pages/Tenders/TenderPricing/hooks/usePricingValidation'
import { AlertCircle } from 'lucide-react'
// Week 4 Day 3: tenderPricingRepository import removed - using Store.savePricing() instead
import { APP_EVENTS } from '@/events/bus.js'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { TenderPricingTabs } from '@/presentation/components/pricing/tender-pricing-process/views/TenderPricingTabs'
import { type AuditEventLevel, type AuditEventStatus } from '@/shared/utils/storage/auditLog'
import { PricingHeader } from '@/presentation/pages/Tenders/TenderPricing/components/PricingHeader'
import { useScrollToTop } from '@/shared/hooks/useScrollToTop'

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

  // Create audit logger
  const tenderTitle = tender.title ?? tender.name ?? ''
  const recordPricingAudit = useMemo(() => createPricingAuditLogger(tender.id), [tender.id])

  // Week 2 Day 2: REMOVED local state - now using Store as Single Source of Truth
  // const [pricingData, setPricingData] = useState<Map<string, PricingData>>(new Map())

  // Zustand Store: unified BOQ and pricing state
  const {
    boqItems,
    pricingData, // Week 2 Day 2: Get from Store instead of local state
    loadPricing,
    savePricing: storeSavePricing,
    updateItemPricing, // Week 2 Day 2: For updating individual items
    isDirty,
    markDirty: storeMarkDirty,
  } = useTenderPricingStore()

  // Week 2 Day 2: Setter function for backward compatibility with hooks
  // This wraps Store's updateItemPricing for components that expect setPricingData
  // Supports both direct value and updater function (like useState)
  const setPricingData = React.useCallback(
    (
      newDataOrUpdater:
        | Map<string, PricingData>
        | ((prev: Map<string, PricingData>) => Map<string, PricingData>),
    ) => {
      // Handle updater function
      const newData =
        typeof newDataOrUpdater === 'function' ? newDataOrUpdater(pricingData) : newDataOrUpdater

      // Update each item in the Store
      newData.forEach((pricing, itemId) => {
        updateItemPricing(itemId, pricing)
      })
    },
    [updateItemPricing, pricingData],
  )

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

  // ✅ Scroll to top when view changes
  useScrollToTop([currentView])

  // Use store's markDirty instead of the no-op one from hook
  const markDirty = storeMarkDirty

  const handleAttemptLeave = requestLeave

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

  const currentItem = quantityItems[currentItemIndex]

  // Use new pricing form hook for state management
  const {
    currentPricing,
    setCurrentPricing,
    defaultPercentages,
    setDefaultPercentages,
    defaultPercentagesInput,
    setDefaultPercentagesInput,
  } = usePricingForm({
    currentItem,
    pricingData,
    onDirty: markDirty,
  })

  // Use validation hook
  const { completionPercentage } = usePricingValidation({
    currentPricing,
    currentItem,
    pricingData,
    quantityItems,
  })

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

  // ⚠️ LEGACY: Domain pricing engine kept for backward compatibility
  // TODO: Remove after full migration to usePricingCalculations
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

  // ⚠️ LEGACY: Unified view items kept for backward compatibility
  // TODO: Remove after full migration to usePricingCalculations
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

  // ✅ Migrated to unified pricing calculations (matches SummaryView)
  const unifiedCalculations = usePricingCalculations({
    quantityItems,
    pricingData,
    defaultPercentages,
  })

  // Backward compatibility wrappers for existing code
  const calculateTotals = useCallback(() => {
    const item = pricingData.get(currentItem?.id || '')
    if (!item) {
      return {
        materials: 0,
        labor: 0,
        equipment: 0,
        subcontractors: 0,
        subtotal: 0,
        administrative: 0,
        operational: 0,
        profit: 0,
        total: 0,
      }
    }
    const itemCalc = unifiedCalculations.getItemCalculation(currentItem?.id || '')
    return {
      materials: item.materials.reduce((sum, mat) => {
        const wastageMultiplier = mat.hasWaste ? 1 + (mat.wastePercentage ?? 0) / 100 : 1
        return sum + (mat.quantity ?? 0) * (mat.price ?? 0) * wastageMultiplier
      }, 0),
      labor: item.labor.reduce((sum, lab) => sum + lab.total, 0),
      equipment: item.equipment.reduce((sum, eq) => sum + eq.total, 0),
      subcontractors: item.subcontractors.reduce((sum, sub) => sum + sub.total, 0),
      subtotal: itemCalc?.subtotal || 0,
      administrative: itemCalc?.administrative || 0,
      operational: itemCalc?.operational || 0,
      profit: itemCalc?.profit || 0,
      total: itemCalc?.total || 0,
    }
  }, [pricingData, currentItem, unifiedCalculations])

  const calculateAveragePercentages = useCallback(
    () => unifiedCalculations.averagePercentages,
    [unifiedCalculations],
  )
  const calculateItemsTotal = useCallback(
    () => unifiedCalculations.totals.items,
    [unifiedCalculations],
  )
  const calculateVAT = useCallback(() => unifiedCalculations.totals.vat, [unifiedCalculations])
  const calculateProjectTotal = useCallback(
    () => unifiedCalculations.totals.projectTotal,
    [unifiedCalculations],
  )
  const calculateTotalAdministrative = useCallback(
    () => unifiedCalculations.totals.administrative,
    [unifiedCalculations],
  )
  const calculateTotalOperational = useCallback(
    () => unifiedCalculations.totals.operational,
    [unifiedCalculations],
  )
  const calculateTotalProfit = useCallback(
    () => unifiedCalculations.totals.profit,
    [unifiedCalculations],
  )

  // === Phase 2.3: Repository-based persistence replacing useTenderPricingPersistence hook ===

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

  // Week 4 Day 3: Replaced persistPricingAndBOQ with direct Store.savePricing()
  // Store.savePricing() already saves to both pricingService + repository
  // No need for separate wrapper - use Store directly
  const handlePersistPricing = useCallback(async () => {
    try {
      console.log('[handlePersistPricing] Saving via Store.savePricing()...')

      // Store.savePricing() handles everything:
      // 1. Save to pricingService (fast IndexedDB)
      // 2. Save to tenderPricingRepository (comprehensive)
      // 3. Save defaultPercentages
      await storeSavePricing(pricingData, quantityItems)

      // Notify other components of update
      await notifyPricingUpdate()

      console.log('✅ [handlePersistPricing] Save complete')
    } catch (error) {
      console.error('❌ [handlePersistPricing] Save failed:', error)
      throw error
    }
  }, [storeSavePricing, pricingData, quantityItems, notifyPricingUpdate])

  // Week 4 Day 3: REMOVED saveDefaultPercentages (async save to pricingService)
  // Replaced with simple wrapper that updates Store and marks dirty
  // Actual save happens via Store.savePricing() when user clicks "حفظ"
  const saveDefaultPercentages = useCallback(
    async (newPercentages: typeof defaultPercentages) => {
      setDefaultPercentages(newPercentages)
      markDirty() // Mark for save later
    },
    [setDefaultPercentages, markDirty],
  )

  const updateTenderStatus = useCallback(
    async (newStatus?: string) => {
      // ⚠️ REMOVED: Auto-update tender status
      // تحديث حالة المناقصة تلقائياً يُطلق أحداث غير ضرورية
      // الآن: الحالة تُحدّث فقط عند "اعتماد" العرض (Submit)

      // If manual status override requested (from Submit button)
      if (newStatus !== undefined) {
        const tenderRepo = (
          await import('@/application/services/serviceRegistry')
        ).getTenderRepository()
        await tenderRepo.update(
          tender.id,
          {
            status: newStatus as unknown as Tender['status'],
          },
          { skipRefresh: true },
        ) // ✅ منع إعادة التحميل
      }

      // لا نُحدّث الحالة تلقائياً بناءً على نسبة الإنجاز
      // هذا يسبب إطلاق أحداث TENDER_UPDATED عند كل حفظ
    },
    [tender.id],
  )

  // ⚠️ REMOVED: useTenderPricingBackup - نظام النسخ الاحتياطي قديم (Draft System)
  // النسخ الاحتياطي كان جزءاً من Draft System المُلغى
  // الحفظ الآن مباشر في electron-store بدون drafts

  // Week 2 Day 2: REMOVED - Load pricingData from pricingService
  // pricingData now comes from Store (loaded by Store.loadPricing())
  // Store.loadPricing() loads FULL data from both BOQ Repository + pricingService
  // See: src/stores/tenderPricingStore.ts lines 156-234 (Week 2 Day 1 changes)

  // Week 2 Day 3: SIMPLIFIED - defaultPercentages now come from Store (via usePricingForm hook)
  // Only sync defaultPercentagesInput with Store's defaultPercentages and set isLoaded flag
  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        // Week 2 Day 3: defaultPercentages are loaded by Store.loadPricing()
        // usePricingForm hook gets them from Store directly
        // We only need to sync the input strings state here

        // Wait a bit for Store to load (Store.loadPricing is called in useEffect at line 98-102)
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (!mounted) return

        // Week 2 Day 3: Get defaultPercentages from Store (already loaded)
        const storeDefaultPercentages = useTenderPricingStore.getState().defaultPercentages

        // Sync input strings with Store's values
        setDefaultPercentagesInput({
          administrative: String(storeDefaultPercentages.administrative ?? ''),
          operational: String(storeDefaultPercentages.operational ?? ''),
          profit: String(storeDefaultPercentages.profit ?? ''),
        })
      } finally {
        if (mounted) setIsLoaded(true)
      }
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tender.id])

  // Note: Loading pricing for current item is now handled by usePricingForm hook

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
    // Week 4 Day 3: REMOVED separate save to pricingService
    // defaultPercentages are already updated in Store via setDefaultPercentages
    // They will be saved when user clicks "حفظ" via Store.savePricing()
    // No need for separate save here - just mark as dirty

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
      // Week 2 Day 2: Cast to expected type for hook compatibility
      setPricingData: setPricingData as React.Dispatch<
        React.SetStateAction<Map<string, PricingData>>
      >,
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
      // Week 2 Day 2: Cast to expected type for hook compatibility
      setPricingData: setPricingData as React.Dispatch<
        React.SetStateAction<Map<string, PricingData>>
      >,
      quantityItems,
      isLoaded,
      tenderId: tender.id,
      tenderTitle,
      defaultPercentages,
      calculateTotals,
      calculateProjectTotal,
      formatCurrencyValue,
      handlePersistPricing, // Week 4 Day 3: Renamed from persistPricingAndBOQ
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

  // ✅ SummaryView uses usePricingCalculations hook internally
  // These legacy functions are no longer needed (kept for backward compatibility)
  const summaryViewProps = {
    quantityItems,
    pricingData,
    defaultPercentages,
    defaultPercentagesInput,
    setDefaultPercentagesInput,
    setDefaultPercentages,
    saveDefaultPercentages, // Week 4 Day 3: Now just marks dirty (actual save via Store.savePricing)
    applyDefaultPercentagesToExistingItems,
    setCurrentItemIndex,
    setCurrentView: (view: 'summary' | 'pricing' | 'technical') => handleViewChange(view),
    formatCurrencyValue,
    formatQuantity,
    // ⚠️ LEGACY: These are ignored by SummaryView (uses usePricingCalculations internally)
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
        onExportToExcel={exportPricingToExcel}
        onUpdateStatus={updateTenderStatus}
        recordAudit={(level, action, metadata, status) =>
          recordPricingAudit(level as AuditEventLevel, action, metadata, status as AuditEventStatus)
        }
        getErrorMessage={getErrorMessage}
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
