/**
 * اختبارات خدمة التقارير التفاعلية
 * Interactive Reports Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { 
  InteractiveReport, 
  ReportFilter, 
  ExportOptions,
  ShareConfig 
} from '../../src/services/interactiveReportsService';
import { 
  InteractiveReportsService 
} from '../../src/services/interactiveReportsService';
import { asyncStorage } from '../../src/utils/storage';

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}));

describe('InteractiveReportsService', () => {
  let service: InteractiveReportsService;
  let mockReport: Omit<InteractiveReport, 'id' | 'createdAt' | 'updatedAt'>;

  beforeEach(() => {
    service = new InteractiveReportsService();
    vi.clearAllMocks();

    mockReport = {
      name: 'تقرير المشاريع',
      nameEn: 'Projects Report',
      description: 'تقرير شامل عن حالة المشاريع',
      descriptionEn: 'Comprehensive projects status report',
      category: 'projects',
      type: 'table',
      dataSource: 'projects',
      columns: [
        {
          id: 'name',
          name: 'اسم المشروع',
          nameEn: 'Project Name',
          type: 'text',
          sortable: true,
          filterable: true,
          aggregatable: false
        },
        {
          id: 'budget',
          name: 'الميزانية',
          nameEn: 'Budget',
          type: 'currency',
          sortable: true,
          filterable: true,
          aggregatable: true
        }
      ],
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
      permissions: ['read'],
      isPublic: false,
      isShared: false,
      sharedWith: [],
      createdBy: 'user1'
    };
  });

  describe('إنشاء التقارير', () => {
    it('يجب إنشاء تقرير جديد بنجاح', async () => {
      const mockReports: InteractiveReport[] = [];
      (asyncStorage.getItem as any).mockResolvedValue(mockReports);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const result = await service.createReport(mockReport);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(mockReport.name);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(asyncStorage.setItem).toHaveBeenCalledWith('interactive_reports', expect.any(Array));
    });

    it('يجب إضافة التقرير الجديد إلى القائمة الموجودة', async () => {
      const existingReport: InteractiveReport = {
        ...mockReport,
        id: 'existing_report',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [existingReport];
      (asyncStorage.getItem as any).mockResolvedValue(mockReports);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const result = await service.createReport(mockReport);

      expect(result).toBeDefined();
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'interactive_reports', 
        expect.arrayContaining([existingReport, expect.objectContaining({ name: mockReport.name })])
      );
    });
  });

  describe('استرجاع التقارير', () => {
    it('يجب إرجاع جميع التقارير', async () => {
      const mockReports: InteractiveReport[] = [
        {
          ...mockReport,
          id: 'report1',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          ...mockReport,
          id: 'report2',
          name: 'تقرير آخر',
          createdAt: '2023-01-02T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      ];
      (asyncStorage.getItem as any).mockResolvedValue(mockReports);

      const result = await service.getAllReports();

      expect(result).toEqual(mockReports);
      expect(result).toHaveLength(2);
    });

    it('يجب إرجاع مصفوفة فارغة عند عدم وجود تقارير', async () => {
      (asyncStorage.getItem as any).mockResolvedValue(null);

      const result = await service.getAllReports();

      expect(result).toEqual([]);
    });

    it('يجب التعامل مع أخطاء التحميل', async () => {
      (asyncStorage.getItem as any).mockRejectedValue(new Error('Storage error'));

      const result = await service.getAllReports();

      expect(result).toEqual([]);
    });
  });

  describe('البحث عن التقارير', () => {
    it('يجب العثور على تقرير بالمعرف', async () => {
      const targetReport: InteractiveReport = {
        ...mockReport,
        id: 'target_report',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [targetReport];
      (asyncStorage.getItem as any).mockResolvedValue(mockReports);

      const result = await service.getReportById('target_report');

      expect(result).toEqual(targetReport);
    });

    it('يجب إرجاع null عند عدم العثور على التقرير', async () => {
      const mockReports: InteractiveReport[] = [];
      (asyncStorage.getItem as any).mockResolvedValue(mockReports);

      const result = await service.getReportById('nonexistent_report');

      expect(result).toBeNull();
    });
  });

  describe('تحديث التقارير', () => {
    it('يجب تحديث تقرير موجود', async () => {
      const existingReport: InteractiveReport = {
        ...mockReport,
        id: 'existing_report',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [existingReport];
      (asyncStorage.getItem as any).mockResolvedValue(mockReports);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const updates = { name: 'اسم محدث', description: 'وصف محدث' };
      const result = await service.updateReport('existing_report', updates);

      expect(result).toBeDefined();
      expect(result!.name).toBe('اسم محدث');
      expect(result!.description).toBe('وصف محدث');
      expect(result!.updatedAt).not.toBe(existingReport.updatedAt);
    });

    it('يجب إرجاع null عند محاولة تحديث تقرير غير موجود', async () => {
      const mockReports: InteractiveReport[] = [];
      (asyncStorage.getItem as any).mockResolvedValue(mockReports);

      const result = await service.updateReport('nonexistent_report', { name: 'اسم جديد' });

      expect(result).toBeNull();
    });
  });

  describe('حذف التقارير', () => {
    it('يجب حذف تقرير موجود', async () => {
      const reportToDelete: InteractiveReport = {
        ...mockReport,
        id: 'report_to_delete',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const otherReport: InteractiveReport = {
        ...mockReport,
        id: 'other_report',
        name: 'تقرير آخر',
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      };
      const mockReports = [reportToDelete, otherReport];
      (asyncStorage.getItem as any).mockResolvedValue(mockReports);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const result = await service.deleteReport('report_to_delete');

      expect(result).toBe(true);
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'interactive_reports',
        [otherReport]
      );
    });

    it('يجب إرجاع false عند محاولة حذف تقرير غير موجود', async () => {
      const mockReports: InteractiveReport[] = [];
      (asyncStorage.getItem as any).mockResolvedValue(mockReports);

      const result = await service.deleteReport('nonexistent_report');

      expect(result).toBe(false);
    });
  });

  describe('تنفيذ التقارير', () => {
    it('يجب تنفيذ تقرير وإرجاع البيانات', async () => {
      const testReport: InteractiveReport = {
        ...mockReport,
        id: 'test_report',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [testReport];
      const mockProjectsData = [
        { id: '1', name: 'مشروع 1', budget: 100000, status: 'active' },
        { id: '2', name: 'مشروع 2', budget: 200000, status: 'completed' }
      ];

      (asyncStorage.getItem as any)
        .mockResolvedValueOnce(mockReports) // للتقارير
        .mockResolvedValueOnce(mockProjectsData); // لبيانات المشاريع

      const result = await service.executeReport('test_report');

      expect(result).toBeDefined();
      expect(result.rows).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.metadata).toBeDefined();
      expect(result.aggregations).toBeDefined();
    });

    it('يجب رفع خطأ عند عدم وجود التقرير', async () => {
      (asyncStorage.getItem as any).mockResolvedValue([]);

      await expect(service.executeReport('nonexistent_report')).rejects.toThrow('Report not found');
    });

    it('يجب تطبيق الفلاتر على البيانات', async () => {
      const testReport: InteractiveReport = {
        ...mockReport,
        id: 'test_report',
        filters: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [testReport];
      const mockProjectsData = [
        { id: '1', name: 'مشروع 1', budget: 100000, status: 'active' },
        { id: '2', name: 'مشروع 2', budget: 200000, status: 'completed' },
        { id: '3', name: 'مشروع 3', budget: 150000, status: 'active' }
      ];

      (asyncStorage.getItem as any)
        .mockResolvedValueOnce(mockReports)
        .mockResolvedValueOnce(mockProjectsData);

      const filters: ReportFilter[] = [
        {
          field: 'status',
          operator: 'equals',
          value: 'active',
          label: 'الحالة',
          labelEn: 'Status'
        }
      ];

      const result = await service.executeReport('test_report', filters);

      expect(result.rows).toHaveLength(2);
      expect(result.rows.every(row => row.status === 'active')).toBe(true);
    });
  });

  describe('تصدير التقارير', () => {
    it('يجب تصدير تقرير إلى CSV', async () => {
      const testReport: InteractiveReport = {
        ...mockReport,
        id: 'test_report',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [testReport];
      const mockProjectsData = [
        { name: 'مشروع 1', budget: 100000 },
        { name: 'مشروع 2', budget: 200000 }
      ];

      (asyncStorage.getItem as any)
        .mockResolvedValueOnce(mockReports) // للحصول على التقرير
        .mockResolvedValueOnce(mockReports) // للحصول على التقرير مرة أخرى في executeReport
        .mockResolvedValueOnce(mockProjectsData); // لبيانات المشاريع

      const exportOptions: ExportOptions = {
        format: 'csv',
        includeCharts: false,
        includeData: true,
        includeFilters: false,
        pageSize: 'A4',
        orientation: 'portrait',
        quality: 'high',
        customization: {}
      };

      const result = await service.exportReport('test_report', exportOptions);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv;charset=utf-8');
    });

    it('يجب رفع خطأ عند تنسيق تصدير غير مدعوم', async () => {
      const testReport: InteractiveReport = {
        ...mockReport,
        id: 'test_report',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [testReport];

      (asyncStorage.getItem as any).mockResolvedValue(mockReports);

      const exportOptions: ExportOptions = {
        format: 'unsupported' as any,
        includeCharts: false,
        includeData: true,
        includeFilters: false,
        pageSize: 'A4',
        orientation: 'portrait',
        quality: 'high',
        customization: {}
      };

      await expect(service.exportReport('test_report', exportOptions)).rejects.toThrow('Unsupported export format');
    });
  });

  describe('مشاركة التقارير', () => {
    it('يجب إنشاء رابط مشاركة للتقرير', async () => {
      const testReport: InteractiveReport = {
        ...mockReport,
        id: 'test_report',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [testReport];

      (asyncStorage.getItem as any)
        .mockResolvedValueOnce(mockReports) // للتقرير
        .mockResolvedValueOnce([]); // للمشاركات الموجودة

      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const shareConfig: ShareConfig = {
        type: 'link',
        permissions: 'view',
        allowDownload: true,
        allowPrint: true
      };

      const result = await service.shareReport('test_report', shareConfig);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('/shared-reports/');
      expect(asyncStorage.setItem).toHaveBeenCalledWith('report_shares', expect.any(Array));
    });

    it('يجب رفع خطأ عند محاولة مشاركة تقرير غير موجود', async () => {
      (asyncStorage.getItem as any).mockResolvedValue([]);

      const shareConfig: ShareConfig = {
        type: 'link',
        permissions: 'view',
        allowDownload: true,
        allowPrint: true
      };

      await expect(service.shareReport('nonexistent_report', shareConfig)).rejects.toThrow('Report not found');
    });
  });

  describe('معالجة البيانات', () => {
    it('يجب تطبيق فلتر "يحتوي على" بشكل صحيح', async () => {
      const testReport: InteractiveReport = {
        ...mockReport,
        id: 'test_report',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [testReport];
      const mockData = [
        { name: 'مشروع البناء الأول', type: 'construction' },
        { name: 'مشروع الطرق', type: 'infrastructure' },
        { name: 'مشروع البناء الثاني', type: 'construction' }
      ];

      (asyncStorage.getItem as any)
        .mockResolvedValueOnce(mockReports)
        .mockResolvedValueOnce(mockData);

      const filters: ReportFilter[] = [
        {
          field: 'name',
          operator: 'contains',
          value: 'البناء',
          label: 'الاسم',
          labelEn: 'Name'
        }
      ];

      const result = await service.executeReport('test_report', filters);

      expect(result.rows).toHaveLength(2);
      expect(result.rows.every(row => row.name.includes('البناء'))).toBe(true);
    });

    it('يجب حساب التجميعات للأعمدة الرقمية', async () => {
      const testReport: InteractiveReport = {
        ...mockReport,
        id: 'test_report',
        columns: [
          {
            id: 'budget',
            name: 'الميزانية',
            nameEn: 'Budget',
            type: 'currency',
            sortable: true,
            filterable: true,
            aggregatable: true
          }
        ],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      const mockReports = [testReport];
      const mockData = [
        { budget: 100000 },
        { budget: 200000 },
        { budget: 150000 }
      ];

      (asyncStorage.getItem as any)
        .mockResolvedValueOnce(mockReports)
        .mockResolvedValueOnce(mockData);

      const result = await service.executeReport('test_report');

      expect(result.aggregations).toBeDefined();
      expect(result.aggregations.budget_sum).toBe(450000);
      expect(result.aggregations.budget_avg).toBe(150000);
      expect(result.aggregations.budget_min).toBe(100000);
      expect(result.aggregations.budget_max).toBe(200000);
      expect(result.aggregations.budget_count).toBe(3);
    });
  });
});
