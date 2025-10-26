/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BOQBreakdown {
  materials?: any[]
  labor?: any[]
  equipment?: any[]
  subcontractors?: any[]
  additionalPercentages?: {
    administrative?: number
    operational?: number
    profit?: number
  }
}

export interface BOQItemValues extends BOQBreakdown {
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface BOQItem {
  id: string
  originalId?: string
  description: string
  canonicalDescription?: string
  unit?: string
  category?: string
  estimated?: BOQItemValues
  actual?: BOQItemValues
  quantity?: number
  unitPrice?: number
  totalPrice?: number
  actualQuantity?: number
  actualUnitPrice?: number
  materials?: any[]
  labor?: any[]
  equipment?: any[]
  subcontractors?: any[]
  [key: string]: any
}

export interface BOQTotals {
  totalValue: number
  baseSubtotal: number
  vatRate: number
  vatAmount: number
  totalWithVat: number
  profit: number
  administrative: number
  operational: number
  adminOperational: number
  profitPercentage: number
  adminOperationalPercentage: number
  administrativePercentage?: number
  operationalPercentage?: number
}

export interface BOQData {
  id: string
  tenderId?: string
  projectId?: string
  items: BOQItem[]
  totalValue: number
  totals?: BOQTotals | null
  lastUpdated: string
  [key: string]: any
}
