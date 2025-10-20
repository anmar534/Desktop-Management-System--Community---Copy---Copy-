import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { EmptyState } from './PageLayout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { TenderResultsManager } from './TenderResultsManager'
import { TenderQuickResults } from './TenderQuickResults'
import {
  Calendar,
  DollarSign,
  ArrowRight,
  Building2,
  MapPin,
  Eye,
  FileText,
  Paperclip,
  Grid3X3,
  Info,
  Download,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { TenderStatusManager } from './TenderStatusManager'
import { APP_EVENTS } from '@/events/bus'
import { FileUploadService } from '../utils/fileUploadService'
import type { UploadedFile } from '../utils/fileUploadService'
// (legacy pricingService import removed – unified hook supplies data)
// Removed pricingDataSyncService (legacy dual-write path)
// Removed normalizeAndEnrich / dedupePricingItems legacy enrichment utilities – unified hook supplies final items
import { safeLocalStorage } from '../utils/storage'
// Removed direct snapshot utilities & metrics – unified hook manages snapshot reading
// Removed useTenderPricing (legacy hook) – unified hook is now sole source of truth here
import { useUnifiedTenderPricing } from '@/application/hooks/useUnifiedTenderPricing'
import type { UnifiedTenderPricingResult } from '@/application/hooks/useUnifiedTenderPricing'
import { getStatusColor } from '../utils/statusColors'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import type { Tender } from '@/data/centralData'

type NumericValue = number | string | null | undefined

type TenderPricingSection = 'materials' | 'labor' | 'equipment' | 'subcontractors'

interface SectionCollapseState {
  materials: boolean
  labor: boolean
  equipment: boolean
  subcontractors: boolean
}

type SectionCollapseMap = Record<string, SectionCollapseState>

interface PricingBreakdownTotals {
  materials?: number
  labor?: number
  equipment?: number
  subcontractors?: number
  administrative?: number
  operational?: number
  profit?: number
}

interface PricingResource {
  id?: string | number
  name?: string
  description?: string
  unit?: string
  quantity?: NumericValue
  unitPrice?: NumericValue
  total?: NumericValue
  price?: NumericValue
  unitCost?: NumericValue
  rate?: NumericValue
  hourlyRate?: NumericValue
  dailyRate?: NumericValue
  weeklyRate?: NumericValue
  monthlyRate?: NumericValue
  count?: NumericValue
  hours?: NumericValue
  days?: NumericValue
  supplier?: string
  company?: string
  role?: string
  notes?: string
  category?: string
  scope?: string
  level?: string
  brand?: string
  specifications?: string
  remarks?: string
}

interface PricingDisplayItem {
  id?: string | number
  itemNumber?: string
  number?: string
  canonicalDescription?: string
  description?: string
  desc?: string
  name?: string
  title?: string
  itemName?: string
  specifications?: string
  spec?: string
  notes?: string
  technicalNotes?: string
  detailedDescription?: string
  unit?: string
  uom?: string
  quantity?: NumericValue
  unitPrice?: NumericValue
  totalPrice?: NumericValue
  estimated?: {
    quantity?: NumericValue
    unitPrice?: NumericValue
    totalPrice?: NumericValue
  }
  breakdown?: PricingBreakdownTotals
  materials?: PricingResource[]
  labor?: PricingResource[]
  equipment?: PricingResource[]
  subcontractors?: PricingResource[]
  [key: string]: unknown
}

type PricingTotalsKey =
  | 'totalValue'
  | 'vatAmount'
  | 'totalWithVat'
  | 'baseSubtotal'
  | 'profit'
  | 'administrative'
  | 'operational'
  | 'adminOperational'
  | 'profitPercentage'
  | 'adminOperationalPercentage'
  | 'administrativePercentage'
  | 'operationalPercentage'

interface PricingTotals extends Partial<Record<PricingTotalsKey, number>> {
  vatRate?: number
}

type AttachmentSource = 'original' | 'technical' | string

interface TenderAttachment {
  id?: string
  name: string
  type?: string
  mimeType?: string
  size?: NumericValue
  uploadDate?: string
  uploadedAt?: string
  url?: string
  source?: AttachmentSource
  description?: string
  tenderId?: string
  originalFile?: UploadedFile
}

type PricingCollections = PricingDisplayItem[]

interface TenderWithSupplementalData extends Tender {
  attachments?: TenderAttachment[]
  quantityTable?: PricingCollections
  quantities?: PricingCollections
  items?: PricingCollections
  boqItems?: PricingCollections
  quantityItems?: PricingCollections
  executionPeriod?: string
  projectDuration?: string
  tenderNumber?: string
  source?: string
  classification?: string
  contractType?: string
  paymentMethod?: string
  bidBond?: NumericValue
  performanceBond?: NumericValue
  scope?: string
  startDate?: string
  endDate?: string
}

interface TenderDetailsProps {
  tender: TenderWithSupplementalData
  onBack: () => void
}

type TenderDetailsTab = 'general' | 'quantity' | 'attachments' | 'workflow' | 'timeline'

const PRICING_TOTAL_KEYS: PricingTotalsKey[] = [
  'totalValue',
  'vatAmount',
  'totalWithVat',
  'baseSubtotal',
  'profit',
  'administrative',
  'operational',
  'adminOperational',
  'profitPercentage',
  'adminOperationalPercentage',
  'administrativePercentage',
  'operationalPercentage',
]

const createDefaultSectionState = (): SectionCollapseState => ({
  materials: false,
  labor: false,
  equipment: false,
  subcontractors: false,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toNumber = (value: NumericValue): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    if (!cleaned) {
      return null
    }
    const numeric = Number.parseFloat(cleaned)
    return Number.isFinite(numeric) ? numeric : null
  }

  return null
}

const sumResourceTotals = (resources?: PricingResource[]): number =>
  resources?.reduce((sum, resource) => sum + (toNumber(resource.total) ?? 0), 0) ?? 0

const createDefaultBreakdownTotals = (): Required<PricingBreakdownTotals> => ({
  materials: 0,
  labor: 0,
  equipment: 0,
  subcontractors: 0,
  administrative: 0,
  operational: 0,
  profit: 0,
})

const pickNumeric = (...values: NumericValue[]): NumericValue =>
  values.find((value) => value !== undefined && value !== null && value !== '')

const normalizeTotals = (value: unknown): PricingTotals | null => {
  if (!isRecord(value)) {
    return null
  }

  const totals: PricingTotals = {}

  for (const key of PRICING_TOTAL_KEYS) {
    const numeric = toNumber(value[key] as NumericValue)
    if (numeric !== null) {
      totals[key] = numeric
    }
  }

  const vat = toNumber(value.vatRate as NumericValue)
  if (vat !== null) {
    totals.vatRate = vat
  }

  return Object.keys(totals).length > 0 ? totals : null
}

const formatAttachmentSize = (size: NumericValue): string | undefined => {
  const numeric = toNumber(size)
  if (numeric === null) {
    return typeof size === 'string' ? size : undefined
  }
  return FileUploadService.formatFileSize(numeric)
}
/**
 * Phase 1 Pricing Engine Adoption (READ PATH ONLY)
 * ------------------------------------------------
 * This component now supports an engine-based enrichment path guarded by PRICING_FLAGS.USE_ENGINE_DETAILS.
 * Quick rollback: set PRICING_FLAGS.USE_ENGINE_DETAILS = false in pricingHelpers.ts to restore legacy reconstruction.
 * Diff logging: enabled via PRICING_FLAGS.DIFF_LOGGING; threshold configurable (DIFF_THRESHOLD_PERCENT).
 * Removal plan: once diffs remain stable (<0.5%) for a full release cycle, delete legacyReconstruct() and related code.
 */
// legacy normalizePricing utilities removed (buildPricingMap no longer needed after snapshot adoption)

export function TenderDetails({ tender, onBack }: TenderDetailsProps) {
  const [activeTab, setActiveTab] = useState<TenderDetailsTab>('general')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [localTender, setLocalTender] = useState<TenderWithSupplementalData>(tender)
  const [collapsedSections, setCollapsedSections] = useState<SectionCollapseMap>({})

  const toggleCollapse = (itemId: string, section: TenderPricingSection) => {
    setCollapsedSections((prev) => {
      const current = prev[itemId] ?? createDefaultSectionState()
      return {
        ...prev,
        [itemId]: {
          ...current,
          [section]: !current[section],
        },
      }
    })
  }

  // تحديث البيانات المحلية عند تغيير tender
  useEffect(() => {
    setLocalTender(tender)
  }, [tender])

  // أزيل مستمع pricingSnapshotUpdated (الـ unified hook يستمع بالفعل ويُحدِّث بياناته).

  // الاستماع لأحداث تحديث المنافسة لتحديث البيانات المحلية (من المصدر المركزي)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    let cancelled = false
    const repository = getTenderRepository()

    const syncTender = async () => {
      try {
        const updated = await repository.getById(tender.id)
        if (!cancelled && updated) {
          setLocalTender(updated)
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('تعذر تحديث بيانات المنافسة بعد الحدث:', error)
        }
      }
    }

    void syncTender()

    const handler = () => {
      void syncTender()
    }

    window.addEventListener(APP_EVENTS.TENDER_UPDATED, handler as EventListener)

    return () => {
      cancelled = true
      window.removeEventListener(APP_EVENTS.TENDER_UPDATED, handler as EventListener)
    }
  }, [tender.id])

  // أزيل مسار التحميل/إعادة بناء snapshot اليدوي – مصدر موحد فقط.

  // أزيل مستمع pricingDataUpdated وإعادة بناء snapshot – الاعتماد على تزامن مركزي لاحق (إن لزم) عبر unified hook.

  const unified = useUnifiedTenderPricing(tender)
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
    (value: NumericValue, options?: Intl.NumberFormatOptions) => {
      const numeric = toNumber(value) ?? 0
      if (!options) {
        return quantityFormatter.format(numeric)
      }
      return new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options,
      }).format(numeric)
    },
    [quantityFormatter],
  )

  const formatCurrencyOptional = useCallback(
    (value: NumericValue, options?: Parameters<typeof formatCurrencyValue>[1]) => {
      const numeric = toNumber(value)
      if (numeric === null) {
        return '-'
      }
      return formatCurrencyValue(numeric, options)
    },
    [formatCurrencyValue],
  )

  const finalQuantityData = useMemo<PricingDisplayItem[]>(
    () => (Array.isArray(unified.items) ? (unified.items as PricingDisplayItem[]) : []),
    [unified.items],
  )

  const hasPricingData = useMemo(
    () =>
      finalQuantityData.some((item) => {
        const unitPrice = toNumber(item.unitPrice)
        const totalPrice = toNumber(item.totalPrice)
        return unitPrice !== null || totalPrice !== null
      }),
    [finalQuantityData],
  )

  const pricingTotals = useMemo(() => normalizeTotals(unified.totals), [unified.totals])

  const sourceLabelMap: Record<UnifiedTenderPricingResult['source'], string> = useMemo(
    () => ({
      'central-boq': 'البيانات الموحدة',
      legacy: 'المسار القديم',
      none: 'غير متوفر',
    }),
    [],
  )
  // تشخيص مبسط للمصدر الموحد فقط
  useEffect(() => {
    console.log('[TenderDetails] Unified pricing diagnostic', {
      tenderId: tender?.id,
      unifiedStatus: unified.status,
      unifiedSource: unified.source,
      items: unified.items.length,
      hasTotals: !!unified.totals,
    })
  }, [unified.status, unified.source, unified.items.length, unified.totals, tender?.id])

  if (!localTender) return null

  // الجاهزية وفق المصدر المركزي
  const isPricingCompleted =
    (localTender?.pricedItems || 0) > 0 &&
    (localTender?.totalItems || 0) > 0 &&
    (localTender?.pricedItems || 0) >= (localTender?.totalItems || 0)
  const isTechnicalFilesUploaded =
    !!localTender?.technicalFilesUploaded ||
    FileUploadService.getFilesByTender(tender.id).length > 0
  const isReadyToSubmit = isPricingCompleted && isTechnicalFilesUploaded

  // دالة لإظهار حوار التأكيد لتقديم العرض
  const handleSubmitTender = () => {
    setShowSubmitDialog(true)
  }

  // دالة لتأكيد تقديم العرض
  const handleConfirmSubmit = async () => {
    setShowSubmitDialog(false)

    try {
      const currentTender = localTender ?? tender
      console.log('🚀 بدء عملية إرسال المنافسة:', currentTender.id)

      const { tenderSubmissionService } = await import(
        '@/application/services/tenderSubmissionService'
      )
      const result = await tenderSubmissionService.submit(currentTender)

      setLocalTender(result.tender)

      const { created, purchaseOrder, bookletExpense, counts } = result

      console.log('✅ تم استكمال تدفق الإرسال', {
        tenderId: result.tender.id,
        purchaseOrderId: purchaseOrder.id,
        bookletExpenseId: bookletExpense?.id ?? null,
        created,
        counts,
      })

      const summary: string[] = []
      if (created.purchaseOrder) {
        summary.push('تم إنشاء أمر شراء للمنافسة')
      } else if (counts.after.ordersCount > 0) {
        summary.push('أمر الشراء موجود مسبقاً')
      }

      if (bookletExpense) {
        const amount = formatCurrencyValue(bookletExpense.amount, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        if (created.bookletExpense) {
          summary.push(`تم إنشاء مصروف الكراسة بقيمة ${amount}`)
        } else {
          summary.push(`مصروف الكراسة الحالي ${amount}`)
        }
      } else if (created.bookletExpense) {
        summary.push('تم تسجيل مصروف الكراسة')
      } else if (counts.after.expensesCount > 0) {
        summary.push('مصروف الكراسة موجود مسبقاً')
      }

      if (summary.length === 0) {
        summary.push('تم تحديث حالة المنافسة والإحصائيات بنجاح')
      }

      toast.success('تم تقديم العرض بنجاح', {
        description: summary.join(' • '),
      })
    } catch (error) {
      console.error('❌ خطأ في إرسال المنافسة:', error)
      toast.error('حدث خطأ أثناء تقديم العرض')
    }
  }

  // دالة لعرض جدول الكميات المُسعَّر
  const renderQuantityTable = () => {
    console.log(
      '[TenderDetails] Unified hook source',
      unified.source,
      'items',
      finalQuantityData.length,
    )

    return (
      <div className="space-y-4" dir="rtl">
        {unified.status === 'loading' && (
          <div className="p-4 rounded-md bg-muted/40 text-sm text-muted-foreground border">
            جاري تحميل بيانات التسعير...
          </div>
        )}
        {unified.status === 'empty' && (
          <EmptyState
            icon={AlertCircle}
            title="لا توجد بيانات تسعير"
            description="لم يتم العثور على أسعار للبنود حتى الآن. قم باستيراد أو إدخال التسعير للمتابعة."
            actionLabel="فتح صفحة التسعير"
            onAction={() => window.open(`/pricing/${tender.id}`, '_blank')}
          />
        )}
        {/* divergence UI removed */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">عدد البنود: {finalQuantityData.length}</p>
          <div className="flex gap-2 items-center">
            <Badge className="bg-info/10 text-info border-info/30">
              {sourceLabelMap[unified.source]}
            </Badge>
            {hasPricingData && (
              <Badge className="bg-success/10 text-success border-success/30">يتضمن أسعار</Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/pricing/${tender.id}`, '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> فتح صفحة التسعير
            </Button>
          </div>
        </div>

        {/* الجدول بنفس تصميم تبويب الملخص مع جداول التحليل */}
        {unified.status !== 'loading' && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full min-w-[1200px] border-collapse">
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[35%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                {hasPricingData && (
                  <>
                    <col className="w-[12%]" />
                    <col className="w-[15%]" />
                  </>
                )}
                <col className="w-[8%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead className="sticky top-0 bg-background z-10">
                <tr className="bg-muted/40 border-b border-border">
                  <th className="border border-border p-2 text-right font-semibold text-sm">
                    رقم البند
                  </th>
                  <th className="border border-border p-2 text-right font-semibold text-sm">
                    وصف البند
                  </th>
                  <th className="border border-border p-2 text-center font-semibold text-sm">
                    الوحدة
                  </th>
                  <th className="border border-border p-2 text-center font-semibold text-sm">
                    الكمية
                  </th>
                  {hasPricingData && (
                    <>
                      <th className="border border-border p-2 text-center font-semibold text-sm">
                        سعر الوحدة
                      </th>
                      <th className="border border-border p-2 text-center font-semibold text-sm">
                        القيمة الإجمالية
                      </th>
                    </>
                  )}
                  <th className="border border-border p-2 text-center font-semibold text-sm">
                    حالة التسعير
                  </th>
                  <th className="border border-border p-2 text-center font-semibold text-sm">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* معالجة مشكلة المفاتيح المكررة:
                  في بعض الحالات تصلنا عناصر ببنفس id (مثلاً نتيجة دمج مصادر أو تكرار في التخزين)
                  مما ينتج عنه تحذير React: Encountered two children with the same key
                  الحل هنا: توليد مفتاح عرض renderKey فريد حتى لو تكرر id الأصلي */}
                {(() => {
                  const keyUsage: Record<string, number> = {}
                  return finalQuantityData.map((item, index) => {
                    const identifier = item.id ?? item.itemNumber ?? index
                    const baseKey = String(identifier)
                    const occurrence = (keyUsage[baseKey] = (keyUsage[baseKey] ?? 0) + 1)
                    const renderKey =
                      occurrence === 1 ? baseKey : `${baseKey}__dup${occurrence - 1}`
                    const unitPriceValue = toNumber(item.unitPrice)
                    const totalPriceValue = toNumber(item.totalPrice)
                    const quantityNumeric = toNumber(item.quantity)
                    const formattedQuantity =
                      quantityNumeric !== null
                        ? formatQuantity(item.quantity ?? quantityNumeric, {
                            maximumFractionDigits: 2,
                          })
                        : '-'
                    const formattedUnitPrice =
                      unitPriceValue !== null
                        ? formatCurrencyOptional(unitPriceValue, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '-'
                    const formattedTotalPrice =
                      totalPriceValue !== null
                        ? formatCurrencyOptional(totalPriceValue, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })
                        : '-'
                    const isCompleted =
                      unitPriceValue !== null &&
                      totalPriceValue !== null &&
                      unitPriceValue > 0 &&
                      totalPriceValue > 0
                    const isInProgress =
                      !isCompleted && (unitPriceValue !== null || totalPriceValue !== null)
                    const materials = item.materials ?? []
                    const labor = item.labor ?? []
                    const equipment = item.equipment ?? []
                    const subcontractors = item.subcontractors ?? []
                    const materialsTotal = sumResourceTotals(materials)
                    const laborTotal = sumResourceTotals(labor)
                    const equipmentTotal = sumResourceTotals(equipment)
                    const subcontractorTotal = sumResourceTotals(subcontractors)
                    const breakdownTotals = item.breakdown ?? createDefaultBreakdownTotals()
                    const hasBreakdownTotals =
                      (breakdownTotals.materials ?? 0) > 0 ||
                      (breakdownTotals.labor ?? 0) > 0 ||
                      (breakdownTotals.equipment ?? 0) > 0 ||
                      (breakdownTotals.subcontractors ?? 0) > 0 ||
                      (breakdownTotals.administrative ?? 0) > 0 ||
                      (breakdownTotals.operational ?? 0) > 0 ||
                      (breakdownTotals.profit ?? 0) > 0
                    const finalHasBreakdownData =
                      materials.length > 0 ||
                      labor.length > 0 ||
                      equipment.length > 0 ||
                      subcontractors.length > 0 ||
                      hasBreakdownTotals
                    const collapseKey = baseKey
                    const collapseState =
                      collapsedSections[collapseKey] ?? createDefaultSectionState()
                    const persistentItemId = baseKey

                    if (process.env.NODE_ENV !== 'production') {
                      console.log(
                        `Item ${baseKey}: finalHasBreakdownData = ${finalHasBreakdownData}`,
                        {
                          materials: materials.length,
                          labor: labor.length,
                          equipment: equipment.length,
                          subcontractors: subcontractors.length,
                          breakdown: breakdownTotals,
                        },
                      )
                    }

                    if (occurrence > 1 && occurrence === 2) {
                      console.warn(
                        '[TenderDetails] Duplicate item id detected, generating unique key:',
                        {
                          id: baseKey,
                          renderKey,
                          occurrence,
                        },
                      )
                    }
                    return (
                      <React.Fragment key={renderKey}>
                        <tr
                          className={`hover:bg-muted/40 ${isCompleted ? 'bg-success/10' : isInProgress ? 'bg-warning/10' : 'bg-destructive/10'}`}
                        >
                          <td className="border border-border p-2 font-medium text-right text-sm">
                            {item.itemNumber || item.number || String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="border border-border p-2 text-right">
                            <div>
                              {/* الوصف القياسي */}
                              <div className="font-medium text-sm whitespace-pre-line leading-relaxed">
                                {item.canonicalDescription ||
                                  item.description ||
                                  item.desc ||
                                  item.name ||
                                  item.title ||
                                  item.itemName ||
                                  item.specifications ||
                                  'غير محدد'}
                              </div>
                              {/* إذا كان الوصف الأصلي مختلفاً عن القياسي وأطول/أقصر نعرضه للمراجعة */}
                              {item.canonicalDescription &&
                                item.description &&
                                item.canonicalDescription !== item.description && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <span className="font-semibold">الوصف الأصلي:</span>{' '}
                                    {item.description}
                                  </div>
                                )}
                              {/* عرض المواصفات من مصادر متعددة */}
                              {(item.specifications ||
                                item.spec ||
                                item.notes ||
                                item.technicalNotes) && (
                                <div className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">
                                  {item.specifications ||
                                    item.spec ||
                                    item.notes ||
                                    item.technicalNotes}
                                </div>
                              )}
                              {/* وصف تفصيلي */}
                              {item.detailedDescription && (
                                <div className="text-xs text-info mt-1 italic whitespace-pre-line">
                                  {item.detailedDescription}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-border p-2 text-center font-medium text-sm">
                            {item.unit || item.uom || '-'}
                          </td>
                          <td className="border border-border p-2 text-center font-bold text-sm">
                            {formattedQuantity}
                          </td>
                          {hasPricingData && (
                            <>
                              <td className="border border-border p-2 text-center">
                                {isCompleted || isInProgress ? (
                                  <span className="font-bold text-info text-sm">
                                    {formattedUnitPrice}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm opacity-80">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="border border-border p-2 text-center">
                                {isCompleted || isInProgress ? (
                                  <span className="font-bold text-success text-sm">
                                    {formattedTotalPrice}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm opacity-80">
                                    -
                                  </span>
                                )}
                              </td>
                            </>
                          )}
                          <td className="border border-border p-2 text-center">
                            {isCompleted ? (
                              <Badge className="bg-success/10 text-success border-success/30 text-xs">
                                <CheckCircle className="w-3 h-3 ml-1" />
                                تم التسعير
                              </Badge>
                            ) : isInProgress ? (
                              <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">
                                قيد التسعير
                              </Badge>
                            ) : (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                                <AlertCircle className="w-3 h-3 ml-1" />
                                لم يتم التسعير
                              </Badge>
                            )}
                          </td>
                          <td className="border border-border p-2 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                try {
                                  // تخزين معرف البند المختار ليتم التقاطه في صفحة التسعير
                                  safeLocalStorage.setItem(
                                    'pricing:selectedItemId',
                                    persistentItemId,
                                  )
                                  // بث حدث مخصص لكي تغيّر شاشة العطاءات العرض إلى وضع التسعير
                                  const evt = new CustomEvent('openPricingForTender', {
                                    detail: { tenderId: tender.id, itemId: persistentItemId },
                                  })
                                  window.dispatchEvent(evt)
                                  toast.info('فتح واجهة التسعير للبند المحدد', { duration: 2500 })
                                } catch (e) {
                                  console.error('فشل تفعيل مسار التحرير', e)
                                  alert('تعذر فتح واجهة التسعير، يرجى المحاولة لاحقاً')
                                }
                              }}
                              className="flex items-center gap-1 text-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {isCompleted || isInProgress ? 'تعديل' : 'تسعير'}
                            </Button>
                          </td>
                        </tr>

                        {/* جداول تحليل التكلفة تحت كل بند - مطابقة لتبويب الملخص */}
                        {finalHasBreakdownData && (
                          <tr className="bg-card">
                            <td colSpan={hasPricingData ? 8 : 6} className="p-2 border-b">
                              <div className="space-y-2">
                                {/* عرض ملخص التكاليف إذا لم تكن الجداول التفصيلية موجودة */}
                                {!item.materials?.length &&
                                  !item.labor?.length &&
                                  !item.equipment?.length &&
                                  !item.subcontractors?.length &&
                                  item.breakdown && (
                                    <div className="bg-muted/40 p-3 rounded-lg border border-border">
                                      <div className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-info rounded-full"></div>
                                        ملخص تحليل التكلفة لهذا البند
                                      </div>

                                      {/* الإجماليات الأساسية */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                                        {item.breakdown.materials > 0 && (
                                          <div className="bg-info/10 p-2 rounded border border-info/30">
                                            <div className="text-info text-xs mb-1">المواد</div>
                                            <div className="font-bold text-info">
                                              {formatCurrencyValue(item.breakdown.materials, {
                                                maximumFractionDigits: 0,
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        {item.breakdown.labor > 0 && (
                                          <div className="bg-success/10 p-2 rounded border border-success/30">
                                            <div className="text-success text-xs mb-1">العمالة</div>
                                            <div className="font-bold text-success">
                                              {formatCurrencyValue(item.breakdown.labor, {
                                                maximumFractionDigits: 0,
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        {item.breakdown.equipment > 0 && (
                                          <div className="bg-warning/10 p-2 rounded border border-warning/30">
                                            <div className="text-warning text-xs mb-1">المعدات</div>
                                            <div className="font-bold text-warning">
                                              {formatCurrencyValue(item.breakdown.equipment, {
                                                maximumFractionDigits: 0,
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        {item.breakdown.subcontractors > 0 && (
                                          <div className="bg-accent/10 p-2 rounded border border-accent/30">
                                            <div className="text-accent text-xs mb-1">
                                              مقاولو الباطن
                                            </div>
                                            <div className="font-bold text-accent">
                                              {formatCurrencyValue(item.breakdown.subcontractors, {
                                                maximumFractionDigits: 0,
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* النسب والتكاليف الإضافية */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-2 border-t border-border">
                                        {item.breakdown.administrative > 0 && (
                                          <div className="bg-destructive/10 p-2 rounded border border-destructive/30">
                                            <div className="text-destructive text-xs mb-1">
                                              تكاليف إدارية
                                            </div>
                                            <div className="font-bold text-destructive">
                                              {formatCurrencyValue(item.breakdown.administrative, {
                                                maximumFractionDigits: 0,
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        {item.breakdown.operational > 0 && (
                                          <div className="bg-warning/10 p-2 rounded border border-warning/30">
                                            <div className="text-warning text-xs mb-1">
                                              تكاليف تشغيلية
                                            </div>
                                            <div className="font-bold text-warning">
                                              {formatCurrencyValue(item.breakdown.operational, {
                                                maximumFractionDigits: 0,
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        {item.breakdown.profit > 0 && (
                                          <div className="bg-success/10 p-2 rounded border border-success/30">
                                            <div className="text-success text-xs mb-1">
                                              هامش الربح
                                            </div>
                                            <div className="font-bold text-success">
                                              {formatCurrencyValue(item.breakdown.profit, {
                                                maximumFractionDigits: 0,
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* إجمالي البند */}
                                      <div className="mt-3 pt-2 border-t border-border/60">
                                        <div className="bg-muted p-2 rounded flex justify-between items-center">
                                          <span className="text-foreground font-semibold text-sm">
                                            إجمالي البند:
                                          </span>
                                          <span className="font-bold text-foreground text-sm">
                                            {formatCurrencyValue(
                                              (item.breakdown.materials || 0) +
                                                (item.breakdown.labor || 0) +
                                                (item.breakdown.equipment || 0) +
                                                (item.breakdown.subcontractors || 0) +
                                                (item.breakdown.administrative || 0) +
                                                (item.breakdown.operational || 0) +
                                                (item.breakdown.profit || 0),
                                              { maximumFractionDigits: 0 },
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                {/* جدول المواد */}
                                {materials.length ? (
                                  <div>
                                    <div
                                      className="flex items-center justify-between cursor-pointer hover:bg-info/10 p-2 rounded-md border border-info/30"
                                      onClick={() => toggleCollapse(collapseKey, 'materials')}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-info rounded-full"></div>
                                        <div className="text-sm font-semibold text-info">
                                          المواد والخامات ({materials.length} صنف)
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-info border-info/30 text-xs bg-info/10"
                                        >
                                          إجمالي:{' '}
                                          {formatCurrencyOptional(materialsTotal, {
                                            maximumFractionDigits: 0,
                                          })}
                                        </Badge>
                                      </div>
                                      {collapseState.materials ? (
                                        <ChevronUp className="w-5 h-5 text-info" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-info" />
                                      )}
                                    </div>
                                    {!collapseState.materials && (
                                      <div className="mt-2 overflow-x-auto border rounded-lg shadow-sm">
                                        <table className="w-full text-xs bg-card">
                                          <colgroup>
                                            <col className="w-[40%]" />
                                            <col className="w-[10%]" />
                                            <col className="w-[12%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[8%]" />
                                          </colgroup>
                                          <thead>
                                            <tr className="text-foreground bg-info/20 border-b-2 border-info/30">
                                              <th className="text-right p-2 font-semibold">
                                                اسم المادة / الوصف التفصيلي
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الوحدة
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الكمية المطلوبة
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                سعر الوحدة (ر.س)
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الإجمالي (ر.س)
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                ملاحظات
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {materials.map((material, materialIndex) => {
                                              const materialKey =
                                                material.id ??
                                                `${renderKey}-material-${materialIndex}`
                                              const materialQuantitySource = pickNumeric(
                                                material.quantity,
                                                material.count,
                                              )
                                              const materialQuantityNumeric =
                                                toNumber(materialQuantitySource)
                                              const materialQuantityDisplay =
                                                materialQuantityNumeric !== null
                                                  ? formatQuantity(materialQuantityNumeric, {
                                                      maximumFractionDigits: 2,
                                                    })
                                                  : ((materialQuantitySource as string) ?? '-')
                                              const materialUnitPriceSource = pickNumeric(
                                                material.unitPrice,
                                                material.price,
                                                material.unitCost,
                                              )
                                              const materialTotalSource = pickNumeric(
                                                material.total,
                                              )
                                              return (
                                                <tr
                                                  key={materialKey}
                                                  className="odd:bg-card even:bg-muted/40 hover:bg-info/10 border-b border-border"
                                                >
                                                  <td className="p-2 text-right">
                                                    <div className="font-medium text-foreground">
                                                      {material.name ||
                                                        material.description ||
                                                        'مادة غير محددة'}
                                                    </div>
                                                    {material.specifications ? (
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                        {material.specifications}
                                                      </div>
                                                    ) : null}
                                                    {material.brand ? (
                                                      <div className="text-xs text-info mt-1">
                                                        العلامة التجارية: {material.brand}
                                                      </div>
                                                    ) : null}
                                                  </td>
                                                  <td className="p-2 text-center font-medium">
                                                    {material.unit || material.uom || '-'}
                                                  </td>
                                                  <td className="p-2 text-center font-bold text-info">
                                                    {materialQuantityDisplay}
                                                  </td>
                                                  <td className="p-2 text-center font-medium text-success">
                                                    {formatCurrencyOptional(
                                                      materialUnitPriceSource,
                                                      {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                      },
                                                    )}
                                                  </td>
                                                  <td className="p-2 text-center font-bold text-success bg-success/10">
                                                    {formatCurrencyOptional(materialTotalSource, {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    })}
                                                  </td>
                                                  <td className="p-2 text-center text-xs text-muted-foreground">
                                                    {material.notes || material.remarks || '-'}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                            <tr className="bg-info/20 border-t-2 border-info/30 font-bold">
                                              <td colSpan={4} className="p-2 text-right text-info">
                                                إجمالي تكلفة المواد:
                                              </td>
                                              <td className="p-2 text-center text-info bg-info/10">
                                                {formatCurrencyOptional(materialsTotal, {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })}
                                              </td>
                                              <td className="p-2"></td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                ) : null}

                                {/* جدول العمالة */}
                                {labor.length ? (
                                  <div>
                                    <div
                                      className="flex items-center justify-between cursor-pointer hover:bg-success/10 p-2 rounded-md border border-success/30"
                                      onClick={() => toggleCollapse(collapseKey, 'labor')}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-success rounded-full"></div>
                                        <div className="text-sm font-semibold text-success">
                                          العمالة والأيدي العاملة ({labor.length} نوع)
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-success border-success/30 text-xs bg-success/10"
                                        >
                                          إجمالي:{' '}
                                          {formatCurrencyOptional(laborTotal, {
                                            maximumFractionDigits: 0,
                                          })}
                                        </Badge>
                                      </div>
                                      {collapseState.labor ? (
                                        <ChevronUp className="w-5 h-5 text-success" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-success" />
                                      )}
                                    </div>
                                    {!collapseState.labor && (
                                      <div className="mt-2 overflow-x-auto border rounded-lg shadow-sm">
                                        <table className="w-full text-xs bg-card">
                                          <colgroup>
                                            <col className="w-[40%]" />
                                            <col className="w-[10%]" />
                                            <col className="w-[12%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[8%]" />
                                          </colgroup>
                                          <thead>
                                            <tr className="text-foreground bg-success/20 border-b-2 border-success/30">
                                              <th className="text-right p-2 font-semibold">
                                                نوع العمالة / التخصص
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الوحدة
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                عدد الساعات/الأيام
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                معدل الأجر (ر.س)
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الإجمالي (ر.س)
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                ملاحظات
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {labor.map((worker, workerIndex) => {
                                              const workerKey =
                                                worker.id ?? `${renderKey}-labor-${workerIndex}`
                                              const workerQuantityValue = toNumber(
                                                pickNumeric(
                                                  worker.quantity,
                                                  worker.hours,
                                                  worker.days,
                                                  worker.count,
                                                ),
                                              )
                                              const workerQuantityDisplay =
                                                workerQuantityValue !== null
                                                  ? formatQuantity(workerQuantityValue, {
                                                      maximumFractionDigits: 1,
                                                    })
                                                  : ((pickNumeric(
                                                      worker.quantity,
                                                      worker.hours,
                                                      worker.days,
                                                    ) as string) ?? '-')
                                              const workerRateSource = pickNumeric(
                                                worker.unitPrice,
                                                worker.price,
                                                worker.rate,
                                                worker.hourlyRate,
                                                worker.dailyRate,
                                              )
                                              const workerTotalSource = pickNumeric(worker.total)
                                              return (
                                                <tr
                                                  key={workerKey}
                                                  className="odd:bg-card even:bg-muted/40 hover:bg-success/10 border-b border-border"
                                                >
                                                  <td className="p-2 text-right">
                                                    <div className="font-medium text-foreground">
                                                      {worker.description ||
                                                        worker.type ||
                                                        'عمالة غير محددة'}
                                                    </div>
                                                    {worker.skill ? (
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                        المهارة: {worker.skill}
                                                      </div>
                                                    ) : null}
                                                    {worker.experience ? (
                                                      <div className="text-xs text-success mt-1">
                                                        الخبرة: {worker.experience}
                                                      </div>
                                                    ) : null}
                                                  </td>
                                                  <td className="p-2 text-center font-medium">
                                                    {worker.unit || worker.uom || 'ساعة'}
                                                  </td>
                                                  <td className="p-2 text-center font-bold text-success">
                                                    {workerQuantityDisplay}
                                                  </td>
                                                  <td className="p-2 text-center font-medium text-success">
                                                    {formatCurrencyOptional(workerRateSource, {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    })}
                                                  </td>
                                                  <td className="p-2 text-center font-bold text-success bg-success/10">
                                                    {formatCurrencyOptional(workerTotalSource, {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    })}
                                                  </td>
                                                  <td className="p-2 text-center text-xs text-muted-foreground">
                                                    {worker.notes || worker.remarks || '-'}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                            <tr className="bg-success/20 border-t-2 border-success/40 font-bold">
                                              <td
                                                colSpan={4}
                                                className="p-2 text-right text-success"
                                              >
                                                إجمالي تكلفة العمالة:
                                              </td>
                                              <td className="p-2 text-center text-success bg-success/10">
                                                {formatCurrencyOptional(laborTotal, {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })}
                                              </td>
                                              <td className="p-2"></td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                ) : null}

                                {/* جدول المعدات */}
                                {equipment.length ? (
                                  <div>
                                    <div
                                      className="flex items-center justify-between cursor-pointer hover:bg-warning/10 p-2 rounded-md border border-warning/30"
                                      onClick={() => toggleCollapse(collapseKey, 'equipment')}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-warning rounded-full"></div>
                                        <div className="text-sm font-semibold text-warning">
                                          المعدات والآلات ({equipment.length} معدة)
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-warning border-warning/30 text-xs bg-warning/10"
                                        >
                                          إجمالي:{' '}
                                          {formatCurrencyOptional(equipmentTotal, {
                                            maximumFractionDigits: 0,
                                          })}
                                        </Badge>
                                      </div>
                                      {collapseState.equipment ? (
                                        <ChevronUp className="w-5 h-5 text-warning" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-warning" />
                                      )}
                                    </div>
                                    {!collapseState.equipment && (
                                      <div className="mt-2 overflow-x-auto border rounded-lg shadow-sm">
                                        <table className="w-full text-xs bg-card">
                                          <colgroup>
                                            <col className="w-[40%]" />
                                            <col className="w-[10%]" />
                                            <col className="w-[12%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[8%]" />
                                          </colgroup>
                                          <thead>
                                            <tr className="text-foreground bg-warning/20 border-b-2 border-warning/30">
                                              <th className="text-right p-2 font-semibold">
                                                نوع المعدة / الوصف التقني
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الوحدة
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                عدد الساعات/الأيام
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                تكلفة الساعة (ر.س)
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الإجمالي (ر.س)
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                ملاحظات
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {equipment.map((machine, machineIndex) => {
                                              const machineKey =
                                                machine.id ??
                                                `${renderKey}-equipment-${machineIndex}`
                                              const machineQuantitySource = pickNumeric(
                                                machine.quantity,
                                                machine.hours,
                                                machine.days,
                                                machine.count,
                                              )
                                              const machineQuantityValue =
                                                toNumber(machineQuantitySource)
                                              const machineQuantityDisplay =
                                                machineQuantityValue !== null
                                                  ? formatQuantity(machineQuantityValue, {
                                                      maximumFractionDigits: 1,
                                                    })
                                                  : ((machineQuantitySource as string) ?? '-')
                                              const machineRateSource = pickNumeric(
                                                machine.unitPrice,
                                                machine.price,
                                                machine.rate,
                                                machine.hourlyRate,
                                                machine.dailyRate,
                                              )
                                              const machineTotalSource = pickNumeric(machine.total)
                                              return (
                                                <tr
                                                  key={machineKey}
                                                  className="odd:bg-card even:bg-muted/40 hover:bg-warning/10 border-b border-border"
                                                >
                                                  <td className="p-2 text-right">
                                                    <div className="font-medium text-foreground">
                                                      {machine.description ||
                                                        machine.name ||
                                                        'معدة غير محددة'}
                                                    </div>
                                                    {machine.model ? (
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                        الطراز: {machine.model}
                                                      </div>
                                                    ) : null}
                                                    {machine.capacity ? (
                                                      <div className="text-xs text-warning mt-1">
                                                        السعة: {machine.capacity}
                                                      </div>
                                                    ) : null}
                                                  </td>
                                                  <td className="p-2 text-center font-medium">
                                                    {machine.unit || machine.uom || 'ساعة'}
                                                  </td>
                                                  <td className="p-2 text-center font-bold text-warning">
                                                    {machineQuantityDisplay}
                                                  </td>
                                                  <td className="p-2 text-center font-medium text-success">
                                                    {formatCurrencyOptional(machineRateSource, {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    })}
                                                  </td>
                                                  <td className="p-2 text-center font-bold text-success bg-success/10">
                                                    {formatCurrencyOptional(machineTotalSource, {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    })}
                                                  </td>
                                                  <td className="p-2 text-center text-xs text-muted-foreground">
                                                    {machine.notes || machine.remarks || '-'}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                            <tr className="bg-warning/20 border-t-2 border-warning/40 font-bold">
                                              <td
                                                colSpan={4}
                                                className="p-2 text-right text-warning"
                                              >
                                                إجمالي تكلفة المعدات:
                                              </td>
                                              <td className="p-2 text-center text-warning bg-warning/10">
                                                {formatCurrencyOptional(equipmentTotal, {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })}
                                              </td>
                                              <td className="p-2"></td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                ) : null}

                                {/* جدول مقاولو الباطن */}
                                {subcontractors.length ? (
                                  <div>
                                    <div
                                      className="flex items-center justify-between cursor-pointer hover:bg-accent/10 p-2 rounded-md border border-accent/30"
                                      onClick={() => toggleCollapse(collapseKey, 'subcontractors')}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-accent rounded-full"></div>
                                        <div className="text-sm font-semibold text-accent">
                                          مقاولو الباطن والمتخصصون ({subcontractors.length} مقاول)
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-accent border-accent/30 text-xs bg-accent/10"
                                        >
                                          إجمالي:{' '}
                                          {formatCurrencyOptional(subcontractorTotal, {
                                            maximumFractionDigits: 0,
                                          })}
                                        </Badge>
                                      </div>
                                      {collapseState.subcontractors ? (
                                        <ChevronUp className="w-5 h-5 text-accent" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-accent" />
                                      )}
                                    </div>
                                    {!collapseState.subcontractors && (
                                      <div className="mt-2 overflow-x-auto border rounded-lg shadow-sm">
                                        <table className="w-full text-xs bg-card">
                                          <colgroup>
                                            <col className="w-[40%]" />
                                            <col className="w-[10%]" />
                                            <col className="w-[12%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[8%]" />
                                          </colgroup>
                                          <thead>
                                            <tr className="text-foreground bg-accent/20 border-b-2 border-accent/30">
                                              <th className="text-right p-2 font-semibold">
                                                اسم المقاول / نوع الخدمة
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الوحدة
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الكمية المطلوبة
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                سعر الوحدة (ر.س)
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                الإجمالي (ر.س)
                                              </th>
                                              <th className="text-center p-2 font-semibold">
                                                ملاحظات
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {subcontractors.map((contractor, contractorIndex) => {
                                              const contractorKey =
                                                contractor.id ??
                                                `${renderKey}-subcontractor-${contractorIndex}`
                                              const contractorQuantitySource = pickNumeric(
                                                contractor.quantity,
                                                contractor.count,
                                              )
                                              const contractorQuantityValue =
                                                toNumber(contractorQuantitySource)
                                              const contractorQuantityDisplay =
                                                contractorQuantityValue !== null
                                                  ? formatQuantity(contractorQuantityValue, {
                                                      maximumFractionDigits: 2,
                                                    })
                                                  : ((contractorQuantitySource as string) ?? '-')
                                              const contractorRateSource = pickNumeric(
                                                contractor.unitPrice,
                                                contractor.price,
                                                contractor.rate,
                                              )
                                              const contractorTotalSource = pickNumeric(
                                                contractor.total,
                                              )
                                              return (
                                                <tr
                                                  key={contractorKey}
                                                  className="odd:bg-card even:bg-muted/40 hover:bg-accent/10 border-b border-border"
                                                >
                                                  <td className="p-2 text-right">
                                                    <div className="font-medium text-foreground">
                                                      {contractor.description ||
                                                        contractor.name ||
                                                        contractor.contractor ||
                                                        'مقاول غير محدد'}
                                                    </div>
                                                    {contractor.specialty ? (
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                        التخصص: {contractor.specialty}
                                                      </div>
                                                    ) : null}
                                                    {contractor.company ? (
                                                      <div className="text-xs text-accent mt-1">
                                                        الشركة: {contractor.company}
                                                      </div>
                                                    ) : null}
                                                  </td>
                                                  <td className="p-2 text-center font-medium">
                                                    {contractor.unit || contractor.uom || 'مقطوعية'}
                                                  </td>
                                                  <td className="p-2 text-center font-bold text-accent">
                                                    {contractorQuantityDisplay}
                                                  </td>
                                                  <td className="p-2 text-center font-medium text-success">
                                                    {formatCurrencyOptional(contractorRateSource, {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    })}
                                                  </td>
                                                  <td className="p-2 text-center font-bold text-success bg-success/10">
                                                    {formatCurrencyOptional(contractorTotalSource, {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    })}
                                                  </td>
                                                  <td className="p-2 text-center text-xs text-muted-foreground">
                                                    {contractor.notes || contractor.remarks || '-'}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                            <tr className="bg-accent/20 border-t-2 border-accent/40 font-bold">
                                              <td
                                                colSpan={4}
                                                className="p-2 text-right text-accent"
                                              >
                                                إجمالي تكلفة مقاولي الباطن:
                                              </td>
                                              <td className="p-2 text-center text-accent bg-accent/10">
                                                {formatCurrencyOptional(subcontractorTotal, {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })}
                                              </td>
                                              <td className="p-2"></td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                })()}
              </tbody>
              {hasPricingData && pricingTotals?.totalValue !== undefined && (
                <tfoot>
                  <tr className="bg-muted font-bold">
                    <td
                      colSpan={hasPricingData ? 6 : 4}
                      className="border border-border p-2 text-right text-sm"
                    >
                      الإجمالي العام (من صفحة التسعير):
                    </td>
                    <td className="border border-border p-2 text-center text-success text-sm font-bold">
                      {formatCurrencyOptional(pricingTotals.totalValue, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="border border-border p-2"></td>
                    <td className="border border-border p-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        <div className="text-sm text-muted-foreground text-center mt-4">
          إجمالي البنود: {finalQuantityData.length} • المصدر: {sourceLabelMap[unified.source]}
        </div>
      </div>
    )
  }

  // دالة لعرض المرفقات
  const renderAttachments = () => {
    // 1. جلب المرفقات الأصلية من بيانات المنافسة
    const originalAttachments: TenderAttachment[] = Array.isArray(tender.attachments)
      ? tender.attachments
      : []

    // 2. جلب الملفات الفنية من خدمة رفع الملفات (من تبويب العرض الفني)
    let technicalFiles: TenderAttachment[] = []

    try {
      technicalFiles = FileUploadService.getFilesByTender(tender.id).map(
        (file): TenderAttachment => ({
          id: file.id,
          name: file.name,
          type: file.type,
          mimeType: file.type,
          size: file.size,
          uploadDate: file.uploadDate,
          source: 'technical',
          tenderId: file.tenderId,
          originalFile: file,
        }),
      )
    } catch (error) {
      console.log('خطأ في قراءة الملفات الفنية:', error)
    }

    console.log('Checking for attachments for tender:', tender.id)
    console.log('Original attachments:', originalAttachments)
    console.log('Technical files found:', technicalFiles)

    // 3. دمج المرفقات الأصلية مع الملفات الفنية
    const allAttachments: TenderAttachment[] = [...originalAttachments, ...technicalFiles]

    console.log('All attachments (original + technical):', allAttachments)

    // إذا لم توجد مرفقات، استخدم بيانات افتراضية للعرض
    if (allAttachments.length === 0) {
      allAttachments.push(
        {
          name: 'كراسة الشروط والمواصفات.pdf',
          type: 'specifications',
          size: '2.5 MB',
          uploadDate: '2024-08-15',
          source: 'original',
        },
        {
          name: 'جدول الكميات.xlsx',
          type: 'quantity',
          size: '1.2 MB',
          uploadDate: '2024-08-15',
          source: 'original',
        },
        {
          name: 'المخططات المعمارية.dwg',
          type: 'drawings',
          size: '8.7 MB',
          uploadDate: '2024-08-15',
          source: 'original',
        },
        {
          name: 'تقرير الموقع.pdf',
          type: 'report',
          size: '3.1 MB',
          uploadDate: '2024-08-15',
          source: 'original',
        },
        {
          name: 'العرض الفني والمواصفات التقنية.pdf',
          type: 'technical',
          size: '4.8 MB',
          uploadDate: '2024-08-20',
          source: 'technical',
        },
      )
    }

    const getFileIcon = (type: string) => {
      switch (type) {
        case 'pdf':
        case 'specifications':
        case 'report':
          return <FileText className="w-5 h-5 text-destructive" />
        case 'excel':
        case 'quantity':
          return <Grid3X3 className="w-5 h-5 text-success" />
        case 'dwg':
        case 'drawings':
          return <Building2 className="w-5 h-5 text-info" />
        case 'technical':
          return <CheckCircle className="w-5 h-5 text-accent" />
        default:
          return <FileText className="w-5 h-5 text-muted-foreground" />
      }
    }

    const handlePreview = (attachment: TenderAttachment) => {
      if (attachment.source === 'technical') {
        alert(`معاينة الملف الفني: ${attachment.name}\n\nهذا الملف تم رفعه من خلال صفحة التسعير`)
      } else {
        alert(`معاينة الملف: ${attachment.name}\n\nهذه الميزة ستكون متاحة قريباً`)
      }
    }

    const handleDownload = (attachment: TenderAttachment) => {
      if (attachment.source === 'technical') {
        alert(`تحميل الملف الفني: ${attachment.name}\n\nهذا الملف تم رفعه من خلال صفحة التسعير`)
      } else {
        alert(`تحميل الملف: ${attachment.name}\n\nهذه الميزة ستكون متاحة قريباً`)
      }
    }

    return (
      <div className="space-y-4">
        {technicalFiles.length > 0 && (
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <div className="flex items-center gap-2 text-accent">
              <CheckCircle className="w-5 h-5 text-accent" />
              <p className="font-medium">الملفات الفنية من التسعير</p>
            </div>
            <p className="text-sm text-accent mt-1">
              تم العثور على {technicalFiles.length} ملف فني تم رفعه من خلال صفحة التسعير.
            </p>
          </div>
        )}

        {allAttachments.map((attachment, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">{getFileIcon(attachment.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{attachment.name || `مرفق ${index + 1}`}</p>
                      <Badge
                        variant={attachment.source === 'technical' ? 'secondary' : 'outline'}
                        className={
                          attachment.source === 'technical'
                            ? 'bg-accent/10 text-accent border-accent/30'
                            : ''
                        }
                      >
                        {attachment.source === 'technical' ? 'ملف فني' : 'مرفق أساسي'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {attachment.type && `نوع: ${attachment.type}`}
                      {attachment.size !== undefined &&
                        ` • حجم: ${formatAttachmentSize(attachment.size) ?? '-'}`}
                      {attachment.uploadDate && ` • تاريخ: ${attachment.uploadDate}`}
                      {attachment.source === 'pricing' && ` • من التسعير`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handlePreview(attachment)}
                  >
                    <Eye className="w-4 h-4" />
                    معاينة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="w-4 h-4" />
                    تحميل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // (import moved to top-level)

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
      case 'preparing':
        return 'جديدة'
      case 'under_action':
      case 'active':
        return 'تحت التنفيذ/التسعير'
      case 'ready_to_submit':
      case 'under_review':
        return 'جاهزة للإرسال'
      case 'pricing_in_progress':
        return 'جاري التسعير'
      case 'pricing_completed':
        return 'تم التسعير'
      case 'submitted':
        return 'بانتظار النتائج'
      case 'won':
        return 'فائزة'
      case 'lost':
        return 'خاسرة'
      case 'expired':
        return 'منتهية'
      case 'cancelled':
        return 'تم إلغاؤها'
      default:
        return 'غير محدد'
    }
  }

  return (
    <div className="p-4 lg:p-6 min-h-screen bg-muted overflow-y-auto" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowRight className="h-4 w-4" /> العودة
            </Button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">{tender.name}</h1>
              <p className="text-sm text-muted-foreground">
                {tender.client || tender.ownerEntity || 'غير محدد'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* زر تقديم العرض - يظهر للمنافسات الجاهزة تماماً */}
            {(tender.status === 'ready_to_submit' || isReadyToSubmit) && (
              <Button
                onClick={handleSubmitTender}
                className="gap-2 bg-success text-success-foreground hover:bg-success/90"
              >
                <Send className="h-4 w-4" />
                ارسال
              </Button>
            )}

            {/* مدير حالات المنافسة - يظهر للحالات المناسبة */}
            {tender.status === 'submitted' && <TenderStatusManager tender={tender} />}

            <Badge className={`px-3 py-1 ${getStatusColor(tender.status)}`}>
              {getStatusText(tender.status)}
            </Badge>

            {/* معلومات إضافية حول جاهزية المنافسة */}
            {isReadyToSubmit && tender.status !== 'submitted' && (
              <Badge className="bg-success/10 text-success border-success/30">جاهزة للإرسال</Badge>
            )}
            {isPricingCompleted && !isTechnicalFilesUploaded && tender.status !== 'submitted' && (
              <Badge className="bg-warning/10 text-warning border-warning/30">
                يحتاج ملفات فنية
              </Badge>
            )}
          </div>
        </div>

        {/* سيتم عرض البطاقات الجديدة داخل تبويب جدول الكميات لضمان تطابق تصميم الصورة */}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-4">
            <TabsList className="grid grid-cols-5 w-full max-w-4xl" dir="rtl">
              <TabsTrigger value="general" className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                معلومات عامة
              </TabsTrigger>
              <TabsTrigger value="quantity" className="text-sm flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                جدول الكميات
              </TabsTrigger>
              <TabsTrigger value="attachments" className="text-sm flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                المرفقات
              </TabsTrigger>
              <TabsTrigger value="workflow" className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                إدارة النتائج
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                الجدول الزمني
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-300px)] pb-6">
            <TabsContent value="general" className="mt-6" dir="rtl">
              {/* تنبيه حالة التسعير والملفات الفنية */}
              {isReadyToSubmit && (
                <div className="mb-4 p-4 bg-success/10 border border-success/30 rounded-lg">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-medium">جاهزة للإرسال</p>
                  </div>
                  <p className="text-sm text-success mt-1 opacity-80">
                    تم إكمال التسعير ورفع الملفات الفنية بنجاح. يمكنك الآن إرسال العرض للمنافسة.
                  </p>
                </div>
              )}

              {isPricingCompleted && !isTechnicalFilesUploaded && (
                <div className="mb-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">يحتاج ملفات فنية</p>
                  </div>
                  <p className="text-sm text-warning mt-1 opacity-90">
                    تم إكمال التسعير ولكن لم يتم رفع الملفات الفنية بعد. يرجى الذهاب إلى صفحة
                    التسعير وتبويب &quot;العرض الفني&quot; لرفع الملفات المطلوبة.
                  </p>
                </div>
              )}

              {!isPricingCompleted && (
                <div className="mb-4 p-4 bg-info/10 border border-info/30 rounded-lg">
                  <div className="flex items-center gap-2 text-info">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">التسعير غير مكتمل</p>
                  </div>
                  <p className="text-sm text-info mt-1 opacity-90">
                    لم يتم إكمال تسعير هذه المنافسة بعد. يرجى الذهاب إلى صفحة التسعير لإكمال العملية
                    قبل إرسال العرض.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      معلومات عامة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">العميل</div>
                        <div className="font-medium">
                          {tender.client || tender.ownerEntity || 'غير محدد'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">النوع</div>
                        <div className="font-medium">{tender.type || 'غير محدد'}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground mb-1 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          الموقع
                        </div>
                        <div className="font-medium">{tender.location || 'غير محدد'}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground mb-1">الوصف</div>
                        <div className="font-medium text-muted-foreground">
                          {tender.description || tender.scope || 'لا يوجد وصف متاح'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      المواعيد والقيمة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">الموعد النهائي</div>
                        <div className="font-medium">{tender.deadline || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">تاريخ التقديم</div>
                        <div className="font-medium">{tender.submissionDate || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">مدة التنفيذ</div>
                        <div className="font-medium">
                          {tender.executionPeriod || tender.projectDuration || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">سعر الكراسة</div>
                        <div className="font-medium">
                          {(() => {
                            const documentPrice = tender.documentPrice
                            const bookletPrice = tender.bookletPrice
                            const rawPrice = documentPrice ?? bookletPrice

                            if (rawPrice === null || rawPrice === undefined || rawPrice === '') {
                              return '-'
                            }

                            const numeric =
                              typeof rawPrice === 'string'
                                ? Number.parseFloat(rawPrice)
                                : Number(rawPrice)

                            if (!Number.isFinite(numeric) || numeric <= 0) {
                              return '-'
                            }

                            return formatCurrencyValue(numeric, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })
                          })()}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground mb-1 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          القيمة المتوقعة
                        </div>
                        <div className="font-bold text-lg text-success">
                          {/* أولوية للقيمة المحسوبة من التسعير، ثم القيمة الأساسية */}
                          {tender.totalValue !== undefined && tender.totalValue !== null
                            ? `${formatCurrencyValue(tender.totalValue)} (من التسعير)`
                            : tender.value !== undefined && tender.value !== null
                              ? formatCurrencyValue(tender.value)
                              : '-'}
                        </div>
                        {tender.totalValue && tender.value && (
                          <div className="text-xs text-muted-foreground mt-1">
                            القيمة الأولية: {formatCurrencyValue(tender.value)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* معلومات إضافية */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>معلومات تقنية ومالية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">رقم المنافسة</div>
                        <div className="font-medium">{tender.tenderNumber || tender.id || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">المصدر</div>
                        <div className="font-medium">{tender.source || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">التصنيف</div>
                        <div className="font-medium">
                          {tender.category || tender.classification || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">تاريخ البدء</div>
                        <div className="font-medium">{tender.startDate || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">تاريخ الانتهاء</div>
                        <div className="font-medium">{tender.endDate || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">نوع العقد</div>
                        <div className="font-medium">{tender.contractType || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">طريقة الدفع</div>
                        <div className="font-medium">{tender.paymentMethod || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">ضمان العرض</div>
                        <div className="font-medium">
                          {tender.bidBond !== undefined &&
                          tender.bidBond !== null &&
                          tender.bidBond !== ''
                            ? formatCurrencyValue(tender.bidBond, { maximumFractionDigits: 0 })
                            : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">ضمان الأداء</div>
                        <div className="font-medium">
                          {tender.performanceBond ? `${tender.performanceBond}%` : '-'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="quantity" className="mt-6" dir="rtl">
              {/* بطاقات التسعير الخمس - تعرض القيم المخزنة (لا يتم إعادة حساب هنا) */}
              {pricingTotals &&
                (() => {
                  const cardBase = 'rounded-lg p-4 flex flex-col gap-1 border shadow-sm'
                  const fmt = (
                    value: NumericValue,
                    options?: Parameters<typeof formatCurrencyValue>[1],
                  ) => formatCurrencyOptional(value, options)
                  const pct = (value?: number) =>
                    typeof value === 'number' ? `${value.toFixed(2)}%` : '—'
                  const toneStyles: Record<
                    'primary' | 'warning' | 'success' | 'accent' | 'info',
                    {
                      container: string
                      value: string
                    }
                  > = {
                    primary: {
                      container: 'bg-primary/10 border border-primary/20',
                      value: 'text-primary',
                    },
                    warning: {
                      container: 'bg-warning/10 border border-warning/30',
                      value: 'text-warning',
                    },
                    success: {
                      container: 'bg-success/10 border border-success/30',
                      value: 'text-success',
                    },
                    accent: {
                      container: 'bg-accent/10 border border-accent/30',
                      value: 'text-accent',
                    },
                    info: { container: 'bg-info/10 border border-info/30', value: 'text-info' },
                  }
                  const summaryCards = [
                    {
                      key: 'totalValue',
                      label: 'إجمالي المشروع',
                      value: fmt(pricingTotals.totalValue),
                      hint: 'ر.س (قبل الضريبة)',
                      tone: 'primary' as const,
                    },
                    {
                      key: 'vatAmount',
                      label: `ضريبة القيمة المضافة (${pricingTotals.vatRate != null ? (pricingTotals.vatRate * 100).toFixed(0) : '15'}%)`,
                      value: fmt(pricingTotals.vatAmount),
                      hint: 'ر.س',
                      tone: 'warning' as const,
                    },
                    {
                      key: 'totalWithVat',
                      label: 'الإجمالي شامل الضريبة',
                      value: fmt(pricingTotals.totalWithVat),
                      hint: 'ر.س',
                      tone: 'success' as const,
                    },
                    {
                      key: 'profit',
                      label: `إجمالي الربح (${pct(pricingTotals.profitPercentage)})`,
                      value: fmt(pricingTotals.profit),
                      hint: 'ر.س',
                      tone: 'accent' as const,
                    },
                    {
                      key: 'adminOperational',
                      label: `التكاليف الإدارية + التشغيلية (${pct(pricingTotals.adminOperationalPercentage)})`,
                      value: fmt(pricingTotals.adminOperational),
                      hint: 'ر.س',
                      tone: 'info' as const,
                    },
                  ]

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        {summaryCards.map((card) => (
                          <div
                            key={card.key}
                            className={`${cardBase} ${toneStyles[card.tone].container}`}
                          >
                            <span className="text-xs font-medium text-muted-foreground">
                              {card.label}
                            </span>
                            <span
                              className={`text-xl font-bold ltr-numbers ${toneStyles[card.tone].value}`}
                            >
                              {card.value}
                            </span>
                            <span className="text-xs text-muted-foreground">{card.hint}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        📊 القيم مصدرها{' '}
                        {unified.source === 'central-boq'
                          ? 'النظام المركزي (BOQ)'
                          : unified.source === 'legacy'
                            ? 'البيانات التقليدية (Legacy)'
                            : 'غير متوفر'}{' '}
                        – لا يعاد حسابها هنا.
                      </div>
                    </div>
                  )
                })()}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5" />
                    جدول الكميات
                  </CardTitle>
                </CardHeader>
                <CardContent>{renderQuantityTable()}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-6" dir="rtl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    المرفقات والمستندات
                  </CardTitle>
                </CardHeader>
                <CardContent>{renderAttachments()}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6" dir="rtl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    الجدول الزمني للمنافسة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-info/10 rounded-lg">
                      <div className="p-2 bg-info/20 rounded-full">
                        <Calendar className="w-4 h-4 text-info" />
                      </div>
                      <div>
                        <p className="font-medium">تاريخ النشر</p>
                        <p className="text-sm text-muted-foreground">
                          {tender.publishDate || 'غير محدد'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-warning/10 rounded-lg">
                      <div className="p-2 bg-warning/20 rounded-full">
                        <ExternalLink className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium">آخر موعد للاستفسارات</p>
                        <p className="text-sm text-muted-foreground">
                          {tender.inquiryDeadline || 'غير محدد'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg">
                      <div className="p-2 bg-destructive/20 rounded-full">
                        <Clock className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">آخر موعد للتقديم</p>
                        <p className="text-sm text-muted-foreground">
                          {tender.deadline || 'غير محدد'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-success/10 rounded-lg">
                      <div className="p-2 bg-success/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">تاريخ إعلان النتائج</p>
                        <p className="text-sm text-muted-foreground">
                          {tender.resultDate || 'غير محدد'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب إدارة النتائج */}
            <TabsContent value="workflow" className="mt-6" dir="rtl">
              <div className="space-y-6">
                {/* طريقة إدخال النتائج السريعة */}
                <TenderQuickResults
                  tender={localTender}
                  onUpdate={() => {
                    // تحديث البيانات باستخدام نظام الأحداث
                    void import('../events/bus').then(({ APP_EVENTS, emit }) =>
                      emit(APP_EVENTS.TENDER_UPDATED),
                    )
                  }}
                />

                {/* الطريقة التقليدية لإدارة النتائج */}
                <TenderResultsManager
                  tender={localTender}
                  onUpdate={() => {
                    // تحديث البيانات باستخدام نظام الأحداث
                    void import('../events/bus').then(({ APP_EVENTS, emit }) =>
                      emit(APP_EVENTS.TENDER_UPDATED),
                    )
                  }}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* حوار تأكيد تقديم العرض */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-success" />
              تأكيد تقديم العرض
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تقديم العرض للمنافسة &quot;{tender.name}&quot;؟
              <br />
              سيتم تغيير حالة المنافسة إلى &quot;تم التقديم&quot; ولن يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              تأكيد الارسال
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
