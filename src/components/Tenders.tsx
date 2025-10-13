'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { APP_EVENTS } from '../events/bus'
import { toast } from 'sonner'

import { PageLayout, EmptyState, DetailCard } from './PageLayout'
import { StatusBadge } from './ui/status-badge'
import { TenderPricingProcess, type TenderWithPricingSources } from './TenderPricingProcess'
import { safeLocalStorage } from '../utils/storage'
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
  Search
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog'

import { useFinancialState } from '@/application/context'

import { TenderDetails } from './TenderDetails'
import { TenderResultsManager } from './TenderResultsManager'
import type { Tender } from '../data/centralData'


import { EnhancedTenderCard } from './bidding/EnhancedTenderCard'
import {
  getDaysRemaining,
  isTenderExpired
} from '../utils/tenderProgressCalculator'
import type { TenderMetricsSummary } from '@/domain/contracts/metrics'
import type { TenderMetrics as AggregatedTenderMetrics } from '@/domain/selectors/financialMetrics'
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'
import { resolveTenderPerformance } from '@/domain/utils/tenderPerformance'

interface TenderEventDetail {
  tenderId?: string
  itemId?: string
}

const OPEN_PRICING_EVENT = 'openPricingForTender' as const

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

// Using EnhancedTenderCard component from ./bidding/EnhancedTenderCard



interface TendersProps {
  onSectionChange: (section: string, tender?: Tender) => void
}

