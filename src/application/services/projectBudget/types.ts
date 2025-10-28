/**
 * Project Budget Types
 * Type definitions for project budget service
 */

import type { PricingResource } from '@/shared/utils/pricing/pricingHelpers'

/**
 * Estimated pricing data from tender
 */
export interface EstimatedPricingData {
  materials: {
    id: string
    name: string
    description: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
    wastePercentage?: number
  }[]
  labor: {
    id: string
    description: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  equipment: {
    id: string
    description: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  subcontractors: {
    id: string
    description: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  additionalPercentages: {
    administrative: number
    operational: number
    profit: number
  }
  finalPrice: number
  estimatedTotal: number
}

/**
 * Project budget comparison result
 */
export interface ProjectBudgetComparison {
  itemId: string
  description: string
  unit: string
  quantity: number

  // البيانات التقديرية من المنافسة
  estimated: {
    materials: number
    labor: number
    equipment: number
    subcontractors: number
    administrative: number
    operational: number
    profit: number
    total: number
    unitPrice: number
  }

  // البيانات الفعلية من المشروع
  actual: {
    materials: number
    labor: number
    equipment: number
    subcontractors: number
    total: number
    unitPrice: number
  }

  // الفرق والتحليل
  variance: {
    amount: number
    percentage: number
    status: 'over-budget' | 'under-budget' | 'on-budget'
    alerts: string[]
  }
}

/**
 * Budget summary statistics
 */
export interface ProjectBudgetSummary {
  totalItems: number
  estimatedTotal: number
  actualTotal: number
  totalVariance: number
  totalVariancePercentage: number
  overBudgetItems: number
  underBudgetItems: number
  onBudgetItems: number
  criticalAlerts: number
}

/**
 * Re-export PricingResource for internal use
 */
export type { PricingResource }
