/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronDown, EllipsisVertical, Edit, Plus, Trash2, ShoppingCart, ArrowUpDown, Undo, FileDown, FileUp, PlusCircle, Search, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { CostBaselineTotals } from './CostBaselineTotals';
import { CostPercentagesPanel, type CostPercentagesValue } from './CostPercentagesPanel';
import { useProjectBOQ } from '@/application/hooks/useProjectBOQ';
import { costVarianceService } from '@/application/services/costVarianceService';
import { projectCostService } from '@/application/services/projectCostService';
import { useUndoStack } from '@/application/hooks/useUndoStack';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ProjectCostItem } from '@/application/services/projectCostService';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { DeleteConfirmation } from '../ui/confirmation-dialog';
import { formatTime } from '@/utils/formatters';
import { EmptyState } from '../PageLayout';

export interface ProjectCostViewProps {
  projectId: string;
  tenderId?: string;
}

type BreakdownSectionKey = 'materials' | 'labor' | 'equipment' | 'subcontractors';

export const ProjectCostView: React.FC<ProjectCostViewProps> = ({ projectId, tenderId }) => {
  const {
    draft,
    loading,
    upsertItem,
    refresh,
    promote,
  } = useProjectBOQ(projectId);

  const variance = useMemo(() => {
    if (!draft) return null;
    return costVarianceService.analyzeProject(projectId);
  }, [draft, projectId]);

  const severityMap = useMemo(() => {
    if (!variance?.alerts) return {};
    return Object.fromEntries(variance.alerts.map((a: any) => [a.itemId, a.severity]));
  }, [variance]);

  const undo = useUndoStack<any>();

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('description');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openBreakdowns, setOpenBreakdowns] = useState(new Set<string>());
  const [activeSectionByItem, setActiveSectionByItem] = useState<Record<string, string>>({});
  const [autoMerging, setAutoMerging] = useState(false);
  const [addingActualOnly, setAddingActualOnly] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [actualOnlyDescription, setActualOnlyDescription] = useState('');
  const [actualOnlyAmount, setActualOnlyAmount] = useState('');
  const autoMergedRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [itemToDelete, setItemToDelete] = useState<ProjectCostItem | null>(null);
  const [rowDeleteTarget, setRowDeleteTarget] = useState<{
    itemId: string;
    section: BreakdownSectionKey;
    rowId: string;
    name: string;
  } | null>(null);

  const DEFAULT_PERCENTAGES: CostPercentagesValue = useMemo(() => ({ administrative: 5, operational: 5, profit: 15 }), []);

  const { formatCurrencyValue } = useCurrencyFormatter();
  const decimalFormatter = useMemo(() => new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);
  const formatDecimal = useCallback((value: number | null | undefined) => decimalFormatter.format(value ?? 0), [decimalFormatter]);

  const triggerAutoSave = () => {
    setIsAutoSaving(true);
    setTimeout(() => setIsAutoSaving(false), 1000);
  };

  const parseNumericInput = (input: string | number): number => {
    if (typeof input === 'number') {
      return Number.isFinite(input) ? input : 0;
    }
    if (!input) return 0;
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    let normalized = input
      .replace(/[\s]/g, '')
      .replace(/٬/g, '')
      .replace(/٫/g, '.');
    normalized = normalized.replace(/[٠-٩]/g, d => {
      const idx = arabicDigits.indexOf(d);
      return idx >= 0 ? String(idx) : d;
    });
    if (normalized.includes('.') && normalized.includes(',')) {
      normalized = normalized.replace(/,/g, '');
    } else if (!normalized.includes('.') && normalized.includes(',')) {
      normalized = normalized.replace(/,/g, '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
    normalized = normalized.replace(/[^0-9\-.]/g, '');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getPricingConfig = () => ({ vatRate: 0.15 });

  const items: ProjectCostItem[] = (draft?.items as ProjectCostItem[]) || [];
  const draftTotals = draft?.totals || { estimatedTotal: 0, actualTotal: 0, varianceTotal: 0, variancePct: 0 };

  const defaultPercentages = useMemo<CostPercentagesValue>(() => {
    const stored = (draft as any)?.defaultPercentages;
    if (stored) {
      return {
        administrative: Number(stored.administrative) || 0,
        operational: Number(stored.operational) || 0,
        profit: Number(stored.profit) || 0
      };
    }
    if (items.length > 0) {
      let admin = 0, operational = 0, profit = 0, counted = 0;
      items.forEach(item => {
        const perc = item.actual?.additionalPercentages;
        if (perc) {
          admin += perc.administrative ?? 0;
          operational += perc.operational ?? 0;
          profit += perc.profit ?? 0;
          counted += 1;
        }
      });
      if (counted > 0) {
        return {
          administrative: +(admin / counted).toFixed(2),
          operational: +(operational / counted).toFixed(2),
          profit: +(profit / counted).toFixed(2)
        };
      }
    }
    return DEFAULT_PERCENTAGES;
  }, [draft, items, DEFAULT_PERCENTAGES]);

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) {
      return;
    }

    undo.push(JSON.parse(JSON.stringify(items)));
    projectCostService.saveDraft(projectId, draftData => {
      draftData.items = draftData.items.filter(item => item.id !== itemToDelete.id);
    });
    refresh();
    setItemToDelete(null);
  };

  const handleConfirmDeleteRow = () => {
    if (!rowDeleteTarget) {
      return;
    }

    const { itemId, section, rowId } = rowDeleteTarget;

    projectCostService.saveDraft(projectId, (draftData: any) => {
      const item = draftData.items.find((it: any) => it.id === itemId);
      if (!item) {
        return;
      }

      const list = item.actual.breakdown[section];
      if (!Array.isArray(list)) {
        return;
      }

      const index = list.findIndex((row: any) => row.id === rowId);
      if (index > -1) {
        list.splice(index, 1);
      }
    });
    refresh();
    setRowDeleteTarget(null);
  };

  const captureUndoSnapshot = () => {
    if (!items || items.length === 0) return;
    undo.push(JSON.parse(JSON.stringify(items)));
  };

  const handleItemActualChange = (itemId: string, field: 'quantity' | 'unitPrice', value: string) => {
    const target = items.find(i => i.id === itemId);
    if (!target || !target.actual) return;
    const numericValue = parseNumericInput(value);
    const previous = field === 'quantity' ? (target.actual.quantity ?? 0) : (target.actual.unitPrice ?? 0);
    if (Number.isFinite(previous) && Math.abs(previous - numericValue) < 0.0001) return;
    captureUndoSnapshot();
    projectCostService.saveDraft(projectId, draftData => {
      const item = draftData.items.find(i => i.id === itemId);
      if (!item) return;
      if (!item.actual) item.actual = {
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        breakdown: { materials: [], labor: [], equipment: [], subcontractors: [] },
        additionalPercentages: { ...defaultPercentages }
      };
      if (field === 'quantity') {
        item.actual.quantity = numericValue;
      } else {
        item.actual.unitPrice = numericValue;
      }
      const qty = item.actual.quantity ?? 0;
      const up = item.actual.unitPrice ?? 0;
      item.actual.totalPrice = +(qty * up).toFixed(2);
      item.state.isModified = true;
      item.state.lastEditAt = new Date().toISOString();
    });
    refresh();
  };

  const handleBreakdownRowChange = (itemId: string, section: string, rowId: string, field: 'name' | 'unit' | 'quantity' | 'unitCost', value: string) => {
    const target = items.find(i => i.id === itemId);
    if (!target) return;
    const existingRow = target.actual?.breakdown?.[section as keyof typeof target.actual.breakdown]?.find((r: any) => r.id === rowId);
    const numericFields = ['quantity', 'unitCost'] as const;
    const isNumeric = numericFields.includes(field as any);
    const newValue = isNumeric ? parseNumericInput(value) : value.trim();

    if (existingRow) {
      const prev = isNumeric ? existingRow[field] ?? 0 : (existingRow[field] || '');
      if (!isNumeric && typeof prev === 'string' && prev.trim() === newValue) return;
      if (isNumeric && Math.abs((prev as number) - (newValue as number)) < 0.0001) return;
    } else if (!isNumeric && !newValue) {
      return;
    }

    captureUndoSnapshot();
    projectCostService.saveDraft(projectId, draftData => {
      const item = draftData.items.find(i => i.id === itemId);
      if (!item) return;
      if (!item.actual) {
        item.actual = {
          quantity: 0,
          unitPrice: 0,
          totalPrice: 0,
          breakdown: { materials: [], labor: [], equipment: [], subcontractors: [] },
          additionalPercentages: { ...defaultPercentages }
        };
      }
      const list = item.actual.breakdown[section as keyof typeof item.actual.breakdown];
      if (!Array.isArray(list)) return;
      let row = list.find(r => r.id === rowId);
      if (!row) {
        row = { id: rowId, name: 'عنصر', unit: '-', quantity: 0, unitCost: 0, totalCost: 0, origin: 'actual-only' };
        list.push(row);
      }
      if (field === 'name') {
        row.name = typeof newValue === 'string' && newValue ? newValue : row.name;
      } else if (field === 'unit') {
        row.unit = typeof newValue === 'string' && newValue ? newValue : row.unit;
      } else if (field === 'quantity') {
        row.quantity = Number(newValue) || 0;
      } else if (field === 'unitCost') {
        row.unitCost = Number(newValue) || 0;
      }
      row.totalCost = +(((row.quantity || 0) * (row.unitCost || 0)).toFixed(2));
      item.state.isModified = true;
      item.state.lastEditAt = new Date().toISOString();
    });
    refresh();
    triggerAutoSave();
  };

  const handleSectionChange = (itemId: string, sectionKey: string) => {
    setActiveSectionByItem(prev => {
      if (prev[itemId] === sectionKey) return prev;
      return { ...prev, [itemId]: sectionKey };
    });
  };

  const handleSaveActualOnlyItem = () => {
    const description = actualOnlyDescription.trim();
    const amount = parseNumericInput(actualOnlyAmount);
    if (!description) {
      window.alert('يرجى إدخال وصف للبند الفعلي.');
      return;
    }
    if (!(amount > 0)) {
      window.alert('يرجى إدخال مبلغ إجمالي صالح أكبر من صفر.');
      return;
    }
    captureUndoSnapshot();
    projectCostService.upsertItem(projectId, {
      description,
      origin: 'actual-only',
      actual: {
        quantity: 1,
        unitPrice: +amount.toFixed(2),
        totalPrice: +amount.toFixed(2),
        breakdown: { materials: [], labor: [], equipment: [], subcontractors: [] },
        additionalPercentages: { ...defaultPercentages }
      }
    });
    refresh();
    setAddingActualOnly(false);
    setActualOnlyDescription('');
    setActualOnlyAmount('');
    triggerAutoSave();
  };

  const onPercentagesChange = (next: CostPercentagesValue) => {
    const prevDefaults = defaultPercentages;
    const same =
      Math.abs(prevDefaults.administrative - next.administrative) < 0.0001 &&
      Math.abs(prevDefaults.operational - next.operational) < 0.0001 &&
      Math.abs(prevDefaults.profit - next.profit) < 0.0001;
    if (same) return;

    captureUndoSnapshot();
    projectCostService.saveDraft(projectId, draftData => {
      const currentDefaults = (draftData as any).defaultPercentages || prevDefaults;
      (draftData as any).defaultPercentages = { ...currentDefaults, ...next };
      draftData.items.forEach(item => {
        const existing = item.actual?.additionalPercentages || {};
        const matchesPrevious = (
          Math.abs((existing.administrative ?? 0) - (currentDefaults.administrative ?? 0)) < 0.0001 &&
          Math.abs((existing.operational ?? 0) - (currentDefaults.operational ?? 0)) < 0.0001 &&
          Math.abs((existing.profit ?? 0) - (currentDefaults.profit ?? 0)) < 0.0001
        );
        if (!item.actual) {
          item.actual = {
            quantity: 0,
            unitPrice: 0,
            totalPrice: 0,
            breakdown: { materials: [], labor: [], equipment: [], subcontractors: [] },
            additionalPercentages: { ...next }
          };
        }
        if (!item.actual.additionalPercentages || matchesPrevious) {
          item.actual.additionalPercentages = { ...next };
          item.state.isModified = true;
          item.state.lastEditAt = new Date().toISOString();
        }
      });
    });
    refresh();
    triggerAutoSave();
  };
  const handleUndo = () => {
    const prev = undo.pop();
    if (prev) {
      projectCostService.saveDraft(projectId, (d: any) => ({ ...d, items: prev }));
      refresh();
    }
  };

  const toggleBreakdown = (itemId: string) => {
    setOpenBreakdowns(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Auto-merge effect
  useEffect(() => {
    if (autoMerging && !autoMergedRef.current && tenderId) {
      autoMergedRef.current = true;
      void (async () => {
        try {
          const result = await projectCostService.mergeFromTender(projectId, tenderId);
          console.log('✅ Merge complete', result);
          refresh();
        } catch (err: any) {
          console.error('Merge failed', err);
        } finally {
          setAutoMerging(false);
        }
      })();
    }
  }, [autoMerging, projectId, tenderId, refresh]);

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K للبحث
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl+N لإضافة بند جديد
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        upsertItem({});
      }
      // Ctrl+Z للتراجع
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undo.size > 0) {
        e.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo.size, upsertItem]);

  useEffect(() => {
    if (!items || items.length === 0) return;
    if (openBreakdowns.size === 0) {
      setOpenBreakdowns(new Set([items[0].id]));
    }
  }, [items, openBreakdowns.size]);

  // تحسين دوال التحديث لتشمل الحفظ التلقائي
  const enhancedHandleItemActualChange = (itemId: string, field: 'quantity' | 'unitPrice', value: string) => {
    handleItemActualChange(itemId, field, value);
    triggerAutoSave();
  };
  
  const sortedItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      const aVal = (a as any)[sortKey] ?? '';
      const bVal = (b as any)[sortKey] ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortKey, sortDir]);

  const filteredItems = useMemo(() => {
    let result = sortedItems;
    
    // تطبيق فلتر الحالة
    if (selectedFilter === 'completed') {
      result = result.filter(i => (i.actual?.totalPrice || 0) > 0);
    } else if (selectedFilter === 'pending') {
      result = result.filter(i => !(i.actual?.totalPrice || 0));
    }
    
    // تطبيق البحث النصي
    if (query) {
      result = result.filter(i =>
        i.description.toLowerCase().includes(query.toLowerCase()) ||
        i.category?.toLowerCase().includes(query.toLowerCase()) ||
        i.unit?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return result;
  }, [sortedItems, query, selectedFilter]);

  const normalizedItems = useMemo(() => {
    return filteredItems.map(item => {
      const severity = severityMap[item.id];
      return severity ? { ...item, variance: { severity } } : item;
    });
  }, [filteredItems, severityMap]);

  if (loading) {
    return <div className="p-4">جاري تحميل بيانات التكلفة...</div>;
  }
  if (!items) {
    return (
      <div className="flex flex-col h-screen bg-muted/20" data-testid="project-cost-view" dir="rtl">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={ClipboardList}
            title="لا توجد بيانات تكلفة متاحة"
            description="لم نعثر على أي بنود تكلفة مرتبطة بهذا المشروع بعد. جرّب تحديث البيانات أو البدء بإضافة البنود الجديدة."
            actionLabel="تحديث البيانات"
            onAction={() => refresh()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/20" data-testid="project-cost-view" dir="rtl">
      {/* Header محسّن مع ألوان أفضل وتخطيط محدود */}
  <header className="flex-shrink-0 bg-card border-b border-border shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                بنود التكلفة 
                <span className="bg-info/10 text-info text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {items.length}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">إدارة وتحليل التكاليف التقديرية والفعلية للمشروع</p>
            </div>
            
            {/* مؤشرات الحالة السريعة */}
            <div className="flex items-center gap-3 mr-6">
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-3 h-3 bg-info rounded-full"></div>
                <span className="text-muted-foreground">تقديري: {formatCurrencyValue(draftTotals.estimatedTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-muted-foreground">فعلي: {formatCurrencyValue(draftTotals.actualTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <div
                  className={`w-3 h-3 rounded-full ${draftTotals.varianceTotal > 0 ? 'bg-error' : draftTotals.varianceTotal < 0 ? 'bg-success' : 'bg-border opacity-60'}`}
                ></div>
                <span className="text-muted-foreground">فارق: {formatCurrencyValue(draftTotals.varianceTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {tenderId && (
              <button
                onClick={() => { setAutoMerging(true); autoMergedRef.current = false; }}
                className="px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/85 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex items-center gap-2 shadow-sm"
                disabled={autoMerging}
              >
                <FileDown className="w-4 h-4" />
                {autoMerging ? 'جاري الاستيراد...' : 'استيراد من المنافسة'}
              </button>
            )}
            <button
              onClick={() => promote()}
              className="px-4 py-2.5 text-sm font-medium text-success-foreground bg-success rounded-lg hover:bg-success/80 focus:ring-2 focus:ring-success focus:ring-offset-2 transition-colors flex items-center gap-2 shadow-sm"
            >
              <FileUp className="w-4 h-4" />
              ترقية للاعتماد
            </button>
            <button
              onClick={handleUndo}
              disabled={undo.size === 0}
              className="px-4 py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 focus:ring-2 focus:ring-muted-foreground focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Undo className="w-4 h-4" />
              تراجع ({undo.size})
            </button>
          </div>
        </div>
      </header>
      
      {/* Layout محسّن للاستفادة من المساحة كاملة */}
  <div className="flex-1 flex gap-4 p-6 min-h-0">
        
        {/* Sidebar محسّن وقابل للإخفاء */}
  <div className="w-80 flex-shrink-0 space-y-4">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-info/10 to-primary/10 px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">ملخص التكاليف</h3>
            </div>
            <CostBaselineTotals
              estimated={draftTotals.estimatedTotal}
              actual={draftTotals.actualTotal}
              varianceValue={draftTotals.varianceTotal}
              variancePct={draftTotals.variancePct}
            />
          </div>
          
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-success/10 to-success/5 px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">النسب الإضافية</h3>
            </div>
            <CostPercentagesPanel
              value={defaultPercentages}
              onChange={onPercentagesChange}
            />
          </div>
          
          {/* احصائيات سريعة إضافية */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">إحصائيات سريعة</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">البنود المكتملة:</span>
                <span className="font-medium">{items.filter(i => (i.actual?.totalPrice || 0) > 0).length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">البنود المعلقة:</span>
                <span className="font-medium text-warning">{items.filter(i => !(i.actual?.totalPrice || 0)).length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">نسبة الإنجاز:</span>
                <span className="font-medium text-info">
                  {items.length ? Math.round((items.filter(i => (i.actual?.totalPrice || 0) > 0).length / items.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي محسّن */}
        <div className="flex-1 bg-card rounded-xl shadow-sm border border-border flex flex-col min-h-0">
          {/* شريط الأدوات محسّن */}
          <div className="flex-shrink-0 bg-gradient-to-r from-muted/40 to-muted px-6 py-5 border-b border-border">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {/* بحث محسّن مع اختصارات لوحة المفاتيح */}
                <div className="relative">
                  <input 
                    ref={searchInputRef}
                    value={query} 
                    onChange={e=>setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setQuery('');
                        searchInputRef.current?.blur();
                      }
                    }}
                    className="border-2 border-border rounded-xl px-4 py-2.5 text-sm w-80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 pl-10 bg-background shadow-sm" 
                    placeholder="🔍 بحث سريع... (اضغط Ctrl+K)"
                  />
                  {query && (
                    <button 
                      onClick={()=>setQuery('')} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 rounded-full transition-all duration-200"
                      title="مسح البحث (Esc)"
                    >
                      ✕
                    </button>
                  )}
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-muted-foreground/70 bg-muted/60 border border-border rounded">
                      Ctrl+K
                    </kbd>
                  </div>
                </div>
                
                {/* فلاتر سريعة تفاعلية */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedFilter('all')}
                    className={`px-3 py-2 text-sm transition-all duration-200 border rounded-lg ${
                      selectedFilter === 'all' 
                        ? 'text-info bg-info/10 border-info/40 shadow-sm' 
                        : 'text-muted-foreground bg-background border-border hover:bg-muted/40'
                    }`}
                  >
                    الكل ({items.length})
                  </button>
                  <button 
                    onClick={() => setSelectedFilter('pending')}
                    className={`px-3 py-2 text-sm transition-all duration-200 border rounded-lg ${
                      selectedFilter === 'pending' 
                        ? 'text-warning bg-warning/10 border-warning/40 shadow-sm' 
                        : 'text-warning bg-warning/5 border-warning/20 hover:bg-warning/10'
                    }`}
                  >
                    معلق ({items.filter(i => !(i.actual?.totalPrice || 0)).length})
                  </button>
                  <button 
                    onClick={() => setSelectedFilter('completed')}
                    className={`px-3 py-2 text-sm transition-all duration-200 border rounded-lg ${
                      selectedFilter === 'completed' 
                        ? 'text-success bg-success/10 border-success/40 shadow-sm' 
                        : 'text-success bg-success/5 border-success/20 hover:bg-success/10'
                    }`}
                  >
                    مكتمل ({items.filter(i => (i.actual?.totalPrice || 0) > 0).length})
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setAddingActualOnly(true)} 
                  className="px-4 py-2.5 text-sm font-medium text-primary-foreground bg-info rounded-xl hover:bg-info/80 focus:ring-2 focus:ring-info focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  بند فعلي سريع
                </button>
                <button 
                  onClick={() => upsertItem({})} 
                  className="px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-xl hover:bg-primary/85 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  بند كامل
                </button>
              </div>
            </div>
          </div>
          
          {/* نموذج إضافة سريع محسّن */}
          {addingActualOnly && (
            <div className="mx-6 my-4 p-4 bg-gradient-to-r from-info/10 to-primary/10 border-2 border-info/30 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="وصف البند الفعلي (مثال: مصاريف إضافية غير متوقعة)"
                    className="w-full border-2 border-background rounded-lg px-4 py-2.5 text-sm focus:border-info focus:outline-none shadow-sm bg-background"
                    value={actualOnlyDescription}
                    onChange={e => setActualOnlyDescription(e.target.value)}
                  />
                </div>
                <div className="w-40">
                  <input
                    type="text"
                    placeholder="المبلغ الإجمالي"
                    className="w-full border-2 border-background rounded-lg px-4 py-2.5 text-sm focus:border-info focus:outline-none shadow-sm bg-background text-left"
                    value={actualOnlyAmount}
                    onChange={e => setActualOnlyAmount(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleSaveActualOnlyItem}
                  className="px-6 py-2.5 text-sm font-medium text-primary-foreground bg-info rounded-lg hover:bg-info/80 focus:ring-2 focus:ring-info focus:ring-offset-2 transition-all shadow-sm"
                >
                  ✓ حفظ
                </button>
                <button
                  onClick={() => setAddingActualOnly(false)}
                  className="px-4 py-2.5 text-sm font-medium text-muted-foreground bg-background border border-border rounded-lg hover:bg-muted/40 focus:ring-2 focus:ring-muted-foreground/40 focus:ring-offset-2 transition-all"
                >
                  ✕ إلغاء
                </button>
              </div>
            </div>
          )}

          {/* الجدول محسّن بتخطيط أفضل */}
          <div className="flex-1 mx-6 mb-6 border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-auto h-full">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-gradient-to-r from-muted to-muted/80 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="w-12 px-2 py-4"></th>
                    <th scope="col" className="px-4 py-4 text-right font-bold text-muted-foreground min-w-[250px]">
                      <div className="flex items-center gap-2">
                        <span>الوصف والتصنيف</span>
                        <button 
                          onClick={() => { setSortKey('description'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}
                          className="p-1 hover:bg-muted/60 rounded transition-colors"
                          title="ترتيب حسب الوصف"
                        >
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground/70" />
                        </button>
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-4 text-center font-bold text-muted-foreground w-20">الوحدة</th>
                    
                    {/* مجموعة التقديري */}
                    <th scope="col" className="px-3 py-4 text-center font-bold text-info bg-info/10 w-24 border-l-2 border-info/40">
                      <div className="flex flex-col">
                        <span className="text-xs text-info">تقديري</span>
                        <span>كمية</span>
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-4 text-center font-bold text-info bg-info/10 w-24">
                      <div className="flex flex-col">
                        <span className="text-xs text-info">تقديري</span>
                        <span>سعر</span>
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-4 text-center font-bold text-info bg-info/15 w-32 border-r-2 border-info/40">
                      <div className="flex flex-col">
                        <span className="text-xs text-info">تقديري</span>
                        <span>إجمالي</span>
                      </div>
                    </th>
                    
                    {/* مجموعة الفعلي */}
                    <th scope="col" className="px-3 py-4 text-center font-bold text-success bg-success/10 w-24 border-l-2 border-success/40">
                      <div className="flex flex-col">
                        <span className="text-xs text-success">فعلي</span>
                        <span>كمية</span>
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-4 text-center font-bold text-success bg-success/10 w-24">
                      <div className="flex flex-col">
                        <span className="text-xs text-success">فعلي</span>
                        <span>سعر</span>
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-4 text-center font-bold text-success bg-success/15 w-32 border-r-2 border-success/40">
                      <div className="flex flex-col">
                        <span className="text-xs text-success">فعلي</span>
                        <span>إجمالي</span>
                      </div>
                    </th>
                    
                    {/* مجموعة المقارنة */}
                    <th scope="col" className="px-3 py-4 text-center font-bold text-warning bg-warning/10 w-24 border-l-2 border-warning/40">
                      <div className="flex flex-col">
                        <span className="text-xs text-warning">مقارنة</span>
                        <span>فارق %</span>
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-4 text-center font-bold text-warning bg-warning/10 w-32">
                      <div className="flex flex-col">
                        <span className="text-xs text-warning">مقارنة</span>
                        <span>فارق قيمة</span>
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-4 text-center font-bold text-muted-foreground w-20 border-l-2 border-border">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-muted/30">
                  {filteredItems.map((orig, index) => {
                    const i = normalizedItems.find(x=>x.id===orig.id) || orig;
                    const estimated = (i.estimated as any)?.total || 0;
                    const actual = (i.actual as any)?.total || 0;
                    const variancePct = estimated ? ((actual - estimated) / estimated) * 100 : 0;
                    const varianceColor = variancePct > 10 ? 'text-error' : variancePct > 0 ? 'text-warning' : variancePct < -5 ? 'text-success' : 'text-muted-foreground';
                    const sev = severityMap[i.id];
                    const sevDot = sev === 'critical' ? 'bg-error' : sev === 'warning' ? 'bg-warning' : sev === 'info' ? 'bg-info' : 'bg-transparent';
                    const isExpanded = openBreakdowns.has(i.id);
                    const isCompleted = (i.actual?.totalPrice || 0) > 0;

                    return (
                      <React.Fragment key={i.id}>
                        <tr className={`
                          transition-colors duration-150
                          ${isExpanded ? 'bg-info/10 border-l-4 border-info/50' : 'hover:bg-muted/40'} 
                          ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
                          ${isCompleted ? 'border-r-4 border-r-success/50' : ''}
                        `}>
                          <td className="px-2 py-4 text-center">
                            <button
                              onClick={() => toggleBreakdown(i.id)}
                              className={`
                                w-8 h-8 inline-flex items-center justify-center rounded-lg transition-all duration-200
                                ${isExpanded ? 'bg-info/10 text-info border-2 border-info/40' : 'border-2 border-border bg-background hover:bg-muted/40 text-muted-foreground'}
                                focus:outline-none focus:ring-2 focus:ring-info focus:ring-offset-2
                              `}
                              title={isExpanded ? 'إخفاء التحليل' : 'عرض التحليل التفصيلي'}
                            >
                              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                          </td>
                          
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-block w-3 h-3 rounded-full ${sevDot} mt-1`} title={sev ? `شدة الانحراف: ${sev}` : 'لا يوجد إنذار'}></span>
                                {isCompleted && <span className="inline-block w-3 h-3 rounded-full bg-success" title="مكتمل"></span>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-foreground truncate" title={i.description}>
                                  {i.description}
                                </div>
                                {i.category && (
                                  <div className="text-xs text-muted-foreground mt-1 bg-muted/30 px-2 py-0.5 rounded-full inline-block">
                                    {i.category}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-3 py-4 text-center text-muted-foreground font-mono text-xs bg-muted/20">
                            {i.unit || '—'}
                          </td>
                          
                          {/* التقديري */}
                          <td className="px-3 py-4 text-center text-info font-mono bg-info/10 border-l-2 border-info/40">
                            {formatDecimal(i.estimated?.quantity ?? 0)}
                          </td>
                          <td className="px-3 py-4 text-center text-info font-mono bg-info/10">
                            {formatCurrencyValue(i.estimated?.unitPrice ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-4 text-center text-info/90 font-bold font-mono bg-info/15 border-r-2 border-info/40">
                            {formatCurrencyValue(i.estimated?.totalPrice ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          
                          {/* الفعلي */}
                          <td className="px-3 py-4 bg-success/10 border-l-2 border-success/40">
                            <input
                              className="w-full border-2 border-success/40 rounded-lg px-3 py-2 text-center focus:border-success focus:outline-none font-mono text-sm bg-background transition-colors"
                              defaultValue={(i.actual?.quantity ?? 0).toFixed(2)}
                              onBlur={e => enhancedHandleItemActualChange(i.id, 'quantity', e.target.value)}
                              onFocus={e => e.target.select()}
                              aria-label="الكمية الفعلية"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-4 bg-success/10">
                            <input
                              className="w-full border-2 border-success/40 rounded-lg px-3 py-2 text-center focus:border-success focus:outline-none font-mono text-sm bg-background transition-colors"
                              defaultValue={(i.actual?.unitPrice ?? 0).toFixed(2)}
                              onBlur={e => enhancedHandleItemActualChange(i.id, 'unitPrice', e.target.value)}
                              onFocus={e => e.target.select()}
                              aria-label="السعر الفعلي"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-4 text-center text-success/90 font-bold font-mono bg-success/15 border-r-2 border-success/40">
                            {formatCurrencyValue(i.actual?.totalPrice ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          
                          {/* المقارنة */}
                          <td className={`px-3 py-4 text-center font-bold font-mono bg-warning/10 border-l-2 border-warning/40 ${varianceColor}`}>
                            {variancePct.toFixed(1)}%
                          </td>
                          <td className={`px-3 py-4 text-center font-mono bg-warning/10 ${varianceColor}`}>
                            {formatCurrencyValue((i.actual?.totalPrice || 0) - (i.estimated?.totalPrice || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {/* إجراءات محسّنة */}
                          <td className="px-3 py-4 text-center border-l-2 border-border">
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <button
                                  className="w-10 h-10 inline-flex items-center justify-center rounded-xl border-2 border-border bg-background hover:bg-muted/40 hover:border-border focus:outline-none focus:ring-2 focus:ring-info focus:ring-offset-2 transition-all duration-200 shadow-sm"
                                  aria-label="قائمة الإجراءات"
                                  title="المزيد من الإجراءات"
                                >
                                  <EllipsisVertical className="w-5 h-5 text-muted-foreground" />
                                </button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content className="bg-card border border-border rounded-lg shadow-lg text-sm min-w-[220px] p-1.5" sideOffset={4}>
                                  <DropdownMenu.Item
                                    className="px-3 py-1.5 rounded-md hover:bg-muted/40 cursor-pointer flex items-center gap-2"
                                    onSelect={() => {
                                      undo.push(JSON.parse(JSON.stringify(items)));
                                      upsertItem({ id: i.id, description: i.description + ' *' });
                                    }}
                                  >
                                    <Edit className="w-4 h-4 text-muted-foreground/70" /> تعديل البند
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item
                                    className="px-3 py-1.5 rounded-md hover:bg-muted/40 cursor-pointer flex items-center gap-2"
                                    onSelect={() => {
                                      try {
                                        projectCostService.openExpenseModal(projectId, i.id);
                                      } catch (err) {
                                        console.warn('Failed to open expense modal', err);
                                      }
                                    }}
                                  >
                                    تسجيل مصروف للبند
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item
                                    className="px-3 py-1.5 rounded-md hover:bg-muted/40 cursor-pointer flex items-center gap-2"
                                    onSelect={async () => {
                                      try {
                                        const { purchaseOrderService } = await import('@/application/services/purchaseOrderService');
                                        const q = (i.actual?.quantity ?? i.estimated?.quantity ?? 1) || 1;
                                        const up = (i.actual?.unitPrice ?? i.estimated?.unitPrice ?? 0) || 0;
                                        const pseudoBoqItem: any = {
                                          id: i.id,
                                          unitPrice: up,
                                          quantity: q,
                                          totalPrice: q * up,
                                          description: i.description,
                                          category: i.category
                                        };
                                        const { purchaseOrder } = await purchaseOrderService.createDraftPOForBOQ(
                                          projectId,
                                          pseudoBoqItem,
                                          { quantity: q, unitPrice: up, category: i.category, tenderId }
                                        );

                                        toast.success('تم إنشاء مسودة أمر شراء للبند', {
                                          description: `تم تحديث أمر الشراء ${purchaseOrder.id}`
                                        });
                                      } catch (err) {
                                        console.warn('Failed to create PO from cost item', err);
                                        toast.error('تعذر إنشاء أمر الشراء للبند المحدد');
                                      }
                                    }}
                                  >
                                    <ShoppingCart className="w-4 h-4 text-muted-foreground/70" /> إنشاء أمر شراء للبند
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Separator className="h-[1px] bg-muted/40 my-1" />
                                  <DropdownMenu.Item
                                    className="px-3 py-1.5 rounded-md hover:bg-error/10 text-error cursor-pointer flex items-center gap-2"
                                    onSelect={() => {
                                      const normalizedVariance =
                                        i.variance && 'value' in i.variance && 'pct' in i.variance
                                          ? i.variance
                                          : { value: 0, pct: 0 };
                                      setItemToDelete({
                                        ...i,
                                        variance: normalizedVariance,
                                      } as ProjectCostItem);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" /> حذف البند
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </td>
                        </tr>
                        {openBreakdowns.has(i.id) && (
                          <tr>
                            <td colSpan={12} className="p-0 bg-muted/20">
                              <div className="bg-card p-4 m-2 rounded-lg border border-border">
                                <div className="mb-3 font-semibold flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-info">تحليل تكلفة البند</span>
                                    <span className="text-muted-foreground text-xs font-normal">(الأسعار التقديرية للعرض فقط – أدخل القيم الفعلية)</span>
                                  </div>
                                </div>
                                {(() => {
                                  const section = (activeSectionByItem[i.id] || 'materials') as BreakdownSectionKey;
                                  const sections: Array<{key: 'materials'|'labor'|'equipment'|'subcontractors'; label:string; color:string}> = [
                                    { key: 'materials', label: 'المواد', color: 'bg-warning' },
                                    { key: 'labor', label: 'العمالة', color: 'bg-info' },
                                    { key: 'equipment', label: 'المعدات', color: 'bg-success' },
                                    { key: 'subcontractors', label: 'مقاولو الباطن', color: 'bg-accent' },
                                  ];
                                  
                                  const sumRows = (rows: any[]): number => rows.reduce((s: number, r: any) => s + (r.totalCost || ((r.quantity || 0) * (r.unitCost || 0)) || 0), 0);
                                  const baseAll = sumRows(i.actual?.breakdown?.materials||[]) + sumRows(i.actual?.breakdown?.labor||[]) + sumRows(i.actual?.breakdown?.equipment||[]) + sumRows(i.actual?.breakdown?.subcontractors||[]);
                                  const pAdmin = i.actual?.additionalPercentages?.administrative||0;
                                  const pOp = i.actual?.additionalPercentages?.operational||0;
                                  const pProfit = i.actual?.additionalPercentages?.profit||0;
                                  const vAdmin = baseAll * (pAdmin/100);
                                  const vOp = baseAll * (pOp/100);
                                  const vProfit = (baseAll + vAdmin + vOp) * (pProfit/100);
                                  const beforeTax = baseAll + vAdmin + vOp + vProfit;
                                  const tax = beforeTax * getPricingConfig().vatRate;
                                  const withTax = beforeTax + tax;

                                  const estRows = (i.estimated?.breakdown as any)?.[section] || [];
                                  const actRows = (i.actual?.breakdown as any)?.[section] || [];
                                  const allRowIds = Array.from(new Set([...estRows.map((r:any)=>r.id), ...actRows.map((r:any)=>r.id)]));
                                  
                                  return (
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex border border-border rounded-md p-0.5">
                                          {sections.map(s => (
                                            <button
                                              key={s.key}
                                              onClick={() => handleSectionChange(i.id, s.key)}
                                              className={`px-4 py-1.5 text-sm font-medium rounded-md ${section === s.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/40'}`}
                                            >
                                              {s.label}
                                            </button>
                                          ))}
                                        </div>
                                        <button
                                          className="px-3 py-1.5 text-sm rounded-md bg-success text-success-foreground hover:bg-success/80 flex items-center gap-2"
                                          onClick={() => {
                                            const newRowId = `r-${Date.now()}`;
                                            projectCostService.saveDraft(projectId, (d:any) => {
                                              const item = d.items.find((it:any) => it.id === i.id);
                                              if (!item) return;
                                              if (!item.actual.breakdown[section]) item.actual.breakdown[section] = [];
                                              item.actual.breakdown[section].push({ id: newRowId, name: 'عنصر جديد', quantity: 1, unitCost: 0 });
                                            });
                                            refresh();
                                          }}
                                        >
                                          <Plus className="w-4 h-4" /> إضافة صف جديد
                                        </button>
                                      </div>

                                      <div className="mb-3 border border-border rounded-lg bg-muted/20 p-2 text-xs flex flex-row gap-2 overflow-x-auto whitespace-nowrap items-stretch" aria-label="تفكيك تكلفة البند">
                                        <div className="px-3 py-1.5 bg-card rounded-md border border-border inline-flex flex-col shrink-0">
                                          <div className="font-semibold text-muted-foreground text-[10px]" data-testid="decomposition-label">الأساس</div>
                                          <div className="font-bold text-lg tabular-nums text-foreground">{formatCurrencyValue(baseAll, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-card rounded-md border border-border inline-flex flex-col shrink-0">
                                          <div className="text-muted-foreground text-[10px]" data-testid="decomposition-label">الإدارية ({pAdmin.toFixed(1)}%)</div>
                                          <div className="font-semibold tabular-nums">{formatCurrencyValue(vAdmin, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-card rounded-md border border-border inline-flex flex-col shrink-0">
                                          <div className="text-muted-foreground text-[10px]" data-testid="decomposition-label">التشغيلية ({pOp.toFixed(1)}%)</div>
                                          <div className="font-semibold tabular-nums">{formatCurrencyValue(vOp, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-card rounded-md border border-border inline-flex flex-col shrink-0">
                                          <div className="text-muted-foreground text-[10px]" data-testid="decomposition-label">الربح ({pProfit.toFixed(1)}%)</div>
                                          <div className="font-semibold tabular-nums text-success">{formatCurrencyValue(vProfit, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-card rounded-md border border-border inline-flex flex-col shrink-0">
                                          <div className="text-muted-foreground text-[10px]" data-testid="decomposition-label">قبل الضريبة</div>
                                          <div className="font-semibold tabular-nums">{formatCurrencyValue(beforeTax, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-card rounded-md border border-border inline-flex flex-col shrink-0">
                                          <div className="text-muted-foreground text-[10px]" data-testid="decomposition-label">الضريبة ({(getPricingConfig().vatRate*100).toFixed(1)}%)</div>
                                          <div className="font-semibold tabular-nums text-primary">{formatCurrencyValue(tax, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-info/10 text-info rounded-md border border-info/40 inline-flex flex-col shrink-0">
                                          <div className="font-semibold text-[10px]" data-testid="decomposition-label">الإجمالي مع الضريبة</div>
                                          <div className="font-bold text-lg tabular-nums">{formatCurrencyValue(withTax, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </div>
                                      </div>

                                      <div className="overflow-auto border border-border rounded-lg">
                                        <table className="w-full border-collapse text-xs">
                                          <thead className="bg-muted/30 text-muted-foreground font-semibold">
                                            <tr>
                                              <th className="p-2 text-right w-[30%]">الوصف</th>
                                              <th className="p-2 text-center w-[10%]">الوحدة</th>
                                              <th className="p-2 text-center w-[10%]">كمية تقديرية</th>
                                              <th className="p-2 text-center w-[10%]">سعر تقديري</th>
                                              <th className="p-2 text-center w-[12%] bg-info/10">إجمالي تقديري</th>
                                              <th className="p-2 text-center w-[10%]">كمية فعلية</th>
                                              <th className="p-2 text-center w-[10%]">سعر فعلي</th>
                                              <th className="p-2 text-center w-[12%] bg-success/10">إجمالي فعلي</th>
                                              <th className="p-2 text-center w-[8%]">إجراء</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {allRowIds.length === 0 && (
                                              <tr>
                                                <td colSpan={9} className="p-4 text-center text-muted-foreground">
                                                  لا يوجد صفوف في هذا القسم.
                                                </td>
                                              </tr>
                                            )}
                                            {allRowIds.map(rid => {
                                              const er:any = estRows.find((r: any) => r.id === rid);
                                              const ar:any = actRows.find((r: any) => r.id === rid) || {};
                                              const estimatedQtyValue = er ? Number(er.quantity ?? 0) || 0 : 0;
                                              const estimatedUnitValue = er ? Number(er.unitCost ?? 0) || 0 : 0;
                                              const estimatedTotalValue = er ? (Number(er.totalCost ?? (estimatedQtyValue * estimatedUnitValue)) || 0) : 0;
                                              const displayQtyEst = er ? formatDecimal(estimatedQtyValue) : '—';
                                              const displayUnitEst = er ? formatCurrencyValue(estimatedUnitValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
                                              const displayTotalEst = er ? formatCurrencyValue(estimatedTotalValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
                                              const actualQty = Number(ar.quantity ?? er?.quantity ?? 0) || 0;
                                              const actualUnit = Number(ar.unitCost ?? er?.unitCost ?? 0) || 0;
                                              const rowName = (ar?.name || er?.name || 'هذا الصف') as string;

                                              return (
                                                <tr key={rid} className="odd:bg-card even:bg-muted/20 group hover:bg-info/10">
                                                  <td className="p-2 text-right whitespace-nowrap max-w-[280px]" title={er?.name || ar?.name || 'عنصر'}>
                                                    {er ? (
                                                      <span className="text-foreground">{er.name}</span>
                                                    ) : (
                                                      <input
                                                        className="border border-border rounded-md px-2 h-7 text-xs w-full focus:border-info focus:outline-none"
                                                        defaultValue={ar?.name || ''}
                                                        placeholder="وصف العنصر"
                                                        onBlur={e => handleBreakdownRowChange(i.id, section, rid, 'name', e.target.value)}
                                                      />
                                                    )}
                                                  </td>
                                                  <td className="p-2 text-center tabular-nums">
                                                    {er ? (er?.unit||'-') : (
                                                      <input
                                                        className="border border-border rounded-md px-1 h-7 text-xs w-16 text-center focus:border-info focus:outline-none"
                                                        defaultValue={ar?.unit || '-'
                                                        }
                                                        title="وحدة القياس"
                                                        aria-label="وحدة القياس"
                                                        placeholder="وحدة"
                                                        onBlur={e => handleBreakdownRowChange(i.id, section, rid, 'unit', e.target.value)}
                                                      />
                                                    )}
                                                  </td>
                                                  <td className="p-2 text-center text-muted-foreground tabular-nums">{displayQtyEst}</td>
                                                  <td className="p-2 text-center text-muted-foreground tabular-nums">{displayUnitEst}</td>
                                                  <td className="p-2 text-center text-info font-medium tabular-nums bg-info/10">{displayTotalEst}</td>
                                                  <td className="p-2 text-center">
                                                    <input
                                                      className="border border-border rounded-md px-1 h-7 text-xs w-20 text-center focus:border-success focus:outline-none tabular-nums"
                                                      defaultValue={(actualQty||0).toFixed(2)}
                                                      onBlur={e=>handleBreakdownRowChange(i.id, section, rid, 'quantity', e.target.value)}
                                                      title="الكمية الفعلية"
                                                      aria-label="الكمية الفعلية"
                                                    />
                                                  </td>
                                                  <td className="p-2 text-center">
                                                    <input
                                                      className="border border-border rounded-md px-1 h-7 text-xs w-20 text-center focus:border-success focus:outline-none tabular-nums"
                                                      defaultValue={(actualUnit||0).toFixed(2)}
                                                      onBlur={e=>handleBreakdownRowChange(i.id, section, rid, 'unitCost', e.target.value)}
                                                      title="السعر الفعلي"
                                                      aria-label="السعر الفعلي"
                                                    />
                                                  </td>
                                                  <td className="p-2 text-center text-success font-medium tabular-nums bg-success/10">{formatCurrencyValue(actualQty * actualUnit, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                  <td className="p-2 text-center">
                                                    <button
                                                      className="w-7 h-7 inline-flex items-center justify-center rounded-md text-error hover:bg-error/10"
                                                      title="حذف الصف"
                                                      onClick={() => {
                                                        setRowDeleteTarget({
                                                          itemId: i.id,
                                                          section,
                                                          rowId: rid,
                                                          name: rowName
                                                        });
                                                      }}
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {/* حالات فارغة محسّنة */}
                  {filteredItems.length === 0 && query && (
                    <tr>
                      <td colSpan={12}>
                        <EmptyState
                          icon={Search}
                          title="لا توجد نتائج للبحث"
                          description={`لم نجد أي بنود تطابق "${query}". جرّب تعديل عبارة البحث أو إعادة التعيين.`}
                          actionLabel="مسح البحث وعرض الكل"
                          onAction={() => setQuery('')}
                        />
                      </td>
                    </tr>
                  )}
                  {items.length === 0 && !autoMerging && (
                    <tr>
                      <td colSpan={12}>
                        <EmptyState
                          icon={ClipboardList}
                          title="ابدأ إدارة تكاليف مشروعك"
                          description="لا توجد بنود تكلفة في هذا المشروع بعد. يمكنك البدء بإضافة بند جديد أو الاستيراد من منافسة موجودة."
                          actionLabel="إضافة بند جديد"
                          onAction={() => upsertItem({})}
                        />
                        {tenderId && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={() => { setAutoMerging(true); autoMergedRef.current = false; }}
                              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/85 transition-colors flex items-center gap-2 shadow-sm"
                            >
                              <FileDown className="w-5 h-5" />
                              استيراد من المنافسة
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  {items.length === 0 && autoMerging && (
                    <tr>
                      <td colSpan={12} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center animate-pulse">
                            <FileDown className="w-8 h-8 text-info" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-foreground mb-1">جاري الاستيراد</h3>
                            <p className="text-muted-foreground">يتم الآن استيراد البنود من المنافسة...</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* شريط الحالة السفلي */}
        <div className="flex-shrink-0 bg-card border-t border-border px-6 py-3">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <span>المجموع: {items.length} بند</span>
              <span>مكتمل: {items.filter(i => (i.actual?.totalPrice || 0) > 0).length}</span>
              <span>معلق: {items.filter(i => !(i.actual?.totalPrice || 0)).length}</span>
              {query && <span className="text-info">البحث: {filteredItems.length} نتيجة</span>}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {isAutoSaving && (
                  <div className="flex items-center gap-1 text-info">
                    <div className="w-2 h-2 bg-info rounded-full animate-pulse"></div>
                    <span className="text-xs">جاري الحفظ...</span>
                  </div>
                )}
                <span className="text-xs">آخر حفظ: {formatTime(new Date())}</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs text-success">متصل</span>
                </div>
                <div className="text-xs text-muted-foreground hidden lg:block">
                  اختصارات: Ctrl+K للبحث • Ctrl+N بند جديد • Ctrl+Z تراجع
                </div>
              </div>
            </div>
          </div>
        </div>

        <DeleteConfirmation
          itemName={itemToDelete?.description ?? 'هذا البند'}
          onConfirm={handleConfirmDeleteItem}
          open={Boolean(itemToDelete)}
          onOpenChange={(open) => {
            if (!open) {
              setItemToDelete(null);
            }
          }}
        />
        <DeleteConfirmation
          itemName={rowDeleteTarget?.name ?? 'هذا الصف'}
          onConfirm={handleConfirmDeleteRow}
          open={Boolean(rowDeleteTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setRowDeleteTarget(null);
            }
          }}
        />
      </div>
    </div>
  );
};

export default ProjectCostView;
