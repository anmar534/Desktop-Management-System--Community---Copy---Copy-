/**
 * Unit Tests for useTenderViewNavigation Hook
 * Tests navigation state management for tender views
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTenderViewNavigation } from '@/application/hooks/useTenderViewNavigation'
import type { Tender } from '@/data/centralData'

describe('useTenderViewNavigation', () => {
  const mockTender: Tender = {
    id: 'tender-1',
    title: 'Test Tender',
    client: 'Test Client',
    status: 'under_action',
    priority: 'high',
    deadline: '2025-12-31',
    estimatedValue: 100000,
    winChance: 75,
  } as Tender

  it('should initialize with list view and no tender selected', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    expect(result.current.currentView).toBe('list')
    expect(result.current.selectedTender).toBeNull()
  })

  it('should navigate to pricing view with tender', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    act(() => {
      result.current.navigateToPricing(mockTender)
    })

    expect(result.current.currentView).toBe('pricing')
    expect(result.current.selectedTender).toEqual(mockTender)
  })

  it('should navigate to details view with tender', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    act(() => {
      result.current.navigateToDetails(mockTender)
    })

    expect(result.current.currentView).toBe('details')
    expect(result.current.selectedTender).toEqual(mockTender)
  })

  it('should navigate to results view with tender', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    act(() => {
      result.current.navigateToResults(mockTender)
    })

    expect(result.current.currentView).toBe('results')
    expect(result.current.selectedTender).toEqual(mockTender)
  })

  it('should navigate to any view using navigateToView', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    act(() => {
      result.current.navigateToView('pricing', mockTender)
    })

    expect(result.current.currentView).toBe('pricing')
    expect(result.current.selectedTender).toEqual(mockTender)
  })

  it('should navigate to view without tender', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    act(() => {
      result.current.navigateToView('list')
    })

    expect(result.current.currentView).toBe('list')
    expect(result.current.selectedTender).toBeNull()
  })

  it('should navigate back to list and clear selected tender', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    // First navigate to pricing
    act(() => {
      result.current.navigateToPricing(mockTender)
    })

    expect(result.current.selectedTender).toEqual(mockTender)

    // Then back to list
    act(() => {
      result.current.backToList()
    })

    expect(result.current.currentView).toBe('list')
    expect(result.current.selectedTender).toBeNull()
  })

  it('should update selected tender using setSelectedTender', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    const newTender: Tender = { ...mockTender, id: 'tender-2', title: 'Another Tender' }

    act(() => {
      result.current.setSelectedTender(newTender)
    })

    expect(result.current.selectedTender).toEqual(newTender)
  })

  it('should clear selected tender using setSelectedTender with null', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    // First set a tender
    act(() => {
      result.current.navigateToPricing(mockTender)
    })

    expect(result.current.selectedTender).toEqual(mockTender)

    // Then clear it
    act(() => {
      result.current.setSelectedTender(null)
    })

    expect(result.current.selectedTender).toBeNull()
  })

  it('should maintain view when changing selected tender', () => {
    const { result } = renderHook(() => useTenderViewNavigation())

    act(() => {
      result.current.navigateToPricing(mockTender)
    })

    const newTender: Tender = { ...mockTender, id: 'tender-2' }

    act(() => {
      result.current.setSelectedTender(newTender)
    })

    // View should stay as pricing
    expect(result.current.currentView).toBe('pricing')
    expect(result.current.selectedTender).toEqual(newTender)
  })
})
