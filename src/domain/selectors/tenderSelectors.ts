/**
 * Tender Selectors - انتقائيات موحدة لحسابات المنافسات
 *
 * توفر هذه الـ Selectors حسابات نقية ومستقلة عن React
 * مصدر واحد للحقيقة (Single Source of Truth) لجميع حسابات المنافسات
 *
 * يمكن استخدامها في:
 * - Hooks
 * - Services
 * - Components (via selectors)
 * - Tests
 * - Background workers
 */

import type { Tender } from '@/data/centralData'

/**
 * ملخص حسابات المنافسات
 */
export interface TenderCalculations {
  // العدادات الأساسية
  total: number
  won: number
  lost: number
  active: number

  // الحالات المحددة
  new: number
  underAction: number
  submitted: number

  // الحسابات المالية
  wonValue: number
  lostValue: number
  submittedValue: number

  // النسب المئوية
  winRate: number
  averageWinChance: number
}

// ==========================================
// 🎯 أداة تصفية الحالات (Status Filters)
// ==========================================

/**
 * هل المنافسة فائزة؟
 */
export function isTenderWon(tender: Tender | null | undefined): tender is Tender {
  return tender?.status === 'won'
}

/**
 * هل المنافسة خاسرة؟
 */
export function isTenderLost(tender: Tender | null | undefined): tender is Tender {
  return tender?.status === 'lost'
}

/**
 * هل المنافسة نشطة؟ (جديدة أو تحت الإجراء)
 */
export function isTenderActive(tender: Tender | null | undefined): tender is Tender {
  if (!tender) return false
  return tender.status === 'new' || tender.status === 'under_action'
}

/**
 * هل المنافسة مُرسلة؟
 */
export function isTenderSubmitted(tender: Tender | null | undefined): tender is Tender {
  return tender?.status === 'submitted'
}

/**
 * هل المنافسة منتهية؟
 *
 * المنافسة تعتبر منتهية إذا:
 * 1. حالتها 'expired' أو 'cancelled'
 * 2. أو تجاوز موعد الإغلاق ولم تُرسل بعد
 *
 * ملاحظة: المنافسات المرسلة أو التي لها نتيجة (won/lost) لا تعتبر منتهية
 */
export function isTenderExpired(tender: Tender | null | undefined): boolean {
  if (!tender) return false

  const status = tender.status

  // المنافسات الملغاة صراحة
  if (status === 'expired' || status === 'cancelled') {
    return true
  }

  // المنافسات المرسلة أو التي لها نتيجة نهائية لا تعتبر منتهية
  if (status === 'submitted' || status === 'won' || status === 'lost') {
    return false
  }

  // فحص موعد الإغلاق للمنافسات الأخرى
  const deadline = tender.deadline
  if (!deadline) {
    return false
  }

  const now = new Date()
  const deadlineDate = new Date(deadline)

  return deadlineDate < now
}

/**
 * هل المنافسة عاجلة؟
 *
 * المنافسة تعتبر عاجلة إذا:
 * - حالتها نشطة (new, under_action, ready_to_submit)
 * - المتبقي على موعد الإغلاق ≤ 7 أيام وليست منتهية
 */
export function isTenderUrgent(tender: Tender | null | undefined): boolean {
  if (!tender) return false

  const urgentStatuses: Tender['status'][] = ['new', 'under_action', 'ready_to_submit']
  if (!urgentStatuses.includes(tender.status)) {
    return false
  }

  if (isTenderExpired(tender)) {
    return false
  }

  const deadline = tender.deadline
  if (!deadline) {
    return false
  }

  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays >= 0 && diffDays <= 7
}

// ==========================================
// 📊 حسابات العدادات (Count Selectors)
// ==========================================

/**
 * عدد المنافسات الفائزة
 */
export function selectWonTendersCount(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderWon).length
}

/**
 * عدد المنافسات الخاسرة
 */
export function selectLostTendersCount(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderLost).length
}

/**
 * عدد المنافسات النشطة (جديدة + تحت الإجراء)
 */
export function selectActiveTendersCount(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderActive).length
}

/**
 * عدد المنافسات الجديدة
 */
