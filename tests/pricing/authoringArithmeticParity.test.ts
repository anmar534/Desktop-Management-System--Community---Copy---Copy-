import { describe, it, expect } from 'vitest';
import { enrichPricingItems, type PricingItemInput, type PricingResource } from '../../src/utils/pricingHelpers';
import type { DefaultPercentages } from '../../src/application/services/pricingService';

type PricingComputationEntry = PricingItemInput & {
  materials: PricingResource[];
  labor: PricingResource[];
  equipment: PricingResource[];
  subcontractors: PricingResource[];
  additionalPercentages: DefaultPercentages;
};

// مرجع حسابي ثابت (بدلاً من تسميته legacy) لضمان بقاء الصيغة الحسابية تحت المراقبة.
function referenceAuthoringCompute(item: PricingItemInput, pricing: PricingComputationEntry) {
  const materialsCost = pricing.materials.reduce((sum, resource) => sum + (resource.total ?? 0), 0);
  const laborCost = pricing.labor.reduce((sum, resource) => sum + (resource.total ?? 0), 0);
  const equipmentCost = pricing.equipment.reduce((sum, resource) => sum + (resource.total ?? 0), 0);
  const subcontractorsCost = pricing.subcontractors.reduce((sum, resource) => sum + (resource.total ?? 0), 0);
  const subtotal = materialsCost + laborCost + equipmentCost + subcontractorsCost;
  const admin = subtotal * (pricing.additionalPercentages.administrative / 100);
  const operational = subtotal * (pricing.additionalPercentages.operational / 100);
  const profit = subtotal * (pricing.additionalPercentages.profit / 100);
  const unitPrice = subtotal + admin + operational + profit;
  const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
  const totalPrice = unitPrice * quantity;
  return { unitPrice, totalPrice };
}

describe('Authoring Arithmetic Parity', () => {
  it('engine matches reference arithmetic within 0.01% tolerance', () => {
    const quantityItems: PricingItemInput[] = [{ id: 'i1', description: 'بند', unit: 'م', quantity: 10 }];
    const pricingMapEntries: [string, PricingComputationEntry][] = [[
      'i1',
      {
        id: 'i1',
        materials: [{ total: 100 }],
        labor: [{ total: 50 }],
        equipment: [{ total: 25 }],
        subcontractors: [{ total: 25 }],
        additionalPercentages: { administrative: 5, operational: 5, profit: 15 }
      }
    ]];

    // لا نمرر DEFAULT_PERCENTAGES حتى يستخدم المحرك النسب الفعلية (5,5,15)
    const enriched = enrichPricingItems(pricingMapEntries, quantityItems);
    const engineItem = enriched[0];
    const ref = referenceAuthoringCompute(quantityItems[0], pricingMapEntries[0][1]);

    const unitDeltaPct = Math.abs((engineItem.unitPrice - ref.unitPrice) / (ref.unitPrice || 1)) * 100;
    const totalDeltaPct = Math.abs((engineItem.totalPrice - ref.totalPrice) / (ref.totalPrice || 1)) * 100;

    expect(unitDeltaPct).toBeLessThan(0.01);
    expect(totalDeltaPct).toBeLessThan(0.01);
  });
});
