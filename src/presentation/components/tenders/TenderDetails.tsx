// TenderDetails renders the full tender workspace with tabs, documents, and workflow.
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog'
import { Calendar, ArrowRight, FileText, Paperclip, Grid3X3, Info, Send } from 'lucide-react'
import { toast } from 'sonner'
import type { Tender } from '@/data/centralData'
import type { UploadedFile } from '@/shared/utils/fileUploadService'
import { TenderStatusManager } from '@/presentation/pages/Tenders/components/TenderStatusManager'
import { APP_EVENTS } from '@/events/bus'
import { FileUploadService } from '@/shared/utils/fileUploadService'
// (legacy pricingService import removed – unified hook supplies data)
// Removed pricingDataSyncService (legacy dual-write path)
// Removed normalizeAndEnrich / dedupePricingItems legacy enrichment utilities – unified hook supplies final items
// Removed direct snapshot utilities & metrics – unified hook manages snapshot reading
// Removed useTenderPricing (legacy hook) – unified hook is now sole source of truth here
import { useUnifiedTenderPricing } from '@/application/hooks/useUnifiedTenderPricing'
import { getStatusColor } from '@/shared/utils/ui/statusColors'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
// Import extracted tabs
import {
  GeneralInfoTab,
  QuantitiesTab,
  AttachmentsTab,
  TimelineTab,
  WorkflowTab,
} from './TenderDetails/tabs'
/**
 * Phase 1 Pricing Engine Adoption (READ PATH ONLY)
 * ------------------------------------------------
 * This component now supports an engine-based enrichment path guarded by PRICING_FLAGS.USE_ENGINE_DETAILS.
 * Quick rollback: set PRICING_FLAGS.USE_ENGINE_DETAILS = false in pricingHelpers.ts to restore legacy reconstruction.
 * Diff logging: enabled via PRICING_FLAGS.DIFF_LOGGING; threshold configurable (DIFF_THRESHOLD_PERCENT).
 * Removal plan: once diffs remain stable (<0.5%) for a full release cycle, delete legacyReconstruct() and related code.
 */
// legacy normalizePricing utilities removed (buildPricingMap no longer needed after snapshot adoption)

/**
 * Props for TenderDetails component
 */
interface TenderDetailsProps {
  /** The tender to display details for */
  tender: Tender
  /** Callback function to navigate back to the list */
  onBack: () => void
}

export function TenderDetails({ tender, onBack }: TenderDetailsProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [localTender, setLocalTender] = useState(tender)
  // تم إزالة جميع حالات وإعادة بناء snapshot القديمة – يتم الاعتماد بالكامل على useUnifiedTenderPricing

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
    (value: number | null | undefined, options?: Intl.NumberFormatOptions) => {
      const numeric = typeof value === 'number' ? value : Number(value ?? 0)
      const safeValue = Number.isFinite(numeric) ? numeric : 0
      if (!options) {
        return quantityFormatter.format(safeValue)
      }
      return new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options,
      }).format(safeValue)
    },
    [quantityFormatter],
  )
  // تشخيص مبسط للمصدر الموحد فقط
  useEffect(() => {
    console.log('[TenderDetails] Unified pricing diagnostic', {
      tenderId: tender?.id,
      unifiedStatus: unified.status,
      unifiedSource: unified.source,
      items: unified.items.length,
      hasTotals: !!unified.totals,
      totalsContent: unified.totals,
      firstItem: unified.items[0],
      itemsWithPrices: unified.items.filter((it) => it.unitPrice || it.totalPrice).length,
    })
  }, [
    unified.status,
    unified.source,
    unified.items.length,
    unified.totals,
    unified.items,
    tender?.id,
  ])

  // إعداد بيانات المرفقات
  const attachmentsData = useMemo(() => {
    const originalAttachments = (tender.documents || []).map((doc) => ({
      ...doc,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: (doc as any).type || doc.mimeType || 'application/octet-stream',
    }))
    let technicalFiles: (UploadedFile & { source?: string })[] = []

    try {
      technicalFiles = FileUploadService.getFilesByTender(tender.id).map((file) => ({
        ...file,
        source: 'technical' as const,
      }))
    } catch (error) {
      console.log('خطأ في قراءة الملفات الفنية:', error)
    }

    const allAttachments = [...originalAttachments, ...technicalFiles]

    return {
      allAttachments,
      technicalFilesCount: technicalFiles.length,
    }
  }, [tender.documents, tender.id])

  const handlePreviewAttachment = useCallback((attachment: UploadedFile & { source?: string }) => {
    if (attachment.source === 'technical') {
      alert(`معاينة الملف الفني: ${attachment.name}\n\nهذا الملف تم رفعه من خلال صفحة التسعير`)
    } else {
      alert(`معاينة الملف: ${attachment.name}\n\nهذه الميزة ستكون متاحة قريباً`)
    }
  }, [])

  const handleDownloadAttachment = useCallback((attachment: UploadedFile & { source?: string }) => {
    if (attachment.source === 'technical') {
      alert(`تحميل الملف الفني: ${attachment.name}\n\nهذا الملف تم رفعه من خلال صفحة التسعير`)
    } else {
      alert(`تحميل الملف: ${attachment.name}\n\nهذه الميزة ستكون متاحة قريباً`)
    }
  }, [])

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

  // Extracted to AttachmentsTab component

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
              <p className="text-sm text-muted-foreground">{tender.client || 'غير محدد'}</p>
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

          <div className="pb-6">
            <TabsContent value="general" className="mt-6" dir="rtl">
              <GeneralInfoTab
                tender={tender}
                isReadyToSubmit={isReadyToSubmit}
                isPricingCompleted={isPricingCompleted}
                isTechnicalFilesUploaded={isTechnicalFilesUploaded}
                formatCurrencyValue={formatCurrencyValue}
              />
            </TabsContent>

            <TabsContent value="quantity" className="mt-6" dir="rtl">
              <QuantitiesTab
                tender={tender}
                unified={unified}
                formatCurrencyValue={formatCurrencyValue}
                formatQuantity={formatQuantity}
              />
            </TabsContent>

            <TabsContent value="attachments" className="mt-6" dir="rtl">
              <AttachmentsTab
                allAttachments={attachmentsData.allAttachments}
                technicalFilesCount={attachmentsData.technicalFilesCount}
                onPreview={handlePreviewAttachment}
                onDownload={handleDownloadAttachment}
              />
            </TabsContent>

            <TabsContent value="timeline" className="mt-6" dir="rtl">
              <TimelineTab tender={tender} />
            </TabsContent>

            {/* تبويب إدارة النتائج */}
            <TabsContent value="workflow" className="mt-6" dir="rtl">
              <WorkflowTab
                tender={tender}
                localTender={localTender}
                setLocalTender={setLocalTender}
              />
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
