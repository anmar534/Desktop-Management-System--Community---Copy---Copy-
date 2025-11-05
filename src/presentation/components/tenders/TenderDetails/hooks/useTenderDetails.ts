// useTenderDetails Hook
// Manages tender state and data loading
// Phase 2: Migrated to Zustand Store (Week 1 - Day 1)

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTenderPricingStore } from '@/stores/tenderPricingStore'
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

  // Phase 2: Use Zustand Store instead of useUnifiedTenderPricing
  const { boqItems, loadPricing, getTotalValue } = useTenderPricingStore()
  const { formatCurrencyValue } = useCurrencyFormatter()

  // Load pricing when tender changes
  useEffect(() => {
    if (tender?.id) {
      void loadPricing(tender.id)
    }
  }, [tender?.id, loadPricing])

  // Create unified interface for compatibility
  const unified = useMemo(() => {
    const items = boqItems.map((item, idx) => ({
      ...item,
      description: item.description || item.canonicalDescription || `البند ${idx + 1}`,
      canonicalDescription: item.canonicalDescription || item.description,
      unitPrice: item.unitPrice ?? item.estimated?.unitPrice ?? 0,
      totalPrice: item.totalPrice ?? item.estimated?.totalPrice ?? 0,
      quantity: item.quantity ?? item.estimated?.quantity ?? 0,
    }))

    const totalValue = getTotalValue()
    const hasPricing = items.some((it) => it.unitPrice > 0 || it.totalPrice > 0)

    return {
      status: items.length > 0 ? 'ready' : 'empty',
      items,
      totals: hasPricing ? { totalValue } : null,
      meta: null,
      source: 'central-boq',
      refresh: () => loadPricing(tender.id),
    }
  }, [boqItems, getTotalValue, loadPricing, tender.id])

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
