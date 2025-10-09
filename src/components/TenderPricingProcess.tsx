import { saveToStorage, loadFromStorage, STORAGE_KEYS, safeLocalStorage } from '../utils/storage';
import {
  createTenderPricingBackup,
  listTenderBackupEntries,
  restoreTenderBackup,
  noteBackupFailure,
  type TenderPricingBackupPayload
} from '@/utils/backupManager';
import { pricingService } from '@/application/services/pricingService';
import { pricingDataSyncService } from '@/application/services/pricingDataSyncService';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Tender } from '@/data/centralData';
import type {
  ExecutionMethod,
  MaterialRow,
  LaborRow,
  EquipmentRow,
  SubcontractorRow,
  PricingRow,
  PricingData,
  PricingPercentages,
  PricingViewItem,
  PricingBreakdown,
  TenderBackupEntry
} from '@/types/pricing';
import type { BOQTotals, BOQData } from '@/types/boq';
import type { EnrichedPricingItem } from '@/application/services/pricingEngine';
import type { PricingItemInput, PricingResource } from '../utils/pricingHelpers';
// (Phase MVP Official/Draft) استيراد الهوك الجديد لإدارة المسودة والنسخة الرسمية
import { useEditableTenderPricing } from '@/application/hooks/useEditableTenderPricing';
// Phase 2 authoring engine adoption helpers (flag-guarded)
import { PRICING_FLAGS, enrichPricingItems } from '../utils/pricingHelpers';
import { useDomainPricingEngine } from '@/application/hooks/useDomainPricingEngine';
import { applyDefaultsToPricingMap } from '@/utils/defaultPercentagesPropagation';
import { formatDateValue } from '@/utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { EmptyState } from './PageLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu';
import { ConfirmationDialog } from './ui/confirmation-dialog';
import { confirmationMessages } from '@/config/confirmationMessages';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
/**
 * Phase 2 Authoring Engine Integration Notes:
 * - الحساب legacy معزول في legacyAuthoringCompute().
 * - عند تفعيل PRICING_FLAGS.USE_ENGINE_AUTHORING يتم تشغيل مسارين:
 *    1) legacy لحساب القيم (لأغراض المقارنة فقط)
 */
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { toast } from 'sonner';
import { TechnicalFilesUpload } from './TechnicalFilesUpload';
import { debounce } from '../utils/helpers';
import { APP_EVENTS, emit } from '../events/bus';
import { AlertCircle, CheckCircle, DollarSign, Package, TrendingUp, Settings, Building, Grid3X3, RotateCcw, Edit3, Target, PieChart, FileText, BarChart3, Plus, Trash2, Users, Truck, Download, ArrowRight, Save, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { getBOQRepository } from '@/application/services/serviceRegistry';
import { useSystemData } from '@/application/hooks/useSystemData';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

// ==== Types ====

interface QuantityItem {
  id: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number;
  specifications?: string;
  canonicalDescription?: string;
  fullDescription?: string;
  rawDescription?: string;
  multiLineDescription?: string;
  detailedDescription?: string;
  longDescription?: string;
  englishDescription?: string;
  arabicDescription?: string;
  [key: string]: unknown;
}

interface TenderAttachment {
  type?: string;
  name?: string;
  data?: unknown;
}

interface TenderStatsPayload {
  totalItems: number;
  pricedItems: number;
  completionPercentage: number;
  totalValue: number;
  averageUnitPrice: number;
  lastUpdated: string;
}

type PricingSection = 'materials' | 'labor' | 'equipment' | 'subcontractors';
type PricingView = 'summary' | 'pricing' | 'technical';

type RawQuantityItem = Partial<QuantityItem> & Record<string, unknown>;

interface SectionRowMap {
  materials: MaterialRow;
  labor: LaborRow;
  equipment: EquipmentRow;
  subcontractors: SubcontractorRow;
}

type SectionRowField<Section extends PricingSection> = keyof SectionRowMap[Section];

type DraftPricingItem = Pick<PricingViewItem, 'id' | 'description' | 'unit' | 'quantity' | 'unitPrice' | 'totalPrice'> & {
  breakdown?: PricingBreakdown;
};

type PricingProgressStatus = 'not_started' | 'in_progress' | 'completed';

interface PersistedBreakdown {
  materials: number;
  labor: number;
  equipment: number;
  subcontractors: number;
  administrative: number;
  operational: number;
  profit: number;
}

interface PersistedBOQItem extends Record<string, unknown> {
  id: string;
  description: string;
  canonicalDescription: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: 'BOQ';
  breakdown: PersistedBreakdown;
  estimated: {
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    materials: MaterialRow[];
    labor: LaborRow[];
    equipment: EquipmentRow[];
    subcontractors: SubcontractorRow[];
    additionalPercentages: PricingPercentages;
  };
}

interface PricingStatusSnapshot {
  status: Tender['status'];
  progress: number;
  totalValue: number;
}

interface StoredTechnicalFile extends Record<string, unknown> {
  tenderId?: string;
}

type TenderStatsRecord = Record<string, TenderStatsPayload>;

export type TenderWithPricingSources = Tender & {
  quantityTable?: QuantityItem[];
  quantities?: QuantityItem[];
  items?: QuantityItem[];
  boqItems?: QuantityItem[];
  quantityItems?: QuantityItem[];
  scope?: { items?: QuantityItem[] } | string | null;
  attachments?: TenderAttachment[];
  pricingStatus?: PricingProgressStatus;
  completionPercentage?: number;
  totalValue?: number;
  itemsPriced?: number;
  totalItems?: number;
  technicalFilesUploaded?: boolean;
  lastUpdated?: string;
};

const isPricingData = (value: unknown): value is PricingData => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<PricingData>;
  const { additionalPercentages } = candidate;

  const hasValidPercentages =
    additionalPercentages !== null &&
    typeof additionalPercentages === 'object' &&
    typeof additionalPercentages?.administrative === 'number' &&
    typeof additionalPercentages?.operational === 'number' &&
    typeof additionalPercentages?.profit === 'number';

  return (
    Array.isArray(candidate.materials) &&
    Array.isArray(candidate.labor) &&
    Array.isArray(candidate.equipment) &&
    Array.isArray(candidate.subcontractors) &&
    hasValidPercentages &&
    typeof candidate.technicalNotes === 'string'
  );
};

const isPricingEntry = (entry: unknown): entry is [string, PricingData] => {
  if (!Array.isArray(entry) || entry.length !== 2) {
    return false;
  }

  const [key, value] = entry;
  return typeof key === 'string' && isPricingData(value);
};

const isPricingView = (value: string): value is PricingView =>
  value === 'summary' || value === 'pricing' || value === 'technical';

interface TenderPricingProcessProps {
  tender: TenderWithPricingSources;
  onBack: () => void;
}

type QuantityFormatOptions = Intl.NumberFormatOptions & { locale?: string };

