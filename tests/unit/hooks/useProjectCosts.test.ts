/**
 * Tests for useProjectCosts hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectCosts, type Expense } from '@/application/hooks/useProjectCosts'
import { useProjectCostStore } from '@/application/stores/projectCostStore'
import type { BOQItem } from '@/shared/types/projects'

// Mock the store
vi.mock('@/application/stores/projectCostStore')

const mockBOQItems: BOQItem[] = [
  {
    id: '1',
    description: 'Concrete',
    quantity: 100,
    unit: 'm3',
    unitPrice: 500,
    total: 50000,
  } as BOQItem,
  {
    id: '2',
    description: 'Steel',
    quantity: 50,
    unit: 'ton',
    unitPrice: 3000,
    total: 150000,
  } as BOQItem,
]

const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    description: 'Concrete Purchase',
    category: 'materials',
    amount: 48000,
    date: '2025-01-15',
    projectId: 'proj-1',
  },
  {
    id: 'exp-2',
    description: 'Steel Purchase',
    category: 'materials',
    amount: 155000,
    date: '2025-02-01',
    projectId: 'proj-1',
  },
]

describe('useProjectCosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================================================
  // Hook Initialization
  // ========================================================================

  it('should return initial state', () => {
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    expect(result.current.estimatedCosts).toEqual([])
    expect(result.current.actualCosts).toEqual([])
    expect(result.current.variances).toEqual([])
  })

  // ========================================================================
  // Actions
  // ========================================================================

  it('should call setEstimatedCosts', () => {
    const setEstimatedCosts = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts,
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.setEstimatedCosts(mockBOQItems)
    })

    expect(setEstimatedCosts).toHaveBeenCalledWith(mockBOQItems)
  })

  it('should call setActualCosts', () => {
    const setActualCosts = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts,
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.setActualCosts(mockExpenses)
    })

    expect(setActualCosts).toHaveBeenCalledWith(mockExpenses)
  })

  it('should call addEstimatedCost', () => {
    const addEstimatedCost = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost,
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.addEstimatedCost(mockBOQItems[0])
    })

    expect(addEstimatedCost).toHaveBeenCalledWith(mockBOQItems[0])
  })

  it('should call addActualCost', () => {
    const addActualCost = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost,
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.addActualCost(mockExpenses[0])
    })

    expect(addActualCost).toHaveBeenCalledWith(mockExpenses[0])
  })

  it('should call updateEstimatedCost', () => {
    const updateEstimatedCost = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost,
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.updateEstimatedCost('1', { unitPrice: 550 })
    })

    expect(updateEstimatedCost).toHaveBeenCalledWith('1', { unitPrice: 550 })
  })

  it('should call updateActualCost', () => {
    const updateActualCost = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost,
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.updateActualCost('exp-1', { amount: 49000 })
    })

    expect(updateActualCost).toHaveBeenCalledWith('exp-1', { amount: 49000 })
  })

  it('should call removeEstimatedCost', () => {
    const removeEstimatedCost = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost,
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.removeEstimatedCost('1')
    })

    expect(removeEstimatedCost).toHaveBeenCalledWith('1')
  })

  it('should call removeActualCost', () => {
    const removeActualCost = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost,
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.removeActualCost('exp-1')
    })

    expect(removeActualCost).toHaveBeenCalledWith('exp-1')
  })

  it('should call calculateVariances', () => {
    const calculateVariances = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances,
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.calculateVariances()
    })

    expect(calculateVariances).toHaveBeenCalled()
  })

  it('should call clearError', () => {
    const clearError = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError,
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.clearError()
    })

    expect(clearError).toHaveBeenCalled()
  })

  it('should call reset', () => {
    const reset = vi.fn()
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset,
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())

    act(() => {
      result.current.reset()
    })

    expect(reset).toHaveBeenCalled()
  })

  // ========================================================================
  // Selectors
  // ========================================================================

  it('should call getTotalEstimated', () => {
    const getTotalEstimated = vi.fn(() => 200000)
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: mockBOQItems,
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated,
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())
    const total = result.current.getTotalEstimated()

    expect(getTotalEstimated).toHaveBeenCalled()
    expect(total).toBe(200000)
  })

  it('should call getTotalActual', () => {
    const getTotalActual = vi.fn(() => 203000)
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: mockExpenses,
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual,
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())
    const total = result.current.getTotalActual()

    expect(getTotalActual).toHaveBeenCalled()
    expect(total).toBe(203000)
  })

  it('should call getTotalVariance', () => {
    const getTotalVariance = vi.fn(() => 3000)
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance,
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())
    const variance = result.current.getTotalVariance()

    expect(getTotalVariance).toHaveBeenCalled()
    expect(variance).toBe(3000)
  })

  it('should call getVariancePercentage', () => {
    const getVariancePercentage = vi.fn(() => 1.5)
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage,
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())
    const percentage = result.current.getVariancePercentage()

    expect(getVariancePercentage).toHaveBeenCalled()
    expect(percentage).toBe(1.5)
  })

  it('should call getCostStatus', () => {
    const getCostStatus = vi.fn(() => 'over')
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus,
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())
    const status = result.current.getCostStatus()

    expect(getCostStatus).toHaveBeenCalled()
    expect(status).toBe('over')
  })

  it('should call getEstimatedByCategory', () => {
    const getEstimatedByCategory = vi.fn(() => 50000)
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory,
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())
    const total = result.current.getEstimatedByCategory('materials')

    expect(getEstimatedByCategory).toHaveBeenCalledWith('materials')
    expect(total).toBe(50000)
  })

  it('should call getActualByCategory', () => {
    const getActualByCategory = vi.fn(() => 48000)
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory,
      getVarianceByCategory: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectCosts())
    const total = result.current.getActualByCategory('materials')

    expect(getActualByCategory).toHaveBeenCalledWith('materials')
    expect(total).toBe(48000)
  })

  it('should call getVarianceByCategory', () => {
    const getVarianceByCategory = vi.fn(() => -2000)
    vi.mocked(useProjectCostStore).mockReturnValue({
      estimatedCosts: [],
      actualCosts: [],
      variances: [],
      loading: false,
      error: null,
      setEstimatedCosts: vi.fn(),
      setActualCosts: vi.fn(),
      addEstimatedCost: vi.fn(),
      addActualCost: vi.fn(),
      updateEstimatedCost: vi.fn(),
      updateActualCost: vi.fn(),
      removeEstimatedCost: vi.fn(),
      removeActualCost: vi.fn(),
      calculateVariances: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn(),
      getTotalEstimated: vi.fn(() => 0),
      getTotalActual: vi.fn(() => 0),
      getTotalVariance: vi.fn(() => 0),
      getVariancePercentage: vi.fn(() => 0),
      getCostStatus: vi.fn(() => 'on'),
      getEstimatedByCategory: vi.fn(() => 0),
      getActualByCategory: vi.fn(() => 0),
      getVarianceByCategory,
    } as any)

    const { result } = renderHook(() => useProjectCosts())
    const variance = result.current.getVarianceByCategory('materials')

    expect(getVarianceByCategory).toHaveBeenCalledWith('materials')
    expect(variance).toBe(-2000)
  })
})
