'use client'

import type { ComponentType } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCcw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/utils/formatters'
import { useDashboardMetrics } from '@/application/hooks/useDashboardMetrics'
import { getHealthColor } from '../utils/statusColors'

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

type IndicatorStatus = 'good' | 'warning' | 'critical'
interface IndicatorConfig {
  label: string
  value: string
  status: IndicatorStatus
  icon: ComponentType<{ className?: string }>
  color: 'green' | 'amber' | 'red'
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
      status: balanceRatio >= 100 ? 'good' : balanceRatio >= 60 ? 'warning' : 'critical',
      icon: Wallet,
      color: balanceRatio >= 100 ? 'green' : balanceRatio >= 60 ? 'amber' : 'red'
    },
    {
      label: 'الربح الشهري',
      value: formatAmount(monthlyNetEstimate, 'standard'),
      status: monthlyNetEstimate >= 0 ? 'good' : 'critical',
      icon: TrendingUp,
      color: monthlyNetEstimate >= 0 ? 'green' : 'red'
    },
    {
      label: 'التدفق النقدي',
      value: formatAmount(netCashMovement, 'standard'),
      status: netCashMovement >= 0 ? 'good' : 'warning',
      icon: netCashMovement >= 0 ? ArrowUpRight : ArrowDownRight,
      color: netCashMovement >= 0 ? 'green' : 'amber'
    }
  ]

  const badgeVariant = cashFlowStatus === 'healthy'
    ? 'success'
    : cashFlowStatus === 'warning'
      ? 'warning'
      : 'destructive'

  const dataLastUpdatedLabel = formatDateTime(lastUpdated)
  const currencyLastUpdatedLabel = formatDateTime(currencyLastUpdated)

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span data-testid="currency-base">
            العملة الأساسية:
            {' '}
            <span className="font-semibold text-foreground">{currencyBase}</span>
          </span>
          <span data-testid="currency-updated">
            أسعار الصرف: {currencyLastUpdatedLabel}
          </span>
        </div>

        <div
          className={`p-2 rounded-lg border ${
            cashFlowStatus === 'healthy'
              ? 'bg-success/10 border-success/20'
              : cashFlowStatus === 'warning'
                ? 'bg-warning/10 border-warning/20'
                : 'bg-destructive/10 border-destructive/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle
                className={`h-3 w-3 ${
                  cashFlowStatus === 'healthy' ? 'text-success' : cashFlowStatus === 'warning' ? 'text-warning' : 'text-destructive'
                }`}
              />
              <span className="text-xs font-semibold text-foreground">الوضع المالي</span>
            </div>
            <Badge variant={badgeVariant} className="text-xs">
              {cashFlowStatus === 'healthy' ? 'مستقر' : cashFlowStatus === 'warning' ? 'تحذير' : 'حرج'}
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          {quickIndicators.map((indicator, index) => (
            <motion.div
              key={indicator.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={`p-2 rounded-lg border flex items-center justify-between ${getHealthColor(indicator.status)}`}>
                <div className="flex items-center gap-2">
                  <indicator.icon className={`h-3 w-3 text-${indicator.color}-500`} />
                  <span className="text-xs font-medium text-foreground">{indicator.label}</span>
                </div>
                <span className={`text-xs font-bold text-${indicator.color}-500`}>
                  {indicator.value}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-2 bg-gradient-to-r from-primary/5 to-indigo-500/5 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">هامش الربح الشهري</span>
            <span className="text-sm font-bold text-primary">{profitMarginDisplay}</span>
          </div>
          <Progress value={profitMarginProgress} className="h-1.5" />
        </div>

        <div className="flex gap-1 pt-2 border-t border-border">
          <Button
            size="sm"
            className="flex-1 h-6 text-xs bg-success text-white hover:bg-success/90"
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
            className="h-6 text-[11px] text-muted-foreground hover:text-primary"
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