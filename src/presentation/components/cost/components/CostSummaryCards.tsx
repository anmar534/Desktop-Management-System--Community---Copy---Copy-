/**
 * CostSummaryCards Component
 *
 * عرض بطاقات ملخص التكاليف (التقديرية، الفعلية، الفارق، النسبة)
 */

import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'

interface CostSummaryCardsProps {
  estimatedTotal: number
  actualTotal: number
  varianceTotal: number
  variancePct: number
}

export function CostSummaryCards({
  estimatedTotal,
  actualTotal,
  varianceTotal,
  variancePct,
}: CostSummaryCardsProps) {
  const { formatCurrencyValue } = useCurrencyFormatter()

  const formatCurrency = (value: number) =>
    formatCurrencyValue(value, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* التكلفة التقديرية */}
      <div className="rounded-lg border border-info/30 bg-info/10 p-4">
        <div className="mb-1 text-sm text-info">التكلفة التقديرية</div>
        <div className="text-2xl font-bold text-info">{formatCurrency(estimatedTotal)}</div>
      </div>

      {/* التكلفة الفعلية */}
      <div className="rounded-lg border border-success/30 bg-success/10 p-4">
        <div className="mb-1 text-sm text-success">التكلفة الفعلية</div>
        <div className="text-2xl font-bold text-success">{formatCurrency(actualTotal)}</div>
      </div>

      {/* فارق التكلفة */}
      <div
        className={`rounded-lg border p-4 ${
          varianceTotal >= 0
            ? 'border-destructive/20 bg-destructive/10'
            : 'border-success/20 bg-success/10'
        }`}
      >
        <div className={`mb-1 text-sm ${varianceTotal >= 0 ? 'text-destructive' : 'text-success'}`}>
          فارق التكلفة
        </div>
        <div
          className={`text-2xl font-bold ${
            varianceTotal >= 0 ? 'text-destructive' : 'text-success'
          }`}
        >
          {formatCurrency(Math.abs(varianceTotal))}
        </div>
      </div>

      {/* نسبة الفارق */}
      <div className="rounded-lg border border-border bg-muted p-4">
        <div className="mb-1 text-sm text-muted-foreground">نسبة الفارق</div>
        <div
          className={`text-2xl font-bold ${variancePct >= 0 ? 'text-destructive' : 'text-success'}`}
        >
          {variancePct.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}
