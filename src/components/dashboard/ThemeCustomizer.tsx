/**
 * مخصص الثيمات
 * Theme Customizer Component
 * 
 * يوفر واجهة متقدمة لتخصيص الألوان والثيمات
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Palette, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Eye, 
  Copy,
  Trash2,
  Plus,
  Paintbrush,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { Theme, customizationService } from '../../services/customizationService';

interface ColorPalette {
  name: string;
  nameEn: string;
  colors: Record<string, string>;
}

interface ThemeCustomizerState {
  currentTheme: Theme | null;
  availableThemes: Theme[];
  isEditing: boolean;
  previewMode: boolean;
  selectedColorCategory: string;
  colorPalettes: ColorPalette[];
  loading: boolean;
  error: string | null;
}

const defaultColorPalettes: ColorPalette[] = [
  {
    name: 'الأزرق الكلاسيكي',
    nameEn: 'Classic Blue',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  {
    name: 'الأخضر الطبيعي',
    nameEn: 'Natural Green',
    colors: {
      primary: '#059669',
      secondary: '#6b7280',
      accent: '#d97706',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    }
  },
  {
    name: 'البنفسجي الأنيق',
    nameEn: 'Elegant Purple',
    colors: {
      primary: '#7c3aed',
      secondary: '#6b7280',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#8b5cf6'
    }
  }
];

export const ThemeCustomizer: React.FC = () => {
  const [state, setState] = useState<ThemeCustomizerState>({
    currentTheme: null,
    availableThemes: [],
    isEditing: false,
    previewMode: false,
    selectedColorCategory: 'primary',
    colorPalettes: defaultColorPalettes,
    loading: true,
    error: null
  });

  // تحميل الثيمات المتاحة
  const loadThemes = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const themes = await customizationService.getAvailableThemes();
      const defaultTheme = themes.find(t => t.isDefault) || themes[0];
      
      setState(prev => ({
        ...prev,
        availableThemes: themes,
        currentTheme: defaultTheme,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تحميل الثيمات'
      }));
    }
  }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  // تحديث لون في الثيم الحالي
  const updateColor = useCallback((colorKey: string, colorValue: string) => {
    if (!state.currentTheme) return;

    setState(prev => ({
      ...prev,
      currentTheme: prev.currentTheme ? {
        ...prev.currentTheme,
        colors: {
          ...prev.currentTheme.colors,
          [colorKey]: colorValue
        }
      } : null
    }));
  }, [state.currentTheme]);

  // تطبيق لوحة ألوان
  const applyColorPalette = useCallback((palette: ColorPalette) => {
    if (!state.currentTheme) return;

    setState(prev => ({
      ...prev,
      currentTheme: prev.currentTheme ? {
        ...prev.currentTheme,
        colors: {
          ...prev.currentTheme.colors,
          ...palette.colors
        }
      } : null
    }));
  }, [state.currentTheme]);

  // حفظ الثيم المخصص
  const saveCustomTheme = useCallback(async () => {
    if (!state.currentTheme) return;

    try {
      const customTheme = {
        ...state.currentTheme,
        name: `${state.currentTheme.name} (مخصص)`,
        nameEn: `${state.currentTheme.nameEn} (Custom)`,
        isCustom: true,
        isDefault: false
      };

      await customizationService.createCustomTheme(customTheme);
      await loadThemes();
      
      setState(prev => ({ ...prev, isEditing: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في حفظ الثيم'
      }));
    }
  }, [state.currentTheme, loadThemes]);

  // تصدير الثيم
  const exportTheme = useCallback(() => {
    if (!state.currentTheme) return;

    const themeData = JSON.stringify(state.currentTheme, null, 2);
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${state.currentTheme.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.currentTheme]);

  // استيراد الثيم
  const importTheme = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const themeData = JSON.parse(e.target?.result as string);
        await customizationService.createCustomTheme(themeData);
        await loadThemes();
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'حدث خطأ في استيراد الثيم. تأكد من صحة الملف.'
        }));
      }
    };
    reader.readAsText(file);
  }, [loadThemes]);

  // مكون اختيار اللون
  const ColorPicker: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (value: string) => void;
    description?: string;
  }> = ({ label, value, onChange, description }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-gray-600">{description}</p>}
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value;
            input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigator.clipboard.writeText(value)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // معاينة الثيم
  const ThemePreview: React.FC = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* بطاقة المعاينة الأساسية */}
        <Card style={{ backgroundColor: state.currentTheme?.colors.surface }}>
          <CardHeader style={{ borderBottomColor: state.currentTheme?.colors.border }}>
            <CardTitle style={{ color: state.currentTheme?.colors.text }}>
              عنوان البطاقة
            </CardTitle>
            <CardDescription style={{ color: state.currentTheme?.colors.textSecondary }}>
              وصف البطاقة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                style={{ 
                  backgroundColor: state.currentTheme?.colors.primary,
                  color: 'white'
                }}
                size="sm"
              >
                زر أساسي
              </Button>
              <Button 
                variant="outline" 
                style={{ 
                  borderColor: state.currentTheme?.colors.border,
                  color: state.currentTheme?.colors.text
                }}
                size="sm"
              >
                زر ثانوي
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* بطاقة الحالات */}
        <Card style={{ backgroundColor: state.currentTheme?.colors.surface }}>
          <CardHeader>
            <CardTitle style={{ color: state.currentTheme?.colors.text }}>
              حالات الألوان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge style={{ backgroundColor: state.currentTheme?.colors.success }}>
              نجاح
            </Badge>
            <Badge style={{ backgroundColor: state.currentTheme?.colors.warning }}>
              تحذير
            </Badge>
            <Badge style={{ backgroundColor: state.currentTheme?.colors.error }}>
              خطأ
            </Badge>
            <Badge style={{ backgroundColor: state.currentTheme?.colors.info }}>
              معلومات
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* شريط الألوان */}
      <div className="grid grid-cols-6 gap-2">
        {Object.entries(state.currentTheme?.colors || {}).map(([key, color]) => (
          <div key={key} className="text-center">
            <div 
              className="w-full h-12 rounded border"
              style={{ backgroundColor: color }}
            />
            <p className="text-xs mt-1 capitalize">{key}</p>
            <p className="text-xs text-gray-500 font-mono">{color}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل مخصص الثيمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مخصص الثيمات</h1>
          <p className="text-gray-600">خصص ألوان وثيمات واجهة المستخدم</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setState(prev => ({ ...prev, previewMode: !prev.previewMode }))}>
            <Eye className="h-4 w-4 ml-2" />
            {state.previewMode ? "إخفاء المعاينة" : "معاينة"}
          </Button>
          <Button variant="outline" onClick={exportTheme}>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 ml-2" />
                استيراد
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importTheme}
              className="hidden"
            />
          </label>
          <Button onClick={saveCustomTheme} disabled={!state.isEditing}>
            <Save className="h-4 w-4 ml-2" />
            حفظ الثيم
          </Button>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* قائمة الثيمات */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">الثيمات المتاحة</h2>
          <div className="space-y-2">
            {state.availableThemes.map((theme) => (
              <Card 
                key={theme.id} 
                className={`cursor-pointer transition-all ${
                  state.currentTheme?.id === theme.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setState(prev => ({ ...prev, currentTheme: theme, isEditing: false }))}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{theme.name}</h3>
                      <p className="text-sm text-gray-600">{theme.nameEn}</p>
                    </div>
                    <div className="flex items-center gap-1">
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
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={theme.isDefault ? "default" : "secondary"}>
                      {theme.isDefault ? "افتراضي" : "مخصص"}
                    </Badge>
                    {theme.isCustom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // حذف الثيم المخصص
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* محرر الثيم */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">تحرير الثيم</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, isEditing: !prev.isEditing }))}
            >
              <Paintbrush className="h-4 w-4 ml-2" />
              {state.isEditing ? "إنهاء التحرير" : "بدء التحرير"}
            </Button>
          </div>

          {state.currentTheme && (
            <Tabs defaultValue="colors">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="colors">الألوان</TabsTrigger>
                <TabsTrigger value="fonts">الخطوط</TabsTrigger>
                <TabsTrigger value="spacing">المسافات</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                {/* لوحات الألوان السريعة */}
                <div>
                  <Label className="text-sm font-medium">لوحات الألوان السريعة</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {state.colorPalettes.map((palette) => (
                      <Button
                        key={palette.name}
                        variant="outline"
                        size="sm"
                        onClick={() => applyColorPalette(palette)}
                        className="justify-start"
                        disabled={!state.isEditing}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {Object.values(palette.colors).slice(0, 3).map((color, index) => (
                              <div
                                key={index}
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span>{palette.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* محرر الألوان */}
                <div className="space-y-4">
                  <ColorPicker
                    label="اللون الأساسي"
                    value={state.currentTheme.colors.primary}
                    onChange={(value) => updateColor('primary', value)}
                    description="اللون الرئيسي للواجهة"
                  />
                  <ColorPicker
                    label="اللون الثانوي"
                    value={state.currentTheme.colors.secondary}
                    onChange={(value) => updateColor('secondary', value)}
                    description="اللون الثانوي للعناصر"
                  />
                  <ColorPicker
                    label="لون التمييز"
                    value={state.currentTheme.colors.accent}
                    onChange={(value) => updateColor('accent', value)}
                    description="لون التمييز والتركيز"
                  />
                  <ColorPicker
                    label="لون الخلفية"
                    value={state.currentTheme.colors.background}
                    onChange={(value) => updateColor('background', value)}
                    description="لون خلفية الصفحة"
                  />
                  <ColorPicker
                    label="لون السطح"
                    value={state.currentTheme.colors.surface}
                    onChange={(value) => updateColor('surface', value)}
                    description="لون خلفية البطاقات"
                  />
                </div>
              </TabsContent>

              <TabsContent value="fonts" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>الخط الأساسي</Label>
                    <Select value={state.currentTheme.fonts.primary}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cairo, sans-serif">Cairo</SelectItem>
                        <SelectItem value="Tajawal, sans-serif">Tajawal</SelectItem>
                        <SelectItem value="Amiri, serif">Amiri</SelectItem>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>الخط الثانوي</Label>
                    <Select value={state.currentTheme.fonts.secondary}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                        <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="spacing" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>نصف القطر للحدود</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <Label className="text-xs">صغير</Label>
                        <Input value={state.currentTheme.borderRadius.sm} readOnly />
                      </div>
                      <div>
                        <Label className="text-xs">متوسط</Label>
                        <Input value={state.currentTheme.borderRadius.md} readOnly />
                      </div>
                      <div>
                        <Label className="text-xs">كبير</Label>
                        <Input value={state.currentTheme.borderRadius.lg} readOnly />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* معاينة الثيم */}
        {state.previewMode && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">معاينة الثيم</h2>
            <ThemePreview />
          </div>
        )}
      </div>
    </div>
  );
};
