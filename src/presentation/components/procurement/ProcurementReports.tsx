import type React from 'react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Progress } from '../ui/progress'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react'
import type { ProcurementReport } from '@/services/procurementReportingService'
import { procurementReportingService } from '@/services/procurementReportingService'
import { toast } from 'sonner'

interface ProcurementReportsProps {
  className?: string
}

export function ProcurementReports({ className }: ProcurementReportsProps) {
  const [reports, setReports] = useState<ProcurementReport[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<ProcurementReport | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // تحميل التقارير
  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const allReports = await procurementReportingService.getAllReports()
      setReports(allReports)
    } catch (error) {
      console.error('خطأ في تحميل التقارير:', error)
      toast.error('فشل في تحميل التقارير')
    } finally {
      setLoading(false)
    }
  }

  // تصفية التقارير
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.titleEn?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || report.type === selectedType
    return matchesSearch && matchesType
  })

  // إنشاء تقرير جديد
  const generateReport = async (
    type: string,
    startDate: string,
    endDate: string,
    filters: any = {},
  ) => {
    try {
      setIsGenerating(true)
      let report: ProcurementReport

      switch (type) {
        case 'purchase_orders':
          report = await procurementReportingService.generatePurchaseOrderReport(
            startDate,
            endDate,
            filters,
          )
          break
        case 'supplier_performance':
          report = await procurementReportingService.generateSupplierPerformanceReport(
            startDate,
            endDate,
            filters.supplierIds,
          )
          break
        case 'inventory_valuation':
          report = await procurementReportingService.generateInventoryValuationReport()
          break
        case 'trend_analysis':
          report = await procurementReportingService.generateTrendAnalysisReport(
            filters.metric || 'purchase_value',
            filters.period || 'monthly',
            startDate,
            endDate,
          )
          break
        default:
          throw new Error('نوع التقرير غير مدعوم')
      }

      await loadReports()
      toast.success('تم إنشاء التقرير بنجاح')
      setSelectedReport(report)
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error)
      toast.error('فشل في إنشاء التقرير')
    } finally {
      setIsGenerating(false)
    }
  }

  // تصدير التقرير
  const exportReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      const exportedFile = await procurementReportingService.exportReport(reportId, format)
      toast.success(`تم تصدير التقرير: ${exportedFile}`)
    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error)
      toast.error('فشل في تصدير التقرير')
    }
  }

  // حذف التقرير
  const deleteReport = async (reportId: string) => {
    try {
      await procurementReportingService.deleteReport(reportId)
      await loadReports()
      toast.success('تم حذف التقرير بنجاح')
    } catch (error) {
      console.error('خطأ في حذف التقرير:', error)
      toast.error('فشل في حذف التقرير')
    }
  }

  // الحصول على أيقونة نوع التقرير
  const getReportIcon = (type: string) => {
    switch (type) {
      case 'purchase_orders':
        return <FileText className="h-4 w-4" />
      case 'supplier_performance':
        return <Users className="h-4 w-4" />
      case 'inventory_valuation':
        return <Package className="h-4 w-4" />
      case 'trend_analysis':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  // الحصول على لون حالة التقرير
  const getStatusColor = (type: string) => {
    switch (type) {
      case 'purchase_orders':
        return 'bg-blue-500'
      case 'supplier_performance':
        return 'bg-green-500'
      case 'inventory_valuation':
        return 'bg-purple-500'
      case 'trend_analysis':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تقارير المشتريات</h1>
          <p className="text-gray-600 mt-2">إنشاء وإدارة تقارير المشتريات والتحليلات</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadReports} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <GenerateReportDialog onGenerate={generateReport} isGenerating={isGenerating} />
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي التقارير</p>
                  <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">تقارير الأداء</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.type === 'supplier_performance').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">تقارير المخزون</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.type === 'inventory_valuation').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">تحليل الاتجاهات</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.type === 'trend_analysis').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في التقارير..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التقارير</SelectItem>
                  <SelectItem value="purchase_orders">أوامر الشراء</SelectItem>
                  <SelectItem value="supplier_performance">أداء الموردين</SelectItem>
                  <SelectItem value="inventory_valuation">تقييم المخزون</SelectItem>
                  <SelectItem value="trend_analysis">تحليل الاتجاهات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة التقارير */}
      <Card>
        <CardHeader>
          <CardTitle>التقارير المحفوظة</CardTitle>
          <CardDescription>جميع التقارير التي تم إنشاؤها مع إمكانية العرض والتصدير</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="mr-2 text-gray-600">جاري التحميل...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد تقارير متاحة</p>
              <p className="text-sm text-gray-500 mt-2">ابدأ بإنشاء تقرير جديد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onView={() => setSelectedReport(report)}
                  onExport={exportReport}
                  onDelete={deleteReport}
                  getIcon={getReportIcon}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* مربع حوار عرض التقرير */}
      {selectedReport && (
        <ReportViewDialog
          report={selectedReport}
          open={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          onExport={exportReport}
        />
      )}
    </div>
  )
}

