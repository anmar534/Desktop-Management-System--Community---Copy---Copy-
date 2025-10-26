/**
 * @fileoverview Bid Comparison & Benchmarking Component
 * @description Comprehensive UI component for bid comparison and competitive benchmarking
 * in Phase 3. Provides side-by-side bid comparisons, competitive gap analysis,
 * market positioning recommendations, and strategic response planning.
 *
 * @author Desktop Management System Team
 * @version 3.0.0
 * @since Phase 3 Implementation
 *
 * @example
 * ```tsx
 * import { BidComparison } from '@/presentation/components/competitive/BidComparison'
 *
 * <BidComparison
 *   onComparisonCreate={(comparison) => console.log('Created:', comparison)}
 *   showAnalytics={true}
 *   compactMode={false}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
  Search,
  Plus,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Target,
  Lightbulb,
  Shield,
  Clock,
  DollarSign,
  Star,
  Users,
  Settings,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'

import type {
  BidComparison as BidComparisonType,
  ComparisonResult,
  CompetitiveGapAnalysis,
  PositioningRecommendation,
} from '@/application/services/bidComparisonService'
import { bidComparisonService } from '@/application/services/bidComparisonService'

// ===== TYPE DEFINITIONS =====

export interface BidComparisonProps {
  className?: string
  onComparisonCreate?: (comparison: BidComparisonType) => void
  onComparisonUpdate?: (comparison: BidComparisonType) => void
  onComparisonDelete?: (comparisonId: string) => void
  showAnalytics?: boolean
  compactMode?: boolean
  projectId?: string
  bidIds?: string[]
}

interface ComparisonFilters {
  searchTerm: string
  projectIds: string[]
  statuses: string[]
  comparisonTypes: string[]
  dateRange: [string, string] | null
}

interface ComparisonStats {
  totalComparisons: number
  activeComparisons: number
  completedComparisons: number
  avgConfidenceScore: number
  topPerformingBids: string[]
  criticalGaps: number
}

// ===== MAIN COMPONENT =====

export const BidComparison: React.FC<BidComparisonProps> = React.memo(
  ({
    className = '',
    onComparisonCreate,
    onComparisonUpdate,
    onComparisonDelete,
    showAnalytics = true,
    compactMode = false,
    projectId,
    bidIds,
  }) => {
    // ===== STATE MANAGEMENT =====

    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    const [comparisons, setComparisons] = useState<BidComparisonType[]>([])
    const [selectedComparison, setSelectedComparison] = useState<BidComparisonType | null>(null)
    const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
    const [gapAnalysis, setGapAnalysis] = useState<CompetitiveGapAnalysis | null>(null)
    const [positioningRecommendations, setPositioningRecommendations] =
      useState<PositioningRecommendation | null>(null)
    const [stats, setStats] = useState<ComparisonStats | null>(null)

    const [filters, setFilters] = useState<ComparisonFilters>({
      searchTerm: '',
      projectIds: projectId ? [projectId] : [],
      statuses: [],
      comparisonTypes: [],
      dateRange: null,
    })

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showFilters, setShowFilters] = useState(false)

    // ===== DATA LOADING =====

    const loadComparisons = useCallback(async () => {
      try {
        setLoading(true)
        const [allComparisons, comparisonStats] = await Promise.all([
          bidComparisonService.getAllComparisons(filters),
          calculateStats(),
        ])

        setComparisons(allComparisons)
        setStats(comparisonStats)

        if (onComparisonUpdate) {
          allComparisons.forEach(onComparisonUpdate)
        }
      } catch (error) {
        console.error('Error loading bid comparisons:', error)
      } finally {
        setLoading(false)
      }
    }, [filters, onComparisonUpdate])

    const calculateStats = useCallback(async (): Promise<ComparisonStats> => {
      try {
        const allComparisons = await bidComparisonService.getAllComparisons()

        const totalComparisons = allComparisons.length
        const activeComparisons = allComparisons.filter((c) => c.status === 'in_progress').length
        const completedComparisons = allComparisons.filter((c) => c.status === 'completed').length
        const avgConfidenceScore =
          allComparisons.reduce((sum, c) => sum + c.confidenceScore, 0) / totalComparisons || 0

        // Mock top performing bids and critical gaps
        const topPerformingBids = ['bid_001', 'bid_002', 'bid_003']
        const criticalGaps = allComparisons.reduce(
          (sum, c) =>
            sum +
            c.results.competitivePositioning.competitiveGaps.filter(
              (gap) => gap.severity === 'critical',
            ).length,
          0,
        )

        return {
          totalComparisons,
          activeComparisons,
          completedComparisons,
          avgConfidenceScore,
          topPerformingBids,
          criticalGaps,
        }
      } catch (error) {
        console.error('Error calculating stats:', error)
        return {
          totalComparisons: 0,
          activeComparisons: 0,
          completedComparisons: 0,
          avgConfidenceScore: 0,
          topPerformingBids: [],
          criticalGaps: 0,
        }
      }
    }, [])

    useEffect(() => {
      loadComparisons()
    }, [loadComparisons])

    // ===== EVENT HANDLERS =====

    const handleCreateComparison = useCallback(async () => {
      try {
        if (!bidIds || bidIds.length < 2) {
          alert('يجب اختيار عرضين على الأقل للمقارنة')
          return
        }

        const newComparison = await bidComparisonService.createComparison({
          name: `مقارنة العروض - ${new Date().toLocaleDateString('ar-SA')}`,
          description: 'مقارنة شاملة للعروض المقدمة',
          projectId: projectId || 'default_project',
          projectName: 'مشروع افتراضي',
          createdBy: 'current_user',
          bidIds: bidIds,
          comparisonType: 'detailed',
          analysisDepth: 'comprehensive',
          status: 'draft',
        })

        setComparisons((prev) => [newComparison, ...prev])
        setSelectedComparison(newComparison)
        setShowCreateDialog(false)

        if (onComparisonCreate) {
          onComparisonCreate(newComparison)
        }

        // Perform initial analysis
        await performComparison(newComparison.id)
      } catch (error) {
        console.error('Error creating comparison:', error)
        alert('حدث خطأ في إنشاء المقارنة')
      }
    }, [bidIds, projectId, onComparisonCreate])

    const performComparison = useCallback(
      async (comparisonId: string) => {
        try {
          const comparison = await bidComparisonService.getComparison(comparisonId)
          if (!comparison) return

          const [result, gaps, positioning] = await Promise.all([
            bidComparisonService.compareBids(comparison.bidIds, comparison.analysisDepth),
            bidComparisonService.analyzeCompetitiveGaps(
              comparison.bidIds[0],
              comparison.bidIds.slice(1),
            ),
            bidComparisonService.getPositioningRecommendations(comparison.bidIds[0]),
          ])

          // Update comparison with results
          const updatedComparison = await bidComparisonService.updateComparison(comparisonId, {
            results: result,
            status: 'completed',
            confidenceScore: Math.random() * 30 + 70, // Mock confidence score 70-100%
            lastAnalyzed: new Date().toISOString(),
          })

          setComparisonResult(result)
          setGapAnalysis(gaps)
          setPositioningRecommendations(positioning)
          setSelectedComparison(updatedComparison)

          // Update comparisons list
          setComparisons((prev) => prev.map((c) => (c.id === comparisonId ? updatedComparison : c)))

          if (onComparisonUpdate) {
            onComparisonUpdate(updatedComparison)
          }
        } catch (error) {
          console.error('Error performing comparison:', error)
        }
      },
      [onComparisonUpdate],
    )

    const handleDeleteComparison = useCallback(
      async (comparisonId: string) => {
        try {
          const success = await bidComparisonService.deleteComparison(comparisonId)
          if (success) {
            setComparisons((prev) => prev.filter((c) => c.id !== comparisonId))
            if (selectedComparison?.id === comparisonId) {
              setSelectedComparison(null)
              setComparisonResult(null)
              setGapAnalysis(null)
              setPositioningRecommendations(null)
            }

            if (onComparisonDelete) {
              onComparisonDelete(comparisonId)
            }
          }
        } catch (error) {
          console.error('Error deleting comparison:', error)
        }
      },
      [selectedComparison, onComparisonDelete],
    )

    const handleExportComparison = useCallback(
      async (comparisonId: string, format: 'json' | 'csv' | 'pdf') => {
        try {
          const exportData = await bidComparisonService.exportComparison(comparisonId, format)

          // Create download link
          const blob = new Blob([exportData], {
            type: format === 'json' ? 'application/json' : 'text/csv',
          })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `bid_comparison_${comparisonId}.${format}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Error exporting comparison:', error)
        }
      },
      [],
    )

    const handleGenerateReport = useCallback(async (comparisonId: string) => {
      try {
        const report = await bidComparisonService.generateComparisonReport(comparisonId)

        // Create download link for report
        const blob = new Blob([report], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `bid_comparison_report_${comparisonId}.md`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error generating report:', error)
      }
    }, [])

    // ===== COMPUTED VALUES =====

    const filteredComparisons = useMemo(() => {
      return comparisons.filter((comparison) => {
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          if (
            !comparison.name.toLowerCase().includes(searchLower) &&
            !comparison.projectName.toLowerCase().includes(searchLower) &&
            !comparison.description.toLowerCase().includes(searchLower)
          ) {
            return false
          }
        }

        if (filters.statuses.length > 0 && !filters.statuses.includes(comparison.status)) {
          return false
        }

        if (
          filters.comparisonTypes.length > 0 &&
          !filters.comparisonTypes.includes(comparison.comparisonType)
        ) {
          return false
        }

        return true
      })
    }, [comparisons, filters])

    // ===== RENDER HELPERS =====

    const renderStatsCards = () => {
      if (!showAnalytics || !stats) return null

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المقارنات</p>
                  <p className="text-2xl font-bold">{stats.totalComparisons}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">المقارنات النشطة</p>
                  <p className="text-2xl font-bold">{stats.activeComparisons}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">متوسط الثقة</p>
                  <p className="text-2xl font-bold">{stats.avgConfidenceScore.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الفجوات الحرجة</p>
                  <p className="text-2xl font-bold">{stats.criticalGaps}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    const renderComparisonsList = () => {
      if (loading) {
        return (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      }

      if (filteredComparisons.length === 0) {
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مقارنات</h3>
              <p className="text-gray-500 mb-4">ابدأ بإنشاء مقارنة جديدة للعروض</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                إنشاء مقارنة جديدة
              </Button>
            </CardContent>
          </Card>
        )
      }

      return (
        <div className="space-y-4">
          {filteredComparisons.map((comparison) => (
            <Card
              key={comparison.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedComparison?.id === comparison.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedComparison(comparison)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{comparison.name}</h3>
                      <Badge
                        variant={
                          comparison.status === 'completed'
                            ? 'default'
                            : comparison.status === 'in_progress'
                              ? 'secondary'
                              : comparison.status === 'draft'
                                ? 'outline'
                                : 'destructive'
                        }
                      >
                        {comparison.status === 'completed'
                          ? 'مكتملة'
                          : comparison.status === 'in_progress'
                            ? 'قيد التنفيذ'
                            : comparison.status === 'draft'
                              ? 'مسودة'
                              : 'مؤرشفة'}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{comparison.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>المشروع: {comparison.projectName}</span>
                      <span>العروض: {comparison.bidIds.length}</span>
                      <span>الثقة: {comparison.confidenceScore.toFixed(1)}%</span>
                      <span>
                        آخر تحليل: {new Date(comparison.lastAnalyzed).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGenerateReport(comparison.id)
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExportComparison(comparison.id, 'csv')
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteComparison(comparison.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    const renderComparisonDetails = () => {
      if (!selectedComparison || !comparisonResult) {
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">اختر مقارنة لعرض التفاصيل</h3>
              <p className="text-gray-500">حدد مقارنة من القائمة لعرض النتائج والتحليل التفصيلي</p>
            </CardContent>
          </Card>
        )
      }

      return (
        <div className="space-y-6">
          {/* Comparison Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ملخص المقارنة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">نطاق الأسعار</p>
                  <p className="text-lg font-bold text-blue-600">
                    {comparisonResult.summary.priceRange.min.toLocaleString()} -{' '}
                    {comparisonResult.summary.priceRange.max.toLocaleString()} ريال
                  </p>
                  <p className="text-xs text-gray-500">
                    متوسط: {comparisonResult.summary.priceRange.average.toLocaleString()} ريال
                  </p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">نطاق الجدولة الزمنية</p>
                  <p className="text-lg font-bold text-green-600">
                    {comparisonResult.summary.timelineRange.min} -{' '}
                    {comparisonResult.summary.timelineRange.max} يوم
                  </p>
                  <p className="text-xs text-gray-500">
                    متوسط: {comparisonResult.summary.timelineRange.average.toFixed(0)} يوم
                  </p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">نطاق الجودة</p>
                  <p className="text-lg font-bold text-purple-600">
                    {comparisonResult.summary.qualityScoreRange.min.toFixed(1)} -{' '}
                    {comparisonResult.summary.qualityScoreRange.max.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    متوسط: {comparisonResult.summary.qualityScoreRange.average.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competitive Positioning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                الموقف التنافسي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">الموقف في السوق</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>الموقف العام:</span>
                      <Badge>
                        {comparisonResult.competitivePositioning.marketPosition.overall}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>الموقف السعري:</span>
                      <Badge variant="outline">
                        {comparisonResult.competitivePositioning.marketPosition.price}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>مستوى الجودة:</span>
                      <Badge variant="secondary">
                        {comparisonResult.competitivePositioning.marketPosition.quality}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">عوامل التمييز</h4>
                  <div className="space-y-1">
                    {comparisonResult.competitivePositioning.differentiationFactors
                      .slice(0, 5)
                      .map((factor, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{factor}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Recommendations */}
          {comparisonResult.strategicRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  التوصيات الاستراتيجية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparisonResult.strategicRecommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{rec.recommendation}</h4>
                        <Badge
                          variant={
                            rec.priority === 'critical'
                              ? 'destructive'
                              : rec.priority === 'high'
                                ? 'default'
                                : rec.priority === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                          }
                        >
                          {rec.priority === 'critical'
                            ? 'حرجة'
                            : rec.priority === 'high'
                              ? 'عالية'
                              : rec.priority === 'medium'
                                ? 'متوسطة'
                                : 'منخفضة'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.rationale}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>التأثير: {rec.expectedImpact}</span>
                        <span>المدة: {rec.timeline}</span>
                        <span>التكلفة: {rec.cost.toLocaleString()} ريال</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )
    }

    const renderGapAnalysis = () => {
      if (!gapAnalysis) return null

      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              تحليل الفجوات التنافسية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gapAnalysis.gaps.slice(0, 3).map((gap, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{gap.description}</h4>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          gap.severity === 'critical'
                            ? 'destructive'
                            : gap.severity === 'significant'
                              ? 'default'
                              : gap.severity === 'moderate'
                                ? 'secondary'
                                : 'outline'
                        }
                      >
                        {gap.severity === 'critical'
                          ? 'حرجة'
                          : gap.severity === 'significant'
                            ? 'مهمة'
                            : gap.severity === 'moderate'
                              ? 'متوسطة'
                              : 'طفيفة'}
                      </Badge>
                      <Badge variant="outline">
                        {gap.urgency === 'high'
                          ? 'عاجل'
                          : gap.urgency === 'medium'
                            ? 'متوسط'
                            : 'منخفض'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {gap.recommendations.slice(0, 3).map((rec, recIndex) => (
                      <div key={recIndex} className="flex items-center gap-2">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    }

    const renderFiltersBar = () => {
      return (
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المقارنات..."
                value={filters.searchTerm}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            فلترة
          </Button>

          <Button variant="outline" onClick={loadComparisons} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>

          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            مقارنة جديدة
          </Button>
        </div>
      )
    }

    // ===== MAIN RENDER =====

    return (
      <div className={`space-y-6 ${className}`} dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مقارنة العروض والمعايرة التنافسية</h1>
            <p className="text-gray-600">تحليل شامل ومقارنة تفصيلية للعروض مع توصيات استراتيجية</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {renderStatsCards()}

        {/* Filters Bar */}
        {renderFiltersBar()}

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">الحالة</label>
                  <Select
                    value={filters.statuses.join(',')}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        statuses: value ? value.split(',') : [],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="completed">مكتملة</SelectItem>
                      <SelectItem value="archived">مؤرشفة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">نوع المقارنة</label>
                  <Select
                    value={filters.comparisonTypes.join(',')}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        comparisonTypes: value ? value.split(',') : [],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">تفصيلية</SelectItem>
                      <SelectItem value="summary">ملخص</SelectItem>
                      <SelectItem value="competitive">تنافسية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFilters({
                        searchTerm: '',
                        projectIds: projectId ? [projectId] : [],
                        statuses: [],
                        comparisonTypes: [],
                        dateRange: null,
                      })
                    }
                    className="w-full"
                  >
                    إعادة تعيين
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparisons List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">قائمة المقارنات</h2>
            {renderComparisonsList()}
          </div>

          {/* Comparison Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4">تفاصيل المقارنة</h2>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="gaps">الفجوات</TabsTrigger>
                <TabsTrigger value="positioning">التموقع</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                {renderComparisonDetails()}
              </TabsContent>

              <TabsContent value="gaps" className="mt-4">
                {renderGapAnalysis()}
              </TabsContent>

              <TabsContent value="positioning" className="mt-4">
                {positioningRecommendations && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        توصيات التموقع
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">الاستراتيجية المقترحة</h4>
                          <p className="text-sm text-gray-600">
                            {positioningRecommendations.positioningStrategy}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">الرسائل الأساسية</h4>
                          <div className="space-y-1">
                            {positioningRecommendations.keyMessages.map((message, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">{message}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">عوامل التمييز</h4>
                          <div className="flex flex-wrap gap-2">
                            {positioningRecommendations.differentiators.map((diff, index) => (
                              <Badge key={index} variant="outline">
                                {diff}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Create Comparison Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>إنشاء مقارنة جديدة</CardTitle>
                <CardDescription>قم بإنشاء مقارنة شاملة للعروض المحددة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">عدد العروض المحددة</label>
                    <p className="text-lg font-bold text-blue-600">{bidIds?.length || 0}</p>
                    {(!bidIds || bidIds.length < 2) && (
                      <p className="text-sm text-red-600">يجب اختيار عرضين على الأقل</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateComparison} disabled={!bidIds || bidIds.length < 2}>
                  إنشاء المقارنة
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  },
)

BidComparison.displayName = 'BidComparison'

export default BidComparison
