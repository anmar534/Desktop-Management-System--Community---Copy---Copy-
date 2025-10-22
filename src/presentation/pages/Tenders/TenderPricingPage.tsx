// TenderPricingPage drives the full tender pricing workflow and persistence.
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '@/shared/utils/storage/storage'
import {
  createTenderPricingBackup,
  listTenderBackupEntries,
  restoreTenderBackup,
  noteBackupFailure,
  type TenderPricingBackupPayload,
} from '@/shared/utils/storage/backupManager'
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
  TenderBackupEntry,
  ExecutionMethod,
  PricingViewItem,
} from '@/shared/types/pricing'
import type { PricingTemplate } from '@/shared/types/templates'
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
import { formatDateValue } from '@/shared/utils/formatters/formatters'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import { Badge } from '@/presentation/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/presentation/components/ui/dropdown-menu'
import { ConfirmationDialog } from '@/presentation/components/ui/confirmation-dialog'
import { confirmationMessages } from '@/shared/config/confirmationMessages'
/**
 * Phase 2 Authoring Engine Integration Notes:
 * - الحساب legacy معزول في legacyAuthoringCompute().
 * - عند تفعيل PRICING_FLAGS.USE_ENGINE_AUTHORING يتم تشغيل مسارين:
 *    1) legacy لحساب القيم (لأغراض المقارنة فقط)
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/presentation/components/ui/dialog'
import { toast } from 'sonner'
import { useTenderPricingState } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingState'
import { useTenderPricingCalculations } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingCalculations'
// TenderPricingPage drives the full tender pricing workflow and persistence.
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Settings,
  RotateCcw,
  Download,
  ArrowRight,
  Save,
  Layers,
} from 'lucide-react'
import { PricingTemplateManager } from '@/presentation/components/tenders/PricingTemplateManager'
import { useTenderPricingPersistence } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingPersistence'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { TenderPricingTabs } from '@/presentation/components/pricing/tender-pricing-process/views/TenderPricingTabs'
import {
  recordAuditEvent,
  type AuditEventLevel,
  type AuditEventStatus,
} from '@/shared/utils/storage/auditLog'

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
    console.log('[TenderPricingPage] Unified BOQ state before extraction:', {
      unifiedStatus,
      unifiedSource,
      unifiedCount: Array.isArray(unifiedItems) ? unifiedItems.length : 0,
    })

    console.log('[TenderPricingPage] Extracting quantity items from tender:', {
      tenderId: tender?.id,
      tenderName: tender?.name,
      hasQuantityTable: !!tender?.quantityTable,
      hasQuantities: !!tender?.quantities,
      hasItems: !!tender?.items,
      hasBoqItems: !!tender?.boqItems,
      hasQuantityItems: !!tender?.quantityItems,
      hasScope: !!tender?.scope,
      hasAttachments: !!tender?.attachments,
      quantityTableLength: Array.isArray(tender?.quantityTable) ? tender.quantityTable.length : 0,
      quantitiesLength: Array.isArray(tender?.quantities) ? tender.quantities.length : 0,
    })

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

    console.log(
      '[TenderPricingPage] Candidate sources:',
      candidateSources.map((src, idx) => ({
        index: idx,
        isArray: Array.isArray(src),
        length: Array.isArray(src) ? src.length : 0,
      })),
    )

    let quantityData: RawQuantityItem[] =
      candidateSources.find((source) => Array.isArray(source) && source.length > 0) ?? []

    console.log('[TenderPricingPage] Selected quantityData length:', quantityData.length)

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

      console.log('[TenderPricingPage] Quantity attachment found:', !!quantityAttachment)

      if (Array.isArray(quantityAttachment?.data)) {
        quantityData = quantityAttachment.data as RawQuantityItem[]
        console.log('[TenderPricingPage] Loaded from attachment, length:', quantityData.length)
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

    console.log('[TenderPricingPage] ✅ Normalized items count:', normalizedItems.length)
    if (normalizedItems.length > 0) {
      console.log('[TenderPricingPage] Sample items (first 3):', normalizedItems.slice(0, 3))
    }

    return normalizedItems
  }, [tender, unifiedItems, unifiedSource, unifiedStatus])

  // ==== Template Management ====

  const handleTemplateApply = useCallback(
    (template: PricingTemplate) => {
      try {
        // Apply template percentages to default percentages
        setDefaultPercentages({
          administrative: template.defaultPercentages.administrative,
          operational: template.defaultPercentages.operational,
          profit: template.defaultPercentages.profit,
        })

        // Apply template to all existing items if they don't have custom pricing
        const updatedPricingData = new Map(pricingData)

        quantityItems.forEach((item) => {
          const existingPricing = updatedPricingData.get(item.id)

          // Only apply template if item doesn't have detailed pricing yet
          if (
            !existingPricing ||
            (!existingPricing.materials?.length &&
              !existingPricing.labor?.length &&
              !existingPricing.equipment?.length &&
              !existingPricing.subcontractors?.length)
          ) {
            const templatePricing = {
              ...existingPricing,
              percentages: {
                administrative: template.defaultPercentages.administrative,
                operational: template.defaultPercentages.operational,
                profit: template.defaultPercentages.profit,
              },
              additionalPercentages: {
                administrative: template.defaultPercentages.administrative,
                operational: template.defaultPercentages.operational,
                profit: template.defaultPercentages.profit,
              },
              materials: existingPricing?.materials || [],
              labor: existingPricing?.labor || [],
              equipment: existingPricing?.equipment || [],
              subcontractors: existingPricing?.subcontractors || [],
              completed: existingPricing?.completed || false,
              technicalNotes: existingPricing?.technicalNotes || '',
            }

            updatedPricingData.set(item.id, templatePricing)
          }
        })

        setPricingData(updatedPricingData)
        markDirty()

        toast.success(`تم تطبيق قالب "${template.name}" بنجاح`)
        setTemplateManagerOpen(false)
      } catch (error) {
        recordPricingAudit(
          'error',
          'template-apply-failed',
          {
            templateId: template.id,
            templateName: template.name,
            message: getErrorMessage(error),
          },
          'error',
        )
        toast.error('فشل في تطبيق القالب')
      }
    },
    [
      pricingData,
      quantityItems,
      markDirty,
      setDefaultPercentages,
      setPricingData,
      recordPricingAudit,
      getErrorMessage,
    ],
  )

  const handleTemplateSave = useCallback(
    (templateData: Omit<PricingTemplate, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>) => {
      try {
        // Create template from current pricing state
        const template: Omit<PricingTemplate, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'> = {
          ...templateData,
          defaultPercentages: {
            administrative: defaultPercentages.administrative,
            operational: defaultPercentages.operational,
            profit: defaultPercentages.profit,
          },
          // Calculate average cost breakdown from current pricing
          costBreakdown: {
            materials: 40, // Default values - could be calculated from current data
            labor: 30,
            equipment: 20,
            subcontractors: 10,
          },
        }

        toast.success(`تم حفظ القالب "${template.name}" بنجاح`)
        return template
      } catch (error) {
        recordPricingAudit(
          'error',
          'template-save-failed',
          {
            templateName: templateData.name,
            message: getErrorMessage(error),
          },
          'error',
        )
        toast.error('فشل في حفظ القالب')
        throw error
      }
    },
    [defaultPercentages, recordPricingAudit, getErrorMessage],
  )

  const handleTemplateUpdate = useCallback(
    (template: PricingTemplate) => {
      try {
        // Update template logic would go here
        toast.success(`تم تحديث القالب "${template.name}" بنجاح`)
      } catch (error) {
        recordPricingAudit(
          'error',
          'template-update-failed',
          {
            templateId: template.id,
            templateName: template.name,
            message: getErrorMessage(error),
          },
          'error',
        )
        toast.error('فشل في تحديث القالب')
      }
    },
    [recordPricingAudit, getErrorMessage],
  )

  const handleTemplateDelete = useCallback(
    (_templateId: string) => {
      try {
        // Delete template logic would go here
        // TODO: Implement template deletion using templateId
        toast.success('تم حذف القالب بنجاح')
      } catch (error) {
        recordPricingAudit(
          'error',
          'template-delete-failed',
          {
            message: getErrorMessage(error),
          },
          'error',
        )
        toast.error('فشل في حذف القالب')
      }
    },
    [recordPricingAudit, getErrorMessage],
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

  const handleViewChange = useCallback(
    (value: PricingViewName) => {
      changeView(value)
    },
    [changeView],
  )

  const [isLoaded, setIsLoaded] = useState(false)
  const [backupsList, setBackupsList] = useState<TenderBackupEntry[]>([])

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

    markDirty()
    toast.success('تم حذف الصف بنجاح')
  }

  // حفظ نسخة احتياطية من البيانات
  const createBackup = useCallback(async () => {
    const payload: TenderPricingBackupPayload = {
      tenderId: tender.id,
      tenderTitle,
      pricing: Array.from(pricingData.entries()),
      quantityItems,
      completionPercentage:
        quantityItems.length > 0 ? (pricingData.size / quantityItems.length) * 100 : 0,
      totalValue: calculateProjectTotal(),
      timestamp: new Date().toISOString(),
      version: '1.0',
    }

    try {
      await createTenderPricingBackup(payload, {
        actor: 'tender-pricing-ui',
        origin: 'renderer',
      })
      const updatedEntries = await listTenderBackupEntries(tender.id)
      setBackupsList(updatedEntries)
      toast.success('تم إنشاء نسخة احتياطية', {
        description: 'تم حفظ نسخة احتياطية من البيانات بنجاح',
        duration: 3000,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown-error'
      recordPricingAudit(
        'error',
        'backup-create-failed',
        {
          message: getErrorMessage(error),
          reason,
        },
        'error',
      )
      await noteBackupFailure(tender.id, reason, {
        actor: 'tender-pricing-ui',
        origin: 'renderer',
      })
      toast.error('فشل إنشاء النسخة الاحتياطية', {
        description: 'تعذر حفظ النسخة الاحتياطية. يرجى المحاولة لاحقاً.',
        duration: 4000,
      })
    }
  }, [
    tender.id,
    tenderTitle,
    pricingData,
    quantityItems,
    calculateProjectTotal,
    recordPricingAudit,
    getErrorMessage,
  ])

  // تحميل قائمة النسخ الاحتياطية عند فتح نافذة الاسترجاع
  const loadBackupsList = useCallback(async () => {
    const entries = await listTenderBackupEntries(tender.id)
    setBackupsList(entries)
  }, [tender.id])

  // استرجاع نسخة احتياطية
  const restoreBackup = useCallback(
    async (entryId: string) => {
      const snapshot = await restoreTenderBackup(tender.id, entryId, {
        actor: 'tender-pricing-ui',
        origin: 'renderer',
      })

      if (!snapshot) {
        toast.error('تعذر العثور على النسخة الاحتياطية')
        return
      }

      try {
        const restoredMap = new Map<string, PricingData>(
          snapshot.pricing as [string, PricingData][],
        )
        setPricingData(restoredMap)
        await pricingService.saveTenderPricing(tender.id, {
          pricing: Array.from(restoredMap.entries()),
          defaultPercentages,
          lastUpdated: new Date().toISOString(),
        })
        // مزامنة لقطة BOQ المركزية بعد الاسترجاع
        await persistPricingAndBOQ(restoredMap)
        toast.success('تم استرجاع النسخة بنجاح')
        setRestoreOpen(false)
        void loadBackupsList()
      } catch (error) {
        recordPricingAudit(
          'error',
          'backup-restore-failed',
          {
            entryId,
            message: getErrorMessage(error),
          },
          'error',
        )
        toast.error('فشل استرجاع النسخة الاحتياطية')
      }
    },
    [
      tender.id,
      defaultPercentages,
      persistPricingAndBOQ,
      loadBackupsList,
      recordPricingAudit,
      getErrorMessage,
    ],
  )

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
    onUpdateRow: updateRow,
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sticky top-0 bg-background/80 backdrop-blur z-20 py-2 border-b">
        <Button
          variant="outline"
          onClick={handleAttemptLeave}
          className="flex items-center gap-2 hover:bg-muted/30"
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">عملية التسعير</h1>
          <p className="text-muted-foreground text-sm">
            {tender.name || tender.title || 'منافسة جديدة'}
          </p>
          {/* شريط حالة النسخة الرسمية / المسودة */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {editablePricing.source === 'official' && (
              <Badge className="bg-success text-success-foreground hover:bg-success/90">
                نسخة رسمية معتمدة
              </Badge>
            )}
            {editablePricing.source === 'draft' && editablePricing.isDraftNewer && (
              <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">
                مسودة أحدث (غير معتمدة)
              </Badge>
            )}
            {/* Snapshot indicator removed بعد إلغاء نظام اللقطات */}
            {/* Removed legacy 'hook' source badge after unification */}
            {editablePricing.hasDraft &&
              !editablePricing.isDraftNewer &&
              editablePricing.source === 'official' && (
                <Badge variant="secondary" className="bg-muted/30 text-muted-foreground">
                  مسودة محفوظة
                </Badge>
              )}
            {editablePricing.dirty && (
              <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse">
                تغييرات غير محفوظة رسمياً
              </Badge>
            )}
          </div>
        </div>

        {/* شريط أدوات مُعاد تصميمه */}
        <div className="flex items-center gap-2">
          {/* قوالب التسعير */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplateManagerOpen(true)}
            className="flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            القوالب
          </Button>

          {/* اعتماد رسمي */}
          <ConfirmationDialog
            title={confirmationMessages.approveOfficial.title}
            description={confirmationMessages.approveOfficial.description}
            confirmText={confirmationMessages.approveOfficial.confirmText}
            cancelText={confirmationMessages.approveOfficial.cancelText}
            variant="success"
            icon="confirm"
            onConfirm={async () => {
              try {
                await editablePricing.saveOfficial()
                toast.success('تم اعتماد التسعير رسمياً', { duration: 2500 })
              } catch (error) {
                recordPricingAudit(
                  'error',
                  'official-save-failed',
                  {
                    message: getErrorMessage(error),
                  },
                  'error',
                )
                toast.error('فشل اعتماد النسخة الرسمية')
              }
            }}
            trigger={
              <Button
                size="sm"
                className="flex items-center gap-2 bg-success text-success-foreground hover:bg-success/90"
                disabled={
                  editablePricing.status !== 'ready' ||
                  (!editablePricing.dirty &&
                    !editablePricing.isDraftNewer &&
                    editablePricing.source === 'official')
                }
              >
                <CheckCircle className="w-4 h-4" />
                اعتماد
              </Button>
            }
          />
          {/* نسبة الإنجاز مختصرة */}
          <div className="px-3 py-1.5 rounded-md border border-info/30 bg-gradient-to-l from-info/20 to-success/20 text-xs text-info flex flex-col items-center leading-tight">
            <span className="font-bold">
              {(() => {
                const c = Array.from(pricingData.values()).filter(
                  (value) => value?.completed,
                ).length
                return Math.round((c / quantityItems.length) * 100)
              })()}
              %
            </span>
            <span className="text-xs leading-none">
              {Array.from(pricingData.values()).filter((value) => value?.completed).length}/
              {quantityItems.length}
            </span>
          </div>
          {/* قائمة الأدوات الثانوية */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                أدوات
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <ConfirmationDialog
                title={confirmationMessages.saveItem.title}
                description={confirmationMessages.saveItem.description}
                confirmText={confirmationMessages.saveItem.confirmText}
                cancelText={confirmationMessages.saveItem.cancelText}
                variant="success"
                icon="save"
                onConfirm={saveCurrentItem}
                trigger={
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <Save className="w-4 h-4 text-success" /> حفظ تسعير البند
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuSeparator />
              <ConfirmationDialog
                title="إنشاء نسخة احتياطية"
                description="سيتم حفظ نسخة احتياطية من حالة التسعير الحالية (يتم الاحتفاظ بآخر 10 فقط). هل تريد المتابعة؟"
                confirmText="نعم، إنشاء نسخة"
                cancelText="إلغاء"
                variant="success"
                icon="save"
                onConfirm={() => {
                  void createBackup()
                }}
                trigger={
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <RotateCcw className="w-4 h-4 text-info" /> إنشاء نسخة احتياطية
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                onClick={() => {
                  setRestoreOpen(true)
                  void loadBackupsList()
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-info" /> استرجاع نسخة
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>التصدير</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={exportPricingToExcel}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-success" /> تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  updateTenderStatus()
                  toast.success('تم تحديث حالة المنافسة')
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-secondary" /> تحديث الحالة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Dialog الاسترجاع بقي للاستخدام لكنه أُخرج من التجمع البصري للأزرار */}
      <Dialog
        open={restoreOpen}
        onOpenChange={(openState) => {
          setRestoreOpen(openState)
          if (openState) void loadBackupsList()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استرجاع نسخة احتياطية</DialogTitle>
            <DialogDescription>اختر نسخة لاسترجاع بيانات التسعير.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-auto mt-2 space-y-2" dir="rtl">
            {backupsList.length === 0 && (
              <EmptyState
                icon={RotateCcw}
                title="لا توجد نسخ احتياطية"
                description="لم يتم إنشاء أي نسخ احتياطية لهذه المنافسة بعد."
              />
            )}
            {backupsList.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between border border-border rounded p-2"
              >
                <div className="text-sm">
                  <div className="font-medium">{formatTimestamp(b.timestamp)}</div>
                  <div className="text-muted-foreground">
                    نسبة الإكمال: {Math.round(b.completionPercentage)}% • الإجمالي:{' '}
                    {formatCurrencyValue(b.totalValue, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    العناصر المسعرة: {b.itemsPriced}/{b.itemsTotal}
                    {b.retentionExpiresAt
                      ? ` • الاحتفاظ حتى ${formatDateValue(b.retentionExpiresAt, {
                          locale: 'ar-SA',
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                        })}`
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => restoreBackup(b.id)}>
                    استرجاع
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline">إغلاق</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

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
      <Dialog open={templateManagerOpen} onOpenChange={setTemplateManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>إدارة قوالب التسعير</DialogTitle>
            <DialogDescription>
              اختر قالب تسعير لتطبيقه على المنافسة أو احفظ الإعدادات الحالية كقالب جديد
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <PricingTemplateManager
              onSelectTemplate={handleTemplateApply}
              onCreateTemplate={handleTemplateSave}
              onUpdateTemplate={handleTemplateUpdate}
              onDeleteTemplate={handleTemplateDelete}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
