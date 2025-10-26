// ✅ أداة مركزية لتطبيع بيانات التسعير وإصلاح BOQ
// سيتم لاحقاً إزالة console.debug بعد التحقق

import type { BOQData, BOQItem } from '@/shared/types/boq'
import type { PurchaseOrder } from '@/application/services/purchaseOrderService'
import type { Expense } from '@/data/expenseCategories'
import {
  DESCRIPTION_ALIASES,
  UNIT_ALIASES,
  QUANTITY_ALIASES,
  TOTAL_ALIASES,
  UNIT_PRICE_ALIASES,
} from '@/shared/constants/pricingConstants'

type UnknownRecord = Record<string, unknown>

export interface PricingResource extends UnknownRecord {
  id?: string | number
  name?: string
  description?: string
  price?: number
  quantity?: number
  total?: number
}

export interface AdditionalPercentages {
  administrative?: number
  operational?: number
  profit?: number
}

export interface NormalizedPricingItem extends Record<string, unknown> {
  id: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  materials: PricingResource[]
  labor: PricingResource[]
  equipment: PricingResource[]
  subcontractors: PricingResource[]
  additionalPercentages?: AdditionalPercentages
  finalPrice: number
  __raw?: unknown
  __sourceType?: string
  __poId?: string
}

// استخدام القوائم المركزية من pricingConstants
const descriptionFields = [...DESCRIPTION_ALIASES]
const unitFields = [...UNIT_ALIASES]
const qtyFields = [...QUANTITY_ALIASES]
const totalFields = [...TOTAL_ALIASES]
const unitPriceFields = [...UNIT_PRICE_ALIASES]

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return undefined
}

const pickNonEmptyString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const text = toTrimmedString(value)
    if (text) return text
  }
  return undefined
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

const toPositiveNumber = (value: unknown, fallback: number): number => {
  const numeric = toFiniteNumber(value)
  if (numeric === undefined || numeric <= 0) return fallback
  return numeric
}

const toResourceArray = (value: unknown): PricingResource[] => {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord).map((entry) => ({ ...entry }))
}

const toAdditionalPercentages = (value: unknown): AdditionalPercentages | undefined => {
  if (!isRecord(value)) return undefined
  const admin = toFiniteNumber(value.administrative)
  const operational = toFiniteNumber(value.operational)
  const profit = toFiniteNumber(value.profit)

  const result: AdditionalPercentages = {}
  if (admin !== undefined) result.administrative = admin
  if (operational !== undefined) result.operational = operational
  if (profit !== undefined) result.profit = profit
  return Object.keys(result).length > 0 ? result : undefined
}

const cloneResources = (resources: PricingResource[] | undefined): PricingResource[] =>
  resources ? resources.map((resource) => ({ ...resource })) : []

const mergeAdditionalPercentages = (
  primary: AdditionalPercentages | undefined,
  fallback: AdditionalPercentages | undefined,
): AdditionalPercentages | undefined => {
  if (!primary && !fallback) return undefined
  return { ...(fallback ?? {}), ...(primary ?? {}) }
}

