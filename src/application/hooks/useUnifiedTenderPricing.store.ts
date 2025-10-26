/**
 * Unified Tender Pricing Hook (Store-based)
 * Thin wrapper around TenderPricingStore
 */
import { useEffect, useCallback } from 'react'
import { useTenderPricingStore, computed } from '@/stores/tenderPricing'

export interface UnifiedTenderPricingResult {
  status: 'loading' | 'ready' | 'empty' | 'error'
  items: unknown[]
  totals: unknown | null
  meta: unknown | null
  source: 'central-boq' | 'legacy' | 'none'
  refresh: () => Promise<void>
  error?: unknown
  divergence?: { hasDivergence: boolean }
}

export function useUnifiedTenderPricing(tender: unknown): UnifiedTenderPricingResult {
  const tenderId = (tender as { id?: string })?.id

  // Store state
  const loadPricingData = useTenderPricingStore((state) => state.loadPricingData)
  const boqItems = useTenderPricingStore((state) => state.boqItems)
  const isLoading = useTenderPricingStore((state) => state.isLoading)
  const error = useTenderPricingStore((state) => state.error)

  // Computed values
  const totals = useTenderPricingStore(computed.getTotalValue)

  // Load on mount
  useEffect(() => {
    if (tenderId) {
      loadPricingData(tenderId)
    }
  }, [tenderId, loadPricingData])

  // Refresh callback
  const refresh = useCallback(async () => {
    if (tenderId) {
      await loadPricingData(tenderId)
    }
  }, [tenderId, loadPricingData])

  // Status
  const status = isLoading ? 'loading' : error ? 'error' : boqItems.length > 0 ? 'ready' : 'empty'

  return {
    status,
    items: boqItems,
    totals,
    meta: null,
    source: 'central-boq',
    refresh,
    error,
    divergence: { hasDivergence: false },
  }
}
