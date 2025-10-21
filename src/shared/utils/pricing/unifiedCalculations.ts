import type { Tender } from '@/data/centralData'
import { developmentStatsService, type DevelopmentStats } from '@/application/services/developmentStatsService'
import { purchaseOrderService } from '@/application/services/purchaseOrderService'

const SUBMITTED_STATUSES = ['submitted', 'won', 'lost'] as const
const WON_STATUS = 'won' as const
const LOST_STATUS = 'lost' as const
const SUBMITTED_STATUS = 'submitted' as const
const UNDER_REVIEW_STATUSES = ['submitted', 'under_review', 'awaiting_results'] as const
const DATE_FIELDS = ['submissionDate', 'winDate', 'lostDate'] as const
const PRICE_FIELDS = ['documentPrice', 'bookletPrice'] as const

type SubmittedStatus = typeof SUBMITTED_STATUSES[number]
type UnderReviewStatus = typeof UNDER_REVIEW_STATUSES[number]
type DevelopmentStatsSnapshot = DevelopmentStats
type PurchaseOrderStatsSnapshot = Awaited<ReturnType<typeof purchaseOrderService.getPurchaseOrderStats>>

const SUBMITTED_STATUS_SET = new Set<SubmittedStatus>(SUBMITTED_STATUSES)
const UNDER_REVIEW_STATUS_SET = new Set<UnderReviewStatus>(UNDER_REVIEW_STATUSES)

const asRecord = (tender: Tender): Record<string, unknown> =>
  tender as unknown as Record<string, unknown>

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

const readTenderValue = (tender: Tender, key: string): unknown => asRecord(tender)[key]

const isSubmittedStatus = (status: Tender['status']): status is SubmittedStatus =>
  SUBMITTED_STATUS_SET.has(status as SubmittedStatus)

const isUnderReviewStatus = (status: Tender['status'] | string): boolean =>
  UNDER_REVIEW_STATUS_SET.has(status as UnderReviewStatus)

interface PricingCostComponent {
  total?: number | string
  price?: number | string
  quantity?: number | string
}

interface StoredPricingItem {
  materials?: PricingCostComponent[]
  labor?: PricingCostComponent[]
  equipment?: PricingCostComponent[]
  subcontractors?: PricingCostComponent[]
  finalPrice?: number | string
  totalPrice?: number | string
  unitPrice?: number | string
}

interface TenderPricingSnapshot {
  pricing?: [string, StoredPricingItem | undefined][]
}

const sumCostComponents = (components?: PricingCostComponent[]): number => {
  if (!Array.isArray(components) || components.length === 0) {
    return 0
  }

  return components.reduce((sum, component) => {
    const total = toNumeric(component.total)
    if (total !== null) {
      return sum + total
    }

    const price = toNumeric(component.price)
    const quantity = toNumeric(component.quantity)

    if (price !== null && quantity !== null) {
      return sum + price * quantity
    }

    if (price !== null) {
      return sum + price
    }

    return sum
  }, 0)
}

const selectFirstArrayValue = (values: unknown[]): unknown[] | undefined => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value
    }
  }
  return undefined
}

