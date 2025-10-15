/**
 * Enhanced Dashboard Example
 * 
 * مثال تطبيقي للوحة التحكم المحسّنة
 * يوضح كيفية استخدام المكونات الجديدة مع بيانات وهمية
 * 
 * @version 1.0.0
 * @date 2024-01-15
 */

import React from 'react';
import {
  Building,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Calculator,
  Calendar,
  Truck,
  ClipboardList,
  Target,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { EnhancedDashboardLayout } from './EnhancedDashboardLayout';
import type { EnhancedKPICardProps } from './EnhancedKPICard';
import type { QuickAction, Alert, Activity as ActivityType } from './EnhancedDashboardLayout';

export const EnhancedDashboardExample: React.FC = () => {
  // المؤشرات الحرجة
  const criticalKPIs: EnhancedKPICardProps[] = [
    {
      title: 'إجمالي الإيرادات الشهرية',
      value: 2850000,
      unit: 'ريال',
      target: 3000000,
      trend: {
        direction: 'up',
        percentage: 12.5,
        period: 'مقارنة بالشهر السابق',
      },
      status: 'success',
      icon: DollarSign,
      showProgress: true,
      description: 'إيرادات المشاريع النشطة',
      action: {
        label: 'عرض التفاصيل',
        onClick: () => console.log('عرض تفاصيل الإيرادات'),
      },
    },
    {
      title: 'المشاريع المتأخرة',
      value: 3,
      unit: 'مشروع',
      target: 0,
      trend: {
        direction: 'down',
        percentage: -25,
        period: 'تحسن من الأسبوع الماضي',
      },
      status: 'warning',
      icon: Building,
      description: 'مشاريع تجاوزت الجدول الزمني',
      action: {
        label: 'مراجعة المشاريع',
        onClick: () => console.log('مراجعة المشاريع المتأخرة'),
      },
    },
    {
      title: 'معدل الفوز في المنافسات',
      value: 68,
      unit: '%',
      target: 70,
      trend: {
        direction: 'up',
        percentage: 5.2,
        period: 'آخر 6 أشهر',
      },
      status: 'info',
      icon: Target,
      showProgress: true,
      description: 'نسبة النجاح في المنافسات',
    },
    {
      title: 'حوادث السلامة',
      value: 0,
      unit: 'حادث',
      target: 0,
      trend: {
        direction: 'stable',
        percentage: 0,
        period: 'هذا الشهر',
      },
      status: 'success',
      icon: AlertTriangle,
      description: 'سجل سلامة ممتاز',
    },
  ];

  // المؤشرات المالية
  const financialKPIs: EnhancedKPICardProps[] = [
    {
      title: 'صافي الربح',
      value: 427500,
      unit: 'ريال',
      trend: { direction: 'up', percentage: 8.3, period: 'شهري' },
      status: 'success',
      icon: TrendingUp,
    },
    {
      title: 'التدفق النقدي',
      value: 1250000,
      unit: 'ريال',
      trend: { direction: 'up', percentage: 15.2, period: 'شهري' },
      status: 'success',
      icon: DollarSign,
    },
    {
      title: 'المستحقات المتأخرة',
      value: 180000,
      unit: 'ريال',
      trend: { direction: 'down', percentage: -12.5, period: 'شهري' },
      status: 'warning',
      icon: Clock,
    },
    {
      title: 'نسبة التحصيل',
      value: 92,
      unit: '%',
      trend: { direction: 'up', percentage: 3.1, period: 'شهري' },
      status: 'success',
      icon: CheckCircle,
    },
  ];

  // مؤشرات المشاريع
  const projectKPIs: EnhancedKPICardProps[] = [
    {
      title: 'المشاريع النشطة',
      value: 12,
      unit: 'مشروع',
      trend: { direction: 'up', percentage: 20, period: 'شهري' },
      status: 'info',
      icon: Building,
    },
    {
      title: 'نسبة الإنجاز الإجمالية',
      value: 74,
      unit: '%',
      trend: { direction: 'up', percentage: 6.8, period: 'شهري' },
      status: 'success',
      icon: BarChart3,
    },
    {
      title: 'رضا العملاء',
      value: 4.7,
      unit: '/5',
      trend: { direction: 'up', percentage: 2.1, period: 'شهري' },
      status: 'success',
      icon: Users,
    },
    {
      title: 'جودة التسليم',
      value: 96,
      unit: '%',
      trend: { direction: 'stable', percentage: 0, period: 'شهري' },
      status: 'success',
      icon: CheckCircle,
    },
  ];

  // مؤشرات السلامة
  const safetyKPIs: EnhancedKPICardProps[] = [
    {
      title: 'مؤشر السلامة',
      value: 98,
      unit: '%',
      trend: { direction: 'up', percentage: 2.1, period: 'شهري' },
      status: 'success',
      icon: AlertTriangle,
    },
    {
      title: 'التدريبات المكتملة',
      value: 45,
      unit: 'تدريب',
      trend: { direction: 'up', percentage: 12.5, period: 'شهري' },
      status: 'success',
      icon: Users,
    },
    {
      title: 'فحوصات السلامة',
      value: 28,
      unit: 'فحص',
      trend: { direction: 'up', percentage: 7.7, period: 'شهري' },
      status: 'info',
      icon: ClipboardList,
    },
    {
      title: 'الامتثال للمعايير',
      value: 100,
      unit: '%',
      trend: { direction: 'stable', percentage: 0, period: 'شهري' },
      status: 'success',
      icon: CheckCircle,
    },
  ];

  // الإجراءات السريعة
  const quickActions: QuickAction[] = [
    {
      id: 'new-project',
      label: 'مشروع جديد',
      icon: Building,
      onClick: () => alert('إنشاء مشروع جديد'),
      category: 'projects',
      priority: 'high',
      shortcut: 'Ctrl+N',
      description: 'إنشاء مشروع جديد',
      color: '#3b82f6',
    },
    {
      id: 'new-tender',
      label: 'منافسة جديدة',
      icon: FileText,
      onClick: () => alert('تقديم على منافسة'),
      category: 'tenders',
      priority: 'high',
      badge: 2,
      description: 'تقديم على منافسة جديدة',
      color: '#8b5cf6',
    },
    {
      id: 'calculate-cost',
      label: 'حساب التكلفة',
      icon: Calculator,
      onClick: () => alert('فتح حاسبة التكلفة'),
      category: 'financial',
      priority: 'high',
      description: 'حساب تكلفة مشروع',
      color: '#10b981',
    },
    {
      id: 'schedule-meeting',
      label: 'جدولة اجتماع',
      icon: Calendar,
      onClick: () => alert('جدولة اجتماع'),
      category: 'projects',
      priority: 'medium',
      description: 'جدولة اجتماع أو زيارة موقع',
      color: '#f59e0b',
    },
    {
      id: 'equipment-booking',
      label: 'حجز معدات',
      icon: Truck,
      onClick: () => alert('حجز معدات'),
      category: 'resources',
      priority: 'medium',
      badge: 1,
      description: 'حجز وإدارة المعدات',
      color: '#6366f1',
    },
    {
      id: 'safety-report',
      label: 'تقرير سلامة',
      icon: AlertTriangle,
      onClick: () => alert('تقرير سلامة'),
      category: 'reports',
      priority: 'high',
      description: 'تسجيل تقرير سلامة',
      color: '#dc2626',
    },
  ];

  // التنبيهات الحرجة
  const criticalAlerts: Alert[] = [
    {
      id: '1',
      type: 'project',
      severity: 'high',
      title: 'تأخير في مشروع برج الرياض',
      description: 'المشروع متأخر 5 أيام عن الجدول المحدد',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // منذ ساعتين
      actions: [
        {
          label: 'مراجعة المشروع',
          onClick: () => alert('مراجعة مشروع برج الرياض'),
        },
        {
          label: 'تحديث الجدول',
          onClick: () => alert('تحديث جدول المشروع'),
        },
      ],
    },
    {
      id: '2',
      type: 'financial',
      severity: 'medium',
      title: 'فاتورة متأخرة - شركة النخيل',
      description: 'فاتورة بقيمة 150,000 ريال متأخرة 15 يوم',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // منذ 4 ساعات
      actions: [
        {
          label: 'متابعة التحصيل',
          onClick: () => alert('متابعة تحصيل الفاتورة'),
        },
      ],
    },
    {
      id: '3',
      type: 'tender',
      severity: 'medium',
      title: 'موعد نهائي قريب - منافسة مشروع الدمام',
      description: 'باقي 3 أيام على انتهاء موعد التقديم',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // منذ 6 ساعات
      actions: [
        {
          label: 'مراجعة العرض',
          onClick: () => alert('مراجعة عرض منافسة الدمام'),
        },
      ],
    },
  ];

  // الأنشطة الحديثة
  const recentActivities: ActivityType[] = [
    {
      id: '1',
      type: 'project',
      title: 'تم تحديث حالة مشروع مجمع الأعمال',
      description: 'تم رفع نسبة الإنجاز إلى 85%',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // منذ 30 دقيقة
      user: 'أحمد محمد',
      icon: <Building className="h-4 w-4 text-blue-500" />,
    },
    {
      id: '2',
      type: 'tender',
      title: 'تم تقديم عرض جديد',
      description: 'تم تقديم عرض لمنافسة مشروع المدينة الطبية',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // منذ ساعتين
      user: 'سارة أحمد',
      icon: <FileText className="h-4 w-4 text-purple-500" />,
    },
    {
      id: '3',
      type: 'financial',
      title: 'تم استلام دفعة',
      description: 'تم استلام دفعة بقيمة 500,000 ريال من مشروع الرياض',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // منذ 4 ساعات
      user: 'محمد علي',
      icon: <DollarSign className="h-4 w-4 text-green-500" />,
    },
    {
      id: '4',
      type: 'user',
      title: 'تم إضافة مهندس جديد',
      description: 'تم إضافة المهندس خالد السعد إلى فريق مشروع جدة',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // منذ 6 ساعات
      user: 'إدارة الموارد البشرية',
      icon: <Users className="h-4 w-4 text-orange-500" />,
    },
  ];

  // الرسوم البيانية (مكونات وهمية)
  const charts = [
    <div key="revenue-chart" className="h-80 bg-card rounded-lg border p-4 flex items-center justify-center">
      <div className="text-center space-y-2">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="font-semibold">رسم بياني للإيرادات</h3>
        <p className="text-sm text-muted-foreground">اتجاه الإيرادات الشهرية</p>
      </div>
    </div>,
    <div key="projects-chart" className="h-80 bg-card rounded-lg border p-4 flex items-center justify-center">
      <div className="text-center space-y-2">
        <PieChart className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="font-semibold">توزيع المشاريع</h3>
        <p className="text-sm text-muted-foreground">حالة المشاريع الحالية</p>
      </div>
    </div>,
  ];

  const handleRefresh = () => {
    console.log('تحديث البيانات...');
    // هنا يتم تحديث البيانات من الخادم
  };

  return (
    <EnhancedDashboardLayout
      title="لوحة التحكم الرئيسية"
      subtitle="نظرة شاملة على أداء شركة المقاولات"
      criticalKPIs={criticalKPIs}
      financialKPIs={financialKPIs}
      projectKPIs={projectKPIs}
      safetyKPIs={safetyKPIs}
      quickActions={quickActions}
      criticalAlerts={criticalAlerts}
      recentActivities={recentActivities}
      charts={charts}
      onRefresh={handleRefresh}
      lastUpdated={new Date()}
      layoutSettings={{
        showQuickActions: true,
        showAlerts: true,
        showActivities: true,
        showCharts: true,
        compactMode: false,
      }}
    />
  );
};

export default EnhancedDashboardExample;
