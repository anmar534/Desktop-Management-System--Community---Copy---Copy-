// utils/tenderStatusMigration.ts
// دوال لترقية حالات المنافسات من النظام القديم إلى الجديد

import type { Tender } from '@/data/centralData'

type TenderStatus = Tender['status']

const ARABIC_STATUS_MAP: Record<string, TenderStatus> = {
  جديدة: 'new',
  'تحت الإجراء': 'under_action',
  'تحت الاجراء': 'under_action',
  'جاهزة للتقديم': 'ready_to_submit',
  'بانتظار النتائج': 'submitted',
  فائزة: 'won',
  خاسرة: 'lost',
  منتهية: 'expired',
  ملغاة: 'cancelled',
}

const LEGACY_STATUSES: readonly string[] = [
  'preparing',
  'active',
  'under_review',
  'pricing_in_progress',
  'pricing_completed',
]

const toNormalizedStatusString = (status: unknown): string => {
  if (typeof status !== 'string') {
    return ''
  }

  return status.trim().toLowerCase()
}

const toNumberOrDefault = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') {
      return true
    }
    if (normalized === 'false' || normalized === '0' || normalized === '') {
      return false
    }
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  return false
}

/**
 * ترقية حالة المنافسة من النظام القديم إلى الجديد
 * @param oldStatus - الحالة القديمة
 * @returns الحالة الجديدة
 */
export const migrateTenderStatus = (oldStatus: unknown): TenderStatus => {
  const normalizedStatus = toNormalizedStatusString(oldStatus)
  if (!normalizedStatus) {
    return 'new'
  }

  if (normalizedStatus in ARABIC_STATUS_MAP) {
    return ARABIC_STATUS_MAP[normalizedStatus as keyof typeof ARABIC_STATUS_MAP]
  }

  // خرائط إنجليزية متنوعة
  switch (normalizedStatus) {
    // جديدة
    case 'preparing':
    case 'new':
    case 'created':
      return 'new'

    // تحت الإجراء
    case 'active':
    case 'in_progress':
    case 'in-progress':
    case 'in progress':
    case 'under_review':
    case 'under-review':
    case 'under review':
    case 'underaction':
    case 'under_action':
    case 'underactionstatus':
    case 'pricing_in_progress':
    case 'pricing-in-progress':
    case 'pricinginprogress':
      return 'under_action'

    // جاهزة للإرسال
    case 'pricing_completed':
    case 'pricing-completed':
    case 'pricingcompleted':
    case 'ready_to_submit':
    case 'ready-to-submit':
    case 'readytosubmit':
      return 'ready_to_submit'

    // بانتظار النتائج (تم الإرسال)
    case 'submitted':
    case 'awaiting_results':
    case 'awaiting-results':
    case 'awaitingresults':
    case 'under_review_results':
      return 'submitted'

    // نتائج
    case 'won':
      return 'won'
    case 'lost':
      return 'lost'

    // منتهية/ملغاة
    case 'expired':
      return 'expired'
    case 'cancelled':
    case 'canceled':
      return 'cancelled'

    default:
      return 'new'
  }
}

/**
 * ترقية جميع المنافسات في مصفوفة
 * @param tenders - مصفوفة المنافسات
 * @returns مصفوفة المنافسات المحدثة
 */
type TenderLike = Partial<Tender> & Record<string, unknown>

export type MigratedTender = TenderLike & {
  status: TenderStatus
  totalItems: number
  pricedItems: number
  technicalFilesUploaded: boolean
}

export const migrateTendersArray = (tenders: readonly TenderLike[]): MigratedTender[] => {
  return tenders.map((tender) => {
    const status = migrateTenderStatus(tender.status)
    const totalItems = toNumberOrDefault(tender.totalItems)
    const pricedSource = tender.pricedItems ?? tender.itemsPriced
    const pricedItems = toNumberOrDefault(pricedSource)

    return {
      ...tender,
      status,
      totalItems,
      pricedItems,
      technicalFilesUploaded: toBoolean(tender.technicalFilesUploaded),
    }
  })
}

/**
 * فحص ما إذا كانت المنافسة تحتاج ترقية
 * @param tender - المنافسة
 * @returns true إذا كانت تحتاج ترقية
 */
export const needsMigration = (tender: { status?: unknown }): boolean => {
  const normalizedStatus = toNormalizedStatusString(tender.status)
  return normalizedStatus !== '' && LEGACY_STATUSES.includes(normalizedStatus)
}
