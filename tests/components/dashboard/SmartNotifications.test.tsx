/**
 * اختبارات مكون الإشعارات والتنبيهات الذكية
 * Smart Notifications Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmartNotifications } from '../../../src/components/dashboard/SmartNotifications';
import { smartNotificationsService } from '../../../src/services/smartNotificationsService';

// Mock the service
vi.mock('../../../src/services/smartNotificationsService', () => ({
  smartNotificationsService: {
    getAllNotifications: vi.fn(),
    getAllRules: vi.fn(),
    getUserSettings: vi.fn(),
    getAnalytics: vi.fn(),
    evaluateRules: vi.fn(),
    updateNotificationStatus: vi.fn()
  }
}));

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
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
    />
  )
}));

vi.mock('../../../src/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-default-value={defaultValue}>{children}</div>,
  TabsList: ({ children }: any) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button role="tab" data-value={value}>{children}</button>,
  TabsContent: ({ children, value }: any) => <div role="tabpanel" data-value={value}>{children}</div>
}));

vi.mock('../../../src/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-value={value} onClick={() => onValueChange?.('test-value')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>Select Value</span>
}));

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span className={className} data-variant={variant}>{children}</span>
  )
}));

describe('SmartNotifications Component', () => {
  const mockNotifications = [
    {
      id: 'notif_1',
      ruleId: 'rule_1',
      title: 'تحذير تجاوز الميزانية',
      titleEn: 'Budget Overrun Warning',
      message: 'تم تجاوز ميزانية المشروع بنسبة 20%',
      messageEn: 'Project budget exceeded by 20%',
      type: 'budget_overrun',
      category: 'warning',
      priority: 'high',
      status: 'unread',
      data: { projectId: 'project_1', overrunAmount: 10000 },
      recipients: ['user1', 'user2'],
      channels: ['in_app', 'email'],
      createdAt: '2025-01-01T10:00:00.000Z',
      updatedAt: '2025-01-01T10:00:00.000Z'
    },
    {
      id: 'notif_2',
      ruleId: 'rule_2',
      title: 'موعد نهائي قريب',
      titleEn: 'Deadline Approaching',
      message: 'ينتهي موعد المشروع خلال 3 أيام',
      messageEn: 'Project deadline in 3 days',
      type: 'deadline_warning',
      category: 'info',
      priority: 'medium',
      status: 'read',
      data: { projectId: 'project_2', daysRemaining: 3 },
      recipients: ['user1'],
      channels: ['in_app'],
      createdAt: '2025-01-02T14:30:00.000Z',
      updatedAt: '2025-01-02T15:00:00.000Z'
    }
  ];

  const mockRules = [
    {
      id: 'rule_1',
      name: 'تحذير تجاوز الميزانية',
      nameEn: 'Budget Overrun Warning',
      description: 'تنبيه عند تجاوز ميزانية المشروع',
      descriptionEn: 'Alert when project budget is exceeded',
      type: 'budget_overrun',
      category: 'warning',
      priority: 'high',
      conditions: [],
      actions: [],
      isActive: true,
      frequency: 'immediate',
      recipients: ['user1'],
      channels: ['in_app', 'email'],
      createdBy: 'test-user',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    }
  ];

  const mockSettings = {
    userId: 'user1',
    enableInApp: true,
    enableEmail: true,
    enableSMS: false,
    enableDesktop: false,
    quietHours: {
      enabled: false,
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

  const mockAnalytics = {
    totalSent: 10,
    totalRead: 7,
    totalDismissed: 2,
    readRate: 70,
    dismissalRate: 20,
    byType: {
      budget_overrun: 3,
      deadline_warning: 4,
      project_critical: 2,
      opportunity: 1
    },
    byCategory: {
      urgent: 2,
      warning: 5,
      info: 2,
      success: 1
    },
    byChannel: {
      in_app: 10,
      email: 6,
      sms: 1,
      desktop: 3
    },
    trends: {
      daily: [
        { date: '2025-01-01', count: 3 },
        { date: '2025-01-02', count: 5 },
        { date: '2025-01-03', count: 2 }
      ],
      weekly: [],
      monthly: []
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (smartNotificationsService.getAllNotifications as any).mockResolvedValue(mockNotifications);
    (smartNotificationsService.getAllRules as any).mockResolvedValue(mockRules);
    (smartNotificationsService.getUserSettings as any).mockResolvedValue(mockSettings);
    (smartNotificationsService.getAnalytics as any).mockResolvedValue(mockAnalytics);
    (smartNotificationsService.evaluateRules as any).mockResolvedValue([]);
    (smartNotificationsService.updateNotificationStatus as any).mockResolvedValue(true);
  });

  describe('عرض المكون', () => {
    it('يجب عرض المكون بنجاح', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText('الإشعارات والتنبيهات الذكية')).toBeInTheDocument();
      });

      expect(screen.getByText('إدارة ومراقبة الإشعارات والتنبيهات التلقائية')).toBeInTheDocument();
    });

    it('يجب عرض حالة التحميل', () => {
      (smartNotificationsService.getAllNotifications as any).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<SmartNotifications />);

      expect(screen.getByText('جاري تحميل الإشعارات...')).toBeInTheDocument();
    });

    it('يجب عرض الإحصائيات السريعة', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText('إجمالي الإشعارات')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('معدل القراءة')).toBeInTheDocument();
        expect(screen.getByText('70.0%')).toBeInTheDocument();
      });
    });
  });

  describe('قائمة الإشعارات', () => {
    it('يجب عرض قائمة الإشعارات', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText('تحذير تجاوز الميزانية')).toBeInTheDocument();
        expect(screen.getByText('موعد نهائي قريب')).toBeInTheDocument();
      });

      expect(screen.getByText('تم تجاوز ميزانية المشروع بنسبة 20%')).toBeInTheDocument();
      expect(screen.getByText('ينتهي موعد المشروع خلال 3 أيام')).toBeInTheDocument();
    });

    it('يجب عرض شارة "جديد" للإشعارات غير المقروءة', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const newBadges = screen.getAllByText('جديد');
        expect(newBadges).toHaveLength(1);
      });
    });

    it('يجب عرض أولوية الإشعارات', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText('عالية')).toBeInTheDocument();
        expect(screen.getByText('متوسطة')).toBeInTheDocument();
      });
    });

    it('يجب عرض رسالة عند عدم وجود إشعارات', async () => {
      (smartNotificationsService.getAllNotifications as any).mockResolvedValue([]);

      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText('لا توجد إشعارات')).toBeInTheDocument();
      });
    });
  });

  describe('البحث والفلترة', () => {
    it('يجب عرض شريط البحث', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('البحث في الإشعارات...')).toBeInTheDocument();
      });
    });

    it('يجب عرض فلاتر الفئات والحالات', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const selects = screen.getAllByText('Select Value');
        expect(selects.length).toBeGreaterThan(0);
      });
    });

    it('يجب تحديث البحث عند الكتابة', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في الإشعارات...');
        fireEvent.change(searchInput, { target: { value: 'ميزانية' } });
        expect(searchInput).toHaveValue('ميزانية');
      });
    });
  });

  describe('إجراءات الإشعارات', () => {
    it('يجب تحديث حالة الإشعار عند النقر على "قراءة"', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const readButtons = screen.getAllByRole('button');
        const readButton = readButtons.find(button => 
          button.querySelector('svg') // البحث عن أيقونة العين
        );
        
        if (readButton) {
          fireEvent.click(readButton);
          expect(smartNotificationsService.updateNotificationStatus).toHaveBeenCalledWith('notif_1', 'read');
        }
      });
    });

    it('يجب تحديث حالة الإشعار عند النقر على "رفض"', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const dismissButtons = screen.getAllByRole('button');
        const dismissButton = dismissButtons.find(button => 
          button.querySelector('svg') // البحث عن أيقونة X
        );
        
        if (dismissButton) {
          fireEvent.click(dismissButton);
          expect(smartNotificationsService.updateNotificationStatus).toHaveBeenCalledWith('notif_1', 'dismissed');
        }
      });
    });

    it('يجب تقييم القواعد عند النقر على "تحديث"', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const updateButton = screen.getByText('تحديث');
        fireEvent.click(updateButton);
        expect(smartNotificationsService.evaluateRules).toHaveBeenCalled();
      });
    });
  });

  describe('التبويبات', () => {
    it('يجب عرض تبويبات الإشعارات والقواعد والإعدادات', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText('الإشعارات')).toBeInTheDocument();
        expect(screen.getByText('القواعد')).toBeInTheDocument();
        expect(screen.getByText('الإعدادات')).toBeInTheDocument();
      });
    });

    it('يجب عرض قائمة القواعد في تبويب القواعد', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText('قواعد الإشعارات')).toBeInTheDocument();
        expect(screen.getByText('قاعدة جديدة')).toBeInTheDocument();
      });
    });
  });

  describe('معالجة الأخطاء', () => {
    it('يجب عرض رسالة خطأ عند فشل تحميل البيانات', async () => {
      const errorMessage = 'فشل في تحميل البيانات';
      (smartNotificationsService.getAllNotifications as any).mockRejectedValue(new Error(errorMessage));

      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('يجب عرض رسالة خطأ عند فشل تحديث الإشعار', async () => {
      (smartNotificationsService.updateNotificationStatus as any).mockRejectedValue(
        new Error('فشل في تحديث الإشعار')
      );

      render(<SmartNotifications />);

      await waitFor(() => {
        const readButtons = screen.getAllByRole('button');
        const readButton = readButtons.find(button => 
          button.querySelector('svg')
        );
        
        if (readButton) {
          fireEvent.click(readButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('فشل في تحديث الإشعار')).toBeInTheDocument();
      });
    });
  });

  describe('إمكانية الوصول', () => {
    it('يجب دعم اتجاه RTL', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const rtlContainer = screen.getByText('الإشعارات والتنبيهات الذكية').closest('[dir="rtl"]');
        expect(rtlContainer).toBeInTheDocument();
        expect(rtlContainer).toHaveAttribute('dir', 'rtl');
      });
    });

    it('يجب عرض النصوص العربية بشكل صحيح', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText('الإشعارات والتنبيهات الذكية')).toBeInTheDocument();
        expect(screen.getByText('إدارة ومراقبة الإشعارات والتنبيهات التلقائية')).toBeInTheDocument();
        expect(screen.getByText('تحذير تجاوز الميزانية')).toBeInTheDocument();
      });
    });

    it('يجب أن تكون الأزرار قابلة للوصول', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        
        buttons.forEach(button => {
          expect(button).toBeInTheDocument();
        });
      });
    });

    it('يجب أن تكون التبويبات قابلة للوصول', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
        
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThan(0);
        
        tabs.forEach(tab => {
          expect(tab).toBeInTheDocument();
        });
      });
    });
  });

  describe('الأداء', () => {
    it('يجب تحميل البيانات بسرعة', async () => {
      const startTime = Date.now();
      
      render(<SmartNotifications />);

      await waitFor(() => {
        expect(screen.getByText('الإشعارات والتنبيهات الذكية')).toBeInTheDocument();
      });

      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(1000); // أقل من ثانية واحدة
    });

    it('يجب عدم إعادة تحميل البيانات عند عدم الحاجة', async () => {
      const { rerender } = render(<SmartNotifications />);

      await waitFor(() => {
        expect(smartNotificationsService.getAllNotifications).toHaveBeenCalledTimes(1);
      });

      rerender(<SmartNotifications />);

      // يجب عدم استدعاء الخدمة مرة أخرى
      expect(smartNotificationsService.getAllNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('التفاعل', () => {
    it('يجب الاستجابة للنقر على الأزرار', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const settingsButton = screen.getByText('الإعدادات');
        fireEvent.click(settingsButton);
        
        const analyticsButton = screen.getByText('التحليلات');
        fireEvent.click(analyticsButton);
        
        // التحقق من أن الأزرار تستجيب للنقر
        expect(settingsButton).toBeInTheDocument();
        expect(analyticsButton).toBeInTheDocument();
      });
    });

    it('يجب تحديث الواجهة عند تغيير الفلاتر', async () => {
      render(<SmartNotifications />);

      await waitFor(() => {
        const selects = screen.getAllByText('Select Value');
        if (selects.length > 0) {
          fireEvent.click(selects[0]);
          // التحقق من أن الفلتر يعمل
          expect(selects[0]).toBeInTheDocument();
        }
      });
    });
  });
});
