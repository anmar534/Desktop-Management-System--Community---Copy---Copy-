import React, { useState, useEffect, useCallback, useMemo, useId } from 'react'
import type { MarketOpportunity, MarketTrend, CompetitorData } from '../../types/competitive'
import { competitiveService } from '../../services/competitiveService'
import { formatCurrency, formatPercentage } from '../../utils/analyticsUtils'

const CARD_BASE_CLASS = 'rounded-lg border border-border bg-card'
const MUTED_CARD_CLASS = 'rounded-lg border border-border bg-muted/40'
const PRIMARY_CARD_CLASS = 'rounded-lg border border-primary/20 bg-primary/10'
const SUCCESS_CARD_CLASS = 'rounded-lg border border-success/20 bg-success/10'
const WARNING_CARD_CLASS = 'rounded-lg border border-warning/30 bg-warning/10'
const INFO_CARD_CLASS = 'rounded-lg border border-info/30 bg-info/10'

const SELECT_BASE_CLASS = 'rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1'
const PRIMARY_BUTTON_CLASS = 'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-60'
const DESTRUCTIVE_BUTTON_CLASS = 'inline-flex items-center justify-center rounded-lg bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-60'

const TAB_CONTAINER_CLASS = 'flex gap-1 rounded-lg bg-muted/40 p-1'
const TAB_BUTTON_BASE_CLASS = 'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors'
const TAB_ACTIVE_CLASS = 'bg-card text-primary shadow-sm'
const TAB_INACTIVE_CLASS = 'text-muted-foreground hover:text-foreground'
const SECTION_TITLE_CLASS = 'text-lg font-semibold text-foreground'

const PRIORITY_BADGE_VARIANTS: Record<'high' | 'medium' | 'low', string> = {
  high: 'rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive',
  medium: 'rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning',
  low: 'rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success'
}

const PRIORITY_LABELS: Record<'high' | 'medium' | 'low', string> = {
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض'
}

const STATUS_BADGE_VARIANTS: Record<'active' | 'closed' | 'review', string> = {
  active: 'rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success',
  closed: 'rounded-full bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground',
  review: 'rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning'
}

const STATUS_LABELS: Record<'active' | 'closed' | 'review', string> = {
  active: 'نشط',
  closed: 'مغلق',
  review: 'قيد المراجعة'
}

const TREND_DIRECTION_BADGES: Record<'up' | 'down' | 'stable', string> = {
  up: 'rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success',
  down: 'rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive',
  stable: 'rounded-full bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground'
}

const TREND_DIRECTION_LABELS: Record<'up' | 'down' | 'stable', string> = {
  up: 'صاعد',
  down: 'هابط',
  stable: 'مستقر'
}

const TREND_STRENGTH_CLASSES: Record<'strong' | 'moderate' | 'weak', string> = {
  strong: 'font-medium text-success',
  moderate: 'font-medium text-warning',
  weak: 'font-medium text-destructive'
}

const TREND_STRENGTH_LABELS: Record<'strong' | 'moderate' | 'weak', string> = {
  strong: 'قوي',
  moderate: 'متوسط',
  weak: 'ضعيف'
}

const COMPETITION_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي'
}

const COMPETITION_CLASSES: Record<'low' | 'medium' | 'high', string> = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-destructive'
}

type TimePeriod = 'week' | 'month' | 'quarter' | 'year'

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'week', label: 'الأسبوع الماضي' },
  { value: 'month', label: 'الشهر الماضي' },
  { value: 'quarter', label: 'الربع الماضي' },
  { value: 'year', label: 'السنة الماضية' }
]

export interface MarketMonitorProps {
  timePeriod?: TimePeriod
  showDetailedTrends?: boolean
  showOpportunityAlerts?: boolean
  onOpportunitySelect?: (opportunity: MarketOpportunity) => void
  className?: string
}

interface MarketMetrics {
  totalOpportunities: number
  totalValue: number
  averageValue: number
  winRate: number
  competitionLevel: 'low' | 'medium' | 'high'
  growthRate: number
  marketShare: number
}

