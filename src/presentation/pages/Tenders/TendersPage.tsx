// TendersPage shows the tenders dashboard, filters, and quick actions.
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import {
  Trophy,
  Plus,
  DollarSign,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  TrendingUp,
  Calculator,
  Files,
  Trash2,
  Send,
  Search,
  ListChecks,
} from 'lucide-react'

import { APP_EVENTS } from '@/events/bus'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { getDaysRemaining, isTenderExpired } from '@/shared/utils/tender/tenderProgressCalculator'
import type { Tender } from '@/data/centralData'

import { PageLayout, EmptyState, DetailCard } from '@/presentation/components/layout/PageLayout'
import { StatusBadge, type StatusBadgeProps } from '@/presentation/components/ui/status-badge'
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

type TenderTabId =
  | 'all'
  | 'urgent'
  | 'new'
  | 'under_action'
  | 'waiting_results'
  | 'won'
  | 'lost'
  | 'expired'

interface TenderEventDetail {
  tenderId?: string
  itemId?: string
}

interface TenderSummary {
  total: number
  urgent: number
  new: number
  underAction: number
  readyToSubmit: number
  waitingResults: number
  won: number
  lost: number
  expired: number
  winRate: number
  totalDocumentValue: number
  active: number
  submitted: number
  averageWinChance: number
  averageCycleDays: number | null
  submittedValue: number
  wonValue: number
  lostValue: number
  documentBookletsCount: number
}

interface TenderTabDefinition {
  id: TenderTabId
  label: string
  icon: LucideIcon
  badgeStatus: StatusBadgeProps['status']
}

interface TendersProps {
  onSectionChange: (section: string, tender?: Tender) => void
}

const BASE_TAB_DEFINITIONS: readonly TenderTabDefinition[] = [
  { id: 'all', label: 'الكل', icon: Trophy, badgeStatus: 'default' },
  { id: 'urgent', label: 'العاجلة', icon: AlertTriangle, badgeStatus: 'overdue' },
  { id: 'new', label: 'الجديدة', icon: Plus, badgeStatus: 'notStarted' },
  { id: 'under_action', label: 'تحت الإجراء', icon: Clock, badgeStatus: 'onTrack' },
  { id: 'waiting_results', label: 'بانتظار النتائج', icon: Eye, badgeStatus: 'info' },
  { id: 'won', label: 'فائزة', icon: CheckCircle, badgeStatus: 'success' },
  { id: 'lost', label: 'خاسرة', icon: XCircle, badgeStatus: 'error' },
  { id: 'expired', label: 'منتهية', icon: AlertCircle, badgeStatus: 'overdue' },
]

const URGENT_STATUSES = new Set(['new', 'under_action', 'ready_to_submit'])
const DOCUMENT_VALUE_STATUSES = new Set(['submitted', 'ready_to_submit', 'won', 'lost'])

