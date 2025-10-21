/**
 * Tender Pricing Process Component
 */

import React from 'react'

interface TenderPricingProcessProps {
  onSectionChange?: (section: string) => void
}

export const TenderPricingProcess: React.FC<TenderPricingProcessProps> = ({ onSectionChange }) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Tender Pricing Process</h3>
      <p className="text-sm text-muted-foreground">Tender pricing process placeholder</p>
    </div>
  )
}

