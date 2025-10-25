// TendersPage shows the tenders dashboard, filters, and quick actions.
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Trophy, Trash2, Send, Search } from 'lucide-react'

import { APP_EVENTS } from '@/events/bus'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import type { Tender } from '@/data/centralData'

// Utilities from shared/utils
import {
  type TenderTabId,
  getTenderDocumentPrice,
  normaliseSearchQuery,
  computeFilteredTenders,
} from '@/shared/utils/tender/tenderFilters'
import { computeTenderSummary } from '@/shared/utils/tender/tenderSummaryCalculator'
import {
  createTabsWithCounts,
  getActiveTabLabel,
  getFilterDescription,
} from '@/shared/utils/tender/tenderTabHelpers'
import { createQuickActions } from '@/shared/utils/tender/tenderQuickActions'
import {
  createDeleteHandler,
  createSubmitHandler,
  createRevertHandler,
} from '@/shared/utils/tender/tenderEventHandlers'

// Components
import { TenderMetricsDisplay } from '@/presentation/components/tenders/TenderMetricsDisplay'
import { TenderTabs } from '@/presentation/components/tenders/TenderTabs'

import { PageLayout, EmptyState } from '@/presentation/components/layout/PageLayout'
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
import { TenderPricingPage, type TenderWithPricingSources } from './TenderPricingPage'
import { TenderDetails } from '@/presentation/components/tenders/TenderDetails'
import { TenderResultsManager } from './components/TenderResultsManager'
import { EnhancedTenderCard } from '@/presentation/components/tenders/EnhancedTenderCard'

import { useFinancialState } from '@/application/context'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import type { TenderMetricsSummary } from '@/domain/contracts/metrics'
import type { TenderMetrics as AggregatedTenderMetrics } from '@/domain/selectors/financialMetrics'
import { resolveTenderPerformance } from '@/domain/utils/tenderPerformance'

const OPEN_PRICING_EVENT = 'openPricingForTender' as const

interface TenderEventDetail {
  tenderId?: string
  itemId?: string
}

interface TendersProps {
  onSectionChange: (section: string, tender?: Tender) => void
}