const getExecutionPeriodInDays = (tender: Tender): number | null => {
  const rawValue = readTenderValue(tender, 'executionPeriod')
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue
  }
  if (typeof rawValue === 'string') {
    const parsed = Number.parseInt(rawValue, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const getTenderQuantityTable = (tender: Tender): unknown[] =>
  selectFirstArrayValue([
    readTenderValue(tender, 'quantityTable'),
    readTenderValue(tender, 'quantities'),
    readTenderValue(tender, 'items')
  ]) ?? []

export const TENDER_CONSTANTS = {
  SUBMITTED_STATUSES,
  WON_STATUS,
  LOST_STATUS,
  SUBMITTED_STATUS,
  UNDER_REVIEW_STATUSES,
  DATE_FIELDS,
  PRICE_FIELDS,
  DEFAULT_MONTHLY_TARGET: 10,
  MAX_TARGET_ACHIEVEMENT: 100
} as const

export interface TenderWithMetadata extends Tender {
  isSynthetic?: boolean
  syntheticReason?: string
}

export interface SyntheticDataInfo {
  hasAdditionalLostTenders: boolean
  additionalLostCount: number
  totalSyntheticTenders: number
}

export interface TenderStatsResult {
  total: number
  submitted: number
  won: number
  lost: number
  waiting: number
  winRate: number
}

export interface MonthlyTenderStats {
  month: number
  year: number
  submitted: number
  submittedValue: number
  won: number
  wonValue: number
  winRate: number
  targetAchievement: number
  totalBookletsCost: number
  averageBookletCost: number
}

export interface DevelopmentMergedStats extends MonthlyTenderStats {
  documentROI: number
  syntheticData: SyntheticDataInfo
}

export interface PurchaseOrderMergedStats extends DevelopmentMergedStats {
  totalPurchaseOrders: number
  totalPurchaseValue: number
  pendingPurchaseOrders: number
  averagePurchaseValue: number
}

const buildSyntheticLostTender = (index: number): TenderWithMetadata => {
  const timestamp = new Date().toISOString()
  return {
    id: `synthetic_lost_${index}`,
    name: `منافسة خاسرة إضافية ${index + 1}`,
    title: `Synthetic Tender ${index + 1}`,
    client: 'غير محدد',
    value: 0,
    status: TENDER_CONSTANTS.LOST_STATUS,
    phase: 'analysis',
    deadline: timestamp,
    daysLeft: 0,
    progress: 0,
    priority: 'medium',
    team: 'فريق العطاءات',
    manager: 'إدارة النظام',
    winChance: 0,
    competition: 'غير محدد',
    submissionDate: timestamp,
    lastAction: 'synthetic_insert',
    lastUpdate: timestamp,
    category: 'عام',
    location: 'غير محدد',
    type: 'tender',
    documentPrice: 0,
    totalValue: 0,
    resultNotes: 'Synthetic entry for development stats alignment',
    isSynthetic: true,
    syntheticReason: 'additional_lost_from_development_stats'
  }
}

export const WinRateCalculations = {
  calculateCorrectWinRate: (tenders: Tender[]): number => {
    if (!Array.isArray(tenders) || tenders.length === 0) {
      return 0
    }

    let submitted = 0
    let won = 0

    for (const tender of tenders) {
      const { status } = tender
      if (!status || !isSubmittedStatus(status)) {
        continue
      }

      submitted += 1
      if (status === TENDER_CONSTANTS.WON_STATUS) {
        won += 1
      }
    }

    return submitted === 0 ? 0 : Math.round((won / submitted) * 100)
  },

  calculateTenderStats: (tenders: Tender[]): TenderStatsResult => {
    if (!Array.isArray(tenders) || tenders.length === 0) {
      return {
        total: 0,
        submitted: 0,
        won: 0,
        lost: 0,
        waiting: 0,
        winRate: 0
      }
    }

    let submitted = 0
    let won = 0
    let lost = 0
    let waiting = 0

    for (const tender of tenders) {
      const { status } = tender
      if (!status || !isSubmittedStatus(status)) {
        continue
      }

      submitted += 1

      switch (status) {
        case TENDER_CONSTANTS.WON_STATUS:
          won += 1
          break
        case TENDER_CONSTANTS.LOST_STATUS:
          lost += 1
          break
        case TENDER_CONSTANTS.SUBMITTED_STATUS:
          waiting += 1
          break
        default:
          break
      }
    }

    const winRate = submitted > 0 ? Math.round((won / submitted) * 100) : 0

    return {
      total: submitted,
      submitted,
      won,
      lost,
      waiting,
      winRate
    }
  },

  getRelevantDate: (tender: Tender): Date | null => {
    for (const field of TENDER_CONSTANTS.DATE_FIELDS) {
      const rawValue = readTenderValue(tender, field)
      if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
        const parsed = new Date(rawValue)
        if (!Number.isNaN(parsed.getTime())) {
          return parsed
        }
      } else if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) {
        return rawValue
      }
    }
    return null
  },

  calculateWinRateForPeriod: (tenders: Tender[], year?: number, month?: number): number => {
    if (!Array.isArray(tenders) || tenders.length === 0) {
      return 0
    }

    let submitted = 0
    let won = 0

    for (const tender of tenders) {
      const { status } = tender
      if (!status || !isSubmittedStatus(status)) {
        continue
      }

      if (year !== undefined) {
        const relevantDate = WinRateCalculations.getRelevantDate(tender)
        if (!relevantDate || relevantDate.getFullYear() !== year) {
          continue
        }

        if (month !== undefined) {
          const tenderMonth = relevantDate.getMonth() + 1
          if (tenderMonth !== month) {
            continue
          }
        }
      }

      submitted += 1
      if (status === TENDER_CONSTANTS.WON_STATUS) {
        won += 1
      }
    }

    return submitted === 0 ? 0 : Math.round((won / submitted) * 100)
  },

  getWinRateDetails: (tenders: Tender[]) => {
    const stats = WinRateCalculations.calculateTenderStats(tenders)

    return {
      ...stats,
      details: {
        formula: 'نسبة الفوز = (المنافسات الفائزة / إجمالي المنافسات المرسلة) × 100',
        calculation: `${stats.won} / ${stats.submitted} × 100 = ${stats.winRate}%`
      }
    }
  },

  validateWinRateCalculation: (tenders: Tender[]) => {
    const details = WinRateCalculations.getWinRateDetails(tenders)
    const calculatedTotal = details.won + details.lost + details.waiting
    const isValid = calculatedTotal === details.total

    return {
      isValid,
      details,
      validation: {
        expectedTotal: details.total,
        calculatedTotal,
        difference: details.total - calculatedTotal
      }
    }
  },

  getUnifiedDocumentPrice: (tender: Tender): number => {
    for (const field of TENDER_CONSTANTS.PRICE_FIELDS) {
      const rawValue = readTenderValue(tender, field)
      const numeric = toNumeric(rawValue)
      if (numeric !== null) {
        return numeric
      }
    }
    return 0
  }
}

const calculatePricingTotals = (snapshot?: TenderPricingSnapshot): { cost: number; profit: number } => {
  if (!snapshot?.pricing) {
    return { cost: 0, profit: 0 }
  }

  return snapshot.pricing.reduce(
    (acc, [, item]) => {
      if (!item) {
        return acc
      }

      const materials = sumCostComponents(item.materials)
      const labor = sumCostComponents(item.labor)
      const equipment = sumCostComponents(item.equipment)
      const subcontractors = sumCostComponents(item.subcontractors)

      const subtotal = materials + labor + equipment + subcontractors
      const finalPrice = toNumeric(item.finalPrice ?? item.totalPrice ?? item.unitPrice)

      return {
        cost: acc.cost + subtotal,
        profit: acc.profit + (finalPrice !== null ? finalPrice - subtotal : 0)
      }
    },
    { cost: 0, profit: 0 }
  )
}

export const TenderCalculations = {
  calculateMonthlyStats: (tenders: Tender[], year?: number, month?: number): MonthlyTenderStats => {
    const now = new Date()
    const targetYear = year ?? now.getFullYear()
    const targetMonth = month ?? now.getMonth()

    let submittedMonthly = 0
    let wonMonthly = 0
    let submittedValue = 0
    let wonValue = 0
    let totalBookletsCost = 0
    const monthlyTenders: Tender[] = []

    for (const tender of tenders) {
      totalBookletsCost += WinRateCalculations.getUnifiedDocumentPrice(tender)

      const relevantDate = WinRateCalculations.getRelevantDate(tender)
      if (!relevantDate || relevantDate.getFullYear() !== targetYear || relevantDate.getMonth() !== targetMonth) {
        continue
      }

      monthlyTenders.push(tender)

      if (isUnderReviewStatus(tender.status)) {
        submittedMonthly += 1
        submittedValue += tender.value ?? 0
      }

      if (tender.status === TENDER_CONSTANTS.WON_STATUS) {
        wonMonthly += 1
        wonValue += tender.value ?? 0
      }
    }

    const winRate = WinRateCalculations.calculateWinRateForPeriod(monthlyTenders, targetYear, targetMonth + 1)

    return {
      month: targetMonth,
      year: targetYear,
      submitted: submittedMonthly,
      submittedValue,
      won: wonMonthly,
      wonValue,
      winRate,
      targetAchievement: Math.min(
        Math.round((submittedMonthly / TENDER_CONSTANTS.DEFAULT_MONTHLY_TARGET) * 100),
        TENDER_CONSTANTS.MAX_TARGET_ACHIEVEMENT
      ),
      totalBookletsCost,
      averageBookletCost: submittedMonthly > 0 ? totalBookletsCost / submittedMonthly : 0
    }
  },

  mergeDevelopmentStats: (tenders: Tender[], year?: number, month?: number): DevelopmentMergedStats => {
    try {
      const developmentStats: DevelopmentStatsSnapshot = developmentStatsService.getDevelopmentStats()
      const calculatedStats = TenderCalculations.calculateMonthlyStats(tenders, year, month)

      const mergedSubmitted = Math.max(calculatedStats.submitted, developmentStats.submittedTenders ?? 0)
      const mergedWon = Math.max(calculatedStats.won, developmentStats.wonTenders ?? 0)
      const mergedSubmittedValue = Math.max(
        calculatedStats.submittedValue,
        developmentStats.submittedTendersValue ?? 0
      )
      const mergedWonValue = Math.max(calculatedStats.wonValue, developmentStats.wonTendersValue ?? 0)

      const totalBookletsCost = Math.max(
        calculatedStats.totalBookletsCost,
        developmentStats.totalBookletsCost ?? 0
      )

      const allTenders: TenderWithMetadata[] = [...tenders]
      const additionalLostTenders = Math.max(0, (developmentStats.lostTenders ?? 0) - calculatedStats.won)

      for (let index = 0; index < additionalLostTenders; index += 1) {
        allTenders.push(buildSyntheticLostTender(index))
      }

      const relevantTenders = allTenders.filter(tender => tender.status && isSubmittedStatus(tender.status))
      const winRate = WinRateCalculations.calculateCorrectWinRate(relevantTenders)

      const syntheticData: SyntheticDataInfo = {
        hasAdditionalLostTenders: additionalLostTenders > 0,
        additionalLostCount: additionalLostTenders,
        totalSyntheticTenders: additionalLostTenders
      }

      return {
        ...calculatedStats,
        submitted: mergedSubmitted,
        won: mergedWon,
        submittedValue: mergedSubmittedValue,
        wonValue: mergedWonValue,
        totalBookletsCost,
        averageBookletCost: mergedSubmitted > 0 ? totalBookletsCost / mergedSubmitted : 0,
        winRate,
        documentROI: totalBookletsCost > 0 ? Math.round((mergedWonValue / totalBookletsCost) * 100) / 100 : 0,
        syntheticData
      }
    } catch (error) {
      console.warn('Error merging development stats:', error)
      const fallback = TenderCalculations.calculateMonthlyStats(tenders, year, month)

      return {
        ...fallback,
        documentROI: 0,
        syntheticData: {
          hasAdditionalLostTenders: false,
          additionalLostCount: 0,
          totalSyntheticTenders: 0
        }
      }
    }
  },

  mergeWithPurchaseOrders: async (stats: DevelopmentMergedStats): Promise<PurchaseOrderMergedStats> => {
    try {
      const purchaseStats: PurchaseOrderStatsSnapshot = await purchaseOrderService.getPurchaseOrderStats()

      return {
        ...stats,
        totalPurchaseOrders: purchaseStats.totalOrders ?? 0,
        totalPurchaseValue: purchaseStats.totalValue ?? 0,
        pendingPurchaseOrders: purchaseStats.pendingOrders ?? 0,
        averagePurchaseValue: purchaseStats.averageValue ?? 0
      }
    } catch (error) {
      console.warn('Error merging purchase order stats:', error)

      return {
        ...stats,
        totalPurchaseOrders: 0,
        totalPurchaseValue: 0,
        pendingPurchaseOrders: 0,
        averagePurchaseValue: 0
      }
    }
  }
}

