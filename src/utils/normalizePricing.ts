/**
 * Normalize Pricing Utility
 */

export interface PricingData {
  basePrice: number
  discount?: number
  tax?: number
  total?: number
}

export const normalizePricing = (pricing: PricingData): PricingData => {
  const discount = pricing.discount || 0
  const tax = pricing.tax || 0
  const total = pricing.basePrice - discount + tax
  return {
    ...pricing,
    total
  }
}

export const buildPricingMap = (pricingList: PricingData[]): Map<string, PricingData> => {
  const map = new Map<string, PricingData>()
  pricingList.forEach((pricing, index) => {
    map.set(`pricing_${index}`, pricing)
  })
  return map
}

