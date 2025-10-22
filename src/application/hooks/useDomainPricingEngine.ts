import { useEffect, useState, useMemo } from 'react';
import { PricingEngine } from '@/domain/services/pricingEngine';
import { PRICING_FLAGS } from '@/shared/utils/pricing/pricingHelpers';
import { pricingRuntime } from '@/domain/monitoring/pricingRuntimeMonitor';
import type { BoQBaseItem } from '@/domain/model';

export interface RawAuthoringEntry {
  id: string;
  materials?: { total?: number }[];
  labor?: { total?: number }[];
  equipment?: { total?: number }[];
  subcontractors?: { total?: number }[];
  additionalPercentages?: {
    administrative?: number;
    operational?: number;
    profit?: number;
  };
  quantity?: number;
  description?: string;
  unit?: string;
}

export interface DomainPricingBreakdown {
  materials: number;
  labor: number;
  equipment: number;
  subcontractors: number;
  administrative: number;
  operational: number;
  profit: number;
  subtotal: number;
  total: number;
}

export interface DomainPricingItem {
  id: string;
  itemNumber?: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isPriced: boolean;
  materials: RawAuthoringEntry['materials'];
  labor: RawAuthoringEntry['labor'];
  equipment: RawAuthoringEntry['equipment'];
  subcontractors: RawAuthoringEntry['subcontractors'];
  breakdown: DomainPricingBreakdown;
}

export interface UseDomainPricingEngineParams<TEntry extends RawAuthoringEntry = RawAuthoringEntry> {
  tenderId: string | undefined;
  quantityItems: { id: string; itemNumber?: string; description: string; unit: string; quantity: number }[];
  pricingMap: Map<string, TEntry>; // map from TenderPricingProcess (raw authoring state)
  defaults: { administrative: number; operational: number; profit: number };
}

export interface UseDomainPricingEngineResult {
  enabled: boolean;
  items: DomainPricingItem[]; // enriched items shaped close to legacyAuthoringCompute return for drop-in rendering
  totals: { totalValue: number } | null;
  status: 'idle' | 'ready';
}

