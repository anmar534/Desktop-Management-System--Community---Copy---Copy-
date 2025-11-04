/**
 * @fileoverview Zustand store for managing tender details page state
 * @module stores/tenderDetailsStore
 *
 * This store centralizes state management for the tender details view, including:
 * - Edit mode toggle
 * - Active tab navigation
 * - Attachments state
 * - Save/cancel operations
 * - Form dirty state tracking
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Tender } from '@/data/centralData'
import type { AttachmentItem } from '@/application/hooks/useTenderAttachments'

/**
 * Available tabs in tender details view
 */
export type TenderDetailsTab =
  | 'overview'
  | 'boq'
  | 'pricing'
  | 'attachments'
  | 'financial'
  | 'history'

/**
 * State structure for tender details
 */
export interface TenderDetailsState {
  // Current tender being viewed
  tender: Tender | null

  // Original tender data (for cancel/revert)
  originalTender: Tender | null

  // Edit mode flag
  isEditMode: boolean

  // Active tab
  activeTab: TenderDetailsTab

  // Attachments state
  attachments: AttachmentItem[]
  pendingAttachments: File[]

  // Loading states
  isLoading: boolean
  isSaving: boolean

  // Error state
  error: string | null

  // Dirty state tracking
  isDirty: boolean
  dirtyFields: Set<string>
}

/**
 * Actions for tender details store
 */
export interface TenderDetailsActions {
  // Tender operations
  setTender: (tender: Tender | null) => void
  updateTender: (updates: Partial<Tender>) => void
  resetTender: () => void

  // Edit mode operations
  enterEditMode: () => void
  exitEditMode: () => void
  toggleEditMode: () => void

  // Tab navigation
  setActiveTab: (tab: TenderDetailsTab) => void
  goToNextTab: () => void
  goToPreviousTab: () => void

  // Attachments operations
  setAttachments: (attachments: AttachmentItem[]) => void
  addPendingAttachment: (file: File) => void
  removePendingAttachment: (fileName: string) => void
  clearPendingAttachments: () => void

  // Save/Cancel operations
  saveTender: () => Promise<void>
  cancelEdit: () => void

  // Dirty state tracking
  markFieldDirty: (fieldName: string) => void
  clearDirtyState: () => void

  // Loading/Error states
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void

  // Reset store
  reset: () => void
}

/**
 * Combined store type
 */
export type TenderDetailsStore = TenderDetailsState & TenderDetailsActions

/**
 * Tab order for navigation
 */
const TAB_ORDER: TenderDetailsTab[] = [
  'overview',
  'boq',
  'pricing',
  'attachments',
  'financial',
  'history',
]

/**
 * Initial state
 */
const initialState: TenderDetailsState = {
  tender: null,
  originalTender: null,
  isEditMode: false,
  activeTab: 'overview',
  attachments: [],
  pendingAttachments: [],
  isLoading: false,
  isSaving: false,
  error: null,
  isDirty: false,
  dirtyFields: new Set(),
}

/**
 * Tender details store
 * Manages state for single tender view with edit mode and tab navigation
 */
export const useTenderDetailsStore = create<TenderDetailsStore>()(
  immer((set, get) => ({
    ...initialState,

    // Tender operations
    setTender: (tender) => {
      set((state) => {
        state.tender = tender
        state.originalTender = tender ? { ...tender } : null
        state.isEditMode = false
        state.isDirty = false
        state.dirtyFields.clear()
        state.error = null
      })
    },

    updateTender: (updates) => {
      set((state) => {
        if (state.tender) {
          state.tender = { ...state.tender, ...updates }
          state.isDirty = true

          // Track which fields were updated
          Object.keys(updates).forEach((key) => {
            state.dirtyFields.add(key)
          })
        }
      })
    },

    resetTender: () => {
      set((state) => {
        state.tender = state.originalTender ? { ...state.originalTender } : null
        state.isDirty = false
        state.dirtyFields.clear()
      })
    },

    // Edit mode operations
    enterEditMode: () => {
      set((state) => {
        state.isEditMode = true
      })
    },

    exitEditMode: () => {
      set((state) => {
        state.isEditMode = false
        // Reset to original if dirty
        if (state.isDirty && state.originalTender) {
          state.tender = { ...state.originalTender }
          state.isDirty = false
          state.dirtyFields.clear()
        }
      })
    },

    toggleEditMode: () => {
      const { isEditMode } = get()
      if (isEditMode) {
        get().exitEditMode()
      } else {
        get().enterEditMode()
      }
    },

    // Tab navigation
    setActiveTab: (tab) => {
      set((state) => {
        state.activeTab = tab
      })
    },

    goToNextTab: () => {
      const { activeTab } = get()
      const currentIndex = TAB_ORDER.indexOf(activeTab)
      const nextIndex = (currentIndex + 1) % TAB_ORDER.length
      get().setActiveTab(TAB_ORDER[nextIndex])
    },

    goToPreviousTab: () => {
      const { activeTab } = get()
      const currentIndex = TAB_ORDER.indexOf(activeTab)
      const previousIndex = currentIndex === 0 ? TAB_ORDER.length - 1 : currentIndex - 1
      get().setActiveTab(TAB_ORDER[previousIndex])
    },

    // Attachments operations
    setAttachments: (attachments) => {
      set((state) => {
        state.attachments = attachments
      })
    },

    addPendingAttachment: (file) => {
      set((state) => {
        state.pendingAttachments.push(file)
        state.isDirty = true
      })
    },

    removePendingAttachment: (fileName) => {
      set((state) => {
        state.pendingAttachments = state.pendingAttachments.filter((file) => file.name !== fileName)
      })
    },

    clearPendingAttachments: () => {
      set((state) => {
        state.pendingAttachments = []
      })
    },

    // Save/Cancel operations
    saveTender: async () => {
      const { tender, isDirty } = get()

      if (!tender || !isDirty) {
        return
      }

      set((state) => {
        state.isSaving = true
        state.error = null
      })

      try {
        // TODO: Implement actual save logic via service
        // await TenderService.update(tender.id, tender);

        set((state) => {
          state.originalTender = state.tender ? { ...state.tender } : null
          state.isDirty = false
          state.dirtyFields.clear()
          state.isEditMode = false
          state.isSaving = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to save tender'
          state.isSaving = false
        })
        throw error
      }
    },

    cancelEdit: () => {
      set((state) => {
        state.tender = state.originalTender ? { ...state.originalTender } : null
        state.isDirty = false
        state.dirtyFields.clear()
        state.isEditMode = false
        state.pendingAttachments = []
      })
    },

    // Dirty state tracking
    markFieldDirty: (fieldName) => {
      set((state) => {
        state.dirtyFields.add(fieldName)
        state.isDirty = true
      })
    },

    clearDirtyState: () => {
      set((state) => {
        state.isDirty = false
        state.dirtyFields.clear()
      })
    },

    // Loading/Error states
    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading
      })
    },

    setSaving: (saving) => {
      set((state) => {
        state.isSaving = saving
      })
    },

    setError: (error) => {
      set((state) => {
        state.error = error
      })
    },

    // Reset store
    reset: () => {
      set({
        ...initialState,
        dirtyFields: new Set(), // Create fresh Set to avoid sharing mutable reference
      })
    },
  })),
)

/**
 * Selectors for common state access patterns
 */
export const tenderDetailsSelectors = {
  /**
   * Check if tender can be saved
   */
  canSave: (state: TenderDetailsStore) => state.tender !== null && state.isDirty && !state.isSaving,

  /**
   * Check if user can exit edit mode
   */
  canExitEditMode: (state: TenderDetailsStore) => !state.isDirty || state.isSaving,

  /**
   * Get current tab index
   */
  currentTabIndex: (state: TenderDetailsStore) => TAB_ORDER.indexOf(state.activeTab),

  /**
   * Check if current tab is first
   */
  isFirstTab: (state: TenderDetailsStore) => state.activeTab === TAB_ORDER[0],

  /**
   * Check if current tab is last
   */
  isLastTab: (state: TenderDetailsStore) => state.activeTab === TAB_ORDER[TAB_ORDER.length - 1],

  /**
   * Get total attachments count (existing + pending)
   */
  totalAttachmentsCount: (state: TenderDetailsStore) =>
    state.attachments.length + state.pendingAttachments.length,

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges: (state: TenderDetailsStore) =>
    state.isDirty || state.pendingAttachments.length > 0,
}
