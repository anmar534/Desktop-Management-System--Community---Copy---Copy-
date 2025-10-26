// Utility functions for exporting tender pricing data to Excel
import { toast } from 'sonner'
import type { PricingData } from '@/shared/types/pricing'

export interface QuantityItemForExport {
  id: string
  itemNumber: string
  description: string
  unit: string
  quantity: number
}

export interface ExportDataRow {
  'رقم البند': string
  'وصف البند': string
  الوحدة: string
  الكمية: number
  'سعر الوحدة': string
  'القيمة الإجمالية': string
  'حالة التسعير': string
}

interface ExportPricingOptions {
  quantityItems: QuantityItemForExport[]
  pricingData: Map<string, PricingData>
  recordAudit?: (
    level: string,
    action: string,
    metadata?: Record<string, unknown>,
    status?: string,
  ) => void
  getErrorMessage?: (error: unknown) => string
}

/**
 * Calculate totals for each pricing category
 */
function calculateCategoryTotals(pricing: PricingData): {
  materials: number
  labor: number
  equipment: number
  subcontractors: number
} {
  return {
    materials: (pricing.materials ?? []).reduce((sum, mat) => sum + (mat.total ?? 0), 0),
    labor: (pricing.labor ?? []).reduce((sum, lab) => sum + (lab.total ?? 0), 0),
    equipment: (pricing.equipment ?? []).reduce((sum, eq) => sum + (eq.total ?? 0), 0),
    subcontractors: (pricing.subcontractors ?? []).reduce((sum, sub) => sum + (sub.total ?? 0), 0),
  }
}

/**
 * Prepare tender pricing data for Excel export
 */
export function preparePricingDataForExport(options: ExportPricingOptions): ExportDataRow[] | null {
  const { quantityItems, pricingData } = options

  try {
    const exportData = quantityItems.map((item) => {
      const itemPricing = pricingData.get(item.id)
      const totals = itemPricing ? calculateCategoryTotals(itemPricing) : null

      const subtotal = totals
        ? totals.materials + totals.labor + totals.equipment + totals.subcontractors
        : 0

      const unitPrice = itemPricing && item.quantity > 0 ? subtotal / item.quantity : 0

      return {
        'رقم البند': item.itemNumber,
        'وصف البند': item.description,
        الوحدة: item.unit,
        الكمية: item.quantity,
        'سعر الوحدة': unitPrice.toFixed(2),
        'القيمة الإجمالية': subtotal.toFixed(2),
        'حالة التسعير': itemPricing ? 'مكتمل' : 'لم يبدأ',
      }
    })

    return exportData
  } catch (error) {
    if (options.recordAudit) {
      const message = options.getErrorMessage
        ? options.getErrorMessage(error)
        : error instanceof Error
          ? error.message
          : 'Unknown error'

      options.recordAudit('error', 'export-pricing-prepare-failed', { message }, 'error')
    }
    return null
  }
}

/**
 * Export tender pricing data to Excel
 * Currently shows a toast notification as the export feature is under development
 */
export function exportTenderPricingToExcel(options: ExportPricingOptions): void {
  try {
    const exportData = preparePricingDataForExport(options)

    if (!exportData) {
      toast.error('خطأ في التصدير', {
        description: 'حدث خطأ أثناء إعداد البيانات للتصدير',
        duration: 4000,
      })
      return
    }

    // TODO: Implement actual Excel export functionality
    // For now, just show a notification
    toast.info('جاري تطوير وظيفة التصدير', {
      description: 'هذه الوظيفة قيد التطوير وستكون متاحة قريباً',
      duration: 4000,
    })

    if (options.recordAudit) {
      options.recordAudit('info', 'export-pricing-requested', {
        items: exportData.length,
      })
    }
  } catch (error) {
    if (options.recordAudit) {
      const message = options.getErrorMessage
        ? options.getErrorMessage(error)
        : error instanceof Error
          ? error.message
          : 'Unknown error'

      options.recordAudit('error', 'export-pricing-failed', { message }, 'error')
    }

    toast.error('خطأ في التصدير', {
      description: 'حدث خطأ أثناء إعداد البيانات للتصدير',
      duration: 4000,
    })
  }
}
