/**
 * مكون التقارير التفاعلية
 * Interactive Reports Component
 * 
 * يوفر واجهة شاملة لإنشاء وعرض وتصدير التقارير التفاعلية
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
import { 
  FileText, 
  Download, 
  Share2, 
  Filter, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Table,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  FileImage,
  Presentation,
  RefreshCw,
  Settings
} from 'lucide-react';
import { 
  InteractiveReport, 
  ReportData, 
  ReportFilter, 
  ExportOptions, 
  ShareConfig,
  interactiveReportsService 
} from '../../services/interactiveReportsService';

interface InteractiveReportsState {
  reports: InteractiveReport[];
  selectedReport: InteractiveReport | null;
  reportData: ReportData | null;
  activeFilters: ReportFilter[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedCategory: string;
  showCreateDialog: boolean;
  showExportDialog: boolean;
  showShareDialog: boolean;
  showFiltersPanel: boolean;
}

export const InteractiveReports: React.FC = () => {
  const [state, setState] = useState<InteractiveReportsState>({
    reports: [],
    selectedReport: null,
    reportData: null,
    activeFilters: [],
    loading: true,
    error: null,
    searchTerm: '',
    selectedCategory: 'all',
    showCreateDialog: false,
    showExportDialog: false,
    showShareDialog: false,
    showFiltersPanel: false
  });

  // تحميل التقارير
  const loadReports = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const reports = await interactiveReportsService.getAllReports();
      setState(prev => ({ ...prev, reports, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تحميل التقارير'
      }));
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // تنفيذ التقرير
  const executeReport = useCallback(async (reportId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const reportData = await interactiveReportsService.executeReport(reportId, state.activeFilters);
      setState(prev => ({ ...prev, reportData, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تنفيذ التقرير'
      }));
    }
  }, [state.activeFilters]);

  // اختيار التقرير
  const selectReport = useCallback(async (report: InteractiveReport) => {
    setState(prev => ({ ...prev, selectedReport: report }));
    await executeReport(report.id);
  }, [executeReport]);

  // تصدير التقرير
  const exportReport = useCallback(async (options: ExportOptions) => {
    if (!state.selectedReport) return;

    try {
      setState(prev => ({ ...prev, loading: true }));
      const blob = await interactiveReportsService.exportReport(
        state.selectedReport.id, 
        options, 
        state.activeFilters
      );
      
      // تحميل الملف
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.selectedReport.name}.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setState(prev => ({ ...prev, loading: false, showExportDialog: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ في تصدير التقرير'
      }));
    }
  }, [state.selectedReport, state.activeFilters]);

  // مشاركة التقرير
  const shareReport = useCallback(async (shareConfig: ShareConfig) => {
    if (!state.selectedReport) return;

    try {
      const shareUrl = await interactiveReportsService.shareReport(state.selectedReport.id, shareConfig);
      
      // نسخ الرابط إلى الحافظة
      await navigator.clipboard.writeText(shareUrl);
      
      setState(prev => ({ ...prev, showShareDialog: false }));
      // إظهار رسالة نجاح
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'حدث خطأ في مشاركة التقرير'
      }));
    }
  }, [state.selectedReport]);

  // تطبيق الفلتر
  const applyFilter = useCallback((filter: ReportFilter) => {
    setState(prev => ({
      ...prev,
      activeFilters: [...prev.activeFilters, filter]
    }));
    
    if (state.selectedReport) {
      executeReport(state.selectedReport.id);
    }
  }, [state.selectedReport, executeReport]);

  // إزالة الفلتر
  const removeFilter = useCallback((filterIndex: number) => {
    setState(prev => ({
      ...prev,
      activeFilters: prev.activeFilters.filter((_, index) => index !== filterIndex)
    }));
    
    if (state.selectedReport) {
      executeReport(state.selectedReport.id);
    }
  }, [state.selectedReport, executeReport]);

  // تصفية التقارير
  const filteredReports = state.reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                         report.nameEn.toLowerCase().includes(state.searchTerm.toLowerCase());
    const matchesCategory = state.selectedCategory === 'all' || report.category === state.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // مكون قائمة التقارير
  const ReportsList: React.FC = () => (
    <div className="space-y-4">
      {/* شريط البحث والفلترة */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في التقارير..."
              value={state.searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={state.selectedCategory} onValueChange={(value) => setState(prev => ({ ...prev, selectedCategory: value }))}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            <SelectItem value="financial">التقارير المالية</SelectItem>
            <SelectItem value="projects">تقارير المشاريع</SelectItem>
            <SelectItem value="tenders">تقارير المنافسات</SelectItem>
            <SelectItem value="performance">تقارير الأداء</SelectItem>
            <SelectItem value="custom">تقارير مخصصة</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setState(prev => ({ ...prev, showCreateDialog: true }))}>
          <Plus className="h-4 w-4 ml-2" />
          تقرير جديد
        </Button>
      </div>

      {/* قائمة التقارير */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => (
          <Card 
            key={report.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              state.selectedReport?.id === report.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => selectReport(report)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {report.type === 'table' && <Table className="h-4 w-4" />}
                  {report.type === 'chart' && <BarChart3 className="h-4 w-4" />}
                  {report.type === 'dashboard' && <PieChart className="h-4 w-4" />}
                  {report.type === 'mixed' && <TrendingUp className="h-4 w-4" />}
                  <CardTitle className="text-sm">{report.name}</CardTitle>
                </div>
                <Badge variant={report.isPublic ? "default" : "secondary"}>
                  {report.isPublic ? "عام" : "خاص"}
                </Badge>
              </div>
              <CardDescription className="text-xs">{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>الفئة: {getCategoryName(report.category)}</span>
                <span>{new Date(report.updatedAt).toLocaleDateString('ar-SA')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // مكون عارض التقرير
  const ReportViewer: React.FC = () => {
    if (!state.selectedReport) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>اختر تقريراً لعرضه</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* رأس التقرير */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{state.selectedReport.name}</h2>
            <p className="text-gray-600">{state.selectedReport.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showFiltersPanel: !prev.showFiltersPanel }))}
            >
              <Filter className="h-4 w-4 ml-2" />
              الفلاتر
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showExportDialog: true }))}
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showShareDialog: true }))}
            >
              <Share2 className="h-4 w-4 ml-2" />
              مشاركة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeReport(state.selectedReport!.id)}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </div>

        {/* الفلاتر النشطة */}
        {state.activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {state.activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {filter.label}: {String(filter.value)}
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* محتوى التقرير */}
        {state.loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : state.reportData ? (
          <div className="space-y-6">
            {/* الرسوم البيانية */}
            {state.selectedReport.layout.showCharts && state.selectedReport.charts.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {state.selectedReport.charts.map((chart) => (
                  <Card key={chart.id}>
                    <CardHeader>
                      <CardTitle className="text-sm">{chart.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                        <p className="text-gray-500">رسم بياني: {chart.type}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* جدول البيانات */}
            {state.selectedReport.layout.showTable && (
              <Card>
                <CardHeader>
                  <CardTitle>البيانات</CardTitle>
                  <CardDescription>
                    إجمالي السجلات: {state.reportData.totalCount}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          {state.selectedReport.columns.map((column) => (
                            <th key={column.id} className="border border-gray-200 px-4 py-2 text-right">
                              {column.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {state.reportData.rows.slice(0, 100).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {state.selectedReport!.columns.map((column) => (
                              <td key={column.id} className="border border-gray-200 px-4 py-2">
                                {formatCellValue(row[column.id], column.type)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {state.reportData.rows.length > 100 && (
                    <p className="text-sm text-gray-500 mt-2">
                      عرض أول 100 سجل من أصل {state.reportData.totalCount}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            لا توجد بيانات لعرضها
          </div>
        )}
      </div>
    );
  };

  // تنسيق قيم الخلايا
  const formatCellValue = (value: any, type: string): string => {
    if (value == null) return '';
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('ar-SA', { 
          style: 'currency', 
          currency: 'SAR' 
        }).format(Number(value));
      case 'percentage':
        return `${Number(value).toFixed(2)}%`;
      case 'date':
        return new Date(value).toLocaleDateString('ar-SA');
      case 'number':
        return new Intl.NumberFormat('ar-SA').format(Number(value));
      default:
        return String(value);
    }
  };

  // الحصول على اسم الفئة
  const getCategoryName = (category: string): string => {
    const categories: Record<string, string> = {
      financial: 'مالية',
      projects: 'مشاريع',
      tenders: 'منافسات',
      performance: 'أداء',
      custom: 'مخصصة'
    };
    return categories[category] || category;
  };

  if (state.loading && state.reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير التفاعلية</h1>
          <p className="text-gray-600">إنشاء وعرض وتصدير التقارير التفاعلية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
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

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="viewer">عارض التقرير</TabsTrigger>
          <TabsTrigger value="templates">القوالب</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <ReportsList />
        </TabsContent>

        <TabsContent value="viewer">
          <ReportViewer />
        </TabsContent>

        <TabsContent value="templates">
          <div className="text-center py-8 text-gray-500">
            قوالب التقارير (قريباً)
          </div>
        </TabsContent>
      </Tabs>

      {/* حوار التصدير */}
      <Dialog open={state.showExportDialog} onOpenChange={(open) => setState(prev => ({ ...prev, showExportDialog: open }))}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تصدير التقرير</DialogTitle>
            <DialogDescription>
              اختر تنسيق التصدير والخيارات المطلوبة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>تنسيق التصدير</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => exportReport({ format: 'pdf', includeCharts: true, includeData: true, includeFilters: true, pageSize: 'A4', orientation: 'portrait', quality: 'high', customization: {} })}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportReport({ format: 'excel', includeCharts: true, includeData: true, includeFilters: true, pageSize: 'A4', orientation: 'portrait', quality: 'high', customization: {} })}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportReport({ format: 'powerpoint', includeCharts: true, includeData: true, includeFilters: true, pageSize: 'A4', orientation: 'portrait', quality: 'high', customization: {} })}
                  className="flex items-center gap-2"
                >
                  <Presentation className="h-4 w-4" />
                  PowerPoint
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportReport({ format: 'png', includeCharts: true, includeData: true, includeFilters: true, pageSize: 'A4', orientation: 'portrait', quality: 'high', customization: {} })}
                  className="flex items-center gap-2"
                >
                  <FileImage className="h-4 w-4" />
                  صورة
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار المشاركة */}
      <Dialog open={state.showShareDialog} onOpenChange={(open) => setState(prev => ({ ...prev, showShareDialog: open }))}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>مشاركة التقرير</DialogTitle>
            <DialogDescription>
              إنشاء رابط مشاركة للتقرير
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => shareReport({ type: 'link', permissions: 'view', allowDownload: true, allowPrint: true })}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                رابط عام
              </Button>
              <Button
                variant="outline"
                onClick={() => shareReport({ type: 'email', permissions: 'view', allowDownload: false, allowPrint: true })}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                بريد إلكتروني
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