export function selectNewTendersCount(tenders: readonly Tender[]): number {
  return tenders.filter((t) => t.status === 'new').length
}

/**
 * عدد المنافسات تحت الإجراء
 */
export function selectUnderActionTendersCount(tenders: readonly Tender[]): number {
  return tenders.filter((t) => t.status === 'under_action').length
}

/**
 * عدد المنافسات المُرسلة بانتظار النتائج
 */
export function selectSubmittedTendersCount(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderSubmitted).length
}

/**
 * عدد المنافسات المنتهية
 */
export function selectExpiredTendersCount(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderExpired).length
}

/**
 * عدد المنافسات العاجلة
 */
export function selectUrgentTendersCount(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderUrgent).length
}

/**
 * عدد المنافسات النشطة غير المنتهية
 * (تستثني المنافسات المنتهية من العدادات النشطة)
 */
export function selectActiveNonExpiredCount(tenders: readonly Tender[]): number {
  return tenders.filter((t) => isTenderActive(t) && !isTenderExpired(t)).length
}

/**
 * عدد المنافسات التي تم إرسالها وحصلت على نتائج
 * (المُرسلة بانتظار النتائج + الفائزة + الخاسرة)
 *
 * تُستخدم لحساب نسبة الفوز الصحيحة
 */
export function selectTotalSentTendersCount(tenders: readonly Tender[]): number {
  const submitted = selectSubmittedTendersCount(tenders)
  const won = selectWonTendersCount(tenders)
  const lost = selectLostTendersCount(tenders)
  return submitted + won + lost
}

/**
 * عدد المنافسات النشطة (غير المنتهية)
 * يشمل: new, under_action, ready_to_submit, submitted, won, lost
 * يستثني: expired, cancelled
 *
 * يُستخدم في تبويب "الكل" والإحصائيات العامة
 */
export function selectActiveTendersTotal(tenders: readonly Tender[]): number {
  return tenders.filter((t) => !isTenderExpired(t)).length
}

// ==========================================
// 💰 حسابات القيم المالية (Value Selectors)
// ==========================================

/**
 * إجمالي قيمة المنافسات الفائزة
 */
export function selectWonTendersValue(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderWon).reduce((sum, tender) => sum + (tender.value || 0), 0)
}

/**
 * إجمالي قيمة المنافسات الخاسرة
 */
export function selectLostTendersValue(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderLost).reduce((sum, tender) => sum + (tender.value || 0), 0)
}

/**
 * إجمالي قيمة المنافسات المُرسلة
 */
export function selectSubmittedTendersValue(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderSubmitted).reduce((sum, tender) => sum + (tender.value || 0), 0)
}

/**
 * إجمالي قيمة المنافسات النشطة
 */
export function selectActiveTendersValue(tenders: readonly Tender[]): number {
  return tenders.filter(isTenderActive).reduce((sum, tender) => sum + (tender.value || 0), 0)
}

// ==========================================
// 📈 حسابات النسب المئوية (Rate Selectors)
// ==========================================

/**
 * نسبة الفوز (Win Rate)
 *
 * الصيغة: (عدد الفائزة / (عدد المُرسلة + عدد الفائزة + عدد الخاسرة)) × 100
 * تشمل: المنافسات المرسلة (بانتظار النتائج) + الفائزة + الخاسرة
 *
 * @example
 * selectWinRate([...]) // 45.5
 */
export function selectWinRate(tenders: readonly Tender[]): number {
  const won = selectWonTendersCount(tenders)
  const submitted = selectSubmittedTendersCount(tenders)
  const lost = selectLostTendersCount(tenders)
  const total = submitted + won + lost

  if (total === 0) return 0
  return Math.round((won / total) * 100 * 10) / 10 // دقة عشرية واحدة
}

/**
 * متوسط فرصة الفوز
 *
 * @example
 * selectAverageWinChance([...]) // 72.3
 */
export function selectAverageWinChance(tenders: readonly Tender[]): number {
  if (tenders.length === 0) return 0

  const totalChance = tenders.reduce((sum, tender) => {
    const chance = typeof tender.winChance === 'number' ? tender.winChance : 0
    return sum + chance
  }, 0)

  return Math.round((totalChance / tenders.length) * 10) / 10
}

