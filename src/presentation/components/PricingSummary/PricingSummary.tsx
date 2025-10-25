/**
 * @fileoverview Pricing summary component
 * @module components/PricingSummary
 *
 * Displays comprehensive pricing summary with totals, taxes, and discounts
 * Integrates with financial calculations hook
 */

import { useQuantityFormatter } from '../../../application/hooks/useQuantityFormatter'

/**
 * Price breakdown item
 */
export interface PriceItem {
  /** Item label */
  label: string

  /** Item value */
  value: number

  /** Item type for styling */
  type?: 'normal' | 'subtotal' | 'total' | 'discount' | 'tax'

  /** Show as percentage */
  asPercentage?: boolean

  /** Item description/tooltip */
  description?: string
}

/**
 * PricingSummary props
 */
export interface PricingSummaryProps {
  /** Subtotal (before tax and discount) */
  subtotal: number

  /** Tax rate (percentage, e.g., 15 for 15%) */
  taxRate?: number

  /** Tax amount (calculated or custom) */
  taxAmount?: number

  /** Discount rate (percentage) */
  discountRate?: number

  /** Discount amount (calculated or custom) */
  discountAmount?: number

  /** Additional items to display */
  additionalItems?: PriceItem[]

  /** Show tax breakdown */
  showTaxBreakdown?: boolean

  /** Show discount breakdown */
  showDiscountBreakdown?: boolean

  /** Currency symbol (default: SAR) */
  currency?: string

  /** Component title */
  title?: string

  /** Show border */
  bordered?: boolean

  /** Compact mode (smaller spacing) */
  compact?: boolean

  /** Custom CSS class */
  className?: string
}

/**
 * PricingSummary Component
 *
 * Displays pricing summary with automatic calculations
 *
 * @example
 * ```tsx
 * <PricingSummary
 *   subtotal={100000}
 *   taxRate={15}
 *   discountRate={10}
 *   showTaxBreakdown
 *   showDiscountBreakdown
 * />
 * // Output:
 * // Subtotal: ر.س 100,000.00
 * // Discount (10%): -ر.س 10,000.00
 * // Subtotal after discount: ر.س 90,000.00
 * // Tax (15%): ر.س 13,500.00
 * // Total: ر.س 103,500.00
 * ```
 */
export function PricingSummary({
  subtotal,
  taxRate = 0,
  taxAmount: customTaxAmount,
  discountRate = 0,
  discountAmount: customDiscountAmount,
  additionalItems = [],
  showTaxBreakdown = true,
  showDiscountBreakdown = true,
  currency: _currency = 'SAR',
  title = 'ملخص الأسعار',
  bordered = true,
  compact = false,
  className = '',
}: PricingSummaryProps) {
  const formatter = useQuantityFormatter()

  // Calculate discount amount
  const discountAmount = customDiscountAmount ?? (subtotal * discountRate) / 100
  const subtotalAfterDiscount = subtotal - discountAmount

  // Calculate tax amount
  const taxAmount = customTaxAmount ?? (subtotalAfterDiscount * taxRate) / 100

  // Calculate additional items total
  const additionalTotal = additionalItems.reduce((sum, item) => sum + item.value, 0)

  // Calculate total
  const total = subtotalAfterDiscount + taxAmount + additionalTotal

  /**
   * Build items array
   */
  const items: PriceItem[] = [
    {
      label: 'المبلغ الأساسي',
      value: subtotal,
      type: 'subtotal',
    },
  ]

  // Add discount if applicable
  if (discountAmount > 0 && showDiscountBreakdown) {
    items.push({
      label: `الخصم${discountRate > 0 ? ` (${formatter.formatPercentage(discountRate, { decimals: 1 })})` : ''}`,
      value: -discountAmount,
      type: 'discount',
    })

    items.push({
      label: 'المبلغ بعد الخصم',
      value: subtotalAfterDiscount,
      type: 'subtotal',
    })
  }

  // Add tax if applicable
  if (taxAmount > 0 && showTaxBreakdown) {
    items.push({
      label: `ضريبة القيمة المضافة${taxRate > 0 ? ` (${formatter.formatPercentage(taxRate, { decimals: 1 })})` : ''}`,
      value: taxAmount,
      type: 'tax',
    })
  }

  // Add additional items
  if (additionalItems.length > 0) {
    items.push(...additionalItems)
  }

  // Add total
  items.push({
    label: 'الإجمالي',
    value: total,
    type: 'total',
  })

  /**
   * Get item CSS class
   */
  const getItemClass = (item: PriceItem): string => {
    const classes = ['pricing-summary-item']

    if (item.type) {
      classes.push(`pricing-summary-item--${item.type}`)
    }

    return classes.join(' ')
  }

  /**
   * Format item value
   */
  const formatValue = (item: PriceItem): string => {
    if (item.asPercentage) {
      return formatter.formatPercentage(item.value)
    }

    const formatted = formatter.formatCurrency(item.value)

    // Add negative sign styling for discounts
    if (item.type === 'discount' && item.value < 0) {
      return formatted
    }

    return formatted
  }

  /**
   * Component CSS classes
   */
  const componentClasses = [
    'pricing-summary',
    bordered && 'pricing-summary--bordered',
    compact && 'pricing-summary--compact',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={componentClasses}>
      {title && <h3 className="pricing-summary-title">{title}</h3>}

      <div className="pricing-summary-items">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={getItemClass(item)}
            title={item.description}
          >
            <span className="pricing-summary-item-label">{item.label}</span>
            <span className="pricing-summary-item-value">{formatValue(item)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PricingSummary
