import React, { useMemo, useState } from 'react'
import {
  Calculator,
  ArrowRight,
  Save,
  Plus,
  ChevronDown,
  ChevronUp,
  Package,
  Users,
  Truck,
  Building,
  DollarSign,
  Settings,
  Percent,
  BarChart3,
  FileText,
  Trash2,
} from 'lucide-react'

import { UNIT_OPTIONS } from '../constants'
import { ActionBar } from '@/presentation/components/ui/layout/ActionBar'
import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import { ConfirmationDialog } from '@/presentation/components/ui/confirmation-dialog'
import { Input } from '@/presentation/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { ScrollArea } from '@/presentation/components/ui/scroll-area'
import { Textarea } from '@/presentation/components/ui/textarea'
import { cn } from '@/presentation/components/ui/utils'
import { confirmationMessages } from '@/shared/config/confirmationMessages'
import type {
  ExecutionMethod,
  PricingData,
  PricingPercentages,
  MaterialRow,
  LaborRow,
  EquipmentRow,
  SubcontractorRow,
} from '@/shared/types/pricing'

const SECTION_ORDER = ['materials', 'labor', 'equipment', 'subcontractors'] as const

type PricingSection = (typeof SECTION_ORDER)[number]

interface SectionRowMap {
  materials: MaterialRow
  labor: LaborRow
  equipment: EquipmentRow
  subcontractors: SubcontractorRow
}

type UpdateRowFn = <Section extends PricingSection, Field extends keyof SectionRowMap[Section]>(
  section: Section,
  id: string,
  field: Field,
  value: SectionRowMap[Section][Field]
) => void

interface PricingViewProps {
  currentItem:
    | {
        id: string
        itemNumber: string
        description: string
        unit: string
        quantity: number
        specifications?: string
      }
    | undefined
  currentPricing: PricingData
  calculateTotals: () => {
    materials: number
    labor: number
    equipment: number
    subcontractors: number
    subtotal: number
    administrative: number
    operational: number
    profit: number
    total: number
  }
  formatCurrency: (
    value: number,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
  ) => string
  formatQuantity: (value: number | string | null | undefined, options?: unknown) => string
  onExecutionMethodChange: (value: ExecutionMethod) => void
  onPercentageChange: (key: keyof PricingPercentages, value: number) => void
  onTechnicalNotesChange: (value: string) => void
  onAddRow: (section: PricingSection) => void
  onUpdateRow: UpdateRowFn
  onDeleteRow: (section: PricingSection, id: string) => void
  onSave: () => void
  onNavigatePrev: () => void
  onNavigateNext: () => void
  canNavigatePrev: boolean
  canNavigateNext: boolean
  currentItemIndex: number
  totalItems: number
}

const SECTION_CONFIG: Record<
  PricingSection,
  {
    label: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    badgeClass: string
    headerClass: string
    borderClass: string
    totalClass: string
  }
> = {
  materials: {
    label: 'المواد والخامات',
    icon: Package,
    badgeClass: 'bg-info/10 text-info',
    headerClass: 'bg-info/10 border-info/30',
    borderClass: 'border-info/30',
    totalClass: 'text-info',
  },
  labor: {
    label: 'العمالة',
    icon: Users,
    badgeClass: 'bg-success/10 text-success',
    headerClass: 'bg-success/10 border-success/30',
    borderClass: 'border-success/30',
    totalClass: 'text-success',
  },
  equipment: {
    label: 'المعدات والآلات',
    icon: Truck,
    badgeClass: 'bg-accent/10 text-accent',
    headerClass: 'bg-accent/10 border-accent/30',
    borderClass: 'border-accent/30',
    totalClass: 'text-accent',
  },
  subcontractors: {
    label: 'مقاولو الباطن',
    icon: Building,
    badgeClass: 'bg-secondary/10 text-secondary',
    headerClass: 'bg-secondary/10 border-secondary/30',
    borderClass: 'border-secondary/30',
    totalClass: 'text-secondary',
  },
}

