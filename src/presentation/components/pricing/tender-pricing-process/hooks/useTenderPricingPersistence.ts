import { useCallback, useMemo, useRef } from 'react';
import type { Tender } from '@/data/centralData';
import type {
  MaterialRow,
  LaborRow,
  EquipmentRow,
  SubcontractorRow,
  PricingData,
  PricingViewItem,
  PricingBreakdown,
  PricingPercentages
} from '@/shared/types/pricing';
import type { BOQTotals, BOQData } from '@/shared/types/boq';
import { pricingDataSyncService } from '@/application/services/pricingDataSyncService';
import { pricingService } from '@/application/services/pricingService';
import { getBOQRepository } from '@/application/services/serviceRegistry';
import { PRICING_FLAGS, type PricingItemInput, type PricingResource, enrichPricingItems, isPricingEntry } from '@/shared/utils/pricing/pricingHelpers';
import { safeLocalStorage } from '@/shared/utils/storage/storage';
import type { CurrencyOptions } from '@/shared/utils/formatters/formatters';
import { toast } from 'sonner';
import { debounce } from '@/shared/utils/helpers';
import { recordAuditEvent, type AuditEventLevel, type AuditEventStatus } from '@/shared/utils/storage/auditLog';
import type {
  QuantityItem,
  PricingProgressStatus,
  StoredTechnicalFile,
  PricingStatusSnapshot,
  PersistedBreakdown,
  PersistedBOQItem
} from '../types';

/**
 * Hook parameters
 */
interface UseTenderPricingPersistenceProps {
  tender: Tender;
  pricingData: Map<string, PricingData>;
  quantityItems: QuantityItem[];
  defaultPercentages: PricingPercentages;
  pricingViewItems: PricingViewItem[];
  domainPricing: { enabled: boolean; status: string };
  calculateProjectTotal: () => number;
  isLoaded: boolean;
  currentItemId?: string;
  setPricingData: (data: Map<string, PricingData>) => void;
  formatCurrencyValue: (amount: number | string | null | undefined, options?: CurrencyOptions) => string;
}

/**
 * Hook return type
 */
interface UseTenderPricingPersistenceReturn {
  notifyPricingUpdate: () => void;
  persistPricingAndBOQ: (map: Map<string, PricingData>) => Promise<void>;
  updateTenderStatus: () => void;
  debouncedSave: (data: PricingData) => void;
}

/**
 * Custom hook for managing tender pricing persistence operations
 * Handles saving, syncing, and status updates for tender pricing data
 */
