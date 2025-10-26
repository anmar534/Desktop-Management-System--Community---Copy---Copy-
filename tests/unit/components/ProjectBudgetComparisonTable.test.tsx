import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectBudgetComparisonTable } from '@/presentation/components/projects/ProjectBudgetComparisonTable'

describe('ProjectBudgetComparisonTable', () => {
  const summary = {
    plannedTotal: 1250000,
    actualTotal: 1185000,
    currency: 'ر.س.',
    overBudgetItems: 2,
    underBudgetItems: 3,
    onTrackItems: 4,
  }

  const items = [
    {
      id: 'item-1',
      description: 'أعمال الحفر',
      planned: 250000,
      actual: 300000,
      quantity: 500,
      unit: 'م٣',
      category: 'البنية التحتية',
      status: 'over-budget' as const,
      notes: ['زيادة في تكاليف المعدات الثقيلة.'],
    },
    {
      id: 'item-2',
      description: 'الأعمال الكهربائية',
      planned: 180000,
      actual: 150000,
      quantity: 120,
      unit: 'ساعة',
      category: 'الكهرباء',
      status: 'under-budget' as const,
    },
  ]

  it('renders summary metrics', () => {
    render(
      <ProjectBudgetComparisonTable
        summary={{ ...summary, varianceTotal: -65000, variancePercentage: -5.2 }}
        items={items}
      />,
    )

    expect(screen.getByTestId('budget-summary-planned').textContent ?? '').toMatch(/١٬٢٥٠|1,250/)
    expect(screen.getByTestId('budget-summary-actual').textContent ?? '').toMatch(/١٬١٨٥|1,185/)
    const variance = screen.getByTestId('budget-summary-variance').textContent ?? ''
    expect(variance).toMatch(/٦٥|65/)
    expect(variance).toMatch(/-5[.]2%|٥[٫.]٢%/)
  })

  it('renders table rows with variance and status badges', () => {
    render(
      <ProjectBudgetComparisonTable
        summary={{ ...summary, varianceTotal: -65000, variancePercentage: -5.2 }}
        items={items}
      />,
    )

    expect(screen.getByTestId('budget-row-0')).toHaveTextContent('أعمال الحفر')
    expect(screen.getByTestId('budget-row-1')).toHaveTextContent('الأعمال الكهربائية')
    expect(screen.getByTestId('budget-row-status-0').textContent ?? '').toContain('تجاوز')
    expect(screen.getByTestId('budget-row-status-1').textContent ?? '').toContain('توفير')
  })

  it('invokes refresh action when button is clicked', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    render(<ProjectBudgetComparisonTable summary={summary} items={items} actions={{ onRefresh }} />)

    await user.click(screen.getByTestId('budget-refresh-button'))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('invokes export action when button is clicked', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    render(<ProjectBudgetComparisonTable summary={summary} items={items} actions={{ onExport }} />)

    await user.click(screen.getByTestId('budget-export-button'))
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when items list is empty', () => {
    render(
      <ProjectBudgetComparisonTable
        summary={summary}
        items={[]}
        emptyState={{ title: 'لا توجد بيانات', description: 'قم بالمزامنة لبدء التحليل.' }}
      />,
    )

    expect(screen.getByTestId('budget-empty-state')).toHaveTextContent('لا توجد بيانات')
  })

  it('displays loading indicator when loading is true', () => {
    render(<ProjectBudgetComparisonTable summary={summary} items={items} loading />)

    expect(screen.getByTestId('budget-loading')).toBeInTheDocument()
  })

  it('renders highlight badges', () => {
    render(
      <ProjectBudgetComparisonTable
        summary={summary}
        items={items}
        highlights={[{ label: 'هامش الربح', value: '14.2%', tone: 'positive' }]}
      />,
    )

    expect(screen.getByTestId('budget-highlight-0')).toHaveTextContent('هامش الربح')
  })

  it('computes variance when not provided', () => {
    render(<ProjectBudgetComparisonTable summary={summary} items={items} />)

    const variance = screen.getByTestId('budget-row-variance-0').textContent ?? ''
    expect(variance).toMatch(/\+50000|\+٥٠/)
  })

  it('renders item notes when present', () => {
    render(<ProjectBudgetComparisonTable summary={summary} items={items} />)

    expect(screen.getByTestId('budget-row-notes-0')).toHaveTextContent('زيادة في تكاليف المعدات')
  })

  it('appends custom currency labels when provided', () => {
    render(
      <ProjectBudgetComparisonTable
        summary={{ ...summary, currency: 'ريال سعودي' }}
        items={items}
      />,
    )

    expect(screen.getByTestId('budget-summary-planned').textContent ?? '').toContain('ريال سعودي')
  })

  it('defaults breakdown counts to zero when not supplied', () => {
    render(
      <ProjectBudgetComparisonTable summary={{ plannedTotal: 0, actualTotal: 0 }} items={[]} />,
    )

    expect(screen.getByTestId('budget-summary-breakdown')).toHaveTextContent('0')
  })

  it('clamps variance percentage within bounds', () => {
    render(
      <ProjectBudgetComparisonTable
        summary={{ ...summary, plannedTotal: 1000, actualTotal: 4000 }}
        items={items}
      />,
    )

    const variance = screen.getByTestId('budget-summary-variance').textContent ?? ''
    expect(variance).toMatch(/\+100[.]0%|\+١٠٠[٫.]٠%/)
  })

  it('renders fallback unit symbol when missing', () => {
    render(
      <ProjectBudgetComparisonTable
        summary={summary}
        items={[{ id: 'fallback', description: 'عنصر بدون كمية', planned: 10, actual: 8 }]}
      />,
    )

    expect(screen.getByTestId('budget-row-0')).toHaveTextContent('—')
  })

  it('renders category fallback text when not supplied', () => {
    render(
      <ProjectBudgetComparisonTable
        summary={summary}
        items={[{ id: 'no-category', description: 'عنصر بدون فئة', planned: 40, actual: 60 }]}
      />,
    )

    expect(screen.getByTestId('budget-row-0')).toHaveTextContent('غير محدد')
  })

  it('formats negative variance values correctly', () => {
    render(
      <ProjectBudgetComparisonTable
        summary={summary}
        items={[{ id: 'variance', description: 'عنصر موفر', planned: 200, actual: 150 }]}
      />,
    )

    const text = screen.getByTestId('budget-row-variance-0').textContent ?? ''
    expect(text.trim().startsWith('-')).toBe(true)
  })
})
