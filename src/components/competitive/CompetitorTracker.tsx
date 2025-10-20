/**
 * Competitor Tracker Component for Phase 2 Implementation
 * 
 * This component provides comprehensive competitor tracking and management
 * capabilities including competitor profiles, activity monitoring, and
 * performance analysis for competitive intelligence.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Competitive Intelligence System
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { CompetitorData } from '../../types/competitive'
import { competitiveService } from '../../services/competitiveService'
import { formatCurrency, formatPercentage } from '../../utils/analyticsUtils'
import { Badge } from '../ui/badge'

const STATUS_BADGE_VARIANTS: Record<'active' | 'inactive' | 'monitoring' | 'archived', string> = {
  active: 'bg-success/10 text-success border-none',
  inactive: 'bg-muted/40 text-muted-foreground border-none',
  monitoring: 'bg-warning/10 text-warning border-none',
  archived: 'bg-muted/40 text-muted-foreground border-none'
}

const STATUS_LABELS: Record<'active' | 'inactive' | 'monitoring' | 'archived', string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  monitoring: 'تحت المراقبة',
  archived: 'مؤرشف'
}

const THREAT_LEVEL_BADGE_VARIANTS: Record<'low' | 'medium' | 'high' | 'critical', string> = {
  low: 'bg-success/10 text-success border-none',
  medium: 'bg-warning/10 text-warning border-none',
  high: 'bg-destructive/10 text-destructive border-none',
  critical: 'bg-destructive/20 text-destructive border-none'
}

const THREAT_LEVEL_LABELS: Record<'low' | 'medium' | 'high' | 'critical', string> = {
  low: 'تهديد منخفض',
  medium: 'تهديد متوسط',
  high: 'تهديد عالي',
  critical: 'تهديد حرج'
}

const COMPETITOR_TYPE_LABELS: Record<'local' | 'international' | 'government' | 'private', string> = {
  local: 'محلي',
  international: 'دولي',
  government: 'حكومي',
  private: 'خاص'
}

const MARKET_POSITION_LABELS: Record<'leader' | 'challenger' | 'follower' | 'unknown', string> = {
  leader: 'رائد السوق',
  challenger: 'منافس قوي',
  follower: 'تابع',
  unknown: 'غير محدد'
}

const ACTIVITY_TYPE_LABELS: Record<
  'tender_win' | 'tender_loss' | 'new_project' | 'partnership' | 'expansion',
  string
> = {
  tender_win: 'فوز بمناقصة',
  tender_loss: 'خسارة مناقصة',
  new_project: 'مشروع جديد',
  partnership: 'شراكة',
  expansion: 'توسع'
}

const STAT_CARD_VARIANTS: Record<
  'total' | 'active' | 'highThreat' | 'avgMarketShare',
  { container: string; value: string; label: string }
> = {
  total: {
    container: 'border border-primary/20 bg-primary/10',
    value: 'text-primary',
    label: 'text-primary'
  },
  active: {
    container: 'border border-success/20 bg-success/10',
    value: 'text-success',
    label: 'text-success'
  },
  highThreat: {
    container: 'border border-destructive/20 bg-destructive/10',
    value: 'text-destructive',
    label: 'text-destructive'
  },
  avgMarketShare: {
    container: 'border border-accent/20 bg-accent/10',
    value: 'text-accent',
    label: 'text-accent'
  }
}

const getStatusBadgeClass = (status?: string | null) =>
  (status && STATUS_BADGE_VARIANTS[status as keyof typeof STATUS_BADGE_VARIANTS]) ||
  'bg-muted/40 text-muted-foreground border-none'

const getStatusLabel = (status?: string | null) =>
  (status && STATUS_LABELS[status as keyof typeof STATUS_LABELS]) || 'غير محدد'

const getThreatBadgeClass = (level?: string | null) =>
  (level && THREAT_LEVEL_BADGE_VARIANTS[level as keyof typeof THREAT_LEVEL_BADGE_VARIANTS]) ||
  'bg-warning/10 text-warning border-none'

const getThreatLabel = (level?: string | null) =>
  (level && THREAT_LEVEL_LABELS[level as keyof typeof THREAT_LEVEL_LABELS]) || 'تهديد غير معروف'

const getCompetitorTypeLabel = (type: string) =>
  COMPETITOR_TYPE_LABELS[type as keyof typeof COMPETITOR_TYPE_LABELS] || type

const getActivityTypeLabel = (type: string) =>
  ACTIVITY_TYPE_LABELS[type as keyof typeof ACTIVITY_TYPE_LABELS] || type

const getMarketPositionLabel = (position?: string | null) => {
  if (!position) return MARKET_POSITION_LABELS.unknown
  return MARKET_POSITION_LABELS[position as keyof typeof MARKET_POSITION_LABELS] || MARKET_POSITION_LABELS.unknown
}

/**
 * Competitor Tracker Component Props
 */