export const MarketMonitor: React.FC<MarketMonitorProps> = React.memo(({
  timePeriod: initialTimePeriod = 'month',
  showDetailedTrends = true,
  showOpportunityAlerts = true,
  onOpportunitySelect,
  className = ''
}) => {
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([])
  const [trends, setTrends] = useState<MarketTrend[]>([])
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'trends' | 'alerts'>('overview')
  const [periodFilter, setPeriodFilter] = useState<TimePeriod>(initialTimePeriod)
  const periodSelectId = useId()
  const regionSelectId = useId()
  const categorySelectId = useId()

  useEffect(() => {
    setPeriodFilter(initialTimePeriod)
  }, [initialTimePeriod])

  const loadMarketData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [opportunitiesData, trendsData, competitorsData] = await Promise.all([
        competitiveService.getMarketOpportunities(),
        competitiveService.getMarketTrends(),
        competitiveService.getAllCompetitors()
      ])

      setOpportunities(opportunitiesData)
      setTrends(trendsData)
      setCompetitors(competitorsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات السوق')
      console.error('Error loading market data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMarketData()
  }, [loadMarketData])

  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities

    if (selectedRegion) {
      filtered = filtered.filter(opp => opp.region === selectedRegion)
    }

    if (selectedCategory) {
      filtered = filtered.filter(opp => opp.category === selectedCategory)
    }

    const now = new Date()
    const periodStart = new Date()

    switch (periodFilter) {
      case 'week':
        periodStart.setDate(now.getDate() - 7)
        break
      case 'month':
        periodStart.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        periodStart.setMonth(now.getMonth() - 3)
        break
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1)
        break
    }

    return filtered.filter(opp => new Date(opp.discoveryDate) >= periodStart)
  }, [opportunities, selectedRegion, selectedCategory, periodFilter])

  const marketMetrics = useMemo((): MarketMetrics => {
    const totalOpportunities = filteredOpportunities.length
    const totalValue = filteredOpportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0)
    const averageValue = totalOpportunities > 0 ? totalValue / totalOpportunities : 0

    const completedOpportunities = filteredOpportunities.filter(opp => opp.status === 'closed')
    const wonOpportunities = completedOpportunities.filter(opp => opp.outcome === 'won')
    const winRate = completedOpportunities.length > 0 ? wonOpportunities.length / completedOpportunities.length : 0

    const totalCompetitors = filteredOpportunities.reduce((sum, opp) => sum + opp.competitorCount, 0)
    const avgCompetitors = totalOpportunities > 0 ? totalCompetitors / totalOpportunities : 0
    let competitionLevel: 'low' | 'medium' | 'high' = 'low'
    if (avgCompetitors >= 6) {
      competitionLevel = 'high'
    } else if (avgCompetitors >= 3) {
      competitionLevel = 'medium'
    }

    const growthRate = 0.15
    const marketShare = 0.25

    return {
      totalOpportunities,
      totalValue,
      averageValue,
      winRate,
      competitionLevel,
      growthRate,
      marketShare
    }
  }, [filteredOpportunities])

  const uniqueRegions = useMemo(
    () => [...new Set(opportunities.map(opp => opp.region))].filter(Boolean),
    [opportunities]
  )

  const uniqueCategories = useMemo(
    () => [...new Set(opportunities.map(opp => opp.category))].filter(Boolean),
    [opportunities]
  )

  const highPriorityOpportunities = useMemo(
    () =>
      filteredOpportunities
        .filter(opp => opp.priority === 'high' && opp.status === 'active' && new Date(opp.deadline) > new Date())
        .slice(0, 5),
    [filteredOpportunities]
  )

  const handleOpportunitySelect = useCallback((opportunity: MarketOpportunity) => {
    onOpportunitySelect?.(opportunity)
  }, [onOpportunitySelect])

  if (loading && opportunities.length === 0) {
    return (
      <div className={`${CARD_BASE_CLASS} p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-muted" />
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 rounded bg-muted" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-4 w-4/6 rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${CARD_BASE_CLASS} shadow-sm ${className}`}>
      <div className="border-b border-border bg-card px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">مراقب السوق</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              تحليل السوق في الوقت الفعلي ومراقبة الفرص والاتجاهات
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label htmlFor={periodSelectId} className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
              <span>الفترة الزمنية</span>
              <select
                id={periodSelectId}
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value as TimePeriod)}
                className={SELECT_BASE_CLASS}
              >
                {PERIOD_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={loadMarketData}
              disabled={loading}
              className={PRIMARY_BUTTON_CLASS}
            >
              {loading ? 'جاري التحديث...' : 'تحديث'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className={`${PRIMARY_CARD_CLASS} p-4`}>
            <div className="text-2xl font-bold text-primary">{marketMetrics.totalOpportunities}</div>
            <div className="text-sm text-primary">إجمالي الفرص</div>
          </div>
          <div className={`${SUCCESS_CARD_CLASS} p-4`}>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(marketMetrics.totalValue)}
            </div>
            <div className="text-sm text-success">القيمة الإجمالية</div>
          </div>
          <div className={`${INFO_CARD_CLASS} p-4`}>
            <div className="text-2xl font-bold text-info">
              {formatPercentage(marketMetrics.winRate)}
            </div>
            <div className="text-sm text-info">معدل الفوز</div>
          </div>
          <div className={`${WARNING_CARD_CLASS} p-4`}>
            <div className="text-2xl font-bold text-warning">
              {formatPercentage(marketMetrics.growthRate)}
            </div>
            <div className="text-sm text-warning">معدل النمو</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label htmlFor={regionSelectId} className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
            <span>المنطقة</span>
            <select
              id={regionSelectId}
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value)}
              className={SELECT_BASE_CLASS}
            >
              <option value="">جميع المناطق</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor={categorySelectId} className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
            <span>الفئة</span>
            <select
              id={categorySelectId}
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className={SELECT_BASE_CLASS}
            >
              <option value="">جميع الفئات</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={`mt-6 ${TAB_CONTAINER_CLASS}`}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`${TAB_BUTTON_BASE_CLASS} ${activeTab === 'overview' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`}
          >
            نظرة عامة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('opportunities')}
            className={`${TAB_BUTTON_BASE_CLASS} ${activeTab === 'opportunities' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`}
          >
            الفرص
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`${TAB_BUTTON_BASE_CLASS} ${activeTab === 'trends' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`}
          >
            الاتجاهات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`${TAB_BUTTON_BASE_CLASS} ${activeTab === 'alerts' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`}
          >
            التنبيهات
          </button>
        </div>
      </div>

      {error && (
        <div className="border-l-4 border-destructive bg-destructive/10 px-6 py-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={`${MUTED_CARD_CLASS} p-4`}>
                <h3 className={`${SECTION_TITLE_CLASS} mb-3`}>ملخص السوق</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>متوسط قيمة الفرصة:</span>
                    <span className="font-medium text-foreground">{formatCurrency(marketMetrics.averageValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مستوى المنافسة:</span>
                    <span className={`font-medium ${COMPETITION_CLASSES[marketMetrics.competitionLevel]}`}>
                      {COMPETITION_LABELS[marketMetrics.competitionLevel]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>الحصة السوقية:</span>
                    <span className="font-medium text-foreground">{formatPercentage(marketMetrics.marketShare)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>عدد المنافسين المتابعين:</span>
                    <span className="font-medium text-foreground">{competitors.length}</span>
                  </div>
                </div>
              </div>

              <div className={`${MUTED_CARD_CLASS} p-4`}>
                <h3 className={`${SECTION_TITLE_CLASS} mb-3`}>أهم المناطق</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {uniqueRegions.slice(0, 5).map(region => {
                    const regionOpportunities = filteredOpportunities.filter(opp => opp.region === region)
                    const regionValue = regionOpportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0)
                    return (
                      <div key={region} className="flex justify-between">
                        <span>{region}</span>
                        <span className="font-medium text-foreground">{formatCurrency(regionValue)}</span>
                      </div>
                    )
                  })}
                  {uniqueRegions.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground">لا توجد بيانات مناطق متاحة</div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className={`${SECTION_TITLE_CLASS} mb-3`}>أحدث الفرص</h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredOpportunities.slice(0, 6).map(opportunity => {
                  const priorityBadge = PRIORITY_BADGE_VARIANTS[opportunity.priority]
                  const priorityLabel = PRIORITY_LABELS[opportunity.priority]

                  return (
                    <div
                      key={opportunity.id}
                      onClick={() => handleOpportunitySelect(opportunity)}
                      className={`${CARD_BASE_CLASS} cursor-pointer p-4 transition-shadow hover:shadow-md`}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="text-sm font-medium text-foreground">{opportunity.title}</h4>
                        <span className={priorityBadge}>{priorityLabel}</span>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>القيمة: {formatCurrency(opportunity.estimatedValue)}</div>
                        <div>المنطقة: {opportunity.region}</div>
                        <div>الفئة: {opportunity.category}</div>
                        <div>المنافسون: {opportunity.competitorCount}</div>
                        <div>الموعد النهائي: {new Date(opportunity.deadline).toLocaleDateString('ar-SA')}</div>
                      </div>
                    </div>
                  )
                })}
                {filteredOpportunities.length === 0 && (
                  <div className={`${CARD_BASE_CLASS} p-6 text-center text-sm text-muted-foreground`}>
                    لا توجد فرص خلال الفترة المحددة
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            <h3 className={SECTION_TITLE_CLASS}>جميع الفرص المتاحة</h3>

            <div className="space-y-3">
              {filteredOpportunities.map(opportunity => {
                const priorityBadge = PRIORITY_BADGE_VARIANTS[opportunity.priority]
                const priorityLabel = PRIORITY_LABELS[opportunity.priority]
                const statusKey = (opportunity.status === 'closed' ? 'closed' : opportunity.status === 'active' ? 'active' : 'review') as 'active' | 'closed' | 'review'
                const statusBadge = STATUS_BADGE_VARIANTS[statusKey]

                return (
                  <div
                    key={opportunity.id}
                    onClick={() => handleOpportunitySelect(opportunity)}
                    className={`${CARD_BASE_CLASS} cursor-pointer p-4 transition-shadow hover:shadow-md`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-medium text-foreground">{opportunity.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{opportunity.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-success">
                          {formatCurrency(opportunity.estimatedValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(opportunity.deadline).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          {opportunity.region} • {opportunity.category}
                        </span>
                        <span>{opportunity.competitorCount} منافس</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={statusBadge}>{STATUS_LABELS[statusKey]}</span>
                        <span className={priorityBadge}>{priorityLabel}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredOpportunities.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                لا توجد فرص مطابقة للمعايير المحددة
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && showDetailedTrends && (
          <div className="space-y-6">
            <h3 className={SECTION_TITLE_CLASS}>اتجاهات السوق</h3>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {trends.map(trend => {
                const directionBadge = TREND_DIRECTION_BADGES[trend.direction]
                const directionLabel = TREND_DIRECTION_LABELS[trend.direction]
                const strengthClass = TREND_STRENGTH_CLASSES[trend.strength]
                const strengthLabel = TREND_STRENGTH_LABELS[trend.strength]

                return (
                  <div key={trend.id} className={`${CARD_BASE_CLASS} p-4`}>
                    <div className="mb-3 flex items-start justify-between">
                      <h4 className="text-base font-medium text-foreground">{trend.title}</h4>
                      <span className={directionBadge}>{directionLabel}</span>
                    </div>

                    <p className="mb-3 text-sm text-muted-foreground">{trend.description}</p>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>الفترة:</span>
                        <span className="font-medium text-foreground">{trend.period}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>القوة:</span>
                        <span className={strengthClass}>{strengthLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الثقة:</span>
                        <span className="font-medium text-foreground">{formatPercentage(trend.confidence)}</span>
                      </div>
                    </div>

                    {trend.insights.length > 0 && (
                      <div className="mt-3 border-t border-border pt-3">
                        <h5 className="mb-2 text-sm font-medium text-foreground">الرؤى:</h5>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {trend.insights.slice(0, 3).map((insight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {trends.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                لا توجد اتجاهات متاحة للفترة المحددة
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && showOpportunityAlerts && (
          <div className="space-y-6">
            <h3 className={SECTION_TITLE_CLASS}>تنبيهات الفرص عالية الأولوية</h3>

            <div className="space-y-4">
              {highPriorityOpportunities.map(opportunity => {
                const priorityBadge = PRIORITY_BADGE_VARIANTS[opportunity.priority]
                const priorityLabel = PRIORITY_LABELS[opportunity.priority]

                return (
                  <div
                    key={opportunity.id}
                    className="rounded-lg border border-destructive/40 bg-destructive/10 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-medium text-destructive">{opportunity.title}</h4>
                          <span className={priorityBadge}>{priorityLabel}</span>
                        </div>
                        <p className="text-sm text-destructive/80">{opportunity.description}</p>
                        <div className="text-sm text-destructive/70">
                          القيمة: {formatCurrency(opportunity.estimatedValue)} • الموعد النهائي: {new Date(opportunity.deadline).toLocaleDateString('ar-SA')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpportunitySelect(opportunity)}
                        className={DESTRUCTIVE_BUTTON_CLASS}
                      >
                        عرض التفاصيل
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {highPriorityOpportunities.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                لا توجد تنبيهات عالية الأولوية حالياً
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

MarketMonitor.displayName = 'MarketMonitor'

export default MarketMonitor
