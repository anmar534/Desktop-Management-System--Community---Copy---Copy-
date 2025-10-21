/**
 * TenderPricingTabs Component
 */

import React from 'react'

interface TenderPricingTabsProps {
  onSectionChange?: (section: string) => void
  [key: string]: any
}

export const TenderPricingTabs: React.FC<TenderPricingTabsProps> = (props) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">TenderPricingTabs</h3>
      <p className="text-sm text-muted-foreground">TenderPricingTabs placeholder</p>
    </div>
  )
}

