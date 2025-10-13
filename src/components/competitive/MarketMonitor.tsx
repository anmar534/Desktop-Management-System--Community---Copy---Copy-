/**
 * Market Monitor Component for Phase 2 Implementation
 * 
 * This component provides real-time market monitoring and analysis
 * capabilities including market trends, opportunity tracking, and
 * competitive landscape analysis for strategic decision making.
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Competitive Intelligence System
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { MarketOpportunity, MarketTrend, CompetitorData } from '../../types/competitive'
import { competitiveService } from '../../services/competitiveService'
import { formatCurrency, formatPercentage } from '../../utils/analyticsUtils'

/**
 * Market Monitor Component Props
 */
export interface MarketMonitorProps {
  /** Time period for market analysis */
  timePeriod?: 'week' | 'month' | 'quarter' | 'year'
  /** Whether to show detailed market trends */
  showDetailedTrends?: boolean
  /** Whether to show opportunity alerts */
  showOpportunityAlerts?: boolean
  /** Callback when opportunity is selected */
  onOpportunitySelect?: (opportunity: MarketOpportunity) => void
  /** Custom CSS classes */
  className?: string
}

/**
 * Market metrics interface
 */
interface MarketMetrics {
  totalOpportunities: number
  totalValue: number
  averageValue: number
  winRate: number
  competitionLevel: 'low' | 'medium' | 'high'
  growthRate: number
  marketShare: number
}

/**
 * Market Monitor Component
 */
