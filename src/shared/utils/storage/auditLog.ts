/**
 * Audit Log Storage
 */

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: string
  userId?: string
  details?: Record<string, any>
}

export interface AuditEvent {
  id: string
  timestamp: string
  action: string
  userId?: string
  details?: Record<string, any>
}

export const auditLog = {
  log: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void => {
    console.log('Audit log:', entry)
  },

  getLogs: (): AuditLogEntry[] => {
    return []
  },

  clearLogs: (): void => {
    console.log('Clearing audit logs')
  }
}

export const recordAuditEvent = (action: string, details?: Record<string, any>): void => {
  auditLog.log({
    action,
    details,
    userId: 'system'
  })
}

export const subscribeToAuditLog = (callback: (events: AuditEvent[]) => void): (() => void) => {
  // Return unsubscribe function
  return () => {
    console.log('Unsubscribed from audit log')
  }
}

