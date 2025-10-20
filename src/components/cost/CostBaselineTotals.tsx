import type React from 'react'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'

interface CostBaselineTotalsProps {
  estimated: number
  actual: number
  varianceValue: number
  variancePct: number
  currency?: string
  className?: string
}

export const CostBaselineTotals: React.FC<CostBaselineTotalsProps> = ({
  estimated,
  actual,
  varianceValue,
  variancePct,
  currency = 'SAR',
  className,
}) => {
  const { formatCurrencyValue } = useCurrencyFormatter(currency)
  const varianceColor =
    varianceValue > 0
      ? 'text-destructive'
      : varianceValue < 0
        ? 'text-success'
        : 'text-muted-foreground'
  const estimatedFormatted = formatCurrencyValue(estimated, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const actualFormatted = formatCurrencyValue(actual, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const varianceFormatted = formatCurrencyValue(varianceValue, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return (
    <div
      className={
        'grid grid-cols-3 border border-border rounded-md overflow-hidden text-xs bg-card shadow-sm ' +
        (className ?? '')
      }
    >
      <div className="p-3 border-e">
        <div className="text-muted-foreground mb-1 font-medium">Estimated Total</div>
        <div className="text-sm font-semibold">{estimatedFormatted}</div>
      </div>
      <div className="p-3 border-e">
        <div className="text-muted-foreground mb-1 font-medium">Actual Total</div>
        <div className="text-sm font-semibold">{actualFormatted}</div>
      </div>
      <div className="p-3">
        <div className="text-muted-foreground mb-1 font-medium">Variance</div>
        <div className={`text-sm font-semibold ${varianceColor}`}>
          {varianceFormatted} ({variancePct.toFixed(1)}%)
        </div>
      </div>
    </div>
  )
}
