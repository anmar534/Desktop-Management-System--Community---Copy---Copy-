// RiskAssessmentMatrix scores tender risks and highlights mitigation actions.
import type React from 'react'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Zap,
  Building,
  FileText,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Brain,
  Target,
  BarChart3,
  Lightbulb,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Slider } from '@/presentation/components/ui/slider'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

// Import predictive analytics services
import { predictWinProbability } from '@/shared/utils/ml/predictionModels'
import { optimizeBidAmount } from '@/shared/utils/pricing/priceOptimization'
import { analyticsService } from '@/application/services/analyticsService'
import { competitiveService } from '@/application/services/competitiveService'
import type { Tender } from '@/data/centralData'

// Risk factor types
interface RiskFactor {
  id: string
  name: string
  description: string
  category: 'technical' | 'financial' | 'schedule' | 'commercial' | 'external'
  impact: number // 1-5 scale
  probability: number // 1-5 scale
  mitigation: string
  icon: React.ComponentType<{ className?: string }>
}

interface RiskAssessment {
  factors: RiskFactor[]
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  recommendedMargin: number
  mitigationPlan: string
  // Enhanced with predictive analytics
  aiPredictions?: {
    winProbability: number
    confidence: number
    competitiveRisk: number
    marketRisk: number
    recommendedActions: string[]
  }
  competitiveIntelligence?: {
    competitorCount: number
    marketTrend: 'up' | 'down' | 'stable'
    threatLevel: 'low' | 'medium' | 'high'
    opportunities: string[]
  }
}

interface RiskAssessmentMatrixProps {
  onAssessmentComplete: (assessment: RiskAssessment) => void
  initialAssessment?: RiskAssessment
  tender?: Tender // Optional tender context for AI predictions
  enablePredictiveAnalytics?: boolean
}

// Default risk factors
const defaultRiskFactors: Omit<RiskFactor, 'impact' | 'probability' | 'mitigation'>[] = [
  {
    id: 'technical_complexity',
    name: 'التعقيد التقني',
    description: 'مستوى التعقيد التقني للمشروع والتقنيات المطلوبة',
    category: 'technical',
    icon: Zap,
  },
  {
    id: 'project_size',
    name: 'حجم المشروع',
    description: 'حجم وقيمة المشروع مقارنة بقدرات الشركة',
    category: 'technical',
    icon: Building,
  },
  {
    id: 'client_payment_history',
    name: 'تاريخ دفع العميل',
    description: 'سجل العميل في الدفع والالتزام بالعقود السابقة',
    category: 'financial',
    icon: DollarSign,
  },
  {
    id: 'cash_flow_impact',
    name: 'تأثير التدفق النقدي',
    description: 'تأثير المشروع على التدفق النقدي للشركة',
    category: 'financial',
    icon: TrendingUp,
  },
  {
    id: 'timeline_pressure',
    name: 'ضغط الجدول الزمني',
    description: 'مدى ضيق الجدول الزمني المطلوب للتنفيذ',
    category: 'schedule',
    icon: Clock,
  },
  {
    id: 'resource_availability',
    name: 'توفر الموارد',
    description: 'توفر العمالة والمعدات والمواد المطلوبة',
    category: 'schedule',
    icon: Users,
  },
  {
    id: 'contract_terms',
    name: 'شروط العقد',
    description: 'مدى عدالة وقابلية تنفيذ شروط العقد',
    category: 'commercial',
    icon: FileText,
  },
  {
    id: 'competition_level',
    name: 'مستوى المنافسة',
    description: 'عدد وقوة المنافسين في هذه المناقصة',
    category: 'commercial',
    icon: Shield,
  },
  {
    id: 'market_conditions',
    name: 'ظروف السوق',
    description: 'الظروف الاقتصادية والسوقية العامة',
    category: 'external',
    icon: TrendingUp,
  },
  {
    id: 'regulatory_changes',
    name: 'التغييرات التنظيمية',
    description: 'احتمالية تغيير القوانين أو اللوائح المؤثرة',
    category: 'external',
    icon: AlertTriangle,
  },
]

const categoryLabels = {
  technical: 'تقني',
  financial: 'مالي',
  schedule: 'جدولة',
  commercial: 'تجاري',
  external: 'خارجي',
}

const categoryColors = {
  technical: 'bg-blue-100 text-blue-800',
  financial: 'bg-green-100 text-green-800',
  schedule: 'bg-yellow-100 text-yellow-800',
  commercial: 'bg-purple-100 text-purple-800',
  external: 'bg-red-100 text-red-800',
}

