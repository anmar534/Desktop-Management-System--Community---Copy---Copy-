import { useCallback, useMemo } from 'react';
import { recordAuditEvent } from '@/shared/utils/storage/auditLog';
import type { UseDomainPricingEngineResult } from '@/application/hooks/useDomainPricingEngine';
import type { PricingData, PricingPercentages, PricingViewItem } from '@/types/pricing';
import { PRICING_FLAGS } from '@/shared/utils/pricing/pricingHelpers';
import type { DraftPricingItem, QuantityItem } from '../types';

interface UseTenderPricingCalculationsParams {
  currentPricing: PricingData;
  pricingData: Map<string, PricingData>;
  quantityItems: QuantityItem[];
  defaultPercentages: PricingPercentages;
  pricingViewItems: PricingViewItem[];
  domainPricing: UseDomainPricingEngineResult;
  tenderId?: string | number;
}

export const useTenderPricingCalculations = ({
  currentPricing,
  pricingData,
  quantityItems,
  defaultPercentages,
  pricingViewItems,
  domainPricing,
  tenderId,
}: UseTenderPricingCalculationsParams) => {
  const auditKey = typeof tenderId === 'number' || typeof tenderId === 'string' ? String(tenderId) : 'unknown-tender';
  // ✅ محسّن: استخدام useMemo بدلاً من useCallback لحفظ النتائج المحسوبة
  const totals = useMemo(() => {
    // حساب المواد مع مراعاة نسبة الهدر
    const materialsTotal = currentPricing.materials.reduce((sum, mat) => {
      const wastageMultiplier = mat.hasWaste ? 1 + ((mat.wastePercentage ?? 0) / 100) : 1;
      return sum + ((mat.quantity ?? 0) * (mat.price ?? 0) * wastageMultiplier);
    }, 0);
    const laborTotal = currentPricing.labor.reduce((sum, item) => sum + item.total, 0);
    const equipmentTotal = currentPricing.equipment.reduce((sum, item) => sum + item.total, 0);
    const subcontractorsTotal = currentPricing.subcontractors.reduce((sum, item) => sum + item.total, 0);

    const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal;
    const administrativeCost = (subtotal * (currentPricing.additionalPercentages?.administrative || 0)) / 100;
    const operationalCost = (subtotal * (currentPricing.additionalPercentages?.operational || 0)) / 100;
    const profitCost = (subtotal * (currentPricing.additionalPercentages?.profit || 0)) / 100;
    const finalTotal = subtotal + administrativeCost + operationalCost + profitCost;

    return {
      materials: materialsTotal,
      labor: laborTotal,
      equipment: equipmentTotal,
      subcontractors: subcontractorsTotal,
      subtotal,
      administrative: administrativeCost,
      operational: operationalCost,
      profit: profitCost,
      total: finalTotal,
    };
  }, [currentPricing]);

  // دالة للتوافقية مع الكود الموجود
  const calculateTotals = useCallback(() => totals, [totals]);

  const calculateAveragePercentages = useCallback(() => {
    let totalAdmin = 0;
    let totalOperational = 0;
    let totalProfit = 0;
    let count = 0;

    pricingData.forEach((itemPricing) => {
      const adminPercentage = itemPricing.additionalPercentages?.administrative ?? defaultPercentages.administrative;
      const operationalPercentage = itemPricing.additionalPercentages?.operational ?? defaultPercentages.operational;
      const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit;

      totalAdmin += adminPercentage;
      totalOperational += operationalPercentage;
      totalProfit += profitPercentage;
      count += 1;
    });

    if (count === 0) {
      return {
        administrative: defaultPercentages.administrative,
        operational: defaultPercentages.operational,
        profit: defaultPercentages.profit,
      };
    }

    return {
      administrative: totalAdmin / count,
      operational: totalOperational / count,
      profit: totalProfit / count,
    };
  }, [pricingData, defaultPercentages]);

  const calculateItemsTotal = useCallback(() => {
    let projectTotal = 0;
    quantityItems.forEach((item) => {
      const itemPricing = pricingData.get(item.id);
      if (!itemPricing) return;

      const itemTotals = {
        // حساب المواد مع مراعاة نسبة الهدر ✅
        materials: itemPricing.materials.reduce((sum, mat) => {
          const wastageMultiplier = mat.hasWaste ? 1 + ((mat.wastePercentage ?? 0) / 100) : 1;
          return sum + ((mat.quantity ?? 0) * (mat.price ?? 0) * wastageMultiplier);
        }, 0),
        labor: itemPricing.labor.reduce((sum, lab) => sum + lab.total, 0),
        equipment: itemPricing.equipment.reduce((sum, eq) => sum + eq.total, 0),
        subcontractors: itemPricing.subcontractors.reduce((sum, sub) => sum + sub.total, 0),
      };
      const subtotal = itemTotals.materials + itemTotals.labor + itemTotals.equipment + itemTotals.subcontractors;
      const adminPercentage = itemPricing.additionalPercentages?.administrative ?? defaultPercentages.administrative;
      const operationalPercentage = itemPricing.additionalPercentages?.operational ?? defaultPercentages.operational;
      const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit;
      const administrative = (subtotal * adminPercentage) / 100;
      const operational = (subtotal * operationalPercentage) / 100;
      const profit = (subtotal * profitPercentage) / 100;
      projectTotal += subtotal + administrative + operational + profit;
    });
    return projectTotal;
  }, [quantityItems, pricingData, defaultPercentages]);

  const calculateVAT = useCallback(() => calculateItemsTotal() * 0.15, [calculateItemsTotal]);

  const calculateProjectTotal = useCallback(() => {
    const itemsTotal = calculateItemsTotal();
    const vat = calculateVAT();
    return itemsTotal + vat;
  }, [calculateItemsTotal, calculateVAT]);

  const buildDraftPricingItems = useCallback((): DraftPricingItem[] => {
    try {
      return pricingViewItems.map((item) => ({
        id: item.id,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        breakdown: item.breakdown ?? undefined,
      }));
    } catch (error) {
      void recordAuditEvent({
        category: 'tender-pricing',
        action: 'build-draft-items-failed',
        key: auditKey,
        level: 'warning',
        status: 'error',
        metadata: {
          message: error instanceof Error ? error.message : 'unknown-error'
        }
      });
      return [];
    }
  }, [pricingViewItems, auditKey]);

  const calculateTotalAdministrative = useCallback(() => {
    if (PRICING_FLAGS.USE_DOMAIN_PRICING_UI && domainPricing.enabled && domainPricing.status === 'ready') {
      return pricingViewItems.reduce((sum, item) => sum + (item.breakdown?.administrative ?? 0), 0);
    }
    let totalAdministrative = 0;
    pricingViewItems.forEach((item) => {
      totalAdministrative += item.breakdown?.administrative ?? 0;
    });
    return totalAdministrative;
  }, [pricingViewItems, domainPricing]);

  const calculateTotalOperational = useCallback(() => {
    if (PRICING_FLAGS.USE_DOMAIN_PRICING_UI && domainPricing.enabled && domainPricing.status === 'ready') {
      return pricingViewItems.reduce((sum, item) => sum + (item.breakdown?.operational ?? 0), 0);
    }
    let totalOperational = 0;
    pricingViewItems.forEach((item) => {
      totalOperational += item.breakdown?.operational ?? 0;
    });
    return totalOperational;
  }, [pricingViewItems, domainPricing]);

  const calculateTotalMaterials = useCallback(() => {
    let totalMaterials = 0;
    quantityItems.forEach((item) => {
      const itemPricing = pricingData.get(item.id);
      if (itemPricing) {
        // حساب المواد مع مراعاة نسبة الهدر ✅
        const materialsTotal = itemPricing.materials.reduce((sum, mat) => {
          const wastageMultiplier = mat.hasWaste ? 1 + ((mat.wastePercentage ?? 0) / 100) : 1;
          return sum + ((mat.quantity ?? 0) * (mat.price ?? 0) * wastageMultiplier);
        }, 0);
        totalMaterials += materialsTotal;
      }
    });
    return totalMaterials;
  }, [quantityItems, pricingData]);

  const calculateTotalLabor = useCallback(() => {
    let totalLabor = 0;
    quantityItems.forEach((item) => {
      const itemPricing = pricingData.get(item.id);
      if (itemPricing) {
        totalLabor += itemPricing.labor.reduce((sum, lab) => sum + lab.total, 0);
      }
    });
    return totalLabor;
  }, [quantityItems, pricingData]);

  const calculateTotalEquipment = useCallback(() => {
    let totalEquipment = 0;
    quantityItems.forEach((item) => {
      const itemPricing = pricingData.get(item.id);
      if (itemPricing) {
        totalEquipment += itemPricing.equipment.reduce((sum, eq) => sum + eq.total, 0);
      }
    });
    return totalEquipment;
  }, [quantityItems, pricingData]);

  const calculateTotalSubcontractors = useCallback(() => {
    let totalSubcontractors = 0;
    quantityItems.forEach((item) => {
      const itemPricing = pricingData.get(item.id);
      if (itemPricing) {
        totalSubcontractors += itemPricing.subcontractors.reduce((sum, sub) => sum + sub.total, 0);
      }
    });
    return totalSubcontractors;
  }, [quantityItems, pricingData]);

  const calculateTotalProfit = useCallback(() => {
    let totalProfit = 0;
    quantityItems.forEach((item) => {
      const itemPricing = pricingData.get(item.id);
      if (itemPricing) {
        const itemTotals = {
          // حساب المواد مع مراعاة نسبة الهدر ✅
          materials: itemPricing.materials.reduce((sum, mat) => {
            const wastageMultiplier = mat.hasWaste ? 1 + ((mat.wastePercentage ?? 0) / 100) : 1;
            return sum + ((mat.quantity ?? 0) * (mat.price ?? 0) * wastageMultiplier);
          }, 0),
          labor: itemPricing.labor.reduce((sum, lab) => sum + lab.total, 0),
          equipment: itemPricing.equipment.reduce((sum, eq) => sum + eq.total, 0),
          subcontractors: itemPricing.subcontractors.reduce((sum, sub) => sum + sub.total, 0),
        };
        const subtotal = itemTotals.materials + itemTotals.labor + itemTotals.equipment + itemTotals.subcontractors;
        const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit;
        const profit = (subtotal * profitPercentage) / 100;
        totalProfit += profit;
      }
    });
    return totalProfit;
  }, [quantityItems, pricingData, defaultPercentages.profit]);

  return {
    totals, // ✅ القيم المحسوبة مباشرة (محسّن باستخدام useMemo)
    calculateTotals, // للتوافقية مع الكود الموجود
    calculateAveragePercentages,
    calculateItemsTotal,
    calculateVAT,
    calculateProjectTotal,
    buildDraftPricingItems,
    calculateTotalAdministrative,
    calculateTotalOperational,
    calculateTotalMaterials,
    calculateTotalLabor,
    calculateTotalEquipment,
    calculateTotalSubcontractors,
    calculateTotalProfit,
  };
};

