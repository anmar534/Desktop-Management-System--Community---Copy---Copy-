import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Download, 
  Upload,
  Settings,
  BarChart3,
  Shield,
  Database,
  FileCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react'
import qualityAssuranceService from '../../services/qualityAssuranceService'
import type { 
  QualityMetrics, 
  PricingValidationResult, 
  CompletenessCheckResult,
  ErrorDetectionResult,
  ConsistencyVerificationResult,
  BackupRecord,
  QualityReport,
  PricingData,
  DocumentData,
  QualityCheckData,
  DocumentSet
} from '../../types/qualityAssurance'

interface QualityAssuranceProps {
  className?: string
}

const QualityAssurance: React.FC<QualityAssuranceProps> = React.memo(({ className }) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data state
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null)
  const [pricingValidation, setPricingValidation] = useState<PricingValidationResult | null>(null)
  const [completenessCheck, setCompletenessCheck] = useState<CompletenessCheckResult | null>(null)
  const [errorDetection, setErrorDetection] = useState<ErrorDetectionResult | null>(null)
  const [consistencyVerification, setConsistencyVerification] = useState<ConsistencyVerificationResult | null>(null)
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([])
  const [qualityReports, setQualityReports] = useState<QualityReport[]>([])

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'warnings' | 'success'>('all')

  // Load initial data
  useEffect(() => {
    loadQualityData()
  }, [])

  const loadQualityData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [metrics, backups] = await Promise.all([
        qualityAssuranceService.getQualityMetrics(),
        qualityAssuranceService.getBackupHistory()
      ])

      setQualityMetrics(metrics)
      setBackupHistory(backups)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات ضمان الجودة')
    } finally {
      setLoading(false)
    }
  }, [])

  // Validate pricing data
  const handlePricingValidation = useCallback(async (pricingData: PricingData) => {
    try {
      setLoading(true)
      const result = await qualityAssuranceService.validatePricing(pricingData)
      setPricingValidation(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في التحقق من صحة التسعير')
    } finally {
      setLoading(false)
    }
  }, [])

  // Check document completeness
  const handleCompletenessCheck = useCallback(async (documentData: DocumentData) => {
    try {
      setLoading(true)
      const result = await qualityAssuranceService.checkCompleteness(documentData)
      setCompletenessCheck(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في فحص اكتمال المستند')
    } finally {
      setLoading(false)
    }
  }, [])

  // Detect errors
  const handleErrorDetection = useCallback(async (data: QualityCheckData) => {
    try {
      setLoading(true)
      const result = await qualityAssuranceService.detectErrors(data)
      setErrorDetection(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في اكتشاف الأخطاء')
    } finally {
      setLoading(false)
    }
  }, [])

  // Verify consistency
  const handleConsistencyVerification = useCallback(async (documents: DocumentSet) => {
    try {
      setLoading(true)
      const result = await qualityAssuranceService.verifyConsistency(documents)
      setConsistencyVerification(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في التحقق من التناسق')
    } finally {
      setLoading(false)
    }
  }, [])

  // Create backup
  const handleCreateBackup = useCallback(async () => {
    try {
      setLoading(true)
      await qualityAssuranceService.createBackup({
        scope: 'full',
        includeMetadata: true,
        compression: true,
        encryption: false
      })
      await loadQualityData() // Reload data to show new backup
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إنشاء النسخة الاحتياطية')
    } finally {
      setLoading(false)
    }
  }, [loadQualityData])

  // Generate quality report
  const handleGenerateReport = useCallback(async () => {
    try {
      setLoading(true)
      const report = await qualityAssuranceService.generateQualityReport({
        includeMetrics: true,
        includeTrends: true,
        includeRecommendations: true,
        format: 'comprehensive',
        language: 'ar'
      })
      setQualityReports(prev => [report, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في إنشاء التقرير')
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoized computed values
  const qualityScore = useMemo(() => {
    return qualityMetrics?.overallQualityScore || 0
  }, [qualityMetrics])

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }, [])

  const getScoreBadgeVariant = useCallback((score: number) => {
    if (score >= 90) return 'default'
    if (score >= 70) return 'secondary'
    return 'destructive'
  }, [])

  if (loading && !qualityMetrics) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات ضمان الجودة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ضمان الجودة</h1>
          <p className="text-gray-600 mt-1">نظام شامل لضمان دقة واكتمال البيانات</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getScoreBadgeVariant(qualityScore)} className="text-lg px-3 py-1">
            <Target className="w-4 h-4 ml-1" />
            نقاط الجودة: {qualityScore.toFixed(1)}%
          </Badge>
          <Button onClick={handleGenerateReport} disabled={loading}>
            <BarChart3 className="w-4 h-4 ml-2" />
            إنشاء تقرير
          </Button>
          <Button onClick={handleCreateBackup} disabled={loading}>
            <Database className="w-4 h-4 ml-2" />
            نسخة احتياطية
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quality Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نقاط الجودة الإجمالية</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(qualityScore)}`}>
              {qualityScore.toFixed(1)}%
            </div>
            <Progress value={qualityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صحة التسعير</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {qualityMetrics?.pricingValidationMetrics.validationScore.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {qualityMetrics?.pricingValidationMetrics.totalValidations || 0} عملية تحقق
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اكتمال المستندات</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {qualityMetrics?.completenessMetrics.averageCompleteness.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {qualityMetrics?.completenessMetrics.totalChecks || 0} فحص اكتمال
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الأخطاء</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {qualityMetrics?.errorMetrics.errorRate.toFixed(2) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {qualityMetrics?.errorMetrics.totalErrors || 0} خطأ مكتشف
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="validation">التحقق من التسعير</TabsTrigger>
          <TabsTrigger value="completeness">فحص الاكتمال</TabsTrigger>
          <TabsTrigger value="errors">اكتشاف الأخطاء</TabsTrigger>
          <TabsTrigger value="consistency">التحقق من التناسق</TabsTrigger>
          <TabsTrigger value="backups">النسخ الاحتياطية</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  اتجاهات الجودة
                </CardTitle>
                <CardDescription>تطور نقاط الجودة خلال الفترة الماضية</CardDescription>
              </CardHeader>
              <CardContent>
                {qualityMetrics?.trends ? (
                  <div className="space-y-4">
                    {qualityMetrics.trends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{trend.period}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={trend.score} className="w-20" />
                          <span className="text-sm font-medium">{trend.score.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">لا توجد بيانات اتجاهات متاحة</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Quality Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  التقارير الأخيرة
                </CardTitle>
                <CardDescription>تقارير ضمان الجودة المُنشأة مؤخراً</CardDescription>
              </CardHeader>
              <CardContent>
                {qualityReports.length > 0 ? (
                  <div className="space-y-3">
                    {qualityReports.slice(0, 5).map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{report.title}</p>
                          <p className="text-sm text-gray-500">
                            <Clock className="w-3 h-3 inline ml-1" />
                            {new Date(report.generatedAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 ml-1" />
                          تحميل
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">لا توجد تقارير متاحة</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs would be implemented here with similar structure */}
        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>التحقق من صحة التسعير</CardTitle>
              <CardDescription>فحص وتحليل بيانات التسعير للتأكد من دقتها</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">سيتم تطوير واجهة التحقق من التسعير قريباً</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completeness">
          <Card>
            <CardHeader>
              <CardTitle>فحص اكتمال المستندات</CardTitle>
              <CardDescription>التحقق من اكتمال جميع الحقول والمرفقات المطلوبة</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">سيتم تطوير واجهة فحص الاكتمال قريباً</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>اكتشاف وتصحيح الأخطاء</CardTitle>
              <CardDescription>اكتشاف الأخطاء تلقائياً وتقديم اقتراحات للتصحيح</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">سيتم تطوير واجهة اكتشاف الأخطاء قريباً</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consistency">
          <Card>
            <CardHeader>
              <CardTitle>التحقق من التناسق</CardTitle>
              <CardDescription>فحص التناسق بين المستندات والبيانات المختلفة</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">سيتم تطوير واجهة التحقق من التناسق قريباً</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <CardTitle>إدارة النسخ الاحتياطية</CardTitle>
              <CardDescription>إنشاء واستعادة النسخ الاحتياطية للبيانات</CardDescription>
            </CardHeader>
            <CardContent>
              {backupHistory.length > 0 ? (
                <div className="space-y-3">
                  {backupHistory.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">نسخة احتياطية - {backup.scope}</p>
                        <p className="text-sm text-gray-500">
                          <Clock className="w-3 h-3 inline ml-1" />
                          {new Date(backup.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={backup.status === 'completed' ? 'default' : 'secondary'}>
                          {backup.status === 'completed' ? 'مكتملة' : backup.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 ml-1" />
                          استعادة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">لا توجد نسخ احتياطية متاحة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
})

QualityAssurance.displayName = 'QualityAssurance'

export default QualityAssurance
