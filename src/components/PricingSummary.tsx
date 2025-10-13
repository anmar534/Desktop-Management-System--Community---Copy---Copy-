import type React from 'react'
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

interface PricingSummaryMetrics {
  totalValue: number
  vatAmount: number
  totalWithVat: number
  profit: number
  adminOperational: number
  profitPercentage: number
  adminOperationalPercentage: number
  vatRate: number
}

interface PricingSummaryProps {
  totals?: PricingSummaryMetrics | null
  dir?: 'rtl' | 'ltr'
}

/**
 * يعرض ملخص الأسعار اعتماداً بالكامل على totals القادمة من Snapshot.
 * لا يقوم بأي حسابات إضافية – العرض فقط.
 */
export const PricingSummary: React.FC<PricingSummaryProps> = ({ totals, dir = 'rtl' }) => {
  console.log('🎯 [PricingSummary] Rendering with totals:', totals)

  const { formatCurrencyValue } = useCurrencyFormatter()

  if (!totals) {
    console.log('⚠️ [PricingSummary] No totals provided - not rendering')
    return null
  }

  const {
    totalValue,
    vatAmount,
    totalWithVat,
    profit,
    adminOperational,
    profitPercentage,
    adminOperationalPercentage,
    vatRate
  } = totals
  
  console.log('💰 [PricingSummary] Extracted values:', {
    totalValue,
    vatAmount, 
    totalWithVat,
    profit,
    adminOperational,
    profitPercentage,
    adminOperationalPercentage,
    vatRate
  })
  const summaryItems: {
    label: string
    amount: number
    tone: 'primary' | 'warning' | 'success' | 'info' | 'secondary'
    subLabel: string
  }[] = [
    {
      label: 'إجمالي المشروع',
      amount: totalValue,
      tone: 'primary',
      subLabel: 'ر.س (قبل الضريبة)'
    },
    {
      label: `ضريبة القيمة المضافة (${(vatRate * 100).toFixed(0)}%)`,
      amount: vatAmount,
      tone: 'warning',
      subLabel: 'ر.س'
    },
    {
      label: 'الإجمالي شامل الضريبة',
      amount: totalWithVat,
      tone: 'success',
      subLabel: 'ر.س'
    },
    {
      label: `إجمالي الربح (${profitPercentage?.toFixed(2)}%)`,
      amount: profit,
      tone: 'info',
      subLabel: 'ر.س'
    },
    {
      label: `التكاليف الإدارية + التشغيلية (${adminOperationalPercentage?.toFixed(2)}%)`,
      amount: adminOperational,
      tone: 'secondary',
      subLabel: 'ر.س'
    },
  ]

  const toneStyles: Record<
    'primary' | 'warning' | 'success' | 'info' | 'secondary',
    { container: string; heading: string; value: string }
  > = {
    primary: {
      container: 'bg-primary/10 border-primary/20',
      heading: 'text-primary',
      value: 'text-primary'
    },
    warning: {
      container: 'bg-warning/10 border-warning/20',
      heading: 'text-warning',
      value: 'text-warning'
    },
    success: {
      container: 'bg-success/10 border-success/20',
      heading: 'text-success',
      value: 'text-success'
    },
    info: {
      container: 'bg-info/10 border-info/20',
      heading: 'text-info',
      value: 'text-info'
    },
    secondary: {
      container: 'bg-muted/20 border-muted/30',
      heading: 'text-muted-foreground',
      value: 'text-muted-foreground'
    }
  }

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5" dir={dir}>
      {summaryItems.map((item) => {
        const style = toneStyles[item.tone]
        return (
          <div
            key={item.label}
            className={`flex flex-col items-center rounded-lg border p-3 text-center ${style.container}`}
          >
            <div className={`text-xs font-medium tracking-wide ${style.heading}`}>{item.label}</div>
            <div className={`mt-1 text-lg font-bold leading-tight ${style.value}`}>
              {formatCurrencyValue(item.amount, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
            <div className={`mt-0.5 text-xs ${style.heading}`}>{item.subLabel}</div>
          </div>
        )
      })}
    </div>
  )
}