// مكون بطاقة التقرير
interface ReportCardProps {
  report: ProcurementReport
  onView: () => void
  onExport: (reportId: string, format: 'pdf' | 'excel' | 'csv') => void
  onDelete: (reportId: string) => void
  getIcon: (type: string) => React.ReactNode
  getStatusColor: (type: string) => string
}

function ReportCard({
  report,
  onView,
  onExport,
  onDelete,
  getIcon,
  getStatusColor,
}: ReportCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase_orders':
        return 'أوامر الشراء'
      case 'supplier_performance':
        return 'أداء الموردين'
      case 'inventory_valuation':
        return 'تقييم المخزون'
      case 'trend_analysis':
        return 'تحليل الاتجاهات'
      default:
        return 'تقرير عام'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div
            className={`p-2 rounded-lg ${getStatusColor(report.type).replace('bg-', 'bg-opacity-20 bg-')}`}
          >
            {getIcon(report.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{report.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{getTypeLabel(report.type)}</Badge>
              <span className="text-sm text-gray-500">{formatDate(report.generatedAt)}</span>
            </div>
            {report.period.startDate && report.period.endDate && (
              <p className="text-sm text-gray-600 mt-1">
                الفترة: {formatDate(report.period.startDate)} - {formatDate(report.period.endDate)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {report.summary.totalRecords.toLocaleString()} سجل
            </p>
            <p className="text-sm text-gray-600">
              {report.summary.totalValue.toLocaleString()} ر.س
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button onClick={onView} variant="outline" size="sm">
              <FileText className="h-4 w-4 ml-1" />
              عرض
            </Button>

            <Select onValueChange={(format) => onExport(report.id, format as any)}>
              <SelectTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 ml-1" />
                  تصدير
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => onDelete(report.id)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              حذف
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// مربع حوار إنشاء تقرير جديد
interface GenerateReportDialogProps {
  onGenerate: (type: string, startDate: string, endDate: string, filters?: any) => void
  isGenerating: boolean
}

function GenerateReportDialog({ onGenerate, isGenerating }: GenerateReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reportType, setReportType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filters, setFilters] = useState<any>({})

  const handleGenerate = () => {
    if (!reportType) {
      toast.error('يرجى اختيار نوع التقرير')
      return
    }

    if (reportType !== 'inventory_valuation' && (!startDate || !endDate)) {
      toast.error('يرجى تحديد فترة التقرير')
      return
    }

    onGenerate(reportType, startDate, endDate, filters)
    setOpen(false)
    setReportType('')
    setStartDate('')
    setEndDate('')
    setFilters({})
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="h-4 w-4 ml-2" />
          إنشاء تقرير جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إنشاء تقرير جديد</DialogTitle>
          <DialogDescription>اختر نوع التقرير والفترة الزمنية المطلوبة</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">نوع التقرير</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع التقرير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase_orders">تقرير أوامر الشراء</SelectItem>
                <SelectItem value="supplier_performance">تقرير أداء الموردين</SelectItem>
                <SelectItem value="inventory_valuation">تقرير تقييم المخزون</SelectItem>
                <SelectItem value="trend_analysis">تحليل الاتجاهات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType !== 'inventory_valuation' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  تاريخ البداية
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  تاريخ النهاية
                </label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 ml-2" />
                  إنشاء التقرير
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// مربع حوار عرض التقرير
interface ReportViewDialogProps {
  report: ProcurementReport
  open: boolean
  onClose: () => void
  onExport: (reportId: string, format: 'pdf' | 'excel' | 'csv') => void
}

function ReportViewDialog({ report, open, onClose, onExport }: ReportViewDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {report.title}
          </DialogTitle>
          <DialogDescription>تم إنشاؤه في {formatDate(report.generatedAt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ملخص التقرير */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص التقرير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {report.summary.totalRecords.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">إجمالي السجلات</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(report.summary.totalValue)}
                  </p>
                  <p className="text-sm text-gray-600">إجمالي القيمة</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(report.summary.averageValue)}
                  </p>
                  <p className="text-sm text-gray-600">متوسط القيمة</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {report.summary.trends.direction === 'increasing' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : report.summary.trends.direction === 'decreasing' ? (
                      <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                    ) : (
                      <div className="h-4 w-4 bg-gray-400 rounded-full" />
                    )}
                    <span className="text-lg font-bold">
                      {Math.abs(report.summary.trends.percentage).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">الاتجاه</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أفضل الأداءات */}
          {report.summary.topPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>أفضل الأداءات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.summary.topPerformers.map((performer, index) => (
                    <div
                      key={performer.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{performer.name}</p>
                          <p className="text-sm text-gray-600">{performer.metric}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">
                          {typeof performer.value === 'number' &&
                          performer.metric.includes('القيمة')
                            ? formatCurrency(performer.value)
                            : performer.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* أزرار التصدير */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            <Select onValueChange={(format) => onExport(report.id, format as any)}>
              <SelectTrigger asChild>
                <Button>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير التقرير
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">تصدير PDF</SelectItem>
                <SelectItem value="excel">تصدير Excel</SelectItem>
                <SelectItem value="csv">تصدير CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
