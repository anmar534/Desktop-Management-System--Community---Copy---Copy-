/**
 * مكون إدارة التكامل المالي
 * Financial Integration Management Component
 */

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  RefreshCw, 
  Settings, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Database,
  Zap,
  BarChart3
} from 'lucide-react';
import type { IntegrationSettings, SyncResult } from '@/application/services/financialIntegrationService';
import { FinancialIntegrationService } from '@/application/services/financialIntegrationService';

export const FinancialIntegration: React.FC = () => {
  const [service] = useState(() => new FinancialIntegrationService());
  const [settings, setSettings] = useState<IntegrationSettings | null>(null);
  const [syncLog, setSyncLog] = useState<(SyncResult & { type: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
    return () => service.destroy();
  }, [service]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, logData] = await Promise.all([
        service.getIntegrationSettings(),
        service.getSyncLog()
      ]);
      setSettings(settingsData);
      setSyncLog(logData);
    } catch (error) {
      console.error('Error loading integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (newSettings: Partial<IntegrationSettings>) => {
    if (!settings) return;
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await service.updateIntegrationSettings(newSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleManualSync = async (type: 'projects' | 'tenders' | 'all') => {
    setSyncing(true);
    try {
      const results: SyncResult[] = [];
      
      if (type === 'projects' || type === 'all') {
        const projectResult = await service.integrateWithProjects();
        results.push({ ...projectResult, type: 'projects' } as any);
      }
      
      if (type === 'tenders' || type === 'all') {
        const tenderResult = await service.integrateWithTenders();
        results.push({ ...tenderResult, type: 'tenders' } as any);
      }
      
      // تحديث سجل التزامن
      await loadData();
    } catch (error) {
      console.error('Error during manual sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        نجح
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        فشل
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="mr-2">جاري تحميل بيانات التكامل...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة التكامل المالي</h1>
          <p className="text-muted-foreground">
            تكامل النظام المالي مع أنظمة إدارة المشاريع والمنافسات
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleManualSync('all')}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            تزامن شامل
          </Button>
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="sync">التزامن</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="logs">السجلات</TabsTrigger>
        </TabsList>

        {/* تبويب نظرة عامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* حالة التكامل */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">حالة التكامل</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">نشط</div>
                <p className="text-xs text-muted-foreground">
                  التزامن التلقائي مفعل
                </p>
              </CardContent>
            </Card>

            {/* آخر تزامن */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">آخر تزامن</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncLog.length > 0 ? formatDate(syncLog[0].timestamp).split(' ')[1] : '--:--'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {syncLog.length > 0 ? formatDate(syncLog[0].timestamp).split(' ')[0] : 'لم يتم التزامن بعد'}
                </p>
              </CardContent>
            </Card>

            {/* السجلات المعالجة */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">السجلات المعالجة</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncLog.reduce((total, log) => total + log.recordsProcessed, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  إجمالي السجلات المعالجة
                </p>
              </CardContent>
            </Card>

            {/* معدل النجاح */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {syncLog.length > 0 
                    ? Math.round((syncLog.filter(log => log.success).length / syncLog.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  من عمليات التزامن
                </p>
              </CardContent>
            </Card>
          </div>

          {/* حالة الأنظمة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>تكامل المشاريع</CardTitle>
                <CardDescription>
                  حالة التكامل مع نظام إدارة المشاريع
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>الحالة</span>
                  {settings?.enableProjectIntegration ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      مفعل
                    </Badge>
                  ) : (
                    <Badge variant="secondary">معطل</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>آخر تزامن</span>
                  <span className="text-sm text-muted-foreground">
                    {syncLog.find(log => log.type === 'projects') 
                      ? formatDate(syncLog.find(log => log.type === 'projects')!.timestamp)
                      : 'لم يتم بعد'
                    }
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleManualSync('projects')}
                  disabled={syncing}
                  className="w-full"
                >
                  تزامن المشاريع
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تكامل المنافسات</CardTitle>
                <CardDescription>
                  حالة التكامل مع نظام إدارة المنافسات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>الحالة</span>
                  {settings?.enableTenderIntegration ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      مفعل
                    </Badge>
                  ) : (
                    <Badge variant="secondary">معطل</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>آخر تزامن</span>
                  <span className="text-sm text-muted-foreground">
                    {syncLog.find(log => log.type === 'tenders') 
                      ? formatDate(syncLog.find(log => log.type === 'tenders')!.timestamp)
                      : 'لم يتم بعد'
                    }
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleManualSync('tenders')}
                  disabled={syncing}
                  className="w-full"
                >
                  تزامن المنافسات
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب التزامن */}
        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>عمليات التزامن</CardTitle>
              <CardDescription>
                إدارة عمليات تزامن البيانات المالية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncing && (
                <Alert>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    جاري تزامن البيانات المالية...
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleManualSync('projects')}
                  disabled={syncing}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Database className="w-6 h-6 mb-2" />
                  تزامن المشاريع
                </Button>
                
                <Button
                  onClick={() => handleManualSync('tenders')}
                  disabled={syncing}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <BarChart3 className="w-6 h-6 mb-2" />
                  تزامن المنافسات
                </Button>
                
                <Button
                  onClick={() => handleManualSync('all')}
                  disabled={syncing}
                  className="h-20 flex flex-col items-center justify-center"
                  variant="default"
                >
                  <Zap className="w-6 h-6 mb-2" />
                  تزامن شامل
                </Button>
              </div>

              {/* آخر نتائج التزامن */}
              {syncLog.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">آخر نتائج التزامن</h3>
                  {syncLog.slice(0, 3).map((log, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {log.type === 'projects' ? 'المشاريع' : 'المنافسات'}
                            </span>
                            {getStatusBadge(log.success)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">معالج: </span>
                            <span className="font-medium">{log.recordsProcessed}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">محدث: </span>
                            <span className="font-medium">{log.recordsUpdated}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">جديد: </span>
                            <span className="font-medium">{log.recordsCreated}</span>
                          </div>
                        </div>
                        {log.errors.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm text-red-600">
                              أخطاء: {log.errors.length}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإعدادات */}
        <TabsContent value="settings" className="space-y-6">
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle>إعدادات التكامل</CardTitle>
                <CardDescription>
                  تخصيص إعدادات التكامل والتزامن
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* التزامن التلقائي */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>التزامن التلقائي</Label>
                    <p className="text-sm text-muted-foreground">
                      تفعيل التزامن التلقائي للبيانات المالية
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoSync}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ autoSync: checked })
                    }
                  />
                </div>

                {/* فترة التزامن */}
                <div className="space-y-2">
                  <Label>فترة التزامن (بالدقائق)</Label>
                  <Input
                    type="number"
                    value={settings.syncInterval}
                    onChange={(e) => 
                      handleSettingsUpdate({ syncInterval: parseInt(e.target.value) || 15 })
                    }
                    min="5"
                    max="1440"
                  />
                  <p className="text-sm text-muted-foreground">
                    الحد الأدنى: 5 دقائق، الحد الأقصى: 1440 دقيقة (24 ساعة)
                  </p>
                </div>

                {/* تكامل المشاريع */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تكامل المشاريع</Label>
                    <p className="text-sm text-muted-foreground">
                      تفعيل التكامل مع نظام إدارة المشاريع
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableProjectIntegration}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ enableProjectIntegration: checked })
                    }
                  />
                </div>

                {/* تكامل المنافسات */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تكامل المنافسات</Label>
                    <p className="text-sm text-muted-foreground">
                      تفعيل التكامل مع نظام إدارة المنافسات
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableTenderIntegration}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ enableTenderIntegration: checked })
                    }
                  />
                </div>

                {/* التحديثات الفورية */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>التحديثات الفورية</Label>
                    <p className="text-sm text-muted-foreground">
                      تفعيل التحديثات الفورية للبيانات المالية
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableRealTimeUpdates}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ enableRealTimeUpdates: checked })
                    }
                  />
                </div>

                {/* إعدادات التنبيهات */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">إعدادات التنبيهات</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>تنبيهات البريد الإلكتروني</Label>
                      <p className="text-sm text-muted-foreground">
                        إرسال تنبيهات عبر البريد الإلكتروني
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        handleSettingsUpdate({ 
                          notificationSettings: {
                            ...settings.notificationSettings,
                            emailNotifications: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>تنبيهات النظام</Label>
                      <p className="text-sm text-muted-foreground">
                        عرض تنبيهات داخل النظام
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.systemNotifications}
                      onCheckedChange={(checked) => 
                        handleSettingsUpdate({ 
                          notificationSettings: {
                            ...settings.notificationSettings,
                            systemNotifications: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>التنبيهات الحرجة فقط</Label>
                      <p className="text-sm text-muted-foreground">
                        عرض التنبيهات الحرجة فقط
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationSettings.criticalAlertsOnly}
                      onCheckedChange={(checked) => 
                        handleSettingsUpdate({ 
                          notificationSettings: {
                            ...settings.notificationSettings,
                            criticalAlertsOnly: checked
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب السجلات */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل عمليات التزامن</CardTitle>
              <CardDescription>
                تاريخ جميع عمليات التزامن والتكامل
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncLog.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد سجلات تزامن بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {syncLog.map((log, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">
                              {log.type === 'projects' ? 'تزامن المشاريع' : 'تزامن المنافسات'}
                            </span>
                            {getStatusBadge(log.success)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {log.recordsProcessed}
                            </div>
                            <div className="text-sm text-muted-foreground">معالج</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {log.recordsUpdated}
                            </div>
                            <div className="text-sm text-muted-foreground">محدث</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {log.recordsCreated}
                            </div>
                            <div className="text-sm text-muted-foreground">جديد</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {log.errors.length}
                            </div>
                            <div className="text-sm text-muted-foreground">أخطاء</div>
                          </div>
                        </div>

                        {log.errors.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg">
                            <h4 className="font-semibold text-red-800 mb-2">الأخطاء:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {log.errors.map((error, errorIndex) => (
                                <li key={errorIndex} className="text-sm text-red-700">
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};


