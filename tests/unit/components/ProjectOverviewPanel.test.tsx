import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectOverviewPanel } from '@/presentation/components/projects/ProjectOverviewPanel'

describe('ProjectOverviewPanel', () => {
  const baseProps = {
    project: {
      name: 'مشروع تطوير الميناء',
      code: 'PRJ-204',
      client: 'شركة البحر الأحمر',
      manager: 'عبدالله الشهري',
      location: 'جدة',
      status: 'active',
      priority: 'high',
      progress: 68,
      description: 'مشروع استراتيجي لتحديث البنية التحتية للميناء الرئيسي.',
    },
    dates: {
      start: '2025-01-10',
      end: '2025-12-15',
      lastUpdated: '2025-10-20',
    },
    tags: ['البنية التحتية', 'الرؤية 2030'],
    metrics: [
      { label: 'نسبة الإنجاز الفعلية', value: '65%', tone: 'positive' as const },
      { label: 'مؤشر المخاطر', value: 'متوسط', tone: 'warning' as const },
    ],
    financialSummary: {
      budget: 2500000,
      spent: 1625000,
      currency: 'ر.س.',
      showVariance: true,
    },
  }

  it('renders project name and code', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    expect(screen.getByTestId('project-name')).toHaveTextContent('مشروع تطوير الميناء')
    expect(screen.getByTestId('project-code')).toHaveTextContent('PRJ-204')
  })

  it('shows status badge text', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    expect(screen.getByTestId('status-badge-active')).toHaveTextContent('نشط')
  })

  it('renders priority badge with label', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    expect(screen.getByTestId('project-priority')).toHaveTextContent('عالية')
  })

  it('renders progress label with value', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    expect(screen.getByTestId('project-progress-value')).toHaveTextContent('68%')
    expect(screen.getByTestId('progress-label-outside')).toHaveTextContent('68%')
  })

  it('defaults progress to zero when not provided', () => {
    render(
      <ProjectOverviewPanel
        {...baseProps}
        project={{ ...baseProps.project, progress: undefined }}
      />,
    )
    expect(screen.getByTestId('project-progress-value')).toHaveTextContent('0%')
  })

  it('invokes onViewClient callback when button clicked', async () => {
    const onViewClient = vi.fn()
    const user = userEvent.setup()
    render(<ProjectOverviewPanel {...baseProps} onViewClient={onViewClient} />)
    await user.click(screen.getByTestId('view-client-button'))
    expect(onViewClient).toHaveBeenCalledTimes(1)
  })

  it('hides client button when callback is not provided', () => {
    render(<ProjectOverviewPanel {...baseProps} onViewClient={undefined} />)
    expect(screen.queryByTestId('view-client-button')).toBeNull()
  })

  it('renders location fallback when missing', () => {
    render(<ProjectOverviewPanel {...baseProps} project={{ ...baseProps.project, location: '' }} />)
    expect(screen.getByTestId('project-location')).toHaveTextContent('غير محدد')
  })

  it('renders manager fallback when missing', () => {
    render(
      <ProjectOverviewPanel
        {...baseProps}
        project={{ ...baseProps.project, manager: undefined }}
      />,
    )
    expect(screen.getByTestId('project-manager')).toHaveTextContent('غير معين')
  })

  it('renders description block', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    expect(screen.getByTestId('project-description')).toHaveTextContent(
      'مشروع استراتيجي لتحديث البنية التحتية للميناء الرئيسي.',
    )
  })

  it('renders quick metrics with tone classes', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    const metric = screen.getByTestId('project-metric-0')
    expect(metric.className).toMatch(/text-success/)
  })

  it('renders tags list', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    const tags = screen.getByTestId('project-tags')
    expect(tags.textContent).toContain('البنية التحتية')
    expect(tags.textContent).toContain('الرؤية 2030')
  })

  it('renders start and end dates when provided', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    expect(screen.getByTestId('project-start-date')).toHaveTextContent('2025-01-10')
    expect(screen.getByTestId('project-end-date')).toHaveTextContent('2025-12-15')
  })

  it('renders last updated date when provided', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    expect(screen.getByTestId('project-updated-date')).toHaveTextContent('2025-10-20')
  })

  it('renders financial summary when data provided', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    expect(screen.getByTestId('financial-summary-card')).toBeInTheDocument()
  })

  it('omits financial summary when not provided', () => {
    const { queryByTestId } = render(
      <ProjectOverviewPanel {...baseProps} financialSummary={undefined} />,
    )
    expect(queryByTestId('financial-summary-card')).toBeNull()
  })

  it('applies custom className to root', () => {
    render(<ProjectOverviewPanel {...baseProps} className="custom-grid" />)
    expect(screen.getByTestId('project-overview-panel').className).toContain('custom-grid')
  })

  it('clamps progress above 100 to 100%', () => {
    render(
      <ProjectOverviewPanel {...baseProps} project={{ ...baseProps.project, progress: 140 }} />,
    )
    expect(screen.getByTestId('project-progress-value')).toHaveTextContent('100%')
  })

  it('supports Arabic numerals inside metrics', () => {
    render(
      <ProjectOverviewPanel
        {...baseProps}
        metrics={[{ label: 'المصاريف المحققة', value: '٢٫٧ مليون', tone: 'positive' }]}
      />,
    )
    const metric = screen.getByTestId('project-metric-0').textContent ?? ''
    expect(metric).toMatch(/٢|2/)
  })

  it('renders priority info row text', () => {
    render(<ProjectOverviewPanel {...baseProps} />)
    expect(screen.getByTestId('project-priority-label')).toHaveTextContent('عالية')
  })
})
