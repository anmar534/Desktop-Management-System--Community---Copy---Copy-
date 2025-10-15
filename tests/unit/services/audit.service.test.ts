/**
 * Audit Service Unit Tests
 * اختبارات وحدة خدمة المراجعة
 * Sprint 5.6: التحسين النهائي والتجهيز للإنتاج
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  logAudit,
  getAuditLogs,
  clearAuditLogs,
  exportAuditLogs,
} from '@/services/security/audit.service'

describe('Audit Service', () => {
  beforeEach(() => {
    clearAuditLogs()
  })

  describe('Log Audit', () => {
    it('should create audit log entry', () => {
      const log = logAudit('user-1', 'John Doe', 'user.login')
      
      expect(log).toBeDefined()
      expect(log.id).toBeDefined()
      expect(log.userId).toBe('user-1')
      expect(log.userName).toBe('John Doe')
      expect(log.action).toBe('user.login')
      expect(log.timestamp).toBeInstanceOf(Date)
    })

    it('should auto-determine severity for login', () => {
      const log = logAudit('user-1', 'John Doe', 'user.login')
      
      expect(log.severity).toBe('low')
    })

    it('should auto-determine severity for failed login', () => {
      const log = logAudit('user-1', 'John Doe', 'user.login.failed')
      
      expect(log.severity).toBe('medium')
    })

    it('should auto-determine severity for deletion', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.delete')
      
      expect(log.severity).toBe('high')
    })

    it('should auto-determine severity for security events', () => {
      const log = logAudit('user-1', 'John Doe', 'security.backup.create')
      
      expect(log.severity).toBe('high')
    })

    it('should allow manual severity override', () => {
      const log = logAudit('user-1', 'John Doe', 'user.login', {
        severity: 'critical',
      })
      
      expect(log.severity).toBe('critical')
    })

    it('should include description', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.create', {
        description: 'Created new tender',
        descriptionAr: 'تم إنشاء مناقصة جديدة',
      })
      
      expect(log.description).toBe('Created new tender')
      expect(log.descriptionAr).toBe('تم إنشاء مناقصة جديدة')
    })

    it('should include resource information', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.view', {
        resourceType: 'tender',
        resourceId: 'tender-123',
      })
      
      expect(log.resourceType).toBe('tender')
      expect(log.resourceId).toBe('tender-123')
    })

    it('should include IP address and user agent', () => {
      const log = logAudit('user-1', 'John Doe', 'user.login', {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      })
      
      expect(log.ipAddress).toBe('192.168.1.1')
      expect(log.userAgent).toBe('Mozilla/5.0')
    })

    it('should track changes', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.update', {
        changes: {
          before: { status: 'draft' },
          after: { status: 'published' },
        },
      })
      
      expect(log.changes).toBeDefined()
      expect(log.changes?.before).toEqual({ status: 'draft' })
      expect(log.changes?.after).toEqual({ status: 'published' })
    })

    it('should include metadata', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.create', {
        metadata: {
          tenderName: 'New Construction Project',
          budget: 1000000,
        },
      })
      
      expect(log.metadata).toBeDefined()
      expect(log.metadata?.tenderName).toBe('New Construction Project')
      expect(log.metadata?.budget).toBe(1000000)
    })
  })

  describe('Get Audit Logs', () => {
    beforeEach(() => {
      logAudit('user-1', 'John Doe', 'user.login')
      logAudit('user-2', 'Jane Smith', 'tender.create')
      logAudit('user-1', 'John Doe', 'project.view')
      logAudit('user-3', 'Bob Johnson', 'user.logout')
    })

    it('should return all logs without filter', () => {
      const logs = getAuditLogs()
      
      expect(logs).toHaveLength(4)
    })

    it('should filter by user ID', () => {
      const logs = getAuditLogs({ userId: 'user-1' })
      
      expect(logs).toHaveLength(2)
      expect(logs.every(log => log.userId === 'user-1')).toBe(true)
    })

    it('should filter by action', () => {
      const logs = getAuditLogs({ action: 'tender.create' })
      
      expect(logs).toHaveLength(1)
      expect(logs[0].action).toBe('tender.create')
    })

    it('should filter by severity', () => {
      logAudit('user-1', 'John Doe', 'tender.delete') // high severity
      
      const logs = getAuditLogs({ severity: 'high' })
      
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.every(log => log.severity === 'high')).toBe(true)
    })

    it('should filter by resource type', () => {
      logAudit('user-1', 'John Doe', 'tender.view', {
        resourceType: 'tender',
        resourceId: 'tender-1',
      })
      
      const logs = getAuditLogs({ resourceType: 'tender' })
      
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.every(log => log.resourceType === 'tender')).toBe(true)
    })

    it('should filter by date range', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
      const logs = getAuditLogs({
        startDate: yesterday,
        endDate: tomorrow,
      })
      
      expect(logs).toHaveLength(4)
    })

    it('should search in description', () => {
      logAudit('user-1', 'John Doe', 'tender.create', {
        description: 'Created tender for construction project',
      })
      
      const logs = getAuditLogs({ search: 'construction' })
      
      expect(logs.length).toBeGreaterThan(0)
    })

    it('should search in user name', () => {
      const logs = getAuditLogs({ search: 'Jane' })
      
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some(log => log.userName.includes('Jane'))).toBe(true)
    })

    it('should combine multiple filters', () => {
      const logs = getAuditLogs({
        userId: 'user-1',
        action: 'user.login',
      })
      
      expect(logs).toHaveLength(1)
      expect(logs[0].userId).toBe('user-1')
      expect(logs[0].action).toBe('user.login')
    })
  })

  describe('Export Audit Logs', () => {
    beforeEach(() => {
      logAudit('user-1', 'John Doe', 'user.login')
      logAudit('user-2', 'Jane Smith', 'tender.create')
    })

    it('should export logs as JSON string', () => {
      const exported = exportAuditLogs()
      
      expect(typeof exported).toBe('string')
      
      const parsed = JSON.parse(exported)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(2)
    })

    it('should export filtered logs', () => {
      const exported = exportAuditLogs({ userId: 'user-1' })
      
      const parsed = JSON.parse(exported)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].userId).toBe('user-1')
    })

    it('should preserve all log properties', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.create', {
        description: 'Test',
        resourceType: 'tender',
        resourceId: 'tender-1',
        metadata: { test: true },
      })
      
      const exported = exportAuditLogs()
      const parsed = JSON.parse(exported)
      
      const exportedLog = parsed.find((l: any) => l.id === log.id)
      expect(exportedLog).toBeDefined()
      expect(exportedLog.description).toBe('Test')
      expect(exportedLog.resourceType).toBe('tender')
      expect(exportedLog.metadata.test).toBe(true)
    })
  })

  describe('Clear Audit Logs', () => {
    it('should clear all logs', () => {
      logAudit('user-1', 'John Doe', 'user.login')
      logAudit('user-2', 'Jane Smith', 'tender.create')
      
      expect(getAuditLogs()).toHaveLength(2)
      
      clearAuditLogs()
      
      expect(getAuditLogs()).toHaveLength(0)
    })
  })

  describe('Log Limit', () => {
    it('should respect maximum log limit', () => {
      // Create more than max logs (10,000)
      for (let i = 0; i < 10005; i++) {
        logAudit(`user-${i}`, `User ${i}`, 'user.login')
      }
      
      const logs = getAuditLogs()
      
      // Should keep only the most recent 10,000
      expect(logs.length).toBeLessThanOrEqual(10000)
    })
  })

  describe('Severity Determination', () => {
    it('should assign low severity to view actions', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.view')
      expect(log.severity).toBe('low')
    })

    it('should assign low severity to create actions', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.create')
      expect(log.severity).toBe('low')
    })

    it('should assign low severity to update actions', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.update')
      expect(log.severity).toBe('low')
    })

    it('should assign medium severity to failed actions', () => {
      const log = logAudit('user-1', 'John Doe', 'user.login.failed')
      expect(log.severity).toBe('medium')
    })

    it('should assign high severity to delete actions', () => {
      const log = logAudit('user-1', 'John Doe', 'tender.delete')
      expect(log.severity).toBe('high')
    })

    it('should assign high severity to security actions', () => {
      const log = logAudit('user-1', 'John Doe', 'security.backup.create')
      expect(log.severity).toBe('high')
    })

    it('should assign critical severity to settings changes', () => {
      const log = logAudit('user-1', 'John Doe', 'settings.system.update')
      expect(log.severity).toBe('critical')
    })
  })
})

