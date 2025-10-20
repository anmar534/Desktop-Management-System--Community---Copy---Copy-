import { recordAuditEvent, type AuditEventLevel } from './auditLog';

/**
 * 🚀 نظام إدارة الأحداث الموحد - EventManager
 * يوحد إدارة الأحداث المخصصة ويقلل التكرار في الكود
 */

// أنواع الأحداث المتاحة في النظام
export enum SystemEventType {
  // أحداث المنافسات
  TENDERS_UPDATED = 'tenders-updated',
  TENDER_STATUS_CHANGED = 'tender-status-changed',
  TENDER_PRICING_COMPLETED = 'tender-pricing-completed',
  
  // أحداث المشاريع
  PROJECTS_UPDATED = 'projects-updated',
  PROJECT_STATUS_CHANGED = 'project-status-changed',
  
  // أحداث المصروفات
  EXPENSES_UPDATED = 'expenses-updated',
  EXPENSE_ADDED = 'expense-added',
  
  // أحداث التطوير
  DEVELOPMENT_UPDATED = 'development-updated',
  DEVELOPMENT_STATS_CHANGED = 'development-stats-changed',
  
  // أحداث النظام العامة
  SYSTEM_STATS_UPDATED = 'system-stats-updated',
  DATA_SYNC_COMPLETED = 'data-sync-completed',
  
  // أحداث الواجهة
  THEME_CHANGED = 'theme-changed',
  LANGUAGE_CHANGED = 'language-changed',

  // أحداث النسخ الاحتياطي
  BACKUP_COMPLETED = 'backup-completed',
  BACKUP_FAILED = 'backup-failed',
  BACKUP_RETENTION_APPLIED = 'backup-retention-applied',
  BACKUP_FAILURE_ALERT = 'backup-failure-alert'
}

// واجهة بيانات الحدث
export interface SystemEventData<T = unknown> {
  type: SystemEventType;
  payload?: T;
  timestamp: number;
  source?: string;
}

type AuditableEventMetadataFactory = (payload: unknown) => Record<string, unknown> | undefined;

interface AuditableEventConfig {
  action: string;
  category?: string;
  level?: AuditEventLevel;
  metadata?: AuditableEventMetadataFactory;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const createMetadataPicker = (keys: string[]): AuditableEventMetadataFactory => {
  return (payload) => {
    if (!isRecord(payload)) {
      return undefined;
    }

    const picked: Record<string, unknown> = {};

    for (const key of keys) {
      if (payload[key] !== undefined && payload[key] !== null) {
        picked[key] = payload[key];
      }
    }

    return Object.keys(picked).length > 0 ? picked : undefined;
  };
};

const AUDITED_EVENT_CONFIG: Partial<Record<SystemEventType, AuditableEventConfig>> = {
  [SystemEventType.TENDER_STATUS_CHANGED]: {
    action: 'tender-status-changed',
    category: 'tenders',
    metadata: createMetadataPicker(['tenderId', 'newStatus'])
  },
  [SystemEventType.TENDER_PRICING_COMPLETED]: {
    action: 'tender-pricing-completed',
    category: 'tenders',
    metadata: createMetadataPicker(['tenderId'])
  },
  [SystemEventType.PROJECT_STATUS_CHANGED]: {
    action: 'project-status-changed',
    category: 'projects',
    metadata: createMetadataPicker(['projectId', 'newStatus'])
  },
  [SystemEventType.EXPENSE_ADDED]: {
    action: 'expense-added',
    category: 'expenses',
    metadata: createMetadataPicker(['id', 'amount', 'category', 'date'])
  },
  [SystemEventType.DATA_SYNC_COMPLETED]: {
    action: 'data-sync-completed',
    category: 'sync',
    metadata: createMetadataPicker(['status', 'durationMs', 'changedEntities'])
  },
  [SystemEventType.BACKUP_COMPLETED]: {
    action: 'backup-completed',
    category: 'backup',
    metadata: createMetadataPicker(['dataset', 'tenderId', 'backupId', 'retained', 'pruned'])
  },
  [SystemEventType.BACKUP_FAILED]: {
    action: 'backup-failed',
    category: 'backup',
    level: 'warning',
    metadata: createMetadataPicker(['dataset', 'tenderId', 'backupId', 'error', 'consecutiveFailures'])
  },
  [SystemEventType.BACKUP_RETENTION_APPLIED]: {
    action: 'backup-retention-applied',
    category: 'backup',
    metadata: createMetadataPicker(['dataset', 'tenderId', 'pruned', 'retained'])
  },
  [SystemEventType.BACKUP_FAILURE_ALERT]: {
    action: 'backup-failure-alert',
    category: 'backup',
    level: 'error',
    metadata: createMetadataPicker(['dataset', 'tenderId', 'error', 'consecutiveFailures'])
  }
};

// واجهة المستمع للأحداث
export type EventListener<T = unknown> = (data: SystemEventData<T>) => void;

export interface TenderStatusChangedPayload {
  tenderId: string;
  newStatus: string;
}

export interface TenderPricingCompletedPayload {
  tenderId: string;
  pricingData: unknown;
}

export interface ProjectStatusChangedPayload {
  projectId: string;
  newStatus: string;
}

export type ExpensePayload = Record<string, unknown>;
export type SyncResultsPayload = Record<string, unknown>;

export interface BackupCompletedPayload {
  dataset: string;
  tenderId: string;
  backupId?: string;
  retained: number;
  pruned: number;
}

export interface BackupFailedPayload {
  dataset: string;
  tenderId: string;
  backupId?: string;
  error: string;
  consecutiveFailures: number;
}

export interface BackupRetentionPayload {
  dataset: string;
  tenderId: string;
  pruned: number;
  retained: number;
}

export interface BackupFailureAlertPayload {
  dataset: string;
  tenderId: string;
  error: string;
  consecutiveFailures: number;
}

// كلاس إدارة الأحداث
class EventManager {
  private listeners: Map<SystemEventType, Set<EventListener<unknown>>> = new Map<SystemEventType, Set<EventListener<unknown>>>();
  private eventHistory: SystemEventData<unknown>[] = [];
  private readonly maxHistorySize = 100;

