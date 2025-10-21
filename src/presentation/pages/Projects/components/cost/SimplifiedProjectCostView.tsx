/**
 * Simplified Project Cost View Component
 */

import React from 'react'

interface SimplifiedProjectCostViewProps {
  onSectionChange?: (section: string) => void
  [key: string]: any
}

export const SimplifiedProjectCostView: React.FC<SimplifiedProjectCostViewProps> = (props) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Simplified Project Cost View</h3>
      <p className="text-sm text-muted-foreground">Simplified project cost view placeholder</p>
    </div>
  )
}

