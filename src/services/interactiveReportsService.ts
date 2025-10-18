/**
 * خدمة التقارير التفاعلية القابلة للتصدير
 * Interactive Reports Service with Export Capabilities
 * 
 * يوفر نظام شامل لإنشاء وإدارة التقارير التفاعلية مع إمكانيات التصدير المتقدمة
 */

import { asyncStorage } from '../utils/storage';

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: any;
  label: string;
  labelEn: string;
}

export interface ReportColumn {
  id: string;
  name: string;
  nameEn: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'status';
  width?: number;
  sortable: boolean;
  filterable: boolean;
  aggregatable: boolean;
  format?: string;
}

export interface ReportChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  title: string;
  titleEn: string;
  dataSource: string;
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  config: Record<string, any>;
}

export interface DrillDownConfig {
  enabled: boolean;
  levels: {
    field: string;
    name: string;
    nameEn: string;
    type: 'category' | 'time' | 'hierarchy';
  }[];
  maxDepth: number;
}

export interface InteractiveReport {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: 'financial' | 'projects' | 'tenders' | 'performance' | 'custom';
  type: 'table' | 'chart' | 'dashboard' | 'mixed';
  dataSource: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
  charts: ReportChart[];
  drillDown: DrillDownConfig;
  layout: {
    showFilters: boolean;
    showCharts: boolean;
    showTable: boolean;
    chartsPosition: 'top' | 'bottom' | 'side';
  };
  permissions: string[];
  isPublic: boolean;
  isShared: boolean;
  sharedWith: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'powerpoint' | 'png' | 'svg' | 'csv';
  includeCharts: boolean;
  includeData: boolean;
  includeFilters: boolean;
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  template?: string;
  customization: {
    title?: string;
    subtitle?: string;
    logo?: string;
    watermark?: string;
    footer?: string;
  };
}

