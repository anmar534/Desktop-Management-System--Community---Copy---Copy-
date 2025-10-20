import React from 'react';
import {
  AlertCircle,
  Target,
  DollarSign,
  Calculator,
  Settings,
  Building,
  TrendingUp,
  Grid3X3,
  CheckCircle,
  Edit3,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PricingData } from '@/types/pricing';
import { CostSectionCard } from './CostSectionCard';

type PricingSection = 'materials' | 'labor' | 'equipment' | 'subcontractors';

interface DefaultPercentages {
  administrative: number;
  operational: number;
  profit: number;
}

interface SummaryViewProps {
  quantityItems: Array<{
    id: string;
    itemNumber: string;
    description: string;
    unit: string;
    quantity: number;
    specifications?: string;
    [key: string]: unknown;
  }>;
  pricingData: Map<string, PricingData>;
  defaultPercentages: DefaultPercentages;
  defaultPercentagesInput: {
    administrative: string;
    operational: string;
    profit: string;
  };
  setDefaultPercentagesInput: React.Dispatch<React.SetStateAction<{
    administrative: string;
    operational: string;
    profit: string;
  }>>;
  setDefaultPercentages: React.Dispatch<React.SetStateAction<DefaultPercentages>>;
  applyDefaultPercentagesToExistingItems: () => void;
  setCurrentItemIndex: (index: number) => void;
  setCurrentView: (view: 'summary' | 'pricing' | 'technical') => void;
  formatCurrencyValue: (value: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => string;
  formatQuantity: (quantity: number) => string;
  calculateProjectTotal: () => number;
  calculateAveragePercentages: () => { administrative: number; operational: number; profit: number };
  calculateTotalAdministrative: () => number;
  calculateTotalOperational: () => number;
  calculateTotalProfit: () => number;
  calculateItemsTotal: () => number;
  calculateVAT: () => number;
  collapsedSections: Record<string, Record<string, boolean>>;
  toggleCollapse: (itemId: string, section: PricingSection) => void;
  addRowFromSummary: (itemId: string, type: 'materials' | 'labor' | 'equipment' | 'subcontractors') => void;
  updateRowFromSummary: (itemId: string, type: 'materials' | 'labor' | 'equipment' | 'subcontractors', rowId: string, field: string, value: any) => void;
  deleteRowFromSummary: (itemId: string, type: 'materials' | 'labor' | 'equipment' | 'subcontractors', rowId: string) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  quantityItems,
  pricingData,
  defaultPercentages,
  defaultPercentagesInput,
  setDefaultPercentagesInput,
  setDefaultPercentages,
  applyDefaultPercentagesToExistingItems,
  setCurrentItemIndex,
  setCurrentView,
  formatCurrencyValue,
  formatQuantity,
  calculateProjectTotal,
  calculateAveragePercentages,
  calculateTotalAdministrative,
  calculateTotalOperational,
  calculateTotalProfit,
  calculateItemsTotal,
  calculateVAT,
  collapsedSections,
  toggleCollapse,
  addRowFromSummary,
  updateRowFromSummary,
  deleteRowFromSummary
}) => {
  const projectTotal = calculateProjectTotal();
  const completedCount = Array.from(pricingData.values()).filter(value => value?.completed).length;
  const completionPercentage = (completedCount / quantityItems.length) * 100;

  return (
    <ScrollArea className="h-[calc(100vh-100px)] overflow-auto">
      <div className="space-y-3 p-2 pb-4" dir="rtl">
        {/* تحذير للبيانات التجريبية */}
        {quantityItems.length <= 5 && quantityItems[0]?.id === '1' && (
          <Card className="border-warning/30 bg-warning/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">تحذير: يتم عرض بيانات تجريبية</span>
              </div>
              <p className="text-sm text-warning mt-1">
                لم يتم العثور على جدول الكميات الحقيقي للمنافسة. يرجى التأكد من إرفاق ملف الكميات الصحيح.
              </p>
            </CardContent>
          </Card>
        )}

        {/* إحصائيات المشروع (في الأعلى) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* بطاقة نسبة الإنجاز */}
          <Card className="border-info/30 hover:shadow-sm transition-shadow">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-info" />
                <span className="text-sm font-medium">نسبة الإنجاز</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-info">{completionPercentage.toFixed(1)}%</div>
                <div className="text-xs leading-tight text-muted-foreground">{completedCount} / {quantityItems.length} بند</div>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة القيمة الإجمالية التقديرية */}
          <Card className="border-success/30 hover:shadow-sm transition-shadow">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">القيمة الإجمالية</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-success">
                  {formatCurrencyValue(projectTotal, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </div>
                <div className="text-xs leading-tight text-muted-foreground">إجمالي تقديري</div>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة البنود المسعّرة */}
          <Card className="border-warning/30 hover:shadow-sm transition-shadow">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium">البنود المسعّرة</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-warning">{pricingData.size}</div>
                <div className="text-xs leading-tight text-muted-foreground">من أصل {quantityItems.length}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* صف واحد: شريط النِسب + 3 بطاقات التكاليف */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
          {/* ratios toolbar as first column */}
          <div className="p-2 border border-border rounded-md bg-info/10 h-full overflow-hidden" role="region" aria-label="إدارة النسب الافتراضية">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="min-w-0">
                  <span className="block text-xs text-muted-foreground">الإدارية (%)</span>
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
                    aria-label="النسبة الإدارية الافتراضية"
                  />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs text-muted-foreground">التشغيلية (%)</span>
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
                    aria-label="النسبة التشغيلية الافتراضية"
                  />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs text-muted-foreground">الربح (%)</span>
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
                    aria-label="نسبة الربح الافتراضية"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap leading-tight">تُطبق على البنود الجديدة</span>
                <button
                  onClick={applyDefaultPercentagesToExistingItems}
                  title="تطبيق على البنود الموجودة"
                  aria-label="تطبيق على البنود الموجودة"
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
                    التكاليف الإدارية ({calculateAveragePercentages().administrative.toFixed(1)}%)
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
                    التكاليف التشغيلية ({calculateAveragePercentages().operational.toFixed(1)}%)
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
                    إجمالي الأرباح ({calculateAveragePercentages().profit.toFixed(1)}%)
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

        {/* شريط التقدم */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="w-5 h-5 text-info" />
              تقدم عملية التسعير
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>تم إنجاز {completedCount} من {quantityItems.length} بند</span>
                <span>{completionPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2 relative overflow-hidden">
                {/* شريط التقدم بعرض ديناميكي */}
                <div
                  className="bg-gradient-to-r from-info to-success h-2 rounded-full transition-all duration-300 absolute top-0 left-0"
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
              <Grid3X3 className="w-5 h-5 text-success" />
              جدول كميات المنافسة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto border rounded-lg">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="bg-muted/20 border-b">
                    <th className="border border-border p-3 text-right font-semibold">رقم البند</th>
                    <th className="border border-border p-3 text-right font-semibold">وصف البند</th>
                    <th className="border border-border p-3 text-center font-semibold">الوحدة</th>
                    <th className="border border-border p-3 text-center font-semibold">الكمية</th>
                    <th className="border border-border p-3 text-center font-semibold">سعر الوحدة</th>
                    <th className="border border-border p-3 text-center font-semibold">القيمة الإجمالية</th>
                    <th className="border border-border p-3 text-center font-semibold">حالة التسعير</th>
                    <th className="border border-border p-3 text-center font-semibold">إجراءات</th>
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
                    const isExpanded = !collapsedSections[item.id]?.all;

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          className={`cursor-pointer hover:bg-muted/40 transition-colors ${isCompleted ? 'bg-success/10' : (isInProgress ? 'bg-warning/10' : 'bg-destructive/10')}`}
                          onClick={() => toggleCollapse(item.id, 'all' as PricingSection)}
                        >
                          <td className="border border-border p-3 font-medium text-right">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                              {item.itemNumber}
                            </div>
                          </td>
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
                                تم التسعير
                              </Badge>
                            ) : isInProgress ? (
                              <Badge className="bg-warning/15 text-warning border-warning/20">
                                قيد التسعير
                              </Badge>
                            ) : (
                              <Badge className="bg-destructive/15 text-destructive border-destructive/20">
                                <AlertCircle className="w-3 h-3 ml-1" />
                                لم يتم التسعير
                              </Badge>
                            )}
                          </td>
                          <td className="border border-border p-3 text-center" onClick={(e) => e.stopPropagation()}>
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

                        {isExpanded && (
                          <tr className="bg-card">
                            <td colSpan={8} className="p-4 border-b border-border">
                              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                {/* Cost Sections using CostSectionCard component - v5 Enhanced Design with Inline Editing */}
                                <CostSectionCard
                                  title="المواد"
                                  type="materials"
                                  items={itemPricing?.materials}
                                  isCollapsed={!!collapsedSections[item.id]?.materials}
                                  onToggle={() => toggleCollapse(item.id, 'materials')}
                                  onAddRow={() => addRowFromSummary(item.id, 'materials')}
                                  onUpdateRow={(rowId, field, value) => updateRowFromSummary(item.id, 'materials', rowId, field, value)}
                                  onDeleteRow={(rowId) => deleteRowFromSummary(item.id, 'materials', rowId)}
                                  formatCurrency={formatCurrencyValue}
                                />

                                <CostSectionCard
                                  title="العمالة"
                                  type="labor"
                                  items={itemPricing?.labor}
                                  isCollapsed={!!collapsedSections[item.id]?.labor}
                                  onToggle={() => toggleCollapse(item.id, 'labor')}
                                  onAddRow={() => addRowFromSummary(item.id, 'labor')}
                                  onUpdateRow={(rowId, field, value) => updateRowFromSummary(item.id, 'labor', rowId, field, value)}
                                  onDeleteRow={(rowId) => deleteRowFromSummary(item.id, 'labor', rowId)}
                                  formatCurrency={formatCurrencyValue}
                                />

                                <CostSectionCard
                                  title="المعدات"
                                  type="equipment"
                                  items={itemPricing?.equipment}
                                  isCollapsed={!!collapsedSections[item.id]?.equipment}
                                  onToggle={() => toggleCollapse(item.id, 'equipment')}
                                  onAddRow={() => addRowFromSummary(item.id, 'equipment')}
                                  onUpdateRow={(rowId, field, value) => updateRowFromSummary(item.id, 'equipment', rowId, field, value)}
                                  onDeleteRow={(rowId) => deleteRowFromSummary(item.id, 'equipment', rowId)}
                                  formatCurrency={formatCurrencyValue}
                                />

                                <CostSectionCard
                                  title="مقاولو الباطن"
                                  type="subcontractors"
                                  items={itemPricing?.subcontractors}
                                  isCollapsed={!!collapsedSections[item.id]?.subcontractors}
                                  onToggle={() => toggleCollapse(item.id, 'subcontractors')}
                                  onAddRow={() => addRowFromSummary(item.id, 'subcontractors')}
                                  onUpdateRow={(rowId, field, value) => updateRowFromSummary(item.id, 'subcontractors', rowId, field, value)}
                                  onDeleteRow={(rowId) => deleteRowFromSummary(item.id, 'subcontractors', rowId)}
                                  formatCurrency={formatCurrencyValue}
                                />

                                {/* ملخص التكاليف النهائي */}
                                {itemPricing && (() => {
                                  // حساب الإجماليات مع مراعاة الهدر للمواد
                                  const materialsTotal = itemPricing.materials.reduce((sum, m) => {
                                    const wastageMultiplier = m.hasWaste ? 1 + ((m.wastePercentage ?? 0) / 100) : 1;
                                    return sum + ((m.quantity ?? 0) * (m.price ?? 0) * wastageMultiplier);
                                  }, 0);

                                  const laborTotal = itemPricing.labor.reduce((sum, l) => sum + (l.total ?? 0), 0);
                                  const equipmentTotal = itemPricing.equipment.reduce((sum, e) => sum + (e.total ?? 0), 0);
                                  const subcontractorsTotal = itemPricing.subcontractors.reduce((sum, s) => sum + (s.total ?? 0), 0);

                                  const directCosts = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal;
                                  const administrative = directCosts * ((itemPricing.additionalPercentages?.administrative ?? 0) / 100);
                                  const operational = directCosts * ((itemPricing.additionalPercentages?.operational ?? 0) / 100);
                                  const profit = directCosts * ((itemPricing.additionalPercentages?.profit ?? 0) / 100);
                                  const totalCost = directCosts + administrative + operational + profit;
                                  const unitPrice = item.quantity > 0 ? totalCost / item.quantity : 0;

                                  return (
                                    <Card className="mt-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                                      <CardContent className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {/* النسب المئوية */}
                                          <div className="space-y-3">
                                            <h4 className="font-bold text-base text-foreground mb-3 flex items-center gap-2">
                                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                              </svg>
                                              النسب المئوية
                                            </h4>
                                            <div className="flex items-center justify-between text-sm py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                                              <span className="text-muted-foreground flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                                إداري:
                                              </span>
                                              <span className="font-semibold tabular-nums">
                                                {itemPricing.additionalPercentages?.administrative ?? 0}% = {formatCurrencyValue(administrative, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
                                              <span className="text-muted-foreground flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                                                تشغيلي:
                                              </span>
                                              <span className="font-semibold tabular-nums">
                                                {itemPricing.additionalPercentages?.operational ?? 0}% = {formatCurrencyValue(operational, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                                              <span className="text-muted-foreground flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                                الربح:
                                              </span>
                                              <span className="font-semibold tabular-nums">
                                                {itemPricing.additionalPercentages?.profit ?? 0}% = {formatCurrencyValue(profit, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                              </span>
                                            </div>
                                          </div>

                                          {/* ملخص التكاليف */}
                                          <div className="space-y-3">
                                            <h4 className="font-bold text-base text-foreground mb-3 flex items-center gap-2">
                                              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                              ملخص التكاليف
                                            </h4>
                                            <div className="flex items-center justify-between text-sm py-2 px-3 bg-card rounded-lg border">
                                              <span className="text-muted-foreground">التكاليف المباشرة:</span>
                                              <span className="font-semibold tabular-nums">{formatCurrencyValue(directCosts, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm py-2 px-3 bg-card rounded-lg border">
                                              <span className="text-muted-foreground">إداري + تشغيلي:</span>
                                              <span className="font-semibold tabular-nums">{formatCurrencyValue(administrative + operational, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm py-2 px-3 bg-card rounded-lg border">
                                              <span className="text-muted-foreground">الربح:</span>
                                              <span className="font-semibold tabular-nums">{formatCurrencyValue(profit, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-base py-3 px-3 bg-success/10 rounded-lg border-2 border-success/30">
                                              <span className="font-bold text-success">إجمالي البند:</span>
                                              <span className="font-bold text-xl text-success tabular-nums">{formatCurrencyValue(totalCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-base py-3 px-3 bg-primary/10 rounded-lg border-2 border-primary/30">
                                              <span className="font-bold text-primary">سعر الوحدة:</span>
                                              <span className="font-bold text-xl text-primary tabular-nums">{formatCurrencyValue(unitPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })()}
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
                <PieChart className="w-5 h-5 text-success" />
                الملخص المالي للمشروع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-info/10 rounded-lg">
                    <span className="font-medium">إجمالي قيمة البنود المُسعرة:</span>
                    <span className="font-bold text-info">
                      {formatCurrencyValue(calculateItemsTotal(), {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                    <span className="font-medium">
                      إجمالي التكاليف الإدارية ({calculateAveragePercentages().administrative.toFixed(1)}%):
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
                      إجمالي التكاليف التشغيلية ({calculateAveragePercentages().operational.toFixed(1)}%):
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
                    <span className="font-medium">ضريبة القيمة المضافة (15%):</span>
                    <span className="font-bold text-muted-foreground">
                      {formatCurrencyValue(calculateVAT(), {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning/15 rounded-lg">
                    <span className="font-medium">
                      إجمالي الأرباح ({calculateAveragePercentages().profit.toFixed(1)}%):
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
                  <span className="font-bold text-lg">القيمة الإجمالية النهائية:</span>
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
