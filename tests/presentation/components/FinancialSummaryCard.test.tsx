/**
 * @fileoverview Tests for FinancialSummaryCard component
 * @module components/FinancialSummaryCard/__tests__
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FinancialSummaryCard } from '../../../src/presentation/components/FinancialSummaryCard'
import type { FinancialMetric } from '../../../src/presentation/components/FinancialSummaryCard'

/**
 * Default test metrics
 */
const defaultMetrics: FinancialMetric[] = [
  {
    id: 'total',
    label: 'الإجمالي',
    value: 100000,
    type: 'currency',
    icon: '💰',
    highlighted: true,
  },
  {
    id: 'tax',
    label: 'الضريبة',
    value: 15000,
    type: 'currency',
    icon: '📊',
  },
  {
    id: 'profit',
    label: 'الربح',
    value: 12.5,
    type: 'percentage',
    icon: '📈',
    trend: 'up',
  },
  {
    id: 'items',
    label: 'العناصر',
    value: 150,
    type: 'number',
  },
]

describe('FinancialSummaryCard', () => {
  describe('Basic Rendering', () => {
    it('renders card with title', () => {
      render(<FinancialSummaryCard title="ملخص المنافسة" metrics={defaultMetrics} />)

      expect(screen.getByText('ملخص المنافسة')).toBeInTheDocument()
    })

    it('renders with subtitle', () => {
      render(
        <FinancialSummaryCard
          title="ملخص المنافسة"
          subtitle="تفاصيل إضافية"
          metrics={defaultMetrics}
        />,
      )

      expect(screen.getByText('تفاصيل إضافية')).toBeInTheDocument()
    })

    it('renders all metrics', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      expect(screen.getByText('الإجمالي')).toBeInTheDocument()
      expect(screen.getByText('الضريبة')).toBeInTheDocument()
      expect(screen.getByText('الربح')).toBeInTheDocument()
      expect(screen.getByText('العناصر')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={defaultMetrics} className="custom-class" />,
      )

      const card = container.querySelector('.financial-summary-card')
      expect(card).toHaveClass('custom-class')
    })

    it('renders in compact mode', () => {
      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={defaultMetrics} compact />,
      )

      const card = container.querySelector('.financial-summary-card')
      expect(card).toHaveClass('financial-summary-card--compact')
    })
  })

  describe('Variants', () => {
    it('renders default variant', () => {
      const { container } = render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      const card = container.querySelector('.financial-summary-card')
      expect(card).toHaveClass('financial-summary-card--default')
    })

    it('renders outlined variant', () => {
      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={defaultMetrics} variant="outlined" />,
      )

      const card = container.querySelector('.financial-summary-card')
      expect(card).toHaveClass('financial-summary-card--outlined')
    })

    it('renders elevated variant', () => {
      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={defaultMetrics} variant="elevated" />,
      )

      const card = container.querySelector('.financial-summary-card')
      expect(card).toHaveClass('financial-summary-card--elevated')
    })
  })

  describe('Metric Formatting', () => {
    it('formats currency values correctly', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      expect(screen.getByText('ر.س 100,000.00')).toBeInTheDocument()
      expect(screen.getByText('ر.س 15,000.00')).toBeInTheDocument()
    })

    it('formats percentage values correctly', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      expect(screen.getByText('12.50%')).toBeInTheDocument()
    })

    it('formats number values correctly', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      expect(screen.getByText('150.00')).toBeInTheDocument()
    })

    it('handles very large numbers', () => {
      const largeMetrics: FinancialMetric[] = [
        {
          id: 'large',
          label: 'قيمة كبيرة',
          value: 1000000000,
          type: 'currency',
        },
      ]

      render(<FinancialSummaryCard title="ملخص" metrics={largeMetrics} />)

      expect(screen.getByText('ر.س 1,000,000,000.00')).toBeInTheDocument()
    })

    it('handles decimal values', () => {
      const decimalMetrics: FinancialMetric[] = [
        {
          id: 'decimal',
          label: 'قيمة عشرية',
          value: 1234.56,
          type: 'currency',
        },
      ]

      render(<FinancialSummaryCard title="ملخص" metrics={decimalMetrics} />)

      expect(screen.getByText('ر.س 1,234.56')).toBeInTheDocument()
    })

    it('handles zero values', () => {
      const zeroMetrics: FinancialMetric[] = [
        {
          id: 'zero',
          label: 'صفر',
          value: 0,
          type: 'currency',
        },
      ]

      render(<FinancialSummaryCard title="ملخص" metrics={zeroMetrics} />)

      expect(screen.getByText('ر.س 0.00')).toBeInTheDocument()
    })
  })

  describe('Metric Icons', () => {
    it('displays metric icons when provided', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      expect(screen.getByText('💰')).toBeInTheDocument()
      expect(screen.getByText('📊')).toBeInTheDocument()
      expect(screen.getByText('📈')).toBeInTheDocument()
    })

    it('renders metrics without icons correctly', () => {
      const metricsWithoutIcons: FinancialMetric[] = [
        {
          id: 'no-icon',
          label: 'بدون أيقونة',
          value: 1000,
          type: 'currency',
        },
      ]

      render(<FinancialSummaryCard title="ملخص" metrics={metricsWithoutIcons} />)

      expect(screen.getByText('بدون أيقونة')).toBeInTheDocument()
      expect(screen.getByText('ر.س 1,000.00')).toBeInTheDocument()
    })
  })

  describe('Highlighted Metrics', () => {
    it('applies highlighted styling to highlighted metrics', () => {
      const { container } = render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      const metrics = container.querySelectorAll('.financial-summary-card-metric')
      expect(metrics[0]).toHaveClass('financial-summary-card-metric--highlighted')
    })

    it('does not apply highlighted styling to non-highlighted metrics', () => {
      const { container } = render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      const metrics = container.querySelectorAll('.financial-summary-card-metric')
      expect(metrics[1]).not.toHaveClass('financial-summary-card-metric--highlighted')
    })
  })

  describe('Trend Indicators', () => {
    it('shows trend indicators when showTrends is true', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} showTrends />)

      expect(screen.getByText('↑')).toBeInTheDocument()
    })

    it('hides trend indicators when showTrends is false', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} showTrends={false} />)

      expect(screen.queryByText('↑')).not.toBeInTheDocument()
    })

    it('shows up trend correctly', () => {
      const upTrendMetrics: FinancialMetric[] = [
        {
          id: 'up',
          label: 'صاعد',
          value: 100,
          type: 'number',
          trend: 'up',
        },
      ]

      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={upTrendMetrics} showTrends />,
      )

      const trend = container.querySelector('.financial-summary-card-metric-trend--up')
      expect(trend).toBeInTheDocument()
      expect(trend).toHaveTextContent('↑')
    })

    it('shows down trend correctly', () => {
      const downTrendMetrics: FinancialMetric[] = [
        {
          id: 'down',
          label: 'هابط',
          value: 100,
          type: 'number',
          trend: 'down',
        },
      ]

      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={downTrendMetrics} showTrends />,
      )

      const trend = container.querySelector('.financial-summary-card-metric-trend--down')
      expect(trend).toBeInTheDocument()
      expect(trend).toHaveTextContent('↓')
    })

    it('shows neutral trend correctly', () => {
      const neutralTrendMetrics: FinancialMetric[] = [
        {
          id: 'neutral',
          label: 'محايد',
          value: 100,
          type: 'number',
          trend: 'neutral',
        },
      ]

      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={neutralTrendMetrics} showTrends />,
      )

      const trend = container.querySelector('.financial-summary-card-metric-trend--neutral')
      expect(trend).toBeInTheDocument()
      expect(trend).toHaveTextContent('→')
    })
  })

  describe('Comparison Values', () => {
    it('shows comparison when showComparison is true and previousValue exists', () => {
      const comparisonMetrics: FinancialMetric[] = [
        {
          id: 'comparison',
          label: 'مقارنة',
          value: 110,
          type: 'number',
          previousValue: 100,
        },
      ]

      render(<FinancialSummaryCard title="ملخص" metrics={comparisonMetrics} showComparison />)

      expect(screen.getByText('+10.00%')).toBeInTheDocument()
    })

    it('hides comparison when showComparison is false', () => {
      const comparisonMetrics: FinancialMetric[] = [
        {
          id: 'comparison',
          label: 'مقارنة',
          value: 110,
          type: 'number',
          previousValue: 100,
        },
      ]

      render(
        <FinancialSummaryCard title="ملخص" metrics={comparisonMetrics} showComparison={false} />,
      )

      expect(screen.queryByText('+10.00%')).not.toBeInTheDocument()
    })

    it('shows positive change correctly', () => {
      const positiveChange: FinancialMetric[] = [
        {
          id: 'positive',
          label: 'زيادة',
          value: 150,
          type: 'number',
          previousValue: 100,
        },
      ]

      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={positiveChange} showComparison />,
      )

      const change = container.querySelector('.financial-summary-card-metric-change--positive')
      expect(change).toBeInTheDocument()
      expect(change).toHaveTextContent('+50.00%')
    })

    it('shows negative change correctly', () => {
      const negativeChange: FinancialMetric[] = [
        {
          id: 'negative',
          label: 'انخفاض',
          value: 80,
          type: 'number',
          previousValue: 100,
        },
      ]

      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={negativeChange} showComparison />,
      )

      const change = container.querySelector('.financial-summary-card-metric-change--negative')
      expect(change).toBeInTheDocument()
      expect(change).toHaveTextContent('-20.00%')
    })

    it('handles zero previous value', () => {
      const zeroPrevious: FinancialMetric[] = [
        {
          id: 'zero-prev',
          label: 'صفر سابق',
          value: 100,
          type: 'number',
          previousValue: 0,
        },
      ]

      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={zeroPrevious} showComparison />,
      )

      const change = container.querySelector('.financial-summary-card-metric-change')
      expect(change).toHaveTextContent('0.00%')
    })
  })

  describe('Loading State', () => {
    it('shows loading state when loading is true', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} loading />)

      expect(screen.getByText('جاري التحميل...')).toBeInTheDocument()
    })

    it('hides metrics when loading', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} loading />)

      expect(screen.queryByText('الإجمالي')).not.toBeInTheDocument()
    })

    it('shows loading spinner', () => {
      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={defaultMetrics} loading />,
      )

      const spinner = container.querySelector('.financial-summary-card-loading-spinner')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when error prop is provided', () => {
      render(
        <FinancialSummaryCard
          title="ملخص"
          metrics={defaultMetrics}
          error="فشل في تحميل البيانات"
        />,
      )

      expect(screen.getByText('فشل في تحميل البيانات')).toBeInTheDocument()
    })

    it('hides metrics when error exists', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} error="خطأ" />)

      expect(screen.queryByText('الإجمالي')).not.toBeInTheDocument()
    })

    it('shows error icon', () => {
      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} error="خطأ" />)

      expect(screen.getByText('⚠')).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('renders footer content when provided', () => {
      const footer = <div>محتوى تذييل مخصص</div>

      render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} footer={footer} />)

      expect(screen.getByText('محتوى تذييل مخصص')).toBeInTheDocument()
    })

    it('does not render footer section when footer is not provided', () => {
      const { container } = render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      const footer = container.querySelector('.financial-summary-card-footer')
      expect(footer).not.toBeInTheDocument()
    })
  })

  describe('Click Interaction', () => {
    it('calls onClick when card is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={defaultMetrics} onClick={onClick} />,
      )

      const card = container.querySelector('.financial-summary-card')
      if (card) {
        await user.click(card)
      }

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('applies clickable class when onClick is provided', () => {
      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={defaultMetrics} onClick={vi.fn()} />,
      )

      const card = container.querySelector('.financial-summary-card')
      expect(card).toHaveClass('financial-summary-card--clickable')
    })

    it('does not apply clickable class when onClick is not provided', () => {
      const { container } = render(<FinancialSummaryCard title="ملخص" metrics={defaultMetrics} />)

      const card = container.querySelector('.financial-summary-card')
      expect(card).not.toHaveClass('financial-summary-card--clickable')
    })

    it('has proper ARIA role when clickable', () => {
      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={defaultMetrics} onClick={vi.fn()} />,
      )

      const card = container.querySelector('.financial-summary-card')
      expect(card).toHaveAttribute('role', 'button')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty metrics array', () => {
      const { container } = render(<FinancialSummaryCard title="ملخص" metrics={[]} />)

      const metricsContainer = container.querySelector('.financial-summary-card-metrics')
      expect(metricsContainer).toBeInTheDocument()
      expect(metricsContainer?.children.length).toBe(0)
    })

    it('handles single metric', () => {
      const singleMetric: FinancialMetric[] = [
        {
          id: 'single',
          label: 'واحد',
          value: 100,
          type: 'currency',
        },
      ]

      render(<FinancialSummaryCard title="ملخص" metrics={singleMetric} />)

      expect(screen.getByText('واحد')).toBeInTheDocument()
      expect(screen.getByText('ر.س 100.00')).toBeInTheDocument()
    })

    it('renders metric description as title attribute', () => {
      const metricsWithDescription: FinancialMetric[] = [
        {
          id: 'desc',
          label: 'مع وصف',
          value: 100,
          type: 'currency',
          description: 'هذا وصف تفصيلي',
        },
      ]

      const { container } = render(
        <FinancialSummaryCard title="ملخص" metrics={metricsWithDescription} />,
      )

      const metric = container.querySelector('.financial-summary-card-metric')
      expect(metric).toHaveAttribute('title', 'هذا وصف تفصيلي')
    })

    it('handles negative values', () => {
      const negativeMetrics: FinancialMetric[] = [
        {
          id: 'negative',
          label: 'قيمة سالبة',
          value: -500,
          type: 'currency',
        },
      ]

      render(<FinancialSummaryCard title="ملخص" metrics={negativeMetrics} />)

      expect(screen.getByText('ر.س -500.00')).toBeInTheDocument()
    })
  })
})
