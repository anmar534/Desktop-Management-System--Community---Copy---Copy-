/**
 * @fileoverview CostSectionCard Component
 * @description Reusable card component for displaying cost sections (Materials, Labor, etc.)
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Plus, Trash2, Copy, LucideIcon } from 'lucide-react'

interface CostSectionCardProps {
  title: string
  icon: LucideIcon
  total: number
  itemCount: number
  formatCurrency: (value: number) => string
  onAdd?: () => void
  onClear?: () => void
  onDuplicate?: () => void
  className?: string
  children: React.ReactNode
  headerActions?: React.ReactNode
  color?: string
}

export const CostSectionCard: React.FC<CostSectionCardProps> = ({
  title,
  icon: Icon,
  total,
  itemCount,
  formatCurrency,
  onAdd,
  onClear,
  onDuplicate,
  className = '',
  children,
  headerActions,
  color = 'text-primary',
}) => {
  return (
    <Card className={`${className}`}>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            {title}
            <Badge variant="secondary" className="ml-2">
              {itemCount} {itemCount === 1 ? 'بند' : 'بنود'}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {headerActions}
            {onAdd && (
              <Button onClick={onAdd} size="sm" variant="outline">
                <Plus className="h-4 w-4 ml-2" />
                إضافة
              </Button>
            )}
            {onDuplicate && itemCount > 0 && (
              <Button onClick={onDuplicate} size="sm" variant="ghost">
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onClear && itemCount > 0 && (
              <Button onClick={onClear} size="sm" variant="ghost" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">الإجمالي</span>
          <span className="text-lg font-semibold">{formatCurrency(total)}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}
