import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CostBreakdown, CostCategory } from '../../../src/presentation/components/CostBreakdown'

// Mock categories
const mockCategories: CostCategory[] = [
  { id: '1', label: 'مواد', amount: 50000 },
  { id: '2', label: 'عمالة', amount: 30000 },
  { id: '3', label: 'معدات', amount: 20000 },
]

const mockCategoriesWithChildren: CostCategory[] = [
  {
    id: '1',
    label: 'مواد',
    amount: 50000,
    children: [
      { id: '1-1', label: 'أسمنت', amount: 30000 },
      { id: '1-2', label: 'حديد', amount: 20000 },
    ],
  },
  { id: '2', label: 'عمالة', amount: 30000 },
  { id: '3', label: 'معدات', amount: 20000 },
]

describe('CostBreakdown', () => {
  describe('Basic Rendering', () => {
    it('should render categories', () => {
      render(<CostBreakdown categories={mockCategories} total={100000} />)

      expect(screen.getByText('مواد')).toBeInTheDocument()
      expect(screen.getByText('عمالة')).toBeInTheDocument()
      expect(screen.getByText('معدات')).toBeInTheDocument()
    })

    it('should render title', () => {
      render(<CostBreakdown categories={mockCategories} total={100000} title="تفاصيل التكاليف" />)

      expect(screen.getByText('تفاصيل التكاليف')).toBeInTheDocument()
    })

    it('should render total row', () => {
      render(<CostBreakdown categories={mockCategories} total={100000} />)

      expect(screen.getByText('الإجمالي')).toBeInTheDocument()
      expect(screen.getByText(/ر\.س 100,000/)).toBeInTheDocument()
    })

    it('should render empty state when no categories', () => {
      render(<CostBreakdown categories={[]} total={0} emptyMessage="لا توجد تكاليف" />)

      expect(screen.getByText('لا توجد تكاليف')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <CostBreakdown categories={mockCategories} total={100000} className="custom-breakdown" />,
      )

      expect(container.firstChild).toHaveClass('custom-breakdown')
    })

    it('should apply compact class when compact=true', () => {
      const { container } = render(
        <CostBreakdown categories={mockCategories} total={100000} compact />,
      )

      expect(container.firstChild).toHaveClass('cost-breakdown--compact')
    })
  })

  describe('Percentages', () => {
    it('should calculate and display percentages', () => {
      render(<CostBreakdown categories={mockCategories} total={100000} showPercentages />)

      expect(screen.getByText(/50\.0%/)).toBeInTheDocument() // مواد
      expect(screen.getByText(/30\.0%/)).toBeInTheDocument() // عمالة
      expect(screen.getByText(/20\.0%/)).toBeInTheDocument() // معدات
    })

    it('should not show percentages when showPercentages=false', () => {
      render(<CostBreakdown categories={mockCategories} total={100000} showPercentages={false} />)

      expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    })

    it('should handle zero total correctly', () => {
      render(<CostBreakdown categories={mockCategories} total={0} showPercentages />)

      // Should not crash with division by zero
      expect(screen.getByText('مواد')).toBeInTheDocument()
    })
  })

  describe('Amounts', () => {
    it('should display amounts', () => {
      render(<CostBreakdown categories={mockCategories} total={100000} showAmounts />)

      expect(screen.getByText(/ر\.س 50,000/)).toBeInTheDocument()
      expect(screen.getByText(/ر\.س 30,000/)).toBeInTheDocument()
      expect(screen.getByText(/ر\.س 20,000/)).toBeInTheDocument()
    })

    it('should not show amounts when showAmounts=false', () => {
      render(
        <CostBreakdown
          categories={mockCategories}
          total={100000}
          showAmounts={false}
          showPercentages={false}
        />,
      )

      const { container } = render(
        <CostBreakdown categories={mockCategories} total={100000} showAmounts={false} />,
      )

      expect(container.querySelector('.cost-breakdown-category-amount')).not.toBeInTheDocument()
    })
  })

  describe('Progress Bars', () => {
    it('should render progress bars', () => {
      const { container } = render(
        <CostBreakdown categories={mockCategories} total={100000} showProgressBars />,
      )

      const progressBars = container.querySelectorAll('.cost-breakdown-category-progress-bar')
      expect(progressBars).toHaveLength(3)
    })

    it('should not show progress bars when showProgressBars=false', () => {
      const { container } = render(
        <CostBreakdown categories={mockCategories} total={100000} showProgressBars={false} />,
      )

      const progressBars = container.querySelectorAll('.cost-breakdown-category-progress')
      expect(progressBars).toHaveLength(0)
    })

    it('should set progress bar width correctly', () => {
      const { container } = render(
        <CostBreakdown categories={mockCategories} total={100000} showProgressBars />,
      )

      const progressBars = container.querySelectorAll('.cost-breakdown-category-progress-bar')
      // Check widths using getAttribute since inline styles may not work with toHaveStyle
      expect((progressBars[0] as HTMLElement).style.width).toBe('50%') // 50,000 / 100,000
      expect((progressBars[1] as HTMLElement).style.width).toBe('30%') // 30,000 / 100,000
      expect((progressBars[2] as HTMLElement).style.width).toBe('20%') // 20,000 / 100,000
    })

    it('should apply custom color to progress bar', () => {
      const categoriesWithColors: CostCategory[] = [
        { id: '1', label: 'مواد', amount: 50000, color: '#ff0000' },
      ]

      const { container } = render(
        <CostBreakdown categories={categoriesWithColors} total={100000} showProgressBars />,
      )

      const progressBar = container.querySelector('.cost-breakdown-category-progress-bar')!
      expect((progressBar as HTMLElement).style.backgroundColor).toBe('rgb(255, 0, 0)')
    })
  })

  describe('Expandable Categories', () => {
    it('should show expand icon for categories with children', () => {
      render(<CostBreakdown categories={mockCategoriesWithChildren} total={100000} expandable />)

      const { container } = render(
        <CostBreakdown categories={mockCategoriesWithChildren} total={100000} expandable />,
      )

      expect(container.querySelector('.cost-breakdown-category-toggle')).toBeInTheDocument()
    })

    it('should not show expand icon when expandable=false', () => {
      const { container } = render(
        <CostBreakdown categories={mockCategoriesWithChildren} total={100000} expandable={false} />,
      )

      expect(container.querySelector('.cost-breakdown-category-toggle')).not.toBeInTheDocument()
    })

    it('should expand category on click', async () => {
      const user = userEvent.setup()
      render(<CostBreakdown categories={mockCategoriesWithChildren} total={100000} expandable />)

      // Children should not be visible initially
      expect(screen.queryByText('أسمنت')).not.toBeInTheDocument()

      // Click to expand
      await user.click(screen.getByText('مواد'))

      // Children should now be visible
      expect(screen.getByText('أسمنت')).toBeInTheDocument()
      expect(screen.getByText('حديد')).toBeInTheDocument()
    })

    it('should collapse expanded category on click', async () => {
      const user = userEvent.setup()
      render(
        <CostBreakdown
          categories={mockCategoriesWithChildren}
          total={100000}
          expandable
          defaultExpanded={['1']}
        />,
      )

      // Children should be visible initially
      expect(screen.getByText('أسمنت')).toBeInTheDocument()

      // Click to collapse
      await user.click(screen.getByText('مواد'))

      // Children should now be hidden
      expect(screen.queryByText('أسمنت')).not.toBeInTheDocument()
    })

    it('should respect defaultExpanded prop', () => {
      render(
        <CostBreakdown
          categories={mockCategoriesWithChildren}
          total={100000}
          expandable
          defaultExpanded={['1']}
        />,
      )

      // Children should be visible from the start
      expect(screen.getByText('أسمنت')).toBeInTheDocument()
      expect(screen.getByText('حديد')).toBeInTheDocument()
    })
  })

  describe('Category Click Handler', () => {
    it('should call onCategoryClick when category is clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(
        <CostBreakdown categories={mockCategories} total={100000} onCategoryClick={handleClick} />,
      )

      await user.click(screen.getByText('مواد'))

      expect(handleClick).toHaveBeenCalledWith(mockCategories[0])
    })

    it('should call onCategoryClick and toggle expansion for categories with children', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(
        <CostBreakdown
          categories={mockCategoriesWithChildren}
          total={100000}
          expandable
          onCategoryClick={handleClick}
        />,
      )

      await user.click(screen.getByText('مواد'))

      expect(handleClick).toHaveBeenCalledWith(mockCategoriesWithChildren[0])
      expect(screen.getByText('أسمنت')).toBeInTheDocument()
    })
  })

  describe('Nested Categories', () => {
    it('should render nested categories with proper indentation', () => {
      const { container } = render(
        <CostBreakdown
          categories={mockCategoriesWithChildren}
          total={100000}
          expandable
          defaultExpanded={['1']}
        />,
      )

      const nestedCategory = container.querySelector('[data-level="1"]')
      expect(nestedCategory).toBeInTheDocument()
    })

    it('should render deeply nested categories', () => {
      const deeplyNested: CostCategory[] = [
        {
          id: '1',
          label: 'Level 1',
          amount: 50000,
          children: [
            {
              id: '1-1',
              label: 'Level 2',
              amount: 30000,
              children: [{ id: '1-1-1', label: 'Level 3', amount: 15000 }],
            },
          ],
        },
      ]

      const { container } = render(
        <CostBreakdown
          categories={deeplyNested}
          total={100000}
          expandable
          defaultExpanded={['1', '1-1']}
        />,
      )

      expect(screen.getByText('Level 1')).toBeInTheDocument()
      expect(screen.getByText('Level 2')).toBeInTheDocument()
      expect(screen.getByText('Level 3')).toBeInTheDocument()

      expect(container.querySelector('[data-level="0"]')).toBeInTheDocument()
      expect(container.querySelector('[data-level="1"]')).toBeInTheDocument()
      expect(container.querySelector('[data-level="2"]')).toBeInTheDocument()
    })
  })

  describe('Category Icons and Descriptions', () => {
    it('should render category icons', () => {
      const categoriesWithIcons: CostCategory[] = [
        {
          id: '1',
          label: 'مواد',
          amount: 50000,
          icon: <span data-testid="icon">📦</span>,
        },
      ]

      render(<CostBreakdown categories={categoriesWithIcons} total={100000} />)

      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('should show description as title attribute', () => {
      const categoriesWithDescription: CostCategory[] = [
        {
          id: '1',
          label: 'مواد',
          amount: 50000,
          description: 'تكاليف المواد الخام',
        },
      ]

      const { container } = render(
        <CostBreakdown categories={categoriesWithDescription} total={100000} />,
      )

      const categoryHeader = container.querySelector('[title="تكاليف المواد الخام"]')
      expect(categoryHeader).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single category', () => {
      render(<CostBreakdown categories={[mockCategories[0]]} total={50000} />)

      expect(screen.getByText('مواد')).toBeInTheDocument()
    })

    it('should handle very large amounts', () => {
      const largeCategories: CostCategory[] = [{ id: '1', label: 'كبير', amount: 1000000000 }]

      const { container } = render(
        <CostBreakdown categories={largeCategories} total={1000000000} />,
      )

      const totalValue = container.querySelector('.cost-breakdown-total-value')
      expect(totalValue).toHaveTextContent(/ر\.س 1,000,000,000/)
    })

    it('should handle decimal amounts', () => {
      const decimalCategories: CostCategory[] = [{ id: '1', label: 'عنصر', amount: 1234.56 }]

      const { container } = render(
        <CostBreakdown categories={decimalCategories} total={1234.56} showAmounts />,
      )

      const totalValue = container.querySelector('.cost-breakdown-total-value')
      expect(totalValue).toHaveTextContent(/ر\.س 1,234\.56/)
    })
  })
})
