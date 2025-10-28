import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { safeLocalStorage, whenStorageReady } from '@/shared/utils/storage/storage'
import { getBOQRepository, getProjectRepository } from '@/application/services/serviceRegistry'
import type { Project } from '@/data/centralData'
import type { BOQItem } from '@/shared/types/boq'
import { APP_EVENTS, bus } from '@/events/bus'

/**
 * Project Cost Envelope & BOQ Draft/Official Management
 * Phase 1: Data layer only (no UI yet)
 */

export interface BreakdownRow {
  id: string
  name: string
  unit?: string
  quantity: number
  unitCost: number
  totalCost: number
  origin: 'estimated' | 'actual-only'
  procurementLinks?: string[] // purchaseOrderId references
}

export interface PercentagesSet {
  administrative?: number
  operational?: number
  profit?: number
  other?: Record<string, number>
}

export interface CostBreakdownSet {
  materials: BreakdownRow[]
  labor: BreakdownRow[]
  equipment: BreakdownRow[]
  subcontractors: BreakdownRow[]
}

// جدول تحليل فعلي منفصل (للسماح بعدة جداول لكل بند)
export interface ActualBreakdownTable {
  id: string // ex: tbl_173456789
  name: string // ex: "جدول 1" / "معدات إضافية"...
  breakdown: CostBreakdownSet
  createdAt: string
  updatedAt: string
}

export interface CostSideData {
  quantity: number
  unitPrice: number
  totalPrice: number
  breakdown: CostBreakdownSet
  additionalPercentages: PercentagesSet
  /** جداول تحليل فعلية متعددة (اختياري – إن لم توجد نستخدم breakdown الأحادي) */
  breakdownTables?: ActualBreakdownTable[]
}

export interface ProjectCostItem {
  id: string
  originalId?: string
  description: string
  unit?: string
  category?: string
  estimated: CostSideData
  actual: CostSideData
  procurement: {
    committed: number // مجموع ما تم التزامه من أوامر الشراء
    allocated: number // مجموع ما تم تخصيصه فعلياً للبند
    links: {
      purchaseOrderId: string
      amount: number
      breakdownItemId?: string
      lastSync: string
      allocationMode: 'manual' | 'proportional'
    }[]
  }
  variance: { value: number; pct: number }
  state: {
    isModified: boolean
    hasIncomingChange?: boolean
    isRemoved?: boolean
    isNew?: boolean
    lastEditAt?: string
    breakdownDirty?: boolean
  }
  origin?: 'imported' | 'manual' | 'actual-only'
}

export interface ProjectBOQEnvelopeMeta {
  lastPromotionAt?: string
  lastImportFromTenderAt?: string
  sourceTenderId?: string
  importStrategy?: 'initial' | 'merge' | 'overwrite'
  itemStats?: {
    total: number
    modified: number
    unmodified: number
    added: number
    removed: number
  }
  lastVarianceAnalysisAt?: string
  metrics?: {
    expectedProfit: number
    actualProfit: number
    erosionValue: number
    erosionPct: number
    lastRecomputedAt: string
  }
}

export interface ProjectBOQData {
  id: string // internal id for the BOQ snapshot
  projectId: string
  status: 'draft' | 'official'
  items: ProjectCostItem[]
  totals: {
    estimatedTotal: number
    actualTotal: number
    varianceTotal: number
    variancePct: number
  }
  lastUpdated: string
}

export interface ProjectCostEnvelope {
  projectId: string
  draft: ProjectBOQData | null
  official: ProjectBOQData | null
  meta: ProjectBOQEnvelopeMeta
  version?: number // for future migrations
}

type StoredEnvelopesIndex = Record<string, ProjectCostEnvelope>

function loadAll(): StoredEnvelopesIndex {
  return safeLocalStorage.getItem<StoredEnvelopesIndex>(STORAGE_KEYS.PROJECT_COST_ENVELOPES, {})
}

function saveAll(data: StoredEnvelopesIndex) {
  safeLocalStorage.setItem(STORAGE_KEYS.PROJECT_COST_ENVELOPES, data)
}

