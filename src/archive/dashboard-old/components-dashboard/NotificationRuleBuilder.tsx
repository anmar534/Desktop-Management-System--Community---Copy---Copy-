/**
 * مكون منشئ قواعد الإشعارات
 * Notification Rule Builder Component
 * 
 * يوفر واجهة لإنشاء وتحرير قواعد الإشعارات الذكية
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Trash2, 
  Save, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Target
} from 'lucide-react';
import { 
  NotificationRule, 
  NotificationCondition, 
  NotificationAction,
  smartNotificationsService 
} from '../../services/smartNotificationsService';

interface NotificationRuleBuilderProps {
  rule?: NotificationRule;
  onSave?: (rule: NotificationRule) => void;
  onCancel?: () => void;
}

interface RuleBuilderState {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  type: string;
  category: string;
  priority: string;
  conditions: NotificationCondition[];
  actions: NotificationAction[];
  isActive: boolean;
  frequency: string;
  recipients: string[];
  channels: string[];
  loading: boolean;
  error: string | null;
}

export const NotificationRuleBuilder: React.FC<NotificationRuleBuilderProps> = ({
  rule,
  onSave,
  onCancel
}) => {
  const [state, setState] = useState<RuleBuilderState>({
    name: rule?.name || '',
    nameEn: rule?.nameEn || '',
    description: rule?.description || '',
    descriptionEn: rule?.descriptionEn || '',
    type: rule?.type || 'custom',
    category: rule?.category || 'info',
    priority: rule?.priority || 'medium',
    conditions: rule?.conditions || [],
    actions: rule?.actions || [],
    isActive: rule?.isActive ?? true,
    frequency: rule?.frequency || 'immediate',
    recipients: rule?.recipients || [],
    channels: rule?.channels || ['in_app'],
    loading: false,
    error: null
  });

  // حفظ القاعدة
  const handleSave = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      if (!state.name.trim()) {
        throw new Error('اسم القاعدة مطلوب');
      }

      if (state.conditions.length === 0) {
        throw new Error('يجب إضافة شرط واحد على الأقل');
      }

      const ruleData = {
        name: state.name,
        nameEn: state.nameEn,
        description: state.description,
        descriptionEn: state.descriptionEn,
        type: state.type as any,
        category: state.category as any,
        priority: state.priority as any,
        conditions: state.conditions,
        actions: state.actions,
        isActive: state.isActive,
        frequency: state.frequency as any,
        recipients: state.recipients,
        channels: state.channels as any,
        createdBy: 'current-user'
      };

      let savedRule: NotificationRule;
      if (rule) {
        savedRule = await smartNotificationsService.updateRule(rule.id, ruleData) as NotificationRule;
      } else {
        savedRule = await smartNotificationsService.createRule(ruleData);
      }

      setState(prev => ({ ...prev, loading: false }));
      onSave?.(savedRule);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في حفظ القاعدة'
      }));
    }
  }, [state, rule, onSave]);

  // إضافة شرط جديد
  const addCondition = useCallback(() => {
    const newCondition: NotificationCondition = {
      field: '',
      operator: 'equals',
      value: '',
      dataSource: 'projects'
    };

    setState(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  }, []);

  // تحديث شرط
  const updateCondition = useCallback((index: number, updates: Partial<NotificationCondition>) => {
    setState(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  }, []);

  // حذف شرط
  const removeCondition = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  }, []);

  // إضافة إجراء جديد
  const addAction = useCallback(() => {
    const newAction: NotificationAction = {
      type: 'send_notification',
      config: {}
    };

    setState(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  }, []);

  // تحديث إجراء
  const updateAction = useCallback((index: number, updates: Partial<NotificationAction>) => {
    setState(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, ...updates } : action
      )
    }));
  }, []);

  // حذف إجراء
  const removeAction = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  }, []);

  // تبديل القناة
  const toggleChannel = useCallback((channel: string) => {
    setState(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  }, []);

  // الحصول على أيقونة النوع
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project_critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'deadline_warning':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'budget_overrun':
        return <DollarSign className="h-4 w-4 text-red-500" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'performance':
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // الحصول على أيقونة القناة
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {rule ? 'تحرير قاعدة الإشعار' : 'إنشاء قاعدة إشعار جديدة'}
          </h2>
          <p className="text-gray-600">قم بتكوين شروط وإجراءات الإشعار</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={state.loading}>
            <Save className="h-4 w-4 ml-2" />
            {state.loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* الإعدادات الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle>الإعدادات الأساسية</CardTitle>
            <CardDescription>معلومات القاعدة الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">الاسم (عربي)</Label>
                <Input
                  id="name"
                  value={state.name}
                  onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم القاعدة"
                />
              </div>
              <div>
                <Label htmlFor="nameEn">الاسم (إنجليزي)</Label>
                <Input
                  id="nameEn"
                  value={state.nameEn}
                  onChange={(e) => setState(prev => ({ ...prev, nameEn: e.target.value }))}
                  placeholder="Rule Name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">الوصف (عربي)</Label>
              <Textarea
                id="description"
                value={state.description}
                onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف القاعدة"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="descriptionEn">الوصف (إنجليزي)</Label>
              <Textarea
                id="descriptionEn"
                value={state.descriptionEn}
                onChange={(e) => setState(prev => ({ ...prev, descriptionEn: e.target.value }))}
                placeholder="Rule Description"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="type">النوع</Label>
                <Select value={state.type} onValueChange={(value) => setState(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_critical">مشروع حرج</SelectItem>
                    <SelectItem value="deadline_warning">تحذير موعد</SelectItem>
                    <SelectItem value="budget_overrun">تجاوز ميزانية</SelectItem>
                    <SelectItem value="opportunity">فرصة</SelectItem>
                    <SelectItem value="risk">مخاطر</SelectItem>
                    <SelectItem value="performance">أداء</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">الفئة</Label>
                <Select value={state.category} onValueChange={(value) => setState(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">عاجل</SelectItem>
                    <SelectItem value="warning">تحذير</SelectItem>
                    <SelectItem value="info">معلومات</SelectItem>
                    <SelectItem value="success">نجاح</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">الأولوية</Label>
                <Select value={state.priority} onValueChange={(value) => setState(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="frequency">التكرار</Label>
                <Select value={state.frequency} onValueChange={(value) => setState(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">فوري</SelectItem>
                    <SelectItem value="daily">يومي</SelectItem>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                    <SelectItem value="monthly">شهري</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse pt-6">
                <Checkbox
                  id="isActive"
                  checked={state.isActive}
                  onCheckedChange={(checked) => setState(prev => ({ ...prev, isActive: !!checked }))}
                />
                <Label htmlFor="isActive">قاعدة نشطة</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* قنوات الإشعار */}
        <Card>
          <CardHeader>
            <CardTitle>قنوات الإشعار</CardTitle>
            <CardDescription>اختر قنوات إرسال الإشعارات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { id: 'in_app', label: 'داخل التطبيق', icon: 'in_app' },
                { id: 'email', label: 'بريد إلكتروني', icon: 'email' },
                { id: 'sms', label: 'رسائل نصية', icon: 'sms' },
                { id: 'desktop', label: 'سطح المكتب', icon: 'desktop' }
              ].map((channel) => (
                <div key={channel.id} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={channel.id}
                    checked={state.channels.includes(channel.id)}
                    onCheckedChange={() => toggleChannel(channel.id)}
                  />
                  <Label htmlFor={channel.id} className="flex items-center gap-2">
                    {getChannelIcon(channel.icon)}
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الشروط */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>شروط التشغيل</CardTitle>
              <CardDescription>حدد الشروط التي تؤدي إلى تشغيل الإشعار</CardDescription>
            </div>
            <Button onClick={addCondition} variant="outline">
              <Plus className="h-4 w-4 ml-2" />
              إضافة شرط
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {state.conditions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لم يتم إضافة أي شروط بعد</p>
              <p className="text-sm">انقر على "إضافة شرط" لبدء التكوين</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.conditions.map((condition, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">الشرط {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <Label>مصدر البيانات</Label>
                      <Select
                        value={condition.dataSource}
                        onValueChange={(value) => updateCondition(index, { dataSource: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="projects">المشاريع</SelectItem>
                          <SelectItem value="tenders">المنافسات</SelectItem>
                          <SelectItem value="expenses">المصروفات</SelectItem>
                          <SelectItem value="invoices">الفواتير</SelectItem>
                          <SelectItem value="tasks">المهام</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>الحقل</Label>
                      <Input
                        value={condition.field}
                        onChange={(e) => updateCondition(index, { field: e.target.value })}
                        placeholder="اسم الحقل"
                      />
                    </div>

                    <div>
                      <Label>المشغل</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(index, { operator: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">يساوي</SelectItem>
                          <SelectItem value="not_equals">لا يساوي</SelectItem>
                          <SelectItem value="greater_than">أكبر من</SelectItem>
                          <SelectItem value="less_than">أصغر من</SelectItem>
                          <SelectItem value="between">بين</SelectItem>
                          <SelectItem value="contains">يحتوي على</SelectItem>
                          <SelectItem value="starts_with">يبدأ بـ</SelectItem>
                          <SelectItem value="ends_with">ينتهي بـ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>القيمة</Label>
                      <Input
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        placeholder="القيمة"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* الإجراءات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>الإجراءات</CardTitle>
              <CardDescription>حدد الإجراءات التي سيتم تنفيذها عند تشغيل القاعدة</CardDescription>
            </div>
            <Button onClick={addAction} variant="outline">
              <Plus className="h-4 w-4 ml-2" />
              إضافة إجراء
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {state.actions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لم يتم إضافة أي إجراءات بعد</p>
              <p className="text-sm">انقر على "إضافة إجراء" لتكوين الإجراءات</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.actions.map((action, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">الإجراء {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <Label>نوع الإجراء</Label>
                    <Select
                      value={action.type}
                      onValueChange={(value) => updateAction(index, { type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="send_notification">إرسال إشعار</SelectItem>
                        <SelectItem value="send_email">إرسال بريد إلكتروني</SelectItem>
                        <SelectItem value="create_task">إنشاء مهمة</SelectItem>
                        <SelectItem value="update_status">تحديث الحالة</SelectItem>
                        <SelectItem value="log_event">تسجيل حدث</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
