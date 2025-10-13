/**
 * Predictive Analytics Dashboard Component
 * 
 * This component provides advanced predictive analytics capabilities including:
 * - Win probability predictions for upcoming tenders
 * - Price optimization recommendations
 * - Market trend forecasting
 * - Competitive intelligence insights
 * 
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 - Advanced Analytics Implementation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { BidPerformance, CompetitorData, AnalyticsFilter } from '../../types/analytics'
import type { MarketOpportunity, MarketTrend } from '../../types/competitive'
import { predictWinProbability, predictMarketTrend, type WinProbabilityPrediction, type MarketTrendPrediction } from '../../utils/predictionModels'
import { optimizeBidAmount, analyzePriceSensitivity, type BidOptimization, type PriceSensitivityAnalysis, type OptimizationParameters } from '../../utils/priceOptimization'
import { analyticsService } from '../../services/analyticsService'
import { competitiveService } from '../../services/competitiveService'

// ============================================================================
// INTERFACES
// ============================================================================

interface PredictiveAnalyticsProps {
  /** Optional filter for analytics data */
  filter?: AnalyticsFilter
  /** Optional class name for styling */
  className?: string
}

interface PredictionScenario {
  id: string
  name: string
  estimatedValue: number
  category: string
  region: string
  competitorCount: number
  clientType: string
  deadline: string
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Predictive Analytics Dashboard Component
 */
export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = React.memo(({
  filter,
  className = ''
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'predictions' | 'optimization' | 'trends' | 'scenarios'>('predictions')

  // Data state
  const [historicalPerformances, setHistoricalPerformances] = useState<BidPerformance[]>([])
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [marketOpportunities, setMarketOpportunities] = useState<MarketOpportunity[]>([])
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([])

  // Prediction state
  const [currentPrediction, setCurrentPrediction] = useState<WinProbabilityPrediction | null>(null)
  const [currentOptimization, setCurrentOptimization] = useState<BidOptimization | null>(null)
  const [currentTrendPrediction, setCurrentTrendPrediction] = useState<MarketTrendPrediction | null>(null)
  const [priceSensitivity, setPriceSensitivity] = useState<PriceSensitivityAnalysis | null>(null)

  // Scenario state
  const [scenarios, setScenarios] = useState<PredictionScenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<PredictionScenario | null>(null)

  // Form state for new predictions
  const [predictionForm, setPredictionForm] = useState({
    estimatedValue: 5000000,
    category: 'سكني',
    region: 'الرياض',
    competitorCount: 3,
    clientType: 'government'
  })

  const [optimizationParams, setOptimizationParams] = useState<OptimizationParameters>({
    minMargin: 10,
    maxMargin: 25,
    targetWinProbability: 60,
    riskTolerance: 'medium',
    objective: 'balanced',
    marketConditions: 'neutral'
  })

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [performances, competitorData, opportunities, trends] = await Promise.all([
        analyticsService.getAllBidPerformances({ filters: filter }),
        competitiveService.getAllCompetitors(filter),
        competitiveService.getMarketOpportunities(),
        competitiveService.getMarketTrends()
      ])

      setHistoricalPerformances(performances)
      setCompetitors(competitorData)
      setMarketOpportunities(opportunities)
      setMarketTrends(trends)

      // Generate initial scenarios
      generateDefaultScenarios(opportunities)

    } catch (err) {
      console.error('Error loading predictive analytics data:', err)
      setError('حدث خطأ في تحميل بيانات التحليل التنبؤي')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ============================================================================
  // PREDICTION FUNCTIONS
  // ============================================================================

  const generateWinProbabilityPrediction = useCallback(() => {
    if (historicalPerformances.length === 0) return

    const prediction = predictWinProbability(
      predictionForm.estimatedValue,
      predictionForm.estimatedValue,
      predictionForm.competitorCount,
      predictionForm.category,
      predictionForm.region,
      predictionForm.clientType,
      historicalPerformances,
      competitors
    )

    setCurrentPrediction(prediction)
  }, [predictionForm, historicalPerformances, competitors])

  const generateOptimization = useCallback(() => {
    if (historicalPerformances.length === 0) return

    const optimization = optimizeBidAmount(
      predictionForm.estimatedValue,
      predictionForm.category,
      predictionForm.region,
      predictionForm.competitorCount,
      predictionForm.clientType,
      historicalPerformances,
      competitors,
      optimizationParams
    )

    const sensitivity = analyzePriceSensitivity(
      predictionForm.estimatedValue,
      predictionForm.category,
      predictionForm.region,
      predictionForm.competitorCount,
      predictionForm.clientType,
      historicalPerformances,
      competitors,
      optimizationParams
    )

    setCurrentOptimization(optimization)
    setPriceSensitivity(sensitivity)
  }, [predictionForm, historicalPerformances, competitors, optimizationParams])

  const generateTrendPrediction = useCallback(() => {
    if (marketOpportunities.length === 0 || marketTrends.length === 0) return

    const trendPrediction = predictMarketTrend(
      predictionForm.category,
      predictionForm.region,
      marketOpportunities,
      marketTrends,
      6 // 6 months horizon
    )

    setCurrentTrendPrediction(trendPrediction)
  }, [predictionForm.category, predictionForm.region, marketOpportunities, marketTrends])

  const generateDefaultScenarios = useCallback((opportunities: MarketOpportunity[]) => {
    const defaultScenarios: PredictionScenario[] = [
      {
        id: 'scenario_1',
        name: 'مشروع سكني متوسط',
        estimatedValue: 5000000,
        category: 'سكني',
        region: 'الرياض',
        competitorCount: 3,
        clientType: 'private',
        deadline: '2024-03-15'
      },
      {
        id: 'scenario_2',
        name: 'مشروع بنية تحتية كبير',
        estimatedValue: 15000000,
        category: 'بنية تحتية',
        region: 'جدة',
        competitorCount: 5,
        clientType: 'government',
        deadline: '2024-04-20'
      },
      {
        id: 'scenario_3',
        name: 'مشروع تجاري صغير',
        estimatedValue: 2000000,
        category: 'تجاري',
        region: 'الدمام',
        competitorCount: 2,
        clientType: 'private',
        deadline: '2024-02-28'
      }
    ]

    // Add scenarios from recent opportunities
    const recentOpportunities = opportunities.slice(0, 3).map((opp, index) => ({
      id: `opportunity_${index}`,
      name: opp.title,
      estimatedValue: opp.estimatedValue,
      category: opp.category,
      region: opp.region,
      competitorCount: Math.floor(Math.random() * 5) + 2,
      clientType: opp.clientType || 'government',
      deadline: opp.deadline
    }))

    setScenarios([...defaultScenarios, ...recentOpportunities])
  }, [])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handlePredictionFormChange = useCallback((field: string, value: any) => {
    setPredictionForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleOptimizationParamsChange = useCallback((field: string, value: any) => {
    setOptimizationParams(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleScenarioSelect = useCallback((scenario: PredictionScenario) => {
    setSelectedScenario(scenario)
    setPredictionForm({
      estimatedValue: scenario.estimatedValue,
      category: scenario.category,
      region: scenario.region,
      competitorCount: scenario.competitorCount,
      clientType: scenario.clientType
    })
  }, [])

  const handleRunAllAnalyses = useCallback(() => {
    generateWinProbabilityPrediction()
    generateOptimization()
    generateTrendPrediction()
  }, [generateWinProbabilityPrediction, generateOptimization, generateTrendPrediction])

  // ============================================================================
  // MEMOIZED VALUES
  // ============================================================================

  const predictionSummary = useMemo(() => {
    if (!currentPrediction || !currentOptimization) return null

    return {
      winProbability: currentPrediction.probability,
      recommendedBid: currentOptimization.recommendedBid,
      optimalMargin: currentOptimization.optimalMargin,
      riskLevel: currentOptimization.riskLevel,
      confidence: currentPrediction.confidence
    }
  }, [currentPrediction, currentOptimization])

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-lg font-semibold mb-2">خطأ في التحليل التنبؤي</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">التحليل التنبؤي المتقدم</h2>
            <p className="text-sm text-gray-600 mt-1">
              تنبؤات ذكية لاحتمالية الفوز وتحسين الأسعار والاتجاهات السوقية
            </p>
          </div>
          <button
            onClick={handleRunAllAnalyses}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            تشغيل جميع التحليلات
          </button>
        </div>

        {/* Summary Cards */}
        {predictionSummary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {predictionSummary.winProbability}%
              </div>
              <div className="text-sm text-blue-800">احتمالية الفوز</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {(predictionSummary.recommendedBid / 1000000).toFixed(1)}م
              </div>
              <div className="text-sm text-green-800">العطاء المُوصى به</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {predictionSummary.optimalMargin.toFixed(1)}%
              </div>
              <div className="text-sm text-purple-800">الهامش الأمثل</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {predictionSummary.riskLevel === 'low' ? 'منخفض' : 
                 predictionSummary.riskLevel === 'medium' ? 'متوسط' : 'عالي'}
              </div>
              <div className="text-sm text-orange-800">مستوى المخاطرة</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-600">
                {predictionSummary.confidence}%
              </div>
              <div className="text-sm text-indigo-800">مستوى الثقة</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'predictions', label: 'التنبؤات' },
            { key: 'optimization', label: 'تحسين الأسعار' },
            { key: 'trends', label: 'اتجاهات السوق' },
            { key: 'scenarios', label: 'السيناريوهات' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            {/* Prediction Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  القيمة المقدرة (ريال)
                </label>
                <input
                  type="number"
                  value={predictionForm.estimatedValue}
                  onChange={(e) => handlePredictionFormChange('estimatedValue', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفئة
                </label>
                <select
                  value={predictionForm.category}
                  onChange={(e) => handlePredictionFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="سكني">سكني</option>
                  <option value="تجاري">تجاري</option>
                  <option value="بنية تحتية">بنية تحتية</option>
                  <option value="صناعي">صناعي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المنطقة
                </label>
                <select
                  value={predictionForm.region}
                  onChange={(e) => handlePredictionFormChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="الرياض">الرياض</option>
                  <option value="جدة">جدة</option>
                  <option value="الدمام">الدمام</option>
                  <option value="مكة">مكة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عدد المنافسين
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={predictionForm.competitorCount}
                  onChange={(e) => handlePredictionFormChange('competitorCount', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع العميل
                </label>
                <select
                  value={predictionForm.clientType}
                  onChange={(e) => handlePredictionFormChange('clientType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="government">حكومي</option>
                  <option value="private">خاص</option>
                  <option value="semi-government">شبه حكومي</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateWinProbabilityPrediction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              توليد تنبؤ احتمالية الفوز
            </button>

            {/* Prediction Results */}
            {currentPrediction && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">نتائج التنبؤ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {currentPrediction.probability}%
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      احتمالية الفوز (مستوى الثقة: {currentPrediction.confidence}%)
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">العوامل المؤثرة:</h4>
                      {currentPrediction.factors.map((factor, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{factor.name}</span>
                          <span className={factor.weight > 0 ? 'text-green-600' : 'text-red-600'}>
                            {factor.weight > 0 ? '+' : ''}{factor.weight.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">التوصيات:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {currentPrediction.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="space-y-6">
            {/* Optimization Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحد الأدنى للهامش (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={optimizationParams.minMargin}
                  onChange={(e) => handleOptimizationParamsChange('minMargin', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحد الأقصى للهامش (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={optimizationParams.maxMargin}
                  onChange={(e) => handleOptimizationParamsChange('maxMargin', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  احتمالية الفوز المستهدفة (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={optimizationParams.targetWinProbability}
                  onChange={(e) => handleOptimizationParamsChange('targetWinProbability', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تحمل المخاطر
                </label>
                <select
                  value={optimizationParams.riskTolerance}
                  onChange={(e) => handleOptimizationParamsChange('riskTolerance', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">منخفض</option>
                  <option value="medium">متوسط</option>
                  <option value="high">عالي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  هدف التحسين
                </label>
                <select
                  value={optimizationParams.objective}
                  onChange={(e) => handleOptimizationParamsChange('objective', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="win-probability">تعظيم احتمالية الفوز</option>
                  <option value="profit-margin">تعظيم هامش الربح</option>
                  <option value="roi">تعظيم العائد على الاستثمار</option>
                  <option value="balanced">متوازن</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ظروف السوق
                </label>
                <select
                  value={optimizationParams.marketConditions}
                  onChange={(e) => handleOptimizationParamsChange('marketConditions', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="favorable">مواتية</option>
                  <option value="neutral">محايدة</option>
                  <option value="challenging">صعبة</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateOptimization}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              تحسين السعر
            </button>

            {/* Optimization Results */}
            {currentOptimization && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">نتائج تحسين السعر</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {(currentOptimization.recommendedBid / 1000000).toFixed(2)} مليون ريال
                        </div>
                        <div className="text-sm text-gray-600">العطاء المُوصى به</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {currentOptimization.optimalMargin.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">الهامش الأمثل</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-purple-600">
                          {currentOptimization.expectedWinProbability.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">احتمالية الفوز المتوقعة</div>
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${
                          currentOptimization.riskLevel === 'low' ? 'text-green-600' :
                          currentOptimization.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {currentOptimization.riskLevel === 'low' ? 'منخفض' :
                           currentOptimization.riskLevel === 'medium' ? 'متوسط' : 'عالي'}
                        </div>
                        <div className="text-sm text-gray-600">مستوى المخاطرة</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">التوصيات:</h4>
                    <div className="space-y-3">
                      {currentOptimization.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start">
                          <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-2 ${
                            rec.impact === 'high' ? 'bg-red-500' :
                            rec.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {rec.type === 'pricing' ? 'تسعير' :
                               rec.type === 'timing' ? 'توقيت' :
                               rec.type === 'strategy' ? 'استراتيجية' : 'مخاطر'}
                            </div>
                            <div className="text-sm text-gray-600">{rec.recommendation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Price Sensitivity Chart */}
            {priceSensitivity && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">تحليل حساسية السعر</h3>
                <div className="text-sm text-gray-600 mb-4">
                  تحليل تأثير تغيير السعر على احتمالية الفوز والربحية
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-100 rounded-lg p-4">
                    <div className="font-medium text-green-800 mb-2">نطاق المخاطر المنخفضة</div>
                    <div className="text-sm text-green-600">
                      {(priceSensitivity.riskAnalysis.lowRiskRange.min / 1000000).toFixed(1)} -
                      {(priceSensitivity.riskAnalysis.lowRiskRange.max / 1000000).toFixed(1)} مليون ريال
                    </div>
                  </div>
                  <div className="bg-yellow-100 rounded-lg p-4">
                    <div className="font-medium text-yellow-800 mb-2">نطاق المخاطر المتوسطة</div>
                    <div className="text-sm text-yellow-600">
                      {(priceSensitivity.riskAnalysis.mediumRiskRange.min / 1000000).toFixed(1)} -
                      {(priceSensitivity.riskAnalysis.mediumRiskRange.max / 1000000).toFixed(1)} مليون ريال
                    </div>
                  </div>
                  <div className="bg-red-100 rounded-lg p-4">
                    <div className="font-medium text-red-800 mb-2">نطاق المخاطر العالية</div>
                    <div className="text-sm text-red-600">
                      {(priceSensitivity.riskAnalysis.highRiskRange.min / 1000000).toFixed(1)} -
                      {(priceSensitivity.riskAnalysis.highRiskRange.max / 1000000).toFixed(1)} مليون ريال
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <button
              onClick={generateTrendPrediction}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              توليد تنبؤ اتجاهات السوق
            </button>

            {currentTrendPrediction && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">تنبؤ اتجاهات السوق</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <div className={`text-3xl font-bold ${
                          currentTrendPrediction.direction === 'up' ? 'text-green-600' :
                          currentTrendPrediction.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {currentTrendPrediction.direction === 'up' ? '↗ صاعد' :
                           currentTrendPrediction.direction === 'down' ? '↘ هابط' : '→ مستقر'}
                        </div>
                        <div className="text-sm text-gray-600">اتجاه السوق المتوقع</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {currentTrendPrediction.strength}%
                        </div>
                        <div className="text-sm text-gray-600">قوة الاتجاه</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-purple-600">
                          {currentTrendPrediction.duration} أشهر
                        </div>
                        <div className="text-sm text-gray-600">المدة المتوقعة</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-indigo-600">
                          {currentTrendPrediction.confidence}%
                        </div>
                        <div className="text-sm text-gray-600">مستوى الثقة</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">المحركات الرئيسية:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {currentTrendPrediction.drivers.map((driver, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-purple-500 mr-2">•</span>
                          {driver}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">السيناريوهات المحفوظة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    onClick={() => handleScenarioSelect(scenario)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedScenario?.id === scenario.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{scenario.name}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>القيمة: {(scenario.estimatedValue / 1000000).toFixed(1)} مليون ريال</div>
                      <div>الفئة: {scenario.category}</div>
                      <div>المنطقة: {scenario.region}</div>
                      <div>المنافسين: {scenario.competitorCount}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

PredictiveAnalytics.displayName = 'PredictiveAnalytics'

export default PredictiveAnalytics
