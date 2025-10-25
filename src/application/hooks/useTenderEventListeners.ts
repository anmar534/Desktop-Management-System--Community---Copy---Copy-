/**
 * Custom hooks for tender page event listeners
 */

import { useEffect, useRef } from 'react'
import type { Tender } from '@/data/centralData'
import { APP_EVENTS } from '@/events/bus'
import { safeLocalStorage } from '@/shared/utils/storage/storage'

export interface TenderEventDetail {
  tenderId?: string
  itemId?: string
}

const OPEN_PRICING_EVENT = 'openPricingForTender' as const

/**
 * Hook for handling tender detail navigation via events
 */
export function useTenderDetailNavigation(tenders: Tender[], onNavigate: (tender: Tender) => void) {
  useEffect(() => {
    const handler: EventListener = (event) => {
      const detail = (event as CustomEvent<TenderEventDetail>).detail
      const tenderId = detail?.tenderId
      if (!tenderId) return

      const targetTender = tenders.find((item) => item.id === tenderId)
      if (!targetTender) return

      onNavigate(targetTender)
    }

    window.addEventListener(APP_EVENTS.OPEN_TENDER_DETAILS, handler)
    return () => {
      window.removeEventListener(APP_EVENTS.OPEN_TENDER_DETAILS, handler)
    }
  }, [tenders, onNavigate])
}

/**
 * Hook for handling tender updates with debouncing and refresh prevention
 */
export function useTenderUpdateListener(refreshTenders: () => Promise<void>) {
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const onUpdated = (event?: Event) => {
      console.log('🔍 [TendersPage onUpdated] Event received:', {
        hasEvent: !!event,
        isCustomEvent: event instanceof CustomEvent,
        detail: event instanceof CustomEvent ? event.detail : undefined,
        skipRefresh: event instanceof CustomEvent ? event.detail?.skipRefresh : undefined,
      })

      // Fix #2: فحص skipRefresh flag لمنع reload غير ضروري
      if (event instanceof CustomEvent && event.detail?.skipRefresh === true) {
        console.log('⏭️ تخطي إعادة التحميل - skipRefresh flag موجود')
        return
      }

      // Fix #1: منع re-entrance (Event Loop Guard)
      if (isRefreshingRef.current) {
        console.log('⏭️ تخطي إعادة التحميل - جاري التحميل بالفعل')
        return
      }

      // Fix #1: debounce لتجميع multiple updates في 500ms
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      refreshTimeoutRef.current = setTimeout(() => {
        isRefreshingRef.current = true
        console.log('🔄 تم تحديث بيانات المناقصات - إعادة التحميل')
        void refreshTenders().finally(() => {
          isRefreshingRef.current = false
        })
      }, 500)
    }

    window.addEventListener(APP_EVENTS.TENDERS_UPDATED, onUpdated)
    window.addEventListener(APP_EVENTS.TENDER_UPDATED, onUpdated)

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      window.removeEventListener(APP_EVENTS.TENDERS_UPDATED, onUpdated)
      window.removeEventListener(APP_EVENTS.TENDER_UPDATED, onUpdated)
    }
  }, [refreshTenders])
}

/**
 * Hook for handling pricing navigation via events
 */
export function useTenderPricingNavigation(
  tenders: Tender[],
  onNavigate: (tender: Tender, itemId?: string) => void,
) {
  useEffect(() => {
    const handler: EventListener = (event) => {
      const detail = (event as CustomEvent<TenderEventDetail>).detail
      const tenderId = detail?.tenderId
      if (!tenderId) return

      const targetTender = tenders.find((item) => item.id === tenderId)
      if (!targetTender) return

      // Store itemId in localStorage if provided
      if (detail?.itemId) {
        try {
          safeLocalStorage.setItem('pricing:selectedItemId', detail.itemId)
        } catch (storageError) {
          console.warn('تعذر حفظ معرف بند التسعير المحدد', storageError)
        }
      }

      onNavigate(targetTender, detail?.itemId)
    }

    window.addEventListener(OPEN_PRICING_EVENT, handler)
    return () => {
      window.removeEventListener(OPEN_PRICING_EVENT, handler)
    }
  }, [tenders, onNavigate])
}