export function normalizePricingItem(id: string | number, raw: unknown): NormalizedPricingItem {
  const stringId = String(id)
  const rawRecord = isRecord(raw) ? raw : {}

  const pick = (fields: readonly string[]): unknown => {
    for (const field of fields) {
      const value = rawRecord[field]
      if (value !== undefined && value !== null && value !== '') {
        return value
      }
    }
    return undefined
  }

  const descriptionFallback = `بند ${stringId.replace(/^(boq_|expense_|proj_)/, '').replace(/\d{13,}/, 'غير محدد')}`
  const description = toTrimmedString(pick(descriptionFields)) ?? descriptionFallback

  const unit = toTrimmedString(pick(unitFields)) ?? '—'

  const quantityCandidate = toFiniteNumber(pick(qtyFields))
  const quantity = quantityCandidate ?? 0

  const explicitUnitPrice = toFiniteNumber(pick(unitPriceFields))
  const totalCandidate = toFiniteNumber(pick(totalFields))
  const finalPriceCandidate = toFiniteNumber(rawRecord.finalPrice)

  let unitPrice = 0
  let totalPrice = 0

  if (finalPriceCandidate !== undefined && finalPriceCandidate > 0) {
    totalPrice = finalPriceCandidate
    unitPrice = quantity > 0 ? totalPrice / quantity : 0
  } else if (explicitUnitPrice !== undefined && explicitUnitPrice > 0) {
    unitPrice = explicitUnitPrice
    totalPrice = quantity * unitPrice
  } else if (quantity > 0 && totalCandidate !== undefined) {
    totalPrice = totalCandidate
    unitPrice = totalPrice / quantity
  } else {
    totalPrice = quantity * unitPrice
  }

  const additionalPercentages = toAdditionalPercentages(
    rawRecord.additionalPercentages ?? rawRecord.defaultPercentages,
  )

  return {
    id: stringId,
    description,
    unit,
    quantity,
    unitPrice,
    totalPrice,
    materials: toResourceArray(rawRecord.materials),
    labor: toResourceArray(rawRecord.labor),
    equipment: toResourceArray(rawRecord.equipment),
    subcontractors: toResourceArray(rawRecord.subcontractors),
    additionalPercentages,
    finalPrice: finalPriceCandidate ?? totalPrice,
    __raw: raw,
    __sourceType: toTrimmedString(rawRecord.__sourceType),
    __poId: toTrimmedString(rawRecord.__poId),
  }
}

export function buildPricingMap(
  pricing: [string, unknown][] | Record<string, unknown> | undefined | null,
) {
  const map = new Map<string, NormalizedPricingItem>()
  if (!pricing) return map
  if (Array.isArray(pricing)) {
    pricing.forEach(([id, obj]) => {
      if (obj !== undefined && obj !== null) {
        map.set(id, normalizePricingItem(id, obj))
      }
    })
  } else if (typeof pricing === 'object') {
    Object.entries(pricing).forEach(([id, obj]) => {
      if (obj !== undefined && obj !== null) {
        map.set(id, normalizePricingItem(id, obj))
      }
    })
  }
  return map
}

// ✅ دوال تطبيع جديدة لجميع أنواع البيانات في CostsTable

type ExpenseLike = Partial<Expense> & UnknownRecord
type PurchaseOrderItem = NonNullable<PurchaseOrder['items']>[number]
type PurchaseOrderItemLike = Partial<PurchaseOrderItem> & UnknownRecord

const sanitizeId = (value: unknown, prefix: string): string => {
  const candidate = toTrimmedString(value)
  if (candidate) return candidate
  return `${prefix}_${Date.now()}`
}

/**
 * تطبيع بيانات المصروفات (Expenses)
 */
export function normalizeExpenseItem(expenseInput: ExpenseLike): NormalizedPricingItem {
  const expense = expenseInput ?? {}
  const id = sanitizeId(expense.id, 'expense')
  const cleanId = id.replace('expense_', '').replace(/\d{13,}/, 'غير محدد')

  const quantity = toPositiveNumber(expense.quantity, 1)
  const amount = toFiniteNumber(expense.amount)
  const unitPriceCandidate = toFiniteNumber(expense.unitPrice)
  const unitPrice = amount && amount > 0 ? amount : (unitPriceCandidate ?? 0)
  const totalPrice = amount && amount > 0 ? amount : 0

  return normalizePricingItem(id, {
    description:
      pickNonEmptyString(expense.description, expense.title, expense.name) ?? `مصروف ${cleanId}`,
    unit: pickNonEmptyString(expense.unit) ?? 'مرة',
    quantity,
    unitPrice,
    totalPrice,
    category: pickNonEmptyString(expense.categoryId, expense.category),
    __sourceType: 'expense',
    __raw: expense,
  })
}

/**
 * تطبيع بيانات أوامر الشراء (Purchase Order Items)
 */
