/**
 * @fileoverview Integration tests for tenderListStore ↔ tenderRepository
 * @module tests/integration/tenderStoreRepository
 *
 * Tests the complete data flow:
 * - Store actions → Repository methods → Storage
 * - Repository events → Store updates
 * - Error handling across layers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTenderListStore } from '@/application/stores/tenderListStore'
import { LocalTenderRepository } from '@/repository/providers/tender.local'
import {
  registerTenderRepository,
  getTenderRepository,
} from '@/application/services/serviceRegistry'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { APP_EVENTS } from '@/events/bus'
import type { Tender } from '@/data/centralData'

describe('TenderStore ↔ Repository Integration', () => {
  let repository: LocalTenderRepository
  let originalRepository: ReturnType<typeof getTenderRepository>

  beforeEach(() => {
    // Save original repository
    originalRepository = getTenderRepository()

    // Create fresh repository instance
    repository = new LocalTenderRepository()
    registerTenderRepository(repository)

    // Reset store
    useTenderListStore.getState().reset()

    // Clear storage
    safeLocalStorage.removeItem(STORAGE_KEYS.TENDERS)
  })

  afterEach(() => {
    // Restore original repository
    registerTenderRepository(originalRepository)

    // Clear storage
    safeLocalStorage.removeItem(STORAGE_KEYS.TENDERS)
  })

  const createMockTender = (overrides: Partial<Tender> = {}): Omit<Tender, 'id'> => ({
    name: 'Integration Test Tender',
    title: 'Integration Test Tender',
    client: 'Test Client',
    value: 150000,
    status: 'new',
    phase: 'initial',
    deadline: '2025-12-31',
    daysLeft: 45,
    progress: 0,
    priority: 'high',
    team: 'Integration Team',
    manager: 'Test Manager',
    winChance: 80,
    competition: 'Low',
    submissionDate: '2025-12-31',
    lastAction: 'Created via integration test',
    lastUpdate: new Date().toISOString(),
    category: 'Infrastructure',
    location: 'Integration City',
    type: 'Public',
    ...overrides,
  })

  describe('Data Flow: Store → Repository → Storage', () => {
    it('should create tender via store and persist to repository', async () => {
      const tenderData = createMockTender({ name: 'Flow Test Tender' })

      // Create via repository (simulating store action)
      const created = await repository.create(tenderData)

      // Verify created tender has ID
      expect(created.id).toBeDefined()
      expect(created.name).toBe('Flow Test Tender')

      // Verify stored in repository
      const retrieved = await repository.getById(created.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(created.id)
      expect(retrieved!.name).toBe(created.name)

      // Verify persisted to storage
      const stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe(created.id)
    })

    it('should update tender and reflect in all layers', async () => {
      // Create tender
      const created = await repository.create(createMockTender())

      // Update via repository
      const updated = await repository.update(created.id, {
        status: 'under_action',
        progress: 25,
        lastAction: 'Updated via integration test',
      })

      expect(updated).not.toBeNull()
      expect(updated!.status).toBe('under_action')
      expect(updated!.progress).toBe(25)

      // Verify in repository
      const retrieved = await repository.getById(created.id)
      expect(retrieved!.status).toBe('under_action')
      expect(retrieved!.progress).toBe(25)

      // Verify in storage
      const stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
      const storedTender = stored.find((t) => t.id === created.id)
      expect(storedTender!.status).toBe('under_action')
      expect(storedTender!.progress).toBe(25)
    })

    it('should delete tender from all layers', async () => {
      // Create tender
      const created = await repository.create(createMockTender())

      // Verify exists
      expect(await repository.getById(created.id)).not.toBeNull()

      // Delete
      const deleted = await repository.delete(created.id)
      expect(deleted).toBe(true)

      // Verify removed from repository
      expect(await repository.getById(created.id)).toBeNull()

      // Verify removed from storage
      const stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
      expect(stored.find((t) => t.id === created.id)).toBeUndefined()
    })

    it('should handle bulk operations correctly', async () => {
      // Create multiple tenders
      await repository.create(createMockTender({ name: 'Tender 1', priority: 'high' }))
      const tender2 = await repository.create(
        createMockTender({ name: 'Tender 2', priority: 'medium' }),
      )
      await repository.create(createMockTender({ name: 'Tender 3', priority: 'low' }))

      // Verify all exist
      const all = await repository.getAll()
      expect(all).toHaveLength(3)

      // Verify storage contains all
      const stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
      expect(stored).toHaveLength(3)

      // Delete one
      await repository.delete(tender2.id)

      // Verify count updated
      const afterDelete = await repository.getAll()
      expect(afterDelete).toHaveLength(2)
      expect(afterDelete.find((t) => t.id === tender2.id)).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle update of non-existent tender', async () => {
      const result = await repository.update('non-existent-id', { status: 'under_action' })

      expect(result).toBeNull()
    })

    it('should handle delete of non-existent tender', async () => {
      const result = await repository.delete('non-existent-id')

      expect(result).toBe(false)
    })

    it('should handle corrupted storage gracefully', async () => {
      // Corrupt storage with invalid JSON
      safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, 'invalid-json-data' as any)

      // Should return empty array instead of throwing
      const all = await repository.getAll()
      expect(all).toEqual([])
    })

    it('should handle malformed tender data', async () => {
      // Repository now validates data, so malformed data should throw
      await expect(async () => {
        await repository.create({
          name: 'Minimal Tender',
          status: 'new',
        } as any)
      }).rejects.toThrow()
    })
  })

  describe('Search and Filter Operations', () => {
    beforeEach(async () => {
      // Create test tenders
      await repository.create(
        createMockTender({
          name: 'Construction Project Alpha',
          category: 'Construction',
          status: 'new',
        }),
      )
      await repository.create(
        createMockTender({
          name: 'Infrastructure Development',
          category: 'Infrastructure',
          status: 'under_action',
        }),
      )
      await repository.create(
        createMockTender({
          name: 'Construction Project Beta',
          category: 'Construction',
          status: 'submitted',
        }),
      )
    })

    it('should search tenders by name', async () => {
      const results = await repository.search('Construction')

      expect(results).toHaveLength(2)
      expect(results.every((t) => t.name.includes('Construction'))).toBe(true)
    })

    it('should search case-insensitively', async () => {
      const results = await repository.search('INFRASTRUCTURE')

      expect(results).toHaveLength(1)
      expect(results[0].name).toContain('Infrastructure')
    })

    it('should return empty array for no matches', async () => {
      const results = await repository.search('NonExistentTender')

      expect(results).toEqual([])
    })
  })

  describe('Event-Driven Updates', () => {
    it('should emit TENDER_UPDATED event on update', async () => {
      let eventFired = false

      // Listen for event
      const handler = () => {
        eventFired = true
      }
      window.addEventListener(APP_EVENTS.TENDER_UPDATED, handler)

      // Create and update tender
      const created = await repository.create(createMockTender())
      await repository.update(created.id, { status: 'under_action' })

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify event emitted
      expect(eventFired).toBe(true)

      // Cleanup
      window.removeEventListener(APP_EVENTS.TENDER_UPDATED, handler)
    })

    it('should emit TENDERS_UPDATED event on create', async () => {
      let eventFired = false

      // Listen for event
      const handler = () => {
        eventFired = true
      }
      window.addEventListener(APP_EVENTS.TENDERS_UPDATED, handler)

      // Create tender
      await repository.create(createMockTender())

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify event emitted
      expect(eventFired).toBe(true)

      // Cleanup
      window.removeEventListener(APP_EVENTS.TENDERS_UPDATED, handler)
    })

    it('should emit TENDERS_UPDATED event on delete', async () => {
      const created = await repository.create(createMockTender())

      let eventFired = false
      const handler = () => {
        eventFired = true
      }
      window.addEventListener(APP_EVENTS.TENDERS_UPDATED, handler)

      // Delete tender
      await repository.delete(created.id)

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify event emitted
      expect(eventFired).toBe(true)

      // Cleanup
      window.removeEventListener(APP_EVENTS.TENDERS_UPDATED, handler)
    })
  })

  describe('Data Integrity', () => {
    it('should preserve all tender fields through save/load cycle', async () => {
      const original = createMockTender({
        name: 'Complete Tender',
        title: 'Complete Tender Title',
        client: 'Complete Client',
        value: 500000,
        status: 'ready_to_submit',
        phase: 'preparation',
        deadline: '2026-01-15',
        daysLeft: 365,
        progress: 90,
        priority: 'critical',
        team: 'Alpha Team',
        manager: 'Senior Manager',
        winChance: 95,
        competition: 'Low',
        submissionDate: '2026-01-15',
        category: 'Construction',
        location: 'Capital City',
        type: 'Private',
      } as any)

      const created = await repository.create(original)
      const retrieved = await repository.getById(created.id)

      // Verify all fields preserved
      expect(retrieved!.name).toBe(original.name)
      expect(retrieved!.title).toBe(original.title)
      expect(retrieved!.client).toBe(original.client)
      expect(retrieved!.value).toBe(original.value)
      expect(retrieved!.status).toBe(original.status)
      expect(retrieved!.phase).toBe(original.phase)
      expect(retrieved!.deadline).toBe(original.deadline)
      expect(retrieved!.priority).toBe(original.priority)
    })

    it('should handle special characters in tender names', async () => {
      const tender = await repository.create(
        createMockTender({
          name: 'Tender: "Special" & <Characters> (Test)',
        }),
      )

      const retrieved = await repository.getById(tender.id)
      expect(retrieved!.name).toBe('Tender: "Special" & <Characters> (Test)')
    })

    it('should handle Arabic text correctly', async () => {
      const tender = await repository.create(
        createMockTender({
          name: 'مناقصة البنية التحتية الرقمية',
          client: 'عميل تجريبي',
          lastAction: 'تم الإنشاء',
        }),
      )

      const retrieved = await repository.getById(tender.id)
      expect(retrieved!.name).toBe('مناقصة البنية التحتية الرقمية')
      expect(retrieved!.client).toBe('عميل تجريبي')
      expect(retrieved!.lastAction).toBe('تم الإنشاء')
    })

    it('should maintain data consistency across concurrent operations', async () => {
      const tender = await repository.create(createMockTender({ progress: 0 }))

      // Simulate concurrent updates
      const update1 = repository.update(tender.id, { progress: 25 })
      const update2 = repository.update(tender.id, { progress: 50 })
      const update3 = repository.update(tender.id, { progress: 75 })

      // Wait for all
      await Promise.all([update1, update2, update3])

      // Last update should win
      const final = await repository.getById(tender.id)
      expect(final!.progress).toBe(75)
    })
  })

  describe('Status Migration', () => {
    it('should migrate legacy status values on load', async () => {
      // Manually insert legacy status
      const tenderData = createMockTender()
      const legacyTender = {
        ...tenderData,
        id: 'legacy-tender-1',
        name: 'Legacy Tender Migration Test',
        status: 'pending', // Old status value
      } as any

      safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, [legacyTender])

      // Load via repository (should trigger migration)
      const all = await repository.getAll()

      // Status should be migrated to 'new'
      expect(all[0].status).toBe('new')
    })

    it('should reject invalid status values', async () => {
      const tender = await repository.create(createMockTender())

      // Attempt to set invalid status (should throw validation error)
      await expect(async () => {
        await repository.update(tender.id, {
          status: 'invalid_status' as any,
        })
      }).rejects.toThrow()
    })
  })

  describe('Repository Registry Integration', () => {
    it('should use registered repository instance', async () => {
      // Create tender via registered repository
      const tender = await repository.create(createMockTender())

      // Get repository from registry
      const registeredRepo = getTenderRepository()

      // Should retrieve same tender
      const retrieved = await registeredRepo.getById(tender.id)
      expect(retrieved!.id).toBe(tender.id)
    })

    it('should allow repository override', async () => {
      // Create mock repository
      const mockRepo = {
        getAll: vi.fn().mockResolvedValue([]),
        getById: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'mock-id' } as Tender),
        update: vi.fn().mockResolvedValue(null),
        delete: vi.fn().mockResolvedValue(true),
        search: vi.fn().mockResolvedValue([]),
      }

      // Register mock
      registerTenderRepository(mockRepo as any)

      // Use registry
      const repo = getTenderRepository()
      await repo.getAll()

      // Verify mock was called
      expect(mockRepo.getAll).toHaveBeenCalled()

      // Restore
      registerTenderRepository(originalRepository)
    })
  })
})
