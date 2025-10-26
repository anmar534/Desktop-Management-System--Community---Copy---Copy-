import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { cn } from '@/presentation/components/ui/utils'
import { formatCurrency, formatCurrencyCompact } from '@/shared/utils/formatters/formatters'

/**
 * Financial Summary Component Props
 */
export interface ProjectFinancialSummaryProps {
  /** Total budget */
  budget: number
  /** Actual spent amount */
  spent: number
  /** Currency label (symbol or ISO code) */
  currency?: string
  /** Show variance indicator */
  showVariance?: boolean
  /** Compact view */
  compact?: boolean
  /** Custom className */
  className?: string
}

const DEFAULT_CURRENCY = 'SAR'
const VARIANCE_THRESHOLD = 10

const resolveCurrencyCode = (currency?: string): string => {
  if (!currency) return DEFAULT_CURRENCY
  const trimmed = currency.trim()
  const upper = trimmed.toUpperCase()
  if (/^[A-Z]{3}$/.test(upper)) return upper
  if (['ر.س.', 'ر.س', 'SAR', 'ريال'].includes(trimmed)) return 'SAR'
  if (['$', 'USD'].includes(upper)) return 'USD'
  if (['€', 'EUR'].includes(upper)) return 'EUR'
  if (['£', 'GBP'].includes(upper)) return 'GBP'
  return DEFAULT_CURRENCY
}

const appendCustomCurrency = (formatted: string, currency?: string): string => {
  if (!currency) return formatted
  const trimmed = currency.trim()
  const upper = trimmed.toUpperCase()
  if (/^[A-Z]{3}$/.test(upper)) return formatted
  if (formatted.includes(trimmed)) return formatted
  return `${formatted} ${trimmed}`
}

const formatAmount = (value: number, currency?: string, { compact = false } = {}): string => {
  const currencyCode = resolveCurrencyCode(currency)
  const formatted = compact
    ? formatCurrencyCompact(value, { currency: currencyCode, maximumFractionDigits: 1 })
    : formatCurrency(value, {
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
  return appendCustomCurrency(formatted, currency)
}

const calculateVariance = (budget: number, spent: number): number => {
  if (budget === 0) return 0
  return ((spent - budget) / budget) * 100
}

const resolveVarianceClass = (variance: number): string => {
  if (variance > VARIANCE_THRESHOLD) return 'text-error'
  if (variance < -VARIANCE_THRESHOLD) return 'text-success'
  return 'text-warning'
}

const resolveVarianceIcon = (variance: number) => {
  if (variance > VARIANCE_THRESHOLD) return TrendingUp
  if (variance < -VARIANCE_THRESHOLD) return TrendingDown
  return AlertTriangle
}

const formatVarianceText = (variance: number): string => {
  const rounded = Number.isFinite(variance) ? variance.toFixed(1) : '0.0'
  const prefix = variance > 0 ? '+' : ''
  return `${prefix}${rounded}%`
}

export const ProjectFinancialSummary: React.FC<ProjectFinancialSummaryProps> = memo(
  ({ budget, spent, currency = 'ر.س.', showVariance = true, compact = false, className = '' }) => {
    const remaining = budget - spent
    const variance = calculateVariance(budget, spent)
    const varianceClass = resolveVarianceClass(variance)
    const VarianceIcon = resolveVarianceIcon(variance)

    if (compact) {
      return (
        <div
          className={cn('flex items-center gap-2', className)}
          data-testid="financial-summary-compact"
        >
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              {formatAmount(spent, currency, { compact: true })}
            </div>
            <div className="text-xs text-muted-foreground">
              من {formatAmount(budget, currency, { compact: true })}
            </div>
          </div>
          {showVariance && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', varianceClass)}>
              <VarianceIcon className="h-3 w-3" />
              {formatVarianceText(variance)}
            </div>
          )}
        </div>
      )
    }

    return (
      <Card className={className} data-testid="financial-summary-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            الملخص المالي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">الميزانية</span>
            <span className="text-sm font-semibold" data-testid="budget-value">
              {formatAmount(budget, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">المصروف</span>
            <span className="text-sm font-semibold" data-testid="spent-value">
              {formatAmount(spent, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-sm font-medium">المتبقي</span>
            <span
              className={cn('text-sm font-bold', remaining < 0 ? 'text-error' : 'text-success')}
              data-testid="remaining-value"
            >
              {formatAmount(Math.abs(remaining), currency)}
              {remaining < 0 && ' (تجاوز)'}
            </span>
          </div>

          {showVariance && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">نسبة الانحراف</span>
              <div
                className={cn('flex items-center gap-1 text-xs font-semibold', varianceClass)}
                data-testid="variance"
              >
                <VarianceIcon className="h-3 w-3" />
                {formatVarianceText(variance)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  },
)

ProjectFinancialSummary.displayName = 'ProjectFinancialSummary'

export const getFinancialStatus = (budget: number, spent: number): string => {
  const variance = calculateVariance(budget, spent)
  if (variance > VARIANCE_THRESHOLD) return 'تجاوز الميزانية'
  if (variance < -VARIANCE_THRESHOLD) return 'أقل من الميزانية'
  return 'ضمن الميزانية'
}

export default ProjectFinancialSummary