  /**
   * إطلاق حدث في النظام
   * @param type - نوع الحدث
   * @param payload - البيانات المرفقة (اختياري)
   * @param source - مصدر الحدث (اختياري)
   */
  emit<T = unknown>(type: SystemEventType, payload?: T, source?: string): void {
    const eventData: SystemEventData<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source
    };

    this.addToHistory(eventData);

    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent<SystemEventData<T>>(type, { detail: eventData });
      window.dispatchEvent(customEvent);
    }

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as EventListener<T>)(eventData);
        } catch (error) {
          console.warn(`خطأ في تنفيذ مستمع الحدث ${type}:`, error);
        }
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔔 حدث النظام: ${type}`, eventData);
    }

    this.logAuditedEvent(eventData);
  }

  /**
   * الاستماع لحدث معين
   * @param type - نوع الحدث
   * @param listener - دالة المستمع
   * @returns دالة إلغاء الاستماع
   */
  on<T = unknown>(type: SystemEventType, listener: EventListener<T>): () => void {
    const existing = this.listeners.get(type) ?? new Set<EventListener<unknown>>();
    const storedListener = listener as EventListener<unknown>;
    existing.add(storedListener);
    this.listeners.set(type, existing);

    const domListener = (event: Event): void => {
      if (!(event instanceof CustomEvent)) {
        return;
      }
      listener(event.detail as SystemEventData<T>);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(type as string, domListener);
    }

    return () => {
      this.listeners.get(type)?.delete(storedListener);
      if (typeof window !== 'undefined') {
        window.removeEventListener(type as string, domListener);
      }
    };
  }

  /**
   * إلغاء جميع المستمعين لحدث معين
   * @param type - نوع الحدث
   */
  off(type: SystemEventType): void {
    this.listeners.delete(type);
  }

  /**
   * إلغاء جميع المستمعين
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * الحصول على تاريخ الأحداث
   * @param type - نوع الحدث (اختياري للفلترة)
   * @param limit - عدد الأحداث المطلوبة (افتراضي 10)
   * @returns مصفوفة الأحداث
   */
  getHistory(type?: SystemEventType, limit = 10): SystemEventData<unknown>[] {
    let history = this.eventHistory;

    if (type) {
      history = history.filter(event => event.type === type);
    }

    return history
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * إضافة حدث لتاريخ الأحداث
   * @param eventData - بيانات الحدث
   */
  private addToHistory(eventData: SystemEventData<unknown>): void {
    this.eventHistory.push(eventData);

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * إحصائيات الأحداث
   * @returns كائن الإحصائيات
   */
  getStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentActivity: SystemEventData<unknown>[];
  } {
    const eventsByType: Record<string, number> = {};

    this.eventHistory.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] ?? 0) + 1;
    });

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      recentActivity: this.getHistory(undefined, 5)
    };
  }

  private logAuditedEvent(eventData: SystemEventData<unknown>): void {
    const config = AUDITED_EVENT_CONFIG[eventData.type];
    if (!config) {
      return;
    }

    const metadata = config.metadata?.(eventData.payload);

    recordAuditEvent({
      category: config.category ?? 'events',
      action: config.action,
      key: `event:${eventData.type}`,
      level: config.level,
      actor: typeof eventData.source === 'string' && eventData.source.trim() !== '' ? eventData.source : 'system',
      origin: 'system-events',
      metadata
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ فشل تسجيل حدث التدقيق للحدث ${eventData.type}:`, error);
      }
    });
  }
}

