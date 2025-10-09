// PricingEngine: pure-ish functions to enrich items & compute totals.
import type { BoQBaseItem, BoQPricedItem, CostBreakdown, PricingTotals } from '../model';

export interface PricingDefaults {
  profitPct?: number; // e.g. 0.15
  adminPct?: number;
  operationalPct?: number;
  vatRate: number; // e.g. 0.15
}

export interface ComponentInput {
  baseItemId: string;
  materialsCost?: number;
  laborCost?: number;
  equipmentCost?: number;
  subcontractCost?: number;
  adminCost?: number; // explicit override
  operationalCost?: number; // explicit override
  profitCost?: number; // explicit override
}

export class PricingEngine {
  constructor(private defaults: PricingDefaults) {}

  enrich(baseItems: BoQBaseItem[], inputs: ComponentInput[]): BoQPricedItem[] {
    const map = new Map<string, ComponentInput>();
    inputs.forEach(i => map.set(i.baseItemId, i));
    const now = new Date().toISOString();

    return baseItems.map(b => {
      const c = map.get(b.id);
      const breakdown: CostBreakdown = {
        materialsCost: c?.materialsCost ?? 0,
        laborCost: c?.laborCost ?? 0,
        equipmentCost: c?.equipmentCost ?? 0,
        subcontractCost: c?.subcontractCost ?? 0,
        adminCost: c?.adminCost ?? 0,
        operationalCost: c?.operationalCost ?? 0,
        profitCost: c?.profitCost ?? 0,
        subtotalCost: 0
      };
      breakdown.subtotalCost = this.sumCosts(breakdown);
      const quantity = b.quantity || 0;
      const unitPrice = quantity > 0 ? breakdown.subtotalCost / quantity : 0;
      return {
        id: `${b.id}:priced`,
        boqPricedId: 'PENDING', // replaced later by repository/pipeline
        baseItemId: b.id,
        lineNo: b.lineNo,
        quantity,
        unitPrice,
        totalPrice: breakdown.subtotalCost,
        isPriced: breakdown.subtotalCost > 0,
        createdAt: now,
        ...breakdown
      };
    });
  }

  aggregateTotals(items: BoQPricedItem[]): PricingTotals {
    const totalValue = items.reduce((s, i) => s + i.totalPrice, 0);
    const vatAmount = totalValue * (this.defaults.vatRate || 0);
    const totalWithVat = totalValue + vatAmount;
    const profitTotal = items.reduce((s, i) => s + i.profitCost, 0);
    const adminTotal = items.reduce((s, i) => s + i.adminCost, 0);
    const operationalTotal = items.reduce((s, i) => s + i.operationalCost, 0);
    const profitPct = totalValue ? profitTotal / totalValue : 0;
    const adminOperationalPct = totalValue ? (adminTotal + operationalTotal) / totalValue : 0;

    return {
      totalValue,
      vatAmount,
      totalWithVat,
      profitTotal,
      adminTotal,
      operationalTotal,
      profitPct,
      adminOperationalPct
    };
  }

  private sumCosts(c: CostBreakdown): number {
    return c.materialsCost + c.laborCost + c.equipmentCost + c.subcontractCost + c.adminCost + c.operationalCost + c.profitCost;
  }
}
