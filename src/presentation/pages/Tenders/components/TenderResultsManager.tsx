// TenderResultsManager provides a guided flow for updating tender results.
import { useState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Trophy, XCircle, Clock, DollarSign, FileText, AlertCircle } from 'lucide-react'
import { useSystemData } from '@/application/hooks/useSystemData'
import { toast } from 'sonner'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import { formatDateValue } from '@/shared/utils/formatters/formatters'
import { TenderNotificationService } from '@/shared/utils/tender/tenderNotifications'
import { ProjectAutoCreationService } from '@/application/services/projectAutoCreation'
import type { Tender } from '@/data/centralData'

// دالة إنشاء أمر شراء للمنافسة الفائزة - تم نقلها إلى TenderDetails عند الإرسال
// هذه الدالة لم تعد مستخدمة هنا لأن أوامر الشراء تُنشأ عند إرسال المنافسة وليس عند الفوز

type DevelopmentStatsEvent = 'won_tender' | 'lost_tender'

// دالة تحديث إحصائيات التطوير باستخدام الخدمة الموحدة
const updateDevelopmentStats = async (eventType: DevelopmentStatsEvent, tender: Tender) => {
  try {
    const { developmentStatsService } = await import(
      '@/application/services/developmentStatsService'
    )

    switch (eventType) {
      case 'won_tender':
        developmentStatsService.updateStatsForTenderWon(tender)
        break
      case 'lost_tender':
        developmentStatsService.updateStatsForTenderLost(tender)
        break
    }

    console.log('✅ تم تحديث إحصائيات التطوير:', eventType)
  } catch (error) {
    console.error('❌ خطأ في تحديث إحصائيات التطوير:', error)
  }
}

interface TenderResultsManagerProps {
  tender: Tender
  onUpdate?: () => void
}

