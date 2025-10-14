/**
 * Enhanced Dashboard Layout Component
 * 
 * تخطيط محسّن للوحة التحكم الرئيسية
 * مصمم خصيصاً لشركات المقاولات والإنشاءات
 * 
 * @version 1.0.0
 * @date 2024-01-15
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  Settings,
  Download,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { EnhancedKPICard, type EnhancedKPICardProps } from './EnhancedKPICard';
import { QuickActionsBar, type QuickAction } from './QuickActionsBar';

export interface DashboardSection {
  id: string;
  title: string;
  description?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  component: React.ReactNode;
  gridArea?: string;
  className?: string;
}

export interface EnhancedDashboardLayoutProps {
  /** العنوان الرئيسي */
  title?: string;
  /** العنوان الفرعي */
  subtitle?: string;
  /** المؤشرات الحرجة */
  criticalKPIs: EnhancedKPICardProps[];
  /** المؤشرات المالية */
  financialKPIs: EnhancedKPICardProps[];
  /** مؤشرات المشاريع */
  projectKPIs: EnhancedKPICardProps[];
  /** مؤشرات السلامة */
  safetyKPIs: EnhancedKPICardProps[];
  /** الإجراءات السريعة */
  quickActions: QuickAction[];
  /** التنبيهات الحرجة */
  criticalAlerts: Alert[];
  /** الأنشطة الحديثة */
  recentActivities: Activity[];
  /** الرسوم البيانية */
  charts: React.ReactNode[];
  /** إعدادات التخطيط */
  layoutSettings?: {
    showQuickActions?: boolean;
    showAlerts?: boolean;
    showActivities?: boolean;
    showCharts?: boolean;
    compactMode?: boolean;
  };
  /** دالة التحديث */
  onRefresh?: () => void;
  /** حالة التحميل */
  isLoading?: boolean;
  /** آخر تحديث */
  lastUpdated?: Date;
}

export interface Alert {
  id: string;
  type: 'safety' | 'financial' | 'project' | 'tender';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}

export interface Activity {
  id: string;
  type: 'project' | 'tender' | 'financial' | 'user';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  icon?: React.ReactNode;
}

export const EnhancedDashboardLayout: React.FC<EnhancedDashboardLayoutProps> = ({
  title = 'لوحة التحكم الرئيسية',
  subtitle,
  criticalKPIs,
  financialKPIs,
  projectKPIs,
  safetyKPIs,
  quickActions,
  criticalAlerts,
  recentActivities,
  charts,
  layoutSettings = {},
  onRefresh,
  isLoading = false,
  lastUpdated,
}) => {
  const {
    showQuickActions = true,
    showAlerts = true,
    showActivities = true,
    showCharts = true,
    compactMode = false,
  } = layoutSettings;

  // تنسيق التاريخ والوقت
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'islamic-umalqura',
    }).format(date);
  };

  // تحديد لون التنبيه حسب الشدة
  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  // تحديد أيقونة التنبيه
  const getAlertIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(new Date())}</span>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>آخر تحديث: {formatDateTime(lastUpdated)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            تحديث
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Critical KPIs Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            المؤشرات الحرجة
          </h2>
          <Badge variant="secondary" className="mr-auto">
            {criticalKPIs.length} مؤشر
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {criticalKPIs.map((kpi, index) => (
            <EnhancedKPICard
              key={`critical-${index}`}
              {...kpi}
              size={compactMode ? 'small' : 'medium'}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions Bar */}
      {showQuickActions && (
        <QuickActionsBar
          actions={quickActions}
          maxVisible={compactMode ? 6 : 8}
          showLabels={!compactMode}
          layout={compactMode ? 'horizontal' : 'grid'}
        />
      )}

      {/* KPIs by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial KPIs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            المؤشرات المالية
          </h3>
          <div className="space-y-3">
            {financialKPIs.map((kpi, index) => (
              <EnhancedKPICard
                key={`financial-${index}`}
                {...kpi}
                size="small"
              />
            ))}
          </div>
        </div>

        {/* Project KPIs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            مؤشرات المشاريع
          </h3>
          <div className="space-y-3">
            {projectKPIs.map((kpi, index) => (
              <EnhancedKPICard
                key={`project-${index}`}
                {...kpi}
                size="small"
              />
            ))}
          </div>
        </div>

        {/* Safety KPIs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            مؤشرات السلامة
          </h3>
          <div className="space-y-3">
            {safetyKPIs.map((kpi, index) => (
              <EnhancedKPICard
                key={`safety-${index}`}
                {...kpi}
                size="small"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Alerts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        {showAlerts && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                التنبيهات الحرجة
                <Badge variant="destructive" className="mr-auto">
                  {criticalAlerts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>لا توجد تنبيهات حرجة</p>
                </div>
              ) : (
                criticalAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      getAlertColor(alert.severity)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.severity)}
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {alert.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    {alert.actions && alert.actions.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {alert.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={action.onClick}
                            className="h-7 text-xs"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activities */}
        {showActivities && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                الأنشطة الحديثة
                <Badge variant="secondary" className="mr-auto">
                  {recentActivities.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  {activity.icon || <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>}
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDateTime(activity.timestamp)}</span>
                      {activity.user && (
                        <>
                          <span>•</span>
                          <span>{activity.user}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section */}
      {showCharts && charts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            الرسوم البيانية والاتجاهات
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.map((chart, index) => (
              <div key={`chart-${index}`}>
                {chart}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboardLayout;
