/**
 * Decision Support Component
 * Comprehensive bid/no-bid decision framework and scenario planning interface
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Settings,
  FileText,
  Target,
  Brain,
  Lightbulb
} from 'lucide-react'

import { decisionSupportService } from '@/application/services/decisionSupportService'
import type { 
  DecisionScenario, 
  BidNoBidFramework, 
  ScenarioAnalysis,
  DecisionRecommendation,
  DecisionAnalytics
} from '../../types/decisionSupport'

interface DecisionSupportProps {
  className?: string
  onScenarioCreate?: (scenario: DecisionScenario) => void
  onScenarioUpdate?: (scenario: DecisionScenario) => void
  onScenarioDelete?: (scenarioId: string) => void
  showAnalytics?: boolean
  compactMode?: boolean
  projectId?: string
  tenderId?: string
}

export const DecisionSupport: React.FC<DecisionSupportProps> = React.memo(({
  className = '',
  onScenarioCreate,
  onScenarioUpdate,
  onScenarioDelete,
  showAnalytics = true,
  compactMode = false,
  projectId,
  tenderId
}) => {
  const [activeTab, setActiveTab] = useState('scenarios')
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState<DecisionScenario[]>([])
  const [frameworks, setFrameworks] = useState<BidNoBidFramework[]>([])
  const [selectedScenario, setSelectedScenario] = useState<DecisionScenario | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<BidNoBidFramework | null>(null)
  const [analysisResult, setAnalysisResult] = useState<ScenarioAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<DecisionRecommendation[]>([])
  const [analytics, setAnalytics] = useState<DecisionAnalytics | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [scenariosData, frameworksData, analyticsData] = await Promise.all([
        decisionSupportService.getAllScenarios(projectId ? { projectId } : undefined),
        decisionSupportService.getAllFrameworks(),
        showAnalytics ? decisionSupportService.getDecisionAnalytics() : Promise.resolve(null)
      ])

      setScenarios(scenariosData)
      setFrameworks(frameworksData)
      setAnalytics(analyticsData)

      // Set default framework if available
      if (frameworksData.length > 0 && !selectedFramework) {
        const activeFramework = frameworksData.find(f => f.isActive) || frameworksData[0]
        setSelectedFramework(activeFramework)
      }
    } catch (err) {
      console.error('Error loading decision support data:', err)
      setError('فشل في تحميل بيانات دعم القرار')
    } finally {
      setLoading(false)
    }
  }, [projectId, showAnalytics, selectedFramework])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter scenarios
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(scenario => {
      const matchesSearch = !searchTerm || 
        scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (scenario.nameEn?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        scenario.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scenario.projectName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || scenario.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [scenarios, searchTerm, statusFilter])

  // Handle scenario analysis
  const handleAnalyzeScenario = useCallback(async (scenarioId: string) => {
    if (!selectedFramework) {
      setError('يرجى اختيار إطار عمل للتحليل')
      return
    }

    try {
      setLoading(true)
      const analysis = await decisionSupportService.analyzeScenario(scenarioId, selectedFramework.id)
      const recs = await decisionSupportService.generateRecommendations(scenarioId)
      
      setAnalysisResult(analysis)
      setRecommendations(recs)
      
      // Update scenario in list
      const updatedScenario = await decisionSupportService.getScenario(scenarioId)
      if (updatedScenario) {
        setScenarios(prev => prev.map(s => s.id === scenarioId ? updatedScenario : s))
        setSelectedScenario(updatedScenario)
        onScenarioUpdate?.(updatedScenario)
      }
    } catch (err) {
      console.error('Error analyzing scenario:', err)
      setError('فشل في تحليل السيناريو')
    } finally {
      setLoading(false)
    }
  }, [selectedFramework, onScenarioUpdate])

  // Handle export
  const handleExport = useCallback(async (scenarioId: string, format: 'json' | 'csv' | 'pdf') => {
    try {
      const exportData = await decisionSupportService.exportScenario(scenarioId, format)
      
      // Create download
      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scenario_${scenarioId}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting scenario:', err)
      setError('فشل في تصدير السيناريو')
    }
  }, [])

  // Get recommendation color
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'bid': return 'bg-green-100 text-green-800 border-green-200'
      case 'no_bid': return 'bg-red-100 text-red-800 border-red-200'
      case 'conditional_bid': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get recommendation icon
  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'bid': return <CheckCircle className="h-4 w-4" />
      case 'no_bid': return <XCircle className="h-4 w-4" />
      case 'conditional_bid': return <AlertTriangle className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  // Get recommendation text
  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'bid': return 'مناقصة / Bid'
      case 'no_bid': return 'عدم مناقصة / No Bid'
      case 'conditional_bid': return 'مناقصة مشروطة / Conditional Bid'
      default: return 'غير محدد / Unknown'
    }
  }

  if (loading && scenarios.length === 0) {
    return (
      <div className={`space-y-6 ${className}`} dir="rtl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل بيانات دعم القرار...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            نظام دعم القرار
          </h2>
          <p className="text-gray-600 mt-1">
            إطار عمل شامل لاتخاذ قرارات المناقصات والتخطيط للسيناريوهات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setActiveTab('frameworks')}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4 ml-2" />
            إدارة الأطر
          </Button>
          <Button
            onClick={() => {/* Handle create scenario */}}
            size="sm"
          >
            <Plus className="h-4 w-4 ml-2" />
            سيناريو جديد
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Cards */}
      {showAnalytics && analytics && !compactMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي القرارات</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalDecisions}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">معدل الفوز</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.winRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">دقة التنبؤ</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.averageAccuracy.toFixed(1)}%</p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">قرارات المناقصة</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.bidDecisions}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scenarios">السيناريوهات</TabsTrigger>
          <TabsTrigger value="analysis">التحليل</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
          <TabsTrigger value="frameworks">الأطر</TabsTrigger>
        </TabsList>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في السيناريوهات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="analyzing">قيد التحليل</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="archived">مؤرشف</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scenarios List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredScenarios.map((scenario) => (
              <Card key={scenario.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{scenario.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {scenario.projectName}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getRecommendationColor(scenario.analysisResults.recommendation)}
                    >
                      <div className="flex items-center gap-1">
                        {getRecommendationIcon(scenario.analysisResults.recommendation)}
                        {getRecommendationText(scenario.analysisResults.recommendation)}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {scenario.description}
                  </p>

                  {/* Score Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>النتيجة الإجمالية</span>
                      <span className="font-medium">{scenario.analysisResults.overallScore}/100</span>
                    </div>
                    <Progress value={scenario.analysisResults.overallScore} className="h-2" />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAnalyzeScenario(scenario.id)}
                        disabled={loading}
                      >
                        <Brain className="h-4 w-4 ml-1" />
                        تحليل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedScenario(scenario)}
                      >
                        <FileText className="h-4 w-4 ml-1" />
                        عرض
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExport(scenario.id, 'json')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredScenarios.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد سيناريوهات
              </h3>
              <p className="text-gray-600 mb-4">
                ابدأ بإنشاء سيناريو جديد لتحليل قرارات المناقصات
              </p>
              <Button onClick={() => {/* Handle create scenario */}}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء سيناريو جديد
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {analysisResult ? (
            <div className="space-y-6">
              {/* Analysis Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    نتائج التحليل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {analysisResult.overallScore}/100
                    </div>
                    <Badge 
                      className={`${getRecommendationColor(analysisResult.recommendation)} text-lg px-4 py-2`}
                    >
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(analysisResult.recommendation)}
                        {getRecommendationText(analysisResult.recommendation)}
                      </div>
                    </Badge>
                  </div>

                  {/* Category Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Object.entries(analysisResult.categoryScores).map(([category, score]) => (
                      <div key={category} className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {score.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {category === 'financial' && 'مالي'}
                          {category === 'strategic' && 'استراتيجي'}
                          {category === 'operational' && 'تشغيلي'}
                          {category === 'risk' && 'مخاطر'}
                          {category === 'market' && 'سوق'}
                        </div>
                        <Progress value={score} className="h-2 mt-2" />
                      </div>
                    ))}
                  </div>

                  {/* Key Factors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        العوامل الإيجابية
                      </h4>
                      <ul className="space-y-1">
                        {analysisResult.keyFactors.positive.map((factor, index) => (
                          <li key={index} className="text-sm text-gray-600">• {factor}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        العوامل السلبية
                      </h4>
                      <ul className="space-y-1">
                        {analysisResult.keyFactors.negative.map((factor, index) => (
                          <li key={index} className="text-sm text-gray-600">• {factor}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        العوامل المحايدة
                      </h4>
                      <ul className="space-y-1">
                        {analysisResult.keyFactors.neutral.map((factor, index) => (
                          <li key={index} className="text-sm text-gray-600">• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد نتائج تحليل
              </h3>
              <p className="text-gray-600">
                اختر سيناريو وقم بتحليله لعرض النتائج هنا
              </p>
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{rec.action}</CardTitle>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                        {rec.priority === 'high' && 'عالية'}
                        {rec.priority === 'medium' && 'متوسطة'}
                        {rec.priority === 'low' && 'منخفضة'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{rec.rationale}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">النتيجة المتوقعة</h5>
                        <p className="text-sm text-gray-600">{rec.expectedOutcome}</p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">الجدولة الزمنية</h5>
                        <p className="text-sm text-gray-600">{rec.timeline}</p>
                      </div>
                    </div>

                    {rec.requiredResources.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">الموارد المطلوبة</h5>
                        <div className="flex flex-wrap gap-2">
                          {rec.requiredResources.map((resource, index) => (
                            <Badge key={index} variant="outline">{resource}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد توصيات
              </h3>
              <p className="text-gray-600">
                قم بتحليل سيناريو للحصول على توصيات مخصصة
              </p>
            </div>
          )}
        </TabsContent>

        {/* Frameworks Tab */}
        <TabsContent value="frameworks" className="space-y-6">
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              إدارة أطر العمل
            </h3>
            <p className="text-gray-600">
              قريباً - إدارة وتخصيص أطر عمل اتخاذ القرار
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
})

DecisionSupport.displayName = 'DecisionSupport'

export default DecisionSupport


