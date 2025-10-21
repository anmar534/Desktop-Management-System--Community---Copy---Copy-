/**
 * Pricing Data Sync Service (Snapshot-Free)
 * مسؤول فقط عن:
 *  - استقبال تحديثات التسعير (pricingDataUpdated)
 *  - كتابة / تحديث BOQ المركزي
 *  - حساب / تحديث حالة المنافسة (completion, status, totals)
 *  - بث أحداث BOQ_UPDATED و TENDER_UPDATED للمكونات الأخرى
 *
 * تمت إزالة كل من:
 *  - التخزين / القراءة من snapshot
 *  - الحسابات المزدوجة و dual write
 *  - أي حدث pricingSnapshotUpdated
 */

import { pricingService } from './pricingService'
import { APP_EVENTS, emit } from '@/events/bus'
import { getTenderRepository, getBOQRepository } from '@/application/services/serviceRegistry'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import type { BreakdownRow, PercentagesSet } from './projectCostService'
import type { PricingBreakdown, PricingData, PricingRow, PricingPercentages } from '@/types/pricing'

type BreakdownRowInput = Partial<BreakdownRow> & { id?: string }

interface QuantityItem {
  id: string
  description?: string
  unit?: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
  materials?: BreakdownRowInput[]
  labor?: BreakdownRowInput[]
  equipment?: BreakdownRowInput[]
  subcontractors?: BreakdownRowInput[]
  breakdown?: PercentagesSet
  additionalPercentages?: PercentagesSet
}

interface PricingUpdateDetail {
  tenderId?: string
  quantityTable: QuantityItem[]
  source?: string
}

interface StoredTechnicalFile {
  tenderId?: string
}

type PricingEntry = [string, PricingData & Record<string, unknown>]

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return undefined
}

const toStringOrUndefined = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeBreakdownRows = (input: unknown): BreakdownRowInput[] => {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map(row => {
      if (!isRecord(row)) {
        return null
      }

      const id = toStringOrUndefined(row.id)
      const name = toStringOrUndefined(row.name ?? row.description)
      const unit = toStringOrUndefined(row.unit)
      const quantity = toFiniteNumber(row.quantity)
      const unitCost = toFiniteNumber(row.unitCost ?? row.price)
      const totalCost = toFiniteNumber(row.totalCost ?? row.total)
      const origin = toStringOrUndefined(row.origin)
      const procurementLinks = Array.isArray(row.procurementLinks)
        ? row.procurementLinks.filter((link): link is string => typeof link === 'string')
        : undefined

      const normalized: BreakdownRowInput = {
        ...(id ? { id } : {}),
        ...(name ? { name } : {}),
        ...(unit ? { unit } : {}),
        ...(quantity !== undefined ? { quantity } : {}),
        ...(unitCost !== undefined ? { unitCost } : {}),
        ...(totalCost !== undefined ? { totalCost } : {}),
        ...(origin === 'estimated' || origin === 'actual-only' ? { origin } : {}),
        ...(procurementLinks ? { procurementLinks } : {})
      }

      return Object.keys(normalized).length > 0 ? normalized : null
    })
    .filter((row): row is BreakdownRowInput => row !== null)
}

const cloneBreakdownRows = (rows?: BreakdownRowInput[]): BreakdownRowInput[] =>
  rows?.map(row => ({ ...row })) ?? []

const isPricingRow = (value: unknown): value is PricingRow => {
  if (!isRecord(value)) {
    return false
  }

  const id = value.id
  const total = value.total
  const quantity = value.quantity

  return typeof id === 'string' && toFiniteNumber(total) !== undefined && toFiniteNumber(quantity) !== undefined
}

const toPricingRows = (input: unknown): PricingRow[] => {
  if (!Array.isArray(input)) {
    return []
  }

  return input.filter(isPricingRow).map(row => row as PricingRow)
}

