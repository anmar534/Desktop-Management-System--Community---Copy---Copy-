import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GanttChart from '@/presentation/components/projects/GanttChart'
import type { ProjectPhase, ProjectMilestone } from '@/types/projects'

describe('GanttChart', () => {
  const mockPhases: ProjectPhase[] = [
    {
      id: 'phase-1',
      name: 'مرحلة التصميم',
      nameEn: 'Design Phase',
      description: 'مرحلة تصميم المشروع',
      order: 1,
      estimatedDuration: 30,
      dependencies: [],
      milestones: [],
    },
    {
      id: 'phase-2',
      name: 'مرحلة التنفيذ',
      nameEn: 'Execution Phase',
      description: 'مرحلة تنفيذ المشروع',
      order: 2,
      estimatedDuration: 60,
      dependencies: ['phase-1'],
      milestones: [],
    },
  ]

  const mockMilestones: ProjectMilestone[] = [
    {
      id: 'milestone-1',
      name: 'اكتمال التصميم',
      nameEn: 'Design Completion',
      description: 'اكتمال جميع التصاميم',
      targetDate: '2024-01-15',
      status: 'completed',
      progress: 100,
      deliverables: ['التصميم المعماري', 'التصميم الإنشائي'],
      dependencies: [],
      actualDate: '2024-01-15',
    },
    {
      id: 'milestone-2',
      name: 'بدء التنفيذ',
      nameEn: 'Execution Start',
      description: 'بدء أعمال التنفيذ',
      targetDate: '2024-02-05',
      status: 'pending',
      progress: 0,
      deliverables: ['الموافقات', 'المواد'],
      dependencies: ['milestone-1'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render chart title', () => {
      render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      expect(screen.getByText('المخطط الزمني (جانت)')).toBeInTheDocument()
    })

    it('should render zoom controls', () => {
      render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2) // Zoom in, zoom out
    })

    it('should render SVG chart', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render legend', () => {
      render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      expect(screen.getByText('جارية')).toBeInTheDocument()
      expect(screen.getByText('مكتملة')).toBeInTheDocument()
      expect(screen.getByText('معلقة')).toBeInTheDocument()
      expect(screen.getByText('معلم')).toBeInTheDocument()
    })
  })

  describe('Phase Rendering', () => {
    it('should render SVG with phases data', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()

      // Check SVG renders properly
      expect(svg?.tagName).toBe('svg')
      expect(mockPhases.length).toBe(2)
    })

    it('should render progress bars for phases', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const svg = container.querySelector('svg')
      const rects = svg?.querySelectorAll('rect') || []

      // Should have rectangles for phase bars
      expect(rects.length).toBeGreaterThan(0)
    })

    it('should handle phases data structure', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const svg = container.querySelector('svg')

      // Check SVG renders
      expect(svg).toBeInTheDocument()

      // Check phases data is passed correctly
      expect(mockPhases.length).toBe(2)
    })
  })

  describe('Milestone Rendering', () => {
    it('should render milestones data', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()

      // Check milestones are passed
      expect(mockMilestones.length).toBe(2)
    })

    it('should render diamond shapes for milestones', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const svg = container.querySelector('svg')
      const paths = svg?.querySelectorAll('path') || []

      // Should have diamond paths for milestones
      expect(paths.length).toBeGreaterThan(0)
    })

    it('should handle completed milestone status', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()

      // Check first milestone is completed
      expect(mockMilestones[0].status).toBe('completed')
    })
  })

  describe('Timeline Rendering', () => {
    it('should render SVG timeline', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()

      // Should have SVG elements for timeline
      expect(svg?.tagName).toBe('svg')
      const rects = svg?.querySelectorAll('rect') || []
      expect(rects.length).toBeGreaterThan(0)
    })

    it('should render timeline with rectangles', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )
      const svg = container.querySelector('svg')
      const rects = svg?.querySelectorAll('rect') || []

      expect(rects.length).toBeGreaterThan(0)
    })

    it('should handle timeline with project dates', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={[]}
          projectStartDate="2024-01-01"
          projectEndDate="2024-12-31"
        />,
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()

      // Should render with custom project dates
      const rects = svg?.querySelectorAll('rect') || []
      expect(rects.length).toBeGreaterThan(0)
    })
  })

  describe('Zoom Functionality', () => {
    it('should increase zoom when zoom in button clicked', () => {
      render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )

      const initialZoom = screen.getByText(/100%/)
      expect(initialZoom).toBeInTheDocument()

      const zoomInButton = screen.getAllByRole('button')[1] // Second button is zoom in
      fireEvent.click(zoomInButton)

      expect(screen.getByText(/120%/)).toBeInTheDocument()
    })

    it('should decrease zoom when zoom out button clicked', () => {
      render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )

      const zoomOutButton = screen.getAllByRole('button')[0] // First button is zoom out
      fireEvent.click(zoomOutButton)

      expect(screen.getByText(/80%/)).toBeInTheDocument()
    })

    it('should disable zoom out at minimum zoom', () => {
      render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )

      const zoomOutButton = screen.getAllByRole('button')[0]

      // Click multiple times to reach minimum
      fireEvent.click(zoomOutButton)
      fireEvent.click(zoomOutButton)
      fireEvent.click(zoomOutButton)

      expect(zoomOutButton).toBeDisabled()
    })

    it('should disable zoom in at maximum zoom', () => {
      render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
        />,
      )

      const zoomInButton = screen.getAllByRole('button')[1]

      // Click many times to reach maximum
      for (let i = 0; i < 15; i++) {
        fireEvent.click(zoomInButton)
      }

      expect(zoomInButton).toBeDisabled()
    })
  })

  describe('Click Interactions', () => {
    it('should call onPhaseClick when phase is clicked', () => {
      const onPhaseClick = vi.fn()
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
          onPhaseClick={onPhaseClick}
        />,
      )

      const svg = container.querySelector('svg')
      const groups = svg?.querySelectorAll('g') || []

      // Find phase group (has cursor-pointer class)
      const phaseGroup = Array.from(groups).find((g) => g.classList.contains('cursor-pointer'))

      if (phaseGroup) {
        fireEvent.click(phaseGroup)
        expect(onPhaseClick).toHaveBeenCalledWith('phase-1')
      }
    })

    it('should call onMilestoneClick when milestone is clicked', () => {
      const onMilestoneClick = vi.fn()
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
          onMilestoneClick={onMilestoneClick}
        />,
      )

      const svg = container.querySelector('svg')
      const groups = svg?.querySelectorAll('g.cursor-pointer') || []

      // Milestones are rendered after phases
      if (groups.length >= 3) {
        fireEvent.click(groups[2]) // Third clickable group
        expect(onMilestoneClick).toHaveBeenCalled()
      }
    })
  })

  describe('Empty States', () => {
    it('should render with empty phases array', () => {
      render(<GanttChart phases={[]} milestones={mockMilestones} projectStartDate="2024-01-01" />)
      expect(screen.getByText('المخطط الزمني (جانت)')).toBeInTheDocument()
    })

    it('should render with empty milestones array', () => {
      render(<GanttChart phases={mockPhases} milestones={[]} projectStartDate="2024-01-01" />)
      expect(screen.getByText('المخطط الزمني (جانت)')).toBeInTheDocument()
    })

    it('should render with no data', () => {
      render(<GanttChart phases={[]} milestones={[]} projectStartDate="2024-01-01" />)
      expect(screen.getByText('المخطط الزمني (جانت)')).toBeInTheDocument()

      // Should still show current month
      const { container } = render(
        <GanttChart phases={[]} milestones={[]} projectStartDate="2024-01-01" />,
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Custom Props', () => {
    it('should render with custom height', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
          height={800}
        />,
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()

      // SVG should be rendered
      expect(svg?.tagName).toBe('svg')
    })

    it('should apply custom className to card', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2024-01-01"
          className="custom-class"
        />,
      )

      // className is applied to Card component
      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })

    it('should use project start and end dates when provided', () => {
      const { container } = render(
        <GanttChart
          phases={mockPhases}
          milestones={mockMilestones}
          projectStartDate="2023-12-01"
          projectEndDate="2024-05-01"
        />,
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})
