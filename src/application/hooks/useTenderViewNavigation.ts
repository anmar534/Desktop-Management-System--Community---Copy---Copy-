/**
 * Custom hook for tender view navigation
 * Simplifies navigation between different tender views
 */

import { useCallback, useState } from 'react'
import type { Tender } from '@/data/centralData'

export type TenderView = 'list' | 'pricing' | 'details' | 'results'

/**
 * Hook for managing tender view state and navigation
 */
export function useTenderViewNavigation() {
  const [currentView, setCurrentView] = useState<TenderView>('list')
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)

  const navigateToView = useCallback((view: TenderView, tender?: Tender | null) => {
    setCurrentView(view)
    setSelectedTender(tender ?? null)
  }, [])

  const backToList = useCallback(() => {
    setCurrentView('list')
    setSelectedTender(null)
  }, [])

  const navigateToPricing = useCallback((tender: Tender) => {
    setCurrentView('pricing')
    setSelectedTender(tender)
  }, [])

  const navigateToDetails = useCallback((tender: Tender) => {
    setCurrentView('details')
    setSelectedTender(tender)
  }, [])

  const navigateToResults = useCallback((tender: Tender) => {
    setCurrentView('results')
    setSelectedTender(tender)
  }, [])

  return {
    currentView,
    selectedTender,
    setSelectedTender,
    navigateToView,
    backToList,
    navigateToPricing,
    navigateToDetails,
    navigateToResults,
  }
}
