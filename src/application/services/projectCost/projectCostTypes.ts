/**
 * Project Cost & BOQ Type Definitions
 * All interfaces and types used in the project cost management system
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

/**
 * جدول تحليل فعلي منفصل (للسماح بعدة جداول لكل بند)
 */
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
}

export interface ProjectBOQData {
  id: string
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
  notes?: string
}

export interface ProjectCostEnvelope {
  draft?: ProjectBOQData
  official?: ProjectBOQData
  meta: ProjectBOQEnvelopeMeta
}

export type StoredEnvelopesIndex = Record<string, ProjectCostEnvelope>
