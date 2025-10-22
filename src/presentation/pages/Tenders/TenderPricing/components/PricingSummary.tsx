/**
 * @fileoverview PricingSummary Component
 * @description Displays pricing totals, percentages, and breakdown summary
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { TrendingUp, DollarSign, Percent } from 'lucide-react'
import type { PricingPercentages } from '@/shared/types/pricing'

interface PricingSummaryProps {
  totals: {
    materials: number
    labor: number
    equipment: number
    subcontractors: number
    directCost: number
    administrative: number
    operational: number
    profit: number
    subtotal: number
    vat: number
    grandTotal: number
  }
  percentages: PricingPercentages
  formatCurrency: (value: number) => string
  className?: string
}

export const PricingSummary: React.FC<PricingSummaryProps> = ({
  totals,
  percentages,
  formatCurrency,
  className = '',
}) => {
  const costItems = [
    { label: 'المواد', value: totals.materials, icon: DollarSign, color: 'text-primary' },
    { label: 'العمالة', value: totals.labor, icon: DollarSign, color: 'text-muted-foreground' },
    { label: 'المعدات', value: totals.equipment, icon: DollarSign, color: 'text-primary' },
    { label: 'المقاولون', value: totals.subcontractors, icon: DollarSign, color: 'text-primary' },
  ]

  const additionalCosts = [
    {
      label: 'إدارية',
      value: totals.administrative,
      percentage: percentages.administrative,
      color: 'text-muted-foreground',
    },
    {
      label: 'تشغيلية',
      value: totals.operational,
      percentage: percentages.operational,
      color: 'text-muted-foreground',
    },
    {
      label: 'ربح',
      value: totals.profit,
      percentage: percentages.profit,
      color: 'text-primary',
    },
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Direct Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            التكاليف المباشرة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {costItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                {item.label}
              </span>
              <span className="font-medium">{formatCurrency(item.value)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
            <span>الإجمالي المباشر</span>
            <span className="text-lg">{formatCurrency(totals.directCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Additional Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            النسب الإضافية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {additionalCosts.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={item.color}>{item.label}</span>
                <Badge variant="outline" className="text-xs">
                  {item.percentage}%
                </Badge>
              </span>
              <span className="font-medium">{formatCurrency(item.value)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex items-center justify-between font-semibold">
            <span>الإجمالي الفرعي</span>
            <span className="text-lg">{formatCurrency(totals.subtotal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Grand Total */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                ضريبة القيمة المضافة (15%)
              </span>
              <span className="font-medium">{formatCurrency(totals.vat)}</span>
            </div>
            <div className="border-t-2 border-primary/20 pt-3 flex items-center justify-between">
              <span className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                الإجمالي النهائي
              </span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
