/**
 * اختبارات مكون التقارير التفاعلية
 * Interactive Reports Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractiveReports } from '../../../src/components/dashboard/InteractiveReports';
import { interactiveReportsService } from '../../../src/services/interactiveReportsService';

// Mock the service
vi.mock('../../../src/services/interactiveReportsService', () => ({
  interactiveReportsService: {
    getAllReports: vi.fn(),
    getReportById: vi.fn(),
    executeReport: vi.fn(),
    exportReport: vi.fn(),
    shareReport: vi.fn(),
    createReport: vi.fn(),
    updateReport: vi.fn(),
    deleteReport: vi.fn()
  }
}));

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, disabled }: any) => (
    <button 
      onClick={onClick} 
      className={`btn ${variant} ${size}`}
      disabled={disabled}
      data-testid="button"
    >
      {children}
    </button>
  )
}));

vi.mock('../../../src/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      data-testid="input"
    />
  )
}));

vi.mock('../../../src/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid="tabs-content" data-value={value}>{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => <div data-testid="tabs-trigger" data-value={value}>{children}</div>
}));

vi.mock('../../../src/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('test-value')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <div data-testid="select-value" />
}));

vi.mock('../../../src/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="dialog" onClick={() => onOpenChange?.(false)}>{children}</div> : null
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>
}));

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" className={variant}>{children}</span>
  )
}));

describe('InteractiveReports Component', () => {
  const mockReports = [
    {
      id: 'report1',
      name: 'تقرير المشاريع',
      nameEn: 'Projects Report',
      description: 'تقرير شامل عن المشاريع',
      descriptionEn: 'Comprehensive projects report',
      category: 'projects',
      type: 'table',
      dataSource: 'projects',
      columns: [],
      filters: [],
      charts: [],
      drillDown: { enabled: false, levels: [], maxDepth: 3 },
      layout: { showFilters: true, showCharts: true, showTable: true, chartsPosition: 'top' },
      permissions: [],
      isPublic: true,
      isShared: false,
      sharedWith: [],
      createdBy: 'user1',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'report2',
      name: 'تقرير المنافسات',
      nameEn: 'Tenders Report',
      description: 'تقرير عن المنافسات',
      descriptionEn: 'Tenders report',
      category: 'tenders',
      type: 'chart',
      dataSource: 'tenders',
      columns: [],
      filters: [],
      charts: [],
      drillDown: { enabled: false, levels: [], maxDepth: 3 },
      layout: { showFilters: true, showCharts: true, showTable: true, chartsPosition: 'top' },
      permissions: [],
      isPublic: false,
      isShared: true,
      sharedWith: [],
      createdBy: 'user2',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  const mockReportData = {
    rows: [
      { id: '1', name: 'مشروع 1', budget: 100000, status: 'active' },
      { id: '2', name: 'مشروع 2', budget: 200000, status: 'completed' }
    ],
    totalCount: 2,
    aggregations: { budget_sum: 300000, budget_avg: 150000 },
    metadata: {
      generatedAt: '2023-01-01T00:00:00.000Z',
      filters: [],
      sortBy: undefined,
      sortOrder: 'asc'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (interactiveReportsService.getAllReports as any).mockResolvedValue(mockReports);
    (interactiveReportsService.executeReport as any).mockResolvedValue(mockReportData);
  });

  describe('عرض المكون', () => {
    it('يجب عرض المكون بنجاح', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        expect(screen.getByText('التقارير التفاعلية')).toBeInTheDocument();
      });

      expect(screen.getByText('إنشاء وعرض وتصدير التقارير التفاعلية')).toBeInTheDocument();
    });

    it('يجب عرض حالة التحميل في البداية', () => {
      (interactiveReportsService.getAllReports as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockReports), 1000))
      );

      render(<InteractiveReports />);

      expect(screen.getByText('جاري تحميل التقارير...')).toBeInTheDocument();
    });

    it('يجب عرض التقارير بعد التحميل', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        expect(screen.getByText('تقرير المشاريع')).toBeInTheDocument();
        expect(screen.getByText('تقرير المنافسات')).toBeInTheDocument();
      });
    });
  });

  describe('البحث والتصفية', () => {
    it('يجب عرض شريط البحث', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في التقارير...');
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('يجب عرض قائمة الفئات', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        expect(screen.getByTestId('select')).toBeInTheDocument();
      });
    });

    it('يجب عرض زر إنشاء تقرير جديد', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        const createButton = screen.getByText('تقرير جديد');
        expect(createButton).toBeInTheDocument();
      });
    });
  });

  describe('عرض التقارير', () => {
    it('يجب عرض بطاقات التقارير', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        const reportCards = screen.getAllByTestId('card');
        expect(reportCards.length).toBeGreaterThan(0);
      });
    });

    it('يجب عرض معلومات التقرير في البطاقة', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        expect(screen.getByText('تقرير المشاريع')).toBeInTheDocument();
        expect(screen.getByText('تقرير شامل عن المشاريع')).toBeInTheDocument();
      });
    });

    it('يجب عرض حالة التقرير (عام/خاص)', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        expect(screen.getByText('عام')).toBeInTheDocument();
        expect(screen.getByText('خاص')).toBeInTheDocument();
      });
    });
  });

  describe('اختيار التقرير', () => {
    it('يجب تنفيذ التقرير عند النقر عليه', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        const reportCard = screen.getByText('تقرير المشاريع').closest('[data-testid="card"]');
        fireEvent.click(reportCard!);
      });

      expect(interactiveReportsService.executeReport).toHaveBeenCalledWith('report1', []);
    });

    it('يجب عرض رسالة عند عدم اختيار تقرير', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        // التبديل إلى تبويب عارض التقرير
        const viewerTab = screen.getByText('عارض التقرير');
        fireEvent.click(viewerTab);
      });

      expect(screen.getByText('اختر تقريراً لعرضه')).toBeInTheDocument();
    });
  });

  describe('عرض بيانات التقرير', () => {
    it('يجب عرض بيانات التقرير بعد التنفيذ', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        const reportCard = screen.getByText('تقرير المشاريع').closest('[data-testid="card"]');
        fireEvent.click(reportCard!);
      });

      await waitFor(() => {
        // التبديل إلى تبويب عارض التقرير
        const viewerTab = screen.getByText('عارض التقرير');
        fireEvent.click(viewerTab);
      });

      await waitFor(() => {
        expect(screen.getByText('إجمالي السجلات: 2')).toBeInTheDocument();
      });
    });

    it('يجب عرض أزرار التحكم في التقرير', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        const reportCard = screen.getByText('تقرير المشاريع').closest('[data-testid="card"]');
        fireEvent.click(reportCard!);
      });

      await waitFor(() => {
        // التبديل إلى تبويب عارض التقرير
        const viewerTab = screen.getByText('عارض التقرير');
        fireEvent.click(viewerTab);
      });

      await waitFor(() => {
        expect(screen.getByText('الفلاتر')).toBeInTheDocument();
        expect(screen.getByText('تصدير')).toBeInTheDocument();
        expect(screen.getByText('مشاركة')).toBeInTheDocument();
        expect(screen.getByText('تحديث')).toBeInTheDocument();
      });
    });
  });

  describe('التصدير', () => {
    it('يجب فتح حوار التصدير عند النقر على زر التصدير', async () => {
      render(<InteractiveReports />);

      // اختيار تقرير أولاً
      await waitFor(() => {
        const reportCard = screen.getByText('تقرير المشاريع').closest('[data-testid="card"]');
        fireEvent.click(reportCard!);
      });

      // التبديل إلى عارض التقرير
      await waitFor(() => {
        const viewerTab = screen.getByText('عارض التقرير');
        fireEvent.click(viewerTab);
      });

      // النقر على زر التصدير
      await waitFor(() => {
        const exportButton = screen.getByText('تصدير');
        fireEvent.click(exportButton);
      });

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('تصدير التقرير')).toBeInTheDocument();
    });

    it('يجب عرض خيارات التصدير المختلفة', async () => {
      render(<InteractiveReports />);

      // اختيار تقرير وفتح حوار التصدير
      await waitFor(() => {
        const reportCard = screen.getByText('تقرير المشاريع').closest('[data-testid="card"]');
        fireEvent.click(reportCard!);
      });

      await waitFor(() => {
        const viewerTab = screen.getByText('عارض التقرير');
        fireEvent.click(viewerTab);
      });

      await waitFor(() => {
        const exportButton = screen.getByText('تصدير');
        fireEvent.click(exportButton);
      });

      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('PowerPoint')).toBeInTheDocument();
      expect(screen.getByText('صورة')).toBeInTheDocument();
    });
  });

  describe('المشاركة', () => {
    it('يجب فتح حوار المشاركة عند النقر على زر المشاركة', async () => {
      render(<InteractiveReports />);

      // اختيار تقرير أولاً
      await waitFor(() => {
        const reportCard = screen.getByText('تقرير المشاريع').closest('[data-testid="card"]');
        fireEvent.click(reportCard!);
      });

      // التبديل إلى عارض التقرير
      await waitFor(() => {
        const viewerTab = screen.getByText('عارض التقرير');
        fireEvent.click(viewerTab);
      });

      // النقر على زر المشاركة
      await waitFor(() => {
        const shareButton = screen.getByText('مشاركة');
        fireEvent.click(shareButton);
      });

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('مشاركة التقرير')).toBeInTheDocument();
    });

    it('يجب عرض خيارات المشاركة', async () => {
      render(<InteractiveReports />);

      // اختيار تقرير وفتح حوار المشاركة
      await waitFor(() => {
        const reportCard = screen.getByText('تقرير المشاريع').closest('[data-testid="card"]');
        fireEvent.click(reportCard!);
      });

      await waitFor(() => {
        const viewerTab = screen.getByText('عارض التقرير');
        fireEvent.click(viewerTab);
      });

      await waitFor(() => {
        const shareButton = screen.getByText('مشاركة');
        fireEvent.click(shareButton);
      });

      expect(screen.getByText('رابط عام')).toBeInTheDocument();
      expect(screen.getByText('بريد إلكتروني')).toBeInTheDocument();
    });
  });

  describe('معالجة الأخطاء', () => {
    it('يجب عرض رسالة خطأ عند فشل تحميل التقارير', async () => {
      (interactiveReportsService.getAllReports as any).mockRejectedValue(new Error('فشل في التحميل'));

      render(<InteractiveReports />);

      await waitFor(() => {
        expect(screen.getByText('فشل في التحميل')).toBeInTheDocument();
      });
    });

    it('يجب عرض رسالة خطأ عند فشل تنفيذ التقرير', async () => {
      (interactiveReportsService.executeReport as any).mockRejectedValue(new Error('فشل في تنفيذ التقرير'));

      render(<InteractiveReports />);

      await waitFor(() => {
        const reportCard = screen.getByText('تقرير المشاريع').closest('[data-testid="card"]');
        fireEvent.click(reportCard!);
      });

      await waitFor(() => {
        expect(screen.getByText('فشل في تنفيذ التقرير')).toBeInTheDocument();
      });
    });
  });

  describe('التبويبات', () => {
    it('يجب عرض جميع التبويبات', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        expect(screen.getByText('التقارير')).toBeInTheDocument();
        expect(screen.getByText('عارض التقرير')).toBeInTheDocument();
        expect(screen.getByText('القوالب')).toBeInTheDocument();
      });
    });

    it('يجب التبديل بين التبويبات', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        const templatesTab = screen.getByText('القوالب');
        fireEvent.click(templatesTab);
      });

      expect(screen.getByText('قوالب التقارير (قريباً)')).toBeInTheDocument();
    });
  });

  describe('إمكانية الوصول', () => {
    it('يجب دعم اتجاه RTL', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        const rtlContainer = screen.getByText('التقارير التفاعلية').closest('[dir="rtl"]');
        expect(rtlContainer).toBeInTheDocument();
        expect(rtlContainer).toHaveAttribute('dir', 'rtl');
      });
    });

    it('يجب عرض النصوص باللغة العربية', async () => {
      render(<InteractiveReports />);

      await waitFor(() => {
        expect(screen.getByText('التقارير التفاعلية')).toBeInTheDocument();
        expect(screen.getByText('إنشاء وعرض وتصدير التقارير التفاعلية')).toBeInTheDocument();
      });
    });
  });
});
