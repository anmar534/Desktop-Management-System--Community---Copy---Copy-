/**
 * Financial Summary Card Component
 */

import React from 'react'

interface FinancialSummaryCardProps {
  onSectionChange?: (section: string) => void
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({ onSectionChange }) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Financial Summary</h3>
      <p className="text-sm text-muted-foreground">Financial summary placeholder</p>
    </div>
  )
}