const parseNumericValue = (value?: number | string | null): number => {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : value
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getTenderDocumentPrice = (tender: Tender): number => {
  const price = parseNumericValue(tender.documentPrice)
  return price > 0 ? price : parseNumericValue(tender.bookletPrice)
}

const normaliseSearchQuery = (value: string): string => value.trim().toLowerCase()

const matchesSearchQuery = (tender: Tender, query: string): boolean => {
  if (!query) {
    return true
  }

  return [tender.name, tender.client].some((field) => field?.toLowerCase().includes(query))
}

const matchesTabFilter = (tender: Tender, tab: TenderTabId): boolean => {
  const status = tender.status ?? ''
  const expired = isTenderExpired(tender)

  switch (tab) {
    case 'all':
      return !expired
    case 'urgent': {
      if (expired || !URGENT_STATUSES.has(status)) {
        return false
      }
      const days = getDaysRemaining(tender.deadline)
      return days <= 7 && days >= 0
    }
    case 'new':
      return !expired && status === 'new'
    case 'under_action':
      return !expired && (status === 'under_action' || status === 'ready_to_submit')
    case 'waiting_results':
      return !expired && status === 'submitted'
    case 'won':
      return !expired && status === 'won'
    case 'lost':
      return !expired && status === 'lost'
    case 'expired':
      return expired
    default:
      return true
  }
}

const getDaysRemainingValue = (deadline?: string): number => {
  const days = getDaysRemaining(deadline ?? '')
  return Number.isFinite(days) ? days : Number.POSITIVE_INFINITY
}

const sortTenders = (tab: TenderTabId) => {
  if (tab === 'expired') {
    return (a: Tender, b: Tender) => {
      const timeA = new Date(a.deadline ?? 0).getTime()
      const timeB = new Date(b.deadline ?? 0).getTime()
      return timeB - timeA
    }
  }

  return (a: Tender, b: Tender) =>
    getDaysRemainingValue(a.deadline) - getDaysRemainingValue(b.deadline)
}

const computeFilteredTenders = (
  tenders: readonly Tender[],
  query: string,
  activeTab: TenderTabId,
): Tender[] => {
  const comparator = sortTenders(activeTab)
  return tenders
    .filter((tender) => matchesSearchQuery(tender, query) && matchesTabFilter(tender, activeTab))
    .sort(comparator)
}

const computeTenderSummary = (
  tenders: readonly Tender[],
  tenderMetrics: AggregatedTenderMetrics,
  tenderPerformance: TenderMetricsSummary,
): TenderSummary => {
  let urgent = 0
  let newCount = 0
  let underActionCount = 0
  let readyToSubmitCount = 0
  let waitingResultsCount = 0
  let expiredCount = 0
  let totalDocumentValue = 0
  let documentBookletsCount = 0

  for (const tender of tenders) {
    if (!tender) {
      continue
    }

    const status = tender.status ?? ''

    switch (status) {
      case 'new':
        newCount += 1
        break
      case 'under_action':
        underActionCount += 1
        break
      case 'ready_to_submit':
        readyToSubmitCount += 1
        break
      case 'submitted':
        waitingResultsCount += 1
        break
      default:
        break
    }

    if (isTenderExpired(tender)) {
      expiredCount += 1
    }

    if (status && URGENT_STATUSES.has(status) && tender.deadline) {
      const days = getDaysRemaining(tender.deadline)
      if (days <= 7 && days >= 0) {
        urgent += 1
      }
    }

    if (DOCUMENT_VALUE_STATUSES.has(status)) {
      const documentPrice = getTenderDocumentPrice(tender)
      totalDocumentValue += documentPrice
      if (documentPrice > 0) {
        documentBookletsCount += 1
      }
    }
  }

  const winRate = Number.isFinite(tenderPerformance.winRate) ? tenderPerformance.winRate : 0
  const averageWinChance = Number.isFinite(tenderMetrics.averageWinChance)
    ? tenderMetrics.averageWinChance
    : 0

  return {
    total: tenderMetrics.totalCount,
    urgent,
    new: newCount,
    underAction: underActionCount,
    readyToSubmit: readyToSubmitCount,
    waitingResults: waitingResultsCount,
    won: tenderMetrics.wonCount,
    lost: tenderMetrics.lostCount,
    expired: expiredCount,
    winRate,
    totalDocumentValue,
    active: tenderMetrics.activeCount,
    submitted: tenderMetrics.submittedCount,
    averageWinChance,
    averageCycleDays: tenderPerformance.averageCycleDays,
    submittedValue: tenderPerformance.submittedValue,
    wonValue: tenderPerformance.wonValue,
    lostValue: tenderPerformance.lostValue,
    documentBookletsCount,
  }
}

const createTabsWithCounts = (
  summary: TenderSummary,
): Array<TenderTabDefinition & { count: number }> => {
  return BASE_TAB_DEFINITIONS.map((tab) => {
    switch (tab.id) {
      case 'all':
        return { ...tab, count: summary.total }
      case 'urgent':
        return { ...tab, count: summary.urgent }
      case 'new':
        return { ...tab, count: summary.new }
      case 'under_action':
        return { ...tab, count: summary.underAction + summary.readyToSubmit }
      case 'waiting_results':
        return { ...tab, count: summary.waitingResults }
      case 'won':
        return { ...tab, count: summary.won }
      case 'lost':
        return { ...tab, count: summary.lost }
      case 'expired':
        return { ...tab, count: summary.expired }
      default:
        return { ...tab, count: 0 }
    }
  })
}

const getActiveTabLabel = (
  tabs: Array<TenderTabDefinition & { count: number }>,
  activeTab: TenderTabId,
): string => {
  return tabs.find((tab) => tab.id === activeTab)?.label ?? 'الكل'
}

const getFilterDescription = (query: string, activeTabLabel: string): string => {
  if (query.length > 0) {
    return 'لا توجد منافسات تطابق البحث الحالي. جرّب تعديل عبارة البحث أو إعادة التعيين.'
  }

  return `لا توجد منافسات ضمن تبويب "${activeTabLabel}" حاليًا. جرّب تغيير التبويب أو إعادة ضبط المرشحات.`
}

const createQuickActions = (
  onSectionChange: (section: string, tender?: Tender) => void,
): Array<{
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'outline'
  primary?: boolean
}> => [
  {
    label: 'معالج التسعير',
    icon: Calculator,
    onClick: () => onSectionChange('tender-pricing-wizard'),
    variant: 'outline',
  },
  {
    label: 'تقارير المنافسات',
    icon: FileText,
    onClick: () => onSectionChange('reports'),
    variant: 'outline',
  },
  {
    label: 'منافسة جديدة',
    icon: Plus,
    onClick: () => onSectionChange('new-tender'),
    primary: true,
  },
]

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
    () => <TenderHeaderSummary summary={tenderSummary} formatCurrencyValue={formatCurrencyValue} />,
    [tenderSummary, formatCurrencyValue],
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

    const onUpdated = () => {
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

  const handleConfirmDelete = useCallback(async () => {
    if (tenderToDelete) {
      await deleteTender(tenderToDelete.id)
      setTenderToDelete(null)
    }
  }, [tenderToDelete, deleteTender])

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

  const handleRevertStatus = useCallback(
    async (tender: Tender, newStatus: Tender['status']) => {
      try {
        if (tender.status === 'submitted' && newStatus === 'ready_to_submit') {
          console.log('🗑️ التراجع من النتيجة للإرسال - حذف أوامر الشراء المرتبطة')

          const { purchaseOrderService } = await import(
            '@/application/services/purchaseOrderService'
          )
          const { deletedOrdersCount, deletedExpensesCount } =
            await purchaseOrderService.deleteTenderRelatedOrders(tender.id)

          console.log(`✅ تم حذف ${deletedOrdersCount} أمر شراء و ${deletedExpensesCount} مصروف`)
        }

        await updateTender({
          ...tender,
          status: newStatus,
          lastUpdate: new Date().toISOString(),
          lastAction:
            (tender.status === 'won' || tender.status === 'lost') && newStatus === 'submitted'
              ? 'تراجع من النتيجة النهائية - عودة لحالة مُرسلة'
              : newStatus === 'ready_to_submit'
                ? 'تراجع عن الإرسال - عودة لحالة جاهز للإرسال'
                : newStatus === 'under_action'
                  ? 'تراجع للتسعير والتعديل'
                  : 'تراجع عن الحالة',
        } as Tender)

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

  const handleConfirmSubmit = useCallback(async () => {
    if (!tenderToSubmit) return

    try {
      console.log('🚀 [Tenders] بدء تدفق تقديم المنافسة:', tenderToSubmit.id)
      const { tenderSubmissionService } = await import(
        '@/application/services/tenderSubmissionService'
      )
      const result = await tenderSubmissionService.submit(tenderToSubmit)

      setTenderToSubmit(null)
      await refreshTenders()

      const { created, purchaseOrder, bookletExpense, counts } = result

      console.log('✅ [Tenders] تم تحديث المنافسة وإجراءاتها المرتبطة', {
        tenderId: result.tender.id,
        purchaseOrderId: purchaseOrder.id,
        bookletExpenseId: bookletExpense?.id ?? null,
        createdFlags: created,
        counts,
      })

      const summaryParts: string[] = []
      if (created.purchaseOrder) {
        summaryParts.push('تم إنشاء أمر شراء للمنافسة')
      } else if (counts.after.ordersCount > 0) {
        summaryParts.push('أمر الشراء موجود مسبقاً')
      }

      if (bookletExpense) {
        const formattedBookletExpense = formatCurrencyValue(bookletExpense.amount, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        if (created.bookletExpense) {
          summaryParts.push(`تم إنشاء مصروف الكراسة بقيمة ${formattedBookletExpense}`)
        } else {
          summaryParts.push(`مصروف الكراسة الحالي ${formattedBookletExpense}`)
        }
      } else if (created.bookletExpense) {
        summaryParts.push('تم تسجيل مصروف الكراسة')
      } else if (counts.after.expensesCount > 0) {
        summaryParts.push('مصروف الكراسة موجود مسبقاً')
      }

      if (summaryParts.length === 0) {
        summaryParts.push('تم تحديث حالة المنافسة والإحصائيات بنجاح')
      }

      toast.success('تم تقديم العرض بنجاح', {
        description: summaryParts.join(' • '),
      })
    } catch (error) {
      console.error('Error submitting tender:', error)
      toast.error('حدث خطأ أثناء تقديم العرض')
      setTenderToSubmit(null)
    }
  }, [formatCurrencyValue, refreshTenders, tenderToSubmit])

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
              هل أنت متأكد من حذف المنافسة "{tenderToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع
              عنه.
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
                <p>هل أنت متأكد من تقديم العرض للمنافسة "{tenderToSubmit?.name}"؟</p>

                {tenderSubmissionPrice > 0 ? (
                  <div className="rounded-lg border border-info/30 bg-info/10 p-3">
                    <p className="text-sm text-info font-medium">سيتم تلقائياً:</p>
                    <ul className="mt-1 space-y-1 text-xs text-info opacity-90">
                      <li>• تحديث حالة المنافسة إلى "بانتظار النتائج"</li>
                      <li>
                        • إضافة مصروف كراسة المنافسة ({formatCurrencyValue(tenderSubmissionPrice)})
                      </li>
                      <li>• تحديث إحصائيات المنافسات المقدمة</li>
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-sm text-muted-foreground">
                      سيتم تحديث حالة المنافسة إلى "بانتظار النتائج"
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

interface TenderHeaderSummaryProps {
  summary: TenderSummary
  formatCurrencyValue: (value: number, options?: Intl.NumberFormatOptions) => string
}

function TenderHeaderSummary({ summary, formatCurrencyValue }: TenderHeaderSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
          <StatusBadge
            status="default"
            label={`الكل ${summary.total}`}
            icon={ListChecks}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={summary.urgent > 0 ? 'warning' : 'info'}
            label={`عاجلة ${summary.urgent}`}
            icon={AlertTriangle}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status="info"
            label={`نشطة ${summary.active}/${summary.total}`}
            icon={Clock}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status="success"
            label={`مقدمة ${formatCurrencyValue(summary.submittedValue, { notation: 'compact' })}`}
            icon={TrendingUp}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status="info"
            label={`الكراسات ${formatCurrencyValue(summary.totalDocumentValue, { notation: 'compact' })}`}
            icon={Files}
            size="sm"
            className="shadow-none"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailCard
            title="معدل الفوز"
            value={`${summary.winRate.toFixed(1)}%`}
            subtitle="نسبة المنافسات الفائزة"
            icon={Trophy}
            color="text-success"
            bgColor="bg-success/10"
            trend={{
              value: `${Math.round(summary.averageWinChance)}% احتمال متوسط`,
              direction: summary.averageWinChance >= summary.winRate ? 'up' : 'down',
            }}
          />
          <DetailCard
            title="القيمة الإجمالية"
            value={formatCurrencyValue(summary.wonValue)}
            subtitle="إجمالي قيمة المنافسات الفائزة"
            icon={DollarSign}
            color="text-primary"
            bgColor="bg-primary/10"
            trend={{
              value: formatCurrencyValue(summary.submittedValue, { notation: 'compact' }),
              direction: 'up',
            }}
          />
          <DetailCard
            title="المنافسات النشطة"
            value={`${summary.underAction + summary.readyToSubmit}`}
            subtitle="تحتاج متابعة وإجراء"
            icon={Clock}
            color="text-warning"
            bgColor="bg-warning/10"
            trend={{
              value: `${summary.urgent} عاجلة`,
              direction: summary.urgent > 5 ? 'down' : 'stable',
            }}
          />
          <DetailCard
            title="إجمالي قيمة الكراسات"
            value={formatCurrencyValue(summary.totalDocumentValue)}
            subtitle="تكلفة الكراسات للمنافسات المرسلة والمتوجة"
            icon={Files}
            color="text-warning"
            bgColor="bg-warning/10"
            trend={{
              value: `${summary.documentBookletsCount} كراسة مرسلة`,
              direction: summary.documentBookletsCount > 0 ? 'up' : 'stable',
            }}
          />
        </div>
      </div>
    </div>
  )
}

interface TenderTabsProps {
  tabs: Array<TenderTabDefinition & { count: number }>
  activeTab: TenderTabId
  onTabChange: (tabId: TenderTabId) => void
}

function TenderTabs({ tabs, activeTab, onTabChange }: TenderTabsProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/80 p-4 shadow-sm backdrop-blur">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 transition-all duration-200 ${
                isActive
                  ? 'border-primary/60 bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'border-transparent bg-transparent text-muted-foreground hover:border-primary/20 hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <tab.icon
                  className={`h-4 w-4 ${
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-primary'
                  }`}
                />
                <span>{tab.label}</span>
              </div>
              <StatusBadge
                status={isActive ? tab.badgeStatus : 'default'}
                label={String(tab.count)}
                size="sm"
                showIcon={false}
                className={`h-5 min-w-[24px] justify-center px-2 py-0.5 text-xs shadow-none ${
                  isActive
                    ? 'bg-primary/15 text-primary-foreground border-primary/40'
                    : 'bg-muted/30'
                }`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
