import React, { useMemo, useState, useEffect } from 'react'
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
  PieChart,
  Save,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { BackToTop } from '@/presentation/components/ui/back-to-top'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/presentation/components/ui/dropdown-menu'
import type { PricingData } from '@/shared/types/pricing'
import { CostSectionCard } from './CostSectionCard'
import { DirectPriceInputDialog } from './DirectPriceInputDialog'
import { usePricingCalculations } from '@/shared/hooks/usePricingCalculations'
import { StatCard, StatCardGroup } from '@/presentation/components/pricing/shared'

type PricingSection = 'materials' | 'labor' | 'equipment' | 'subcontractors'

interface DefaultPercentages {
  administrative: number
  operational: number
  profit: number
}

interface SummaryViewProps {
  quantityItems: Array<{
    id: string
    itemNumber: string
    description: string
    unit: string
    quantity: number
    specifications?: string
    [key: string]: unknown
  }>
  pricingData: Map<string, PricingData>
  defaultPercentages: DefaultPercentages
  defaultPercentagesInput: {
    administrative: string
    operational: string
    profit: string
  }
  setDefaultPercentagesInput: React.Dispatch<
    React.SetStateAction<{
      administrative: string
      operational: string
      profit: string
    }>
  >
  setDefaultPercentages: React.Dispatch<React.SetStateAction<DefaultPercentages>>
  saveDefaultPercentages: (newPercentages: DefaultPercentages) => Promise<void>
  applyDefaultPercentagesToExistingItems: () => void
  setCurrentItemIndex: (index: number) => void
  setCurrentView: (view: 'summary' | 'pricing' | 'technical') => void
  formatCurrencyValue: (
    value: number,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
  ) => string
  formatQuantity: (quantity: number) => string
  calculateProjectTotal: () => number
  calculateAveragePercentages: () => { administrative: number; operational: number; profit: number }
  calculateTotalAdministrative: () => number
  calculateTotalOperational: () => number
  calculateTotalProfit: () => number
  calculateItemsTotal: () => number
  calculateVAT: () => number
  collapsedSections: Record<string, Record<string, boolean>>
  toggleCollapse: (itemId: string, section: PricingSection) => void
  addRowFromSummary: (
    itemId: string,
    type: 'materials' | 'labor' | 'equipment' | 'subcontractors',
  ) => void
  updateRowFromSummary: (
    itemId: string,
    type: 'materials' | 'labor' | 'equipment' | 'subcontractors',
    rowId: string,
    field: string,
    value: string | number | boolean,
  ) => void
  deleteRowFromSummary: (
    itemId: string,
    type: 'materials' | 'labor' | 'equipment' | 'subcontractors',
    rowId: string,
  ) => void
  onSaveItem?: (itemId: string) => void
  onSaveDirectPrice?: (itemId: string, unitPrice: number) => void
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  quantityItems,
  pricingData,
  defaultPercentages,
  defaultPercentagesInput,
  setDefaultPercentagesInput,
  setDefaultPercentages,
  saveDefaultPercentages,
  applyDefaultPercentagesToExistingItems,
  setCurrentItemIndex,
  setCurrentView,
  formatCurrencyValue,
  formatQuantity,
  calculateProjectTotal: _calculateProjectTotal,
  calculateAveragePercentages: _calculateAveragePercentages,
  calculateTotalAdministrative: _calculateTotalAdministrative,
  calculateTotalOperational: _calculateTotalOperational,
  calculateTotalProfit: _calculateTotalProfit,
  calculateItemsTotal: _calculateItemsTotal,
  calculateVAT: _calculateVAT,
  collapsedSections,
  toggleCollapse,
  addRowFromSummary,
  updateRowFromSummary,
  deleteRowFromSummary,
  onSaveItem,
  onSaveDirectPrice,
}) => {
  // ✨ استخدام الـ hook الموحد للحسابات (Single Source of Truth)
  const unifiedCalculations = usePricingCalculations({
    quantityItems,
    pricingData,
    defaultPercentages,
  })

  // 🔍 تشخيص البيانات للبطاقات
  useEffect(() => {
    console.log('[SummaryView] Cards Data:', {
      pricingDataSize: pricingData.size,
      quantityItemsCount: quantityItems.length,
      defaultPercentages,
      totals: unifiedCalculations.totals,
      averagePercentages: unifiedCalculations.averagePercentages,
    })
  }, [pricingData, quantityItems, defaultPercentages, unifiedCalculations])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(quantityItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = quantityItems.slice(startIndex, endIndex)

  // Direct price input dialog state
  const [directPriceDialog, setDirectPriceDialog] = useState<{
    open: boolean
    itemId: string
    itemIndex: number
  } | null>(null)

  // استخدام useMemo للحسابات
  const completedCount = useMemo(() => {
    // Count ONLY items explicitly marked as completed (saved items)
    return Array.from(pricingData.values()).filter((value) => value?.completed === true).length
  }, [pricingData])
  const completionPercentage = useMemo(
    () => (completedCount / quantityItems.length) * 100,
    [completedCount, quantityItems.length],
  )

  return (
    <>
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
                لم يتم العثور على جدول الكميات الحقيقي للمنافسة. يرجى التأكد من إرفاق ملف الكميات
                الصحيح.
              </p>
            </CardContent>
          </Card>
        )}

        {/* إحصائيات المشروع (في الأعلى) - باستخدام StatCard الموحد */}
        <StatCardGroup columns={3}>
          <StatCard
            title="نسبة الإنجاز"
            value={`${completionPercentage.toFixed(1)}%`}
            subtitle={`${completedCount} / ${quantityItems.length} بند`}
            icon={<Target className="h-5 w-5" />}
            variant="info"
          />

          <StatCard
            title="القيمة الإجمالية"
            value={formatCurrencyValue(unifiedCalculations.totals.projectTotal, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            subtitle="إجمالي تقديري"
            icon={<DollarSign className="h-5 w-5" />}
            variant="success"
          />

          <StatCard
            title="ضريبة القيمة المضافة"
            value={formatCurrencyValue(unifiedCalculations.calculateVAT(), {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            subtitle="15% من الإجمالي"
            icon={<Calculator className="h-5 w-5" />}
            variant="warning"
          />
        </StatCardGroup>

        {/* صف واحد: شريط النِسب + 3 بطاقات التكاليف */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
          {/* ratios toolbar as first column */}
          <div
            className="p-2 border border-border rounded-md bg-info/10 h-full overflow-hidden"
            role="region"
            aria-label="إدارة النسب الافتراضية"
          >
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="min-w-0">
                  <span className="block text-xs text-muted-foreground">الإدارية (%)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={defaultPercentagesInput.administrative}
                    onChange={(e) =>
                      setDefaultPercentagesInput((p) => ({ ...p, administrative: e.target.value }))
                    }
                    onBlur={(e) => {
                      const raw = e.target.value.replace(/,/g, '').trim()
                      const num = Number(raw)
                      const clamped = isNaN(num)
                        ? defaultPercentages.administrative
                        : Math.max(0, Math.min(100, num))
                      const newPercentages = { ...defaultPercentages, administrative: clamped }
                      setDefaultPercentages(newPercentages)
                      saveDefaultPercentages(newPercentages)
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
                    onChange={(e) =>
                      setDefaultPercentagesInput((p) => ({ ...p, operational: e.target.value }))
                    }
                    onBlur={(e) => {
                      const raw = e.target.value.replace(/,/g, '').trim()
                      const num = Number(raw)
                      const clamped = isNaN(num)
                        ? defaultPercentages.operational
                        : Math.max(0, Math.min(100, num))
                      const newPercentages = { ...defaultPercentages, operational: clamped }
                      setDefaultPercentages(newPercentages)
                      saveDefaultPercentages(newPercentages)
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
                    onChange={(e) =>
                      setDefaultPercentagesInput((p) => ({ ...p, profit: e.target.value }))
                    }
                    onBlur={(e) => {
                      const raw = e.target.value.replace(/,/g, '').trim()
                      const num = Number(raw)
                      const clamped = isNaN(num)
                        ? defaultPercentages.profit
                        : Math.max(0, Math.min(100, num))
                      const newPercentages = { ...defaultPercentages, profit: clamped }
                      setDefaultPercentages(newPercentages)
                      saveDefaultPercentages(newPercentages)
                    }}
                    className="w-full h-8 px-2 border border-input rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-info focus:border-transparent"
                    aria-label="نسبة الربح الافتراضية"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap leading-tight">
                  تُطبق على البنود الجديدة
                </span>
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

          {/* بطاقات التكاليف - باستخدام StatCard الموحد */}
          <StatCard
            title={`التكاليف الإدارية (${unifiedCalculations.displayPercentages.administrative.toFixed(1)}%)`}
            value={formatCurrencyValue(unifiedCalculations.totals.administrative, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            icon={<Settings className="h-6 w-6" />}
            variant="destructive"
            layout="vertical"
          />

          <StatCard
            title={`التكاليف التشغيلية (${unifiedCalculations.displayPercentages.operational.toFixed(1)}%)`}
            value={formatCurrencyValue(unifiedCalculations.totals.operational, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            icon={<Building className="h-6 w-6" />}
            variant="warning"
            layout="vertical"
          />

          <StatCard
            title={`إجمالي الأرباح (${unifiedCalculations.displayPercentages.profit.toFixed(1)}%)`}
            value={formatCurrencyValue(unifiedCalculations.totals.profit, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
            layout="vertical"
          />
        </div>

        {/* عرض جدول الكميات الأساسي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-success" />
              جدول كميات المنافسة ({quantityItems.length} بند)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Pagination Top */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="text-sm text-muted-foreground">
                  عرض {startIndex + 1}-{Math.min(endIndex, quantityItems.length)} من{' '}
                  {quantityItems.length} بند
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    صفحة {currentPage} من {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-auto border rounded-lg">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-card z-10 shadow-sm">
                  <tr className="bg-muted/20 border-b">
                    <th className="border border-border p-3 text-right font-semibold">رقم البند</th>
                    <th className="border border-border p-3 text-right font-semibold">وصف البند</th>
                    <th className="border border-border p-3 text-center font-semibold">الوحدة</th>
                    <th className="border border-border p-3 text-center font-semibold">الكمية</th>
                    <th className="border border-border p-3 text-center font-semibold">
                      سعر الوحدة
                    </th>
                    <th className="border border-border p-3 text-center font-semibold">
                      القيمة الإجمالية
                    </th>
                    <th className="border border-border p-3 text-center font-semibold">
                      حالة التسعير
                    </th>
                    <th className="border border-border p-3 text-center font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, index) => {
                    const itemPricing = pricingData.get(item.id)
                    const isCompleted = !!itemPricing?.completed

                    // ✅ استخدام الحسابات الموحدة من Hook (Single Source of Truth)
                    const itemCalc = unifiedCalculations.getItemCalculation(item.id)
                    const unitPrice = itemCalc?.unitPrice ?? 0
                    const itemTotal = itemCalc?.total ?? 0
                    const isInProgress = itemTotal > 0

                    // افتراضياً: الجداول مغلقة، يتم فتحها عند طلب المستخدم
                    const isExpanded = collapsedSections[item.id]?.all === false

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          className={`cursor-pointer hover:bg-muted/40 transition-colors ${isCompleted ? 'bg-success/10' : isInProgress ? 'bg-warning/10' : 'bg-destructive/10'}`}
                          onClick={() => toggleCollapse(item.id, 'all' as PricingSection)}
                        >
                          <td className="border border-border p-3 font-medium text-right">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              )}
                              {item.itemNumber}
                            </div>
                          </td>
                          <td className="border border-border p-3 text-right">
                            <div>
                              <div className="font-medium">{item.description}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.specifications}
                              </div>
                            </div>
                          </td>
                          <td className="border border-border p-3 text-center font-medium">
                            {item.unit}
                          </td>
                          <td className="border border-border p-3 text-center font-bold">
                            {item.quantity !== undefined && item.quantity !== null
                              ? formatQuantity(item.quantity)
                              : '-'}
                          </td>
                          <td className="border border-border p-3 text-center">
                            {isInProgress ? (
                              <span className="font-bold text-info">
                                {formatCurrencyValue(unitPrice, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="border border-border p-3 text-center">
                            {isInProgress ? (
                              <span className="font-bold text-success">
                                {formatCurrencyValue(itemTotal, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
                          <td
                            className="border border-border p-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  {isCompleted || isInProgress ? 'تعديل' : 'تسعير'}
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setCurrentItemIndex(startIndex + index)
                                    setCurrentView('pricing')
                                  }}
                                  className="cursor-pointer"
                                >
                                  <FileSpreadsheet className="w-4 h-4 ml-2" />
                                  <div className="flex-1">
                                    <div className="font-medium">تسعير تفصيلي</div>
                                    <div className="text-xs text-muted-foreground">
                                      إدخال تفاصيل التكاليف (مواد، عمالة، معدات)
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDirectPriceDialog({
                                      open: true,
                                      itemId: item.id,
                                      itemIndex: startIndex + index,
                                    })
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Zap className="w-4 h-4 ml-2 text-success" />
                                  <div className="flex-1">
                                    <div className="font-medium text-success">
                                      إدخال السعر مباشرة
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      إدخال سعر الوحدة دون تفاصيل التكاليف
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                                  onUpdateRow={(rowId, field, value) =>
                                    updateRowFromSummary(item.id, 'materials', rowId, field, value)
                                  }
                                  onDeleteRow={(rowId) =>
                                    deleteRowFromSummary(item.id, 'materials', rowId)
                                  }
                                  formatCurrency={formatCurrencyValue}
                                />

                                <CostSectionCard
                                  title="العمالة"
                                  type="labor"
                                  items={itemPricing?.labor}
                                  isCollapsed={!!collapsedSections[item.id]?.labor}
                                  onToggle={() => toggleCollapse(item.id, 'labor')}
                                  onAddRow={() => addRowFromSummary(item.id, 'labor')}
                                  onUpdateRow={(rowId, field, value) =>
                                    updateRowFromSummary(item.id, 'labor', rowId, field, value)
                                  }
                                  onDeleteRow={(rowId) =>
                                    deleteRowFromSummary(item.id, 'labor', rowId)
                                  }
                                  formatCurrency={formatCurrencyValue}
                                />

                                <CostSectionCard
                                  title="المعدات"
                                  type="equipment"
                                  items={itemPricing?.equipment}
                                  isCollapsed={!!collapsedSections[item.id]?.equipment}
                                  onToggle={() => toggleCollapse(item.id, 'equipment')}
                                  onAddRow={() => addRowFromSummary(item.id, 'equipment')}
                                  onUpdateRow={(rowId, field, value) =>
                                    updateRowFromSummary(item.id, 'equipment', rowId, field, value)
                                  }
                                  onDeleteRow={(rowId) =>
                                    deleteRowFromSummary(item.id, 'equipment', rowId)
                                  }
                                  formatCurrency={formatCurrencyValue}
                                />

                                <CostSectionCard
                                  title="مقاولو الباطن"
                                  type="subcontractors"
                                  items={itemPricing?.subcontractors}
                                  isCollapsed={!!collapsedSections[item.id]?.subcontractors}
                                  onToggle={() => toggleCollapse(item.id, 'subcontractors')}
                                  onAddRow={() => addRowFromSummary(item.id, 'subcontractors')}
                                  onUpdateRow={(rowId, field, value) =>
                                    updateRowFromSummary(
                                      item.id,
                                      'subcontractors',
                                      rowId,
                                      field,
                                      value,
                                    )
                                  }
                                  onDeleteRow={(rowId) =>
                                    deleteRowFromSummary(item.id, 'subcontractors', rowId)
                                  }
                                  formatCurrency={formatCurrencyValue}
                                />

                                {/* ملخص التكاليف النهائي */}
                                {itemPricing &&
                                  (() => {
                                    // حساب الإجماليات مع مراعاة الهدر للمواد
                                    const materialsTotal = itemPricing.materials.reduce(
                                      (sum, m) => {
                                        const wastageMultiplier = m.hasWaste
                                          ? 1 + (m.wastePercentage ?? 0) / 100
                                          : 1
                                        return (
                                          sum +
                                          (m.quantity ?? 0) * (m.price ?? 0) * wastageMultiplier
                                        )
                                      },
                                      0,
                                    )

                                    const laborTotal = itemPricing.labor.reduce(
                                      (sum, l) => sum + (l.total ?? 0),
                                      0,
                                    )
                                    const equipmentTotal = itemPricing.equipment.reduce(
                                      (sum, e) => sum + (e.total ?? 0),
                                      0,
                                    )
                                    const subcontractorsTotal = itemPricing.subcontractors.reduce(
                                      (sum, s) => sum + (s.total ?? 0),
                                      0,
                                    )

                                    const directCosts =
                                      materialsTotal +
                                      laborTotal +
                                      equipmentTotal +
                                      subcontractorsTotal
                                    const administrative =
                                      directCosts *
                                      ((itemPricing.additionalPercentages?.administrative ?? 0) /
                                        100)
                                    const operational =
                                      directCosts *
                                      ((itemPricing.additionalPercentages?.operational ?? 0) / 100)
                                    const profit =
                                      directCosts *
                                      ((itemPricing.additionalPercentages?.profit ?? 0) / 100)
                                    const totalCost =
                                      directCosts + administrative + operational + profit
                                    const unitPrice =
                                      item.quantity > 0 ? totalCost / item.quantity : 0

                                    return (
                                      <Card className="mt-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                                        <CardContent className="p-5">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* النسب المئوية */}
                                            <div className="space-y-3">
                                              <h4 className="font-bold text-base text-foreground mb-3 flex items-center gap-2">
                                                <svg
                                                  className="w-5 h-5 text-primary"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                  />
                                                </svg>
                                                النسب المئوية
                                              </h4>
                                              <div className="flex items-center justify-between text-sm py-2 px-3 bg-info/10 rounded-lg border border-info/30">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                  <span className="inline-block w-2 h-2 rounded-full bg-info"></span>
                                                  إداري:
                                                </span>
                                                <span className="font-semibold tabular-nums">
                                                  {itemPricing.additionalPercentages
                                                    ?.administrative ?? 0}
                                                  % ={' '}
                                                  {formatCurrencyValue(administrative, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-sm py-2 px-3 bg-warning/10 rounded-lg border border-warning/30">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                  <span className="inline-block w-2 h-2 rounded-full bg-warning"></span>
                                                  تشغيلي:
                                                </span>
                                                <span className="font-semibold tabular-nums">
                                                  {itemPricing.additionalPercentages?.operational ??
                                                    0}
                                                  % ={' '}
                                                  {formatCurrencyValue(operational, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-sm py-2 px-3 bg-success/10 rounded-lg border border-success/30">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                  <span className="inline-block w-2 h-2 rounded-full bg-success"></span>
                                                  الربح:
                                                </span>
                                                <span className="font-semibold tabular-nums">
                                                  {itemPricing.additionalPercentages?.profit ?? 0}%
                                                  ={' '}
                                                  {formatCurrencyValue(profit, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })}
                                                </span>
                                              </div>
                                            </div>

                                            {/* ملخص التكاليف */}
                                            <div className="space-y-3">
                                              <h4 className="font-bold text-base text-foreground mb-3 flex items-center gap-2">
                                                <svg
                                                  className="w-5 h-5 text-success"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                  />
                                                </svg>
                                                ملخص التكاليف
                                              </h4>
                                              <div className="flex items-center justify-between text-sm py-2 px-3 bg-card rounded-lg border">
                                                <span className="text-muted-foreground">
                                                  التكاليف المباشرة:
                                                </span>
                                                <span className="font-semibold tabular-nums">
                                                  {formatCurrencyValue(directCosts, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-sm py-2 px-3 bg-card rounded-lg border">
                                                <span className="text-muted-foreground">
                                                  إداري + تشغيلي:
                                                </span>
                                                <span className="font-semibold tabular-nums">
                                                  {formatCurrencyValue(
                                                    administrative + operational,
                                                    {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    },
                                                  )}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-sm py-2 px-3 bg-card rounded-lg border">
                                                <span className="text-muted-foreground">
                                                  الربح:
                                                </span>
                                                <span className="font-semibold tabular-nums">
                                                  {formatCurrencyValue(profit, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-base py-3 px-3 bg-success/10 rounded-lg border-2 border-success/30">
                                                <span className="font-bold text-success">
                                                  إجمالي البند:
                                                </span>
                                                <span className="font-bold text-xl text-success tabular-nums">
                                                  {formatCurrencyValue(totalCost, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-base py-3 px-3 bg-primary/10 rounded-lg border-2 border-primary/30">
                                                <span className="font-bold text-primary">
                                                  سعر الوحدة:
                                                </span>
                                                <span className="font-bold text-xl text-primary tabular-nums">
                                                  {formatCurrencyValue(unitPrice, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })}
                                                </span>
                                              </div>
                                              {onSaveItem && (
                                                <Button
                                                  onClick={() => onSaveItem(item.id)}
                                                  className="w-full mt-2 bg-success hover:bg-success/90"
                                                  size="sm"
                                                >
                                                  <Save className="h-4 w-4 ml-2" />
                                                  حفظ تسعير البند
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )
                                  })()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bottom */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>
                <span className="text-sm px-3">
                  صفحة {currentPage} من {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ملخص مالي */}
        {unifiedCalculations.totals.projectTotal > 0 && (
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
                      {formatCurrencyValue(unifiedCalculations.totals.items, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                    <span className="font-medium">
                      إجمالي التكاليف الإدارية (
                      {unifiedCalculations.displayPercentages.administrative.toFixed(1)}%):
                    </span>
                    <span className="font-bold text-warning">
                      {formatCurrencyValue(unifiedCalculations.totals.administrative, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/30">
                    <span className="font-medium">
                      إجمالي التكاليف التشغيلية (
                      {unifiedCalculations.displayPercentages.operational.toFixed(1)}%):
                    </span>
                    <span className="font-bold text-warning">
                      {formatCurrencyValue(unifiedCalculations.totals.operational, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <span className="font-medium">ضريبة القيمة المضافة (15%):</span>
                    <span className="font-bold text-muted-foreground">
                      {formatCurrencyValue(unifiedCalculations.totals.vat, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning/15 rounded-lg">
                    <span className="font-medium">
                      إجمالي الأرباح ({unifiedCalculations.displayPercentages.profit.toFixed(1)}%):
                    </span>
                    <span className="font-bold text-warning">
                      {formatCurrencyValue(unifiedCalculations.totals.profit, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center p-4 bg-success/10 rounded-lg">
                  <span className="font-bold text-lg">القيمة الإجمالية النهائية:</span>
                  <span className="font-bold text-xl text-success">
                    {formatCurrencyValue(unifiedCalculations.totals.projectTotal, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <BackToTop />

      {/* Direct Price Input Dialog */}
      {directPriceDialog && (
        <DirectPriceInputDialog
          open={directPriceDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setDirectPriceDialog(null)
            }
          }}
          itemNumber={quantityItems[directPriceDialog.itemIndex]?.itemNumber || ''}
          itemDescription={quantityItems[directPriceDialog.itemIndex]?.description || ''}
          itemUnit={quantityItems[directPriceDialog.itemIndex]?.unit || ''}
          itemQuantity={quantityItems[directPriceDialog.itemIndex]?.quantity || 0}
          defaultPercentages={defaultPercentages}
          onSave={(unitPrice) => {
            if (onSaveDirectPrice) {
              onSaveDirectPrice(directPriceDialog.itemId, unitPrice)
            }
            setDirectPriceDialog(null)
          }}
          formatCurrency={formatCurrencyValue}
        />
      )}
    </>
  )
}