export function Tenders({ onSectionChange }: TendersProps) {
  const { tenders: tendersState, metrics } = useFinancialState()
  const { tenders: tendersData, deleteTender, refreshTenders, updateTender } = tendersState

  const tenders = useMemo(() => tendersData, [tendersData])
  const rawTenderMetrics = metrics.tenders as AggregatedTenderMetrics

  const tenderPerformance = useMemo<TenderMetricsSummary>(
    () => resolveTenderPerformance(rawTenderMetrics, tenders),
    [rawTenderMetrics, tenders],
  )

  const tenderMetrics = useMemo<AggregatedTenderMetrics>(
    () => ({
      ...rawTenderMetrics,
      performance: tenderPerformance,
    }),
    [rawTenderMetrics, tenderPerformance],
  )

  const { formatCurrencyValue } = useCurrencyFormatter()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TenderTabId>('all')
  const [currentView, setCurrentView] = useState<'list' | 'pricing' | 'details' | 'results'>('list')
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null)
  const [tenderToSubmit, setTenderToSubmit] = useState<Tender | null>(null)

  // Refs to prevent Event Loop (Fix #1)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  const normalisedSearch = useMemo(() => normaliseSearchQuery(searchTerm), [searchTerm])

  const tenderSummary = useMemo(
    () => computeTenderSummary(tenders, tenderMetrics, tenderPerformance),
    [tenders, tenderMetrics, tenderPerformance],
  )

  const tabsWithCounts = useMemo(() => createTabsWithCounts(tenderSummary), [tenderSummary])

  const activeTabLabel = useMemo(
    () => getActiveTabLabel(tabsWithCounts, activeTab),
    [tabsWithCounts, activeTab],
  )

  const filteredTenders = useMemo(
    () => computeFilteredTenders(tenders, normalisedSearch, activeTab),
    [tenders, normalisedSearch, activeTab],
  )

  const hasAnyTenders = tenders.length > 0

  const filterDescription = useMemo(
    () => getFilterDescription(normalisedSearch, activeTabLabel),
    [normalisedSearch, activeTabLabel],
  )

  const quickActions = useMemo(() => createQuickActions(onSectionChange), [onSectionChange])

  const headerExtraContent = useMemo(
    () => <TenderMetricsDisplay summary={tenderSummary} />,
    [tenderSummary],
  )

  const handleTabChange = useCallback((tabId: TenderTabId) => {
    setActiveTab(tabId)
  }, [])

  const tenderSubmissionPrice = useMemo(
    () => (tenderToSubmit ? getTenderDocumentPrice(tenderToSubmit) : 0),
    [tenderToSubmit],
  )

  useEffect(() => {
    const handler: EventListener = (event) => {
      const detail = (event as CustomEvent<TenderEventDetail>).detail
      const tenderId = detail?.tenderId
      if (!tenderId) {
        return
      }

      const targetTender = tenders.find((item) => item.id === tenderId)
      if (!targetTender) {
        return
      }

      setSelectedTender(targetTender)
      setCurrentView('details')
    }

    window.addEventListener(APP_EVENTS.OPEN_TENDER_DETAILS, handler)
    return () => {
      window.removeEventListener(APP_EVENTS.OPEN_TENDER_DETAILS, handler)
    }
  }, [tenders])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const onUpdated = (event?: Event) => {
      // Debug: Log event details to diagnose the issue
      console.log('🔍 [TendersPage onUpdated] Event received:', {
        hasEvent: !!event,
        isCustomEvent: event instanceof CustomEvent,
        detail: event instanceof CustomEvent ? event.detail : undefined,
        skipRefresh: event instanceof CustomEvent ? event.detail?.skipRefresh : undefined,
      })

      // Fix #2: فحص skipRefresh flag لمنع reload غير ضروري
      if (event instanceof CustomEvent && event.detail?.skipRefresh === true) {
        console.log('⏭️ تخطي إعادة التحميل - skipRefresh flag موجود')
        return
      }

      // Fix #1: منع re-entrance (Event Loop Guard)
      if (isRefreshingRef.current) {
        console.log('⏭️ تخطي إعادة التحميل - جاري التحميل بالفعل')
        return
      }

      // Fix #1: debounce لتجميع multiple updates في 500ms
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      refreshTimeoutRef.current = setTimeout(() => {
        isRefreshingRef.current = true
        console.log('🔄 تم تحديث بيانات المناقصات - إعادة التحميل')
        void refreshTenders().finally(() => {
          isRefreshingRef.current = false
        })
      }, 500)
    }

    window.addEventListener(APP_EVENTS.TENDERS_UPDATED, onUpdated)
    window.addEventListener(APP_EVENTS.TENDER_UPDATED, onUpdated)

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      window.removeEventListener(APP_EVENTS.TENDERS_UPDATED, onUpdated)
      window.removeEventListener(APP_EVENTS.TENDER_UPDATED, onUpdated)
    }
  }, [refreshTenders])

  // Event handlers
  const handleDelete = useMemo(
    () => createDeleteHandler(deleteTender, () => setTenderToDelete(null)),
    [deleteTender],
  )

  const handleConfirmDelete = useCallback(async () => {
    if (tenderToDelete) {
      await handleDelete(tenderToDelete)
    }
  }, [tenderToDelete, handleDelete])

  const handleSubmit = useMemo(
    () => createSubmitHandler(formatCurrencyValue, refreshTenders),
    [formatCurrencyValue, refreshTenders],
  )

  const handleConfirmSubmit = useCallback(async () => {
    if (!tenderToSubmit) return
    try {
      await handleSubmit(tenderToSubmit)
      setTenderToSubmit(null)
    } catch {
      setTenderToSubmit(null)
    }
  }, [tenderToSubmit, handleSubmit])

  const handleRevert = useMemo(() => createRevertHandler(updateTender), [updateTender])

  const handleRevertStatus = useCallback(
    async (tender: Tender, newStatus: Tender['status']) => {
      if (tender.status === 'submitted' && newStatus === 'ready_to_submit') {
        console.log('🗑️ التراجع من النتيجة للإرسال - حذف أوامر الشراء المرتبطة')
        const { purchaseOrderService } = await import('@/application/services/purchaseOrderService')
        const { deletedOrdersCount, deletedExpensesCount } =
          await purchaseOrderService.deleteTenderRelatedOrders(tender.id)
        console.log(`✅ تم حذف ${deletedOrdersCount} أمر شراء و ${deletedExpensesCount} مصروف`)
      }
      await handleRevert({ ...tender, status: newStatus } as Tender)
    },
    [handleRevert],
  )

  const handleStartPricing = useCallback((tender: Tender) => {
    setSelectedTender(tender)
    setCurrentView('pricing')
  }, [])

  const handleSubmitTender = useCallback((tender: Tender) => {
    setTenderToSubmit(tender)
  }, [])

  const handleOpenResults = useCallback((tender: Tender) => {
    setSelectedTender(tender)
    setCurrentView('results')
  }, [])

  const handleOpenDetails = useCallback((tender: Tender) => {
    setSelectedTender(tender)
    setCurrentView('details')
  }, [])

  const handleEditTender = useCallback(
    (tender: Tender) => {
      console.log('[TendersPage][handleEditTender] Editing tender:', tender)
      console.log('[TendersPage][handleEditTender] tender.id:', tender.id)
      console.log(
        '[TendersPage][handleEditTender] tender.quantities:',
        (tender as unknown as Record<string, unknown>).quantities,
      )
      console.log(
        '[TendersPage][handleEditTender] tender.quantityTable:',
        (tender as unknown as Record<string, unknown>).quantityTable,
      )

      setSelectedTender(tender)
      onSectionChange('new-tender', tender)
    },
    [onSectionChange],
  )

  const handleBackToList = useCallback(() => {
    setCurrentView('list')
    setSelectedTender(null)
  }, [])

  useEffect(() => {
    const handler: EventListener = (event) => {
      const detail = (event as CustomEvent<TenderEventDetail>).detail
      const tenderId = detail?.tenderId
      if (!tenderId) {
        return
      }

      const targetTender = tenders.find((tenderItem) => tenderItem.id === tenderId)
      if (!targetTender) {
        return
      }

      setSelectedTender(targetTender)
      setCurrentView('pricing')

      if (detail?.itemId) {
        try {
          safeLocalStorage.setItem('pricing:selectedItemId', detail.itemId)
        } catch (storageError) {
          console.warn('تعذر حفظ معرف بند التسعير المحدد', storageError)
        }
      }
    }

    window.addEventListener(OPEN_PRICING_EVENT, handler)
    return () => {
      window.removeEventListener(OPEN_PRICING_EVENT, handler)
    }
  }, [tenders])

  if (currentView === 'pricing' && selectedTender) {
    const tenderForPricing: TenderWithPricingSources = { ...selectedTender }
    return <TenderPricingPage tender={tenderForPricing} onBack={handleBackToList} />
  }

  if (currentView === 'results' && selectedTender) {
    return (
      <TenderResultsManager
        tender={selectedTender}
        onUpdate={() => {
          handleBackToList()
        }}
      />
    )
  }

  if (currentView === 'details' && selectedTender) {
    return <TenderDetails tender={selectedTender} onBack={handleBackToList} />
  }

  return (
    <>
      <PageLayout
        tone="primary"
        title="إدارة المنافسات"
        description="متابعة وإدارة جميع المنافسات والعطاءات بفعالية"
        icon={Trophy}
        quickStats={[]}
        quickActions={quickActions}
        headerExtra={headerExtraContent}
        showLastUpdate={false}
        showFilters={false}
        showSearch
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="البحث عن منافسة"
        tabs={
          <TenderTabs tabs={tabsWithCounts} activeTab={activeTab} onTabChange={handleTabChange} />
        }
      >
        {filteredTenders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTenders.map((tender, index) => (
              <EnhancedTenderCard
                key={tender.id}
                tender={tender}
                index={index}
                onOpenDetails={handleOpenDetails}
                onStartPricing={handleStartPricing}
                onSubmitTender={handleSubmitTender}
                onEdit={handleEditTender}
                onDelete={(value) => setTenderToDelete(value)}
                onOpenResults={handleOpenResults}
                onRevertStatus={handleRevertStatus}
                formatCurrencyValue={formatCurrencyValue}
              />
            ))}
          </div>
        ) : hasAnyTenders ? (
          <EmptyState
            title="لا توجد منافسات مطابقة"
            description={filterDescription}
            icon={Search}
          />
        ) : (
          <EmptyState
            title="لا توجد منافسات بعد"
            description="ابدأ بإضافة منافسة جديدة لإدارة دورة المناقصات من مكان واحد."
            icon={Trophy}
            actionLabel="إضافة منافسة جديدة"
            onAction={() => onSectionChange('new-tender')}
          />
        )}
      </PageLayout>

      <AlertDialog
        open={!!tenderToDelete}
        onOpenChange={(open) => !open && setTenderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المنافسة &quot;{tenderToDelete?.name}&quot;؟ هذا الإجراء لا يمكن
              التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!tenderToSubmit}
        onOpenChange={(open) => !open && setTenderToSubmit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-success" />
              تأكيد تقديم العرض
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>هل أنت متأكد من تقديم العرض للمنافسة &quot;{tenderToSubmit?.name}&quot;؟</p>

                {tenderSubmissionPrice > 0 ? (
                  <div className="rounded-lg border border-info/30 bg-info/10 p-3">
                    <p className="text-sm text-info font-medium">سيتم تلقائياً:</p>
                    <ul className="mt-1 space-y-1 text-xs text-info opacity-90">
                      <li>• تحديث حالة المنافسة إلى &ldquo;بانتظار النتائج&rdquo;</li>
                      <li>
                        • إضافة مصروف كراسة المنافسة ({formatCurrencyValue(tenderSubmissionPrice)})
                      </li>
                      <li>• تحديث إحصائيات المنافسات المقدمة</li>
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-sm text-muted-foreground">
                      سيتم تحديث حالة المنافسة إلى &ldquo;بانتظار النتائج&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              تأكيد التقديم
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
