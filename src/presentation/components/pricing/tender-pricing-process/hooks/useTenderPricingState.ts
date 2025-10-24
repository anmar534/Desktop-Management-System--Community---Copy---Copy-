import { useCallback, useState } from 'react'

import type { PricingViewName } from '../types'
import { isPricingViewName } from '../types'

export type PricingView = PricingViewName

interface UseTenderPricingStateOptions {
  isDirty: boolean
  onBack: () => void
  tenderId?: string | number
}

export interface TenderPricingState {
  currentItemIndex: number
  setCurrentItemIndex: (index: number) => void
  currentView: PricingView
  changeView: (value: string) => void
  markDirty: () => void
  isLeaveDialogOpen: boolean
  requestLeave: () => void
  cancelLeaveRequest: () => void
  confirmLeave: () => void
}

export const useTenderPricingState = ({
  isDirty,
  onBack,
  tenderId,
}: UseTenderPricingStateOptions): TenderPricingState => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [currentView, setCurrentView] = useState<PricingView>('summary')
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

  // markDirty is now handled automatically by the Zustand store when updateItemPricing is called
  const markDirty = useCallback(() => {
    // No-op: The store automatically marks as dirty when items are updated
    console.log('[useTenderPricingState] markDirty called (handled by store)', tenderId)
  }, [tenderId])

  const changeView = useCallback((value: string) => {
    if (isPricingViewName(value)) {
      setCurrentView(value)
    }
  }, [])

  const cancelLeaveRequest = useCallback(() => {
    setIsLeaveDialogOpen(false)
  }, [])

  const confirmLeave = useCallback(() => {
    setIsLeaveDialogOpen(false)
    onBack()
  }, [onBack])

  const requestLeave = useCallback(() => {
    if (isDirty) {
      setIsLeaveDialogOpen(true)
      return
    }

    onBack()
  }, [isDirty, onBack])

  return {
    currentItemIndex,
    setCurrentItemIndex,
    currentView,
    changeView,
    markDirty,
    isLeaveDialogOpen,
    requestLeave,
    cancelLeaveRequest,
    confirmLeave,
  }
}
