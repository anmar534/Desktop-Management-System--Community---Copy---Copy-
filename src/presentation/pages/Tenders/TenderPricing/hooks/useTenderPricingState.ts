import { useCallback, useState } from 'react'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

import type { EditableTenderPricingResult } from '@/application/hooks/useEditableTenderPricing'
import type { PricingViewName } from '@/presentation/pages/Tenders/TenderPricing/types'
import { isPricingViewName } from '@/presentation/pages/Tenders/TenderPricing/types'

export type PricingView = PricingViewName

interface UseTenderPricingStateOptions {
  editablePricing: EditableTenderPricingResult
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
  editablePricing,
  onBack,
  tenderId,
}: UseTenderPricingStateOptions): TenderPricingState => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [currentView, setCurrentView] = useState<PricingView>('summary')
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const auditKey =
    typeof tenderId === 'number' || typeof tenderId === 'string'
      ? String(tenderId)
      : 'unknown-tender'

  const markDirty = useCallback(() => {
    try {
      if (editablePricing.status === 'ready') {
        editablePricing.markDirty?.()
      }
    } catch (error) {
      void recordAuditEvent({
        category: 'tender-pricing',
        action: 'mark-dirty-failed',
        key: auditKey,
        level: 'warning',
        status: 'error',
        metadata: {
          message: error instanceof Error ? error.message : 'unknown-error',
        },
      })
    }
  }, [editablePricing, auditKey])

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
    if (editablePricing.dirty || editablePricing.isDraftNewer) {
      setIsLeaveDialogOpen(true)
      return
    }

    onBack()
  }, [editablePricing.dirty, editablePricing.isDraftNewer, onBack])

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
