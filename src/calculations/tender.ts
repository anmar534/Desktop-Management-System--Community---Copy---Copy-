import type { Tender } from '@/data/centralData'
import { TENDER_CONSTANTS, WinRateCalculations } from '@/shared/utils/pricing/unifiedCalculations'
import { getDaysRemaining, isTenderExpired } from '@/shared/utils/tender/tenderProgressCalculator'

export interface TenderStats {
  total: number
  urgent: number
  new: number
  underAction: number
  waitingResults: number
  won: number
  lost: number
  expired: number
  winRate: number
  totalDocumentValue: number
}

/**
 * حسابات موحدة لإحصائيات المنافسات من مصفوفة واحدة
 * المبدأ: مصدر واحد للحقيقة = المصفوفة المُمَرَّرة
 *
 * الملاحظات:
 * - urgent: المتبقي ≤ 7 أيام و ≥ 0 للحالات new | under_action
 * - underAction: يحسب فقط حالة 'under_action' (كما في الكود الحالي)
 * - winRate: نسبة الفوز = won / submitted
 *   submitted = (المنافسات المرسلة) = waitingResults + won + lost
 * - totalDocumentValue: مجموع أسعار الكراسات للمنافسات (submitted|won|lost)
 */
export function calculateTenderStats(tenders: Tender[]): TenderStats {
  const base: TenderStats = {
    total: 0,
    urgent: 0,
    new: 0,
    underAction: 0,
    waitingResults: 0,
    won: 0,
    lost: 0,
    expired: 0,
    winRate: 0,
    totalDocumentValue: 0,
  }

  if (!Array.isArray(tenders) || tenders.length === 0) {
    return base
  }

  const submittedStatuses = new Set<string>(
    TENDER_CONSTANTS.SUBMITTED_STATUSES as readonly string[],
  )
  const urgentStatuses = new Set<string>(['new', 'under_action', 'ready_to_submit'])

  let urgent = 0
  let newCount = 0
  let underAction = 0
  let waitingResults = 0
  let won = 0
  let lost = 0
  let expired = 0
  let totalDocumentValue = 0

  for (const tender of tenders) {
    if (!tender) {
      continue
    }

    const { status, deadline } = tender

    switch (status) {
      case 'new':
        newCount++
        break
      case 'under_action':
        underAction++
        break
      case 'submitted':
        waitingResults++
        break
      case 'won':
        won++
        break
      case 'lost':
        lost++
        break
      default:
        break
    }

    if (isTenderExpired(tender)) {
      expired++
    }

    if (status && urgentStatuses.has(status) && deadline) {
      const days = getDaysRemaining(deadline)
      if (days <= 7 && days >= 0) {
        urgent++
      }
    }

    if (status && submittedStatuses.has(status)) {
      totalDocumentValue += WinRateCalculations.getUnifiedDocumentPrice(tender)
    }
  }

  const winRate = WinRateCalculations.calculateCorrectWinRate(tenders)

  return {
    total: tenders.length,
    urgent,
    new: newCount,
    underAction,
    waitingResults,
    won,
    lost,
    expired,
    winRate,
    totalDocumentValue,
  }
}
