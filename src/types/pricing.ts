export type ExecutionMethod = 'ذاتي' | 'مقاول باطن' | 'مختلط';

export interface PricingRow {
  id: string;
  description?: string;
  unit?: string;
  quantity: number;
  price?: number;
  total: number;
}

export interface MaterialRow extends PricingRow {
  name?: string;
  hasWaste?: boolean;
  wastePercentage?: number;
}

export type LaborRow = PricingRow;
export type EquipmentRow = PricingRow;
export type SubcontractorRow = PricingRow;

export interface PricingPercentages {
  administrative: number;
  operational: number;
  profit: number;
}

export interface PricingBreakdown {
  materials: number;
  labor: number;
  equipment: number;
  subcontractors: number;
  administrative: number;
  operational: number;
  profit: number;
  subtotal?: number;
  total?: number;
}

export interface PricingViewItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isPriced?: boolean;
  breakdown?: PricingBreakdown;
  materials?: MaterialRow[];
  labor?: LaborRow[];
  equipment?: EquipmentRow[];
  subcontractors?: SubcontractorRow[];
}

export interface PricingData {
  executionMethod?: ExecutionMethod;
  materials: MaterialRow[];
  labor: LaborRow[];
  equipment: EquipmentRow[];
  subcontractors: SubcontractorRow[];
  additionalPercentages: PricingPercentages;
  finalPrice?: number;
  totalValue?: number;
  technicalNotes: string;
  completed?: boolean;
  [key: string]: unknown;
}

export interface PricingSnapshotEntry {
  id: string;
  description: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  breakdown?: PricingBreakdown;
}

export interface PricingSnapshot {
  tenderId: string;
  timestamp: string;
  items: PricingSnapshotEntry[];
  totals: {
    totalValue: number;
    baseSubtotal: number;
    vatRate: number;
    vatAmount: number;
    totalWithVat: number;
    profit: number;
    administrative: number;
    operational: number;
    adminOperational: number;
    profitPercentage: number;
    adminOperationalPercentage: number;
    administrativePercentage: number;
    operationalPercentage: number;
  };
}

export interface TenderBackupEntry {
  id: string;
  tenderId: string;
  timestamp: string;
  tenderTitle: string;
  completionPercentage: number;
  totalValue: number;
  itemsTotal: number;
  itemsPriced: number;
  dataset: string;
  retentionKey: string;
  retentionExpiresAt?: string;
  version: string;
}
