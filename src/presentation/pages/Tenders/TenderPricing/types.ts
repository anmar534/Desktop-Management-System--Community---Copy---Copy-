import type { Tender } from '@/data/centralData'
import type {
  PricingBreakdown,
  PricingPercentages,
  PricingViewItem,
  MaterialRow,
  LaborRow,
  EquipmentRow,
  SubcontractorRow,
} from '@/shared/types/pricing'

// ==== Pricing Section Types ====

export type PricingSection = 'materials' | 'labor' | 'equipment' | 'subcontractors' | 'all'
export type ActualPricingSection = Exclude<PricingSection, 'all'>

export interface SectionRowMap {
  materials: MaterialRow
  labor: LaborRow
  equipment: EquipmentRow
  subcontractors: SubcontractorRow
}

// ==== View Types ====

export type PricingViewName = 'summary' | 'pricing' | 'technical'

export const isPricingViewName = (value: string): value is PricingViewName =>
  value === 'summary' || value === 'pricing' || value === 'technical'

export interface QuantityItem {
  id: string
  itemNumber: string
  description: string
  unit: string
  quantity: number
  specifications?: string
  canonicalDescription?: string
  fullDescription?: string
  rawDescription?: string
  multiLineDescription?: string
  detailedDescription?: string
  longDescription?: string
  englishDescription?: string
  arabicDescription?: string
  [key: string]: unknown
}

export type DraftPricingItem = Pick<
  PricingViewItem,
  'id' | 'description' | 'unit' | 'quantity' | 'unitPrice' | 'totalPrice'
> & {
  breakdown?: PricingBreakdown
}

export interface PricingTotals {
  materials: number
  labor: number
  equipment: number
  subcontractors: number
  subtotal: number
  administrative: number
  operational: number
  profit: number
  total: number
}

export type PricingProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface PersistedBreakdown {
  materials: number
  labor: number
  equipment: number
  subcontractors: number
  administrative: number
  operational: number
  profit: number
}

export interface PersistedBOQItem extends Record<string, unknown> {
  id: string
  description: string
  canonicalDescription: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: 'BOQ'
  breakdown: PersistedBreakdown
  estimated: {
    quantity: number
    unitPrice: number
    totalPrice: number
    materials: MaterialRow[]
    labor: LaborRow[]
    equipment: EquipmentRow[]
    subcontractors: SubcontractorRow[]
    additionalPercentages: PricingPercentages
  }
}

export interface PricingStatusSnapshot {
  status: Tender['status']
  progress: number
  totalValue: number
}

export interface StoredTechnicalFile extends Record<string, unknown> {
  tenderId?: string
}

export interface TenderStatsPayload {
  totalItems: number
  pricedItems: number
  completionPercentage: number
  totalValue: number
  averageUnitPrice: number
  lastUpdated: string
}

export type TenderStatsRecord = Record<string, TenderStatsPayload>

export interface TenderAttachment {
  type?: string
  name?: string
  data?: unknown
}

export type TenderWithPricingSources = Tender & {
  quantityTable?: QuantityItem[]
  quantities?: QuantityItem[]
  items?: QuantityItem[]
  boqItems?: QuantityItem[]
  quantityItems?: QuantityItem[]
  scope?: { items?: QuantityItem[] } | string | null
  attachments?: TenderAttachment[]
  pricingStatus?: PricingProgressStatus
  completionPercentage?: number
  totalValue?: number
  itemsPriced?: number
  totalItems?: number
  technicalFilesUploaded?: boolean
  lastUpdated?: string
}
