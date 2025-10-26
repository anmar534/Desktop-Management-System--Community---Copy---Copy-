import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectCostsPanel } from '@/presentation/components/projects/ProjectCostsPanel'

describe('ProjectCostsPanel', () => {
  const summary = {
    budget: 1500000,
    spent: 975000,
    currency: 'ر.س.',
    showVariance: true,
  }

  const baseProps = {
    summary,
    committed: 350000,
    forecast: 1600000,
    notes: ['يجب مراجعة عقود المقاولين قبل نهاية الربع الحالي.'],
    highlights: [{ label: 'هامش الربح', value: '12.5%', tone: 'positive' as const }],
    costBreakdown: [
      { label: 'المشتريات', amount: 450000, percentage: 30 },
      { label: 'العمالة', amount: 525000, percentage: 35 },
    ],
    boqAvailability: { hasProjectBoq: false, hasTenderBoq: true },
    actions: {
      onSyncPricing: vi.fn(),
      onImportBoq: vi.fn(),
      onAddCost: vi.fn(),
    },
  }

  it('renders panel with financial summary', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    expect(screen.getByTestId('project-costs-panel')).toBeInTheDocument()
    expect(screen.getByTestId('financial-summary-compact')).toBeInTheDocument()
  })

  it('displays cost consumption progress value', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    expect(screen.getByTestId('cost-consumption-value')).toHaveTextContent('65%')
  })

  it('calls onSyncPricing when sync button clicked', async () => {
    const user = userEvent.setup()
    const onSync = vi.fn()
    render(
      <ProjectCostsPanel
        {...baseProps}
        actions={{ ...baseProps.actions, onSyncPricing: onSync }}
      />,
    )
    await user.click(screen.getByTestId('sync-pricing-button'))
    expect(onSync).toHaveBeenCalledTimes(1)
  })

  it('shows import button when tender BOQ is available but project BOQ missing', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    expect(screen.getByTestId('import-boq-button')).toBeInTheDocument()
  })

  it('hides import button when project BOQ exists', () => {
    render(
      <ProjectCostsPanel
        {...baseProps}
        boqAvailability={{ hasProjectBoq: true, hasTenderBoq: true }}
      />,
    )
    expect(screen.queryByTestId('import-boq-button')).toBeNull()
  })

  it('shows add cost button when provided', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    expect(screen.getByTestId('add-cost-button')).toBeInTheDocument()
  })

  it('renders committed metric value', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    const text = screen.getByTestId('cost-metric-committed').textContent ?? ''
    expect(text).toMatch(/٣٥٠|350/)
  })

  it('renders forecast metric value', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    const text = screen.getByTestId('cost-metric-forecast').textContent ?? ''
    expect(text).toMatch(/١٬٦٠٠|1,600|1600/)
  })

  it('renders positive variance indicator when over budget', () => {
    render(<ProjectCostsPanel {...baseProps} summary={{ ...summary, spent: 1700000 }} />)
    const variance = screen.getByTestId('cost-variance-value')
    expect(variance.className).toMatch(/text-error/)
    const text = variance.textContent ?? ''
    expect(text).toMatch(/\+/)
    expect(text).toMatch(/13\.3%|١٣[٫.]٣%/)
  })

  it('renders negative variance indicator when under budget', () => {
    render(<ProjectCostsPanel {...baseProps} summary={{ ...summary, spent: 900000 }} />)
    const variance = screen.getByTestId('cost-variance-value')
    expect(variance.className).toMatch(/text-success|text-warning/)
    const text = variance.textContent ?? ''
    expect(text).toMatch(/-/)
    expect(text).toMatch(/40\.0%|٤٠[٫.]٠%/)
  })

  it('uses provided variance value when supplied', () => {
    render(<ProjectCostsPanel {...baseProps} variance={125000} />)
    const variance = screen.getByTestId('cost-variance-value').textContent ?? ''
    expect(variance).toMatch(/١٢٥|125/)
  })

  it('renders highlights', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    expect(screen.getByTestId('cost-highlight-0')).toHaveTextContent('هامش الربح')
  })

  it('renders cost breakdown entries', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    expect(screen.getByTestId('cost-breakdown-item-0')).toHaveTextContent('المشتريات')
    expect(screen.getByTestId('cost-breakdown-item-1')).toHaveTextContent('العمالة')
  })

  it('renders notes list', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    expect(screen.getByTestId('costs-notes')).toHaveTextContent('يجب مراجعة عقود المقاولين')
  })

  it('applies custom className', () => {
    render(<ProjectCostsPanel {...baseProps} className="custom-panel" />)
    expect(screen.getByTestId('project-costs-panel').className).toContain('custom-panel')
  })

  it('hides actions container when no actions provided', () => {
    render(<ProjectCostsPanel {...baseProps} actions={undefined} />)
    expect(screen.queryByTestId('costs-actions')).toBeNull()
  })

  it('shows positive BOQ status when project BOQ exists', () => {
    render(
      <ProjectCostsPanel
        {...baseProps}
        boqAvailability={{ hasProjectBoq: true, hasTenderBoq: true }}
      />,
    )
    expect(screen.getByTestId('boq-status').textContent).toContain('BOQ مرتبط بالمشروع')
  })

  it('shows warning BOQ status when tender BOQ available only', () => {
    render(<ProjectCostsPanel {...baseProps} />)
    expect(screen.getByTestId('boq-status').textContent).toContain('يوجد BOQ للمنافسة')
  })

  it('sets consumption to zero when budget is zero', () => {
    render(<ProjectCostsPanel {...baseProps} summary={{ ...summary, budget: 0, spent: 0 }} />)
    expect(screen.getByTestId('cost-consumption-value')).toHaveTextContent('0%')
  })

  it('handles absence of highlights gracefully', () => {
    render(<ProjectCostsPanel {...baseProps} highlights={[]} />)
    expect(screen.queryByTestId('costs-highlights')).toBeNull()
  })

  it('handles absence of cost breakdown gracefully', () => {
    render(<ProjectCostsPanel {...baseProps} costBreakdown={[]} />)
    expect(screen.queryByTestId('costs-breakdown')).toBeNull()
  })

  it('renders variance percentage with plus sign when over budget', () => {
    render(<ProjectCostsPanel {...baseProps} summary={{ ...summary, spent: 1650000 }} />)
    expect(screen.getByTestId('cost-variance-value').textContent ?? '').toContain('+10.0%')
  })
})
