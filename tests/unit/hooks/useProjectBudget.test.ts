/**
 * Tests for useProjectBudget hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useProjectBudget,
  type BudgetComparisonItem,
  type BudgetSummary,
} from '@/application/hooks/useProjectBudget'
import { useProjectDetailsStore } from '@/application/stores/projectDetailsStore'

// Mock the store
vi.mock('@/application/stores/projectDetailsStore')

const mockBudgetComparison: BudgetComparisonItem[] = [
  {
    id: '1',
    description: 'Concrete Work',
    estimatedCost: 50000,
    actualCost: 48000,
    variance: -2000,
    variancePercentage: -4,
  },
  {
    id: '2',
    description: 'Steel Work',
    estimatedCost: 150000,
    actualCost: 155000,
    variance: 5000,
    variancePercentage: 3.33,
  },
  {
    id: '3',
    description: 'Electrical',
    estimatedCost: 30000,
    actualCost: 30500,
    variance: 500,
    variancePercentage: 1.67,
  },
]

const mockBudgetSummary: BudgetSummary = {
  totalEstimated: 230000,
  totalActual: 233500,
  variance: 3500,
  variancePercentage: 1.52,
  status: 'on',
}

describe('useProjectBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================================================
  // Hook Initialization
  // ========================================================================

  it('should return initial state', () => {
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: [],
      budgetSummary: null,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())

    expect(result.current.budgetComparison).toEqual([])
    expect(result.current.budgetSummary).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should expose budget data', () => {
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: mockBudgetComparison,
      budgetSummary: mockBudgetSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())

    expect(result.current.budgetComparison).toHaveLength(3)
    expect(result.current.budgetSummary?.totalEstimated).toBe(230000)
  })

  // ========================================================================
  // Actions
  // ========================================================================

  it('should call loadBudgetComparison', async () => {
    const loadBudgetComparison = vi.fn()
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: [],
      budgetSummary: null,
      loading: false,
      error: null,
      loadBudgetComparison,
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())

    await act(async () => {
      await result.current.loadBudgetComparison('proj-1')
    })

    expect(loadBudgetComparison).toHaveBeenCalledWith('proj-1')
  })

  it('should call clearBudgetData', () => {
    const clearBudgetData = vi.fn()
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: mockBudgetComparison,
      budgetSummary: mockBudgetSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData,
    } as any)

    const { result } = renderHook(() => useProjectBudget())

    act(() => {
      result.current.clearBudgetData()
    })

    expect(clearBudgetData).toHaveBeenCalled()
  })

  it('should export budget comparison to CSV', () => {
    // Mock DOM APIs
    const mockCreateElement = vi.fn().mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    })
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:url')
    const mockRevokeObjectURL = vi.fn()

    global.document.createElement = mockCreateElement
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: mockBudgetComparison,
      budgetSummary: mockBudgetSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())

    act(() => {
      result.current.exportBudgetComparison()
    })

    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalled()
  })

  it('should not export if no data', () => {
    const mockCreateElement = vi.fn()
    global.document.createElement = mockCreateElement

    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: [],
      budgetSummary: null,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())

    act(() => {
      result.current.exportBudgetComparison()
    })

    expect(mockCreateElement).not.toHaveBeenCalled()
  })

  // ========================================================================
  // Selectors
  // ========================================================================

  it('should get items over budget', () => {
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: mockBudgetComparison,
      budgetSummary: mockBudgetSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())
    const overBudget = result.current.getItemsOverBudget()

    expect(overBudget).toHaveLength(2) // Steel and Electrical
    expect(overBudget[0].description).toBe('Steel Work')
  })

  it('should get items under budget', () => {
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: mockBudgetComparison,
      budgetSummary: mockBudgetSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())
    const underBudget = result.current.getItemsUnderBudget()

    expect(underBudget).toHaveLength(1) // Concrete
    expect(underBudget[0].description).toBe('Concrete Work')
  })

  it('should get items on budget (within 5% tolerance)', () => {
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: mockBudgetComparison,
      budgetSummary: mockBudgetSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())
    const onBudget = result.current.getItemsOnBudget()

    // All items are within 5% tolerance
    expect(onBudget).toHaveLength(3)
  })

  it('should get total over budget', () => {
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: mockBudgetComparison,
      budgetSummary: mockBudgetSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())
    const total = result.current.getTotalOverBudget()

    expect(total).toBe(5500) // 5000 + 500
  })

  it('should get total under budget', () => {
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: mockBudgetComparison,
      budgetSummary: mockBudgetSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())
    const total = result.current.getTotalUnderBudget()

    expect(total).toBe(2000) // Math.abs(-2000)
  })

  it('should calculate budget utilization percentage', () => {
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: mockBudgetComparison,
      budgetSummary: mockBudgetSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())
    const utilization = result.current.getBudgetUtilization()

    expect(utilization).toBeCloseTo(101.52, 2) // (233500 / 230000) * 100
  })

  it('should return 0 utilization if no summary', () => {
    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: [],
      budgetSummary: null,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())
    const utilization = result.current.getBudgetUtilization()

    expect(utilization).toBe(0)
  })

  it('should return 0 utilization if estimated is zero', () => {
    const zeroSummary: BudgetSummary = {
      totalEstimated: 0,
      totalActual: 1000,
      variance: 1000,
      variancePercentage: 0,
      status: 'over',
    }

    vi.mocked(useProjectDetailsStore).mockReturnValue({
      budgetComparison: [],
      budgetSummary: zeroSummary,
      loading: false,
      error: null,
      loadBudgetComparison: vi.fn(),
      clearBudgetData: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectBudget())
    const utilization = result.current.getBudgetUtilization()

    expect(utilization).toBe(0)
  })
})