export const MarketMonitor: React.FC<MarketMonitorProps> = React.memo(({
  timePeriod = 'month',
  showDetailedTrends = true,
  showOpportunityAlerts = true,
  onOpportunitySelect,
  className = ''
}) => {
  // State management
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([])
  const [trends, setTrends] = useState<MarketTrend[]>([])
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'trends' | 'alerts'>('overview')

  // Load market data
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

  // Load data on component mount
  useEffect(() => {
    loadMarketData()
  }, [loadMarketData])

  // Filter opportunities based on selected filters
  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities

    if (selectedRegion) {
      filtered = filtered.filter(opp => opp.region === selectedRegion)
    }

    if (selectedCategory) {
      filtered = filtered.filter(opp => opp.category === selectedCategory)
    }

    // Filter by time period
    const now = new Date()
    const periodStart = new Date()
    
    switch (timePeriod) {
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

    filtered = filtered.filter(opp => 
      new Date(opp.discoveryDate) >= periodStart
    )

    return filtered
  }, [opportunities, selectedRegion, selectedCategory, timePeriod])

  // Calculate market metrics
  const marketMetrics = useMemo((): MarketMetrics => {
    const totalOpportunities = filteredOpportunities.length
    const totalValue = filteredOpportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0)
    const averageValue = totalOpportunities > 0 ? totalValue / totalOpportunities : 0
    
    // Calculate win rate based on historical data
    const completedOpportunities = filteredOpportunities.filter(opp => opp.status === 'closed')
    const wonOpportunities = completedOpportunities.filter(opp => opp.outcome === 'won')
    const winRate = completedOpportunities.length > 0 ? wonOpportunities.length / completedOpportunities.length : 0

    // Determine competition level
    const avgCompetitors = filteredOpportunities.reduce((sum, opp) => sum + opp.competitorCount, 0) / totalOpportunities
    const competitionLevel: 'low' | 'medium' | 'high' = 
      avgCompetitors < 3 ? 'low' : avgCompetitors < 6 ? 'medium' : 'high'

    // Calculate growth rate (simplified)
    const growthRate = 0.15 // Placeholder - would be calculated from historical data

    // Calculate market share (simplified)
    const marketShare = 0.25 // Placeholder - would be calculated from actual data

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

  // Get unique regions and categories for filters
  const uniqueRegions = useMemo(() => 
    [...new Set(opportunities.map(opp => opp.region))].filter(Boolean),
    [opportunities]
  )

  const uniqueCategories = useMemo(() => 
    [...new Set(opportunities.map(opp => opp.category))].filter(Boolean),
    [opportunities]
  )

  // Get high-priority opportunities for alerts
  const highPriorityOpportunities = useMemo(() => 
    filteredOpportunities.filter(opp => 
      opp.priority === 'high' && 
      opp.status === 'active' &&
      new Date(opp.deadline) > new Date()
    ).slice(0, 5),
    [filteredOpportunities]
  )

  // Handle opportunity selection
  const handleOpportunitySelect = useCallback((opportunity: MarketOpportunity) => {
    onOpportunitySelect?.(opportunity)
  }, [onOpportunitySelect])

  // Render loading state
  if (loading && opportunities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">مراقب السوق</h2>
            <p className="text-sm text-gray-600 mt-1">
              تحليل السوق في الوقت الفعلي ومراقبة الفرص والاتجاهات
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">الأسبوع الماضي</option>
              <option value="month">الشهر الماضي</option>
              <option value="quarter">الربع الماضي</option>
              <option value="year">السنة الماضية</option>
            </select>
            
            <button
              onClick={loadMarketData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'جاري التحديث...' : 'تحديث'}
            </button>
          </div>
        </div>

        {/* Market Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{marketMetrics.totalOpportunities}</div>
            <div className="text-sm text-blue-800">إجمالي الفرص</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(marketMetrics.totalValue)}
            </div>
            <div className="text-sm text-green-800">القيمة الإجمالية</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatPercentage(marketMetrics.winRate)}
            </div>
            <div className="text-sm text-purple-800">معدل الفوز</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {formatPercentage(marketMetrics.growthRate)}
            </div>
            <div className="text-sm text-orange-800">معدل النمو</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع المناطق</option>
            {uniqueRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع الفئات</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            نظرة عامة
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'opportunities'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الفرص
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'trends'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الاتجاهات
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            التنبيهات
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Market Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">ملخص السوق</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>متوسط قيمة الفرصة:</span>
                    <span className="font-medium">{formatCurrency(marketMetrics.averageValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مستوى المنافسة:</span>
                    <span className={`font-medium ${
                      marketMetrics.competitionLevel === 'high' ? 'text-red-600' :
                      marketMetrics.competitionLevel === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {marketMetrics.competitionLevel === 'high' ? 'عالي' :
                       marketMetrics.competitionLevel === 'medium' ? 'متوسط' : 'منخفض'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>الحصة السوقية:</span>
                    <span className="font-medium">{formatPercentage(marketMetrics.marketShare)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">أهم المناطق</h3>
                <div className="space-y-2">
                  {uniqueRegions.slice(0, 5).map(region => {
                    const regionOpps = filteredOpportunities.filter(opp => opp.region === region)
                    const regionValue = regionOpps.reduce((sum, opp) => sum + opp.estimatedValue, 0)
                    return (
                      <div key={region} className="flex justify-between text-sm">
                        <span>{region}</span>
                        <span className="font-medium">{formatCurrency(regionValue)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Recent Opportunities */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">أحدث الفرص</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredOpportunities.slice(0, 6).map(opportunity => (
                  <div
                    key={opportunity.id}
                    onClick={() => handleOpportunitySelect(opportunity)}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{opportunity.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opportunity.priority === 'high' ? 'bg-red-100 text-red-800' :
                        opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {opportunity.priority === 'high' ? 'عالي' :
                         opportunity.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>القيمة: {formatCurrency(opportunity.estimatedValue)}</div>
                      <div>المنطقة: {opportunity.region}</div>
                      <div>الفئة: {opportunity.category}</div>
                      <div>المنافسين: {opportunity.competitorCount}</div>
                      <div>الموعد النهائي: {new Date(opportunity.deadline).toLocaleDateString('ar-SA')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">جميع الفرص المتاحة</h3>
            
            <div className="space-y-3">
              {filteredOpportunities.map(opportunity => (
                <div
                  key={opportunity.id}
                  onClick={() => handleOpportunitySelect(opportunity)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{opportunity.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(opportunity.estimatedValue)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(opportunity.deadline).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {opportunity.region} • {opportunity.category}
                      </span>
                      <span className="text-sm text-gray-600">
                        {opportunity.competitorCount} منافس
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opportunity.status === 'active' ? 'bg-green-100 text-green-800' :
                        opportunity.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {opportunity.status === 'active' ? 'نشط' :
                         opportunity.status === 'closed' ? 'مغلق' : 'قيد المراجعة'}
                      </span>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opportunity.priority === 'high' ? 'bg-red-100 text-red-800' :
                        opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {opportunity.priority === 'high' ? 'عالي' :
                         opportunity.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredOpportunities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد فرص مطابقة للمعايير المحددة
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && showDetailedTrends && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">اتجاهات السوق</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {trends.map(trend => (
                <div key={trend.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{trend.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trend.direction === 'up' ? 'bg-green-100 text-green-800' :
                      trend.direction === 'down' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trend.direction === 'up' ? 'صاعد' :
                       trend.direction === 'down' ? 'هابط' : 'مستقر'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{trend.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>الفترة:</span>
                      <span className="font-medium">{trend.period}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>القوة:</span>
                      <span className={`font-medium ${
                        trend.strength === 'strong' ? 'text-green-600' :
                        trend.strength === 'moderate' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {trend.strength === 'strong' ? 'قوي' :
                         trend.strength === 'moderate' ? 'متوسط' : 'ضعيف'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>الثقة:</span>
                      <span className="font-medium">{formatPercentage(trend.confidence)}</span>
                    </div>
                  </div>
                  
                  {trend.insights.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">الرؤى:</h5>
                      <ul className="space-y-1">
                        {trend.insights.slice(0, 3).map((insight, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {trends.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد اتجاهات متاحة للفترة المحددة
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && showOpportunityAlerts && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">تنبيهات الفرص عالية الأولوية</h3>
            
            <div className="space-y-4">
              {highPriorityOpportunities.map(opportunity => (
                <div
                  key={opportunity.id}
                  className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-red-900">{opportunity.title}</h4>
                      <p className="text-sm text-red-700 mt-1">{opportunity.description}</p>
                      <div className="mt-2 text-sm text-red-600">
                        القيمة: {formatCurrency(opportunity.estimatedValue)} • 
                        الموعد النهائي: {new Date(opportunity.deadline).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpportunitySelect(opportunity)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {highPriorityOpportunities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
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