export function normalizePOItem(
  poItemInput: PurchaseOrderItemLike,
  poId: string,
  index: number,
): NormalizedPricingItem {
  const poItem = poItemInput ?? {}
  const id = `${poId}_${index}`

  const quantity = toPositiveNumber(poItem.quantity, 1)
  const unitPriceCandidate = toFiniteNumber(poItem.unitPrice ?? poItem.price)
  const totalCandidate = toFiniteNumber(poItem.totalPrice)
  const unitPrice = unitPriceCandidate ?? (quantity > 0 ? (totalCandidate ?? 0) : 0)
  const totalPrice = totalCandidate ?? unitPrice * quantity

  return normalizePricingItem(id, {
    description:
      pickNonEmptyString(poItem.description, poItem.name, poItem.title, poItem.specifications) ??
      `بند شراء ${index + 1}`,
    unit: pickNonEmptyString(poItem.unit, poItem.uom) ?? 'قطعة',
    quantity,
    unitPrice,
    totalPrice,
    category: pickNonEmptyString(poItem.category) ?? 'أمر شراء',
    __sourceType: 'po-item',
    __poId: poId,
    __raw: poItem,
  })
}

/**
 * تطبيع بيانات جدول الكميات (BOQ Items)
 */
export function normalizeBOQItem(boqItemInput: BOQItem): NormalizedPricingItem {
  const boqItem = boqItemInput ?? ({} as BOQItem)
  const id = sanitizeId(boqItem.id, 'boq')
  const cleanId = id.replace('boq_', '').replace(/\d{13,}/, 'غير محدد')

  const quantity = toFiniteNumber(boqItem.quantity) ?? 0
  const unitPriceCandidate = toFiniteNumber(boqItem.unitPrice ?? boqItem.price)
  const totalCandidate = toFiniteNumber(boqItem.totalPrice)
  const unitPrice = unitPriceCandidate ?? 0
  const totalPrice = totalCandidate ?? quantity * unitPrice

  return normalizePricingItem(id, {
    description:
      pickNonEmptyString(
        boqItem.description,
        boqItem.itemName,
        boqItem.desc,
        boqItem.name,
        boqItem.title,
        boqItem.specifications,
        boqItem.details,
        boqItem.itemDesc,
        boqItem.itemDescription,
        boqItem.label,
        boqItem.text,
      ) ?? `بند BOQ ${cleanId}`,
    unit: pickNonEmptyString(boqItem.unit, boqItem.uom) ?? 'وحدة',
    quantity,
    unitPrice,
    totalPrice,
    category: pickNonEmptyString(boqItem.category) ?? 'BOQ',
    actualQuantity: boqItem.actualQuantity,
    actualUnitPrice: boqItem.actualUnitPrice,
    materials: Array.isArray(boqItem.materials) ? boqItem.materials : [],
    labor: Array.isArray(boqItem.labor) ? boqItem.labor : [],
    equipment: Array.isArray(boqItem.equipment) ? boqItem.equipment : [],
    subcontractors: Array.isArray(boqItem.subcontractors) ? boqItem.subcontractors : [],
    additionalPercentages: toAdditionalPercentages(
      (boqItem as UnknownRecord).additionalPercentages,
    ),
    __sourceType: 'boq',
    __raw: boqItem,
  })
}

const getAdditionalPercentagesFromItem = (
  item: BOQItem | NormalizedPricingItem,
): AdditionalPercentages | undefined =>
  toAdditionalPercentages((item as UnknownRecord).additionalPercentages)

const isPlaceholderDescription = (item: BOQItem) =>
  !item.description ||
  item.description === item.id ||
  item.description.startsWith('بند رقم ') ||
  item.description.trim() === ''

const isPlaceholderUnit = (item: BOQItem) => !item.unit || item.unit === 'وحدة' || item.unit === '—'

const needsRepair = (item: BOQItem) => {
  const legacyNeedsRepair =
    isPlaceholderDescription(item) ||
    isPlaceholderUnit(item) ||
    item.quantity === 0 ||
    (item.unitPrice === 0 && (item.totalPrice ?? 0) > 0) ||
    item.materials == null ||
    item.labor == null ||
    item.equipment == null ||
    item.subcontractors == null ||
    getAdditionalPercentagesFromItem(item) == null

  const hasEstimated =
    item.estimated?.quantity !== undefined &&
    item.estimated.quantity > 0 &&
    item.estimated.unitPrice > 0

  const hasActual =
    item.actual?.quantity !== undefined && item.actual.quantity > 0 && item.actual.unitPrice > 0

  return legacyNeedsRepair || !hasEstimated || !hasActual
}

