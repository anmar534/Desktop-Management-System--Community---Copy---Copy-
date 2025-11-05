/**
 * @fileoverview Custom hook for pricing form state management
 * @module hooks/usePricingForm
 *
 * Manages form state for tender pricing including:
 * - Current pricing data for active item
 * - Default percentages and their input states (Week 2 Day 3: now from Store)
 * - Form validation state
 * - Dirty state tracking
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { PricingData, PricingPercentages } from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'
import {
  DEFAULT_PRICING_PERCENTAGES,
  percentagesToInputStrings,
} from '@/presentation/pages/Tenders/TenderPricing/utils/tenderPricingHelpers'
// Week 2 Day 3: Import Store to get defaultPercentages
import { useTenderPricingStore } from '@/stores/tenderPricingStore'

interface UsePricingFormOptions {
  currentItem: QuantityItem | undefined
  pricingData: Map<string, PricingData>
  onDirty?: () => void
}

interface UsePricingFormReturn {
  // Current pricing state
  currentPricing: PricingData
  setCurrentPricing: Dispatch<SetStateAction<PricingData>>

  // Default percentages
  defaultPercentages: PricingPercentages
  setDefaultPercentages: Dispatch<SetStateAction<PricingPercentages>>
  defaultPercentagesInput: {
    administrative: string
    operational: string
    profit: string
  }
  setDefaultPercentagesInput: Dispatch<
    SetStateAction<{
      administrative: string
      operational: string
      profit: string
    }>
  >

  // Form state
  isFormValid: boolean
  isDirty: boolean

  // Actions
  resetForm: () => void
  loadItemPricing: (itemId: string) => void
}

/**
 * Helper to create empty pricing with given percentages
 * Ensures consistent initialization across the hook
 */
const createEmptyPricing = (percentages: PricingPercentages): PricingData => ({
  materials: [],
  labor: [],
  equipment: [],
  subcontractors: [],
  technicalNotes: '',
  additionalPercentages: {
    administrative: percentages.administrative,
    operational: percentages.operational,
    profit: percentages.profit,
  },
  completed: false,
})

/**
 * Custom hook for managing pricing form state
 * Week 2 Day 3: Now uses Store's defaultPercentages instead of local state
 */
export function usePricingForm({
  currentItem,
  pricingData,
  onDirty,
}: UsePricingFormOptions): UsePricingFormReturn {
  // Week 2 Day 3: Get defaultPercentages from Store (Single Source of Truth)
  // Week 4 Day 3: Removed wrapper - Store.setDefaultPercentages now supports updater functions
  const defaultPercentages = useTenderPricingStore((state) => state.defaultPercentages)
  const setDefaultPercentages = useTenderPricingStore((state) => state.setDefaultPercentages)

  // Input strings state (still local - UI only)
  const [defaultPercentagesInput, setDefaultPercentagesInput] = useState(
    percentagesToInputStrings(defaultPercentages),
  )

  // Current pricing state - initialized with default percentages
  const [currentPricing, setCurrentPricing] = useState<PricingData>(() =>
    createEmptyPricing(DEFAULT_PRICING_PERCENTAGES),
  )

  // Dirty tracking
  const [isDirty, setIsDirty] = useState(false)
  const [cleanPricing, setCleanPricing] = useState<PricingData | null>(null)

  // Load pricing data for current item
  const loadItemPricing = useCallback(
    (itemId: string) => {
      const saved = pricingData.get(itemId)
      if (saved) {
        setCurrentPricing(saved)
        setCleanPricing(saved)
        setIsDirty(false)
      } else {
        // Use defaultPercentages state as single source of truth
        const emptyPricing = createEmptyPricing(defaultPercentages)
        setCurrentPricing(emptyPricing)
        setCleanPricing(emptyPricing)
        setIsDirty(false)
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

  // Track form changes - only mark dirty when there's an actual change from clean state
  useEffect(() => {
    if (cleanPricing && currentPricing !== cleanPricing) {
      setIsDirty(true)
      onDirty?.()
    }
  }, [currentPricing, cleanPricing, onDirty])

  // Reset form - uses defaultPercentages as single source of truth
  const resetForm = useCallback(() => {
    setCurrentPricing(createEmptyPricing(defaultPercentages))
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
