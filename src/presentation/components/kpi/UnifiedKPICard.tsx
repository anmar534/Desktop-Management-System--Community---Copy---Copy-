import type React from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { Progress } from '@/presentation/components/ui/progress'

export interface UnifiedKPICardProps {
  title: string
  icon: React.ReactNode
  current: number
  target: number
  unit: 'number' | 'percentage' | 'currency' | string
  colorClass?: string
  bgClass?: string
  onClick?: () => void
}

function formatValue(value: number, unit: UnifiedKPICardProps['unit']): string {
  if (unit === 'percentage') {
    return `${Math.round(value)}%`
  }
  if (unit === 'number') {
    return `${Math.round(value)}`
  }
  return `${value}`
}

function getStatus(progress: number): { label: string; className: string } {
  if (progress >= 100)
    return { label: 'ممتاز', className: 'bg-success/10 text-success border-success/30' }
  if (progress >= 80)
    return { label: 'على المسار', className: 'bg-info/10 text-info border-info/30' }
  if (progress >= 50)
    return { label: 'متوسط', className: 'bg-warning/10 text-warning border-warning/30' }
  return {
    label: 'يحتاج تحسين',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  }
}

export const UnifiedKPICard: React.FC<UnifiedKPICardProps> = ({
  title,
  icon,
  current,
  target,
  unit,
  colorClass = 'text-primary',
  bgClass = 'bg-muted',
  onClick,
}) => {
  const safeTarget = typeof target === 'number' && target > 0 ? target : 0
  const progress =
    safeTarget > 0 ? Math.min(Math.round((current / safeTarget) * 100), 100) : current > 0 ? 100 : 0
  const status = getStatus(progress)

  return (
    <Card
      className="bg-card border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 ${bgClass} rounded-lg`}>{icon}</div>
            <h3 className="text-sm font-semibold text-card-foreground leading-tight">{title}</h3>
          </div>
          <Badge variant="outline" className={`text-xs ${status.className}`}>
            {status.label}
          </Badge>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold ${colorClass}`}>
                {formatValue(current, unit)}
              </span>
              <span className="text-xs text-muted-foreground">{unit === 'number' ? '' : ''}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">الهدف</div>
              <div className="text-sm font-semibold text-foreground/80">
                {formatValue(safeTarget, unit)}
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>نسبة الإنجاز</span>
            <span className={colorClass}>{progress}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UnifiedKPICard
