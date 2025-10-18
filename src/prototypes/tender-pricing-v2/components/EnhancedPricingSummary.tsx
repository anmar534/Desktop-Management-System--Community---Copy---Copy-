/**
 * Enhanced Pricing Summary Component
 * ملخص التسعير المحسّن - نموذج أولي
 *
 * التحسينات:
 * - نظام ألوان محسّن (3 ألوان رئيسية بدلاً من 5)
 * - تباعد أفضل
 * - طباعة أوضح للأرقام
 * - هرمية بصرية واضحة
 */

import { DollarSign, TrendingUp, Calculator, Percent } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

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

interface EnhancedPricingSummaryProps {
  totals: PricingSummaryMetrics
  formatCurrency: (value: number) => string
}

export const EnhancedPricingSummary: React.FC<EnhancedPricingSummaryProps> = ({
  totals,
  formatCurrency,
}) => {
  const {
    totalValue,
    vatAmount,
    totalWithVat,
    profit,
    adminOperational,
    profitPercentage,
    adminOperationalPercentage,
    vatRate,
  } = totals

  return (
    <div className="space-y-4">
      {/* العنوان */}
      <div className="flex items-center gap-3 pb-2 border-b">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">ملخص التسعير</h3>
          <p className="text-sm text-muted-foreground">الإجماليات والنسب المالية</p>
        </div>
      </div>

      {/* البطاقات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* إجمالي المشروع (قبل الضريبة) */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="text-right flex-1 mr-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي المشروع</p>
                <p className="text-3xl font-bold text-primary tabular-nums leading-tight">
                  {formatCurrency(totalValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">قبل الضريبة</p>
              </div>
            </div>

            {/* تفاصيل فرعية */}
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">الربح</span>
                <div className="text-right">
                  <span className="font-semibold text-info tabular-nums">
                    {formatCurrency(profit)}
                  </span>
                  <span className="text-xs text-muted-foreground mr-2">
                    ({profitPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">إداري + تشغيلي</span>
                <div className="text-right">
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(adminOperational)}
                  </span>
                  <span className="text-xs text-muted-foreground mr-2">
                    ({adminOperationalPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ضريبة القيمة المضافة */}
        <Card className="border-2 border-warning/40 bg-gradient-to-br from-warning/5 to-background hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning/15">
                <Percent className="h-6 w-6 text-warning" />
              </div>
              <div className="text-right flex-1 mr-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  ضريبة القيمة المضافة
                </p>
                <p className="text-3xl font-bold text-warning tabular-nums leading-tight">
                  {formatCurrency(vatAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ({(vatRate * 100).toFixed(0)}%)
                </p>
              </div>
            </div>

            {/* شريط مرئي للضريبة */}
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>نسبة الضريبة</span>
                <span className="font-semibold">{(vatRate * 100).toFixed(0)}%</span>
              </div>
              <Progress
                value={Math.min(100, Math.max(0, vatRate * 100))}
                className="h-2 bg-warning/15"
                indicatorClassName="bg-gradient-to-r from-warning to-warning/80"
              />
            </div>
          </CardContent>
        </Card>

        {/* الإجمالي شامل الضريبة */}
        <Card className="border-2 border-success/30 bg-gradient-to-br from-success/5 to-background hover:shadow-lg transition-all shadow-success/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div className="text-right flex-1 mr-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">الإجمالي النهائي</p>
                <p className="text-3xl font-bold text-success tabular-nums leading-tight">
                  {formatCurrency(totalWithVat)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">شامل الضريبة</p>
              </div>
            </div>

            {/* مقارنة */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">الزيادة</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="font-semibold text-success tabular-nums">
                    +{formatCurrency(vatAmount)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ملخص مختصر للطباعة */}
      <Card className="border bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">القيمة الأساسية</p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">الربح</p>
              <p className="text-lg font-bold text-info tabular-nums">{formatCurrency(profit)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">الضريبة</p>
              <p className="text-lg font-bold text-warning tabular-nums">
                {formatCurrency(vatAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">الإجمالي النهائي</p>
              <p className="text-lg font-bold text-success tabular-nums">
                {formatCurrency(totalWithVat)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
