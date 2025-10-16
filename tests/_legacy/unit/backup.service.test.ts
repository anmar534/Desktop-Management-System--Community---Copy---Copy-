/**
 * Backup Service Unit Tests
 * اختبارات وحدة خدمة النسخ الاحتياطي
 * Sprint 5.6: التحسين النهائي والتجهيز للإنتاج
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  createBackup,
  restoreBackup,
  deleteBackup,
  getBackups,
  startAutoBackup,
  stopAutoBackup,
} from '@/services/security/backup.service'

describe('Backup Service', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllTimers()
  })

  afterEach(() => {
    stopAutoBackup()
  })

  describe('Create Backup', () => {
    it('should create manual backup', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      expect(backup).toBeDefined()
      expect(backup.id).toBeDefined()
      expect(backup.userId).toBe('user-1')
      expect(backup.userName).toBe('John Doe')
      expect(backup.type).toBe('manual')
      expect(backup.timestamp).toBeInstanceOf(Date)
      expect(backup.version).toBe('1.0.0')
    })

    it('should create automatic backup', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'automatic')
      
      expect(backup.type).toBe('automatic')
    })

    it('should include description', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'manual', {
        description: 'Before major update',
      })
      
      expect(backup.description).toBe('Before major update')
    })

    it('should backup all default tables', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      expect(backup.tables).toContain('tenders')
      expect(backup.tables).toContain('projects')
      expect(backup.tables).toContain('financial')
      expect(backup.tables).toContain('users')
    })

    it('should backup specific tables', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'manual', {
        tables: ['tenders', 'projects'],
      })
      
      expect(backup.tables).toEqual(['tenders', 'projects'])
    })

    it('should calculate backup size', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      expect(backup.size).toBeGreaterThan(0)
    })

    it('should create encrypted backup', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'manual', {
        encrypted: true,
      })
      
      expect(backup.encrypted).toBe(true)
    })

    it('should create unencrypted backup by default', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      expect(backup.encrypted).toBe(false)
    })

    it('should add backup to list', async () => {
      await createBackup('user-1', 'John Doe', 'manual')
      
      const backups = getBackups()
      
      expect(backups).toHaveLength(1)
    })
  })

  describe('Get Backups', () => {
    it('should return empty array when no backups', () => {
      const backups = getBackups()
      
      expect(backups).toEqual([])
    })

    it('should return all backups', async () => {
      await createBackup('user-1', 'John Doe', 'manual')
      await createBackup('user-2', 'Jane Smith', 'automatic')
      
      const backups = getBackups()
      
      expect(backups).toHaveLength(2)
    })

    it('should return backups sorted by timestamp descending', async () => {
      const backup1 = await createBackup('user-1', 'John Doe', 'manual')
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const backup2 = await createBackup('user-2', 'Jane Smith', 'manual')
      
      const backups = getBackups()
      
      expect(backups[0].id).toBe(backup2.id)
      expect(backups[1].id).toBe(backup1.id)
    })
  })

  describe('Delete Backup', () => {
    it('should delete backup by ID', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      expect(getBackups()).toHaveLength(1)
      
      deleteBackup(backup.id)
      
      expect(getBackups()).toHaveLength(0)
    })

    it('should not throw when deleting non-existent backup', () => {
      expect(() => deleteBackup('non-existent')).not.toThrow()
    })

    it('should only delete specified backup', async () => {
      const backup1 = await createBackup('user-1', 'John Doe', 'manual')
      const backup2 = await createBackup('user-2', 'Jane Smith', 'manual')
      
      deleteBackup(backup1.id)
      
      const backups = getBackups()
      expect(backups).toHaveLength(1)
      expect(backups[0].id).toBe(backup2.id)
    })
  })

  describe('Restore Backup', () => {
    it('should restore backup', async () => {
      // Create some data
      localStorage.setItem('tenders', JSON.stringify([{ id: '1', name: 'Tender 1' }]))
      
      // Create backup
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      // Modify data
      localStorage.setItem('tenders', JSON.stringify([{ id: '2', name: 'Tender 2' }]))
      
      // Restore backup
      await restoreBackup(backup.id)
      
      // Verify data is restored
      const restored = JSON.parse(localStorage.getItem('tenders') || '[]')
      expect(restored).toHaveLength(1)
      expect(restored[0].id).toBe('1')
    })

    it('should restore specific tables only', async () => {
      // Create data in multiple tables
      localStorage.setItem('tenders', JSON.stringify([{ id: '1' }]))
      localStorage.setItem('projects', JSON.stringify([{ id: '1' }]))
      
      // Create backup
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      // Modify both tables
      localStorage.setItem('tenders', JSON.stringify([{ id: '2' }]))
      localStorage.setItem('projects', JSON.stringify([{ id: '2' }]))
      
      // Restore only tenders
      await restoreBackup(backup.id, { tables: ['tenders'] })
      
      // Verify only tenders is restored
      const tenders = JSON.parse(localStorage.getItem('tenders') || '[]')
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      
      expect(tenders[0].id).toBe('1')
      expect(projects[0].id).toBe('2') // Not restored
    })

    it('should throw error for non-existent backup', async () => {
      await expect(restoreBackup('non-existent')).rejects.toThrow()
    })
  })

  describe('Automatic Backup', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should start automatic backup', async () => {
      await startAutoBackup('user-1', 'John Doe', 24)
      
      expect(getBackups()).toHaveLength(0)
      
      // Fast-forward 24 hours
      vi.advanceTimersByTime(24 * 60 * 60 * 1000)
      
      // Wait for async operations
      await vi.runAllTimersAsync()
      
      expect(getBackups().length).toBeGreaterThan(0)
    })

    it('should create backups at specified interval', async () => {
      await startAutoBackup('user-1', 'John Doe', 1) // 1 hour
      
      // Fast-forward 3 hours
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(60 * 60 * 1000)
        await vi.runAllTimersAsync()
      }
      
      expect(getBackups().length).toBeGreaterThanOrEqual(3)
    })

    it('should stop automatic backup', async () => {
      await startAutoBackup('user-1', 'John Doe', 1)
      
      stopAutoBackup()
      
      const initialCount = getBackups().length
      
      // Fast-forward time
      vi.advanceTimersByTime(2 * 60 * 60 * 1000)
      await vi.runAllTimersAsync()
      
      // Should not create new backups
      expect(getBackups().length).toBe(initialCount)
    })

    it('should use custom options for automatic backups', async () => {
      await startAutoBackup('user-1', 'John Doe', 1, {
        encrypted: true,
        tables: ['tenders'],
      })
      
      vi.advanceTimersByTime(60 * 60 * 1000)
      await vi.runAllTimersAsync()
      
      const backups = getBackups()
      expect(backups.length).toBeGreaterThan(0)
      expect(backups[0].encrypted).toBe(true)
      expect(backups[0].tables).toEqual(['tenders'])
    })
  })

  describe('Backup Metadata', () => {
    it('should include all metadata fields', async () => {
      const backup = await createBackup('user-1', 'John Doe', 'manual', {
        description: 'Test backup',
        encrypted: true,
        tables: ['tenders', 'projects'],
      })
      
      expect(backup.id).toBeDefined()
      expect(backup.timestamp).toBeInstanceOf(Date)
      expect(backup.version).toBe('1.0.0')
      expect(backup.userId).toBe('user-1')
      expect(backup.userName).toBe('John Doe')
      expect(backup.type).toBe('manual')
      expect(backup.size).toBeGreaterThan(0)
      expect(backup.encrypted).toBe(true)
      expect(backup.description).toBe('Test backup')
      expect(backup.tables).toEqual(['tenders', 'projects'])
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty localStorage', async () => {
      localStorage.clear()
      
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      expect(backup).toBeDefined()
      expect(backup.size).toBeGreaterThan(0)
    })

    it('should handle large data', async () => {
      const largeData = Array(1000).fill(null).map((_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        data: 'x'.repeat(100),
      }))
      
      localStorage.setItem('tenders', JSON.stringify(largeData))
      
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      expect(backup.size).toBeGreaterThan(100000)
    })

    it('should handle special characters in data', async () => {
      const data = [
        { id: '1', name: 'مناقصة جديدة 🎉' },
        { id: '2', name: 'Special chars: !@#$%^&*()' },
      ]
      
      localStorage.setItem('tenders', JSON.stringify(data))
      
      const backup = await createBackup('user-1', 'John Doe', 'manual')
      
      await restoreBackup(backup.id)
      
      const restored = JSON.parse(localStorage.getItem('tenders') || '[]')
      expect(restored).toEqual(data)
    })
  })
})