/**
 * نسبة الخسائر من المُرسلة
 */
export function selectLossRate(tenders: readonly Tender[]): number {
  const lost = selectLostTendersCount(tenders)
  const submitted = selectSubmittedTendersCount(tenders)

  if (submitted === 0) return 0
  return Math.round((lost / submitted) * 100 * 10) / 10
}

/**
 * نسبة القيمة المُنجزة (الفائزة من الإجمالية)
 */
export function selectValueCompletionRate(tenders: readonly Tender[]): number {
  const wonValue = selectWonTendersValue(tenders)
  const totalValue = tenders.reduce((sum, t) => sum + (t.value || 0), 0)

  if (totalValue === 0) return 0
  return Math.round((wonValue / totalValue) * 100 * 10) / 10
}

// ==========================================
// 🎯 حسابات موحدة (Composite Selectors)
// ==========================================

/**
 * جميع حسابات المنافسات في عملية واحدة
 *
 * (أفضل للأداء عند الحاجة لعدة حسابات)
 */
export function selectAllTenderCalculations(tenders: readonly Tender[]): TenderCalculations {
  const total = tenders.length
  const won = selectWonTendersCount(tenders)
  const lost = selectLostTendersCount(tenders)
  const active = selectActiveTendersCount(tenders)
  const newCount = selectNewTendersCount(tenders)
  const underActionCount = selectUnderActionTendersCount(tenders)
  const submitted = selectSubmittedTendersCount(tenders)

  const wonValue = selectWonTendersValue(tenders)
  const lostValue = selectLostTendersValue(tenders)
  const submittedValue = selectSubmittedTendersValue(tenders)

  const winRate = selectWinRate(tenders)
  const averageWinChance = selectAverageWinChance(tenders)

  return {
    total,
    won,
    lost,
    active,
    new: newCount,
    underAction: underActionCount,
    submitted,
    wonValue,
    lostValue,
    submittedValue,
    winRate,
    averageWinChance,
  }
}

// ==========================================
// 🔍 حسابات متقدمة (Advanced Selectors)
// ==========================================

/**
 * أفضل المنافسات (الفائزة والعالية القيمة)
 */
export function selectTopTenders(tenders: readonly Tender[], limit = 5): Tender[] {
  return tenders
    .filter(isTenderWon)
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, limit)
}

/**
 * المنافسات المخاطرة (عالية القيمة وخاسرة)
 */
export function selectRiskyTenders(tenders: readonly Tender[], minValue = 0): Tender[] {
  return tenders
    .filter((t) => isTenderLost(t) && (t.value || 0) >= minValue)
    .sort((a, b) => (b.value || 0) - (a.value || 0))
}

/**
 * المنافسات ذات فرصة فوز عالية لكنها لم تُرسل بعد
 */
export function selectHighPotentialTenders(
  tenders: readonly Tender[],
  minWinChance = 70,
): Tender[] {
  return tenders
    .filter((t) => isTenderActive(t) && (t.winChance || 0) >= minWinChance)
    .sort((a, b) => (b.winChance || 0) - (a.winChance || 0))
}

/**
 * تجميع المنافسات حسب الحالة
 */
export function selectTendersByStatus(
  tenders: readonly Tender[],
): Record<Tender['status'], Tender[]> {
  const grouped: Record<Tender['status'], Tender[]> = {
    new: [],
    under_action: [],
    ready_to_submit: [],
    submitted: [],
    won: [],
    lost: [],
    expired: [],
    cancelled: [],
  }

  tenders.forEach((tender) => {
    const status = tender.status || 'cancelled'
    if (status in grouped) {
      grouped[status as Tender['status']].push(tender)
    }
  })

  return grouped
}

// ==========================================
// 💡 Memoization Helper (للـ useMemo في React)
// ==========================================

/**
 * مفتاح cache للتخزين المؤقت
 *
 * يُستخدم في useMemo لتتبع التغييرات
 */
export function getTendersCacheKey(tenders: readonly Tender[]): string {
  return `${tenders.length}-${tenders.map((t) => t.id).join(',')}`
}
