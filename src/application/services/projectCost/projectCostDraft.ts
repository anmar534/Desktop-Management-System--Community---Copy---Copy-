/**
 * Project Cost Draft Management
 * Handles draft creation, editing, promotion, and breakdown table management
 */

import type {
  ProjectBOQData,
  ProjectCostEnvelope,
  CostBreakdownSet,
  ActualBreakdownTable,
  BreakdownRow,
} from './projectCostTypes'
import { loadAll, saveAll } from './projectCostStorage'
import { recomputeTotals, recomputeProfitMetrics } from './projectCostCalculator'
import { getProjectRepository } from '@/application/services/serviceRegistry'
import { APP_EVENTS, bus } from '@/events/bus'

// ============================================================================
// Helper Functions
// ============================================================================

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

// ============================================================================
// Draft Initialization & Management
// ============================================================================

/**
 * Initialize a new cost envelope for a project
 */
export function initEnvelope(
  projectId: string,
  opts: { sourceTenderId?: string; strategy?: 'initial' } = {},
): ProjectCostEnvelope {
  const all = loadAll()
  if (all[projectId]) return all[projectId]

  const empty: ProjectBOQData = {
    id: `pboq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    status: 'draft',
    items: [],
    totals: { estimatedTotal: 0, actualTotal: 0, varianceTotal: 0, variancePct: 0 },
    lastUpdated: new Date().toISOString(),
  }

  const env: ProjectCostEnvelope = {
    draft: empty,
    meta: {
      sourceTenderId: opts.sourceTenderId,
      importStrategy: opts.strategy ?? 'initial',
      itemStats: { total: 0, modified: 0, unmodified: 0, added: 0, removed: 0 },
    },
  }

  all[projectId] = env
  saveAll(all)
  return env
}

/**
 * Ensure draft exists (create if missing)
 */
export function ensureDraft(projectId: string) {
  const all = loadAll()
  if (!all[projectId]) {
    initEnvelope(projectId, {})
  } else if (!all[projectId].draft) {
    const env = all[projectId]
    if (env.official) {
      env.draft = structuredClone(env.official)
      env.draft.status = 'draft'
    } else {
      env.draft = {
        id: `pboq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        projectId,
        status: 'draft',
        items: [],
        totals: { estimatedTotal: 0, actualTotal: 0, varianceTotal: 0, variancePct: 0 },
        lastUpdated: new Date().toISOString(),
      }
    }
    saveAll(all)
  }
}

/**
 * Save draft with mutation function
 */
export function saveDraft(
  projectId: string,
  mutate: (draft: ProjectBOQData) => void | ProjectBOQData,
): ProjectBOQData {
  const all = loadAll()
  const env = all[projectId]
  if (!env?.draft) throw new Error('Draft not initialized')

  const maybeReplacement = mutate(env.draft)
  if (maybeReplacement) {
    env.draft = maybeReplacement
  }

  recomputeTotals(env.draft)
  saveAll(all)

  // Async finalization
  const finalize = async () => {
    try {
      const projectRepository = getProjectRepository()
      const project = await projectRepository.getById(projectId)
      if (project) {
        recomputeProfitMetrics(project, env)
        saveAll(all)
      }
    } catch (err) {
      console.warn('Failed to recompute profit metrics for project', projectId, err)
    } finally {
      try {
        bus.emit(APP_EVENTS.COST_ENVELOPE_UPDATED, { projectId })
      } catch (emitErr) {
        console.warn('Failed to emit COST_ENVELOPE_UPDATED', emitErr)
      }
    }
  }

  void finalize()
  return env.draft
}

/**
 * Promote draft to official
 */
export function promote(projectId: string): ProjectBOQData {
  const all = loadAll()
  const env = all[projectId]
  if (!env?.draft) throw new Error('Nothing to promote')

  recomputeTotals(env.draft)
  const promoted = structuredClone(env.draft)
  promoted.status = 'official'

  env.official = promoted
  env.meta.lastPromotionAt = new Date().toISOString()
  saveAll(all)

  // Async project update
  void (async () => {
    try {
      const projectRepository = getProjectRepository()
      const project = await projectRepository.getById(projectId)
      if (project) {
        const estimatedCost = promoted.totals.estimatedTotal
        const actualCost = promoted.totals.actualTotal
        const updated: Partial<typeof project> = {
          estimatedCost,
          actualCost,
          spent: actualCost,
          remaining: project.contractValue - actualCost,
          actualProfit: project.contractValue - actualCost,
        }
        const persisted = (await projectRepository.update(projectId, updated)) ?? {
          ...project,
          ...updated,
        }
        recomputeProfitMetrics(persisted, env)
        saveAll(all)
      }
    } catch (err) {
      console.warn('Failed to promote project cost envelope', projectId, err)
    } finally {
      try {
        bus.emit(APP_EVENTS.COST_ENVELOPE_UPDATED, { projectId })
      } catch (emitErr) {
        console.warn('Failed to emit COST_ENVELOPE_UPDATED after promote', emitErr)
      }
    }
  })()

  return promoted
}

// ============================================================================
// Actual Breakdown Table Management (Multiple Tables Per Item)
// ============================================================================

/**
 * Add a new actual breakdown table to an item
 */
