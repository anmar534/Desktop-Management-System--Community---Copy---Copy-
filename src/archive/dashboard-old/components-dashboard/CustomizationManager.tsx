/**
 * مدير التخصيصات
 * Customization Manager Component
 * 
 * يوفر واجهة شاملة لإدارة تخصيصات واجهة المستخدم
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { 
  Settings, 
  Palette, 
  Layout, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Move,
  Lock,
  Unlock,
  Download,
  Upload,
  Share2
} from 'lucide-react';
import { customizationService, Widget, Theme, DashboardLayout, UserCustomization } from '../../services/customizationService';

interface CustomizationManagerState {
  widgets: Widget[];
  themes: Theme[];
  layouts: DashboardLayout[];
  userCustomization: UserCustomization | null;
  loading: boolean;
  error: string | null;
  activeTab: string;
  selectedWidget: Widget | null;
  selectedTheme: Theme | null;
  selectedLayout: DashboardLayout | null;
  isEditingWidget: boolean;
  isEditingTheme: boolean;
  isEditingLayout: boolean;
}

export const CustomizationManager: React.FC = () => {
  const [state, setState] = useState<CustomizationManagerState>({
    widgets: [],
    themes: [],
    layouts: [],
    userCustomization: null,
    loading: true,
    error: null,
    activeTab: 'widgets',
    selectedWidget: null,
    selectedTheme: null,
    selectedLayout: null,
    isEditingWidget: false,
    isEditingTheme: false,
    isEditingLayout: false
  });

  // تحميل البيانات
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [widgets, themes, layouts, userCustomization] = await Promise.all([
        customizationService.getAvailableWidgets(),
        customizationService.getAvailableThemes(),
        customizationService.getAvailableLayouts(),
        customizationService.getUserCustomization('current_user') // يجب استبدالها بمعرف المستخدم الحقيقي
      ]);

      setState(prev => ({
        ...prev,
        widgets,
        themes,
        layouts,
        userCustomization,
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

  // إدارة الودجات
  const handleToggleWidgetVisibility = async (widgetId: string) => {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    try {
      await customizationService.updateWidget(widgetId, { isVisible: !widget.isVisible });
      await loadData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في تحديث الودجة'
      }));
    }
  };

  const handleToggleWidgetLock = async (widgetId: string) => {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    try {
      await customizationService.updateWidget(widgetId, { isLocked: !widget.isLocked });
      await loadData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في تحديث الودجة'
      }));
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      await customizationService.removeWidget(widgetId);
      await loadData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في حذف الودجة'
      }));
    }
  };

  // إدارة الثيمات
  const handleApplyTheme = async (themeId: string) => {
    try {
      // تطبيق الثيم على المستخدم الحالي
      const currentCustomization = state.userCustomization || {
        userId: 'current_user',
        preferences: {
          theme: themeId,
          language: 'ar' as const,
          direction: 'rtl' as const,
          layout: 'layout_default',
          notifications: {
            enabled: true,
            sound: true,
            desktop: true,
            email: false,
            types: []
          },
          dashboard: {
            autoRefresh: true,
            refreshInterval: 30000,
            showWelcome: true,
            compactMode: false
          },
          reports: {
            defaultFormat: 'pdf' as const,
            includeCharts: true,
            includeData: true,
            autoSave: true
          }
        },
        customWidgets: [],
        customThemes: [],
        customLayouts: [],
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      currentCustomization.preferences.theme = themeId;
      await customizationService.saveUserCustomization(currentCustomization);
      await loadData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في تطبيق الثيم'
      }));
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    try {
      await customizationService.deleteCustomTheme(themeId);
      await loadData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في حذف الثيم'
      }));
    }
  };

  // إدارة التخطيطات
  const handleApplyLayout = async (layoutId: string) => {
    try {
      const currentCustomization = state.userCustomization || {
        userId: 'current_user',
        preferences: {
          theme: 'theme_default',
          language: 'ar' as const,
          direction: 'rtl' as const,
          layout: layoutId,
          notifications: {
            enabled: true,
            sound: true,
            desktop: true,
            email: false,
            types: []
          },
          dashboard: {
            autoRefresh: true,
            refreshInterval: 30000,
            showWelcome: true,
            compactMode: false
          },
          reports: {
            defaultFormat: 'pdf' as const,
            includeCharts: true,
            includeData: true,
            autoSave: true
          }
        },
        customWidgets: [],
        customThemes: [],
        customLayouts: [],
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      currentCustomization.preferences.layout = layoutId;
      await customizationService.saveUserCustomization(currentCustomization);
      await loadData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في تطبيق التخطيط'
      }));
    }
  };

  const handleDeleteLayout = async (layoutId: string) => {
    try {
      await customizationService.deleteLayout(layoutId);
      await loadData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في حذف التخطيط'
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل إعدادات التخصيص...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة التخصيصات</h1>
          <p className="text-gray-600">خصص واجهة المستخدم حسب احتياجاتك</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RotateCcw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button>
            <Save className="h-4 w-4 ml-2" />
            حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            الودجات
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            الثيمات
          </TabsTrigger>
          <TabsTrigger value="layouts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            التخطيطات
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            التفضيلات
          </TabsTrigger>
        </TabsList>

        {/* تبويب الودجات */}
        <TabsContent value="widgets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">إدارة الودجات</h2>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة ودجة جديدة
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {state.widgets.map((widget) => (
              <Card key={widget.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{widget.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleWidgetVisibility(widget.id)}
                      >
                        {widget.isVisible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleWidgetLock(widget.id)}
                      >
                        {widget.isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setState(prev => ({ ...prev, selectedWidget: widget, isEditingWidget: true }))}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الودجة</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف الودجة "{widget.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteWidget(widget.id)}>
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardDescription>{widget.nameEn}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>النوع:</span>
                      <Badge variant="secondary">{widget.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>الحالة:</span>
                      <Badge variant={widget.isVisible ? "default" : "outline"}>
                        {widget.isVisible ? "مرئي" : "مخفي"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>القفل:</span>
                      <Badge variant={widget.isLocked ? "destructive" : "outline"}>
                        {widget.isLocked ? "مقفل" : "غير مقفل"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* تبويب الثيمات */}
        <TabsContent value="themes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">إدارة الثيمات</h2>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء ثيم جديد
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {state.themes.map((theme) => (
              <Card key={theme.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{theme.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApplyTheme(theme.id)}
                      >
                        تطبيق
                      </Button>
                      {theme.isCustom && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setState(prev => ({ ...prev, selectedTheme: theme, isEditingTheme: true }))}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف الثيم</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف الثيم "{theme.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTheme(theme.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                  <CardDescription>{theme.nameEn}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>النوع:</span>
                      <Badge variant={theme.isDefault ? "default" : "secondary"}>
                        {theme.isDefault ? "افتراضي" : "مخصص"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>الحالة:</span>
                      <Badge variant={state.userCustomization?.preferences.theme === theme.id ? "default" : "outline"}>
                        {state.userCustomization?.preferences.theme === theme.id ? "مطبق" : "غير مطبق"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* تبويب التخطيطات */}
        <TabsContent value="layouts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">إدارة التخطيطات</h2>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء تخطيط جديد
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {state.layouts.map((layout) => (
              <Card key={layout.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{layout.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApplyLayout(layout.id)}
                      >
                        تطبيق
                      </Button>
                      {!layout.isDefault && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setState(prev => ({ ...prev, selectedLayout: layout, isEditingLayout: true }))}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف التخطيط</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف التخطيط "{layout.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteLayout(layout.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                  <CardDescription>{layout.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>عدد الودجات:</span>
                      <Badge variant="secondary">{layout.widgets.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>الشبكة:</span>
                      <span className="text-gray-600">{layout.gridConfig.columns}×{layout.gridConfig.rows}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>الحالة:</span>
                      <Badge variant={state.userCustomization?.preferences.layout === layout.id ? "default" : "outline"}>
                        {state.userCustomization?.preferences.layout === layout.id ? "مطبق" : "غير مطبق"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* تبويب التفضيلات */}
        <TabsContent value="preferences" className="space-y-4">
          <h2 className="text-lg font-semibold">التفضيلات العامة</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات العرض</CardTitle>
                <CardDescription>تخصيص طريقة عرض واجهة المستخدم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="language">اللغة</Label>
                  <Select value={state.userCustomization?.preferences.language || 'ar'}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="direction">الاتجاه</Label>
                  <Select value={state.userCustomization?.preferences.direction || 'rtl'}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rtl">من اليمين لليسار</SelectItem>
                      <SelectItem value="ltr">من اليسار لليمين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode">الوضع المضغوط</Label>
                  <Switch 
                    id="compact-mode"
                    checked={state.userCustomization?.preferences.dashboard.compactMode || false}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات لوحة التحكم</CardTitle>
                <CardDescription>تخصيص سلوك لوحة التحكم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-refresh">التحديث التلقائي</Label>
                  <Switch 
                    id="auto-refresh"
                    checked={state.userCustomization?.preferences.dashboard.autoRefresh || false}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-welcome">عرض رسالة الترحيب</Label>
                  <Switch 
                    id="show-welcome"
                    checked={state.userCustomization?.preferences.dashboard.showWelcome || false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">فترة التحديث (ثانية)</Label>
                  <Input
                    id="refresh-interval"
                    type="number"
                    value={state.userCustomization?.preferences.dashboard.refreshInterval ? state.userCustomization.preferences.dashboard.refreshInterval / 1000 : 30}
                    min="10"
                    max="300"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
