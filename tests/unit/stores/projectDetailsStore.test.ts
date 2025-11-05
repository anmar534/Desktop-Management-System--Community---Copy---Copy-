/**
 * Tests for projectDetailsStore
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjectDetailsStore } from '@/application/stores/projectDetailsStore'
import type { ProjectEditFormData } from '@/application/stores/projectDetailsStore'

// Mock data
const mockEditFormData: ProjectEditFormData = {
  name: 'Test Project',
  client: 'Test Client',
  description: 'Test Description',
  location: 'Test Location',
  budget: 100000,
  contractValue: 120000,
  estimatedCost: 95000,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  status: 'active',
  priority: 'high',
  progress: 50,
}

describe('projectDetailsStore', () => {
  beforeEach(() => {
    useProjectDetailsStore.getState().reset()
  })

  // ========================================================================
  // Initial State
  // ========================================================================

  describe('Initial State', () => {
    it('should have overview as active tab', () => {
      const { activeTab } = useProjectDetailsStore.getState()
      expect(activeTab).toBe('overview')
    })

    it('should not be in edit mode', () => {
      const { isEditing } = useProjectDetailsStore.getState()
      expect(isEditing).toBe(false)
    })

    it('should have null edit form data', () => {
      const { editFormData } = useProjectDetailsStore.getState()
      expect(editFormData).toBeNull()
    })

    it('should have empty budget data', () => {
      const { budgetComparison, budgetSummary } = useProjectDetailsStore.getState()
      expect(budgetComparison).toEqual([])
      expect(budgetSummary).toBeNull()
    })
  })

  // ========================================================================
  // Tab Management
  // ========================================================================

  describe('setActiveTab', () => {
    it('should change active tab', () => {
      useProjectDetailsStore.getState().setActiveTab('costs')
      const store = useProjectDetailsStore.getState()

      expect(store.activeTab).toBe('costs')
    })

    it('should save previous tab', () => {
      useProjectDetailsStore.getState().setActiveTab('costs')
      useProjectDetailsStore.getState().setActiveTab('budget')
      const store = useProjectDetailsStore.getState()

      expect(store.previousTab).toBe('costs')
    })
  })

  describe('goToPreviousTab', () => {
    it('should go back to previous tab', () => {
      useProjectDetailsStore.getState().setActiveTab('costs')
      useProjectDetailsStore.getState().setActiveTab('budget')
      useProjectDetailsStore.getState().goToPreviousTab()
      const store = useProjectDetailsStore.getState()

      expect(store.activeTab).toBe('costs')
    })

    it('should do nothing if no previous tab', () => {
      const store = useProjectDetailsStore.getState()
      const currentTab = store.activeTab
      store.goToPreviousTab()

      expect(store.activeTab).toBe(currentTab)
    })
  })

  // ========================================================================
  // Edit Mode
  // ========================================================================

  describe('setEditMode', () => {
    it('should enable edit mode', () => {
      useProjectDetailsStore.getState().setEditMode(true)
      const store = useProjectDetailsStore.getState()

      expect(store.isEditing).toBe(true)
    })

    it('should disable edit mode and clear dirty flag', () => {
      const store = useProjectDetailsStore.getState()
      store.setEditMode(true)
      store.setDirty(true)
      store.setEditMode(false)

      expect(store.isEditing).toBe(false)
      expect(store.isDirty).toBe(false)
    })
  })

  describe('setEditFormData', () => {
    it('should set form data', () => {
      useProjectDetailsStore.getState().setEditFormData(mockEditFormData)
      const store = useProjectDetailsStore.getState()

      expect(store.editFormData).toEqual(mockEditFormData)
    })

    it('should reset dirty flag', () => {
      const store = useProjectDetailsStore.getState()
      store.setDirty(true)
      store.setEditFormData(mockEditFormData)

      expect(store.isDirty).toBe(false)
    })
  })

  describe('updateEditFormField', () => {
    beforeEach(() => {
      useProjectDetailsStore.getState().setEditFormData(mockEditFormData)
    })

    it('should update single field', () => {
      useProjectDetailsStore.getState().updateEditFormField('name', 'Updated Name')
      const store = useProjectDetailsStore.getState()

      expect(store.editFormData?.name).toBe('Updated Name')
    })

    it('should set dirty flag', () => {
      useProjectDetailsStore.getState().updateEditFormField('progress', 75)
      const store = useProjectDetailsStore.getState()

      expect(store.isDirty).toBe(true)
    })

    it('should do nothing if no form data', () => {
      const store = useProjectDetailsStore.getState()
      store.setEditFormData(null)

      expect(() => {
        store.updateEditFormField('name', 'Test')
      }).not.toThrow()
    })
  })

  describe('setDirty', () => {
    it('should set dirty flag', () => {
      useProjectDetailsStore.getState().setDirty(true)
      const store = useProjectDetailsStore.getState()

      expect(store.isDirty).toBe(true)
    })

    it('should clear dirty flag', () => {
      const store = useProjectDetailsStore.getState()
      store.setDirty(true)
      store.setDirty(false)

      expect(store.isDirty).toBe(false)
    })
  })

  describe('resetEditForm', () => {
    it('should reset all edit state', () => {
      const store = useProjectDetailsStore.getState()
      store.setEditFormData(mockEditFormData)
      store.setEditMode(true)
      store.setDirty(true)

      store.resetEditForm()

      expect(store.editFormData).toBeNull()
      expect(store.isDirty).toBe(false)
      expect(store.isEditing).toBe(false)
    })
  })

  // ========================================================================
  // Budget Data
  // ========================================================================

  describe('setBudgetComparison', () => {
    it('should set budget comparison data', () => {
      const mockData: any[] = [{ item: 'Test', estimatedCost: 1000, actualCost: 900 }]
      useProjectDetailsStore.getState().setBudgetComparison(mockData)
      const store = useProjectDetailsStore.getState()

      expect(store.budgetComparison).toEqual(mockData)
    })
  })

  describe('setBudgetSummary', () => {
    it('should set budget summary', () => {
      const summary = {
        totalEstimated: 10000,
        totalActual: 9500,
        variance: 500,
        variancePercentage: 5,
        itemsCount: 10,
      }
      useProjectDetailsStore.getState().setBudgetSummary(summary)
      const store = useProjectDetailsStore.getState()

      expect(store.budgetSummary).toEqual(summary)
    })
  })

  describe('clearBudgetData', () => {
    it('should clear all budget data', () => {
      const store = useProjectDetailsStore.getState()
      store.setBudgetComparison([{ item: 'Test' } as any])
      store.setBudgetSummary({
        totalEstimated: 1000,
        totalActual: 900,
        variance: 100,
        variancePercentage: 10,
        itemsCount: 1,
      })

      store.clearBudgetData()

      expect(store.budgetComparison).toEqual([])
      expect(store.budgetSummary).toBeNull()
      expect(store.budgetError).toBeNull()
    })
  })

  // ========================================================================
  // Related Data
  // ========================================================================

  describe('setRelatedTender', () => {
    it('should set related tender', () => {
      const tender: any = { id: 'tender-1', name: 'Test Tender' }
      useProjectDetailsStore.getState().setRelatedTender(tender)
      const store = useProjectDetailsStore.getState()

      expect(store.relatedTender).toEqual(tender)
    })
  })

  describe('setPurchaseOrders', () => {
    it('should set purchase orders', () => {
      const orders: any[] = [{ id: 'po-1', number: 'PO-001' }]
      useProjectDetailsStore.getState().setPurchaseOrders(orders)
      const store = useProjectDetailsStore.getState()

      expect(store.purchaseOrders).toEqual(orders)
    })
  })

  describe('setRelatedDataLoading', () => {
    it('should set loading state', () => {
      useProjectDetailsStore.getState().setRelatedDataLoading(true)
      const store = useProjectDetailsStore.getState()

      expect(store.relatedDataLoading).toBe(true)
    })
  })

  describe('setRelatedDataError', () => {
    it('should set error message', () => {
      useProjectDetailsStore.getState().setRelatedDataError('Test error')
      const store = useProjectDetailsStore.getState()

      expect(store.relatedDataError).toBe('Test error')
    })
  })

  describe('clearRelatedData', () => {
    it('should clear all related data', () => {
      const store = useProjectDetailsStore.getState()
      store.setRelatedTender({ id: 'tender-1' } as any)
      store.setPurchaseOrders([{ id: 'po-1' } as any])
      store.setRelatedDataError('Error')

      store.clearRelatedData()

      expect(store.relatedTender).toBeNull()
      expect(store.purchaseOrders).toEqual([])
      expect(store.relatedDataError).toBeNull()
    })
  })

  // ========================================================================
  // Utilities
  // ========================================================================

  describe('canSaveEdit', () => {
    it('should return false if not editing', () => {
      const store = useProjectDetailsStore.getState()
      store.setEditFormData(mockEditFormData)
      store.setDirty(true)

      expect(store.canSaveEdit()).toBe(false)
    })

    it('should return false if not dirty', () => {
      const store = useProjectDetailsStore.getState()
      store.setEditMode(true)
      store.setEditFormData(mockEditFormData)

      expect(store.canSaveEdit()).toBe(false)
    })

    it('should return false if no form data', () => {
      const store = useProjectDetailsStore.getState()
      store.setEditMode(true)
      store.setDirty(true)

      expect(store.canSaveEdit()).toBe(false)
    })

    it('should return false if required fields missing', () => {
      const store = useProjectDetailsStore.getState()
      store.setEditMode(true)
      store.setEditFormData({ ...mockEditFormData, name: '' })
      store.setDirty(true)

      expect(store.canSaveEdit()).toBe(false)
    })

    it('should return true if all conditions met', () => {
      const store = useProjectDetailsStore.getState()
      store.setEditMode(true)
      store.setEditFormData(mockEditFormData)
      store.setDirty(true)

      expect(store.canSaveEdit()).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useProjectDetailsStore.getState()
      store.setActiveTab('costs')
      store.setEditMode(true)
      store.setEditFormData(mockEditFormData)
      store.setBudgetComparison([{ item: 'Test' } as any])

      store.reset()

      expect(store.activeTab).toBe('overview')
      expect(store.isEditing).toBe(false)
      expect(store.editFormData).toBeNull()
      expect(store.budgetComparison).toEqual([])
    })
  })
})
