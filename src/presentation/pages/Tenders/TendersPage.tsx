// TendersPage shows the tenders dashboard, filters, and quick actions.
import { useState, useMemo, useCallback } from 'react'
import { Trophy, Trash2, Send, Search } from 'lucide-react'

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
import {
  useTenderDetailNavigation,
  useTenderUpdateListener,
  useTenderPricingNavigation,
} from '@/application/hooks/useTenderEventListeners'
import { useTenderViewNavigation } from '@/application/hooks/useTenderViewNavigation'
import type { TenderMetricsSummary } from '@/domain/contracts/metrics'
import type { TenderMetrics as AggregatedTenderMetrics } from '@/domain/selectors/financialMetrics'
import { resolveTenderPerformance } from '@/domain/utils/tenderPerformance'

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

  const {
    currentView,
    selectedTender,
    setSelectedTender,
    backToList,
    navigateToPricing,
    navigateToDetails,
    navigateToResults,
  } = useTenderViewNavigation()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TenderTabId>('all')
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null)
  const [tenderToSubmit, setTenderToSubmit] = useState<Tender | null>(null)

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

  // Event listeners
  useTenderDetailNavigation(tenders, navigateToDetails)

  useTenderPricingNavigation(tenders, navigateToPricing)

  useTenderUpdateListener(refreshTenders)

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

  const handleSubmitTender = useCallback((tender: Tender) => {
    setTenderToSubmit(tender)
  }, [])

  const handleEditTender = useCallback(
    (tender: Tender) => {
      setSelectedTender(tender)
      onSectionChange('new-tender', tender)
    },
    [onSectionChange, setSelectedTender],
  )

  if (currentView === 'pricing' && selectedTender) {
    const tenderForPricing: TenderWithPricingSources = { ...selectedTender }
    return <TenderPricingPage tender={tenderForPricing} onBack={backToList} />
  }

  if (currentView === 'results' && selectedTender) {
    return <TenderResultsManager tender={selectedTender} onUpdate={backToList} />
  }

  if (currentView === 'details' && selectedTender) {
    return <TenderDetails tender={selectedTender} onBack={backToList} />
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
                onOpenDetails={navigateToDetails}
                onStartPricing={navigateToPricing}
                onSubmitTender={handleSubmitTender}
                onEdit={handleEditTender}
                onDelete={(value) => setTenderToDelete(value)}
                onOpenResults={navigateToResults}
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
