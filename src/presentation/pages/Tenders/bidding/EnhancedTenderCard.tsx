/**
 * Enhanced Tender Card Component
 */

import React from 'react'

interface EnhancedTenderCardProps {
  onSectionChange?: (section: string) => void
  [key: string]: any
}

export const EnhancedTenderCard: React.FC<EnhancedTenderCardProps> = (props) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Enhanced Tender Card</h3>
      <p className="text-sm text-muted-foreground">Enhanced tender card placeholder</p>
    </div>
  )
}

