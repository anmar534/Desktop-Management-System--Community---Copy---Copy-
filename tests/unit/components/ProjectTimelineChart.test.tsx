import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectTimelineChart } from '@/presentation/components/projects/ProjectTimelineChart'

describe('ProjectTimelineChart', () => {
  const overview = {
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    progress: 68,
    health: 'on-track' as const,
    criticalPath: ['إعداد الموقع', 'تنفيذ الأساسات'],
  }

  const phases = [
    {
      id: 'phase-1',
      name: 'مرحلة التخطيط',
      startDate: '2025-01-01',
      endDate: '2025-02-15',
      progress: 100,
      status: 'completed' as const,
      owner: 'فريق التخطيط',
    },
    {
      id: 'phase-2',
      name: 'مرحلة التنفيذ',
      startDate: '2025-02-16',
      endDate: '2025-10-01',
      progress: 55,
      status: 'in-progress' as const,
    },
  ]

  const milestones = [
    {
      id: 'milestone-1',
      title: 'إنهاء أعمال الحفر',
      date: '2025-03-30',
      status: 'completed' as const,
      description: 'تم إنهاء جميع أعمال الحفر الأساسية.',
    },
    {
      id: 'milestone-2',
      title: 'بدء الأعمال الكهربائية',
      date: '2025-07-10',
      status: 'at-risk' as const,
      owner: 'فريق الكهرباء',
    },
  ]

  it('renders overview, phases, and milestones', () => {
    render(<ProjectTimelineChart overview={overview} phases={phases} milestones={milestones} />)

    expect(screen.getByTestId('timeline-overview')).toHaveTextContent('68%')
    expect(screen.getByTestId('timeline-phase-0')).toHaveTextContent('مرحلة التخطيط')
    expect(screen.getByTestId('timeline-milestone-1')).toHaveTextContent('بدء الأعمال الكهربائية')
  })

  it('invokes onViewCalendar when calendar button clicked', async () => {
    const onViewCalendar = vi.fn()
    const user = userEvent.setup()
    render(
      <ProjectTimelineChart
        overview={overview}
        phases={phases}
        milestones={milestones}
        actions={{ onViewCalendar }}
      />,
    )

    await user.click(screen.getByTestId('timeline-view-calendar'))
    expect(onViewCalendar).toHaveBeenCalledTimes(1)
  })

  it('invokes onAddMilestone when add milestone button clicked', async () => {
    const onAddMilestone = vi.fn()
    const user = userEvent.setup()
    render(
      <ProjectTimelineChart
        overview={overview}
        phases={phases}
        milestones={milestones}
        actions={{ onAddMilestone }}
      />,
    )

    await user.click(screen.getByTestId('timeline-add-milestone'))
    expect(onAddMilestone).toHaveBeenCalledTimes(1)
  })

  it('renders phase status badge', () => {
    render(<ProjectTimelineChart overview={overview} phases={phases} milestones={milestones} />)

    expect(screen.getByTestId('timeline-phase-status-0').textContent ?? '').toContain('اكتمل')
  })

  it('renders milestone status badge with correct label', () => {
    render(<ProjectTimelineChart overview={overview} phases={phases} milestones={milestones} />)

    expect(screen.getByTestId('timeline-milestone-status-1').textContent ?? '').toContain(
      'معرض للخطر',
    )
  })

  it('displays milestone description when provided', () => {
    render(<ProjectTimelineChart overview={overview} phases={phases} milestones={milestones} />)

    expect(screen.getByTestId('timeline-milestone-description-0')).toHaveTextContent(
      'تم إنهاء جميع أعمال الحفر',
    )
  })

  it('shows placeholder when no milestones provided', () => {
    render(<ProjectTimelineChart overview={overview} phases={phases} milestones={[]} />)

    expect(screen.getByTestId('timeline-no-milestones')).toBeInTheDocument()
  })

  it('shows placeholder when no phases provided', () => {
    render(<ProjectTimelineChart overview={overview} phases={[]} milestones={milestones} />)

    expect(screen.getByTestId('timeline-no-phases')).toBeInTheDocument()
  })

  it('clamps overall progress to 100 when above range', () => {
    render(
      <ProjectTimelineChart
        overview={{ ...overview, progress: 180 }}
        phases={phases}
        milestones={milestones}
      />,
    )

    expect(screen.getByTestId('timeline-overview')).toHaveTextContent('100%')
  })

  it('renders critical path entries as badges', () => {
    render(<ProjectTimelineChart overview={overview} phases={phases} milestones={milestones} />)

    expect(screen.getByTestId('timeline-critical-path')).toHaveTextContent('إعداد الموقع')
  })

  it('applies custom className to root card', () => {
    render(
      <ProjectTimelineChart
        overview={overview}
        phases={phases}
        milestones={milestones}
        className="custom-timeline"
      />,
    )

    expect(screen.getByTestId('project-timeline-chart').className).toContain('custom-timeline')
  })

  it('renders health indicator text when provided', () => {
    render(<ProjectTimelineChart overview={overview} phases={phases} milestones={milestones} />)

    expect(screen.getByTestId('timeline-health')).toHaveTextContent('ضمن الجدول')
  })

  it('supports upcoming milestone status label', () => {
    render(
      <ProjectTimelineChart
        overview={overview}
        phases={phases}
        milestones={[
          { id: 'milestone-3', title: 'اختبارات الجودة', date: '2025-11-15', status: 'upcoming' },
        ]}
      />,
    )

    expect(screen.getByTestId('timeline-milestone-status-0').textContent ?? '').toContain('قادمة')
  })

  it('shows phase owner label when provided', () => {
    render(<ProjectTimelineChart overview={overview} phases={phases} milestones={milestones} />)

    expect(screen.getByTestId('timeline-phase-0')).toHaveTextContent('فريق التخطيط')
  })

  it('omits milestone owner when not provided', () => {
    render(<ProjectTimelineChart overview={overview} phases={phases} milestones={milestones} />)

    const content = screen.getByTestId('timeline-milestone-0').textContent ?? ''
    expect(content).not.toContain('المسؤول:')
  })
})
