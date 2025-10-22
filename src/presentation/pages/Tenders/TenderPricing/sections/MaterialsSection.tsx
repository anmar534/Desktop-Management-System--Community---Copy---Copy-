/**
 * @fileoverview MaterialsSection Component
 * @description Section for managing material costs
 */

import { Plus, Package } from 'lucide-react'
import { CostSectionCard } from '../components/CostSectionCard'
import { PricingRow } from '../components/PricingRow'
import { Button } from '@/presentation/components/ui/button'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import type { MaterialRow } from '@/shared/types/pricing'

interface MaterialsSectionProps {
  materials: MaterialRow[]
  onUpdate: (materials: MaterialRow[]) => void
  onAdd?: () => void
  onClear?: () => void
  readOnly?: boolean
}

export function MaterialsSection({
  materials,
  onUpdate,
  onAdd,
  onClear,
  readOnly = false,
}: MaterialsSectionProps) {
  const { formatCurrencyValue } = useCurrencyFormatter()

  const total = materials.reduce((sum, item) => {
    const baseTotal = (item.quantity || 0) * (item.price || 0)
    const wasteAmount = item.hasWaste ? baseTotal * ((item.wastePercentage || 0) / 100) : 0
    return sum + baseTotal + wasteAmount
  }, 0)

  const formatQuantity = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const handleAddRow = () => {
    if (onAdd) {
      onAdd()
    } else {
      const newMaterial: MaterialRow = {
        id: `material-${Date.now()}`,
        description: '',
        unit: '',
        quantity: 0,
        price: 0,
        total: 0,
        hasWaste: false,
        wastePercentage: 0,
      }
      onUpdate([...materials, newMaterial])
    }
  }

  const handleUpdateRow = (index: number, field: string, value: unknown) => {
    onUpdate(
      materials.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        const baseTotal = (updated.quantity || 0) * (updated.price || 0)
        const wasteAmount = updated.hasWaste
          ? baseTotal * ((updated.wastePercentage || 0) / 100)
          : 0
        updated.total = baseTotal + wasteAmount
        return updated
      }),
    )
  }

  const handleDuplicateRow = (index: number) => {
    const item = materials[index]
    if (!item) return
    const duplicated: MaterialRow = {
      ...item,
      id: `material-${Date.now()}`,
      description: `${item.description} (نسخة)`,
    }
    onUpdate([...materials, duplicated])
  }

  const handleDeleteRow = (index: number) => {
    onUpdate(materials.filter((_, i) => i !== index))
  }

  const handleClear = () => {
    if (onClear) {
      onClear()
    } else {
      onUpdate([])
    }
  }

  return (
    <CostSectionCard
      title="المواد"
      icon={Package}
      total={total}
      itemCount={materials.length}
      formatCurrency={formatCurrencyValue}
      onAdd={!readOnly ? handleAddRow : undefined}
      onClear={!readOnly && materials.length > 0 ? handleClear : undefined}
    >
      <div className="space-y-2">
        {materials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">لا توجد مواد مضافة</p>
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={handleAddRow} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                إضافة مادة
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-muted-foreground bg-muted/50">
                  <th className="p-2 text-right">الوصف</th>
                  <th className="p-2 text-right">الكمية</th>
                  <th className="p-2 text-right">الوحدة</th>
                  <th className="p-2 text-right">السعر</th>
                  <th className="p-2 text-center">هدر</th>
                  <th className="p-2 text-right">نسبة الهدر</th>
                  <th className="p-2 text-right">الإجمالي</th>
                  <th className="p-2 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material, index) => (
                  <PricingRow
                    key={material.id}
                    index={index}
                    item={material}
                    onUpdate={handleUpdateRow}
                    onDuplicate={handleDuplicateRow}
                    onDelete={handleDeleteRow}
                    formatCurrency={formatCurrencyValue}
                    formatQuantity={formatQuantity}
                    showWaste={true}
                    readOnly={readOnly}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!readOnly && materials.length > 0 && (
        <div className="flex justify-end mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة صف
          </Button>
        </div>
      )}
    </CostSectionCard>
  )
}