const normalizePercentages = (input: unknown): PercentagesSet | undefined => {
  if (!isRecord(input)) {
    return undefined
  }

  const result: PercentagesSet = {}
  const administrative = toFiniteNumber(input.administrative)
  const operational = toFiniteNumber(input.operational)
  const profit = toFiniteNumber(input.profit)

  if (administrative !== undefined) {
    result.administrative = administrative
  }
  if (operational !== undefined) {
    result.operational = operational
  }
  if (profit !== undefined) {
    result.profit = profit
  }

  if ('other' in input && isRecord(input.other)) {
    const otherEntries = Object.entries(input.other).reduce<Record<string, number>>((acc, [key, value]) => {
      const numericValue = toFiniteNumber(value)
      if (numericValue !== undefined) {
        acc[key] = numericValue
      }
      return acc
    }, {})

    if (Object.keys(otherEntries).length > 0) {
      result.other = otherEntries
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const normalizeQuantityItem = (input: unknown): QuantityItem | null => {
  if (!isRecord(input)) {
    return null
  }

  const id = toStringOrUndefined(input.id)
  if (!id) {
    return null
  }

  return {
    id,
    description: toStringOrUndefined(input.description),
    unit: toStringOrUndefined(input.unit),
    quantity: toFiniteNumber(input.quantity),
    unitPrice: toFiniteNumber(input.unitPrice),
    totalPrice: toFiniteNumber(input.totalPrice),
    materials: normalizeBreakdownRows(input.materials),
    labor: normalizeBreakdownRows(input.labor),
    equipment: normalizeBreakdownRows(input.equipment),
    subcontractors: normalizeBreakdownRows(input.subcontractors),
    breakdown: normalizePercentages(input.breakdown),
    additionalPercentages: normalizePercentages(input.additionalPercentages)
  }
}

const normalizePricingUpdateDetail = (detail: unknown): PricingUpdateDetail => {
  if (!isRecord(detail)) {
    return { quantityTable: [] }
  }

  const quantityTable = Array.isArray(detail.quantityTable)
    ? detail.quantityTable
        .map(normalizeQuantityItem)
        .filter((item): item is QuantityItem => item !== null)
    : []

  return {
    tenderId: toStringOrUndefined(detail.tenderId),
    quantityTable,
    source: toStringOrUndefined(detail.source)
  }
}

const pricingRowToBreakdownRow = (row: PricingRow, origin: BreakdownRow['origin'] = 'estimated'): BreakdownRowInput => {
  const quantity = toFiniteNumber(row.quantity) ?? 0
  const unitCost = toFiniteNumber(row.price) ?? (quantity > 0 ? (toFiniteNumber(row.total) ?? 0) / quantity : 0)
  const totalCost = toFiniteNumber(row.total) ?? quantity * unitCost

  return {
    id: row.id,
    name: row.description,
    quantity,
    unitCost,
    totalCost,
    origin
  }
}

const pricingPercentagesToSet = (percentages?: PricingPercentages): PercentagesSet | undefined => {
  if (!percentages) {
    return undefined
  }

  return {
    administrative: percentages.administrative,
    operational: percentages.operational,
    profit: percentages.profit
  }
}

const pricingBreakdownToSet = (breakdown?: PricingBreakdown): PercentagesSet | undefined => {
  if (!breakdown) {
    return undefined
  }

  return {
    administrative: breakdown.administrative,
    operational: breakdown.operational,
    profit: breakdown.profit
  }
}

const mapPricingEntryToQuantityItem = ([id, data]: PricingEntry): QuantityItem | null => {
  if (!id || typeof id !== 'string') {
    return null
  }

  const description = toStringOrUndefined(data.description)
  const unit = toStringOrUndefined(data.unit)
  const quantity = toFiniteNumber(data.quantity)
  const unitPrice = toFiniteNumber(data.unitPrice)
  const totalPrice = toFiniteNumber(data.totalPrice)

  const materials = toPricingRows(data.materials).map(row => pricingRowToBreakdownRow(row))
  const labor = toPricingRows(data.labor).map(row => pricingRowToBreakdownRow(row))
  const equipment = toPricingRows(data.equipment).map(row => pricingRowToBreakdownRow(row))
  const subcontractors = toPricingRows(data.subcontractors).map(row => pricingRowToBreakdownRow(row))

  const breakdownPercentages = pricingBreakdownToSet(data.breakdown as PricingBreakdown | undefined)
  const additionalPercentages = pricingPercentagesToSet(data.additionalPercentages as PricingPercentages | undefined)

  return {
    id,
    description,
    unit,
    quantity,
    unitPrice,
    totalPrice,
    materials,
    labor,
    equipment,
    subcontractors,
    breakdown: breakdownPercentages,
    additionalPercentages
  }
}

const toPricingEntries = (pricing: unknown): PricingEntry[] => {
  if (Array.isArray(pricing)) {
    return pricing
      .map(entry => {
        if (!Array.isArray(entry) || entry.length < 2) {
          return null
        }
        const [id, value] = entry
        if (typeof id !== 'string' || !isRecord(value)) {
          return null
        }
        return [id, value as PricingData & Record<string, unknown>]
      })
      .filter((entry): entry is PricingEntry => entry !== null)
  }

  if (pricing instanceof Map) {
    return Array.from(pricing.entries()) as PricingEntry[]
  }

  return []
}

export class PricingDataSyncService {
  private static instance: PricingDataSyncService
  private syncInProgress = new Set<string>()

  private constructor() {
    this.setupEventListeners()
  }

  public static getInstance(): PricingDataSyncService {
    if (!PricingDataSyncService.instance) {
      PricingDataSyncService.instance = new PricingDataSyncService()
    }
    return PricingDataSyncService.instance
  }

  private setupEventListeners() {
    window.addEventListener('pricingDataUpdated', this.handlePricingUpdate as EventListener)
  }

  private handlePricingUpdate = async (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail
    const { tenderId, quantityTable, source } = normalizePricingUpdateDetail(detail)
    if (!tenderId) return
    if (this.syncInProgress.has(tenderId)) return

    this.syncInProgress.add(tenderId)
    try {
      console.log('🔄 [PricingSync] تحديث تسعير مستلم', { tenderId, source, count: quantityTable.length })

      await this.updateCentralBOQ(tenderId, quantityTable)
      await this.updateTenderStatus(tenderId, quantityTable)
      this.notifyComponents(tenderId, 'pricing-updated')
    } catch (err) {
      console.error('❌ [PricingSync] فشل المزامنة', err)
    } finally {
      this.syncInProgress.delete(tenderId)
    }
  }

  private async updateCentralBOQ(tenderId: string, quantityTable: QuantityItem[]) {
    try {
      const boqItems = quantityTable.map(item => {
        const quantity = item.quantity ?? 0
        const unitPrice = item.unitPrice ?? 0
        const totalPrice = item.totalPrice ?? quantity * unitPrice
        const breakdownPercentages = item.breakdown ?? item.additionalPercentages
        const administrative = breakdownPercentages?.administrative ?? item.additionalPercentages?.administrative ?? 0
        const operational = breakdownPercentages?.operational ?? item.additionalPercentages?.operational ?? 0
        const profit = breakdownPercentages?.profit ?? item.additionalPercentages?.profit ?? 0

        return {
          id: item.id,
          description: item.description ?? 'بدون وصف',
          unit: item.unit ?? 'وحدة',
          category: 'BOQ',
          quantity,
          unitPrice,
          totalPrice,
          materials: cloneBreakdownRows(item.materials),
          labor: cloneBreakdownRows(item.labor),
          equipment: cloneBreakdownRows(item.equipment),
          subcontractors: cloneBreakdownRows(item.subcontractors),
          breakdown: breakdownPercentages ?? {},
          estimated: {
            quantity,
            unitPrice,
            totalPrice,
            materials: cloneBreakdownRows(item.materials),
            labor: cloneBreakdownRows(item.labor),
            equipment: cloneBreakdownRows(item.equipment),
            subcontractors: cloneBreakdownRows(item.subcontractors),
            additionalPercentages: {
              administrative,
              operational,
              profit
            }
          }
        }
      })

      const totalValue = boqItems.reduce((s, i) => s + (i.totalPrice ?? 0), 0)
      const repository = getBOQRepository()
      const savedBoq = await repository.createOrUpdate({
        id: `boq_tender_${tenderId}`,
        tenderId,
        items: boqItems,
        totalValue,
        lastUpdated: new Date().toISOString()
      })
      emit(APP_EVENTS.BOQ_UPDATED, { tenderId, id: savedBoq.id, source: 'pricing-sync' })
    } catch (e) {
      console.warn('⚠️ [PricingSync] فشل تحديث BOQ', e)
    }
  }

  private async updateTenderStatus(tenderId: string, quantityTable: QuantityItem[]) {
    try {
      const tenderRepository = getTenderRepository()
      const tender = await tenderRepository.getById(tenderId)
      if (!tender) return
      const totalItems = quantityTable.length
      const pricedItems = quantityTable.filter(item => (item.unitPrice ?? 0) > 0 && (item.totalPrice ?? 0) > 0).length
      const completion = totalItems ? (pricedItems / totalItems) * 100 : 0
      const totalValue = quantityTable.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0)

      let newStatus = tender.status
      if (completion > 0 && tender.status === 'new') newStatus = 'under_action'
      if (completion === 100 && tender.status !== 'submitted') {
        const ready = this.checkTechnicalFiles(tenderId)
        newStatus = ready ? 'ready_to_submit' : 'under_action'
      }

      await tenderRepository.update(tenderId, {
        completionPercentage: Math.round(completion * 100) / 100,
        totalValue,
        pricedItems,
        totalItems,
        status: newStatus,
        lastUpdate: new Date().toISOString()
      })
      emit(APP_EVENTS.TENDER_UPDATED, { tenderId, source: 'pricing-sync', status: newStatus })
    } catch (e) {
      console.warn('⚠️ [PricingSync] فشل تحديث حالة المنافسة', e)
    }
  }

  private checkTechnicalFiles(tenderId: string): boolean {
    try {
      const allFiles = safeLocalStorage.getItem<StoredTechnicalFile[]>('tender_technical_files', [])
      return allFiles.some(file => file?.tenderId === tenderId)
    } catch {
      return false
    }
  }

  private notifyComponents(tenderId: string, type: string) {
    emit(APP_EVENTS.TENDER_UPDATED, { tenderId, type })
    emit(APP_EVENTS.BOQ_UPDATED, { tenderId, type })
    window.dispatchEvent(new CustomEvent('tenderDataSynced', { detail: { tenderId, type, ts: Date.now() } }))
  }

  public clearSyncStateForTesting(): void {
    this.syncInProgress.clear()
  }

  public async processPricingUpdateForTesting(detail: unknown): Promise<void> {
    await this.handlePricingUpdate(new CustomEvent('pricingDataUpdated', { detail }))
  }

  public async forceSyncTender(tenderId: string): Promise<boolean> {
    if (this.syncInProgress.has(tenderId)) return false
    try {
      const pricingData = await pricingService.loadTenderPricing(tenderId)
      if (!pricingData?.pricing) return false

      const quantityTable = toPricingEntries(pricingData.pricing)
        .map(mapPricingEntryToQuantityItem)
        .filter((item): item is QuantityItem => item !== null)

      if (quantityTable.length === 0) {
        return false
      }

      await this.handlePricingUpdate(
        new CustomEvent('pricingDataUpdated', {
          detail: { tenderId, quantityTable, source: 'manual-sync' }
        })
      )
      return true
    } catch (e) {
      console.error('❌ [PricingSync] فشل forceSyncTender', e)
      return false
    }
  }

  public async getSyncStatus(tenderId: string) {
    const repository = getBOQRepository()
    const existing = await repository.getByTenderId(tenderId)
    return {
      isInProgress: this.syncInProgress.has(tenderId),
      hasBOQ: !!existing
    }
  }
}

export const pricingDataSyncService = PricingDataSyncService.getInstance()

