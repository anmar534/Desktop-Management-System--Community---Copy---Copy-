import type { ComponentType } from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Progress } from '@/presentation/components/ui/progress'
import { InlineAlert } from '@/presentation/components/ui/inline-alert'
import { StatusBadge, type StatusBadgeProps } from '@/presentation/components/ui/status-badge'
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCcw,
  AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/shared/utils/formatters/formatters'
import { useDashboardMetrics } from '@/application/hooks/useDashboardMetrics'

interface FinancialSummaryCardProps {
  onSectionChange: (
    section:
      | 'dashboard'
      | 'projects'
      | 'new-project'
      | 'tenders'
      | 'new-tender'
      | 'clients'
      | 'new-client'
      | 'financial'
      | 'purchases'
      | 'new-purchase-order'
      | 'reports'
      | 'settings'
  ) => void
}

type IndicatorTone = 'success' | 'warning' | 'error' | 'info'
interface IndicatorConfig {
  label: string
  value: string
  tone: IndicatorTone
  icon: ComponentType<{ className?: string }>
}

const indicatorToneStyles: Record<IndicatorTone, { container: string; accent: string }> = {
  success: {
    container: 'border-success/25 bg-success/10',
    accent: 'text-success',
  },
  warning: {
    container: 'border-warning/25 bg-warning/10',
    accent: 'text-warning',
  },
  error: {
    container: 'border-error/25 bg-error/10',
    accent: 'text-error',
  },
  info: {
    container: 'border-info/25 bg-info/10',
    accent: 'text-info',
  },
}