export function Tenders({ onSectionChange }: TendersProps) {
  const { tenders: tendersState, metrics, lastRefreshAt, currency } = useFinancialState()
  const {
    tenders: tendersData,
    deleteTender,
    refreshTenders,
    updateTender,
  } = tendersState
  const tenders = useMemo(() => tendersData, [tendersData])
  const rawTenderMetrics = metrics.tenders as AggregatedTenderMetrics
  const tenderPerformance = useMemo<TenderMetricsSummary>(() => {
    return resolveTenderPerformance(rawTenderMetrics, tenders)
  }, [rawTenderMetrics, tenders])
  const tenderMetrics = useMemo<AggregatedTenderMetrics>(() => ({
    ...rawTenderMetrics,
    performance: tenderPerformance,
  }), [rawTenderMetrics, tenderPerformance])
  const { formatCurrencyValue, baseCurrency } = useCurrencyFormatter()
  const timestampFormatter = useMemo(() => new Intl.DateTimeFormat('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  }), [])
  const formatTimestamp = useCallback((value: string | number | Date | null | undefined) => {
    if (value === null || value === undefined) {
      return null
    }
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return null
    }
    return timestampFormatter.format(date)
  }, [timestampFormatter])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [currentView, setCurrentView] = useState<'list' | 'pricing' | 'details' | 'results'>('list')
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null)
  const [tenderToSubmit, setTenderToSubmit] = useState<Tender | null>(null)

  // استمع لحدث فتح منافسة محددة للقفز مباشرة لتفاصيلها
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

  // الاستماع لأحداث تحديث المناقصات من مكونات أخرى فقط
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const onUpdated = () => {
      console.log('🔄 تم تحديث بيانات المناقصات - إعادة التحميل')
      void refreshTenders()
    }

    window.addEventListener(APP_EVENTS.TENDERS_UPDATED, onUpdated)
    window.addEventListener(APP_EVENTS.TENDER_UPDATED, onUpdated)

    return () => {
      window.removeEventListener(APP_EVENTS.TENDERS_UPDATED, onUpdated)
      window.removeEventListener(APP_EVENTS.TENDER_UPDATED, onUpdated)
    }
  }, [refreshTenders])

  // تصفية وترتيب البيانات
  const filteredTenders = useMemo(() => {
    return tenders.filter((tender: Tender) => {
      const matchesSearch = tender.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tender.client?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const isExpired = isTenderExpired(tender)
      
      let matchesTab = false
      
      if (activeTab === 'all') {
        // "الكل" يعرض النشطة فقط (استثناء المنتهية)
        matchesTab = !isExpired
      } else if (activeTab === 'expired') {
        // تبويب "المنتهية" يعرض المنتهية فقط
        matchesTab = isExpired
      } else if (activeTab === 'urgent') {
        // المنافسات العاجلة = الجديدة + تحت الإجراء + الجاهزة للإرسال + المتبقي ≤ 7 أيام
        const days = getDaysRemaining(tender.deadline)
        matchesTab = !isExpired && 
          days <= 7 && 
          days >= 0 &&
          (tender.status === 'new' || tender.status === 'under_action' || tender.status === 'ready_to_submit')
      } else if (activeTab === 'new') {
        matchesTab = !isExpired && tender.status === 'new'
      } else if (activeTab === 'under_action') {
        matchesTab = !isExpired && (tender.status === 'under_action' || tender.status === 'ready_to_submit')
      } else if (activeTab === 'waiting_results') {
        matchesTab = !isExpired && tender.status === 'submitted'
      } else if (activeTab === 'won') {
        matchesTab = !isExpired && tender.status === 'won'
      } else if (activeTab === 'lost') {
        matchesTab = !isExpired && tender.status === 'lost'
      }

      return matchesSearch && matchesTab
  }).sort((a: Tender, b: Tender) => {
      // المنافسات المنتهية في تبويب منفصل - لا تؤثر على الترتيب هنا
      if (activeTab === 'expired') {
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
      }
      
      // ترتيب حسب المدة المتبقية - الأقل أولاً (للنشطة فقط)
      const daysRemainingA = getDaysRemaining(a.deadline)
      const daysRemainingB = getDaysRemaining(b.deadline)
      
      return daysRemainingA - daysRemainingB
    })
  }, [tenders, searchTerm, activeTab])

  const tenderSummary = useMemo(() => {
    const urgentStatuses = new Set(['new', 'under_action', 'ready_to_submit'])
    const documentValueStatuses = new Set(['submitted', 'ready_to_submit', 'won', 'lost'])

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

      if (status && urgentStatuses.has(status) && tender.deadline) {
        const days = getDaysRemaining(tender.deadline)
        if (days <= 7 && days >= 0) {
          urgent += 1
        }
      }

      if (documentValueStatuses.has(status)) {
        const documentPrice = getTenderDocumentPrice(tender)
        totalDocumentValue += documentPrice
        if (documentPrice > 0) {
          documentBookletsCount += 1
        }
      }
    }

    const winRate = Number.isFinite(tenderPerformance.winRate) ? tenderPerformance.winRate : 0

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
      averageWinChance: Number.isFinite(tenderMetrics.averageWinChance) ? tenderMetrics.averageWinChance : 0,
      averageCycleDays: tenderPerformance.averageCycleDays,
      submittedValue: tenderPerformance.submittedValue,
      wonValue: tenderPerformance.wonValue,
      lostValue: tenderPerformance.lostValue,
      documentBookletsCount,
    }
  }, [tenders, tenderMetrics, tenderPerformance])

  // دوال التعامل مع الأحداث - محسنة مع useCallback
  const handleConfirmDelete = useCallback(async () => {
    if (tenderToDelete) {
      await deleteTender(tenderToDelete.id) // الهوك سيعرض رسالة التأكيد تلقائياً
      setTenderToDelete(null)
      // لا حاجة لـ refreshTenders لأن deleteTender يحدث البيانات تلقائياً
    }
  }, [tenderToDelete, deleteTender]);

  const handleStartPricing = useCallback((tender: Tender) => {
    setSelectedTender(tender)
    setCurrentView('pricing')
  }, []);

  // دالة تقديم العرض من بطاقة المنافسة
  const handleSubmitTender = useCallback((tender: Tender) => {
    setTenderToSubmit(tender)
  }, []);

  // دالة فتح إدارة النتائج للمنافسات المُسَلمة
  const handleOpenResults = useCallback((tender: Tender) => {
    setSelectedTender(tender)
    setCurrentView('results')
  }, []);

  // دالة التراجع عن الحالة - لإعادة المنافسة لحالة سابقة
  // won/lost → submitted (تراجع من النتيجة النهائية للحالة المُرسلة)
  // submitted → ready_to_submit (تراجع من النتائج للإرسال - يُظهر زر "إرسال" كإجراء رئيسي)
  // ready_to_submit → under_action (تراجع من الإرسال للتسعير - يُظهر زر "تسعير" كإجراء رئيسي)
  const handleRevertStatus = useCallback(async (tender: Tender, newStatus: Tender['status']) => {
    try {
      // 1. إذا كان التراجع من submitted إلى ready_to_submit، نحتاج حذف أوامر الشراء
      if (tender.status === 'submitted' && newStatus === 'ready_to_submit') {
        console.log('🗑️ التراجع من النتيجة للإرسال - حذف أوامر الشراء المرتبطة');
        
  const { purchaseOrderService } = await import('@/application/services/purchaseOrderService');
  const { deletedOrdersCount, deletedExpensesCount } = await purchaseOrderService.deleteTenderRelatedOrders(tender.id);
        
        console.log(`✅ تم حذف ${deletedOrdersCount} أمر شراء و ${deletedExpensesCount} مصروف`);
      }
      
      await updateTender({
        ...tender,
        status: newStatus,
        lastUpdate: new Date().toISOString(),
        lastAction: 
          (tender.status === 'won' || tender.status === 'lost') && newStatus === 'submitted' ? 'تراجع من النتيجة النهائية - عودة لحالة مُرسلة' :
          newStatus === 'ready_to_submit' ? 'تراجع عن الإرسال - عودة لحالة جاهز للإرسال' : 
          newStatus === 'under_action' ? 'تراجع للتسعير والتعديل' : 'تراجع عن الحالة'
      } as Tender);
      
      toast.success('تم التراجع بنجاح', {
        description: `تم إعادة المنافسة "${tender.name}" إلى الحالة السابقة`,
        duration: 3000,
      });
    } catch (error) {
      console.error('خطأ في التراجع:', error);
      toast.error('فشل في التراجع عن الحالة');
    }
  }, [updateTender]);

  // دالة تأكيد تقديم العرض
  const handleConfirmSubmit = useCallback(async () => {
    if (!tenderToSubmit) return

    try {
      console.log('🚀 [Tenders] بدء تدفق تقديم المنافسة:', tenderToSubmit.id)
      const { tenderSubmissionService } = await import('@/application/services/tenderSubmissionService')
      const result = await tenderSubmissionService.submit(tenderToSubmit)

      setTenderToSubmit(null)
      await refreshTenders()

      const { created, purchaseOrder, bookletExpense, counts } = result

      console.log('✅ [Tenders] تم تحديث المنافسة وإجراءاتها المرتبطة', {
        tenderId: result.tender.id,
        purchaseOrderId: purchaseOrder.id,
        bookletExpenseId: bookletExpense?.id ?? null,
        createdFlags: created,
        counts
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
        description: summaryParts.join(' • ')
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
  }, []);

  const handleEditTender = useCallback((tender: Tender) => {
    setSelectedTender(tender)
    // انتقل إلى صفحة التحرير وامرر المنافسة كمعطى
    onSectionChange('new-tender', tender)
  }, [onSectionChange]);

  const handleBackToList = useCallback(() => {
    setCurrentView('list')
    setSelectedTender(null)
    // البيانات محدثة بالفعل بواسطة custom events من TenderPricingProcess
  }, []);

  // التقاط حدث فتح التسعير من شاشة التفاصيل (زر تحرير بند)
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

  // إذا كان في وضع التسعير، اعرض مكون التسعير
  if (currentView === 'pricing' && selectedTender) {
    const tenderForPricing: TenderWithPricingSources = { ...selectedTender }
    return (
      <TenderPricingProcess 
        tender={tenderForPricing}
        onBack={handleBackToList}
      />
    )
  }

  // إذا كان في وضع إدارة النتائج، اعرض مكون النتائج
  if (currentView === 'results' && selectedTender) {
    return (
      <TenderResultsManager 
        tender={selectedTender}
        onUpdate={() => {
          handleBackToList();
        }}
      />
    )
  }

  if (currentView === 'details' && selectedTender) {
    return <TenderDetails tender={selectedTender} onBack={handleBackToList} />
  }

  // عرض الشاشة الرئيسية - قائمة المنافسات
  const quickStats = [
    {
      label: 'إجمالي المنافسات',
      value: tenderSummary.total,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'منافسات عاجلة',
      value: tenderSummary.urgent,
      trend: tenderSummary.urgent > 0 ? ('down' as const) : ('up' as const),
      trendValue: tenderSummary.urgent > 0 ? `${tenderSummary.urgent} خلال 7 أيام` : 'لا يوجد حالات عاجلة',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      label: 'منافسات نشطة',
      value: tenderSummary.active,
      trend: tenderSummary.active > 0 ? ('up' as const) : ('stable' as const),
      trendValue: `${tenderSummary.submitted} مقدمة`,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'نسبة الفوز',
      value: `${tenderSummary.winRate.toFixed(1)}%`,
      trend: tenderSummary.averageWinChance >= tenderSummary.winRate ? ('up' as const) : ('down' as const),
      trendValue: `${Math.round(tenderSummary.averageWinChance)}% متوسط احتمالية الفوز`,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'قيمة العطاءات المقدمة',
      value: formatCurrencyValue(tenderSummary.submittedValue, { notation: 'compact' }),
      trend: 'up' as const,
      trendValue: tenderSummary.averageCycleDays ? `${Math.round(tenderSummary.averageCycleDays)} يوم دورة` : 'لا بيانات للدورة',
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      label: 'قيمة العطاءات الفائزة',
      value: formatCurrencyValue(tenderSummary.wonValue, { notation: 'compact' }),
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ]

  const quickActions = [
    { label: 'تحديث البيانات', icon: TrendingUp, onClick: () => {
      console.log('🔄 تم تحديث بيانات المناقصات يدوياً')
      void refreshTenders()
    }, variant: 'outline' as const },
    { label: 'معالج التسعير', icon: Calculator, onClick: () => onSectionChange('tender-pricing-wizard'), variant: 'outline' as const },
    { label: 'تقارير المنافسات', icon: FileText, onClick: () => onSectionChange('reports'), variant: 'outline' as const },
    { label: 'منافسة جديدة', icon: Plus, onClick: () => onSectionChange('new-tender'), primary: true }
  ]

  const tenderSubmissionPrice = tenderToSubmit ? getTenderDocumentPrice(tenderToSubmit) : 0

  const tendersAnalysisCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DetailCard
        title="معدل الفوز"
        value={`${tenderSummary.winRate.toFixed(1)}%`}
        subtitle="نسبة المنافسات الفائزة"
        icon={Trophy}
        color="text-success"
        bgColor="bg-success/10"
        trend={{
          value: `${Math.round(tenderSummary.averageWinChance)}% احتمال متوسط`,
          direction: tenderSummary.averageWinChance >= tenderSummary.winRate ? 'up' : 'down'
        }}
      />
      <DetailCard
        title="القيمة الإجمالية"
        value={formatCurrencyValue(tenderSummary.wonValue)}
        subtitle="إجمالي قيمة المنافسات الفائزة"
        icon={DollarSign}
        color="text-primary"
        bgColor="bg-primary/10"
        trend={{ value: formatCurrencyValue(tenderSummary.submittedValue, { notation: 'compact' }), direction: 'up' }}
      />
      <DetailCard
        title="المنافسات النشطة"
        value={`${tenderSummary.underAction + tenderSummary.readyToSubmit}`}
        subtitle="تحتاج متابعة وإجراء"
        icon={Clock}
        color="text-warning"
        bgColor="bg-warning/10"
        trend={{
          value: `${tenderSummary.urgent} عاجلة`,
          direction: tenderSummary.urgent > 5 ? 'down' : 'up'
        }}
      />
      <DetailCard
        title="إجمالي قيمة الكراسات"
        value={formatCurrencyValue(tenderSummary.totalDocumentValue)}
        subtitle="تكلفة الكراسات للمنافسات المرسلة والمتوجة"
        icon={Files}
        color="text-warning"
        bgColor="bg-warning/10"
        trend={{
          value: `${tenderSummary.documentBookletsCount} كراسة مرسلة`,
          direction: tenderSummary.documentBookletsCount > 0 ? 'up' : 'stable'
        }}
      />
    </div>
  )

  const lastUpdatedSource = currency?.lastUpdated ?? lastRefreshAt
  const lastUpdatedLabel = formatTimestamp(lastUpdatedSource)

  const headerMetadata = (
    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
      <StatusBadge
        status="info"
        label={`العملة الأساسية ${baseCurrency}`}
        icon={DollarSign}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="onTrack"
        label={`نشطة ${tenderSummary.active}/${tenderSummary.total}`}
        icon={Trophy}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="success"
        label={`مقدمة ${formatCurrencyValue(tenderSummary.submittedValue, { notation: 'compact' })}`}
        icon={TrendingUp}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="warning"
        label={`الكراسات ${formatCurrencyValue(tenderSummary.totalDocumentValue, { notation: 'compact' })}`}
        icon={Files}
        size="sm"
        className="shadow-none"
      />
      {lastUpdatedLabel && (
        <StatusBadge
          status="default"
          label={`آخر تحديث ${lastUpdatedLabel}`}
          icon={Clock}
          size="sm"
          className="shadow-none"
        />
      )}
    </div>
  )

  const headerExtraContent = (
    <div className="space-y-4">
      {headerMetadata}
      {tendersAnalysisCards}
    </div>
  )

  const tabsConfig = [
    { id: 'all', label: 'الكل', count: tenderSummary.total, icon: Trophy, badgeStatus: 'default' as const },
    { id: 'urgent', label: 'العاجلة', count: tenderSummary.urgent, icon: AlertTriangle, badgeStatus: 'overdue' as const },
    { id: 'new', label: 'الجديدة', count: tenderSummary.new, icon: Plus, badgeStatus: 'notStarted' as const },
    { id: 'under_action', label: 'تحت الإجراء', count: tenderSummary.underAction + tenderSummary.readyToSubmit, icon: Clock, badgeStatus: 'onTrack' as const },
    { id: 'waiting_results', label: 'بانتظار النتائج', count: tenderSummary.waitingResults, icon: Eye, badgeStatus: 'info' as const },
    { id: 'won', label: 'فائزة', count: tenderSummary.won, icon: CheckCircle, badgeStatus: 'success' as const },
    { id: 'lost', label: 'خاسرة', count: tenderSummary.lost, icon: XCircle, badgeStatus: 'error' as const },
    { id: 'expired', label: 'منتهية', count: tenderSummary.expired, icon: AlertCircle, badgeStatus: 'overdue' as const }
  ]

  const trimmedSearch = searchTerm.trim()
  const activeTabMeta = tabsConfig.find((tab) => tab.id === activeTab)
  const activeTabLabel = activeTabMeta?.label ?? 'الكل'
  const hasAnyTenders = tenders.length > 0
  const filterDescription = trimmedSearch.length > 0
    ? 'لا توجد منافسات تطابق البحث الحالي. جرّب تعديل عبارة البحث أو إعادة التعيين.'
    : `لا توجد منافسات ضمن تبويب "${activeTabLabel}" حاليًا. جرّب تغيير التبويب أو إعادة ضبط المرشحات.`

  return (
    <>
      <PageLayout
        tone="primary"
        title="إدارة المنافسات"
        description="متابعة وإدارة جميع المنافسات والعطاءات بفعالية"
        icon={Trophy}
        quickStats={quickStats}
        quickActions={quickActions}
        searchPlaceholder="البحث في المنافسات..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        headerExtra={headerExtraContent}
      >
        {/* تبويبات المنافسات */}
        <div className="bg-card rounded-xl border shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {tabsConfig.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                      : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-semibold">{tab.label}</span>
                  <StatusBadge
                    status={isActive ? tab.badgeStatus : 'default'}
                    label={String(tab.count)}
                    size="sm"
                    showIcon={false}
                    className={`h-5 min-w-[24px] justify-center px-2 py-0.5 text-xs shadow-none ${isActive ? 'bg-primary/15 text-primary-foreground border-primary/30' : ''}`}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* عرض المنافسات أو الحالة الفارغة */}
        {filteredTenders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTenders.map((tender: Tender, index: number) => (
              <EnhancedTenderCard
                key={tender.id}
                tender={tender}
                index={index}
                onOpenDetails={handleOpenDetails}
                onStartPricing={handleStartPricing}
                onSubmitTender={handleSubmitTender}
                onEdit={handleEditTender}
                onDelete={(tender) => setTenderToDelete(tender)}
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

      {/* مربع حوار تأكيد الحذف */}
      <AlertDialog open={!!tenderToDelete} onOpenChange={(open) => !open && setTenderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المنافسة &quot;{tenderToDelete?.name}&quot;؟ هذا الإجراء لا يمكن التراجع عنه.
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

      {/* مربع حوار تأكيد تقديم العرض */}
      <AlertDialog open={!!tenderToSubmit} onOpenChange={(open) => !open && setTenderToSubmit(null)}>
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
                      <li>• تحديث حالة المنافسة إلى &quot;بانتظار النتائج&quot;</li>
                      <li>• إضافة مصروف كراسة المنافسة ({formatCurrencyValue(tenderSubmissionPrice)})</li>
                      <li>• تحديث إحصائيات المنافسات المقدمة</li>
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-sm text-muted-foreground">سيتم تحديث حالة المنافسة إلى &quot;بانتظار النتائج&quot;</p>
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