export const UnifiedCalculations = {
  calculateAllStats: async (tenders: Tender[], year?: number, month?: number): Promise<PurchaseOrderMergedStats> => {
    const mergedStats = TenderCalculations.mergeDevelopmentStats(tenders, year, month)
    return await TenderCalculations.mergeWithPurchaseOrders(mergedStats)
  },

  calculateWinRate: (tenders: Tender[]) => WinRateCalculations.calculateCorrectWinRate(tenders),
  calculateWinRateForPeriod: (tenders: Tender[], year?: number, month?: number) =>
    WinRateCalculations.calculateWinRateForPeriod(tenders, year, month),
  getWinRateDetails: (tenders: Tender[]) => WinRateCalculations.getWinRateDetails(tenders),
  validateWinRateCalculation: (tenders: Tender[]) => WinRateCalculations.validateWinRateCalculation(tenders),
  getTenderStats: (tenders: Tender[]) => WinRateCalculations.calculateTenderStats(tenders),
  getUnifiedDocumentPrice: (tender: Tender) => WinRateCalculations.getUnifiedDocumentPrice(tender),
  getRelevantDate: (tender: Tender) => WinRateCalculations.getRelevantDate(tender),
  CONSTANTS: TENDER_CONSTANTS
}

export const ProjectCalculations = {
  createProjectFromTender: (tender: Tender, pricingData?: TenderPricingSnapshot | null) => {
    const projectId = `PROJ-${Date.now()}`
    const { cost: estimatedCost, profit: estimatedProfit } = calculatePricingTotals(pricingData ?? undefined)

    const totalBudget =
      toNumeric(readTenderValue(tender, 'totalValue')) ?? tender.totalValue ?? tender.value ?? 0

    const executionPeriodDays = getExecutionPeriodInDays(tender)
    const endDate =
      executionPeriodDays !== null
        ? new Date(Date.now() + executionPeriodDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined

    return {
      id: projectId,
      name: tender.name,
      description: `مشروع ${tender.name} - منافسة فائزة`,
      client: tender.client,
      status: 'planning',
      contractValue: totalBudget,
      estimatedCost,
      actualCost: 0,
      estimatedProfit,
      budget: estimatedCost,
      startDate: new Date().toISOString(),
      endDate,
      createdDate: new Date().toISOString(),
      tenderId: tender.id,
      tenderData: {
        originalTender: tender,
        pricingData,
        quantityTable: getTenderQuantityTable(tender)
      },
      progress: 0,
      phase: tender.phase ?? 'planning',
      priority: tender.priority ?? 'medium',
      manager: tender.manager ?? 'مدير المشاريع',
      team: tender.team ?? 'فريق التنفيذ',
      location: tender.location,
      category: tender.category ?? 'إنشاءات',
      source: 'won_tender',
      createdBy: 'system',
      lastUpdate: new Date().toISOString()
    }
  }
}

export default TenderCalculations