const findMatchInPricingMap = (item: BOQItem, pricingMap: Map<string, NormalizedPricingItem>) => {
  let match = pricingMap.get(item.id)
  if (match) return match

  if (item.originalId) {
    match = pricingMap.get(item.originalId)
    if (match) return match
  }

  const cleanId = String(item.id).replace(/^proj_/, '')
  match = pricingMap.get(cleanId)
  if (match) return match

  for (const [, pricing] of pricingMap) {
    if (
      pricing.description &&
      item.description &&
      pricing.description.trim() === item.description.trim()
    ) {
      return pricing
    }
  }

  return null
}

export interface RepairResult {
  updated: boolean
  repairedItems: number
  newItems: BOQItem[]
}

export function repairBOQ(
  boq: BOQData,
  pricingMap: Map<string, NormalizedPricingItem>,
): RepairResult {
  if (!boq || !Array.isArray(boq.items) || pricingMap.size === 0) {
    return { updated: false, repairedItems: 0, newItems: boq?.items ?? [] }
  }

  let repaired = 0
  const newItems = boq.items.map((item) => {
    if (!needsRepair(item)) return item

    const match = findMatchInPricingMap(item, pricingMap)
    if (!match) return item

    const before = JSON.stringify(item)
    const patched: BOQItem = { ...item }

    if (isPlaceholderDescription(patched)) patched.description = match.description
    if (isPlaceholderUnit(patched)) patched.unit = match.unit

    const matchAdditionalPercentages = match.additionalPercentages

    if (!patched.estimated || patched.estimated.quantity === 0) {
      patched.estimated = {
        quantity: match.quantity ?? 0,
        unitPrice: match.unitPrice ?? 0,
        totalPrice: match.totalPrice ?? 0,
        materials: match.materials ?? [],
        labor: match.labor ?? [],
        equipment: match.equipment ?? [],
        subcontractors: match.subcontractors ?? [],
        additionalPercentages: { ...(matchAdditionalPercentages ?? {}) },
      }
    }

    if (!patched.actual || patched.actual.quantity === 0) {
      patched.actual = {
        quantity: patched.estimated.quantity,
        unitPrice: patched.estimated.unitPrice,
        totalPrice: patched.estimated.totalPrice,
        materials: cloneResources(patched.estimated.materials),
        labor: cloneResources(patched.estimated.labor),
        equipment: cloneResources(patched.estimated.equipment),
        subcontractors: cloneResources(patched.estimated.subcontractors),
        additionalPercentages: patched.estimated.additionalPercentages
          ? { ...patched.estimated.additionalPercentages }
          : undefined,
      }
    }

    if (!patched.originalId && match.id) {
      patched.originalId = match.id
    }

    const activeValues = patched.actual ?? patched.estimated ?? {}
    patched.quantity = activeValues.quantity ?? 0
    patched.unitPrice = activeValues.unitPrice ?? 0
    patched.totalPrice = activeValues.totalPrice ?? 0
    patched.actualQuantity = patched.actual?.quantity ?? patched.estimated?.quantity ?? 0
    patched.actualUnitPrice = patched.actual?.unitPrice ?? patched.estimated?.unitPrice ?? 0
    patched.materials = cloneResources(activeValues.materials)
    patched.labor = cloneResources(activeValues.labor)
    patched.equipment = cloneResources(activeValues.equipment)
    patched.subcontractors = cloneResources(activeValues.subcontractors)

    const patchedWithPercentages = patched as BOQItem & {
      additionalPercentages?: AdditionalPercentages
    }
    patchedWithPercentages.additionalPercentages =
      mergeAdditionalPercentages(activeValues.additionalPercentages, matchAdditionalPercentages) ??
      {}

    if (JSON.stringify(patched) !== before) {
      repaired++
      console.debug('🛠️ BOQ item repaired with enhanced structure', {
        id: item.id,
        originalId: patched.originalId,
        hasEstimated: Boolean(patched.estimated),
        hasActual: Boolean(patched.actual),
      })
    }
    return patched
  })

  return { updated: repaired > 0, repairedItems: repaired, newItems }
}