function createEmptySide(): CostSideData {
  return {
    quantity: 0,
    unitPrice: 0,
    totalPrice: 0,
    breakdown: { materials: [], labor: [], equipment: [], subcontractors: [] },
    additionalPercentages: {},
  }
}

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

const cloneBreakdownRows = (rows: BreakdownRow[]): BreakdownRow[] => rows.map((row) => ({ ...row }))

const normalizeKey = (...values: unknown[]): string => {
  for (const value of values) {
    const key = toNonEmptyString(value)
    if (key) return key.toLowerCase()
  }
  return ''
}

const ensureProjectCostItem = (
  item: ProjectCostItem | null,
  errorMessage: string,
): ProjectCostItem => {
  if (!item) {
    throw new Error(errorMessage)
  }
  return item
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

function computeItemVariance(item: ProjectCostItem) {
  const value = item.actual.totalPrice - item.estimated.totalPrice
  const pct =
    item.estimated.totalPrice > 0
      ? (value / item.estimated.totalPrice) * 100
      : item.actual.totalPrice > 0
        ? 100
        : 0
  item.variance = { value, pct }
}

function recomputeTotals(boq: ProjectBOQData) {
  let estimatedTotal = 0
  let actualTotal = 0
  for (const it of boq.items) {
    // التقديري: لا يُعاد حسابه هنا (يُعرض كما ورد من صفحة التسعير)
    // الفعلي فقط يُعاد حسابه من التحليل (breakdown) + النسب لأن هذه الصفحة مسؤولة عنه
    const recomputeActual = (side: CostSideData) => {
      if (!side?.breakdown) return
      const sumRows = (rows: BreakdownRow[]) => sumBreakdownRows(rows)
      // اختيار: إذا وُجدت breakdownTables نأخذ مجموعها، وإلا نستخدم breakdown الأحادي
      let base = 0
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
      if (base > 0) {
        const adminPct = side.additionalPercentages?.administrative ?? 0
        const opPct = side.additionalPercentages?.operational ?? 0
        const profitPct = side.additionalPercentages?.profit ?? 0
        const administrativeValue = base * (adminPct / 100)
        const operationalValue = base * (opPct / 100)
        const profitValue = base * (profitPct / 100)
        const totalBeforeTax = base + administrativeValue + operationalValue + profitValue
        if (!side.quantity || side.quantity <= 0) side.quantity = 1
        const calculatedUnitPrice = totalBeforeTax / side.quantity
        side.unitPrice = +calculatedUnitPrice.toFixed(4)
        side.totalPrice = +totalBeforeTax.toFixed(2)
      }
    }
    recomputeActual(it.actual)
    computeItemVariance(it)
    estimatedTotal += it.estimated.totalPrice
    actualTotal += it.actual.totalPrice
  }
  const varianceTotal = actualTotal - estimatedTotal
  const variancePct =
    estimatedTotal > 0 ? (varianceTotal / estimatedTotal) * 100 : actualTotal > 0 ? 100 : 0
  boq.totals = { estimatedTotal, actualTotal, varianceTotal, variancePct }
  boq.lastUpdated = new Date().toISOString()
}

function recomputeProfitMetrics(project: Project, envelope: ProjectCostEnvelope) {
  if (!envelope.draft) return
  const estimatedCost = envelope.draft.totals.estimatedTotal
  const actualCost = envelope.draft.totals.actualTotal
  const expectedProfit = project.contractValue - estimatedCost
  const actualProfit = project.contractValue - actualCost
  const erosionValue = expectedProfit - actualProfit
  const erosionPct = expectedProfit > 0 ? (erosionValue / expectedProfit) * 100 : 0
  envelope.meta.metrics = {
    expectedProfit,
    actualProfit,
    erosionValue,
    erosionPct,
    lastRecomputedAt: new Date().toISOString(),
  }
}

export const projectCostService = {
  getEnvelope(projectId: string): ProjectCostEnvelope | null {
    const all = loadAll()
    return all[projectId] ?? null
  },
  /**
   * حساب تفصيلي لتجميع عناصر التكلفة الفعلية: الأساس (مجموع صفوف التحليل بدون نسب) ثم مكونات النسب.
   * يستخرج القيم استناداً إلى النسب المخزنة داخل كل بند (actual.additionalPercentages)
   * NOTE: هذا المساعد لا يغير البيانات – فقط يحسب.
   */
  computeActualCostDecomposition(projectId: string) {
    const env = this.getEnvelope(projectId)
    if (!env?.draft)
      return { base: 0, administrative: 0, operational: 0, profit: 0, actualTotal: 0 }
    let base = 0
    let administrative = 0
    let operational = 0
    let profit = 0
    let actualTotal = 0
    for (const it of env.draft.items) {
      // إعادة اشتقاق الأساس بنفس منطق recomputeTotals (لكن دون تعديل)
      const sumRows = (rows: BreakdownRow[]) => sumBreakdownRows(rows)
      let itemBase = 0
      const side = it.actual
      if (Array.isArray(side.breakdownTables) && side.breakdownTables.length > 0) {
        for (const tbl of side.breakdownTables) {
          if (!tbl?.breakdown) continue
          itemBase +=
            sumRows(tbl.breakdown.materials) +
            sumRows(tbl.breakdown.labor) +
            sumRows(tbl.breakdown.equipment) +
            sumRows(tbl.breakdown.subcontractors)
        }
      } else if (side?.breakdown) {
        itemBase +=
          sumRows(side.breakdown.materials) +
          sumRows(side.breakdown.labor) +
          sumRows(side.breakdown.equipment) +
          sumRows(side.breakdown.subcontractors)
      }
      const adminPct = side?.additionalPercentages?.administrative ?? 0
      const opPct = side?.additionalPercentages?.operational ?? 0
      const profitPct = side?.additionalPercentages?.profit ?? 0
      const itemAdministrative = itemBase * (adminPct / 100)
      const itemOperational = itemBase * (opPct / 100)
      const itemProfit = itemBase * (profitPct / 100)
      base += itemBase
      administrative += itemAdministrative
      operational += itemOperational
      profit += itemProfit
      actualTotal += it.actual.totalPrice ?? 0 // مخزن مسبقاً بعد إعادة الحساب
    }
    return { base, administrative, operational, profit, actualTotal }
  },
  addActualBreakdownTable(
    projectId: string,
    itemId: string,
    name?: string,
  ): ActualBreakdownTable | null {
    let created: ActualBreakdownTable | null = null
    this.saveDraft(projectId, (draft) => {
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
  },
  renameActualBreakdownTable(projectId: string, itemId: string, tableId: string, newName: string) {
    this.saveDraft(projectId, (draft) => {
      const tbl = draft.items
        .find((i) => i.id === itemId)
        ?.actual.breakdownTables?.find((t) => t.id === tableId)
      if (tbl) {
        tbl.name = newName
        tbl.updatedAt = new Date().toISOString()
      }
    })
  },
  removeActualBreakdownTable(projectId: string, itemId: string, tableId: string) {
    this.saveDraft(projectId, (draft) => {
      const it = draft.items.find((i) => i.id === itemId)
      if (!it?.actual.breakdownTables) return
      it.actual.breakdownTables = it.actual.breakdownTables.filter((t) => t.id !== tableId)
    })
  },
  upsertActualBreakdownRow(
    projectId: string,
    itemId: string,
    tableId: string,
    section: keyof CostBreakdownSet,
    row: Partial<BreakdownRow> & { id?: string },
  ) {
    this.saveDraft(projectId, (draft) => {
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
  },
  /** إزالة صف فعلي (من التحليل الأحادي وليس من الجداول المتعددة) */
  removeActualBreakdownRow(
    projectId: string,
    itemId: string,
    section: keyof CostBreakdownSet,
    rowId: string,
  ) {
    this.saveDraft(projectId, (draft) => {
      const it = draft.items.find((i) => i.id === itemId)
      if (!it?.actual?.breakdown) return
      const list = it.actual.breakdown[section]
      const idx = list.findIndex((r) => r.id === rowId)
      if (idx >= 0) list.splice(idx, 1)
    })
  },

  initEnvelope(
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
      projectId,
      draft: empty,
      official: null,
      meta: {
        sourceTenderId: opts.sourceTenderId,
        importStrategy: opts.strategy ?? 'initial',
        itemStats: { total: 0, modified: 0, unmodified: 0, added: 0, removed: 0 },
      },
      version: 1,
    }
    all[projectId] = env
    saveAll(all)
    return env
  },

  saveDraft(
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
  },

  promote(projectId: string): ProjectBOQData {
    const all = loadAll()
    const env = all[projectId]
    if (!env?.draft) throw new Error('Nothing to promote')
    recomputeTotals(env.draft)
    const promoted = structuredClone(env.draft)
    promoted.status = 'official'
    env.official = promoted
    env.meta.lastPromotionAt = new Date().toISOString()
    saveAll(all)

    void (async () => {
      try {
        const projectRepository = getProjectRepository()
        const project = await projectRepository.getById(projectId)
        if (project) {
          const estimatedCost = promoted.totals.estimatedTotal
          const actualCost = promoted.totals.actualTotal
          const updated: Partial<Project> = {
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
  },

  /**
   * مزامنة القيم التقديرية (quantity / unitPrice / totalPrice / breakdown) مباشرة من BOQ التسعير
   * - الهدف: أي تعديل في صفحة التسعير ينعكس فوراً هنا دون الحاجة لإعادة الدمج اليدوي
   * - لا نلمس الجانب الفعلي
   * - نعالج أيضاً حالات خاطئة حيث unitPrice == totalPrice مع وجود quantity > 1 (نصححها إلى total/qty إذا BOQ يوفّر ذلك)
   */
  async syncEstimatedFromTender(projectId: string, tenderId?: string) {
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
        const newSum = sections.reduce(
          (sum, section) => sum + sumBreakdownRows(newBreak[section]),
          0,
        )
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
  },

  /**
   * دمج BOQ المنافسة داخل مسودة المشروع وفق قواعد:
   * - البند الموجود وغير معدل يتم تحديث بياناته التقديرية فقط
   * - البند المعدل (state.isModified) لا يُمس وتُضاف له علامة hasIncomingChange إن تغير المصدر
   * - البنود الجديدة في المنافسة تُضاف كبنود جديدة origin='imported'
   * - لا نحذف البنود غير الموجودة في المنافسة (قد تكون أضيفت يدوياً)
   */
  async mergeFromTender(projectId: string, tenderId: string) {
    this.ensureDraft(projectId)
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
        const newEstimatedTotal = pickNumber(src.estimated?.totalPrice, src.totalPrice) ?? 0
        const changed = Math.abs(newEstimatedTotal - target.estimated.totalPrice) > 0.0001

        if (!target.state.isModified) {
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
    // إطلاق حدث حتى قبل عودة القيمة لضمان تحديث أي مستمع متأخر عن التسجيل الأولي
    bus.emit(APP_EVENTS.COST_ENVELOPE_UPDATED, { projectId })
    return {
      added,
      updated,
      unchanged,
      conflicted,
      total: draft.items.length,
    }
  },

  upsertItem(projectId: string, item: Partial<ProjectCostItem> & { id?: string }): ProjectCostItem {
    this.ensureDraft(projectId)
    let updated: ProjectCostItem | null = null
    this.saveDraft(projectId, (draft) => {
      const now = new Date().toISOString()
      const isActualOnly = item.origin === 'actual-only'
      let existing = draft.items.find((i) => i.id === item.id)
      if (!existing) {
        let estimatedSide = (item as { estimated?: CostSideData }).estimated ?? createEmptySide()
        const actualSide = (item as { actual?: CostSideData }).actual ?? createEmptySide()
        if (isActualOnly) {
          if (actualSide.totalPrice && actualSide.quantity === 0 && actualSide.unitPrice === 0) {
            actualSide.quantity = 1
            actualSide.unitPrice = actualSide.totalPrice
          }
          estimatedSide = createEmptySide()
        }
        const generatedId = `pci_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        const newId = toNonEmptyString(item.id) ?? generatedId
        const description = toNonEmptyString(item.description) ?? 'بند بدون وصف'
        existing = {
          id: newId,
          originalId: item.originalId,
          description,
          unit: item.unit,
          category: item.category,
          estimated: estimatedSide,
          actual: actualSide,
          procurement: { committed: 0, allocated: 0, links: [] },
          variance: { value: 0, pct: 0 },
          state: { isModified: false, isNew: true, lastEditAt: now },
          origin: item.origin ?? 'manual',
        }
        draft.items.push(existing)
      } else {
        if (item.description !== undefined) existing.description = item.description
        if (item.unit !== undefined) existing.unit = item.unit
        if (item.category !== undefined) existing.category = item.category
        if ((item as { estimated?: CostSideData }).estimated)
          existing.estimated = (item as { estimated?: CostSideData }).estimated!
        if ((item as { actual?: CostSideData }).actual)
          existing.actual = (item as { actual?: CostSideData }).actual!
        existing.state.isModified = true
        existing.state.lastEditAt = now
      }
      updated = existing
    })
    if (!updated) throw new Error('Failed to upsert cost item')
    return updated
  },

  /**
   * ربط أمر شراء (أو حركة مصروف) ببند تكلفة (على مستوى البند الأساسي أو breakdown row)
   * - يقوم بتحديث committed و allocated إذا كان allocationAmount محدداً
   * - يحافظ على سجل الروابط في item.procurement.links
   * - allocationMode يسمح لاحقاً بآليات توزيع مختلفة
   */
  allocatePurchaseToItem(params: {
    projectId: string
    costItemId: string
    purchaseOrderId: string
    allocationAmount: number
    breakdownItemId?: string
    allocationMode?: 'manual' | 'proportional'
  }) {
    this.ensureDraft(params.projectId)
    let targetItem: ProjectCostItem | null = null
    this.saveDraft(params.projectId, (draft) => {
      const item = draft.items.find((i) => i.id === params.costItemId)
      if (!item) {
        throw new Error('Cost item not found')
      }
      const now = new Date().toISOString()
      const link = item.procurement.links.find(
        (l) =>
          l.purchaseOrderId === params.purchaseOrderId &&
          l.breakdownItemId === params.breakdownItemId,
      )
      if (link) {
        link.amount += params.allocationAmount
        link.lastSync = now
        if (params.allocationMode) link.allocationMode = params.allocationMode
      } else {
        item.procurement.links.push({
          purchaseOrderId: params.purchaseOrderId,
          amount: params.allocationAmount,
          breakdownItemId: params.breakdownItemId,
          lastSync: now,
          allocationMode: params.allocationMode ?? 'manual',
        })
      }
      item.procurement.committed += params.allocationAmount
      item.procurement.allocated += params.allocationAmount
      item.state.isModified = true
      item.state.lastEditAt = now
      targetItem = item
    })
    const ensuredTargetItem = ensureProjectCostItem(
      targetItem,
      'Allocation did not update target item',
    )
    bus.emit(APP_EVENTS.PURCHASE_ALLOCATED_TO_COST, {
      projectId: params.projectId,
      costItemId: ensuredTargetItem.id,
    })
    return ensuredTargetItem
  },

  /**
   * فتح نافذة المصروف من واجهة التكلفة لبند محدد (لا يغير البيانات، فقط يصدر حدثاً يستخدمه UI)
   */
  openExpenseModal(projectId: string, costItemId: string, breakdownItemId?: string) {
    bus.emit(APP_EVENTS.OPEN_EXPENSE_MODAL, { projectId, costItemId, breakdownItemId })
  },

  ensureDraft(projectId: string) {
    const all = loadAll()
    if (!all[projectId]) {
      this.initEnvelope(projectId, {})
    } else if (!all[projectId].draft) {
      // clone official if exists
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
  },
}
