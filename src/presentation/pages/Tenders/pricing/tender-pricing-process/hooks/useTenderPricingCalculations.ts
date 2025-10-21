/**
 * useTenderPricingCalculations Hook
 */

export interface TenderPricingCalculations {
  basePrice: number
  margin: number
  totalPrice: number
}

export const useTenderPricingCalculations = () => {
  const calculatePrice = (basePrice: number, margin: number): TenderPricingCalculations => {
    return {
      basePrice,
      margin,
      totalPrice: basePrice * (1 + margin / 100)
    }
  }

  return {
    calculatePrice
  }
}