// Lightweight UI-only hook bridging legacy authoring state to domain pricing engine structures.
// Phase 2.5: Read path only. Does NOT persist yet (dual-write will come later).
export function transformAuthoringToDomainUIItems<TEntry extends RawAuthoringEntry>(options: { tenderId: string; quantityItems: UseDomainPricingEngineParams<TEntry>['quantityItems']; pricingMap: Map<string, TEntry>; defaults: { administrative: number; operational: number; profit: number }; }): { items: DomainPricingItem[]; totalValue: number } {
  const { tenderId, quantityItems, pricingMap, defaults } = options;
  const engine = new PricingEngine({
    vatRate: 0,
    profitPct: defaults.profit / 100,
    adminPct: defaults.administrative / 100,
    operationalPct: defaults.operational / 100,
  });
  const now = new Date().toISOString();
  const baseItems: BoQBaseItem[] = quantityItems.map((q, idx) => ({
    id: q.id,
    boqBaseId: `${tenderId}:base`,
  lineNo: q.itemNumber ?? String(idx + 1),
    description: q.description,
    unit: q.unit || 'وحدة',
    quantity: q.quantity || 0,
    category: null,
    spec: null,
    sortOrder: idx,
    createdAt: now,
    updatedAt: now,
  }));
  // (Semantics A) القيم في pricingMap هي مجاميع خط كاملة (line totals) للفئات الأساسية (المواد، العمالة ...)
  // أي أنها تتضمن بالفعل (resourceQty * resourceUnitPrice) مجمعة. نحسب Overheads مرة واحدة على BaseCost
  // ولا نضرب أي شيء في quantity ثانية. المحرك سيحسب unitPrice = totalLineCost / quantity.
  const componentInputs = Array.from(pricingMap.entries()).map(([id, data]) => {
    const d = data;
    const sum = (arr?: { total?: number }[]) => (arr ?? []).reduce((s, r) => s + (r.total ?? 0), 0);
    const materialsSubtotal = sum(d.materials);
    const laborSubtotal = sum(d.labor);
    const equipmentSubtotal = sum(d.equipment);
    const subcontractSubtotal = sum(d.subcontractors);
    const baseCost = materialsSubtotal + laborSubtotal + equipmentSubtotal + subcontractSubtotal;
    const adminAmount = baseCost * ((d.additionalPercentages?.administrative ?? defaults.administrative) / 100);
    const operationalAmount = baseCost * ((d.additionalPercentages?.operational ?? defaults.operational) / 100);
    const profitAmount = baseCost * ((d.additionalPercentages?.profit ?? defaults.profit) / 100);
    return {
      baseItemId: id,
      materialsCost: materialsSubtotal,
      laborCost: laborSubtotal,
      equipmentCost: equipmentSubtotal,
      subcontractCost: subcontractSubtotal,
      adminCost: adminAmount,
      operationalCost: operationalAmount,
      profitCost: profitAmount,
    };
  });
  const enriched = engine.enrich(baseItems, componentInputs);
  const adapted: DomainPricingItem[] = enriched.map(e => {
    const raw = pricingMap.get(e.baseItemId);
    const b = baseItems.find(b => b.id === e.baseItemId)!;
    return {
      id: e.baseItemId,
      itemNumber: b.lineNo,
      description: b.description,
      unit: b.unit,
      quantity: b.quantity,
      unitPrice: e.unitPrice, // المحرك يحسب: totalCosts / quantity
      totalPrice: e.totalPrice, // = مجموع breakdown (Base + overheads)
      isPriced: e.isPriced,
  materials: raw?.materials ?? [],
  labor: raw?.labor ?? [],
  equipment: raw?.equipment ?? [],
  subcontractors: raw?.subcontractors ?? [],
      breakdown: {
        materials: e.materialsCost,
        labor: e.laborCost,
        equipment: e.equipmentCost,
        subcontractors: e.subcontractCost,
        administrative: e.adminCost,
        operational: e.operationalCost,
        profit: e.profitCost,
        subtotal: e.materialsCost + e.laborCost + e.equipmentCost + e.subcontractCost, // BaseCost
        total: e.totalPrice,
      }
    };
  });
  const totalValue = adapted.reduce((s, i) => s + (i.totalPrice || 0), 0);
  return { items: adapted, totalValue };
}

export function useDomainPricingEngine<TEntry extends RawAuthoringEntry>(params: UseDomainPricingEngineParams<TEntry>): UseDomainPricingEngineResult {
  const { tenderId, quantityItems, pricingMap, defaults } = params;
  // Legacy fallback flag removed: single enable condition now.
  const enabled = PRICING_FLAGS.USE_DOMAIN_PRICING_UI;
  const [status, setStatus] = useState<'idle' | 'ready'>('idle');
  const [items, setItems] = useState<DomainPricingItem[]>([]);
  const [totals, setTotals] = useState<{ totalValue: number } | null>(null);

  const engineReady = enabled && tenderId; // simple flag; pure function builds engine internally

  // Memoize the transformation to avoid infinite loops
  const transformedData = useMemo(() => {
    if (!enabled || !engineReady) return null;
    return transformAuthoringToDomainUIItems({
      tenderId: tenderId!,
      quantityItems,
      pricingMap,
      defaults
    });
  }, [enabled, engineReady, tenderId, quantityItems, pricingMap, defaults.administrative, defaults.operational, defaults.profit]);

  useEffect(() => {
    if (!transformedData) {
      setStatus('idle');
      return;
    }
    setItems(transformedData.items);
    setTotals({ totalValue: transformedData.totalValue });
    setStatus('ready');
    pricingRuntime.incDomain();
  }, [transformedData]);

  return { enabled, items, totals, status };
}
