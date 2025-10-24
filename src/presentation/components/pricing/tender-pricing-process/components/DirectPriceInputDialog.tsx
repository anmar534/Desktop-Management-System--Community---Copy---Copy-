import React, { useState, useCallback, useEffect } from 'react'
import { DollarSign, Calculator, TrendingUp, Settings, Building, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { calculateReversePricing } from '@/shared/utils/pricing/reverseCalculations'
import type { PricingPercentages } from '@/shared/types/pricing'

export interface DirectPriceInputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemNumber: string
  itemDescription: string
  itemUnit: string
  itemQuantity: number
  defaultPercentages: PricingPercentages
  onSave: (unitPrice: number) => void
  formatCurrency: (
    value: number,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
  ) => string
}

export const DirectPriceInputDialog: React.FC<DirectPriceInputDialogProps> = ({
  open,
  onOpenChange,
  itemNumber,
  itemDescription,
  itemUnit,
  itemQuantity,
  defaultPercentages,
  onSave,
  formatCurrency,
}) => {
  const [unitPriceInput, setUnitPriceInput] = useState('')
  const [calculationResult, setCalculationResult] = useState<{
    unitPrice: number
    totalPrice: number
    subtotal: number
    administrative: number
    operational: number
    profit: number
  } | null>(null)

  // حساب الأسعار عند تغيير المدخلات
  const calculatePrices = useCallback(
    (input: string) => {
      const unitPrice = parseFloat(input.replace(/,/g, ''))
      if (isNaN(unitPrice) || unitPrice <= 0) {
        setCalculationResult(null)
        return
      }

      const totalPrice = unitPrice * itemQuantity

      const result = calculateReversePricing({
        itemTotalPrice: totalPrice,
        quantity: itemQuantity,
        defaultPercentages,
      })

      setCalculationResult({
        unitPrice: result.unitPrice,
        totalPrice,
        subtotal: result.subtotal,
        administrative: result.administrativeCost,
        operational: result.operationalCost,
        profit: result.profitCost,
      })
    },
    [itemQuantity, defaultPercentages],
  )

  // تحديث الحسابات عند تغيير المدخلات
  useEffect(() => {
    if (unitPriceInput) {
      calculatePrices(unitPriceInput)
    }
  }, [unitPriceInput, calculatePrices])

  // إعادة تعيين عند الفتح/الإغلاق
  useEffect(() => {
    if (!open) {
      setUnitPriceInput('')
      setCalculationResult(null)
    }
  }, [open])

  const handleSave = () => {
    if (calculationResult && calculationResult.unitPrice > 0) {
      onSave(calculationResult.unitPrice)
      onOpenChange(false)
    }
  }

  const isValid = calculationResult !== null && calculationResult.unitPrice > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-success" />
            إدخال السعر الإفرادي مباشرة
          </DialogTitle>
          <DialogDescription>
            أدخل السعر الإفرادي للبند مباشرة دون الحاجة لإدخال تفاصيل التكاليف
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* معلومات البند */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">رقم البند:</span>
                <span className="text-sm font-semibold">{itemNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">الوصف:</span>
                <span className="text-sm font-medium text-right max-w-[300px] truncate">
                  {itemDescription}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">الوحدة:</span>
                <span className="text-sm font-semibold">{itemUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">الكمية:</span>
                <span className="text-sm font-bold text-info">{itemQuantity.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* إدخال السعر الإفرادي */}
          <div className="space-y-2">
            <Label htmlFor="unitPrice" className="text-base font-semibold">
              السعر الإفرادي (ريال / {itemUnit})
            </Label>
            <div className="relative">
              <Input
                id="unitPrice"
                type="number"
                step="1"
                min="0"
                value={unitPriceInput}
                onChange={(e) => setUnitPriceInput(e.target.value)}
                placeholder="أدخل السعر الإفرادي"
                className="text-lg font-bold text-center"
                dir="ltr"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ر.س
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              السعر الإفرادي يشمل: التكاليف الأساسية + الإدارية ({defaultPercentages.administrative}
              %) + التشغيلية ({defaultPercentages.operational}%) + الربح (
              {defaultPercentages.profit}
              %)
            </p>
          </div>

          {/* نتائج الحسابات */}
          {calculationResult && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Calculator className="w-4 h-4 text-success" />
                  <span className="text-sm font-semibold text-success">نتائج الحساب التلقائي</span>
                </div>

                {/* السعر الإجمالي */}
                <div className="flex justify-between items-center bg-success/10 p-2 rounded">
                  <span className="text-sm font-medium">السعر الإجمالي للبند:</span>
                  <span className="text-lg font-bold text-success">
                    {formatCurrency(calculationResult.totalPrice, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* التكلفة الأساسية */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    التكلفة الأساسية (Subtotal):
                  </span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(calculationResult.subtotal, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* التكاليف الإدارية */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <Settings className="w-3 h-3 text-destructive" />
                    <span className="text-xs text-muted-foreground">
                      التكاليف الإدارية ({defaultPercentages.administrative}%):
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-destructive">
                    {formatCurrency(calculationResult.administrative, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* التكاليف التشغيلية */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-warning" />
                    <span className="text-xs text-muted-foreground">
                      التكاليف التشغيلية ({defaultPercentages.operational}%):
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-warning">
                    {formatCurrency(calculationResult.operational, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* الأرباح */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-xs text-muted-foreground">
                      الأرباح ({defaultPercentages.profit}%):
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-success">
                    {formatCurrency(calculationResult.profit, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* تحذير */}
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-xs text-warning space-y-1">
                  <p className="font-semibold">ملاحظة هامة:</p>
                  <p>
                    • استخدام هذه الطريقة يعني أنك لن تحتاج لإدخال تفاصيل التكاليف (مواد، عمالة،
                    معدات)
                  </p>
                  <p>• النسب المعروضة مستخرجة بناءً على النسب الافتراضية المحددة في الإعدادات</p>
                  <p>• يمكنك العودة للتسعير التفصيلي في أي وقت من خلال زر &ldquo;تعديل&rdquo;</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-success hover:bg-success/90"
          >
            <DollarSign className="w-4 h-4 ml-1" />
            حفظ السعر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
