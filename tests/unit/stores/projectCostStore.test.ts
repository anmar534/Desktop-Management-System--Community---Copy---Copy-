/**
 * Tests for projectCostStore
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectCostStore } from '@/application/stores/projectCostStore'
import type { Expense } from '@/application/stores/projectCostStore'
import type { BOQItem } from '@/shared/types/boq'

// Mock data
const mockEstimatedCosts: BOQItem[] = [
  {
    id: 'boq-1',
    description: 'Concrete Work',
    quantity: 100,
    unit: 'm³',
    unitPrice: 500,
    totalPrice: 50000,
  },
  {
    id: 'boq-2',
    description: 'Steel Work',
    quantity: 50,
    unit: 'ton',
    unitPrice: 3000,
    totalPrice: 150000,
  },
]

const mockActualCosts: Expense[] = [
  {
    id: 'exp-1',
    description: 'Concrete Work',
    category: 'Concrete Work',
    amount: 48000,
    date: '2025-01-15',
  },
  {
    id: 'exp-2',
    description: 'Steel Work',
    category: 'Steel Work',
    amount: 155000,
    date: '2025-02-01',
  },
]

describe('projectCostStore', () => {
  beforeEach(() => {
    useProjectCostStore.getState().reset()
  })

  // ========================================================================
  // Initial State
  // ========================================================================

  describe('Initial State', () => {
    it('should have empty estimated costs', () => {
      const { estimatedCosts, estimatedTotal } = useProjectCostStore.getState()
      expect(estimatedCosts).toEqual([])
      expect(estimatedTotal).toBe(0)
    })

    it('should have empty actual costs', () => {
      const { actualCosts, actualTotal } = useProjectCostStore.getState()
      expect(actualCosts).toEqual([])
      expect(actualTotal).toBe(0)
    })

    it('should have on-budget status', () => {
      const { costStatus } = useProjectCostStore.getState()
      expect(costStatus).toBe('on-budget')
    })
  })

  // ========================================================================
  // Estimated Costs
  // ========================================================================

  describe('setEstimatedCosts', () => {
    it('should set estimated costs', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)

      expect(store.estimatedCosts).toHaveLength(2)
      expect(store.estimatedTotal).toBe(200000)
    })

    it('should trigger recalculation', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)

      expect(store.variance).toHaveLength(2)
    })
  })

  describe('addEstimatedCost', () => {
    it('should add estimated cost', () => {
      const store = useProjectCostStore.getState()
      store.addEstimatedCost(mockEstimatedCosts[0])

      expect(store.estimatedCosts).toHaveLength(1)
      expect(store.estimatedTotal).toBe(50000)
    })
  })

  describe('updateEstimatedCost', () => {
    beforeEach(() => {
      useProjectCostStore.getState().setEstimatedCosts(mockEstimatedCosts)
    })

    it('should update estimated cost', () => {
      const store = useProjectCostStore.getState()
      store.updateEstimatedCost('boq-1', { totalPrice: 55000 })

      expect(store.estimatedCosts[0].totalPrice).toBe(55000)
      expect(store.estimatedTotal).toBe(205000)
    })
  })

  describe('removeEstimatedCost', () => {
    beforeEach(() => {
      useProjectCostStore.getState().setEstimatedCosts(mockEstimatedCosts)
    })

    it('should remove estimated cost', () => {
      const store = useProjectCostStore.getState()
      store.removeEstimatedCost('boq-1')

      expect(store.estimatedCosts).toHaveLength(1)
      expect(store.estimatedTotal).toBe(150000)
    })
  })

  // ========================================================================
  // Actual Costs
  // ========================================================================

  describe('setActualCosts', () => {
    it('should set actual costs', () => {
      const store = useProjectCostStore.getState()
      store.setActualCosts(mockActualCosts)

      expect(store.actualCosts).toHaveLength(2)
      expect(store.actualTotal).toBe(203000)
    })
  })

  describe('addActualCost', () => {
    it('should add actual cost', () => {
      const store = useProjectCostStore.getState()
      store.addActualCost(mockActualCosts[0])

      expect(store.actualCosts).toHaveLength(1)
      expect(store.actualTotal).toBe(48000)
    })
  })

  describe('updateActualCost', () => {
    beforeEach(() => {
      useProjectCostStore.getState().setActualCosts(mockActualCosts)
    })

    it('should update actual cost', () => {
      const store = useProjectCostStore.getState()
      store.updateActualCost('exp-1', { amount: 50000 })

      expect(store.actualCosts[0].amount).toBe(50000)
      expect(store.actualTotal).toBe(205000)
    })
  })

  describe('removeActualCost', () => {
    beforeEach(() => {
      useProjectCostStore.getState().setActualCosts(mockActualCosts)
    })

    it('should remove actual cost', () => {
      const store = useProjectCostStore.getState()
      store.removeActualCost('exp-1')

      expect(store.actualCosts).toHaveLength(1)
      expect(store.actualTotal).toBe(155000)
    })
  })

  // ========================================================================
  // Variance Calculation
  // ========================================================================

  describe('calculateVariance', () => {
    beforeEach(() => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts(mockActualCosts)
    })

    it('should calculate variance for all items', () => {
      const store = useProjectCostStore.getState()
      expect(store.variance).toHaveLength(2)
    })

    it('should calculate correct variance amounts', () => {
      const store = useProjectCostStore.getState()
      const concreteVariance = store.variance.find((v) => v.itemName === 'Concrete Work')

      expect(concreteVariance?.variance).toBe(2000) // 50000 - 48000
    })

    it('should calculate variance percentages', () => {
      const store = useProjectCostStore.getState()
      const concreteVariance = store.variance.find((v) => v.itemName === 'Concrete Work')

      expect(concreteVariance?.variancePercentage).toBeCloseTo(4, 1) // (2000/50000) * 100
    })
  })

  // ========================================================================
  // Computed Selectors
  // ========================================================================

  describe('getTotalEstimated', () => {
    it('should return total estimated cost', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)

      expect(store.getTotalEstimated()).toBe(200000)
    })
  })

  describe('getTotalActual', () => {
    it('should return total actual cost', () => {
      const store = useProjectCostStore.getState()
      store.setActualCosts(mockActualCosts)

      expect(store.getTotalActual()).toBe(203000)
    })
  })

  describe('getTotalVariance', () => {
    it('should calculate total variance', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts(mockActualCosts)

      expect(store.getTotalVariance()).toBe(-3000) // 200000 - 203000
    })
  })

  describe('getVariancePercentage', () => {
    it('should calculate variance percentage', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts(mockActualCosts)

      expect(store.getVariancePercentage()).toBeCloseTo(-1.5, 1) // (-3000/200000) * 100
    })

    it('should return 0 if no estimated costs', () => {
      const store = useProjectCostStore.getState()
      expect(store.getVariancePercentage()).toBe(0)
    })
  })

  describe('getCostStatus', () => {
    it('should return under if under budget', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts([
        { ...mockActualCosts[0], amount: 45000 },
        { ...mockActualCosts[1], amount: 140000 },
      ])

      expect(store.getCostStatus()).toBe('under')
    })

    it('should return over if over budget', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts([
        { ...mockActualCosts[0], amount: 55000 },
        { ...mockActualCosts[1], amount: 165000 },
      ])

      expect(store.getCostStatus()).toBe('over')
    })

    it('should return on-budget if within 5%', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts(mockActualCosts)

      expect(store.getCostStatus()).toBe('on-budget')
    })
  })

  describe('getOverBudgetItems', () => {
    beforeEach(() => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts(mockActualCosts)
    })

    it('should return items over budget', () => {
      const store = useProjectCostStore.getState()
      const overBudget = store.getOverBudgetItems()

      expect(overBudget).toHaveLength(1)
      expect(overBudget[0].itemName).toBe('Steel Work')
    })
  })

  describe('getUnderBudgetItems', () => {
    beforeEach(() => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts(mockActualCosts)
    })

    it('should return items under budget', () => {
      const store = useProjectCostStore.getState()
      const underBudget = store.getUnderBudgetItems()

      expect(underBudget).toHaveLength(1)
      expect(underBudget[0].itemName).toBe('Concrete Work')
    })
  })

  // ========================================================================
  // Utilities
  // ========================================================================

  describe('recalculate', () => {
    it('should recalculate all metrics', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts(mockActualCosts)
      store.recalculate()

      expect(store.varianceTotal).toBe(-3000)
      expect(store.costStatus).toBe('on-budget')
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useProjectCostStore.getState()
      store.setEstimatedCosts(mockEstimatedCosts)
      store.setActualCosts(mockActualCosts)

      store.reset()

      expect(store.estimatedCosts).toEqual([])
      expect(store.actualCosts).toEqual([])
      expect(store.variance).toEqual([])
      expect(store.costStatus).toBe('on-budget')
    })
  })
})
