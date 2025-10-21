/**
 * Tender Details Component
 */

import React from 'react'

interface TenderDetailsProps {
  onSectionChange?: (section: string) => void
  [key: string]: any
}

export const TenderDetails: React.FC<TenderDetailsProps> = (props) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Tender Details</h3>
      <p className="text-sm text-muted-foreground">Tender details placeholder</p>
    </div>
  )
}

