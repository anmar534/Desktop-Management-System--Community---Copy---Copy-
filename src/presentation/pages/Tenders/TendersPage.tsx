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
import {
  createTabsWithCounts,
  getActiveTabLabel,
  getFilterDescription,
} from '@/shared/utils/tender/tenderTabHelpers'
import { createQuickActions } from '@/shared/utils/tender/tenderQuickActions'
import { createDeleteHandler, createSubmitHandler } from '@/shared/utils/tender/tenderEventHandlers'
import { toast } from 'sonner'

// Domain selectors for stats calculation
import {
  selectActiveTendersCount,
  selectWonTendersCount,
  selectLostTendersCount,
  selectSubmittedTendersCount,
  selectNewTendersCount,
  selectUnderActionTendersCount,
  selectExpiredTendersCount,
  selectUrgentTendersCount,
  selectWinRate,
  selectWonTendersValue,
  selectLostTendersValue,
  selectSubmittedTendersValue,
  selectActiveTendersTotal,
} from '@/domain/selectors/tenderSelectors'

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

// Phase 1 Migration: Using tenderListStoreAdapter (Zustand Stores)
import { useTenderListStore } from '@/application/stores/tenderListStoreAdapter'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import {
  useTenderDetailNavigation,
  useTenderUpdateListener,
  useTenderPricingNavigation,
} from '@/application/hooks/useTenderEventListeners'

interface TendersProps {
  onSectionChange: (section: string, tender?: Tender) => void
}

export function Tenders({ onSectionChange }: TendersProps) {
  // Phase 1 Migration: Use Store-based state management
  const storeData = useTenderListStore()
  const {
    tenders,
    deleteTender,
    refreshTenders,
    updateTender,
    // Phase 2 Migration: Navigation from Store
    currentView,
    selectedTender,
    setSelectedTender,
    backToList,
    navigateToPricing,
    navigateToDetails,
    navigateToResults,
  } = storeData

  // Generate stats using domain selectors (Single Source of Truth)
  const tenderStats = useMemo(
    () => ({
      totalTenders: selectActiveTendersTotal(tenders),
      activeTenders: selectActiveTendersCount(tenders),
      wonTenders: selectWonTendersCount(tenders),
      lostTenders: selectLostTendersCount(tenders),
      submittedTenders: selectSubmittedTendersCount(tenders),
      urgentTenders: selectUrgentTendersCount(tenders),
      newTenders: selectNewTendersCount(tenders),
      underActionTenders: selectUnderActionTendersCount(tenders),
      expiredTenders: selectExpiredTendersCount(tenders),
      winRate: selectWinRate(tenders),
      submittedValue: selectSubmittedTendersValue(tenders),
      wonValue: selectWonTendersValue(tenders),
      lostValue: selectLostTendersValue(tenders),
    }),
    [tenders],
  )

  const { formatCurrencyValue } = useCurrencyFormatter()

  // Phase 1 & 2 Migration:
  // - Phase 1: Search state from Store.filters
  // - Phase 2: Navigation state from Store (removed useTenderViewNavigation hook)
  const { filters, setFilter } = storeData
  const searchTerm = filters.search || ''
  const setSearchTerm = (value: string) => setFilter('search', value)

  const [activeTab, setActiveTab] = useState<TenderTabId>('all')
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null)
  const [tenderToSubmit, setTenderToSubmit] = useState<Tender | null>(null)

  // Local pagination state for frontend-only pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(10)

  const normalisedSearch = useMemo(() => normaliseSearchQuery(searchTerm), [searchTerm])

  // إنشاء tenderSummary من stats
  const tenderSummary = useMemo(
    () => ({
      total: tenderStats.totalTenders,
      urgent: tenderStats.urgentTenders,
      new: tenderStats.newTenders,
      underAction: tenderStats.underActionTenders,
      readyToSubmit: 0, // سيتم حسابه من tenders مباشرة
      waitingResults: tenderStats.submittedTenders,
      won: tenderStats.wonTenders,
      lost: tenderStats.lostTenders,
      expired: tenderStats.expiredTenders,
      winRate: tenderStats.winRate,
      totalDocumentValue: 0, // غير مستخدم في tabs
      active: tenderStats.activeTenders,
      submitted: tenderStats.submittedTenders,
      averageWinChance: 0, // غير مستخدم في tabs
      averageCycleDays: null, // غير مستخدم في tabs
      submittedValue: tenderStats.submittedValue,
      wonValue: tenderStats.wonValue,
      lostValue: tenderStats.lostValue,
      documentBookletsCount: 0, // غير مستخدم في tabs
    }),
    [tenderStats],
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

        // Update tender with new status
        const updates: Partial<Tender> = {
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
        }

        await updateTender(tender.id, updates)

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
  const headerExtraContent = useMemo(() => <TendersHeaderSection />, [])

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
