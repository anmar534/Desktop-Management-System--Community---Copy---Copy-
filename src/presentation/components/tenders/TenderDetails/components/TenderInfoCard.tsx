// TenderInfoCard Component
// Reusable card for displaying tender information sections

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface TenderInfoCardProps {
  title: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

export function TenderInfoCard({ title, icon: Icon, children, className }: TenderInfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

interface InfoRowProps {
  label: string
  value: string | React.ReactNode
  icon?: LucideIcon
  fullWidth?: boolean
}

export function InfoRow({ label, value, icon: Icon, fullWidth = false }: InfoRowProps) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-muted-foreground mb-1 flex items-center gap-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  )
}
