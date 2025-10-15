/**
 * مكون الإشعارات والتنبيهات الذكية
 * Smart Notifications Component
 * 
 * يوفر واجهة شاملة لإدارة وعرض الإشعارات والتنبيهات الذكية
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { 
  Bell, 
  BellRing, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Search,
  BarChart3,
  Clock,
  Users,
  Mail,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { 
  SmartNotification, 
  NotificationRule, 
  NotificationSettings,
  NotificationAnalytics,
  smartNotificationsService 
} from '../../services/smartNotificationsService';

interface SmartNotificationsState {
  notifications: SmartNotification[];
  rules: NotificationRule[];
  settings: NotificationSettings | null;
  analytics: NotificationAnalytics | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedCategory: string;
  selectedType: string;
  selectedStatus: string;
  showCreateRuleDialog: boolean;
  showSettingsDialog: boolean;
  showAnalyticsDialog: boolean;
}

export const SmartNotifications: React.FC = () => {
  const [state, setState] = useState<SmartNotificationsState>({
    notifications: [],
    rules: [],
    settings: null,
    analytics: null,
    loading: true,
    error: null,
    searchTerm: '',
    selectedCategory: 'all',
    selectedType: 'all',
    selectedStatus: 'all',
    showCreateRuleDialog: false,
    showSettingsDialog: false,
    showAnalyticsDialog: false
  });

  // تحميل البيانات
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [notifications, rules, settings, analytics] = await Promise.all([
        smartNotificationsService.getAllNotifications(),
        smartNotificationsService.getAllRules(),
        smartNotificationsService.getUserSettings('current-user'),
        smartNotificationsService.getAnalytics()
      ]);

      setState(prev => ({
        ...prev,
        notifications,
        rules,
        settings,
        analytics,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تحميل البيانات'
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // تقييم القواعد وإنشاء إشعارات جديدة
  const evaluateRules = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const newNotifications = await smartNotificationsService.evaluateRules();
      
      if (newNotifications.length > 0) {
        setState(prev => ({
          ...prev,
          notifications: [...prev.notifications, ...newNotifications]
        }));
      }
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تقييم القواعد'
      }));
    }
  }, []);

  // تحديث حالة الإشعار
  const updateNotificationStatus = useCallback(async (notificationId: string, status: 'read' | 'dismissed' | 'archived') => {
    try {
      await smartNotificationsService.updateNotificationStatus(notificationId, status);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, status, updatedAt: new Date().toISOString() }
            : notification
        )
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في تحديث الإشعار'
      }));
    }
  }, []);

  // تصفية الإشعارات
  const filteredNotifications = state.notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(state.searchTerm.toLowerCase());
    const matchesCategory = state.selectedCategory === 'all' || notification.category === state.selectedCategory;
    const matchesType = state.selectedType === 'all' || notification.type === state.selectedType;
    const matchesStatus = state.selectedStatus === 'all' || notification.status === state.selectedStatus;
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  // الحصول على أيقونة الفئة
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // الحصول على لون الأولوية
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // مكون قائمة الإشعارات
  const NotificationsList: React.FC = () => (
    <div className="space-y-4">
      {/* شريط البحث والفلترة */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في الإشعارات..."
              value={state.searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={state.selectedCategory} onValueChange={(value) => setState(prev => ({ ...prev, selectedCategory: value }))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            <SelectItem value="urgent">عاجل</SelectItem>
            <SelectItem value="warning">تحذير</SelectItem>
            <SelectItem value="info">معلومات</SelectItem>
            <SelectItem value="success">نجاح</SelectItem>
          </SelectContent>
        </Select>

        <Select value={state.selectedStatus} onValueChange={(value) => setState(prev => ({ ...prev, selectedStatus: value }))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="unread">غير مقروء</SelectItem>
            <SelectItem value="read">مقروء</SelectItem>
            <SelectItem value="dismissed">مرفوض</SelectItem>
            <SelectItem value="archived">مؤرشف</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={evaluateRules} variant="outline">
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* قائمة الإشعارات */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all hover:shadow-md ${
                notification.status === 'unread' ? 'border-blue-200 bg-blue-50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getCategoryIcon(notification.category)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority === 'high' ? 'عالية' : 
                           notification.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </Badge>
                        {notification.status === 'unread' && (
                          <Badge variant="default" className="text-xs">جديد</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.createdAt).toLocaleString('ar-SA')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {notification.recipients.length} مستلم
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {notification.status === 'unread' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateNotificationStatus(notification.id, 'read')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateNotificationStatus(notification.id, 'dismissed')}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  // مكون قواعد الإشعارات
  const NotificationRules: React.FC = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">قواعد الإشعارات</h3>
        <Button onClick={() => setState(prev => ({ ...prev, showCreateRuleDialog: true }))}>
          <Plus className="h-4 w-4 ml-2" />
          قاعدة جديدة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {state.rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{rule.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "نشط" : "معطل"}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">{rule.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>النوع: {getTypeLabel(rule.type)}</span>
                <span>التكرار: {getFrequencyLabel(rule.frequency)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // الحصول على تسمية النوع
  const getTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      project_critical: 'مشروع حرج',
      deadline_warning: 'تحذير موعد',
      budget_overrun: 'تجاوز ميزانية',
      opportunity: 'فرصة',
      risk: 'مخاطر',
      performance: 'أداء',
      custom: 'مخصص'
    };
    return types[type] || type;
  };

  // الحصول على تسمية التكرار
  const getFrequencyLabel = (frequency: string): string => {
    const frequencies: Record<string, string> = {
      immediate: 'فوري',
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري'
    };
    return frequencies[frequency] || frequency;
  };

  // مكون الإعدادات
  const NotificationSettingsComponent: React.FC = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">إعدادات الإشعارات</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">قنوات الإشعارات</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="in-app" checked={state.settings?.enableInApp} />
                <Label htmlFor="in-app" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  داخل التطبيق
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="email" checked={state.settings?.enableEmail} />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  بريد إلكتروني
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="sms" checked={state.settings?.enableSMS} />
                <Label htmlFor="sms" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  رسائل نصية
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="desktop" checked={state.settings?.enableDesktop} />
                <Label htmlFor="desktop" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  سطح المكتب
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">فئات الإشعارات</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="urgent" checked={state.settings?.categories.urgent} />
                <Label htmlFor="urgent">عاجل</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="warning" checked={state.settings?.categories.warning} />
                <Label htmlFor="warning">تحذير</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="info" checked={state.settings?.categories.info} />
                <Label htmlFor="info">معلومات</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="success" checked={state.settings?.categories.success} />
                <Label htmlFor="success">نجاح</Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (state.loading && state.notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الإشعارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإشعارات والتنبيهات الذكية</h1>
          <p className="text-gray-600">إدارة ومراقبة الإشعارات والتنبيهات التلقائية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setState(prev => ({ ...prev, showAnalyticsDialog: true }))}>
            <BarChart3 className="h-4 w-4 ml-2" />
            التحليلات
          </Button>
          <Button variant="outline" onClick={() => setState(prev => ({ ...prev, showSettingsDialog: true }))}>
            <Settings className="h-4 w-4 ml-2" />
            الإعدادات
          </Button>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      {/* إحصائيات سريعة */}
      {state.analytics && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الإشعارات</p>
                  <p className="text-2xl font-bold">{state.analytics.totalSent}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">معدل القراءة</p>
                  <p className="text-2xl font-bold">{state.analytics.readRate.toFixed(1)}%</p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">غير مقروء</p>
                  <p className="text-2xl font-bold">
                    {state.notifications.filter(n => n.status === 'unread').length}
                  </p>
                </div>
                <BellRing className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">القواعد النشطة</p>
                  <p className="text-2xl font-bold">
                    {state.rules.filter(r => r.isActive).length}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="rules">القواعد</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsList />
        </TabsContent>

        <TabsContent value="rules">
          <NotificationRules />
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettingsComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};
