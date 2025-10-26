/**
 * Unit Tests for useTenderEventListeners Hooks
 * Tests event handling for tender navigation and updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useTenderDetailNavigation,
  useTenderUpdateListener,
  useTenderPricingNavigation,
} from '@/application/hooks/useTenderEventListeners'
import type { Tender } from '@/data/centralData'
import { APP_EVENTS } from '@/events/bus'

describe('useTenderEventListeners', () => {
  const mockTenders: Tender[] = [
    {
      id: 'tender-1',
      title: 'Test Tender 1',
      client: 'Client A',
      status: 'under_action',
      priority: 'high',
      deadline: '2025-12-31',
      estimatedValue: 100000,
      winChance: 75,
    },
    {
      id: 'tender-2',
      title: 'Test Tender 2',
      client: 'Client B',
      status: 'new',
      priority: 'medium',
      deadline: '2025-11-30',
      estimatedValue: 50000,
      winChance: 60,
    },
  ] as Tender[]

  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('useTenderDetailNavigation', () => {
    it('should navigate to tender on event', () => {
      const onNavigate = vi.fn()
      renderHook(() => useTenderDetailNavigation(mockTenders, onNavigate))

      const event = new CustomEvent(APP_EVENTS.OPEN_TENDER_DETAILS, {
        detail: { tenderId: 'tender-1' },
      })
      window.dispatchEvent(event)

      expect(onNavigate).toHaveBeenCalledWith(mockTenders[0])
    })

    it('should not navigate if tender not found', () => {
      const onNavigate = vi.fn()
      renderHook(() => useTenderDetailNavigation(mockTenders, onNavigate))

      const event = new CustomEvent(APP_EVENTS.OPEN_TENDER_DETAILS, {
        detail: { tenderId: 'non-existent' },
      })
      window.dispatchEvent(event)

      expect(onNavigate).not.toHaveBeenCalled()
    })

    it('should not navigate if no tenderId provided', () => {
      const onNavigate = vi.fn()
      renderHook(() => useTenderDetailNavigation(mockTenders, onNavigate))

      const event = new CustomEvent(APP_EVENTS.OPEN_TENDER_DETAILS, {
        detail: {},
      })
      window.dispatchEvent(event)

      expect(onNavigate).not.toHaveBeenCalled()
    })

    it('should cleanup event listener on unmount', () => {
      const onNavigate = vi.fn()
      const { unmount } = renderHook(() => useTenderDetailNavigation(mockTenders, onNavigate))

      unmount()

      const event = new CustomEvent(APP_EVENTS.OPEN_TENDER_DETAILS, {
        detail: { tenderId: 'tender-1' },
      })
      window.dispatchEvent(event)

      expect(onNavigate).not.toHaveBeenCalled()
    })
  })

  describe('useTenderUpdateListener', () => {
    it('should call refreshTenders after debounce on TENDERS_UPDATED', async () => {
      const refreshTenders = vi.fn().mockResolvedValue(undefined)
      renderHook(() => useTenderUpdateListener(refreshTenders))

      const event = new Event(APP_EVENTS.TENDERS_UPDATED)
      window.dispatchEvent(event)

      expect(refreshTenders).not.toHaveBeenCalled()

      vi.advanceTimersByTime(500)
      await Promise.resolve() // Let promises resolve

      expect(refreshTenders).toHaveBeenCalledTimes(1)
    })

    it('should call refreshTenders after debounce on TENDER_UPDATED', async () => {
      const refreshTenders = vi.fn().mockResolvedValue(undefined)
      renderHook(() => useTenderUpdateListener(refreshTenders))

      const event = new Event(APP_EVENTS.TENDER_UPDATED)
      window.dispatchEvent(event)

      vi.advanceTimersByTime(500)
      await Promise.resolve()

      expect(refreshTenders).toHaveBeenCalledTimes(1)
    })

    it('should debounce multiple rapid updates', async () => {
      const refreshTenders = vi.fn().mockResolvedValue(undefined)
      renderHook(() => useTenderUpdateListener(refreshTenders))

      // Dispatch 3 events rapidly
      window.dispatchEvent(new Event(APP_EVENTS.TENDERS_UPDATED))
      window.dispatchEvent(new Event(APP_EVENTS.TENDER_UPDATED))
      window.dispatchEvent(new Event(APP_EVENTS.TENDERS_UPDATED))

      vi.advanceTimersByTime(500)
      await Promise.resolve()

      // Should only refresh once due to debounce
      expect(refreshTenders).toHaveBeenCalledTimes(1)
    })

    it('should skip refresh when skipRefresh flag is true', async () => {
      const refreshTenders = vi.fn().mockResolvedValue(undefined)
      renderHook(() => useTenderUpdateListener(refreshTenders))

      const event = new CustomEvent(APP_EVENTS.TENDERS_UPDATED, {
        detail: { skipRefresh: true },
      })
      window.dispatchEvent(event)

      vi.advanceTimersByTime(500)
      await Promise.resolve()

      expect(refreshTenders).not.toHaveBeenCalled()
    })

    it('should prevent re-entrance during refresh', async () => {
      const refreshTenders = vi.fn().mockResolvedValue(undefined)
      renderHook(() => useTenderUpdateListener(refreshTenders))

      // First event
      window.dispatchEvent(new Event(APP_EVENTS.TENDERS_UPDATED))
      vi.advanceTimersByTime(500)
      await Promise.resolve()
      expect(refreshTenders).toHaveBeenCalledTimes(1)

      // Second event immediately while first may still be running
      window.dispatchEvent(new Event(APP_EVENTS.TENDERS_UPDATED))

      // Should not call immediately due to re-entrance guard
      expect(refreshTenders).toHaveBeenCalledTimes(1)
    })

    it('should cleanup timers on unmount', () => {
      const refreshTenders = vi.fn().mockResolvedValue(undefined)
      const { unmount } = renderHook(() => useTenderUpdateListener(refreshTenders))

      window.dispatchEvent(new Event(APP_EVENTS.TENDERS_UPDATED))
      unmount()

      vi.advanceTimersByTime(500)

      expect(refreshTenders).not.toHaveBeenCalled()
    })
  })

  describe('useTenderPricingNavigation', () => {
    it('should navigate to tender on pricing event', () => {
      const onNavigate = vi.fn()
      renderHook(() => useTenderPricingNavigation(mockTenders, onNavigate))

      const event = new CustomEvent('openPricingForTender', {
        detail: { tenderId: 'tender-1' },
      })
      window.dispatchEvent(event)

      expect(onNavigate).toHaveBeenCalledWith(mockTenders[0], undefined)
    })

    it('should navigate to tender with itemId', () => {
      const onNavigate = vi.fn()
      renderHook(() => useTenderPricingNavigation(mockTenders, onNavigate))

      const event = new CustomEvent('openPricingForTender', {
        detail: { tenderId: 'tender-1', itemId: 'item-123' },
      })
      window.dispatchEvent(event)

      expect(onNavigate).toHaveBeenCalledWith(mockTenders[0], 'item-123')
    })

    it('should not navigate if tender not found', () => {
      const onNavigate = vi.fn()
      renderHook(() => useTenderPricingNavigation(mockTenders, onNavigate))

      const event = new CustomEvent('openPricingForTender', {
        detail: { tenderId: 'non-existent' },
      })
      window.dispatchEvent(event)

      expect(onNavigate).not.toHaveBeenCalled()
    })

    it('should cleanup event listener on unmount', () => {
      const onNavigate = vi.fn()
      const { unmount } = renderHook(() => useTenderPricingNavigation(mockTenders, onNavigate))

      unmount()

      const event = new CustomEvent('openPricingForTender', {
        detail: { tenderId: 'tender-1' },
      })
      window.dispatchEvent(event)

      expect(onNavigate).not.toHaveBeenCalled()
    })
  })
})
