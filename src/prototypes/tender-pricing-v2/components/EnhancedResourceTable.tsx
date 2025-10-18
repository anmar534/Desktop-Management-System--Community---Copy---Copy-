/**
 * Enhanced Resource Table Component
 * جدول الموارد المحسّن - نموذج أولي
 *
 * الميزات الجديدة:
 * - Inline editing محسّن
 * - نسخ ولصق الصفوف
 * - تكرار سريع
 * - اختصارات لوحة المفاتيح
 * - حساب تلقائي
 * - sticky header
 */

import { useState } from 'react'
import {
  Package,
  Users,
  Truck,
  Building2,
  Plus,
  Copy,
  Trash2,
  MoreVertical,
  ClipboardPaste,
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/components/ui/utils'
import type {
  MockMaterialRow,
  MockLaborRow,
  MockEquipmentRow,
  MockSubcontractorRow,
} from '../mockData'

type ResourceRow = MockMaterialRow | MockLaborRow | MockEquipmentRow | MockSubcontractorRow

interface EnhancedResourceTableProps {
  type: 'materials' | 'labor' | 'equipment' | 'subcontractors'
  resources: ResourceRow[]
  onChange: (resources: ResourceRow[]) => void
  formatCurrency: (value: number) => string
}

const RESOURCE_CONFIG = {
  materials: {
    icon: Package,
    label: 'المواد',
    color: 'blue',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    accentColor: 'bg-blue-50',
  },
  labor: {
    icon: Users,
    label: 'العمالة',
    color: 'purple',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    accentColor: 'bg-purple-50',
  },
  equipment: {
    icon: Truck,
    label: 'المعدات',
    color: 'orange',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-600',
    accentColor: 'bg-orange-50',
  },
  subcontractors: {
    icon: Building2,
    label: 'مقاولو الباطن',
    color: 'green',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    accentColor: 'bg-green-50',
  },
}

const UNIT_OPTIONS = {
  materials: [
    { value: 'م', label: 'متر' },
    { value: 'م²', label: 'متر مربع' },
    { value: 'م³', label: 'متر مكعب' },
    { value: 'كجم', label: 'كيلوجرام' },
    { value: 'طن', label: 'طن' },
    { value: 'قطعة', label: 'قطعة' },
    { value: 'لتر', label: 'لتر' },
    { value: 'كيس', label: 'كيس' },
  ],
  labor: [
    { value: 'يوم عمل', label: 'يوم عمل' },
    { value: 'ساعة', label: 'ساعة' },
    { value: 'شهر', label: 'شهر' },
  ],
  equipment: [
    { value: 'ساعة', label: 'ساعة' },
    { value: 'يوم', label: 'يوم' },
    { value: 'شهر', label: 'شهر' },
  ],
  subcontractors: [
    { value: 'م', label: 'متر' },
    { value: 'م²', label: 'متر مربع' },
    { value: 'نقطة', label: 'نقطة' },
    { value: 'مجموع', label: 'مجموع' },
  ],
}

export const EnhancedResourceTable: React.FC<EnhancedResourceTableProps> = ({
  type,
  resources,
  onChange,
  formatCurrency,
}) => {
  const [copiedRow, setCopiedRow] = useState<ResourceRow | null>(null)

  const config = RESOURCE_CONFIG[type]
  const Icon = config.icon
  const units = UNIT_OPTIONS[type]

  const generateId = () => `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const addRow = (templateRow?: Partial<ResourceRow>) => {
    const newRow: ResourceRow = {
      id: generateId(),
      description: '',
      unit: units[0].value,
      quantity: 0,
      price: 0,
      total: 0,
      ...(type === 'materials' && { wastage: 0 }),
      ...(type === 'equipment' && { hours: 0 }),
      ...templateRow,
    } as ResourceRow

    onChange([...resources, newRow])
  }

  const updateRow = (id: string, updates: Partial<ResourceRow>) => {
    onChange(
      resources.map((r) => {
        if (r.id !== id) return r

        const updated = { ...r, ...updates }
        // حساب الإجمالي تلقائياً
        const quantity = updates.quantity !== undefined ? updates.quantity : r.quantity
        const price = updates.price !== undefined ? updates.price : r.price
        updated.total = quantity * price

        return updated
      }),
    )
  }

  const deleteRow = (id: string) => {
    onChange(resources.filter((r) => r.id !== id))
  }

  const duplicateRow = (row: ResourceRow) => {
    const newRow = { ...row, id: generateId() }
    onChange([...resources, newRow])
  }

  const totalAmount = resources.reduce((sum, r) => sum + r.total, 0)

  return (
    <div className="space-y-4">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              config.accentColor,
            )}
          >
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-foreground">{config.label}</h4>
            <p className="text-xs text-muted-foreground">
              {resources.length} {resources.length === 1 ? 'عنصر' : 'عناصر'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {copiedRow && (
            <Button variant="outline" size="sm" onClick={() => addRow(copiedRow)} className="h-10">
              <ClipboardPaste className="h-4 w-4 ml-2" />
              <span>لصق</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addRow()}
            className={cn('h-10 font-semibold', config.borderColor, 'hover:' + config.accentColor)}
          >
            <Plus className="h-4 w-4 ml-2" />
            <span>إضافة {config.label === 'المواد' ? 'مادة' : 'عنصر'}</span>
          </Button>
        </div>
      </div>

      {/* الجدول */}
      {resources.length > 0 ? (
        <Card className={cn('overflow-hidden', config.borderColor)}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="border-b-2">
                  <th className="text-right p-4 text-sm font-bold w-12">#</th>
                  <th className="text-right p-4 text-sm font-bold min-w-[300px]">الوصف</th>
                  <th className="text-right p-4 text-sm font-bold w-32">الوحدة</th>
                  <th className="text-right p-4 text-sm font-bold w-36">الكمية</th>
                  <th className="text-right p-4 text-sm font-bold w-40">السعر (ر.س)</th>
                  <th className="text-right p-4 text-sm font-bold w-44">الإجمالي (ر.س)</th>
                  {type === 'materials' && (
                    <th className="text-right p-4 text-sm font-bold w-28">الهدر (%)</th>
                  )}
                  {type === 'equipment' && (
                    <th className="text-right p-4 text-sm font-bold w-28">الساعات</th>
                  )}
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {resources.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors group">
                    <td className="p-4 text-sm text-muted-foreground tabular-nums">{index + 1}</td>
                    <td className="p-4">
                      <Input
                        value={row.description}
                        onChange={(e) => updateRow(row.id, { description: e.target.value })}
                        placeholder="وصف العنصر..."
                        className="h-11 border-primary/20 focus:border-primary"
                      />
                    </td>
                    <td className="p-4">
                      <Select
                        value={row.unit}
                        onValueChange={(value) => updateRow(row.id, { unit: value })}
                      >
                        <SelectTrigger className="h-11 border-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">
                      <Input
                        type="number"
                        value={row.quantity || ''}
                        onChange={(e) =>
                          updateRow(row.id, { quantity: parseFloat(e.target.value) || 0 })
                        }
                        className="h-11 text-right font-mono tabular-nums border-primary/20 focus:border-primary"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="p-4">
                      <Input
                        type="number"
                        value={row.price || ''}
                        onChange={(e) =>
                          updateRow(row.id, { price: parseFloat(e.target.value) || 0 })
                        }
                        className="h-11 text-right font-mono tabular-nums border-primary/20 focus:border-primary"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="p-4">
                      <div className="h-11 flex items-center justify-end font-mono font-bold text-lg text-success tabular-nums">
                        {formatCurrency(row.total)}
                      </div>
                    </td>
                    {type === 'materials' && 'wastage' in row && (
                      <td className="p-4">
                        <Input
                          type="number"
                          value={row.wastage || ''}
                          onChange={(e) =>
                            updateRow(row.id, { wastage: parseFloat(e.target.value) || 0 })
                          }
                          className="h-11 text-right font-mono tabular-nums border-primary/20 focus:border-primary"
                          step="1"
                          min="0"
                          max="100"
                        />
                      </td>
                    )}
                    {type === 'equipment' && 'hours' in row && (
                      <td className="p-4">
                        <Input
                          type="number"
                          value={row.hours || ''}
                          onChange={(e) =>
                            updateRow(row.id, { hours: parseFloat(e.target.value) || 0 })
                          }
                          className="h-11 text-right font-mono tabular-nums border-primary/20 focus:border-primary"
                          step="0.5"
                          min="0"
                        />
                      </td>
                    )}
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => duplicateRow(row)}>
                            <Copy className="h-4 w-4 ml-2" />
                            <span>تكرار</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCopiedRow(row)}>
                            <ClipboardPaste className="h-4 w-4 ml-2" />
                            <span>نسخ</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteRow(row.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            <span>حذف</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t-2">
                <tr>
                  <td
                    colSpan={type === 'materials' || type === 'equipment' ? 6 : 5}
                    className="p-4 text-base font-bold text-right"
                  >
                    الإجمالي الفرعي
                  </td>
                  <td className="p-4 font-bold text-xl text-success text-right tabular-nums">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      ) : (
        <Card className={cn('border-2 border-dashed', config.borderColor)}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div
              className={cn(
                'flex items-center justify-center w-16 h-16 rounded-2xl mb-4',
                config.accentColor,
              )}
            >
              <Icon className={cn('h-8 w-8', config.iconColor)} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">لم تتم إضافة أي {config.label} بعد</p>
            <Button onClick={() => addRow()} className="font-semibold">
              <Plus className="h-4 w-4 ml-2" />
              إضافة {config.label === 'المواد' ? 'أول مادة' : 'أول عنصر'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
