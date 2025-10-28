/**
 * Project Cost Tender Synchronization
 * Handles import and sync logic with tender BOQ data
 */

import type { ProjectCostItem, CostBreakdownSet, BreakdownRow } from './projectCostTypes'
import type { BOQItem } from '@/shared/types/boq'
import { loadAll, saveAll } from './projectCostStorage'
import {
  recomputeTotals,
  recomputeProfitMetrics,
  cloneBreakdownRows,
} from './projectCostCalculator'
import { getBOQRepository, getProjectRepository } from '@/application/services/serviceRegistry'
import { ensureDraft } from './projectCostDraft'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { safeLocalStorage, whenStorageReady } from '@/shared/utils/storage/storage'
import { APP_EVENTS, bus } from '@/events/bus'

// ============================================================================
// Helper Functions
// ============================================================================

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

const pickNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    const numeric = toFiniteNumber(value)
    if (numeric !== undefined) return numeric
  }
  return undefined
}

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const coalesceFromCandidates = (values: unknown[], fallback: string): string => {
  for (const value of values) {
    const candidate = toNonEmptyString(value)
    if (candidate) return candidate
  }
  return fallback
}

const sumBreakdownRows = (rows: BreakdownRow[]): number =>
  rows.reduce((sum, row) => {
    const total = toFiniteNumber(row.totalCost) ?? row.quantity * row.unitCost
    return sum + total
  }, 0)

const normalizeKey = (...values: unknown[]): string => {
  for (const value of values) {
    const key = toNonEmptyString(value)
    if (key) return key.toLowerCase()
  }
  return ''
}