// إنشاء مثيل واحد للمدير
export const eventManager = new EventManager();

// Hook React للاستماع للأحداث - يجب استخدامه في مكونات React
export const useSystemEvent = <T = unknown>(
  type: SystemEventType,
  listener: EventListener<T>
): (() => void) => eventManager.on(type, listener);

// دوال مساعدة للأحداث الشائعة
export const SystemEvents = {
  // أحداث المنافسات
  emitTendersUpdated: (source?: string) =>
    eventManager.emit(SystemEventType.TENDERS_UPDATED, undefined, source),

  emitTenderStatusChanged: (payload: TenderStatusChangedPayload, source?: string) =>
    eventManager.emit(SystemEventType.TENDER_STATUS_CHANGED, payload, source),

  emitTenderPricingCompleted: (payload: TenderPricingCompletedPayload, source?: string) =>
    eventManager.emit(SystemEventType.TENDER_PRICING_COMPLETED, payload, source),

  // أحداث المشاريع
  emitProjectsUpdated: (source?: string) =>
    eventManager.emit(SystemEventType.PROJECTS_UPDATED, undefined, source),

  emitProjectStatusChanged: (payload: ProjectStatusChangedPayload, source?: string) =>
    eventManager.emit(SystemEventType.PROJECT_STATUS_CHANGED, payload, source),

  // أحداث المصروفات
  emitExpensesUpdated: (source?: string) =>
    eventManager.emit(SystemEventType.EXPENSES_UPDATED, undefined, source),

  emitExpenseAdded: (expense: ExpensePayload, source?: string) =>
    eventManager.emit(SystemEventType.EXPENSE_ADDED, expense, source),

  // أحداث التطوير
  emitDevelopmentUpdated: (source?: string) =>
    eventManager.emit(SystemEventType.DEVELOPMENT_UPDATED, undefined, source),

  // أحداث النظام
  emitSystemStatsUpdated: (source?: string) =>
    eventManager.emit(SystemEventType.SYSTEM_STATS_UPDATED, undefined, source),

  emitDataSyncCompleted: (payload: SyncResultsPayload, source?: string) =>
    eventManager.emit(SystemEventType.DATA_SYNC_COMPLETED, payload, source),

  // أحداث النسخ الاحتياطي
  emitBackupCompleted: (payload: BackupCompletedPayload, source?: string) =>
    eventManager.emit(SystemEventType.BACKUP_COMPLETED, payload, source),
  emitBackupFailed: (payload: BackupFailedPayload, source?: string) =>
    eventManager.emit(SystemEventType.BACKUP_FAILED, payload, source),
  emitBackupRetentionApplied: (payload: BackupRetentionPayload, source?: string) =>
    eventManager.emit(SystemEventType.BACKUP_RETENTION_APPLIED, payload, source),
  emitBackupFailureAlert: (payload: BackupFailureAlertPayload, source?: string) =>
    eventManager.emit(SystemEventType.BACKUP_FAILURE_ALERT, payload, source)
};

// تصدير أساسي
export default eventManager;