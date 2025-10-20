/**
 * Competitive Analytics Board
 *
 * إعادة استخدام لوحة التحكم المحسّنة داخل تبويب الذكاء التنافسي
 * مع تكامل كامل مع سياق التحليلات الحالي.
 */

import { useCallback, useState } from 'react'
import { EnhancedDashboardLayout, defaultQuickActions } from './enhanced'
import type { Alert } from './enhanced'
import { useEnhancedKPIs } from '@/application/hooks/useEnhancedKPIs'
import { useDashboardAlerts } from '@/application/hooks/useDashboardAlerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  RefreshCw,
  Settings,
  Download,
  Bell,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'
import type { FC } from 'react'

export const CompetitiveAnalyticsBoard: FC = () => {
  const [layoutSettings, setLayoutSettings] = useState({
    showQuickActions: true,
    showAlerts: true,
    showActivities: true,
    showCharts: true,
    compactMode: false,
  })

  const {
    criticalKPIs,
    financialKPIs,
    projectKPIs,
    safetyKPIs,
    isLoading: kpisLoading,
    isRefreshing: kpisRefreshing,
    error: kpisError,
    refreshKPIs,
    lastUpdated: kpisLastUpdated,
    autoRefreshEnabled: kpisAutoRefresh,
    setAutoRefreshEnabled: setKpisAutoRefresh,
  } = useEnhancedKPIs({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000,
    loadOnMount: true,
  })

  const {
    criticalAlerts,
    recentActivities,
    isLoading: alertsLoading,
    isRefreshing: alertsRefreshing,
    error: alertsError,
    refresh: refreshAlerts,
    markAsRead,
    lastUpdated: alertsLastUpdated,
    setAutoRefreshEnabled: setAlertsAutoRefresh,
  } = useDashboardAlerts({
    autoRefresh: true,
    refreshInterval: 2 * 60 * 1000,
    loadOnMount: true,
    maxAlerts: 10,
    maxActivities: 15,
  })

  const isLoading = kpisLoading || alertsLoading
  const isRefreshing = kpisRefreshing || alertsRefreshing
  const hasError = kpisError ?? alertsError

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refreshKPIs(), refreshAlerts()])
    } catch (error) {
      console.error('خطأ في تحديث بيانات لوحة الذكاء التنافسي:', error)
    }
  }, [refreshKPIs, refreshAlerts])

  const handleExport = useCallback(() => {
    const data = {
      criticalKPIs,
      financialKPIs,
      projectKPIs,
      safetyKPIs,
      alerts: criticalAlerts,
      activities: recentActivities,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `competitive-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [criticalKPIs, financialKPIs, projectKPIs, safetyKPIs, criticalAlerts, recentActivities])

  const handleSettings = useCallback(() => {
    console.log('فتح إعدادات لوحة الذكاء التنافسي')
  }, [])

  const toggleCompactMode = useCallback(() => {
    setLayoutSettings((prev) => ({
      ...prev,
      compactMode: !prev.compactMode,
    }))
  }, [])

  const toggleAutoRefresh = useCallback(() => {
    const newValue = !kpisAutoRefresh
    setKpisAutoRefresh(newValue)
    setAlertsAutoRefresh(newValue)
  }, [kpisAutoRefresh, setKpisAutoRefresh, setAlertsAutoRefresh])

  const charts = layoutSettings.showCharts
    ? [
        <Card key="revenue-chart" className="h-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              اتجاه الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>رسم بياني للإيرادات</p>
                <p className="text-sm">سيتم تطويره في المرحلة التالية</p>
              </div>
            </div>
          </CardContent>
        </Card>,
        <Card key="projects-chart" className="h-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              حالة المشاريع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>رسم بياني لحالة المشاريع</p>
                <p className="text-sm">سيتم تطويره في المرحلة التالية</p>
              </div>
            </div>
          </CardContent>
        </Card>,
      ]
    : []

  const lastUpdated: Date | null =
    kpisLastUpdated && alertsLastUpdated
      ? new Date(Math.max(kpisLastUpdated.getTime(), alertsLastUpdated.getTime()))
      : (kpisLastUpdated ?? alertsLastUpdated ?? null)

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4" />
                <span>لوحة الذكاء التنافسي</span>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    جاري التحميل
                  </Badge>
                )}
                {isRefreshing && !isLoading && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    يتم التحديث
                  </Badge>
                )}
                {hasError && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    خطأ في البيانات
                  </Badge>
                )}
                {!isLoading && !hasError && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    جاهز
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={kpisAutoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={toggleAutoRefresh}
                className="flex items-center gap-1"
              >
                <RefreshCw className={cn('h-4 w-4', kpisAutoRefresh && 'animate-pulse')} />
                تحديث تلقائي
              </Button>
              <Button
                variant={layoutSettings.compactMode ? 'default' : 'outline'}
                size="sm"
                onClick={toggleCompactMode}
                className="flex items-center gap-1"
              >
                <Activity className="h-4 w-4" />
                وضع مضغوط
              </Button>
              <Separator orientation="vertical" className="hidden h-6 lg:block" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                تصدير
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSettings}
                className="flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                إعدادات
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                تحديث الآن
              </Button>
            </div>
          </div>

          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>آخر تحديث: {lastUpdated.toLocaleString('ar-SA')}</span>
              <span>•</span>
              <span>التنبيهات: {criticalAlerts.length}</span>
              <span>•</span>
              <span>الأنشطة: {recentActivities.length}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {hasError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">خطأ في تحميل البيانات</p>
                <p className="text-sm">{kpisError ?? alertsError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <EnhancedDashboardLayout
        title="لوحة التحليلات التنافسية"
        subtitle="متابعة المؤشرات الحرجة للمنافسة وأداء المشاريع"
        criticalKPIs={criticalKPIs}
        financialKPIs={financialKPIs}
        projectKPIs={projectKPIs}
        safetyKPIs={safetyKPIs}
        quickActions={defaultQuickActions}
        criticalAlerts={criticalAlerts.map((alert) => ({
          ...alert,
          actions: alert.actions?.map((action: Alert['actions'][number]) => ({
            ...action,
            onClick: () => {
              if (action.onClick) {
                action.onClick()
              } else if (action.href) {
                window.location.href = action.href
              }
              void markAsRead(alert.id)
            },
          })),
        }))}
        recentActivities={recentActivities}
        charts={charts}
        layoutSettings={layoutSettings}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        lastUpdated={lastUpdated ?? undefined}
      />
    </div>
  )
}

export default CompetitiveAnalyticsBoard

