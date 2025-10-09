// Unified domain model definitions used by pricing services and repositories.

export interface BoQBaseItem {
  id: string;
  boqBaseId: string;
  lineNo: string;
  description: string;
  unit: string;
  quantity: number;
  category?: string | null;
  spec?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoQBase {
  id: string;
  tenderId: string;
  title: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createBoQBase(params: Omit<BoQBase, 'createdAt' | 'updatedAt'>): BoQBase {
  const now = new Date().toISOString();
  return { ...params, createdAt: now, updatedAt: now };
}

export function updateBoQBaseTimestamp(base: BoQBase): BoQBase {
  return { ...base, updatedAt: new Date().toISOString() };
}

export interface CostBreakdown {
  materialsCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractCost: number;
  adminCost: number;
  operationalCost: number;
  profitCost: number;
  subtotalCost: number;
}

export interface BoQPricedItem extends CostBreakdown {
  id: string;
  boqPricedId: string;
  baseItemId: string;
  lineNo: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  breakdownJson?: Record<string, unknown> | null;
  isPriced: boolean;
  createdAt: string;
}

export interface PricingTotals {
  totalValue: number;
  vatAmount: number;
  totalWithVat: number;
  profitTotal: number;
  adminTotal: number;
  operationalTotal: number;
  profitPct: number;
  adminOperationalPct: number;
}

export type PricingStatus = 'draft' | 'partial' | 'completed' | 'approved';

export interface BoQPriced {
  id: string;
  boqBaseId: string;
  version: number;
  status: PricingStatus;
  currency: string;
  vatRate: number;
  totals?: PricingTotals;
  createdAt: string;
  createdBy: string;
  finalizedAt?: string;
  sourceSnapshotId?: string;
}

export function createPricedBoQ(params: Omit<BoQPriced, 'createdAt'> & { createdAt?: string }): BoQPriced {
  return { ...params, createdAt: params.createdAt ?? new Date().toISOString() };
}

export interface SnapshotMeta {
  engineVersion: string;
  defaults?: Record<string, unknown>;
  notes?: string;
  approval?: { approvedBy: string; date: string };
  [k: string]: unknown;
}

export interface Snapshot {
  id: string;
  boqPricedId: string;
  snapshotVersion: number;
  integrityHash: string;
  totalsHash: string;
  configHash?: string;
  meta: SnapshotMeta;
  createdAt: string;
  createdBy: string;
}

export function createSnapshot(params: Omit<Snapshot, 'createdAt'> & { createdAt?: string }): Snapshot {
  return { ...params, createdAt: params.createdAt ?? new Date().toISOString() };
}

export interface BoQBaseRepository {
  getById(id: string): Promise<BoQBase | null>;
  listByTender(tenderId: string): Promise<BoQBase[]>;
  create(base: BoQBase): Promise<void>;
  createItems(baseId: string, items: BoQBaseItem[]): Promise<void>;
  listItems(baseId: string): Promise<BoQBaseItem[]>;
}

export interface BoQPricedRepository {
  create(priced: BoQPriced): Promise<void>;
  update(priced: BoQPriced): Promise<void>;
  getById(id: string): Promise<BoQPriced | null>;
  getLatestByBase(baseId: string): Promise<BoQPriced | null>;
  getVersion(baseId: string, version: number): Promise<BoQPriced | null>;
  listVersions(baseId: string): Promise<BoQPriced[]>;
}

export interface PricedItemRepository {
  replaceAll(pricedId: string, items: BoQPricedItem[]): Promise<void>;
  list(pricedId: string): Promise<BoQPricedItem[]>;
  listByIds(pricedId: string, ids: string[]): Promise<BoQPricedItem[]>;
}
