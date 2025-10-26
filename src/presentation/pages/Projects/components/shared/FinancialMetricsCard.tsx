/**
 * 📊 Financial Metrics Card Component
 * Displays financial metrics with health status indicators
 *
 * @module FinancialMetricsCard
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/data/centralData'
import type { ProjectFinancialMetrics } from '@/domain/services/ProjectFinancialService'

type FinancialHealthStatus = 'green' | 'yellow' | 'red'

export interface FinancialMetricsCardProps {
  metrics: ProjectFinancialMetrics | null
  healthStatus: FinancialHealthStatus | null
  tenderCost?: number
  actualCost?: number
  variance?: number
  variancePercentage?: number
}

export function FinancialMetricsCard({
  metrics,
  healthStatus,
  tenderCost,
  actualCost,
  variance,
  variancePercentage,
}: FinancialMetricsCardProps) {
  const getHealthBadge = (status: FinancialHealthStatus | null) => {
    if (!status) return null

    const config: Record<
      FinancialHealthStatus,
      { label: string; variant: 'default' | 'secondary' | 'destructive' }
    > = {
      green: { label: 'صحي', variant: 'default' },
      yellow: { label: 'تحذير', variant: 'secondary' },
      red: { label: 'حرج', variant: 'destructive' },
    }

    const info = config[status]
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  const isOverBudget = variance !== undefined && variance > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            المؤشرات المالية
          </span>
          {healthStatus && getHealthBadge(healthStatus)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget vs Actual */}
        {tenderCost !== undefined && actualCost !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الميزانية المخططة</span>
              <span className="font-medium">{formatCurrency(tenderCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">التكلفة الفعلية</span>
              <span className="font-medium">{formatCurrency(actualCost)}</span>
            </div>
            {variance !== undefined && variancePercentage !== undefined && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium flex items-center gap-1">
                  {isOverBudget ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">تجاوز الميزانية</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-primary" />
                      <span className="text-primary">ضمن الميزانية</span>
                    </>
                  )}
                </span>
                <span className={`font-bold ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
                  {formatCurrency(Math.abs(variance))} ({Math.abs(variancePercentage).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Financial Metrics */}
        {metrics && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الربح المتوقع</span>
              <span className="font-medium text-primary">
                {formatCurrency(metrics.expectedProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">هامش الربح</span>
              <span className="font-medium">{metrics.profitMargin.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">نسبة الإنفاق</span>
              <span className="font-medium">{metrics.spentPercentage.toFixed(2)}%</span>
            </div>
          </div>
        )}

        {/* Warning if critical */}
        {healthStatus === 'red' && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">المشروع يحتاج إلى مراجعة مالية فورية</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
