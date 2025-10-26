import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { cn } from '@/presentation/components/ui/utils'
import { formatCurrency } from '@/shared/utils/formatters/formatters'
import { RefreshCcw, FileSpreadsheet, PlusCircle, PieChart } from 'lucide-react'
import { ProjectFinancialSummary } from './ProjectFinancialSummary'
import { ProjectProgressBar } from './ProjectProgressBar'

interface CostBreakdownEntry {
  label: string
  amount: number
  percentage?: number
}

interface HighlightEntry {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative' | 'warning'
}

interface ProjectCostsSummary {
  budget: number
  spent: number
  currency?: string
  showVariance?: boolean
}

interface ProjectBoqAvailability {
  hasProjectBoq: boolean
  hasTenderBoq: boolean
}

export interface ProjectCostsPanelProps {
  summary: ProjectCostsSummary
  committed?: number
  forecast?: number
  variance?: number
  currency?: string
  actions?: {
    onSyncPricing?: () => void
    onImportBoq?: () => void
    onAddCost?: () => void
  }
  boqAvailability?: ProjectBoqAvailability
  notes?: string[]
  costBreakdown?: CostBreakdownEntry[]
  highlights?: HighlightEntry[]
  className?: string
}

const TONE_CLASSES: Record<NonNullable<HighlightEntry['tone']>, string> = {
  default: 'text-muted-foreground',
  positive: 'text-success',
  negative: 'text-error',
  warning: 'text-warning',
}

const DEFAULT_CURRENCY = 'SAR'

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

const formatAmount = (value: number, currency?: string): string => {
  const normalized = resolveCurrencyCode(currency)
  const formatted = formatCurrency(value, {
    currency: normalized,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return appendCustomCurrency(formatted, currency)
}

const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 100)
}

const getVarianceClass = (variance: number): string => {
  if (variance > 0) return 'text-error'
  if (variance < 0) return 'text-success'
  return 'text-warning'
}

const getVarianceLabel = (variance: number): string => {
  if (variance > 0) return 'تجاوز الميزانية'
  if (variance < 0) return 'وفر في الميزانية'
  return 'ضمن الميزانية'
}

const getBoqStatus = (availability?: ProjectBoqAvailability) => {
  if (!availability) {
    return { label: 'لا توجد معلومات عن BOQ', tone: 'default' as const }
  }

  if (availability.hasProjectBoq) {
    return { label: 'BOQ مرتبط بالمشروع', tone: 'positive' as const }
  }

  if (availability.hasTenderBoq) {
    return { label: 'يوجد BOQ للمنافسة جاهز للاستيراد', tone: 'warning' as const }
  }

  return { label: 'لا يوجد BOQ مرتبط', tone: 'default' as const }
}

