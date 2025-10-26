/**
 * 📄 Project Details Store - Details View State Management
 * Zustand store for managing project details view state
 *
 * Features:
 * - Tab management (overview, costs, budget, timeline, purchases, attachments)
 * - Edit mode state
 * - Form data management
 * - Budget comparison data
 * - Related data (tender, purchases)
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Tender } from '@/data/centralData'
import type { PurchaseOrder } from '@/shared/types/contracts'
import { projectBudgetService } from '@/application/services/projectBudgetService'
import type { ProjectBudgetComparison } from '@/application/services/projectBudgetService'

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ProjectTab = 'overview' | 'costs' | 'budget' | 'timeline' | 'purchases' | 'attachments'

export interface ProjectEditFormData {
  name: string
  client: string
  description: string
  location: string
  budget: number
  contractValue: number
  estimatedCost: number
  startDate: string
  endDate: string
  status: string
  priority: string
  progress: number
}

export interface BudgetSummary {
  totalEstimated: number
  totalActual: number
  variance: number
  variancePercentage: number
  itemsCount: number
}

export interface ProjectDetailsStore {
  // State - Tab Management
  activeTab: ProjectTab
  previousTab: ProjectTab | null

  // State - Edit Mode
  isEditing: boolean
  isDirty: boolean
  editFormData: ProjectEditFormData | null

  // State - Budget Data
  budgetComparison: ProjectBudgetComparison[]
  budgetSummary: BudgetSummary | null
  budgetLoading: boolean
  budgetError: string | null

  // State - Related Data
  relatedTender: Tender | null
  purchaseOrders: PurchaseOrder[]
  relatedDataLoading: boolean
  relatedDataError: string | null

  // Actions - Tab Management
  setActiveTab: (tab: ProjectTab) => void
  goToPreviousTab: () => void

  // Actions - Edit Mode
  setEditMode: (editing: boolean) => void
  setEditFormData: (data: ProjectEditFormData | null) => void
  updateEditFormField: <K extends keyof ProjectEditFormData>(
    field: K,
    value: ProjectEditFormData[K],
  ) => void
  setDirty: (dirty: boolean) => void
  resetEditForm: () => void

  // Actions - Budget Data
  loadBudgetComparison: (projectId: string) => Promise<void>
  setBudgetComparison: (data: ProjectBudgetComparison[]) => void
  setBudgetSummary: (summary: BudgetSummary | null) => void
  clearBudgetData: () => void

  // Actions - Related Data
  setRelatedTender: (tender: Tender | null) => void
  setPurchaseOrders: (orders: PurchaseOrder[]) => void
  setRelatedDataLoading: (loading: boolean) => void
  setRelatedDataError: (error: string | null) => void
  clearRelatedData: () => void

  // Utilities
  reset: () => void
  canSaveEdit: () => boolean
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  activeTab: 'overview' as ProjectTab,
  previousTab: null,
  isEditing: false,
  isDirty: false,
  editFormData: null,
  budgetComparison: [],
  budgetSummary: null,
  budgetLoading: false,
  budgetError: null,
  relatedTender: null,
  purchaseOrders: [],
  relatedDataLoading: false,
  relatedDataError: null,
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useProjectDetailsStore = create<ProjectDetailsStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ========================================================================
      // Tab Management
      // ========================================================================

      setActiveTab: (tab) => {
        set((state) => {
          state.previousTab = state.activeTab
          state.activeTab = tab
        })
      },

      goToPreviousTab: () => {
        const { previousTab } = get()
        if (previousTab) {
          set((state) => {
            state.activeTab = previousTab
            state.previousTab = null
          })
        }
      },

      // ========================================================================
      // Edit Mode
      // ========================================================================

      setEditMode: (editing) => {
        set((state) => {
          state.isEditing = editing
          if (!editing) {
            state.isDirty = false
          }
        })
      },

      setEditFormData: (data) => {
        set((state) => {
          state.editFormData = data
          state.isDirty = false
        })
      },

      updateEditFormField: (field, value) => {
        set((state) => {
          if (state.editFormData) {
            state.editFormData[field] = value
            state.isDirty = true
          }
        })
      },

      setDirty: (dirty) => {
        set((state) => {
          state.isDirty = dirty
        })
      },

      resetEditForm: () => {
        set((state) => {
          state.editFormData = null
          state.isDirty = false
          state.isEditing = false
        })
      },

      // ========================================================================
      // Budget Data
      // ========================================================================

      loadBudgetComparison: async (projectId) => {
        set((state) => {
          state.budgetLoading = true
          state.budgetError = null
        })

        try {
          const comparison = await projectBudgetService.compareProjectBudget(projectId)

          set((state) => {
            state.budgetComparison = comparison
            // Calculate summary from comparison data
            if (comparison.length > 0) {
              const totalEstimated = comparison.reduce(
                (sum, item) => sum + (item.estimatedCost || 0),
                0,
              )
              const totalActual = comparison.reduce((sum, item) => sum + (item.actualCost || 0), 0)
              const variance = totalEstimated - totalActual
              const variancePercentage = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0

              state.budgetSummary = {
                totalEstimated,
                totalActual,
                variance,
                variancePercentage,
                itemsCount: comparison.length,
              }
            }
            state.budgetLoading = false
            state.budgetError = null
          })
        } catch (error) {
          console.error('[projectDetailsStore] Error loading budget:', error)
          set((state) => {
            state.budgetLoading = false
            state.budgetError =
              error instanceof Error ? error.message : 'Failed to load budget data'
          })
        }
      },

      setBudgetComparison: (data) => {
        set((state) => {
          state.budgetComparison = data
        })
      },

      setBudgetSummary: (summary) => {
        set((state) => {
          state.budgetSummary = summary
        })
      },

      clearBudgetData: () => {
        set((state) => {
          state.budgetComparison = []
          state.budgetSummary = null
          state.budgetError = null
        })
      },

      // ========================================================================
      // Related Data
      // ========================================================================

      setRelatedTender: (tender) => {
        set((state) => {
          state.relatedTender = tender
        })
      },

      setPurchaseOrders: (orders) => {
        set((state) => {
          state.purchaseOrders = orders
        })
      },

      setRelatedDataLoading: (loading) => {
        set((state) => {
          state.relatedDataLoading = loading
        })
      },

      setRelatedDataError: (error) => {
        set((state) => {
          state.relatedDataError = error
        })
      },

      clearRelatedData: () => {
        set((state) => {
          state.relatedTender = null
          state.purchaseOrders = []
          state.relatedDataError = null
        })
      },

      // ========================================================================
      // Utilities
      // ========================================================================

      canSaveEdit: () => {
        const { isEditing, isDirty, editFormData } = get()

        if (!isEditing || !isDirty || !editFormData) {
          return false
        }

        // Validate required fields
        const requiredFields: (keyof ProjectEditFormData)[] = [
          'name',
          'client',
          'startDate',
          'endDate',
        ]

        return requiredFields.every((field) => {
          const value = editFormData[field]
          return value !== undefined && value !== null && value !== ''
        })
      },

      reset: () => {
        set(initialState)
      },
    })),
    { name: 'ProjectDetailsStore' },
  ),
)
