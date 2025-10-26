/**
 * Unit Tests for TenderPricingStore
 * Updated for Week 3 - simplified realistic tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTenderPricingStore } from '@/stores/tenderPricingStore'
import { StorageManager } from '@/infrastructure/storage/core/StorageManager'
import { LocalStorageAdapter } from '@/infrastructure/storage/adapters/LocalStorageAdapter'

describe('TenderPricingStore', () => {
  beforeEach(() => {
    StorageManager.resetInstance()
    const manager = StorageManager.getInstance()
    manager.setAdapter(new LocalStorageAdapter())

    const { result } = renderHook(() => useTenderPricingStore())
    act(() => {
      result.current.reset()
    })

    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    StorageManager.resetInstance()
    vi.restoreAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTenderPricingStore())
    expect(result.current.currentTenderId).toBe(null)
    expect(result.current.isDirty).toBe(false)
  })

  it('should set current tender', () => {
    const { result } = renderHook(() => useTenderPricingStore())
    act(() => {
      result.current.setCurrentTender('tender-123')
    })
    expect(result.current.currentTenderId).toBe('tender-123')
  })

  it('should mark as dirty', () => {
    const { result } = renderHook(() => useTenderPricingStore())
    act(() => {
      result.current.markDirty()
    })
    expect(result.current.isDirty).toBe(true)
  })

  it('should reset dirty flag', () => {
    const { result } = renderHook(() => useTenderPricingStore())
    act(() => {
      result.current.markDirty()
      result.current.resetDirty()
    })
    expect(result.current.isDirty).toBe(false)
  })

  it('should calculate completion percentage', () => {
    const { result } = renderHook(() => useTenderPricingStore())
    const percentage = result.current.getCompletionPercentage()
    expect(typeof percentage).toBe('number')
    expect(percentage).toBeGreaterThanOrEqual(0)
  })

  it('should count priced items', () => {
    const { result } = renderHook(() => useTenderPricingStore())
    const count = result.current.getPricedItemsCount()
    expect(typeof count).toBe('number')
  })

  it('should calculate total value', () => {
    const { result } = renderHook(() => useTenderPricingStore())
    const total = result.current.getTotalValue()
    expect(total).toBeGreaterThanOrEqual(0)
  })
})
