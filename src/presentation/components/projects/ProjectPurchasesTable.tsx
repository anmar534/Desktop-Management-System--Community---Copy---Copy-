import React, { memo, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { Skeleton } from '@/presentation/components/ui/skeleton'
import { cn } from '@/presentation/components/ui/utils'
import { Package, ExternalLink, Unlink } from 'lucide-react'

export interface ProjectPurchaseRow {
  id: string
  reference?: string
  title?: string
  supplier?: string
  client?: string
  category?: string
  createdDate?: string | number | Date
  expectedDelivery?: string | number | Date
  value?: number
  currency?: string
  status?: string
  items?: unknown[]
  itemsCount?: number
  linkedTender?: string
  projectPhase?: string
}

export interface ProjectPurchasesTableProps {
  purchases?: ProjectPurchaseRow[]
  loading?: boolean
  onCreatePurchase?: () => void
  onViewDetails?: (purchase: ProjectPurchaseRow) => void
  onUnlink?: (purchase: ProjectPurchaseRow) => void
  title?: string
  description?: string
  emptyTitle?: string
  emptyDescription?: string
  className?: string
  formatCurrency?: (value: number, currency?: string) => string
  formatDate?: (value: string | number | Date | null | undefined) => string
}

const DEFAULT_EMPTY_TITLE = 'لا توجد أوامر شراء مرتبطة'
const DEFAULT_EMPTY_DESCRIPTION = 'اربط أوامر الشراء بالمشروع لمتابعة التنفيذ والإنفاق.'

const defaultCurrencyFormatter = (value: number, currencyCode = 'SAR'): string => {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value)
}

const defaultDateFormatter = (value: string | number | Date | null | undefined): string => {
  if (!value) {
    return '—'
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-success/10 text-success border-success/30',
  pending: 'bg-warning/10 text-warning border-warning/30',
  rejected: 'bg-error/10 text-error border-error/30',
  completed: 'bg-primary/10 text-primary border-primary/30',
  default: 'bg-muted/30 text-muted-foreground border-muted/30',
}

const getStatusStyle = (status?: string): string => {
  if (!status) {
    return STATUS_STYLES.default
  }

  const normalized = status.trim().toLowerCase()
  return STATUS_STYLES[normalized] ?? STATUS_STYLES.default
}

export const ProjectPurchasesTable: React.FC<ProjectPurchasesTableProps> = memo(
  ({
    purchases = [],
    loading = false,
    onCreatePurchase,
    onViewDetails,
    onUnlink,
    title = 'أوامر الشراء المرتبطة',
    description,
    emptyTitle = DEFAULT_EMPTY_TITLE,
    emptyDescription = DEFAULT_EMPTY_DESCRIPTION,
    className = '',
    formatCurrency = defaultCurrencyFormatter,
    formatDate = defaultDateFormatter,
  }) => {
    const totalValue = useMemo(
      () => purchases.reduce((acc, item) => acc + (item.value ?? 0), 0),
      [purchases],
    )

    const itemsTotal = useMemo(
      () =>
        purchases.reduce((acc, item) => {
          if (Number.isFinite(item.itemsCount)) {
            return acc + (item.itemsCount ?? 0)
          }
          if (Array.isArray(item.items)) {
            return acc + item.items.length
          }
          return acc
        }, 0),
      [purchases],
    )

    const currencyHint = purchases.find((item) => item.currency)?.currency ?? 'SAR'

    const hasData = purchases.length > 0

    return (
      <Card className={cn('border-border/70', className)} data-testid="project-purchases-card">
        <CardHeader className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Package className="h-5 w-5 text-muted-foreground" />
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="pt-1 text-sm text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </div>
            {onCreatePurchase && (
              <Button
                type="button"
                size="sm"
                onClick={onCreatePurchase}
                data-testid="create-purchase-button"
              >
                إضافة أمر شراء
              </Button>
            )}
          </div>

          {hasData && (
            <div
              className="flex flex-wrap items-center gap-2 pt-2 text-sm text-muted-foreground"
              data-testid="purchases-summary"
            >
              <Badge variant="outline" className="border-muted text-muted-foreground">
                {purchases.length} أمر شراء
              </Badge>
              <Badge variant="outline" className="border-muted text-muted-foreground">
                {formatCurrency(totalValue, currencyHint)}
              </Badge>
              <Badge variant="outline" className="border-muted text-muted-foreground">
                {itemsTotal} بند
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2" data-testid="purchases-loading-state">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : !hasData ? (
            <div data-testid="purchases-empty-state">
              <EmptyState icon={Package} title={emptyTitle} description={emptyDescription} />
            </div>
          ) : (
            <div className="overflow-x-auto" data-testid="purchases-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">رقم أمر الشراء</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>التصنيف</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">البنود</TableHead>
                    {(onViewDetails || onUnlink) && (
                      <TableHead className="text-right">إجراءات</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id} data-testid={`purchase-row-${purchase.id}`}>
                      <TableCell className="font-medium text-foreground">
                        {purchase.reference ?? purchase.id}
                        {purchase.linkedTender && (
                          <div className="text-xs text-muted-foreground">
                            مناقصة: {purchase.linkedTender}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {purchase.supplier || purchase.client || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {purchase.category || purchase.projectPhase || '—'}
                      </TableCell>
                      <TableCell
                        className="text-right text-sm text-muted-foreground"
                        data-testid={`purchase-date-${purchase.id}`}
                      >
                        {formatDate(purchase.createdDate ?? null)}
                      </TableCell>
                      <TableCell
                        className="text-right text-sm font-medium text-foreground"
                        data-testid={`purchase-value-${purchase.id}`}
                      >
                        {formatCurrency(purchase.value ?? 0, purchase.currency ?? currencyHint)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn('border text-xs', getStatusStyle(purchase.status))}
                          data-testid={`purchase-status-${purchase.id}`}
                        >
                          {purchase.status ?? 'غير محدد'}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-right text-sm text-muted-foreground"
                        data-testid={`purchase-items-${purchase.id}`}
                      >
                        {Number.isFinite(purchase.itemsCount)
                          ? purchase.itemsCount
                          : Array.isArray(purchase.items)
                            ? purchase.items.length
                            : 0}
                      </TableCell>
                      {(onViewDetails || onUnlink) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onViewDetails && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="عرض التفاصيل"
                                data-testid={`purchase-view-${purchase.id}`}
                                onClick={() => onViewDetails(purchase)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            {onUnlink && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-error hover:text-error"
                                aria-label="إلغاء الارتباط"
                                data-testid={`purchase-unlink-${purchase.id}`}
                                onClick={() => onUnlink(purchase)}
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    )
  },
)

ProjectPurchasesTable.displayName = 'ProjectPurchasesTable'
