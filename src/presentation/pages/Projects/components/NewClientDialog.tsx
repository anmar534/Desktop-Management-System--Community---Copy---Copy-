/**
 * New Client Dialog Component
 */

import React from 'react'

interface NewClientDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onClientCreated?: () => void
}

export const NewClientDialog: React.FC<NewClientDialogProps> = ({
  open,
  onOpenChange,
  onClientCreated,
}) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">New Client Dialog</h3>
      <p className="text-sm text-muted-foreground">New client dialog placeholder</p>
    </div>
  )
}