export function FinancialSummaryCard({ onSectionChange }: FinancialSummaryCardProps) {
  const { data, isLoading, lastUpdated, refresh } = useDashboardMetrics()

  const toNumber = (value: unknown, fallback = 0): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback

  const currencyBase = data.currency.base ?? 'SAR'
  const currencyLastUpdated = data.currency.lastUpdated

  const cashOnHand = toNumber(data.totals.cashOnHand) || toNumber(data.cashflow.totals.endingBalance)
  const averageDailyOutflow = toNumber(data.cashflow.totals.averageDailyOutflow)
  const monthlyOutflowEstimate = Math.max(averageDailyOutflow * 30, toNumber(data.cashflow.totals.outflow))
  const minimumBalance = Math.max(monthlyOutflowEstimate, cashOnHand * 0.6, 1)
  const netCashMovement = toNumber(data.cashflow.totals.net)
  const periodDays = Math.max(toNumber(data.cashflow.totals.periodDays), 1)
  const monthlyNetEstimate = (netCashMovement / periodDays) * 30
  const balanceRatio = minimumBalance > 0 ? (cashOnHand / minimumBalance) * 100 : 0
  const cashFlowStatus: 'healthy' | 'warning' | 'critical' = balanceRatio >= 100
    ? 'healthy'
    : balanceRatio >= 70
      ? 'warning'
      : 'critical'
  const inflowTotal = toNumber(data.cashflow.totals.inflow)
  const profitMarginPctRaw = inflowTotal > 0 ? (netCashMovement / inflowTotal) * 100 : 0
  const profitMarginPct = Number.isFinite(profitMarginPctRaw) ? profitMarginPctRaw : 0
  const clampedProfitMargin = Math.max(Math.min(profitMarginPct, 999), -999)
  const profitMarginDisplay = isLoading ? '—' : `${clampedProfitMargin.toFixed(1)}%`
  const profitMarginProgress = Number.isFinite(clampedProfitMargin)
    ? Math.max(Math.min(clampedProfitMargin, 100), 0)
    : 0

  const formatAmount = (value: number, notation: 'standard' | 'compact' = 'compact'): string => {
    if (isLoading || !Number.isFinite(value)) {
      return '—'
    }
    const normalizedValue = Number(value)
    const requiresDecimals = Math.abs(normalizedValue) < 1
    return formatCurrency(normalizedValue, {
      currency: currencyBase,
      locale: 'ar-SA',
      notation,
      minimumFractionDigits: requiresDecimals ? 2 : 0,
      maximumFractionDigits: requiresDecimals ? 2 : 0
    })
  }

  const formatDateTime = (value: string | null): string => {
    if (!value) {
      return '—'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '—'
    }
    return new Intl.DateTimeFormat('ar-SA', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }

  const quickIndicators: IndicatorConfig[] = [
    {
      label: 'السيولة',
      value: formatAmount(cashOnHand),
      tone: balanceRatio >= 100 ? 'success' : balanceRatio >= 60 ? 'warning' : 'error',
      icon: Wallet,
    },
    {
      label: 'الربح الشهري',
      value: formatAmount(monthlyNetEstimate, 'standard'),
      tone: monthlyNetEstimate >= 0 ? 'success' : 'error',
      icon: TrendingUp,
    },
    {
      label: 'التدفق النقدي',
      value: formatAmount(netCashMovement, 'standard'),
      tone: netCashMovement >= 0 ? 'success' : 'warning',
      icon: netCashMovement >= 0 ? ArrowUpRight : ArrowDownRight,
    },
  ]

  const cashFlowMeta = {
    healthy: {
      badgeStatus: 'success' as StatusBadgeProps['status'],
      badgeLabel: 'مستقر',
      alertVariant: 'success' as const,
      message: 'التدفق النقدي يغطي الالتزامات الحالية ويتيح مجالًا للتوسع الآمن.',
    },
    warning: {
      badgeStatus: 'warning' as StatusBadgeProps['status'],
      badgeLabel: 'تحذير',
      alertVariant: 'warning' as const,
      message: 'تنخفض نسبة التغطية عن المستوى المستهدف، راقب المصروفات لتفادي الضغط المالي.',
    },
    critical: {
      badgeStatus: 'error' as StatusBadgeProps['status'],
      badgeLabel: 'حرج',
      alertVariant: 'destructive' as const,
      message: 'السيولة الحالية غير كافية، نوصي بضخ موارد إضافية أو خفض الإنفاق فورًا.',
    },
  } as const

  const { badgeStatus, badgeLabel, alertVariant, message } = cashFlowMeta[cashFlowStatus]

  const dataLastUpdatedLabel = formatDateTime(lastUpdated)
  const currencyLastUpdatedLabel = formatDateTime(currencyLastUpdated)

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-3 space-y-2">
  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span data-testid="currency-base">
            العملة الأساسية:
            {' '}
            <span className="font-semibold text-foreground">{currencyBase}</span>
          </span>
          <span data-testid="currency-updated">
            أسعار الصرف: {currencyLastUpdatedLabel}
          </span>
        </div>

        <InlineAlert
          variant={alertVariant}
          icon={cashFlowStatus === 'healthy' ? <CheckCircle className="h-4 w-4" aria-hidden /> : <AlertCircle className="h-4 w-4" aria-hidden />}
          title="الوضع المالي"
          description={message}
          actions={(
            <StatusBadge
              status={badgeStatus}
              label={badgeLabel}
              size="sm"
              showIcon={false}
              className="shadow-none"
            />
          )}
        >
          <span className="text-xs text-muted-foreground">
            نسبة تغطية المصروفات الحالية: {Math.round(balanceRatio)}%
          </span>
        </InlineAlert>

        <div className="space-y-1">
          {quickIndicators.map((indicator, index) => (
            <motion.div
              key={indicator.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={`flex items-center justify-between gap-2 rounded-lg border p-2 ${indicatorToneStyles[indicator.tone].container}`}>
                <div className="flex items-center gap-2">
                  <indicator.icon className={`h-3 w-3 ${indicatorToneStyles[indicator.tone].accent}`} />
                  <span className="text-xs font-medium text-foreground">{indicator.label}</span>
                </div>
                <span className={`text-xs font-bold ${indicatorToneStyles[indicator.tone].accent}`}>
                  {indicator.value}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-primary/10 p-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">هامش الربح الشهري</span>
            <span className="text-sm font-bold text-primary">{profitMarginDisplay}</span>
          </div>
          <Progress value={profitMarginProgress} className="h-1.5" />
        </div>

        <div className="flex gap-1 border-t border-border pt-2">
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onSectionChange('financial')}
          >
            <DollarSign className="h-3 w-3 ml-1" />
            التفاصيل
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs"
            onClick={() => onSectionChange('reports')}
          >
            <BarChart3 className="h-3 w-3 ml-1" />
            التقارير
          </Button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground" data-testid="financial-last-updated">
            آخر تحديث للبيانات: {dataLastUpdatedLabel}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-primary"
            onClick={() => {
              void refresh()
            }}
            disabled={isLoading}
          >
            <RefreshCcw className="h-3 w-3 ml-1" />
            تحديث المؤشرات
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}