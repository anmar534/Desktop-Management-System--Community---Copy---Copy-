/**
 * ProjectBudgetTab Component
 *
 * Displays budget comparison between estimated and actual costs
 * Shows variance analysis with color-coded alerts
 */

import { DollarSign, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import type { Tender } from '@/data/centralData'

interface BudgetComparisonItem {
  itemId: string
  description: string
  unit: string
  quantity: number
  estimated: {
    total: number
    unitPrice: number
  }
  actual: {
    total: number
    unitPrice: number
  }
  variance: {
    amount: number
    percentage: number
    status: 'over-budget' | 'under-budget' | 'on-budget'
    alerts: string[]
  }
}

interface BudgetSummary {
  totalItems: number
  totalVariance: number
  totalVariancePercentage: number
  overBudgetItems: number
  criticalAlerts: number
}

interface ProjectBudgetTabProps {
  budgetComparison: BudgetComparisonItem[]
  budgetSummary: BudgetSummary | null
  budgetLoading: boolean
  relatedTender: Tender | null
  formatQuantity: (value: number) => string
  formatCurrency: (value: number) => string
  onSyncPricing: () => void
  onNavigateToTenders?: () => void
}

export function ProjectBudgetTab({
  budgetComparison,
  budgetSummary,
  budgetLoading,
  relatedTender,
  formatQuantity,
  formatCurrency,
  onSyncPricing,
  onNavigateToTenders,
}: ProjectBudgetTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            مقارنة الميزانية - التقديرية مقابل الفعلية
          </CardTitle>
          {relatedTender && (
            <Button size="sm" variant="secondary" onClick={onSyncPricing}>
              🔄 إعادة مزامنة التسعير
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {budgetLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">جاري تحميل بيانات المقارنة...</p>
            </div>
          </div>
        ) : budgetSummary ? (
          <div className="space-y-6">
            {/* ملخص المقارنة */}
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/10 p-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-info">{budgetSummary.totalItems}</div>
                <div className="text-sm text-muted-foreground">إجمالي البنود</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${budgetSummary.totalVariance > 0 ? 'text-destructive' : budgetSummary.totalVariance < 0 ? 'text-success' : 'text-muted-foreground'}`}
                >
                  {budgetSummary.totalVariancePercentage > 0 ? '+' : ''}
                  {budgetSummary.totalVariancePercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">إجمالي الفارق</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {budgetSummary.overBudgetItems}
                </div>
                <div className="text-sm text-muted-foreground">بنود تجاوزت الميزانية</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {budgetSummary.criticalAlerts}
                </div>
                <div className="text-sm text-muted-foreground">تنبيهات حرجة</div>
              </div>
            </div>

            {/* جدول المقارنة التفصيلي */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/20">
                    <th className="border border-border p-2 text-right">البند</th>
                    <th className="border border-border p-2 text-center">الوحدة</th>
                    <th className="border border-border p-2 text-center">الكمية</th>
                    <th className="border border-border p-2 text-center">التكلفة التقديرية</th>
                    <th className="border border-border p-2 text-center">التكلفة الفعلية</th>
                    <th className="border border-border p-2 text-center">الفارق</th>
                    <th className="border border-border p-2 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetComparison.map((item) => (
                    <tr key={item.itemId} className="transition-colors hover:bg-muted/40">
                      <td className="border border-border p-2">
                        <div className="font-medium">{item.description}</div>
                        {item.variance.alerts.length > 0 && (
                          <div className="mt-1 text-xs text-warning">
                            {item.variance.alerts.map((alert, i) => (
                              <div key={i}>{alert}</div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="border border-border p-2 text-center">{item.unit}</td>
                      <td className="border border-border p-2 text-center">
                        {formatQuantity(item.quantity)}
                      </td>
                      <td className="border border-border p-2 text-center">
                        <div className="text-sm">
                          <div>{formatCurrency(item.estimated.total)}</div>
                          <div className="text-xs text-muted-foreground">
                            ({formatCurrency(item.estimated.unitPrice)}/وحدة)
                          </div>
                        </div>
                      </td>
                      <td className="border border-border p-2 text-center">
                        <div className="text-sm">
                          <div>{formatCurrency(item.actual.total)}</div>
                          <div className="text-xs text-muted-foreground">
                            ({formatCurrency(item.actual.unitPrice)}/وحدة)
                          </div>
                        </div>
                      </td>
                      <td className="border border-border p-2 text-center">
                        <div
                          className={`font-medium ${
                            item.variance.amount > 0
                              ? 'text-destructive'
                              : item.variance.amount < 0
                                ? 'text-success'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {item.variance.amount > 0 ? '+' : ''}
                          {formatCurrency(item.variance.amount)}
                        </div>
                        <div
                          className={`text-xs ${
                            item.variance.percentage > 0
                              ? 'text-destructive'
                              : item.variance.percentage < 0
                                ? 'text-success'
                                : 'text-muted-foreground'
                          }`}
                        >
                          ({item.variance.percentage > 0 ? '+' : ''}
                          {item.variance.percentage.toFixed(1)}%)
                        </div>
                      </td>
                      <td className="border border-border p-2 text-center">
                        <Badge
                          variant={
                            item.variance.status === 'over-budget'
                              ? 'destructive'
                              : item.variance.status === 'under-budget'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            item.variance.status === 'under-budget'
                              ? 'bg-success/10 text-success'
                              : ''
                          }
                        >
                          {item.variance.status === 'over-budget'
                            ? 'تجاوز الميزانية'
                            : item.variance.status === 'under-budget'
                              ? 'توفير'
                              : 'ضمن الميزانية'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="لا توجد بيانات مقارنة"
            description={`لعرض مقارنة الميزانية، يجب ربط المشروع بمنافسة مكتملة التسعير${relatedTender ? ` (المنافسة الحالية: ${relatedTender.name})` : ''}.`}
            {...(onNavigateToTenders
              ? {
                  actionLabel: 'إدارة المنافسات',
                  onAction: onNavigateToTenders,
                }
              : {})}
          />
        )}
      </CardContent>
    </Card>
  )
}
