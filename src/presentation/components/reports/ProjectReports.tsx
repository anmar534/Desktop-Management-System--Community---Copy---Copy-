/**
 * Project Reports Component
 * مكون التقارير المتقدمة للمشاريع
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
// import { DatePickerWithRange } from '../ui/date-range-picker'
import { 
  FileText, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Printer
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import type { ProjectStatusReport, ProjectDashboardData } from '../../services/projectReportingService';
import { projectReportingService } from '../../services/projectReportingService'
import type { KPIDashboard } from '../../services/kpiCalculationEngine';
import { kpiCalculationEngine } from '../../services/kpiCalculationEngine'
import { toast } from 'sonner'

interface ProjectReportsProps {
  projectId?: string
  className?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

export const ProjectReports: React.FC<ProjectReportsProps> = ({
  projectId,
  className = ''
}) => {
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<'status' | 'evm' | 'kpi' | 'dashboard'>('status')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    to: new Date()
  })
  const [statusReport, setStatusReport] = useState<ProjectStatusReport | null>(null)
  const [dashboardData, setDashboardData] = useState<ProjectDashboardData | null>(null)
  const [kpiData, setKpiData] = useState<KPIDashboard | null>(null)

  useEffect(() => {
    loadReportData()
  }, [selectedReport, projectId, dateRange])

  const loadReportData = async () => {
    try {
      setLoading(true)
      
      switch (selectedReport) {
        case 'status':
          if (projectId) {
            const report = await projectReportingService.generateProjectStatusReport(projectId)
            setStatusReport(report)
          }
          break
          
        case 'dashboard':
          const dashboard = await projectReportingService.generateProjectsDashboard()
          setDashboardData(dashboard)
          break
          
        case 'kpi':
          // سيتم تطوير تحميل بيانات KPI لاحقاً
          break
          
        default:
          break
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات التقرير:', error)
      toast.error('فشل في تحميل بيانات التقرير')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      toast.success(`جاري تصدير التقرير بصيغة ${format.toUpperCase()}...`)
      // سيتم تطوير وظيفة التصدير لاحقاً
    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error)
      toast.error('فشل في تصدير التقرير')
    }
  }

  const printReport = () => {
    window.print()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-100 text-green-800'
      case 'at_risk': return 'bg-yellow-100 text-yellow-800'
      case 'delayed': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_track': return 'في المسار الصحيح'
      case 'at_risk': return 'معرض للخطر'
      case 'delayed': return 'متأخر'
      case 'critical': return 'حرج'
      default: return 'غير محدد'
    }
  }

  const StatusReportView: React.FC<{ report: ProjectStatusReport }> = ({ report }) => (
    <div className="space-y-6">
      {/* الملخص التنفيذي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            الملخص التنفيذي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge className={getStatusColor(report.executiveSummary.overallStatus)}>
                {getStatusLabel(report.executiveSummary.overallStatus)}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">الحالة العامة</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold">{formatPercentage(report.executiveSummary.completionPercentage)}</p>
              <p className="text-sm text-muted-foreground">نسبة الإنجاز</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold">{report.executiveSummary.daysRemaining}</p>
              <p className="text-sm text-muted-foreground">أيام متبقية</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold">{formatPercentage(report.executiveSummary.budgetUtilization)}</p>
              <p className="text-sm text-muted-foreground">استخدام الميزانية</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-700">الإنجازات الرئيسية</h4>
              <ul className="space-y-1">
                {report.executiveSummary.keyAchievements.map((achievement, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-orange-700">التحديات الرئيسية</h4>
              <ul className="space-y-1">
                {report.executiveSummary.majorChallenges.map((challenge, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-blue-700">الخطوات التالية</h4>
              <ul className="space-y-1">
                {report.executiveSummary.nextSteps.map((step, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل الأداء */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أداء الجدولة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              أداء الجدولة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>التقدم المخطط</span>
                <span className="font-medium">{formatPercentage(report.performance.schedule.plannedProgress)}</span>
              </div>
              <div className="flex justify-between">
                <span>التقدم الفعلي</span>
                <span className="font-medium">{formatPercentage(report.performance.schedule.actualProgress)}</span>
              </div>
              <div className="flex justify-between">
                <span>الانحراف</span>
                <span className={`font-medium ${report.performance.schedule.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {report.performance.schedule.variance >= 0 ? '+' : ''}{formatPercentage(report.performance.schedule.variance)}
                </span>
              </div>
            </div>
            
            {report.performance.schedule.criticalPath.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">المسار الحرج</h5>
                <ul className="space-y-1">
                  {report.performance.schedule.criticalPath.map((task, index) => (
                    <li key={index} className="text-sm text-muted-foreground">• {task}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* أداء الميزانية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              أداء الميزانية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>إجمالي الميزانية</span>
                <span className="font-medium">{formatCurrency(report.performance.budget.totalBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span>المنفق حتى الآن</span>
                <span className="font-medium">{formatCurrency(report.performance.budget.spentToDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>المتبقي</span>
                <span className="font-medium">{formatCurrency(report.performance.budget.remainingBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span>التوقع عند الإكمال</span>
                <span className={`font-medium ${
                  report.performance.budget.forecastAtCompletion <= report.performance.budget.totalBudget 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(report.performance.budget.forecastAtCompletion)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* المخاطر والموارد */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              المخاطر والقضايا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{report.risksAndIssues.activeRisks}</p>
                <p className="text-sm text-muted-foreground">مخاطر نشطة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{report.risksAndIssues.resolvedRisks}</p>
                <p className="text-sm text-muted-foreground">مخاطر محلولة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{report.risksAndIssues.criticalIssues}</p>
                <p className="text-sm text-muted-foreground">قضايا حرجة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{report.risksAndIssues.openIssues}</p>
                <p className="text-sm text-muted-foreground">قضايا مفتوحة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              الموارد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>حجم الفريق</span>
                <span className="font-medium">{report.resources.teamSize} عضو</span>
              </div>
              <div className="flex justify-between">
                <span>معدل الاستخدام</span>
                <span className="font-medium">{formatPercentage(report.resources.utilization)}</span>
              </div>
              
              {report.resources.skillGaps.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">فجوات المهارات</h5>
                  <ul className="space-y-1">
                    {report.resources.skillGaps.map((gap, index) => (
                      <li key={index} className="text-sm text-muted-foreground">• {gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const DashboardView: React.FC<{ data: ProjectDashboardData }> = ({ data }) => (
    <div className="space-y-6">
      {/* نظرة عامة */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{data.projectsOverview.totalProjects}</p>
            <p className="text-sm text-muted-foreground">إجمالي المشاريع</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{data.projectsOverview.activeProjects}</p>
            <p className="text-sm text-muted-foreground">مشاريع نشطة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{data.projectsOverview.completedProjects}</p>
            <p className="text-sm text-muted-foreground">مشاريع مكتملة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{data.projectsOverview.delayedProjects}</p>
            <p className="text-sm text-muted-foreground">مشاريع متأخرة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{data.projectsOverview.onBudgetProjects}</p>
            <p className="text-sm text-muted-foreground">ضمن الميزانية</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{data.projectsOverview.overBudgetProjects}</p>
            <p className="text-sm text-muted-foreground">تجاوز الميزانية</p>
          </CardContent>
        </Card>
      </div>

      {/* الملخص المالي */}
      <Card>
        <CardHeader>
          <CardTitle>الملخص المالي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(data.financialSummary.totalPortfolioValue)}</p>
              <p className="text-sm text-muted-foreground">قيمة المحفظة الإجمالية</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.financialSummary.totalSpent)}</p>
              <p className="text-sm text-muted-foreground">إجمالي المنفق</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.financialSummary.totalRemaining)}</p>
              <p className="text-sm text-muted-foreground">المتبقي</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data.financialSummary.projectedOverrun)}</p>
              <p className="text-sm text-muted-foreground">التجاوز المتوقع</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أفضل المشاريع أداءً والمشاريع المعرضة للخطر */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              أفضل المشاريع أداءً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPerformingProjects.map((project, index) => (
                <div key={project.projectId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{project.projectName}</p>
                    <p className="text-sm text-muted-foreground">
                      إنجاز: {formatPercentage(project.completionRate)}
                    </p>
                  </div>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              مشاريع معرضة للخطر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.projectsAtRisk.map((project) => (
                <div key={project.projectId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{project.projectName}</p>
                    <p className="text-sm text-muted-foreground">{project.primaryRisk}</p>
                  </div>
                  <Badge variant={project.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                    {project.riskLevel === 'high' && 'عالي'}
                    {project.riskLevel === 'medium' && 'متوسط'}
                    {project.riskLevel === 'low' && 'منخفض'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل التقرير...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* رأس التقارير */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">التقارير المتقدمة</h2>
          <p className="text-muted-foreground">تقارير شاملة وتحليلات متقدمة للمشاريع</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={printReport}>
            <Printer className="w-4 h-4 mr-2" />
            طباعة
          </Button>
          
          <Select onValueChange={(value) => exportReport(value as 'pdf' | 'excel' | 'csv')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="تصدير" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* فلاتر التقارير */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={selectedReport} onValueChange={(value) => setSelectedReport(value as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">تقرير حالة المشروع</SelectItem>
                <SelectItem value="evm">تقرير إدارة القيمة المكتسبة</SelectItem>
                <SelectItem value="kpi">مؤشرات الأداء الرئيسية</SelectItem>
                <SelectItem value="dashboard">لوحة معلومات المشاريع</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="w-64 p-2 border rounded-md">
              <span className="text-sm text-muted-foreground">تحديد نطاق التاريخ</span>
            </div>
            
            <Button variant="outline" size="sm" onClick={loadReportData}>
              <Filter className="w-4 h-4 mr-2" />
              تطبيق الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* محتوى التقرير */}
      <div className="min-h-[600px]">
        {selectedReport === 'status' && statusReport && (
          <StatusReportView report={statusReport} />
        )}
        
        {selectedReport === 'dashboard' && dashboardData && (
          <DashboardView data={dashboardData} />
        )}
        
        {selectedReport === 'evm' && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">تقرير إدارة القيمة المكتسبة</h3>
            <p className="text-muted-foreground">سيتم تطوير هذا التقرير قريباً</p>
          </div>
        )}
        
        {selectedReport === 'kpi' && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">مؤشرات الأداء الرئيسية</h3>
            <p className="text-muted-foreground">سيتم تطوير هذا التقرير قريباً</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectReports

