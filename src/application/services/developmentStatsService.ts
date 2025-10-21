import type { Tender } from '@/data/centralData'
import { UnifiedCalculations } from '@/shared/utils/data/unifiedCalculations'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { APP_EVENTS, emit } from '@/events/bus'
import { getTenderRepository } from '@/application/services/serviceRegistry'

export interface MonthlyDevelopmentStats {
  submitted: number
  won: number
  lost: number
  submittedValue: number
  wonValue: number
  bookletsCost: number
}

export type MonthlyStatsRecord = Record<string, MonthlyDevelopmentStats>

export interface DevelopmentStats {
  submittedTenders: number
  wonTenders: number
  lostTenders: number
  submittedTendersValue: number
  wonTendersValue: number
  totalBookletsCost: number
  averageBookletCost: number
  winRate: number
  lastUpdate: string
  currentMonthTenders?: number
  currentMonthValue?: number
  monthlyStats: MonthlyStatsRecord
}

type StoredDevelopmentStats = Partial<Omit<DevelopmentStats, 'monthlyStats'>> & {
  monthlyStats?: Record<string, Partial<MonthlyDevelopmentStats> | undefined>
}

type TenderLike = Pick<Tender, 'id' | 'name' | 'status' | 'client'> & Partial<Tender> & {
  createdAt?: string
  bookletPrice?: number | string | null
}

const MONTH_KEY_FORMAT_LENGTH = 7 // YYYY-MM

const createEmptyMonthlyStats = (): MonthlyDevelopmentStats => ({
  submitted: 0,
  won: 0,
  lost: 0,
  submittedValue: 0,
  wonValue: 0,
  bookletsCost: 0
})

const normalizeMonthlyStats = (
  rawStats?: Record<string, Partial<MonthlyDevelopmentStats> | undefined>
): MonthlyStatsRecord => {
  if (!rawStats) {
    return {}
  }

  return Object.entries(rawStats).reduce<MonthlyStatsRecord>((acc, [month, value]) => {
    const entry = value ?? {}
    acc[month] = {
      submitted: entry.submitted ?? 0,
      won: entry.won ?? 0,
      lost: entry.lost ?? 0,
      submittedValue: entry.submittedValue ?? 0,
      wonValue: entry.wonValue ?? 0,
      bookletsCost: entry.bookletsCost ?? 0
    }
    return acc
  }, {})
}

const toNumeric = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const getTenderTotalValue = (tender: TenderLike): number => {
  return toNumeric(tender.totalValue) ?? toNumeric(tender.value) ?? 0
}

const getTenderBookletCost = (tender: TenderLike): number => {
  const prices: unknown[] = [tender.documentPrice, tender.bookletPrice]
  for (const price of prices) {
    const numeric = toNumeric(price)
    if (numeric !== null) {
      return numeric
    }
  }
  return 0
}

const parseDateSafe = (value?: string | Date | null): Date | null => {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

const getTenderPrimaryDate = (tender: TenderLike): Date | null => {
  const candidateDates: (string | Date | undefined)[] = [
    tender.submissionDate,
    tender.winDate,
    tender.lostDate,
    tender.resultDate,
    tender.lastUpdate,
    tender.createdAt
  ]

  for (const candidate of candidateDates) {
    const parsed = parseDateSafe(candidate ?? null)
    if (parsed) {
      return parsed
    }
  }

  return null
}

const getMonthKey = (date: Date): string => date.toISOString().slice(0, MONTH_KEY_FORMAT_LENGTH)

const createSyntheticTender = (id: string, status: Tender['status'], label: string): Tender => {
  const timestamp = new Date().toISOString()

  return {
    id,
    name: label,
    title: label,
    client: 'محاكاة',
    value: 0,
    totalValue: 0,
    documentPrice: 0,
    status,
    phase: 'analysis',
    deadline: timestamp,
    daysLeft: 0,
    progress: 0,
    priority: 'medium',
    team: 'فريق التطوير',
    manager: 'إدارة النظام',
    winChance: status === 'won' ? 100 : 0,
    competition: 'محاكاة',
    submissionDate: timestamp,
    lastAction: 'synthetic_update',
    lastUpdate: timestamp,
    category: 'عام',
    location: 'غير محدد',
    type: 'tender'
  }
}

const buildSimulatedTenders = (stats: DevelopmentStats): Tender[] => {
  const tenders: Tender[] = []

  for (let index = 0; index < stats.wonTenders; index += 1) {
    tenders.push(createSyntheticTender(`won_${index}`, 'won', `منافسة فائزة ${index + 1}`))
  }

  for (let index = 0; index < stats.lostTenders; index += 1) {
    tenders.push(createSyntheticTender(`lost_${index}`, 'lost', `منافسة خاسرة ${index + 1}`))
  }

  const totalDecided = stats.wonTenders + stats.lostTenders
  const submittedRemaining = Math.max(0, stats.submittedTenders - totalDecided)

  for (let index = 0; index < submittedRemaining; index += 1) {
    tenders.push(createSyntheticTender(`submitted_${index}`, 'submitted', `منافسة محاكاة ${index + 1}`))
  }

  return tenders
}

const developmentStatsKey = STORAGE_KEYS.TENDER_STATS as string

class DevelopmentStatsService {
  private async loadAllTenders(): Promise<Tender[]> {
    try {
      const repository = getTenderRepository()
      const tenders = await repository.getAll()
      if (Array.isArray(tenders)) {
        return tenders
      }
    } catch (error) {
      console.warn('⚠️ تعذر تحميل بيانات المناقصات من المستودع أثناء إعادة حساب الإحصائيات:', error)
    }

    const fallback = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
    return Array.isArray(fallback) ? fallback : []
  }

  updateStatsForTenderSubmission(tender: TenderLike): DevelopmentStats {
    console.log('📊 تحديث إحصائيات التطوير لإرسال المنافسة:', tender.name)

    try {
      const currentStats = this.getDevelopmentStats()
      const tenderValue = getTenderTotalValue(tender)
      const bookletCost = getTenderBookletCost(tender)
      const currentMonth = getMonthKey(new Date())

      currentStats.submittedTenders += 1
      currentStats.submittedTendersValue += tenderValue
      currentStats.totalBookletsCost += bookletCost

      if (currentStats.submittedTenders > 0) {
        currentStats.averageBookletCost = currentStats.totalBookletsCost / currentStats.submittedTenders
      }

      currentStats.monthlyStats[currentMonth] ??= createEmptyMonthlyStats()
      const monthStats = currentStats.monthlyStats[currentMonth]
      monthStats.submitted += 1
      monthStats.submittedValue += tenderValue
      monthStats.bookletsCost += bookletCost

      this.updateWinRateFromStats(currentStats)
      currentStats.lastUpdate = new Date().toISOString()

      this.saveDevelopmentStats(currentStats)
      this.dispatchUpdateEvents()

      console.log('✅ تم تحديث إحصائيات التطوير للإرسال بنجاح')
      return currentStats
    } catch (error) {
      console.error('❌ خطأ في تحديث إحصائيات التطوير للإرسال:', error)
      throw error
    }
  }

  updateStatsForTenderWon(tender: TenderLike): DevelopmentStats {
    console.log('🏆 تحديث إحصائيات التطوير لربح المنافسة:', tender.name)

    try {
      const currentStats = this.getDevelopmentStats()
      const tenderValue = getTenderTotalValue(tender)
      const currentMonth = getMonthKey(new Date())

      currentStats.wonTenders += 1
      currentStats.wonTendersValue += tenderValue

      currentStats.monthlyStats[currentMonth] ??= createEmptyMonthlyStats()
      const monthStats = currentStats.monthlyStats[currentMonth]
      monthStats.won += 1
      monthStats.wonValue += tenderValue

      this.updateWinRateFromStats(currentStats)
      currentStats.lastUpdate = new Date().toISOString()

      this.saveDevelopmentStats(currentStats)
      this.dispatchUpdateEvents()

      console.log('✅ تم تحديث إحصائيات التطوير للربح بنجاح')
      return currentStats
    } catch (error) {
      console.error('❌ خطأ في تحديث إحصائيات التطوير للربح:', error)
      throw error
    }
  }

  updateStatsForTenderLost(tender: TenderLike): DevelopmentStats {
    console.log('❌ تحديث إحصائيات التطوير لخسارة المنافسة:', tender.name)

    try {
      const currentStats = this.getDevelopmentStats()
      const currentMonth = getMonthKey(new Date())

      currentStats.lostTenders += 1

      currentStats.monthlyStats[currentMonth] ??= createEmptyMonthlyStats()
      currentStats.monthlyStats[currentMonth].lost += 1

      this.updateWinRateFromStats(currentStats)
      currentStats.lastUpdate = new Date().toISOString()

      this.saveDevelopmentStats(currentStats)
      this.dispatchUpdateEvents()

      console.log('✅ تم تحديث إحصائيات التطوير للخسارة بنجاح')
      return currentStats
    } catch (error) {
      console.error('❌ خطأ في تحديث إحصائيات التطوير للخسارة:', error)
      throw error
    }
  }

  getDevelopmentStats(): DevelopmentStats {
    try {
      const stored = safeLocalStorage.getItem<StoredDevelopmentStats>(developmentStatsKey, {})

      return {
        submittedTenders: stored.submittedTenders ?? 0,
        wonTenders: stored.wonTenders ?? 0,
        lostTenders: stored.lostTenders ?? 0,
        submittedTendersValue: stored.submittedTendersValue ?? 0,
        wonTendersValue: stored.wonTendersValue ?? 0,
        totalBookletsCost: stored.totalBookletsCost ?? 0,
        averageBookletCost: stored.averageBookletCost ?? 0,
        winRate: stored.winRate ?? 0,
        lastUpdate: stored.lastUpdate ?? new Date().toISOString(),
        currentMonthTenders: stored.currentMonthTenders,
        currentMonthValue: stored.currentMonthValue,
        monthlyStats: normalizeMonthlyStats(stored.monthlyStats)
      }
    } catch (error) {
      console.error('خطأ في قراءة إحصائيات التطوير:', error)
      return this.getDefaultStats()
    }
  }

  async recalculateStatsFromRealData(): Promise<DevelopmentStats> {
    console.log('🔄 إعادة حساب إحصائيات التطوير من البيانات الحقيقية...')

    try {
      const tendersData = await this.loadAllTenders()

      if (!Array.isArray(tendersData) || tendersData.length === 0) {
        console.log('⚠️ لا توجد منافسات لحساب الإحصائيات')
        const defaults = this.getDefaultStats()
        this.saveDevelopmentStats(defaults)
        return defaults
      }

      console.log(`📊 حساب الإحصائيات من ${tendersData.length} منافسة`)

      const submittedStatuses = new Set<string>([
        'submitted',
        'under_review',
        'awaiting_results',
        'won',
        'lost'
      ])

      const submittedTenders = tendersData.filter(tender => tender.status && submittedStatuses.has(tender.status))
      const wonTenders = tendersData.filter(tender => tender.status === 'won')
      const lostTenders = tendersData.filter(tender => tender.status === 'lost')

      const submittedValue = submittedTenders.reduce((sum, tender) => sum + getTenderTotalValue(tender), 0)
      const wonValue = wonTenders.reduce((sum, tender) => sum + getTenderTotalValue(tender), 0)
      const totalBookletsCost = submittedTenders.reduce((sum, tender) => sum + getTenderBookletCost(tender), 0)
      const averageBookletCost = submittedTenders.length > 0 ? totalBookletsCost / submittedTenders.length : 0

      const allTenders = [...submittedTenders, ...wonTenders, ...lostTenders]
      const winRate = UnifiedCalculations.calculateWinRate(allTenders as Tender[])

      const currentDate = new Date()
      const currentMonthKey = getMonthKey(currentDate)
      const currentMonthTenders = submittedTenders.filter(tender => {
        const tenderDate = getTenderPrimaryDate(tender)
        return tenderDate ? getMonthKey(tenderDate) === currentMonthKey : false
      })

      console.log(`📅 المنافسات للشهر الحالي (${currentDate.getMonth() + 1}/${currentDate.getFullYear()}):`, currentMonthTenders.length)
      console.log('📋 قائمة المنافسات الشهرية:', currentMonthTenders.map(tender => tender.name))

      const newStats: DevelopmentStats = {
        submittedTenders: submittedTenders.length,
        wonTenders: wonTenders.length,
        lostTenders: lostTenders.length,
        submittedTendersValue: submittedValue,
        wonTendersValue: wonValue,
        totalBookletsCost,
        averageBookletCost,
        winRate,
        lastUpdate: new Date().toISOString(),
        monthlyStats: {},
        currentMonthTenders: currentMonthTenders.length,
        currentMonthValue: currentMonthTenders.reduce((sum, tender) => sum + getTenderTotalValue(tender), 0)
      }

      this.saveDevelopmentStats(newStats)
      console.log('✅ تم إعادة حساب إحصائيات التطوير بنجاح:', newStats)
      this.dispatchUpdateEvents()

      return newStats
    } catch (error) {
      console.error('❌ خطأ في إعادة حساب إحصائيات التطوير:', error)
      const defaults = this.getDefaultStats()
      this.saveDevelopmentStats(defaults)
      return defaults
    }
  }

  private updateWinRateFromStats(stats: DevelopmentStats): void {
    const simulatedTenders = buildSimulatedTenders(stats)
    stats.winRate = UnifiedCalculations.calculateWinRate(simulatedTenders)
  }

  private saveDevelopmentStats(stats: DevelopmentStats): void {
    safeLocalStorage.setItem(developmentStatsKey, stats)
  }

  private dispatchUpdateEvents(): void {
    if (typeof window !== 'undefined') {
      emit(APP_EVENTS.DEVELOPMENT_UPDATED)
      emit(APP_EVENTS.SYSTEM_STATS_UPDATED)
      console.log('📡 تم إرسال أحداث تحديث إحصائيات التطوير')
    }
  }

  private getDefaultStats(): DevelopmentStats {
    return {
      submittedTenders: 0,
      wonTenders: 0,
      lostTenders: 0,
      submittedTendersValue: 0,
      wonTendersValue: 0,
      totalBookletsCost: 0,
      averageBookletCost: 0,
      winRate: 0,
      lastUpdate: new Date().toISOString(),
      monthlyStats: {}
    }
  }

  getMonthlyStats(month: string): MonthlyDevelopmentStats {
    const stats = this.getDevelopmentStats()
    return stats.monthlyStats[month] ?? createEmptyMonthlyStats()
  }

  getCurrentMonthStats(): MonthlyDevelopmentStats {
    const currentMonth = getMonthKey(new Date())
    return this.getMonthlyStats(currentMonth)
  }

  resetStats(): void {
    safeLocalStorage.removeItem(developmentStatsKey)
    this.dispatchUpdateEvents()
    console.log('🔄 تم إعادة تعيين إحصائيات التطوير')
  }
}

export const developmentStatsService = new DevelopmentStatsService()
export default developmentStatsService