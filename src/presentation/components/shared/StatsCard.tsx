/**
 * StatsCard Component
 *
 * Reusable statistics card with trend indicators
 * Used across Projects, Dashboard, and Financial views
 */

import { Card, CardContent } from '@/presentation/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface StatsCardProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: string
  bgColor?: string
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
  className?: string
}

export function StatsCard({
  label,
  value,
  trend = 'stable',
  trendValue,
  color = 'text-foreground',
  bgColor = 'bg-muted',
  icon: Icon,
  onClick,
  className,
}: StatsCardProps) {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus

  const trendColor =
    trend === 'up'
      ? 'text-success'
      : trend === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground'

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        onClick && 'cursor-pointer hover:scale-105',
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
              {trendValue && (
                <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
          </div>
          {Icon && (
            <div className={cn('p-3 rounded-lg', bgColor)}>
              <Icon className={cn('h-6 w-6', color)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