const mapBreakdownRowsFromSource = (source: unknown[] | undefined): BreakdownRow[] => {
  if (!Array.isArray(source)) return []
  return source.filter(isRecord).map((raw, idx) => {
    const quantity = pickNumber(raw.quantity, raw.qty) ?? 0
    const unitCost = pickNumber(raw.unitCost, raw.price, raw.unitPrice) ?? 0
    const totalCost = pickNumber(raw.totalCost, raw.total, quantity * unitCost) ?? 0
    const unit = toNonEmptyString(raw.unit)
    return {
      id: coalesceFromCandidates(
        [raw.id, raw.code, raw.name, raw.description],
        `row_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      ),
      name: coalesceFromCandidates([raw.name, raw.description, raw.desc], `عنصر ${idx + 1}`),
      unit,
      quantity,
      unitCost,
      totalCost,
      origin: 'estimated',
    }
  })
}

// ============================================================================
// Tender Sync Operations
// ============================================================================

/**
 * Sync estimated values directly from tender BOQ pricing page
 * - Updates quantity, unitPrice, totalPrice, and breakdown from tender
 * - Does not touch actual side
 * - Fixes cases where unitPrice == totalPrice with quantity > 1
 */
export async function syncEstimatedFromTender(projectId: string, tenderId?: string) {
  const all = loadAll()
  const env = all[projectId]
  if (!env?.draft) return

  const sourceTenderId = tenderId ?? env.meta.sourceTenderId
  if (!sourceTenderId) return

  const boqRepository = getBOQRepository()
  const tenderBOQ = await boqRepository.getByTenderId(sourceTenderId)
  if (!tenderBOQ) return

  const tenderIndex = new Map<string, BOQItem>()
  for (const src of tenderBOQ.items) {
    const identifier = normalizeKey(src.originalId, src.id, src.description)
    tenderIndex.set(identifier, src)
  }

  let changed = false

  for (const item of env.draft.items) {
    const lookupKey = normalizeKey(item.originalId, item.description, item.id)
    const src = tenderIndex.get(lookupKey)
    if (!src) continue

    const newQty = pickNumber(src.quantity, src.estimated?.quantity) ?? 0
    const newUnit = pickNumber(src.unitPrice, src.estimated?.unitPrice) ?? 0
    const newTotal = pickNumber(src.totalPrice, src.estimated?.totalPrice, newQty * newUnit) ?? 0

    if (
      item.estimated.quantity !== newQty ||
      item.estimated.unitPrice !== newUnit ||
      item.estimated.totalPrice !== newTotal
    ) {
      item.estimated.quantity = newQty
      item.estimated.unitPrice = newUnit
      item.estimated.totalPrice = newTotal
      changed = true
    }

    // Fix cases where unitPrice == totalPrice with quantity > 1
    if (
      item.estimated.quantity > 1 &&
      Math.abs(
        (item.estimated.unitPrice ?? 0) * item.estimated.quantity -
          (item.estimated.totalPrice ?? 0),
      ) > 0.0001
    ) {
      // keep user-provided adjustments
    } else if (
      item.estimated.quantity > 1 &&
      item.estimated.unitPrice === item.estimated.totalPrice
    ) {
      const derived = +((item.estimated.totalPrice ?? 0) / item.estimated.quantity).toFixed(4)
      if (derived !== item.estimated.unitPrice) {
        item.estimated.unitPrice = derived
        changed = true
      }
    }

    // Sync breakdown if available
    const newBreak = {
      materials: mapBreakdownRowsFromSource(src.materials),
      labor: mapBreakdownRowsFromSource(src.labor),
      equipment: mapBreakdownRowsFromSource(src.equipment),
      subcontractors: mapBreakdownRowsFromSource(src.subcontractors),
    }

    const newCount =
      newBreak.materials.length +
      newBreak.labor.length +
      newBreak.equipment.length +
      newBreak.subcontractors.length

    if (newCount > 0) {
      const sections: (keyof CostBreakdownSet)[] = [
        'materials',
        'labor',
        'equipment',
        'subcontractors',
      ]
      const oldSum = sections.reduce(
        (sum, section) => sum + sumBreakdownRows(item.estimated.breakdown[section]),
        0,
      )
      const newSum = sections.reduce((sum, section) => sum + sumBreakdownRows(newBreak[section]), 0)
      if (Math.abs(oldSum - newSum) > 0.0001) {
        item.estimated.breakdown = newBreak
        changed = true
      }
    }
  }

  if (changed) {
    env.draft.lastUpdated = new Date().toISOString()
    saveAll(all)

    try {
      const projectRepository = getProjectRepository()
      const project = await projectRepository.getById(projectId)
      if (project) {
        recomputeProfitMetrics(project, env)
        saveAll(all)
      }
    } catch (err) {
      console.warn('Failed to recompute profit metrics after syncEstimatedFromTender', err)
    }

    bus.emit(APP_EVENTS.COST_ENVELOPE_UPDATED, { projectId })
  }
}

/**
 * Merge tender BOQ into project draft with smart conflict resolution
 * Rules:
 * - Existing unmodified items: update estimated side only
 * - Modified items (state.isModified): don't touch, flag hasIncomingChange if source changed
 * - New tender items: add as new items with origin='imported'
 * - Don't remove items not in tender (may be manually added)
 */
export async function mergeFromTender(projectId: string, tenderId: string) {
  ensureDraft(projectId)
  const all = loadAll()
  const env = all[projectId]
  if (!env?.draft) throw new Error('Draft not initialized')

  await whenStorageReady()
  const boqRepository = getBOQRepository()

  const debugSnapshot = safeLocalStorage.getItem(STORAGE_KEYS.BOQ_DATA, []) as unknown
  console.log('🧾 [ProjectCostService] BOQ snapshot before merge:', debugSnapshot)

  const tenderBOQ = await boqRepository.getByTenderId(tenderId)
  if (!tenderBOQ) throw new Error('Tender BOQ not found')

  const draft = env.draft
  const existingIndex = new Map<string, ProjectCostItem>()

  for (const item of draft.items) {
    const key = normalizeKey(item.originalId, item.description, item.id)
    existingIndex.set(key, item)
  }

  let added = 0
  let updated = 0
  let unchanged = 0
  let conflicted = 0

  for (const src of tenderBOQ.items) {
    const key = normalizeKey(src.originalId, src.description, src.id)
    const target = existingIndex.get(key)
    const srcRecord = src as Record<string, unknown>

    const baseBreakdown = {
      materials: mapBreakdownRowsFromSource(src.materials),
      labor: mapBreakdownRowsFromSource(src.labor),
      equipment: mapBreakdownRowsFromSource(src.equipment),
      subcontractors: mapBreakdownRowsFromSource(src.subcontractors),
    }

    if (!target) {
      // Add new item
      const description = coalesceFromCandidates(
        [srcRecord.canonicalDescription, src.description, srcRecord.desc, srcRecord.name],
        'بند بدون وصف',
      )
      const unit = toNonEmptyString(src.unit ?? srcRecord.unit)
      const category = toNonEmptyString(src.category ?? srcRecord.category)

      const estimatedQuantity = pickNumber(src.estimated?.quantity, src.quantity) ?? 0
      const estimatedUnitPrice = pickNumber(src.estimated?.unitPrice, src.unitPrice) ?? 0
      const estimatedTotalPrice = pickNumber(src.estimated?.totalPrice, src.totalPrice) ?? 0

      const actualQuantity =
        pickNumber(src.actual?.quantity, src.estimated?.quantity, src.quantity) ?? 0
      const actualUnitPrice =
        pickNumber(src.actual?.unitPrice, src.estimated?.unitPrice, src.unitPrice) ?? 0
      const actualTotalPrice =
        pickNumber(src.actual?.totalPrice, src.estimated?.totalPrice, src.totalPrice) ?? 0

      const newItem: ProjectCostItem = {
        id: `pci_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        originalId: src.id,
        description,
        unit,
        category,
        estimated: {
          quantity: estimatedQuantity,
          unitPrice: estimatedUnitPrice,
          totalPrice: estimatedTotalPrice,
          breakdown: baseBreakdown,
          additionalPercentages: src.estimated?.additionalPercentages ?? {},
        },
        actual: {
          quantity: actualQuantity,
          unitPrice: actualUnitPrice,
          totalPrice: actualTotalPrice,
          breakdown: {
            materials: cloneBreakdownRows(baseBreakdown.materials),
            labor: cloneBreakdownRows(baseBreakdown.labor),
            equipment: cloneBreakdownRows(baseBreakdown.equipment),
            subcontractors: cloneBreakdownRows(baseBreakdown.subcontractors),
          },
          additionalPercentages:
            src.actual?.additionalPercentages ?? src.estimated?.additionalPercentages ?? {},
        },
        procurement: { committed: 0, allocated: 0, links: [] },
        variance: { value: 0, pct: 0 },
        state: { isModified: false, isNew: true, lastEditAt: new Date().toISOString() },
        origin: 'imported',
      }

      draft.items.push(newItem)
      existingIndex.set(key, newItem)
      added++
    } else {
      // Update existing item
      const newEstimatedTotal = pickNumber(src.estimated?.totalPrice, src.totalPrice) ?? 0
      const changed = Math.abs(newEstimatedTotal - target.estimated.totalPrice) > 0.0001

      if (!target.state.isModified) {
        // Update unmodified items
        target.estimated.quantity = pickNumber(src.estimated?.quantity, src.quantity) ?? 0
        target.estimated.unitPrice = pickNumber(src.unitPrice, src.estimated?.unitPrice) ?? 0
        target.estimated.totalPrice = newEstimatedTotal

        const totalBreakdownRows =
          baseBreakdown.materials.length +
          baseBreakdown.labor.length +
          baseBreakdown.equipment.length +
          baseBreakdown.subcontractors.length

        if (totalBreakdownRows > 0) {
          target.estimated.breakdown = baseBreakdown

          const actualHasRows =
            target.actual.breakdown.materials.length +
              target.actual.breakdown.labor.length +
              target.actual.breakdown.equipment.length +
              target.actual.breakdown.subcontractors.length >
            0

          if (!actualHasRows) {
            target.actual.breakdown = {
              materials: cloneBreakdownRows(baseBreakdown.materials),
              labor: cloneBreakdownRows(baseBreakdown.labor),
              equipment: cloneBreakdownRows(baseBreakdown.equipment),
              subcontractors: cloneBreakdownRows(baseBreakdown.subcontractors),
            }
          }
        }

        if (src.estimated?.additionalPercentages) {
          target.estimated.additionalPercentages = { ...src.estimated.additionalPercentages }
        }

        target.state.lastEditAt = new Date().toISOString()
        updated++
      } else if (changed) {
        // Modified items with incoming changes - flag conflict
        target.state.hasIncomingChange = true
        conflicted++
      } else {
        unchanged++
      }
    }
  }

  recomputeTotals(draft)

  const projectRepository = getProjectRepository()
  const project = await projectRepository.getById(projectId)
  if (project) {
    recomputeProfitMetrics(project, env)
  }

  env.meta.lastImportFromTenderAt = new Date().toISOString()
  env.meta.sourceTenderId = tenderId
  env.meta.itemStats = {
    total: draft.items.length,
    modified: draft.items.filter((i) => i.state.isModified).length,
    unmodified: draft.items.filter((i) => !i.state.isModified).length,
    added,
    removed: 0,
  }

  saveAll(all)
  bus.emit(APP_EVENTS.COST_ENVELOPE_UPDATED, { projectId })

  return {
    added,
    updated,
    unchanged,
    conflicted,
    total: draft.items.length,
  }
}
