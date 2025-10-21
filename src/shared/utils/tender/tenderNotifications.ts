// نظام إشعارات المنافسات - لتنبيه المستخدمين بالمهام المطلوبة
import { toast } from 'sonner';
import { getTenderStatusInfo, getNextAction } from './tenderStatusHelpers';
import { safeLocalStorage, STORAGE_KEYS } from '@/utils/storage';
import { authorizeDesktopNotification } from './desktopSecurity';
import type { NotificationRequest, NotificationSeverity } from './desktopSecurity';
import type { Tender } from '@/data/centralData';

export interface TenderNotification {
  id: string;
  type: 'urgent' | 'reminder' | 'success' | 'info';
  title: string;
  message: string;
  action?: string;
  tenderId: string;
  expiresAt?: string;
  timestamp: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type TenderForNotifications = Pick<
  Tender,
  | 'id'
  | 'title'
  | 'name'
  | 'deadline'
  | 'status'
  | 'submissionDate'
  | 'lastUpdate'
  | 'winDate'
  | 'lostDate'
> &
  Partial<Tender>;

const toDateOrUndefined = (value: unknown): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : undefined;
  }

  return undefined;
};

const resolveTenderName = (tender: TenderForNotifications): string =>
  tender.title?.trim() || tender.name?.trim() || 'منافسة بدون عنوان';

const createDateDiffInDays = (target: Date, base: Date): number => {
  const diff = target.getTime() - base.getTime();
  return Math.ceil(diff / MS_PER_DAY);
};

const buildNotificationId = (() => {
  let counter = 0;
  return (prefix: string, tenderId: string) => {
    counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
    return `${prefix}-${tenderId}-${Date.now()}-${counter}`;
  };
})();

export class TenderNotificationService {
  private static notifications: TenderNotification[] = [];

  private static dispatchSecureNotification(
    request: NotificationRequest,
    onAllowed: (payload: NotificationRequest) => void
  ) {
    void authorizeDesktopNotification(request)
      .then(result => {
        if (!result.allowed) {
          console.warn('[TenderNotificationService] notification denied', {
            reason: result.reason,
            scope: request.scope,
            severity: request.severity
          });
          return;
        }

        const payload = result.payload ?? request;
        onAllowed(payload);
      })
      .catch(error => {
        console.warn('[TenderNotificationService] failed to authorize notification', error);
        onAllowed(request);
      });
  }

  // فحص المنافسات وإرسال إشعارات عند الحاجة
  static checkTendersAndNotify(tenders: readonly TenderForNotifications[] = []) {
    if (!Array.isArray(tenders) || tenders.length === 0) {
      return;
    }

    const today = new Date();
    
    tenders.forEach(tender => {
      if (!tender?.id) {
        return;
      }

      const deadline = toDateOrUndefined(tender.deadline);
      const daysLeft = deadline ? createDateDiffInDays(deadline, today) : Number.POSITIVE_INFINITY;
      
      // إشعارات عاجلة للمنافسات القريبة من الانتهاء
      if (
        daysLeft > 0 &&
        daysLeft <= 3 &&
        (tender.status === 'new' || tender.status === 'under_action')
      ) {
        this.createUrgentNotification(tender, daysLeft);
      }
      
      // إشعارات للمنافسات الجاهزة للتقديم
      if (tender.status === 'ready_to_submit') {
        this.createReadyToSubmitNotification(tender);
      }
      
      // إشعارات للمنافسات المقدمة (تذكير بالمتابعة)
      if (tender.status === 'submitted') {
        const submissionDate =
          toDateOrUndefined(tender.submissionDate) ?? toDateOrUndefined(tender.lastUpdate);
        if (!submissionDate) {
          return;
        }

        const daysSinceSubmission = createDateDiffInDays(today, submissionDate);
        
        if (daysSinceSubmission >= 7) {
          this.createFollowUpNotification(tender, daysSinceSubmission);
        }
      }
    });
  }

