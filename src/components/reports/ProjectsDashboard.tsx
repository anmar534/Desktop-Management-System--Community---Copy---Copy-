/**
 * Projects Dashboard Component
 * لوحة معلومات المشاريع التنفيذية
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { 
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
  Filter,
  Download,
  RefreshCw,
  Eye,
  Activity
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
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import type { ProjectDashboardData } from '../../services/projectReportingService';
import { projectReportingService } from '../../services/projectReportingService'
import type { KPIDashboard } from '../../services/kpiCalculationEngine';
import { kpiCalculationEngine } from '../../services/kpiCalculationEngine'
import { enhancedProjectService } from '../../services/enhancedProjectService'
import { reportExportService } from '../../services/reportExportService'
import { toast } from 'sonner'

interface ProjectsDashboardProps {
  className?: string
}

interface DashboardFilters {
  timeframe: 'week' | 'month' | 'quarter' | 'year'
  status: 'all' | 'active' | 'completed' | 'on_hold' | 'cancelled'
  priority: 'all' | 'low' | 'medium' | 'high' | 'critical'
  category: 'all' | 'construction' | 'infrastructure' | 'maintenance' | 'development'
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ className }) => {
  const [dashboardData, setDashboardData] = useState<ProjectDashboardData | null>(null)
  const [kpiData, setKpiData] = useState<KPIDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DashboardFilters>({
    timeframe: 'month',
    status: 'all',
    priority: 'all',
    category: 'all'
  })

  useEffect(() => {
    loadDashboardData()
  }, [filters])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // جلب بيانات لوحة المعلومات
      const dashboard = await projectReportingService.generateProjectsDashboard(filters)
      setDashboardData(dashboard)

      // جلب بيانات مؤشرات الأداء
      const projects = await enhancedProjectService.getAllProjects()
      const kpis = await kpiCalculationEngine.calculateDashboardKPIs({
        projects,
        tasks: [],
        timeframe: {
          startDate: getTimeframeStartDate(filters.timeframe),
          endDate: new Date().toISOString()
        }
      })
      setKpiData(kpis)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('فشل في تحميل بيانات لوحة المعلومات')
    } finally {
      setLoading(false)
    }
  }

  const getTimeframeStartDate = (timeframe: string): string => {
    const now = new Date()
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), quarter * 3, 1).toISOString()
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString()
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />
      case 'good': return <TrendingUp className="h-4 w-4" />
      case 'warning': return <Clock className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const exportDashboard = async (format: 'pdf' | 'excel') => {
    try {
      if (!dashboardData) return

      toast.info(`جاري تصدير لوحة المعلومات بصيغة ${format.toUpperCase()}...`)

      const result = await reportExportService.exportDashboard(dashboardData, {
        format,
        includeCharts: true,
        includeDetails: true,
        language: 'ar'
      })

      if (result.success) {
        toast.success(`تم تصدير لوحة المعلومات بصيغة ${format.toUpperCase()} بنجاح`)
        // يمكن إضافة رابط التحميل هنا
        if (result.downloadUrl) {
          window.open(result.downloadUrl, '_blank')
        }
      } else {
        throw new Error(result.error || 'فشل في التصدير')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('فشل في تصدير لوحة المعلومات')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="mr-2">جاري تحميل لوحة المعلومات...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">لوحة معلومات المشاريع</h1>
          <p className="text-muted-foreground">نظرة شاملة على أداء جميع المشاريع</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportDashboard('pdf')}>
            <Download className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
          <Button variant="outline" onClick={() => exportDashboard('excel')}>
            <Download className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
          <Button onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 ml-2" />
            المرشحات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">الفترة الزمنية</label>
              <Select value={filters.timeframe} onValueChange={(value: any) => setFilters({...filters, timeframe: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">أسبوع</SelectItem>
                  <SelectItem value="month">شهر</SelectItem>
                  <SelectItem value="quarter">ربع سنة</SelectItem>
                  <SelectItem value="year">سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">الحالة</label>
              <Select value={filters.status} onValueChange={(value: any) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="on_hold">معلق</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">الأولوية</label>
              <Select value={filters.priority} onValueChange={(value: any) => setFilters({...filters, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأولويات</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="critical">حرجة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">الفئة</label>
              <Select value={filters.category} onValueChange={(value: any) => setFilters({...filters, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="construction">إنشاءات</SelectItem>
                  <SelectItem value="infrastructure">بنية تحتية</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                  <SelectItem value="development">تطوير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المشاريع</p>
                  <p className="text-2xl font-bold">{dashboardData?.summary.totalProjects || 0}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">المشاريع النشطة</p>
                  <p className="text-2xl font-bold">{dashboardData?.summary.activeProjects || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الميزانية</p>
                  <p className="text-2xl font-bold">{dashboardData?.summary.totalBudget?.toLocaleString() || 0} ر.س</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">معدل الإنجاز</p>
                  <p className="text-2xl font-bold">{dashboardData?.summary.averageProgress || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="financial">المالية</TabsTrigger>
          <TabsTrigger value="risks">المخاطر</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Projects Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>توزيع حالة المشاريع</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={dashboardData?.charts.statusDistribution || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {(dashboardData?.charts.statusDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تقدم المشاريع الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData?.charts.progressTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="progress" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Metrics */}
          {kpiData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(kpiData.categories).map(([category, kpis]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {kpis.slice(0, 3).map((kpi) => (
                      <div key={kpi.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(kpi.status)}
                          <span className="text-sm font-medium">{kpi.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{kpi.value}{kpi.unit}</span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(kpi.status)}`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          {/* Financial Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>الأداء المالي الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData?.charts.financialTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="budget" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="spent" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع الميزانية</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData?.charts.budgetDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="allocated" fill="#8884d8" />
                    <Bar dataKey="spent" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          {/* Risk Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>تحليل المخاطر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">المخاطر عالية الأولوية</h4>
                  <div className="space-y-2">
                    {dashboardData?.risks.highPriorityRisks?.slice(0, 5).map((risk, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                        <span className="text-sm">{risk.title}</span>
                        <Badge variant="destructive">{risk.level}</Badge>
                      </div>
                    )) || <p className="text-muted-foreground">لا توجد مخاطر عالية الأولوية</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">إجراءات التخفيف المطلوبة</h4>
                  <div className="space-y-2">
                    {dashboardData?.risks.mitigationActions?.slice(0, 5).map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-yellow-50">
                        <span className="text-sm">{action.title}</span>
                        <Badge variant="outline">{action.status}</Badge>
                      </div>
                    )) || <p className="text-muted-foreground">لا توجد إجراءات مطلوبة</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProjectsDashboard
