/**
 * @fileoverview Zustand store for managing pricing wizard state
 * @module stores/pricingWizardStore
 *
 * This store centralizes state management for the pricing wizard, including:
 * - Multi-step wizard navigation
 * - Draft management (save/load/auto-save)
 * - Validation state per step
 * - Progress tracking
 * - BOQ pricing data
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

/**
 * Wizard step identifiers
 */
export type WizardStep =
  | 'boq-review' // مراجعة جدول الكميات
  | 'pricing' // التسعير
  | 'costs' // التكاليف الإضافية
  | 'review' // المراجعة النهائية
  | 'submission' // التقديم

/**
 * Step validation result
 */
export interface StepValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Draft metadata
 */
export interface DraftMetadata {
  id: string
  tenderId: string
  createdAt: string
  updatedAt: string
  stepCompleted: WizardStep
}

/**
 * Pricing data structure
 */
export interface PricingData {
  // BOQ pricing
  itemPrices: Record<string, number>

  // Additional costs
  indirectCosts?: number
  profitMargin?: number
  taxRate?: number

  // Metadata
  notes?: string
  lastModified?: string
}

/**
 * State structure for pricing wizard
 */
export interface PricingWizardState {
  // Wizard navigation
  currentStep: WizardStep
  completedSteps: Set<WizardStep>

  // Tender context
  tenderId: string | null

  // Pricing data
  pricingData: PricingData

  // Draft management
  draftId: string | null
  isDraftSaved: boolean
  lastSavedAt: string | null
  autoSaveEnabled: boolean

  // Validation
  stepValidations: Map<WizardStep, StepValidation>

  // Loading states
  isLoading: boolean
  isSaving: boolean
  isSubmitting: boolean

  // Error state
  error: string | null

  // Progress tracking
  totalSteps: number
  currentStepIndex: number
}

/**
 * Actions for pricing wizard store
 */
export interface PricingWizardActions {
  // Wizard navigation
  goToStep: (step: WizardStep) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  completeCurrentStep: () => void
  resetWizard: () => void

  // Tender context
  setTenderId: (tenderId: string) => void

  // Pricing data operations
  setPricingData: (data: Partial<PricingData>) => void
  setItemPrice: (itemId: string, price: number) => void
  removeItemPrice: (itemId: string) => void
  clearPricingData: () => void

  // Draft operations
  saveDraft: () => Promise<void>
  loadDraft: (draftId: string) => Promise<void>
  deleteDraft: () => Promise<void>
  setAutoSave: (enabled: boolean) => void

  // Validation
  validateStep: (step: WizardStep) => StepValidation
  validateAllSteps: () => boolean
  setStepValidation: (step: WizardStep, validation: StepValidation) => void

  // Submission
  submitPricing: () => Promise<void>

  // Loading/Error states
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Reset store
  reset: () => void
}

/**
 * Combined store type
 */
export type PricingWizardStore = PricingWizardState & PricingWizardActions

/**
 * Wizard steps order
 */
const WIZARD_STEPS: WizardStep[] = ['boq-review', 'pricing', 'costs', 'review', 'submission']

/**
 * Initial state
 */
const initialState: PricingWizardState = {
  currentStep: 'boq-review',
  completedSteps: new Set(),
  tenderId: null,
  pricingData: {
    itemPrices: {},
  },
  draftId: null,
  isDraftSaved: false,
  lastSavedAt: null,
  autoSaveEnabled: true,
  stepValidations: new Map(),
  isLoading: false,
  isSaving: false,
  isSubmitting: false,
  error: null,
  totalSteps: WIZARD_STEPS.length,
  currentStepIndex: 0,
}

/**
 * Validate BOQ review step
 */
