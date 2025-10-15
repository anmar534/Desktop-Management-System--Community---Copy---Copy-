/**
 * Enhanced Dashboard Page
 * 
 * صفحة لوحة التحكم المحسّنة
 * تعرض جميع المؤشرات والتنبيهات والأنشطة بتصميم محسّن
 * 
 * @version 1.0.0
 * @date 2024-01-15
 */

import React, { useState, useCallback } from 'react';
import { EnhancedDashboardLayout } from '@/components/dashboard/enhanced/EnhancedDashboardLayout';
import { defaultQuickActions } from '@/components/dashboard/enhanced/QuickActionsBar';
import { useEnhancedKPIs } from '@/hooks/useEnhancedKPIs';
import { useDashboardAlerts } from '@/hooks/useDashboardAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  BarChart3
} from 'lucide-react';
import { cn } from '@/components/ui/utils';

/**
 * صفحة لوحة التحكم المحسّنة
 */
export const EnhancedDashboard: React.FC = () => {
  // الحالة المحلية
  const [layoutSettings, setLayoutSettings] = useState({
    showQuickActions: true,
    showAlerts: true,
    showActivities: true,
    showCharts: true,
    compactMode: false
  });

  // Hooks للبيانات
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
    setAutoRefreshEnabled: setKpisAutoRefresh
  } = useEnhancedKPIs({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 دقائق
    loadOnMount: true
  });

  const {
    criticalAlerts,
    recentActivities,
    isLoading: alertsLoading,
    isRefreshing: alertsRefreshing,
    error: alertsError,
    refresh: refreshAlerts,
    markAsRead,
    dismissAlert,
    lastUpdated: alertsLastUpdated,
    autoRefreshEnabled: alertsAutoRefresh,
    setAutoRefreshEnabled: setAlertsAutoRefresh
  } = useDashboardAlerts({
    autoRefresh: true,
    refreshInterval: 2 * 60 * 1000, // دقيقتان
    loadOnMount: true,
    maxAlerts: 10,
    maxActivities: 15
  });

  // حالة التحميل العامة
  const isLoading = kpisLoading || alertsLoading;
  const isRefreshing = kpisRefreshing || alertsRefreshing;
  const hasError = kpisError || alertsError;

  /**
   * تحديث جميع البيانات
   */
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refreshKPIs(),
        refreshAlerts()
      ]);
    } catch (error) {
      console.error('خطأ في تحديث البيانات:', error);
    }
  }, [refreshKPIs, refreshAlerts]);

  /**
   * تصدير البيانات
   */
  const handleExport = useCallback(() => {
    // تنفيذ تصدير البيانات
    const data = {
      criticalKPIs,
      financialKPIs,
      projectKPIs,
      safetyKPIs,
      alerts: criticalAlerts,
      activities: recentActivities,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [criticalKPIs, financialKPIs, projectKPIs, safetyKPIs, criticalAlerts, recentActivities]);

  /**
   * فتح إعدادات لوحة التحكم
   */
  const handleSettings = useCallback(() => {
    // يمكن فتح modal للإعدادات
    console.log('فتح إعدادات لوحة التحكم');
  }, []);

  /**
   * تبديل الوضع المضغوط
   */
  const toggleCompactMode = useCallback(() => {
    setLayoutSettings(prev => ({
      ...prev,
      compactMode: !prev.compactMode
    }));
  }, []);

  /**
   * تبديل التحديث التلقائي
   */
  const toggleAutoRefresh = useCallback(() => {
    const newValue = !kpisAutoRefresh;
    setKpisAutoRefresh(newValue);
    setAlertsAutoRefresh(newValue);
  }, [kpisAutoRefresh, setKpisAutoRefresh, setAlertsAutoRefresh]);

  // إعداد الرسوم البيانية (محاكاة)
  const charts = [
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
    </Card>
  ];

  // معلومات آخر تحديث
  const lastUpdated = kpisLastUpdated && alertsLastUpdated 
    ? new Date(Math.max(kpisLastUpdated.getTime(), alertsLastUpdated.getTime()))
    : kpisLastUpdated || alertsLastUpdated;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* شريط الحالة العلوي */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">لوحة التحكم المحسّنة</h1>
              
              {/* مؤشرات الحالة */}
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
                    جاري التحديث
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
                    محدث
                  </Badge>
                )}
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex items-center gap-2">
              {/* التحديث التلقائي */}
              <Button
                variant={kpisAutoRefresh ? "default" : "outline"}
                size="sm"
                onClick={toggleAutoRefresh}
                className="flex items-center gap-1"
              >
                <RefreshCw className={cn("h-4 w-4", kpisAutoRefresh && "animate-pulse")} />
                تلقائي
              </Button>

              {/* الوضع المضغوط */}
              <Button
                variant={layoutSettings.compactMode ? "default" : "outline"}
                size="sm"
                onClick={toggleCompactMode}
                className="flex items-center gap-1"
              >
                <Activity className="h-4 w-4" />
                مضغوط
              </Button>

              <Separator orientation="vertical" className="h-6" />

              {/* تصدير */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                تصدير
              </Button>

              {/* إعدادات */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSettings}
                className="flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                إعدادات
              </Button>
            </div>
          </div>

          {/* معلومات آخر تحديث */}
          {lastUpdated && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              آخر تحديث: {lastUpdated.toLocaleString('ar-SA')}
            </div>
          )}
        </div>
      </div>

      {/* محتوى لوحة التحكم */}
      <div className="container mx-auto px-4 py-6">
        {hasError && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">خطأ في تحميل البيانات</p>
                  <p className="text-sm">{kpisError || alertsError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <EnhancedDashboardLayout
          title="لوحة التحكم الرئيسية"
          subtitle="نظرة شاملة على أداء الشركة"
          criticalKPIs={criticalKPIs}
          financialKPIs={financialKPIs}
          projectKPIs={projectKPIs}
          safetyKPIs={safetyKPIs}
          quickActions={defaultQuickActions}
          criticalAlerts={criticalAlerts.map(alert => ({
            ...alert,
            actions: alert.actions?.map(action => ({
              ...action,
              onClick: () => {
                action.onClick();
                markAsRead(alert.id);
              }
            }))
          }))}
          recentActivities={recentActivities}
          charts={layoutSettings.showCharts ? charts : []}
          layoutSettings={layoutSettings}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
        />
      </div>
    </div>
  );
};
