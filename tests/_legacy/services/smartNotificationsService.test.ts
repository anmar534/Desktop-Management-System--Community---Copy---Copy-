/**
 * اختبارات خدمة الإشعارات والتنبيهات الذكية
 * Smart Notifications Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { smartNotificationsService, NotificationRule, SmartNotification, NotificationSettings } from '../../src/services/smartNotificationsService';
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

describe('SmartNotificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('إدارة قواعد الإشعارات', () => {
    it('يجب إنشاء قاعدة إشعار جديدة', async () => {
      const mockRules: NotificationRule[] = [];
      (asyncStorage.getItem as any).mockResolvedValue(mockRules);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const ruleData = {
        name: 'تحذير تجاوز الميزانية',
        nameEn: 'Budget Overrun Warning',
        description: 'تنبيه عند تجاوز ميزانية المشروع',
        descriptionEn: 'Alert when project budget is exceeded',
        type: 'budget_overrun' as const,
        category: 'warning' as const,
        priority: 'high' as const,
        conditions: [{
          field: 'actualCost',
          operator: 'greater_than' as const,
          value: 100000,
          dataSource: 'projects' as const
        }],
        actions: [{
          type: 'send_notification' as const,
          config: {}
        }],
        isActive: true,
        frequency: 'immediate' as const,
        recipients: ['user1', 'user2'],
        channels: ['in_app', 'email'] as const,
        createdBy: 'test-user'
      };

      const result = await smartNotificationsService.createRule(ruleData);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^rule_\d+_[a-z0-9]+$/);
      expect(result.name).toBe(ruleData.name);
      expect(result.type).toBe(ruleData.type);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(asyncStorage.setItem).toHaveBeenCalledWith('notification_rules', [result]);
    });

    it('يجب الحصول على جميع قواعد الإشعارات', async () => {
      const mockRules: NotificationRule[] = [
        {
          id: 'rule_1',
          name: 'قاعدة اختبار',
          nameEn: 'Test Rule',
          description: 'وصف القاعدة',
          descriptionEn: 'Rule description',
          type: 'custom',
          category: 'info',
          priority: 'medium',
          conditions: [],
          actions: [],
          isActive: true,
          frequency: 'daily',
          recipients: [],
          channels: ['in_app'],
          createdBy: 'test-user',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      (asyncStorage.getItem as any).mockResolvedValue(mockRules);

      const result = await smartNotificationsService.getAllRules();

      expect(result).toEqual(mockRules);
      expect(asyncStorage.getItem).toHaveBeenCalledWith('notification_rules');
    });

    it('يجب تحديث قاعدة إشعار موجودة', async () => {
      const originalUpdatedAt = '2025-01-01T00:00:00.000Z';
      const mockRules: NotificationRule[] = [
        {
          id: 'rule_1',
          name: 'قاعدة قديمة',
          nameEn: 'Old Rule',
          description: 'وصف قديم',
          descriptionEn: 'Old description',
          type: 'custom',
          category: 'info',
          priority: 'medium',
          conditions: [],
          actions: [],
          isActive: true,
          frequency: 'daily',
          recipients: [],
          channels: ['in_app'],
          createdBy: 'test-user',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: originalUpdatedAt
        }
      ];

      (asyncStorage.getItem as any).mockResolvedValue(mockRules);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const updates = {
        name: 'قاعدة محدثة',
        description: 'وصف محدث',
        isActive: false
      };

      // إضافة تأخير صغير لضمان اختلاف الوقت
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await smartNotificationsService.updateRule('rule_1', updates);

      expect(result).toBeDefined();
      expect(result!.name).toBe(updates.name);
      expect(result!.description).toBe(updates.description);
      expect(result!.isActive).toBe(false);
      expect(result!.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(result!.updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    it('يجب حذف قاعدة إشعار', async () => {
      const mockRules: NotificationRule[] = [
        {
          id: 'rule_1',
          name: 'قاعدة للحذف',
          nameEn: 'Rule to Delete',
          description: 'وصف',
          descriptionEn: 'Description',
          type: 'custom',
          category: 'info',
          priority: 'medium',
          conditions: [],
          actions: [],
          isActive: true,
          frequency: 'daily',
          recipients: [],
          channels: ['in_app'],
          createdBy: 'test-user',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      (asyncStorage.getItem as any).mockResolvedValue(mockRules);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const result = await smartNotificationsService.deleteRule('rule_1');

      expect(result).toBe(true);
      expect(asyncStorage.setItem).toHaveBeenCalledWith('notification_rules', []);
    });

    it('يجب إرجاع false عند حذف قاعدة غير موجودة', async () => {
      const mockRules: NotificationRule[] = [];
      (asyncStorage.getItem as any).mockResolvedValue(mockRules);

      const result = await smartNotificationsService.deleteRule('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('تقييم القواعد وإنشاء الإشعارات', () => {
    it('يجب تقييم القواعد وإنشاء إشعارات جديدة', async () => {
      const mockRules: NotificationRule[] = [
        {
          id: 'rule_1',
          name: 'تحذير الميزانية',
          nameEn: 'Budget Warning',
          description: 'تحذير عند تجاوز الميزانية',
          descriptionEn: 'Warning when budget exceeded',
          type: 'budget_overrun',
          category: 'warning',
          priority: 'high',
          conditions: [{
            field: 'actualCost',
            operator: 'greater_than',
            value: 50000,
            dataSource: 'projects'
          }],
          actions: [{
            type: 'send_notification',
            config: {}
          }],
          isActive: true,
          frequency: 'immediate',
          recipients: ['user1'],
          channels: ['in_app'],
          createdBy: 'test-user',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      const mockProjects = [
        {
          id: 'project_1',
          name: 'مشروع اختبار',
          actualCost: 75000,
          budget: 50000
        }
      ];

      const mockNotifications: SmartNotification[] = [];

      (asyncStorage.getItem as any)
        .mockResolvedValueOnce(mockRules) // للحصول على القواعد
        .mockResolvedValueOnce(mockProjects) // لبيانات المشاريع
        .mockResolvedValueOnce(mockNotifications); // للإشعارات الموجودة

      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const result = await smartNotificationsService.evaluateRules();

      expect(result).toHaveLength(1);
      expect(result[0].ruleId).toBe('rule_1');
      expect(result[0].type).toBe('budget_overrun');
      expect(result[0].category).toBe('warning');
      expect(result[0].priority).toBe('high');
      expect(result[0].status).toBe('unread');
    });

    it('يجب عدم إنشاء إشعارات عندما لا تتطابق الشروط', async () => {
      const mockRules: NotificationRule[] = [
        {
          id: 'rule_1',
          name: 'تحذير الميزانية',
          nameEn: 'Budget Warning',
          description: 'تحذير عند تجاوز الميزانية',
          descriptionEn: 'Warning when budget exceeded',
          type: 'budget_overrun',
          category: 'warning',
          priority: 'high',
          conditions: [{
            field: 'actualCost',
            operator: 'greater_than',
            value: 100000,
            dataSource: 'projects'
          }],
          actions: [{
            type: 'send_notification',
            config: {}
          }],
          isActive: true,
          frequency: 'immediate',
          recipients: ['user1'],
          channels: ['in_app'],
          createdBy: 'test-user',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      const mockProjects = [
        {
          id: 'project_1',
          name: 'مشروع اختبار',
          actualCost: 50000,
          budget: 75000
        }
      ];

      (asyncStorage.getItem as any)
        .mockResolvedValueOnce(mockRules)
        .mockResolvedValueOnce(mockProjects);

      const result = await smartNotificationsService.evaluateRules();

      expect(result).toHaveLength(0);
    });

    it('يجب تجاهل القواعد غير النشطة', async () => {
      const mockRules: NotificationRule[] = [
        {
          id: 'rule_1',
          name: 'قاعدة معطلة',
          nameEn: 'Disabled Rule',
          description: 'قاعدة معطلة',
          descriptionEn: 'Disabled rule',
          type: 'custom',
          category: 'info',
          priority: 'medium',
          conditions: [{
            field: 'status',
            operator: 'equals',
            value: 'active',
            dataSource: 'projects'
          }],
          actions: [{
            type: 'send_notification',
            config: {}
          }],
          isActive: false,
          frequency: 'immediate',
          recipients: ['user1'],
          channels: ['in_app'],
          createdBy: 'test-user',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      (asyncStorage.getItem as any).mockResolvedValue(mockRules);

      const result = await smartNotificationsService.evaluateRules();

      expect(result).toHaveLength(0);
    });
  });

  describe('إدارة الإشعارات', () => {
    it('يجب الحصول على جميع الإشعارات', async () => {
      const mockNotifications: SmartNotification[] = [
        {
          id: 'notif_1',
          ruleId: 'rule_1',
          title: 'إشعار اختبار',
          titleEn: 'Test Notification',
          message: 'رسالة الإشعار',
          messageEn: 'Notification message',
          type: 'custom',
          category: 'info',
          priority: 'medium',
          status: 'unread',
          data: {},
          recipients: ['user1'],
          channels: ['in_app'],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      (asyncStorage.getItem as any).mockResolvedValue(mockNotifications);

      const result = await smartNotificationsService.getAllNotifications();

      expect(result).toEqual(mockNotifications);
      expect(asyncStorage.getItem).toHaveBeenCalledWith('smart_notifications');
    });

    it('يجب تحديث حالة الإشعار', async () => {
      const mockNotifications: SmartNotification[] = [
        {
          id: 'notif_1',
          ruleId: 'rule_1',
          title: 'إشعار اختبار',
          titleEn: 'Test Notification',
          message: 'رسالة الإشعار',
          messageEn: 'Notification message',
          type: 'custom',
          category: 'info',
          priority: 'medium',
          status: 'unread',
          data: {},
          recipients: ['user1'],
          channels: ['in_app'],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      (asyncStorage.getItem as any).mockResolvedValue(mockNotifications);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const result = await smartNotificationsService.updateNotificationStatus('notif_1', 'read');

      expect(result).toBe(true);
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'smart_notifications',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'notif_1',
            status: 'read',
            readAt: expect.any(String)
          })
        ])
      );
    });

    it('يجب إرجاع false عند تحديث إشعار غير موجود', async () => {
      const mockNotifications: SmartNotification[] = [];
      (asyncStorage.getItem as any).mockResolvedValue(mockNotifications);

      const result = await smartNotificationsService.updateNotificationStatus('non-existent', 'read');

      expect(result).toBe(false);
    });
  });

  describe('إعدادات الإشعارات', () => {
    it('يجب الحصول على إعدادات المستخدم', async () => {
      const mockSettings = {
        user1: {
          userId: 'user1',
          enableInApp: true,
          enableEmail: false,
          enableSMS: false,
          enableDesktop: true,
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00'
          },
          categories: {
            urgent: true,
            warning: true,
            info: false,
            success: true
          },
          types: {
            project_critical: true,
            deadline_warning: true,
            budget_overrun: true,
            opportunity: false,
            risk: true,
            performance: false,
            custom: false
          },
          frequency: {
            immediate: true,
            daily: false,
            weekly: false,
            monthly: false
          },
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      };

      (asyncStorage.getItem as any).mockResolvedValue(mockSettings);

      const result = await smartNotificationsService.getUserSettings('user1');

      expect(result).toEqual(mockSettings.user1);
      expect(asyncStorage.getItem).toHaveBeenCalledWith('notification_settings');
    });

    it('يجب حفظ إعدادات المستخدم', async () => {
      const mockSettings = {};
      (asyncStorage.getItem as any).mockResolvedValue(mockSettings);
      (asyncStorage.setItem as any).mockResolvedValue(undefined);

      const userSettings: NotificationSettings = {
        userId: 'user1',
        enableInApp: true,
        enableEmail: true,
        enableSMS: false,
        enableDesktop: false,
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        },
        categories: {
          urgent: true,
          warning: true,
          info: true,
          success: true
        },
        types: {
          project_critical: true,
          deadline_warning: true,
          budget_overrun: true,
          opportunity: true,
          risk: true,
          performance: true,
          custom: false
        },
        frequency: {
          immediate: true,
          daily: true,
          weekly: false,
          monthly: false
        },
        updatedAt: '2025-01-01T00:00:00.000Z'
      };

      await smartNotificationsService.saveUserSettings(userSettings);

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'notification_settings',
        expect.objectContaining({
          user1: expect.objectContaining({
            userId: 'user1',
            enableInApp: true,
            enableEmail: true,
            updatedAt: expect.any(String)
          })
        })
      );
    });
  });

  describe('تحليلات الإشعارات', () => {
    it('يجب حساب تحليلات الإشعارات', async () => {
      const mockNotifications: SmartNotification[] = [
        {
          id: 'notif_1',
          ruleId: 'rule_1',
          title: 'إشعار 1',
          titleEn: 'Notification 1',
          message: 'رسالة 1',
          messageEn: 'Message 1',
          type: 'project_critical',
          category: 'urgent',
          priority: 'high',
          status: 'read',
          data: {},
          recipients: ['user1'],
          channels: ['in_app', 'email'],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'notif_2',
          ruleId: 'rule_2',
          title: 'إشعار 2',
          titleEn: 'Notification 2',
          message: 'رسالة 2',
          messageEn: 'Message 2',
          type: 'deadline_warning',
          category: 'warning',
          priority: 'medium',
          status: 'unread',
          data: {},
          recipients: ['user1'],
          channels: ['in_app'],
          createdAt: '2025-01-02T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z'
        },
        {
          id: 'notif_3',
          ruleId: 'rule_3',
          title: 'إشعار 3',
          titleEn: 'Notification 3',
          message: 'رسالة 3',
          messageEn: 'Message 3',
          type: 'project_critical',
          category: 'urgent',
          priority: 'high',
          status: 'dismissed',
          data: {},
          recipients: ['user1'],
          channels: ['email'],
          createdAt: '2025-01-03T00:00:00.000Z',
          updatedAt: '2025-01-03T00:00:00.000Z'
        }
      ];

      (asyncStorage.getItem as any).mockResolvedValue(mockNotifications);

      const result = await smartNotificationsService.getAnalytics();

      expect(result.totalSent).toBe(3);
      expect(result.totalRead).toBe(1);
      expect(result.totalDismissed).toBe(1);
      expect(result.readRate).toBeCloseTo(33.33, 1);
      expect(result.dismissalRate).toBeCloseTo(33.33, 1);
      
      expect(result.byType).toEqual({
        project_critical: 2,
        deadline_warning: 1
      });
      
      expect(result.byCategory).toEqual({
        urgent: 2,
        warning: 1
      });
      
      expect(result.byChannel).toEqual({
        in_app: 2,
        email: 2
      });
      
      expect(result.trends.daily).toHaveLength(3);
    });

    it('يجب التعامل مع قائمة إشعارات فارغة', async () => {
      (asyncStorage.getItem as any).mockResolvedValue([]);

      const result = await smartNotificationsService.getAnalytics();

      expect(result.totalSent).toBe(0);
      expect(result.totalRead).toBe(0);
      expect(result.totalDismissed).toBe(0);
      expect(result.readRate).toBe(0);
      expect(result.dismissalRate).toBe(0);
      expect(result.byType).toEqual({});
      expect(result.byCategory).toEqual({});
      expect(result.byChannel).toEqual({});
    });
  });

  describe('معالجة الأخطاء', () => {
    it('يجب التعامل مع أخطاء التخزين عند تحميل القواعد', async () => {
      (asyncStorage.getItem as any).mockRejectedValue(new Error('Storage error'));

      const result = await smartNotificationsService.getAllRules();

      expect(result).toEqual([]);
    });

    it('يجب التعامل مع أخطاء التخزين عند تحميل الإشعارات', async () => {
      (asyncStorage.getItem as any).mockRejectedValue(new Error('Storage error'));

      const result = await smartNotificationsService.getAllNotifications();

      expect(result).toEqual([]);
    });

    it('يجب التعامل مع أخطاء التخزين عند تحميل الإعدادات', async () => {
      (asyncStorage.getItem as any).mockRejectedValue(new Error('Storage error'));

      const result = await smartNotificationsService.getUserSettings('user1');

      expect(result).toBeNull();
    });
  });
});
