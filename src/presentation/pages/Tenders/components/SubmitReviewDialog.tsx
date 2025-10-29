/**
 * Submit Review Dialog Component
 * Quick review dialog before submitting a tender
 * Shows pricing summary and technical files status
 */

import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, FileText, Package } from 'lucide-react'
import { useTenderPricingStore } from '@/stores/tenderPricingStore'
import type { Tender } from '@/data/centralData'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Separator } from '@/presentation/components/ui/separator'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'

interface SubmitReviewDialogProps {
  open: boolean
  tender: Tender | null
  onClose: () => void
  onConfirm: () => void
}

/**
 * Format currency value with SAR
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function SubmitReviewDialog({ open, tender, onClose, onConfirm }: SubmitReviewDialogProps) {
  const { boqItems, loadPricing, getTotalValue, getPricedItemsCount, getCompletionPercentage } =
    useTenderPricingStore()

  // Load pricing data when dialog opens
  useEffect(() => {
    if (open && tender?.id) {
      void loadPricing(tender.id)
    }
  }, [open, tender?.id, loadPricing])

  if (!tender) {
    return null
  }

  const totalItems = boqItems.length
  const pricedItems = getPricedItemsCount()
  const completionPercentage = getCompletionPercentage()
  const totalValue = getTotalValue()
  const vatRate = 0.15
  const vatAmount = totalValue * vatRate
  const totalWithVat = totalValue + vatAmount
  const isComplete = completionPercentage === 100

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl">مراجعة قبل الإرسال</DialogTitle>
          <DialogDescription>تأكد من اكتمال جميع البيانات قبل إرسال المنافسة</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 px-1">
          {/* Tender Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                معلومات المنافسة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">اسم المنافسة</p>
                  <p className="font-medium">{tender.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">العميل</p>
                  <p className="font-medium">{tender.client || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الموقع</p>
                  <p className="font-medium">{tender.location || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الموعد النهائي</p>
                  <p className="font-medium">
                    {tender.deadline
                      ? new Date(tender.deadline).toLocaleDateString('ar-SA')
                      : 'غير محدد'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                ملخص التسعير
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{totalItems}</p>
                  <p className="text-sm text-muted-foreground">إجمالي البنود</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent-foreground">{pricedItems}</p>
                  <p className="text-sm text-muted-foreground">البنود المُسعَّرة</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{completionPercentage}%</p>
                  <p className="text-sm text-muted-foreground">نسبة الإكمال</p>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg bg-primary/5 p-4 text-center space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">القيمة قبل الضريبة</p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ضريبة القيمة المضافة (15%)</p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {formatCurrency(vatAmount)}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    القيمة الإجمالية (شاملة الضريبة)
                  </p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(totalWithVat)}</p>
                </div>
              </div>

              {/* Completion Status */}
              {isComplete ? (
                <Alert className="border-primary bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-foreground">
                    تم استكمال تسعير جميع البنود بنجاح! المنافسة جاهزة للإرسال.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    التسعير غير مكتمل. يجب تسعير جميع البنود قبل الإرسال.
                    <br />
                    البنود المتبقية: <strong>{totalItems - pricedItems}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Technical Files Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                الملفات الفنية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tender.documents && tender.documents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    عدد الملفات المرفقة: <strong>{tender.documents.length}</strong>
                  </p>
                  <Alert className="border-primary bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-foreground">
                      تم رفع الملفات الفنية بنجاح
                    </AlertDescription>
                  </Alert>
                </div>
              ) : tender.technicalFilesUploaded ? (
                <Alert className="border-primary bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-foreground">
                    تم رفع الملفات الفنية بنجاح
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    لم يتم رفع أي ملفات فنية. يُنصح برفع الملفات الفنية قبل الإرسال.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 flex-shrink-0 mt-4">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={onConfirm} disabled={!isComplete} className="min-w-[120px]">
            {isComplete ? 'تأكيد الإرسال' : 'استكمل التسعير أولاً'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
