// TenderDetails Types
// Centralized type definitions for TenderDetails components

export interface TenderDetailsProps {
  tender: any
  onBack: () => void
}

export type CollapsedSections = Record<
  string,
  {
    materials?: boolean
    labor?: boolean
    equipment?: boolean
    subcontractors?: boolean
  }
>

export type TabValue = 'general' | 'quantity' | 'attachments' | 'timeline' | 'workflow'

export interface QuantityItem {
  id: string
  itemNumber: string
  description: string
  unit: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
  specifications?: string
  canonicalDescription?: string
  rawDescription?: string
  fullDescription?: string
  estimated?: any
}

export interface TenderAttachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  data?: any
  uploadedAt?: string
}

export interface PricingData {
  materials: MaterialRow[]
  labor: LaborRow[]
  equipment: EquipmentRow[]
  subcontractors: SubcontractorRow[]
  technicalNotes?: string
  additionalPercentages?: {
    administrative: number
    operational: number
    profit: number
  }
  completed?: boolean
}

export interface MaterialRow {
  id: string
  description: string
  unit: string
  quantity: number
  price: number
  total: number
  name?: string
  hasWaste?: boolean
  wastePercentage?: number
}

export interface LaborRow {
  id: string
  description: string
  unit: string
  quantity: number
  price: number
  total: number
}

export interface EquipmentRow {
  id: string
  description: string
  unit: string
  quantity: number
  price: number
  total: number
}

export interface SubcontractorRow {
  id: string
  description: string
  unit: string
  quantity: number
  price: number
  total: number
}
