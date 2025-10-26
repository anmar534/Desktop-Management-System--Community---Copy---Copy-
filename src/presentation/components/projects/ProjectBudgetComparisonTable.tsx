import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { cn } from '@/presentation/components/ui/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { formatCurrency } from '@/shared/utils/formatters/formatters'
import {
  FileSpreadsheet,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  ArrowDownCircle,
} from 'lucide-react'

interface BudgetComparisonItem {
  id: string
  description: string
  planned: number
  actual: number
  quantity?: number
  unit?: string
  category?: string
  varianceAmount?: number
  variancePercentage?: number
  status?: 'over-budget' | 'under-budget' | 'on-track'
  notes?: string[]
}

interface BudgetSummary {
  plannedTotal: number
  actualTotal: number
  currency?: string
  varianceTotal?: number
  variancePercentage?: number
  overBudgetItems?: number
  underBudgetItems?: number
  onTrackItems?: number
}

interface BudgetHighlight {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative' | 'warning'
}

interface BudgetComparisonActions {
  onRefresh?: () => void
  onExport?: () => void
}

export interface ProjectBudgetComparisonTableProps {
  summary: BudgetSummary
  items: BudgetComparisonItem[]
  highlights?: BudgetHighlight[]
  actions?: BudgetComparisonActions
  loading?: boolean
  emptyState?: {
    title?: string
    description?: string
  }
  className?: string
}

