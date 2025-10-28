/**
 * Project Cost Service
 * Main service coordinating all project cost and BOQ operations
 * Delegates to specialized services for specific responsibilities
 */

import { APP_EVENTS, bus } from '@/events/bus'
import type { CostSideData, ProjectCostItem } from './projectCost/projectCostTypes'

// Re-export types
export * from './projectCost/projectCostTypes'

// Import specialized services
import { getEnvelope } from './projectCost/projectCostStorage'
import {
  initEnvelope,
  ensureDraft,
  saveDraft,
  promote,
  addActualBreakdownTable,
  renameActualBreakdownTable,
  removeActualBreakdownTable,
  upsertActualBreakdownRow,
  removeActualBreakdownRow,
  computeActualCostDecomposition,
} from './projectCost/projectCostDraft'
import { syncEstimatedFromTender, mergeFromTender } from './projectCost/projectCostTenderSync'

// ============================================================================
// Helper Functions
// ============================================================================

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
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

const ensureProjectCostItem = (
  item: ProjectCostItem | null,
  errorMessage: string,
): ProjectCostItem => {
  if (!item) {
    throw new Error(errorMessage)
  }
  return item
}

// ============================================================================
// Main Service Object
// ============================================================================

export const projectCostService = {
  // Storage operations
  getEnvelope,

  // Draft management
  initEnvelope,
  ensureDraft,
  saveDraft,
  promote,

  // Tender sync operations
  syncEstimatedFromTender,
  mergeFromTender,

  // Breakdown table management
  addActualBreakdownTable,
  renameActualBreakdownTable,
  removeActualBreakdownTable,
  upsertActualBreakdownRow,
  removeActualBreakdownRow,
  computeActualCostDecomposition,

  /**
   * Upsert (insert or update) a cost item in the draft
   */
  upsertItem(projectId: string, item: Partial<ProjectCostItem> & { id: string }): ProjectCostItem {
    this.ensureDraft(projectId)
    let updated: ProjectCostItem | null = null

    this.saveDraft(projectId, (draft) => {
      let existing = draft.items.find((i) => i.id === item.id)
      const now = new Date().toISOString()

      if (!existing) {
        // Create new item
        const estimatedSide: CostSideData =
          (item as { estimated?: CostSideData }).estimated ?? createEmptySide()
        const actualSide: CostSideData =
          (item as { actual?: CostSideData }).actual ?? createEmptySide()

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
        // Update existing item
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
   * Allocate a purchase order to a cost item
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
   * Open expense modal for a specific cost item (emits event for UI)
   */
  openExpenseModal(projectId: string, costItemId: string, breakdownItemId?: string) {
    bus.emit(APP_EVENTS.OPEN_EXPENSE_MODAL, { projectId, costItemId, breakdownItemId })
  },
}
