// TendersPage shows the tenders dashboard, filters, and quick actions.
import { useState, useMemo, useCallback } from 'react'
import {
  Trophy,
  Search,
  ListChecks,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react'

import type { Tender } from '@/data/centralData'

// Utilities from shared/utils
import {
  type TenderTabId,
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
import {
  TenderTabs,
  TenderDeleteDialog,
  TenderPerformanceCards,
  TenderDetails,
  EnhancedTenderCard,
} from '@/presentation/components/tenders'
import { SubmitReviewDialog } from './components/SubmitReviewDialog'

import { PageLayout, EmptyState } from '@/presentation/components/layout/PageLayout'
import { StatusBadge } from '@/presentation/components/ui/status-badge'
import { TenderPricingPage, type TenderWithPricingSources } from './TenderPricingPage'
import { TenderResultsManager } from './components/TenderResultsManager'

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

  const filteredTenders = useMemo(
    () => computeFilteredTenders(tenders, normalisedSearch, activeTab),
    [tenders, normalisedSearch, activeTab],
  )

  const quickActions = useMemo(() => createQuickActions(onSectionChange), [onSectionChange])

  const handleTabChange = useCallback((tabId: TenderTabId) => {
    setActiveTab(tabId)
  }, [])

  // Event listeners
  useTenderDetailNavigation(tenders, navigateToDetails)
  useTenderPricingNavigation(tenders, navigateToPricing)
  useTenderUpdateListener(refreshTenders)

  // Event handlers
  const handleDelete = useMemo(
    () => createDeleteHandler(deleteTender, () => setTenderToDelete(null)),
    [deleteTender],
  )

  const handleSubmit = useMemo(
    () => createSubmitHandler(formatCurrencyValue, refreshTenders),
    [formatCurrencyValue, refreshTenders],
  )

  const handleRevert = useMemo(() => createRevertHandler(updateTender), [updateTender])

  const handleRevertStatus = useCallback(
    async (tender: Tender, newStatus: Tender['status']) => {
      if (tender.status === 'submitted' && newStatus === 'ready_to_submit') {
        const { purchaseOrderService } = await import('@/application/services/purchaseOrderService')
        await purchaseOrderService.deleteTenderRelatedOrders(tender.id)
      }
      await handleRevert({ ...tender, status: newStatus } as Tender)
    },
    [handleRevert],
  )

  const handleEditTender = useCallback(
    (tender: Tender) => {
      setSelectedTender(tender)
      onSectionChange('new-tender', tender)
    },
    [onSectionChange, setSelectedTender],
  )

  // شريط المعلومات العلوي مع البطاقات التحليلية - مثل صفحة المشاريع
  const headerMetadata = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
        <StatusBadge
          status="default"
          label={`الكل ${tenderSummary.total}`}
          icon={ListChecks}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={tenderSummary.urgent > 0 ? 'warning' : 'default'}
          label={`عاجل ${tenderSummary.urgent}`}
          icon={AlertTriangle}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={tenderSummary.new > 0 ? 'info' : 'default'}
          label={`جديد ${tenderSummary.new}`}
          icon={FileText}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={tenderSummary.underAction > 0 ? 'info' : 'default'}
          label={`تحت الإجراء ${tenderSummary.underAction}`}
          icon={Clock}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={tenderSummary.waitingResults > 0 ? 'warning' : 'default'}
          label={`بانتظار النتائج ${tenderSummary.waitingResults}`}
          icon={Calendar}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={tenderSummary.won > 0 ? 'success' : 'default'}
          label={`فائز ${tenderSummary.won}`}
          icon={CheckCircle}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status={tenderSummary.lost > 0 ? 'error' : 'default'}
          label={`خاسر ${tenderSummary.lost}`}
          icon={XCircle}
          size="sm"
          className="shadow-none"
        />
        <StatusBadge
          status="info"
          label={`معدل الفوز ${tenderSummary.winRate.toFixed(1)}%`}
          icon={Trophy}
          size="sm"
          className="shadow-none"
        />
      </div>
    ),
    [tenderSummary],
  )

  const headerExtraContent = useMemo(
    () => (
      <div className="space-y-4">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
          {headerMetadata}
        </div>
        <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
          <TenderPerformanceCards tenderSummary={tenderSummary} />
        </div>
      </div>
    ),
    [headerMetadata, tenderSummary],
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
                onSubmitTender={setTenderToSubmit}
                onEdit={handleEditTender}
                onDelete={setTenderToDelete}
                onOpenResults={navigateToResults}
                onRevertStatus={handleRevertStatus}
                formatCurrencyValue={formatCurrencyValue}
              />
            ))}
          </div>
        ) : tenders.length > 0 ? (
          <EmptyState
            title="لا توجد منافسات مطابقة"
            description={getFilterDescription(
              normalisedSearch,
              getActiveTabLabel(tabsWithCounts, activeTab),
            )}
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

      <TenderDeleteDialog
        tender={tenderToDelete}
        onConfirm={async () => tenderToDelete && (await handleDelete(tenderToDelete))}
        onCancel={() => setTenderToDelete(null)}
      />

      <SubmitReviewDialog
        open={!!tenderToSubmit}
        tender={tenderToSubmit}
        onClose={() => setTenderToSubmit(null)}
        onConfirm={async () => {
          if (tenderToSubmit) {
            try {
              await handleSubmit(tenderToSubmit)
            } finally {
              setTenderToSubmit(null)
            }
          }
        }}
      />
    </>
  )
}