export const PricingView: React.FC<PricingViewProps> = ({
  currentItem,
  currentPricing,
  calculateTotals,
  formatCurrency,
  formatQuantity,
  onExecutionMethodChange,
  onPercentageChange,
  onTechnicalNotesChange,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  onSave,
  onNavigatePrev,
  onNavigateNext,
  canNavigatePrev,
  canNavigateNext,
  currentItemIndex,
  totalItems,
}) => {
  const totals = useMemo(() => calculateTotals(), [calculateTotals])
  const [expandedSections, setExpandedSections] = useState<Record<PricingSection, boolean>>({
    materials: true,
    labor: false,
    equipment: false,
    subcontractors: false,
  })

  if (!currentItem) {
    return null
  }

  const unitPrice = currentItem.quantity > 0 ? totals.total / currentItem.quantity : 0

  const toggleSection = (section: PricingSection) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleAddRow = (section: PricingSection) => {
    if (!expandedSections[section]) {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: true,
      }))
    }
    onAddRow(section)
  }

  const renderSection = (section: PricingSection) => {
    const config = SECTION_CONFIG[section]
  const rows = currentPricing[section] as SectionRowMap[PricingSection][]
    const Icon = config.icon
    const sectionTotal = rows.reduce((sum, row) => sum + (row.total || 0), 0)
    const isMaterials = section === 'materials'
    const unitOptions = UNIT_OPTIONS[section] ?? []

    return (
      <Card key={section} className={cn('border shadow-sm', config.borderClass)}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleSection(section)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              toggleSection(section)
            }
          }}
          className={cn(
            'flex cursor-pointer items-center justify-between rounded-t-lg border-b p-4',
            config.headerClass
          )}
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card">
              <Icon className={cn('h-5 w-5', config.totalClass)} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{config.label}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className={cn('font-medium', config.badgeClass)}>
                  {rows.length} صف
                </Badge>
                <span>•</span>
                <span>الإجمالي: {formatCurrency(sectionTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation()
                handleAddRow(section)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة صف
            </Button>
            {expandedSections[section] ? (
              <ChevronUp className={cn('h-5 w-5', config.totalClass)} />
            ) : (
              <ChevronDown className={cn('h-5 w-5', config.totalClass)} />
            )}
          </div>
        </div>

        {expandedSections[section] && (
          <CardContent className="p-0" dir="rtl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/20 text-xs">
                  <tr>
                    {isMaterials && <th className="border border-border p-2 text-right">اسم المادة</th>}
                    <th className="border border-border p-2 text-right">الوصف</th>
                    <th className="border border-border p-2 text-center">الوحدة</th>
                    <th className="border border-border p-2 text-center">الكمية</th>
                    {isMaterials && <th className="border border-border p-2 text-center">فاقد</th>}
                    {isMaterials && <th className="border border-border p-2 text-center">نسبة الفاقد (%)</th>}
                    <th className="border border-border p-2 text-center">السعر</th>
                    <th className="border border-border p-2 text-center">الإجمالي</th>
                    <th className="border border-border p-2 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isMaterials ? 8 : 6}
                        className="p-8 text-center text-sm text-muted-foreground"
                      >
                        لا توجد صفوف. اضغط على زر الإضافة لبدء التسعير.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const rowUnitOptions = unitOptions
                      const hasCustomUnit = Boolean(
                        row.unit && !rowUnitOptions.some((option) => option.value === row.unit)
                      )

                      return (
                        <tr key={row.id} className="odd:bg-muted/10">
                          {isMaterials && (
                            <td className="border border-border p-2">
                              <Input
                                value={(row as MaterialRow).name ?? ''}
                                onChange={(event) =>
                                  onUpdateRow(
                                    'materials',
                                    row.id,
                                    'name',
                                    event.target.value as MaterialRow['name']
                                  )
                                }
                                placeholder="اسم المادة"
                                className="h-8 text-sm"
                              />
                            </td>
                          )}
                          <td className="border border-border p-2">
                            <Input
                              value={row.description ?? ''}
                              onChange={(event) =>
                                onUpdateRow(
                                  section,
                                  row.id,
                                  'description',
                                  event.target.value as SectionRowMap[PricingSection]['description']
                                )
                              }
                              placeholder="الوصف"
                              className="h-8 text-sm"
                            />
                          </td>
                          <td className="border border-border p-2">
                            <Select
                              value={row.unit || undefined}
                              onValueChange={(value) =>
                                onUpdateRow(section, row.id, 'unit', value as SectionRowMap[PricingSection]['unit'])
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="اختر وحدة" />
                              </SelectTrigger>
                              <SelectContent>
                                {hasCustomUnit && row.unit && !rowUnitOptions.some(opt => opt.value === row.unit) ? (
                                  <SelectItem value={row.unit}>{row.unit}</SelectItem>
                                ) : null}
                                {rowUnitOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="border border-border p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.quantity ?? 0}
                              onChange={(event) =>
                                onUpdateRow(
                                  section,
                                  row.id,
                                  'quantity',
                                  Number(event.target.value) as SectionRowMap[PricingSection]['quantity']
                                )
                              }
                              className="h-8 text-center text-sm"
                            />
                          </td>
                          {isMaterials && (
                            <td className="border border-border p-2 text-center">
                              <Checkbox
                                checked={(row as MaterialRow).hasWaste ?? false}
                                onCheckedChange={(checked) =>
                                  onUpdateRow(
                                    'materials',
                                    row.id,
                                    'hasWaste',
                                    Boolean(checked) as MaterialRow['hasWaste']
                                  )
                                }
                              />
                            </td>
                          )}
                          {isMaterials && (
                            <td className="border border-border p-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={(row as MaterialRow).wastePercentage ?? 0}
                                onChange={(event) =>
                                  onUpdateRow(
                                    'materials',
                                    row.id,
                                    'wastePercentage',
                                    Number(event.target.value) as MaterialRow['wastePercentage']
                                  )
                                }
                                disabled={!(row as MaterialRow).hasWaste}
                                className="h-8 text-center text-sm"
                              />
                            </td>
                          )}
                          <td className="border border-border p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.price ?? 0}
                              onChange={(event) =>
                                onUpdateRow(
                                  section,
                                  row.id,
                                  'price',
                                  Number(event.target.value) as SectionRowMap[PricingSection]['price']
                                )
                              }
                              className="h-8 text-center text-sm"
                            />
                          </td>
                          <td className="border border-border p-2 text-center font-semibold">
                            {formatCurrency(row.total ?? 0)}
                          </td>
                          <td className="border border-border p-2 text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onDeleteRow(section, row.id)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">
      <div className="space-y-4 p-1 pb-24" dir="rtl">
        <Card className="border-info/30 bg-info/10">
          <CardHeader className="p-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-info" />
                <span className="font-semibold">
                  تسعير البند رقم {currentItem.itemNumber} ({currentItemIndex + 1} من {totalItems})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNavigatePrev}
                  disabled={!canNavigatePrev}
                >
                  البند السابق
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNavigateNext}
                  disabled={!canNavigateNext}
                >
                  البند التالي
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">وصف البند</p>
                <p className="text-sm font-medium text-foreground" title={currentItem.description}>
                  {currentItem.description}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الوحدة</p>
                <p className="text-sm font-semibold text-info">{currentItem.unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الكمية</p>
                <p className="text-sm font-bold text-success">{formatQuantity(currentItem.quantity)}</p>
              </div>
            </div>
            {currentItem.specifications ? (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">المواصفات الفنية</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {currentItem.specifications}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 p-3 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">طريقة التنفيذ</p>
              <Select
                value={currentPricing.executionMethod ?? 'ذاتي'}
                onValueChange={(value) => onExecutionMethodChange(value as ExecutionMethod)}
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

            {(['administrative', 'operational', 'profit'] as (keyof PricingPercentages)[]).map((key) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {key === 'administrative' && 'النسبة الإدارية (%)'}
                  {key === 'operational' && 'النسبة التشغيلية (%)'}
                  {key === 'profit' && 'نسبة الربح (%)'}
                </p>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={currentPricing.additionalPercentages?.[key] ?? 0}
                  onChange={(event) => onPercentageChange(key, Number(event.target.value) || 0)}
                  className="h-8 text-center text-sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 p-3 md:grid-cols-5">
            <div className="rounded-lg border border-info/30 bg-info/10 p-3">
              <p className="text-xs text-muted-foreground">إجمالي المواد</p>
              <p className="text-sm font-semibold text-info">{formatCurrency(totals.materials)}</p>
            </div>
            <div className="rounded-lg border border-success/30 bg-success/10 p-3">
              <p className="text-xs text-muted-foreground">إجمالي العمالة</p>
              <p className="text-sm font-semibold text-success">{formatCurrency(totals.labor)}</p>
            </div>
            <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
              <p className="text-xs text-muted-foreground">إجمالي المعدات</p>
              <p className="text-sm font-semibold text-accent">{formatCurrency(totals.equipment)}</p>
            </div>
            <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-3">
              <p className="text-xs text-muted-foreground">إجمالي المقاولين</p>
              <p className="text-sm font-semibold text-secondary">{formatCurrency(totals.subcontractors)}</p>
            </div>
            <div className="rounded-lg border border-muted/40 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">سعر الوحدة</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(unitPrice)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {SECTION_ORDER.map((section) => renderSection(section))}
        </div>

        <Card>
          <CardHeader className="p-3">
            <div className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-muted-foreground" />
              الملاحظات الفنية
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <Textarea
              value={currentPricing.technicalNotes ?? ''}
              onChange={(event) => onTechnicalNotesChange(event.target.value)}
              rows={4}
              placeholder="أضف أي ملاحظات فنية خاصة بهذا البند..."
              className="text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <div className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-5 w-5 text-success" />
              الملخص المالي للبند
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-muted/30 bg-muted/10 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>التكاليف المباشرة</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>التكاليف الإدارية</span>
                  <span className="font-semibold">{formatCurrency(totals.administrative)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>التكاليف التشغيلية</span>
                  <span className="font-semibold">{formatCurrency(totals.operational)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>الربح</span>
                  <span className="font-semibold">{formatCurrency(totals.profit)}</span>
                </div>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/10 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>الإجمالي النهائي</span>
                  <span className="text-lg font-bold text-success">{formatCurrency(totals.total)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>سعر الوحدة</span>
                  <span className="font-semibold">{formatCurrency(unitPrice)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ActionBar sticky position="bottom" align="center" elevated className="z-20">
          <div className="flex flex-wrap items-center justify-center gap-3" dir="rtl">
            <Button
              onClick={onNavigatePrev}
              disabled={!canNavigatePrev}
              variant="outline"
              className="flex items-center gap-2 px-4"
            >
              <ArrowRight className="h-4 w-4" />
              البند السابق
            </Button>

            <ConfirmationDialog
              title={confirmationMessages.saveItem.title}
              description={confirmationMessages.saveItem.description}
              confirmText={confirmationMessages.saveItem.confirmText}
              cancelText={confirmationMessages.saveItem.cancelText}
              variant="success"
              icon="save"
              onConfirm={onSave}
              trigger={
                <Button className="flex items-center gap-2 bg-success text-success-foreground hover:bg-success/90 px-6">
                  <Save className="h-4 w-4" />
                  حفظ تسعير البند
                </Button>
              }
            />

            <Button
              onClick={onNavigateNext}
              disabled={!canNavigateNext}
              variant="outline"
              className="flex items-center gap-2 px-4"
            >
              البند التالي
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </ActionBar>
      </div>
    </ScrollArea>
  )
}