  // إشعار عاجل للمنافسات القريبة من الانتهاء
  private static createUrgentNotification(tender: TenderForNotifications, daysLeft: number) {
    const displayName = resolveTenderName(tender);
    const message = `المنافسة "${displayName}" تنتهي خلال ${daysLeft} أيام!`;
    const action = getNextAction(tender.status ?? 'new');
    
    const request: NotificationRequest = {
      severity: 'urgent',
      title: 'منافسة عاجلة',
      message,
      description: action,
      actionLabel: 'فتح المنافسة',
      durationMs: 8000,
      scope: `tender:${tender.id}`,
      correlationId: tender.id,
      metadata: {
        tenderId: tender.id,
        status: tender.status,
        daysLeft
      }
    };

    this.dispatchSecureNotification(request, payload => {
      const duration = payload.durationMs ?? 8000;
      const description = payload.description ?? action;

      toast.error(payload.message, {
        description,
        duration,
        action: payload.actionLabel
          ? {
              label: payload.actionLabel,
              onClick: () => {
                console.log('Opening tender:', tender.id);
              }
            }
          : undefined
      });

      this.addNotification({
        id: buildNotificationId('urgent', tender.id),
        type: 'urgent',
        title: payload.title || 'منافسة عاجلة',
        message: payload.message,
        action: payload.actionLabel ?? action,
        tenderId: tender.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  // إشعار للمنافسات الجاهزة للتقديم
  private static createReadyToSubmitNotification(tender: TenderForNotifications) {
    const displayName = resolveTenderName(tender);
    const message = `المنافسة "${displayName}" جاهزة للتقديم`;
    
    const request: NotificationRequest = {
      severity: 'success',
      title: 'جاهزة للتقديم',
      message,
      description: 'يمكنك الآن تقديم العرض للعميل',
      actionLabel: 'تقديم العرض',
      durationMs: 6000,
      scope: `tender:${tender.id}`,
      correlationId: tender.id,
      metadata: {
        tenderId: tender.id,
        status: tender.status
      }
    };

    this.dispatchSecureNotification(request, payload => {
      const duration = payload.durationMs ?? 6000;

      toast.success(payload.message, {
        description: payload.description ?? 'يمكنك الآن تقديم العرض للعميل',
        duration,
        action: payload.actionLabel
          ? {
              label: payload.actionLabel,
              onClick: () => {
                console.log('Submit tender:', tender.id);
              }
            }
          : undefined
      });

      this.addNotification({
        id: buildNotificationId('ready', tender.id),
        type: 'success',
        title: payload.title || 'جاهزة للتقديم',
        message: payload.message,
        action: payload.actionLabel ?? 'تقديم العرض',
        tenderId: tender.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  // إشعار للمتابعة مع العميل
  private static createFollowUpNotification(tender: TenderForNotifications, daysSinceSubmission: number) {
    const displayName = resolveTenderName(tender);
    const message = `تم تقديم المنافسة "${displayName}" منذ ${daysSinceSubmission} أيام`;
    
    const request: NotificationRequest = {
      severity: 'reminder',
      title: 'تذكير بالمتابعة',
      message,
      description: 'قد تحتاج للمتابعة مع العميل حول النتائج',
      actionLabel: 'متابعة',
      durationMs: 5000,
      scope: `tender:${tender.id}`,
      correlationId: tender.id,
      metadata: {
        tenderId: tender.id,
        status: tender.status,
        daysSinceSubmission
      }
    };

    this.dispatchSecureNotification(request, payload => {
      const duration = payload.durationMs ?? 5000;

      toast.info(payload.message, {
        description: payload.description ?? 'قد تحتاج للمتابعة مع العميل حول النتائج',
        duration,
        action: payload.actionLabel
          ? {
              label: payload.actionLabel,
              onClick: () => {
                console.log('Follow up tender:', tender.id);
              }
            }
          : undefined
      });

      this.addNotification({
        id: buildNotificationId('followup', tender.id),
        type: 'info',
        title: payload.title || 'تذكير بالمتابعة',
        message: payload.message,
        action: payload.actionLabel ?? 'المتابعة مع العميل',
        tenderId: tender.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  // إشعار عند تحديث حالة المنافسة
  static notifyStatusChange(tender: TenderForNotifications, newStatus: Tender['status'] | string) {
    if (!tender?.id) {
      return;
    }

    const statusInfo = getTenderStatusInfo(newStatus as Tender['status']);
    const displayName = resolveTenderName(tender);
    const localizedLabel = statusInfo?.label ?? newStatus;
    const message = `تم تحديث حالة المنافسة "${displayName}" إلى "${localizedLabel}"`;

    const severity: NotificationSeverity = newStatus === 'won' ? 'success' : newStatus === 'lost' ? 'warning' : 'info';
    const baseTitle = newStatus === 'won' ? '🎉 فوز بالمنافسة' : 'تحديث الحالة';
    const description = newStatus === 'submitted' ? 'سيتم إشعارك عند توفر النتائج' : message;
    const durationMs = newStatus === 'won' ? 10000 : newStatus === 'submitted' ? 6000 : 5000;

    const request: NotificationRequest = {
      severity,
      title: baseTitle,
      message,
      description,
      durationMs,
      scope: `tender:${tender.id}`,
      correlationId: `${tender.id}-${newStatus}`,
      metadata: {
        tenderId: tender.id,
        status: newStatus
      }
    };

    this.dispatchSecureNotification(request, payload => {
      const duration = payload.durationMs ?? durationMs;

      if (severity === 'success') {
        toast.success(payload.title ?? message, {
          description: payload.description ?? message,
          duration
        });
      } else if (severity === 'warning') {
        toast.warning(payload.title ?? 'تحديث نتيجة المنافسة', {
          description: payload.description ?? message,
          duration
        });
      } else {
        toast.info(payload.title ?? 'تحديث حالة المنافسة', {
          description: payload.description ?? message,
          duration
        });
      }

      this.addNotification({
        id: buildNotificationId('status', tender.id),
        type: severity === 'success' ? 'success' : severity === 'warning' ? 'urgent' : 'info',
        title: payload.title ?? baseTitle,
        message: payload.message,
        tenderId: tender.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  // إضافة إشعار للقائمة
  private static addNotification(notification: TenderNotification) {
    this.notifications.unshift(notification);
    // الحفاظ على آخر 100 إشعار فقط
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    
    // حفظ في التخزين الموحد للإبقاء على الإشعارات
    try {
      safeLocalStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    } catch (error) {
      console.warn('Could not save notifications to storage:', error);
    }
  }

  // جلب جميع الإشعارات
  static getAllNotifications(): TenderNotification[] {
    // تحميل من التخزين الموحد عند أول استدعاء
    if (this.notifications.length === 0) {
      try {
        const saved = safeLocalStorage.getItem<TenderNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
        if (saved && Array.isArray(saved)) {
          this.notifications = saved;
        }
      } catch (error) {
        console.warn('Could not load notifications from storage:', error);
      }
    }
    
    return this.notifications;
  }

  // حذف إشعار
  static dismissNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    try {
      safeLocalStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    } catch (error) {
      console.warn('Could not save notifications to storage:', error);
    }
  }

  // مسح جميع الإشعارات
  static clearAllNotifications() {
    this.notifications = [];
    try {
      safeLocalStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    } catch (error) {
      console.warn('Could not clear notifications from storage:', error);
    }
  }

  // تنظيف الإشعارات المنتهية الصلاحية أو القديمة
  static removeExpiredNotifications({ olderThanDays = 30 }: { olderThanDays?: number } = {}) {
    const now = Date.now();
    const cutoff = Math.max(0, olderThanDays) * MS_PER_DAY;
    const cutoffTime = now - cutoff;

    const existing = this.getAllNotifications();
    const filtered = existing.filter(notification => {
      const timestamp = toDateOrUndefined(notification.timestamp);
      if (!timestamp) {
        return false;
      }

      if (notification.expiresAt) {
        const expiryTime = toDateOrUndefined(notification.expiresAt)?.getTime();
        if (expiryTime !== undefined && expiryTime <= now) {
          return false;
        }
      }

      return timestamp.getTime() >= cutoffTime;
    });

    const removed = existing.length - filtered.length;
    if (removed > 0) {
      this.notifications = filtered;
      try {
        safeLocalStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, filtered);
      } catch (error) {
        console.warn('Could not persist notification cleanup:', error);
      }
    }

    return removed;
  }

  // جلب الإشعارات غير المقروءة
  static getUnreadCount(): number {
    // يمكن إضافة منطق لتتبع الإشعارات المقروءة
    return this.notifications.filter(n => {
      const notificationDate = toDateOrUndefined(n.timestamp);
      if (!notificationDate) {
        return false;
      }

      const oneDayAgo = Date.now() - MS_PER_DAY;
      return notificationDate.getTime() > oneDayAgo;
    }).length;
  }
}