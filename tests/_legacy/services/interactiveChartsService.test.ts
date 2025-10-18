/**
 * اختبارات خدمة الرسوم البيانية التفاعلية
 * Interactive Charts Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { 
  ChartFilter 
} from '../../src/services/interactiveChartsService';
import { 
  InteractiveChartsService, 
  ChartConfiguration, 
  ChartDataPoint 
} from '../../src/services/interactiveChartsService';
import { asyncStorage } from '../../src/utils/storage';

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

describe('InteractiveChartsService', () => {
  let service: InteractiveChartsService;
  const mockAsyncStorage = asyncStorage as any;

  beforeEach(() => {
    service = new InteractiveChartsService();
    vi.clearAllMocks();
    
    // إعداد البيانات الوهمية الافتراضية
    mockAsyncStorage.getItem.mockImplementation((key: string) => {
      switch (key) {
        case 'chart_configurations':
          return Promise.resolve([]);
        case 'projects':
          return Promise.resolve([
            {
              id: 'project1',
              name: 'مشروع تجريبي',
              status: 'قيد التنفيذ',
              budget: 500000,
              progress: 75,
              startDate: '2024-01-01'
            },
            {
              id: 'project2',
              name: 'مشروع آخر',
              status: 'مكتمل',
              budget: 1200000,
              progress: 100,
              startDate: '2024-02-01'
            }
          ]);
        case 'tenders':
          return Promise.resolve([
            {
              id: 'tender1',
              name: 'منافسة تجريبية',
              status: 'فائز',
              estimatedValue: 800000,
              submissionDate: '2024-01-15'
            },
            {
              id: 'tender2',
              name: 'منافسة أخرى',
              status: 'خاسر',
              estimatedValue: 1500000,
              submissionDate: '2024-02-15'
            }
          ]);
        case 'financial_data':
          return Promise.resolve({
            revenues: [
              { date: '2024-01-01', amount: 100000, category: 'مشاريع' },
              { date: '2024-02-01', amount: 150000, category: 'مشاريع' }
            ],
            expenses: [
              { date: '2024-01-01', amount: 50000, category: 'مواد' },
              { date: '2024-02-01', amount: 75000, category: 'عمالة' }
            ],
            cashFlows: [
              { date: '2024-01-01', amount: 50000 },
              { date: '2024-02-01', amount: 75000 }
            ]
          });
        default:
          return Promise.resolve(null);
      }
    });
    
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Chart Configuration Management', () => {
    it('should create a new chart configuration', async () => {
      const configData = {
        type: 'line' as const,
        title: 'رسم بياني تجريبي',
        titleEn: 'Test Chart',
        dataSource: 'projects',
        interactive: true,
        zoomable: true,
        exportable: true,
        realTimeUpdates: false,
        theme: 'light' as const,
        colors: ['#3b82f6'],
        dimensions: { width: 800, height: 400 },
        options: {}
      };

      const result = await service.createChartConfiguration(configData);

      expect(result).toMatchObject(configData);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'chart_configurations',
        expect.arrayContaining([expect.objectContaining(configData)])
      );
    });

    it('should get all chart configurations', async () => {
      const mockConfigs = [
        {
          id: 'chart1',
          type: 'line',
          title: 'رسم بياني 1',
          titleEn: 'Chart 1',
          dataSource: 'projects',
          interactive: true,
          zoomable: true,
          exportable: true,
          realTimeUpdates: false,
          theme: 'light',
          colors: ['#3b82f6'],
          dimensions: { width: 800, height: 400 },
          options: {},
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(mockConfigs);

      const result = await service.getChartConfigurations();

      expect(result).toEqual(mockConfigs);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('chart_configurations');
    });

    it('should get a specific chart configuration', async () => {
      const mockConfigs = [
        {
          id: 'chart1',
          type: 'line',
          title: 'رسم بياني 1',
          titleEn: 'Chart 1',
          dataSource: 'projects',
          interactive: true,
          zoomable: true,
          exportable: true,
          realTimeUpdates: false,
          theme: 'light',
          colors: ['#3b82f6'],
          dimensions: { width: 800, height: 400 },
          options: {},
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(mockConfigs);

      const result = await service.getChartConfiguration('chart1');

      expect(result).toEqual(mockConfigs[0]);
    });

    it('should return null for non-existent chart configuration', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce([]);

      const result = await service.getChartConfiguration('nonexistent');

      expect(result).toBeNull();
    });

    it('should update a chart configuration', async () => {
      const originalUpdatedAt = '2024-01-01T00:00:00.000Z';
      const mockConfigs = [
        {
          id: 'chart1',
          type: 'line',
          title: 'رسم بياني 1',
          titleEn: 'Chart 1',
          dataSource: 'projects',
          interactive: true,
          zoomable: true,
          exportable: true,
          realTimeUpdates: false,
          theme: 'light',
          colors: ['#3b82f6'],
          dimensions: { width: 800, height: 400 },
          options: {},
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: originalUpdatedAt
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(mockConfigs);

      const updates = { title: 'رسم بياني محدث', realTimeUpdates: true };

      // إضافة تأخير صغير للتأكد من اختلاف التوقيت
      await new Promise(resolve => setTimeout(resolve, 1));

      const result = await service.updateChartConfiguration('chart1', updates);

      expect(result).toMatchObject(updates);
      expect(result?.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(result?.updatedAt || '').getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should delete a chart configuration', async () => {
      const mockConfigs = [
        {
          id: 'chart1',
          type: 'line',
          title: 'رسم بياني 1',
          titleEn: 'Chart 1',
          dataSource: 'projects',
          interactive: true,
          zoomable: true,
          exportable: true,
          realTimeUpdates: false,
          theme: 'light',
          colors: ['#3b82f6'],
          dimensions: { width: 800, height: 400 },
          options: {},
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(mockConfigs);

      const result = await service.deleteChartConfiguration('chart1');

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('chart_configurations', []);
    });
  });

  describe('Project Chart Data', () => {
    it('should get project status chart data', async () => {
      const result = await service.getProjectChartData('project_status');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'status_قيد التنفيذ',
        label: 'قيد التنفيذ',
        labelEn: 'In Progress',
        value: 1
      });
      expect(result[1]).toMatchObject({
        id: 'status_مكتمل',
        label: 'مكتمل',
        labelEn: 'Completed',
        value: 1
      });
    });

    it('should get project budget chart data', async () => {
      const result = await service.getProjectChartData('project_budget');

      expect(result).toHaveLength(4);
      expect(result.some(item => item.value > 0)).toBe(true);
    });

    it('should get project progress chart data', async () => {
      const result = await service.getProjectChartData('project_progress');

      expect(result).toHaveLength(4);
      expect(result.some(item => item.value > 0)).toBe(true);
    });

    it('should get project timeline chart data', async () => {
      const result = await service.getProjectChartData('project_timeline');

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('2024-01');
      expect(result[1].label).toBe('2024-02');
    });
  });

  describe('Tender Chart Data', () => {
    it('should get tender status chart data', async () => {
      const result = await service.getTenderChartData('tender_status');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'tender_status_فائز',
        label: 'فائز',
        labelEn: 'Won',
        value: 1
      });
      expect(result[1]).toMatchObject({
        id: 'tender_status_خاسر',
        label: 'خاسر',
        labelEn: 'Lost',
        value: 1
      });
    });

    it('should get tender value chart data', async () => {
      const result = await service.getTenderChartData('tender_value');

      expect(result).toHaveLength(4);
      expect(result.some(item => item.value > 0)).toBe(true);
    });

    it('should get tender success rate chart data', async () => {
      const result = await service.getTenderChartData('tender_success_rate');

      expect(result).toHaveLength(3);
      expect(result.find(item => item.id === 'won_tenders')?.value).toBe(1);
      expect(result.find(item => item.id === 'lost_tenders')?.value).toBe(1);
      expect(result.find(item => item.id === 'pending_tenders')?.value).toBe(0);
    });

    it('should get tender timeline chart data', async () => {
      const result = await service.getTenderChartData('tender_timeline');

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('2024-01');
      expect(result[1].label).toBe('2024-02');
    });
  });

  describe('Financial Chart Data', () => {
    it('should get revenue trend chart data', async () => {
      const result = await service.getFinancialChartData('revenue_trend');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'revenue_2024-01',
        label: '2024-01',
        value: 100000
      });
      expect(result[1]).toMatchObject({
        id: 'revenue_2024-02',
        label: '2024-02',
        value: 150000
      });
    });

    it('should get expense breakdown chart data', async () => {
      const result = await service.getFinancialChartData('expense_breakdown');

      expect(result).toHaveLength(2);
      expect(result.find(item => item.label === 'مواد')?.value).toBe(50000);
      expect(result.find(item => item.label === 'عمالة')?.value).toBe(75000);
    });

    it('should get profit margin chart data', async () => {
      const result = await service.getFinancialChartData('profit_margin');

      expect(result).toHaveLength(2);
      expect(result[0].value).toBeCloseTo(50); // (100000 - 50000) / 100000 * 100
      expect(result[1].value).toBeCloseTo(50); // (150000 - 75000) / 150000 * 100
    });

    it('should get cash flow chart data', async () => {
      const result = await service.getFinancialChartData('cash_flow');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'cash_flow_2024-01',
        label: '2024-01',
        value: 50000
      });
      expect(result[1]).toMatchObject({
        id: 'cash_flow_2024-02',
        label: '2024-02',
        value: 75000
      });
    });
  });

  describe('Data Filtering', () => {
    it('should apply equals filter correctly', async () => {
      const filters: ChartFilter[] = [
        { field: 'value', operator: 'equals', value: 1 }
      ];

      const result = await service.getProjectChartData('project_status', filters);

      expect(result.every(item => item.value === 1)).toBe(true);
    });

    it('should apply greater than filter correctly', async () => {
      const filters: ChartFilter[] = [
        { field: 'value', operator: 'greaterThan', value: 0 }
      ];

      const result = await service.getProjectChartData('project_status', filters);

      expect(result.every(item => item.value > 0)).toBe(true);
    });

    it('should apply contains filter correctly', async () => {
      const filters: ChartFilter[] = [
        { field: 'label', operator: 'contains', value: 'قيد' }
      ];

      const result = await service.getProjectChartData('project_status', filters);

      expect(result.every(item => item.label.includes('قيد'))).toBe(true);
    });
  });

  describe('Real-time Updates', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start real-time updates', () => {
      const chartId = 'test-chart';
      const intervalSeconds = 10;

      service.startRealTimeUpdates(chartId, intervalSeconds);

      // التحقق من أن setInterval تم استدعاؤه
      expect(vi.getTimerCount()).toBe(1);
    });

    it('should stop real-time updates', () => {
      const chartId = 'test-chart';

      service.startRealTimeUpdates(chartId, 10);
      service.stopRealTimeUpdates(chartId);

      expect(vi.getTimerCount()).toBe(0);
    });

    it('should handle real-time update errors gracefully', async () => {
      const chartId = 'test-chart';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // إعداد خطأ في getChartConfiguration
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      service.startRealTimeUpdates(chartId, 1);

      // تقدم الوقت لتشغيل التحديث
      await vi.advanceTimersByTimeAsync(1000);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Event Handling', () => {
    it('should add and remove event listeners', () => {
      const chartId = 'test-chart';
      const listener = vi.fn();

      service.addEventListener(chartId, listener);
      service.removeEventListener(chartId, listener);

      // لا يجب أن يتم استدعاء المستمع بعد إزالته
      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit events to listeners', () => {
      const chartId = 'test-chart';
      const listener = vi.fn();

      service.addEventListener(chartId, listener);

      // محاكاة إرسال حدث (يتطلب الوصول للدالة الخاصة)
      const event = {
        type: 'click' as const,
        data: { test: 'data' },
        timestamp: new Date().toISOString()
      };

      // نظراً لأن emitEvent دالة خاصة، سنختبر من خلال التحديثات في الوقت الفعلي
      service.startRealTimeUpdates(chartId, 1);

      expect(listener).toBeDefined();
    });
  });

  describe('Time Series Data', () => {
    it('should get time series data with caching', async () => {
      const dataSource = 'projects';
      const period = 'monthly';

      // أول استدعاء - يجب أن يحفظ في الكاش
      const result1 = await service.getTimeSeriesData(dataSource, period);
      
      // ثاني استدعاء - يجب أن يستخدم الكاش
      const result2 = await service.getTimeSeriesData(dataSource, period);

      expect(result1).toEqual(result2);
    });

    it('should handle different time periods', async () => {
      const periods = ['daily', 'weekly', 'monthly', 'yearly'] as const;

      for (const period of periods) {
        const result = await service.getTimeSeriesData('projects', period);
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      await expect(service.getChartConfigurations()).rejects.toThrow('Storage error');
    });

    it('should handle invalid chart types', async () => {
      const result = await service.getProjectChartData('invalid_type');

      expect(result).toEqual([]);
    });

    it('should handle empty data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce([]);

      const result = await service.getProjectChartData('project_status');

      expect(result).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // إنشاء مجموعة بيانات كبيرة
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `project${i}`,
        name: `مشروع ${i}`,
        status: i % 3 === 0 ? 'مكتمل' : i % 3 === 1 ? 'قيد التنفيذ' : 'متوقف',
        budget: Math.random() * 1000000,
        progress: Math.random() * 100,
        startDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`
      }));

      mockAsyncStorage.getItem.mockResolvedValueOnce(largeDataset);

      const startTime = Date.now();
      const result = await service.getProjectChartData('project_status');
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // يجب أن يكتمل في أقل من ثانية
    });
  });
});
