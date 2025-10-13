/**
 * Machine Learning Pricing Component
 * AI-driven pricing optimization interface with automated recommendations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { machineLearningService } from '../../services/machineLearningService'
import type {
  MLModel,
  PricingPrediction,
  PatternRecognition,
  LearningInsight,
  ModelPerformance,
  PricingContext
} from '../../types/machineLearning'

interface MachineLearningPricingProps {
  tenderId?: string
  onPredictionGenerated?: (prediction: PricingPrediction) => void
  onModelTrained?: (model: MLModel) => void
  className?: string
}

const MachineLearningPricing: React.FC<MachineLearningPricingProps> = React.memo(({
  tenderId,
  onPredictionGenerated,
  onModelTrained,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('predictions')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for models and predictions
  const [models, setModels] = useState<MLModel[]>([])
  const [predictions, setPredictions] = useState<PricingPrediction[]>([])
  const [patterns, setPatterns] = useState<PatternRecognition[]>([])
  const [insights, setInsights] = useState<LearningInsight[]>([])
  
  // State for prediction form
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [pricingContext, setPricingContext] = useState<Partial<PricingContext>>({
    tender: { estimatedValue: 1000000 },
    market: {
      competitorCount: 3,
      marketTrend: 'stable',
      demandLevel: 'medium',
      priceVolatility: 0.1
    }
  })

  // Load data on component mount
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [modelsData, patternsData, insightsData] = await Promise.all([
        machineLearningService.getModels(),
        machineLearningService.getPatterns(),
        machineLearningService.getLearningInsights()
      ])

      setModels(modelsData)
      setPatterns(patternsData)
      setInsights(insightsData)

      // Set default selected model
      const activeModel = modelsData.find(m => m.isActive && m.type === 'pricing_optimization')
      if (activeModel) {
        setSelectedModel(activeModel.id)
      }

    } catch (err) {
      console.error('Error loading ML data:', err)
      setError('فشل في تحميل بيانات التعلم الآلي')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Generate pricing prediction
  const handleGeneratePrediction = useCallback(async () => {
    if (!selectedModel || !tenderId) {
      setError('يرجى تحديد النموذج ومعرف المناقصة')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const context: PricingContext = {
        tender: { id: tenderId, ...pricingContext.tender },
        market: pricingContext.market!,
        competitors: [],
        historical: [],
        constraints: []
      }

      const prediction = await machineLearningService.getPricingPrediction(tenderId, context)
      setPredictions(prev => [prediction, ...prev])
      
      if (onPredictionGenerated) {
        onPredictionGenerated(prediction)
      }

    } catch (err) {
      console.error('Error generating prediction:', err)
      setError('فشل في توليد توقع التسعير')
    } finally {
      setLoading(false)
    }
  }, [selectedModel, tenderId, pricingContext, onPredictionGenerated])

  // Train new model
  const handleTrainModel = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const trainingConfig = {
        name: 'Pricing Optimization Model',
        nameAr: 'نموذج تحسين التسعير',
        type: 'pricing_optimization' as const,
        dataset: {
          id: 'dataset_1',
          name: 'Historical Pricing Data',
          nameAr: 'بيانات التسعير التاريخية',
          size: 1000,
          features: [],
          target: 'price',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          quality: {
            completeness: 0.95,
            accuracy: 0.9,
            consistency: 0.88,
            timeliness: 0.92,
            validity: 0.94,
            overall: 0.92
          },
          source: ['historical_bids', 'market_data']
        },
        parameters: {
          algorithm: 'random_forest' as const,
          hyperparameters: {
            n_estimators: 100,
            max_depth: 10,
            min_samples_split: 2
          },
          featureSelection: {
            method: 'importance' as const,
            threshold: 0.01
          },
          validation: {
            method: 'cross_validation' as const,
            folds: 5,
            testSize: 0.2
          },
          optimization: {
            objective: 'mse' as const,
            maxIterations: 1000,
            tolerance: 0.001
          }
        },
        validation: {
          method: 'cross_validation' as const,
          folds: 5,
          testSize: 0.2
        }
      }

      const newModel = await machineLearningService.trainModel(trainingConfig)
      setModels(prev => [newModel, ...prev])
      
      if (onModelTrained) {
        onModelTrained(newModel)
      }

    } catch (err) {
      console.error('Error training model:', err)
      setError('فشل في تدريب النموذج')
    } finally {
      setLoading(false)
    }
  }, [onModelTrained])

  // Memoized calculations
  const activeModels = useMemo(() => 
    models.filter(m => m.isActive), [models]
  )

  const modelPerformanceStats = useMemo(() => {
    if (models.length === 0) return null
    
    const avgAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0) / models.length
    const avgConfidence = models.reduce((sum, m) => sum + m.confidence, 0) / models.length
    
    return { avgAccuracy, avgConfidence }
  }, [models])

  const recentPredictions = useMemo(() => 
    predictions.slice(0, 5), [predictions]
  )

  if (loading && models.length === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">جاري تحميل نماذج التعلم الآلي...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`w-full space-y-6 ${className}`} dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">نماذج التسعير الذكية</h2>
              <p className="text-sm text-gray-600 font-normal">تحسين التسعير باستخدام الذكاء الاصطناعي</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="predictions">التوقعات</TabsTrigger>
              <TabsTrigger value="models">النماذج</TabsTrigger>
              <TabsTrigger value="patterns">الأنماط</TabsTrigger>
              <TabsTrigger value="insights">الرؤى</TabsTrigger>
            </TabsList>

            <TabsContent value="predictions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">توليد توقع تسعير جديد</CardTitle>
                  <CardDescription>
                    استخدم نماذج التعلم الآلي لتوليد توقعات تسعير ذكية
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="model-select">النموذج المستخدم</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر النموذج" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeModels.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.nameAr} - دقة: {(model.accuracy * 100).toFixed(1)}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimated-value">القيمة المقدرة</Label>
                      <Input
                        id="estimated-value"
                        type="number"
                        value={pricingContext.tender?.estimatedValue || ''}
                        onChange={(e) => setPricingContext(prev => ({
                          ...prev,
                          tender: { ...prev.tender, estimatedValue: Number(e.target.value) }
                        }))}
                        placeholder="القيمة المقدرة للمشروع"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="competitor-count">عدد المنافسين</Label>
                      <Input
                        id="competitor-count"
                        type="number"
                        value={pricingContext.market?.competitorCount || ''}
                        onChange={(e) => setPricingContext(prev => ({
                          ...prev,
                          market: { ...prev.market!, competitorCount: Number(e.target.value) }
                        }))}
                        placeholder="عدد المنافسين المتوقع"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="market-trend">اتجاه السوق</Label>
                      <Select 
                        value={pricingContext.market?.marketTrend || 'stable'} 
                        onValueChange={(value) => setPricingContext(prev => ({
                          ...prev,
                          market: { ...prev.market!, marketTrend: value as any }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="growing">نمو</SelectItem>
                          <SelectItem value="stable">مستقر</SelectItem>
                          <SelectItem value="declining">تراجع</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGeneratePrediction}
                    disabled={loading || !selectedModel || !tenderId}
                    className="w-full"
                  >
                    {loading ? 'جاري التوليد...' : 'توليد توقع التسعير'}
                  </Button>
                </CardContent>
              </Card>

              {recentPredictions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">التوقعات الحديثة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentPredictions.map(prediction => (
                        <div key={prediction.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">السعر الموصى به</h4>
                              <p className="text-2xl font-bold text-blue-600">
                                {prediction.prediction.recommendedPrice.toLocaleString('ar-SA')} ريال
                              </p>
                            </div>
                            <Badge variant={prediction.confidence > 0.8 ? 'default' : 'secondary'}>
                              ثقة: {(prediction.confidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">احتمالية الفوز:</span>
                              <p className="font-medium">{(prediction.prediction.winProbability * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                              <span className="text-gray-600">الربحية:</span>
                              <p className="font-medium">{(prediction.prediction.profitability * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                              <span className="text-gray-600">التنافسية:</span>
                              <p className="font-medium">{(prediction.prediction.competitiveness * 100).toFixed(1)}%</p>
                            </div>
                          </div>

                          <Separator className="my-3" />
                          
                          <p className="text-sm text-gray-600">{prediction.prediction.reasoningAr}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">نماذج التعلم الآلي</h3>
                <Button onClick={handleTrainModel} disabled={loading}>
                  {loading ? 'جاري التدريب...' : 'تدريب نموذج جديد'}
                </Button>
              </div>

              {modelPerformanceStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">إحصائيات الأداء العامة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>متوسط الدقة</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={modelPerformanceStats.avgAccuracy * 100} className="flex-1" />
                          <span className="text-sm font-medium">
                            {(modelPerformanceStats.avgAccuracy * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label>متوسط الثقة</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={modelPerformanceStats.avgConfidence * 100} className="flex-1" />
                          <span className="text-sm font-medium">
                            {(modelPerformanceStats.avgConfidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {models.map(model => (
                  <Card key={model.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{model.nameAr}</h4>
                          <p className="text-sm text-gray-600">الإصدار: {model.version}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={model.isActive ? 'default' : 'secondary'}>
                            {model.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                          <Badge variant={
                            model.status === 'ready' ? 'default' :
                            model.status === 'training' ? 'secondary' : 'destructive'
                          }>
                            {model.status === 'ready' ? 'جاهز' :
                             model.status === 'training' ? 'قيد التدريب' : 'خطأ'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">الدقة:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={model.accuracy * 100} className="flex-1" />
                            <span className="font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">الثقة:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={model.confidence * 100} className="flex-1" />
                            <span className="font-medium">{(model.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        آخر تدريب: {new Date(model.lastTrained).toLocaleDateString('ar-SA')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              <h3 className="text-lg font-medium">الأنماط المكتشفة</h3>
              
              {patterns.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">لم يتم اكتشاف أنماط بعد</p>
                    <p className="text-sm text-gray-500 mt-1">
                      سيتم اكتشاف الأنماط تلقائياً مع توفر المزيد من البيانات
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {patterns.map(pattern => (
                    <Card key={pattern.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{pattern.nameAr}</h4>
                          <Badge>ثقة: {(pattern.confidence * 100).toFixed(1)}%</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {pattern.patterns.map((p, index) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium">{p.descriptionAr}</p>
                              <div className="flex gap-4 text-xs text-gray-600 mt-1">
                                <span>القوة: {(p.strength * 100).toFixed(1)}%</span>
                                <span>التكرار: {(p.frequency * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <h3 className="text-lg font-medium">رؤى التعلم</h3>
              
              {insights.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">لا توجد رؤى متاحة حالياً</p>
                    <p className="text-sm text-gray-500 mt-1">
                      ستظهر الرؤى مع استخدام النظام وتقديم التغذية الراجعة
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {insights.map((insight, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium capitalize">{insight.category}</h4>
                          <Badge variant={insight.actionable ? 'destructive' : 'default'}>
                            {insight.actionable ? 'يتطلب إجراء' : 'معلوماتي'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mb-3">{insight.insightAr}</p>
                        
                        {insight.recommendations.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-1">التوصيات:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {insight.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
})

MachineLearningPricing.displayName = 'MachineLearningPricing'

export default MachineLearningPricing
