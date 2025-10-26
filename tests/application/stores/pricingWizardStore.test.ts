/**
 * @fileoverview Tests for pricingWizardStore
 * @module tests/stores/pricingWizardStore
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  usePricingWizardStore,
  pricingWizardSelectors,
} from '@/application/stores/pricingWizardStore'

describe('pricingWizardStore', () => {
  // Reset store before each test
  beforeEach(() => {
    usePricingWizardStore.getState().reset()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = usePricingWizardStore.getState()

      expect(state.currentStep).toBe('boq-review')
      expect(state.currentStepIndex).toBe(0)
      expect(state.completedSteps.size).toBe(0)
      expect(state.tenderId).toBeNull()
      expect(state.pricingData.itemPrices).toEqual({})
      expect(state.draftId).toBeNull()
      expect(state.isDraftSaved).toBe(false)
      expect(state.lastSavedAt).toBeNull()
      expect(state.autoSaveEnabled).toBe(true)
      expect(state.stepValidations.size).toBe(0)
      expect(state.isLoading).toBe(false)
      expect(state.isSaving).toBe(false)
      expect(state.isSubmitting).toBe(false)
      expect(state.error).toBeNull()
      expect(state.totalSteps).toBe(5)
    })
  })

  describe('Wizard Navigation', () => {
    it('should go to specific step', () => {
      const { goToStep } = usePricingWizardStore.getState()

      goToStep('pricing')

      const state = usePricingWizardStore.getState()
      expect(state.currentStep).toBe('pricing')
      expect(state.currentStepIndex).toBe(1)
    })

    it('should go to next step', () => {
      const { goToNextStep } = usePricingWizardStore.getState()

      goToNextStep()

      const state = usePricingWizardStore.getState()
      expect(state.currentStep).toBe('pricing')
      expect(state.currentStepIndex).toBe(1)
    })

    it('should not go beyond last step', () => {
      const { goToStep, goToNextStep } = usePricingWizardStore.getState()

      goToStep('submission')
      goToNextStep()

      const state = usePricingWizardStore.getState()
      expect(state.currentStep).toBe('submission')
      expect(state.currentStepIndex).toBe(4)
    })

    it('should go to previous step', () => {
      const { goToStep, goToPreviousStep } = usePricingWizardStore.getState()

      goToStep('pricing')
      goToPreviousStep()

      const state = usePricingWizardStore.getState()
      expect(state.currentStep).toBe('boq-review')
      expect(state.currentStepIndex).toBe(0)
    })

    it('should not go before first step', () => {
      const { goToPreviousStep } = usePricingWizardStore.getState()

      goToPreviousStep()

      const state = usePricingWizardStore.getState()
      expect(state.currentStep).toBe('boq-review')
      expect(state.currentStepIndex).toBe(0)
    })

    it('should complete current step', () => {
      const { completeCurrentStep } = usePricingWizardStore.getState()

      completeCurrentStep()

      const state = usePricingWizardStore.getState()
      expect(state.completedSteps.has('boq-review')).toBe(true)
    })

    it('should reset wizard', () => {
      const { goToStep, completeCurrentStep, resetWizard } = usePricingWizardStore.getState()

      goToStep('pricing')
      completeCurrentStep()
      resetWizard()

      const state = usePricingWizardStore.getState()
      expect(state.currentStep).toBe('boq-review')
      expect(state.currentStepIndex).toBe(0)
      expect(state.completedSteps.size).toBe(0)
    })
  })

  describe('Tender Context', () => {
    it('should set tender ID', () => {
      const { setTenderId } = usePricingWizardStore.getState()

      setTenderId('tender-123')

      expect(usePricingWizardStore.getState().tenderId).toBe('tender-123')
    })
  })

  describe('Pricing Data Operations', () => {
    it('should set pricing data', () => {
      const { setPricingData } = usePricingWizardStore.getState()

      setPricingData({ indirectCosts: 5000, profitMargin: 15 })

      const state = usePricingWizardStore.getState()
      expect(state.pricingData.indirectCosts).toBe(5000)
      expect(state.pricingData.profitMargin).toBe(15)
      expect(state.isDraftSaved).toBe(false)
    })

    it('should set item price', () => {
      const { setItemPrice } = usePricingWizardStore.getState()

      setItemPrice('item-1', 1000)

      const state = usePricingWizardStore.getState()
      expect(state.pricingData.itemPrices['item-1']).toBe(1000)
      expect(state.isDraftSaved).toBe(false)
    })

    it('should update existing item price', () => {
      const { setItemPrice } = usePricingWizardStore.getState()

      setItemPrice('item-1', 1000)
      setItemPrice('item-1', 1500)

      expect(usePricingWizardStore.getState().pricingData.itemPrices['item-1']).toBe(1500)
    })

    it('should remove item price', () => {
      const { setItemPrice, removeItemPrice } = usePricingWizardStore.getState()

      setItemPrice('item-1', 1000)
      removeItemPrice('item-1')

      expect(usePricingWizardStore.getState().pricingData.itemPrices['item-1']).toBeUndefined()
    })

    it('should clear all pricing data', () => {
      const { setItemPrice, setPricingData, clearPricingData } = usePricingWizardStore.getState()

      setItemPrice('item-1', 1000)
      setPricingData({ indirectCosts: 5000 })
      clearPricingData()

      const state = usePricingWizardStore.getState()
      expect(state.pricingData.itemPrices).toEqual({})
      expect(state.pricingData.indirectCosts).toBeUndefined()
    })
  })

  describe('Draft Operations', () => {
    it('should mark draft as unsaved when pricing data changes', () => {
      const { setItemPrice } = usePricingWizardStore.getState()

      setItemPrice('item-1', 1000)

      expect(usePricingWizardStore.getState().isDraftSaved).toBe(false)
    })

    it('should set auto-save enabled', () => {
      const { setAutoSave } = usePricingWizardStore.getState()

      setAutoSave(false)
      expect(usePricingWizardStore.getState().autoSaveEnabled).toBe(false)

      setAutoSave(true)
      expect(usePricingWizardStore.getState().autoSaveEnabled).toBe(true)
    })
  })

  describe('Validation', () => {
    it('should validate BOQ review step - invalid without tender', () => {
      const { validateStep } = usePricingWizardStore.getState()

      const validation = validateStep('boq-review')

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('No tender selected')
    })

    it('should validate BOQ review step - valid with tender', () => {
      const { setTenderId, validateStep } = usePricingWizardStore.getState()

      setTenderId('tender-123')
      const validation = validateStep('boq-review')

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should validate pricing step - invalid without items', () => {
      const { validateStep } = usePricingWizardStore.getState()

      const validation = validateStep('pricing')

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('No items priced yet')
    })

    it('should validate pricing step - valid with priced items', () => {
      const { setItemPrice, validateStep } = usePricingWizardStore.getState()

      setItemPrice('item-1', 1000)
      setItemPrice('item-2', 2000)
      const validation = validateStep('pricing')

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should validate pricing step - warning for zero prices', () => {
      const { setItemPrice, validateStep } = usePricingWizardStore.getState()

      setItemPrice('item-1', 0)
      setItemPrice('item-2', 1000)
      const validation = validateStep('pricing')

      expect(validation.isValid).toBe(true) // Valid but has warnings
      expect(validation.warnings).toHaveLength(1)
    })

    it('should validate costs step - invalid with negative indirect costs', () => {
      const { setPricingData, validateStep } = usePricingWizardStore.getState()

      setPricingData({ indirectCosts: -1000 })
      const validation = validateStep('costs')

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Indirect costs cannot be negative')
    })

    it('should validate costs step - invalid with profit margin > 100', () => {
      const { setPricingData, validateStep } = usePricingWizardStore.getState()

      setPricingData({ profitMargin: 150 })
      const validation = validateStep('costs')

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should validate costs step - valid with correct values', () => {
      const { setPricingData, validateStep } = usePricingWizardStore.getState()

      setPricingData({ indirectCosts: 5000, profitMargin: 15, taxRate: 14 })
      const validation = validateStep('costs')

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should validate review step - invalid without completed steps', () => {
      const { validateStep } = usePricingWizardStore.getState()

      const validation = validateStep('review')

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should validate all steps', () => {
      const {
        setTenderId,
        setItemPrice,
        setPricingData,
        completeCurrentStep,
        goToStep,
        validateAllSteps,
      } = usePricingWizardStore.getState()

      // Setup valid data for all steps
      setTenderId('tender-123')
      completeCurrentStep() // Complete boq-review

      goToStep('pricing')
      setItemPrice('item-1', 1000)
      completeCurrentStep() // Complete pricing

      goToStep('costs')
      setPricingData({ indirectCosts: 5000, profitMargin: 15 })
      completeCurrentStep() // Complete costs

      const allValid = validateAllSteps()

      expect(allValid).toBe(true)
    })
  })

  describe('Loading/Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = usePricingWizardStore.getState()

      setLoading(true)
      expect(usePricingWizardStore.getState().isLoading).toBe(true)

      setLoading(false)
      expect(usePricingWizardStore.getState().isLoading).toBe(false)
    })

    it('should set error state', () => {
      const { setError } = usePricingWizardStore.getState()

      setError('Test error')
      expect(usePricingWizardStore.getState().error).toBe('Test error')

      setError(null)
      expect(usePricingWizardStore.getState().error).toBeNull()
    })
  })

  describe('Reset Store', () => {
    it('should reset store to initial state', () => {
      const { setTenderId, setItemPrice, goToStep, completeCurrentStep, reset } =
        usePricingWizardStore.getState()

      setTenderId('tender-123')
      setItemPrice('item-1', 1000)
      goToStep('pricing')
      completeCurrentStep()

      reset()

      const state = usePricingWizardStore.getState()
      expect(state.currentStep).toBe('boq-review')
      expect(state.tenderId).toBeNull()
      expect(state.pricingData.itemPrices).toEqual({})
      expect(state.completedSteps.size).toBe(0)
    })
  })

  describe('Selectors', () => {
    it('isCurrentStepValid should return false for invalid step', () => {
      const { validateStep } = usePricingWizardStore.getState()

      validateStep('boq-review') // Will be invalid (no tender)

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.isCurrentStepValid(state)).toBe(false)
    })

    it('isCurrentStepValid should return true for valid step', () => {
      const { setTenderId, validateStep } = usePricingWizardStore.getState()

      setTenderId('tender-123')
      validateStep('boq-review')

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.isCurrentStepValid(state)).toBe(true)
    })

    it('canGoNext should return true when not on last step', () => {
      const state = usePricingWizardStore.getState()

      expect(pricingWizardSelectors.canGoNext(state)).toBe(true)
    })

    it('canGoNext should return false on last step', () => {
      const { goToStep } = usePricingWizardStore.getState()

      goToStep('submission')

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.canGoNext(state)).toBe(false)
    })

    it('canGoPrevious should return false on first step', () => {
      const state = usePricingWizardStore.getState()

      expect(pricingWizardSelectors.canGoPrevious(state)).toBe(false)
    })

    it('canGoPrevious should return true when not on first step', () => {
      const { goToStep } = usePricingWizardStore.getState()

      goToStep('pricing')

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.canGoPrevious(state)).toBe(true)
    })

    it('getProgress should calculate correct percentage', () => {
      const { completeCurrentStep, goToStep } = usePricingWizardStore.getState()

      completeCurrentStep() // 1/5 = 20%
      goToStep('pricing')
      completeCurrentStep() // 2/5 = 40%

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.getProgress(state)).toBe(40)
    })

    it('isStepCompleted should return correct status', () => {
      const { completeCurrentStep } = usePricingWizardStore.getState()

      completeCurrentStep()

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.isStepCompleted(state, 'boq-review')).toBe(true)
      expect(pricingWizardSelectors.isStepCompleted(state, 'pricing')).toBe(false)
    })

    it('getPricedItemsCount should return correct count', () => {
      const { setItemPrice } = usePricingWizardStore.getState()

      setItemPrice('item-1', 1000)
      setItemPrice('item-2', 2000)
      setItemPrice('item-3', 3000)

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.getPricedItemsCount(state)).toBe(3)
    })

    it('getTotalDirectCost should calculate correct sum', () => {
      const { setItemPrice } = usePricingWizardStore.getState()

      setItemPrice('item-1', 1000)
      setItemPrice('item-2', 2000)
      setItemPrice('item-3', 3000)

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.getTotalDirectCost(state)).toBe(6000)
    })

    it('hasUnsavedChanges should return false when no changes', () => {
      const state = usePricingWizardStore.getState()

      expect(pricingWizardSelectors.hasUnsavedChanges(state)).toBe(false)
    })

    it('hasUnsavedChanges should return true with unsaved data', () => {
      const { setItemPrice } = usePricingWizardStore.getState()

      setItemPrice('item-1', 1000)

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.hasUnsavedChanges(state)).toBe(true)
    })

    it('isWizardComplete should return false when not all steps completed', () => {
      const { completeCurrentStep } = usePricingWizardStore.getState()

      completeCurrentStep()

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.isWizardComplete(state)).toBe(false)
    })

    it('isWizardComplete should return true when all steps completed', () => {
      const { completeCurrentStep, goToStep } = usePricingWizardStore.getState()

      completeCurrentStep() // boq-review
      goToStep('pricing')
      completeCurrentStep() // pricing
      goToStep('costs')
      completeCurrentStep() // costs
      goToStep('review')
      completeCurrentStep() // review
      goToStep('submission')
      completeCurrentStep() // submission

      const state = usePricingWizardStore.getState()
      expect(pricingWizardSelectors.isWizardComplete(state)).toBe(true)
    })
  })
})
