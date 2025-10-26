/**
 * مكون تحليل الربحية
 * Profitability Analysis Component
 *
 * عرض شامل لتحليل ربحية المشاريع والعملاء مع المقارنات والاتجاهات
 * Comprehensive display of project and client profitability analysis with comparisons and trends
 */

import type React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  Target,
  Award,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react'
import type {
  ProjectProfitability,
  ClientProfitability,
} from '@/application/services/profitabilityAnalysisService'
import { ProfitabilityAnalysisService } from '@/application/services/profitabilityAnalysisService'

interface ProfitabilityAnalysisProps {
  className?: string
}

const profitabilityService = new ProfitabilityAnalysisService()

export const ProfitabilityAnalysis: React.FC<ProfitabilityAnalysisProps> = ({ className }) => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [topProjects, setTopProjects] = useState<ProjectProfitability[]>([])
  const [topClients, setTopClients] = useState<ClientProfitability[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // تحميل البيانات
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [projects, clients] = await Promise.all([
        profitabilityService.getMostProfitableProjects(10),
        profitabilityService.getMostProfitableClients(10),
      ])

      setTopProjects(projects)
      setTopClients(clients)
    } catch (error) {
      console.error('Error loading profitability data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await profitabilityService.refreshAllData()
      await loadData()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // حساب الإحصائيات العامة
  const totalProjectsRevenue = topProjects.reduce((sum, p) => sum + p.totalRevenue, 0)
  const totalProjectsProfit = topProjects.reduce((sum, p) => sum + p.netProfit, 0)
  const averageProjectMargin =
    topProjects.length > 0
      ? topProjects.reduce((sum, p) => sum + p.netProfitMargin, 0) / topProjects.length
      : 0

  const totalClientsRevenue = topClients.reduce((sum, c) => sum + c.totalRevenue, 0)
  const totalClientsProfit = topClients.reduce((sum, c) => sum + c.totalProfit, 0)
  const averageClientMargin =
    topClients.length > 0
      ? topClients.reduce((sum, c) => sum + c.averageProfitMargin, 0) / topClients.length
      : 0

  // بيانات المخططات
  const projectChartData = topProjects.slice(0, 5).map((p) => ({
    name: p.projectName.length > 20 ? p.projectName.substring(0, 20) + '...' : p.projectName,
    revenue: p.totalRevenue,
    profit: p.netProfit,
    margin: p.netProfitMargin,
  }))

  const clientChartData = topClients.slice(0, 5).map((c) => ({
    name: c.clientName.length > 15 ? c.clientName.substring(0, 15) + '...' : c.clientName,
    revenue: c.totalRevenue,
    profit: c.totalProfit,
    margin: c.averageProfitMargin,
    projects: c.totalProjects,
  }))

  const profitabilityDistribution = [
    {
      name: 'مشاريع عالية الربحية',
      value: topProjects.filter((p) => p.netProfitMargin >= 20).length,
      color: '#10b981',
    },
    {
      name: 'مشاريع متوسطة الربحية',
      value: topProjects.filter((p) => p.netProfitMargin >= 10 && p.netProfitMargin < 20).length,
      color: '#f59e0b',
    },
    {
      name: 'مشاريع منخفضة الربحية',
      value: topProjects.filter((p) => p.netProfitMargin < 10).length,
      color: '#ef4444',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>جاري تحميل تحليل الربحية...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">تحليل الربحية</h1>
          <p className="text-muted-foreground">تحليل شامل لربحية المشاريع والعملاء</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 ml-2" />
            تصفية
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي إيرادات المشاريع</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProjectsRevenue.toLocaleString('ar-SA')} ر.س
            </div>
            <p className="text-xs text-muted-foreground">من {topProjects.length} مشروع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي أرباح المشاريع</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalProjectsProfit.toLocaleString('ar-SA')} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط الهامش: {averageProjectMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي إيرادات العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClientsRevenue.toLocaleString('ar-SA')} ر.س
            </div>
            <p className="text-xs text-muted-foreground">من {topClients.length} عميل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي أرباح العملاء</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalClientsProfit.toLocaleString('ar-SA')} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط الهامش: {averageClientMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="projects">ربحية المشاريع</TabsTrigger>
          <TabsTrigger value="clients">ربحية العملاء</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* مخطط توزيع الربحية */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع الربحية</CardTitle>
                <CardDescription>تصنيف المشاريع حسب مستوى الربحية</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={profitabilityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {profitabilityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* أفضل المشاريع ربحية */}
            <Card>
              <CardHeader>
                <CardTitle>أفضل المشاريع ربحية</CardTitle>
                <CardDescription>المشاريع الخمسة الأكثر ربحية</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString('ar-SA')} ر.س`,
                        name === 'revenue' ? 'الإيرادات' : name === 'profit' ? 'الربح' : 'الهامش',
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="الإيرادات" />
                    <Bar dataKey="profit" fill="#10b981" name="الربح" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ربحية المشاريع */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل ربحية المشاريع</CardTitle>
              <CardDescription>تحليل مفصل لربحية كل مشروع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProjects.map((project, index) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{project.projectName}</h3>
                        <p className="text-sm text-muted-foreground">{project.clientName}</p>
                      </div>
                      <div className="text-left">
                        <Badge
                          variant={
                            project.netProfitMargin >= 20
                              ? 'default'
                              : project.netProfitMargin >= 10
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">الإيرادات</p>
                        <p className="font-semibold">
                          {project.totalRevenue.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">التكاليف</p>
                        <p className="font-semibold">
                          {project.totalCosts.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">الربح الصافي</p>
                        <p className="font-semibold text-green-600">
                          {project.netProfit.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">هامش الربح</p>
                        <p className="font-semibold">{project.netProfitMargin.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>هامش الربح</span>
                        <span>{project.netProfitMargin.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(project.netProfitMargin, 100)} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">العائد على الاستثمار</p>
                        <p className="font-medium">{project.roi.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">الربح اليومي</p>
                        <p className="font-medium">
                          {project.profitPerDay.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">المدة</p>
                        <p className="font-medium">{project.duration} يوم</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ربحية العملاء */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل ربحية العملاء</CardTitle>
              <CardDescription>تحليل مفصل لربحية كل عميل</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={client.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{client.clientName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {client.totalProjects} مشروع • الفئة:{' '}
                          {client.clientTier === 'platinum'
                            ? 'بلاتينية'
                            : client.clientTier === 'gold'
                              ? 'ذهبية'
                              : client.clientTier === 'silver'
                                ? 'فضية'
                                : 'برونزية'}
                        </p>
                      </div>
                      <div className="text-left">
                        <Badge
                          variant={
                            client.clientTier === 'platinum'
                              ? 'default'
                              : client.clientTier === 'gold'
                                ? 'secondary'
                                : client.clientTier === 'silver'
                                  ? 'outline'
                                  : 'destructive'
                          }
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                        <p className="font-semibold">
                          {client.totalRevenue.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">إجمالي التكاليف</p>
                        <p className="font-semibold">
                          {client.totalCosts.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">إجمالي الأرباح</p>
                        <p className="font-semibold text-green-600">
                          {client.totalProfit.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">متوسط الهامش</p>
                        <p className="font-semibold">{client.averageProfitMargin.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>متوسط هامش الربح</span>
                        <span>{client.averageProfitMargin.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(client.averageProfitMargin, 100)} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">متوسط قيمة المشروع</p>
                        <p className="font-medium">
                          {client.averageProjectValue.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">قيمة العميل مدى الحياة</p>
                        <p className="font-medium">
                          {client.clientLifetimeValue.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">معدل الاحتفاظ</p>
                        <p className="font-medium">{client.clientRetentionRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">مستوى المخاطر</p>
                        <Badge
                          variant={
                            client.riskLevel === 'low'
                              ? 'default'
                              : client.riskLevel === 'medium'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {client.riskLevel === 'low'
                            ? 'منخفض'
                            : client.riskLevel === 'medium'
                              ? 'متوسط'
                              : 'عالي'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الاتجاهات */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* اتجاه الإيرادات */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاه الإيرادات الشهرية</CardTitle>
                <CardDescription>تطور الإيرادات خلال الأشهر الماضية</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={clientChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toLocaleString('ar-SA')} ر.س`,
                        'الإيرادات',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* اتجاه الأرباح */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاه الأرباح الشهرية</CardTitle>
                <CardDescription>تطور الأرباح خلال الأشهر الماضية</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={clientChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toLocaleString('ar-SA')} ر.س`,
                        'الأرباح',
                      ]}
                    />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* مؤشرات الأداء الرئيسية */}
          <Card>
            <CardHeader>
              <CardTitle>مؤشرات الأداء الرئيسية</CardTitle>
              <CardDescription>المؤشرات المالية الهامة للربحية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">نمو الإيرادات</h3>
                  <p className="text-2xl font-bold text-green-600">+15.3%</p>
                  <p className="text-sm text-muted-foreground">مقارنة بالشهر الماضي</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">متوسط هامش الربح</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {averageProjectMargin.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">عبر جميع المشاريع</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold">أفضل عميل</h3>
                  <p className="text-lg font-bold text-yellow-600">
                    {topClients[0]?.clientName || 'غير متوفر'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {topClients[0]
                      ? `${topClients[0].totalProfit.toLocaleString('ar-SA')} ر.س`
                      : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
