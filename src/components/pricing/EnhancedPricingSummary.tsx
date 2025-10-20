/**
 * Enhanced Pricing Summary Component
 * ملخص التسعير المحسّن
 *
 * الميزات:
 * - عرض إجمالي الربح ✅
 * - عرض إجمالي التكاليف الإدارية ✅
 * - عرض إجمالي التكاليف التشغيلية ✅
 * - تصميم 5 بطاقات محسّن ✅
 * - ألوان وظلال واضحة ✅
 */

import { DollarSign, TrendingUp, Calculator, Percent, Settings, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface EnhancedPricingSummaryProps {
  totals: {
    grandTotal: number
    totalMaterials: number
    totalLabor: number
    totalEquipment: number
    totalSubcontractors: number
    vatAmount: number
    totalWithVat: number
    totalAdministrative: number
    totalOperational: number
    totalProfit: number
  }
  formatCurrency: (value: number) => string
}

export const EnhancedPricingSummary: React.FC<EnhancedPricingSummaryProps> = ({
  totals,
  formatCurrency,
}) => {
  const profitPercentage = totals.grandTotal > 0 ? (totals.totalProfit / totals.grandTotal) * 100 : 0
  const overheadPercentage = totals.grandTotal > 0 ? ((totals.totalAdministrative + totals.totalOperational) / totals.grandTotal) * 100 : 0

  return (
    <div className="space-y-4">
      {/* العنوان */}
      <div className="flex items-center gap-3 pb-2 border-b-2">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
          <Calculator className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">ملخص التسعير الإجمالي</h2>
          <p className="text-sm text-muted-foreground">الإجماليات والمؤشرات المالية الرئيسية</p>
        </div>
      </div>

      {/* الصف الأول - 3 بطاقات (المشروع، الضريبة، الإجمالي النهائي) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* إجمالي المشروع (قبل الضريبة) */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-xl hover:shadow-2xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <div className="text-right flex-1 mr-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">إجمالي المشروع</p>
                <p className="text-4xl font-bold text-primary tabular-nums leading-tight">
                  {formatCurrency(totals.grandTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">قبل ضريبة القيمة المضافة</p>
              </div>
            </div>

            {/* تفاصيل التكاليف */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">المواد:</span>
                <span className="font-semibold text-blue-700 tabular-nums">{formatCurrency(totals.totalMaterials)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">العمالة:</span>
                <span className="font-semibold text-purple-700 tabular-nums">{formatCurrency(totals.totalLabor)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">المعدات:</span>
                <span className="font-semibold text-orange-700 tabular-nums">{formatCurrency(totals.totalEquipment)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">المقاولون:</span>
                <span className="font-semibold text-green-700 tabular-nums">{formatCurrency(totals.totalSubcontractors)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ضريبة القيمة المضافة */}
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-amber-25 to-background shadow-xl hover:shadow-2xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg">
                <Percent className="h-7 w-7 text-white" />
              </div>
              <div className="text-right flex-1 mr-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">ضريبة القيمة المضافة</p>
                <p className="text-4xl font-bold text-amber-600 tabular-nums leading-tight">
                  {formatCurrency(totals.vatAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">(15%)</p>
              </div>
            </div>

            {/* شريط الضريبة */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>نسبة الضريبة</span>
                <span className="font-semibold">15%</span>
              </div>
              <Progress
                value={15}
                className="h-3 bg-amber-100 shadow-inner"
                indicatorClassName="bg-gradient-to-r from-amber-400 to-amber-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* الإجمالي شامل الضريبة */}
        <Card className="border-2 border-success/40 bg-gradient-to-br from-success/10 via-success/5 to-background shadow-2xl hover:shadow-3xl transition-all ring-2 ring-success/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-success to-success/80 shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div className="text-right flex-1 mr-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">الإجمالي النهائي</p>
                <p className="text-4xl font-bold text-success tabular-nums leading-tight">
                  {formatCurrency(totals.totalWithVat)}
                </p>
                <p className="text-xs text-success/80 mt-2 font-semibold">شامل الضريبة</p>
              </div>
            </div>

            {/* المقارنة */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">الزيادة بالضريبة:</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="font-bold text-success tabular-nums">
                    +{formatCurrency(totals.vatAmount)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الصف الثاني - بطاقتان (التكاليف الإدارية/التشغيلية، الربح) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* التكاليف الإدارية والتشغيلية */}
        <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-background shadow-xl hover:shadow-2xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div className="text-right flex-1 mr-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">التكاليف غير المباشرة</p>
                <p className="text-4xl font-bold text-orange-600 tabular-nums leading-tight">
                  {formatCurrency(totals.totalAdministrative + totals.totalOperational)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">({overheadPercentage.toFixed(1)}% من الإجمالي)</p>
              </div>
            </div>

            {/* التفاصيل */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                  التكاليف الإدارية:
                </span>
                <span className="font-bold text-blue-700 tabular-nums">{formatCurrency(totals.totalAdministrative)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                  التكاليف التشغيلية:
                </span>
                <span className="font-bold text-orange-700 tabular-nums">{formatCurrency(totals.totalOperational)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الربح */}
        <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-background shadow-xl hover:shadow-2xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div className="text-right flex-1 mr-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">إجمالي الربح</p>
                <p className="text-4xl font-bold text-emerald-600 tabular-nums leading-tight">
                  {formatCurrency(totals.totalProfit)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">({profitPercentage.toFixed(1)}% من الإجمالي)</p>
              </div>
            </div>

            {/* شريط الربح */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>نسبة الربح</span>
                <span className="font-semibold">{profitPercentage.toFixed(1)}%</span>
              </div>
              <Progress
                value={Math.min(100, profitPercentage)}
                className="h-3 bg-emerald-100 shadow-inner"
                indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
