/**
 * @fileoverview Custom hook for pricing form state management
 * @module hooks/usePricingForm
 *
 * Manages form state for tender pricing including:
 * - Current pricing data for active item
 * - Default percentages and their input states
 * - Form validation state
 * - Dirty state tracking
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PricingData, PricingPercentages } from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'
import {
  DEFAULT_PRICING_PERCENTAGES,
  percentagesToInputStrings,
} from '@/presentation/pages/Tenders/TenderPricing/utils/tenderPricingHelpers'

interface UsePricingFormOptions {
  currentItem: QuantityItem | undefined
  pricingData: Map<string, PricingData>
  onDirty?: () => void
}

interface UsePricingFormReturn {
  // Current pricing state
  currentPricing: PricingData
  setCurrentPricing: (pricing: PricingData) => void

  // Default percentages
  defaultPercentages: PricingPercentages
  setDefaultPercentages: (percentages: PricingPercentages) => void
  defaultPercentagesInput: {
    administrative: string
    operational: string
    profit: string
  }
  setDefaultPercentagesInput: (input: {
    administrative: string
    operational: string
    profit: string
  }) => void

  // Form state
  isFormValid: boolean
  isDirty: boolean

  // Actions
  resetForm: () => void
  loadItemPricing: (itemId: string) => void
}

const EMPTY_PRICING: PricingData = {
  materials: [],
  labor: [],
  equipment: [],
  subcontractors: [],
  technicalNotes: '',
  additionalPercentages: {
    administrative: DEFAULT_PRICING_PERCENTAGES.administrative,
    operational: DEFAULT_PRICING_PERCENTAGES.operational,
    profit: DEFAULT_PRICING_PERCENTAGES.profit,
  },
  completed: false,
}

/**
 * Custom hook for managing pricing form state
 */
export function usePricingForm({
  currentItem,
  pricingData,
  onDirty,
}: UsePricingFormOptions): UsePricingFormReturn {
  // Default percentages state
  const [defaultPercentages, setDefaultPercentages] = useState<PricingPercentages>(
    DEFAULT_PRICING_PERCENTAGES,
  )

  const [defaultPercentagesInput, setDefaultPercentagesInput] = useState(
    percentagesToInputStrings(DEFAULT_PRICING_PERCENTAGES),
  )

  // Current pricing state
  const [currentPricing, setCurrentPricing] = useState<PricingData>({
    ...EMPTY_PRICING,
    additionalPercentages: {
      administrative: defaultPercentages.administrative,
      operational: defaultPercentages.operational,
      profit: defaultPercentages.profit,
    },
  })

  // Dirty tracking
  const [isDirty, setIsDirty] = useState(false)

  // Load pricing data for current item
  const loadItemPricing = useCallback(
    (itemId: string) => {
      const saved = pricingData.get(itemId)
      if (saved) {
        setCurrentPricing(saved)
      } else {
        setCurrentPricing({
          ...EMPTY_PRICING,
          additionalPercentages: {
            administrative: defaultPercentages.administrative,
            operational: defaultPercentages.operational,
            profit: defaultPercentages.profit,
          },
        })
      }
    },
    [pricingData, defaultPercentages],
  )

  // Load pricing when current item changes
  useEffect(() => {
    if (currentItem) {
      loadItemPricing(currentItem.id)
    }
  }, [currentItem, loadItemPricing])

  // Form validation
  const isFormValid = useMemo(() => {
    // Check if at least one pricing section has data OR direct price is set
    const hasDetailedPricing =
      currentPricing.materials.length > 0 ||
      currentPricing.labor.length > 0 ||
      currentPricing.equipment.length > 0 ||
      currentPricing.subcontractors.length > 0

    const hasDirectPricing =
      currentPricing.pricingMethod === 'direct' &&
      currentPricing.directUnitPrice !== undefined &&
      currentPricing.directUnitPrice > 0

    return hasDetailedPricing || hasDirectPricing
  }, [currentPricing])

  // Track form changes
  useEffect(() => {
    setIsDirty(true)
    onDirty?.()
  }, [currentPricing, onDirty])

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentPricing({
      ...EMPTY_PRICING,
      additionalPercentages: {
        administrative: defaultPercentages.administrative,
        operational: defaultPercentages.operational,
        profit: defaultPercentages.profit,
      },
    })
    setIsDirty(false)
  }, [defaultPercentages])

  return {
    currentPricing,
    setCurrentPricing,
    defaultPercentages,
    setDefaultPercentages,
    defaultPercentagesInput,
    setDefaultPercentagesInput,
    isFormValid,
    isDirty,
    resetForm,
    loadItemPricing,
  }
}
