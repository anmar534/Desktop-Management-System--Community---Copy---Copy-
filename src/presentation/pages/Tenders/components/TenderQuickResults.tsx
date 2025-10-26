// TenderQuickResults captures quick outcome data once a tender closes.
import { useState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
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
import { Trophy, XCircle, AlertCircle, Zap } from 'lucide-react'
import { useFinancialState } from '@/application/context'
import { APP_EVENTS, emit } from '@/events/bus'
import { toast } from 'sonner'
import { TenderNotificationService } from '@/shared/utils/tender/tenderNotifications'
import { ProjectAutoCreationService } from '@/application/services/projectAutoCreation'
import type { Tender } from '@/data/centralData'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'

type TenderResultType = 'won' | 'lost'

type DevelopmentStatsEvent = 'won_tender' | 'lost_tender'

const getTenderBaseValue = (tender: Tender): number => tender.totalValue ?? tender.value ?? 0

const parsePositiveNumber = (value: string): number | null => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

interface TenderQuickResultsProps {
  tender: Tender
  onUpdate?: () => void
}

export function TenderQuickResults({ tender, onUpdate }: TenderQuickResultsProps) {
  const [selectedResult, setSelectedResult] = useState<TenderResultType | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [winningBidValue, setWinningBidValue] = useState('')
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const { tenders } = useFinancialState()
  const { updateTender } = tenders
  const { formatCurrencyValue } = useCurrencyFormatter()

  // دالة تحديث إحصائيات التطوير
  const updateDevelopmentStats = async (
    eventType: DevelopmentStatsEvent,
    currentTender: Tender,
  ) => {
    try {
      const { developmentStatsService } = await import(
        '@/application/services/developmentStatsService'
      )

      if (eventType === 'won_tender') {
        developmentStatsService.updateStatsForTenderWon(currentTender)
      } else if (eventType === 'lost_tender') {
        developmentStatsService.updateStatsForTenderLost(currentTender)
      }
    } catch (error) {
      console.warn('تحذير: لا يمكن تحديث إحصائيات التطوير:', error)
    }
  }

  // دالة بدء إدخال النتيجة
  const handleResultSelection = (result: TenderResultType) => {
    setSelectedResult(result)
    setShowConfirmDialog(true)
  }

  // دالة تأكيد النتيجة
  const handleConfirmResult = async () => {
    if (!selectedResult) return

    // التحقق من البيانات المطلوبة
    const winningBidAmount = parsePositiveNumber(winningBidValue)

    if (selectedResult === 'lost' && winningBidAmount === null) {
      toast.error('يرجى إدخال قيمة العرض الفائز')
      return
    }

    setIsUpdating(true)
    setShowConfirmDialog(false)

    try {
      const currentDate = new Date().toISOString()
      const updatedTender = {
        ...tender,
        status: selectedResult,
        lastUpdate: currentDate,
        resultNotes: notes,
        ...(selectedResult === 'won'
          ? {
              winDate: currentDate,
              resultDate: currentDate,
              lastAction: 'تم الفوز بالمنافسة! 🎉',
              winningBidValue: tenderBaseValue,
            }
          : {
              lostDate: currentDate,
              resultDate: currentDate,
              lastAction: 'لم يتم الفوز بالمنافسة',
              winningBidValue: winningBidAmount,
              ourBidValue: tenderBaseValue,
            }),
      } as Tender

      await updateTender(updatedTender)
      TenderNotificationService.notifyStatusChange(tender, selectedResult)

      // تحديث إحصائيات التطوير
      const statsEvent: DevelopmentStatsEvent =
        selectedResult === 'won' ? 'won_tender' : 'lost_tender'
      await updateDevelopmentStats(statsEvent, updatedTender)

      if (selectedResult === 'won') {
        // إنشاء مشروع تلقائياً
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
          toast.success('تم الفوز بالمنافسة وإنشاء المشروع!', {
            description: `تم إنشاء مشروع "${projectCreationResult.project?.name}" تلقائياً`,
          })
        } else {
          toast.success('تم الفوز بالمنافسة!', {
            description: 'تم تحديث جميع الإحصائيات',
          })
        }
      } else {
        toast.success('تم تسجيل نتيجة المنافسة', {
          description: 'تم حفظ البيانات وتحديث الإحصائيات',
        })
      }

      // تحديث البيانات
      if (onUpdate) {
        onUpdate()
      } else {
        emit(APP_EVENTS.TENDER_UPDATED)
      }

      // إعادة تعيين النموذج
      resetForm()
    } catch (error) {
      console.error('Error updating tender result:', error)
      toast.error('حدث خطأ أثناء تحديث النتيجة')
    } finally {
      setIsUpdating(false)
    }
  }

  // دالة إعادة تعيين النموذج
  const resetForm = () => {
    setSelectedResult(null)
    setWinningBidValue('')
    setNotes('')
    setShowConfirmDialog(false)
  }

  const tenderBaseValue = getTenderBaseValue(tender)

  // التحقق من إمكانية إدخال النتائج
  if (tender.status !== 'submitted') {
    return (
      <Card className="border-warning/20 bg-warning/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">يمكن إدخال النتائج فقط للمناقصات المقدمة</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-info" />
            إدخال النتيجة السريع
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* معلومات المنافسة */}
          <div className="bg-info/10 p-3 rounded-lg border border-info/20">
            <div className="text-sm text-info">
              <p>
                <strong>المنافسة:</strong> {tender.name}
              </p>
              <p>
                <strong>قيمة عرضنا:</strong> {formatCurrencyValue(tenderBaseValue)}
              </p>
              <p>
                <strong>العميل:</strong> {tender.client}
              </p>
            </div>
          </div>

          {/* أزرار النتائج */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleResultSelection('won')}
              disabled={isUpdating}
              className="h-16 bg-success text-background hover:bg-success/90 flex flex-col items-center gap-2"
            >
              <Trophy className="h-6 w-6" />
              <span className="font-medium">فائزة 🎉</span>
            </Button>

            <Button
              onClick={() => handleResultSelection('lost')}
              disabled={isUpdating}
              variant="destructive"
              className="h-16 flex flex-col items-center gap-2"
            >
              <XCircle className="h-6 w-6" />
              <span className="font-medium">خاسرة</span>
            </Button>
          </div>

          {/* ملاحظات اختيارية */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              ملاحظات إضافية (اختياري)
            </Label>
            <Textarea
              id="notes"
              placeholder="أي ملاحظات حول نتيجة المنافسة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* حوار التأكيد */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-right">
              {selectedResult === 'won' ? (
                <>
                  <Trophy className="h-5 w-5 text-success" />
                  تأكيد الفوز بالمنافسة
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  تأكيد خسارة المنافسة
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {selectedResult === 'won' ? (
                <>
                  هل أنت متأكد من أن المنافسة &quot;{tender.name}&quot; فائزة؟
                  <br />
                  سيتم إنشاء مشروع جديد تلقائياً وتحديث جميع الإحصائيات.
                </>
              ) : (
                'يرجى إدخال قيمة العرض الفائز لتسجيل نتيجة المنافسة'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* حقل قيمة العرض الفائز في حالة الخسارة */}
          {selectedResult === 'lost' && (
            <div className="space-y-4">
              <div className="text-right">
                <Label htmlFor="winningBid" className="text-sm font-medium">
                  قيمة العرض الفائز (ريال سعودي) <span className="text-destructive">*</span>
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
          )}

          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel onClick={resetForm}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmResult}
              className={
                selectedResult === 'won'
                  ? 'bg-success text-background hover:bg-success/90'
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }
              disabled={isUpdating}
            >
              {isUpdating
                ? 'جاري التحديث...'
                : selectedResult === 'won'
                  ? 'تأكيد الفوز'
                  : 'تأكيد الخسارة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
