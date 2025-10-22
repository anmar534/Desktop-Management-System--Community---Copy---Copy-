/**
 * @fileoverview EquipmentSection Component
 * @description Section for managing equipment costs
 */

import { Plus, Wrench } from 'lucide-react'
import { CostSectionCard } from '../components/CostSectionCard'
import { PricingRow } from '../components/PricingRow'
import { Button } from '@/presentation/components/ui/button'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'
import type { EquipmentRow } from '@/shared/types/pricing'

interface EquipmentSectionProps {
  equipment: EquipmentRow[]
  onUpdate: (equipment: EquipmentRow[]) => void
  onAdd?: () => void
  onClear?: () => void
  readOnly?: boolean
}

export function EquipmentSection({
  equipment,
  onUpdate,
  onAdd,
  onClear,
  readOnly = false,
}: EquipmentSectionProps) {
  const { formatCurrencyValue } = useCurrencyFormatter()

  const total = equipment.reduce((sum, item) => sum + (item.total || 0), 0)

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
      const newEquipment: EquipmentRow = {
        id: `equipment-${Date.now()}`,
        description: '',
        unit: '',
        quantity: 0,
        price: 0,
        total: 0,
      }
      onUpdate([...equipment, newEquipment])
    }
  }

  const handleUpdateRow = (index: number, field: string, value: unknown) => {
    onUpdate(
      equipment.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        updated.total = (updated.quantity || 0) * (updated.price || 0)
        return updated
      }),
    )
  }

  const handleDuplicateRow = (index: number) => {
    const item = equipment[index]
    if (!item) return
    const duplicated: EquipmentRow = {
      ...item,
      id: `equipment-${Date.now()}`,
      description: `${item.description} (نسخة)`,
    }
    onUpdate([...equipment, duplicated])
  }

  const handleDeleteRow = (index: number) => {
    onUpdate(equipment.filter((_, i) => i !== index))
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
      title="المعدات"
      icon={Wrench}
      total={total}
      itemCount={equipment.length}
      formatCurrency={formatCurrencyValue}
      onAdd={!readOnly ? handleAddRow : undefined}
      onClear={!readOnly && equipment.length > 0 ? handleClear : undefined}
    >
      <div className="space-y-2">
        {equipment.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">لا توجد معدات مضافة</p>
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={handleAddRow} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                إضافة معدة
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
                  <th className="p-2 text-right">الإجمالي</th>
                  <th className="p-2 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item, index) => (
                  <PricingRow
                    key={item.id}
                    index={index}
                    item={item}
                    onUpdate={handleUpdateRow}
                    onDuplicate={handleDuplicateRow}
                    onDelete={handleDeleteRow}
                    formatCurrency={formatCurrencyValue}
                    formatQuantity={formatQuantity}
                    showWaste={false}
                    readOnly={readOnly}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!readOnly && equipment.length > 0 && (
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
