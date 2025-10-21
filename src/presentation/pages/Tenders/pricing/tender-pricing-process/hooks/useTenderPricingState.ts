/**
 * useTenderPricingState Hook
 */

import React from 'react'

export interface TenderPricingState {
  basePrice: number
  margin: number
  totalPrice: number
}

export const useTenderPricingState = () => {
  const [state, setState] = React.useState<TenderPricingState>({
    basePrice: 0,
    margin: 0,
    totalPrice: 0
  })

  const updatePrice = (basePrice: number, margin: number) => {
    setState({
      basePrice,
      margin,
      totalPrice: basePrice * (1 + margin / 100)
    })
  }

  return {
    state,
    updatePrice
  }
}

