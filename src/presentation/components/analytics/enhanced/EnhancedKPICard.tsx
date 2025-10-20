/**
 * Enhanced KPI Card Component
 *
 * بطاقة مؤشر أداء محسّنة لشركات المقاولات
 * تعرض المؤشرات الحرجة مع تنبيهات بصرية وإجراءات سريعة
 *
 * @version 2.0.0
 * @date 2024-01-15
 */

import type { FC } from 'react'
import { Card, CardContent, CardHeader } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Progress } from '@/presentation/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  Target,
} from 'lucide-react'
import { cn } from '@/presentation/components/ui/utils'
import type { LucideIcon } from 'lucide-react'

export interface EnhancedKPICardProps {
  /** عنوان المؤشر */
  title: string
  /** القيمة الحالية */
  value: number | string
  /** وحدة القياس */
  unit?: string
  /** القيمة المستهدفة */
  target?: number
  /** اتجاه التغيير */
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    period: string
  }
  /** حالة المؤشر */
  status: 'success' | 'warning' | 'danger' | 'info'
  /** أيقونة المؤشر */
  icon: LucideIcon
  /** لون مخصص */
  color?: string
  /** إجراء سريع */
  action?: {
    label: string
    onClick: () => void
  }
  /** وصف إضافي */
  description?: string
  /** إظهار شريط التقدم */
  showProgress?: boolean
  /** حجم البطاقة */
  size?: 'small' | 'medium' | 'large'
  /** تفعيل الحركة */
  animated?: boolean
}

const statusToneClasses = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/40',
    icon: 'text-success',
    badge: 'bg-success/15 text-success',
    progress: 'bg-success',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/40',
    icon: 'text-warning',
    badge: 'bg-warning/15 text-warning',
    progress: 'bg-warning',
  },
  danger: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/40',
    icon: 'text-destructive',
    badge: 'bg-destructive/15 text-destructive',
    progress: 'bg-destructive',
  },
  info: {
    bg: 'bg-info/10',
    border: 'border-info/40',
    icon: 'text-info',
    badge: 'bg-info/15 text-info',
    progress: 'bg-info',
  },
} as const

const trendToneClasses = {
  up: 'text-success',
  down: 'text-destructive',
  stable: 'text-muted-foreground',
} as const

export const EnhancedKPICard: FC<EnhancedKPICardProps> = ({
  title,
  value,
  unit,
  target,
  trend,
  status,
  icon: Icon,
  color,
  action,
  description,
  showProgress = false,
  size = 'medium',
  animated = true,
}) => {
  const progressPercentage =
    target && typeof value === 'number' ? Math.min((value / target) * 100, 100) : 0

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      case 'stable':
        return <Minus className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return trendToneClasses.up
      case 'down':
        return trendToneClasses.down
      case 'stable':
        return trendToneClasses.stable
      default:
        return ''
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'danger':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
        return <Info className="h-4 w-4" />
      default:
        return null
    }
  }

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  }

  const currentColors = statusToneClasses[status]

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        currentColors.bg,
        currentColors.border,
        animated && 'hover:scale-105 hover:-translate-y-1',
        'border-2',
      )}
      style={color ? { borderColor: color } : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Icon
            className={cn('h-5 w-5', currentColors.icon)}
            style={color ? { color } : undefined}
          />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <Badge variant="secondary" className={cn('flex items-center gap-1', currentColors.badge)}>
          {getStatusIcon()}
          <span className="text-xs">
            {status === 'success' && 'ممتاز'}
            {status === 'warning' && 'تحذير'}
            {status === 'danger' && 'حرج'}
            {status === 'info' && 'معلومات'}
          </span>
        </Badge>
      </CardHeader>

      <CardContent className={sizeClasses[size]}>
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2 space-x-reverse">
            <span className="text-3xl font-bold text-foreground">
              {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
            </span>
            {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
          </div>

          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>

        {showProgress && target && typeof value === 'number' && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">التقدم نحو الهدف</span>
              <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-2"
              indicatorClassName={currentColors.progress}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>الحالي: {value.toLocaleString('ar-SA')}</span>
              <span>الهدف: {target.toLocaleString('ar-SA')}</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div
            className={cn('flex items-center space-x-1 space-x-reverse text-sm', getTrendColor())}
          >
            {getTrendIcon()}
            <span className="font-medium">
              {trend.percentage > 0 ? '+' : ''}
              {trend.percentage}%
            </span>
            <span className="text-muted-foreground text-xs">{trend.period}</span>
          </div>

          {target && (
            <div className="flex items-center space-x-1 space-x-reverse text-sm text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>{target.toLocaleString('ar-SA')}</span>
            </div>
          )}
        </div>

        {action && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="w-full justify-between text-sm hover:bg-background/80"
            >
              <span>{action.label}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>

      {status === 'danger' && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-destructive">
          <div className="absolute -top-[18px] -right-[15px]">
            <AlertTriangle className="h-3 w-3 text-background" />
          </div>
        </div>
      )}
    </Card>
  )
}

export default EnhancedKPICard

