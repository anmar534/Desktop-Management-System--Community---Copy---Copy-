import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/storage';
import {
  createTenderPricingBackup,
  listTenderBackupEntries,
  restoreTenderBackup,
  noteBackupFailure,
  type TenderPricingBackupPayload
} from '@/utils/backupManager';
import { pricingService } from '@/application/services/pricingService';
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
// (Phase MVP Official/Draft) ╪د╪│╪ز┘è╪▒╪د╪» ╪د┘"┘ç┘ê┘â ╪د┘"╪ش╪»┘è╪» ┘"╪ح╪»╪د╪▒╪ر ╪د┘"┘à╪│┘ê╪»╪ر ┘ê╪د┘"┘†╪│╪«╪ر ╪د┘"╪▒╪│┘à┘è╪ر
import { useEditableTenderPricing } from '@/application/hooks/useEditableTenderPricing';
// Phase 2 authoring engine adoption helpers (flag-guarded)
import { PRICING_FLAGS } from '../utils/pricingHelpers';
import { useTenderPricingPersistence } from '@/components/pricing/tender-pricing-process/hooks/useTenderPricingPersistence';
import { useDomainPricingEngine } from '@/application/hooks/useDomainPricingEngine';
import { applyDefaultsToPricingMap } from '@/utils/defaultPercentagesPropagation';
import { formatDateValue } from '@/utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { EmptyState } from './PageLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { ActionBar } from './ui/layout/ActionBar';
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
 * - ╪د┘"╪ص╪│╪د╪ذ legacy ┘à╪╣╪▓┘ê┘" ┘┘è legacyAuthoringCompute().
 * - ╪╣┘†╪» ╪ز┘╪╣┘è┘" PRICING_FLAGS.USE_ENGINE_AUTHORING ┘è╪ز┘à ╪ز╪┤╪║┘è┘" ┘à╪│╪د╪▒┘è┘†:
 *    1) legacy ┘"╪ص╪│╪د╪ذ ╪د┘"┘é┘è┘à (┘"╪ث╪║╪▒╪د╪╢ ╪د┘"┘à┘é╪د╪▒┘†╪ر ┘┘é╪╖)
 */
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { toast } from 'sonner';
import { TechnicalFilesUpload } from './TechnicalFilesUpload';
import { debounce } from '../utils/helpers';
import { AlertCircle, CheckCircle, DollarSign, Package, TrendingUp, Settings, Building, Grid3X3, RotateCcw, Edit3, Target, PieChart, FileText, BarChart3, Plus, Trash2, Users, Truck, Download, ArrowRight, Save, Calculator, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { PricingTemplateManager } from './bidding/PricingTemplateManager';
import { useSystemData } from '@/application/hooks/useSystemData';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import type { PricingTemplate } from '@/types/templates';

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

type TenderStatsRecord = Record<string, TenderStatsPayload>;

type NewPricingTemplate = Omit<PricingTemplate, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>;

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
      return 'ظ€¤';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'ظ€¤';
    }
    return timestampFormatter.format(date);
  }, [timestampFormatter]);
  const tenderTitle = tender.title ?? tender.name ?? '';
  // using unified storage utils instead of useStorage
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentView, setCurrentView] = useState<PricingView>('summary');
  const [pricingData, setPricingData] = useState<Map<string, PricingData>>(new Map());
  // (Official/Draft MVP) ╪»┘à╪ش ╪د┘"┘ç┘ê┘â ╪د┘"╪ش╪»┘è╪» (┘é╪▒╪د╪ة╪ر ┘┘é╪╖ ╪ص╪د┘"┘è╪د┘ï ┘"╪╣╪▒╪╢ ╪ص╪د┘"╪ر ╪د┘"╪د╪╣╪ز┘à╪د╪»)
  const editablePricing = useEditableTenderPricing(tender);
  // ┘ê╪╕┘è┘╪ر ┘à╪│╪د╪╣╪»╪ر ┘"╪ز┘à┘è┘è╪▓ ╪ث┘† ┘ç┘†╪د┘â ╪ز╪║┘è┘è╪▒╪د╪ز ┘à╪│┘ê╪»╪ر ╪║┘è╪▒ ┘à╪╣╪ز┘à╪»╪ر ╪▒╪│┘à┘è╪د┘ï
  const markDirty = useCallback(() => {
    try {
      if (editablePricing.status === 'ready') {
        editablePricing.markDirty?.();
      }
    } catch (error) {
      console.warn('ظأبي╕ markDirty invocation failed', error);
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

  // ╪د┘"┘†╪│╪ذ ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر ╪د┘"╪╣╪د┘à╪ر - MOVED HERE TO FIX TEMPORAL DEAD ZONE
  const [defaultPercentages, setDefaultPercentages] = useState<PricingPercentages>({
    administrative: 5,
    operational: 5,
    profit: 15
  });
  // Track previous defaults to enable smart propagation (items that still matched old defaults only)
  const previousDefaultsRef = useRef({ administrative: 5, operational: 5, profit: 15 });
  // ╪ص╪د┘"╪د╪ز ┘†╪╡┘è╪ر ┘ê╪│┘è╪╖╪ر ┘"┘"╪│┘à╪د╪ص ╪ذ╪د┘"┘â╪ز╪د╪ذ╪ر ╪د┘"╪ص╪▒╪ر ╪س┘à ╪د┘"╪د╪╣╪ز┘à╪د╪» ╪╣┘†╪» ╪د┘"╪«╪▒┘ê╪ش ┘à┘† ╪د┘"╪ص┘é┘"
  const [defaultPercentagesInput, setDefaultPercentagesInput] = useState({
    administrative: '5',
    operational: '5',
    profit: '15'
  });

  // ╪د╪│╪ز╪«╪▒╪د╪ش ╪ذ┘è╪د┘†╪د╪ز ╪ش╪»┘ê┘" ╪د┘"┘â┘à┘è╪د╪ز ┘à┘† ╪د┘"┘à┘†╪د┘╪│╪ر ┘à╪╣ ╪د┘"╪ذ╪ص╪س ╪د┘"┘à╪ص╪│┘ّ┘†
  // MOVED HERE TO FIX TEMPORAL DEAD ZONE - quantityItems must be declared before template callbacks
  const quantityItems: QuantityItem[] = useMemo(() => {
    console.log('≡ا¤ ╪د┘"╪ذ╪ص╪س ╪╣┘† ╪ذ┘è╪د┘†╪د╪ز ╪د┘"┘â┘à┘è╪د╪ز:', tender);
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
          normalizedName.includes('┘â┘à┘è╪ر') ||
          normalizedName.includes('boq') ||
          normalizedName.includes('quantity')
        );
      });

      if (Array.isArray(quantityAttachment?.data)) {
        quantityData = quantityAttachment.data as RawQuantityItem[];
      }
    }

    if (quantityData.length === 0 && scopeValue) {
      console.log('≡ا¤ ╪د┘"╪ذ╪ص╪س ┘┘è ┘†╪╡ ╪د┘"┘ê╪╡┘:', scopeValue);
      // ┘è┘à┘â┘† ╪ح╪╢╪د┘╪ر ┘à┘†╪╖┘é ┘"╪د╪│╪ز╪«╪▒╪د╪ش ╪د┘"╪ذ┘è╪د┘†╪د╪ز ┘à┘† ╪د┘"┘†╪╡ ┘ç┘†╪د ┘"╪د╪ص┘é╪د┘ï
    }

    if (quantityData.length === 0) {
      console.log('ظأبي╕ ┘"╪د ╪ز┘ê╪ش╪» ╪ذ┘è╪د┘†╪د╪ز ┘â┘à┘è╪د╪ز╪î ╪ح┘†╪┤╪د╪ة ╪ذ┘è╪د┘†╪د╪ز ╪د┘╪ز╪▒╪د╪╢┘è╪ر');
      const title = tender?.title ?? tender?.name ?? '';
      const scopeText = typeof scopeValue === 'string' ? scopeValue : '';
      const defaultQuantityItems: RawQuantityItem[] = [];

      if (title.includes('┘à╪ذ┘†┘ë') || scopeText.includes('┘à╪ذ┘†┘ë') || title.includes('╪ذ┘†╪د╪ة') || scopeText.includes('╪ذ┘†╪د╪ة')) {
        defaultQuantityItems.push(
          {
            id: 'default-1',
            itemNumber: '01',
            description: '╪ث╪╣┘à╪د┘" ╪د┘"╪ص┘╪▒ ┘ê╪د┘"╪▒╪»┘à',
            unit: 'م³',
            quantity: 500,
            specifications: '╪ص┘╪▒ ┘ê╪▒╪»┘à ┘"┘"╪ث╪│╪د╪│╪د╪ز'
          },
          {
            id: 'default-2',
            itemNumber: '02',
            description: '╪ث╪╣┘à╪د┘" ╪د┘"╪«╪▒╪│╪د┘†╪ر ╪د┘"╪╣╪د╪»┘è╪ر',
            unit: 'م³',
            quantity: 200,
            specifications: '╪«╪▒╪│╪د┘†╪ر ╪╣╪د╪»┘è╪ر ╪»╪▒╪ش╪ر 150 ┘â╪ش┘à/╪│┘à┬▓'
          },
          {
            id: 'default-3',
            itemNumber: '03',
            description: '╪ث╪╣┘à╪د┘" ╪د┘"╪«╪▒╪│╪د┘†╪ر ╪د┘"┘à╪│┘"╪ص╪ر',
            unit: 'م³',
            quantity: 300,
            specifications: '╪«╪▒╪│╪د┘†╪ر ┘à╪│┘"╪ص╪ر ╪»╪▒╪ش╪ر 350 ┘â╪ش┘à/╪│┘à┬▓'
          },
          {
            id: 'default-4',
            itemNumber: '04',
            description: '╪ث╪╣┘à╪د┘" ╪ص╪»┘è╪» ╪د┘"╪ز╪│┘"┘è╪ص',
            unit: '╪╖┘†',
            quantity: 25,
            specifications: '╪ص╪»┘è╪» ╪ز╪│┘"┘è╪ص ╪╣╪د╪»┘è ┘ê╪╣╪د┘"┘è ╪د┘"┘à┘é╪د┘ê┘à╪ر'
          }
        );
      } else {
        defaultQuantityItems.push(
          {
            id: 'default-1',
            itemNumber: '01',
            description: '╪د┘"╪ذ┘†╪» ╪د┘"╪ث┘ê┘"',
            unit: '┘ê╪ص╪»╪ر',
            quantity: 100,
            specifications: '╪ص╪│╪ذ ╪د┘"┘à┘ê╪د╪╡┘╪د╪ز ╪د┘"┘┘†┘è╪ر'
          },
          {
            id: 'default-2',
            itemNumber: '02',
            description: '╪د┘"╪ذ┘†╪» ╪د┘"╪س╪د┘†┘è',
            unit: '┘ê╪ص╪»╪ر',
            quantity: 150,
            specifications: '╪ص╪│╪ذ ╪د┘"┘à┘ê╪د╪╡┘╪د╪ز ╪د┘"┘┘†┘è╪ر'
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

      const unit = toTrimmedString(item.unit) ?? toTrimmedString((item as Record<string, unknown>).uom) ?? '┘ê╪ص╪»╪ر';
      const quantity = toNumberOr(item.quantity, 1);
      const specifications =
        toTrimmedString(item.specifications) ??
        toTrimmedString((item as Record<string, unknown>).spec) ??
        toTrimmedString((item as Record<string, unknown>).notes) ??
        '╪ص╪│╪ذ ╪د┘"┘à┘ê╪د╪╡┘╪د╪ز ╪د┘"┘┘†┘è╪ر';

      return {
        id,
        itemNumber,
        description,
        unit,
        quantity,
        specifications
      } satisfies QuantityItem;
    });

    console.log('ظ£à ╪ذ┘è╪د┘†╪د╪ز ╪د┘"┘â┘à┘è╪د╪ز ╪د┘"┘à╪╣╪د┘"╪ش╪ر:', normalizedItems);
    return normalizedItems;
  }, [tender]);

  // ==== Template Management ====

  const handleTemplateApply = useCallback((template: PricingTemplate) => {
    try {
      // Apply template percentages to default percentages
      setDefaultPercentages({
        administrative: template.defaultPercentages.administrative,
        operational: template.defaultPercentages.operational,
        profit: template.defaultPercentages.profit
      });

      // Apply template to all existing items if they don't have custom pricing
      const updatedPricingData = new Map(pricingData);

      quantityItems.forEach(item => {
        const existingPricing = updatedPricingData.get(item.id);

        // Only apply template if item doesn't have detailed pricing yet
        if (!existingPricing || (!existingPricing.materials?.length && !existingPricing.labor?.length && !existingPricing.equipment?.length && !existingPricing.subcontractors?.length)) {
          const templatePricing = {
            ...existingPricing,
            percentages: {
              administrative: template.defaultPercentages.administrative,
              operational: template.defaultPercentages.operational,
              profit: template.defaultPercentages.profit
            },
            additionalPercentages: {
              administrative: template.defaultPercentages.administrative,
              operational: template.defaultPercentages.operational,
              profit: template.defaultPercentages.profit
            },
            materials: existingPricing?.materials || [],
            labor: existingPricing?.labor || [],
            equipment: existingPricing?.equipment || [],
            subcontractors: existingPricing?.subcontractors || [],
            completed: existingPricing?.completed || false,
            technicalNotes: existingPricing?.technicalNotes || ''
          };

          updatedPricingData.set(item.id, templatePricing);
        }
      });

      setPricingData(updatedPricingData);
      markDirty();

      toast.success(`╪ز┘à ╪ز╪╖╪ذ┘è┘é ┘é╪د┘"╪ذ "${template.name}" ╪ذ┘†╪ش╪د╪ص`);
      setTemplateManagerOpen(false);
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('┘╪┤┘" ┘┘è ╪ز╪╖╪ذ┘è┘é ╪د┘"┘é╪د┘"╪ذ');
    }
  }, [pricingData, quantityItems, markDirty, setDefaultPercentages, setPricingData]);

  const handleTemplateSave = useCallback((templateData: NewPricingTemplate) => {
    try {
      // Create template from current pricing state
      const templatePayload: NewPricingTemplate = {
        ...templateData,
        defaultPercentages: {
          administrative: defaultPercentages.administrative,
          operational: defaultPercentages.operational,
          profit: defaultPercentages.profit
        },
        // Calculate average cost breakdown from current pricing
        costBreakdown: {
          materials: 40, // Default values - could be calculated from current data
          labor: 30,
          equipment: 20,
          subcontractors: 10
        }
      };

      console.info('Template saved placeholder payload', templatePayload);
      toast.success(`╪ز┘à ╪ص┘╪╕ ╪د┘"┘é╪د┘"╪ذ "${templatePayload.name}" ╪ذ┘†╪ش╪د╪ص`);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('┘╪┤┘" ┘┘è ╪ص┘╪╕ ╪د┘"┘é╪د┘"╪ذ');
      throw error;
    }
  }, [defaultPercentages]);

  const handleTemplateUpdate = useCallback((template: PricingTemplate) => {
    try {
      // Update template logic would go here
      toast.success(`╪ز┘à ╪ز╪ص╪»┘è╪س ╪د┘"┘é╪د┘"╪ذ "${template.name}" ╪ذ┘†╪ش╪د╪ص`);
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('┘╪┤┘" ┘┘è ╪ز╪ص╪»┘è╪س ╪د┘"┘é╪د┘"╪ذ');
    }
  }, []);

  const handleTemplateDelete = useCallback((_templateId: string) => {
    try {
      // Delete template logic would go here
      toast.success('╪ز┘à ╪ص╪░┘ ╪د┘"┘é╪د┘"╪ذ ╪ذ┘†╪ش╪د╪ص');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('┘╪┤┘" ┘┘è ╪ص╪░┘ ╪د┘"┘é╪د┘"╪ذ');
    }
  }, []);

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
  
  // ╪ص╪د┘"╪د╪ز ╪د┘"╪╖┘è ┘"┘"╪ش╪»╪د┘ê┘" ╪د┘"┘à╪«╪ز┘"┘╪ر ┘┘è ╪ز╪ذ┘ê┘è╪ذ ╪د┘"┘à┘"╪«╪╡
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

  // ╪»╪د┘"╪ر ┘"╪ز╪ذ╪»┘è┘" ╪ص╪د┘"╪ر ╪د┘"╪╖┘è ┘"┘é╪│┘à ┘à╪╣┘è┘† ┘┘è ╪ذ┘†╪» ┘à╪╣┘è┘†
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


  
  const [isLoaded, setIsLoaded] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [backupsList, setBackupsList] = useState<TenderBackupEntry[]>([]);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);

  // ┘à╪▒╪ش╪╣ ┘"╪ز╪ز╪ذ╪╣ ╪ت╪«╪▒ ╪ص╪د┘"╪ر ╪ز┘à ╪ح╪▒╪│╪د┘"┘ç╪د ┘"╪ز╪ش┘†╪ذ ╪د┘"╪ز╪ص╪»┘è╪س ╪د┘"┘à┘â╪▒╪▒




  // Transform pricingData to include id property for domain pricing engine
  const pricingMapWithIds = useMemo(() => {
    const transformedMap = new Map<string, PricingData & { id: string }>();
    pricingData.forEach((data, id) => {
      transformedMap.set(id, { ...data, id });
    });
    return transformedMap;
  }, [pricingData]);

  // Phase 2.5: Domain pricing engine (UI read path) ظ€¤ optional; no write path yet (moved after quantityItems definition)
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
    // (Legacy Removal 2025-09-20) ╪د┘"┘à╪│╪د╪▒ ╪د┘"┘é╪»┘è┘à ╪ث╪▓┘è┘"╪ؤ ╪د┘"╪ت┘† ┘†╪╣╪ز┘à╪» ┘┘é╪╖ ╪╣┘"┘ë domainPricing.
    // ╪ح╪░╪د ┘"┘à ┘è┘â┘† ╪ش╪د┘ç╪▓╪د┘ï (loading ╪ث┘ê error) ┘†╪╣┘è╪» ┘é╪د╪خ┘à╪ر ╪ذ┘†┘ê╪» ┘à╪ذ╪»╪خ┘è╪ر ╪ذ╪»┘ê┘† ╪ز╪│╪╣┘è╪▒.
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
      console.info('ظ£à Domain Pricing UI path ENABLED (using useDomainPricingEngine)');
    } else {
      console.info('ظ"╣ي╕ Domain Pricing UI path disabled (legacy inline compute in use)');
    }
  }, [domainPricing.enabled]);

  // ╪»╪د┘"╪ر ┘"╪ح╪▒╪│╪د┘" ╪ح╪┤╪╣╪د╪▒ ╪ز╪ص╪»┘è╪س ┘"┘"╪╡┘╪ص╪د╪ز ╪د┘"╪ث╪«╪▒┘ë ┘à╪╣ ╪د╪│╪ز╪«╪»╪د┘à ╪«╪»┘à╪ر ╪د┘"┘à╪▓╪د┘à┘†╪ر ╪د┘"╪ش╪»┘è╪»╪ر
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
      const administrative = (subtotal * adminPercentage) / 100;
      const operational = (subtotal * operationalPercentage) / 100;
      const profit = (subtotal * profitPercentage) / 100;
      projectTotal += subtotal + administrative + operational + profit;
    });
    return projectTotal;
  }, [quantityItems, pricingData, defaultPercentages]);

  const calculateVAT = useCallback(() => {
    return calculateItemsTotal() * 0.15;
  }, [calculateItemsTotal]);

  const calculateProjectTotal = useCallback(() => {
    const itemsTotal = calculateItemsTotal();
    const vat = calculateVAT();
    return itemsTotal + vat;
  }, [calculateItemsTotal, calculateVAT]);

  const updateTenderPersistence = useCallback(
    async (tenderId: string, payload: Partial<Tender>) => {
      await updateTender(tenderId, payload);
    },
    [updateTender]
  );

  const debugLog = useCallback((...args: unknown[]) => {
    console.log(...args);
  }, []);

  const debugInfo = useCallback((...args: unknown[]) => {
    console.info(...args);
  }, []);

  const { notifyPricingUpdate, persistPricingAndBOQ, updateTenderStatus } = useTenderPricingPersistence({
    tender,
    quantityItems,
    pricingData,
    defaultPercentages,
    pricingViewItems,
    domainPricing,
    calculateProjectTotal,
    formatCurrencyValue,
    debugLog,
    debugInfo,
    updateTender: updateTenderPersistence,
  });

  /**
   * Isolated legacy arithmetic for a single item (Phase 2 - will be paralleled by engine path)
   */
  // (Legacy Removal) ╪ز┘à ╪ص╪░┘ legacyAuthoringCompute ┘ê╪د┘"┘à╪│╪د╪▒ ╪د┘"┘é╪»┘è┘à╪ؤ ╪ح╪░╪د ╪╕┘ç╪▒ ╪د╪ص╪ز┘è╪د╪ش ┘à╪│╪ز┘é╪ذ┘"┘è ┘"┘é┘è╪د╪│ ┘╪▒┘ê┘é╪د╪ز ┘è┘à┘â┘† ╪د╪│╪ز╪╣┘à╪د┘" pricingRuntime + ┘"┘é╪╖╪د╪ز snapshots.

  // ╪ز╪ص┘à┘è┘" ╪ذ┘è╪د┘†╪د╪ز ╪د┘"╪ز╪│╪╣┘è╪▒ ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر ╪╣┘†╪» ┘╪ز╪ص ╪د┘"╪╡┘╪ص╪ر ┘"╪ث┘ê┘" ┘à╪▒╪ر
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

  // ╪ح╪▒╪│╪د┘" ╪ح╪┤╪╣╪د╪▒ ╪ز╪ص╪»┘è╪س ╪╣┘†╪» ╪ز╪║┘è┘è╪▒ ╪ذ┘è╪د┘†╪د╪ز ╪د┘"╪ز╪│╪╣┘è╪▒
  useEffect(() => {
    if (isLoaded && pricingData.size > 0) {
      // ╪ز╪ث╪«┘è╪▒ ┘é╪╡┘è╪▒ ┘"╪╢┘à╪د┘† ╪د┘â╪ز┘à╪د┘" ╪ز╪ص╪»┘è╪س ╪د┘"╪ذ┘è╪د┘†╪د╪ز
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

  // ╪ز╪ص┘à┘è┘" ╪ذ┘è╪د┘†╪د╪ز ╪د┘"╪ز╪│╪╣┘è╪▒ ┘"┘"╪ذ┘†╪» ╪د┘"╪ص╪د┘"┘è ╪ث┘ê ╪ز┘ç┘è╪خ╪ر ╪ذ┘†┘ê╪» ╪ش╪»┘è╪»╪ر ╪ذ╪د┘"┘†╪│╪ذ ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر
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

  // ╪ص╪│╪د╪ذ ╪د┘"╪ح╪ش┘à╪د┘"┘è╪د╪ز
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
  // ╪ص╪│╪د╪ذ ┘à╪ز┘ê╪│╪╖ ╪د┘"┘†╪│╪ذ ╪د┘"┘à╪│╪ز╪«╪»┘à╪ر
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

  // ╪ز╪╖╪ذ┘è┘é ╪د┘"┘†╪│╪ذ ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر ╪╣┘"┘ë ╪د┘"╪ذ┘†┘ê╪» ╪د┘"┘à┘ê╪ش┘ê╪»╪ر
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
      console.warn('ظأبي╕ markDirty after defaults propagation failed', error);
    }

    toast.success(`╪ز┘à ╪ز╪ص╪»┘è╪س ╪د┘"┘†╪│╪ذ ┘"┘€ ${updatedCount} ╪ذ┘†╪»`, {
      description: '╪ز┘à ╪ز╪╖╪ذ┘è┘é ╪د┘"┘†╪│╪ذ ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر ╪د┘"╪ش╪»┘è╪»╪ر ╪╣┘"┘ë ╪ش┘à┘è╪╣ ╪د┘"╪ذ┘†┘ê╪» ╪د┘"┘à┘ê╪ش┘ê╪»╪ر',
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

  // ╪ص┘╪╕ ╪د┘"┘†╪│╪ذ ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر ╪╣┘†╪» ╪ز╪╣╪»┘è┘"┘ç╪د ┘"╪╢┘à╪د┘† ╪د╪╣╪ز┘à╪د╪»┘ç╪د ┘"┘"╪ذ┘†┘ê╪» ╪د┘"╪ش╪»┘è╪»╪ر ┘ê╪د┘"╪ش┘"╪│╪د╪ز ╪د┘"┘é╪د╪»┘à╪ر
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
        console.info(`[PricingProcess] ≡اات Auto-propagated new default percentages to ${changedCount} items bound to old defaults.`);
      } else {
        void persistPricingAndBOQ(pricingData);
        console.info('[PricingProcess] ظ"╣ي╕ Defaults changed but no items matched previous defaults (all customized).');
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
    // (Legacy Snapshot System Removed 2025-09): ╪ص╪░┘ ┘à┘†╪╖┘é ╪ح┘†╪┤╪د╪ة/╪ز╪▒╪ص┘è┘" snapshot ┘†┘ç╪د╪خ┘è╪د┘ï.
  }, [defaultPercentages, isLoaded, persistPricingAndBOQ, pricingData, tender.id]);

  // ┘à┘"╪د╪ص╪╕╪ر: ╪ز┘à ╪ح╪▓╪د┘"╪ر ╪»╪د┘"╪ر ╪ز┘†╪│┘è┘é ╪د┘"╪╣┘à┘"╪ر ╪║┘è╪▒ ╪د┘"┘à╪│╪ز╪«╪»┘à╪ر ╪ذ╪╣╪» ╪ز╪ذ╪│┘è╪╖ ╪ذ╪╖╪د┘é╪د╪ز ╪د┘"┘à┘"╪«╪╡.
  // (Official/Draft MVP) ╪ز╪ش┘à┘è╪╣ ┘à╪ذ╪│╪╖ ┘"╪╣┘†╪د╪╡╪▒ ╪د┘"╪ز╪│╪╣┘è╪▒ ╪د┘"╪ص╪د┘"┘è╪ر ┘"╪د╪│╪ز╪«╪»╪د┘à┘ç ╪╣┘†╪» ╪ص┘╪╕ ╪د┘"┘à╪│┘ê╪»╪ر ╪ث┘ê ╪د┘"┘†╪│╪«╪ر ╪د┘"╪▒╪│┘à┘è╪ر
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
      console.warn('ظأبي╕ ┘╪┤┘" ╪ذ┘†╪د╪ة ╪╣┘†╪د╪╡╪▒ ╪د┘"┘à╪│┘ê╪»╪ر', error);
      return [];
    }
  }, [pricingViewItems]);

  // ╪ص╪│╪د╪ذ ╪ح╪ش┘à╪د┘"┘è ╪د┘"╪ز┘â╪د┘"┘è┘ ╪د┘"╪ح╪»╪د╪▒┘è╪ر
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

  // ╪ص╪│╪د╪ذ ╪ح╪ش┘à╪د┘"┘è ╪د┘"╪ز┘â╪د┘"┘è┘ ╪د┘"╪ز╪┤╪║┘è┘"┘è╪ر
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

  // ╪ص╪│╪د╪ذ ╪ح╪ش┘à╪د┘"┘è ╪د┘"╪ث╪▒╪ذ╪د╪ص
  const calculateTotalProfit = useCallback(() => {
    let totalProfit = 0;
    quantityItems.forEach(item => {
      const itemPricing = pricingData.get(item.id);
      if (itemPricing) {
        // ╪د╪│╪ز╪«╪»╪د┘à ╪د┘"╪»╪د┘"╪ر ╪د┘"┘à╪ص┘┘ê╪╕╪ر ┘"┘"╪ص╪╡┘ê┘" ╪╣┘"┘ë ╪د┘"┘é┘è┘à ╪د┘"┘à╪ص╪│┘ê╪ذ╪ر
        const itemTotals = {
          materials: itemPricing.materials.reduce((sum, mat) => sum + mat.total, 0),
          labor: itemPricing.labor.reduce((sum, lab) => sum + lab.total, 0),
          equipment: itemPricing.equipment.reduce((sum, eq) => sum + eq.total, 0),
          subcontractors: itemPricing.subcontractors.reduce((sum, sub) => sum + sub.total, 0)
        };
        const subtotal = itemTotals.materials + itemTotals.labor + itemTotals.equipment + itemTotals.subcontractors;
        // ╪د╪│╪ز╪«╪»╪د┘à ╪د┘"┘†╪│╪ذ ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر ╪د┘"╪ش╪»┘è╪»╪ر ╪ح╪░╪د ┘"┘à ╪ز┘â┘† ┘à╪ص╪»╪»╪ر ┘"┘ç╪░╪د ╪د┘"╪ذ┘†╪»
        const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit;
        const profit = subtotal * profitPercentage / 100;
        totalProfit += profit;
      }
    });
    return totalProfit;
  }, [quantityItems, pricingData, defaultPercentages.profit]);

  // ╪ز╪ص╪»┘è╪س ╪ص╪د┘"╪ر ╪د┘"┘à┘†╪د┘╪│╪ر ┘à╪╣ ╪ز╪ز╪ذ╪╣ ╪د┘"╪ز┘é╪»┘à ╪د┘"┘à╪│╪ز┘à╪▒ ┘ê╪ز╪ش┘†╪ذ ╪د┘"╪ز╪ص╪»┘è╪س ╪د┘"┘à┘â╪▒╪▒
  // ╪ص┘╪╕ ╪د┘"╪ذ┘è╪د┘†╪د╪ز ╪ذ╪┤┘â┘" ╪ز┘"┘é╪د╪خ┘è ┘à╪╣ debounce
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
          console.warn('ظأبي╕ Failed to compare pricing data before autosave', error);
        }

        const newMap = new Map(pricingData);
        newMap.set(currentItemId, data);
        setPricingData(newMap);

        void pricingService.saveTenderPricing(tender.id, {
          pricing: Array.from(newMap.entries()),
          defaultPercentages,
          lastUpdated: new Date().toISOString()
        });
        // ╪ز╪ص╪»┘è╪س ┘"┘é╪╖╪ر BOQ ╪د┘"┘à╪▒┘â╪▓┘è╪ر ┘┘ê╪▒ ╪ث┘è ╪ز╪╣╪»┘è┘" ╪ز╪│╪╣┘è╪▒
        void persistPricingAndBOQ(newMap);
        // (Legacy Snapshot Removed) ┘"┘à ┘è╪╣╪» ┘è╪ز┘à ╪ح┘†╪┤╪د╪ة snapshot ╪ز┘"┘é╪د╪خ┘è.
      }, 2000),
    [currentItemId, tender.id, defaultPercentages, pricingData, isLoaded, persistPricingAndBOQ]
  );

  // ╪ص┘╪╕ ┘è╪»┘ê┘è ┘"┘"╪ذ┘†╪» ╪د┘"╪ص╪د┘"┘è ┘à╪╣ ╪▒╪│╪د┘"╪ر ╪ز╪ث┘â┘è╪» ┘ê╪ز╪ص┘é┘é ┘à┘† ╪╡╪ص╪ر ╪د┘"╪ذ┘è╪د┘†╪د╪ز
  const saveCurrentItem = useCallback(() => {
    if (currentItem && isLoaded) {
      const totals = calculateTotals();
      // ╪د┘"╪ز╪ص┘é┘é ┘à┘† ┘ê╪ش┘ê╪» ╪ذ┘è╪د┘†╪د╪ز ╪د┘"╪ز╪│╪╣┘è╪▒
      const hasData = currentPricing.materials.length > 0 || 
                     currentPricing.labor.length > 0 || 
                     currentPricing.equipment.length > 0 || 
                     currentPricing.subcontractors.length > 0;
      
      if (!hasData) {
        toast.error('┘"╪د ╪ز┘ê╪ش╪» ╪ذ┘è╪د┘†╪د╪ز ┘"┘"╪ص┘╪╕', {
          description: '┘è╪▒╪ش┘ë ╪ح╪╢╪د┘╪ر ╪ذ┘è╪د┘†╪د╪ز ╪د┘"╪ز╪│╪╣┘è╪▒ ┘é╪ذ┘" ╪د┘"╪ص┘╪╕',
          duration: 4000,
        });
        return;
      }

      // ╪ز╪ث┘â┘è╪» ┘ê╪│┘à ╪د┘"╪ذ┘†╪» ┘â┘à┘â╪ز┘à┘" ┘┘é╪╖ ╪╣┘†╪» ╪د┘"╪ص┘╪╕ ╪د┘"╪╡╪▒┘è╪ص
      const itemToSave: PricingData = { ...currentPricing, completed: true };
      const newMap = new Map(pricingData);
      newMap.set(currentItem.id, itemToSave);
      setPricingData(newMap);
      setCurrentPricing(itemToSave);
      
      // ╪ص╪│╪د╪ذ ╪د┘"╪ز┘╪د╪╡┘è┘" ╪د┘"┘à╪د┘"┘è╪ر
      const itemTotals = {
        materials: itemToSave.materials.reduce((sum, mat) => sum + (mat.total || 0), 0),
        labor: itemToSave.labor.reduce((sum, lab) => sum + (lab.total || 0), 0),
        equipment: itemToSave.equipment.reduce((sum, eq) => sum + (eq.total || 0), 0),
        subcontractors: itemToSave.subcontractors.reduce((sum, sub) => sum + (sub.total || 0), 0)
      };
      
      const subtotal = Object.values(itemTotals).reduce((sum, val) => sum + val, 0);
      const unitPrice = totals.total / currentItem.quantity;
      
      // ╪ص┘╪╕ ┘┘è ┘é╪د╪╣╪»╪ر ╪د┘"╪ذ┘è╪د┘†╪د╪ز
      void pricingService.saveTenderPricing(tender.id, {
        pricing: Array.from(newMap.entries()),
        defaultPercentages,
        lastUpdated: new Date().toISOString()
      });
      // ┘à╪▓╪د┘à┘†╪ر ┘"┘é╪╖╪ر BOQ ╪د┘"┘à╪▒┘â╪▓┘è╪ر ╪ذ╪╣╪» ╪د┘"╪ص┘╪╕ ╪د┘"┘è╪»┘ê┘è
      void persistPricingAndBOQ(newMap);
      // (Legacy Snapshot Removed) ╪ص╪░┘ ╪ح┘†╪┤╪د╪ة snapshot ╪د┘"┘è╪»┘ê┘è.

      // ╪ص┘╪╕ ╪ز┘╪د╪╡┘è┘" ╪د┘"╪ذ┘†╪» ┘┘è ╪د┘"╪ز╪«╪▓┘è┘† ╪د┘"┘à┘ê╪ص╪» ┘"┘"╪ز╪╖╪ذ┘è┘é
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
        executionMethod: currentPricing.executionMethod ?? '╪░╪د╪ز┘è',
        technicalNotes: currentPricing.technicalNotes ?? '',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: 'completed',
        version: 1 // ┘"╪ز╪ز╪ذ╪╣ ╪ح╪╡╪»╪د╪▒╪د╪ز ╪د┘"╪ز╪│╪╣┘è╪▒
      });

      // ╪ز╪ص╪»┘è╪س ╪ح╪ص╪╡╪د╪خ┘è╪د╪ز ╪د┘"┘à┘†╪د┘╪│╪ر
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
      // ╪ص┘╪╕ ╪د┘"╪ح╪ص╪╡╪د╪خ┘è╪د╪ز ╪ذ╪┤┘â┘" ┘à╪ش┘à┘ّ╪╣ ╪ز╪ص╪ز STORAGE_KEYS.TENDER_STATS
      void (async () => {
        const allStats = await loadFromStorage<TenderStatsRecord>(STORAGE_KEYS.TENDER_STATS, {});
        allStats[tender.id] = statsPayload;
        await saveToStorage(STORAGE_KEYS.TENDER_STATS, allStats);
      })();

      // ╪╣╪▒╪╢ ╪▒╪│╪د┘"╪ر ╪ز╪ث┘â┘è╪» ┘à┘╪╡┘"╪ر
      toast.success('╪ز┘à ╪د┘"╪ص┘╪╕ ╪ذ┘†╪ش╪د╪ص', {
        description: `╪ز┘à ╪ص┘╪╕ ╪ز╪│╪╣┘è╪▒ ╪د┘"╪ذ┘†╪» ╪▒┘é┘à ${currentItem.itemNumber} - ╪د┘"┘é┘è┘à╪ر: ${formatCurrencyValue(totals.total)}`,
        duration: 4000,
      });

      // ╪ح╪▒╪│╪د┘" ╪ح╪┤╪╣╪د╪▒ ╪ز╪ص╪»┘è╪س ┘"┘"╪╡┘╪ص╪د╪ز ╪د┘"╪ث╪«╪▒┘ë (┘à╪س┘" ╪╡┘╪ص╪ر ╪ز┘╪د╪╡┘è┘" ╪د┘"┘à┘†╪د┘╪│╪ر)
      notifyPricingUpdate();

      // ╪ز╪ص╪»┘è╪س ╪ص╪د┘"╪ر ╪د┘"┘à┘†╪د┘╪│╪ر ┘┘ê╪▒╪د┘ï ╪ذ╪╣╪» ╪ص┘╪╕ ╪د┘"╪ذ┘†╪»
      setTimeout(() => {
        updateTenderStatus();
      }, 100);
    }
  }, [currentItem, currentPricing, pricingData, tender.id, isLoaded, quantityItems, calculateTotals, calculateProjectTotal, defaultPercentages, notifyPricingUpdate, persistPricingAndBOQ, updateTenderStatus, tenderTitle, formatCurrencyValue]);

  // ╪ز╪┤╪║┘è┘" ╪د┘"╪ص┘╪╕ ╪د┘"╪ز┘"┘é╪د╪خ┘è ╪╣┘†╪» ╪ز╪║┘è┘è╪▒ ╪د┘"╪ذ┘è╪د┘†╪د╪ز
  useEffect(() => {
    if (isLoaded && currentItemId) {
      debouncedSave(currentPricing);
    }
  }, [currentPricing, debouncedSave, isLoaded, currentItemId]);

  // (Official/Draft MVP) ╪ص┘╪╕ ┘à╪│┘ê╪»╪ر ╪ز┘"┘é╪د╪خ┘è (debounced ╪╣┘"┘ë ┘à╪│╪ز┘ê┘ë ╪د┘"╪«╪▒┘è╪╖╪ر ╪د┘"┘â╪د┘à┘"╪ر)
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
      } catch (e) { console.warn('ظأبي╕ autosave draft failed', e); }
    }, 1500);
    return () => clearTimeout(t);
  }, [pricingData, isLoaded, editablePricing, buildDraftPricingItems, calculateProjectTotal]);

  // (Official/Draft MVP) ╪ص┘╪╕ ┘à╪│┘ê╪»╪ر ╪»┘ê╪▒┘è ┘â┘" 45 ╪س╪د┘†┘è╪ر
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
      } catch (e) { console.warn('ظأبي╕ periodic draft save failed', e); }
    }, 45000);
    return () => clearInterval(interval);
  }, [isLoaded, editablePricing, buildDraftPricingItems, calculateProjectTotal]);

  // ╪ز╪ص╪░┘è╪▒ ╪╣┘†╪» ┘à╪ص╪د┘ê┘"╪ر ┘à╪║╪د╪»╪▒╪ر ╪د┘"╪╡┘╪ص╪ر ┘à╪╣ ╪ز╪║┘è┘è╪▒╪د╪ز ╪║┘è╪▒ ┘à╪╣╪ز┘à╪»╪ر ╪▒╪│┘à┘è╪د┘ï
  useEffect(() => {
    if (editablePricing.status !== 'ready') return;
    if (editablePricing.status !== 'ready') return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editablePricing.dirty || editablePricing.isDraftNewer) {
        const message = confirmationMessages.leaveDirty.description;
        e.preventDefault();
        e.returnValue = message; // ┘"╪ذ╪╣╪╢ ╪د┘"┘à╪ز╪╡┘╪ص╪د╪ز
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editablePricing]);

  // ╪ز╪ص╪»┘è╪س ╪ص╪د┘"╪ر ╪د┘"┘à┘†╪د┘╪│╪ر ╪╣┘†╪» ╪ز╪ص┘à┘è┘" ╪د┘"┘à┘â┘ê┘† ┘"╪ث┘ê┘" ┘à╪▒╪ر ┘┘é╪╖
  useEffect(() => {
    if (isLoaded) {
      console.log('≡اôï ╪ز┘à ╪ز╪ص┘à┘è┘" ╪╡┘╪ص╪ر ╪د┘"╪ز╪│╪╣┘è╪▒ - ╪│┘è╪ز┘à ╪ز╪ص╪»┘è╪س ╪ص╪د┘"╪ر ╪د┘"┘à┘†╪د┘╪│╪ر...');
      // ╪ز╪ث╪«┘è╪▒ ╪ذ╪│┘è╪╖ ┘"┘"╪ز╪ث┘â╪» ┘à┘† ╪ز╪ص┘à┘è┘" ╪ش┘à┘è╪╣ ╪د┘"╪ذ┘è╪د┘†╪د╪ز
      const timeoutId = setTimeout(() => {
        updateTenderStatus();
        updateTenderStatus();
        // ╪ح╪╕┘ç╪د╪▒ ╪▒╪│╪د┘"╪ر ┘"┘"┘à╪│╪ز╪«╪»┘à
        toast.info('╪ز┘à ╪ذ╪»╪ة ╪╣┘à┘"┘è╪ر ╪د┘"╪ز╪│╪╣┘è╪▒', {
          description: `╪ز┘à ╪ز╪ص╪»┘è╪س ╪ص╪د┘"╪ر ╪د┘"┘à┘†╪د┘╪│╪ر "${tenderTitle}" ╪ح┘"┘ë "╪ز╪ص╪ز ╪د┘"╪ح╪ش╪▒╪د╪ة"`,
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

  // ╪ح┘†╪┤╪د╪ة ╪╡┘ ┘╪د╪▒╪║
  const createEmptyRow = <Section extends PricingSection>(type: Section): SectionRowMap[Section] => {
    const baseRow: PricingRow = {
      id: Date.now().toString(),
      description: '',
      unit: '┘ê╪ص╪»╪ر',
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

  // ╪ح╪╢╪د┘╪ر ╪╡┘ ╪ش╪»┘è╪»
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

    // ╪ز╪ص╪»┘è╪س ┘┘ê╪▒┘è ┘"┘"╪ص╪د┘"╪ر ╪╣┘†╪» ╪ح╪╢╪د┘╪ر ╪ث┘ê┘" ╪╡┘ (┘è╪╣┘†┘è ╪ذ╪»╪ة ╪د┘"╪╣┘à┘")
    setTimeout(() => {
      updateTenderStatus();
    }, 100);
  };

  // ╪ص╪░┘ ╪╡┘
  const deleteRow = <Section extends PricingSection>(type: Section, id: string) => {
    setCurrentPricing(prev =>
      mutateSectionRows(prev, type, rows => rows.filter(row => row.id !== id))
    );
    markDirty();
  };

  // ╪ز╪ص╪»┘è╪س ╪╡┘ ┘à╪╣ ┘à╪╣╪د┘"╪ش╪ر ┘à╪ص╪│┘†╪ر ┘"┘"╪ث╪«╪╖╪د╪ة ┘ê╪د┘"╪ز╪ص┘é┘é ┘à┘† ╪╡╪ص╪ر ╪د┘"╪ذ┘è╪د┘†╪د╪ز
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

      // ╪ز╪ص╪»┘è╪س ┘┘ê╪▒┘è ┘"┘"╪ص╪د┘"╪ر ╪ذ╪╣╪» ╪ز╪╣╪»┘è┘" ╪د┘"╪ذ┘è╪د┘†╪د╪ز
      setTimeout(() => {
        updateTenderStatus();
      }, 200);
      markDirty();
    } catch (error) {
      console.error('╪«╪╖╪ث ┘┘è ╪ز╪ص╪»┘è╪س ╪د┘"╪ذ┘è╪د┘†╪د╪ز:', error);
      toast.error('╪«╪╖╪ث ┘┘è ╪ز╪ص╪»┘è╪س ╪د┘"╪ذ┘è╪د┘†╪د╪ز', {
        description: '╪ص╪»╪س ╪«╪╖╪ث ╪ث╪س┘†╪د╪ة ╪ز╪ص╪»┘è╪س ╪د┘"╪ذ┘è╪د┘†╪د╪ز. ┘è╪▒╪ش┘ë ╪د┘"┘à╪ص╪د┘ê┘"╪ر ┘à╪▒╪ر ╪ث╪«╪▒┘ë.',
        duration: 4000,
      });
    }
  };

  // ╪ص┘╪╕ ┘†╪│╪«╪ر ╪د╪ص╪ز┘è╪د╪╖┘è╪ر ┘à┘† ╪د┘"╪ذ┘è╪د┘†╪د╪ز
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
      toast.success('╪ز┘à ╪ح┘†╪┤╪د╪ة ┘†╪│╪«╪ر ╪د╪ص╪ز┘è╪د╪╖┘è╪ر', {
        description: '╪ز┘à ╪ص┘╪╕ ┘†╪│╪«╪ر ╪د╪ص╪ز┘è╪د╪╖┘è╪ر ┘à┘† ╪د┘"╪ذ┘è╪د┘†╪د╪ز ╪ذ┘†╪ش╪د╪ص',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      const reason = error instanceof Error ? error.message : 'unknown-error';
      await noteBackupFailure(tender.id, reason, {
        actor: 'tender-pricing-ui',
        origin: 'renderer'
      });
      toast.error('┘╪┤┘" ╪ح┘†╪┤╪د╪ة ╪د┘"┘†╪│╪«╪ر ╪د┘"╪د╪ص╪ز┘è╪د╪╖┘è╪ر', {
        description: '╪ز╪╣╪░╪▒ ╪ص┘╪╕ ╪د┘"┘†╪│╪«╪ر ╪د┘"╪د╪ص╪ز┘è╪د╪╖┘è╪ر. ┘è╪▒╪ش┘ë ╪د┘"┘à╪ص╪د┘ê┘"╪ر ┘"╪د╪ص┘é╪د┘ï.',
        duration: 4000,
      });
    }
  }, [tender.id, tenderTitle, pricingData, quantityItems, calculateProjectTotal]);

  // ╪ز╪ص┘à┘è┘" ┘é╪د╪خ┘à╪ر ╪د┘"┘†╪│╪« ╪د┘"╪د╪ص╪ز┘è╪د╪╖┘è╪ر ╪╣┘†╪» ┘╪ز╪ص ┘†╪د┘╪░╪ر ╪د┘"╪د╪│╪ز╪▒╪ش╪د╪╣
  const loadBackupsList = useCallback(async () => {
    const entries = await listTenderBackupEntries(tender.id);
    setBackupsList(entries);
  }, [tender.id]);

  // ╪د╪│╪ز╪▒╪ش╪د╪╣ ┘†╪│╪«╪ر ╪د╪ص╪ز┘è╪د╪╖┘è╪ر
  const restoreBackup = useCallback(async (entryId: string) => {
    const snapshot = await restoreTenderBackup(tender.id, entryId, {
      actor: 'tender-pricing-ui',
      origin: 'renderer'
    });

    if (!snapshot) {
      toast.error('╪ز╪╣╪░╪▒ ╪د┘"╪╣╪س┘ê╪▒ ╪╣┘"┘ë ╪د┘"┘†╪│╪«╪ر ╪د┘"╪د╪ص╪ز┘è╪د╪╖┘è╪ر');
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
      // ┘à╪▓╪د┘à┘†╪ر ┘"┘é╪╖╪ر BOQ ╪د┘"┘à╪▒┘â╪▓┘è╪ر ╪ذ╪╣╪» ╪د┘"╪د╪│╪ز╪▒╪ش╪د╪╣
      await persistPricingAndBOQ(restoredMap);
      toast.success('╪ز┘à ╪د╪│╪ز╪▒╪ش╪د╪╣ ╪د┘"┘†╪│╪«╪ر ╪ذ┘†╪ش╪د╪ص');
      setRestoreOpen(false);
      void loadBackupsList();
    } catch (e) {
      console.error('Restore failed:', e);
      toast.error('┘╪┤┘" ╪د╪│╪ز╪▒╪ش╪د╪╣ ╪د┘"┘†╪│╪«╪ر ╪د┘"╪د╪ص╪ز┘è╪د╪╖┘è╪ر');
    }
  }, [tender.id, defaultPercentages, persistPricingAndBOQ, loadBackupsList]);

  // ╪ز╪╡╪»┘è╪▒ ╪د┘"╪ذ┘è╪د┘†╪د╪ز ╪ح┘"┘ë Excel
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
          '╪▒┘é┘à ╪د┘"╪ذ┘†╪»': item.itemNumber,
          '┘ê╪╡┘ ╪د┘"╪ذ┘†╪»': item.description,
          '╪د┘"┘ê╪ص╪»╪ر': item.unit,
          '╪د┘"┘â┘à┘è╪ر': item.quantity,
          '╪│╪╣╪▒ ╪د┘"┘ê╪ص╪»╪ر': unitPrice.toFixed(2),
          '╪د┘"┘é┘è┘à╪ر ╪د┘"╪ح╪ش┘à╪د┘"┘è╪ر': subtotal.toFixed(2),
          '╪ص╪د┘"╪ر ╪د┘"╪ز╪│╪╣┘è╪▒': itemPricing ? '┘à┘â╪ز┘à┘"' : '┘"┘à ┘è╪ذ╪»╪ث'
        };
      });

      // ┘ç┘†╪د ┘è┘à┘â┘† ╪ح╪╢╪د┘╪ر ┘à┘†╪╖┘é ╪د┘"╪ز╪╡╪»┘è╪▒ ╪د┘"┘╪╣┘"┘è
      toast.info('╪ش╪د╪▒┘è ╪ز╪╖┘ê┘è╪▒ ┘ê╪╕┘è┘╪ر ╪د┘"╪ز╪╡╪»┘è╪▒', {
        description: '┘ç╪░┘ç ╪د┘"┘ê╪╕┘è┘╪ر ┘é┘è╪» ╪د┘"╪ز╪╖┘ê┘è╪▒ ┘ê╪│╪ز┘â┘ê┘† ┘à╪ز╪د╪ص╪ر ┘é╪▒┘è╪ذ╪د┘ï',
        duration: 4000,
      });
      
      console.log('╪ذ┘è╪د┘†╪د╪ز ╪د┘"╪ز╪╡╪»┘è╪▒:', exportData);
    } catch (error) {
      console.error('╪«╪╖╪ث ┘┘è ╪ز╪╡╪»┘è╪▒ ╪د┘"╪ذ┘è╪د┘†╪د╪ز:', error);
      toast.error('╪«╪╖╪ث ┘┘è ╪د┘"╪ز╪╡╪»┘è╪▒', {
        description: '╪ص╪»╪س ╪«╪╖╪ث ╪ث╪س┘†╪د╪ة ╪ح╪╣╪»╪د╪» ╪د┘"╪ذ┘è╪د┘†╪د╪ز ┘"┘"╪ز╪╡╪»┘è╪▒',
        duration: 4000,
      });
    }
  }, [quantityItems, pricingData]);

  // ╪╣╪▒╪╢ ┘à┘"╪«╪╡ ╪د┘"┘à╪┤╪▒┘ê╪╣
  const renderSummary = () => {
    const projectTotal = calculateProjectTotal();
  const completedCount = Array.from(pricingData.values()).filter(value => value?.completed).length;
    const completionPercentage = (completedCount / quantityItems.length) * 100;

    return (
      <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">
        <div className="space-y-3 p-1 pb-20" dir="rtl">
          {/* ╪ز╪ص╪░┘è╪▒ ┘"┘"╪ذ┘è╪د┘†╪د╪ز ╪د┘"╪ز╪ش╪▒┘è╪ذ┘è╪ر */}
          {quantityItems.length <= 5 && quantityItems[0]?.id === '1' && (
            <Card className="border-warning/30 bg-warning/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-warning">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">╪ز╪ص╪░┘è╪▒: ┘è╪ز┘à ╪╣╪▒╪╢ ╪ذ┘è╪د┘†╪د╪ز ╪ز╪ش╪▒┘è╪ذ┘è╪ر</span>
                </div>
                <p className="text-sm text-warning mt-1">
                  ┘"┘à ┘è╪ز┘à ╪د┘"╪╣╪س┘ê╪▒ ╪╣┘"┘ë ╪ش╪»┘ê┘" ╪د┘"┘â┘à┘è╪د╪ز ╪د┘"╪ص┘é┘è┘é┘è ┘"┘"┘à┘†╪د┘╪│╪ر. ┘è╪▒╪ش┘ë ╪د┘"╪ز╪ث┘â╪» ┘à┘† ╪ح╪▒┘╪د┘é ┘à┘"┘ ╪د┘"┘â┘à┘è╪د╪ز ╪د┘"╪╡╪ص┘è╪ص.
                </p>
              </CardContent>
            </Card>
          )}

          {/* ╪ح╪ص╪╡╪د╪خ┘è╪د╪ز ╪د┘"┘à╪┤╪▒┘ê╪╣ (┘┘è ╪د┘"╪ث╪╣┘"┘ë) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* ╪ذ╪╖╪د┘é╪ر ┘†╪│╪ذ╪ر ╪د┘"╪ح┘†╪ش╪د╪▓ */}
            <Card className="border-info/30 hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-info" />
                  <span className="text-sm font-medium">┘†╪│╪ذ╪ر ╪د┘"╪ح┘†╪ش╪د╪▓</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-info">{completionPercentage.toFixed(1)}%</div>
                  <div className="text-xs leading-tight text-muted-foreground">{completedCount} / {quantityItems.length} ╪ذ┘†╪»</div>
                </div>
              </CardContent>
            </Card>

            {/* ╪ذ╪╖╪د┘é╪ر ╪د┘"┘é┘è┘à╪ر ╪د┘"╪ح╪ش┘à╪د┘"┘è╪ر ╪د┘"╪ز┘é╪»┘è╪▒┘è╪ر */}
            <Card className="border-success/30 hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">╪د┘"┘é┘è┘à╪ر ╪د┘"╪ح╪ش┘à╪د┘"┘è╪ر</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-success">
                    {formatCurrencyValue(projectTotal, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </div>
                  <div className="text-xs leading-tight text-muted-foreground">╪ح╪ش┘à╪د┘"┘è ╪ز┘é╪»┘è╪▒┘è</div>
                </div>
              </CardContent>
            </Card>

            {/* ╪ذ╪╖╪د┘é╪ر ╪د┘"╪ذ┘†┘ê╪» ╪د┘"┘à╪│╪╣┘ّ╪▒╪ر */}
            <Card className="border-warning/30 hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-warning" />
                  <span className="text-sm font-medium">╪د┘"╪ذ┘†┘ê╪» ╪د┘"┘à╪│╪╣┘ّ╪▒╪ر</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-warning">{pricingData.size}</div>
                  <div className="text-xs leading-tight text-muted-foreground">┘à┘† ╪ث╪╡┘" {quantityItems.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ╪╡┘ ┘ê╪د╪ص╪»: ╪┤╪▒┘è╪╖ ╪د┘"┘†┘╪│╪ذ + 3 ╪ذ╪╖╪د┘é╪د╪ز ╪د┘"╪ز┘â╪د┘"┘è┘ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
            {/* ratios toolbar as first column */}
            <div className="p-2 border border-border rounded-md bg-info/10 h-full overflow-hidden" role="region" aria-label="╪ح╪»╪د╪▒╪ر ╪د┘"┘†╪│╪ذ ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="min-w-0">
                    <span className="block text-xs text-muted-foreground">╪د┘"╪ح╪»╪د╪▒┘è╪ر (%)</span>
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
                      className="w-full h-8 px-2 border border-input rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-info focus:border-transparent"
                      aria-label="╪د┘"┘†╪│╪ذ╪ر ╪د┘"╪ح╪»╪د╪▒┘è╪ر ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs text-muted-foreground">╪د┘"╪ز╪┤╪║┘è┘"┘è╪ر (%)</span>
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
                      className="w-full h-8 px-2 border border-input rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-info focus:border-transparent"
                      aria-label="╪د┘"┘†╪│╪ذ╪ر ╪د┘"╪ز╪┤╪║┘è┘"┘è╪ر ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs text-muted-foreground">╪د┘"╪▒╪ذ╪ص (%)</span>
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
                      className="w-full h-8 px-2 border border-input rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-info focus:border-transparent"
                      aria-label="┘†╪│╪ذ╪ر ╪د┘"╪▒╪ذ╪ص ╪د┘"╪د┘╪ز╪▒╪د╪╢┘è╪ر"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap leading-tight">╪ز┘╪╖╪ذ┘é ╪╣┘"┘ë ╪د┘"╪ذ┘†┘ê╪» ╪د┘"╪ش╪»┘è╪»╪ر</span>
                  <button
                    onClick={applyDefaultPercentagesToExistingItems}
                    title="╪ز╪╖╪ذ┘è┘é ╪╣┘"┘ë ╪د┘"╪ذ┘†┘ê╪» ╪د┘"┘à┘ê╪ش┘ê╪»╪ر"
                    aria-label="╪ز╪╖╪ذ┘è┘é ╪╣┘"┘ë ╪د┘"╪ذ┘†┘ê╪» ╪د┘"┘à┘ê╪ش┘ê╪»╪ر"
                    className="h-8 w-8 bg-warning hover:bg-warning/90 text-warning-foreground rounded-md flex items-center justify-center"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* administrative cost card */}
            <Card className="hover:shadow-sm transition-shadow border-warning/30 h-full">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-xs font-medium text-warning">
                      ╪د┘"╪ز┘â╪د┘"┘è┘ ╪د┘"╪ح╪»╪د╪▒┘è╪ر ({calculateAveragePercentages().administrative.toFixed(1)}%)
                    </p>
                    <p className="text-lg font-bold text-warning">
                      {formatCurrencyValue(calculateTotalAdministrative(), {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </p>
                  </div>
                  <Settings className="h-6 w-6 text-warning" />
                </div>
              </CardContent>
            </Card>

            {/* operational cost card */}
            <Card className="hover:shadow-sm transition-shadow border-accent/30 h-full">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-xs font-medium text-accent">
                      ╪د┘"╪ز┘â╪د┘"┘è┘ ╪د┘"╪ز╪┤╪║┘è┘"┘è╪ر ({calculateAveragePercentages().operational.toFixed(1)}%)
                    </p>
                    <p className="text-lg font-bold text-accent">
                      {formatCurrencyValue(calculateTotalOperational(), {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </p>
                  </div>
                  <Building className="h-6 w-6 text-accent" />
                </div>
              </CardContent>
            </Card>

            {/* profit card */}
            <Card className="hover:shadow-sm transition-shadow border-warning/30 h-full">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-xs font-medium text-warning">
                      ╪ح╪ش┘à╪د┘"┘è ╪د┘"╪ث╪▒╪ذ╪د╪ص ({calculateAveragePercentages().profit.toFixed(1)}%)
                    </p>
                    <p className="text-lg font-bold text-warning">
                      {formatCurrencyValue(calculateTotalProfit(), {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ╪┤╪▒┘è╪╖ ╪د┘"╪ز┘é╪»┘à */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="w-5 h-5 text-info" />
                ╪ز┘é╪»┘à ╪╣┘à┘"┘è╪ر ╪د┘"╪ز╪│╪╣┘è╪▒
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>╪ز┘à ╪ح┘†╪ش╪د╪▓ {completedCount} ┘à┘† {quantityItems.length} ╪ذ┘†╪»</span>
                  <span>{completionPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-2 relative overflow-hidden">
                  {/* ╪┤╪▒┘è╪╖ ╪د┘"╪ز┘é╪»┘à ╪ذ╪╣╪▒╪╢ ╪»┘è┘†╪د┘à┘è┘â┘è */}
                  <div 
 
                    className="bg-gradient-to-r from-info to-success h-2 rounded-full transition-all duration-300 absolute top-0 left-0"
                    {...{style: {width: `${Math.min(Math.max(completionPercentage, 0), 100)}%`}}}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ╪╣╪▒╪╢ ╪ش╪»┘ê┘" ╪د┘"┘â┘à┘è╪د╪ز ╪د┘"╪ث╪│╪د╪│┘è */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-success" />
                ╪ش╪»┘ê┘" ┘â┘à┘è╪د╪ز ╪د┘"┘à┘†╪د┘╪│╪ر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto border rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="bg-muted/20 border-b">
                      <th className="border border-border p-3 text-right font-semibold">╪▒┘é┘à ╪د┘"╪ذ┘†╪»</th>
                      <th className="border border-border p-3 text-right font-semibold">┘ê╪╡┘ ╪د┘"╪ذ┘†╪»</th>
                      <th className="border border-border p-3 text-center font-semibold">╪د┘"┘ê╪ص╪»╪ر</th>
                      <th className="border border-border p-3 text-center font-semibold">╪د┘"┘â┘à┘è╪ر</th>
                      <th className="border border-border p-3 text-center font-semibold">╪│╪╣╪▒ ╪د┘"┘ê╪ص╪»╪ر</th>
                      <th className="border border-border p-3 text-center font-semibold">╪د┘"┘é┘è┘à╪ر ╪د┘"╪ح╪ش┘à╪د┘"┘è╪ر</th>
                      <th className="border border-border p-3 text-center font-semibold">╪ص╪د┘"╪ر ╪د┘"╪ز╪│╪╣┘è╪▒</th>
                      <th className="border border-border p-3 text-center font-semibold">╪ح╪ش╪▒╪د╪ة╪د╪ز</th>
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
                          <tr className={`hover:bg-muted/40 ${isCompleted ? 'bg-success/10' : (isInProgress ? 'bg-warning/10' : 'bg-destructive/10')}`}>
                            <td className="border border-border p-3 font-medium text-right">{item.itemNumber}</td>
                            <td className="border border-border p-3 text-right">
                              <div>
                                <div className="font-medium">{item.description}</div>
                                <div className="text-xs text-muted-foreground mt-1">{item.specifications}</div>
                              </div>
                            </td>
                            <td className="border border-border p-3 text-center font-medium">{item.unit}</td>
                            <td className="border border-border p-3 text-center font-bold">
                              {item.quantity !== undefined && item.quantity !== null ? formatQuantity(item.quantity) : '-'}
                            </td>
                            <td className="border border-border p-3 text-center">
                              {isInProgress ? (
                                <span className="font-bold text-info">
                                  {formatCurrencyValue(unitPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="border border-border p-3 text-center">
                              {isInProgress ? (
                                <span className="font-bold text-success">
                                  {formatCurrencyValue(itemTotal, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="border border-border p-3 text-center">
                              {isCompleted ? (
                                <Badge className="bg-success/15 text-success border-success/20">
                                  <CheckCircle className="w-3 h-3 ml-1" />
                                  ╪ز┘à ╪د┘"╪ز╪│╪╣┘è╪▒
                                </Badge>
                              ) : isInProgress ? (
                                <Badge className="bg-warning/15 text-warning border-warning/20">
                                  ┘é┘è╪» ╪د┘"╪ز╪│╪╣┘è╪▒
                                </Badge>
                              ) : (
                                <Badge className="bg-destructive/15 text-destructive border-destructive/20">
                                  <AlertCircle className="w-3 h-3 ml-1" />
                                  ┘"┘à ┘è╪ز┘à ╪د┘"╪ز╪│╪╣┘è╪▒
                                </Badge>
                              )}
                            </td>
                            <td className="border border-border p-3 text-center">
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
                                {(isCompleted || isInProgress) ? '╪ز╪╣╪»┘è┘"' : '╪ز╪│╪╣┘è╪▒'}
                              </Button>
                            </td>
                          </tr>

                          {hasAnyBreakdown && (
                            <tr className="bg-card">
                              <td colSpan={8} className="p-2 border-b border-border">
                                <div className="space-y-2">
                                  {itemPricing?.materials?.length ? (
                                    <div>
                                      <div 
                                        className="flex items-center justify-between cursor-pointer hover:bg-info/15 p-1 rounded"
                                        onClick={() => toggleCollapse(item.id, 'materials')}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="text-xs font-semibold text-info">╪د┘"┘à┘ê╪د╪» ({itemPricing.materials.length} ╪╡┘†┘)</div>
                                          <Badge variant="outline" className="text-info border-info/30 text-xs">
                                            {formatCurrencyValue(itemPricing.materials.reduce((sum, m) => sum + (m.total || 0), 0), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </Badge>
                                        </div>
                                        {collapsedSections[item.id]?.materials ? 
                                          <ChevronUp className="w-4 h-4 text-info" /> : 
                                          <ChevronDown className="w-4 h-4 text-info" />
                                        }
                                      </div>
                                      {!collapsedSections[item.id]?.materials && (
                                        <div className="overflow-auto border border-border rounded-md">
                                          <table className="w-full text-xs">
                                            <colgroup>
                                              <col className="w-[44%]" />
                                              <col className="w-[12%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[16%]" />
                                            </colgroup>
                                            <thead>
                                              <tr className="text-foreground bg-info/10">
                                                <th className="text-right p-1">╪د┘"╪د╪│┘à/╪د┘"┘ê╪╡┘</th>
                                                <th className="text-center p-1">╪د┘"┘ê╪ص╪»╪ر</th>
                                                <th className="text-center p-1">╪د┘"┘â┘à┘è╪ر</th>
                                                <th className="text-center p-1">╪د┘"╪│╪╣╪▒</th>
                                                <th className="text-center p-1">╪د┘"╪ح╪ش┘à╪د┘"┘è</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {itemPricing.materials.map((m) => (
                                                <tr key={m.id} className="odd:bg-card even:bg-muted/20">
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
                                        className="flex items-center justify-between cursor-pointer hover:bg-success/15 p-1 rounded"
                                        onClick={() => toggleCollapse(item.id, 'labor')}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="text-xs font-semibold text-success">╪د┘"╪╣┘à╪د┘"╪ر ({itemPricing.labor.length} ┘†┘ê╪╣)</div>
                                          <Badge variant="outline" className="text-success border-success/30 text-xs">
                                            {formatCurrencyValue(itemPricing.labor.reduce((sum, l) => sum + (l.total || 0), 0), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </Badge>
                                        </div>
                                        {collapsedSections[item.id]?.labor ? 
                                          <ChevronUp className="w-4 h-4 text-success" /> : 
                                          <ChevronDown className="w-4 h-4 text-success" />
                                        }
                                      </div>
                                      {!collapsedSections[item.id]?.labor && (
                                        <div className="overflow-auto border border-border rounded-md">
                                          <table className="w-full text-xs">
                                            <colgroup>
                                              <col className="w-[44%]" />
                                              <col className="w-[12%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[16%]" />
                                            </colgroup>
                                            <thead>
                                              <tr className="text-foreground bg-success/10">
                                                <th className="text-right p-1">╪د┘"┘ê╪╡┘</th>
                                                <th className="text-center p-1">╪د┘"┘ê╪ص╪»╪ر</th>
                                                <th className="text-center p-1">╪د┘"┘â┘à┘è╪ر</th>
                                                <th className="text-center p-1">╪د┘"╪│╪╣╪▒</th>
                                                <th className="text-center p-1">╪د┘"╪ح╪ش┘à╪د┘"┘è</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {itemPricing.labor.map((l) => (
                                                <tr key={l.id} className="odd:bg-card even:bg-muted/20">
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
                                        className="flex items-center justify-between cursor-pointer hover:bg-accent/15 p-1 rounded"
                                        onClick={() => toggleCollapse(item.id, 'equipment')}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="text-xs font-semibold text-accent">╪د┘"┘à╪╣╪»╪د╪ز ({itemPricing.equipment.length} ┘à╪╣╪»╪ر)</div>
                                          <Badge variant="outline" className="text-accent border-accent/30 text-xs">
                                            {formatCurrencyValue(itemPricing.equipment.reduce((sum, e) => sum + (e.total || 0), 0), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </Badge>
                                        </div>
                                        {collapsedSections[item.id]?.equipment ? 
                                          <ChevronUp className="w-4 h-4 text-accent" /> : 
                                          <ChevronDown className="w-4 h-4 text-accent" />
                                        }
                                      </div>
                                      {!collapsedSections[item.id]?.equipment && (
                                        <div className="overflow-auto border border-border rounded-md">
                                          <table className="w-full text-xs">
                                            <colgroup>
                                              <col className="w-[44%]" />
                                              <col className="w-[12%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[16%]" />
                                            </colgroup>
                                            <thead>
                                              <tr className="text-foreground bg-accent/10">
                                                <th className="text-right p-1">╪د┘"┘ê╪╡┘</th>
                                                <th className="text-center p-1">╪د┘"┘ê╪ص╪»╪ر</th>
                                                <th className="text-center p-1">╪د┘"┘â┘à┘è╪ر</th>
                                                <th className="text-center p-1">╪د┘"╪│╪╣╪▒</th>
                                                <th className="text-center p-1">╪د┘"╪ح╪ش┘à╪د┘"┘è</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {itemPricing.equipment.map((e) => (
                                                <tr key={e.id} className="odd:bg-card even:bg-muted/20">
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
                                        className="flex items-center justify-between cursor-pointer hover:bg-secondary/15 p-1 rounded"
                                        onClick={() => toggleCollapse(item.id, 'subcontractors')}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="text-xs font-semibold text-secondary">┘à┘é╪د┘ê┘"┘ê ╪د┘"╪ذ╪د╪╖┘† ({itemPricing.subcontractors.length} ┘à┘é╪د┘ê┘")</div>
                                          <Badge variant="outline" className="text-secondary border-secondary/30 text-xs">
                                            {formatCurrencyValue(itemPricing.subcontractors.reduce((sum, s) => sum + (s.total || 0), 0), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </Badge>
                                        </div>
                                        {collapsedSections[item.id]?.subcontractors ? 
                                          <ChevronUp className="w-4 h-4 text-secondary" /> : 
                                          <ChevronDown className="w-4 h-4 text-secondary" />
                                        }
                                      </div>
                                      {!collapsedSections[item.id]?.subcontractors && (
                                        <div className="overflow-auto border border-border rounded-md">
                                          <table className="w-full text-xs">
                                            <colgroup>
                                              <col className="w-[44%]" />
                                              <col className="w-[12%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[14%]" />
                                              <col className="w-[16%]" />
                                            </colgroup>
                                            <thead>
                                              <tr className="text-foreground bg-secondary/10">
                                                <th className="text-right p-1">╪د┘"┘ê╪╡┘</th>
                                                <th className="text-center p-1">╪د┘"┘ê╪ص╪»╪ر</th>
                                                <th className="text-center p-1">╪د┘"┘â┘à┘è╪ر</th>
                                                <th className="text-center p-1">╪د┘"╪│╪╣╪▒</th>
                                                <th className="text-center p-1">╪د┘"╪ح╪ش┘à╪د┘"┘è</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {itemPricing.subcontractors.map((s) => (
                                                <tr key={s.id} className="odd:bg-card even:bg-muted/20">
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

          {/* ┘à┘"╪«╪╡ ┘à╪د┘"┘è */}
          {projectTotal > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-success" />
                  ╪د┘"┘à┘"╪«╪╡ ╪د┘"┘à╪د┘"┘è ┘"┘"┘à╪┤╪▒┘ê╪╣
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-info/10 rounded-lg">
                      <span className="font-medium">╪ح╪ش┘à╪د┘"┘è ┘é┘è┘à╪ر ╪د┘"╪ذ┘†┘ê╪» ╪د┘"┘à┘╪│╪╣╪▒╪ر:</span>
                      <span className="font-bold text-info">
                        {formatCurrencyValue(calculateItemsTotal(), {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                      <span className="font-medium">
                        ╪ح╪ش┘à╪د┘"┘è ╪د┘"╪ز┘â╪د┘"┘è┘ ╪د┘"╪ح╪»╪د╪▒┘è╪ر ({calculateAveragePercentages().administrative.toFixed(1)}%):
                      </span>
                      <span className="font-bold text-warning">
                        {formatCurrencyValue(calculateTotalAdministrative(), {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent/10 rounded-lg">
                      <span className="font-medium">
                        ╪ح╪ش┘à╪د┘"┘è ╪د┘"╪ز┘â╪د┘"┘è┘ ╪د┘"╪ز╪┤╪║┘è┘"┘è╪ر ({calculateAveragePercentages().operational.toFixed(1)}%):
                      </span>
                      <span className="font-bold text-accent">
                        {formatCurrencyValue(calculateTotalOperational(), {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <span className="font-medium">╪╢╪▒┘è╪ذ╪ر ╪د┘"┘é┘è┘à╪ر ╪د┘"┘à╪╢╪د┘╪ر (15%):</span>
                      <span className="font-bold text-muted-foreground">
                        {formatCurrencyValue(calculateVAT(), {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-warning/15 rounded-lg">
                      <span className="font-medium">
                        ╪ح╪ش┘à╪د┘"┘è ╪د┘"╪ث╪▒╪ذ╪د╪ص ({calculateAveragePercentages().profit.toFixed(1)}%):
                      </span>
                      <span className="font-bold text-warning">
                        {formatCurrencyValue(calculateTotalProfit(), {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center p-4 bg-success/10 rounded-lg">
                    <span className="font-bold text-lg">╪د┘"┘é┘è┘à╪ر ╪د┘"╪ح╪ش┘à╪د┘"┘è╪ر ╪د┘"┘†┘ç╪د╪خ┘è╪ر:</span>
                    <span className="font-bold text-xl text-success">
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

  // ╪╣╪▒╪╢ ╪╡┘╪ص╪ر ╪د┘"╪ز╪│╪╣┘è╪▒ ╪د┘"╪ز┘╪╡┘è┘"┘è
  const renderPricing = () => {
    if (!currentItem) return null;
    const totals = calculateTotals();

    return (
      <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">
        <div className="space-y-4 p-1 pb-24" dir="rtl">
          {/* ┘à╪╣┘"┘ê┘à╪د╪ز ╪د┘"╪ذ┘†╪» ╪د┘"╪ص╪د┘"┘è (┘à╪╢╪║┘ê╪╖╪ر) */}
          <Card className="border-info/30 bg-info/10">
            <CardHeader className="p-3">
              <CardTitle className="flex items-center justify-between text-base" dir="rtl">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-info" />
                  <span className="font-semibold">╪ز╪│╪╣┘è╪▒ ╪د┘"╪ذ┘†╪» ╪▒┘é┘à {currentItem.itemNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                    disabled={currentItemIndex === 0}
                  >
                    ╪د┘"╪ذ┘†╪» ╪د┘"╪│╪د╪ذ┘é
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentItemIndex(Math.min(quantityItems.length - 1, currentItemIndex + 1))}
                    disabled={currentItemIndex === quantityItems.length - 1}
                  >
                    ╪د┘"╪ذ┘†╪» ╪د┘"╪ز╪د┘"┘è
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3" dir="rtl">
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground">┘ê╪╡┘ ╪د┘"╪ذ┘†╪»</Label>
                  <p className="text-sm font-medium text-foreground text-right line-clamp-2">{currentItem.description}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">╪د┘"┘ê╪ص╪»╪ر</Label>
                  <p className="text-sm font-medium text-info text-right">{currentItem.unit}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">╪د┘"┘â┘à┘è╪ر</Label>
                  <p className="text-sm font-bold text-success text-right">{formatQuantity(currentItem.quantity)}</p>
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs font-medium text-muted-foreground">╪د┘"┘à┘ê╪د╪╡┘╪د╪ز ╪د┘"┘┘†┘è╪ر</Label>
                <p className="text-xs text-muted-foreground text-right leading-relaxed p-2 bg-muted/20 rounded border border-border">{currentItem.specifications}</p>
              </div>
            </CardContent>
          </Card>

          {/* ╪┤╪▒┘è╪╖ ╪ح╪╣╪»╪د╪»╪د╪ز ┘à╪╢╪║┘ê╪╖ ┘┘ê┘é ╪د┘"╪ش╪»╪د┘ê┘" */}
          <Card className="border-border">
            <CardContent className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">╪╖╪▒┘è┘é╪ر ╪د┘"╪ز┘†┘┘è╪░</Label>
                  <Select
                    value={currentPricing.executionMethod ?? '╪░╪د╪ز┘è'}
                    onValueChange={(value: ExecutionMethod) =>
                      setCurrentPricing(prev => {
                        const next = { ...prev, executionMethod: value };
                        markDirty();
                        return next;
                      })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="╪د╪«╪ز╪▒ ╪╖╪▒┘è┘é╪ر ╪د┘"╪ز┘†┘┘è╪░" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="╪░╪د╪ز┘è">╪ز┘†┘┘è╪░ ╪░╪د╪ز┘è</SelectItem>
                      <SelectItem value="┘à┘é╪د┘ê┘" ╪ذ╪د╪╖┘†">┘à┘é╪د┘ê┘" ╪ذ╪د╪╖┘†</SelectItem>
                      <SelectItem value="┘à╪«╪ز┘"╪╖">┘à╪«╪ز┘"╪╖</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs block mb-1 text-muted-foreground">╪د┘"┘†╪│╪ذ╪ر ╪د┘"╪ح╪»╪د╪▒┘è╪ر (%)</Label>
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
                  <Label className="text-xs block mb-1 text-muted-foreground">╪د┘"┘†╪│╪ذ╪ر ╪د┘"╪ز╪┤╪║┘è┘"┘è╪ر (%)</Label>
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
                  <Label className="text-xs block mb-1 text-muted-foreground">┘†╪│╪ذ╪ر ╪د┘"╪▒╪ذ╪ص (%)</Label>
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

          {/* ╪ش╪»╪د┘ê┘" ╪د┘"╪ز╪│╪╣┘è╪▒ ╪ذ╪╣╪▒╪╢ ┘â╪د┘à┘" */}
          <Tabs defaultValue="materials" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-4" dir="rtl">
              <TabsTrigger value="materials" className="flex items-center gap-2 flex-row-reverse">
                ╪د┘"┘à┘ê╪د╪»
                <Package className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="labor" className="flex items-center gap-2 flex-row-reverse">
                ╪د┘"╪╣┘à╪د┘"╪ر
                <Users className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="equipment" className="flex items-center gap-2 flex-row-reverse">
                ╪د┘"┘à╪╣╪»╪د╪ز
                <Truck className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="subcontractors" className="flex items-center gap-2 flex-row-reverse">
                ╪د┘"┘à┘é╪د┘ê┘"┘è┘†
                <Building className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            {/* ╪ش╪»┘ê┘" ╪د┘"┘à┘ê╪د╪» */}
            <TabsContent value="materials">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="w-4 h-4 text-info" />
                      ╪د┘"┘à┘ê╪د╪» ┘ê╪د┘"╪«╪د┘à╪د╪ز
                    </CardTitle>
                    <Button onClick={() => addRow('materials')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      ╪ح╪╢╪د┘╪ر ┘à╪د╪»╪ر
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm" dir="rtl">
                      <thead className="sticky top-0 z-10 bg-muted/20">
                        <tr>
                          <th className="border p-2 text-right">╪د╪│┘à ╪د┘"┘à╪د╪»╪ر</th>
                          <th className="border p-2 text-right">╪د┘"┘ê╪╡┘</th>
                          <th className="border p-2 text-center">╪د┘"┘ê╪ص╪»╪ر</th>
                          <th className="border p-2 text-center">╪د┘"┘â┘à┘è╪ر</th>
                          <th className="border p-2 text-center">╪د┘"╪│╪╣╪▒</th>
                          <th className="border p-2 text-center">┘╪د┘é╪»</th>
                          <th className="border p-2 text-center">┘†╪│╪ذ╪ر ╪د┘"┘╪د┘é╪»</th>
                          <th className="border p-2 text-center">╪د┘"╪ح╪ش┘à╪د┘"┘è</th>
                          <th className="border p-2 text-center">╪ح╪ش╪▒╪د╪ة╪د╪ز</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.materials.map((material) => (
                          <tr key={material.id}>
                            <td className="border p-2">
                              <Input
                                value={material.name ?? ''}
                                onChange={(e) => updateRow('materials', material.id, 'name', e.target.value)}
                                placeholder="╪د╪│┘à ╪د┘"┘à╪د╪»╪ر"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={material.description ?? ''}
                                onChange={(e) => updateRow('materials', material.id, 'description', e.target.value)}
                                placeholder="╪د┘"┘ê╪╡┘"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={material.unit ?? ''}
                                onChange={(e) => updateRow('materials', material.id, 'unit', e.target.value)}
                                placeholder="╪د┘"┘ê╪ص╪»╪ر"
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
                                placeholder="╪د┘"┘â┘à┘è╪ر"
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
                                placeholder="╪د┘"╪│╪╣╪▒"
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

            {/* ╪ش╪»┘ê┘" ╪د┘"╪╣┘à╪د┘"╪ر */}
            <TabsContent value="labor">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="w-4 h-4 text-success" />
                      ╪د┘"╪╣┘à╪د┘"╪ر
                    </CardTitle>
                    <Button onClick={() => addRow('labor')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      ╪ح╪╢╪د┘╪ر ╪╣╪د┘à┘"
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm" dir="rtl">
                      <thead className="sticky top-0 z-10 bg-muted/20">
                        <tr>
                          <th className="border p-2 text-right">╪د┘"┘ê╪╡┘</th>
                          <th className="border p-2 text-center">╪د┘"┘ê╪ص╪»╪ر</th>
                          <th className="border p-2 text-center">╪د┘"┘â┘à┘è╪ر</th>
                          <th className="border p-2 text-center">╪د┘"╪│╪╣╪▒</th>
                          <th className="border p-2 text-center">╪د┘"╪ح╪ش┘à╪د┘"┘è</th>
                          <th className="border p-2 text-center">╪ح╪ش╪▒╪د╪ة╪د╪ز</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.labor.map((labor) => (
                          <tr key={labor.id}>
                            <td className="border p-2">
                              <Input
                                value={labor.description}
                                onChange={(e) => updateRow('labor', labor.id, 'description', e.target.value)}
                                placeholder="┘ê╪╡┘ ╪د┘"╪╣┘à╪د┘"╪ر"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={labor.unit}
                                onChange={(e) => updateRow('labor', labor.id, 'unit', e.target.value)}
                                placeholder="╪د┘"┘ê╪ص╪»╪ر"
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
                                placeholder="╪د┘"┘â┘à┘è╪ر"
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
                                placeholder="╪د┘"╪│╪╣╪▒"
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

            {/* ╪ش╪»┘ê┘" ╪د┘"┘à╪╣╪»╪د╪ز */}
            <TabsContent value="equipment">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Truck className="w-4 h-4 text-accent" />
                      ╪د┘"┘à╪╣╪»╪د╪ز ┘ê╪د┘"╪ت┘"╪د╪ز
                    </CardTitle>
                    <Button onClick={() => addRow('equipment')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      ╪ح╪╢╪د┘╪ر ┘à╪╣╪»╪ر
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/20">
                        <tr>
                          <th className="border p-2 text-right">╪د┘"┘ê╪╡┘</th>
                          <th className="border p-2 text-center">╪د┘"┘ê╪ص╪»╪ر</th>
                          <th className="border p-2 text-center">╪د┘"┘â┘à┘è╪ر</th>
                          <th className="border p-2 text-center">╪د┘"╪│╪╣╪▒</th>
                          <th className="border p-2 text-center">╪د┘"╪ح╪ش┘à╪د┘"┘è</th>
                          <th className="border p-2 text-center">╪ح╪ش╪▒╪د╪ة╪د╪ز</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.equipment.map((equipment) => (
                          <tr key={equipment.id}>
                            <td className="border p-2">
                              <Input
                                value={equipment.description}
                                onChange={(e) => updateRow('equipment', equipment.id, 'description', e.target.value)}
                                placeholder="┘ê╪╡┘ ╪د┘"┘à╪╣╪»╪ر"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={equipment.unit}
                                onChange={(e) => updateRow('equipment', equipment.id, 'unit', e.target.value)}
                                placeholder="╪د┘"┘ê╪ص╪»╪ر"
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
                                placeholder="╪د┘"┘â┘à┘è╪ر"
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
                                placeholder="╪د┘"╪│╪╣╪▒"
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

            {/* ╪ش╪»┘ê┘" ╪د┘"┘à╪╣╪»╪د╪ز */}
            <TabsContent value="equipment">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Truck className="w-4 h-4 text-accent" />
                      ╪د┘"┘à╪╣╪»╪د╪ز ┘ê╪د┘"╪ت┘"╪د╪ز
                    </CardTitle>
                    <Button onClick={() => addRow('equipment')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      ╪ح╪╢╪د┘╪ر ┘à╪╣╪»╪ر
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/20">
                        <tr>
                          <th className="border p-2 text-right">╪د┘"┘ê╪╡┘</th>
                          <th className="border p-2 text-center">╪د┘"┘ê╪ص╪»╪ر</th>
                          <th className="border p-2 text-center">╪د┘"┘â┘à┘è╪ر</th>
                          <th className="border p-2 text-center">╪د┘"╪│╪╣╪▒</th>
                          <th className="border p-2 text-center">╪د┘"╪ح╪ش┘à╪د┘"┘è</th>
                          <th className="border p-2 text-center">╪ح╪ش╪▒╪د╪ة╪د╪ز</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.equipment.map((equipment) => (
                          <tr key={equipment.id}>
                            <td className="border p-2">
                              <Input
                                value={equipment.description}
                                onChange={(e) => updateRow('equipment', equipment.id, 'description', e.target.value)}
                                placeholder="┘ê╪╡┘ ╪د┘"┘à╪╣╪»╪ر"
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={equipment.unit}
                                onChange={(e) => updateRow('equipment', equipment.id, 'unit', e.target.value)}
                                placeholder="╪د┘"┘ê╪ص╪»╪ر"
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
                                placeholder="╪د┘"┘â┘à┘è╪ر"
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
                                placeholder="╪د┘"╪│╪╣╪▒"
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

            {/* ╪ش╪»┘ê┘" ╪د┘"┘à┘é╪د┘ê┘"┘è┘† */}
            <TabsContent value="subcontractors">
              <Card>
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building className="w-4 h-4 text-secondary" />
                      ╪د┘"┘à┘é╪د┘ê┘"┘ê┘† ┘à┘† ╪د┘"╪ذ╪د╪╖┘†
                    </CardTitle>
                    <Button onClick={() => addRow('subcontractors')} size="sm" className="h-8">
                      <Plus className="w-4 h-4 ml-1" />
                      ╪ح╪╢╪د┘╪ر ┘à┘é╪د┘ê┘"
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/20">
                        <tr>
                          <th className="border p-2 text-right">╪د┘"┘ê╪╡┘</th>
                          <th className="border p-2 text-center">╪د┘"┘ê╪ص╪»╪ر</th>
                          <th className="border p-2 text-center">╪د┘"┘â┘à┘è╪ر</th>
                          <th className="border p-2 text-center">╪د┘"╪│╪╣╪▒</th>
                          <th className="border p-2 text-center">╪د┘"╪ح╪ش┘à╪د┘"┘è</th>
                          <th className="border p-2 text-center">╪ح╪ش╪▒╪د╪ة╪د╪ز</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPricing.subcontractors.map((subcontractor) => (
                          <tr key={subcontractor.id}>
                            <td className="border p-2">
                              <Input
                                value={subcontractor.description}
                                onChange={(e) => updateRow('subcontractors', subcontractor.id, 'description', e.target.value)}
                                placeholder="┘ê╪╡┘ ╪د┘"╪╣┘à┘""
                                className="h-8 py-1 text-sm"
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                value={subcontractor.unit}
                                onChange={(e) => updateRow('subcontractors', subcontractor.id, 'unit', e.target.value)}
                                placeholder="╪د┘"┘ê╪ص╪»╪ر"
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
                                placeholder="╪د┘"┘â┘à┘è╪ر"
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
                                placeholder="╪د┘"╪│╪╣╪▒"
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

              {/* ╪د┘"┘à┘"╪د╪ص╪╕╪د╪ز ╪د┘"┘┘†┘è╪ر */}
              <Card>
            <CardHeader className="p-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-muted-foreground" />
                ╪د┘"┘à┘"╪د╪ص╪╕╪د╪ز ╪د┘"┘┘†┘è╪ر
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Textarea
                value={currentPricing.technicalNotes}
                onChange={(e) => setCurrentPricing(prev => { const next = { ...prev, technicalNotes: e.target.value }; markDirty(); return next; })}
                placeholder="╪ث╪╢┘ ╪ث┘è ┘à┘"╪د╪ص╪╕╪د╪ز ┘┘†┘è╪ر ╪«╪د╪╡╪ر ╪ذ┘ç╪░╪د ╪د┘"╪ذ┘†╪»..."
                rows={4}
                className="text-right text-sm"
              />
            </CardContent>
          </Card>
            
              {/* ╪د┘"┘à┘"╪«╪╡ ╪د┘"┘à╪د┘"┘è */}
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-success" />
                  ╪د┘"┘à┘"╪«╪╡ ╪د┘"┘à╪د┘"┘è
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-info/10 rounded">
                  <span>╪د┘"┘à┘ê╪د╪»:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.materials)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-success/10 rounded">
                  <span>╪د┘"╪╣┘à╪د┘"╪ر:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.labor)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-accent/10 rounded">
                  <span>╪د┘"┘à╪╣╪»╪د╪ز:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.equipment)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-secondary/10 rounded">
                  <span>╪د┘"┘à┘é╪د┘ê┘"┘ê┘†:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.subcontractors)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span>╪د┘"┘à╪ش┘à┘ê╪╣ ╪د┘"┘╪▒╪╣┘è:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span>╪د┘"╪ز┘â╪د┘"┘è┘ ╪د┘"╪ح╪»╪د╪▒┘è╪ر:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.administrative)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span>╪د┘"╪ز┘â╪د┘"┘è┘ ╪د┘"╪ز╪┤╪║┘è┘"┘è╪ر:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.operational)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">
                  <span>╪د┘"╪▒╪ذ╪ص:</span>
                  <span className="font-bold">{formatCurrencyValue(totals.profit)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-success/15 rounded-lg">
                  <span className="font-bold text-lg">╪د┘"╪ح╪ش┘à╪د┘"┘è ╪د┘"┘†┘ç╪د╪خ┘è:</span>
                  <span className="font-bold text-xl text-success">{formatCurrencyValue(totals.total)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-info/15 rounded">
                  <span className="font-medium">╪│╪╣╪▒ ╪د┘"┘ê╪ص╪»╪ر:</span>
                  <span className="font-bold text-info">
                    {formatCurrencyValue(totals.total / currentItem.quantity, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </CardContent>
              </Card>

          {/* ╪┤╪▒┘è╪╖ ╪ح╪ش╪▒╪د╪ة╪د╪ز ┘à╪س╪ذ╪ز ╪ث╪│┘┘" ╪د┘"╪╣╪▒╪╢ */}
          <ActionBar sticky position="bottom" align="center" elevated className="z-20">
            <div className="flex flex-wrap items-center justify-center gap-3">
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
                ╪د┘"╪ذ┘†╪» ╪د┘"╪│╪د╪ذ┘é
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
                  <Button className="flex items-center gap-2 bg-success text-success-foreground hover:bg-success/90 px-6 h-9">
                    <Save className="w-4 h-4" />
                    ╪ص┘╪╕ ╪ز╪│╪╣┘è╪▒ ╪د┘"╪ذ┘†╪»
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
                ╪د┘"╪ذ┘†╪» ╪د┘"╪ز╪د┘"┘è
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
            </div>
          </ActionBar>
        </div>
      </ScrollArea>
    );
  };

  // ╪╣╪▒╪╢ ╪د┘"╪╣╪▒╪╢ ╪د┘"┘┘†┘è
  const renderTechnical = () => {
    return (
      <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">
        <div className="space-y-6 p-1 pb-20" dir="rtl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-info" />
                ╪▒┘╪╣ ┘à┘"┘╪د╪ز ╪د┘"╪╣╪▒╪╢ ╪د┘"┘┘†┘è
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
            title="┘"╪د ╪ز┘ê╪ش╪» ╪ذ┘†┘ê╪» ┘"┘"╪ز╪│╪╣┘è╪▒"
            description="┘è╪ش╪ذ ╪ح╪╢╪د┘╪ر ╪ش╪»┘ê┘" ╪د┘"┘â┘à┘è╪د╪ز ┘"┘"┘à┘†╪د┘é╪╡╪ر ┘é╪ذ┘" ╪د┘"╪ذ╪»╪ة ┘┘è ╪╣┘à┘"┘è╪ر ╪د┘"╪ز╪│╪╣┘è╪▒."
            actionLabel="╪د┘"╪╣┘ê╪»╪ر"
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
  <div className="flex items-center gap-3 mb-4 sticky top-0 bg-background/80 backdrop-blur z-20 py-2 border-b">
        <Button
          variant="outline"
          onClick={handleAttemptLeave}
          className="flex items-center gap-2 hover:bg-muted/30"
        >
          <ArrowRight className="w-4 h-4" />
          ╪د┘"╪╣┘ê╪»╪ر
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">╪╣┘à┘"┘è╪ر ╪د┘"╪ز╪│╪╣┘è╪▒</h1>
          <p className="text-muted-foreground text-sm">{tender.name || tender.title || '┘à┘†╪د┘╪│╪ر ╪ش╪»┘è╪»╪ر'}</p>
          {/* ╪┤╪▒┘è╪╖ ╪ص╪د┘"╪ر ╪د┘"┘†╪│╪«╪ر ╪د┘"╪▒╪│┘à┘è╪ر / ╪د┘"┘à╪│┘ê╪»╪ر */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {editablePricing.source === 'official' && (
              <Badge className="bg-success text-success-foreground hover:bg-success/90">┘†╪│╪«╪ر ╪▒╪│┘à┘è╪ر ┘à╪╣╪ز┘à╪»╪ر</Badge>
            )}
            {editablePricing.source === 'draft' && editablePricing.isDraftNewer && (
              <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">┘à╪│┘ê╪»╪ر ╪ث╪ص╪»╪س (╪║┘è╪▒ ┘à╪╣╪ز┘à╪»╪ر)</Badge>
            )}
            {/* Snapshot indicator removed ╪ذ╪╣╪» ╪ح┘"╪║╪د╪ة ┘†╪╕╪د┘à ╪د┘"┘"┘é╪╖╪د╪ز */}
            {/* Removed legacy 'hook' source badge after unification */}
            {editablePricing.hasDraft && !editablePricing.isDraftNewer && editablePricing.source === 'official' && (
              <Badge variant="secondary" className="bg-muted/30 text-muted-foreground">┘à╪│┘ê╪»╪ر ┘à╪ص┘┘ê╪╕╪ر</Badge>
            )}
            {editablePricing.dirty && (
              <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse">╪ز╪║┘è┘è╪▒╪د╪ز ╪║┘è╪▒ ┘à╪ص┘┘ê╪╕╪ر ╪▒╪│┘à┘è╪د┘ï</Badge>
            )}
          </div>
        </div>
        
        {/* ╪┤╪▒┘è╪╖ ╪ث╪»┘ê╪د╪ز ┘à┘╪╣╪د╪» ╪ز╪╡┘à┘è┘à┘ç */}
        <div className="flex items-center gap-2">
          {/* ┘é┘ê╪د┘"╪ذ ╪د┘"╪ز╪│╪╣┘è╪▒ */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplateManagerOpen(true)}
            className="flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            ╪د┘"┘é┘ê╪د┘"╪ذ
          </Button>

          {/* ╪د╪╣╪ز┘à╪د╪» ╪▒╪│┘à┘è */}
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
                toast.success('╪ز┘à ╪د╪╣╪ز┘à╪د╪» ╪د┘"╪ز╪│╪╣┘è╪▒ ╪▒╪│┘à┘è╪د┘ï', { duration: 2500 });
              } catch (e) {
                console.error('Official save failed', e);
                toast.error('┘╪┤┘" ╪د╪╣╪ز┘à╪د╪» ╪د┘"┘†╪│╪«╪ر ╪د┘"╪▒╪│┘à┘è╪ر');
              }
            }}
            trigger={
              <Button
                size="sm"
                className="flex items-center gap-2 bg-success text-success-foreground hover:bg-success/90"
                disabled={editablePricing.status !== 'ready' || (!editablePricing.dirty && !editablePricing.isDraftNewer && editablePricing.source === 'official')}
              >
                <CheckCircle className="w-4 h-4" />
                ╪د╪╣╪ز┘à╪د╪»
              </Button>
            }
          />
          {/* ┘†╪│╪ذ╪ر ╪د┘"╪ح┘†╪ش╪د╪▓ ┘à╪«╪ز╪╡╪▒╪ر */}
          <div className="px-3 py-1.5 rounded-md border border-info/30 bg-gradient-to-l from-info/20 to-success/20 text-xs text-info flex flex-col items-center leading-tight">
            <span className="font-bold">
              {(() => {
                const c = Array.from(pricingData.values()).filter(value => value?.completed).length;
                return Math.round((c / quantityItems.length) * 100);
              })()}%
            </span>
            <span className="text-xs leading-none">
              {Array.from(pricingData.values()).filter(value => value?.completed).length}/{quantityItems.length}
            </span>
          </div>
          {/* ┘é╪د╪خ┘à╪ر ╪د┘"╪ث╪»┘ê╪د╪ز ╪د┘"╪س╪د┘†┘ê┘è╪ر */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                ╪ث╪»┘ê╪د╪ز
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
                    <Save className="w-4 h-4 text-success" /> ╪ص┘╪╕ ╪ز╪│╪╣┘è╪▒ ╪د┘"╪ذ┘†╪»
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuSeparator />
              <ConfirmationDialog
                title="╪ح┘†╪┤╪د╪ة ┘†╪│╪«╪ر ╪د╪ص╪ز┘è╪د╪╖┘è╪ر"
                description="╪│┘è╪ز┘à ╪ص┘╪╕ ┘†╪│╪«╪ر ╪د╪ص╪ز┘è╪د╪╖┘è╪ر ┘à┘† ╪ص╪د┘"╪ر ╪د┘"╪ز╪│╪╣┘è╪▒ ╪د┘"╪ص╪د┘"┘è╪ر (┘è╪ز┘à ╪د┘"╪د╪ص╪ز┘╪د╪╕ ╪ذ╪ت╪«╪▒ 10 ┘┘é╪╖). ┘ç┘" ╪ز╪▒┘è╪» ╪د┘"┘à╪ز╪د╪ذ╪╣╪ر╪ا"
                confirmText="┘†╪╣┘à╪î ╪ح┘†╪┤╪د╪ة ┘†╪│╪«╪ر"
                cancelText="╪ح┘"╪║╪د╪ة"
                variant="success"
                icon="save"
                onConfirm={() => { void createBackup(); }}
                trigger={
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <RotateCcw className="w-4 h-4 text-info" /> ╪ح┘†╪┤╪د╪ة ┘†╪│╪«╪ر ╪د╪ص╪ز┘è╪د╪╖┘è╪ر
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem onClick={() => { setRestoreOpen(true); void loadBackupsList(); }} className="flex items-center gap-2 cursor-pointer">
                <RotateCcw className="w-4 h-4 text-info" /> ╪د╪│╪ز╪▒╪ش╪د╪╣ ┘†╪│╪«╪ر
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>╪د┘"╪ز╪╡╪»┘è╪▒</DropdownMenuLabel>
              <DropdownMenuItem onClick={exportPricingToExcel} className="flex items-center gap-2 cursor-pointer">
                <Download className="w-4 h-4 text-success" /> ╪ز╪╡╪»┘è╪▒ Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>╪ح╪ش╪▒╪د╪ة╪د╪ز</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { updateTenderStatus(); toast.success('╪ز┘à ╪ز╪ص╪»┘è╪س ╪ص╪د┘"╪ر ╪د┘"┘à┘†╪د┘╪│╪ر'); }} className="flex items-center gap-2 cursor-pointer">
                <TrendingUp className="w-4 h-4 text-secondary" /> ╪ز╪ص╪»┘è╪س ╪د┘"╪ص╪د┘"╪ر
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Dialog ╪د┘"╪د╪│╪ز╪▒╪ش╪د╪╣ ╪ذ┘é┘è ┘"┘"╪د╪│╪ز╪«╪»╪د┘à ┘"┘â┘†┘ç ╪ث┘╪«╪▒╪ش ┘à┘† ╪د┘"╪ز╪ش┘à╪╣ ╪د┘"╪ذ╪╡╪▒┘è ┘"┘"╪ث╪▓╪▒╪د╪▒ */}
  <Dialog open={restoreOpen} onOpenChange={(openState) => { setRestoreOpen(openState); if (openState) void loadBackupsList(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>╪د╪│╪ز╪▒╪ش╪د╪╣ ┘†╪│╪«╪ر ╪د╪ص╪ز┘è╪د╪╖┘è╪ر</DialogTitle>
            <DialogDescription>╪د╪«╪ز╪▒ ┘†╪│╪«╪ر ┘"╪د╪│╪ز╪▒╪ش╪د╪╣ ╪ذ┘è╪د┘†╪د╪ز ╪د┘"╪ز╪│╪╣┘è╪▒.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-auto mt-2 space-y-2" dir="rtl">
            {backupsList.length === 0 && (
              <EmptyState
                icon={RotateCcw}
                title="┘"╪د ╪ز┘ê╪ش╪» ┘†╪│╪« ╪د╪ص╪ز┘è╪د╪╖┘è╪ر"
                description="┘"┘à ┘è╪ز┘à ╪ح┘†╪┤╪د╪ة ╪ث┘è ┘†╪│╪« ╪د╪ص╪ز┘è╪د╪╖┘è╪ر ┘"┘ç╪░┘ç ╪د┘"┘à┘†╪د┘╪│╪ر ╪ذ╪╣╪»."
              />
            )}
            {backupsList.map((b)=> (
              <div key={b.id} className="flex items-center justify-between border border-border rounded p-2">
                <div className="text-sm">
                  <div className="font-medium">{formatTimestamp(b.timestamp)}</div>
                  <div className="text-muted-foreground">┘†╪│╪ذ╪ر ╪د┘"╪ح┘â┘à╪د┘": {Math.round(b.completionPercentage)}% ظ€ت ╪د┘"╪ح╪ش┘à╪د┘"┘è: {formatCurrencyValue(b.totalValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div className="text-xs text-muted-foreground">
                    ╪د┘"╪╣┘†╪د╪╡╪▒ ╪د┘"┘à╪│╪╣╪▒╪ر: {b.itemsPriced}/{b.itemsTotal}
                    {b.retentionExpiresAt
                      ? ` ظ€ت ╪د┘"╪د╪ص╪ز┘╪د╪╕ ╪ص╪ز┘ë ${formatDateValue(b.retentionExpiresAt, {
                          locale: 'ar-SA',
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric'
                        })}`
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={()=>restoreBackup(b.id)}>╪د╪│╪ز╪▒╪ش╪د╪╣</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline">╪ح╪║┘"╪د┘é</Button>
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
            <span>╪د┘"┘à┘"╪«╪╡</span>
            <PieChart className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2 flex-row-reverse">
            {currentItem && pricingData.get(currentItem.id)?.completed && (
              <Badge variant="outline" className="mr-1 text-success border-success/40">
                ┘à╪ص┘┘ê╪╕
                <CheckCircle className="w-3 h-3 mr-1" />
              </Badge>
            )}
            <span>╪د┘"╪ز╪│╪╣┘è╪▒</span>
            <Calculator className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2 flex-row-reverse">
            <span>╪د┘"╪╣╪▒╪╢ ╪د┘"┘┘†┘è</span>
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

      {/* Pricing Template Manager Dialog */}
      <Dialog open={templateManagerOpen} onOpenChange={setTemplateManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>╪ح╪»╪د╪▒╪ر ┘é┘ê╪د┘"╪ذ ╪د┘"╪ز╪│╪╣┘è╪▒</DialogTitle>
            <DialogDescription>
              ╪د╪«╪ز╪▒ ┘é╪د┘"╪ذ ╪ز╪│╪╣┘è╪▒ ┘"╪ز╪╖╪ذ┘è┘é┘ç ╪╣┘"┘ë ╪د┘"┘à┘†╪د┘╪│╪ر ╪ث┘ê ╪د╪ص┘╪╕ ╪د┘"╪ح╪╣╪»╪د╪»╪د╪ز ╪د┘"╪ص╪د┘"┘è╪ر ┘â┘é╪د┘"╪ذ ╪ش╪»┘è╪»
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <PricingTemplateManager
              onSelectTemplate={handleTemplateApply}
              onCreateTemplate={handleTemplateSave}
              onUpdateTemplate={handleTemplateUpdate}
              onDeleteTemplate={handleTemplateDelete}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
