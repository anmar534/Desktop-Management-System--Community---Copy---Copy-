/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { useCurrencyFormatter } from '@/application/hooks/useCurrencyFormatter'

interface CostItemBreakdownProps {
  item: any // Using any to accommodate extended BOQItem with additional fields from useBOQ
  isExpanded: boolean
}

export const CostItemBreakdown: React.FC<CostItemBreakdownProps> = ({ item, isExpanded }) => {
  const { formatCurrencyValue } = useCurrencyFormatter()

  if (!isExpanded || !item.estimated) {
    return null
  }

  console.log('🔍 [CostItemBreakdown] Item data:', {
    id: item.id,
    description: item.description,
    estimated: item.estimated,
    hasMaterials: item.estimated.materials?.length,
    hasLabor: item.estimated.labor?.length,
    hasEquipment: item.estimated.equipment?.length,
    hasSubcontractors: item.estimated.subcontractors?.length,
  })

  return (
    <>
      {/* Materials breakdown */}
      {item.estimated.materials && item.estimated.materials.length > 0 && (
        <>
          <tr className="bg-info/10">
            <td colSpan={12} className="px-8 py-2 text-sm font-semibold text-info">
              المواد ({item.estimated.materials.length} بند)
            </td>
          </tr>
          {item.estimated.materials.map((material: any, idx: number) => (
            <tr key={`mat-${idx}`} className="bg-info/5 text-sm">
              <td></td>
              <td className="px-8 py-2"></td>
              <td className="px-8 py-2 text-muted-foreground">
                {material.name || material.description || 'بدون اسم'}
              </td>
              <td className="px-4 py-2 text-center">{material.unit || '-'}</td>
              <td className="px-4 py-2 text-center">{material.quantity?.toFixed(2) || '0.00'}</td>
              <td className="px-4 py-2 text-center">
                {formatCurrencyValue(material.unitPrice || 0)}
              </td>
              <td className="px-4 py-2 text-center">
                {formatCurrencyValue(material.totalPrice || 0)}
              </td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2"></td>
              <td className="px-4 py-2"></td>
            </tr>
          ))}
        </>
      )}

      {/* Labor breakdown */}
      {item.estimated.labor && item.estimated.labor.length > 0 && (
        <>
          <tr className="bg-success/10">
            <td colSpan={12} className="px-8 py-2 text-sm font-semibold text-success">
              العمالة ({item.estimated.labor.length} بند)
            </td>
          </tr>
          {item.estimated.labor.map((labor: any, idx: number) => (
            <tr key={`lab-${idx}`} className="bg-success/5 text-sm">
              <td></td>
              <td className="px-8 py-2"></td>
              <td className="px-8 py-2 text-muted-foreground">
                {labor.name || labor.description || 'بدون اسم'}
              </td>
              <td className="px-4 py-2 text-center">{labor.unit || '-'}</td>
              <td className="px-4 py-2 text-center">{labor.quantity?.toFixed(2) || '0.00'}</td>
              <td className="px-4 py-2 text-center">{formatCurrencyValue(labor.unitPrice || 0)}</td>
              <td className="px-4 py-2 text-center">
                {formatCurrencyValue(labor.totalPrice || 0)}
              </td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2"></td>
              <td className="px-4 py-2"></td>
            </tr>
          ))}
        </>
      )}

      {/* Equipment breakdown */}
      {item.estimated.equipment && item.estimated.equipment.length > 0 && (
        <>
          <tr className="bg-warning/10">
            <td colSpan={12} className="px-8 py-2 text-sm font-semibold text-warning">
              المعدات ({item.estimated.equipment.length} بند)
            </td>
          </tr>
          {item.estimated.equipment.map((equip: any, idx: number) => (
            <tr key={`eq-${idx}`} className="bg-warning/5 text-sm">
              <td></td>
              <td className="px-8 py-2"></td>
              <td className="px-8 py-2 text-muted-foreground">
                {equip.name || equip.description || 'بدون اسم'}
              </td>
              <td className="px-4 py-2 text-center">{equip.unit || '-'}</td>
              <td className="px-4 py-2 text-center">{equip.quantity?.toFixed(2) || '0.00'}</td>
              <td className="px-4 py-2 text-center">{formatCurrencyValue(equip.unitPrice || 0)}</td>
              <td className="px-4 py-2 text-center">
                {formatCurrencyValue(equip.totalPrice || 0)}
              </td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2"></td>
              <td className="px-4 py-2"></td>
            </tr>
          ))}
        </>
      )}

      {/* Subcontractors breakdown */}
      {item.estimated.subcontractors && item.estimated.subcontractors.length > 0 && (
        <>
          <tr className="bg-primary/10">
            <td colSpan={12} className="px-8 py-2 text-sm font-semibold text-primary">
              المقاولون من الباطن ({item.estimated.subcontractors.length} بند)
            </td>
          </tr>
          {item.estimated.subcontractors.map((sub: any, idx: number) => (
            <tr key={`sub-${idx}`} className="bg-primary/5 text-sm">
              <td></td>
              <td className="px-8 py-2"></td>
              <td className="px-8 py-2 text-muted-foreground">
                {sub.name || sub.description || 'بدون اسم'}
              </td>
              <td className="px-4 py-2 text-center">{sub.unit || '-'}</td>
              <td className="px-4 py-2 text-center">{sub.quantity?.toFixed(2) || '0.00'}</td>
              <td className="px-4 py-2 text-center">{formatCurrencyValue(sub.unitPrice || 0)}</td>
              <td className="px-4 py-2 text-center">{formatCurrencyValue(sub.totalPrice || 0)}</td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2 text-center bg-muted/20">-</td>
              <td className="px-4 py-2"></td>
              <td className="px-4 py-2"></td>
            </tr>
          ))}
        </>
      )}

      {/* Additional percentages */}
      {item.estimated.additionalPercentages &&
        Object.keys(item.estimated.additionalPercentages).length > 0 && (
          <tr className="bg-muted/10 text-sm">
            <td></td>
            <td className="px-8 py-2"></td>
            <td className="px-8 py-2 text-muted-foreground">نسب إضافية</td>
            <td colSpan={9} className="px-4 py-2 text-muted-foreground">
              {Object.entries(item.estimated.additionalPercentages).map(([key, value]) => (
                <span key={key} className="mr-4">
                  {key}: {String(value)}%
                </span>
              ))}
            </td>
          </tr>
        )}

      {/* Show message if no breakdown data */}
      {(!item.estimated.materials || item.estimated.materials.length === 0) &&
        (!item.estimated.labor || item.estimated.labor.length === 0) &&
        (!item.estimated.equipment || item.estimated.equipment.length === 0) &&
        (!item.estimated.subcontractors || item.estimated.subcontractors.length === 0) && (
          <tr className="bg-muted/5">
            <td colSpan={12} className="px-8 py-4 text-center text-muted-foreground text-sm">
              لا توجد تفاصيل تكلفة لهذا البند
            </td>
          </tr>
        )}
    </>
  )
}
