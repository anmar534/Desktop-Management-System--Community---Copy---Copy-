// Central shared pricing constants (Phase 3)
// مصدر واحد للحفاظ على تزامن الحقول والأسماء الافتراضية

export const DESCRIPTION_ALIASES = [
  'description',
  'itemName',
  'desc',
  'name',
  'title',
  'specifications',
  'details',
  'itemDesc',
  'itemDescription',
  'label',
  'text',
] as const
export const UNIT_ALIASES = ['unit', 'uom', 'unit_ar', 'unitName', 'unitAr'] as const
export const QUANTITY_ALIASES = ['quantity', 'qty', 'baseQty'] as const
export const TOTAL_ALIASES = ['finalPrice', 'total', 'totalPrice'] as const
export const UNIT_PRICE_ALIASES = ['unitPrice', 'pricePerUnit', 'rate'] as const

export const VAT_RATE = 0.15 // يمكن لاحقاً جعله قابلاً للتهيئة

export interface PricingBusinessConfig {
  vatRate: number
  defaultPercentages: { administrative: number; operational: number; profit: number }
}

export const DEFAULT_PRICING_CONFIG: PricingBusinessConfig = {
  vatRate: VAT_RATE,
  defaultPercentages: { administrative: 10, operational: 15, profit: 20 },
}

// Runtime-configurable layer (simple in-memory override for now)
let currentConfig: PricingBusinessConfig = { ...DEFAULT_PRICING_CONFIG }

export function getPricingConfig(): PricingBusinessConfig {
  return currentConfig
}

export function updatePricingConfig(
  partial: Partial<{
    vatRate: number
    defaultPercentages: Partial<PricingBusinessConfig['defaultPercentages']>
  }>,
) {
  if (partial.vatRate !== undefined) {
    currentConfig = { ...currentConfig, vatRate: partial.vatRate }
  }
  if (partial.defaultPercentages) {
    currentConfig = {
      ...currentConfig,
      defaultPercentages: { ...currentConfig.defaultPercentages, ...partial.defaultPercentages },
    }
  }
}
