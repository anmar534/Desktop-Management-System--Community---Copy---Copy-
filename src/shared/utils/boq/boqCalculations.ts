import type { BOQItem } from '@/shared/types/boq'

export interface BOQPlannedActual {
  planned: number
  actual: number
  diff: number
}

export interface LinkedPOItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
  boqItemId?: string
}

interface BreakdownEntry {
  quantity?: number
  unitPrice?: number
  total?: number
}

interface AdditionalPercentages {
  administrative?: number
  operational?: number
  profit?: number
}

type BreakdownKey = 'materials' | 'labor' | 'equipment' | 'subcontractors'

type BOQItemWithBreakdown = BOQItem & {
  materials?: unknown
  labor?: unknown
  equipment?: unknown
  subcontractors?: unknown
  additionalPercentages?: unknown
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const isBreakdownEntry = (value: unknown): value is BreakdownEntry =>
  typeof value === 'object' && value !== null

const getBreakdownEntries = (value: unknown): BreakdownEntry[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isBreakdownEntry).map((entry) => ({
    quantity: entry.quantity,
    unitPrice: entry.unitPrice,
    total: entry.total,
  }))
}

const sumBreakdown = (entries: BreakdownEntry[] | undefined): number => {
  if (!entries || entries.length === 0) {
    return 0
  }

  return entries.reduce((sum, entry) => {
    const explicitTotal = entry.total
    if (explicitTotal !== undefined) {
      return sum + toNumber(explicitTotal)
    }

    const quantity = toNumber(entry.quantity)
    const unitPrice = toNumber(entry.unitPrice)
    return sum + quantity * unitPrice
  }, 0)
}

const hasBreakdownData = (item: BOQItemWithBreakdown): boolean => {
  const keys: BreakdownKey[] = ['materials', 'labor', 'equipment', 'subcontractors']
  return keys.some((key) => Array.isArray(item[key]) && (item[key] as unknown[]).length > 0)
}

const extractPercentages = (item: BOQItemWithBreakdown): AdditionalPercentages => {
  const raw = item.additionalPercentages
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  const { administrative, operational, profit } = raw as Record<string, unknown>
  return {
    administrative: toNumber(administrative),
    operational: toNumber(operational),
    profit: toNumber(profit),
  }
}

const getBreakdownForKey = (item: BOQItemWithBreakdown, key: BreakdownKey): BreakdownEntry[] =>
  getBreakdownEntries(item[key])

export function computePlanned(item: BOQItem): number {
  const itemWithBreakdown: BOQItemWithBreakdown = item
  const qty = item.quantity ?? 0
  // إذا كانت لدينا تفصيلات المواد/العمالة/المعدات/مقاولي الباطن فاحسب التكلفة منها
  if (hasBreakdownData(itemWithBreakdown)) {
    const materials = sumBreakdown(getBreakdownForKey(itemWithBreakdown, 'materials'))
    const labor = sumBreakdown(getBreakdownForKey(itemWithBreakdown, 'labor'))
    const equipment = sumBreakdown(getBreakdownForKey(itemWithBreakdown, 'equipment'))
    const subcontractors = sumBreakdown(getBreakdownForKey(itemWithBreakdown, 'subcontractors'))
    const base = materials + labor + equipment + subcontractors
    // نسب إضافية (قد تكون مخزنة كقيم نسبية مئوية داخل item.additionalPercentages)
    const perc = extractPercentages(itemWithBreakdown)
    const administrative = base * ((perc.administrative ?? 0) / 100)
    const operational = base * ((perc.operational ?? 0) / 100)
    const profit = base * ((perc.profit ?? 0) / 100)
    const total = base + administrative + operational + profit
    // إذا وُجدت كمية فاستخدم الإجمالي كوحدة سعر ضمنية لتسهيل المقارنات لاحقاً
    if (qty > 0 && item.unitPrice == null) {
      item.unitPrice = total / qty
    }
    return total || (item.unitPrice ?? 0) * qty
  }
  return (item.unitPrice ?? 0) * qty
}

export function computeActual(_item: BOQItem, linked: LinkedPOItem[]): number {
  // لاحقاً يمكن استخدام بيانات البند (مثل actualQuantity) لكن حالياً الاعتماد على العناصر المرتبطة
  if (!linked || linked.length === 0) return 0
  return linked.reduce((sum, item) => {
    const total = item.totalPrice ?? item.quantity * item.unitPrice
    return sum + total
  }, 0)
}

export function computeDiff(planned: number, actual: number): number {
  return actual - planned
}

export function buildPOIndex(
  purchaseOrders: { id: string; items?: LinkedPOItem[] }[] | undefined,
): Map<string, LinkedPOItem[]> {
  const map = new Map<string, LinkedPOItem[]>()
  for (const po of purchaseOrders ?? []) {
    for (const it of po.items ?? []) {
      if (it.boqItemId) {
        if (!map.has(it.boqItemId)) map.set(it.boqItemId, [])
        map.get(it.boqItemId)!.push(it)
      }
    }
  }
  return map
}

export function aggregateTotals(items: BOQItem[], poIndex: Map<string, LinkedPOItem[]>) {
  let plannedTotal = 0
  let actualTotal = 0
  for (const item of items) {
    const planned = computePlanned(item)
    const actual = computeActual(item, poIndex.get(item.id) ?? [])
    plannedTotal += planned
    actualTotal += actual
  }
  return { plannedTotal, actualTotal, diffTotal: actualTotal - plannedTotal }
}
