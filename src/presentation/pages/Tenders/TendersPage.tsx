// TendersPage shows the tenders dashboard, filters, and quick actions.
import { useState, useMemo, useCallback } from 'react'
import { Trophy, Search } from 'lucide-react'

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
import {
  TenderDeleteDialog,
  TenderSubmitDialog,
} from '@/presentation/components/tenders/TenderDialogs'

import { PageLayout, EmptyState } from '@/presentation/components/layout/PageLayout'
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
        headerExtra={<TenderMetricsDisplay summary={tenderSummary} />}
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

      <TenderSubmitDialog
        tender={tenderToSubmit}
        submissionPrice={tenderToSubmit ? getTenderDocumentPrice(tenderToSubmit) : 0}
        formatCurrency={formatCurrencyValue}
        onConfirm={async () => {
          if (tenderToSubmit) {
            try {
              await handleSubmit(tenderToSubmit)
            } finally {
              setTenderToSubmit(null)
            }
          }
        }}
        onCancel={() => setTenderToSubmit(null)}
      />
    </>
  )
}
