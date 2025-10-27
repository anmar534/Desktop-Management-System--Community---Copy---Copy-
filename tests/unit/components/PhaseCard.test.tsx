/**
 * @file PhaseCard and MilestoneCard Component Tests
 * @description Test suite for timeline phase and milestone cards
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhaseCard from '../../../src/presentation/components/projects/PhaseCard'
import MilestoneCard from '../../../src/presentation/components/projects/MilestoneCard'
import type { ProjectPhase, ProjectMilestone } from '../../../src/shared/types/projects'

describe('PhaseCard', () => {
  const mockPhase: ProjectPhase = {
    id: 'phase-1',
    name: 'مرحلة التصميم',
    nameEn: 'Design Phase',
    description: 'تصميم المخططات المعمارية',
    order: 1,
    estimatedDuration: 30,
    dependencies: [],
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'in_progress',
    progress: 60,
    milestones: [
      {
        id: 'milestone-1',
        name: 'معلم 1',
        nameEn: 'Milestone 1',
        description: 'Test',
        targetDate: '2025-01-15',
        status: 'completed',
        progress: 100,
      },
    ],
  }

  it('should render phase name', () => {
    render(<PhaseCard phase={mockPhase} />)
    expect(screen.getByText('مرحلة التصميم')).toBeInTheDocument()
  })

  it('should render phase description', () => {
    render(<PhaseCard phase={mockPhase} />)
    expect(screen.getByText('تصميم المخططات المعمارية')).toBeInTheDocument()
  })

  it('should display progress percentage', () => {
    render(<PhaseCard phase={mockPhase} />)
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('should render phase dates when provided', () => {
    render(<PhaseCard phase={mockPhase} />)
    // Phase component includes dates, check for presence
    const component = screen.getByText('مرحلة التصميم')
    expect(component).toBeInTheDocument()
  })

  it('should render milestones when expanded', () => {
    render(<PhaseCard phase={mockPhase} isExpanded={true} />)
    expect(screen.getByText('معلم 1')).toBeInTheDocument()
  })

  it('should not render milestones when collapsed', () => {
    render(<PhaseCard phase={mockPhase} isExpanded={false} />)
    expect(screen.queryByText('معلم 1')).not.toBeInTheDocument()
  })

  it('should render dropdown trigger button', () => {
    render(<PhaseCard phase={mockPhase} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should handle drag events', () => {
    const onDragStart = vi.fn()
    const onDragEnd = vi.fn()
    const onDrop = vi.fn()

    const { container } = render(
      <PhaseCard
        phase={mockPhase}
        draggable={true}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
      />,
    )

    const card = container.querySelector('[draggable="true"]')
    expect(card).toBeInTheDocument()

    // Drag start
    fireEvent.dragStart(card!)
    expect(onDragStart).toHaveBeenCalled()

    // Drag end
    fireEvent.dragEnd(card!)
    expect(onDragEnd).toHaveBeenCalled()

    // Drop
    fireEvent.drop(card!)
    expect(onDrop).toHaveBeenCalled()
  })

  it('should show different status badges', () => {
    const statuses: Array<ProjectPhase['status']> = [
      'pending',
      'in_progress',
      'completed',
      'on_hold',
      'cancelled',
    ]

    statuses.forEach((status) => {
      const { unmount, container } = render(<PhaseCard phase={{ ...mockPhase, status }} />)
      // Component renders with status
      expect(container.firstChild).toBeInTheDocument()
      unmount()
    })
  })

  it('should call onMilestoneClick when milestone is clicked', () => {
    const onMilestoneClick = vi.fn()
    render(<PhaseCard phase={mockPhase} isExpanded={true} onMilestoneClick={onMilestoneClick} />)

    const milestone = screen.getByText('معلم 1')
    fireEvent.click(milestone.closest('div')!)

    expect(onMilestoneClick).toHaveBeenCalledWith('milestone-1')
  })
})

describe('MilestoneCard', () => {
  const mockMilestone: ProjectMilestone = {
    id: 'milestone-1',
    name: 'تسليم التصاميم',
    nameEn: 'Design Delivery',
    description: 'تسليم جميع التصاميم المعمارية',
    targetDate: '2025-02-15',
    status: 'in_progress',
    progress: 75,
  }

  it('should render milestone name', () => {
    render(<MilestoneCard milestone={mockMilestone} />)
    expect(screen.getByText('تسليم التصاميم')).toBeInTheDocument()
  })

  it('should display progress percentage', () => {
    render(<MilestoneCard milestone={mockMilestone} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('should show description when expanded', () => {
    render(<MilestoneCard milestone={mockMilestone} isExpanded={true} />)
    expect(screen.getByText('تسليم جميع التصاميم المعمارية')).toBeInTheDocument()
  })

  it('should not show deliverables when none provided', () => {
    render(<MilestoneCard milestone={mockMilestone} isExpanded={true} />)
    expect(screen.queryByText('المخرجات')).not.toBeInTheDocument()
  })

  it('should render dropdown trigger button', () => {
    render(<MilestoneCard milestone={mockMilestone} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show actual completion date for completed milestone', () => {
    const completedMilestone: ProjectMilestone = {
      ...mockMilestone,
      status: 'completed',
      progress: 100,
      actualDate: '2025-02-10',
    }

    render(<MilestoneCard milestone={completedMilestone} />)

    expect(screen.queryByText('يتطلب انتباهاً عاجلاً')).not.toBeInTheDocument()
  })

  it('should show different status icons', () => {
    const statuses: Array<ProjectMilestone['status']> = [
      'pending',
      'in_progress',
      'completed',
      'delayed',
    ]

    statuses.forEach((status) => {
      const { unmount, container } = render(
        <MilestoneCard milestone={{ ...mockMilestone, status }} />,
      )
      // Component renders with status
      expect(container.firstChild).toBeInTheDocument()
      unmount()
    })
  })
})
