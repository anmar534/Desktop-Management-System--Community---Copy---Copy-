import React, { useState, useCallback, useEffect, useMemo } from 'react'
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

  // Memoize percentages to prevent infinite loop
  const percentages = useMemo(
    () => ({
      administrative: defaultPercentages.administrative,
      operational: defaultPercentages.operational,
      profit: defaultPercentages.profit,
    }),
    [defaultPercentages.administrative, defaultPercentages.operational, defaultPercentages.profit],
  )

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
        defaultPercentages: percentages,
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
    [itemQuantity, percentages],
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]" dir="rtl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-4 h-4 text-success" />
            إدخال السعر الإفرادي مباشرة
          </DialogTitle>
          <DialogDescription className="text-xs">
            أدخل السعر الإفرادي للبند مباشرة دون الحاجة لإدخال تفاصيل التكاليف
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-1">
          <div className="space-y-3 py-2">
            {/* معلومات البند */}
            <Card className="bg-muted/30">
              <CardContent className="p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم البند:</span>
                  <span className="font-semibold">{itemNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الوصف:</span>
                  <span className="font-medium text-right max-w-[250px] truncate">
                    {itemDescription}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الوحدة:</span>
                  <span className="font-semibold">{itemUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الكمية:</span>
                  <span className="font-bold text-info">{itemQuantity.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* إدخال السعر الإفرادي */}
            <div className="space-y-1.5">
              <Label htmlFor="unitPrice" className="text-sm font-semibold">
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
                  className="text-base font-bold text-center h-10"
                  dir="ltr"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                  ر.س
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                يشمل: التكاليف + الإدارية ({defaultPercentages.administrative}%) + التشغيلية (
                {defaultPercentages.operational}%) + الربح ({defaultPercentages.profit}%)
              </p>
            </div>

            {/* نتائج الحسابات */}
            {calculationResult && (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b text-xs">
                    <Calculator className="w-3.5 h-3.5 text-success" />
                    <span className="font-semibold text-success">نتائج الحساب</span>
                  </div>

                  {/* السعر الإجمالي */}
                  <div className="flex justify-between items-center bg-success/10 p-2 rounded text-xs">
                    <span className="font-medium">السعر الإجمالي:</span>
                    <span className="text-base font-bold text-success">
                      {formatCurrency(calculationResult.totalPrice, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* التكلفة الأساسية */}
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">التكلفة الأساسية:</span>
                    <span className="font-semibold">
                      {formatCurrency(calculationResult.subtotal, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* التكاليف الإدارية */}
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1">
                      <Settings className="w-3 h-3 text-destructive" />
                      <span className="text-muted-foreground">
                        إدارية ({defaultPercentages.administrative}%):
                      </span>
                    </div>
                    <span className="font-semibold text-destructive">
                      {formatCurrency(calculationResult.administrative, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* التكاليف التشغيلية */}
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-warning" />
                      <span className="text-muted-foreground">
                        تشغيلية ({defaultPercentages.operational}%):
                      </span>
                    </div>
                    <span className="font-semibold text-warning">
                      {formatCurrency(calculationResult.operational, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* الأرباح */}
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-muted-foreground">
                        أرباح ({defaultPercentages.profit}%):
                      </span>
                    </div>
                    <span className="font-semibold text-success">
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
              <CardContent className="p-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
                  <div className="text-[10px] text-warning space-y-0.5">
                    <p className="font-semibold">ملاحظة:</p>
                    <p>• لن تحتاج لإدخال تفاصيل التكاليف (مواد، عمالة، معدات)</p>
                    <p>• النسب مستخرجة بناءً على الإعدادات الافتراضية</p>
                    <p>• يمكن العودة للتسعير التفصيلي بزر &ldquo;تعديل&rdquo;</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-success hover:bg-success/90"
            size="sm"
          >
            <DollarSign className="w-3.5 h-3.5 ml-1" />
            حفظ السعر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