function validateBOQReview(state: PricingWizardState): StepValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!state.tenderId) {
    errors.push('No tender selected')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate pricing step
 */
function validatePricing(state: PricingWizardState): StepValidation {
  const errors: string[] = []
  const warnings: string[] = []

  const { itemPrices } = state.pricingData
  const pricedItemsCount = Object.keys(itemPrices).length

  if (pricedItemsCount === 0) {
    errors.push('No items priced yet')
  }

  // Check for zero or negative prices
  const invalidPrices = Object.entries(itemPrices).filter(([_, price]) => price <= 0)
  if (invalidPrices.length > 0) {
    warnings.push(`${invalidPrices.length} item(s) have zero or negative prices`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate costs step
 */
function validateCosts(state: PricingWizardState): StepValidation {
  const errors: string[] = []
  const warnings: string[] = []

  const { indirectCosts, profitMargin, taxRate } = state.pricingData

  if (indirectCosts !== undefined && indirectCosts < 0) {
    errors.push('Indirect costs cannot be negative')
  }

  if (profitMargin !== undefined && (profitMargin < 0 || profitMargin > 100)) {
    errors.push('Profit margin must be between 0 and 100')
  }

  if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
    errors.push('Tax rate must be between 0 and 100')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate review step
 */
function validateReview(state: PricingWizardState): StepValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Check all previous steps are completed
  const requiredSteps: WizardStep[] = ['boq-review', 'pricing', 'costs']
  const incompleteSteps = requiredSteps.filter((step) => !state.completedSteps.has(step))

  if (incompleteSteps.length > 0) {
    errors.push(`Complete all previous steps: ${incompleteSteps.join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Pricing wizard store
 * Manages state for multi-step pricing wizard with draft management
 */
export const usePricingWizardStore = create<PricingWizardStore>()(
  immer((set, get) => ({
    ...initialState,

    // Wizard navigation
    goToStep: (step) => {
      const stepIndex = WIZARD_STEPS.indexOf(step)
      if (stepIndex === -1) return

      set((state) => {
        state.currentStep = step
        state.currentStepIndex = stepIndex
      })
    },

    goToNextStep: () => {
      const { currentStepIndex } = get()
      const nextIndex = currentStepIndex + 1

      if (nextIndex < WIZARD_STEPS.length) {
        get().goToStep(WIZARD_STEPS[nextIndex])
      }
    },

    goToPreviousStep: () => {
      const { currentStepIndex } = get()
      const previousIndex = currentStepIndex - 1

      if (previousIndex >= 0) {
        get().goToStep(WIZARD_STEPS[previousIndex])
      }
    },

    completeCurrentStep: () => {
      const { currentStep } = get()

      set((state) => {
        state.completedSteps.add(currentStep)
      })
    },

    resetWizard: () => {
      set((state) => {
        state.currentStep = 'boq-review'
        state.currentStepIndex = 0
        state.completedSteps.clear()
      })
    },

    // Tender context
    setTenderId: (tenderId) => {
      set((state) => {
        state.tenderId = tenderId
      })
    },

    // Pricing data operations
    setPricingData: (data) => {
      set((state) => {
        state.pricingData = { ...state.pricingData, ...data }
        state.isDraftSaved = false
      })
    },

    setItemPrice: (itemId, price) => {
      set((state) => {
        state.pricingData.itemPrices[itemId] = price
        state.isDraftSaved = false
      })
    },

    removeItemPrice: (itemId) => {
      set((state) => {
        delete state.pricingData.itemPrices[itemId]
        state.isDraftSaved = false
      })
    },

    clearPricingData: () => {
      set((state) => {
        state.pricingData = { itemPrices: {} }
        state.isDraftSaved = false
      })
    },

    // Draft operations
    saveDraft: async () => {
      const { tenderId } = get()

      if (!tenderId) {
        throw new Error('No tender selected')
      }

      set((state) => {
        state.isSaving = true
        state.error = null
      })

      try {
        // TODO: Implement actual save logic via service
        // const { pricingData, currentStep } = get();
        // const draft = await PricingDraftService.save(tenderId, pricingData, currentStep);

        set((state) => {
          // state.draftId = draft.id;
          state.isDraftSaved = true
          state.lastSavedAt = new Date().toISOString()
          state.isSaving = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to save draft'
          state.isSaving = false
        })
        throw error
      }
    },

    loadDraft: async (_draftId: string) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        // TODO: Implement actual load logic via service
        // const draft = await PricingDraftService.load(draftId);

        set((state) => {
          // state.draftId = draft.id;
          // state.tenderId = draft.tenderId;
          // state.pricingData = draft.data;
          // state.currentStep = draft.stepCompleted;
          state.isDraftSaved = true
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to load draft'
          state.isLoading = false
        })
        throw error
      }
    },

    deleteDraft: async () => {
      const { draftId } = get()

      if (!draftId) return

      try {
        // TODO: Implement actual delete logic via service
        // await PricingDraftService.delete(draftId);

        set((state) => {
          state.draftId = null
          state.isDraftSaved = false
          state.lastSavedAt = null
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete draft'
        })
        throw error
      }
    },

    setAutoSave: (enabled) => {
      set((state) => {
        state.autoSaveEnabled = enabled
      })
    },

    // Validation
    validateStep: (step) => {
      const state = get()
      let validation: StepValidation

      switch (step) {
        case 'boq-review':
          validation = validateBOQReview(state)
          break
        case 'pricing':
          validation = validatePricing(state)
          break
        case 'costs':
          validation = validateCosts(state)
          break
        case 'review':
          validation = validateReview(state)
          break
        default:
          validation = { isValid: true, errors: [], warnings: [] }
      }

      get().setStepValidation(step, validation)
      return validation
    },

    validateAllSteps: () => {
      const allValid = WIZARD_STEPS.every((step) => {
        const validation = get().validateStep(step)
        return validation.isValid
      })

      return allValid
    },

    setStepValidation: (step, validation) => {
      set((state) => {
        state.stepValidations.set(step, validation)
      })
    },

    // Submission
    submitPricing: async () => {
      const { tenderId, validateAllSteps } = get()

      if (!tenderId) {
        throw new Error('No tender selected')
      }

      if (!validateAllSteps()) {
        throw new Error('Please fix all validation errors before submitting')
      }

      set((state) => {
        state.isSubmitting = true
        state.error = null
      })

      try {
        // TODO: Implement actual submission logic via service
        // const { pricingData } = get();
        // await TenderPricingService.submit(tenderId, pricingData);

        set((state) => {
          state.isSubmitting = false
          state.completedSteps.add('submission')
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to submit pricing'
          state.isSubmitting = false
        })
        throw error
      }
    },

    // Loading/Error states
    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading
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
        completedSteps: new Set(),
        stepValidations: new Map(),
      })
    },
  })),
)

/**
 * Selectors for common state access patterns
 */
export const pricingWizardSelectors = {
  /**
   * Check if current step is valid
   */
  isCurrentStepValid: (state: PricingWizardStore) => {
    const validation = state.stepValidations.get(state.currentStep)
    return validation ? validation.isValid : false
  },

  /**
   * Check if can go to next step
   */
  canGoNext: (state: PricingWizardStore) => {
    return state.currentStepIndex < state.totalSteps - 1
  },

  /**
   * Check if can go to previous step
   */
  canGoPrevious: (state: PricingWizardStore) => {
    return state.currentStepIndex > 0
  },

  /**
   * Get progress percentage
   */
  getProgress: (state: PricingWizardStore) => {
    return (state.completedSteps.size / state.totalSteps) * 100
  },

  /**
   * Check if step is completed
   */
  isStepCompleted: (state: PricingWizardStore, step: WizardStep) => {
    return state.completedSteps.has(step)
  },

  /**
   * Get total priced items count
   */
  getPricedItemsCount: (state: PricingWizardStore) => {
    return Object.keys(state.pricingData.itemPrices).length
  },

  /**
   * Get total direct cost (sum of all item prices)
   */
  getTotalDirectCost: (state: PricingWizardStore) => {
    return Object.values(state.pricingData.itemPrices).reduce((sum, price) => sum + price, 0)
  },

  /**
   * Check if has unsaved changes
   */
  hasUnsavedChanges: (state: PricingWizardStore) => {
    return (
      !state.isDraftSaved &&
      state.pricingData.itemPrices &&
      Object.keys(state.pricingData.itemPrices).length > 0
    )
  },

  /**
   * Check if wizard is complete (all steps completed)
   */
  isWizardComplete: (state: PricingWizardStore) => {
    return state.completedSteps.size === state.totalSteps
  },
}