export interface CompetitorTrackerProps {
  /** Initial competitor filter */
  initialFilter?: {
    region?: string
    category?: string
    status?: 'active' | 'inactive' | 'monitoring'
  }
  /** Whether to show detailed competitor profiles */
  showDetailedProfiles?: boolean
  /** Whether to show activity timeline */
  showActivityTimeline?: boolean
  /** Callback when competitor is selected */
  onCompetitorSelect?: (competitor: CompetitorData) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * Competitor form data interface
 */
interface CompetitorFormData {
  name: string
  type: 'local' | 'international' | 'government' | 'private'
  region: string
  categories: string[]
  status: 'active' | 'inactive' | 'monitoring'
  contactInfo: {
    website?: string
    phone?: string
    email?: string
    address?: string
  }
  financialInfo: {
    estimatedRevenue?: number
    marketShare?: number
    employeeCount?: number
  }
  strengths: string[]
  weaknesses: string[]
  recentActivities: {
    date: string
    type: 'tender_win' | 'tender_loss' | 'new_project' | 'partnership' | 'expansion'
    description: string
    value?: number
  }[]
}

/**
 * Competitor Tracker Component
 */
export const CompetitorTracker: React.FC<CompetitorTrackerProps> = React.memo(({
  initialFilter,
  showDetailedProfiles = true,
  showActivityTimeline = true,
  onCompetitorSelect,
  className = ''
}) => {
  // State management
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [filteredCompetitors, setFilteredCompetitors] = useState<CompetitorData[]>([])
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'activities' | 'analysis'>('overview')

  // Filter states
  const [regionFilter, setRegionFilter] = useState(initialFilter?.region || '')
  const [categoryFilter, setCategoryFilter] = useState(initialFilter?.category || '')
  const [statusFilter, setStatusFilter] = useState(initialFilter?.status || '')

  // Form state for adding/editing competitors
  const [formData, setFormData] = useState<CompetitorFormData>({
    name: '',
    type: 'private',
    region: '',
    categories: [],
    status: 'active',
    contactInfo: {},
    financialInfo: {},
    strengths: [],
    weaknesses: [],
    recentActivities: []
  })

  // Load competitors data
  const loadCompetitors = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await competitiveService.getAllCompetitors()
      setCompetitors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات المنافسين')
      console.error('Error loading competitors:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter competitors based on search and filters
  const applyFilters = useCallback(() => {
    let filtered = competitors

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(competitor =>
        competitor.name.toLowerCase().includes(term) ||
        competitor.region.toLowerCase().includes(term) ||
        competitor.categories.some(cat => cat.toLowerCase().includes(term))
      )
    }

    // Apply region filter
    if (regionFilter) {
      filtered = filtered.filter(competitor => competitor.region === regionFilter)
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(competitor => 
        competitor.categories.includes(categoryFilter)
      )
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(competitor => competitor.status === statusFilter)
    }

    setFilteredCompetitors(filtered)
  }, [competitors, searchTerm, regionFilter, categoryFilter, statusFilter])

  // Load data on component mount
  useEffect(() => {
    loadCompetitors()
  }, [loadCompetitors])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Handle competitor selection
  const handleCompetitorSelect = useCallback((competitor: CompetitorData) => {
    setSelectedCompetitor(competitor)
    onCompetitorSelect?.(competitor)
  }, [onCompetitorSelect])

  // Handle form submission
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const competitorData: Omit<CompetitorData, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        lastUpdated: new Date().toISOString(),
        marketPosition: 'unknown',
        threatLevel: 'medium',
        opportunities: [],
        threats: []
      }

      await competitiveService.createCompetitor(competitorData)
      await loadCompetitors()
      setShowAddForm(false)
      setFormData({
        name: '',
        type: 'private',
        region: '',
        categories: [],
        status: 'active',
        contactInfo: {},
        financialInfo: {},
        strengths: [],
        weaknesses: [],
        recentActivities: []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إضافة المنافس')
    } finally {
      setLoading(false)
    }
  }, [formData, loadCompetitors])

  // Get unique values for filters
  const uniqueRegions = useMemo(() => 
    [...new Set(competitors.map(c => c.region))].filter(Boolean),
    [competitors]
  )

  const uniqueCategories = useMemo(() => 
    [...new Set(competitors.flatMap(c => c.categories))].filter(Boolean),
    [competitors]
  )