export function addActualBreakdownTable(
  projectId: string,
  itemId: string,
  name?: string,
): ActualBreakdownTable | null {
  let created: ActualBreakdownTable | null = null

  saveDraft(projectId, (draft) => {
    const it = draft.items.find((i) => i.id === itemId)
    if (!it) return

    if (!Array.isArray(it.actual.breakdownTables)) it.actual.breakdownTables = []

    const idx = it.actual.breakdownTables.length + 1
    const tableName = toNonEmptyString(name) ?? `جدول ${idx}`

    created = {
      id: `abtbl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: tableName,
      breakdown: { materials: [], labor: [], equipment: [], subcontractors: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    it.actual.breakdownTables.push(created)
  })

  return created
}

/**
 * Rename an actual breakdown table
 */
export function renameActualBreakdownTable(
  projectId: string,
  itemId: string,
  tableId: string,
  newName: string,
) {
  saveDraft(projectId, (draft) => {
    const tbl = draft.items
      .find((i) => i.id === itemId)
      ?.actual.breakdownTables?.find((t) => t.id === tableId)

    if (tbl) {
      tbl.name = newName
      tbl.updatedAt = new Date().toISOString()
    }
  })
}

/**
 * Remove an actual breakdown table
 */
export function removeActualBreakdownTable(projectId: string, itemId: string, tableId: string) {
  saveDraft(projectId, (draft) => {
    const it = draft.items.find((i) => i.id === itemId)
    if (!it?.actual.breakdownTables) return

    it.actual.breakdownTables = it.actual.breakdownTables.filter((t) => t.id !== tableId)
  })
}

/**
 * Upsert (insert or update) a breakdown row in an actual breakdown table
 */
export function upsertActualBreakdownRow(
  projectId: string,
  itemId: string,
  tableId: string,
  section: keyof CostBreakdownSet,
  row: Partial<BreakdownRow> & { id?: string },
) {
  saveDraft(projectId, (draft) => {
    const it = draft.items.find((i) => i.id === itemId)
    if (!it) return
    if (!Array.isArray(it.actual.breakdownTables)) return

    const tbl = it.actual.breakdownTables.find((t) => t.id === tableId)
    if (!tbl) return

    const list = tbl.breakdown[section]
    const rid =
      toNonEmptyString(row.id) ?? `row_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`

    let target = list.find((r) => r.id === rid)
    if (!target) {
      const defaultName = toNonEmptyString(row.name) ?? 'عنصر'
      target = {
        id: rid,
        name: defaultName,
        quantity: 0,
        unitCost: 0,
        totalCost: 0,
        origin: 'actual-only',
      }
      list.push(target)
    }

    if (typeof row.name === 'string') target.name = row.name
    if (typeof row.quantity === 'number') target.quantity = row.quantity
    if (typeof row.unitCost === 'number') target.unitCost = row.unitCost

    const quantity = target.quantity ?? 0
    const unitCost = target.unitCost ?? 0
    target.totalCost = +(quantity * unitCost).toFixed(2)

    tbl.updatedAt = new Date().toISOString()
  })
}

/**
 * Remove a breakdown row from the single breakdown (not from tables)
 */
export function removeActualBreakdownRow(
  projectId: string,
  itemId: string,
  section: keyof CostBreakdownSet,
  rowId: string,
) {
  saveDraft(projectId, (draft) => {
    const it = draft.items.find((i) => i.id === itemId)
    if (!it?.actual?.breakdown) return

    const list = it.actual.breakdown[section]
    const idx = list.findIndex((r) => r.id === rowId)
    if (idx >= 0) list.splice(idx, 1)
  })
}

/**
 * Compute actual cost decomposition for an item
 */
export function computeActualCostDecomposition(projectId: string, itemId: string) {
  const all = loadAll()
  const env = all[projectId]
  if (!env?.draft) return null

  const item = env.draft.items.find((i) => i.id === itemId)
  if (!item) return null

  const sumRows = (rows: BreakdownRow[]) =>
    rows.reduce((sum, row) => {
      const total = toFiniteNumber(row.totalCost) ?? row.quantity * row.unitCost
      return sum + total
    }, 0)

  let base = 0
  let administrative = 0
  let operational = 0
  let profit = 0

  const side = item.actual
  if (!side?.breakdown) return null

  // Sum from breakdown tables if they exist, otherwise use single breakdown
  if (Array.isArray(side.breakdownTables) && side.breakdownTables.length > 0) {
    for (const tbl of side.breakdownTables) {
      if (!tbl?.breakdown) continue
      base +=
        sumRows(tbl.breakdown.materials) +
        sumRows(tbl.breakdown.labor) +
        sumRows(tbl.breakdown.equipment) +
        sumRows(tbl.breakdown.subcontractors)
    }
  } else {
    base =
      sumRows(side.breakdown.materials) +
      sumRows(side.breakdown.labor) +
      sumRows(side.breakdown.equipment) +
      sumRows(side.breakdown.subcontractors)
  }

  const adminPct = side?.additionalPercentages?.administrative ?? 0
  const opPct = side?.additionalPercentages?.operational ?? 0
  const profitPct = side?.additionalPercentages?.profit ?? 0

  administrative = base * (adminPct / 100)
  operational = base * (opPct / 100)
  profit = base * (profitPct / 100)

  return {
    base,
    administrative,
    operational,
    profit,
    actualTotal: item.actual.totalPrice ?? 0,
  }
}
