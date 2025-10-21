/**
 * @fileoverview Market Intelligence Component
 * @description Comprehensive market intelligence dashboard for Phase 3 implementation.
 * Provides material cost tracking, labor rate monitoring, economic indicators,
 * industry trends analysis, and market opportunity identification.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  AlertTriangle,
  Download,
  Filter,
  Search,
  RefreshCw,
  Building,
  Zap,
  Target,
  Activity
} from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  marketIntelligenceService,
  type MaterialCost,
  type LaborRate,
  type EconomicIndicator,
  type IndustryTrend,
  type MarketOpportunity,
  type MarketAnalysisResult,
  type MarketIntelligenceFilters,
  type MarketAlert
} from '../../services/marketIntelligenceService'

// ===== COMPONENT PROPS =====

export interface MarketIntelligenceProps {
  className?: string
  onDataUpdate?: () => void
  showAnalytics?: boolean
  compactMode?: boolean
}

const NEUTRAL_BADGE_CLASS = 'bg-muted/40 text-muted-foreground border-none'

const TREND_BADGE_VARIANTS: Record<'increasing' | 'decreasing' | 'stable', string> = {
  increasing: 'bg-destructive/10 text-destructive border-none',
  decreasing: 'bg-success/10 text-success border-none',
  stable: NEUTRAL_BADGE_CLASS
}

const SENTIMENT_BADGE_VARIANTS: Record<'positive' | 'negative' | 'neutral', string> = {
  positive: 'bg-success/10 text-success border-none',
  negative: 'bg-destructive/10 text-destructive border-none',
  neutral: NEUTRAL_BADGE_CLASS
}

const COMPETITION_BADGE_VARIANTS: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-success/10 text-success border-none',
  medium: 'bg-warning/10 text-warning border-none',
  high: 'bg-destructive/10 text-destructive border-none'
}

const ALERT_SEVERITY_DOT_VARIANTS: Record<MarketAlert['severity'], string> = {
  critical: 'bg-destructive',
  high: 'bg-warning',
  medium: 'bg-accent',
  low: 'bg-info'
}

const MATERIAL_AVAILABILITY_VARIANTS: Record<MaterialCost['availability'], string> = {
  high: 'bg-success/10 text-success border-none',
  medium: 'bg-warning/10 text-warning border-none',
  low: 'bg-destructive/10 text-destructive border-none'
}

const LABOR_SKILL_LEVEL_VARIANTS: Record<LaborRate['skillLevel'], string> = {
  expert: 'bg-accent/10 text-accent border-none',
  senior: 'bg-info/10 text-info border-none',
  intermediate: 'bg-success/10 text-success border-none',
  entry: NEUTRAL_BADGE_CLASS
}

const LABOR_DEMAND_VARIANTS: Record<LaborRate['demand'], string> = {
  high: 'bg-destructive/10 text-destructive border-none',
  medium: 'bg-warning/10 text-warning border-none',
  low: 'bg-success/10 text-success border-none'
}

const LABOR_AVAILABILITY_VARIANTS: Record<LaborRate['availability'], string> = {
  abundant: 'bg-success/10 text-success border-none',
  moderate: 'bg-warning/10 text-warning border-none',
  scarce: 'bg-destructive/10 text-destructive border-none'
}

const INDICATOR_IMPACT_VARIANTS: Record<EconomicIndicator['impact'], string> = {
  positive: 'bg-success/10 text-success border-none',
  negative: 'bg-destructive/10 text-destructive border-none',
  neutral: NEUTRAL_BADGE_CLASS
}

const OPPORTUNITY_STATUS_VARIANTS: Record<MarketOpportunity['status'], string> = {
  active: 'bg-success/10 text-success border-none',
  pursuing: 'bg-info/10 text-info border-none',
  won: 'bg-primary/10 text-primary border-none',
  lost: 'bg-destructive/10 text-destructive border-none',
  expired: NEUTRAL_BADGE_CLASS
}

const OPPORTUNITY_COMPETITION_VARIANTS: Record<MarketOpportunity['competitionLevel'], string> = {
  low: 'bg-success/10 text-success border-none',
  medium: 'bg-warning/10 text-warning border-none',
  high: 'bg-destructive/10 text-destructive border-none'
}

const TREND_IMPACT_VARIANTS: Record<IndustryTrend['impact'], string> = {
  high: 'bg-destructive/10 text-destructive border-none',
  medium: 'bg-warning/10 text-warning border-none',
  low: 'bg-success/10 text-success border-none'
}

const TIMEFRAME_LABELS: Record<IndustryTrend['timeframe'], string> = {
  short: 'قصير المدى',
  medium: 'متوسط المدى',
  long: 'طويل المدى'
}

const getChangeTextClass = (change?: number) => {
  if (change === undefined) return 'text-muted-foreground'
  if (change > 0) return 'text-success'
  if (change < 0) return 'text-destructive'
  return 'text-muted-foreground'
}

const getPriceChangeBadgeClass = (value: number) => {
  if (value > 0) return 'bg-destructive/10 text-destructive border-none'
  if (value < 0) return 'bg-success/10 text-success border-none'
  return NEUTRAL_BADGE_CLASS
}

// ===== MAIN COMPONENT =====

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = React.memo(({
  className = '',
  onDataUpdate,
  showAnalytics = true,
  compactMode = false
}) => {
  // ===== STATE MANAGEMENT =====
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters] = useState<MarketIntelligenceFilters>({})
  
  // Data states
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysisResult | null>(null)
  const [materialCosts, setMaterialCosts] = useState<MaterialCost[]>([])
  const [laborRates, setLaborRates] = useState<LaborRate[]>([])
  const [economicIndicators, setEconomicIndicators] = useState<EconomicIndicator[]>([])
  const [industryTrends, setIndustryTrends] = useState<IndustryTrend[]>([])
  const [marketOpportunities, setMarketOpportunities] = useState<MarketOpportunity[]>([])

  // ===== DATA LOADING =====

  const loadMarketData = useCallback(async () => {
    try {
      setLoading(true)
      
      const [analysis, materials, labor, indicators, trends, opportunities] = await Promise.all([
        marketIntelligenceService.getMarketAnalysis(),
        marketIntelligenceService.getMaterialCosts(filters),
        marketIntelligenceService.getLaborRates(filters),
        marketIntelligenceService.getEconomicIndicators(filters),
        marketIntelligenceService.getIndustryTrends(filters),
        marketIntelligenceService.getMarketOpportunities(filters)
      ])

      setMarketAnalysis(analysis)
      setMaterialCosts(materials)
      setLaborRates(labor)
      setEconomicIndicators(indicators)
      setIndustryTrends(trends)
      setMarketOpportunities(opportunities)
      
      onDataUpdate?.()
    } catch (error) {
      console.error('Error loading market data:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, onDataUpdate])

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await loadMarketData()
    setRefreshing(false)
  }, [loadMarketData])

  // ===== EFFECTS =====

  useEffect(() => {
    loadMarketData()
  }, [loadMarketData])

  // ===== FILTERED DATA =====

  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    
    return {
      materials: materialCosts.filter(m => 
        !searchTerm || 
        m.materialName.toLowerCase().includes(searchLower) ||
        m.supplier.toLowerCase().includes(searchLower) ||
        m.region.toLowerCase().includes(searchLower)
      ),
      labor: laborRates.filter(l => 
        !searchTerm || 
        l.skillCategory.toLowerCase().includes(searchLower) ||
        l.city.toLowerCase().includes(searchLower) ||
        l.region.toLowerCase().includes(searchLower)
      ),
      indicators: economicIndicators.filter(i => 
        !searchTerm || 
        i.name.toLowerCase().includes(searchLower) ||
        i.nameEn?.toLowerCase().includes(searchLower)
      ),
      trends: industryTrends.filter(t => 
        !searchTerm || 
        t.title.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      ),
      opportunities: marketOpportunities.filter(o => 
        !searchTerm || 
        o.title.toLowerCase().includes(searchLower) ||
        o.description.toLowerCase().includes(searchLower) ||
        o.sector.toLowerCase().includes(searchLower)
      )
    }
  }, [materialCosts, laborRates, economicIndicators, industryTrends, marketOpportunities, searchTerm])

  // ===== EVENT HANDLERS =====

  const handleExport = useCallback(async (type: 'materials' | 'labor' | 'indicators', format: 'json' | 'csv') => {
    try {
      const data = await marketIntelligenceService.exportMarketData(type, format)
      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `market_${type}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }, [])

  const handleGenerateReport = useCallback(async () => {
    try {
      const report = await marketIntelligenceService.generateMarketReport(filters)
      const blob = new Blob([report], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `market_intelligence_report_${new Date().toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }, [filters])

  // ===== RENDER HELPERS =====

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    change?: number
  ) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${getChangeTextClass(change)}`}>
                {change > 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : 
                 change < 0 ? <TrendingDown className="mr-1 h-4 w-4" /> : 
                 <Activity className="mr-1 h-4 w-4 text-muted-foreground" />}
                {change > 0 ? '+' : ''}{change}%
              </div>
            )}
          </div>
          <div className="text-primary opacity-80">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderTrendBadge = (trend: string) => {
    const badgeClass = TREND_BADGE_VARIANTS[trend as keyof typeof TREND_BADGE_VARIANTS] || NEUTRAL_BADGE_CLASS

    return (
      <Badge variant="outline" className={badgeClass}>
        {trend === 'increasing' ? 'متزايد' : trend === 'decreasing' ? 'متناقص' : 'مستقر'}
      </Badge>
    )
  }

  const renderSentimentBadge = (sentiment: string) => {
    const badgeClass = SENTIMENT_BADGE_VARIANTS[sentiment as keyof typeof SENTIMENT_BADGE_VARIANTS] || NEUTRAL_BADGE_CLASS

    return (
      <Badge variant="outline" className={badgeClass}>
        {sentiment === 'positive' ? 'إيجابي' : sentiment === 'negative' ? 'سلبي' : 'محايد'}
      </Badge>
    )
  }

  // ===== LOADING STATE =====

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>جاري تحميل بيانات السوق...</span>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN RENDER =====

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ذكاء السوق</h1>
          <p className="text-muted-foreground">تتبع وتحليل اتجاهات السوق والفرص التجارية</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateReport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            تقرير
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground h-4 w-4" />
          <Input
            placeholder="البحث في بيانات السوق..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          فلترة
        </Button>
      </div>

      {/* Market Analysis Overview */}
      {showAnalytics && marketAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderStatCard(
            'إجمالي المواد',
            marketAnalysis.summary.totalMaterials,
            <Building className="h-8 w-8" />
          )}

          {renderStatCard(
            'متوسط تغيير الأسعار',
            `${marketAnalysis.summary.avgPriceChange}%`,
            <DollarSign className="h-8 w-8" />,
            marketAnalysis.summary.avgPriceChange
          )}

          {renderStatCard(
            'فئات العمالة',
            marketAnalysis.summary.totalLaborCategories,
            <Users className="h-8 w-8" />
          )}

          {renderStatCard(
            'الفرص النشطة',
            marketAnalysis.summary.activeOpportunities,
            <Target className="h-8 w-8" />
          )}
        </div>
      )}

      {/* Market Trends Summary */}
      {marketAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              اتجاهات السوق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">اتجاه تكلفة المواد</p>
                {renderTrendBadge(marketAnalysis.trends.materialCostTrend)}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">اتجاه أجور العمالة</p>
                {renderTrendBadge(marketAnalysis.trends.laborRateTrend)}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">معنويات السوق</p>
                {renderSentimentBadge(marketAnalysis.trends.marketSentiment)}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">مستوى المنافسة</p>
                <Badge variant="outline" className={COMPETITION_BADGE_VARIANTS[marketAnalysis.trends.competitionLevel]}>
                  {marketAnalysis.trends.competitionLevel === 'high' ? 'عالي' :
                   marketAnalysis.trends.competitionLevel === 'medium' ? 'متوسط' : 'منخفض'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="materials">المواد</TabsTrigger>
          <TabsTrigger value="labor">العمالة</TabsTrigger>
          <TabsTrigger value="indicators">المؤشرات</TabsTrigger>
          <TabsTrigger value="opportunities">الفرص</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Recommendations */}
          {marketAnalysis?.recommendations && marketAnalysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  التوصيات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketAnalysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-lg border border-info/40 bg-info/10 p-3">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-info/20 text-sm font-medium text-info">
                        {index + 1}
                      </div>
                      <p className="text-sm text-muted-foreground">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Alerts */}
          {marketAnalysis?.alerts && marketAnalysis.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  التنبيهات الحديثة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketAnalysis.alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`mt-2 h-3 w-3 rounded-full ${ALERT_SEVERITY_DOT_VARIANTS[alert.severity]}`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">تكاليف المواد ({filteredData.materials.length})</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('materials', 'csv')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('materials', 'json')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                JSON
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.materials.map((material) => (
              <Card key={material.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{material.materialName}</h4>
                      <Badge variant="outline" className={`text-xs ${getPriceChangeBadgeClass(material.priceChangePercent)}`}>
                        {material.priceChangePercent > 0 ? '+' : ''}{material.priceChangePercent}%
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">السعر الحالي:</span>
                        <span className="font-medium">{material.currentPrice} {material.currency}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المورد:</span>
                        <span>{material.supplier}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المنطقة:</span>
                        <span>{material.region}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التوفر:</span>
                        <Badge variant="outline" className={`text-xs ${MATERIAL_AVAILABILITY_VARIANTS[material.availability]}`}>
                          {material.availability === 'high' ? 'عالي' :
                           material.availability === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        آخر تحديث: {new Date(material.lastUpdated).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Labor Tab */}
        <TabsContent value="labor" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">أجور العمالة ({filteredData.labor.length})</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('labor', 'csv')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('labor', 'json')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                JSON
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.labor.map((rate) => (
              <Card key={rate.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{rate.skillCategory}</h4>
                      <Badge variant="outline" className={`text-xs ${LABOR_SKILL_LEVEL_VARIANTS[rate.skillLevel]}`}>
                        {rate.skillLevel === 'expert' ? 'خبير' :
                         rate.skillLevel === 'senior' ? 'أول' :
                         rate.skillLevel === 'intermediate' ? 'متوسط' : 'مبتدئ'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الأجر بالساعة:</span>
                        <span className="font-medium">{rate.hourlyRate} {rate.currency}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الأجر اليومي:</span>
                        <span>{rate.dailyRate} {rate.currency}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المدينة:</span>
                        <span>{rate.city}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الطلب:</span>
                        <Badge variant="outline" className={`text-xs ${LABOR_DEMAND_VARIANTS[rate.demand]}`}>
                          {rate.demand === 'high' ? 'عالي' :
                           rate.demand === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التوفر:</span>
                        <Badge variant="outline" className={`text-xs ${LABOR_AVAILABILITY_VARIANTS[rate.availability]}`}>
                          {rate.availability === 'abundant' ? 'وفير' :
                           rate.availability === 'moderate' ? 'متوسط' : 'نادر'}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        آخر تحديث: {new Date(rate.lastUpdated).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Economic Indicators Tab */}
        <TabsContent value="indicators" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">المؤشرات الاقتصادية ({filteredData.indicators.length})</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('indicators', 'json')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredData.indicators.map((indicator) => (
              <Card key={indicator.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{indicator.name}</h4>
                      <Badge variant="outline" className={`text-xs ${TREND_BADGE_VARIANTS[indicator.trend]}`}>
                        {indicator.trend === 'increasing' ? 'متزايد' :
                         indicator.trend === 'decreasing' ? 'متناقص' : 'مستقر'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">القيمة الحالية:</span>
                        <span className="font-medium">{indicator.currentValue} {indicator.unit}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التغيير:</span>
                        <span className={getChangeTextClass(indicator.change)}>
                          {indicator.change > 0 ? '+' : ''}{indicator.changePercent}%
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التأثير:</span>
                        <Badge variant="outline" className={`text-xs ${INDICATOR_IMPACT_VARIANTS[indicator.impact]}`}>
                          {indicator.impact === 'positive' ? 'إيجابي' :
                           indicator.impact === 'negative' ? 'سلبي' : 'محايد'}
                        </Badge>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المصدر:</span>
                        <span className="text-xs">{indicator.source}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        آخر تحديث: {new Date(indicator.lastUpdated).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Market Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">الفرص السوقية ({filteredData.opportunities.length})</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredData.opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{opportunity.title}</h4>
                      <Badge variant="outline" className={`text-xs ${OPPORTUNITY_STATUS_VARIANTS[opportunity.status]}`}>
                        {opportunity.status === 'active' ? 'نشط' :
                         opportunity.status === 'pursuing' ? 'قيد المتابعة' :
                         opportunity.status === 'won' ? 'تم الفوز' :
                         opportunity.status === 'lost' ? 'مفقود' : 'منتهي'}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">القيمة المقدرة:</span>
                        <span className="font-medium">{opportunity.estimatedValue.toLocaleString()} ريال</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الاحتمالية:</span>
                        <span>{opportunity.probability}%</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">القطاع:</span>
                        <span>{opportunity.sector}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المنطقة:</span>
                        <span>{opportunity.region}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">مستوى المنافسة:</span>
                        <Badge variant="outline" className={`text-xs ${OPPORTUNITY_COMPETITION_VARIANTS[opportunity.competitionLevel]}`}>
                          {opportunity.competitionLevel === 'high' ? 'عالي' :
                           opportunity.competitionLevel === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                      </div>
                    </div>

                    {/* Requirements */}
                    {opportunity.requirements.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">المتطلبات:</p>
                        <div className="flex flex-wrap gap-1">
                          {opportunity.requirements.slice(0, 3).map((req, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                          {opportunity.requirements.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{opportunity.requirements.length - 3} أخرى
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        تم تحديدها: {new Date(opportunity.identifiedDate).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Industry Trends Section */}
      {!compactMode && filteredData.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              الاتجاهات الصناعية
            </CardTitle>
            <CardDescription>
              آخر الاتجاهات والتطورات في قطاع البناء والتشييد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredData.trends.slice(0, 3).map((trend) => (
                <div key={trend.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{trend.title}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={`text-xs ${TREND_IMPACT_VARIANTS[trend.impact]}`}>
                        تأثير {trend.impact === 'high' ? 'عالي' : trend.impact === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {TIMEFRAME_LABELS[trend.timeframe]}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{trend.description}</p>

                  {trend.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {trend.tags.slice(0, 5).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>المصدر: {trend.source}</span>
                    <span>{new Date(trend.publishedDate).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

MarketIntelligence.displayName = 'MarketIntelligence'

export default MarketIntelligence