export interface ReportData {
  rows: Record<string, any>[];
  totalCount: number;
  aggregations: Record<string, any>;
  metadata: {
    generatedAt: string;
    filters: ReportFilter[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export interface ShareConfig {
  type: 'link' | 'email' | 'embed';
  permissions: 'view' | 'edit' | 'admin';
  expiresAt?: string;
  password?: string;
  allowDownload: boolean;
  allowPrint: boolean;
}

export class InteractiveReportsService {
  private readonly STORAGE_KEY = 'interactive_reports';
  private readonly DATA_CACHE_KEY = 'reports_data_cache';
  private readonly TEMPLATES_KEY = 'report_templates';

  // إنشاء تقرير جديد
  async createReport(report: Omit<InteractiveReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<InteractiveReport> {
    const newReport: InteractiveReport = {
      ...report,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const reports = await this.getAllReports();
    reports.push(newReport);
    await asyncStorage.setItem(this.STORAGE_KEY, reports);

    return newReport;
  }

  // الحصول على جميع التقارير
  async getAllReports(): Promise<InteractiveReport[]> {
    try {
      const reports = await asyncStorage.getItem(this.STORAGE_KEY) || [];
      return Array.isArray(reports) ? reports : [];
    } catch (error) {
      console.error('Error loading reports:', error);
      return [];
    }
  }

  // الحصول على تقرير بالمعرف
  async getReportById(reportId: string): Promise<InteractiveReport | null> {
    const reports = await this.getAllReports();
    return reports.find(r => r.id === reportId) || null;
  }

  // تحديث تقرير
  async updateReport(reportId: string, updates: Partial<InteractiveReport>): Promise<InteractiveReport | null> {
    const reports = await this.getAllReports();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) return null;

    reports[reportIndex] = {
      ...reports[reportIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await asyncStorage.setItem(this.STORAGE_KEY, reports);
    return reports[reportIndex];
  }

  // حذف تقرير
  async deleteReport(reportId: string): Promise<boolean> {
    const reports = await this.getAllReports();
    const filteredReports = reports.filter(r => r.id !== reportId);
    
    if (filteredReports.length === reports.length) return false;

    await asyncStorage.setItem(this.STORAGE_KEY, filteredReports);
    return true;
  }

  // تنفيذ التقرير وجلب البيانات
  async executeReport(reportId: string, filters: ReportFilter[] = [], sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc'): Promise<ReportData> {
    const report = await this.getReportById(reportId);
    if (!report) throw new Error('Report not found');

    // جلب البيانات من المصدر
    const rawData = await this.fetchDataFromSource(report.dataSource);
    
    // تطبيق الفلاتر
    const filteredData = this.applyFilters(rawData, [...report.filters, ...filters]);
    
    // تطبيق الترتيب
    const sortedData = this.applySorting(filteredData, sortBy, sortOrder);
    
    // حساب التجميعات
    const aggregations = this.calculateAggregations(sortedData, report.columns);

    return {
      rows: sortedData,
      totalCount: sortedData.length,
      aggregations,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: [...report.filters, ...filters],
        sortBy,
        sortOrder
      }
    };
  }

  // تصدير التقرير
  async exportReport(reportId: string, options: ExportOptions, filters: ReportFilter[] = []): Promise<Blob> {
    const report = await this.getReportById(reportId);
    if (!report) throw new Error('Report not found');

    const reportData = await this.executeReport(reportId, filters);

    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(report, reportData, options);
      case 'excel':
        return this.exportToExcel(report, reportData, options);
      case 'powerpoint':
        return this.exportToPowerPoint(report, reportData, options);
      case 'png':
      case 'svg':
        return this.exportToImage(report, reportData, options);
      case 'csv':
        return this.exportToCSV(report, reportData, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  // مشاركة التقرير
  async shareReport(reportId: string, shareConfig: ShareConfig): Promise<string> {
    const report = await this.getReportById(reportId);
    if (!report) throw new Error('Report not found');

    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const shareData = {
      id: shareId,
      reportId,
      config: shareConfig,
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: null
    };

    const shares = await asyncStorage.getItem('report_shares') || [];
    shares.push(shareData);
    await asyncStorage.setItem('report_shares', shares);

    // إنشاء رابط المشاركة
    const shareUrl = this.generateShareUrl(shareId, shareConfig.type);
    return shareUrl;
  }

  // الحصول على البيانات من المصدر
  private async fetchDataFromSource(dataSource: string): Promise<Record<string, any>[]> {
    switch (dataSource) {
      case 'projects':
        return await asyncStorage.getItem('projects') || [];
      case 'tenders':
        return await asyncStorage.getItem('tenders') || [];
      case 'expenses':
        return await asyncStorage.getItem('expenses') || [];
      case 'invoices':
        return await asyncStorage.getItem('invoices') || [];
      case 'clients':
        return await asyncStorage.getItem('clients') || [];
      default:
        return [];
    }
  }

  // تطبيق الفلاتر
  private applyFilters(data: Record<string, any>[], filters: ReportFilter[]): Record<string, any>[] {
    return data.filter(row => {
      return filters.every(filter => {
        const value = row[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          case 'between':
            return Number(value) >= Number(filter.value[0]) && Number(value) <= Number(filter.value[1]);
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          default:
            return true;
        }
      });
    });
  }

  // تطبيق الترتيب
  private applySorting(data: Record<string, any>[], sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc'): Record<string, any>[] {
    if (!sortBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  // حساب التجميعات
  private calculateAggregations(data: Record<string, any>[], columns: ReportColumn[]): Record<string, any> {
    const aggregations: Record<string, any> = {};
    
    columns.filter(col => col.aggregatable).forEach(column => {
      const values = data.map(row => row[column.id]).filter(val => val != null);
      
      if (column.type === 'number' || column.type === 'currency') {
        aggregations[`${column.id}_sum`] = values.reduce((sum, val) => sum + Number(val), 0);
        aggregations[`${column.id}_avg`] = values.length > 0 ? aggregations[`${column.id}_sum`] / values.length : 0;
        aggregations[`${column.id}_min`] = values.length > 0 ? Math.min(...values.map(Number)) : 0;
        aggregations[`${column.id}_max`] = values.length > 0 ? Math.max(...values.map(Number)) : 0;
      }
      
      aggregations[`${column.id}_count`] = values.length;
    });

    return aggregations;
  }

  // تصدير إلى PDF
  private async exportToPDF(report: InteractiveReport, data: ReportData, options: ExportOptions): Promise<Blob> {
    // تنفيذ تصدير PDF (سيتم تطويره مع مكتبة PDF)
    const content = this.generatePDFContent(report, data, options);
    return new Blob([content], { type: 'application/pdf' });
  }

  // تصدير إلى Excel
  private async exportToExcel(report: InteractiveReport, data: ReportData, options: ExportOptions): Promise<Blob> {
    // تنفيذ تصدير Excel (سيتم تطويره مع مكتبة Excel)
    const content = this.generateExcelContent(report, data, options);
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // تصدير إلى PowerPoint
  private async exportToPowerPoint(report: InteractiveReport, data: ReportData, options: ExportOptions): Promise<Blob> {
    // تنفيذ تصدير PowerPoint (سيتم تطويره مع مكتبة PowerPoint)
    const content = this.generatePowerPointContent(report, data, options);
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }

  // تصدير إلى صورة
  private async exportToImage(report: InteractiveReport, data: ReportData, options: ExportOptions): Promise<Blob> {
    // تنفيذ تصدير الصورة (سيتم تطويره مع Canvas API)
    const content = this.generateImageContent(report, data, options);
    const mimeType = options.format === 'png' ? 'image/png' : 'image/svg+xml';
    return new Blob([content], { type: mimeType });
  }

  // تصدير إلى CSV
  private async exportToCSV(report: InteractiveReport, data: ReportData, options: ExportOptions): Promise<Blob> {
    const headers = report.columns.map(col => col.name).join(',');
    const rows = data.rows.map(row => 
      report.columns.map(col => row[col.id] || '').join(',')
    ).join('\n');
    
    const content = `${headers}\n${rows}`;
    return new Blob([content], { type: 'text/csv;charset=utf-8' });
  }

  // إنشاء رابط المشاركة
  private generateShareUrl(shareId: string, type: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-reports/${shareId}?type=${type}`;
  }

  // طرق مساعدة لتوليد المحتوى (ستتم إضافتها لاحقاً)
  private generatePDFContent(report: InteractiveReport, data: ReportData, options: ExportOptions): string {
    return `PDF content for ${report.name}`;
  }

  private generateExcelContent(report: InteractiveReport, data: ReportData, options: ExportOptions): string {
    return `Excel content for ${report.name}`;
  }

  private generatePowerPointContent(report: InteractiveReport, data: ReportData, options: ExportOptions): string {
    return `PowerPoint content for ${report.name}`;
  }

  private generateImageContent(report: InteractiveReport, data: ReportData, options: ExportOptions): string {
    return `Image content for ${report.name}`;
  }
}

export const interactiveReportsService = new InteractiveReportsService();
