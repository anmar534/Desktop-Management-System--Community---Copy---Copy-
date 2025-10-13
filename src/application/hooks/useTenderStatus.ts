import type { Tender } from '@/data/centralData'
import type { StatusBadgeProps } from '@/components/ui/status-badge'
import { getDaysRemaining, isTenderExpired } from '@/utils/tenderProgressCalculator'

type StatusTone = StatusBadgeProps['status']

const resolveVariantTone = (variant: string): StatusTone => {
  switch (variant) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    case 'destructive':
      return 'error'
    case 'default':
      return 'onTrack'
    default:
      return 'default'
  }
}

export function useTenderStatus(tender: Tender) {
  const daysLeft = getDaysRemaining(tender.deadline)
  const expired = isTenderExpired(tender)

  const statusInfo = (() => {
    switch (tender.status) {
      case 'new':
        return { text: 'جديدة', variant: 'secondary' as const, badgeStatus: 'notStarted' as StatusTone }
      case 'under_action':
        return { text: 'تحت الإجراء', variant: 'warning' as const, badgeStatus: 'warning' as StatusTone }
      case 'ready_to_submit':
        return { text: 'جاهزة للتقديم', variant: 'default' as const, badgeStatus: 'onTrack' as StatusTone }
      case 'submitted':
        return { text: 'بانتظار النتائج', variant: 'info' as const, badgeStatus: 'info' as StatusTone }
      case 'won':
        return { text: 'فائزة', variant: 'success' as const, badgeStatus: 'success' as StatusTone }
      case 'lost':
        return { text: 'خاسرة', variant: 'destructive' as const, badgeStatus: 'error' as StatusTone }
      case 'expired':
        return { text: 'منتهية', variant: 'destructive' as const, badgeStatus: 'overdue' as StatusTone }
      case 'cancelled':
        return { text: 'ملغاة', variant: 'secondary' as const, badgeStatus: 'default' as StatusTone }
      default:
        return { text: 'غير معروف', variant: 'secondary' as const, badgeStatus: 'default' as StatusTone }
    }
  })()

  const urgencyInfo = (() => {
    if (expired) {
      return {
        text: 'منتهية',
        color: 'bg-destructive/10 text-destructive border-destructive/30',
        badgeStatus: 'overdue' as StatusTone,
      }
    }
    if (daysLeft <= 0) {
      return {
        text: 'اليوم',
        color: 'bg-destructive/10 text-destructive border-destructive/30',
        badgeStatus: 'overdue' as StatusTone,
      }
    }
    if (daysLeft <= 3) {
      return {
        text: `${daysLeft} أيام متبقية`,
        color: 'bg-warning/10 text-warning border-warning/30',
        badgeStatus: 'dueSoon' as StatusTone,
      }
    }
    if (daysLeft <= 7) {
      return {
        text: `${daysLeft} أيام متبقية`,
        color: 'bg-info/10 text-info border-info/30',
        badgeStatus: 'onTrack' as StatusTone,
      }
    }
    return {
      text: `${daysLeft} يوم`,
      color: 'bg-muted/20 text-muted-foreground border-border',
      badgeStatus: 'default' as StatusTone,
    }
  })()

  // الجاهزية الصارمة: التسعير مكتمل 100% + الملفات الفنية موجودة
  const pricedItemsCount = tender.pricedItems ?? 0
  const totalItemsCount = tender.totalItems ?? 0
  const isPricingCompleted = pricedItemsCount > 0 && totalItemsCount > 0 && pricedItemsCount >= totalItemsCount
  const isTechnicalFilesUploaded = !!tender.technicalFilesUploaded
  const isReadyToSubmitStrict = isPricingCompleted && isTechnicalFilesUploaded

  const completionInfo = {
    isPricingCompleted,
    isTechnicalFilesUploaded,
    // تُستخدم فقط كمؤشر بصري على البطاقة، أما زر الإرسال فيعتمد على الحالة الموحدة
    isReadyToSubmit: isReadyToSubmitStrict || tender.status === 'ready_to_submit'
  }

  // منطق الأزرار المحسن:
  const isFinalState = ['submitted', 'won', 'lost', 'expired', 'cancelled'].includes(tender.status)
  
  // التحقق من حالة العودة للتسعير
  const isRevertedToPricing = tender.lastAction?.includes('تراجع للتسعير') || tender.lastAction?.includes('تراجع عن الحالة')
  
  // زر الإرسال: يظهر عند ready_to_submit أو عندما تكون الجاهزية الصارمة مكتملة (إلا في حالة العودة للتسعير)
  const shouldShowSubmitButton = !isFinalState && (
    tender.status === 'ready_to_submit' || 
    (tender.status === 'under_action' && isReadyToSubmitStrict && !isRevertedToPricing)
  )

  // إزالة حالة الترقية المُقترحة - لا نحتاجها بعد الآن
  const shouldSuggestPromotion = false

  // زر التسعير: يظهر للحالات الجديدة وتحت الإجراء
  const shouldShowPricingButton = !isFinalState && !shouldShowSubmitButton && (
    tender.status === 'new' || tender.status === 'under_action'
  )

  return {
    statusInfo: {
      ...statusInfo,
      badgeStatus: statusInfo.badgeStatus ?? resolveVariantTone(statusInfo.variant),
    },
    urgencyInfo,
    completionInfo,
    shouldShowSubmitButton,
    shouldShowPricingButton,
    shouldSuggestPromotion,
  }
}
