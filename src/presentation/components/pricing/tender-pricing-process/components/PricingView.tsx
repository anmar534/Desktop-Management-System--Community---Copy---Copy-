import React, { useMemo } from 'react'
import { Calculator, ArrowRight, Save, BarChart3, FileText } from 'lucide-react'

import { MaterialsSection } from '@/presentation/pages/Tenders/TenderPricing/sections/MaterialsSection'
import { LaborSection } from '@/presentation/pages/Tenders/TenderPricing/sections/LaborSection'
import { EquipmentSection } from '@/presentation/pages/Tenders/TenderPricing/sections/EquipmentSection'
import { SubcontractorsSection } from '@/presentation/pages/Tenders/TenderPricing/sections/SubcontractorsSection'
import { ActionBar } from '@/presentation/components/ui/layout/ActionBar'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { ConfirmationDialog } from '@/presentation/components/ui/confirmation-dialog'
import { Input } from '@/presentation/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Textarea } from '@/presentation/components/ui/textarea'
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
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
  ) => string
  formatQuantity: (value: number | string | null | undefined, options?: unknown) => string
  onExecutionMethodChange: (value: ExecutionMethod) => void
  onPercentageChange: (key: keyof PricingPercentages, value: number) => void
  onTechnicalNotesChange: (value: string) => void
  onAddRow: (section: PricingSection) => void
  onUpdateRow: (section: PricingSection, id: string, field: string, value: unknown) => void
  onDeleteRow: (section: PricingSection, id: string) => void
  onSave: () => void
  onNavigatePrev: () => void
  onNavigateNext: () => void
  canNavigatePrev: boolean
  canNavigateNext: boolean
  currentItemIndex: number
  totalItems: number
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
  onSave,
  onNavigatePrev,
  onNavigateNext,
  canNavigatePrev,
  canNavigateNext,
  currentItemIndex,
  totalItems,
}) => {
  const totals = useMemo(() => calculateTotals(), [calculateTotals])

  if (!currentItem) {
    return null
  }

  const unitPrice = currentItem.quantity > 0 ? totals.total / currentItem.quantity : 0

  // Create wrapper functions for new components
  const handleMaterialsUpdate = (materials: MaterialRow[]) => {
    materials.forEach((material, index) => {
      const oldMaterial = currentPricing.materials[index]
      if (!oldMaterial) return

      // Update only changed fields
      Object.keys(material).forEach((key) => {
        const field = key as keyof MaterialRow
        if (material[field] !== oldMaterial[field]) {
          onUpdateRow('materials', material.id, field, material[field])
        }
      })
    })
  }

  const handleLaborUpdate = (labor: LaborRow[]) => {
    labor.forEach((laborItem, index) => {
      const oldItem = currentPricing.labor[index]
      if (!oldItem) return

      Object.keys(laborItem).forEach((key) => {
        const field = key as keyof LaborRow
        if (laborItem[field] !== oldItem[field]) {
          onUpdateRow('labor', laborItem.id, field, laborItem[field])
        }
      })
    })
  }

  const handleEquipmentUpdate = (equipment: EquipmentRow[]) => {
    equipment.forEach((equipmentItem, index) => {
      const oldItem = currentPricing.equipment[index]
      if (!oldItem) return

      Object.keys(equipmentItem).forEach((key) => {
        const field = key as keyof EquipmentRow
        if (equipmentItem[field] !== oldItem[field]) {
          onUpdateRow('equipment', equipmentItem.id, field, equipmentItem[field])
        }
      })
    })
  }

  const handleSubcontractorsUpdate = (subcontractors: SubcontractorRow[]) => {
    subcontractors.forEach((subcontractor, index) => {
      const oldItem = currentPricing.subcontractors[index]
      if (!oldItem) return

      Object.keys(subcontractor).forEach((key) => {
        const field = key as keyof SubcontractorRow
        if (subcontractor[field] !== oldItem[field]) {
          onUpdateRow('subcontractors', subcontractor.id, field, subcontractor[field])
        }
      })
    })
  }

  const renderSection = (section: PricingSection) => {
    // Use new components instead of inline rendering
    switch (section) {
      case 'materials':
        return (
          <MaterialsSection
            key="materials"
            materials={currentPricing.materials}
            onUpdate={handleMaterialsUpdate}
            onAdd={() => onAddRow('materials')}
          />
        )
      case 'labor':
        return (
          <LaborSection
            key="labor"
            labor={currentPricing.labor}
            onUpdate={handleLaborUpdate}
            onAdd={() => onAddRow('labor')}
          />
        )
      case 'equipment':
        return (
          <EquipmentSection
            key="equipment"
            equipment={currentPricing.equipment}
            onUpdate={handleEquipmentUpdate}
            onAdd={() => onAddRow('equipment')}
          />
        )
      case 'subcontractors':
        return (
          <SubcontractorsSection
            key="subcontractors"
            subcontractors={currentPricing.subcontractors}
            onUpdate={handleSubcontractorsUpdate}
            onAdd={() => onAddRow('subcontractors')}
          />
        )
      default:
        return null
    }
  }

  return (
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
              <p className="text-sm font-bold text-success">
                {formatQuantity(currentItem.quantity)}
              </p>
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

          {(['administrative', 'operational', 'profit'] as (keyof PricingPercentages)[]).map(
            (key) => (
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
            ),
          )}
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
            <p className="text-sm font-semibold text-secondary">
              {formatCurrency(totals.subcontractors)}
            </p>
          </div>
          <div className="rounded-lg border border-muted/40 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">سعر الوحدة</p>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(unitPrice)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">{SECTION_ORDER.map((section) => renderSection(section))}</div>

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
                <span className="text-lg font-bold text-success">
                  {formatCurrency(totals.total)}
                </span>
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
  )
}
