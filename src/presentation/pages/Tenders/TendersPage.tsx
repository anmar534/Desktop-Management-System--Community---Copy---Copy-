// TendersPage shows the tenders dashboard, filters, and quick actions.
import { useState, useMemo, useCallback, useEffect } from 'react'
import { Trophy, Search } from 'lucide-react'

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
import { createDeleteHandler, createSubmitHandler } from '@/shared/utils/tender/tenderEventHandlers'
import { toast } from 'sonner'

// Components
import {
  TenderTabs,
  TenderDeleteDialog,
  TenderDetails,
  VirtualizedTenderList,
} from '@/presentation/components/tenders'
import { SubmitReviewDialog } from './components/SubmitReviewDialog'

import { PageLayout, EmptyState } from '@/presentation/components/layout/PageLayout'
import { TenderPricingPage, type TenderWithPricingSources } from './TenderPricingPage'
import { TenderResultsManager } from './components/TenderResultsManager'
import { TendersPagination } from './components/TendersPagination'
import { TendersHeaderSection } from './components/TendersHeaderSection'

import { useFinancialState } from '@/application/context'
import { useTenderListStore } from '@/application/stores/tenderListStoreAdapter'
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
  // Use new adapter-based store instead of context
  const { tenders, deleteTender, refreshTenders, updateTender } = useTenderListStore()

  // Still need metrics from context (until metrics are migrated)
  const { metrics } = useFinancialState()

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

  // Local pagination state for frontend-only pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(10)

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

  // Apply pagination to filtered tenders using local state
  const paginatedTenders = useMemo(() => {
    const startIndex = (currentPage - 1) * currentPageSize
    const endIndex = startIndex + currentPageSize
    return filteredTenders.slice(startIndex, endIndex)
  }, [filteredTenders, currentPage, currentPageSize])

  // Calculate total pages
  const totalPages = Math.ceil(filteredTenders.length / currentPageSize)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredTenders.length, activeTab, searchTerm])

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

  const handleRevertStatus = useCallback(
    async (tender: Tender, newStatus: Tender['status']) => {
      try {
        // Delete purchase orders if reverting from submitted
        if (tender.status === 'submitted' && newStatus === 'ready_to_submit') {
          const { purchaseOrderService } = await import(
            '@/application/services/purchaseOrderService'
          )
          await purchaseOrderService.deleteTenderRelatedOrders(tender.id)
        }

        // Update tender with new status - use updateTender(id, updates) signature
        await updateTender(tender.id, {
          status: newStatus,
          lastUpdate: new Date().toISOString(),
          lastAction:
            newStatus === 'submitted'
              ? 'تراجع من النتيجة النهائية - عودة لحالة مُرسلة'
              : newStatus === 'ready_to_submit'
                ? 'تراجع عن الإرسال - عودة لحالة جاهز للإرسال'
                : newStatus === 'under_action'
                  ? 'تراجع للتسعير والتعديل'
                  : 'تراجع عن الحالة',
        })

        toast.success('تم التراجع بنجاح', {
          description: `تم إعادة المنافسة "${tender.name}" إلى الحالة السابقة`,
          duration: 3000,
        })
      } catch (error) {
        console.error('خطأ في التراجع:', error)
        toast.error('فشل في التراجع عن الحالة')
      }
    },
    [updateTender],
  )

  const handleEditTender = useCallback(
    (tender: Tender) => {
      setSelectedTender(tender)
      onSectionChange('new-tender', tender)
    },
    [onSectionChange, setSelectedTender],
  )

  // Header section with metadata and performance cards
  const headerExtraContent = useMemo(
    () => <TendersHeaderSection tenderSummary={tenderSummary} />,
    [tenderSummary],
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
          <>
            {/* Use VirtualizedTenderList for better performance */}
            <VirtualizedTenderList
              items={paginatedTenders}
              onOpenDetails={navigateToDetails}
              onStartPricing={navigateToPricing}
              onSubmitTender={setTenderToSubmit}
              onEdit={handleEditTender}
              onDelete={setTenderToDelete}
              onOpenResults={navigateToResults}
              onRevertStatus={handleRevertStatus}
              formatCurrencyValue={formatCurrencyValue}
            />

            {/* Pagination Controls */}
            {filteredTenders.length > currentPageSize && (
              <TendersPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={currentPageSize}
                totalItems={filteredTenders.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setCurrentPageSize}
              />
            )}
          </>
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
