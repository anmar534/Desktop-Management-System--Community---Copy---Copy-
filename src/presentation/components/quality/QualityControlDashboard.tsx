/**
 * Quality Control Dashboard Component
 * مكون لوحة معلومات مراقبة الجودة
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { qualityAssuranceService } from '../../services/qualityAssuranceService'
import type { QualityDashboard, QualityMetrics, QualityAlert } from '../../types/quality'

interface QualityControlDashboardProps {
  projectId: string
  className?: string
}

const QUALITY_STATUS_COLORS = {
  passed: '#10B981',
  failed: '#EF4444',
  in_progress: '#F59E0B',
  planned: '#6B7280'
}

const ALERT_COLORS = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-blue-100 border-blue-300 text-blue-800'
}

export function QualityControlDashboard({ projectId, className }: QualityControlDashboardProps) {
  const [dashboard, setDashboard] = useState<QualityDashboard | null>(null)
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [alerts, setAlerts] = useState<QualityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [dashboardData, metricsData, alertsData] = await Promise.all([
        qualityAssuranceService.getQualityDashboard(projectId),
        qualityAssuranceService.getQualityMetrics(projectId, {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }),
        qualityAssuranceService.getQualityAlerts(projectId)
      ])

      setDashboard(dashboardData)
      setMetrics(metricsData)
      setAlerts(alertsData)
    } catch (err) {
      console.error('Error loading quality data:', err)
      setError('فشل في تحميل بيانات الجودة')
    } finally {
      setLoading(false)
    }
  }

  const formatPercentage = (value: number) => `${Math.round(value)}%`

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const getQualityScoreLabel = (score: number) => {
    if (score >= 90) return 'ممتاز'
    if (score >= 80) return 'جيد'
    if (score >= 70) return 'مقبول'
    return 'يحتاج تحسين'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">جاري تحميل بيانات الجودة...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <Button onClick={loadData} variant="outline">
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!dashboard || !metrics) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-600">لا توجد بيانات جودة متاحة</p>
        </CardContent>
      </Card>
    )
  }

  const qualityTrendData = dashboard.qualityTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('ar-SA'),
    score: trend.qualityScore,
    checks: trend.checksCompleted,
    nonConformities: trend.nonConformitiesRaised
  }))

  const checkStatusData = [
    { name: 'مكتملة', value: dashboard.kpis.checksCompleted, color: QUALITY_STATUS_COLORS.passed },
    { name: 'قيد التنفيذ', value: dashboard.kpis.checksInProgress, color: QUALITY_STATUS_COLORS.in_progress },
    { name: 'مخططة', value: dashboard.kpis.checksPlanned, color: QUALITY_STATUS_COLORS.planned }
  ]

  const nonConformityData = dashboard.nonConformityTrends.map(trend => ({
    month: new Date(trend.month).toLocaleDateString('ar-SA', { month: 'short' }),
    major: trend.majorCount,
    minor: trend.minorCount,
    critical: trend.criticalCount
  }))

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>لوحة معلومات مراقبة الجودة</span>
            <Badge variant="outline">
              آخر تحديث: {new Date(dashboard.lastUpdated).toLocaleDateString('ar-SA')}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">نقاط الجودة الإجمالية</p>
                <p className={`text-2xl font-bold ${getQualityScoreColor(dashboard.kpis.overallQualityScore)}`}>
                  {dashboard.kpis.overallQualityScore}
                </p>
                <p className="text-xs text-gray-500">{getQualityScoreLabel(dashboard.kpis.overallQualityScore)}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل النجاح</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(dashboard.kpis.passRate)}
                </p>
                <p className="text-xs text-gray-500">من إجمالي الفحوصات</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">عدم المطابقات النشطة</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboard.kpis.activeNonConformities}
                </p>
                <p className="text-xs text-gray-500">تحتاج إجراءات تصحيحية</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-xl">⚠️</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الإجراءات المكتملة</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboard.kpis.correctiveActionsCompleted}
                </p>
                <p className="text-xs text-gray-500">من أصل {dashboard.kpis.correctiveActionsTotal}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">🔧</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>تنبيهات الجودة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded border ${ALERT_COLORS[alert.severity]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.titleAr}</h4>
                      <p className="text-sm mt-1">{alert.descriptionAr}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {new Date(alert.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <Badge variant="outline" className="mr-2">
                      {alert.severity === 'critical' ? 'حرج' :
                       alert.severity === 'high' ? 'عالي' :
                       alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                  </div>
                </div>
              ))}
              {alerts.length > 5 && (
                <Button variant="outline" className="w-full">
                  عرض جميع التنبيهات ({alerts.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts and Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          <TabsTrigger value="analysis">التحليل</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Score Trend */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاه نقاط الجودة</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={qualityTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="نقاط الجودة"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Check Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع حالة الفحوصات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={checkStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {checkStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اتجاهات عدم المطابقة</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={nonConformityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="critical" stackId="a" fill="#EF4444" name="حرجة" />
                  <Bar dataKey="major" stackId="a" fill="#F59E0B" name="رئيسية" />
                  <Bar dataKey="minor" stackId="a" fill="#10B981" name="ثانوية" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Standards Compliance */}
            <Card>
              <CardHeader>
                <CardTitle>الامتثال لمعايير الجودة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboard.standardsCompliance.map(standard => (
                  <div key={standard.standardId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{standard.standardNameAr}</span>
                      <span className="text-sm text-gray-600">
                        {formatPercentage(standard.complianceRate)}
                      </span>
                    </div>
                    <Progress value={standard.complianceRate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>الأنشطة الأخيرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.recentActivities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.descriptionAr}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.performedAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