export function TenderResultsManager({ tender, onUpdate }: TenderResultsManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showWonDialog, setShowWonDialog] = useState(false)
  const [showLostDialog, setShowLostDialog] = useState(false)
  const [winningBidValue, setWinningBidValue] = useState('')
  const { updateTender } = useSystemData()
  const tenderBaseValue = tender.totalValue ?? tender.value ?? 0
  const tenderResultDate = tender.winDate ?? tender.lostDate ?? null
  const { formatCurrencyValue } = useCurrencyFormatter()

  // دالة تحديث النتيجة إلى فائزة (مع حوار تأكيدي)
  const handleMarkAsWon = () => {
    setShowWonDialog(true)
  }

  // تأكيد الفوز
  const confirmMarkAsWon = async () => {
    setIsUpdating(true)
    setShowWonDialog(false)
    try {
      const currentDate = new Date().toISOString()
      const updatePayload: Partial<Tender> = {
        status: 'won',
        winDate: currentDate,
        resultDate: currentDate,
        lastAction: 'تم الفوز بالمنافسة! 🎉',
        lastUpdate: currentDate,
      }

      const updatedTender = await updateTender(tender.id, updatePayload)
      TenderNotificationService.notifyStatusChange(updatedTender, 'won')

      // تحديث إحصائيات التطوير
      await updateDevelopmentStats('won_tender', updatedTender)

      // إنشاء مشروع تلقائياً من المنافسة الفائزة
      console.log('🏗️ بدء إنشاء مشروع تلقائي للمنافسة الفائزة...')
      const projectCreationResult = await ProjectAutoCreationService.createProjectFromWonTender(
        updatedTender,
        {
          copyPricingData: true,
          copyQuantityTable: true,
          autoGenerateTasks: true,
          notifyTeam: true,
        },
      )

      if (projectCreationResult.success) {
        const projectName = projectCreationResult.project?.name ?? updatedTender.name
        toast.success('تم الفوز بالمنافسة وإنشاء المشروع!', {
          description: `تم إنشاء مشروع "${projectName}" تلقائياً`,
        })
        console.log('✅ تم إنشاء المشروع بنجاح:', projectCreationResult.projectId)
      } else {
        const errorMessage =
          projectCreationResult.errors?.join(', ') ?? 'لا يمكن إنشاء مشروع تلقائي'
        toast.success('تم الفوز بالمنافسة!', {
          description: `تحديث الإحصائيات تم - ${errorMessage}`,
        })
        console.warn('⚠️ خطأ في إنشاء المشروع:', projectCreationResult.errors)
      }

      // عدم إعادة التوجيه - البقاء في نفس الصفحة
      if (onUpdate) {
        onUpdate()
      } else {
        // تحديث الصفحة الحالية دون إعادة توجيه
        const { APP_EVENTS, emit } = await import('@/events/bus')
        emit(APP_EVENTS.TENDER_UPDATED)
      }
    } catch (error) {
      console.error('Error updating tender result:', error)
      toast.error('حدث خطأ أثناء تحديث النتيجة')
    } finally {
      setIsUpdating(false)
    }
  }

  // دالة تحديث النتيجة إلى خاسرة (مع حوار لإدخال قيمة العرض الفائز)
  const handleMarkAsLost = () => {
    setShowLostDialog(true)
  }

  // تأكيد الخسارة
  const confirmMarkAsLost = async () => {
    const parsedWinningBidValue = Number.parseFloat(winningBidValue)

    if (!Number.isFinite(parsedWinningBidValue) || parsedWinningBidValue <= 0) {
      toast.error('يرجى إدخال قيمة العرض الفائز')
      return
    }

    setIsUpdating(true)
    setShowLostDialog(false)
    try {
      const currentDate = new Date().toISOString()
      const updatePayload: Partial<Tender> = {
        status: 'lost',
        lostDate: currentDate,
        resultDate: currentDate,
        lastAction: 'لم يتم الفوز بالمنافسة',
        lastUpdate: currentDate,
        winningBidValue: parsedWinningBidValue,
      }

      const updatedTender = await updateTender(tender.id, updatePayload)
      TenderNotificationService.notifyStatusChange(updatedTender, 'lost')

      // تحديث إحصائيات التطوير للخسارة
      await updateDevelopmentStats('lost_tender', updatedTender)

      toast.success('تم تحديث حالة المنافسة إلى خاسرة')

      // عدم إعادة التوجيه - البقاء في نفس الصفحة
      if (onUpdate) {
        onUpdate()
      } else {
        // تحديث الصفحة الحالية دون إعادة توجيه
        const { APP_EVENTS, emit } = await import('@/events/bus')
        emit(APP_EVENTS.TENDER_UPDATED)
      }
    } catch (error) {
      console.error('Error updating tender result:', error)
      toast.error('حدث خطأ أثناء تحديث النتيجة')
    } finally {
      setIsUpdating(false)
      setWinningBidValue('')
    }
  }

  // دالة للعودة إلى حالة بانتظار النتائج (في حالة تم تحديث النتيجة بالخطأ)
  const handleMarkAsWaiting = async () => {
    setIsUpdating(true)
    try {
      const updatePayload: Partial<Tender> = {
        status: 'submitted',
        lastAction: 'بانتظار النتائج',
        lastUpdate: new Date().toISOString(),
      }

      await updateTender(tender.id, updatePayload)
      toast.success('تم التراجع عن النتيجة', {
        description: 'تم تحديث حالة المنافسة إلى &quot;بانتظار النتائج&quot;',
      })

      onUpdate?.()
    } catch (error) {
      console.error('Error updating tender status:', error)
      toast.error('حدث خطأ أثناء تحديث الحالة')
    } finally {
      setIsUpdating(false)
    }
  }

  // تحديد الحالة الحالية والأزرار المتاحة
  const currentStatus: Tender['status'] = tender.status

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-info" />
              إدارة نتائج المنافسة
            </span>
            <Badge
              variant={
                currentStatus === 'won'
                  ? 'default'
                  : currentStatus === 'lost'
                    ? 'destructive'
                    : currentStatus === 'submitted'
                      ? 'secondary'
                      : 'outline'
              }
              className="text-sm"
            >
              {currentStatus === 'ready_to_submit' && 'جاهزة للتقديم'}
              {currentStatus === 'submitted' && 'بانتظار النتائج'}
              {currentStatus === 'won' && '🏆 فائزة'}
              {currentStatus === 'lost' && '❌ خاسرة'}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* معلومات المنافسة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">قيمة المنافسة:</span>
              <span className="font-medium">{formatCurrencyValue(tenderBaseValue)}</span>
            </div>

            {tender.submissionDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">تاريخ التقديم:</span>
                <span className="font-medium">
                  {formatDateValue(tender.submissionDate, {
                    locale: 'ar-SA',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {tenderResultDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">تاريخ النتيجة:</span>
                <span className="font-medium">
                  {formatDateValue(tenderResultDate, {
                    locale: 'ar-SA',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* الأزرار حسب الحالة */}
          <div className="flex flex-wrap gap-3 pt-2">
            {/* أزرار النتائج للمنافسات المقدمة */}
            {currentStatus === 'submitted' && (
              <>
                <Button
                  onClick={handleMarkAsWon}
                  disabled={isUpdating}
                  className="bg-success text-background hover:bg-success/90 gap-2"
                >
                  <Trophy className="h-4 w-4" />✅ فائزة
                </Button>

                <Button
                  onClick={handleMarkAsLost}
                  disabled={isUpdating}
                  variant="destructive"
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />❌ خاسرة
                </Button>
              </>
            )}

            {/* زر التراجع للمنافسات المنتهية */}
            {(currentStatus === 'won' || currentStatus === 'lost') && (
              <Button
                onClick={handleMarkAsWaiting}
                disabled={isUpdating}
                variant="outline"
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                تراجع عن النتيجة
              </Button>
            )}
          </div>

          {/* رسائل إرشادية */}
          <div className="mt-4 p-3 bg-info/10 rounded-lg border border-info/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
              <div className="text-sm text-info">
                {currentStatus === 'ready_to_submit' && (
                  <p>
                    <strong>المنافسة جاهزة للتقديم!</strong> يمكنك الآن تقديم العرض للعميل.
                  </p>
                )}
                {currentStatus === 'submitted' && (
                  <p>
                    <strong>تم تقديم العرض بنجاح.</strong> بانتظار إعلان النتائج من العميل.
                  </p>
                )}
                {currentStatus === 'won' && (
                  <p>
                    <strong>🎉 مبروك! تم الفوز بهذه المنافسة.</strong> يمكنك الآن البدء في تنفيذ
                    المشروع.
                  </p>
                )}
                {currentStatus === 'lost' && (
                  <p>
                    <strong>لم يتم الفوز بهذه المنافسة.</strong> يمكنك مراجعة التسعير للمنافسات
                    المستقبلية.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* حوار تأكيد الفوز */}
      <AlertDialog open={showWonDialog} onOpenChange={setShowWonDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-right">
              <Trophy className="h-5 w-5 text-success" />
              تأكيد الفوز بالمنافسة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من أن المنافسة &quot;{tender.name}&quot; فائزة؟
              <br />
              سيتم إنشاء مشروع جديد تلقائياً وتحديث جميع الإحصائيات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMarkAsWon}
              className="bg-success text-background hover:bg-success/90"
              disabled={isUpdating}
            >
              {isUpdating ? 'جاري التحديث...' : 'تأكيد الفوز'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حوار تأكيد الخسارة مع إدخال قيمة العرض الفائز */}
      <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <XCircle className="h-5 w-5 text-destructive" />
              تأكيد خسارة المنافسة
            </DialogTitle>
            <DialogDescription className="text-right">
              يرجى إدخال قيمة العرض الفائز لتسجيل نتيجة المنافسة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-right">
              <Label htmlFor="winningBid" className="text-sm font-medium">
                قيمة العرض الفائز (ريال سعودي)
              </Label>
              <Input
                id="winningBid"
                type="number"
                placeholder="0.00"
                value={winningBidValue}
                onChange={(e) => setWinningBidValue(e.target.value)}
                className="text-right mt-2"
                dir="rtl"
              />
            </div>

            <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-sm text-warning">
                  <p>ملاحظة: قيمة عرضنا كانت {formatCurrencyValue(tenderBaseValue)}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLostDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={confirmMarkAsLost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isUpdating}
            >
              {isUpdating ? 'جاري التحديث...' : 'تأكيد الخسارة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

