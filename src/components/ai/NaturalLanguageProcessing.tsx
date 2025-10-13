/**
 * Natural Language Processing Component
 * Advanced NLP interface for document analysis and data extraction
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Upload, 
  FileText, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download,
  Search,
  Filter,
  BarChart3,
  FileCheck,
  Zap
} from 'lucide-react'
import { naturalLanguageProcessingService } from '../../services/naturalLanguageProcessingService'
import type {
  DocumentInput,
  ProcessingJob,
  BOQExtraction,
  SpecificationAnalysis,
  RiskAnalysis,
  DocumentCategorization,
  GeneratedReport,
  ReportTemplate,
  ExtractionType,
  ProcessingStatistics,
  AccuracyMetrics
} from '../../types/naturalLanguageProcessing'

interface NaturalLanguageProcessingProps {
  className?: string
  onDocumentProcessed?: (job: ProcessingJob) => void
  onExtractionCompleted?: (extraction: any) => void
}

const NaturalLanguageProcessing: React.FC<NaturalLanguageProcessingProps> = React.memo(({
  className = '',
  onDocumentProcessed,
  onExtractionCompleted
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Document processing state
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([])
  const [boqExtractions, setBOQExtractions] = useState<BOQExtraction[]>([])
  const [specAnalyses, setSpecAnalyses] = useState<SpecificationAnalysis[]>([])
  const [riskAnalyses, setRiskAnalyses] = useState<RiskAnalysis[]>([])
  const [categorizations, setCategorizations] = useState<DocumentCategorization[]>([])
  const [reports, setReports] = useState<GeneratedReport[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  
  // Analytics state
  const [statistics, setStatistics] = useState<ProcessingStatistics | null>(null)
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null)
  
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractionTypes, setExtractionTypes] = useState<ExtractionType[]>(['boq_extraction'])
  const [searchTerm, setSearchTerm] = useState('')

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [
        jobsData,
        templatesData,
        statisticsData,
        metricsData
      ] = await Promise.all([
        naturalLanguageProcessingService.getProcessingJobs(),
        naturalLanguageProcessingService.getReportTemplates(),
        naturalLanguageProcessingService.getProcessingStatistics(),
        naturalLanguageProcessingService.getAccuracyMetrics()
      ])

      setProcessingJobs(jobsData)
      setTemplates(templatesData)
      setStatistics(statisticsData)
      setMetrics(metricsData)
    } catch (err) {
      console.error('Error loading NLP data:', err)
      setError('فشل في تحميل بيانات معالجة اللغة الطبيعية')
    } finally {
      setLoading(false)
    }
  }, [])

  // Document upload and processing
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setError(null)
  }, [])

  const processDocument = useCallback(async () => {
    if (!selectedFile) {
      setError('يرجى اختيار ملف للمعالجة')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create document input
      const documentInput: DocumentInput = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: selectedFile.name,
        nameAr: selectedFile.name,
        type: 'tender_document',
        content: await readFileContent(selectedFile),
        language: 'ar',
        metadata: {
          source: 'user_upload',
          tags: [],
          customFields: {}
        },
        uploadedAt: new Date().toISOString(),
        size: selectedFile.size,
        format: selectedFile.type
      }

      // Start processing
      const job = await naturalLanguageProcessingService.processDocument(documentInput, extractionTypes)
      
      setProcessingJobs(prev => [job, ...prev])
      onDocumentProcessed?.(job)

      // Monitor job progress
      monitorJobProgress(job.id)

    } catch (err) {
      console.error('Error processing document:', err)
      setError('فشل في معالجة المستند')
    } finally {
      setLoading(false)
    }
  }, [selectedFile, extractionTypes, onDocumentProcessed])

  const monitorJobProgress = useCallback(async (jobId: string) => {
    const checkProgress = async () => {
      try {
        const job = await naturalLanguageProcessingService.getProcessingJob(jobId)
        if (!job) return

        setProcessingJobs(prev => 
          prev.map(j => j.id === jobId ? job : j)
        )

        if (job.status === 'completed' && job.results) {
          // Update relevant state based on results
          if (job.results.boqExtraction) {
            setBOQExtractions(prev => [job.results!.boqExtraction!, ...prev])
          }
          if (job.results.specificationAnalysis) {
            setSpecAnalyses(prev => [job.results!.specificationAnalysis!, ...prev])
          }
          if (job.results.riskAnalysis) {
            setRiskAnalyses(prev => [job.results!.riskAnalysis!, ...prev])
          }
          if (job.results.categorization) {
            setCategorizations(prev => [job.results!.categorization!, ...prev])
          }

          onExtractionCompleted?.(job.results)
        } else if (job.status === 'processing') {
          // Continue monitoring
          setTimeout(checkProgress, 2000)
        }
      } catch (err) {
        console.error('Error monitoring job progress:', err)
      }
    }

    checkProgress()
  }, [onExtractionCompleted])

  const readFileContent = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('فشل في قراءة الملف'))
      reader.readAsText(file)
    })
  }, [])

  // Generate report
  const generateReport = useCallback(async (templateId: string, documentIds: string[]) => {
    try {
      setLoading(true)
      const report = await naturalLanguageProcessingService.generateReport(templateId, documentIds)
      setReports(prev => [report, ...prev])
    } catch (err) {
      console.error('Error generating report:', err)
      setError('فشل في إنشاء التقرير')
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtered data for search
  const filteredJobs = useMemo(() => {
    if (!searchTerm) return processingJobs
    return processingJobs.filter(job => 
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.documentId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [processingJobs, searchTerm])

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">معالجة اللغة الطبيعية</h2>
          <p className="text-gray-600">تحليل المستندات واستخراج البيانات بالذكاء الاصطناعي</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Brain className="h-8 w-8 text-blue-600" />
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload" className="flex items-center space-x-2 space-x-reverse">
            <Upload className="h-4 w-4" />
            <span>رفع المستندات</span>
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center space-x-2 space-x-reverse">
            <Zap className="h-4 w-4" />
            <span>المعالجة</span>
          </TabsTrigger>
          <TabsTrigger value="extractions" className="flex items-center space-x-2 space-x-reverse">
            <FileText className="h-4 w-4" />
            <span>الاستخراجات</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2 space-x-reverse">
            <FileCheck className="h-4 w-4" />
            <span>التقارير</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="h-4 w-4" />
            <span>التحليلات</span>
          </TabsTrigger>
        </TabsList>

        {/* Document Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Upload className="h-5 w-5" />
                <span>رفع مستند جديد</span>
              </CardTitle>
              <CardDescription>
                ارفع المستندات لتحليلها واستخراج البيانات منها باستخدام الذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">اختر المستند</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600">
                    الملف المحدد: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Extraction Types */}
              <div className="space-y-2">
                <Label>أنواع الاستخراج</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'boq_extraction', label: 'استخراج جدول الكميات' },
                    { value: 'specification_analysis', label: 'تحليل المواصفات' },
                    { value: 'risk_identification', label: 'تحديد المخاطر' },
                    { value: 'categorization', label: 'التصنيف' }
                  ].map(type => (
                    <label key={type.value} className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        checked={extractionTypes.includes(type.value as ExtractionType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExtractionTypes(prev => [...prev, type.value as ExtractionType])
                          } else {
                            setExtractionTypes(prev => prev.filter(t => t !== type.value))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Process Button */}
              <Button
                onClick={processDocument}
                disabled={!selectedFile || extractionTypes.length === 0 || loading}
                className="w-full"
              >
                {loading ? 'جاري المعالجة...' : 'بدء المعالجة'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Jobs Tab */}
        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Zap className="h-5 w-5" />
                  <span>مهام المعالجة</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث في المهام..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد مهام معالجة
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getStatusIcon(job.status)}
                          <span className="font-medium">مهمة {job.id.slice(-8)}</span>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status === 'completed' ? 'مكتملة' :
                             job.status === 'processing' ? 'قيد المعالجة' :
                             job.status === 'failed' ? 'فشلت' : 'في الانتظار'}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(job.startedAt).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      
                      {job.status === 'processing' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>التقدم</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}
                      
                      {job.error && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            {job.errorAr || job.error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extractions Tab */}
        <TabsContent value="extractions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BOQ Extractions */}
            <Card>
              <CardHeader>
                <CardTitle>استخراجات جدول الكميات</CardTitle>
                <CardDescription>
                  {boqExtractions.length} استخراج متاح
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {boqExtractions.slice(0, 3).map(extraction => (
                    <div key={extraction.id} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {extraction.metadata.projectNameAr || 'مشروع غير محدد'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {extraction.totalItems} عنصر • {extraction.totalValue?.toLocaleString()} {extraction.currency}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(extraction.confidence * 100)}% دقة
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Specification Analyses */}
            <Card>
              <CardHeader>
                <CardTitle>تحليلات المواصفات</CardTitle>
                <CardDescription>
                  {specAnalyses.length} تحليل متاح
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {specAnalyses.slice(0, 3).map(analysis => (
                    <div key={analysis.id} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">تحليل المواصفات</p>
                          <p className="text-sm text-gray-600">
                            {analysis.totalRequirements} متطلب • {Math.round(analysis.complianceScore * 100)}% امتثال
                          </p>
                        </div>
                        <Badge 
                          className={
                            analysis.summary.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                            analysis.summary.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {analysis.summary.riskLevel === 'low' ? 'منخفض' :
                           analysis.summary.riskLevel === 'medium' ? 'متوسط' : 'عالي'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <FileCheck className="h-5 w-5" />
                <span>التقارير المُنشأة</span>
              </CardTitle>
              <CardDescription>
                إنشاء وإدارة التقارير من نتائج التحليل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد تقارير منشأة
                  </div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{report.nameAr}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(report.generatedAt).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 ml-1" />
                            تحميل
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Processing Statistics */}
            {statistics && (
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات المعالجة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {statistics.totalDocuments}
                      </div>
                      <div className="text-sm text-gray-600">إجمالي المستندات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(statistics.successRate * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">معدل النجاح</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accuracy Metrics */}
            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle>مقاييس الدقة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>الدقة الإجمالية</span>
                      <span className="font-medium">{Math.round(metrics.overallAccuracy * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>دقة جدول الكميات</span>
                      <span className="font-medium">{Math.round(metrics.boqAccuracy * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>دقة تحليل المواصفات</span>
                      <span className="font-medium">{Math.round(metrics.specificationAccuracy * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>دقة تحديد المخاطر</span>
                      <span className="font-medium">{Math.round(metrics.riskAccuracy * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
})

NaturalLanguageProcessing.displayName = 'NaturalLanguageProcessing'

export default NaturalLanguageProcessing
