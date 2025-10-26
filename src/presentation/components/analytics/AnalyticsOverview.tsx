/**
 * @fileoverview Analytics Overview Component
 * @description Unified overview dashboard that provides quick access to all analytics
 * and competitive intelligence features with key metrics and navigation.
 *
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 - Unified Analytics Navigation
 */

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Brain,
  Shield,
  TrendingUp,
  Target,
  Users,
  ArrowRight,
  Activity,
  DollarSign,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'

import type { AnalyticsSection } from './AnalyticsRouter'
import { analyticsService } from '@/application/services/analyticsService'
import { competitiveService } from '@/application/services/competitiveService'

interface QuickMetric {
  id: string
  title: string
  value: string | number
  change?: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<{ className?: string }>
  color: 'success' | 'warning' | 'destructive' | 'info'
}

interface AnalyticsCard {
  id: AnalyticsSection
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'analytics' | 'competitive' | 'intelligence'
  metrics: QuickMetric[]
  status: 'active' | 'pending' | 'error'
  lastUpdated?: string
}

interface AnalyticsOverviewProps {
  onNavigate: (section: AnalyticsSection) => void
  className?: string
}

export function AnalyticsOverview({ onNavigate, className = '' }: AnalyticsOverviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyticsCards, setAnalyticsCards] = useState<AnalyticsCard[]>([])
  const [quickMetrics, setQuickMetrics] = useState<QuickMetric[]>([])

  // Load overview data
  const loadOverviewData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Load data from services
      const [bidPerformances, competitors, opportunities, trends] = await Promise.all([
        analyticsService.getAllBidPerformances(),
        competitiveService.getAllCompetitors(),
        competitiveService.getMarketOpportunities(),
        competitiveService.getMarketTrends(),
      ])

      // Calculate quick metrics
      const winRate =
        bidPerformances.length > 0
          ? (bidPerformances.filter((p) => p.result === 'won').length / bidPerformances.length) *
            100
          : 0

      const totalValue = bidPerformances.reduce((sum, p) => sum + (p.bidAmount || 0), 0)
      const avgMargin =
        bidPerformances.length > 0
          ? bidPerformances.reduce((sum, p) => sum + (p.profitMargin || 0), 0) /
            bidPerformances.length
          : 0

      const metrics: QuickMetric[] = [
        {
          id: 'win-rate',
          title: 'معدل الفوز',
          value: `${Math.round(winRate)}%`,
          change: 5.2,
          trend: 'up',
          icon: Trophy,
          color: 'success',
        },
        {
          id: 'total-value',
          title: 'إجمالي قيمة العطاءات',
          value: `${(totalValue / 1000000).toFixed(1)}م ريال`,
          change: 12.5,
          trend: 'up',
          icon: DollarSign,
          color: 'info',
        },
        {
          id: 'avg-margin',
          title: 'متوسط هامش الربح',
          value: `${Math.round(avgMargin)}%`,
          change: -2.1,
          trend: 'down',
          icon: BarChart3,
          color: 'warning',
        },
        {
          id: 'competitors',
          title: 'المنافسون النشطون',
          value: competitors.length,
          change: 3,
          trend: 'up',
          icon: Users,
          color: 'info',
        },
        {
          id: 'opportunities',
          title: 'الفرص السوقية',
          value: opportunities.length,
          change: 8,
          trend: 'up',
          icon: Target,
          color: 'success',
        },
        {
          id: 'market-trends',
          title: 'اتجاهات السوق',
          value: trends.length,
          change: 0,
          trend: 'stable',
          icon: TrendingUp,
          color: 'info',
        },
      ]

      setQuickMetrics(metrics)

      // Create analytics cards
      const cards: AnalyticsCard[] = [
        {
          id: 'dashboard',
          title: 'لوحة التحليلات',
          description: 'تحليلات الأداء والمؤشرات الرئيسية',
          icon: BarChart3,
          category: 'analytics',
          status: 'active',
          lastUpdated: new Date().toISOString(),
          metrics: metrics.slice(0, 3),
        },
        {
          id: 'predictive',
          title: 'التحليلات التنبؤية',
          description: 'توقعات الفوز وتحسين الأسعار بالذكاء الاصطناعي',
          icon: Brain,
          category: 'intelligence',
          status: bidPerformances.length > 5 ? 'active' : 'pending',
          lastUpdated: new Date().toISOString(),
          metrics: [metrics[0], metrics[2]],
        },
        {
          id: 'historical',
          title: 'المقارنات التاريخية',
          description: 'تحليل الاتجاهات والمقارنات الزمنية',
          icon: TrendingUp,
          category: 'analytics',
          status: bidPerformances.length > 10 ? 'active' : 'pending',
          lastUpdated: new Date().toISOString(),
          metrics: [metrics[1], metrics[5]],
        },
        {
          id: 'competitors',
          title: 'تتبع المنافسين',
          description: 'مراقبة وتحليل أنشطة المنافسين',
          icon: Users,
          category: 'competitive',
          status: 'active',
          lastUpdated: new Date().toISOString(),
          metrics: [metrics[3]],
        },
        {
          id: 'market',
          title: 'مراقبة السوق',
          description: 'تحليل الفرص والاتجاهات السوقية',
          icon: Target,
          category: 'competitive',
          status: 'active',
          lastUpdated: new Date().toISOString(),
          metrics: [metrics[4], metrics[5]],
        },
        {
          id: 'swot',
          title: 'تحليل SWOT',
          description: 'تحليل نقاط القوة والضعف والفرص والتهديدات',
          icon: Shield,
          category: 'intelligence',
          status: 'active',
          lastUpdated: new Date().toISOString(),
          metrics: [],
        },
      ]

      setAnalyticsCards(cards)
    } catch (err) {
      console.error('Error loading overview data:', err)
      setError('حدث خطأ في تحميل بيانات النظرة العامة')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverviewData()
  }, [loadOverviewData])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analytics':
        return 'bg-blue-100 text-blue-800'
      case 'competitive':
        return 'bg-green-100 text-green-800'
      case 'intelligence':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↗️'
      case 'down':
        return '↘️'
      case 'stable':
        return '→'
      default:
        return '→'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل النظرة العامة...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error}</p>
          <Button onClick={loadOverviewData} className="mt-4">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Metrics */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">المؤشرات السريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-5 w-5 text-${metric.color}`} />
                      <span className="text-sm">
                        {getTrendIcon(metric.trend)}
                        {metric.change && Math.abs(metric.change)}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Analytics Cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">أقسام التحليلات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsCards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{card.title}</CardTitle>
                          <Badge className={getCategoryColor(card.category)} variant="outline">
                            {card.category === 'analytics'
                              ? 'تحليلات'
                              : card.category === 'competitive'
                                ? 'تنافسي'
                                : 'ذكاء'}
                          </Badge>
                        </div>
                      </div>
                      {getStatusIcon(card.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{card.description}</p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Quick metrics for this card */}
                    {card.metrics.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {card.metrics.map((metric) => (
                          <div
                            key={metric.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-muted-foreground">{metric.title}</span>
                            <span className="font-medium">{metric.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={() => onNavigate(card.id)}
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                      variant="outline"
                    >
                      عرض التفاصيل
                      <ArrowRight className="h-4 w-4 mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
