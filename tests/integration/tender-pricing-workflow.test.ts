/**
 * Integration Tests for Tender Pricing Workflow
 *
 * Tests the complete workflow after Draft System removal
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTenderPricingStore } from '@/stores/tenderPricingStore'
import { getBOQRepository, getTenderRepository } from '@/application/services/serviceRegistry'
import type { BOQItem } from '@/shared/types/boq'

describe('Tender Pricing Workflow - Integration Tests', () => {
  let boqRepo: ReturnType<typeof getBOQRepository>
  let tenderRepo: ReturnType<typeof getTenderRepository>

  beforeEach(() => {
    // Reset store before each test
    const { getState } = useTenderPricingStore
    getState().reset()

    boqRepo = getBOQRepository()
    tenderRepo = getTenderRepository()

    // Mock BOQRepository.getByTenderId to return test data
    vi.spyOn(boqRepo, 'getByTenderId').mockResolvedValue({
      id: 'boq-123',
      tenderId: 'tender-123',
      items: [
        {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'متر',
          quantity: 10,
          unitPrice: 0,
          totalPrice: 0,
        },
        {
          id: 'item-2',
          description: 'Test Item 2',
          unit: 'قطعة',
          quantity: 5,
          unitPrice: 0,
          totalPrice: 0,
        },
        {
          id: 'item-3',
          description: 'Test Item 3',
          unit: 'كيلو',
          quantity: 20,
          unitPrice: 0,
          totalPrice: 0,
        },
      ] as BOQItem[],
      totalValue: 0,
      lastUpdated: new Date().toISOString(),
    })

    // Mock TenderRepository.getById to return test tender
    vi.spyOn(tenderRepo, 'getById').mockResolvedValue({
      id: 'tender-123',
      name: 'Test Tender',
      title: 'Test Tender',
      client: 'Test Client',
      value: 0,
      status: 'under_action' as const,
      phase: 'preparation',
      category: 'construction',
      location: 'Test',
      type: 'public',
      deadline: '2024-12-31',
      daysLeft: 30,
      progress: 0,
      priority: 'medium' as const,
      team: 'Team A',
      manager: 'Manager',
      winChance: 50,
      competition: 'medium',
      competitors: [],
      lastAction: 'Updated',
      requirements: [],
      documents: [],
      proposals: [],
      evaluationCriteria: [],
      submissionDate: '2024-12-31',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
    })

    // Mock repositories
    vi.spyOn(boqRepo, 'createOrUpdate').mockResolvedValue({
      id: 'boq-123',
      tenderId: 'tender-123',
      items: [],
      totalValue: 0,
      lastUpdated: new Date().toISOString(),
    })

    vi.spyOn(tenderRepo, 'update').mockResolvedValue({
      id: 'tender-123',
      name: 'Test Tender',
      title: 'Test Tender',
      client: 'Test Client',
      value: 0,
      status: 'under_action' as const,
      phase: 'preparation',
      category: 'construction',
      location: 'Test',
      type: 'public',
      deadline: '2024-12-31',
      daysLeft: 30,
      progress: 0,
      priority: 'medium' as const,
      team: 'Team A',
      manager: 'Manager',
      winChance: 50,
      competition: 'medium',
      competitors: [],
      lastAction: 'Updated',
      requirements: [],
      documents: [],
      proposals: [],
      evaluationCriteria: [],
      submissionDate: '2024-12-31',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
    })
  })

  describe('Complete Pricing Workflow', () => {
    it('should complete full workflow: load -> price -> save -> approve', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      // Step 1: Load tender
      await act(async () => {
        await result.current.loadPricing('tender-123')
      })
      expect(result.current.currentTenderId).toBe('tender-123')

      // Step 2: Enter prices for multiple items
      act(() => {
        result.current.updateItemPricing('item-1', {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'متر',
          unitPrice: 100,
          quantity: 5,
          totalPrice: 500,
        })

        result.current.updateItemPricing('item-2', {
          id: 'item-2',
          description: 'Test Item 2',
          unit: 'قطعة',
          unitPrice: 200,
          quantity: 3,
          totalPrice: 600,
        })
      })

      expect(result.current.isDirty).toBe(true)
      expect(result.current.getTotalValue()).toBe(1100)

      // Step 3: Save
      await act(async () => {
        await result.current.savePricing()
      })

      expect(result.current.isDirty).toBe(false)

      // Verify skipRefresh was passed
      expect(boqRepo.createOrUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ skipRefresh: true }),
      )

      expect(tenderRepo.update).toHaveBeenCalledWith(
        'tender-123',
        expect.anything(),
        expect.objectContaining({ skipRefresh: true }),
      )
    })

    it('should NOT auto-save during pricing', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      await act(async () => {
        await result.current.loadPricing('tender-123')
      })

      // Clear mock calls
      vi.clearAllMocks()

      // Enter prices
      act(() => {
        result.current.updateItemPricing('item-1', { unitPrice: 100 })
        result.current.updateItemPricing('item-2', { unitPrice: 200 })
        result.current.updateItemPricing('item-3', { unitPrice: 300 })
      })

      // Wait 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000))

      // Verify NO auto-save happened
      expect(boqRepo.createOrUpdate).not.toHaveBeenCalled()
      expect(tenderRepo.update).not.toHaveBeenCalled()
    })

    it('should preserve data in memory without save', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      await act(async () => {
        await result.current.loadPricing('tender-123')
      })

      // Enter data
      act(() => {
        result.current.updateItemPricing('item-1', {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'متر',
          unitPrice: 150,
          quantity: 4,
          totalPrice: 600,
        })
      })

      // Verify data is in memory
      const item = result.current.pricingData.get('item-1')
      expect(item?.unitPrice).toBe(150)
      expect(item?.totalPrice).toBe(600)

      // Verify NOT saved yet
      expect(boqRepo.createOrUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Event Handling', () => {
    it('should emit events with skipRefresh flag on save', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      const eventListener = vi.fn()
      window.addEventListener('tender-updated', eventListener)

      await act(async () => {
        await result.current.loadPricing('tender-123')
        result.current.updateItemPricing('item-1', {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'متر',
          unitPrice: 100,
          quantity: 10,
          totalPrice: 1000,
        })
        await result.current.savePricing()
      })

      await waitFor(() => {
        expect(eventListener).toHaveBeenCalled()
      })

      const event = eventListener.mock.calls[0][0] as CustomEvent
      expect(event.detail?.skipRefresh).toBe(true)
      expect(event.detail?.tenderId).toBe('tender-123')

      window.removeEventListener('tender-updated', eventListener)
    })

    it('should NOT cause reload loops', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      const reloadEvents: Event[] = []
      const eventListener = vi.fn((e: Event) => {
        reloadEvents.push(e)
      })

      window.addEventListener('tender-updated', eventListener)

      await act(async () => {
        await result.current.loadPricing('tender-123')
        result.current.updateItemPricing('item-1', {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'متر',
          unitPrice: 100,
          quantity: 10,
          totalPrice: 1000,
        })
        await result.current.savePricing()
      })

      // Wait for potential loops
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Should have only 1-2 events (initial + save)
      expect(reloadEvents.length).toBeLessThan(3)

      window.removeEventListener('tender-updated', eventListener)
    })
  })

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      // Mock error
      vi.spyOn(boqRepo, 'createOrUpdate').mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await result.current.loadPricing('tender-123')
        await result.current.savePricing()
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain('Network error')
    })

    it('should keep data after failed save', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      await act(async () => {
        await result.current.loadPricing('tender-123')
        result.current.updateItemPricing('item-1', {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'متر',
          unitPrice: 100,
          quantity: 5,
          totalPrice: 500,
        })
      })

      // Mock error
      vi.spyOn(boqRepo, 'createOrUpdate').mockRejectedValue(new Error('Save failed'))

      await act(async () => {
        await result.current.savePricing()
      })

      // Verify data still in memory
      const item = result.current.pricingData.get('item-1')
      expect(item?.unitPrice).toBe(100)
      expect(result.current.isDirty).toBe(true)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent updates correctly', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      await act(async () => {
        await result.current.loadPricing('tender-123')

        // Concurrent updates
        result.current.updateItemPricing('item-1', {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'متر',
          unitPrice: 100,
          quantity: 10,
          totalPrice: 1000,
        })
        result.current.updateItemPricing('item-2', {
          id: 'item-2',
          description: 'Test Item 2',
          unit: 'قطعة',
          unitPrice: 200,
          quantity: 5,
          totalPrice: 1000,
        })
        result.current.updateItemPricing('item-1', {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'متر',
          unitPrice: 150,
          quantity: 10,
          totalPrice: 1500,
        })
      })

      // Last update should win
      const item = result.current.pricingData.get('item-1')
      expect(item?.unitPrice).toBe(150)
    })

    it('should handle save while updates are happening', async () => {
      const { result } = renderHook(() => useTenderPricingStore())

      await act(async () => {
        await result.current.loadPricing('tender-123')
        result.current.updateItemPricing('item-1', {
          id: 'item-1',
          description: 'Test Item 1',
          unit: 'متر',
          unitPrice: 100,
          quantity: 10,
          totalPrice: 1000,
        })

        // Start save
        const savePromise = result.current.savePricing()

        // Update while saving
        result.current.updateItemPricing('item-2', {
          id: 'item-2',
          description: 'Test Item 2',
          unit: 'قطعة',
          unitPrice: 200,
          quantity: 5,
          totalPrice: 1000,
        })

        await savePromise
      })

      // Both items should exist
      expect(result.current.pricingData.get('item-1')).toBeTruthy()
      expect(result.current.pricingData.get('item-2')).toBeTruthy()
    })
  })
})