export const ProjectCostsPanel: React.FC<ProjectCostsPanelProps> = memo(
  ({
    summary,
    committed,
    forecast,
    variance,
    currency,
    actions,
    boqAvailability,
    notes = [],
    costBreakdown = [],
    highlights = [],
    className = '',
  }) => {
    const budget = summary.budget
    const spent = summary.spent
    const resolvedCurrency = currency ?? summary.currency
    const computedVariance = typeof variance === 'number' ? variance : spent - budget
    const variancePercentage = budget > 0 ? (computedVariance / budget) * 100 : 0
    const consumption = budget > 0 ? (spent / budget) * 100 : 0
    const showImportButton =
      Boolean(actions?.onImportBoq) &&
      Boolean(boqAvailability?.hasTenderBoq) &&
      !boqAvailability?.hasProjectBoq
    const showSyncButton = Boolean(actions?.onSyncPricing)
    const showAddCostButton = Boolean(actions?.onAddCost)
    const boqStatus = getBoqStatus(boqAvailability)

    return (
      <Card className={cn('border-border/70', className)} data-testid="project-costs-panel">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-foreground">
              إدارة تكاليف المشروع
            </CardTitle>

            {(showSyncButton || showImportButton || showAddCostButton) && (
              <div className="flex flex-wrap items-center gap-2" data-testid="costs-actions">
                {showSyncButton && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={actions?.onSyncPricing}
                    data-testid="sync-pricing-button"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    <span className="ml-1">مزامنة التسعير</span>
                  </Button>
                )}
                {showImportButton && (
                  <Button size="sm" onClick={actions?.onImportBoq} data-testid="import-boq-button">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="ml-1">استيراد BOQ</span>
                  </Button>
                )}
                {showAddCostButton && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={actions?.onAddCost}
                    data-testid="add-cost-button"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span className="ml-1">إضافة تكلفة</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn('font-medium', TONE_CLASSES[boqStatus.tone])}
              data-testid="boq-status"
            >
              {boqStatus.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ProjectFinancialSummary
              budget={budget}
              spent={spent}
              currency={resolvedCurrency}
              showVariance={summary.showVariance}
              compact
            />

            <div className="space-y-4">
              <div className="space-y-2" data-testid="cost-consumption">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>نسبة استهلاك الميزانية</span>
                  <span
                    className="font-semibold text-foreground"
                    data-testid="cost-consumption-value"
                  >
                    {Math.round(consumption)}%
                  </span>
                </div>
                <ProjectProgressBar
                  progress={clampPercentage(consumption)}
                  labelPosition="outside"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2" data-testid="costs-metrics">
                {typeof committed === 'number' && (
                  <div className="rounded-md border border-muted bg-muted/10 px-3 py-2">
                    <div className="text-xs text-muted-foreground">التزامات معتمدة</div>
                    <div className="text-sm font-semibold" data-testid="cost-metric-committed">
                      {formatAmount(committed, resolvedCurrency)}
                    </div>
                  </div>
                )}

                {typeof forecast === 'number' && (
                  <div className="rounded-md border border-muted bg-muted/10 px-3 py-2">
                    <div className="text-xs text-muted-foreground">توقع عند الإكمال</div>
                    <div className="text-sm font-semibold" data-testid="cost-metric-forecast">
                      {formatAmount(forecast, resolvedCurrency)}
                    </div>
                  </div>
                )}

                <div className="rounded-md border border-muted bg-muted/10 px-3 py-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">الانحراف المالي</div>
                    <Badge
                      variant="secondary"
                      className="bg-secondary/20 text-secondary-foreground"
                    >
                      {getVarianceLabel(computedVariance)}
                    </Badge>
                  </div>
                  <div
                    className={cn('mt-2 text-sm font-semibold', getVarianceClass(computedVariance))}
                    data-testid="cost-variance-value"
                  >
                    {formatAmount(Math.abs(computedVariance), resolvedCurrency)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {Number.isFinite(variancePercentage)
                        ? `${variancePercentage > 0 ? '+' : ''}${variancePercentage.toFixed(1)}%`
                        : '0.0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {highlights.length > 0 && (
            <div className="space-y-2" data-testid="costs-highlights">
              <div className="text-sm font-semibold text-muted-foreground">مؤشرات رئيسية</div>
              <div className="flex flex-wrap gap-2">
                {highlights.map((item, index) => (
                  <Badge
                    key={`${item.label}-${index}`}
                    variant="outline"
                    className={cn('gap-1', TONE_CLASSES[item.tone ?? 'default'])}
                    data-testid={`cost-highlight-${index}`}
                  >
                    <PieChart className="h-3.5 w-3.5" />
                    <span>{item.label}:</span>
                    <span className="font-semibold">{item.value}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {costBreakdown.length > 0 && (
            <div className="space-y-2" data-testid="costs-breakdown">
              <div className="text-sm font-semibold text-muted-foreground">تفصيل التكاليف</div>
              <div className="grid gap-3 md:grid-cols-2">
                {costBreakdown.map((entry, index) => (
                  <div
                    key={`${entry.label}-${index}`}
                    className="rounded-md border border-muted bg-muted/10 px-3 py-2"
                    data-testid={`cost-breakdown-item-${index}`}
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{entry.label}</span>
                      {typeof entry.percentage === 'number' && (
                        <span>{entry.percentage.toFixed(1)}%</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {formatAmount(entry.amount, resolvedCurrency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.length > 0 && (
            <div className="space-y-2" data-testid="costs-notes">
              <div className="text-sm font-semibold text-muted-foreground">ملاحظات</div>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {notes.map((note, index) => (
                  <li key={`${note}-${index}`} data-testid={`cost-note-${index}`}>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    )
  },
)

ProjectCostsPanel.displayName = 'ProjectCostsPanel'

export default ProjectCostsPanel
