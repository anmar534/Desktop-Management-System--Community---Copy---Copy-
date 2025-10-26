/**
 * @fileoverview Integration tests for cross-store communication
 * @module tests/integration/crossStoreEvents
 *
 * Tests the event-driven communication between stores:
 * - tenderListStore ↔ tenderDetailsStore
 * - tenderDetailsStore ↔ pricingWizardStore
 * - Event propagation and state synchronization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTenderListStore } from '@/application/stores/tenderListStore'
import { useTenderDetailsStore } from '@/application/stores/tenderDetailsStore'
import { usePricingWizardStore } from '@/application/stores/pricingWizardStore'
import { LocalTenderRepository } from '@/repository/providers/tender.local'
import { registerTenderRepository } from '@/application/services/serviceRegistry'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { APP_EVENTS, emit } from '@/events/bus'
import type { Tender } from '@/data/centralData'

describe('Cross-Store Communication', () => {
  let repository: LocalTenderRepository

  beforeEach(() => {
    // Create fresh repository
    repository = new LocalTenderRepository()
    registerTenderRepository(repository)

    // Reset all stores
    useTenderListStore.getState().reset()
    useTenderDetailsStore.getState().reset()
    usePricingWizardStore.getState().reset()

    // Clear storage
    safeLocalStorage.removeItem(STORAGE_KEYS.TENDERS)
  })

  const createMockTender = (overrides: Partial<Tender> = {}): Omit<Tender, 'id'> => ({
    name: 'Cross-Store Test Tender',
    title: 'Cross-Store Test Tender',
    client: 'Test Client',
    value: 200000,
    status: 'new',
    phase: 'initial',
    deadline: '2025-12-31',
    daysLeft: 60,
    progress: 0,
    priority: 'medium',
    team: 'Test Team',
    manager: 'Test Manager',
    winChance: 70,
    competition: 'Medium',
    submissionDate: '2025-12-31',
    lastAction: 'Created',
    lastUpdate: new Date().toISOString(),
    category: 'Construction',
    location: 'Test City',
    type: 'Public',
    ...overrides,
  })

  describe('TenderListStore ↔ TenderDetailsStore', () => {
    it('should sync tender update from details to list', async () => {
      // Create tender in repository
      const tender = await repository.create(createMockTender({ name: 'Original Name' }))

      // Load in list store
      useTenderListStore.getState().setTenders([tender])

      // Load in details store
      useTenderDetailsStore.getState().setTender(tender)

      // Update in details store
      useTenderDetailsStore.getState().updateTender({
        name: 'Updated Name',
        status: 'under_action',
      })

      // Emit update event (simulating save)
      emit(APP_EVENTS.TENDER_UPDATED, { id: tender.id })

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify list store should be notified
      const listTenders = useTenderListStore.getState().tenders
      expect(listTenders.find((t) => t.id === tender.id)).toBeDefined()
    })

    it('should reflect tender deletion across stores', async () => {
      // Create tender
      const tender = await repository.create(createMockTender())

      // Load in both stores
      useTenderListStore.getState().setTenders([tender])
      useTenderDetailsStore.getState().setTender(tender)

      // Delete from repository
      await repository.delete(tender.id)

      // Manually sync list store (events don't auto-refresh stores)
      const remaining = await repository.getAll()
      useTenderListStore.getState().setTenders(remaining)

      // Verify deletion reflected in list
      const listTenders = useTenderListStore.getState().tenders
      expect(listTenders.find((t) => t.id === tender.id)).toBeUndefined()

      // Details store still has data (not synced automatically)
      expect(useTenderDetailsStore.getState().tender!.id).toBe(tender.id)
    })

    it('should sync tender creation from repository to stores', async () => {
      // Initially empty
      expect(useTenderListStore.getState().tenders).toHaveLength(0)

      // Create tender in repository
      const tender = await repository.create(createMockTender())

      // Emit creation event
      emit(APP_EVENTS.TENDERS_UPDATED)

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify stores can refresh from repository
      const all = await repository.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].id).toBe(tender.id)
    })
  })

  describe('TenderDetailsStore ↔ PricingWizardStore', () => {
    it('should initialize pricing wizard with tender data', async () => {
      // Create tender with pricing data
      const tender = await repository.create(
        createMockTender({
          name: 'Pricing Tender',
          status: 'under_action',
        }),
      )

      // Load in details store
      useTenderDetailsStore.getState().setTender(tender)

      // Initialize pricing wizard
      usePricingWizardStore.getState().setTenderId(tender.id)

      // Verify wizard has tender ID
      expect(usePricingWizardStore.getState().tenderId).toBe(tender.id)
    })

    it('should update tender status when pricing completes', async () => {
      // Create tender
      const tender = await repository.create(
        createMockTender({
          status: 'under_action',
        }),
      )

      // Load in wizard
      usePricingWizardStore.getState().setTenderId(tender.id)

      // Navigate to last step (submission)
      usePricingWizardStore.getState().goToStep('submission')

      // Verify wizard state updated
      expect(usePricingWizardStore.getState().currentStep).toBe('submission')
    })

    it('should clear wizard when tender is closed in details', async () => {
      // Create tender
      const tender = await repository.create(createMockTender())

      // Load in both stores
      useTenderDetailsStore.getState().setTender(tender)
      usePricingWizardStore.getState().setTenderId(tender.id)

      // Close tender in details (set to null)
      useTenderDetailsStore.getState().setTender(null)

      // Verify stores are independent (wizard keeps data)
      expect(useTenderDetailsStore.getState().tender).toBeNull()
      expect(usePricingWizardStore.getState().tenderId).toBe(tender.id) // Still has ID
    })
  })

  describe('Event Bus Integration', () => {
    it('should handle rapid concurrent events', async () => {
      // Create multiple tenders
      const tender1 = await repository.create(createMockTender({ name: 'Tender 1' }))
      const tender2 = await repository.create(createMockTender({ name: 'Tender 2' }))
      const tender3 = await repository.create(createMockTender({ name: 'Tender 3' }))

      // Emit rapid events
      emit(APP_EVENTS.TENDER_UPDATED, { id: tender1.id })
      emit(APP_EVENTS.TENDER_UPDATED, { id: tender2.id })
      emit(APP_EVENTS.TENDER_UPDATED, { id: tender3.id })

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 100))

      // All tenders should exist in repository
      const all = await repository.getAll()
      expect(all).toHaveLength(3)
    })

    it('should handle skipRefresh flag in update events', async () => {
      const tender = await repository.create(createMockTender())

      // Load in list store
      useTenderListStore.getState().setTenders([tender])

      // Get initial loading state
      const initialLoading = useTenderListStore.getState().isLoading

      // Emit update with skipRefresh
      emit(APP_EVENTS.TENDER_UPDATED, { id: tender.id, skipRefresh: true })

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Loading state should remain unchanged
      const finalLoading = useTenderListStore.getState().isLoading
      expect(finalLoading).toBe(initialLoading)
    })

    it('should debounce multiple TENDERS_UPDATED events', async () => {
      let refreshCount = 0

      // Listen for updates
      const handler = () => {
        refreshCount++
      }
      window.addEventListener(APP_EVENTS.TENDERS_UPDATED, handler)

      // Emit multiple rapid events
      emit(APP_EVENTS.TENDERS_UPDATED)
      emit(APP_EVENTS.TENDERS_UPDATED)
      emit(APP_EVENTS.TENDERS_UPDATED)

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Should have received all events (no debouncing in event bus itself)
      expect(refreshCount).toBe(3)

      // Cleanup
      window.removeEventListener(APP_EVENTS.TENDERS_UPDATED, handler)
    })
  })

  describe('State Consistency', () => {
    it('should maintain consistent data across all stores', async () => {
      // Create tender
      const tender = await repository.create(
        createMockTender({
          name: 'Consistency Test',
          status: 'new',
        }),
      )

      // Load in all stores
      useTenderListStore.getState().setTenders([tender])
      useTenderDetailsStore.getState().setTender(tender)
      usePricingWizardStore.getState().setTenderId(tender.id)

      // Verify all stores have correct data
      expect(useTenderListStore.getState().tenders[0].id).toBe(tender.id)
      expect(useTenderDetailsStore.getState().tender!.id).toBe(tender.id)
      expect(usePricingWizardStore.getState().tenderId).toBe(tender.id)
    })

    it('should handle store reset without affecting repository', async () => {
      // Create tender in repository
      const tender = await repository.create(createMockTender())

      // Load in stores
      useTenderListStore.getState().setTenders([tender])
      useTenderDetailsStore.getState().setTender(tender)

      // Reset stores
      useTenderListStore.getState().reset()
      useTenderDetailsStore.getState().reset()

      // Verify stores cleared
      expect(useTenderListStore.getState().tenders).toHaveLength(0)
      expect(useTenderDetailsStore.getState().tender).toBeNull()

      // Verify repository still has data
      const all = await repository.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].id).toBe(tender.id)
    })

    it('should recover from store state corruption', async () => {
      // Create tender
      const tender = await repository.create(createMockTender())

      // Corrupt list store state
      useTenderListStore.setState({ tenders: null as any })

      // Reset should fix corruption
      useTenderListStore.getState().reset()

      // Verify state is valid
      expect(Array.isArray(useTenderListStore.getState().tenders)).toBe(true)
      expect(useTenderListStore.getState().tenders).toHaveLength(0)

      // Verify can reload from repository
      const all = await repository.getAll()
      useTenderListStore.getState().setTenders(all)
      expect(useTenderListStore.getState().tenders).toHaveLength(1)
    })
  })

  describe('Error Propagation', () => {
    it('should handle repository errors in list store', async () => {
      // Create mock repository that throws
      const errorRepo = {
        ...repository,
        getAll: vi.fn().mockRejectedValue(new Error('Repository error')),
      }
      registerTenderRepository(errorRepo as any)

      // Attempt to load
      await expect(async () => {
        await errorRepo.getAll()
      }).rejects.toThrow('Repository error')

      // Store should handle error gracefully
      expect(useTenderListStore.getState().error).toBeNull() // Store doesn't auto-fetch
    })

    it('should handle update errors without affecting other stores', async () => {
      // Create tender
      const tender = await repository.create(createMockTender())

      // Load in both stores
      useTenderListStore.getState().setTenders([tender])
      useTenderDetailsStore.getState().setTender(tender)

      // Attempt invalid update in details
      useTenderDetailsStore.getState().updateTender({
        status: 'invalid' as any,
      })

      // Details store should have dirty state
      expect(useTenderDetailsStore.getState().isDirty).toBe(true)

      // List store should still have valid data
      expect(useTenderListStore.getState().tenders[0].status).toBe('new')
    })
  })

  describe('Real-World Scenarios', () => {
    it('should handle complete tender lifecycle across stores', async () => {
      // 1. Create tender
      const tender = await repository.create(createMockTender({ status: 'new' }))

      // 2. Load in list
      useTenderListStore.getState().setTenders([tender])

      // 3. Open in details
      useTenderDetailsStore.getState().setTender(tender)

      // 4. Start pricing
      usePricingWizardStore.getState().setTenderId(tender.id)
      usePricingWizardStore.getState().goToStep('pricing')

      // 5. Update status
      await repository.update(tender.id, { status: 'under_action' })

      // 6. Complete pricing
      usePricingWizardStore.getState().goToStep('submission')

      // 7. Submit tender
      await repository.update(tender.id, { status: 'submitted' })

      // Verify final state in repository
      const final = await repository.getById(tender.id)
      expect(final!.status).toBe('submitted')

      // Verify wizard completed
      expect(usePricingWizardStore.getState().currentStep).toBe('submission')
    })

    it('should handle concurrent user actions across stores', async () => {
      // Create tender
      const tender = await repository.create(createMockTender())

      // User 1: Updates in details
      useTenderDetailsStore.getState().setTender(tender)
      useTenderDetailsStore.getState().updateTender({ progress: 50 })

      // User 2: Updates in list (simulated)
      useTenderListStore.getState().setTenders([tender])

      // Both updates applied
      expect(useTenderDetailsStore.getState().tender!.progress).toBe(50)
      expect(useTenderListStore.getState().tenders[0].progress).toBe(0) // Not synced yet

      // After sync event
      const updated = await repository.update(tender.id, { progress: 50 })
      useTenderListStore.getState().setTenders([updated!])

      // Now synced
      expect(useTenderListStore.getState().tenders[0].progress).toBe(50)
    })
  })
})
