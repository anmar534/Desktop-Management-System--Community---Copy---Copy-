/**
 * Audit Service - خدمة المراجعة
 * Sprint 5.5: الأمان والحماية المتقدمة
 * 
 * Activity logging and audit trail system
 * نظام تسجيل الأنشطة وسجل المراجعة
 */

// ============================================================================
// Types
// ============================================================================

export type AuditAction =
  // Authentication / المصادقة
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  | 'auth.password_changed'
  | 'auth.password_reset'
  
  // Users / المستخدمين
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.role_changed'
  | 'user.disabled'
  | 'user.enabled'
  
  // Tenders / المنافسات
  | 'tender.created'
  | 'tender.updated'
  | 'tender.deleted'
  | 'tender.approved'
  | 'tender.rejected'
  | 'tender.exported'
  
  // Projects / المشاريع
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.approved'
  | 'project.status_changed'
  
  // Financial / المالية
  | 'financial.invoice_created'
  | 'financial.invoice_updated'
  | 'financial.invoice_deleted'
  | 'financial.payment_created'
  | 'financial.payment_approved'
  | 'financial.report_generated'
  
  // Settings / الإعدادات
  | 'settings.updated'
  | 'settings.system_config_changed'
  
  // Security / الأمان
  | 'security.permission_changed'
  | 'security.suspicious_activity'
  | 'security.access_denied'
  | 'security.data_exported'
  | 'security.backup_created'
  | 'security.backup_restored'

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AuditLog {
  /** Unique identifier / معرف فريد */
  id: string
  
  /** Timestamp / الوقت */
  timestamp: Date
  
  /** User ID / معرف المستخدم */
  userId: string
  
  /** User name / اسم المستخدم */
  userName: string
  
  /** Action performed / الإجراء المنفذ */
  action: AuditAction
  
  /** Resource type / نوع المورد */
  resourceType?: string
  
  /** Resource ID / معرف المورد */
  resourceId?: string
  
  /** Severity level / مستوى الخطورة */
  severity: AuditSeverity
  
  /** Description / الوصف */
  description: string
  
  /** Arabic description / الوصف بالعربية */
  descriptionAr?: string
  
  /** IP address / عنوان IP */
  ipAddress?: string
  
  /** User agent / وكيل المستخدم */
  userAgent?: string
  
  /** Additional metadata / بيانات إضافية */
  metadata?: Record<string, any>
  
  /** Changes made / التغييرات */
  changes?: {
    before?: any
    after?: any
  }
}

export interface AuditFilter {
  /** Start date / تاريخ البداية */
  startDate?: Date
  
  /** End date / تاريخ النهاية */
  endDate?: Date
  
  /** User ID / معرف المستخدم */
  userId?: string
  
  /** Actions / الإجراءات */
  actions?: AuditAction[]
  
  /** Severity levels / مستويات الخطورة */
  severities?: AuditSeverity[]
  
  /** Resource type / نوع المورد */
  resourceType?: string
  
  /** Resource ID / معرف المورد */
  resourceId?: string
  
  /** Search query / استعلام البحث */
  search?: string
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_KEY = 'audit_logs'
const MAX_LOGS = 10000 // Maximum number of logs to keep in memory

/**
 * Get all audit logs from storage
 * الحصول على جميع سجلات المراجعة من التخزين
 */
function getLogsFromStorage(): AuditLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const logs = JSON.parse(stored)
    // Convert timestamp strings back to Date objects
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }))
  } catch (error) {
    console.error('Failed to load audit logs:', error)
    return []
  }
}

/**
 * Save audit logs to storage
 * حفظ سجلات المراجعة في التخزين
 */
function saveLogsToStorage(logs: AuditLog[]): void {
  try {
    // Keep only the most recent logs
    const logsToSave = logs.slice(-MAX_LOGS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logsToSave))
  } catch (error) {
    console.error('Failed to save audit logs:', error)
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Log an audit event
 * تسجيل حدث مراجعة
 */
export function logAudit(
  userId: string,
  userName: string,
  action: AuditAction,
  options: {
    resourceType?: string
    resourceId?: string
    severity?: AuditSeverity
    description: string
    descriptionAr?: string
    metadata?: Record<string, any>
    changes?: { before?: any; after?: any }
  }
): AuditLog {
  const log: AuditLog = {
    id: generateId(),
    timestamp: new Date(),
    userId,
    userName,
    action,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    severity: options.severity || determineSeverity(action),
    description: options.description,
    descriptionAr: options.descriptionAr,
    ipAddress: getClientIP(),
    userAgent: getUserAgent(),
    metadata: options.metadata,
    changes: options.changes,
  }

  // Save to storage
  const logs = getLogsFromStorage()
  logs.push(log)
  saveLogsToStorage(logs)

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Audit]', log)
  }

  return log
}

/**
 * Get audit logs with optional filtering
 * الحصول على سجلات المراجعة مع تصفية اختيارية
 */
export function getAuditLogs(filter?: AuditFilter): AuditLog[] {
  let logs = getLogsFromStorage()

  if (!filter) return logs

  // Filter by date range
  if (filter.startDate) {
    logs = logs.filter(log => log.timestamp >= filter.startDate!)
  }
  if (filter.endDate) {
    logs = logs.filter(log => log.timestamp <= filter.endDate!)
  }

  // Filter by user
  if (filter.userId) {
    logs = logs.filter(log => log.userId === filter.userId)
  }

  // Filter by actions
  if (filter.actions && filter.actions.length > 0) {
    logs = logs.filter(log => filter.actions!.includes(log.action))
  }

  // Filter by severity
  if (filter.severities && filter.severities.length > 0) {
    logs = logs.filter(log => filter.severities!.includes(log.severity))
  }

  // Filter by resource
  if (filter.resourceType) {
    logs = logs.filter(log => log.resourceType === filter.resourceType)
  }
  if (filter.resourceId) {
    logs = logs.filter(log => log.resourceId === filter.resourceId)
  }

  // Filter by search query
  if (filter.search) {
    const query = filter.search.toLowerCase()
    logs = logs.filter(log =>
      log.description.toLowerCase().includes(query) ||
      log.descriptionAr?.toLowerCase().includes(query) ||
      log.userName.toLowerCase().includes(query)
    )
  }

  return logs
}

/**
 * Clear all audit logs
 * مسح جميع سجلات المراجعة
 */
export function clearAuditLogs(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Export audit logs to JSON
 * تصدير سجلات المراجعة إلى JSON
 */
export function exportAuditLogs(filter?: AuditFilter): string {
  const logs = getAuditLogs(filter)
  return JSON.stringify(logs, null, 2)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique ID
 * توليد معرف فريد
 */
function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Determine severity based on action
 * تحديد مستوى الخطورة بناءً على الإجراء
 */
function determineSeverity(action: AuditAction): AuditSeverity {
  if (action.includes('deleted') || action.includes('security.')) {
    return 'high'
  }
  if (action.includes('failed') || action.includes('denied')) {
    return 'medium'
  }
  if (action.includes('created') || action.includes('updated')) {
    return 'low'
  }
  return 'low'
}

/**
 * Get client IP address (mock implementation)
 * الحصول على عنوان IP للعميل
 */
function getClientIP(): string {
  // In a real application, this would be obtained from the server
  return 'Unknown'
}

/**
 * Get user agent
 * الحصول على وكيل المستخدم
 */
function getUserAgent(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
}

// ============================================================================
// Export Service
// ============================================================================

export const AuditService = {
  logAudit,
  getAuditLogs,
  clearAuditLogs,
  exportAuditLogs,
}

export default AuditService

