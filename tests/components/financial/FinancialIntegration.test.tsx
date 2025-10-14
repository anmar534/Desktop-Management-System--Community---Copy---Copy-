/**
 * اختبارات مكون إدارة التكامل المالي
 * Financial Integration Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancialIntegration } from '../../../src/components/financial/FinancialIntegration';
import { FinancialIntegrationService } from '../../../src/services/financialIntegrationService';

// Mock the service
vi.mock('../../../src/services/financialIntegrationService');

const mockService = {
  getIntegrationSettings: vi.fn(),
  updateIntegrationSettings: vi.fn(),
  integrateWithProjects: vi.fn(),
  integrateWithTenders: vi.fn(),
  getSyncLog: vi.fn(),
  destroy: vi.fn(),
};

const MockedFinancialIntegrationService = FinancialIntegrationService as any;
MockedFinancialIntegrationService.mockImplementation(() => mockService);

describe('FinancialIntegration Component', () => {
  const mockSettings = {
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

  const mockSyncLog = [
    {
      type: 'projects',
      success: true,
      recordsProcessed: 10,
      recordsUpdated: 5,
      recordsCreated: 3,
      errors: [],
      timestamp: '2024-01-01T12:00:00.000Z',
    },
    {
      type: 'tenders',
      success: false,
      recordsProcessed: 5,
      recordsUpdated: 0,
      recordsCreated: 0,
      errors: ['خطأ في الاتصال بقاعدة البيانات'],
      timestamp: '2024-01-01T11:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getIntegrationSettings.mockResolvedValue(mockSettings);
    mockService.getSyncLog.mockResolvedValue(mockSyncLog);
    mockService.integrateWithProjects.mockResolvedValue({
      success: true,
      recordsProcessed: 10,
      recordsUpdated: 5,
      recordsCreated: 3,
      errors: [],
      timestamp: new Date().toISOString(),
    });
    mockService.integrateWithTenders.mockResolvedValue({
      success: true,
      recordsProcessed: 5,
      recordsUpdated: 2,
      recordsCreated: 1,
      errors: [],
      timestamp: new Date().toISOString(),
    });
  });

  describe('Component Rendering', () => {
    it('should render the main title and description', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        expect(screen.getByText('إدارة التكامل المالي')).toBeInTheDocument();
        expect(screen.getByText('تكامل النظام المالي مع أنظمة إدارة المشاريع والمنافسات')).toBeInTheDocument();
      });
    });

    it('should render loading state initially', () => {
      render(<FinancialIntegration />);

      expect(screen.getByText('جاري تحميل بيانات التكامل...')).toBeInTheDocument();
    });

    it('should render all tabs', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument();
        expect(screen.getByText('التزامن')).toBeInTheDocument();
        expect(screen.getByText('الإعدادات')).toBeInTheDocument();
        expect(screen.getByText('السجلات')).toBeInTheDocument();
      });
    });

    it('should render sync and refresh buttons', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        expect(screen.getByText('تزامن شامل')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });
  });

  describe('Overview Tab', () => {
    it('should display integration status cards', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        expect(screen.getByText('حالة التكامل')).toBeInTheDocument();
        expect(screen.getByText('نشط')).toBeInTheDocument();
        expect(screen.getByText('آخر تزامن')).toBeInTheDocument();
        expect(screen.getByText('السجلات المعالجة')).toBeInTheDocument();
        expect(screen.getByText('معدل النجاح')).toBeInTheDocument();
      });
    });

    it('should display project and tender integration status', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        expect(screen.getByText('تكامل المشاريع')).toBeInTheDocument();
        expect(screen.getByText('تكامل المنافسات')).toBeInTheDocument();
        expect(screen.getByText('تزامن المشاريع')).toBeInTheDocument();
        expect(screen.getByText('تزامن المنافسات')).toBeInTheDocument();
      });
    });

    it('should calculate and display success rate correctly', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        // Success rate should be 50% (1 success out of 2 total)
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });

    it('should display total processed records', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        // Total processed records should be 15 (10 + 5)
        expect(screen.getByText('15')).toBeInTheDocument();
      });
    });
  });

  describe('Sync Tab', () => {
    it('should render sync operation buttons', async () => {
      render(<FinancialIntegration />);

      // Switch to sync tab
      fireEvent.click(screen.getByText('التزامن'));

      await waitFor(() => {
        expect(screen.getByText('عمليات التزامن')).toBeInTheDocument();
        expect(screen.getAllByText('تزامن المشاريع')).toHaveLength(2); // One in overview, one in sync tab
        expect(screen.getAllByText('تزامن المنافسات')).toHaveLength(2);
        expect(screen.getAllByText('تزامن شامل')).toHaveLength(2);
      });
    });

    it('should display recent sync results', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('التزامن'));

      await waitFor(() => {
        expect(screen.getByText('آخر نتائج التزامن')).toBeInTheDocument();
        expect(screen.getByText('المشاريع')).toBeInTheDocument();
        expect(screen.getByText('المنافسات')).toBeInTheDocument();
      });
    });

    it('should handle manual sync for projects', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('التزامن'));

      await waitFor(() => {
        const projectSyncButton = screen.getAllByText('تزامن المشاريع')[1]; // Second one in sync tab
        fireEvent.click(projectSyncButton);
      });

      expect(mockService.integrateWithProjects).toHaveBeenCalled();
    });

    it('should handle manual sync for tenders', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('التزامن'));

      await waitFor(() => {
        const tenderSyncButton = screen.getAllByText('تزامن المنافسات')[1]; // Second one in sync tab
        fireEvent.click(tenderSyncButton);
      });

      expect(mockService.integrateWithTenders).toHaveBeenCalled();
    });

    it('should handle full sync', async () => {
      render(<FinancialIntegration />);

      const fullSyncButton = screen.getAllByText('تزامن شامل')[0]; // First one in header
      fireEvent.click(fullSyncButton);

      await waitFor(() => {
        expect(mockService.integrateWithProjects).toHaveBeenCalled();
        expect(mockService.integrateWithTenders).toHaveBeenCalled();
      });
    });
  });

  describe('Settings Tab', () => {
    it('should render all settings options', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('الإعدادات'));

      await waitFor(() => {
        expect(screen.getByText('إعدادات التكامل')).toBeInTheDocument();
        expect(screen.getByText('التزامن التلقائي')).toBeInTheDocument();
        expect(screen.getByText('فترة التزامن (بالدقائق)')).toBeInTheDocument();
        expect(screen.getByText('تكامل المشاريع')).toBeInTheDocument();
        expect(screen.getByText('تكامل المنافسات')).toBeInTheDocument();
        expect(screen.getByText('التحديثات الفورية')).toBeInTheDocument();
      });
    });

    it('should render notification settings', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('الإعدادات'));

      await waitFor(() => {
        expect(screen.getByText('إعدادات التنبيهات')).toBeInTheDocument();
        expect(screen.getByText('تنبيهات البريد الإلكتروني')).toBeInTheDocument();
        expect(screen.getByText('تنبيهات النظام')).toBeInTheDocument();
        expect(screen.getByText('التنبيهات الحرجة فقط')).toBeInTheDocument();
      });
    });

    it('should update auto sync setting', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('الإعدادات'));

      await waitFor(() => {
        const autoSyncSwitch = screen.getByRole('switch', { name: /التزامن التلقائي/i });
        fireEvent.click(autoSyncSwitch);
      });

      expect(mockService.updateIntegrationSettings).toHaveBeenCalledWith({
        autoSync: false,
      });
    });

    it('should update sync interval', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('الإعدادات'));

      await waitFor(() => {
        const syncIntervalInput = screen.getByDisplayValue('15');
        fireEvent.change(syncIntervalInput, { target: { value: '30' } });
      });

      expect(mockService.updateIntegrationSettings).toHaveBeenCalledWith({
        syncInterval: 30,
      });
    });

    it('should update project integration setting', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('الإعدادات'));

      await waitFor(() => {
        const projectIntegrationSwitch = screen.getByRole('switch', { name: /تكامل المشاريع/i });
        fireEvent.click(projectIntegrationSwitch);
      });

      expect(mockService.updateIntegrationSettings).toHaveBeenCalledWith({
        enableProjectIntegration: false,
      });
    });

    it('should update notification settings', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('الإعدادات'));

      await waitFor(() => {
        const emailNotificationsSwitch = screen.getByRole('switch', { name: /تنبيهات البريد الإلكتروني/i });
        fireEvent.click(emailNotificationsSwitch);
      });

      expect(mockService.updateIntegrationSettings).toHaveBeenCalledWith({
        notificationSettings: {
          ...mockSettings.notificationSettings,
          emailNotifications: false,
        },
      });
    });
  });

  describe('Logs Tab', () => {
    it('should display sync log entries', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('السجلات'));

      await waitFor(() => {
        expect(screen.getByText('سجل عمليات التزامن')).toBeInTheDocument();
        expect(screen.getByText('تزامن المشاريع')).toBeInTheDocument();
        expect(screen.getByText('تزامن المنافسات')).toBeInTheDocument();
      });
    });

    it('should display success and failure badges', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('السجلات'));

      await waitFor(() => {
        expect(screen.getByText('نجح')).toBeInTheDocument();
        expect(screen.getByText('فشل')).toBeInTheDocument();
      });
    });

    it('should display sync statistics', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('السجلات'));

      await waitFor(() => {
        expect(screen.getByText('معالج')).toBeInTheDocument();
        expect(screen.getByText('محدث')).toBeInTheDocument();
        expect(screen.getByText('جديد')).toBeInTheDocument();
        expect(screen.getByText('أخطاء')).toBeInTheDocument();
      });
    });

    it('should display error details for failed syncs', async () => {
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('السجلات'));

      await waitFor(() => {
        expect(screen.getByText('الأخطاء:')).toBeInTheDocument();
        expect(screen.getByText('خطأ في الاتصال بقاعدة البيانات')).toBeInTheDocument();
      });
    });

    it('should display empty state when no logs exist', async () => {
      mockService.getSyncLog.mockResolvedValue([]);
      
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('السجلات'));

      await waitFor(() => {
        expect(screen.getByText('لا توجد سجلات تزامن بعد')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockService.getIntegrationSettings.mockRejectedValue(new Error('Service error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<FinancialIntegration />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading integration data:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle sync errors gracefully', async () => {
      mockService.integrateWithProjects.mockRejectedValue(new Error('Sync error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<FinancialIntegration />);

      await waitFor(() => {
        const syncButton = screen.getAllByText('تزامن شامل')[0];
        fireEvent.click(syncButton);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error during manual sync:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle settings update errors gracefully', async () => {
      mockService.updateIntegrationSettings.mockRejectedValue(new Error('Update error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<FinancialIntegration />);

      fireEvent.click(screen.getByText('الإعدادات'));

      await waitFor(() => {
        const autoSyncSwitch = screen.getByRole('switch', { name: /التزامن التلقائي/i });
        fireEvent.click(autoSyncSwitch);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error updating settings:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Component Lifecycle', () => {
    it('should load data on mount', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        expect(mockService.getIntegrationSettings).toHaveBeenCalled();
        expect(mockService.getSyncLog).toHaveBeenCalled();
      });
    });

    it('should cleanup service on unmount', () => {
      const { unmount } = render(<FinancialIntegration />);

      unmount();

      expect(mockService.destroy).toHaveBeenCalled();
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);
      });

      // Should be called twice: once on mount, once on refresh
      expect(mockService.getIntegrationSettings).toHaveBeenCalledTimes(2);
      expect(mockService.getSyncLog).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper RTL direction', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        const mainContainer = screen.getByText('إدارة التكامل المالي').closest('div');
        expect(mainContainer).toHaveAttribute('dir', 'rtl');
      });
    });

    it('should have proper button roles and labels', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /تزامن شامل/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });

    it('should have proper tab navigation', async () => {
      render(<FinancialIntegration />);

      await waitFor(() => {
        const overviewTab = screen.getByRole('tab', { name: /نظرة عامة/i });
        const syncTab = screen.getByRole('tab', { name: /التزامن/i });
        const settingsTab = screen.getByRole('tab', { name: /الإعدادات/i });
        const logsTab = screen.getByRole('tab', { name: /السجلات/i });

        expect(overviewTab).toBeInTheDocument();
        expect(syncTab).toBeInTheDocument();
        expect(settingsTab).toBeInTheDocument();
        expect(logsTab).toBeInTheDocument();
      });
    });
  });
});