  // Calculate competitor statistics
  const competitorStats = useMemo(() => {
    const total = competitors.length
    const active = competitors.filter(c => c.status === 'active').length
    const highThreat = competitors.filter(c => ['high', 'critical'].includes((c.threatLevel || '') as string)).length
    const totalMarketShare = competitors.reduce((sum, c) => sum + (c.financialInfo?.marketShare || 0), 0)
    const avgMarketShare = total === 0 ? 0 : totalMarketShare / total

    return { total, active, highThreat, avgMarketShare }
  }, [competitors])

  const statCards = useMemo(
    () => [
      {
        key: 'total',
        title: 'إجمالي المنافسين',
        display: String(competitorStats.total),
        variant: 'total' as const
      },
      {
        key: 'active',
        title: 'منافسين نشطين',
        display: String(competitorStats.active),
        variant: 'active' as const
      },
      {
        key: 'highThreat',
        title: 'تهديد عالي',
        display: String(competitorStats.highThreat),
        variant: 'highThreat' as const
      },
      {
        key: 'avgMarketShare',
        title: 'متوسط الحصة السوقية',
        display: formatPercentage(competitorStats.avgMarketShare),
        variant: 'avgMarketShare' as const
      }
    ],
    [competitorStats]
  )

  type TabKey = 'overview' | 'profile' | 'activities' | 'analysis'

  const tabs = useMemo(() => {
    const tabList: Array<{ key: TabKey; label: string }> = [
      { key: 'overview', label: 'نظرة عامة' }
    ]

    if (showDetailedProfiles) {
      tabList.push({ key: 'profile', label: 'الملف الشخصي' })
    }

    if (showActivityTimeline) {
      tabList.push({ key: 'activities', label: 'الأنشطة' })
    }

    tabList.push({ key: 'analysis', label: 'التحليل' })

    return tabList
  }, [showDetailedProfiles, showActivityTimeline])

  useEffect(() => {
    if (!showDetailedProfiles && activeTab === 'profile') {
      setActiveTab('overview')
    } else if (!showActivityTimeline && activeTab === 'activities') {
      setActiveTab('overview')
    }
  }, [activeTab, showActivityTimeline, showDetailedProfiles])