export function useTenderPricingPersistence({
  tender,
  pricingData,
  quantityItems,
  defaultPercentages,
  pricingViewItems,
  domainPricing,
  calculateProjectTotal,
  isLoaded,
  currentItemId,
  setPricingData,
  formatCurrencyValue
}: UseTenderPricingPersistenceProps): UseTenderPricingPersistenceReturn {
  
  // Ref to track last status to avoid redundant updates
  const lastStatusRef = useRef<PricingStatusSnapshot | null>(null);
  const recordPersistenceAudit = useCallback((
    level: AuditEventLevel,
    action: string,
    metadata?: Record<string, unknown>,
    status?: AuditEventStatus
  ) => {
    void recordAuditEvent({
      category: 'tender-pricing',
      action,
      key: tender.id ? String(tender.id) : 'unknown-tender',
      level,
      status,
      metadata
    });
  }, [tender.id]);

  /**
   * Notify other components that pricing data has been updated
   * Dispatches custom event and syncs with central pricing system
   */
  const notifyPricingUpdate = useCallback(() => {
    try {
      let engineMap: Map<string, Record<string, unknown>> | null = null;
      if (PRICING_FLAGS.USE_ENGINE_AUTHORING) {
        try {
          const quantityIndex = new Map(quantityItems.map(item => [item.id, item]));
          const toPricingResources = <TRow extends MaterialRow | LaborRow | EquipmentRow | SubcontractorRow>(rows: TRow[]): PricingResource[] =>
            rows.map(row => ({
              id: row.id,
              description: row.description,
              unit: row.unit,
              quantity: row.quantity,
              price: row.price,
              total: row.total,
              ...((row as unknown) as Record<string, unknown>)
            } satisfies PricingResource));

          const quantityInputs: PricingItemInput[] = quantityItems.map(item => ({
            id: item.id,
            itemNumber: item.itemNumber,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            canonicalDescription: item.canonicalDescription,
            defaultPercentages
          }));

          const rawEntries: [string, PricingItemInput][] = Array.from(pricingData.entries())
            .filter(isPricingEntry)
            .map(([id, data]) => {
              const sourceItem = quantityIndex.get(id);
              const entry: PricingItemInput = {
                id,
                itemNumber: sourceItem?.itemNumber,
                description: sourceItem?.description ?? `البند ${id}`,
                unit: sourceItem?.unit ?? 'وحدة',
                quantity: sourceItem?.quantity ?? 0,
                materials: toPricingResources(data.materials),
                labor: toPricingResources(data.labor),
                equipment: toPricingResources(data.equipment),
                subcontractors: toPricingResources(data.subcontractors),
                additionalPercentages: data.additionalPercentages,
                defaultPercentages
              };
              return [id, entry];
            });
          const enriched = enrichPricingItems(rawEntries, quantityInputs, defaultPercentages);
          engineMap = new Map(enriched.map(item => [item.id, item]));
        } catch (e) {
          recordPersistenceAudit('warning', 'engine-authoring-enrichment-failed', {
            message: e instanceof Error ? e.message : 'unknown-error'
          }, 'error');
          engineMap = null;
        }
      }

      const quantityTableWithPricing: PricingViewItem[] = (() => {
        if (PRICING_FLAGS.USE_DOMAIN_PRICING_UI && domainPricing.enabled && domainPricing.status === 'ready') {
          return pricingViewItems;
        }
        return pricingViewItems.map(viewItem => {
          if (engineMap) {
            const engine = engineMap.get(viewItem.id);
            if (engine) {
              const breakdown = engine.breakdown as PricingBreakdown | undefined;
              return {
                ...viewItem,
                unitPrice: engine.unitPrice as number,
                totalPrice: (breakdown?.total ?? 0),
                breakdown: breakdown,
                isPriced: engine.isPriced as boolean
              };
            }
          }
          return viewItem;
        });
      })();

      // استخدام خدمة المزامنة الجديدة بدلاً من الحدث المباشر
      const event = new CustomEvent('pricingDataUpdated', {
        detail: {
          tenderId: tender.id,
          quantityTable: quantityTableWithPricing,
          timestamp: new Date().toISOString(),
          source: 'TenderPricingProcess',
          engineAuthoring: PRICING_FLAGS.USE_ENGINE_AUTHORING
        }
      });
      window.dispatchEvent(event);
      
      // تشغيل خدمة المزامنة لضمان تحديث النظام المركزي
      pricingDataSyncService.forceSyncTender(tender.id)
        .then(success => {
          if (success) {
            recordPersistenceAudit('info', 'pricing-sync-success', {
              items: quantityTableWithPricing.length
            });
          }
        })
        .catch(error => {
          recordPersistenceAudit('error', 'pricing-sync-failed', {
            message: error instanceof Error ? error.message : 'unknown-error'
          }, 'error');
        });

      recordPersistenceAudit('info', 'pricing-update-notified', {
        items: quantityTableWithPricing.length,
        engineAuthoring: PRICING_FLAGS.USE_ENGINE_AUTHORING
      });

      // (Legacy Dual-Write Removed 2025-09): حذف مسار dualWritePricing.
    } catch (error) {
      recordPersistenceAudit(
        'error',
        'pricing-update-notify-failed',
        {
          message: error instanceof Error ? error.message : 'unknown-error'
        },
        'error'
      );
    }
  }, [
    defaultPercentages,
    domainPricing.enabled,
    domainPricing.status,
    pricingData,
    pricingViewItems,
    quantityItems,
    recordPersistenceAudit,
    tender.id
  ]);

  /**
   * Persist pricing data to storage
   * Simplified version - just logs BOQ data for now
   */
  const persistPricingAndBOQ = useCallback(async (map: Map<string, PricingData>) => {
    const normalizeString = (value: unknown): string => {
      if (value == null) return '';
      return typeof value === 'string' ? value.trim() : String(value).trim();
    };

    const round2 = (value: number): number => Math.round(value * 100) / 100;
    const isMeaningfulDescription = (value: string): boolean =>
      value.length > 0 && !/^البند\s*\d+$/i.test(value) && !/^بند\s*\d+$/i.test(value) && !/غير\s*محدد/.test(value);

    const serializeForComparison = (value: unknown): string =>
      JSON.stringify(value, (key, val) => (key === 'lastUpdated' ? undefined : val));

    try {
      const items = quantityItems
        .map<PersistedBOQItem | null>((quantityItem) => {
          const itemPricing = map.get(quantityItem.id);
          if (!itemPricing) {
            return null;
          }

          const materialsTotal = itemPricing.materials.reduce((sum, row) => sum + (row.total || 0), 0);
          const laborTotal = itemPricing.labor.reduce((sum, row) => sum + (row.total || 0), 0);
          const equipmentTotal = itemPricing.equipment.reduce((sum, row) => sum + (row.total || 0), 0);
          const subcontractorsTotal = itemPricing.subcontractors.reduce((sum, row) => sum + (row.total || 0), 0);
          const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal;

          const adminPercentage = itemPricing.additionalPercentages?.administrative ?? defaultPercentages.administrative;
          const operationalPercentage = itemPricing.additionalPercentages?.operational ?? defaultPercentages.operational;
          const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit;

          const administrative = (subtotal * adminPercentage) / 100;
          const operational = (subtotal * operationalPercentage) / 100;
          const profit = (subtotal * profitPercentage) / 100;
          const total = subtotal + administrative + operational + profit;
          const unitPrice = quantityItem.quantity > 0 ? total / quantityItem.quantity : total;

          const extendedDescriptions: Record<string, string> = {};
          const pushIfMeaningful = (key: string, value: unknown): void => {
            if (key === 'description' || key === 'canonicalDescription') {
              return;
            }
            const normalized = normalizeString(value);
            if (normalized) {
              extendedDescriptions[key] = normalized;
            }
          };

          const staticExtendedKeys: (keyof QuantityItem)[] = [
            'fullDescription',
            'rawDescription',
            'originalDescription',
            'multiLineDescription',
            'detailedDescription',
            'longDescription',
            'englishDescription',
            'arabicDescription'
          ];

          staticExtendedKeys.forEach((key) => {
            if (key in quantityItem) {
              pushIfMeaningful(key as string, quantityItem[key]);
            }
          });

          Object.entries(quantityItem).forEach(([key, value]) => {
            if (extendedDescriptions[key]) {
              return;
            }
            if (/desc|description|وصف/i.test(key)) {
              pushIfMeaningful(key, value);
            }
          });

          const directUpstream = normalizeString(quantityItem.canonicalDescription ?? quantityItem.description);
          const specBased = normalizeString(quantityItem.specifications);
          const fallback = quantityItem.itemNumber ? `البند ${quantityItem.itemNumber}` : `البند ${quantityItem.id}`;
          const canonicalDescription = isMeaningfulDescription(directUpstream)
            ? directUpstream
            : isMeaningfulDescription(specBased)
              ? specBased
              : fallback;

          const persistedItem: PersistedBOQItem = {
            id: quantityItem.id,
            description: canonicalDescription,
            canonicalDescription,
            unit: quantityItem.unit,
            quantity: quantityItem.quantity,
            unitPrice: round2(unitPrice),
            totalPrice: round2(total),
            category: 'BOQ',
            ...extendedDescriptions,
            breakdown: {
              materials: round2(materialsTotal),
              labor: round2(laborTotal),
              equipment: round2(equipmentTotal),
              subcontractors: round2(subcontractorsTotal),
              administrative: round2(administrative),
              operational: round2(operational),
              profit: round2(profit)
            },
            estimated: {
              quantity: quantityItem.quantity,
              unitPrice: round2(unitPrice),
              totalPrice: round2(total),
              materials: itemPricing.materials,
              labor: itemPricing.labor,
              equipment: itemPricing.equipment,
              subcontractors: itemPricing.subcontractors,
              additionalPercentages: {
                administrative: adminPercentage,
                operational: operationalPercentage,
                profit: profitPercentage
              }
            }
          };

          return persistedItem;
        })
        .filter((item): item is PersistedBOQItem => item !== null);

      const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const boqRepository = getBOQRepository();
      const existing = await boqRepository.getByTenderId(tender.id);

      const sums = items.reduce<PersistedBreakdown>(
        (acc, item) => {
          acc.materials += item.breakdown.materials;
          acc.labor += item.breakdown.labor;
          acc.equipment += item.breakdown.equipment;
          acc.subcontractors += item.breakdown.subcontractors;
          acc.administrative += item.breakdown.administrative;
          acc.operational += item.breakdown.operational;
          acc.profit += item.breakdown.profit;
          return acc;
        },
        {
          materials: 0,
          labor: 0,
          equipment: 0,
          subcontractors: 0,
          administrative: 0,
          operational: 0,
          profit: 0
        }
      );

      const baseSubtotal = sums.materials + sums.labor + sums.equipment + sums.subcontractors;
      const adminOperational = sums.administrative + sums.operational;
      const vatRate = 0.15;
      const vatAmount = round2(totalValue * vatRate);
      const totalWithVat = round2(totalValue + vatAmount);
      const profitPct = baseSubtotal > 0 ? Number(((sums.profit / baseSubtotal) * 100).toFixed(4)) : 0;
      const adminOperationalPct = totalValue > 0 ? Number(((adminOperational / totalValue) * 100).toFixed(4)) : 0;
      const administrativePct = baseSubtotal > 0 ? Number(((sums.administrative / baseSubtotal) * 100).toFixed(4)) : 0;
      const operationalPct = baseSubtotal > 0 ? Number(((sums.operational / baseSubtotal) * 100).toFixed(4)) : 0;

      const totals: BOQTotals = {
        totalValue,
        baseSubtotal,
        vatRate,
        vatAmount,
        totalWithVat,
        profit: round2(sums.profit),
        administrative: round2(sums.administrative),
        operational: round2(sums.operational),
        adminOperational: round2(adminOperational),
        profitPercentage: profitPct,
        adminOperationalPercentage: adminOperationalPct,
        administrativePercentage: administrativePct,
        operationalPercentage: operationalPct
      };

      recordPersistenceAudit('info', 'persist-boq', {
        itemsCount: items.length,
        totalValue: formatCurrencyValue(totalValue),
        existingBOQ: Boolean(existing)
      });

      const payload = {
        id: existing?.id,
        tenderId: tender.id,
        projectId: existing?.projectId,
        items,
        totalValue,
        totals,
        lastUpdated: new Date().toISOString()
      } satisfies Omit<BOQData, 'id'> & { id?: string };

      const existingShape = existing ? serializeForComparison(existing) : null;
      const nextShape = serializeForComparison(payload);

      if (existingShape === nextShape) {
        recordPersistenceAudit('info', 'persist-boq-skipped-no-change', {
          tenderId: tender.id,
          itemsCount: items.length,
          totalValue: formatCurrencyValue(totalValue)
        });
        return;
      }

      await boqRepository.createOrUpdate(payload);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('boqUpdated', {
            detail: { tenderId: tender.id, totalValue, itemsCount: items.length }
          })
        );
      }
    } catch (error) {
      recordPersistenceAudit('error', 'persist-boq-failed', {
        message: error instanceof Error ? error.message : 'unknown-error'
      }, 'error');
    }
  }, [defaultPercentages, formatCurrencyValue, quantityItems, recordPersistenceAudit, tender.id]);

  /**
   * Update tender status based on pricing completion
   * Simplified version - just logs status updates
   */
  const updateTenderStatus = useCallback(() => {
    const completedCount = Array.from(pricingData.values()).filter(value => value?.completed).length;
    const completionPercentage = quantityItems.length > 0 ? (completedCount / quantityItems.length) * 100 : 0;
    const totalValue = calculateProjectTotal();

    const storedFiles = safeLocalStorage.getItem<StoredTechnicalFile[]>('tender_technical_files', []);
    const hasTechnicalFilesFromStorage = Array.isArray(storedFiles)
      ? storedFiles.some(file => file?.tenderId === tender.id)
      : false;
    const hasTechnicalFiles = hasTechnicalFilesFromStorage || Boolean(tender.technicalFilesUploaded);

    let pricingStatus: PricingProgressStatus = 'in_progress';
    if (completionPercentage === 100 && hasTechnicalFiles) {
      pricingStatus = 'completed';
    }

    const currentState: PricingStatusSnapshot = {
      status: 'under_action',
      progress: completionPercentage,
      totalValue
    };

    if (
      lastStatusRef.current &&
      lastStatusRef.current.status === currentState.status &&
      Math.abs(lastStatusRef.current.progress - currentState.progress) < 0.0001 &&
      lastStatusRef.current.totalValue === currentState.totalValue
    ) {
      return;
    }

    lastStatusRef.current = currentState;

    recordPersistenceAudit('info', 'pricing-status-updated', {
      pricingStatus,
      completionPercentage,
      itemsPriced: pricingData.size,
      totalItems: quantityItems.length,
      totalValue
    });

    if (completionPercentage === 100) {
      toast.success('تم إكمال التسعير', {
        description: 'تم إكمال تسعير جميع بنود المنافسة بنجاح',
        duration: 5000
      });
    }
  }, [pricingData, quantityItems, tender, calculateProjectTotal, recordPersistenceAudit]);

  /**
   * Debounced save function to prevent excessive saves
   * Automatically saves pricing data with 2 second delay
   */
  const debouncedSave = useMemo(
    () =>
      debounce((data: PricingData) => {
        if (!isLoaded || !currentItemId) {
          return;
        }

        const previous = pricingData.get(currentItemId);
        try {
          if (JSON.stringify(previous) === JSON.stringify(data)) {
            return;
          }
        } catch (error) {
          recordPersistenceAudit('warning', 'autosave-compare-failed', {
            message: error instanceof Error ? error.message : 'unknown-error'
          }, 'error');
        }

        const newMap = new Map(pricingData);
        newMap.set(currentItemId, data);
        setPricingData(newMap);

        const serializedPricing = Array.from(newMap.entries()).filter(isPricingEntry);
        void pricingService.saveTenderPricing(tender.id, {
          pricing: serializedPricing,
          defaultPercentages,
          lastUpdated: new Date().toISOString()
        });
        // تحديث لقطة BOQ المركزية فور أي تعديل تسعير
        void persistPricingAndBOQ(newMap);
        // (Legacy Snapshot Removed) لم يعد يتم إنشاء snapshot تلقائي.
      }, 2000),
    [currentItemId, tender.id, defaultPercentages, pricingData, isLoaded, persistPricingAndBOQ, recordPersistenceAudit, setPricingData]
  );

  return {
    notifyPricingUpdate,
    persistPricingAndBOQ,
    updateTenderStatus,
    debouncedSave
  };
}