const DEFAULT_EMPTY_STATE = {
  title: 'لا توجد بيانات مقارنة',
  description: 'قم بمزامنة التسعير أو تحميل ملف BOQ لعرض تفاصيل المقارنة.',
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
  const currencyCode = resolveCurrencyCode(currency)
  const formatted = formatCurrency(value, {
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return appendCustomCurrency(formatted, currency)
}

const formatVariance = (value: number): string => {
  if (!Number.isFinite(value)) return '0'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${Math.round(value)}`
}

const formatVariancePercentage = (value: number): string => {
  if (!Number.isFinite(value)) return '0.0%'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}

const STATUS_META: Record<
  NonNullable<BudgetComparisonItem['status']>,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  'over-budget': {
    label: 'تجاوز الميزانية',
    className: 'border-error/30 bg-error/10 text-error',
    icon: AlertTriangle,
  },
  'under-budget': {
    label: 'وفر في الميزانية',
    className: 'border-success/30 bg-success/10 text-success',
    icon: ArrowDownCircle,
  },
  'on-track': {
    label: 'ضمن الميزانية',
    className: 'border-info/30 bg-info/10 text-foreground',
    icon: CheckCircle2,
  },
}

const HIGHLIGHT_TONE_CLASSES: Record<NonNullable<BudgetHighlight['tone']>, string> = {
  default: 'text-muted-foreground border-muted',
  positive: 'text-success border-success/40',
  negative: 'text-error border-error/40',
  warning: 'text-warning border-warning/40',
}

const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, -100), 100)
}

export const ProjectBudgetComparisonTable: React.FC<ProjectBudgetComparisonTableProps> = memo(
  ({ summary, items, highlights = [], actions, loading = false, emptyState, className = '' }) => {
    const resolvedCurrency = summary.currency
    const varianceValue =
      typeof summary.varianceTotal === 'number'
        ? summary.varianceTotal
        : summary.actualTotal - summary.plannedTotal
    const variancePercentage =
      typeof summary.variancePercentage === 'number'
        ? summary.variancePercentage
        : summary.plannedTotal > 0
          ? ((summary.actualTotal - summary.plannedTotal) / summary.plannedTotal) * 100
          : 0

    const showEmpty = !loading && items.length === 0
    const emptyContent = { ...DEFAULT_EMPTY_STATE, ...emptyState }

    return (
      <Card className={cn('border-border/70', className)} data-testid="budget-comparison-table">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              مقارنة الميزانية
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              تحليل الفرق بين التكاليف المخططة والفعلية
            </div>
          </div>

          {(actions?.onRefresh || actions?.onExport) && (
            <div className="flex flex-wrap items-center gap-2" data-testid="budget-actions">
              {actions?.onRefresh && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={actions.onRefresh}
                  data-testid="budget-refresh-button"
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span className="ml-1">تحديث البيانات</span>
                </Button>
              )}
              {actions?.onExport && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={actions.onExport}
                  data-testid="budget-export-button"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="ml-1">تصدير BOQ</span>
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            className="grid gap-4 rounded-lg border border-muted bg-muted/10 p-4 sm:grid-cols-2 lg:grid-cols-4"
            data-testid="budget-summary"
          >
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">إجمالي المخطط</div>
              <div className="text-sm font-semibold" data-testid="budget-summary-planned">
                {formatAmount(summary.plannedTotal, resolvedCurrency)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">إجمالي الفعلي</div>
              <div className="text-sm font-semibold" data-testid="budget-summary-actual">
                {formatAmount(summary.actualTotal, resolvedCurrency)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">الفارق الكلي</div>
              <div
                className={cn(
                  'text-sm font-semibold',
                  varianceValue > 0
                    ? 'text-error'
                    : varianceValue < 0
                      ? 'text-success'
                      : 'text-warning',
                )}
                data-testid="budget-summary-variance"
              >
                {formatAmount(Math.abs(varianceValue), resolvedCurrency)}
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatVariancePercentage(clampPercentage(variancePercentage))}
                </span>
              </div>
            </div>
            <div className="space-y-1" data-testid="budget-summary-breakdown">
              <div className="text-xs text-muted-foreground">حالات البنود</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-error/10 px-2 py-1 text-error">
                  تجاوز: {summary.overBudgetItems ?? 0}
                </span>
                <span className="rounded bg-success/10 px-2 py-1 text-success">
                  توفير: {summary.underBudgetItems ?? 0}
                </span>
                <span className="rounded bg-muted px-2 py-1 text-muted-foreground">
                  مستقر: {summary.onTrackItems ?? 0}
                </span>
              </div>
            </div>
          </div>

          {highlights.length > 0 && (
            <div className="space-y-2" data-testid="budget-highlights">
              <div className="text-sm font-semibold text-muted-foreground">مؤشرات رئيسية</div>
              <div className="flex flex-wrap gap-2">
                {highlights.map((highlight, index) => (
                  <Badge
                    key={`${highlight.label}-${index}`}
                    variant="outline"
                    className={cn(
                      'gap-1 border',
                      HIGHLIGHT_TONE_CLASSES[highlight.tone ?? 'default'],
                    )}
                    data-testid={`budget-highlight-${index}`}
                  >
                    <span>{highlight.label}:</span>
                    <span className="font-semibold">{highlight.value}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8" data-testid="budget-loading">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCcw className="h-4 w-4 animate-spin" /> جاري تحميل بيانات الميزانية...
              </div>
            </div>
          )}

          {showEmpty ? (
            <div
              className="rounded-lg border border-dashed border-muted p-6 text-center"
              data-testid="budget-empty-state"
            >
              <div className="text-base font-semibold text-foreground">{emptyContent.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{emptyContent.description}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="text-right">البند</TableHead>
                    <TableHead className="text-center">الفئة</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">التكلفة المخططة</TableHead>
                    <TableHead className="text-center">التكلفة الفعلية</TableHead>
                    <TableHead className="text-center">الفارق</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const resolvedStatus = item.status ?? 'on-track'
                    const statusMeta = STATUS_META[resolvedStatus]
                    const varianceAmount =
                      typeof item.varianceAmount === 'number'
                        ? item.varianceAmount
                        : item.actual - item.planned
                    const variancePercent =
                      typeof item.variancePercentage === 'number'
                        ? item.variancePercentage
                        : item.planned > 0
                          ? ((item.actual - item.planned) / item.planned) * 100
                          : 0
                    return (
                      <TableRow
                        key={item.id}
                        data-testid={`budget-row-${index}`}
                        className="align-top"
                      >
                        <TableCell>
                          <div className="font-medium text-foreground">{item.description}</div>
                          {item.notes && item.notes.length > 0 && (
                            <ul
                              className="mt-2 list-inside list-disc text-xs text-muted-foreground"
                              data-testid={`budget-row-notes-${index}`}
                            >
                              {item.notes.map((note, noteIndex) => (
                                <li key={`${item.id}-note-${noteIndex}`}>{note}</li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {item.category ?? 'غير محدد'}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {item.quantity
                            ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-center text-sm font-semibold">
                          {formatAmount(item.planned, resolvedCurrency)}
                        </TableCell>
                        <TableCell className="text-center text-sm font-semibold">
                          {formatAmount(item.actual, resolvedCurrency)}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          <div
                            className={cn(
                              'font-semibold',
                              varianceAmount > 0
                                ? 'text-error'
                                : varianceAmount < 0
                                  ? 'text-success'
                                  : 'text-muted-foreground',
                            )}
                            data-testid={`budget-row-variance-${index}`}
                          >
                            {formatVariance(varianceAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatVariancePercentage(clampPercentage(variancePercent))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              'inline-flex items-center gap-1 border',
                              statusMeta.className,
                            )}
                            data-testid={`budget-row-status-${index}`}
                          >
                            <statusMeta.icon className="h-3.5 w-3.5" />
                            <span>{statusMeta.label}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    )
  },
)

ProjectBudgetComparisonTable.displayName = 'ProjectBudgetComparisonTable'

export default ProjectBudgetComparisonTable