const riskLevelConfig = {
  low: { label: 'منخفض', color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle2 },
  medium: { label: 'متوسط', color: 'text-warning', bgColor: 'bg-warning/10', icon: AlertCircle },
  high: {
    label: 'عالي',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: AlertTriangle,
  },
  critical: {
    label: 'حرج',
    color: 'text-destructive',
    bgColor: 'bg-destructive/20',
    icon: XCircle,
  },
}

export function RiskAssessmentMatrix({
  onAssessmentComplete,
  initialAssessment,
  tender,
  enablePredictiveAnalytics = false,
}: RiskAssessmentMatrixProps) {
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>(() => {
    if (initialAssessment) {
      return initialAssessment.factors
    }
    return defaultRiskFactors.map((factor) => ({
      ...factor,
      impact: 3,
      probability: 3,
      mitigation: '',
    }))
  })

  const [mitigationPlan, setMitigationPlan] = useState(initialAssessment?.mitigationPlan || '')

  // Predictive analytics state
  const [predictiveData, setPredictiveData] = useState<{
    winProbability: number | null
    confidence: number | null
    competitiveRisk: number | null
    marketRisk: number | null
    recommendedActions: string[]
    competitorCount: number
    marketTrend: 'up' | 'down' | 'stable' | null
    threatLevel: 'low' | 'medium' | 'high' | null
    opportunities: string[]
    optimizedMargin: number | null
    loading: boolean
  }>({
    winProbability: null,
    confidence: null,
    competitiveRisk: null,
    marketRisk: null,
    recommendedActions: [],
    competitorCount: 0,
    marketTrend: null,
    threatLevel: null,
    opportunities: [],
    optimizedMargin: null,
    loading: false,
  })

  // Load predictive analytics data
  useEffect(() => {
    if (!enablePredictiveAnalytics || !tender) return

    const loadPredictiveData = async () => {
      setPredictiveData((prev) => ({ ...prev, loading: true }))

      try {
        // Get historical performance data
        const bidPerformances = await analyticsService.getAllBidPerformances()

        // Get competitive intelligence
        const competitors = await competitiveService.getAllCompetitors()
        const marketOpportunities = await competitiveService.getMarketOpportunities()

        const competitorCount = tender.competitors?.length ?? competitors.length
        const clientType =
          tender.client.includes('حكوم') || tender.client.includes('وزارة')
            ? 'government'
            : 'private'
        const tenderValue =
          typeof tender.value === 'number' ? tender.value : Number(tender.value ?? 0)

        const winPrediction = predictWinProbability(
          tenderValue,
          tenderValue,
          competitorCount,
          tender.category,
          tender.location,
          clientType,
          bidPerformances,
          competitors,
        )

        // Calculate competitive and market risks
        const competitiveRisk = Math.min(100, competitors.length * 15) // Higher competitor count = higher risk
        const marketRisk =
          marketOpportunities.length > 0 ? Math.max(0, 100 - marketOpportunities.length * 10) : 50 // More opportunities = lower risk

        // Determine market trend and threat level
        const marketTrend: 'up' | 'down' | 'stable' =
          marketOpportunities.length > 5 ? 'up' : marketOpportunities.length < 2 ? 'down' : 'stable'

        const threatLevel: 'low' | 'medium' | 'high' =
          competitors.length <= 3 ? 'low' : competitors.length <= 6 ? 'medium' : 'high'

        const priceOptimization = optimizeBidAmount(
          tenderValue,
          tender.category,
          tender.location,
          competitorCount,
          clientType,
          bidPerformances,
          competitors,
          {
            minMargin: 10,
            maxMargin: 30,
            targetWinProbability: 60,
            riskTolerance:
              threatLevel === 'high' ? 'high' : threatLevel === 'medium' ? 'medium' : 'low',
            objective: 'balanced',
            marketConditions:
              marketTrend === 'up'
                ? 'favorable'
                : marketTrend === 'down'
                  ? 'challenging'
                  : 'neutral',
          },
        )

        setPredictiveData({
          winProbability: winPrediction.probability,
          confidence: winPrediction.confidence,
          competitiveRisk,
          marketRisk,
          recommendedActions: winPrediction.recommendations,
          competitorCount: competitors.length,
          marketTrend,
          threatLevel,
          opportunities: marketOpportunities.slice(0, 3).map((opp) => opp.title),
          optimizedMargin: Math.round(priceOptimization.optimalMargin),
          loading: false,
        })
      } catch (error) {
        console.error('Error loading predictive data:', error)
        setPredictiveData((prev) => ({ ...prev, loading: false, optimizedMargin: null }))
      }
    }

    loadPredictiveData()
  }, [enablePredictiveAnalytics, tender])

  // Calculate overall risk assessment with AI enhancement
  const riskAssessment = useMemo((): RiskAssessment => {
    const totalRiskScore = riskFactors.reduce((sum, factor) => {
      return sum + factor.impact * factor.probability
    }, 0)

    const maxPossibleScore = riskFactors.length * 25 // 5 * 5 for each factor
    let normalizedScore = (totalRiskScore / maxPossibleScore) * 100

    // Adjust score based on AI predictions if available
    if (enablePredictiveAnalytics && predictiveData.winProbability !== null) {
      const aiRiskAdjustment = (100 - predictiveData.winProbability) * 0.3 // 30% weight to AI prediction
      const competitiveRiskAdjustment = (predictiveData.competitiveRisk || 0) * 0.2 // 20% weight to competitive risk
      const marketRiskAdjustment = (predictiveData.marketRisk || 0) * 0.1 // 10% weight to market risk

      normalizedScore = Math.min(
        100,
        normalizedScore + aiRiskAdjustment + competitiveRiskAdjustment + marketRiskAdjustment,
      )
    }

    let overallRiskLevel: RiskAssessment['overallRiskLevel']
    let recommendedMargin: number

    if (normalizedScore <= 25) {
      overallRiskLevel = 'low'
      recommendedMargin = 15
    } else if (normalizedScore <= 50) {
      overallRiskLevel = 'medium'
      recommendedMargin = 20
    } else if (normalizedScore <= 75) {
      overallRiskLevel = 'high'
      recommendedMargin = 25
    } else {
      overallRiskLevel = 'critical'
      recommendedMargin = 35
    }

    // AI-enhanced margin optimization
    if (enablePredictiveAnalytics && predictiveData.optimizedMargin !== null) {
      if ((predictiveData.confidence ?? 0) > 70) {
        recommendedMargin = predictiveData.optimizedMargin
      }
    }

    const assessment: RiskAssessment = {
      factors: riskFactors,
      overallRiskLevel,
      riskScore: normalizedScore,
      recommendedMargin,
      mitigationPlan,
    }

    // Add AI predictions if available
    if (enablePredictiveAnalytics && predictiveData.winProbability !== null) {
      assessment.aiPredictions = {
        winProbability: predictiveData.winProbability,
        confidence: predictiveData.confidence || 0,
        competitiveRisk: predictiveData.competitiveRisk || 0,
        marketRisk: predictiveData.marketRisk || 0,
        recommendedActions: predictiveData.recommendedActions,
      }

      assessment.competitiveIntelligence = {
        competitorCount: predictiveData.competitorCount,
        marketTrend: predictiveData.marketTrend || 'stable',
        threatLevel: predictiveData.threatLevel || 'medium',
        opportunities: predictiveData.opportunities,
      }
    }

    return assessment
  }, [riskFactors, mitigationPlan, enablePredictiveAnalytics, predictiveData, tender])

  const updateRiskFactor = useCallback((factorId: string, updates: Partial<RiskFactor>) => {
    setRiskFactors((prev) =>
      prev.map((factor) => (factor.id === factorId ? { ...factor, ...updates } : factor)),
    )
  }, [])

  const handleComplete = useCallback(() => {
    onAssessmentComplete(riskAssessment)
  }, [onAssessmentComplete, riskAssessment])

  const getRiskColor = (impact: number, probability: number) => {
    const score = impact * probability
    if (score <= 6) return 'text-success'
    if (score <= 12) return 'text-warning'
    if (score <= 20) return 'text-destructive'
    return 'text-destructive font-bold'
  }

  const getRiskLevel = (impact: number, probability: number) => {
    const score = impact * probability
    if (score <= 6) return 'منخفض'
    if (score <= 12) return 'متوسط'
    if (score <= 20) return 'عالي'
    return 'حرج'
  }

  const config = riskLevelConfig[riskAssessment.overallRiskLevel]
  const RiskIcon = config.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            تقييم المخاطر
            {enablePredictiveAnalytics && (
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                مدعوم بالذكاء الاصطناعي
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            {enablePredictiveAnalytics
              ? 'تقييم شامل للمخاطر مع تحليلات تنبؤية وذكاء تنافسي'
              : 'قيّم المخاطر المحتملة للمشروع لتحديد هامش الربح المناسب'}
          </p>
        </div>

        <Card className={`${config.bgColor} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RiskIcon className={`h-6 w-6 ${config.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">مستوى المخاطر الإجمالي</p>
                <p className={`font-bold ${config.color}`}>{config.label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">النتيجة</p>
                <p className={`font-bold ${config.color}`}>
                  {Math.round(riskAssessment.riskScore)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      {enablePredictiveAnalytics && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Brain className="h-5 w-5" />
              رؤى الذكاء الاصطناعي والتحليل التنافسي
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictiveData.loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">جاري تحليل البيانات التنبؤية...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Win Probability */}
                {predictiveData.winProbability !== null && (
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary mb-1">
                      {Math.round(predictiveData.winProbability)}%
                    </div>
                    <p className="text-xs text-muted-foreground">احتمالية الفوز (AI)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ثقة: {Math.round(predictiveData.confidence || 0)}%
                    </p>
                  </div>
                )}

                {/* Competitive Risk */}
                {predictiveData.competitiveRisk !== null && (
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <Shield className="h-6 w-6 text-warning mx-auto mb-2" />
                    <div className="text-2xl font-bold text-warning mb-1">
                      {Math.round(predictiveData.competitiveRisk)}%
                    </div>
                    <p className="text-xs text-muted-foreground">المخاطر التنافسية</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {predictiveData.competitorCount} منافس
                    </p>
                  </div>
                )}

                {/* Market Trend */}
                {predictiveData.marketTrend && (
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-info mx-auto mb-2" />
                    <div className="text-lg font-bold text-info mb-1">
                      {predictiveData.marketTrend === 'up'
                        ? '↗️ صاعد'
                        : predictiveData.marketTrend === 'down'
                          ? '↘️ هابط'
                          : '→ مستقر'}
                    </div>
                    <p className="text-xs text-muted-foreground">اتجاه السوق</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      تهديد:{' '}
                      {predictiveData.threatLevel === 'low'
                        ? 'منخفض'
                        : predictiveData.threatLevel === 'medium'
                          ? 'متوسط'
                          : 'عالي'}
                    </p>
                  </div>
                )}

                {/* Market Risk */}
                {predictiveData.marketRisk !== null && (
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
                    <div className="text-2xl font-bold text-success mb-1">
                      {Math.round(predictiveData.marketRisk)}%
                    </div>
                    <p className="text-xs text-muted-foreground">مخاطر السوق</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {predictiveData.opportunities.length} فرصة
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* AI Recommendations */}
            {!predictiveData.loading && predictiveData.recommendedActions.length > 0 && (
              <div className="mt-4 p-3 bg-white/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">توصيات الذكاء الاصطناعي</span>
                </div>
                <ul className="space-y-1">
                  {predictiveData.recommendedActions.slice(0, 3).map((action, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Market Opportunities */}
            {!predictiveData.loading && predictiveData.opportunities.length > 0 && (
              <div className="mt-4 p-3 bg-white/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-success" />
                  <span className="font-medium text-success">الفرص السوقية</span>
                </div>
                <ul className="space-y-1">
                  {predictiveData.opportunities.map((opportunity, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-success">•</span>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Risk Factors */}
      <div className="grid gap-4">
        {Object.entries(
          riskFactors.reduce(
            (acc, factor) => {
              if (!acc[factor.category]) acc[factor.category] = []
              acc[factor.category].push(factor)
              return acc
            },
            {} as Record<string, RiskFactor[]>,
          ),
        ).map(([category, factors]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </Badge>
                <span className="text-lg">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {factors.map((factor, index) => {
                const FactorIcon = factor.icon
                return (
                  <motion.div
                    key={factor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <FactorIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-card-foreground">{factor.name}</h4>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                      <div className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className={getRiskColor(factor.impact, factor.probability)}
                              >
                                {getRiskLevel(factor.impact, factor.probability)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>النتيجة: {factor.impact * factor.probability}/25</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">التأثير ({factor.impact}/5)</Label>
                        <Slider
                          value={[factor.impact]}
                          onValueChange={([value]) =>
                            updateRiskFactor(factor.id, { impact: value })
                          }
                          max={5}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>منخفض</span>
                          <span>عالي</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">الاحتمالية ({factor.probability}/5)</Label>
                        <Slider
                          value={[factor.probability]}
                          onValueChange={([value]) =>
                            updateRiskFactor(factor.id, { probability: value })
                          }
                          max={5}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>نادر</span>
                          <span>مؤكد</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">خطة التخفيف</Label>
                      <Textarea
                        placeholder="اكتب الإجراءات المقترحة لتخفيف هذه المخاطر..."
                        value={factor.mitigation}
                        onChange={(e) =>
                          updateRiskFactor(factor.id, { mitigation: e.target.value })
                        }
                        className="min-h-[60px]"
                      />
                    </div>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            التقييم الإجمالي والتوصيات
            {enablePredictiveAnalytics && riskAssessment.aiPredictions && (
              <Badge variant="outline" className="text-xs ml-2">
                محسّن بالذكاء الاصطناعي
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${config.color} mb-1`}>
                {Math.round(riskAssessment.riskScore)}%
              </div>
              <p className="text-sm text-muted-foreground">
                نتيجة المخاطر
                {enablePredictiveAnalytics && (
                  <span className="block text-xs text-primary">مُحسّنة بالذكاء الاصطناعي</span>
                )}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {riskAssessment.recommendedMargin}%
              </div>
              <p className="text-sm text-muted-foreground">
                هامش الربح المقترح
                {enablePredictiveAnalytics && riskAssessment.aiPredictions && (
                  <span className="block text-xs text-primary">محسوب بالذكاء الاصطناعي</span>
                )}
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${config.color} mb-1`}>{config.label}</div>
              <p className="text-sm text-muted-foreground">مستوى المخاطر</p>
            </div>

            {/* AI Win Probability */}
            {enablePredictiveAnalytics && riskAssessment.aiPredictions && (
              <div className="text-center p-4 border rounded-lg bg-primary/5">
                <div className="text-2xl font-bold text-primary mb-1">
                  {Math.round(riskAssessment.aiPredictions.winProbability)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  احتمالية الفوز (AI)
                  <span className="block text-xs text-primary">
                    ثقة: {Math.round(riskAssessment.aiPredictions.confidence)}%
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Risk Breakdown */}
          {enablePredictiveAnalytics && riskAssessment.aiPredictions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  تحليل المخاطر المفصل
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">المخاطر التنافسية:</span>
                    <span className="font-medium text-warning">
                      {Math.round(riskAssessment.aiPredictions.competitiveRisk)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">مخاطر السوق:</span>
                    <span className="font-medium text-info">
                      {Math.round(riskAssessment.aiPredictions.marketRisk)}%
                    </span>
                  </div>
                  {riskAssessment.competitiveIntelligence && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">عدد المنافسين:</span>
                        <span className="font-medium">
                          {riskAssessment.competitiveIntelligence.competitorCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">اتجاه السوق:</span>
                        <span className="font-medium">
                          {riskAssessment.competitiveIntelligence.marketTrend === 'up'
                            ? 'صاعد'
                            : riskAssessment.competitiveIntelligence.marketTrend === 'down'
                              ? 'هابط'
                              : 'مستقر'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  التوصيات الذكية
                </h4>
                <div className="space-y-2">
                  {riskAssessment.aiPredictions.recommendedActions
                    .slice(0, 3)
                    .map((action, index) => (
                      <div
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary text-xs">•</span>
                        <span>{action}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>خطة إدارة المخاطر الشاملة</Label>
            <Textarea
              placeholder={
                enablePredictiveAnalytics
                  ? 'اكتب خطة شاملة لإدارة المخاطر المحددة في هذا المشروع... (ستتم إضافة التوصيات الذكية تلقائياً)'
                  : 'اكتب خطة شاملة لإدارة المخاطر المحددة في هذا المشروع...'
              }
              value={mitigationPlan}
              onChange={(e) => setMitigationPlan(e.target.value)}
              className="min-h-[100px]"
            />
            {enablePredictiveAnalytics &&
              riskAssessment.aiPredictions &&
              riskAssessment.aiPredictions.recommendedActions.length > 0 && (
                <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    اقتراحات إضافية من الذكاء الاصطناعي:
                  </p>
                  <ul className="space-y-1">
                    {riskAssessment.aiPredictions.recommendedActions.map((action, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {enablePredictiveAnalytics && (
                <>
                  <Brain className="h-4 w-4 text-primary" />
                  <span>تقييم محسّن بالذكاء الاصطناعي والتحليل التنافسي</span>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline">حفظ كمسودة</Button>
              <Button onClick={handleComplete} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                تطبيق التقييم
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
