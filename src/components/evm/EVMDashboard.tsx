/**
 * EVM Dashboard Component
 * مكون لوحة معلومات إدارة القيمة المكتسبة
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts'
import { EVMMetrics, EVMDashboardData, EVMAlert } from '../../types/evm'
import { earnedValueCalculator } from '../../services/earnedValueCalculator'
import { toast } from 'sonner'

interface EVMDashboardProps {
  projectId: string
  className?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export const EVMDashboard: React.FC<EVMDashboardProps> = ({
  projectId,
  className = ''
}) => {
  const [dashboardData, setDashboardData] = useState<EVMDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    loadDashboardData()
  }, [projectId, selectedPeriod])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // هنا سيتم تحميل البيانات من الخدمة
      // مؤقتاً سنستخدم بيانات تجريبية
      const mockData: EVMDashboardData = {
        projectId,
        lastUpdated: new Date().toISOString(),
        keyMetrics: {
          plannedValue: 500000,
          earnedValue: 450000,
          actualCost: 480000,
          budgetAtCompletion: 1000000,
          costVariance: -30000,
          scheduleVariance: -50000,
          costPerformanceIndex: 0.94,
          schedulePerformanceIndex: 0.90,
          estimateAtCompletion: 1063830,
          estimateToComplete: 583830,
          varianceAtCompletion: -63830,
          toCompletePerformanceIndex: 1.12,
          percentComplete: 45,
          percentPlanned: 50,
          statusDate: new Date().toISOString(),
          plannedCompletionDate: '2024-12-31',
          forecastCompletionDate: '2025-01-15'
        },
        charts: {
          performanceTrend: [
            { date: '2024-01', plannedValue: 100000, earnedValue: 95000, actualCost: 98000, cpi: 0.97, spi: 0.95 },
            { date: '2024-02', plannedValue: 200000, earnedValue: 190000, actualCost: 195000, cpi: 0.97, spi: 0.95 },
            { date: '2024-03', plannedValue: 300000, earnedValue: 285000, actualCost: 290000, cpi: 0.98, spi: 0.95 },
            { date: '2024-04', plannedValue: 400000, earnedValue: 375000, actualCost: 385000, cpi: 0.97, spi: 0.94 },
            { date: '2024-05', plannedValue: 500000, earnedValue: 450000, actualCost: 480000, cpi: 0.94, spi: 0.90 }
          ],
          costBreakdown: [
            { category: 'عمالة', planned: 400000, actual: 420000 },
            { category: 'مواد', planned: 300000, actual: 280000 },
            { category: 'معدات', planned: 200000, actual: 210000 },
            { category: 'مقاولين', planned: 100000, actual: 90000 }
          ],
          scheduleProgress: [
            { phase: 'التخطيط', planned: 100, actual: 100 },
            { phase: 'التصميم', planned: 100, actual: 95 },
            { phase: 'التنفيذ', planned: 60, actual: 45 },
            { phase: 'الاختبار', planned: 0, actual: 0 }
          ],
          varianceAnalysis: [
            { period: 'يناير', costVariance: -3000, scheduleVariance: -5000 },
            { period: 'فبراير', costVariance: -5000, scheduleVariance: -10000 },
            { period: 'مارس', costVariance: -5000, scheduleVariance: -15000 },
            { period: 'أبريل', costVariance: -10000, scheduleVariance: -25000 },
            { period: 'مايو', costVariance: -30000, scheduleVariance: -50000 }
          ]
        },
        activeAlerts: [
          {
            id: '1',
            projectId,
            type: 'schedule_delay',
            severity: 'high',
            title: 'تأخير في الجدولة',
            message: 'المشروع متأخر بـ 15 يوم عن الخطة',
            threshold: 0.9,
            currentValue: 0.85,
            createdAt: new Date().toISOString(),
            isRead: false,
            isActive: true
          }
        ],
        milestones: [
          {
            id: '1',
            title: 'إكمال التصميم',
            plannedDate: '2024-03-31',
            actualDate: '2024-04-05',
            status: 'completed'
          },
          {
            id: '2',
            title: 'بداية التنفيذ',
            plannedDate: '2024-04-01',
            actualDate: '2024-04-10',
            status: 'completed'
          },
          {
            id: '3',
            title: 'إكمال 50% من التنفيذ',
            plannedDate: '2024-06-30',
            status: 'at_risk'
          }
        ],
        kpis: [
          { name: 'مؤشر أداء التكلفة', value: 0.94, target: 1.0, trend: 'down', status: 'warning' },
          { name: 'مؤشر أداء الجدولة', value: 0.90, target: 1.0, trend: 'down', status: 'warning' },
          { name: 'نسبة الإنجاز', value: 45, target: 50, trend: 'up', status: 'warning' },
          { name: 'الميزانية المتبقية', value: 52, target: 55, trend: 'down', status: 'good' }
        ]
      }
      
      setDashboardData(mockData)
    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة المعلومات:', error)
      toast.error('فشل في تحميل بيانات لوحة المعلومات')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getHealthStatus = (metrics: EVMMetrics) => {
    if (metrics.costPerformanceIndex >= 0.95 && metrics.schedulePerformanceIndex >= 0.95) {
      return { status: 'excellent', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> }
    } else if (metrics.costPerformanceIndex >= 0.90 && metrics.schedulePerformanceIndex >= 0.90) {
      return { status: 'good', color: 'bg-blue-100 text-blue-800', icon: <Target className="w-4 h-4" /> }
    } else if (metrics.costPerformanceIndex >= 0.80 || metrics.schedulePerformanceIndex >= 0.80) {
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="w-4 h-4" /> }
    } else {
      return { status: 'critical', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-4 h-4" /> }
    }
  }

  const MetricCard: React.FC<{
    title: string
    value: string | number
    subtitle?: string
    trend?: 'up' | 'down' | 'stable'
    status?: 'good' | 'warning' | 'critical'
    icon?: React.ReactNode
  }> = ({ title, value, subtitle, trend, status, icon }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            {trend && (
              <div className={`text-xs ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل لوحة المعلومات...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">لا توجد بيانات</h3>
        <p className="text-muted-foreground">لم يتم العثور على بيانات لوحة المعلومات</p>
      </div>
    )
  }

  const { keyMetrics } = dashboardData
  const healthStatus = getHealthStatus(keyMetrics)

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* رأس لوحة المعلومات */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">لوحة معلومات إدارة القيمة المكتسبة</h2>
          <p className="text-muted-foreground">
            آخر تحديث: {new Intl.DateTimeFormat('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(dashboardData.lastUpdated))}
          </p>
        </div>
        
        <Badge className={healthStatus.color}>
          {healthStatus.icon}
          <span className="mr-1">
            {healthStatus.status === 'excellent' && 'ممتاز'}
            {healthStatus.status === 'good' && 'جيد'}
            {healthStatus.status === 'warning' && 'تحذير'}
            {healthStatus.status === 'critical' && 'حرج'}
          </span>
        </Badge>
      </div>

      {/* المقاييس الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="مؤشر أداء التكلفة (CPI)"
          value={keyMetrics.costPerformanceIndex.toFixed(2)}
          subtitle={keyMetrics.costPerformanceIndex >= 1 ? 'ضمن الميزانية' : 'تجاوز الميزانية'}
          trend={keyMetrics.costPerformanceIndex >= 1 ? 'up' : 'down'}
          icon={<DollarSign className="w-5 h-5" />}
        />
        
        <MetricCard
          title="مؤشر أداء الجدولة (SPI)"
          value={keyMetrics.schedulePerformanceIndex.toFixed(2)}
          subtitle={keyMetrics.schedulePerformanceIndex >= 1 ? 'في الموعد' : 'متأخر'}
          trend={keyMetrics.schedulePerformanceIndex >= 1 ? 'up' : 'down'}
          icon={<Clock className="w-5 h-5" />}
        />
        
        <MetricCard
          title="نسبة الإنجاز"
          value={`${keyMetrics.percentComplete.toFixed(1)}%`}
          subtitle={`مخطط: ${keyMetrics.percentPlanned.toFixed(1)}%`}
          trend={keyMetrics.percentComplete >= keyMetrics.percentPlanned ? 'up' : 'down'}
          icon={<Target className="w-5 h-5" />}
        />
        
        <MetricCard
          title="التقدير عند الإكمال"
          value={formatCurrency(keyMetrics.estimateAtCompletion)}
          subtitle={`الميزانية: ${formatCurrency(keyMetrics.budgetAtCompletion)}`}
          trend={keyMetrics.estimateAtCompletion <= keyMetrics.budgetAtCompletion ? 'up' : 'down'}
          icon={<BarChart3 className="w-5 h-5" />}
        />
      </div>

      {/* التنبيهات النشطة */}
      {dashboardData.activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              التنبيهات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.activeAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <div className="flex-1">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity === 'critical' && 'حرج'}
                    {alert.severity === 'high' && 'عالي'}
                    {alert.severity === 'medium' && 'متوسط'}
                    {alert.severity === 'low' && 'منخفض'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* الرسوم البيانية */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">اتجاه الأداء</TabsTrigger>
          <TabsTrigger value="cost">تحليل التكلفة</TabsTrigger>
          <TabsTrigger value="schedule">تقدم الجدولة</TabsTrigger>
          <TabsTrigger value="variance">تحليل الانحراف</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اتجاه أداء المشروع</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={dashboardData.charts.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'plannedValue' ? 'القيمة المخططة' :
                    name === 'earnedValue' ? 'القيمة المكتسبة' : 'التكلفة الفعلية'
                  ]} />
                  <Line type="monotone" dataKey="plannedValue" stroke="#8884d8" name="القيمة المخططة" />
                  <Line type="monotone" dataKey="earnedValue" stroke="#82ca9d" name="القيمة المكتسبة" />
                  <Line type="monotone" dataKey="actualCost" stroke="#ffc658" name="التكلفة الفعلية" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليل التكلفة حسب الفئة</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.charts.costBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="planned" fill="#8884d8" name="مخطط" />
                  <Bar dataKey="actual" fill="#82ca9d" name="فعلي" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تقدم الجدولة حسب المرحلة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.charts.scheduleProgress.map((phase, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{phase.phase}</span>
                      <span>{phase.actual}% / {phase.planned}%</span>
                    </div>
                    <div className="relative">
                      <Progress value={phase.planned} className="h-2 bg-gray-200" />
                      <Progress 
                        value={phase.actual} 
                        className={`h-2 absolute top-0 ${
                          phase.actual >= phase.planned ? 'bg-green-500' : 'bg-orange-500'
                        }`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليل الانحراف الشهري</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.charts.varianceAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="costVariance" fill="#ff7300" name="انحراف التكلفة" />
                  <Bar dataKey="scheduleVariance" fill="#387908" name="انحراف الجدولة" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* مؤشرات الأداء الرئيسية */}
      <Card>
        <CardHeader>
          <CardTitle>مؤشرات الأداء الرئيسية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.kpis.map((kpi, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{kpi.name}</span>
                  <Badge variant={
                    kpi.status === 'good' ? 'default' :
                    kpi.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {kpi.status === 'good' && 'جيد'}
                    {kpi.status === 'warning' && 'تحذير'}
                    {kpi.status === 'critical' && 'حرج'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>الحالي: {kpi.value}</span>
                  <span>الهدف: {kpi.target}</span>
                </div>
                <Progress value={(kpi.value / kpi.target) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EVMDashboard