export const TenderPricingProcess: React.FC<TenderPricingProcessProps> = ({ 
  tender, 
  onBack 
}) => {
  const { updateTender } = useSystemData();
  const { formatCurrencyValue } = useCurrencyFormatter();
  const quantityFormatter = useMemo(() => new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }), []);
  const formatQuantity = useCallback((value: number | string | null | undefined, options?: QuantityFormatOptions) => {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0);
    const safeValue = Number.isFinite(numeric) ? numeric : 0;
    if (!options) {
      return quantityFormatter.format(safeValue);
    }
    const { locale = 'ar-SA', ...rest } = options;
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...rest,
    }).format(safeValue);
  }, [quantityFormatter]);
  const timestampFormatter = useMemo(() => new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'short',
    timeStyle: 'short',
  }), []);
  const formatTimestamp = useCallback((value: string | number | Date | null | undefined) => {
    if (value === null || value === undefined) {
      return '—';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return timestampFormatter.format(date);
  }, [timestampFormatter]);
  const tenderTitle = tender.title ?? tender.name ?? '';
  // using unified storage utils instead of useStorage
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentView, setCurrentView] = useState<PricingView>('summary');
  const [pricingData, setPricingData] = useState<Map<string, PricingData>>(new Map());
  // (Official/Draft MVP) دمج الهوك الجديد (قراءة فقط حالياً لعرض حالة الاعتماد)
  const editablePricing = useEditableTenderPricing(tender);
  // وظيفة مساعدة لتمييز أن هناك تغييرات مسودة غير معتمدة رسمياً
  const markDirty = useCallback(() => {
    try {
      if (editablePricing.status === 'ready') {
        editablePricing.markDirty?.();
      }
    } catch (error) {
      console.warn('⚠️ markDirty invocation failed', error);
    }
  }, [editablePricing]);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  const handleAttemptLeave = () => {
    if (editablePricing.dirty || editablePricing.isDraftNewer) {
      setIsLeaveDialogOpen(true);
      return;
    }
    onBack();
  };

  const handleConfirmLeave = () => {
    setIsLeaveDialogOpen(false);
    onBack();
  };

  const leaveConfirmationDialog = (
    <ConfirmationDialog
      title={confirmationMessages.leaveDirty.title}
      description={confirmationMessages.leaveDirty.description}
      confirmText={confirmationMessages.leaveDirty.confirmText}
      cancelText={confirmationMessages.leaveDirty.cancelText}
      variant="warning"
      icon="warning"
      onConfirm={handleConfirmLeave}
      onCancel={() => setIsLeaveDialogOpen(false)}
      open={isLeaveDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsLeaveDialogOpen(false);
        }
      }}
    />
  );
  
  // حالات الطي للجداول المختلفة في تبويب الملخص
  const [collapsedSections, setCollapsedSections] = useState<
    Record<
      string,
      {
        materials: boolean;
        labor: boolean;
        equipment: boolean;
        subcontractors: boolean;
      }
    >
  >({});

  // دالة لتبديل حالة الطي لقسم معين في بند معين
  const toggleCollapse = (itemId: string, section: PricingSection) => {
    setCollapsedSections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [section]: !prev[itemId]?.[section]
      }
    }))
  }

  const handleViewChange = (value: string) => {
    if (isPricingView(value)) {
      setCurrentView(value);
    }
  };
  
  // النسب الافتراضية العامة
  const [defaultPercentages, setDefaultPercentages] = useState<PricingPercentages>({
    administrative: 5,
    operational: 5,
    profit: 15
  });
  // Track previous defaults to enable smart propagation (items that still matched old defaults only)
  const previousDefaultsRef = useRef({ administrative: 5, operational: 5, profit: 15 });
  // حالات نصية وسيطة للسماح بالكتابة الحرة ثم الاعتماد عند الخروج من الحقل
  const [defaultPercentagesInput, setDefaultPercentagesInput] = useState({
    administrative: '5',
    operational: '5',
    profit: '15'
  });

  
  const [isLoaded, setIsLoaded] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [backupsList, setBackupsList] = useState<TenderBackupEntry[]>([]);
  
  // مرجع لتتبع آخر حالة تم إرسالها لتجنب التحديث المكرر
  const lastStatusRef = useRef<PricingStatusSnapshot | null>(null);

  // استخراج بيانات جدول الكميات من المنافسة مع البحث المحسّن
  const quantityItems: QuantityItem[] = useMemo(() => {
    console.log('🔍 البحث عن بيانات الكميات:', tender);
    const toTrimmedString = (value: unknown): string | undefined => {
      if (value === undefined || value === null) return undefined;
      const text = String(value).trim();
      return text.length > 0 ? text : undefined;
    };

    const toNumberOr = (value: unknown, fallback: number): number => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
      return fallback;
    };

    const scopeValue = tender?.scope;
    const scopeItems = (() => {
      if (!scopeValue || typeof scopeValue === 'string' || Array.isArray(scopeValue)) {
        return undefined;
      }
      const candidate = (scopeValue as { items?: QuantityItem[] }).items;
      return Array.isArray(candidate) ? (candidate as RawQuantityItem[]) : undefined;
    })();

    const asRaw = (source?: QuantityItem[] | null): RawQuantityItem[] | undefined =>
      Array.isArray(source) ? (source as RawQuantityItem[]) : undefined;

  const candidateSources: (RawQuantityItem[] | undefined)[] = [
      asRaw(tender?.quantityTable ?? undefined),
      asRaw(tender?.quantities ?? undefined),
      asRaw(tender?.items ?? undefined),
      asRaw(tender?.boqItems ?? undefined),
      asRaw(tender?.quantityItems ?? undefined),
      scopeItems,
    ];

    let quantityData: RawQuantityItem[] =
      candidateSources.find(source => Array.isArray(source) && source.length > 0) ?? [];

    if (quantityData.length === 0 && Array.isArray(tender?.attachments)) {
      const quantityAttachment = tender.attachments.find(att => {
        const normalizedName = att.name?.toLowerCase() ?? '';
        return (
          att.type === 'quantity' ||
          normalizedName.includes('كمية') ||
          normalizedName.includes('boq') ||
          normalizedName.includes('quantity')
        );
      });

      if (Array.isArray(quantityAttachment?.data)) {
        quantityData = quantityAttachment.data as RawQuantityItem[];
      }
    }

    if (quantityData.length === 0 && scopeValue) {
      console.log('🔍 البحث في نص الوصف:', scopeValue);
      // يمكن إضافة منطق لاستخراج البيانات من النص هنا لاحقاً
    }

    if (quantityData.length === 0) {
      console.log('⚠️ لا توجد بيانات كميات، إنشاء بيانات افتراضية');
      const title = tender?.title ?? tender?.name ?? '';
      const scopeText = typeof scopeValue === 'string' ? scopeValue : '';
      const defaultQuantityItems: RawQuantityItem[] = [];

      if (title.includes('مبنى') || scopeText.includes('مبنى') || title.includes('بناء') || scopeText.includes('بناء')) {
        defaultQuantityItems.push(
          {
            id: 'default-1',
            itemNumber: '01',
            description: 'أعمال الحفر والردم',
            unit: 'م³',
            quantity: 500,
            specifications: 'حفر وردم للأساسات'
          },
          {
            id: 'default-2',
            itemNumber: '02',
            description: 'أعمال الخرسانة العادية',
            unit: 'م³',
            quantity: 200,
            specifications: 'خرسانة عادية درجة 150 كجم/سم²'
          },
          {
            id: 'default-3',
            itemNumber: '03',
            description: 'أعمال الخرسانة المسلحة',
            unit: 'م³',
            quantity: 300,
            specifications: 'خرسانة مسلحة درجة 350 كجم/سم²'
          },
          {
            id: 'default-4',
            itemNumber: '04',
            description: 'أعمال حديد التسليح',
            unit: 'طن',
            quantity: 25,
            specifications: 'حديد تسليح عادي وعالي المقاومة'
          }
        );
      } else {
        defaultQuantityItems.push(
          {
            id: 'default-1',
            itemNumber: '01',
            description: 'البند الأول',
            unit: 'وحدة',
            quantity: 100,
            specifications: 'حسب المواصفات الفنية'
          },
          {
            id: 'default-2',
            itemNumber: '02',
            description: 'البند الثاني',
            unit: 'وحدة',
            quantity: 150,
            specifications: 'حسب المواصفات الفنية'
          }
        );
      }

      quantityData = defaultQuantityItems;
    }

    const normalizedItems = quantityData.map((item, index) => {
      const indexBasedId = `item-${index + 1}`;
      const id =
        toTrimmedString(item.id) ??
        toTrimmedString(item.itemId) ??
        toTrimmedString(item.number) ??
        indexBasedId;

      const itemNumber =
        toTrimmedString(item.itemNumber) ??
        toTrimmedString(item.number) ??
        String(index + 1).padStart(2, '0');

      const description =
        toTrimmedString(item.description) ??
        toTrimmedString((item as Record<string, unknown>).desc) ??
        toTrimmedString(item.name) ??
        '';

      const unit = toTrimmedString(item.unit) ?? toTrimmedString((item as Record<string, unknown>).uom) ?? 'وحدة';
      const quantity = toNumberOr(item.quantity, 1);
      const specifications =
        toTrimmedString(item.specifications) ??
        toTrimmedString((item as Record<string, unknown>).spec) ??
        toTrimmedString((item as Record<string, unknown>).notes) ??
        'حسب المواصفات الفنية';

      return {
        id,
        itemNumber,
        description,
        unit,
        quantity,
        specifications
      } satisfies QuantityItem;
    });

    console.log('✅ بيانات الكميات المعالجة:', normalizedItems);
    return normalizedItems;
  }, [tender]);

  // Transform pricingData to include id property for domain pricing engine
  const pricingMapWithIds = useMemo(() => {
    const transformedMap = new Map<string, PricingData & { id: string }>();
    pricingData.forEach((data, id) => {
      transformedMap.set(id, { ...data, id });
    });
    return transformedMap;
  }, [pricingData]);

  // Phase 2.5: Domain pricing engine (UI read path) — optional; no write path yet (moved after quantityItems definition)
  const domainPricing = useDomainPricingEngine({
    tenderId: tender?.id,
    quantityItems,
    pricingMap: pricingMapWithIds,
    defaults: {
      administrative: defaultPercentages.administrative,
      operational: defaultPercentages.operational,
      profit: defaultPercentages.profit
    }
  });

  // Unified view items list (engine vs legacy) to reduce duplicate recomputation across totals & rendering
  const pricingViewItems = useMemo<PricingViewItem[]>(() => {
    // (Legacy Removal 2025-09-20) المسار القديم أزيل؛ الآن نعتمد فقط على domainPricing.
    // إذا لم يكن جاهزاً (loading أو error) نعيد قائمة بنود مبدئية بدون تسعير.
    if (domainPricing.enabled && domainPricing.status === 'ready') {
      return domainPricing.items as PricingViewItem[];
    }
    return quantityItems.map<PricingViewItem>(q => ({
      ...q,
      isPriced: false,
      totalPrice: 0,
      unitPrice: 0
    }));
  }, [domainPricing, quantityItems]);

  // Debug: log pricing flags & show whether domain UI path is active
  useEffect(() => {
    console.info('[PricingFlags]', PRICING_FLAGS);
    if (PRICING_FLAGS.USE_DOMAIN_PRICING_UI) {
      console.info('✅ Domain Pricing UI path ENABLED (using useDomainPricingEngine)');
    } else {
      console.info('ℹ️ Domain Pricing UI path disabled (legacy inline compute in use)');
    }
  }, [domainPricing.enabled]);

  // دالة لإرسال إشعار تحديث للصفحات الأخرى مع استخدام خدمة المزامنة الجديدة
  const notifyPricingUpdate = useCallback(() => {
    try {
      let engineMap: Map<string, EnrichedPricingItem> | null = null;
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

          const rawEntries: [string, PricingItemInput][] = Array.from(pricingData.entries()).map(([id, data]) => {
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
          console.warn('⚠️ Engine authoring enrichment failed, falling back to legacy only', e);
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
              return {
                ...viewItem,
                unitPrice: engine.unitPrice,
                totalPrice: engine.breakdown.total,
                breakdown: engine.breakdown,
                isPriced: engine.isPriced
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
      pricingDataSyncService.forceSyncTender(tender.id).then(success => {
        if (success) {
          console.log('✅ [TenderPricingProcess] تمت مزامنة البيانات مع النظام المركزي')
        }
      }).catch(error => {
        console.warn('⚠️ [TenderPricingProcess] فشل في مزامنة البيانات:', error)
      });
      
      console.log('🔔 [TenderPricingProcess] تم إرسال حدث تحديث البيانات:', {
        tenderId: tender.id,
        items: quantityTableWithPricing.length,
        engineAuthoring: PRICING_FLAGS.USE_ENGINE_AUTHORING
      });

      // (Legacy Dual-Write Removed 2025-09): حذف مسار dualWritePricing.
    } catch (error) {
      console.error('❌ [TenderPricingProcess] خطأ في إرسال إشعار التحديث:', error);
    }
  }, [
    defaultPercentages,
    domainPricing.enabled,
    domainPricing.status,
    pricingData,
    pricingViewItems,
    quantityItems,
    tender.id
  ]);

  /**
   * Isolated legacy arithmetic for a single item (Phase 2 - will be paralleled by engine path)
   */
  // (Legacy Removal) تم حذف legacyAuthoringCompute والمسار القديم؛ إذا ظهر احتياج مستقبلي لقياس فروقات يمكن استعمال pricingRuntime + لقطات snapshots.

  // تحميل بيانات التسعير الافتراضية عند فتح الصفحة لأول مرة
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const loaded = await pricingService.loadTenderPricing(tender.id);
        if (!mounted) return;
        if (loaded) {
          const entries = Array.isArray(loaded.pricing)
            ? loaded.pricing.filter(isPricingEntry)
            : [];
          setPricingData(new Map(entries));
          if (loaded.defaultPercentages) {
            setDefaultPercentages(loaded.defaultPercentages);
            setDefaultPercentagesInput({
              administrative: String(loaded.defaultPercentages.administrative ?? ''),
              operational: String(loaded.defaultPercentages.operational ?? ''),
              profit: String(loaded.defaultPercentages.profit ?? ''),
            });
          }
        } else {
          setPricingData(new Map());
        }
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, [tender.id]);

  // إرسال إشعار تحديث عند تغيير بيانات التسعير
  useEffect(() => {
    if (isLoaded && pricingData.size > 0) {
      // تأخير قصير لضمان اكتمال تحديث البيانات
      const timeoutId = setTimeout(() => {
        notifyPricingUpdate();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [pricingData, isLoaded, notifyPricingUpdate]);

  const currentItem = quantityItems[currentItemIndex];
  const currentItemId = currentItem?.id;
  const [currentPricing, setCurrentPricing] = useState<PricingData>({
    materials: [],
    labor: [],
    equipment: [],
    subcontractors: [],
    technicalNotes: '',
    additionalPercentages: {
      administrative: 5,
      operational: 5,
      profit: 15
    },
    completed: false
  });

  // تحميل بيانات التسعير للبند الحالي أو تهيئة بنود جديدة بالنسب الافتراضية
  useEffect(() => {
    if (!currentItem) return;
    const saved = pricingData.get(currentItem.id);
    if (saved) {
      setCurrentPricing(saved);
    } else {
      setCurrentPricing({
        materials: [],
        labor: [],
        equipment: [],
        subcontractors: [],
        technicalNotes: '',
        additionalPercentages: {
          administrative: defaultPercentages.administrative,
          operational: defaultPercentages.operational,
          profit: defaultPercentages.profit,
        },
        completed: false,
      });
    }
  }, [currentItem, pricingData, defaultPercentages]);

  // حساب الإجماليات
  const calculateTotals = useCallback(() => {
    const materialsTotal = currentPricing.materials.reduce((sum, item) => sum + item.total, 0);
    const laborTotal = currentPricing.labor.reduce((sum, item) => sum + item.total, 0);
    const equipmentTotal = currentPricing.equipment.reduce((sum, item) => sum + item.total, 0);
    const subcontractorsTotal = currentPricing.subcontractors.reduce((sum, item) => sum + item.total, 0);
    
    const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal;
    const administrativeCost = subtotal * (currentPricing.additionalPercentages?.administrative || 0) / 100;
    const operationalCost = subtotal * (currentPricing.additionalPercentages?.operational || 0) / 100;
    const profitCost = subtotal * (currentPricing.additionalPercentages?.profit || 0) / 100;
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
      total: finalTotal
    };
  }, [currentPricing]);
  // حساب متوسط النسب المستخدمة
  const calculateAveragePercentages = useCallback(() => {
    let totalAdmin = 0, totalOperational = 0, totalProfit = 0;
    let count = 0;

    pricingData.forEach((itemPricing) => {
      const adminPercentage = itemPricing.additionalPercentages?.administrative ?? defaultPercentages.administrative;
      const operationalPercentage = itemPricing.additionalPercentages?.operational ?? defaultPercentages.operational;
      const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit;
      
      totalAdmin += adminPercentage;
      totalOperational += operationalPercentage;
      totalProfit += profitPercentage;
      count++;
    });

    if (count === 0) {
      return {
        administrative: defaultPercentages.administrative,
        operational: defaultPercentages.operational,
        profit: defaultPercentages.profit
      };
    }

    return {
      administrative: totalAdmin / count,
      operational: totalOperational / count,
      profit: totalProfit / count
    };
  }, [pricingData, defaultPercentages]);

  const persistPricingAndBOQ = useCallback(async (map: Map<string, PricingData>) => {
    const normalizeString = (value: unknown): string => {
      if (value == null) return '';
      return typeof value === 'string' ? value.trim() : String(value).trim();
    };

    const round2 = (value: number): number => Math.round(value * 100) / 100;
    const isMeaningfulDescription = (value: string): boolean =>
      value.length > 0 && !/^البند\s*\d+$/i.test(value) && !/^بند\s*\d+$/i.test(value) && !/غير\s*محدد/.test(value);

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

      console.log('[TenderPricingProcess] Persisting BOQ with detailed data:', {
        tenderId: tender.id,
        itemsCount: items.length,
        totalValue: formatCurrencyValue(totalValue),
        existingBOQ: Boolean(existing),
        sampleItem: items[0]
          ? {
              id: items[0].id,
              totalPrice: items[0].totalPrice,
              breakdown: items[0].breakdown
            }
          : null
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

      await boqRepository.createOrUpdate(payload);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('boqUpdated', {
            detail: { tenderId: tender.id, totalValue, itemsCount: items.length }
          })
        );
      }
    } catch (error) {
      console.warn('Failed to persist tender BOQ snapshot', error);
    }
  }, [defaultPercentages, formatCurrencyValue, quantityItems, tender.id]);

  // تطبيق النسب الافتراضية على البنود الموجودة
  const applyDefaultPercentagesToExistingItems = useCallback(() => {
    const updatedPricingData = new Map<string, PricingData>(pricingData);
    let updatedCount = 0;

    pricingData.forEach((itemPricing, itemId) => {
      const updatedPricing: PricingData = {
        ...itemPricing,
        additionalPercentages: {
          administrative: defaultPercentages.administrative,
          operational: defaultPercentages.operational,
          profit: defaultPercentages.profit
        }
      };

      updatedPricingData.set(itemId, updatedPricing);
      if (currentItem?.id === itemId) {
        setCurrentPricing(updatedPricing);
      }
      updatedCount += 1;
    });

    setPricingData(updatedPricingData);
    void pricingService.saveTenderPricing(tender.id, {
      pricing: Array.from(updatedPricingData.entries()),
      defaultPercentages,
      lastUpdated: new Date().toISOString()
    });
    void persistPricingAndBOQ(updatedPricingData);

    try {
      editablePricing.markDirty?.();
    } catch (error) {
      console.warn('⚠️ markDirty after defaults propagation failed', error);
    }

    toast.success(`تم تحديث النسب لـ ${updatedCount} بند`, {
      description: 'تم تطبيق النسب الافتراضية الجديدة على جميع البنود الموجودة',
      duration: 4000
    });
  }, [
    currentItem,
    defaultPercentages,
    editablePricing,
    persistPricingAndBOQ,
    pricingData,
    setCurrentPricing,
    setPricingData,
    tender.id
  ]);

  // حفظ النسب الافتراضية عند تعديلها لضمان اعتمادها للبنود الجديدة والجلسات القادمة
  useEffect(() => {
    if (!isLoaded) return;

    const previousDefaults = previousDefaultsRef.current;
    const defaultsChanged =
      previousDefaults.administrative !== defaultPercentages.administrative ||
      previousDefaults.operational !== defaultPercentages.operational ||
      previousDefaults.profit !== defaultPercentages.profit;

    let mapForPersistence: Map<string, PricingData> = pricingData;

    if (defaultsChanged && pricingData.size > 0) {
      const { updated, changedCount } = applyDefaultsToPricingMap(pricingData, previousDefaults, defaultPercentages);
      if (changedCount > 0) {
        mapForPersistence = updated;
        setPricingData(updated);
        void persistPricingAndBOQ(updated);
        console.info(`[PricingProcess] 🟢 Auto-propagated new default percentages to ${changedCount} items bound to old defaults.`);
      } else {
        void persistPricingAndBOQ(pricingData);
        console.info('[PricingProcess] ℹ️ Defaults changed but no items matched previous defaults (all customized).');
      }
    } else {
      void persistPricingAndBOQ(pricingData);
    }

    previousDefaultsRef.current = { ...defaultPercentages };

    void pricingService.saveTenderPricing(tender.id, {
      pricing: Array.from(mapForPersistence.entries()),
      defaultPercentages,
      lastUpdated: new Date().toISOString()
    });
    // (Legacy Snapshot System Removed 2025-09): حذف منطق إنشاء/ترحيل snapshot نهائياً.
  }, [defaultPercentages, isLoaded, persistPricingAndBOQ, pricingData, tender.id]);

  // ملاحظة: تم إزالة دالة تنسيق العملة غير المستخدمة بعد تبسيط بطاقات الملخص.

  const calculateItemsTotal = useCallback(() => {
    let projectTotal = 0;
    quantityItems.forEach(item => {
      const itemPricing = pricingData.get(item.id);
      if (!itemPricing) return;
      const itemTotals = {
        materials: itemPricing.materials.reduce((sum, mat) => sum + mat.total, 0),
        labor: itemPricing.labor.reduce((sum, lab) => sum + lab.total, 0),
        equipment: itemPricing.equipment.reduce((sum, eq) => sum + eq.total, 0),
        subcontractors: itemPricing.subcontractors.reduce((sum, sub) => sum + sub.total, 0)
      };
      const subtotal = itemTotals.materials + itemTotals.labor + itemTotals.equipment + itemTotals.subcontractors;
      const adminPercentage = itemPricing.additionalPercentages?.administrative ?? defaultPercentages.administrative;
      const operationalPercentage = itemPricing.additionalPercentages?.operational ?? defaultPercentages.operational;
      const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit;
      const administrative = subtotal * adminPercentage / 100;
      const operational = subtotal * operationalPercentage / 100;
      const profit = subtotal * profitPercentage / 100;
      projectTotal += subtotal + administrative + operational + profit;
    });
    return projectTotal;
  }, [quantityItems, pricingData, defaultPercentages]);

  // حساب ضريبة القيمة المضافة 15%
  const calculateVAT = useCallback(() => {
    return calculateItemsTotal() * 0.15;
  }, [calculateItemsTotal]);

  // حساب إجمالي قيمة المشروع مع ضريبة القيمة المضافة
  const calculateProjectTotal = useCallback(() => {
    const itemsTotal = calculateItemsTotal();
    const vat = calculateVAT();
    return itemsTotal + vat;
  }, [calculateItemsTotal, calculateVAT]);

  // (Official/Draft MVP) تجميع مبسط لعناصر التسعير الحالية لاستخدامه عند حفظ المسودة أو النسخة الرسمية
  const buildDraftPricingItems = useCallback((): DraftPricingItem[] => {
    try {
      return pricingViewItems.map((item): DraftPricingItem => ({
        id: item.id,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        breakdown: item.breakdown ?? undefined
      }));
    } catch (error) {
      console.warn('⚠️ فشل بناء عناصر المسودة', error);
      return [];
    }
  }, [pricingViewItems]);

  // حساب إجمالي التكاليف الإدارية
  const calculateTotalAdministrative = useCallback(() => {
    if (PRICING_FLAGS.USE_DOMAIN_PRICING_UI && domainPricing.enabled && domainPricing.status === 'ready') {
      return pricingViewItems.reduce((sum, item) => sum + (item.breakdown?.administrative ?? 0), 0);
    }
    let totalAdministrative = 0;
    pricingViewItems.forEach(item => {
      totalAdministrative += item.breakdown?.administrative ?? 0;
    });
    return totalAdministrative;
  }, [pricingViewItems, domainPricing]);

  // حساب إجمالي التكاليف التشغيلية
  const calculateTotalOperational = useCallback(() => {
    if (PRICING_FLAGS.USE_DOMAIN_PRICING_UI && domainPricing.enabled && domainPricing.status === 'ready') {
      return pricingViewItems.reduce((sum, item) => sum + (item.breakdown?.operational ?? 0), 0);
    }
    let totalOperational = 0;
    pricingViewItems.forEach(item => {
      totalOperational += item.breakdown?.operational ?? 0;
    });
    return totalOperational;
  }, [pricingViewItems, domainPricing]);

  // حساب إجمالي الأرباح
  const calculateTotalProfit = useCallback(() => {
    let totalProfit = 0;
    quantityItems.forEach(item => {
      const itemPricing = pricingData.get(item.id);
      if (itemPricing) {
        // استخدام الدالة المحفوظة للحصول على القيم المحسوبة
        const itemTotals = {
          materials: itemPricing.materials.reduce((sum, mat) => sum + mat.total, 0),
          labor: itemPricing.labor.reduce((sum, lab) => sum + lab.total, 0),
          equipment: itemPricing.equipment.reduce((sum, eq) => sum + eq.total, 0),
          subcontractors: itemPricing.subcontractors.reduce((sum, sub) => sum + sub.total, 0)
        };
        const subtotal = itemTotals.materials + itemTotals.labor + itemTotals.equipment + itemTotals.subcontractors;
        // استخدام النسب الافتراضية الجديدة إذا لم تكن محددة لهذا البند
        const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit;
        const profit = subtotal * profitPercentage / 100;
        totalProfit += profit;
      }
    });
    return totalProfit;
  }, [quantityItems, pricingData, defaultPercentages.profit]);

  // تحديث حالة المنافسة مع تتبع التقدم المستمر وتجنب التحديث المكرر
  const updateTenderStatus = useCallback(() => {
    const completedCount = Array.from(pricingData.values()).filter(value => value?.completed).length;
    const completionPercentage = quantityItems.length > 0 ? (completedCount / quantityItems.length) * 100 : 0;
    const totalValue = calculateProjectTotal();

    const storedFiles = safeLocalStorage.getItem<StoredTechnicalFile[]>('tender_technical_files', []);
    const hasTechnicalFilesFromStorage = Array.isArray(storedFiles)
      ? storedFiles.some(file => file?.tenderId === tender.id)
      : false;
    const hasTechnicalFiles = hasTechnicalFilesFromStorage || Boolean(tender.technicalFilesUploaded);

    let status: Tender['status'] = 'under_action';
    let pricingStatus: PricingProgressStatus = 'in_progress';

    if (completionPercentage === 100 && hasTechnicalFiles) {
      status = 'ready_to_submit';
      pricingStatus = 'completed';
    }

    const currentState: PricingStatusSnapshot = {
      status,
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

    const updatedAt = new Date().toISOString();

    const persistencePayload: Partial<Tender> = {
      status,
      completionPercentage: Math.round(completionPercentage * 100) / 100,
      totalValue,
      itemsPriced: completedCount,
      pricedItems: completedCount,
      totalItems: quantityItems.length,
      technicalFilesUploaded: hasTechnicalFiles,
      lastUpdate: updatedAt
    };

    updateTender(tender.id, persistencePayload).catch(error => {
      console.error('تعذر تحديث بيانات المنافسة بعد مزامنة التسعير', error);
    });

    const broadcastPayload: TenderWithPricingSources = {
      ...tender,
      ...persistencePayload,
      lastUpdated: updatedAt,
      pricingStatus
    };

    if (typeof window !== 'undefined') {
      emit(APP_EVENTS.TENDERS_UPDATED, { tenderId: tender.id, updatedTender: broadcastPayload });
    }

    console.log('🔄 تم تحديث حالة المنافسة:', {
      tenderId: tender.id,
      status,
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
  }, [pricingData, quantityItems, tender, calculateProjectTotal, updateTender]);

  // حفظ البيانات بشكل تلقائي مع debounce
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
          console.warn('⚠️ Failed to compare pricing data before autosave', error);
        }

        const newMap = new Map(pricingData);
        newMap.set(currentItemId, data);
        setPricingData(newMap);

        void pricingService.saveTenderPricing(tender.id, {
          pricing: Array.from(newMap.entries()),
          defaultPercentages,
          lastUpdated: new Date().toISOString()
        });
        // تحديث لقطة BOQ المركزية فور أي تعديل تسعير
        void persistPricingAndBOQ(newMap);
        // (Legacy Snapshot Removed) لم يعد يتم إنشاء snapshot تلقائي.
      }, 2000),
    [currentItemId, tender.id, defaultPercentages, pricingData, isLoaded, persistPricingAndBOQ]
  );

  // حفظ يدوي للبند الحالي مع رسالة تأكيد وتحقق من صحة البيانات
  const saveCurrentItem = useCallback(() => {
    if (currentItem && isLoaded) {
      const totals = calculateTotals();
      // التحقق من وجود بيانات التسعير
      const hasData = currentPricing.materials.length > 0 || 
                     currentPricing.labor.length > 0 || 
                     currentPricing.equipment.length > 0 || 
                     currentPricing.subcontractors.length > 0;
      
      if (!hasData) {
        toast.error('لا توجد بيانات للحفظ', {
          description: 'يرجى إضافة بيانات التسعير قبل الحفظ',
          duration: 4000,
        });
        return;
      }

      // تأكيد وسم البند كمكتمل فقط عند الحفظ الصريح
      const itemToSave: PricingData = { ...currentPricing, completed: true };
      const newMap = new Map(pricingData);
      newMap.set(currentItem.id, itemToSave);
      setPricingData(newMap);
      setCurrentPricing(itemToSave);
      
      // حساب التفاصيل المالية
      const itemTotals = {
        materials: itemToSave.materials.reduce((sum, mat) => sum + (mat.total || 0), 0),
        labor: itemToSave.labor.reduce((sum, lab) => sum + (lab.total || 0), 0),
        equipment: itemToSave.equipment.reduce((sum, eq) => sum + (eq.total || 0), 0),
        subcontractors: itemToSave.subcontractors.reduce((sum, sub) => sum + (sub.total || 0), 0)
      };
      
      const subtotal = Object.values(itemTotals).reduce((sum, val) => sum + val, 0);
      const unitPrice = totals.total / currentItem.quantity;
      
      // حفظ في قاعدة البيانات
      void pricingService.saveTenderPricing(tender.id, {
        pricing: Array.from(newMap.entries()),
        defaultPercentages,
        lastUpdated: new Date().toISOString()
      });
      // مزامنة لقطة BOQ المركزية بعد الحفظ اليدوي
      void persistPricingAndBOQ(newMap);
      // (Legacy Snapshot Removed) حذف إنشاء snapshot اليدوي.

      // حفظ تفاصيل البند في التخزين الموحد للتطبيق
      void saveToStorage(`tender-${tender.id}-pricing-item-${currentItem.id}`, {
        tenderId: tender.id,
        tenderTitle,
        itemId: currentItem.id,
        itemNumber: currentItem.itemNumber,
        description: currentItem.description,
        specifications: currentItem.specifications,
    unit: currentItem.unit,
    quantity: currentItem.quantity,
    pricingData: itemToSave,
        breakdown: itemTotals,
        subtotal: subtotal,
        additionalCosts: {
          administrative: totals.administrative,
          operational: totals.operational,
          profit: totals.profit
        },
        unitPrice: unitPrice,
        totalValue: totals.total,
        executionMethod: currentPricing.executionMethod ?? 'ذاتي',
        technicalNotes: currentPricing.technicalNotes ?? '',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: 'completed',
        version: 1 // لتتبع إصدارات التسعير
      });

      // تحديث إحصائيات المنافسة
      const completionPercentage = ((newMap.size / quantityItems.length) * 100);
      const projectTotal = calculateProjectTotal();
      const statsPayload: TenderStatsPayload = {
        totalItems: quantityItems.length,
        pricedItems: newMap.size,
        completionPercentage: completionPercentage,
        totalValue: projectTotal,
        averageUnitPrice: projectTotal / quantityItems.reduce((sum, item) => sum + item.quantity, 0),
        lastUpdated: new Date().toISOString()
      };
      // حفظ الإحصائيات بشكل مجمّع تحت STORAGE_KEYS.TENDER_STATS
      void (async () => {
        const allStats = await loadFromStorage<TenderStatsRecord>(STORAGE_KEYS.TENDER_STATS, {});
        allStats[tender.id] = statsPayload;
        await saveToStorage(STORAGE_KEYS.TENDER_STATS, allStats);
      })();

      // عرض رسالة تأكيد مفصلة
      toast.success('تم الحفظ بنجاح', {
        description: `تم حفظ تسعير البند رقم ${currentItem.itemNumber} - القيمة: ${formatCurrencyValue(totals.total)}`,
        duration: 4000,
      });

      // إرسال إشعار تحديث للصفحات الأخرى (مثل صفحة تفاصيل المنافسة)
      notifyPricingUpdate();

      // تحديث حالة المنافسة فوراً بعد حفظ البند
      setTimeout(() => {
        updateTenderStatus();
      }, 100);
    }
  }, [currentItem, currentPricing, pricingData, tender.id, isLoaded, quantityItems, calculateTotals, calculateProjectTotal, defaultPercentages, notifyPricingUpdate, persistPricingAndBOQ, updateTenderStatus, tenderTitle, formatCurrencyValue]);

  // تشغيل الحفظ التلقائي عند تغيير البيانات
  useEffect(() => {
    if (isLoaded && currentItemId) {
      debouncedSave(currentPricing);
    }
  }, [currentPricing, debouncedSave, isLoaded, currentItemId]);

  // (Official/Draft MVP) حفظ مسودة تلقائي (debounced على مستوى الخريطة الكاملة)
  useEffect(() => {
    if (!isLoaded) return;
  if (editablePricing.status !== 'ready') return;
  if (pricingData.size === 0) return;
    const t = setTimeout(() => {
      try {
        const items = buildDraftPricingItems();
        const totals = { totalValue: calculateProjectTotal() };
        if (editablePricing.saveDraft) {
          void editablePricing.saveDraft(items, totals, 'auto');
        }
      } catch (e) { console.warn('⚠️ autosave draft failed', e); }
    }, 1500);
    return () => clearTimeout(t);
  }, [pricingData, isLoaded, editablePricing, buildDraftPricingItems, calculateProjectTotal]);

  // (Official/Draft MVP) حفظ مسودة دوري كل 45 ثانية
  useEffect(() => {
    if (!isLoaded) return;
    if (editablePricing.status !== 'ready') return;
    const interval = setInterval(() => {
      try {
        const items = buildDraftPricingItems();
        const totals = { totalValue: calculateProjectTotal() };
        if (editablePricing.saveDraft) {
          void editablePricing.saveDraft(items, totals, 'auto');
        }
      } catch (e) { console.warn('⚠️ periodic draft save failed', e); }
    }, 45000);
    return () => clearInterval(interval);
  }, [isLoaded, editablePricing, buildDraftPricingItems, calculateProjectTotal]);

  // تحذير عند محاولة مغادرة الصفحة مع تغييرات غير معتمدة رسمياً
  useEffect(() => {
    if (editablePricing.status !== 'ready') return;
    if (editablePricing.status !== 'ready') return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editablePricing.dirty || editablePricing.isDraftNewer) {
        const message = confirmationMessages.leaveDirty.description;
        e.preventDefault();
        e.returnValue = message; // لبعض المتصفحات
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editablePricing]);

  // تحديث حالة المنافسة عند تحميل المكون لأول مرة فقط
  useEffect(() => {
    if (isLoaded) {
      console.log('📋 تم تحميل صفحة التسعير - سيتم تحديث حالة المنافسة...');
      // تأخير بسيط للتأكد من تحميل جميع البيانات
      const timeoutId = setTimeout(() => {
        updateTenderStatus();
        updateTenderStatus();
        // إظهار رسالة للمستخدم
        toast.info('تم بدء عملية التسعير', {
          description: `تم تحديث حالة المنافسة "${tenderTitle}" إلى "تحت الإجراء"`,
          duration: 3000,
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoaded, tenderTitle, updateTenderStatus]);

  const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const toNonNegativeNumber = (input: unknown): number => {
    const parsed = Number(input);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  };

  const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

  const calculateRowTotal = (
    type: PricingSection,
    row: MaterialRow | LaborRow | EquipmentRow | SubcontractorRow
  ): number => {
    const quantity = toNonNegativeNumber(row.quantity);
    const price = toNonNegativeNumber(row.price ?? 0);

    if (type === 'materials') {
      const materialRow = row as MaterialRow;
      const wastePercentage = materialRow.hasWaste
        ? clampValue(toNonNegativeNumber(materialRow.wastePercentage ?? 0), 0, 100)
        : 0;
      const wasteMultiplier = materialRow.hasWaste ? 1 + wastePercentage / 100 : 1;
      return roundToTwoDecimals(quantity * price * wasteMultiplier);
    }

    return roundToTwoDecimals(quantity * price);
  };

  const recalculateRow = <Section extends PricingSection>(
    type: Section,
    row: SectionRowMap[Section]
  ): SectionRowMap[Section] => ({
    ...row,
    total: calculateRowTotal(type, row),
  });

  const sanitizeRowValue = <Section extends PricingSection, Field extends SectionRowField<Section>>(
    type: Section,
    field: Field,
    value: SectionRowMap[Section][Field]
  ): SectionRowMap[Section][Field] => {
    if (field === 'quantity' || field === 'price') {
      return toNonNegativeNumber(value) as SectionRowMap[Section][Field];
    }

    if (type === 'materials' && field === 'wastePercentage') {
      const sanitized = clampValue(toNonNegativeNumber(value), 0, 100);
      return sanitized as SectionRowMap[Section][Field];
    }

    return value;
  };

  const mutateSectionRows = <Section extends PricingSection>(
    data: PricingData,
    section: Section,
    mutate: (rows: SectionRowMap[Section][]) => SectionRowMap[Section][]
  ): PricingData => {
    switch (section) {
      case 'materials':
        return { ...data, materials: mutate(data.materials) };
      case 'labor':
        return { ...data, labor: mutate(data.labor) };
      case 'equipment':
        return { ...data, equipment: mutate(data.equipment) };
      case 'subcontractors':
        return { ...data, subcontractors: mutate(data.subcontractors) };
      default:
        return data;
    }
  };

  // إنشاء صف فارغ
  const createEmptyRow = <Section extends PricingSection>(type: Section): SectionRowMap[Section] => {
    const baseRow: PricingRow = {
      id: Date.now().toString(),
      description: '',
      unit: 'وحدة',
      quantity: 1,
      price: 0,
      total: 0,
    };

    if (type === 'materials') {
      const materialRow: MaterialRow = {
        ...baseRow,
        name: '',
        hasWaste: false,
        wastePercentage: 10,
      };
      return materialRow as SectionRowMap[Section];
    }

    return baseRow as SectionRowMap[Section];
  };

  // إضافة صف جديد
  const addRow = <Section extends PricingSection>(type: Section) => {
    setCurrentPricing(prev =>
      mutateSectionRows(prev, type, rows => {
        const newRow = createEmptyRow(type);
        if ((type === 'materials' || type === 'subcontractors') && currentItem) {
          newRow.quantity = currentItem.quantity;
        }
        return [...rows, recalculateRow(type, newRow)];
      })
    );
    markDirty();

    // تحديث فوري للحالة عند إضافة أول صف (يعني بدء العمل)
    setTimeout(() => {
      updateTenderStatus();
    }, 100);
  };

  // حذف صف
  const deleteRow = <Section extends PricingSection>(type: Section, id: string) => {
    setCurrentPricing(prev =>
      mutateSectionRows(prev, type, rows => rows.filter(row => row.id !== id))
    );
    markDirty();
  };

  // تحديث صف مع معالجة محسنة للأخطاء والتحقق من صحة البيانات
  const updateRow = <Section extends PricingSection, Field extends SectionRowField<Section>>(
    type: Section,
    id: string,
    field: Field,
    value: SectionRowMap[Section][Field]
  ) => {
    try {
      setCurrentPricing(prev =>
        mutateSectionRows(prev, type, rows =>
          rows.map(row => {
            if (row.id !== id) {
              return row;
            }

            const sanitizedValue = sanitizeRowValue(type, field, value);
            const nextRow: SectionRowMap[Section] = {
              ...row,
              [field]: sanitizedValue,
            };

            if (type === 'materials') {
              const materialRow = nextRow as MaterialRow;
              if (field === 'hasWaste' && !sanitizedValue) {
                materialRow.hasWaste = false;
                materialRow.wastePercentage = 0;
              }
            }

            return recalculateRow(type, nextRow);
          })
        )
      );

      // تحديث فوري للحالة بعد تعديل البيانات
      setTimeout(() => {
        updateTenderStatus();
      }, 200);
      markDirty();
    } catch (error) {
      console.error('خطأ في تحديث البيانات:', error);
      toast.error('خطأ في تحديث البيانات', {
        description: 'حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى.',
        duration: 4000,
      });
    }
  };

  // حفظ نسخة احتياطية من البيانات
  const createBackup = useCallback(async () => {
    const payload: TenderPricingBackupPayload = {
      tenderId: tender.id,
      tenderTitle,
      pricing: Array.from(pricingData.entries()),
      quantityItems,
      completionPercentage:
        quantityItems.length > 0 ? (pricingData.size / quantityItems.length) * 100 : 0,
      totalValue: calculateProjectTotal(),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    try {
      await createTenderPricingBackup(payload, {
        actor: 'tender-pricing-ui',
        origin: 'renderer'
      });
      const updatedEntries = await listTenderBackupEntries(tender.id);
      setBackupsList(updatedEntries);
      toast.success('تم إنشاء نسخة احتياطية', {
        description: 'تم حفظ نسخة احتياطية من البيانات بنجاح',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      const reason = error instanceof Error ? error.message : 'unknown-error';
      await noteBackupFailure(tender.id, reason, {
        actor: 'tender-pricing-ui',
        origin: 'renderer'
      });
      toast.error('فشل إنشاء النسخة الاحتياطية', {
        description: 'تعذر حفظ النسخة الاحتياطية. يرجى المحاولة لاحقاً.',
        duration: 4000,
      });
    }
  }, [tender.id, tenderTitle, pricingData, quantityItems, calculateProjectTotal]);

  // تحميل قائمة النسخ الاحتياطية عند فتح نافذة الاسترجاع
  const loadBackupsList = useCallback(async () => {
    const entries = await listTenderBackupEntries(tender.id);
    setBackupsList(entries);
  }, [tender.id]);

  // استرجاع نسخة احتياطية
  const restoreBackup = useCallback(async (entryId: string) => {
    const snapshot = await restoreTenderBackup(tender.id, entryId, {
      actor: 'tender-pricing-ui',
      origin: 'renderer'
    });

    if (!snapshot) {
      toast.error('تعذر العثور على النسخة الاحتياطية');
      return;
    }

    try {
      const restoredMap = new Map<string, PricingData>(snapshot.pricing as [string, PricingData][]);
      setPricingData(restoredMap);
      await pricingService.saveTenderPricing(tender.id, {
        pricing: Array.from(restoredMap.entries()),
        defaultPercentages,
        lastUpdated: new Date().toISOString(),
      });
      // مزامنة لقطة BOQ المركزية بعد الاسترجاع
      await persistPricingAndBOQ(restoredMap);
      toast.success('تم استرجاع النسخة بنجاح');
      setRestoreOpen(false);
      void loadBackupsList();
    } catch (e) {
      console.error('Restore failed:', e);
      toast.error('فشل استرجاع النسخة الاحتياطية');
    }
  }, [tender.id, defaultPercentages, persistPricingAndBOQ, loadBackupsList]);

  // تصدير البيانات إلى Excel
  const exportPricingToExcel = useCallback(() => {
    try {
      const exportData = quantityItems.map(item => {
        const itemPricing = pricingData.get(item.id);
        const totals = {
          materials: (itemPricing?.materials ?? []).reduce((sum, mat) => sum + (mat.total ?? 0), 0),
          labor: (itemPricing?.labor ?? []).reduce((sum, lab) => sum + (lab.total ?? 0), 0),
          equipment: (itemPricing?.equipment ?? []).reduce((sum, eq) => sum + (eq.total ?? 0), 0),
          subcontractors: (itemPricing?.subcontractors ?? []).reduce((sum, sub) => sum + (sub.total ?? 0), 0)
        };
        
  const subtotal = totals.materials + totals.labor + totals.equipment + totals.subcontractors;
  const unitPrice = itemPricing ? subtotal / item.quantity : 0;
        
        return {
          'رقم البند': item.itemNumber,
          'وصف البند': item.description,
          'الوحدة': item.unit,
          'الكمية': item.quantity,
          'سعر الوحدة': unitPrice.toFixed(2),
          'القيمة الإجمالية': subtotal.toFixed(2),
          'حالة التسعير': itemPricing ? 'مكتمل' : 'لم يبدأ'
        };
      });

      // هنا يمكن إضافة منطق التصدير الفعلي
      toast.info('جاري تطوير وظيفة التصدير', {
        description: 'هذه الوظيفة قيد التطوير وستكون متاحة قريباً',
        duration: 4000,
      });
      
      console.log('بيانات التصدير:', exportData);
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      toast.error('خطأ في التصدير', {
        description: 'حدث خطأ أثناء إعداد البيانات للتصدير',
        duration: 4000,
      });
    }
  }, [quantityItems, pricingData]);

  // عرض ملخص المشروع
  const renderSummary = () => {
    const projectTotal = calculateProjectTotal();
  const completedCount = Array.from(pricingData.values()).filter(value => value?.completed).length;
    const completionPercentage = (completedCount / quantityItems.length) * 100;

    return (
      <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">
        <div className="space-y-3 p-1 pb-20" dir="rtl">
          {/* تحذير للبيانات التجريبية */}
          {quantityItems.length <= 5 && quantityItems[0]?.id === '1' && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">تحذير: يتم عرض بيانات تجريبية</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  لم يتم العثور على جدول الكميات الحقيقي للمنافسة. يرجى التأكد من إرفاق ملف الكميات الصحيح.
                </p>
              </CardContent>
            </Card>
          )}

          {/* إحصائيات المشروع (في الأعلى) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* بطاقة نسبة الإنجاز */}
            <Card className="border-blue-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">نسبة الإنجاز</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{completionPercentage.toFixed(1)}%</div>
                  <div className="text-[11px] text-gray-500">{completedCount} / {quantityItems.length} بند</div>
                </div>
              </CardContent>
            </Card>

            {/* بطاقة القيمة الإجمالية التقديرية */}
            <Card className="border-green-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">القيمة الإجمالية</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrencyValue(projectTotal, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </div>
                  <div className="text-[11px] text-gray-500">إجمالي تقديري</div>
                </div>
              </CardContent>
            </Card>

            {/* بطاقة البنود المسعّرة */}
            <Card className="border-amber-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">البنود المسعّرة</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-600">{pricingData.size}</div>
                  <div className="text-[11px] text-gray-500">من أصل {quantityItems.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* صف واحد: شريط النِسب + 3 بطاقات التكاليف */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
            {/* ratios toolbar as first column */}
            <div className="p-2 border rounded-md bg-blue-50 h-full overflow-hidden" role="region" aria-label="إدارة النسب الافتراضية">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="min-w-0">
                    <span className="block text-[11px] text-gray-600">الإدارية (%)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={defaultPercentagesInput.administrative}
                      onChange={(e) => setDefaultPercentagesInput(p => ({ ...p, administrative: e.target.value }))}
                      onBlur={(e) => {
                        const raw = e.target.value.replace(/,/g, '').trim();
                        const num = Number(raw);
                        const clamped = isNaN(num) ? defaultPercentages.administrative : Math.max(0, Math.min(100, num));
                        setDefaultPercentages(prev => ({ ...prev, administrative: clamped }));
                      }}
                      className="w-full h-8 px-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="النسبة الإدارية الافتراضية"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] text-gray-600">التشغيلية (%)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={defaultPercentagesInput.operational}
                      onChange={(e) => setDefaultPercentagesInput(p => ({ ...p, operational: e.target.value }))}
                      onBlur={(e) => {
                        const raw = e.target.value.replace(/,/g, '').trim();
                        const num = Number(raw);
                        const clamped = isNaN(num) ? defaultPercentages.operational : Math.max(0, Math.min(100, num));
                        setDefaultPercentages(prev => ({ ...prev, operational: clamped }));
                      }}
                      className="w-full h-8 px-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="النسبة التشغيلية الافتراضية"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] text-gray-600">الربح (%)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={defaultPercentagesInput.profit}
                      onChange={(e) => setDefaultPercentagesInput(p => ({ ...p, profit: e.target.value }))}
                      onBlur={(e) => {
                        const raw = e.target.value.replace(/,/g, '').trim();
                        const num = Number(raw);
                        const clamped = isNaN(num) ? defaultPercentages.profit : Math.max(0, Math.min(100, num));
                        setDefaultPercentages(prev => ({ ...prev, profit: clamped }));
                      }}
                      className="w-full h-8 px-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="نسبة الربح الافتراضية"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-600 whitespace-nowrap">تُطبق على البنود الجديدة</span>
                  <button
                    onClick={applyDefaultPercentagesToExistingItems}
                    title="تطبيق على البنود الموجودة"
                    aria-label="تطبيق على البنود الموجودة"
                    className="h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white rounded-md flex items-center justify-center"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* administrative cost card */}
            <Card className="hover:shadow-sm transition-shadow border-orange-200 h-full">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-xs font-medium text-orange-600">
                      التكاليف الإدارية ({calculateAveragePercentages().administrative.toFixed(1)}%)
                    </p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrencyValue(calculateTotalAdministrative(), {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </p>
                  </div>
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            {/* operational cost card */}
            <Card className="hover:shadow-sm transition-shadow border-purple-200 h-full">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-xs font-medium text-purple-600">
                      التكاليف التشغيلية ({calculateAveragePercentages().operational.toFixed(1)}%)
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrencyValue(calculateTotalOperational(), {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </p>
                  </div>
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            {/* profit card */}
            <Card className="hover:shadow-sm transition-shadow border-yellow-200 h-full">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-xs font-medium text-yellow-600">
                      إجمالي الأرباح ({calculateAveragePercentages().profit.toFixed(1)}%)
                    </p>
                    <p className="text-lg font-bold text-yellow-600">
                      {formatCurrencyValue(calculateTotalProfit(), {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* شريط التقدم */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="w-5 h-5 text-blue-600" />
                تقدم عملية التسعير
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>تم إنجاز {completedCount} من {quantityItems.length} بند</span>
                  <span>{completionPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                  {/* شريط التقدم بعرض ديناميكي */}
                  <div 
 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300 absolute top-0 left-0"
                    {...{style: {width: `${Math.min(Math.max(completionPercentage, 0), 100)}%`}}}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* عرض جدول الكميات الأساسي */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-green-600" />
                جدول كميات المنافسة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto border rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-gray-50 border-b">
                      <th className="border border-gray-200 p-3 text-right font-semibold">رقم البند</th>
                      <th className="border border-gray-200 p-3 text-right font-semibold">وصف البند</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">الوحدة</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">الكمية</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">سعر الوحدة</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">القيمة الإجمالية</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">حالة التسعير</th>
                      <th className="border border-gray-200 p-3 text-center font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quantityItems.map((item, index) => {
                      const itemPricing = pricingData.get(item.id);
                      const isCompleted = !!itemPricing?.completed;
                                          const materialsTotal = itemPricing?.materials?.reduce((sum, m) => sum + (m.total ?? 0), 0) ?? 0;
                      const laborTotal = itemPricing?.labor?.reduce((sum, l) => sum + (l.total ?? 0), 0) ?? 0;
                      const equipmentTotal = itemPricing?.equipment?.reduce((sum, e) => sum + (e.total ?? 0), 0) ?? 0;
                      const subcontractorsTotal = itemPricing?.subcontractors?.reduce((sum, s) => sum + (s.total ?? 0), 0) ?? 0;
                      const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal;
                      const adminPercentage = itemPricing?.additionalPercentages?.administrative ?? defaultPercentages.administrative;
                      const operationalPercentage = itemPricing?.additionalPercentages?.operational ?? defaultPercentages.operational;
                      const profitPercentage = itemPricing?.additionalPercentages?.profit ?? defaultPercentages.profit;
                      const administrative = subtotal * adminPercentage / 100;
                      const operational = subtotal * operationalPercentage / 100;
                      const profit = subtotal * profitPercentage / 100;
                      const itemTotal = subtotal + administrative + operational + profit;
                      const unitPrice = item.quantity ? itemTotal / item.quantity : 0;
                      const isInProgress = itemTotal > 0;

                      const hasAnyBreakdown = !!(itemPricing && (
                        (itemPricing.materials?.length || 0) > 0 ||
                        (itemPricing.labor?.length || 0) > 0 ||
                        (itemPricing.equipment?.length || 0) > 0 ||
                        (itemPricing.subcontractors?.length || 0) > 0
                      ));

                      return (
                        <React.Fragment key={item.id}>
                          <tr className={`hover:bg-gray-50 ${isCompleted ? 'bg-green-50' : (isInProgress ? 'bg-amber-50' : 'bg-red-50')}`}>
                            <td className="border border-gray-200 p-3 font-medium text-right">{item.itemNumber}</td>
                            <td className="border border-gray-200 p-3 text-right">
                              <div>
                                <div className="font-medium">{item.description}</div>
                                <div className="text-xs text-gray-500 mt-1">{item.specifications}</div>
                              </div>
                            </td>
                            <td className="border border-gray-200 p-3 text-center font-medium">{item.unit}</td>
                            <td className="border border-gray-200 p-3 text-center font-bold">
                              {item.quantity !== undefined && item.quantity !== null ? formatQuantity(item.quantity) : '-'}
                            </td>
                            <td className="border border-gray-200 p-3 text-center">
                              {isInProgress ? (
                                <span className="font-bold text-blue-600">
                                  {formatCurrencyValue(unitPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="border border-gray-200 p-3 text-center">
                              {isInProgress ? (
                                <span className="font-bold text-green-600">
                                  {formatCurrencyValue(itemTotal, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="border border-gray-200 p-3 text-center">
                              {isCompleted ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="w-3 h-3 ml-1" />
                                  تم التسعير
                                </Badge>
                              ) : isInProgress ? (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                  قيد التسعير
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  <AlertCircle className="w-3 h-3 ml-1" />
                                  لم يتم التسعير
                                </Badge>
                              )}
                            </td>
                            <td className="border border-gray-200 p-3 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCurrentItemIndex(index);
                                  setCurrentView('pricing');
                                }}
                                className="flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                {(isCompleted || isInProgress) ? 'تعديل' : 'تسعير'}
                              </Button>
                            </td>
                          </tr>

                          {hasAnyBreakdown && (
                            <tr className="bg-white">
                              <td colSpan={8} className="p-2 border-b">
                                <div className="space-y-2">
                                  {itemPricing?.materials?.length ? (
                                    <div>
                                      <div 
                                        className="flex items-center justify-between cursor-pointer hover:bg-blue-25 p-1 rounded"
                                        onClick={() => toggleCollapse(item.id, 'materials')}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="text-xs font-semibold text-blue-700">المواد ({itemPricing.materials.length} صنف)</div>
                                          <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                                            {formatCurrencyValue(itemPricing.materials.reduce((sum, m) => sum + (m.total || 0), 0), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </Badge>
                                        </div>
                                        {collapsedSections[item.id]?.materials ? 
                                          <ChevronUp className="w-4 h-4 text-blue-600" /> : 
                                          <ChevronDown className="w-4 h-4 text-blue-600" />
                                        }
                                      </div>
                                      {!collapsedSections[item.id]?.materials && (
                                        <div className="overflow-auto border rounded-md">
                                          <table className="w-full text-xs">
                                            <colgroup>
                                              <col className="w-[44%]" />
                                              <col className="w-[12%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[16%]" />
                                            </colgroup>
                                            <thead>
                                              <tr className="text-gray-700 bg-blue-50">
                                                <th className="text-right p-1">الاسم/الوصف</th>
                                                <th className="text-center p-1">الوحدة</th>
                                                <th className="text-center p-1">الكمية</th>
                                                <th className="text-center p-1">السعر</th>
                                                <th className="text-center p-1">الإجمالي</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {itemPricing.materials.map((m) => (
                                                <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                                                  <td className="p-1 text-right">{m.name ?? m.description}</td>
                                                  <td className="p-1 text-center">{m.unit}</td>
                                                  <td className="p-1 text-center">{m.quantity}</td>
                                                  <td className="p-1 text-center">{formatCurrencyValue(m.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                  <td className="p-1 text-center">{formatCurrencyValue(m.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  ) : null}

                                  {itemPricing?.labor?.length ? (
                                    <div>
                                      <div 
                                        className="flex items-center justify-between cursor-pointer hover:bg-emerald-25 p-1 rounded"
                                        onClick={() => toggleCollapse(item.id, 'labor')}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="text-xs font-semibold text-emerald-700">العمالة ({itemPricing.labor.length} نوع)</div>
                                          <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
                                            {formatCurrencyValue(itemPricing.labor.reduce((sum, l) => sum + (l.total || 0), 0), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </Badge>
                                        </div>
                                        {collapsedSections[item.id]?.labor ? 
                                          <ChevronUp className="w-4 h-4 text-emerald-600" /> : 
                                          <ChevronDown className="w-4 h-4 text-emerald-600" />
                                        }
                                      </div>
                                      {!collapsedSections[item.id]?.labor && (
                                        <div className="overflow-auto border rounded-md">
                                          <table className="w-full text-xs">
                                            <colgroup>
                                              <col className="w-[44%]" />
                                              <col className="w-[12%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[16%]" />
                                            </colgroup>
                                            <thead>
                                              <tr className="text-gray-700 bg-emerald-50">
                                                <th className="text-right p-1">الوصف</th>
                                                <th className="text-center p-1">الوحدة</th>
                                                <th className="text-center p-1">الكمية</th>
                                                <th className="text-center p-1">السعر</th>
                                                <th className="text-center p-1">الإجمالي</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {itemPricing.labor.map((l) => (
                                                <tr key={l.id} className="odd:bg-white even:bg-gray-50">
                                                  <td className="p-1 text-right">{l.description}</td>
                                                  <td className="p-1 text-center">{l.unit}</td>
                                                  <td className="p-1 text-center">{l.quantity}</td>
                                                  <td className="p-1 text-center">{formatCurrencyValue(l.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                  <td className="p-1 text-center">{formatCurrencyValue(l.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  ) : null}

                                  {itemPricing?.equipment?.length ? (
                                    <div>
                                      <div 
                                        className="flex items-center justify-between cursor-pointer hover:bg-orange-25 p-1 rounded"
                                        onClick={() => toggleCollapse(item.id, 'equipment')}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="text-xs font-semibold text-orange-700">المعدات ({itemPricing.equipment.length} معدة)</div>
                                          <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                            {formatCurrencyValue(itemPricing.equipment.reduce((sum, e) => sum + (e.total || 0), 0), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </Badge>
                                        </div>
                                        {collapsedSections[item.id]?.equipment ? 
                                          <ChevronUp className="w-4 h-4 text-orange-600" /> : 
                                          <ChevronDown className="w-4 h-4 text-orange-600" />
                                        }
                                      </div>
                                      {!collapsedSections[item.id]?.equipment && (
                                        <div className="overflow-auto border rounded-md">
                                          <table className="w-full text-xs">
                                            <colgroup>
                                              <col className="w-[44%]" />
                                              <col className="w-[12%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[16%]" />
                                            </colgroup>
                                            <thead>
                                              <tr className="text-gray-700 bg-orange-50">
                                                <th className="text-right p-1">الوصف</th>
                                                <th className="text-center p-1">الوحدة</th>
                                                <th className="text-center p-1">الكمية</th>
                                                <th className="text-center p-1">السعر</th>
                                                <th className="text-center p-1">الإجمالي</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {itemPricing.equipment.map((e) => (
                                                <tr key={e.id} className="odd:bg-white even:bg-gray-50">
                                                  <td className="p-1 text-right">{e.description}</td>
                                                  <td className="p-1 text-center">{e.unit}</td>
                                                  <td className="p-1 text-center">{e.quantity}</td>
                                                  <td className="p-1 text-center">{formatCurrencyValue(e.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                  <td className="p-1 text-center">{formatCurrencyValue(e.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  ) : null}

                                  {itemPricing?.subcontractors?.length ? (
                                    <div>
                                      <div 
                                        className="flex items-center justify-between cursor-pointer hover:bg-purple-25 p-1 rounded"
                                        onClick={() => toggleCollapse(item.id, 'subcontractors')}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="text-xs font-semibold text-purple-700">مقاولو الباطن ({itemPricing.subcontractors.length} مقاول)</div>
                                          <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">
                                            {formatCurrencyValue(itemPricing.subcontractors.reduce((sum, s) => sum + (s.total || 0), 0), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </Badge>
                                        </div>
                                        {collapsedSections[item.id]?.subcontractors ? 
                                          <ChevronUp className="w-4 h-4 text-purple-600" /> : 
                                          <ChevronDown className="w-4 h-4 text-purple-600" />
                                        }
                                      </div>
                                      {!collapsedSections[item.id]?.subcontractors && (
                                        <div className="overflow-auto border rounded-md">
                                          <table className="w-full text-xs">
                                            <colgroup>
                                              <col className="w-[44%]" />
                                              <col className="w-[12%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[16%]" />
                                            </colgroup>
                                            <thead>
                                              <tr className="text-gray-700 bg-purple-50">
                                                <th className="text-right p-1">الوصف</th>
                                                <th className="text-center p-1">الوحدة</th>
                                                <th className="text-center p-1">الكمية</th>
                                                <th className="text-center p-1">السعر</th>
                                                <th className="text-center p-1">الإجمالي</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {itemPricing.subcontractors.map((s) => (
                                                <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                                                  <td className="p-1 text-right">{s.description}</td>
                                                  <td className="p-1 text-center">{s.unit}</td>
                                                  <td className="p-1 text-center">{s.quantity}</td>
                                                  <td className="p-1 text-center">{formatCurrencyValue(s.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                  <td className="p-1 text-center">{formatCurrencyValue(s.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ملخص مالي */}
          {projectTotal > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-green-600" />
                  الملخص المالي للمشروع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">إجمالي قيمة البنود المُسعرة:</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrencyValue(calculateItemsTotal(), {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">
                        إجمالي التكاليف الإدارية ({calculateAveragePercentages().administrative.toFixed(1)}%):
                      </span>
                      <span className="font-bold text-orange-600">
                        {formatCurrencyValue(calculateTotalAdministrative(), {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">
                        إجمالي التكاليف التشغيلية ({calculateAveragePercentages().operational.toFixed(1)}%):
                      </span>
                      <span className="font-bold text-purple-600">
                        {formatCurrencyValue(calculateTotalOperational(), {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">ضريبة القيمة المضافة (15%):</span>
                      <span className="font-bold text-gray-600">
                        {formatCurrencyValue(calculateVAT(), {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium">
                        إجمالي الأرباح ({calculateAveragePercentages().profit.toFixed(1)}%):
                      </span>
                      <span className="font-bold text-yellow-600">
                        {formatCurrencyValue(calculateTotalProfit(), {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="font-bold text-lg">القيمة الإجمالية النهائية:</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrencyValue(calculateProjectTotal(), {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    );
  };

  // عرض صفحة التسعير التفصيلي
  const renderPricing = () => {
    if (!currentItem) return null;
    const totals = calculateTotals();

    return (
      <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">
        <div className="space-y-4 p-1 pb-24" dir="rtl">
          {/* معلومات البند الحالي (مضغوطة) */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="p-3">
              <CardTitle className="flex items-center justify-between text-base" dir="rtl">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">تسعير البند رقم {currentItem.itemNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                    disabled={currentItemIndex === 0}
                  >
                    البند السابق
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentItemIndex(Math.min(quantityItems.length - 1, currentItemIndex + 1))}
                    disabled={currentItemIndex === quantityItems.length - 1}
                  >
                    البند التالي
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3" dir="rtl">
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium text-gray-600">وصف البند</Label>
                  <p className="text-sm font-medium text-gray-900 text-right line-clamp-2">{currentItem.description}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">الوحدة</Label>
                  <p className="text-sm font-medium text-blue-600 text-right">{currentItem.unit}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">الكمية</Label>
                  <p className="text-sm font-bold text-green-600 text-right">{formatQuantity(currentItem.quantity)}</p>
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs font-medium text-gray-600">المواصفات الفنية</Label>
                <p className="text-xs text-gray-700 text-right leading-relaxed p-2 bg-gray-50 rounded border">{currentItem.specifications}</p>
              </div>
            </CardContent>
          </Card>

          {/* شريط إعدادات مضغوط فوق الجداول */}
          <Card className="border-gray-200">
            <CardContent className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div>
                  <Label className="text-xs font-medium text-gray-600">طريقة التنفيذ</Label>
                  <Select
                    value={currentPricing.executionMethod ?? 'ذاتي'}
                    onValueChange={(value: ExecutionMethod) =>
                      setCurrentPricing(prev => {
                        const next = { ...prev, executionMethod: value };
                        markDirty();
                        return next;
                      })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="اختر طريقة التنفيذ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ذاتي">تنفيذ ذاتي</SelectItem>
                      <SelectItem value="مقاول باطن">مقاول باطن</SelectItem>
                      <SelectItem value="مختلط">مختلط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs block mb-1">النسبة الإدارية (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentPricing.additionalPercentages.administrative}
                    onChange={(e) => setCurrentPricing(prev => { const next = {
                      ...prev,
                      additionalPercentages: {
                        ...prev.additionalPercentages,
                        administrative: Math.max(0, Math.min(100, Number(e.target.value) || 0))
                      }
                    }; markDirty(); return next; })}
                    className="text-right h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs block mb-1">النسبة التشغيلية (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentPricing.additionalPercentages.operational}
                    onChange={(e) => setCurrentPricing(prev => { const next = {
                      ...prev,
                      additionalPercentages: {
                        ...prev.additionalPercentages,
                        operational: Math.max(0, Math.min(100, Number(e.target.value) || 0))
                      }
                    }; markDirty(); return next; })}
                    className="text-right h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs block mb-1">نسبة الربح (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentPricing.additionalPercentages.profit}
                    onChange={(e) => setCurrentPricing(prev => { const next = {
                      ...prev,
                      additionalPercentages: {
                        ...prev.additionalPercentages,
                        profit: Math.max(0, Math.min(100, Number(e.target.value) || 0))
                      }
                    }; markDirty(); return next; })}
                    className="text-right h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* جداول التسعير بعرض كامل */}
          <Tabs defaultValue="materials" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-4" dir="rtl">
              <TabsTrigger value="materials" className="flex items-center gap-2 flex-row-reverse">
                المواد
                <Package className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="labor" className="flex items-center gap-2 flex-row-reverse">
                العمالة
                <Users className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="equipment" className="flex items-center gap-2 flex-row-reverse">
                المعدات
                <Truck className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="subcontractors" className="flex items-center gap-2 flex-row-reverse">
                المقاولين
                <Building className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            {/* جدول المواد */}
            <TabsContent value="materials">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="w-4 h-4 text-blue-600" />
                      المواد والخامات
                    </CardTitle>
                    <Button onClick={() => addRow('materials')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة مادة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm" dir="rtl">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th className="border p-2 text-right">اسم المادة</th>
                          <th className="border p-2 text-right">الوصف</th>
                          <th className="border p-2 text-center">الوحدة</th>
                          <th className="border p-2 text-center">الكمية</th>
                          <th className="border p-2 text-center">السعر</th>
                          <th className="border p-2 text-center">فاقد</th>
                          <th className="border p-2 text-center">نسبة الفاقد</th>
                          <th className="border p-2 text-center">الإجمالي</th>
                          <th className="border p-2 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.materials.map((material) => (
                          <tr key={material.id}>
                            <td className="border p-2">
                              <Input
                                value={material.name ?? ''}
                                onChange={(e) => updateRow('materials', material.id, 'name', e.target.value)}
                                placeholder="اسم المادة"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={material.description ?? ''}
                                onChange={(e) => updateRow('materials', material.id, 'description', e.target.value)}
                                placeholder="الوصف"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={material.unit ?? ''}
                                onChange={(e) => updateRow('materials', material.id, 'unit', e.target.value)}
                                placeholder="الوحدة"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={material.quantity || 0}
                                onChange={(e) => updateRow('materials', material.id, 'quantity', Number(e.target.value))}
                                placeholder="الكمية"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={material.price ?? 0}
                                onChange={(e) => updateRow('materials', material.id, 'price', Number(e.target.value))}
                                placeholder="السعر"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2 text-center">
                              <Checkbox
                                checked={material.hasWaste ?? false}
                                onCheckedChange={(checked: boolean) => updateRow('materials', material.id, 'hasWaste', checked)}
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={material.wastePercentage ?? 0}
                                onChange={(e) => updateRow('materials', material.id, 'wastePercentage', Number(e.target.value))}
                                disabled={!material.hasWaste}
                                placeholder="%"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2 text-center font-bold">
                              {formatCurrencyValue(material.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="border p-2 text-center">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteRow('materials', material.id)}
                                className="h-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* جدول العمالة */}
            <TabsContent value="labor">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="w-4 h-4 text-green-600" />
                      العمالة
                    </CardTitle>
                    <Button onClick={() => addRow('labor')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة عامل
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm" dir="rtl">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th className="border p-2 text-right">الوصف</th>
                          <th className="border p-2 text-center">الوحدة</th>
                          <th className="border p-2 text-center">الكمية</th>
                          <th className="border p-2 text-center">السعر</th>
                          <th className="border p-2 text-center">الإجمالي</th>
                          <th className="border p-2 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.labor.map((labor) => (
                          <tr key={labor.id}>
                            <td className="border p-2">
                              <Input
                                value={labor.description}
                                onChange={(e) => updateRow('labor', labor.id, 'description', e.target.value)}
                                placeholder="وصف العمالة"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={labor.unit}
                                onChange={(e) => updateRow('labor', labor.id, 'unit', e.target.value)}
                                placeholder="الوحدة"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={labor.quantity}
                                onChange={(e) => updateRow('labor', labor.id, 'quantity', Number(e.target.value))}
                                placeholder="الكمية"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={labor.price}
                                onChange={(e) => updateRow('labor', labor.id, 'price', Number(e.target.value))}
                                placeholder="السعر"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2 text-center font-bold">
                              {formatCurrencyValue(labor.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="border p-2 text-center">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteRow('labor', labor.id)}
                                className="h-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* جدول المعدات */}
            <TabsContent value="equipment">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Truck className="w-4 h-4 text-orange-600" />
                      المعدات والآلات
                    </CardTitle>
                    <Button onClick={() => addRow('equipment')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة معدة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th className="border p-2 text-right">الوصف</th>
                          <th className="border p-2 text-center">الوحدة</th>
                          <th className="border p-2 text-center">الكمية</th>
                          <th className="border p-2 text-center">السعر</th>
                          <th className="border p-2 text-center">الإجمالي</th>
                          <th className="border p-2 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.equipment.map((equipment) => (
                          <tr key={equipment.id}>
                            <td className="border p-2">
                              <Input
                                value={equipment.description}
                                onChange={(e) => updateRow('equipment', equipment.id, 'description', e.target.value)}
                                placeholder="وصف المعدة"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={equipment.unit}
                                onChange={(e) => updateRow('equipment', equipment.id, 'unit', e.target.value)}
                                placeholder="الوحدة"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={equipment.quantity}
                                onChange={(e) => updateRow('equipment', equipment.id, 'quantity', Number(e.target.value))}
                                placeholder="الكمية"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={equipment.price}
                                onChange={(e) => updateRow('equipment', equipment.id, 'price', Number(e.target.value))}
                                placeholder="السعر"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2 text-center font-bold">
                              {formatCurrencyValue(equipment.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="border p-2 text-center">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteRow('equipment', equipment.id)}
                                className="h-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* جدول المعدات */}
            <TabsContent value="equipment">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Truck className="w-4 h-4 text-orange-600" />
                      المعدات والآلات
                    </CardTitle>
                    <Button onClick={() => addRow('equipment')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة معدة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th className="border p-2 text-right">الوصف</th>
                          <th className="border p-2 text-center">الوحدة</th>
                          <th className="border p-2 text-center">الكمية</th>
                          <th className="border p-2 text-center">السعر</th>
                          <th className="border p-2 text-center">الإجمالي</th>
                          <th className="border p-2 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.equipment.map((equipment) => (
                          <tr key={equipment.id}>
                            <td className="border p-2">
                              <Input
                                value={equipment.description}
                                onChange={(e) => updateRow('equipment', equipment.id, 'description', e.target.value)}
                                placeholder="وصف المعدة"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={equipment.unit}
                                onChange={(e) => updateRow('equipment', equipment.id, 'unit', e.target.value)}
                                placeholder="الوحدة"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={equipment.quantity}
                                onChange={(e) => updateRow('equipment', equipment.id, 'quantity', Number(e.target.value))}
                                placeholder="الكمية"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={equipment.price}
                                onChange={(e) => updateRow('equipment', equipment.id, 'price', Number(e.target.value))}
                                placeholder="السعر"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2 text-center font-bold">
                              {formatCurrencyValue(equipment.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="border p-2 text-center">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteRow('equipment', equipment.id)}
                                className="h-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* جدول المقاولين */}
            <TabsContent value="subcontractors">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building className="w-4 h-4 text-purple-600" />
                      المقاولون من الباطن
                    </CardTitle>
                    <Button onClick={() => addRow('subcontractors')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة مقاول
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th className="border p-2 text-right">الوصف</th>
                          <th className="border p-2 text-center">الوحدة</th>
                          <th className="border p-2 text-center">الكمية</th>
                          <th className="border p-2 text-center">السعر</th>
                          <th className="border p-2 text-center">الإجمالي</th>
                          <th className="border p-2 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.subcontractors.map((subcontractor) => (
                          <tr key={subcontractor.id}>
                            <td className="border p-2">
                              <Input
                                value={subcontractor.description}
                                onChange={(e) => updateRow('subcontractors', subcontractor.id, 'description', e.target.value)}
                                placeholder="وصف العمل"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={subcontractor.unit}
                                onChange={(e) => updateRow('subcontractors', subcontractor.id, 'unit', e.target.value)}
                                placeholder="الوحدة"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={subcontractor.quantity}
                                onChange={(e) => updateRow('subcontractors', subcontractor.id, 'quantity', Number(e.target.value))}
                                placeholder="الكمية"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={subcontractor.price}
                                onChange={(e) => updateRow('subcontractors', subcontractor.id, 'price', Number(e.target.value))}
                                placeholder="السعر"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2 text-center font-bold">
                              {formatCurrencyValue(subcontractor.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="border p-2 text-center">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteRow('subcontractors', subcontractor.id)}
                                className="h-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
              </Tabs>

              {/* الملاحظات الفنية */}
              <Card>
            <CardHeader className="p-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-gray-600" />
                الملاحظات الفنية
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Textarea
                value={currentPricing.technicalNotes}
                onChange={(e) => setCurrentPricing(prev => { const next = { ...prev, technicalNotes: e.target.value }; markDirty(); return next; })}
                placeholder="أضف أي ملاحظات فنية خاصة بهذا البند..."
                rows={4}
                className="text-right text-sm"
              />
            </CardContent>
          </Card>
            
              {/* الملخص المالي */}
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  الملخص المالي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span>المواد:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.materials)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span>العمالة:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.labor)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span>المعدات:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.equipment)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span>المقاولون:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.subcontractors)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>التكاليف الإدارية:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.administrative)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>التكاليف التشغيلية:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.operational)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>الربح:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.profit)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                  <span className="font-bold text-lg">الإجمالي النهائي:</span>
                  <span className="font-bold text-xl text-green-600">{formatCurrencyValue(totals.total)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-100 rounded">
                  <span className="font-medium">سعر الوحدة:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrencyValue(totals.total / currentItem.quantity, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </CardContent>
              </Card>

          {/* شريط إجراءات مثبت أسفل العرض */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t p-3 z-20">
            <div className="flex justify-center items-center gap-3">
              <Button 
                onClick={() => {
                  if (currentItemIndex > 0) {
                    saveCurrentItem();
                    setTimeout(() => setCurrentItemIndex(currentItemIndex - 1), 100);
                  }
                }}
                disabled={currentItemIndex === 0}
                variant="outline"
                className="flex items-center gap-2 px-4 h-9"
              >
                <ArrowRight className="w-4 h-4" />
                البند السابق
              </Button>

              <ConfirmationDialog
                title={confirmationMessages.saveItem.title}
                description={confirmationMessages.saveItem.description}
                confirmText={confirmationMessages.saveItem.confirmText}
                cancelText={confirmationMessages.saveItem.cancelText}
                variant="success"
                icon="save"
                onConfirm={saveCurrentItem}
                trigger={
                  <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 h-9">
                    <Save className="w-4 h-4" />
                    حفظ تسعير البند
                  </Button>
                }
              />

              <Button 
                onClick={() => {
                  if (currentItemIndex < quantityItems.length - 1) {
                    saveCurrentItem();
                    setTimeout(() => setCurrentItemIndex(currentItemIndex + 1), 100);
                  }
                }}
                disabled={currentItemIndex === quantityItems.length - 1}
                variant="outline"
                className="flex items-center gap-2 px-4 h-9"
              >
                البند التالي
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  // عرض العرض الفني
  const renderTechnical = () => {
    return (
      <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">
        <div className="space-y-6 p-1 pb-20" dir="rtl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                رفع ملفات العرض الفني
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <TechnicalFilesUpload tenderId={tender?.id || ''} />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    );
  };

  if (!currentItem) {
    return (
      <>
        <div className="p-6 max-w-4xl mx-auto" dir="rtl">
          <EmptyState
            icon={AlertCircle}
            title="لا توجد بنود للتسعير"
            description="يجب إضافة جدول الكميات للمناقصة قبل البدء في عملية التسعير."
            actionLabel="العودة"
            onAction={handleAttemptLeave}
          />
        </div>
        {leaveConfirmationDialog}
      </>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white/80 backdrop-blur z-20 py-2 border-b">
        <Button
          variant="outline"
          onClick={handleAttemptLeave}
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">عملية التسعير</h1>
          <p className="text-gray-600 text-sm">{tender.name || tender.title || 'منافسة جديدة'}</p>
          {/* شريط حالة النسخة الرسمية / المسودة */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {editablePricing.source === 'official' && (
              <Badge className="bg-green-600 text-white hover:bg-green-600">نسخة رسمية معتمدة</Badge>
            )}
            {editablePricing.source === 'draft' && editablePricing.isDraftNewer && (
              <Badge className="bg-amber-500 text-white hover:bg-amber-500">مسودة أحدث (غير معتمدة)</Badge>
            )}
            {/* Snapshot indicator removed بعد إلغاء نظام اللقطات */}
            {/* Removed legacy 'hook' source badge after unification */}
            {editablePricing.hasDraft && !editablePricing.isDraftNewer && editablePricing.source === 'official' && (
              <Badge variant="secondary" className="bg-gray-200 text-gray-700">مسودة محفوظة</Badge>
            )}
            {editablePricing.dirty && (
              <Badge className="bg-red-600 text-white hover:bg-red-600 animate-pulse">تغييرات غير محفوظة رسمياً</Badge>
            )}
          </div>
        </div>
        
        {/* شريط أدوات مُعاد تصميمه */}
        <div className="flex items-center gap-2">
          {/* اعتماد رسمي */}
          <ConfirmationDialog
            title={confirmationMessages.approveOfficial.title}
            description={confirmationMessages.approveOfficial.description}
            confirmText={confirmationMessages.approveOfficial.confirmText}
            cancelText={confirmationMessages.approveOfficial.cancelText}
            variant="success"
            icon="confirm"
            onConfirm={async () => {
              try {
                await editablePricing.saveOfficial();
                toast.success('تم اعتماد التسعير رسمياً', { duration: 2500 });
              } catch (e) {
                console.error('Official save failed', e);
                toast.error('فشل اعتماد النسخة الرسمية');
              }
            }}
            trigger={
              <Button
                size="sm"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                disabled={editablePricing.status !== 'ready' || (!editablePricing.dirty && !editablePricing.isDraftNewer && editablePricing.source === 'official')}
              >
                <CheckCircle className="w-4 h-4" />
                اعتماد
              </Button>
            }
          />
          {/* نسبة الإنجاز مختصرة */}
          <div className="px-3 py-1.5 rounded-md border bg-gradient-to-l from-blue-50 to-blue-100 text-xs text-blue-700 flex flex-col items-center leading-tight">
            <span className="font-bold">
              {(() => {
                const c = Array.from(pricingData.values()).filter(value => value?.completed).length;
                return Math.round((c / quantityItems.length) * 100);
              })()}%
            </span>
            <span className="text-[10px]">
              {Array.from(pricingData.values()).filter(value => value?.completed).length}/{quantityItems.length}
            </span>
          </div>
          {/* قائمة الأدوات الثانوية */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                أدوات
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <ConfirmationDialog
                title={confirmationMessages.saveItem.title}
                description={confirmationMessages.saveItem.description}
                confirmText={confirmationMessages.saveItem.confirmText}
                cancelText={confirmationMessages.saveItem.cancelText}
                variant="success"
                icon="save"
                onConfirm={saveCurrentItem}
                trigger={
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <Save className="w-4 h-4 text-green-600" /> حفظ تسعير البند
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuSeparator />
              <ConfirmationDialog
                title="إنشاء نسخة احتياطية"
                description="سيتم حفظ نسخة احتياطية من حالة التسعير الحالية (يتم الاحتفاظ بآخر 10 فقط). هل تريد المتابعة؟"
                confirmText="نعم، إنشاء نسخة"
                cancelText="إلغاء"
                variant="success"
                icon="save"
                onConfirm={() => { void createBackup(); }}
                trigger={
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <RotateCcw className="w-4 h-4 text-blue-600" /> إنشاء نسخة احتياطية
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem onClick={() => { setRestoreOpen(true); void loadBackupsList(); }} className="flex items-center gap-2 cursor-pointer">
                <RotateCcw className="w-4 h-4 text-blue-600" /> استرجاع نسخة
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>التصدير</DropdownMenuLabel>
              <DropdownMenuItem onClick={exportPricingToExcel} className="flex items-center gap-2 cursor-pointer">
                <Download className="w-4 h-4 text-green-600" /> تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { updateTenderStatus(); toast.success('تم تحديث حالة المنافسة'); }} className="flex items-center gap-2 cursor-pointer">
                <TrendingUp className="w-4 h-4 text-purple-600" /> تحديث الحالة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Dialog الاسترجاع بقي للاستخدام لكنه أُخرج من التجمع البصري للأزرار */}
  <Dialog open={restoreOpen} onOpenChange={(openState) => { setRestoreOpen(openState); if (openState) void loadBackupsList(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استرجاع نسخة احتياطية</DialogTitle>
            <DialogDescription>اختر نسخة لاسترجاع بيانات التسعير.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-auto mt-2 space-y-2" dir="rtl">
            {backupsList.length === 0 && (
              <EmptyState
                icon={RotateCcw}
                title="لا توجد نسخ احتياطية"
                description="لم يتم إنشاء أي نسخ احتياطية لهذه المنافسة بعد."
              />
            )}
            {backupsList.map((b)=> (
              <div key={b.id} className="flex items-center justify-between border rounded p-2">
                <div className="text-sm">
                  <div className="font-medium">{formatTimestamp(b.timestamp)}</div>
                  <div className="text-gray-600">نسبة الإكمال: {Math.round(b.completionPercentage)}% • الإجمالي: {formatCurrencyValue(b.totalValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div className="text-xs text-gray-500">
                    العناصر المسعرة: {b.itemsPriced}/{b.itemsTotal}
                    {b.retentionExpiresAt
                      ? ` • الاحتفاظ حتى ${formatDateValue(b.retentionExpiresAt, {
                          locale: 'ar-SA',
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric'
                        })}`
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={()=>restoreBackup(b.id)}>استرجاع</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline">إغلاق</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation Tabs */}
  <Tabs value={currentView} onValueChange={handleViewChange} className="mb-6" dir="rtl">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl" dir="rtl">
          <TabsTrigger value="summary" className="flex items-center gap-2 flex-row-reverse">
            <Badge variant="secondary" className="mr-1">
              {(() => {
                const c = Array.from(pricingData.values()).filter(value => value?.completed).length;
                return Math.round((c / quantityItems.length) * 100);
              })()}%
            </Badge>
            <span>الملخص</span>
            <PieChart className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2 flex-row-reverse">
            {currentItem && pricingData.get(currentItem.id)?.completed && (
              <Badge variant="outline" className="mr-1 text-green-600 border-green-600">
                محفوظ
                <CheckCircle className="w-3 h-3 mr-1" />
              </Badge>
            )}
            <span>التسعير</span>
            <Calculator className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2 flex-row-reverse">
            <span>العرض الفني</span>
            <FileText className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        {/* Content based on current view */}
        <TabsContent value="summary">
          {renderSummary()}
        </TabsContent>

        <TabsContent value="pricing">
          {renderPricing()}
        </TabsContent>

        <TabsContent value="technical">
          {renderTechnical()}
        </TabsContent>
      </Tabs>
      {leaveConfirmationDialog}
    </div>
  );
}
