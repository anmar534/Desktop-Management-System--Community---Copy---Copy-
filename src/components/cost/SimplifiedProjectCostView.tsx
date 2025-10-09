import React, { useState, useMemo, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronUp, Grid3X3, Calculator, FileText, Settings, Plus, ExternalLink, AlertTriangle, Trash2, ShoppingCart, Save, MoreHorizontal, Loader2 } from 'lucide-react';
import { useProjectBOQ } from '@/application/hooks/useProjectBOQ';
import { projectCostService } from '@/application/services/projectCostService';
import type { ProjectCostItem, CostBreakdownSet, BreakdownRow } from '@/application/services/projectCostService';
import { DeleteConfirmation, SaveConfirmation } from '../ui/confirmation-dialog';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { EmptyState } from '../PageLayout';

interface SimplifiedProjectCostViewProps {
  projectId: string;
  tenderId?: string;
}

export const SimplifiedProjectCostView: React.FC<SimplifiedProjectCostViewProps> = ({ projectId, tenderId }) => {
  const { draft, loading, refresh, mergeFromTender, ensure } = useProjectBOQ(projectId);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Set<string>>(new Set());
  const [actionMessage, setActionMessage] = useState<string>('');
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('🧭 [SimplifiedProjectCostView] tenderId prop:', tenderId ?? '<none>');
  }, [tenderId]);

  const items = useMemo<ProjectCostItem[]>(() => draft?.items ?? [], [draft?.items]);
  const defaultPercentages: Readonly<Record<'administrative' | 'operational' | 'profit', number>> = {
    administrative: 5,
    operational: 3,
    profit: 10
  };
  useEffect(() => {
    if (!items.length) return;
    setExpandedItems(prev => {
      if (prev.size > 0) return prev;
      const next = new Set(prev);
      next.add(items[0].id);
      return next;
    });
  }, [items]);

  useEffect(() => {
    if (!items.length) return;
    setExpandedBreakdownSections(prev => {
      if (prev.size > 0) return prev;
      const next = new Set(prev);
      items.forEach(item => {
        const actualBreakdown = item.actual?.breakdown;
        const estimatedBreakdown = item.estimated?.breakdown;
  (['materials', 'labor', 'equipment', 'subcontractors'] as (keyof CostBreakdownSet)[]).forEach(sectionKey => {
          const actualRows = actualBreakdown?.[sectionKey]?.length ?? 0;
          const estimatedRows = estimatedBreakdown?.[sectionKey]?.length ?? 0;
          if (actualRows > 0 || estimatedRows > 0) {
            next.add(`${item.id}:${sectionKey}`);
          }
        });
      });
      return next.size > prev.size ? next : prev;
    });
  }, [items]);
  const severityMap = useMemo(() => {
    // Simplified severity mapping without costVarianceService dependency
    const map: Record<string, string> = {};
    // You can implement your own variance analysis logic here if needed
    return map;
  }, []);

  const { formatCurrencyValue, baseCurrency } = useCurrencyFormatter();

  const formatCurrency = (value: number | undefined | null, options?: Parameters<typeof formatCurrencyValue>[1]) => {
    return formatCurrencyValue(value ?? 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    });
  };

  const formatDecimal = (value: number | undefined | null, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(value ?? 0);
  };

  const formatInteger = (value: number | undefined | null) => {
    return new Intl.NumberFormat('ar-SA').format(value ?? 0);
  };

  type ActionButtonTone = 'primary' | 'warning' | 'success' | 'danger' | 'neutral';

  interface LegacyProjectCostItem extends ProjectCostItem {
    actualQuantity?: number;
    actualUnitPrice?: number;
    unitPrice?: number;
    totalPrice?: number;
  }

  const actionToneStyles: Record<ActionButtonTone, string> = {
    primary: 'border-blue-200 text-blue-600 hover:bg-blue-50',
    warning: 'border-amber-200 text-amber-600 hover:bg-amber-50',
    success: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
    danger: 'border-red-200 text-red-600 hover:bg-red-50',
    neutral: 'border-gray-200 text-gray-600 hover:bg-gray-50'
  };

  interface ActionRoundButtonProps {
    icon: LucideIcon;
    label: string;
    tone: ActionButtonTone;
    onClick?: () => void;
    tooltip: string;
    disabled?: boolean;
  }

  const ActionRoundButton = React.forwardRef<HTMLButtonElement, ActionRoundButtonProps>(
    ({ icon: Icon, label, tone, onClick, tooltip, disabled }, ref) => (
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-200 ${actionToneStyles[tone]} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        title={tooltip}
        aria-label={label}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        <Icon className="w-4 h-4" />
      </button>
    )
  );
  ActionRoundButton.displayName = 'ActionRoundButton';

  const sumRows = (rows: readonly BreakdownRow[] | undefined): number => {
    if (!rows?.length) {
      return 0;
    }
    return rows.reduce((sum, row) => {
      const total = row.totalCost ?? row.quantity * row.unitCost;
      return sum + (Number.isFinite(total) ? total : 0);
    }, 0);
  };

  const parseNumericInput = (input: string): number => {
    const parsed = Number.parseFloat(input);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const resolveRowId = (row: BreakdownRow, fallbackPrefix: string, index: number): string => {
    const rawId = typeof row.id === 'string' ? row.id.trim() : '';
    if (rawId.length > 0) {
      return rawId;
    }
    const fallbackName = typeof row.name === 'string' ? row.name.trim() : 'row';
    const safeName = fallbackName.length > 0 ? fallbackName : 'row';
    return `${fallbackPrefix}-${index}-${safeName}`;
  };

  // التحقق من تطابق الحسابات بين جدول التكاليف وجدول البنود
  const validateCalculationConsistency = (item: ProjectCostItem): boolean => {
    const breakdown = item.actual?.breakdown;
    if (!breakdown) return true;

    const calculatedBase =
      sumRows(breakdown.materials) +
      sumRows(breakdown.labor) +
      sumRows(breakdown.equipment) +
      sumRows(breakdown.subcontractors);

    const admin = calculatedBase * ((item.actual?.additionalPercentages?.administrative ?? 0) / 100);
    const operational = calculatedBase * ((item.actual?.additionalPercentages?.operational ?? 0) / 100);
    const profit = calculatedBase * ((item.actual?.additionalPercentages?.profit ?? 0) / 100);
    const calculatedTotal = calculatedBase + admin + operational + profit;

    const currentTotal = item.actual?.totalPrice ?? 0;
    const tolerance = 0.01; // هامش خطأ مقبول

    return Math.abs(calculatedTotal - currentTotal) <= tolerance;
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleBreakdownSection = (itemId: string, section: string) => {
    const key = `${itemId}:${section}`;
    setExpandedBreakdownSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleRecalculateItemFromBreakdown = (itemId: string) => {
    console.log(`🚀 [بدء إعادة الحساب] تم استدعاء handleRecalculateItemFromBreakdown للبند: ${itemId}`);
    try {
      projectCostService.saveDraft(projectId, draft => {
        const item = draft.items.find(i => i.id === itemId);
        if (!item) return;

        const breakdown = item.actual?.breakdown;
        if (!breakdown) {
          console.log(`⚠️ [${itemId}] لا يوجد تحليل تكلفة فعلي لإعادة الحساب.`);
          return;
        }

        const materialsTotal = sumRows(breakdown.materials);
        const laborTotal = sumRows(breakdown.labor);
        const equipmentTotal = sumRows(breakdown.equipment);
        const subcontractorsTotal = sumRows(breakdown.subcontractors);
        const base = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal;

        console.log(`🔍 [تحليل البند] ${itemId}:`, {
          materials: materialsTotal,
          labor: laborTotal,
          equipment: equipmentTotal,
          subcontractors: subcontractorsTotal,
          base,
          hasBreakdownData: base > 0,
          breakdownStructure: {
            materials: breakdown.materials.length,
            labor: breakdown.labor.length,
            equipment: breakdown.equipment.length,
            subcontractors: breakdown.subcontractors.length
          }
        });

        if (base > 0) {
          const administrativePct = item.actual.additionalPercentages?.administrative ?? defaultPercentages.administrative;
          const operationalPct = item.actual.additionalPercentages?.operational ?? defaultPercentages.operational;
          const profitPct = item.actual.additionalPercentages?.profit ?? defaultPercentages.profit;

          const admin = base * (administrativePct / 100);
          const operational = base * (operationalPct / 100);
          const profit = base * (profitPct / 100);
          const total = base + admin + operational + profit;

          // تطبيق نفس معادلة التسعير المستخدمة في المناقصات - التأكد من أن الكمية أكبر من صفر
          const normalizedQuantity = item.actual.quantity && item.actual.quantity > 0 ? item.actual.quantity : 1;
          item.actual.quantity = normalizedQuantity;

          // حساب سعر الوحدة = المجموع الكلي ÷ الكمية
          const calculatedUnitPrice = +(total / normalizedQuantity).toFixed(4);
          const calculatedTotalPrice = +total.toFixed(2);

          console.log(`🧮 [المعادلة] حساب البند ${itemId}:`, {
            total: total.toFixed(2),
            quantity: normalizedQuantity,
            unitPriceCalculation: `${total.toFixed(2)} ÷ ${normalizedQuantity} = ${calculatedUnitPrice}`,
            oldUnitPrice: item.actual.unitPrice,
            newUnitPrice: calculatedUnitPrice
          });

          item.actual.unitPrice = calculatedUnitPrice;
          item.actual.totalPrice = calculatedTotalPrice;

          const legacyItem = item as LegacyProjectCostItem;
          legacyItem.actualQuantity = normalizedQuantity;
          legacyItem.actualUnitPrice = calculatedUnitPrice;
          legacyItem.unitPrice = calculatedUnitPrice;
          legacyItem.totalPrice = calculatedTotalPrice;

          console.log(`✅ تم تحديث البند ${itemId}:`, {
            base: base.toFixed(2),
            admin: admin.toFixed(2), 
            operational: operational.toFixed(2),
            profit: profit.toFixed(2),
            total: total.toFixed(2),
            quantity: normalizedQuantity,
            calculatedUnitPrice: calculatedUnitPrice,
            calculatedTotalPrice: calculatedTotalPrice,
            savedUnitPrice: item.actual.unitPrice,
            savedTotalPrice: item.actual.totalPrice,
            mainTableUnitPrice: legacyItem.unitPrice,
            mainTableTotalPrice: legacyItem.totalPrice
          });
        } else {
          console.log(`⚠️ [البند ${itemId}] لا يحتوي على بيانات تكلفة في التحليل (base = 0) - تخطي إعادة الحساب`);
          console.log(`   للبند "${item.description?.substring(0, 50)}..."`);
          console.log(`   تحقق من وجود بيانات في: المواد، العمالة، المعدات، أو المقاولين من الباطن`);
        }
        
        // Clear the pending sync flag
        item.state = { ...item.state, isModified: true, breakdownDirty: false };
      });
      
      // Force a refresh to update the UI
      console.log('🔄 [SimplifiedProjectCostView] استدعاء refresh() بعد الحفظ...');
      
      // فحص البيانات مباشرة من المخزن
      const updatedEnvelope = projectCostService.getEnvelope(projectId);
      const updatedItem = updatedEnvelope?.draft?.items?.find(draftItem => draftItem.id === itemId);
      console.log('📊 [SimplifiedProjectCostView] البيانات المحدثة في المخزن:', {
        itemId,
        updatedUnitPrice: updatedItem?.actual.unitPrice,
        updatedTotalPrice: updatedItem?.actual.totalPrice,
        draftItemsCount: updatedEnvelope?.draft?.items.length
      });

      refresh();
      
      // فرض إعادة rendering للمكون
      setForceUpdateKey(prev => prev + 1);
      
      // إضافة تأخير قصير للتأكد من تحديث الواجهة
      setTimeout(() => {
        console.log('🔄 [SimplifiedProjectCostView] استدعاء refresh() إضافي للتأكد...');
        refresh();
        setForceUpdateKey(prev => prev + 1);
      }, 100);
      
      setActionMessage('تم تحديث سعر البند بناءً على التحليل.');
      setTimeout(() => setActionMessage(''), 4000);
    } catch (error) {
      console.error('Error saving item:', error);
      setActionMessage('❌ حدث خطأ أثناء حفظ البيانات');
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  type BreakdownEditableField = 'name' | 'unit' | 'quantity' | 'unitCost';

  const handleBreakdownRowChange = (
    itemId: string,
    section: keyof CostBreakdownSet,
    rowId: string,
    field: BreakdownEditableField,
    value: string
  ) => {
    projectCostService.saveDraft(projectId, draft => {
      const item = draft.items.find(i => i.id === itemId);
      if (!item) return;
      
      const rows = item.actual.breakdown[section];
      let row = rows.find(r => r.id === rowId);

      if (!row) {
        row = { id: rowId, name: 'عنصر جديد', quantity: 0, unitCost: 0, totalCost: 0, origin: 'actual-only' };
        rows.push(row);
      }

      if (field === 'quantity' || field === 'unitCost') {
        const numericValue = parseNumericInput(value);
        if (field === 'quantity') {
          row.quantity = numericValue;
        } else {
          row.unitCost = numericValue;
        }
        row.totalCost = +(row.quantity * row.unitCost).toFixed(2);

        // تحديث فوري لحالة البند وتفعيل تسجيل التغيير
        item.state = { ...item.state, isModified: true, breakdownDirty: true };

        // إعطاء تغذية راجعة فورية للمستخدم
        console.log(`📝 تم تحديث ${section} - ${field}: ${value} للبند ${itemId}`);
      } else if (field === 'name') {
        row.name = value;
        item.state = { ...item.state, isModified: true, breakdownDirty: true };
      } else if (field === 'unit') {
        row.unit = value;
        item.state = { ...item.state, isModified: true, breakdownDirty: true };
      }
    });
    
    // تحديث الواجهة فوراً لإظهار التغييرات
    refresh();
  };

  const handleImportFromTender = async () => {
    console.log('▶️ [SimplifiedProjectCostView] Import button clicked:', {
      tenderId: tenderId ?? null,
      isImporting
    });

    if (!tenderId || isImporting) {
      if (!tenderId) {
        console.warn('⛔ [SimplifiedProjectCostView] Import blocked: no tenderId provided');
      }
      if (isImporting) {
        console.warn('⏳ [SimplifiedProjectCostView] Import already in progress');
      }
      return;
    }

    console.info('▶️ [SimplifiedProjectCostView] Import requested for tender:', tenderId);
    setIsImporting(true);
    setActionMessage('');
    setErrorMessage(null);

    try {
      ensure();
      const result = await mergeFromTender(tenderId);
      refresh();
      setForceUpdateKey(prev => prev + 1);

      const summaryParts: string[] = [];
      if (result?.added) {
        summaryParts.push(`${result.added} بند جديد`);
      }
      if (result?.updated) {
        summaryParts.push(`${result.updated} بند محدث`);
      }
      if (result?.conflicted) {
        summaryParts.push(`${result.conflicted} بند بحاجة للمراجعة`);
      }
      const summary = summaryParts.length > 0
        ? `تم استيراد بنود التكلفة من المنافسة (${summaryParts.join('، ')}).`
        : 'تم تحديث بنود التكلفة من المنافسة.';

      setActionMessage(summary);
      setTimeout(() => setActionMessage(''), 6000);
    } catch (error) {
      console.error('❌ [SimplifiedProjectCostView] Failed to import from tender:', error);
      setErrorMessage('تعذر استيراد البنود من المنافسة. حاول مرة أخرى.');
      setTimeout(() => setErrorMessage(null), 6000);
    } finally {
      setIsImporting(false);
    }
  };

  type PercentageKey = 'administrative' | 'operational' | 'profit';

  const handlePercentagesChange = (itemId: string, type: PercentageKey, value: string) => {
    projectCostService.saveDraft(projectId, draft => {
      const item = draft.items.find(i => i.id === itemId);
      if (!item) return;
      
      const numericValue = parseNumericInput(value);
      item.actual.additionalPercentages = {
        ...item.actual.additionalPercentages,
        [type]: numericValue
      };
      item.state = { ...item.state, isModified: true, breakdownDirty: true };
    });
  };

  const handleAddBreakdownRow = (itemId: string, section: keyof CostBreakdownSet) => {
    const rowId = `new-${Date.now()}`;
    handleBreakdownRowChange(itemId, section, rowId, 'name', `عنصر جديد ${Date.now()}`);
  };

  const handleDeleteBreakdownRow = (itemId: string, section: keyof CostBreakdownSet, rowId: string) => {
    projectCostService.saveDraft(projectId, draft => {
      const item = draft.items.find(i => i.id === itemId);
      if (!item) return;
      
      const rows = item.actual.breakdown[section];
      const index = rows.findIndex(r => r.id === rowId);
      
      if (index >= 0) {
        rows.splice(index, 1);
        item.state = { ...item.state, isModified: true, breakdownDirty: true };
      }
    });
  };

  const handleIssuePurchaseOrder = (itemId: string) => {
    // Implementation for purchase order
    console.log('Issue purchase order for item:', itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    const itemName = items.find(item => item.id === itemId)?.description ?? 'البند';
    projectCostService.saveDraft(projectId, draft => {
      draft.items = draft.items.filter(i => i.id !== itemId);
    });
    refresh();
    setActionMessage(`❌ تم حذف "${itemName}" وجميع بياناته بنجاح`);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const renderPricingSummary = () => {
    const totals = draft?.totals ?? { estimatedTotal: 0, actualTotal: 0, varianceTotal: 0, variancePct: 0 };
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 mb-1">التكلفة التقديرية</div>
          <div className="text-2xl font-bold text-blue-700">{formatCurrency(totals.estimatedTotal)}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 mb-1">التكلفة الفعلية</div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(totals.actualTotal)}</div>
        </div>
        <div className={`border rounded-lg p-4 ${totals.varianceTotal >= 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className={`text-sm mb-1 ${totals.varianceTotal >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            فارق التكلفة
          </div>
          <div className={`text-2xl font-bold ${totals.varianceTotal >= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {formatCurrency(Math.abs(totals.varianceTotal))}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">نسبة الفارق</div>
          <div className={`text-2xl font-bold ${totals.variancePct >= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {totals.variancePct.toFixed(1)}%
          </div>
        </div>
      </div>
    );
  };

  const renderBreakdownAnalysis = (item: ProjectCostItem) => {
    const sections: { key: keyof CostBreakdownSet; label: string; dotClass: string; badgeClass: string }[] = [
      { key: 'materials', label: 'المواد', dotClass: 'bg-orange-500', badgeClass: 'bg-orange-100 text-orange-700' },
      { key: 'labor', label: 'العمالة', dotClass: 'bg-sky-500', badgeClass: 'bg-sky-100 text-sky-700' },
      { key: 'equipment', label: 'المعدات', dotClass: 'bg-lime-500', badgeClass: 'bg-lime-100 text-lime-700' },
      { key: 'subcontractors', label: 'مقاولو الباطن', dotClass: 'bg-purple-500', badgeClass: 'bg-purple-100 text-purple-700' }
    ];

    const hasPendingSync = Boolean(item.state?.breakdownDirty);
    const breakdown = item.actual.breakdown;
    const baseAmount =
      sumRows(breakdown.materials) +
      sumRows(breakdown.labor) +
      sumRows(breakdown.equipment) +
      sumRows(breakdown.subcontractors);

    const administrativePercent = item.actual.additionalPercentages?.administrative ?? defaultPercentages.administrative;
    const operationalPercent = item.actual.additionalPercentages?.operational ?? defaultPercentages.operational;
    const profitPercent = item.actual.additionalPercentages?.profit ?? defaultPercentages.profit;

    const administrativeAmount = baseAmount * (administrativePercent / 100);
    const operationalAmount = baseAmount * (operationalPercent / 100);
    const profitAmount = baseAmount * (profitPercent / 100);

    const subtotalWithoutVAT = baseAmount + administrativeAmount + operationalAmount + profitAmount;
    const vatAmount = subtotalWithoutVAT * 0.15;
    const totalWithVAT = subtotalWithoutVAT + vatAmount;
    const unitPrice = item.actual.quantity > 0 ? subtotalWithoutVAT / item.actual.quantity : 0;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-md p-3 text-center">
              <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                <span>التكلفة الأساسية</span>
                {validateCalculationConsistency(item) ? (
                  <span className="text-green-600 text-xs bg-green-50 px-1 rounded" title="الحسابات متطابقة">✓</span>
                ) : (
                  <span className="text-orange-600 text-xs bg-orange-50 px-1 rounded" title="يحتاج إعادة حساب">⚠</span>
                )}
              </div>
              <div className="text-lg font-bold text-gray-800">{formatCurrency(baseAmount)}</div>
              <div className="text-xs text-gray-500">{baseCurrency}</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-md p-3 text-center">
              <div className="text-xs text-blue-600 mb-1 font-medium">التكاليف الإدارية</div>
              <div className="text-xs text-blue-700 font-bold mb-1 bg-blue-100 px-2 py-0.5 rounded-full inline-block">
                {administrativePercent.toFixed(1)}%
              </div>
              <div className="text-lg font-bold text-blue-800">{formatCurrency(administrativeAmount)}</div>
              <div className="text-xs text-blue-600">{baseCurrency}</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-md p-3 text-center">
              <div className="text-xs text-emerald-600 mb-1 font-medium">التكاليف التشغيلية</div>
              <div className="text-xs text-emerald-700 font-bold mb-1 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                {operationalPercent.toFixed(1)}%
              </div>
              <div className="text-lg font-bold text-emerald-800">{formatCurrency(operationalAmount)}</div>
              <div className="text-xs text-emerald-600">{baseCurrency}</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-md p-3 text-center">
              <div className="text-xs text-green-600 mb-1 font-medium">إجمالي الربح</div>
              <div className="text-xs text-green-700 font-bold mb-1 bg-green-100 px-2 py-0.5 rounded-full inline-block">
                {profitPercent.toFixed(1)}%
              </div>
              <div className="text-xl font-bold text-green-800">{formatCurrency(profitAmount)}</div>
              <div className="text-xs text-green-600 mt-1">{baseCurrency}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-md p-3 text-center">
              <div className="text-xs text-orange-600 mb-1 font-medium">قيمة الضريبة</div>
              <div className="text-xs text-orange-700 font-bold mb-1 bg-orange-100 px-2 py-0.5 rounded-full inline-block">15%</div>
              <div className="text-lg font-bold text-orange-800">{formatCurrency(vatAmount)}</div>
              <div className="text-xs text-orange-600">{baseCurrency}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-md p-3 text-center">
              <div className="text-xs text-purple-600 mb-1 font-medium">الإجمالي مع الضريبة</div>
              <div className="text-lg font-bold text-purple-800">{formatCurrency(totalWithVAT)}</div>
              <div className="text-xs text-purple-600">{baseCurrency}</div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-md p-3 text-center">
              <div className="text-xs text-indigo-600 mb-1 font-medium">سعر البند (للوحدة)</div>
              <div className="text-lg font-bold text-indigo-800">{formatCurrency(unitPrice)}</div>
              <div className="text-xs text-indigo-600">{baseCurrency}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-dashed border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              النسب الافتراضية للبند
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-xs text-gray-600">
              <span>الإدارية (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={administrativePercent.toFixed(1)}
                className="border border-blue-200 bg-blue-50 rounded-md px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                onBlur={e => handlePercentagesChange(item.id, 'administrative', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-600">
              <span>التشغيلية (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={operationalPercent.toFixed(1)}
                className="border border-emerald-200 bg-emerald-50 rounded-md px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
                onBlur={e => handlePercentagesChange(item.id, 'operational', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-600">
              <span>الربح (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={profitPercent.toFixed(1)}
                className="border border-purple-200 bg-purple-50 rounded-md px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
                onBlur={e => handlePercentagesChange(item.id, 'profit', e.target.value)}
              />
            </label>
          </div>
        </div>

        {sections.map(section => {
          const sectionKey = `${item.id}:${section.key}`;
          const isOpen = expandedBreakdownSections.has(sectionKey);

          const estimatedRows = item.estimated?.breakdown?.[section.key] ?? [];
          const actualRows = item.actual?.breakdown?.[section.key] ?? [];

          const estimatedPairs = estimatedRows.map((row, idx) => {
            const id = resolveRowId(row, `est-${section.key}`, idx);
            return [id, row] as const;
          });
          const actualPairs = actualRows.map((row, idx) => {
            const id = resolveRowId(row, `act-${section.key}`, idx);
            return [id, row] as const;
          });

          const estimatedRowMap = new Map(estimatedPairs);
          const actualRowMap = new Map(actualPairs);
          const allRowIds = Array.from(new Set([...estimatedRowMap.keys(), ...actualRowMap.keys()]));

          const estimatedTotal = sumRows(estimatedRows);
          const actualTotal = sumRows(actualRows);
          const varianceValue = actualTotal - estimatedTotal;
          const variancePct = estimatedTotal > 0 ? (varianceValue / estimatedTotal) * 100 : 0;
          const varianceClass = varianceValue > 0 ? 'text-red-600' : varianceValue < 0 ? 'text-emerald-600' : 'text-gray-600';
          const displayedRowCount = actualRows.length !== 0 ? actualRows.length : estimatedRows.length;

          return (
            <div key={section.key} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => toggleBreakdownSection(item.id, section.key)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                aria-controls={`${sectionKey}-panel`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-500">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${section.dotClass}`} />
                    <span className="font-medium text-gray-800">{section.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${section.badgeClass}`}>
                      {formatInteger(displayedRowCount)} عناصر
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-blue-600">تقديري: {formatCurrency(estimatedTotal)}</span>
                  <span className="text-green-600">فعلي: {formatCurrency(actualTotal)}</span>
                  <span className={`${varianceClass} font-medium`}>
                    الفارق: {formatCurrency(Math.abs(varianceValue))} ({variancePct.toFixed(1)}%)
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 p-3 md:p-4 space-y-3" id={`${sectionKey}-panel`}>
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <p className="text-sm text-gray-600 font-medium">تفاصيل {section.label}</p>
                    <button
                      className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      onClick={() => handleAddBreakdownRow(item.id, section.key)}
                    >
                      <Plus className="w-4 h-4" />
                      إضافة عنصر
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs md:text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-right whitespace-nowrap">الوصف</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">الوحدة</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">الكمية</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">السعر</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">الإجمالي</th>
                          <th className="px-3 py-2 text-center whitespace-nowrap">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRowIds.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-3 py-6">
                              <EmptyState
                                icon={FileText}
                                title="لا توجد عناصر في هذا القسم بعد"
                                description='استخدم زر "إضافة عنصر" في الأعلى لبدء إدخال التكاليف.'
                              />
                            </td>
                          </tr>
                        )}
                        {allRowIds.map((rowId, idx) => {
                          const estimatedRow = estimatedRowMap.get(rowId);
                          const actualRow = actualRowMap.get(rowId);
                          const fallbackName = actualRow?.name ?? estimatedRow?.name ?? `عنصر ${idx + 1}`;
                          const quantity = actualRow?.quantity ?? estimatedRow?.quantity ?? 0;
                          const unitCost = actualRow?.unitCost ?? estimatedRow?.unitCost ?? 0;
                          const unit = estimatedRow?.unit ?? actualRow?.unit ?? '-';
                          const totalCost = quantity * unitCost;

                          return (
                            <tr key={rowId} className="odd:bg-white even:bg-gray-50">
                              <td className="px-3 py-2 align-middle">
                                {estimatedRow ? (
                                  <span className="text-gray-700">{estimatedRow.name}</span>
                                ) : (
                                  <input
                                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                    defaultValue={fallbackName}
                                    placeholder="وصف العنصر"
                                    onBlur={e => handleBreakdownRowChange(item.id, section.key, rowId, 'name', e.target.value)}
                                  />
                                )}
                              </td>
                              <td className="px-3 py-2 text-center align-middle text-gray-600">{unit}</td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  className="w-20 md:w-24 border border-gray-200 rounded px-2 py-1 text-sm text-center"
                                  defaultValue={quantity.toFixed(2)}
                                  title="الكمية"
                                  placeholder="0.00"
                                  onBlur={e => handleBreakdownRowChange(item.id, section.key, rowId, 'quantity', e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  className="w-20 md:w-24 border border-gray-200 rounded px-2 py-1 text-sm text-center"
                                  defaultValue={unitCost.toFixed(2)}
                                  title="سعر الوحدة"
                                  placeholder="0.00"
                                  onBlur={e => handleBreakdownRowChange(item.id, section.key, rowId, 'unitCost', e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2 text-center font-medium">{formatCurrency(totalCost)}</td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center">
                                  {estimatedRow ? (
                                    <span className="text-xs text-gray-400">—</span>
                                  ) : (
                                    <DeleteConfirmation
                                      itemName={fallbackName}
                                      onConfirm={() => handleDeleteBreakdownRow(item.id, section.key, rowId)}
                                      trigger={
                                        <ActionRoundButton
                                          icon={Trash2}
                                          label={`حذف ${fallbackName}`}
                                          tone="danger"
                                          tooltip="حذف العنصر من تحليل التكلفة"
                                        />
                                      }
                                    />
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {(hasPendingSync || !validateCalculationConsistency(item)) && (
          <div className="space-y-3">
            {hasPendingSync && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">تحديث مطلوب</p>
                  <p>تم تعديل بيانات التكاليف. يرجى النقر على &quot;حفظ وتحديث&quot; لتطبيق التغييرات على سعر البند.</p>
                </div>
              </div>
            )}
            {!validateCalculationConsistency(item) && !hasPendingSync && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">تحذير: عدم تطابق في الحسابات</p>
                  <p>الحسابات الحالية لا تتطابق مع سعر البند المعروض. يُنصح بإعادة الحساب للتأكد من الدقة.</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg border border-blue-100 mt-4">
              <div className="flex flex-col lg:flex-row justify-between gap-4 lg:gap-6 items-center">
                <div className="flex items-center gap-3">
                  {hasPendingSync ? (
                    <SaveConfirmation
                      onConfirm={() => handleRecalculateItemFromBreakdown(item.id)}
                      trigger={
                        <button
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 animate-pulse shadow-lg font-medium"
                          aria-label="حفظ وتحديث سعر البند"
                          title="حفظ وتحديث سعر البند"
                        >
                          <Save className="w-4 h-4" />
                          حفظ وتحديث سعر البند
                        </button>
                      }
                    />
                  ) : (
                    <button
                      className="px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2 shadow-lg font-medium"
                      aria-label="حفظ وتحديث سعر البند"
                      title="إعادة حساب سعر البند"
                      onClick={() => handleRecalculateItemFromBreakdown(item.id)}
                    >
                      <Calculator className="w-4 h-4" />
                      إعادة حساب سعر البند
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {validateCalculationConsistency(item) ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg border border-green-200">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm font-medium">الحسابات متطابقة</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-700 bg-orange-100 px-3 py-2 rounded-lg border border-orange-200">
                      <span className="text-orange-600">⚠</span>
                      <span className="text-sm font-medium">يحتاج إعادة حساب</span>
                    </div>
                  )}

                  {hasPendingSync && (
                    <div className="flex items-center gap-2 text-blue-700 bg-blue-100 px-3 py-2 rounded-lg border border-blue-200">
                      <span className="text-blue-600 animate-pulse">💾</span>
                      <span className="text-sm font-medium">تغييرات غير محفوظة</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center mt-2">
                <p className="text-xs text-gray-600">💡 قم بتعديل البيانات في الجداول أعلاه ثم اضغط على زر الحفظ لتحديث السعر النهائي</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <div className="p-6 space-y-6">
        {actionMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm shadow-sm flex items-center gap-2" role="status" aria-live="polite">
            <span className="text-lg" role="img" aria-hidden="true">✅</span>
            <span>{actionMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm shadow-sm flex items-center gap-2" role="alert">
            <span className="text-lg" role="img" aria-hidden="true">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-blue-600" />
                بنود التكلفة
              </h1>
              <p className="text-gray-600 mt-1">إدارة وتحليل التكاليف التقديرية والفعلية للمشروع</p>
            </div>
            <div className="flex items-center gap-2">
              {tenderId && (
                <button
                  type="button"
                  onClick={handleImportFromTender}
                  disabled={isImporting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  aria-label="استيراد بنود التكلفة من المنافسة"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {isImporting ? 'جاري الاستيراد...' : 'استيراد من المنافسة'}
                </button>
              )}
              <button className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                الإعدادات
              </button>
            </div>
          </div>

          {/* Pricing Summary Cards */}
          {renderPricingSummary()}
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-green-600" />
              جدول بنود التكلفة
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table key={`table-${forceUpdateKey}`} className="w-full min-w-[1400px]">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[6%]" />
                <col className="w-[24%]" />
                <col className="w-[6%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[5%]" />
                <col className="w-[5%]" />
              </colgroup>
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-gray-50 border-b" style={{ display: 'flex', flexDirection: 'row-reverse', width: '100%' }}>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 5%', minWidth: '50px' }}>إجراءات</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 5%', minWidth: '50px' }}>فارق %</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 10%', minWidth: '100px' }}>فارق القيمة</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 9%', minWidth: '90px' }}>الإجمالي الفعلي</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 9%', minWidth: '90px' }}>السعر الفعلي</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 8%', minWidth: '80px' }}>الكمية الفعلية</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 9%', minWidth: '90px' }}>الإجمالي التقديري</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 8%', minWidth: '80px' }}>السعر التقديري</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 8%', minWidth: '80px' }}>الكمية التقديرية</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 6%', minWidth: '60px' }}>الوحدة</th>
                  <th className="border border-gray-200 p-3 text-right font-semibold" style={{ flex: '1 1 0%', minWidth: '200px' }}>وصف البند</th>
                  <th className="border border-gray-200 p-3 text-right font-semibold" style={{ flex: '0 0 6%', minWidth: '60px' }}>رقم البند</th>
                  <th className="border border-gray-200 p-3 text-center font-semibold" style={{ flex: '0 0 5%', minWidth: '50px' }}>عرض</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const isExpanded = expandedItems.has(item.id);
                  const estimatedQuantity = item.estimated?.quantity ?? 0;
                  const estimatedUnitPrice = item.estimated?.unitPrice ?? 0;
                  const estimatedTotal = item.estimated?.totalPrice ?? +(estimatedQuantity * estimatedUnitPrice).toFixed(2);
                  const actualQuantity = item.actual?.quantity ?? 0;
                  const actualUnitPrice = item.actual?.unitPrice ?? 0;
                  const actualTotal = item.actual?.totalPrice ?? +(actualQuantity * actualUnitPrice).toFixed(2);
                  
                  // تشخيص: فحص حالة البيانات لكل بند
                  if (actualUnitPrice > 0 || actualTotal > 0) {
                    const hasBreakdownData = item.actual?.breakdown && (
                      (item.actual.breakdown.materials?.length > 0) ||
                      (item.actual.breakdown.labor?.length > 0) ||
                      (item.actual.breakdown.equipment?.length > 0) ||
                      (item.actual.breakdown.subcontractors?.length > 0)
                    );
                    
                    const isCalculationCorrect = actualQuantity > 0 && 
                      Math.abs((actualUnitPrice * actualQuantity) - actualTotal) < 1;
                    
                    console.log(`📊 [UI Render] البند ${index + 1} (${item.id}):`, {
                      description: item.description?.substring(0, 40) + '...',
                      actualQuantity,
                      actualUnitPrice,
                      actualTotal,
                      hasBreakdownData,
                      isCalculationCorrect,
                      calculationCheck: `${actualUnitPrice} × ${actualQuantity} = ${(actualUnitPrice * actualQuantity).toFixed(2)} ${isCalculationCorrect ? '✅' : '❌'}`,
                      status: isCalculationCorrect ? '✅ صحيح' : '❌ يحتاج إعادة حساب'
                    });
                  }
                  const varianceValue = actualTotal - estimatedTotal;
                  const variancePct = estimatedTotal ? (varianceValue / estimatedTotal) * 100 : 0;
                  const varianceClass = varianceValue > 0 ? 'text-red-700' : varianceValue < 0 ? 'text-emerald-700' : 'text-gray-700';
                  const varianceBg = varianceValue > 0 ? 'bg-red-50' : varianceValue < 0 ? 'bg-emerald-50' : '';
                  const severity = severityMap[item.id];
                  const severityStyles: Record<string, { label: string; className: string }> = {
                    critical: { label: 'تجاوز حرج', className: 'bg-red-100 text-red-700' },
                    warning: { label: 'تنبيه', className: 'bg-amber-100 text-amber-700' },
                    info: { label: 'ملاحظة', className: 'bg-blue-100 text-blue-700' }
                  };
                  const severityBadge = severity ? severityStyles[severity] : null;

                  return (
                    <React.Fragment key={`${item.id}-${actualUnitPrice}-${actualTotal}`}>
                      <tr className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/50 transition-colors" style={{ display: 'flex', flexDirection: 'row-reverse', width: '100%' }}>
                        <td className="border border-gray-200 p-2 text-center" style={{ flex: '0 0 5%', minWidth: '50px' }}>
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {(() => {
                              const hasPendingSync = Boolean(item.state?.breakdownDirty);
                              if (hasPendingSync) {
                                return (
                                  <SaveConfirmation
                                    onConfirm={() => handleRecalculateItemFromBreakdown(item.id)}
                                    trigger={
                                      <ActionRoundButton
                                        icon={Save}
                                        label="حفظ وتحديث سعر البند"
                                        tone="primary"
                                        tooltip="حفظ وتحديث سعر البند - يوجد تغييرات غير محفوظة"
                                      />
                                    }
                                  />
                                );
                              }
                              return (
                                <ActionRoundButton
                                  icon={Calculator}
                                  label="إعادة حساب سعر البند"
                                  tone="warning"
                                  tooltip="إعادة حساب سعر البند بناءً على التحليل"
                                  onClick={() => handleRecalculateItemFromBreakdown(item.id)}
                                />
                              );
                            })()}

                            <ActionRoundButton
                              icon={ShoppingCart}
                              label="إصدار أمر شراء"
                              tone="success"
                              tooltip="إصدار أمر شراء للبند"
                              onClick={() => handleIssuePurchaseOrder(item.id)}
                            />

                            <DeleteConfirmation
                              itemName={item.description ?? 'البند'}
                              onConfirm={() => handleDeleteItem(item.id)}
                              trigger={
                                <ActionRoundButton
                                  icon={Trash2}
                                  label="حذف البند"
                                  tone="danger"
                                  tooltip="حذف البند من جدول التكاليف"
                                />
                              }
                            />

                            <ActionRoundButton
                              icon={MoreHorizontal}
                              label="خيارات إضافية"
                              tone="neutral"
                              tooltip="خيارات إضافية (سيتم دعمها لاحقًا)"
                              disabled
                            />
                          </div>
                        </td>
                        <td className={`border border-gray-200 p-2 text-center font-semibold ${varianceClass} ${varianceBg}`} style={{ flex: '0 0 5%', minWidth: '50px' }}>
                          {variancePct.toFixed(1)}%
                        </td>
                        <td className={`border border-gray-200 p-2 text-center font-semibold ${varianceClass} ${varianceBg}`} style={{ flex: '0 0 10%', minWidth: '100px' }}>
                          {formatCurrency(varianceValue)}
                        </td>
                        <td className="border border-gray-200 p-2 text-center font-medium text-green-600" style={{ flex: '0 0 9%', minWidth: '90px' }}>
                          {formatCurrency(actualTotal)}
                        </td>
                        <td className="border border-gray-200 p-2 text-center text-gray-700" style={{ flex: '0 0 9%', minWidth: '90px' }}>
                          {Number.isFinite(actualUnitPrice) ? formatCurrency(actualUnitPrice) : '—'}
                        </td>
                        <td className="border border-gray-200 p-2 text-center text-gray-700" style={{ flex: '0 0 8%', minWidth: '80px' }}>
                          {Number.isFinite(actualQuantity) ? formatDecimal(actualQuantity) : '—'}
                        </td>
                        <td className="border border-gray-200 p-2 text-center font-medium text-blue-600" style={{ flex: '0 0 9%', minWidth: '90px' }}>
                          {formatCurrency(estimatedTotal)}
                        </td>
                        <td className="border border-gray-200 p-2 text-center" style={{ flex: '0 0 8%', minWidth: '80px' }}>
                          {formatCurrency(estimatedUnitPrice)}
                        </td>
                        <td className="border border-gray-200 p-2 text-center" style={{ flex: '0 0 8%', minWidth: '80px' }}>
                          {formatDecimal(estimatedQuantity)}
                        </td>
                        <td className="border border-gray-200 p-2 text-center font-medium" style={{ flex: '0 0 6%', minWidth: '60px' }}>
                          {item.unit ?? '-'}
                        </td>
                        <td className="border border-gray-200 p-2 text-right" style={{ flex: '1 1 0%', minWidth: '200px' }}>
                          <div>
                            <div className="font-medium text-gray-900">{item.description}</div>
                            {item.category && (
                              <div className="text-xs text-gray-500 mt-1">{item.category}</div>
                            )}
                            {severityBadge && (
                              <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${severityBadge.className}`}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {severityBadge.label}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 p-2 text-center font-medium" style={{ flex: '0 0 6%', minWidth: '60px' }}>
                          {formatInteger(index + 1)}
                        </td>
                        <td className="border border-gray-200 p-2 text-center" style={{ flex: '0 0 5%', minWidth: '50px' }}>
                          <button
                            onClick={() => toggleExpanded(item.id)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-400 transition-colors"
                            title={isExpanded ? 'إخفاء تحليل التكلفة' : 'عرض تحليل التكلفة'}
                            aria-controls={`analysis-${item.id}`}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Breakdown Analysis Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={13} className="p-0 bg-gray-100">
                            <div
                              className="bg-white p-4 m-2 rounded-lg border"
                              id={`analysis-${item.id}`}
                              data-testid={`analysis-panel-${item.id}`}
                            >
                              <div className="mb-3 font-semibold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span className="text-blue-600">تحليل تكلفة البند</span>
                                </div>
                              </div>
                              {renderBreakdownAnalysis(item)}
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
        </div>
      </div>
    </div>
  );
};

export default SimplifiedProjectCostView;