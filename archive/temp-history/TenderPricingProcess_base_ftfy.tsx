ÿþimport { saveToStorage, loadFromStorage, STORAGE_KEYS, safeLocalStorage } from '../utils/storage';

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

// (Phase MVP Official/Draft) j%/j%%j%2%èj%'%j%/j%» j%/%"%ç%ê%â j%/%"j%4j%»%èj%» %"j%-j%»j%/j%'%j%1 j%/%"%àj%%%êj%»j%1 %êj%/%"%†j%%j%«j%1 j%/%"j%'%j%%%à%èj%1

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

 * - j%/%"j%5j%%j%/j%0 legacy %àj%c%j%"%%ê%" %%è legacyAuthoringCompute().

 * - j%c%%†j%» j%2%j%c%%è%" PRICING_FLAGS.USE_ENGINE_AUTHORING %èj%2%à j%2j%$%j%Q%%è%" %àj%%j%/j%'%%è%†:

 *    1) legacy %"j%5j%%j%/j%0 j%/%"%é%è%à (%"j%+j%Q%j%'%j%/j%b% j%/%"%à%éj%/j%'%%†j%1 %%éj%V%)

 */

import { Separator } from './ui/separator';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';

import { toast } from 'sonner';

import { TechnicalFilesUpload } from './TechnicalFilesUpload';

import { debounce } from '../utils/helpers';

import { APP_EVENTS, emit } from '../events/bus';

import { AlertCircle, CheckCircle, DollarSign, Package, TrendingUp, Settings, Building, Grid3X3, RotateCcw, Edit3, Target, PieChart, FileText, BarChart3, Plus, Trash2, Users, Truck, Download, ArrowRight, Save, Calculator, ChevronDown, ChevronUp, Layers } from 'lucide-react';

import { PricingTemplateManager } from './bidding/PricingTemplateManager';

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

      return '8€¤';

    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {

      return '8€¤';

    }

    return timestampFormatter.format(date);

  }, [timestampFormatter]);

  const tenderTitle = tender.title ?? tender.name ?? '';

  // using unified storage utils instead of useStorage

  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const [currentView, setCurrentView] = useState<PricingView>('summary');

  const [pricingData, setPricingData] = useState<Map<string, PricingData>>(new Map());

  // (Official/Draft MVP) j%»%àj%4 j%/%"%ç%ê%â j%/%"j%4j%»%èj%» (%éj%'%j%/j%)j%1 %%éj%V% j%5j%/%"%èj%/%ï %"j%c%j%'%j%b% j%5j%/%"j%1 j%/%"j%/j%c%j%2%àj%/j%»)

  const editablePricing = useEditableTenderPricing(tender);

  // %êj%U%%è%j%1 %àj%%j%/j%c%j%»j%1 %"j%2%à%è%èj%"% j%+%† %ç%†j%/%â j%2j%Q%%è%èj%'%j%/j%2 %àj%%%êj%»j%1 j%Q%%èj%'% %àj%c%j%2%àj%»j%1 j%'%j%%%à%èj%/%ï

  const markDirty = useCallback(() => {

    try {

      if (editablePricing.status === 'ready') {

        editablePricing.markDirty?.();

      }

    } catch (error) {

      console.warn('8#(JU% markDirty invocation failed', error);

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



  // j%/%"%†j%%j%0 j%/%"j%/%j%2j%'%j%/j%b%%èj%1 j%/%"j%c%j%/%àj%1 - MOVED HERE TO FIX TEMPORAL DEAD ZONE

  const [defaultPercentages, setDefaultPercentages] = useState<PricingPercentages>({

    administrative: 5,

    operational: 5,

    profit: 15

  });

  // Track previous defaults to enable smart propagation (items that still matched old defaults only)

  const previousDefaultsRef = useRef({ administrative: 5, operational: 5, profit: 15 });

  // j%5j%/%"j%/j%2 %†j%a%%èj%1 %êj%%%èj%V%j%1 %"%"j%%%àj%/j%5 j%0j%/%"%âj%2j%/j%0j%1 j%/%"j%5j%'%j%1 j%3%à j%/%"j%/j%c%j%2%àj%/j%» j%c%%†j%» j%/%"j%«j%'%%êj%4 %à%† j%/%"j%5%é%"

  const [defaultPercentagesInput, setDefaultPercentagesInput] = useState({

    administrative: '5',

    operational: '5',

    profit: '15'

  });



  // j%/j%%j%2j%«j%'%j%/j%4 j%0%èj%/%†j%/j%2 j%4j%»%ê%" j%/%"%â%à%èj%/j%2 %à%† j%/%"%à%†j%/%j%%j%1 %àj%c% j%/%"j%0j%5j%3 j%/%"%àj%5j%%%Q%†

  // MOVED HERE TO FIX TEMPORAL DEAD ZONE - quantityItems must be declared before template callbacks

  const quantityItems: QuantityItem[] = useMemo(() => {

    console.log('a"'¤ j%/%"j%0j%5j%3 j%c%%† j%0%èj%/%†j%/j%2 j%/%"%â%à%èj%/j%2:', tender);

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

          normalizedName.includes('%â%à%èj%1') ||

          normalizedName.includes('boq') ||

          normalizedName.includes('quantity')

        );

      });



      if (Array.isArray(quantityAttachment?.data)) {

        quantityData = quantityAttachment.data as RawQuantityItem[];

      }

    }



    if (quantityData.length === 0 && scopeValue) {

      console.log('a"'¤ j%/%"j%0j%5j%3 %%è %†j%a% j%/%"%êj%a%%:', scopeValue);

      // %è%à%â%† j%-j%b%j%/%j%1 %à%†j%V%%é %"j%/j%%j%2j%«j%'%j%/j%4 j%/%"j%0%èj%/%†j%/j%2 %à%† j%/%"%†j%a% %ç%†j%/ %"j%/j%5%éj%/%ï

    }



    if (quantityData.length === 0) {

      console.log('8#(JU% %"j%/ j%2%êj%4j%» j%0%èj%/%†j%/j%2 %â%à%èj%/j%2j%î j%-%†j%$%j%/j%) j%0%èj%/%†j%/j%2 j%/%j%2j%'%j%/j%b%%èj%1');

      const title = tender?.title ?? tender?.name ?? '';

      const scopeText = typeof scopeValue === 'string' ? scopeValue : '';

      const defaultQuantityItems: RawQuantityItem[] = [];



      if (title.includes('%àj%0%†%ë') || scopeText.includes('%àj%0%†%ë') || title.includes('j%0%†j%/j%)') || scopeText.includes('j%0%†j%/j%)')) {

        defaultQuantityItems.push(

          {

            id: 'default-1',

            itemNumber: '01',

            description: 'j%+j%c%%àj%/%" j%/%"j%5%j%'% %êj%/%"j%'%j%»%à',

            unit: '%à,%%',

            quantity: 500,

            specifications: 'j%5%j%'% %êj%'%j%»%à %"%"j%+j%%j%/j%%j%/j%2'

          },

          {

            id: 'default-2',

            itemNumber: '02',

            description: 'j%+j%c%%àj%/%" j%/%"j%«j%'%j%%j%/%†j%1 j%/%"j%c%j%/j%»%èj%1',

            unit: '%à,%%',

            quantity: 200,

            specifications: 'j%«j%'%j%%j%/%†j%1 j%c%j%/j%»%èj%1 j%»j%'%j%4j%1 150 %âj%4%à/j%%%à,%"%'

          },

          {

            id: 'default-3',

            itemNumber: '03',

            description: 'j%+j%c%%àj%/%" j%/%"j%«j%'%j%%j%/%†j%1 j%/%"%àj%%%"j%5j%1',

            unit: '%à,%%',

            quantity: 300,

            specifications: 'j%«j%'%j%%j%/%†j%1 %àj%%%"j%5j%1 j%»j%'%j%4j%1 350 %âj%4%à/j%%%à,%"%'

          },

          {

            id: 'default-4',

            itemNumber: '04',

            description: 'j%+j%c%%àj%/%" j%5j%»%èj%» j%/%"j%2j%%%"%èj%5',

            unit: 'j%V%%†',

            quantity: 25,

            specifications: 'j%5j%»%èj%» j%2j%%%"%èj%5 j%c%j%/j%»%è %êj%c%j%/%"%è j%/%"%à%éj%/%ê%àj%1'

          }

        );

      } else {

        defaultQuantityItems.push(

          {

            id: 'default-1',

            itemNumber: '01',

            description: 'j%/%"j%0%†j%» j%/%"j%+%ê%"',

            unit: '%êj%5j%»j%1',

            quantity: 100,

            specifications: 'j%5j%%j%0 j%/%"%à%êj%/j%a%%j%/j%2 j%/%"%%†%èj%1'

          },

          {

            id: 'default-2',

            itemNumber: '02',

            description: 'j%/%"j%0%†j%» j%/%"j%3j%/%†%è',

            unit: '%êj%5j%»j%1',

            quantity: 150,

            specifications: 'j%5j%%j%0 j%/%"%à%êj%/j%a%%j%/j%2 j%/%"%%†%èj%1'

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



      const unit = toTrimmedString(item.unit) ?? toTrimmedString((item as Record<string, unknown>).uom) ?? '%êj%5j%»j%1';

      const quantity = toNumberOr(item.quantity, 1);

      const specifications =

        toTrimmedString(item.specifications) ??

        toTrimmedString((item as Record<string, unknown>).spec) ??

        toTrimmedString((item as Record<string, unknown>).notes) ??

        'j%5j%%j%0 j%/%"%à%êj%/j%a%%j%/j%2 j%/%"%%†%èj%1';



      return {

        id,

        itemNumber,

        description,

        unit,

        quantity,

        specifications

      } satisfies QuantityItem;

    });



    console.log('8£à j%0%èj%/%†j%/j%2 j%/%"%â%à%èj%/j%2 j%/%"%àj%c%j%/%"j%4j%1:', normalizedItems);

    return normalizedItems;

  }, [tender]);



  // ==== Template Management ====



  const handleTemplateApply = useCallback((template: any) => {

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



      toast.success(`j%2%à j%2j%V%j%0%è%é %éj%/%"j%0 "${template.name}" j%0%†j%4j%/j%5`);

      setTemplateManagerOpen(false);

    } catch (error) {

      console.error('Error applying template:', error);

      toast.error('%j%$%%" %%è j%2j%V%j%0%è%é j%/%"%éj%/%"j%0');

    }

  }, [pricingData, quantityItems, markDirty, setDefaultPercentages, setPricingData]);



  const handleTemplateSave = useCallback((templateData: any) => {

    try {

      // Create template from current pricing state

      const template = {

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



      toast.success(`j%2%à j%5%j%U% j%/%"%éj%/%"j%0 "${template.name}" j%0%†j%4j%/j%5`);

      return template;

    } catch (error) {

      console.error('Error saving template:', error);

      toast.error('%j%$%%" %%è j%5%j%U% j%/%"%éj%/%"j%0');

      throw error;

    }

  }, [defaultPercentages]);



  const handleTemplateUpdate = useCallback((template: any) => {

    try {

      // Update template logic would go here

      toast.success(`j%2%à j%2j%5j%»%èj%3 j%/%"%éj%/%"j%0 "${template.name}" j%0%†j%4j%/j%5`);

    } catch (error) {

      console.error('Error updating template:', error);

      toast.error('%j%$%%" %%è j%2j%5j%»%èj%3 j%/%"%éj%/%"j%0');

    }

  }, []);



  const handleTemplateDelete = useCallback((templateId: string) => {

    try {

      // Delete template logic would go here

      toast.success('j%2%à j%5j%'%% j%/%"%éj%/%"j%0 j%0%†j%4j%/j%5');

    } catch (error) {

      console.error('Error deleting template:', error);

      toast.error('%j%$%%" %%è j%5j%'%% j%/%"%éj%/%"j%0');

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

  

  // j%5j%/%"j%/j%2 j%/%"j%V%%è %"%"j%4j%»j%/%ê%" j%/%"%àj%«j%2%"%j%1 %%è j%2j%0%ê%èj%0 j%/%"%à%"j%«j%a%

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



  // j%»j%/%"j%1 %"j%2j%0j%»%è%" j%5j%/%"j%1 j%/%"j%V%%è %"%éj%%%à %àj%c%%è%† %%è j%0%†j%» %àj%c%%è%†

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



  // %àj%'%j%4j%c% %"j%2j%2j%0j%c% j%*j%«j%'% j%5j%/%"j%1 j%2%à j%-j%'%j%%j%/%"%çj%/ %"j%2j%4%†j%0 j%/%"j%2j%5j%»%èj%3 j%/%"%à%âj%'%j%'%

  const lastStatusRef = useRef<PricingStatusSnapshot | null>(null);









  // Transform pricingData to include id property for domain pricing engine

  const pricingMapWithIds = useMemo(() => {

    const transformedMap = new Map<string, PricingData & { id: string }>();

    pricingData.forEach((data, id) => {

      transformedMap.set(id, { ...data, id });

    });

    return transformedMap;

  }, [pricingData]);



  // Phase 2.5: Domain pricing engine (UI read path) 8€¤ optional; no write path yet (moved after quantityItems definition)

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

    // (Legacy Removal 2025-09-20) j%/%"%àj%%j%/j%'% j%/%"%éj%»%è%à j%+j%"%%è%"j%$ j%/%"j%*%† %†j%c%j%2%àj%» %%éj%V% j%c%%"%ë domainPricing.

    // j%-j%'%j%/ %"%à %è%â%† j%4j%/%çj%"%j%/%ï (loading j%+%ê error) %†j%c%%èj%» %éj%/j%.%àj%1 j%0%†%êj%» %àj%0j%»j%.%èj%1 j%0j%»%ê%† j%2j%%j%c%%èj%'%.

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

      console.info('8£à Domain Pricing UI path ENABLED (using useDomainPricingEngine)');

    } else {

      console.info('8"c%JU% Domain Pricing UI path disabled (legacy inline compute in use)');

    }

  }, [domainPricing.enabled]);



  // j%»j%/%"j%1 %"j%-j%'%j%%j%/%" j%-j%$%j%c%j%/j%'% j%2j%5j%»%èj%3 %"%"j%a%%j%5j%/j%2 j%/%"j%+j%«j%'%%ë %àj%c% j%/j%%j%2j%«j%»j%/%à j%«j%»%àj%1 j%/%"%àj%"%j%/%à%†j%1 j%/%"j%4j%»%èj%»j%1

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

              description: sourceItem?.description ?? `j%/%"j%0%†j%» ${id}`,

              unit: sourceItem?.unit ?? '%êj%5j%»j%1',

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

          console.warn('8#(JU% Engine authoring enrichment failed, falling back to legacy only', e);

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



      // j%/j%%j%2j%«j%»j%/%à j%«j%»%àj%1 j%/%"%àj%"%j%/%à%†j%1 j%/%"j%4j%»%èj%»j%1 j%0j%»%"j%/%ï %à%† j%/%"j%5j%»j%3 j%/%"%àj%0j%/j%$%j%'%

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

      

      // j%2j%$%j%Q%%è%" j%«j%»%àj%1 j%/%"%àj%"%j%/%à%†j%1 %"j%b%%àj%/%† j%2j%5j%»%èj%3 j%/%"%†j%U%j%/%à j%/%"%àj%'%%âj%"%%è

      pricingDataSyncService.forceSyncTender(tender.id).then(success => {

        if (success) {

          console.log('8£à [TenderPricingProcess] j%2%àj%2 %àj%"%j%/%à%†j%1 j%/%"j%0%èj%/%†j%/j%2 %àj%c% j%/%"%†j%U%j%/%à j%/%"%àj%'%%âj%"%%è')

        }

      }).catch(error => {

        console.warn('8#(JU% [TenderPricingProcess] %j%$%%" %%è %àj%"%j%/%à%†j%1 j%/%"j%0%èj%/%†j%/j%2:', error)

      });

      

      console.log('a"'¤¤ [TenderPricingProcess] j%2%à j%-j%'%j%%j%/%" j%5j%»j%3 j%2j%5j%»%èj%3 j%/%"j%0%èj%/%†j%/j%2:', {

        tenderId: tender.id,

        items: quantityTableWithPricing.length,

        engineAuthoring: PRICING_FLAGS.USE_ENGINE_AUTHORING

      });



      // (Legacy Dual-Write Removed 2025-09): j%5j%'%% %àj%%j%/j%'% dualWritePricing.

    } catch (error) {

      console.error('8%î [TenderPricingProcess] j%«j%V%j%+ %%è j%-j%'%j%%j%/%" j%-j%$%j%c%j%/j%'% j%/%"j%2j%5j%»%èj%3:', error);

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

  // (Legacy Removal) j%2%à j%5j%'%% legacyAuthoringCompute %êj%/%"%àj%%j%/j%'% j%/%"%éj%»%è%àj%$ j%-j%'%j%/ j%U%%çj%'% j%/j%5j%2%èj%/j%4 %àj%%j%2%éj%0%"%è %"%é%èj%/j%% %j%'%%ê%éj%/j%2 %è%à%â%† j%/j%%j%2j%c%%àj%/%" pricingRuntime + %"%éj%V%j%/j%2 snapshots.



  // j%2j%5%à%è%" j%0%èj%/%†j%/j%2 j%/%"j%2j%%j%c%%èj%'% j%/%"j%/%j%2j%'%j%/j%b%%èj%1 j%c%%†j%» %j%2j%5 j%/%"j%a%%j%5j%1 %"j%+%ê%" %àj%'%j%1

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



  // j%-j%'%j%%j%/%" j%-j%$%j%c%j%/j%'% j%2j%5j%»%èj%3 j%c%%†j%» j%2j%Q%%è%èj%'% j%0%èj%/%†j%/j%2 j%/%"j%2j%%j%c%%èj%'%

  useEffect(() => {

    if (isLoaded && pricingData.size > 0) {

      // j%2j%+j%«%èj%'% %éj%a%%èj%'% %"j%b%%àj%/%† j%/%âj%2%àj%/%" j%2j%5j%»%èj%3 j%/%"j%0%èj%/%†j%/j%2

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



  // j%2j%5%à%è%" j%0%èj%/%†j%/j%2 j%/%"j%2j%%j%c%%èj%'% %"%"j%0%†j%» j%/%"j%5j%/%"%è j%+%ê j%2%ç%èj%.j%1 j%0%†%êj%» j%4j%»%èj%»j%1 j%0j%/%"%†j%%j%0 j%/%"j%/%j%2j%'%j%/j%b%%èj%1

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



  // j%5j%%j%/j%0 j%/%"j%-j%4%àj%/%"%èj%/j%2

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

  // j%5j%%j%/j%0 %àj%2%êj%%j%V% j%/%"%†j%%j%0 j%/%"%àj%%j%2j%«j%»%àj%1

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

      value.length > 0 && !/^j%/%"j%0%†j%»\s*\d+$/i.test(value) && !/^j%0%†j%»\s*\d+$/i.test(value) && !/j%Q%%èj%'%\s*%àj%5j%»j%»/.test(value);



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

            if (/desc|description|%êj%a%%/i.test(key)) {

              pushIfMeaningful(key, value);

            }

          });



          const directUpstream = normalizeString(quantityItem.canonicalDescription ?? quantityItem.description);

          const specBased = normalizeString(quantityItem.specifications);

          const fallback = quantityItem.itemNumber ? `j%/%"j%0%†j%» ${quantityItem.itemNumber}` : `j%/%"j%0%†j%» ${quantityItem.id}`;

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



  // j%2j%V%j%0%è%é j%/%"%†j%%j%0 j%/%"j%/%j%2j%'%j%/j%b%%èj%1 j%c%%"%ë j%/%"j%0%†%êj%» j%/%"%à%êj%4%êj%»j%1

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

      console.warn('8#(JU% markDirty after defaults propagation failed', error);

    }



    toast.success(`j%2%à j%2j%5j%»%èj%3 j%/%"%†j%%j%0 %"%€ ${updatedCount} j%0%†j%»`, {

      description: 'j%2%à j%2j%V%j%0%è%é j%/%"%†j%%j%0 j%/%"j%/%j%2j%'%j%/j%b%%èj%1 j%/%"j%4j%»%èj%»j%1 j%c%%"%ë j%4%à%èj%c% j%/%"j%0%†%êj%» j%/%"%à%êj%4%êj%»j%1',

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



  // j%5%j%U% j%/%"%†j%%j%0 j%/%"j%/%j%2j%'%j%/j%b%%èj%1 j%c%%†j%» j%2j%c%j%»%è%"%çj%/ %"j%b%%àj%/%† j%/j%c%j%2%àj%/j%»%çj%/ %"%"j%0%†%êj%» j%/%"j%4j%»%èj%»j%1 %êj%/%"j%4%"j%%j%/j%2 j%/%"%éj%/j%»%àj%1

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

        console.info(`[PricingProcess] a"''* Auto-propagated new default percentages to ${changedCount} items bound to old defaults.`);

      } else {

        void persistPricingAndBOQ(pricingData);

        console.info('[PricingProcess] 8"c%JU% Defaults changed but no items matched previous defaults (all customized).');

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

    // (Legacy Snapshot System Removed 2025-09): j%5j%'%% %à%†j%V%%é j%-%†j%$%j%/j%)/j%2j%'%j%5%è%" snapshot %†%çj%/j%.%èj%/%ï.

  }, [defaultPercentages, isLoaded, persistPricingAndBOQ, pricingData, tender.id]);



  // %à%"j%/j%5j%U%j%1: j%2%à j%-j%"%j%/%"j%1 j%»j%/%"j%1 j%2%†j%%%è%é j%/%"j%c%%à%"j%1 j%Q%%èj%'% j%/%"%àj%%j%2j%«j%»%àj%1 j%0j%c%j%» j%2j%0j%%%èj%V% j%0j%V%j%/%éj%/j%2 j%/%"%à%"j%«j%a%.



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



  // j%5j%%j%/j%0 j%b%j%'%%èj%0j%1 j%/%"%é%è%àj%1 j%/%"%àj%b%j%/%j%1 15%

  const calculateVAT = useCallback(() => {

    return calculateItemsTotal() * 0.15;

  }, [calculateItemsTotal]);



  // j%5j%%j%/j%0 j%-j%4%àj%/%"%è %é%è%àj%1 j%/%"%àj%$%j%'%%êj%c% %àj%c% j%b%j%'%%èj%0j%1 j%/%"%é%è%àj%1 j%/%"%àj%b%j%/%j%1

  const calculateProjectTotal = useCallback(() => {

    const itemsTotal = calculateItemsTotal();

    const vat = calculateVAT();

    return itemsTotal + vat;

  }, [calculateItemsTotal, calculateVAT]);



  // (Official/Draft MVP) j%2j%4%à%èj%c% %àj%0j%%j%V% %"j%c%%†j%/j%a%j%'% j%/%"j%2j%%j%c%%èj%'% j%/%"j%5j%/%"%èj%1 %"j%/j%%j%2j%«j%»j%/%à%ç j%c%%†j%» j%5%j%U% j%/%"%àj%%%êj%»j%1 j%+%ê j%/%"%†j%%j%«j%1 j%/%"j%'%j%%%à%èj%1

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

      console.warn('8#(JU% %j%$%%" j%0%†j%/j%) j%c%%†j%/j%a%j%'% j%/%"%àj%%%êj%»j%1', error);

      return [];

    }

  }, [pricingViewItems]);



  // j%5j%%j%/j%0 j%-j%4%àj%/%"%è j%/%"j%2%âj%/%"%è% j%/%"j%-j%»j%/j%'%%èj%1

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



  // j%5j%%j%/j%0 j%-j%4%àj%/%"%è j%/%"j%2%âj%/%"%è% j%/%"j%2j%$%j%Q%%è%"%èj%1

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



  // j%5j%%j%/j%0 j%-j%4%àj%/%"%è j%/%"j%+j%'%j%0j%/j%5

  const calculateTotalProfit = useCallback(() => {

    let totalProfit = 0;

    quantityItems.forEach(item => {

      const itemPricing = pricingData.get(item.id);

      if (itemPricing) {

        // j%/j%%j%2j%«j%»j%/%à j%/%"j%»j%/%"j%1 j%/%"%àj%5%%êj%U%j%1 %"%"j%5j%a%%ê%" j%c%%"%ë j%/%"%é%è%à j%/%"%àj%5j%%%êj%0j%1

        const itemTotals = {

          materials: itemPricing.materials.reduce((sum, mat) => sum + mat.total, 0),

          labor: itemPricing.labor.reduce((sum, lab) => sum + lab.total, 0),

          equipment: itemPricing.equipment.reduce((sum, eq) => sum + eq.total, 0),

          subcontractors: itemPricing.subcontractors.reduce((sum, sub) => sum + sub.total, 0)

        };

        const subtotal = itemTotals.materials + itemTotals.labor + itemTotals.equipment + itemTotals.subcontractors;

        // j%/j%%j%2j%«j%»j%/%à j%/%"%†j%%j%0 j%/%"j%/%j%2j%'%j%/j%b%%èj%1 j%/%"j%4j%»%èj%»j%1 j%-j%'%j%/ %"%à j%2%â%† %àj%5j%»j%»j%1 %"%çj%'%j%/ j%/%"j%0%†j%»

        const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit;

        const profit = subtotal * profitPercentage / 100;

        totalProfit += profit;

      }

    });

    return totalProfit;

  }, [quantityItems, pricingData, defaultPercentages.profit]);



  // j%2j%5j%»%èj%3 j%5j%/%"j%1 j%/%"%à%†j%/%j%%j%1 %àj%c% j%2j%2j%0j%c% j%/%"j%2%éj%»%à j%/%"%àj%%j%2%àj%'% %êj%2j%4%†j%0 j%/%"j%2j%5j%»%èj%3 j%/%"%à%âj%'%j%'%

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

      console.error('j%2j%c%j%'%j%'% j%2j%5j%»%èj%3 j%0%èj%/%†j%/j%2 j%/%"%à%†j%/%j%%j%1 j%0j%c%j%» %àj%"%j%/%à%†j%1 j%/%"j%2j%%j%c%%èj%'%', error);

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



    console.log('a"'¤" j%2%à j%2j%5j%»%èj%3 j%5j%/%"j%1 j%/%"%à%†j%/%j%%j%1:', {

      tenderId: tender.id,

      status,

      pricingStatus,

      completionPercentage,

      itemsPriced: pricingData.size,

      totalItems: quantityItems.length,

      totalValue

    });



    if (completionPercentage === 100) {

      toast.success('j%2%à j%-%â%àj%/%" j%/%"j%2j%%j%c%%èj%'%', {

        description: 'j%2%à j%-%â%àj%/%" j%2j%%j%c%%èj%'% j%4%à%èj%c% j%0%†%êj%» j%/%"%à%†j%/%j%%j%1 j%0%†j%4j%/j%5',

        duration: 5000

      });

    }

  }, [pricingData, quantityItems, tender, calculateProjectTotal, updateTender]);



  // j%5%j%U% j%/%"j%0%èj%/%†j%/j%2 j%0j%$%%â%" j%2%"%éj%/j%.%è %àj%c% debounce

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

          console.warn('8#(JU% Failed to compare pricing data before autosave', error);

        }



        const newMap = new Map(pricingData);

        newMap.set(currentItemId, data);

        setPricingData(newMap);



        void pricingService.saveTenderPricing(tender.id, {

          pricing: Array.from(newMap.entries()),

          defaultPercentages,

          lastUpdated: new Date().toISOString()

        });

        // j%2j%5j%»%èj%3 %"%éj%V%j%1 BOQ j%/%"%àj%'%%âj%"%%èj%1 %%êj%'% j%+%è j%2j%c%j%»%è%" j%2j%%j%c%%èj%'%

        void persistPricingAndBOQ(newMap);

        // (Legacy Snapshot Removed) %"%à %èj%c%j%» %èj%2%à j%-%†j%$%j%/j%) snapshot j%2%"%éj%/j%.%è.

      }, 2000),

    [currentItemId, tender.id, defaultPercentages, pricingData, isLoaded, persistPricingAndBOQ]

  );



  // j%5%j%U% %èj%»%ê%è %"%"j%0%†j%» j%/%"j%5j%/%"%è %àj%c% j%'%j%%j%/%"j%1 j%2j%+%â%èj%» %êj%2j%5%é%é %à%† j%a%j%5j%1 j%/%"j%0%èj%/%†j%/j%2

  const saveCurrentItem = useCallback(() => {

    if (currentItem && isLoaded) {

      const totals = calculateTotals();

      // j%/%"j%2j%5%é%é %à%† %êj%4%êj%» j%0%èj%/%†j%/j%2 j%/%"j%2j%%j%c%%èj%'%

      const hasData = currentPricing.materials.length > 0 || 

                     currentPricing.labor.length > 0 || 

                     currentPricing.equipment.length > 0 || 

                     currentPricing.subcontractors.length > 0;

      

      if (!hasData) {

        toast.error('%"j%/ j%2%êj%4j%» j%0%èj%/%†j%/j%2 %"%"j%5%j%U%', {

          description: '%èj%'%j%4%ë j%-j%b%j%/%j%1 j%0%èj%/%†j%/j%2 j%/%"j%2j%%j%c%%èj%'% %éj%0%" j%/%"j%5%j%U%',

          duration: 4000,

        });

        return;

      }



      // j%2j%+%â%èj%» %êj%%%à j%/%"j%0%†j%» %â%à%âj%2%à%" %%éj%V% j%c%%†j%» j%/%"j%5%j%U% j%/%"j%a%j%'%%èj%5

      const itemToSave: PricingData = { ...currentPricing, completed: true };

      const newMap = new Map(pricingData);

      newMap.set(currentItem.id, itemToSave);

      setPricingData(newMap);

      setCurrentPricing(itemToSave);

      

      // j%5j%%j%/j%0 j%/%"j%2%j%/j%a%%è%" j%/%"%àj%/%"%èj%1

      const itemTotals = {

        materials: itemToSave.materials.reduce((sum, mat) => sum + (mat.total || 0), 0),

        labor: itemToSave.labor.reduce((sum, lab) => sum + (lab.total || 0), 0),

        equipment: itemToSave.equipment.reduce((sum, eq) => sum + (eq.total || 0), 0),

        subcontractors: itemToSave.subcontractors.reduce((sum, sub) => sum + (sub.total || 0), 0)

      };

      

      const subtotal = Object.values(itemTotals).reduce((sum, val) => sum + val, 0);

      const unitPrice = totals.total / currentItem.quantity;

      

      // j%5%j%U% %%è %éj%/j%c%j%»j%1 j%/%"j%0%èj%/%†j%/j%2

      void pricingService.saveTenderPricing(tender.id, {

        pricing: Array.from(newMap.entries()),

        defaultPercentages,

        lastUpdated: new Date().toISOString()

      });

      // %àj%"%j%/%à%†j%1 %"%éj%V%j%1 BOQ j%/%"%àj%'%%âj%"%%èj%1 j%0j%c%j%» j%/%"j%5%j%U% j%/%"%èj%»%ê%è

      void persistPricingAndBOQ(newMap);

      // (Legacy Snapshot Removed) j%5j%'%% j%-%†j%$%j%/j%) snapshot j%/%"%èj%»%ê%è.



      // j%5%j%U% j%2%j%/j%a%%è%" j%/%"j%0%†j%» %%è j%/%"j%2j%«j%"%%è%† j%/%"%à%êj%5j%» %"%"j%2j%V%j%0%è%é

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

        executionMethod: currentPricing.executionMethod ?? 'j%'%j%/j%2%è',

        technicalNotes: currentPricing.technicalNotes ?? '',

        createdAt: new Date().toISOString(),

        lastUpdated: new Date().toISOString(),

        status: 'completed',

        version: 1 // %"j%2j%2j%0j%c% j%-j%a%j%»j%/j%'%j%/j%2 j%/%"j%2j%%j%c%%èj%'%

      });



      // j%2j%5j%»%èj%3 j%-j%5j%a%j%/j%.%èj%/j%2 j%/%"%à%†j%/%j%%j%1

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

      // j%5%j%U% j%/%"j%-j%5j%a%j%/j%.%èj%/j%2 j%0j%$%%â%" %àj%4%à%Qj%c% j%2j%5j%2 STORAGE_KEYS.TENDER_STATS

      void (async () => {

        const allStats = await loadFromStorage<TenderStatsRecord>(STORAGE_KEYS.TENDER_STATS, {});

        allStats[tender.id] = statsPayload;

        await saveToStorage(STORAGE_KEYS.TENDER_STATS, allStats);

      })();



      // j%c%j%'%j%b% j%'%j%%j%/%"j%1 j%2j%+%â%èj%» %à%j%a%%"j%1

      toast.success('j%2%à j%/%"j%5%j%U% j%0%†j%4j%/j%5', {

        description: `j%2%à j%5%j%U% j%2j%%j%c%%èj%'% j%/%"j%0%†j%» j%'%%é%à ${currentItem.itemNumber} - j%/%"%é%è%àj%1: ${formatCurrencyValue(totals.total)}`,

        duration: 4000,

      });



      // j%-j%'%j%%j%/%" j%-j%$%j%c%j%/j%'% j%2j%5j%»%èj%3 %"%"j%a%%j%5j%/j%2 j%/%"j%+j%«j%'%%ë (%àj%3%" j%a%%j%5j%1 j%2%j%/j%a%%è%" j%/%"%à%†j%/%j%%j%1)

      notifyPricingUpdate();



      // j%2j%5j%»%èj%3 j%5j%/%"j%1 j%/%"%à%†j%/%j%%j%1 %%êj%'%j%/%ï j%0j%c%j%» j%5%j%U% j%/%"j%0%†j%»

      setTimeout(() => {

        updateTenderStatus();

      }, 100);

    }

  }, [currentItem, currentPricing, pricingData, tender.id, isLoaded, quantityItems, calculateTotals, calculateProjectTotal, defaultPercentages, notifyPricingUpdate, persistPricingAndBOQ, updateTenderStatus, tenderTitle, formatCurrencyValue]);



  // j%2j%$%j%Q%%è%" j%/%"j%5%j%U% j%/%"j%2%"%éj%/j%.%è j%c%%†j%» j%2j%Q%%è%èj%'% j%/%"j%0%èj%/%†j%/j%2

  useEffect(() => {

    if (isLoaded && currentItemId) {

      debouncedSave(currentPricing);

    }

  }, [currentPricing, debouncedSave, isLoaded, currentItemId]);



  // (Official/Draft MVP) j%5%j%U% %àj%%%êj%»j%1 j%2%"%éj%/j%.%è (debounced j%c%%"%ë %àj%%j%2%ê%ë j%/%"j%«j%'%%èj%V%j%1 j%/%"%âj%/%à%"j%1)

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

      } catch (e) { console.warn('8#(JU% autosave draft failed', e); }

    }, 1500);

    return () => clearTimeout(t);

  }, [pricingData, isLoaded, editablePricing, buildDraftPricingItems, calculateProjectTotal]);



  // (Official/Draft MVP) j%5%j%U% %àj%%%êj%»j%1 j%»%êj%'%%è %â%" 45 j%3j%/%†%èj%1

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

      } catch (e) { console.warn('8#(JU% periodic draft save failed', e); }

    }, 45000);

    return () => clearInterval(interval);

  }, [isLoaded, editablePricing, buildDraftPricingItems, calculateProjectTotal]);



  // j%2j%5j%'%%èj%'% j%c%%†j%» %àj%5j%/%ê%"j%1 %àj%Q%j%/j%»j%'%j%1 j%/%"j%a%%j%5j%1 %àj%c% j%2j%Q%%è%èj%'%j%/j%2 j%Q%%èj%'% %àj%c%j%2%àj%»j%1 j%'%j%%%à%èj%/%ï

  useEffect(() => {

    if (editablePricing.status !== 'ready') return;

    if (editablePricing.status !== 'ready') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {

      if (editablePricing.dirty || editablePricing.isDraftNewer) {

        const message = confirmationMessages.leaveDirty.description;

        e.preventDefault();

        e.returnValue = message; // %"j%0j%c%j%b% j%/%"%àj%2j%a%%j%5j%/j%2

        return message;

      }

    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);

  }, [editablePricing]);



  // j%2j%5j%»%èj%3 j%5j%/%"j%1 j%/%"%à%†j%/%j%%j%1 j%c%%†j%» j%2j%5%à%è%" j%/%"%à%â%ê%† %"j%+%ê%" %àj%'%j%1 %%éj%V%

  useEffect(() => {

    if (isLoaded) {

      console.log('a"'ôï j%2%à j%2j%5%à%è%" j%a%%j%5j%1 j%/%"j%2j%%j%c%%èj%'% - j%%%èj%2%à j%2j%5j%»%èj%3 j%5j%/%"j%1 j%/%"%à%†j%/%j%%j%1...');

      // j%2j%+j%«%èj%'% j%0j%%%èj%V% %"%"j%2j%+%âj%» %à%† j%2j%5%à%è%" j%4%à%èj%c% j%/%"j%0%èj%/%†j%/j%2

      const timeoutId = setTimeout(() => {

        updateTenderStatus();

        updateTenderStatus();

        // j%-j%U%%çj%/j%'% j%'%j%%j%/%"j%1 %"%"%àj%%j%2j%«j%»%à

        toast.info('j%2%à j%0j%»j%) j%c%%à%"%èj%1 j%/%"j%2j%%j%c%%èj%'%', {

          description: `j%2%à j%2j%5j%»%èj%3 j%5j%/%"j%1 j%/%"%à%†j%/%j%%j%1 "${tenderTitle}" j%-%"%ë "j%2j%5j%2 j%/%"j%-j%4j%'%j%/j%)"`,

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



  // j%-%†j%$%j%/j%) j%a%% %j%/j%'%j%Q%

  const createEmptyRow = <Section extends PricingSection>(type: Section): SectionRowMap[Section] => {

    const baseRow: PricingRow = {

      id: Date.now().toString(),

      description: '',

      unit: '%êj%5j%»j%1',

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



  // j%-j%b%j%/%j%1 j%a%% j%4j%»%èj%»

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



    // j%2j%5j%»%èj%3 %%êj%'%%è %"%"j%5j%/%"j%1 j%c%%†j%» j%-j%b%j%/%j%1 j%+%ê%" j%a%% (%èj%c%%†%è j%0j%»j%) j%/%"j%c%%à%")

    setTimeout(() => {

      updateTenderStatus();

    }, 100);

  };



  // j%5j%'%% j%a%%

  const deleteRow = <Section extends PricingSection>(type: Section, id: string) => {

    setCurrentPricing(prev =>

      mutateSectionRows(prev, type, rows => rows.filter(row => row.id !== id))

    );

    markDirty();

  };



  // j%2j%5j%»%èj%3 j%a%% %àj%c% %àj%c%j%/%"j%4j%1 %àj%5j%%%†j%1 %"%"j%+j%«j%V%j%/j%) %êj%/%"j%2j%5%é%é %à%† j%a%j%5j%1 j%/%"j%0%èj%/%†j%/j%2

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



      // j%2j%5j%»%èj%3 %%êj%'%%è %"%"j%5j%/%"j%1 j%0j%c%j%» j%2j%c%j%»%è%" j%/%"j%0%èj%/%†j%/j%2

      setTimeout(() => {

        updateTenderStatus();

      }, 200);

      markDirty();

    } catch (error) {

      console.error('j%«j%V%j%+ %%è j%2j%5j%»%èj%3 j%/%"j%0%èj%/%†j%/j%2:', error);

      toast.error('j%«j%V%j%+ %%è j%2j%5j%»%èj%3 j%/%"j%0%èj%/%†j%/j%2', {

        description: 'j%5j%»j%3 j%«j%V%j%+ j%+j%3%†j%/j%) j%2j%5j%»%èj%3 j%/%"j%0%èj%/%†j%/j%2. %èj%'%j%4%ë j%/%"%àj%5j%/%ê%"j%1 %àj%'%j%1 j%+j%«j%'%%ë.',

        duration: 4000,

      });

    }

  };



  // j%5%j%U% %†j%%j%«j%1 j%/j%5j%2%èj%/j%V%%èj%1 %à%† j%/%"j%0%èj%/%†j%/j%2

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

      toast.success('j%2%à j%-%†j%$%j%/j%) %†j%%j%«j%1 j%/j%5j%2%èj%/j%V%%èj%1', {

        description: 'j%2%à j%5%j%U% %†j%%j%«j%1 j%/j%5j%2%èj%/j%V%%èj%1 %à%† j%/%"j%0%èj%/%†j%/j%2 j%0%†j%4j%/j%5',

        duration: 3000,

      });

    } catch (error) {

      console.error('Error creating backup:', error);

      const reason = error instanceof Error ? error.message : 'unknown-error';

      await noteBackupFailure(tender.id, reason, {

        actor: 'tender-pricing-ui',

        origin: 'renderer'

      });

      toast.error('%j%$%%" j%-%†j%$%j%/j%) j%/%"%†j%%j%«j%1 j%/%"j%/j%5j%2%èj%/j%V%%èj%1', {

        description: 'j%2j%c%j%'%j%'% j%5%j%U% j%/%"%†j%%j%«j%1 j%/%"j%/j%5j%2%èj%/j%V%%èj%1. %èj%'%j%4%ë j%/%"%àj%5j%/%ê%"j%1 %"j%/j%5%éj%/%ï.',

        duration: 4000,

      });

    }

  }, [tender.id, tenderTitle, pricingData, quantityItems, calculateProjectTotal]);



  // j%2j%5%à%è%" %éj%/j%.%àj%1 j%/%"%†j%%j%« j%/%"j%/j%5j%2%èj%/j%V%%èj%1 j%c%%†j%» %j%2j%5 %†j%/%j%'%j%1 j%/%"j%/j%%j%2j%'%j%4j%/j%c%

  const loadBackupsList = useCallback(async () => {

    const entries = await listTenderBackupEntries(tender.id);

    setBackupsList(entries);

  }, [tender.id]);



  // j%/j%%j%2j%'%j%4j%/j%c% %†j%%j%«j%1 j%/j%5j%2%èj%/j%V%%èj%1

  const restoreBackup = useCallback(async (entryId: string) => {

    const snapshot = await restoreTenderBackup(tender.id, entryId, {

      actor: 'tender-pricing-ui',

      origin: 'renderer'

    });



    if (!snapshot) {

      toast.error('j%2j%c%j%'%j%'% j%/%"j%c%j%3%êj%'% j%c%%"%ë j%/%"%†j%%j%«j%1 j%/%"j%/j%5j%2%èj%/j%V%%èj%1');

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

      // %àj%"%j%/%à%†j%1 %"%éj%V%j%1 BOQ j%/%"%àj%'%%âj%"%%èj%1 j%0j%c%j%» j%/%"j%/j%%j%2j%'%j%4j%/j%c%

      await persistPricingAndBOQ(restoredMap);

      toast.success('j%2%à j%/j%%j%2j%'%j%4j%/j%c% j%/%"%†j%%j%«j%1 j%0%†j%4j%/j%5');

      setRestoreOpen(false);

      void loadBackupsList();

    } catch (e) {

      console.error('Restore failed:', e);

      toast.error('%j%$%%" j%/j%%j%2j%'%j%4j%/j%c% j%/%"%†j%%j%«j%1 j%/%"j%/j%5j%2%èj%/j%V%%èj%1');

    }

  }, [tender.id, defaultPercentages, persistPricingAndBOQ, loadBackupsList]);



  // j%2j%a%j%»%èj%'% j%/%"j%0%èj%/%†j%/j%2 j%-%"%ë Excel

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

          'j%'%%é%à j%/%"j%0%†j%»': item.itemNumber,

          '%êj%a%% j%/%"j%0%†j%»': item.description,

          'j%/%"%êj%5j%»j%1': item.unit,

          'j%/%"%â%à%èj%1': item.quantity,

          'j%%j%c%j%'% j%/%"%êj%5j%»j%1': unitPrice.toFixed(2),

          'j%/%"%é%è%àj%1 j%/%"j%-j%4%àj%/%"%èj%1': subtotal.toFixed(2),

          'j%5j%/%"j%1 j%/%"j%2j%%j%c%%èj%'%': itemPricing ? '%à%âj%2%à%"' : '%"%à %èj%0j%»j%+'

        };

      });



      // %ç%†j%/ %è%à%â%† j%-j%b%j%/%j%1 %à%†j%V%%é j%/%"j%2j%a%j%»%èj%'% j%/%"%j%c%%"%è

      toast.info('j%4j%/j%'%%è j%2j%V%%ê%èj%'% %êj%U%%è%j%1 j%/%"j%2j%a%j%»%èj%'%', {

        description: '%çj%'%%ç j%/%"%êj%U%%è%j%1 %é%èj%» j%/%"j%2j%V%%ê%èj%'% %êj%%j%2%â%ê%† %àj%2j%/j%5j%1 %éj%'%%èj%0j%/%ï',

        duration: 4000,

      });

      

      console.log('j%0%èj%/%†j%/j%2 j%/%"j%2j%a%j%»%èj%'%:', exportData);

    } catch (error) {

      console.error('j%«j%V%j%+ %%è j%2j%a%j%»%èj%'% j%/%"j%0%èj%/%†j%/j%2:', error);

      toast.error('j%«j%V%j%+ %%è j%/%"j%2j%a%j%»%èj%'%', {

        description: 'j%5j%»j%3 j%«j%V%j%+ j%+j%3%†j%/j%) j%-j%c%j%»j%/j%» j%/%"j%0%èj%/%†j%/j%2 %"%"j%2j%a%j%»%èj%'%',

        duration: 4000,

      });

    }

  }, [quantityItems, pricingData]);



  // j%c%j%'%j%b% %à%"j%«j%a% j%/%"%àj%$%j%'%%êj%c%

  const renderSummary = () => {

    const projectTotal = calculateProjectTotal();

  const completedCount = Array.from(pricingData.values()).filter(value => value?.completed).length;

    const completionPercentage = (completedCount / quantityItems.length) * 100;



    return (

      <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">

        <div className="space-y-3 p-1 pb-20" dir="rtl">

          {/* j%2j%5j%'%%èj%'% %"%"j%0%èj%/%†j%/j%2 j%/%"j%2j%4j%'%%èj%0%èj%1 */}

          {quantityItems.length <= 5 && quantityItems[0]?.id === '1' && (

            <Card className="border-warning/30 bg-warning/10">

              <CardContent className="p-4">

                <div className="flex items-center gap-2 text-warning">

                  <AlertCircle className="w-5 h-5" />

                  <span className="font-medium">j%2j%5j%'%%èj%'%: %èj%2%à j%c%j%'%j%b% j%0%èj%/%†j%/j%2 j%2j%4j%'%%èj%0%èj%1</span>

                </div>

                <p className="text-sm text-warning mt-1">

                  %"%à %èj%2%à j%/%"j%c%j%3%êj%'% j%c%%"%ë j%4j%»%ê%" j%/%"%â%à%èj%/j%2 j%/%"j%5%é%è%é%è %"%"%à%†j%/%j%%j%1. %èj%'%j%4%ë j%/%"j%2j%+%âj%» %à%† j%-j%'%%j%/%é %à%"% j%/%"%â%à%èj%/j%2 j%/%"j%a%j%5%èj%5.

                </p>

              </CardContent>

            </Card>

          )}



          {/* j%-j%5j%a%j%/j%.%èj%/j%2 j%/%"%àj%$%j%'%%êj%c% (%%è j%/%"j%+j%c%%"%ë) */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* j%0j%V%j%/%éj%1 %†j%%j%0j%1 j%/%"j%-%†j%4j%/j%"% */}

            <Card className="border-info/30 hover:shadow-sm transition-shadow">

              <CardContent className="p-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Target className="h-5 w-5 text-info" />

                  <span className="text-sm font-medium">%†j%%j%0j%1 j%/%"j%-%†j%4j%/j%"%</span>

                </div>

                <div className="text-right">

                  <div className="text-lg font-bold text-info">{completionPercentage.toFixed(1)}%</div>

                  <div className="text-xs leading-tight text-muted-foreground">{completedCount} / {quantityItems.length} j%0%†j%»</div>

                </div>

              </CardContent>

            </Card>



            {/* j%0j%V%j%/%éj%1 j%/%"%é%è%àj%1 j%/%"j%-j%4%àj%/%"%èj%1 j%/%"j%2%éj%»%èj%'%%èj%1 */}

            <Card className="border-success/30 hover:shadow-sm transition-shadow">

              <CardContent className="p-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <DollarSign className="h-5 w-5 text-success" />

                  <span className="text-sm font-medium">j%/%"%é%è%àj%1 j%/%"j%-j%4%àj%/%"%èj%1</span>

                </div>

                <div className="text-right">

                  <div className="text-lg font-bold text-success">

                    {formatCurrencyValue(projectTotal, {

                      minimumFractionDigits: 0,

                      maximumFractionDigits: 0

                    })}

                  </div>

                  <div className="text-xs leading-tight text-muted-foreground">j%-j%4%àj%/%"%è j%2%éj%»%èj%'%%è</div>

                </div>

              </CardContent>

            </Card>



            {/* j%0j%V%j%/%éj%1 j%/%"j%0%†%êj%» j%/%"%àj%%j%c%%Qj%'%j%1 */}

            <Card className="border-warning/30 hover:shadow-sm transition-shadow">

              <CardContent className="p-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Calculator className="h-5 w-5 text-warning" />

                  <span className="text-sm font-medium">j%/%"j%0%†%êj%» j%/%"%àj%%j%c%%Qj%'%j%1</span>

                </div>

                <div className="text-right">

                  <div className="text-lg font-bold text-warning">{pricingData.size}</div>

                  <div className="text-xs leading-tight text-muted-foreground">%à%† j%+j%a%%" {quantityItems.length}</div>

                </div>

              </CardContent>

            </Card>

          </div>



          {/* j%a%% %êj%/j%5j%»: j%$%j%'%%èj%V% j%/%"%†%j%%j%0 + 3 j%0j%V%j%/%éj%/j%2 j%/%"j%2%âj%/%"%è% */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">

            {/* ratios toolbar as first column */}

            <div className="p-2 border border-border rounded-md bg-info/10 h-full overflow-hidden" role="region" aria-label="j%-j%»j%/j%'%j%1 j%/%"%†j%%j%0 j%/%"j%/%j%2j%'%j%/j%b%%èj%1">

              <div className="space-y-2">

                <div className="grid grid-cols-3 gap-2">

                  <div className="min-w-0">

                    <span className="block text-xs text-muted-foreground">j%/%"j%-j%»j%/j%'%%èj%1 (%)</span>

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

                      aria-label="j%/%"%†j%%j%0j%1 j%/%"j%-j%»j%/j%'%%èj%1 j%/%"j%/%j%2j%'%j%/j%b%%èj%1"

                    />

                  </div>

                  <div className="min-w-0">

                    <span className="block text-xs text-muted-foreground">j%/%"j%2j%$%j%Q%%è%"%èj%1 (%)</span>

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

                      aria-label="j%/%"%†j%%j%0j%1 j%/%"j%2j%$%j%Q%%è%"%èj%1 j%/%"j%/%j%2j%'%j%/j%b%%èj%1"

                    />

                  </div>

                  <div className="min-w-0">

                    <span className="block text-xs text-muted-foreground">j%/%"j%'%j%0j%5 (%)</span>

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

                      aria-label="%†j%%j%0j%1 j%/%"j%'%j%0j%5 j%/%"j%/%j%2j%'%j%/j%b%%èj%1"

                    />

                  </div>

                </div>

                <div className="flex items-center justify-between gap-2">

                  <span className="text-xs text-muted-foreground whitespace-nowrap leading-tight">j%2%j%V%j%0%é j%c%%"%ë j%/%"j%0%†%êj%» j%/%"j%4j%»%èj%»j%1</span>

                  <button

                    onClick={applyDefaultPercentagesToExistingItems}

                    title="j%2j%V%j%0%è%é j%c%%"%ë j%/%"j%0%†%êj%» j%/%"%à%êj%4%êj%»j%1"

                    aria-label="j%2j%V%j%0%è%é j%c%%"%ë j%/%"j%0%†%êj%» j%/%"%à%êj%4%êj%»j%1"

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

                      j%/%"j%2%âj%/%"%è% j%/%"j%-j%»j%/j%'%%èj%1 ({calculateAveragePercentages().administrative.toFixed(1)}%)

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

                      j%/%"j%2%âj%/%"%è% j%/%"j%2j%$%j%Q%%è%"%èj%1 ({calculateAveragePercentages().operational.toFixed(1)}%)

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

                      j%-j%4%àj%/%"%è j%/%"j%+j%'%j%0j%/j%5 ({calculateAveragePercentages().profit.toFixed(1)}%)

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



          {/* j%$%j%'%%èj%V% j%/%"j%2%éj%»%à */}

          <Card>

            <CardHeader className="p-3 pb-2">

              <CardTitle className="flex items-center gap-2 text-sm">

                <Target className="w-5 h-5 text-info" />

                j%2%éj%»%à j%c%%à%"%èj%1 j%/%"j%2j%%j%c%%èj%'%

              </CardTitle>

            </CardHeader>

            <CardContent className="p-3 pt-2">

              <div className="space-y-2">

                <div className="flex justify-between text-xs">

                  <span>j%2%à j%-%†j%4j%/j%"% {completedCount} %à%† {quantityItems.length} j%0%†j%»</span>

                  <span>{completionPercentage.toFixed(1)}%</span>

                </div>

                <div className="w-full bg-muted/30 rounded-full h-2 relative overflow-hidden">

                  {/* j%$%j%'%%èj%V% j%/%"j%2%éj%»%à j%0j%c%j%'%j%b% j%»%è%†j%/%à%è%â%è */}

                  <div 

 

                    className="bg-gradient-to-r from-info to-success h-2 rounded-full transition-all duration-300 absolute top-0 left-0"

                    {...{style: {width: `${Math.min(Math.max(completionPercentage, 0), 100)}%`}}}

                  />

                </div>

              </div>

            </CardContent>

          </Card>



          {/* j%c%j%'%j%b% j%4j%»%ê%" j%/%"%â%à%èj%/j%2 j%/%"j%+j%%j%/j%%%è */}

          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">

                <Grid3X3 className="w-5 h-5 text-success" />

                j%4j%»%ê%" %â%à%èj%/j%2 j%/%"%à%†j%/%j%%j%1

              </CardTitle>

            </CardHeader>

            <CardContent>

              <div className="overflow-auto border rounded-lg">

                <table className="w-full border-collapse">

                  <thead className="sticky top-0 bg-card z-10">

                    <tr className="bg-muted/20 border-b">

                      <th className="border border-border p-3 text-right font-semibold">j%'%%é%à j%/%"j%0%†j%»</th>

                      <th className="border border-border p-3 text-right font-semibold">%êj%a%% j%/%"j%0%†j%»</th>

                      <th className="border border-border p-3 text-center font-semibold">j%/%"%êj%5j%»j%1</th>

                      <th className="border border-border p-3 text-center font-semibold">j%/%"%â%à%èj%1</th>

                      <th className="border border-border p-3 text-center font-semibold">j%%j%c%j%'% j%/%"%êj%5j%»j%1</th>

                      <th className="border border-border p-3 text-center font-semibold">j%/%"%é%è%àj%1 j%/%"j%-j%4%àj%/%"%èj%1</th>

                      <th className="border border-border p-3 text-center font-semibold">j%5j%/%"j%1 j%/%"j%2j%%j%c%%èj%'%</th>

                      <th className="border border-border p-3 text-center font-semibold">j%-j%4j%'%j%/j%)j%/j%2</th>

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

                                  j%2%à j%/%"j%2j%%j%c%%èj%'%

                                </Badge>

                              ) : isInProgress ? (

                                <Badge className="bg-warning/15 text-warning border-warning/20">

                                  %é%èj%» j%/%"j%2j%%j%c%%èj%'%

                                </Badge>

                              ) : (

                                <Badge className="bg-destructive/15 text-destructive border-destructive/20">

                                  <AlertCircle className="w-3 h-3 ml-1" />

                                  %"%à %èj%2%à j%/%"j%2j%%j%c%%èj%'%

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

                                {(isCompleted || isInProgress) ? 'j%2j%c%j%»%è%"' : 'j%2j%%j%c%%èj%'%'}

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

                                          <div className="text-xs font-semibold text-info">j%/%"%à%êj%/j%» ({itemPricing.materials.length} j%a%%†%)</div>

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

                                                <th className="text-right p-1">j%/%"j%/j%%%à/j%/%"%êj%a%%</th>

                                                <th className="text-center p-1">j%/%"%êj%5j%»j%1</th>

                                                <th className="text-center p-1">j%/%"%â%à%èj%1</th>

                                                <th className="text-center p-1">j%/%"j%%j%c%j%'%</th>

                                                <th className="text-center p-1">j%/%"j%-j%4%àj%/%"%è</th>

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

                                          <div className="text-xs font-semibold text-success">j%/%"j%c%%àj%/%"j%1 ({itemPricing.labor.length} %†%êj%c%)</div>

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

                                                <th className="text-right p-1">j%/%"%êj%a%%</th>

                                                <th className="text-center p-1">j%/%"%êj%5j%»j%1</th>

                                                <th className="text-center p-1">j%/%"%â%à%èj%1</th>

                                                <th className="text-center p-1">j%/%"j%%j%c%j%'%</th>

                                                <th className="text-center p-1">j%/%"j%-j%4%àj%/%"%è</th>

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

                                          <div className="text-xs font-semibold text-accent">j%/%"%àj%c%j%»j%/j%2 ({itemPricing.equipment.length} %àj%c%j%»j%1)</div>

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

                                                <th className="text-right p-1">j%/%"%êj%a%%</th>

                                                <th className="text-center p-1">j%/%"%êj%5j%»j%1</th>

                                                <th className="text-center p-1">j%/%"%â%à%èj%1</th>

                                                <th className="text-center p-1">j%/%"j%%j%c%j%'%</th>

                                                <th className="text-center p-1">j%/%"j%-j%4%àj%/%"%è</th>

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

                                          <div className="text-xs font-semibold text-secondary">%à%éj%/%ê%"%ê j%/%"j%0j%/j%V%%† ({itemPricing.subcontractors.length} %à%éj%/%ê%")</div>

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

                                                <th className="text-right p-1">j%/%"%êj%a%%</th>

                                                <th className="text-center p-1">j%/%"%êj%5j%»j%1</th>

                                                <th className="text-center p-1">j%/%"%â%à%èj%1</th>

                                                <th className="text-center p-1">j%/%"j%%j%c%j%'%</th>

                                                <th className="text-center p-1">j%/%"j%-j%4%àj%/%"%è</th>

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



          {/* %à%"j%«j%a% %àj%/%"%è */}

          {projectTotal > 0 && (

            <Card>

              <CardHeader>

                <CardTitle className="flex items-center gap-2">

                  <PieChart className="w-5 h-5 text-success" />

                  j%/%"%à%"j%«j%a% j%/%"%àj%/%"%è %"%"%àj%$%j%'%%êj%c%

                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-3">

                    <div className="flex justify-between items-center p-3 bg-info/10 rounded-lg">

                      <span className="font-medium">j%-j%4%àj%/%"%è %é%è%àj%1 j%/%"j%0%†%êj%» j%/%"%à%j%%j%c%j%'%j%1:</span>

                      <span className="font-bold text-info">

                        {formatCurrencyValue(calculateItemsTotal(), {

                          minimumFractionDigits: 0,

                          maximumFractionDigits: 0

                        })}

                      </span>

                    </div>

                    <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">

                      <span className="font-medium">

                        j%-j%4%àj%/%"%è j%/%"j%2%âj%/%"%è% j%/%"j%-j%»j%/j%'%%èj%1 ({calculateAveragePercentages().administrative.toFixed(1)}%):

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

                        j%-j%4%àj%/%"%è j%/%"j%2%âj%/%"%è% j%/%"j%2j%$%j%Q%%è%"%èj%1 ({calculateAveragePercentages().operational.toFixed(1)}%):

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

                      <span className="font-medium">j%b%j%'%%èj%0j%1 j%/%"%é%è%àj%1 j%/%"%àj%b%j%/%j%1 (15%):</span>

                      <span className="font-bold text-muted-foreground">

                        {formatCurrencyValue(calculateVAT(), {

                          minimumFractionDigits: 2,

                          maximumFractionDigits: 2

                        })}

                      </span>

                    </div>

                    <div className="flex justify-between items-center p-3 bg-warning/15 rounded-lg">

                      <span className="font-medium">

                        j%-j%4%àj%/%"%è j%/%"j%+j%'%j%0j%/j%5 ({calculateAveragePercentages().profit.toFixed(1)}%):

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

                    <span className="font-bold text-lg">j%/%"%é%è%àj%1 j%/%"j%-j%4%àj%/%"%èj%1 j%/%"%†%çj%/j%.%èj%1:</span>

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



  // j%c%j%'%j%b% j%a%%j%5j%1 j%/%"j%2j%%j%c%%èj%'% j%/%"j%2%j%a%%è%"%è

  const renderPricing = () => {

    if (!currentItem) return null;

    const totals = calculateTotals();



    return (

      <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">

        <div className="space-y-4 p-1 pb-24" dir="rtl">

          {/* %àj%c%%"%ê%àj%/j%2 j%/%"j%0%†j%» j%/%"j%5j%/%"%è (%àj%b%j%Q%%êj%V%j%1) */}

          <Card className="border-info/30 bg-info/10">

            <CardHeader className="p-3">

              <CardTitle className="flex items-center justify-between text-base" dir="rtl">

                <div className="flex items-center gap-2">

                  <Calculator className="w-4 h-4 text-info" />

                  <span className="font-semibold">j%2j%%j%c%%èj%'% j%/%"j%0%†j%» j%'%%é%à {currentItem.itemNumber}</span>

                </div>

                <div className="flex items-center gap-2">

                  <Button

                    size="sm"

                    variant="outline"

                    onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}

                    disabled={currentItemIndex === 0}

                  >

                    j%/%"j%0%†j%» j%/%"j%%j%/j%0%é

                  </Button>

                  <Button

                    size="sm"

                    variant="outline"

                    onClick={() => setCurrentItemIndex(Math.min(quantityItems.length - 1, currentItemIndex + 1))}

                    disabled={currentItemIndex === quantityItems.length - 1}

                  >

                    j%/%"j%0%†j%» j%/%"j%2j%/%"%è

                  </Button>

                </div>

              </CardTitle>

            </CardHeader>

            <CardContent className="p-3">

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3" dir="rtl">

                <div className="md:col-span-2">

                  <Label className="text-xs font-medium text-muted-foreground">%êj%a%% j%/%"j%0%†j%»</Label>

                  <p className="text-sm font-medium text-foreground text-right line-clamp-2">{currentItem.description}</p>

                </div>

                <div>

                  <Label className="text-xs font-medium text-muted-foreground">j%/%"%êj%5j%»j%1</Label>

                  <p className="text-sm font-medium text-info text-right">{currentItem.unit}</p>

                </div>

                <div>

                  <Label className="text-xs font-medium text-muted-foreground">j%/%"%â%à%èj%1</Label>

                  <p className="text-sm font-bold text-success text-right">{formatQuantity(currentItem.quantity)}</p>

                </div>

              </div>

              <div className="mt-2">

                <Label className="text-xs font-medium text-muted-foreground">j%/%"%à%êj%/j%a%%j%/j%2 j%/%"%%†%èj%1</Label>

                <p className="text-xs text-muted-foreground text-right leading-relaxed p-2 bg-muted/20 rounded border border-border">{currentItem.specifications}</p>

              </div>

            </CardContent>

          </Card>



          {/* j%$%j%'%%èj%V% j%-j%c%j%»j%/j%»j%/j%2 %àj%b%j%Q%%êj%V% %%ê%é j%/%"j%4j%»j%/%ê%" */}

          <Card className="border-border">

            <CardContent className="p-2">

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">

                <div>

                  <Label className="text-xs font-medium text-muted-foreground">j%V%j%'%%è%éj%1 j%/%"j%2%†%%èj%'%</Label>

                  <Select

                    value={currentPricing.executionMethod ?? 'j%'%j%/j%2%è'}

                    onValueChange={(value: ExecutionMethod) =>

                      setCurrentPricing(prev => {

                        const next = { ...prev, executionMethod: value };

                        markDirty();

                        return next;

                      })

                    }

                  >

                    <SelectTrigger className="h-8">

                      <SelectValue placeholder="j%/j%«j%2j%'% j%V%j%'%%è%éj%1 j%/%"j%2%†%%èj%'%" />

                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="j%'%j%/j%2%è">j%2%†%%èj%'% j%'%j%/j%2%è</SelectItem>

                      <SelectItem value="%à%éj%/%ê%" j%0j%/j%V%%†">%à%éj%/%ê%" j%0j%/j%V%%†</SelectItem>

                      <SelectItem value="%àj%«j%2%"j%V%">%àj%«j%2%"j%V%</SelectItem>

                    </SelectContent>

                  </Select>

                </div>

                <div>

                  <Label className="text-xs block mb-1 text-muted-foreground">j%/%"%†j%%j%0j%1 j%/%"j%-j%»j%/j%'%%èj%1 (%)</Label>

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

                  <Label className="text-xs block mb-1 text-muted-foreground">j%/%"%†j%%j%0j%1 j%/%"j%2j%$%j%Q%%è%"%èj%1 (%)</Label>

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

                  <Label className="text-xs block mb-1 text-muted-foreground">%†j%%j%0j%1 j%/%"j%'%j%0j%5 (%)</Label>

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



          {/* j%4j%»j%/%ê%" j%/%"j%2j%%j%c%%èj%'% j%0j%c%j%'%j%b% %âj%/%à%" */}

          <Tabs defaultValue="materials" className="w-full" dir="rtl">

            <TabsList className="grid w-full grid-cols-4" dir="rtl">

              <TabsTrigger value="materials" className="flex items-center gap-2 flex-row-reverse">

                j%/%"%à%êj%/j%»

                <Package className="w-4 h-4" />

              </TabsTrigger>

              <TabsTrigger value="labor" className="flex items-center gap-2 flex-row-reverse">

                j%/%"j%c%%àj%/%"j%1

                <Users className="w-4 h-4" />

              </TabsTrigger>

              <TabsTrigger value="equipment" className="flex items-center gap-2 flex-row-reverse">

                j%/%"%àj%c%j%»j%/j%2

                <Truck className="w-4 h-4" />

              </TabsTrigger>

              <TabsTrigger value="subcontractors" className="flex items-center gap-2 flex-row-reverse">

                j%/%"%à%éj%/%ê%"%è%†

                <Building className="w-4 h-4" />

              </TabsTrigger>

            </TabsList>



            {/* j%4j%»%ê%" j%/%"%à%êj%/j%» */}

            <TabsContent value="materials">

              <Card>

                <CardHeader className="p-3">

                  <div className="flex items-center justify-between">

                    <CardTitle className="flex items-center gap-2 text-base">

                      <Package className="w-4 h-4 text-info" />

                      j%/%"%à%êj%/j%» %êj%/%"j%«j%/%àj%/j%2

                    </CardTitle>

                    <Button onClick={() => addRow('materials')} size="sm" className="h-8">

                      <Plus className="w-4 h-4 ml-1" />

                      j%-j%b%j%/%j%1 %àj%/j%»j%1

                    </Button>

                  </div>

                </CardHeader>

                <CardContent className="p-0">

                  <div className="max-h-[50vh] overflow-auto">

                    <table className="w-full border-collapse text-sm" dir="rtl">

                      <thead className="sticky top-0 z-10 bg-muted/20">

                        <tr>

                          <th className="border p-2 text-right">j%/j%%%à j%/%"%àj%/j%»j%1</th>

                          <th className="border p-2 text-right">j%/%"%êj%a%%</th>

                          <th className="border p-2 text-center">j%/%"%êj%5j%»j%1</th>

                          <th className="border p-2 text-center">j%/%"%â%à%èj%1</th>

                          <th className="border p-2 text-center">j%/%"j%%j%c%j%'%</th>

                          <th className="border p-2 text-center">%j%/%éj%»</th>

                          <th className="border p-2 text-center">%†j%%j%0j%1 j%/%"%j%/%éj%»</th>

                          <th className="border p-2 text-center">j%/%"j%-j%4%àj%/%"%è</th>

                          <th className="border p-2 text-center">j%-j%4j%'%j%/j%)j%/j%2</th>

                        </tr>

                      </thead>

                      <tbody>

                        {currentPricing.materials.map((material) => (

                          <tr key={material.id}>

                            <td className="border p-2">

                              <Input

                                value={material.name ?? ''}

                                onChange={(e) => updateRow('materials', material.id, 'name', e.target.value)}

                                placeholder="j%/j%%%à j%/%"%àj%/j%»j%1"

                                className="h-8 py-1 text-sm"

                              />

                            </td>

                            <td className="border p-2">

                              <Input

                                value={material.description ?? ''}

                                onChange={(e) => updateRow('materials', material.id, 'description', e.target.value)}

                                placeholder="j%/%"%êj%a%%"

                                className="h-8 py-1 text-sm"

                              />

                            </td>

                            <td className="border p-2">

                              <Input

                                value={material.unit ?? ''}

                                onChange={(e) => updateRow('materials', material.id, 'unit', e.target.value)}

                                placeholder="j%/%"%êj%5j%»j%1"

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

                                placeholder="j%/%"%â%à%èj%1"

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

                                placeholder="j%/%"j%%j%c%j%'%"

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



            {/* j%4j%»%ê%" j%/%"j%c%%àj%/%"j%1 */}

            <TabsContent value="labor">

              <Card>

                <CardHeader className="p-3">

                  <div className="flex items-center justify-between">

                    <CardTitle className="flex items-center gap-2 text-base">

                      <Users className="w-4 h-4 text-success" />

                      j%/%"j%c%%àj%/%"j%1

                    </CardTitle>

                    <Button onClick={() => addRow('labor')} size="sm" className="h-8">

                      <Plus className="w-4 h-4 ml-1" />

                      j%-j%b%j%/%j%1 j%c%j%/%à%"

                    </Button>

                  </div>

                </CardHeader>

                <CardContent className="p-0">

                  <div className="max-h-[50vh] overflow-auto">

                    <table className="w-full border-collapse text-sm" dir="rtl">

                      <thead className="sticky top-0 z-10 bg-muted/20">

                        <tr>

                          <th className="border p-2 text-right">j%/%"%êj%a%%</th>

                          <th className="border p-2 text-center">j%/%"%êj%5j%»j%1</th>

                          <th className="border p-2 text-center">j%/%"%â%à%èj%1</th>

                          <th className="border p-2 text-center">j%/%"j%%j%c%j%'%</th>

                          <th className="border p-2 text-center">j%/%"j%-j%4%àj%/%"%è</th>

                          <th className="border p-2 text-center">j%-j%4j%'%j%/j%)j%/j%2</th>

                        </tr>

                      </thead>

                      <tbody>

                        {currentPricing.labor.map((labor) => (

                          <tr key={labor.id}>

                            <td className="border p-2">

                              <Input

                                value={labor.description}

                                onChange={(e) => updateRow('labor', labor.id, 'description', e.target.value)}

                                placeholder="%êj%a%% j%/%"j%c%%àj%/%"j%1"

                                className="h-8 py-1 text-sm"

                              />

                            </td>

                            <td className="border p-2">

                              <Input

                                value={labor.unit}

                                onChange={(e) => updateRow('labor', labor.id, 'unit', e.target.value)}

                                placeholder="j%/%"%êj%5j%»j%1"

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

                                placeholder="j%/%"%â%à%èj%1"

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

                                placeholder="j%/%"j%%j%c%j%'%"

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



            {/* j%4j%»%ê%" j%/%"%àj%c%j%»j%/j%2 */}

            <TabsContent value="equipment">

              <Card>

                <CardHeader className="p-3">

                  <div className="flex items-center justify-between">

                    <CardTitle className="flex items-center gap-2 text-base">

                      <Truck className="w-4 h-4 text-accent" />

                      j%/%"%àj%c%j%»j%/j%2 %êj%/%"j%*%"j%/j%2

                    </CardTitle>

                    <Button onClick={() => addRow('equipment')} size="sm" className="h-8">

                      <Plus className="w-4 h-4 ml-1" />

                      j%-j%b%j%/%j%1 %àj%c%j%»j%1

                    </Button>

                  </div>

                </CardHeader>

                <CardContent className="p-0">

                  <div className="max-h-[50vh] overflow-auto">

                    <table className="w-full border-collapse text-sm">

                      <thead className="sticky top-0 z-10 bg-muted/20">

                        <tr>

                          <th className="border p-2 text-right">j%/%"%êj%a%%</th>

                          <th className="border p-2 text-center">j%/%"%êj%5j%»j%1</th>

                          <th className="border p-2 text-center">j%/%"%â%à%èj%1</th>

                          <th className="border p-2 text-center">j%/%"j%%j%c%j%'%</th>

                          <th className="border p-2 text-center">j%/%"j%-j%4%àj%/%"%è</th>

                          <th className="border p-2 text-center">j%-j%4j%'%j%/j%)j%/j%2</th>

                        </tr>

                      </thead>

                      <tbody>

                        {currentPricing.equipment.map((equipment) => (

                          <tr key={equipment.id}>

                            <td className="border p-2">

                              <Input

                                value={equipment.description}

                                onChange={(e) => updateRow('equipment', equipment.id, 'description', e.target.value)}

                                placeholder="%êj%a%% j%/%"%àj%c%j%»j%1"

                                className="h-8 py-1 text-sm"

                              />

                            </td>

                            <td className="border p-2">

                              <Input

                                value={equipment.unit}

                                onChange={(e) => updateRow('equipment', equipment.id, 'unit', e.target.value)}

                                placeholder="j%/%"%êj%5j%»j%1"

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

                                placeholder="j%/%"%â%à%èj%1"

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

                                placeholder="j%/%"j%%j%c%j%'%"

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



            {/* j%4j%»%ê%" j%/%"%àj%c%j%»j%/j%2 */}

            <TabsContent value="equipment">

              <Card>

                <CardHeader className="p-3">

                  <div className="flex items-center justify-between">

                    <CardTitle className="flex items-center gap-2 text-base">

                      <Truck className="w-4 h-4 text-accent" />

                      j%/%"%àj%c%j%»j%/j%2 %êj%/%"j%*%"j%/j%2

                    </CardTitle>

                    <Button onClick={() => addRow('equipment')} size="sm" className="h-8">

                      <Plus className="w-4 h-4 ml-1" />

                      j%-j%b%j%/%j%1 %àj%c%j%»j%1

                    </Button>

                  </div>

                </CardHeader>

                <CardContent className="p-0">

                  <div className="max-h-[50vh] overflow-auto">

                    <table className="w-full border-collapse text-sm">

                      <thead className="sticky top-0 z-10 bg-muted/20">

                        <tr>

                          <th className="border p-2 text-right">j%/%"%êj%a%%</th>

                          <th className="border p-2 text-center">j%/%"%êj%5j%»j%1</th>

                          <th className="border p-2 text-center">j%/%"%â%à%èj%1</th>

                          <th className="border p-2 text-center">j%/%"j%%j%c%j%'%</th>

                          <th className="border p-2 text-center">j%/%"j%-j%4%àj%/%"%è</th>

                          <th className="border p-2 text-center">j%-j%4j%'%j%/j%)j%/j%2</th>

                        </tr>

                      </thead>

                      <tbody>

                        {currentPricing.equipment.map((equipment) => (

                          <tr key={equipment.id}>

                            <td className="border p-2">

                              <Input

                                value={equipment.description}

                                onChange={(e) => updateRow('equipment', equipment.id, 'description', e.target.value)}

                                placeholder="%êj%a%% j%/%"%àj%c%j%»j%1"

                                className="h-8 py-1 text-sm"

                              />

                            </td>

                            <td className="border p-2">

                              <Input

                                value={equipment.unit}

                                onChange={(e) => updateRow('equipment', equipment.id, 'unit', e.target.value)}

                                placeholder="j%/%"%êj%5j%»j%1"

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

                                placeholder="j%/%"%â%à%èj%1"

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

                                placeholder="j%/%"j%%j%c%j%'%"

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



            {/* j%4j%»%ê%" j%/%"%à%éj%/%ê%"%è%† */}

            <TabsContent value="subcontractors">

              <Card>

                <CardHeader className="p-3">

                  <div className="flex items-center justify-between">

                    <CardTitle className="flex items-center gap-2 text-base">

                      <Building className="w-4 h-4 text-secondary" />

                      j%/%"%à%éj%/%ê%"%ê%† %à%† j%/%"j%0j%/j%V%%†

                    </CardTitle>

                    <Button onClick={() => addRow('subcontractors')} size="sm" className="h-8">

                      <Plus className="w-4 h-4 ml-1" />

                      j%-j%b%j%/%j%1 %à%éj%/%ê%"

                    </Button>

                  </div>

                </CardHeader>

                <CardContent className="p-0">

                  <div className="max-h-[50vh] overflow-auto">

                    <table className="w-full border-collapse text-sm">

                      <thead className="sticky top-0 z-10 bg-muted/20">

                        <tr>

                          <th className="border p-2 text-right">j%/%"%êj%a%%</th>

                          <th className="border p-2 text-center">j%/%"%êj%5j%»j%1</th>

                          <th className="border p-2 text-center">j%/%"%â%à%èj%1</th>

                          <th className="border p-2 text-center">j%/%"j%%j%c%j%'%</th>

                          <th className="border p-2 text-center">j%/%"j%-j%4%àj%/%"%è</th>

                          <th className="border p-2 text-center">j%-j%4j%'%j%/j%)j%/j%2</th>

                        </tr>

                      </thead>

                      <tbody>

                        {currentPricing.subcontractors.map((subcontractor) => (

                          <tr key={subcontractor.id}>

                            <td className="border p-2">

                              <Input

                                value={subcontractor.description}

                                onChange={(e) => updateRow('subcontractors', subcontractor.id, 'description', e.target.value)}

                                placeholder="%êj%a%% j%/%"j%c%%à%""

                                className="h-8 py-1 text-sm"

                              />

                            </td>

                            <td className="border p-2">

                              <Input

                                value={subcontractor.unit}

                                onChange={(e) => updateRow('subcontractors', subcontractor.id, 'unit', e.target.value)}

                                placeholder="j%/%"%êj%5j%»j%1"

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

                                placeholder="j%/%"%â%à%èj%1"

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

                                placeholder="j%/%"j%%j%c%j%'%"

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



              {/* j%/%"%à%"j%/j%5j%U%j%/j%2 j%/%"%%†%èj%1 */}

              <Card>

            <CardHeader className="p-3">

              <CardTitle className="flex items-center gap-2 text-base">

                <FileText className="w-4 h-4 text-muted-foreground" />

                j%/%"%à%"j%/j%5j%U%j%/j%2 j%/%"%%†%èj%1

              </CardTitle>

            </CardHeader>

            <CardContent className="p-3">

              <Textarea

                value={currentPricing.technicalNotes}

                onChange={(e) => setCurrentPricing(prev => { const next = { ...prev, technicalNotes: e.target.value }; markDirty(); return next; })}

                placeholder="j%+j%b%% j%+%è %à%"j%/j%5j%U%j%/j%2 %%†%èj%1 j%«j%/j%a%j%1 j%0%çj%'%j%/ j%/%"j%0%†j%»..."

                rows={4}

                className="text-right text-sm"

              />

            </CardContent>

          </Card>

            

              {/* j%/%"%à%"j%«j%a% j%/%"%àj%/%"%è */}

              <Card>

              <CardHeader>

                <CardTitle className="flex items-center gap-2">

                  <BarChart3 className="w-5 h-5 text-success" />

                  j%/%"%à%"j%«j%a% j%/%"%àj%/%"%è

                </CardTitle>

              </CardHeader>

              <CardContent className="space-y-3">

                <div className="flex justify-between items-center p-2 bg-info/10 rounded">

                  <span>j%/%"%à%êj%/j%»:</span>

                  <span className="font-bold">{formatCurrencyValue(totals.materials)}</span>

                </div>

                <div className="flex justify-between items-center p-2 bg-success/10 rounded">

                  <span>j%/%"j%c%%àj%/%"j%1:</span>

                  <span className="font-bold">{formatCurrencyValue(totals.labor)}</span>

                </div>

                <div className="flex justify-between items-center p-2 bg-accent/10 rounded">

                  <span>j%/%"%àj%c%j%»j%/j%2:</span>

                  <span className="font-bold">{formatCurrencyValue(totals.equipment)}</span>

                </div>

                <div className="flex justify-between items-center p-2 bg-secondary/10 rounded">

                  <span>j%/%"%à%éj%/%ê%"%ê%†:</span>

                  <span className="font-bold">{formatCurrencyValue(totals.subcontractors)}</span>

                </div>

                <Separator />

                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">

                  <span>j%/%"%àj%4%à%êj%c% j%/%"%j%'%j%c%%è:</span>

                  <span className="font-bold">{formatCurrencyValue(totals.subtotal)}</span>

                </div>

                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">

                  <span>j%/%"j%2%âj%/%"%è% j%/%"j%-j%»j%/j%'%%èj%1:</span>

                  <span className="font-bold">{formatCurrencyValue(totals.administrative)}</span>

                </div>

                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">

                  <span>j%/%"j%2%âj%/%"%è% j%/%"j%2j%$%j%Q%%è%"%èj%1:</span>

                  <span className="font-bold">{formatCurrencyValue(totals.operational)}</span>

                </div>

                <div className="flex justify-between items-center p-2 bg-muted/20 rounded">

                  <span>j%/%"j%'%j%0j%5:</span>

                  <span className="font-bold">{formatCurrencyValue(totals.profit)}</span>

                </div>

                <Separator />

                <div className="flex justify-between items-center p-3 bg-success/15 rounded-lg">

                  <span className="font-bold text-lg">j%/%"j%-j%4%àj%/%"%è j%/%"%†%çj%/j%.%è:</span>

                  <span className="font-bold text-xl text-success">{formatCurrencyValue(totals.total)}</span>

                </div>

                <div className="flex justify-between items-center p-2 bg-info/15 rounded">

                  <span className="font-medium">j%%j%c%j%'% j%/%"%êj%5j%»j%1:</span>

                  <span className="font-bold text-info">

                    {formatCurrencyValue(totals.total / currentItem.quantity, {

                      minimumFractionDigits: 2,

                      maximumFractionDigits: 2

                    })}

                  </span>

                </div>

              </CardContent>

              </Card>



          {/* j%$%j%'%%èj%V% j%-j%4j%'%j%/j%)j%/j%2 %àj%3j%0j%2 j%+j%%%%" j%/%"j%c%j%'%j%b% */}

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

                j%/%"j%0%†j%» j%/%"j%%j%/j%0%é

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

                    j%5%j%U% j%2j%%j%c%%èj%'% j%/%"j%0%†j%»

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

                j%/%"j%0%†j%» j%/%"j%2j%/%"%è

                <ArrowRight className="w-4 h-4 rotate-180" />

              </Button>

            </div>

          </ActionBar>

        </div>

      </ScrollArea>

    );

  };



  // j%c%j%'%j%b% j%/%"j%c%j%'%j%b% j%/%"%%†%è

  const renderTechnical = () => {

    return (

      <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">

        <div className="space-y-6 p-1 pb-20" dir="rtl">

          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">

                <FileText className="w-5 h-5 text-info" />

                j%'%%j%c% %à%"%j%/j%2 j%/%"j%c%j%'%j%b% j%/%"%%†%è

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

            title="%"j%/ j%2%êj%4j%» j%0%†%êj%» %"%"j%2j%%j%c%%èj%'%"

            description="%èj%4j%0 j%-j%b%j%/%j%1 j%4j%»%ê%" j%/%"%â%à%èj%/j%2 %"%"%à%†j%/%éj%a%j%1 %éj%0%" j%/%"j%0j%»j%) %%è j%c%%à%"%èj%1 j%/%"j%2j%%j%c%%èj%'%."

            actionLabel="j%/%"j%c%%êj%»j%1"

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

          j%/%"j%c%%êj%»j%1

        </Button>

        <div className="flex-1">

          <h1 className="text-xl font-bold text-foreground">j%c%%à%"%èj%1 j%/%"j%2j%%j%c%%èj%'%</h1>

          <p className="text-muted-foreground text-sm">{tender.name || tender.title || '%à%†j%/%j%%j%1 j%4j%»%èj%»j%1'}</p>

          {/* j%$%j%'%%èj%V% j%5j%/%"j%1 j%/%"%†j%%j%«j%1 j%/%"j%'%j%%%à%èj%1 / j%/%"%àj%%%êj%»j%1 */}

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">

            {editablePricing.source === 'official' && (

              <Badge className="bg-success text-success-foreground hover:bg-success/90">%†j%%j%«j%1 j%'%j%%%à%èj%1 %àj%c%j%2%àj%»j%1</Badge>

            )}

            {editablePricing.source === 'draft' && editablePricing.isDraftNewer && (

              <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">%àj%%%êj%»j%1 j%+j%5j%»j%3 (j%Q%%èj%'% %àj%c%j%2%àj%»j%1)</Badge>

            )}

            {/* Snapshot indicator removed j%0j%c%j%» j%-%"j%Q%j%/j%) %†j%U%j%/%à j%/%"%"%éj%V%j%/j%2 */}

            {/* Removed legacy 'hook' source badge after unification */}

            {editablePricing.hasDraft && !editablePricing.isDraftNewer && editablePricing.source === 'official' && (

              <Badge variant="secondary" className="bg-muted/30 text-muted-foreground">%àj%%%êj%»j%1 %àj%5%%êj%U%j%1</Badge>

            )}

            {editablePricing.dirty && (

              <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse">j%2j%Q%%è%èj%'%j%/j%2 j%Q%%èj%'% %àj%5%%êj%U%j%1 j%'%j%%%à%èj%/%ï</Badge>

            )}

          </div>

        </div>

        

        {/* j%$%j%'%%èj%V% j%+j%»%êj%/j%2 %à%j%c%j%/j%» j%2j%a%%à%è%à%ç */}

        <div className="flex items-center gap-2">

          {/* %é%êj%/%"j%0 j%/%"j%2j%%j%c%%èj%'% */}

          <Button

            variant="outline"

            size="sm"

            onClick={() => setTemplateManagerOpen(true)}

            className="flex items-center gap-2"

          >

            <Layers className="w-4 h-4" />

            j%/%"%é%êj%/%"j%0

          </Button>



          {/* j%/j%c%j%2%àj%/j%» j%'%j%%%à%è */}

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

                toast.success('j%2%à j%/j%c%j%2%àj%/j%» j%/%"j%2j%%j%c%%èj%'% j%'%j%%%à%èj%/%ï', { duration: 2500 });

              } catch (e) {

                console.error('Official save failed', e);

                toast.error('%j%$%%" j%/j%c%j%2%àj%/j%» j%/%"%†j%%j%«j%1 j%/%"j%'%j%%%à%èj%1');

              }

            }}

            trigger={

              <Button

                size="sm"

                className="flex items-center gap-2 bg-success text-success-foreground hover:bg-success/90"

                disabled={editablePricing.status !== 'ready' || (!editablePricing.dirty && !editablePricing.isDraftNewer && editablePricing.source === 'official')}

              >

                <CheckCircle className="w-4 h-4" />

                j%/j%c%j%2%àj%/j%»

              </Button>

            }

          />

          {/* %†j%%j%0j%1 j%/%"j%-%†j%4j%/j%"% %àj%«j%2j%a%j%'%j%1 */}

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

          {/* %éj%/j%.%àj%1 j%/%"j%+j%»%êj%/j%2 j%/%"j%3j%/%†%ê%èj%1 */}

          <DropdownMenu>

            <DropdownMenuTrigger asChild>

              <Button variant="outline" size="sm" className="flex items-center gap-1">

                <Settings className="w-4 h-4" />

                j%+j%»%êj%/j%2

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

                    <Save className="w-4 h-4 text-success" /> j%5%j%U% j%2j%%j%c%%èj%'% j%/%"j%0%†j%»

                  </DropdownMenuItem>

                }

              />

              <DropdownMenuSeparator />

              <ConfirmationDialog

                title="j%-%†j%$%j%/j%) %†j%%j%«j%1 j%/j%5j%2%èj%/j%V%%èj%1"

                description="j%%%èj%2%à j%5%j%U% %†j%%j%«j%1 j%/j%5j%2%èj%/j%V%%èj%1 %à%† j%5j%/%"j%1 j%/%"j%2j%%j%c%%èj%'% j%/%"j%5j%/%"%èj%1 (%èj%2%à j%/%"j%/j%5j%2%j%/j%U% j%0j%*j%«j%'% 10 %%éj%V%). %ç%" j%2j%'%%èj%» j%/%"%àj%2j%/j%0j%c%j%1j%'"

                confirmText="%†j%c%%àj%î j%-%†j%$%j%/j%) %†j%%j%«j%1"

                cancelText="j%-%"j%Q%j%/j%)"

                variant="success"

                icon="save"

                onConfirm={() => { void createBackup(); }}

                trigger={

                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">

                    <RotateCcw className="w-4 h-4 text-info" /> j%-%†j%$%j%/j%) %†j%%j%«j%1 j%/j%5j%2%èj%/j%V%%èj%1

                  </DropdownMenuItem>

                }

              />

              <DropdownMenuItem onClick={() => { setRestoreOpen(true); void loadBackupsList(); }} className="flex items-center gap-2 cursor-pointer">

                <RotateCcw className="w-4 h-4 text-info" /> j%/j%%j%2j%'%j%4j%/j%c% %†j%%j%«j%1

              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>j%/%"j%2j%a%j%»%èj%'%</DropdownMenuLabel>

              <DropdownMenuItem onClick={exportPricingToExcel} className="flex items-center gap-2 cursor-pointer">

                <Download className="w-4 h-4 text-success" /> j%2j%a%j%»%èj%'% Excel

              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>j%-j%4j%'%j%/j%)j%/j%2</DropdownMenuLabel>

              <DropdownMenuItem onClick={() => { updateTenderStatus(); toast.success('j%2%à j%2j%5j%»%èj%3 j%5j%/%"j%1 j%/%"%à%†j%/%j%%j%1'); }} className="flex items-center gap-2 cursor-pointer">

                <TrendingUp className="w-4 h-4 text-secondary" /> j%2j%5j%»%èj%3 j%/%"j%5j%/%"j%1

              </DropdownMenuItem>

            </DropdownMenuContent>

          </DropdownMenu>

        </div>

      </div>

      {/* Dialog j%/%"j%/j%%j%2j%'%j%4j%/j%c% j%0%é%è %"%"j%/j%%j%2j%«j%»j%/%à %"%â%†%ç j%+%j%«j%'%j%4 %à%† j%/%"j%2j%4%àj%c% j%/%"j%0j%a%j%'%%è %"%"j%+j%"%j%'%j%/j%'% */}

  <Dialog open={restoreOpen} onOpenChange={(openState) => { setRestoreOpen(openState); if (openState) void loadBackupsList(); }}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>j%/j%%j%2j%'%j%4j%/j%c% %†j%%j%«j%1 j%/j%5j%2%èj%/j%V%%èj%1</DialogTitle>

            <DialogDescription>j%/j%«j%2j%'% %†j%%j%«j%1 %"j%/j%%j%2j%'%j%4j%/j%c% j%0%èj%/%†j%/j%2 j%/%"j%2j%%j%c%%èj%'%.</DialogDescription>

          </DialogHeader>

          <div className="max-h-64 overflow-auto mt-2 space-y-2" dir="rtl">

            {backupsList.length === 0 && (

              <EmptyState

                icon={RotateCcw}

                title="%"j%/ j%2%êj%4j%» %†j%%j%« j%/j%5j%2%èj%/j%V%%èj%1"

                description="%"%à %èj%2%à j%-%†j%$%j%/j%) j%+%è %†j%%j%« j%/j%5j%2%èj%/j%V%%èj%1 %"%çj%'%%ç j%/%"%à%†j%/%j%%j%1 j%0j%c%j%»."

              />

            )}

            {backupsList.map((b)=> (

              <div key={b.id} className="flex items-center justify-between border border-border rounded p-2">

                <div className="text-sm">

                  <div className="font-medium">{formatTimestamp(b.timestamp)}</div>

                  <div className="text-muted-foreground">%†j%%j%0j%1 j%/%"j%-%â%àj%/%": {Math.round(b.completionPercentage)}% 8€* j%/%"j%-j%4%àj%/%"%è: {formatCurrencyValue(b.totalValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>

                  <div className="text-xs text-muted-foreground">

                    j%/%"j%c%%†j%/j%a%j%'% j%/%"%àj%%j%c%j%'%j%1: {b.itemsPriced}/{b.itemsTotal}

                    {b.retentionExpiresAt

                      ? ` 8€* j%/%"j%/j%5j%2%j%/j%U% j%5j%2%ë ${formatDateValue(b.retentionExpiresAt, {

                          locale: 'ar-SA',

                          year: 'numeric',

                          month: 'numeric',

                          day: 'numeric'

                        })}`

                      : ''}

                  </div>

                </div>

                <div className="flex items-center gap-2">

                  <Button size="sm" onClick={()=>restoreBackup(b.id)}>j%/j%%j%2j%'%j%4j%/j%c%</Button>

                </div>

              </div>

            ))}

          </div>

          <div className="flex justify-end mt-4">

            <DialogClose asChild>

              <Button variant="outline">j%-j%Q%%"j%/%é</Button>

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

            <span>j%/%"%à%"j%«j%a%</span>

            <PieChart className="w-4 h-4" />

          </TabsTrigger>

          <TabsTrigger value="pricing" className="flex items-center gap-2 flex-row-reverse">

            {currentItem && pricingData.get(currentItem.id)?.completed && (

              <Badge variant="outline" className="mr-1 text-success border-success/40">

                %àj%5%%êj%U%

                <CheckCircle className="w-3 h-3 mr-1" />

              </Badge>

            )}

            <span>j%/%"j%2j%%j%c%%èj%'%</span>

            <Calculator className="w-4 h-4" />

          </TabsTrigger>

          <TabsTrigger value="technical" className="flex items-center gap-2 flex-row-reverse">

            <span>j%/%"j%c%j%'%j%b% j%/%"%%†%è</span>

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

            <DialogTitle>j%-j%»j%/j%'%j%1 %é%êj%/%"j%0 j%/%"j%2j%%j%c%%èj%'%</DialogTitle>

            <DialogDescription>

              j%/j%«j%2j%'% %éj%/%"j%0 j%2j%%j%c%%èj%'% %"j%2j%V%j%0%è%é%ç j%c%%"%ë j%/%"%à%†j%/%j%%j%1 j%+%ê j%/j%5%j%U% j%/%"j%-j%c%j%»j%/j%»j%/j%2 j%/%"j%5j%/%"%èj%1 %â%éj%/%"j%0 j%4j%»%èj%»

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