  // Render loading state
  if (loading && competitors.length === 0) {
    return (
      <div className={`rounded-lg border border-border bg-card p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-muted"></div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-muted"></div>
            <div className="h-4 w-5/6 rounded bg-muted"></div>
            <div className="h-4 w-4/6 rounded bg-muted"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-border bg-card shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-border/60 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">تتبع المنافسين</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              إدارة ومراقبة المنافسين وتحليل أنشطتهم في السوق
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            إضافة منافس جديد
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {statCards.map(card => {
            const variant = STAT_CARD_VARIANTS[card.variant]
            return (
              <div
                key={card.key}
                className={`rounded-lg p-4 shadow-sm ${variant.container}`}
              >
                <div className={`text-2xl font-bold ${variant.value}`}>{card.display}</div>
                <div className={`text-sm ${variant.label}`}>{card.title}</div>
              </div>
            )
          })}
        </div>

        {/* Search and Filters */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="البحث في المنافسين..."
            aria-label="البحث في المنافسين"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
          />

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            aria-label="تصفية حسب المنطقة"
            className="rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
          >
            <option value="">جميع المناطق</option>
            {uniqueRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="تصفية حسب الفئة"
            className="rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
          >
            <option value="">جميع الفئات</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="تصفية حسب الحالة"
            className="rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="monitoring">تحت المراقبة</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="mt-6 rounded-lg bg-muted/60 p-1">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
          <div className="text-sm font-medium text-destructive">{error}</div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Competitors List */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {filteredCompetitors.map(competitor => (
                <div
                  key={competitor.id}
                  onClick={() => handleCompetitorSelect(competitor)}
                  className="cursor-pointer rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="font-semibold text-foreground">{competitor.name}</h3>
                    <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(competitor.status)}`}>
                      {getStatusLabel(competitor.status)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>النوع: {getCompetitorTypeLabel(competitor.type)}</div>
                    <div>المنطقة: {competitor.region}</div>
                    <div>الفئات: {competitor.categories.join(', ')}</div>
                    {competitor.financialInfo?.marketShare && (
                      <div>الحصة السوقية: {formatPercentage(competitor.financialInfo.marketShare)}</div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getThreatBadgeClass(competitor.threatLevel)}`}
                    >
                      {getThreatLabel(competitor.threatLevel)}
                    </Badge>

                    <div className="text-xs text-muted-foreground">
                      آخر تحديث: {new Date(competitor.lastUpdated).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCompetitors.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                لا توجد منافسين مطابقين للمعايير المحددة
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && selectedCompetitor && (
            <div className="space-y-6">
              {/* Competitor Profile Details */}
              <div className="rounded-lg border border-border bg-muted/40 p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  ملف {selectedCompetitor.name}
                </h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium text-foreground">المعلومات الأساسية</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div><span className="font-medium text-foreground">النوع:</span> {getCompetitorTypeLabel(selectedCompetitor.type)}</div>
                      <div><span className="font-medium text-foreground">المنطقة:</span> {selectedCompetitor.region}</div>
                      <div><span className="font-medium text-foreground">الفئات:</span> {selectedCompetitor.categories.join(', ')}</div>
                      <div><span className="font-medium text-foreground">الحالة:</span> {getStatusLabel(selectedCompetitor.status)}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-foreground">المعلومات المالية</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {selectedCompetitor.financialInfo?.estimatedRevenue && (
                        <div><span className="font-medium text-foreground">الإيرادات المقدرة:</span> {formatCurrency(selectedCompetitor.financialInfo.estimatedRevenue)}</div>
                      )}
                      {selectedCompetitor.financialInfo?.marketShare && (
                        <div><span className="font-medium text-foreground">الحصة السوقية:</span> {formatPercentage(selectedCompetitor.financialInfo.marketShare)}</div>
                      )}
                      {selectedCompetitor.financialInfo?.employeeCount && (
                        <div><span className="font-medium text-foreground">عدد الموظفين:</span> {selectedCompetitor.financialInfo.employeeCount}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-success/20 bg-success/10 p-4">
                  <h4 className="mb-3 font-medium text-success">نقاط القوة</h4>
                  <ul className="space-y-1 text-sm text-success">
                    {selectedCompetitor.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-success">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                  <h4 className="mb-3 font-medium text-destructive">نقاط الضعف</h4>
                  <ul className="space-y-1 text-sm text-destructive">
                    {selectedCompetitor.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-destructive">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

        {activeTab === 'activities' && selectedCompetitor && showActivityTimeline && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              الأنشطة الأخيرة - {selectedCompetitor.name}
            </h3>

            <div className="space-y-4">
              {selectedCompetitor.recentActivities.map((activity, index) => (
                <div key={index} className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="font-medium text-foreground">{activity.description}</div>
                      <div>{getActivityTypeLabel(activity.type)}</div>
                      {activity.value && (
                        <div>
                          القيمة: {formatCurrency(activity.value)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
              ))}

              {selectedCompetitor.recentActivities.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  لا توجد أنشطة مسجلة لهذا المنافس
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && selectedCompetitor && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              تحليل المنافس - {selectedCompetitor.name}
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-info/30 bg-info/10 p-4">
                <h4 className="mb-3 font-medium text-info">الفرص</h4>
                <ul className="space-y-1 text-sm text-info">
                  {selectedCompetitor.opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-info">•</span>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <h4 className="mb-3 font-medium text-warning">التهديدات</h4>
                <ul className="space-y-1 text-sm text-warning">
                  {selectedCompetitor.threats.map((threat, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-warning">•</span>
                      {threat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <h4 className="mb-3 font-medium text-foreground">الموقع في السوق</h4>
              <div className="text-sm text-muted-foreground">
                {getMarketPositionLabel(selectedCompetitor.marketPosition)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Competitor Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">إضافة منافس جديد</h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
                aria-label="إغلاق نموذج إضافة المنافس"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="competitor-name" className="mb-1 block text-sm font-medium text-foreground">
                    اسم المنافس *
                  </label>
                  <input
                    id="competitor-name"
                    type="text"
                    required
                    placeholder="أدخل اسم المنافس"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
                  />
                </div>

                <div>
                  <label htmlFor="competitor-type" className="mb-1 block text-sm font-medium text-foreground">
                    النوع *
                  </label>
                  <select
                    id="competitor-type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CompetitorFormData['type'] }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
                  >
                    <option value="local">محلي</option>
                    <option value="international">دولي</option>
                    <option value="government">حكومي</option>
                    <option value="private">خاص</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="competitor-region" className="mb-1 block text-sm font-medium text-foreground">
                    المنطقة *
                  </label>
                  <input
                    id="competitor-region"
                    type="text"
                    required
                    placeholder="أدخل المنطقة"
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
                  />
                </div>

                <div>
                  <label htmlFor="competitor-status" className="mb-1 block text-sm font-medium text-foreground">
                    الحالة
                  </label>
                  <select
                    id="competitor-status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CompetitorFormData['status'] }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="monitoring">تحت المراقبة</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 disabled:opacity-60"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

CompetitorTracker.displayName = 'CompetitorTracker'

export default CompetitorTracker
