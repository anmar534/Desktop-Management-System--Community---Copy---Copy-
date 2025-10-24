/**
 * usePricingEventHandlers Hook
 *
 * Provides simple event handlers for pricing form interactions.
 * Handles:
 * - View switching (summary/pricing/technical)
 * - Execution method changes
 * - Percentage adjustments with bounds checking
 * - Technical notes updates
 *
 * @module presentation/pages/Tenders/TenderPricing/hooks
 */

import { useCallback } from 'react'
import type { PricingData, PricingPercentages, ExecutionMethod } from '@/shared/types/pricing'
import type { PricingViewName } from '@/presentation/pages/Tenders/TenderPricing/types'

export interface UsePricingEventHandlersParams {
  /**
   * Setter for current pricing state
   */
  setCurrentPricing: React.Dispatch<React.SetStateAction<PricingData>>

  /**
   * Function to mark tender as modified
   */
  markDirty: () => void

  /**
   * Function to change the active view
   */
  changeView: (view: PricingViewName) => void
}

export interface UsePricingEventHandlersReturn {
  /**
   * Handle view change (summary/pricing/technical)
   */
  handleViewChange: (value: PricingViewName) => void

  /**
   * Handle execution method change
   */
  handleExecutionMethodChange: (value: ExecutionMethod) => void

  /**
   * Handle percentage change with bounds checking (0-100)
   */
  handlePercentageChange: (key: keyof PricingPercentages, value: number) => void

  /**
   * Handle technical notes change
   */
  handleTechnicalNotesChange: (value: string) => void
}

/**
 * Hook to manage simple event handlers for pricing form.
 *
 * All handlers automatically mark the tender as dirty (modified) when called.
 *
 * @example
 * ```tsx
 * const {
 *   handleViewChange,
 *   handleExecutionMethodChange,
 *   handlePercentageChange,
 *   handleTechnicalNotesChange
 * } = usePricingEventHandlers({
 *   setCurrentPricing,
 *   markDirty,
 *   changeView
 * })
 * ```
 */
export function usePricingEventHandlers({
  setCurrentPricing,
  markDirty,
  changeView,
}: UsePricingEventHandlersParams): UsePricingEventHandlersReturn {
  /**
   * Handle view change between summary, pricing, and technical views
   */
  const handleViewChange = useCallback(
    (value: PricingViewName) => {
      changeView(value)
    },
    [changeView],
  )

  /**
   * Handle execution method change (direct/subcontractor)
   */
  const handleExecutionMethodChange = useCallback(
    (value: ExecutionMethod) => {
      setCurrentPricing((prev) => {
        const next = { ...prev, executionMethod: value }
        markDirty()
        return next
      })
    },
    [markDirty, setCurrentPricing],
  )

  /**
   * Handle percentage change with automatic bounds checking (0-100)
   * Ensures percentages stay within valid range
   */
  const handlePercentageChange = useCallback(
    (key: keyof PricingPercentages, value: number) => {
      setCurrentPricing((prev) => {
        const next = {
          ...prev,
          additionalPercentages: {
            ...prev.additionalPercentages,
            [key]: Math.max(0, Math.min(100, value)),
          },
        }
        markDirty()
        return next
      })
    },
    [markDirty, setCurrentPricing],
  )

  /**
   * Handle technical notes text change
   */
  const handleTechnicalNotesChange = useCallback(
    (value: string) => {
      setCurrentPricing((prev) => {
        const next = { ...prev, technicalNotes: value }
        markDirty()
        return next
      })
    },
    [markDirty, setCurrentPricing],
  )

  return {
    handleViewChange,
    handleExecutionMethodChange,
    handlePercentageChange,
    handleTechnicalNotesChange,
  }
}
