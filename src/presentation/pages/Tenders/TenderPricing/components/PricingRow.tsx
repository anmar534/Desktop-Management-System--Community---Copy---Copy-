/**
 * @fileoverview PricingRow Component
 * @description Reusable table row component for pricing items
 */

import React from 'react'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import { Trash2, Copy } from 'lucide-react'
import { Checkbox } from '@/presentation/components/ui/checkbox'

interface PricingRowProps {
  index: number
  item: {
    description?: string
    quantity?: number
    unit?: string
    price?: number
    total?: number
    hasWaste?: boolean
    wastePercentage?: number
  }
  formatCurrency: (value: number) => string
  formatQuantity: (value: number) => string
  onUpdate: (index: number, field: string, value: unknown) => void
  onDelete: (index: number) => void
  onDuplicate?: (index: number) => void
  showWaste?: boolean
  readOnly?: boolean
  className?: string
}

export const PricingRow: React.FC<PricingRowProps> = ({
  index,
  item,
  formatCurrency,
  formatQuantity: _formatQuantity,
  onUpdate,
  onDelete,
  onDuplicate,
  showWaste = false,
  readOnly = false,
  className = '',
}) => {
  const calculatedTotal = (item.quantity ?? 0) * (item.price ?? 0)
  const wasteAmount = item.hasWaste ? calculatedTotal * ((item.wastePercentage ?? 0) / 100) : 0
  const finalTotal = calculatedTotal + wasteAmount

  return (
    <tr className={`border-b hover:bg-muted/50 ${className}`}>
      {/* Description */}
      <td className="p-2">
        <Input
          value={item.description ?? ''}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
          placeholder="الوصف"
          disabled={readOnly}
          className="min-w-[200px]"
        />
      </td>

      {/* Quantity */}
      <td className="p-2">
        <Input
          type="number"
          value={item.quantity ?? ''}
          onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
          placeholder="0"
          disabled={readOnly}
          className="w-24 text-right"
          min="0"
          step="0.01"
        />
      </td>

      {/* Unit */}
      <td className="p-2">
        <Input
          value={item.unit ?? ''}
          onChange={(e) => onUpdate(index, 'unit', e.target.value)}
          placeholder="الوحدة"
          disabled={readOnly}
          className="w-20"
        />
      </td>

      {/* Price */}
      <td className="p-2">
        <Input
          type="number"
          value={item.price ?? ''}
          onChange={(e) => onUpdate(index, 'price', parseFloat(e.target.value) || 0)}
          placeholder="0"
          disabled={readOnly}
          className="w-32 text-right"
          min="0"
          step="0.01"
        />
      </td>

      {/* Waste (if applicable) */}
      {showWaste && (
        <>
          <td className="p-2 text-center">
            <Checkbox
              checked={item.hasWaste ?? false}
              onCheckedChange={(checked) => onUpdate(index, 'hasWaste', checked)}
              disabled={readOnly}
            />
          </td>
          <td className="p-2">
            <Input
              type="number"
              value={item.wastePercentage ?? ''}
              onChange={(e) => onUpdate(index, 'wastePercentage', parseFloat(e.target.value) || 0)}
              placeholder="0"
              disabled={readOnly || !item.hasWaste}
              className="w-20 text-right"
              min="0"
              max="100"
              step="0.1"
            />
          </td>
        </>
      )}

      {/* Total */}
      <td className="p-2 text-right font-medium">
        <div className="flex flex-col">
          <span>{formatCurrency(finalTotal)}</span>
          {item.hasWaste && wasteAmount > 0 && (
            <span className="text-xs text-muted-foreground">
              + {formatCurrency(wasteAmount)} هدر
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="p-2">
        <div className="flex items-center gap-1">
          {onDuplicate && (
            <Button
              onClick={() => onDuplicate(index)}
              size="sm"
              variant="ghost"
              disabled={readOnly}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => onDelete(index)}
            size="sm"
            variant="ghost"
            disabled={readOnly}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
