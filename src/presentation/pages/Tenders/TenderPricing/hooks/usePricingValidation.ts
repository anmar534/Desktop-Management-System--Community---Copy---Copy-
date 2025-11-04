/**
 * @fileoverview Custom hook for pricing validation
 * @module hooks/usePricingValidation
 *
 * Provides validation logic for pricing data
 */

import { useMemo } from 'react'
import type { PricingData } from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'

interface UsePricingValidationOptions {
  currentPricing: PricingData
  currentItem?: QuantityItem
  pricingData: Map<string, PricingData>
  quantityItems: QuantityItem[]
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface UsePricingValidationReturn {
  // Current item validation
  isCurrentItemValid: boolean
  currentItemErrors: string[]
  currentItemWarnings: string[]

  // Overall validation
  overallValidation: ValidationResult
  completedCount: number
  completionPercentage: number

  // Helpers
  canSubmitTender: boolean
  canSaveCurrentItem: boolean
}

/**
 * Custom hook for pricing validation
 */
export function usePricingValidation({
  currentPricing,
  currentItem,
  pricingData,
  quantityItems,
}: UsePricingValidationOptions): UsePricingValidationReturn {
  // Validate current item
  const currentItemValidation = useMemo<ValidationResult>(() => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!currentItem) {
      return { isValid: false, errors: ['لا يوجد بند محدد'], warnings: [] }
    }

    // Check pricing method
    if (!currentPricing.pricingMethod) {
      errors.push('يجب تحديد طريقة التسعير (مباشر أو تفصيلي)')
    }

    // Validate direct pricing
    if (currentPricing.pricingMethod === 'direct') {
      if (!currentPricing.directUnitPrice || currentPricing.directUnitPrice <= 0) {
        errors.push('يجب إدخال سعر الوحدة للتسعير المباشر')
      }
    }

    // Validate detailed pricing
    if (currentPricing.pricingMethod === 'detailed') {
      const hasAnyPricing =
        currentPricing.materials.length > 0 ||
        currentPricing.labor.length > 0 ||
        currentPricing.equipment.length > 0 ||
        currentPricing.subcontractors.length > 0

      if (!hasAnyPricing) {
        errors.push('يجب إضافة بيانات تسعير تفصيلية (مواد، عمالة، معدات، أو مقاولين باطن)')
      }

      // Check for rows with zero or negative values
      currentPricing.materials.forEach((row) => {
        if (row.price !== undefined && row.price <= 0) {
          warnings.push(`يوجد صف مواد بسعر صفر أو سالب: ${row.description || 'بدون وصف'}`)
        }
        if (row.quantity !== undefined && row.quantity <= 0) {
          warnings.push(`يوجد صف مواد بكمية صفر أو سالبة: ${row.description || 'بدون وصف'}`)
        }
      })

      currentPricing.labor.forEach((row) => {
        if (row.price !== undefined && row.price <= 0) {
          warnings.push(`يوجد صف عمالة بسعر صفر أو سالب: ${row.description || 'بدون وصف'}`)
        }
      })

      currentPricing.equipment.forEach((row) => {
        if (row.price !== undefined && row.price <= 0) {
          warnings.push(`يوجد صف معدات بسعر صفر أو سالب: ${row.description || 'بدون وصف'}`)
        }
      })

      currentPricing.subcontractors.forEach((row) => {
        if (row.price !== undefined && row.price <= 0) {
          warnings.push(`يوجد صف مقاول باطن بسعر صفر أو سالب: ${row.description || 'بدون وصف'}`)
        }
      })
    }

    // Check percentages
    const percentages = currentPricing.additionalPercentages
    if (percentages) {
      if (percentages.administrative < 0 || percentages.administrative > 100) {
        errors.push('نسبة التكاليف الإدارية يجب أن تكون بين 0 و 100')
      }
      if (percentages.operational < 0 || percentages.operational > 100) {
        errors.push('نسبة التكاليف التشغيلية يجب أن تكون بين 0 و 100')
      }
      if (percentages.profit < 0 || percentages.profit > 100) {
        errors.push('نسبة الربح يجب أن تكون بين 0 و 100')
      }

      const totalPercentage =
        percentages.administrative + percentages.operational + percentages.profit
      if (totalPercentage > 150) {
        warnings.push(`مجموع النسب مرتفع جداً (${totalPercentage.toFixed(1)}%)`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }, [currentPricing, currentItem])

  // Overall validation
  const overallValidation = useMemo<ValidationResult>(() => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if all items are priced (informational only - completion tracked separately)
    const unpricedItems = quantityItems.filter((item) => {
      const pricing = pricingData.get(item.id)
      return !pricing || !pricing.completed
    })

    if (unpricedItems.length > 0) {
      warnings.push(`يوجد ${unpricedItems.length} بند لم يتم تسعيره بعد`)
    }

    // Check for items with invalid pricing
    quantityItems.forEach((item) => {
      const pricing = pricingData.get(item.id)
      if (pricing) {
        if (
          pricing.pricingMethod === 'direct' &&
          (!pricing.directUnitPrice || pricing.directUnitPrice <= 0)
        ) {
          errors.push(`البند "${item.description}" يحتوي على سعر مباشر غير صالح`)
        }

        if (pricing.pricingMethod === 'detailed') {
          const hasAnyPricing =
            pricing.materials.length > 0 ||
            pricing.labor.length > 0 ||
            pricing.equipment.length > 0 ||
            pricing.subcontractors.length > 0

          if (!hasAnyPricing) {
            errors.push(`البند "${item.description}" لا يحتوي على بيانات تسعير تفصيلية`)
          }
        }
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }, [quantityItems, pricingData])

  // Count completed items
  const completedCount = useMemo(() => {
    return Array.from(pricingData.values()).filter((value) => value?.completed === true).length
  }, [pricingData])

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (quantityItems.length === 0) {
      return 0
    }
    return (completedCount / quantityItems.length) * 100
  }, [completedCount, quantityItems.length])

  // Helper: Can save current item?
  const canSaveCurrentItem = useMemo(() => {
    return currentItemValidation.isValid
  }, [currentItemValidation.isValid])

  // Helper: Can submit tender?
  const canSubmitTender = useMemo(() => {
    return overallValidation.isValid && completionPercentage === 100
  }, [overallValidation.isValid, completionPercentage])

  return {
    isCurrentItemValid: currentItemValidation.isValid,
    currentItemErrors: currentItemValidation.errors,
    currentItemWarnings: currentItemValidation.warnings,
    overallValidation,
    completedCount,
    completionPercentage,
    canSubmitTender,
    canSaveCurrentItem,
  }
}
