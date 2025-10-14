/**
 * مكون منشئ التقارير
 * Report Builder Component
 * 
 * يوفر واجهة لإنشاء وتخصيص التقارير التفاعلية
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Settings,
  Database,
  Filter,
  BarChart3,
  Table,
  Layout
} from 'lucide-react';
import { 
  InteractiveReport, 
  ReportColumn, 
  ReportFilter, 
  ReportChart,
  DrillDownConfig,
  interactiveReportsService 
} from '../../services/interactiveReportsService';

interface ReportBuilderState {
  report: Partial<InteractiveReport>;
  availableFields: Record<string, any[]>;
  loading: boolean;
  error: string | null;
  previewMode: boolean;
}

export const ReportBuilder: React.FC = () => {
  const [state, setState] = useState<ReportBuilderState>({
    report: {
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      category: 'custom',
      type: 'table',
      dataSource: 'projects',
      columns: [],
      filters: [],
      charts: [],
      drillDown: {
        enabled: false,
        levels: [],
        maxDepth: 3
      },
      layout: {
        showFilters: true,
        showCharts: true,
        showTable: true,
        chartsPosition: 'top'
      },
      permissions: [],
      isPublic: false,
      isShared: false,
      sharedWith: [],
      createdBy: 'current-user'
    },
    availableFields: {},
    loading: false,
    error: null,
    previewMode: false
  });

  // تحديث خصائص التقرير
  const updateReport = useCallback((updates: Partial<InteractiveReport>) => {
    setState(prev => ({
      ...prev,
      report: { ...prev.report, ...updates }
    }));
  }, []);

  // إضافة عمود
  const addColumn = useCallback(() => {
    const newColumn: ReportColumn = {
      id: `col_${Date.now()}`,
      name: '',
      nameEn: '',
      type: 'text',
      sortable: true,
      filterable: true,
      aggregatable: false
    };

    setState(prev => ({
      ...prev,
      report: {
        ...prev.report,
        columns: [...(prev.report.columns || []), newColumn]
      }
    }));
  }, []);

  // تحديث عمود
  const updateColumn = useCallback((index: number, updates: Partial<ReportColumn>) => {
    setState(prev => ({
      ...prev,
      report: {
        ...prev.report,
        columns: prev.report.columns?.map((col, i) => 
          i === index ? { ...col, ...updates } : col
        ) || []
      }
    }));
  }, []);

  // حذف عمود
  const removeColumn = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      report: {
        ...prev.report,
        columns: prev.report.columns?.filter((_, i) => i !== index) || []
      }
    }));
  }, []);

  // إضافة فلتر
  const addFilter = useCallback(() => {
    const newFilter: ReportFilter = {
      field: '',
      operator: 'equals',
      value: '',
      label: '',
      labelEn: ''
    };

    setState(prev => ({
      ...prev,
      report: {
        ...prev.report,
        filters: [...(prev.report.filters || []), newFilter]
      }
    }));
  }, []);

  // تحديث فلتر
  const updateFilter = useCallback((index: number, updates: Partial<ReportFilter>) => {
    setState(prev => ({
      ...prev,
      report: {
        ...prev.report,
        filters: prev.report.filters?.map((filter, i) => 
          i === index ? { ...filter, ...updates } : filter
        ) || []
      }
    }));
  }, []);

  // حذف فلتر
  const removeFilter = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      report: {
        ...prev.report,
        filters: prev.report.filters?.filter((_, i) => i !== index) || []
      }
    }));
  }, []);

  // إضافة رسم بياني
  const addChart = useCallback(() => {
    const newChart: ReportChart = {
      id: `chart_${Date.now()}`,
      type: 'bar',
      title: '',
      titleEn: '',
      dataSource: state.report.dataSource || 'projects',
      xAxis: '',
      yAxis: '',
      aggregation: 'count',
      config: {}
    };

    setState(prev => ({
      ...prev,
      report: {
        ...prev.report,
        charts: [...(prev.report.charts || []), newChart]
      }
    }));
  }, [state.report.dataSource]);

  // تحديث رسم بياني
  const updateChart = useCallback((index: number, updates: Partial<ReportChart>) => {
    setState(prev => ({
      ...prev,
      report: {
        ...prev.report,
        charts: prev.report.charts?.map((chart, i) => 
          i === index ? { ...chart, ...updates } : chart
        ) || []
      }
    }));
  }, []);

  // حذف رسم بياني
  const removeChart = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      report: {
        ...prev.report,
        charts: prev.report.charts?.filter((_, i) => i !== index) || []
      }
    }));
  }, []);

  // حفظ التقرير
  const saveReport = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      if (!state.report.name || !state.report.dataSource) {
        throw new Error('يرجى إدخال اسم التقرير ومصدر البيانات');
      }

      await interactiveReportsService.createReport(state.report as Omit<InteractiveReport, 'id' | 'createdAt' | 'updatedAt'>);
      
      setState(prev => ({ ...prev, loading: false }));
      // إظهار رسالة نجاح وإعادة توجيه
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في حفظ التقرير'
      }));
    }
  }, [state.report]);

  // مكون إعدادات عامة
  const GeneralSettings: React.FC = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">اسم التقرير (عربي)</Label>
          <Input
            id="name"
            value={state.report.name || ''}
            onChange={(e) => updateReport({ name: e.target.value })}
            placeholder="أدخل اسم التقرير"
          />
        </div>
        <div>
          <Label htmlFor="nameEn">اسم التقرير (إنجليزي)</Label>
          <Input
            id="nameEn"
            value={state.report.nameEn || ''}
            onChange={(e) => updateReport({ nameEn: e.target.value })}
            placeholder="Enter report name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="description">الوصف (عربي)</Label>
          <Textarea
            id="description"
            value={state.report.description || ''}
            onChange={(e) => updateReport({ description: e.target.value })}
            placeholder="أدخل وصف التقرير"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="descriptionEn">الوصف (إنجليزي)</Label>
          <Textarea
            id="descriptionEn"
            value={state.report.descriptionEn || ''}
            onChange={(e) => updateReport({ descriptionEn: e.target.value })}
            placeholder="Enter report description"
            rows={3}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>الفئة</Label>
          <Select value={state.report.category} onValueChange={(value) => updateReport({ category: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">التقارير المالية</SelectItem>
              <SelectItem value="projects">تقارير المشاريع</SelectItem>
              <SelectItem value="tenders">تقارير المنافسات</SelectItem>
              <SelectItem value="performance">تقارير الأداء</SelectItem>
              <SelectItem value="custom">تقارير مخصصة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>نوع التقرير</Label>
          <Select value={state.report.type} onValueChange={(value) => updateReport({ type: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">جدول</SelectItem>
              <SelectItem value="chart">رسم بياني</SelectItem>
              <SelectItem value="dashboard">لوحة معلومات</SelectItem>
              <SelectItem value="mixed">مختلط</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>مصدر البيانات</Label>
          <Select value={state.report.dataSource} onValueChange={(value) => updateReport({ dataSource: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="projects">المشاريع</SelectItem>
              <SelectItem value="tenders">المنافسات</SelectItem>
              <SelectItem value="expenses">المصروفات</SelectItem>
              <SelectItem value="invoices">الفواتير</SelectItem>
              <SelectItem value="clients">العملاء</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="isPublic"
            checked={state.report.isPublic}
            onCheckedChange={(checked) => updateReport({ isPublic: !!checked })}
          />
          <Label htmlFor="isPublic">تقرير عام</Label>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="isShared"
            checked={state.report.isShared}
            onCheckedChange={(checked) => updateReport({ isShared: !!checked })}
          />
          <Label htmlFor="isShared">قابل للمشاركة</Label>
        </div>
      </div>
    </div>
  );

  // مكون إدارة الأعمدة
  const ColumnsManager: React.FC = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">أعمدة التقرير</h3>
        <Button onClick={addColumn} size="sm">
          <Plus className="h-4 w-4 ml-2" />
          إضافة عمود
        </Button>
      </div>

      <div className="space-y-3">
        {state.report.columns?.map((column, index) => (
          <Card key={column.id}>
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 items-end">
                <div>
                  <Label>اسم العمود</Label>
                  <Input
                    value={column.name}
                    onChange={(e) => updateColumn(index, { name: e.target.value })}
                    placeholder="اسم العمود"
                  />
                </div>
                <div>
                  <Label>معرف الحقل</Label>
                  <Input
                    value={column.id}
                    onChange={(e) => updateColumn(index, { id: e.target.value })}
                    placeholder="field_id"
                  />
                </div>
                <div>
                  <Label>نوع البيانات</Label>
                  <Select value={column.type} onValueChange={(value) => updateColumn(index, { type: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">نص</SelectItem>
                      <SelectItem value="number">رقم</SelectItem>
                      <SelectItem value="date">تاريخ</SelectItem>
                      <SelectItem value="currency">عملة</SelectItem>
                      <SelectItem value="percentage">نسبة مئوية</SelectItem>
                      <SelectItem value="status">حالة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      checked={column.sortable}
                      onCheckedChange={(checked) => updateColumn(index, { sortable: !!checked })}
                    />
                    <Label className="text-xs">قابل للترتيب</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeColumn(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) || []}
      </div>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">منشئ التقارير</h1>
          <p className="text-gray-600">إنشاء تقرير تفاعلي جديد</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setState(prev => ({ ...prev, previewMode: !prev.previewMode }))}>
            <Eye className="h-4 w-4 ml-2" />
            معاينة
          </Button>
          <Button onClick={saveReport} disabled={state.loading}>
            <Save className="h-4 w-4 ml-2" />
            حفظ التقرير
          </Button>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 ml-2" />
            إعدادات عامة
          </TabsTrigger>
          <TabsTrigger value="columns">
            <Table className="h-4 w-4 ml-2" />
            الأعمدة
          </TabsTrigger>
          <TabsTrigger value="filters">
            <Filter className="h-4 w-4 ml-2" />
            الفلاتر
          </TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart3 className="h-4 w-4 ml-2" />
            الرسوم البيانية
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 ml-2" />
            التخطيط
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
              <CardDescription>تكوين الخصائص الأساسية للتقرير</CardDescription>
            </CardHeader>
            <CardContent>
              <GeneralSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الأعمدة</CardTitle>
              <CardDescription>تحديد الأعمدة التي ستظهر في التقرير</CardDescription>
            </CardHeader>
            <CardContent>
              <ColumnsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters">
          <div className="text-center py-8 text-gray-500">
            إدارة الفلاتر (قريباً)
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <div className="text-center py-8 text-gray-500">
            إدارة الرسوم البيانية (قريباً)
          </div>
        </TabsContent>

        <TabsContent value="layout">
          <div className="text-center py-8 text-gray-500">
            إعدادات التخطيط (قريباً)
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
