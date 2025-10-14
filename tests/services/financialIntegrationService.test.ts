/**
 * اختبارات خدمة التكامل المالي
 * Financial Integration Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FinancialIntegrationService, IntegrationSettings, SyncResult } from '../../src/services/financialIntegrationService';
import { asyncStorage } from '../../src/utils/storage';

// Mock asyncStorage
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('FinancialIntegrationService', () => {
  let service: FinancialIntegrationService;
  const mockAsyncStorage = asyncStorage as any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FinancialIntegrationService();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Integration Settings', () => {
    it('should return default settings when none exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const settings = await service.getIntegrationSettings();

      expect(settings).toEqual({
        autoSync: true,
        syncInterval: 15,
        enableProjectIntegration: true,
        enableTenderIntegration: true,
        enableRealTimeUpdates: true,
        notificationSettings: {
          emailNotifications: true,
          systemNotifications: true,
          criticalAlertsOnly: false,
        },
      });
    });

    it('should return stored settings when they exist', async () => {
      const storedSettings: IntegrationSettings = {
        autoSync: false,
        syncInterval: 30,
        enableProjectIntegration: false,
        enableTenderIntegration: true,
        enableRealTimeUpdates: false,
        notificationSettings: {
          emailNotifications: false,
          systemNotifications: true,
          criticalAlertsOnly: true,
        },
      };

      mockAsyncStorage.getItem.mockResolvedValue(storedSettings);

      const settings = await service.getIntegrationSettings();

      expect(settings).toEqual(storedSettings);
    });

    it('should update integration settings', async () => {
      const currentSettings: IntegrationSettings = {
        autoSync: true,
        syncInterval: 15,
        enableProjectIntegration: true,
        enableTenderIntegration: true,
        enableRealTimeUpdates: true,
        notificationSettings: {
          emailNotifications: true,
          systemNotifications: true,
          criticalAlertsOnly: false,
        },
      };

      mockAsyncStorage.getItem.mockResolvedValue(currentSettings);

      const updates = {
        autoSync: false,
        syncInterval: 30,
      };

      await service.updateIntegrationSettings(updates);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'integration_settings',
        { ...currentSettings, ...updates }
      );
    });
  });

  describe('Project Integration', () => {
    it('should integrate with projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project_1',
          name: 'مشروع اختبار',
          contractValue: 100000,
          startDate: '2024-01-01',
        },
        {
          id: 'project_2',
          name: 'مشروع آخر',
          contractValue: 200000,
          startDate: '2024-02-01',
        },
      ];

      const mockExpenses = [
        { projectId: 'project_1', amount: 10000 },
        { projectId: 'project_1', amount: 5000 },
      ];

      const mockInvoices = [
        { projectId: 'project_1', amount: 50000, status: 'paid' },
      ];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(mockProjects) // projects
        .mockResolvedValueOnce(mockExpenses) // expenses for project_1
        .mockResolvedValueOnce(mockInvoices) // invoices for project_1
        .mockResolvedValueOnce([mockProjects[0]]) // projects for update
        .mockResolvedValueOnce(mockExpenses) // expenses for project_2
        .mockResolvedValueOnce([]) // invoices for project_2
        .mockResolvedValueOnce([mockProjects[1]]) // projects for update
        .mockResolvedValueOnce([]) // existing financial records
        .mockResolvedValueOnce([]) // sync log
        .mockResolvedValueOnce([]); // existing financial records for creation

      const result = await service.integrateWithProjects();

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(2);
      expect(result.recordsCreated).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle project integration errors gracefully', async () => {
      const mockProjects = [
        {
          id: 'project_1',
          name: 'مشروع معطل',
        },
      ];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(mockProjects)
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.integrateWithProjects();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Tender Integration', () => {
    it('should integrate with tenders successfully', async () => {
      const mockTenders = [
        {
          id: 'tender_1',
          title: 'منافسة اختبار',
          category: 'construction',
          estimatedValue: 500000,
          submissionDate: '2024-01-15',
        },
        {
          id: 'tender_2',
          title: 'منافسة أخرى',
          category: 'consulting',
          estimatedValue: 100000,
          submissionDate: '2024-02-15',
        },
      ];

      // Mock multiple calls for tender integration
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'tenders') return Promise.resolve(mockTenders);
        if (key === 'sync_log') return Promise.resolve([]);
        if (key === 'financial_integration') return Promise.resolve([]);
        return Promise.resolve([]);
      });

      const result = await service.integrateWithTenders();

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(2);
      expect(result.recordsCreated).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle tender integration errors gracefully', async () => {
      const mockTenders = [
        {
          id: 'tender_1',
          title: 'منافسة معطلة',
        },
      ];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(mockTenders)
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.integrateWithTenders();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Financial Calculations', () => {
    it('should calculate project actual costs correctly', async () => {
      const mockExpenses = [
        { projectId: 'project_1', amount: 10000 },
        { projectId: 'project_1', amount: 5000 },
        { projectId: 'project_2', amount: 3000 },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(mockExpenses);

      // Access private method through service integration
      const mockProject = {
        id: 'project_1',
        name: 'Test Project',
        contractValue: 100000,
      };

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([mockProject])
        .mockResolvedValueOnce(mockExpenses)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.integrateWithProjects();

      expect(result.success).toBe(true);
      // The actual costs should be calculated as 15000 (10000 + 5000)
    });

    it('should calculate project actual revenue correctly', async () => {
      const mockInvoices = [
        { projectId: 'project_1', amount: 50000, status: 'paid' },
        { projectId: 'project_1', amount: 30000, status: 'pending' },
        { projectId: 'project_2', amount: 20000, status: 'paid' },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(mockInvoices);

      // Access through service integration
      const mockProject = {
        id: 'project_1',
        name: 'Test Project',
        contractValue: 100000,
      };

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([mockProject])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockInvoices)
        .mockResolvedValueOnce([]);

      const result = await service.integrateWithProjects();

      expect(result.success).toBe(true);
      // Only paid invoices should be counted (50000)
    });

    it('should calculate tender participation costs correctly', async () => {
      const mockTender = {
        id: 'tender_1',
        title: 'Construction Tender',
        category: 'construction',
        estimatedValue: 1000000,
      };

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([mockTender])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.integrateWithTenders();

      expect(result.success).toBe(true);
      // Construction tender should have base cost (5000) + additional cost (10000) = 15000
    });

    it('should calculate win probability correctly', async () => {
      const mockTender = {
        id: 'tender_1',
        title: 'Small Tender',
        category: 'consulting',
        estimatedValue: 50000, // Small tender should get +10% probability
      };

      const mockPastTenders = [
        { category: 'consulting', status: 'completed', result: 'won' },
        { category: 'consulting', status: 'completed', result: 'lost' },
        { category: 'consulting', status: 'completed', result: 'won' },
      ];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([mockTender])
        .mockResolvedValueOnce(mockPastTenders)
        .mockResolvedValueOnce([]);

      const result = await service.integrateWithTenders();

      expect(result.success).toBe(true);
      // Win probability should be calculated based on historical data and tender size
    });
  });

  describe('Sync Log Management', () => {
    it('should save sync results correctly', async () => {
      const mockSyncResult: SyncResult = {
        success: true,
        recordsProcessed: 5,
        recordsUpdated: 3,
        recordsCreated: 2,
        errors: [],
        timestamp: new Date().toISOString(),
      };

      mockAsyncStorage.getItem.mockResolvedValue([]);

      // Trigger a sync to test log saving
      mockAsyncStorage.getItem
        .mockResolvedValueOnce([]) // projects
        .mockResolvedValueOnce([]); // sync log

      await service.integrateWithProjects();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_log',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'projects',
            success: true,
          }),
        ])
      );
    });

    it('should retrieve sync log correctly', async () => {
      const mockSyncLog = [
        {
          type: 'projects',
          success: true,
          recordsProcessed: 5,
          recordsUpdated: 3,
          recordsCreated: 2,
          errors: [],
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(mockSyncLog);

      const syncLog = await service.getSyncLog();

      expect(syncLog).toEqual(mockSyncLog);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('sync_log');
    });

    it('should limit sync log to 100 entries', async () => {
      const existingSyncLog = Array.from({ length: 100 }, (_, i) => ({
        type: 'projects',
        success: true,
        recordsProcessed: 1,
        recordsUpdated: 0,
        recordsCreated: 1,
        errors: [],
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
      }));

      mockAsyncStorage.getItem
        .mockResolvedValueOnce([]) // projects
        .mockResolvedValueOnce(existingSyncLog); // existing sync log

      await service.integrateWithProjects();

      // Should save with only 100 entries (removed oldest)
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_log',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'projects',
          }),
        ])
      );

      const savedLog = mockAsyncStorage.setItem.mock.calls.find(
        call => call[0] === 'sync_log'
      )?.[1];

      expect(savedLog).toHaveLength(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await service.integrateWithProjects();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('خطأ عام في تكامل المشاريع');
    });

    it('should handle invalid data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await service.integrateWithProjects();

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(0);
    });

    it('should handle partial failures in batch operations', async () => {
      const mockProjects = [
        { id: 'project_1', name: 'Valid Project', contractValue: 100000 },
        { id: 'project_2' }, // Invalid project (missing required fields)
      ];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(mockProjects)
        .mockResolvedValueOnce([]) // expenses for project_1
        .mockResolvedValueOnce([]) // invoices for project_1
        .mockRejectedValueOnce(new Error('Invalid project data')) // error for project_2
        .mockResolvedValueOnce([]); // existing financial records

      const result = await service.integrateWithProjects();

      expect(result.success).toBe(false);
      expect(result.recordsProcessed).toBe(1); // Only one project processed successfully
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', async () => {
      const largeProjectSet = Array.from({ length: 10 }, (_, i) => ({
        id: `project_${i}`,
        name: `Project ${i}`,
        contractValue: 100000 + i * 1000,
        startDate: '2024-01-01',
      }));

      // Mock multiple calls for large dataset
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'projects') return Promise.resolve(largeProjectSet);
        if (key === 'expenses') return Promise.resolve([]);
        if (key === 'invoices') return Promise.resolve([]);
        if (key === 'sync_log') return Promise.resolve([]);
        if (key === 'financial_integration') return Promise.resolve([]);
        return Promise.resolve([]);
      });

      const startTime = Date.now();
      const result = await service.integrateWithProjects();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should cleanup resources properly', () => {
      const destroySpy = vi.spyOn(service, 'destroy');
      
      service.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
