import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PricingSummary, PriceItem } from '../../../src/presentation/components/PricingSummary'

describe('PricingSummary', () => {
  describe('Basic Rendering', () => {
    it('should render subtotal and total', () => {
      render(<PricingSummary subtotal={100000} />)

      expect(screen.getByText('المبلغ الأساسي')).toBeInTheDocument()
      expect(screen.getByText('الإجمالي')).toBeInTheDocument()
      const values = screen.getAllByText(/ر\.س 100,000/)
      expect(values.length).toBeGreaterThan(0)
    })

    it('should render custom title', () => {
      render(<PricingSummary subtotal={100000} title="ملخص مالي" />)

      expect(screen.getByText('ملخص مالي')).toBeInTheDocument()
    })

    it('should render without title when not provided', () => {
      render(<PricingSummary subtotal={100000} title="" />)

      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<PricingSummary subtotal={100000} className="custom-pricing" />)

      expect(container.firstChild).toHaveClass('custom-pricing')
    })

    it('should apply bordered class when bordered=true', () => {
      const { container } = render(<PricingSummary subtotal={100000} bordered />)

      expect(container.firstChild).toHaveClass('pricing-summary--bordered')
    })

    it('should apply compact class when compact=true', () => {
      const { container } = render(<PricingSummary subtotal={100000} compact />)

      expect(container.firstChild).toHaveClass('pricing-summary--compact')
    })
  })

  describe('Tax Calculations', () => {
    it('should calculate and display tax', () => {
      render(<PricingSummary subtotal={100000} taxRate={15} showTaxBreakdown />)

      expect(screen.getByText(/ضريبة القيمة المضافة/)).toBeInTheDocument()
      expect(screen.getByText(/15.*%/)).toBeInTheDocument()
      expect(screen.getByText(/ر\.س 15,000/)).toBeInTheDocument()
    })

    it('should use custom tax amount when provided', () => {
      render(<PricingSummary subtotal={100000} taxRate={15} taxAmount={20000} showTaxBreakdown />)

      expect(screen.getByText(/ر\.س 20,000/)).toBeInTheDocument()
    })

    it('should not show tax when showTaxBreakdown=false', () => {
      render(<PricingSummary subtotal={100000} taxRate={15} showTaxBreakdown={false} />)

      expect(screen.queryByText(/ضريبة القيمة المضافة/)).not.toBeInTheDocument()
    })

    it('should not show tax when taxAmount is 0', () => {
      render(<PricingSummary subtotal={100000} taxRate={0} showTaxBreakdown />)

      expect(screen.queryByText(/ضريبة القيمة المضافة/)).not.toBeInTheDocument()
    })

    it('should calculate total with tax correctly', () => {
      render(<PricingSummary subtotal={100000} taxRate={15} />)

      // Subtotal: 100,000
      // Tax (15%): 15,000
      // Total: 115,000
      expect(screen.getByText(/ر\.س 115,000/)).toBeInTheDocument()
    })
  })

  describe('Discount Calculations', () => {
    it('should calculate and display discount', () => {
      render(<PricingSummary subtotal={100000} discountRate={10} showDiscountBreakdown />)

      expect(screen.getByText(/الخصم \(10/)).toBeInTheDocument()
      expect(screen.getByText(/ر\.س -10,000/)).toBeInTheDocument()
    })

    it('should use custom discount amount when provided', () => {
      render(
        <PricingSummary
          subtotal={100000}
          discountRate={10}
          discountAmount={15000}
          showDiscountBreakdown
        />,
      )

      expect(screen.getByText(/ر\.س -15,000/)).toBeInTheDocument()
    })

    it('should show subtotal after discount', () => {
      render(<PricingSummary subtotal={100000} discountRate={10} showDiscountBreakdown />)

      expect(screen.getByText('المبلغ بعد الخصم')).toBeInTheDocument()
      const values = screen.getAllByText(/ر\.س 90,000/)
      expect(values.length).toBeGreaterThan(0)
    })

    it('should not show discount when showDiscountBreakdown=false', () => {
      render(<PricingSummary subtotal={100000} discountRate={10} showDiscountBreakdown={false} />)

      expect(screen.queryByText(/الخصم/)).not.toBeInTheDocument()
      expect(screen.queryByText('المبلغ بعد الخصم')).not.toBeInTheDocument()
    })

    it('should not show discount when discountAmount is 0', () => {
      render(<PricingSummary subtotal={100000} discountRate={0} showDiscountBreakdown />)

      expect(screen.queryByText(/الخصم/)).not.toBeInTheDocument()
    })

    it('should calculate total with discount correctly', () => {
      const { container } = render(<PricingSummary subtotal={100000} discountRate={10} />)

      // Subtotal: 100,000
      // Discount (10%): -10,000
      // Total: 90,000
      const totalItem = container.querySelector(
        '.pricing-summary-item--total .pricing-summary-item-value',
      )
      expect(totalItem).toHaveTextContent(/ر\.س 90,000/)
    })
  })

  describe('Combined Tax and Discount', () => {
    it('should calculate total with both tax and discount', () => {
      render(
        <PricingSummary
          subtotal={100000}
          discountRate={10}
          taxRate={15}
          showDiscountBreakdown
          showTaxBreakdown
        />,
      )

      // Subtotal: 100,000
      // Discount (10%): -10,000
      // Subtotal after discount: 90,000
      // Tax (15%): 13,500
      // Total: 103,500
      expect(screen.getByText(/ر\.س 103,500/)).toBeInTheDocument()
    })

    it('should apply discount before tax', () => {
      render(
        <PricingSummary
          subtotal={100000}
          discountRate={20}
          taxRate={15}
          showDiscountBreakdown
          showTaxBreakdown
        />,
      )

      // Tax should be calculated on discounted amount
      // Subtotal: 100,000
      // Discount: 20,000
      // After discount: 80,000
      // Tax on 80,000: 12,000
      expect(screen.getByText(/ر\.س 12,000/)).toBeInTheDocument()
    })
  })

  describe('Additional Items', () => {
    it('should render additional items', () => {
      const additionalItems: PriceItem[] = [
        { label: 'رسوم الشحن', value: 500, type: 'normal' },
        { label: 'رسوم الخدمة', value: 1000, type: 'normal' },
      ]

      render(<PricingSummary subtotal={100000} additionalItems={additionalItems} />)

      expect(screen.getByText('رسوم الشحن')).toBeInTheDocument()
      expect(screen.getByText('رسوم الخدمة')).toBeInTheDocument()
      expect(screen.getByText(/ر\.س 500/)).toBeInTheDocument()
      expect(screen.getByText(/ر\.س 1,000/)).toBeInTheDocument()
    })

    it('should include additional items in total', () => {
      const additionalItems: PriceItem[] = [{ label: 'رسوم إضافية', value: 5000, type: 'normal' }]

      render(<PricingSummary subtotal={100000} additionalItems={additionalItems} />)

      // Total should include additional items
      expect(screen.getByText(/ر\.س 105,000/)).toBeInTheDocument()
    })

    it('should format percentage items', () => {
      const additionalItems: PriceItem[] = [
        { label: 'هامش الربح', value: 15, type: 'normal', asPercentage: true },
      ]

      render(<PricingSummary subtotal={100000} additionalItems={additionalItems} />)

      expect(screen.getByText(/15.*%/)).toBeInTheDocument()
    })

    it('should show item descriptions as title attribute', () => {
      const additionalItems: PriceItem[] = [
        { label: 'رسوم', value: 500, description: 'رسوم إضافية للخدمة' },
      ]

      const { container } = render(
        <PricingSummary subtotal={100000} additionalItems={additionalItems} />,
      )

      const itemElement = container.querySelector('[title="رسوم إضافية للخدمة"]')
      expect(itemElement).toBeInTheDocument()
    })
  })

  describe('Item Types and Styling', () => {
    it('should apply type classes to items', () => {
      const additionalItems: PriceItem[] = [
        { label: 'عنصر عادي', value: 100, type: 'normal' },
        { label: 'مجموع فرعي', value: 200, type: 'subtotal' },
      ]

      const { container } = render(
        <PricingSummary subtotal={100000} additionalItems={additionalItems} />,
      )

      expect(container.querySelector('.pricing-summary-item--normal')).toBeInTheDocument()
      expect(container.querySelector('.pricing-summary-item--subtotal')).toBeInTheDocument()
    })

    it('should apply discount class to discount items', () => {
      const { container } = render(
        <PricingSummary subtotal={100000} discountRate={10} showDiscountBreakdown />,
      )

      expect(container.querySelector('.pricing-summary-item--discount')).toBeInTheDocument()
    })

    it('should apply tax class to tax items', () => {
      const { container } = render(
        <PricingSummary subtotal={100000} taxRate={15} showTaxBreakdown />,
      )

      expect(container.querySelector('.pricing-summary-item--tax')).toBeInTheDocument()
    })

    it('should apply total class to total item', () => {
      const { container } = render(<PricingSummary subtotal={100000} />)

      expect(container.querySelector('.pricing-summary-item--total')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero subtotal', () => {
      const { container } = render(<PricingSummary subtotal={0} />)

      const values = container.querySelectorAll('.pricing-summary-item-value')
      expect(values.length).toBeGreaterThan(0)
      expect(values[0]).toHaveTextContent(/ر\.س 0/)
    })

    it('should handle very large numbers', () => {
      const { container } = render(<PricingSummary subtotal={1000000000} />)

      const totalItem = container.querySelector(
        '.pricing-summary-item--total .pricing-summary-item-value',
      )
      expect(totalItem).toHaveTextContent(/ر\.س 1,000,000,000/)
    })

    it('should handle decimal values correctly', () => {
      const { container } = render(<PricingSummary subtotal={100000.55} taxRate={15} />)

      // Should handle decimals in calculations
      const values = container.querySelectorAll('.pricing-summary-item-value')
      expect(values.length).toBeGreaterThan(0)
      expect(values[0]).toHaveTextContent(/ر\.س/)
    })

    it('should handle empty additional items', () => {
      render(<PricingSummary subtotal={100000} additionalItems={[]} />)

      expect(screen.getByText('الإجمالي')).toBeInTheDocument()
    })
  })
})
