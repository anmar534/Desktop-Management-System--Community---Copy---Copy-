// useTenderDetails Hook
// Manages tender state and data loading

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useUnifiedTenderPricing } from '@/application/hooks/useUnifiedTenderPricing.store'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { APP_EVENTS } from '@/events/bus'
import type { CollapsedSections, TabValue, QuantityItem } from '../types'

export function useTenderDetails(tender: any) {
  const [activeTab, setActiveTab] = useState<TabValue>('general')
  const [localTender, setLocalTender] = useState(tender)
  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>({})

  // تحديث البيانات المحلية عند تغيير tender
  useEffect(() => {
    setLocalTender(tender)
  }, [tender])

  // الاستماع لأحداث تحديث المنافسة لتحديث البيانات المحلية
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent
      const updatedTender = customEvent.detail
      if (updatedTender && updatedTender.id === tender.id) {
        setLocalTender(updatedTender)
      }
    }

    window.addEventListener(APP_EVENTS.TENDER_UPDATED, handler)

    return () => {
      window.removeEventListener(APP_EVENTS.TENDER_UPDATED, handler)
    }
  }, [tender.id])

  // Unified pricing data hook
  const unified = useUnifiedTenderPricing(tender)
  const { formatCurrencyValue } = useCurrencyFormatter()

  // Quantity formatter
  const quantityFormatter = useMemo(
    () =>
      new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  )

  const formatQuantity = useCallback(
    (value: number | null | undefined, options?: Intl.NumberFormatOptions) => {
      if (value === null || value === undefined) {
        return '0'
      }
      const numericValue = typeof value === 'number' ? value : Number(value)
      if (!Number.isFinite(numericValue)) {
        return '0'
      }
      if (options) {
        return new Intl.NumberFormat('ar-SA', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          ...options,
        }).format(numericValue)
      }
      return quantityFormatter.format(numericValue)
    },
    [quantityFormatter],
  )

  // دالة لتبديل حالة الطي لقسم معين في بند معين
  const toggleCollapse = useCallback(
    (itemId: string, section: 'materials' | 'labor' | 'equipment' | 'subcontractors') => {
      setCollapsedSections((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [section]: !prev[itemId]?.[section],
        },
      }))
    },
    [],
  )

  // استخراج بيانات الكميات
  const quantityItems: QuantityItem[] = useMemo(() => {
    return (unified.items || []) as QuantityItem[]
  }, [unified.items])

  // حسابات الإكمال
  const isPricingCompleted = useMemo(() => {
    const pricedItems = localTender?.pricedItems || 0
    const totalItems = localTender?.totalItems || 0
    return pricedItems > 0 && totalItems > 0 && pricedItems >= totalItems
  }, [localTender?.pricedItems, localTender?.totalItems])

  return {
    activeTab,
    setActiveTab,
    localTender,
    setLocalTender,
    collapsedSections,
    toggleCollapse,
    unified,
    formatCurrencyValue,
    formatQuantity,
    quantityItems,
    isPricingCompleted,
  }
}
