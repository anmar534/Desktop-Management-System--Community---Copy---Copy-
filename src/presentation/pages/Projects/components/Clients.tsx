/**
 * Clients Component
 */

import React from 'react'

interface ClientsProps {
  onSectionChange?: (section: string) => void
}

export const Clients: React.FC<ClientsProps> = ({ onSectionChange }) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Clients</h3>
      <p className="text-sm text-muted-foreground">Clients placeholder</p>
    </div>
  )
}
