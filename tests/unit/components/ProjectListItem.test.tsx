/**
 * Tests for ProjectListItem Component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectListItem } from '@/presentation/components/projects/ProjectListItem'
import type { EnhancedProject } from '@/shared/types/projects'

const mockProject: EnhancedProject = {
  id: 'proj-1',
  name: 'Test Project',
  client: 'Test Client',
  status: 'active',
  budget: 100000,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  progress: 60,
  location: 'Riyadh',
  phase: 'Implementation',
  estimatedCost: 95000,
}

describe('ProjectListItem', () => {
  // ========================================================================
  // Rendering
  // ========================================================================

  describe('Rendering', () => {
    it('should render project name', () => {
      render(<ProjectListItem project={mockProject} />)
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('should render client name', () => {
      render(<ProjectListItem project={mockProject} />)
      expect(screen.getByText('Test Client')).toBeInTheDocument()
    })

    it('should render status badge', () => {
      render(<ProjectListItem project={mockProject} />)
      expect(screen.getByText('active')).toBeInTheDocument()
    })

    it('should render progress percentage', () => {
      render(<ProjectListItem project={mockProject} />)
      expect(screen.getByText('60%')).toBeInTheDocument()
    })

    it('should display budget', () => {
      render(<ProjectListItem project={mockProject} />)
      // Budget is displayed in Arabic numerals: "١٠٠ ألف ر.س.‏"
      expect(screen.getByText(/ألف/)).toBeInTheDocument()
    })
  })

  // ========================================================================
  // Click Interactions
  // ========================================================================

  describe('Click Interactions', () => {
    it('should call onClick when item is clicked', () => {
      const handleClick = vi.fn()
      render(<ProjectListItem project={mockProject} onClick={handleClick} />)

      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledWith(mockProject)
    })

    it('should call onClick on Enter key', () => {
      const handleClick = vi.fn()
      render(<ProjectListItem project={mockProject} onClick={handleClick} />)

      const item = screen.getByRole('button')
      fireEvent.keyDown(item, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledWith(mockProject)
    })

    it('should call onClick on Space key', () => {
      const handleClick = vi.fn()
      render(<ProjectListItem project={mockProject} onClick={handleClick} />)

      const item = screen.getByRole('button')
      fireEvent.keyDown(item, { key: ' ' })
      expect(handleClick).toHaveBeenCalledWith(mockProject)
    })

    it('should not be clickable when onClick is not provided', () => {
      const { container } = render(<ProjectListItem project={mockProject} />)
      const item = container.firstChild as HTMLElement
      expect(item).not.toHaveAttribute('role', 'button')
      expect(item).not.toHaveAttribute('tabIndex')
    })
  })

  // ========================================================================
  // Selection
  // ========================================================================

  describe('Selection', () => {
    it('should show checkbox when showSelection is true', () => {
      render(<ProjectListItem project={mockProject} showSelection />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should hide checkbox when showSelection is false', () => {
      render(<ProjectListItem project={mockProject} showSelection={false} />)
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('should reflect selected state', () => {
      render(<ProjectListItem project={mockProject} selected showSelection />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should call onSelect when checkbox is toggled', () => {
      const handleSelect = vi.fn()
      render(<ProjectListItem project={mockProject} showSelection onSelect={handleSelect} />)

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      expect(handleSelect).toHaveBeenCalledWith(mockProject, true)
    })

    it('should not trigger onClick when checkbox is clicked', () => {
      const handleClick = vi.fn()
      const handleSelect = vi.fn()
      render(
        <ProjectListItem
          project={mockProject}
          onClick={handleClick}
          onSelect={handleSelect}
          showSelection
        />,
      )

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      expect(handleSelect).toHaveBeenCalled()
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  // ========================================================================
  // Styling
  // ========================================================================

  describe('Styling', () => {
    it('should apply selected background when selected', () => {
      const { container } = render(<ProjectListItem project={mockProject} selected />)
      const item = container.firstChild as HTMLElement
      expect(item.className).toContain('bg-primary/5')
    })

    it('should apply hover styles', () => {
      const { container } = render(<ProjectListItem project={mockProject} />)
      const item = container.firstChild as HTMLElement
      expect(item.className).toContain('hover:bg-muted/50')
    })

    it('should apply cursor-pointer when clickable', () => {
      const { container } = render(<ProjectListItem project={mockProject} onClick={vi.fn()} />)
      const item = container.firstChild as HTMLElement
      expect(item.className).toContain('cursor-pointer')
    })

    it('should not apply cursor-pointer when not clickable', () => {
      const { container } = render(<ProjectListItem project={mockProject} />)
      const item = container.firstChild as HTMLElement
      expect(item.className).not.toContain('cursor-pointer')
    })
  })

  // ========================================================================
  // Budget Handling
  // ========================================================================

  describe('Budget Handling', () => {
    it('should display numeric budget', () => {
      render(<ProjectListItem project={{ ...mockProject, budget: 50000 }} />)
      expect(screen.getByText(/ألف/)).toBeInTheDocument()
    })

    it('should display budget object with totalBudget', () => {
      const project: EnhancedProject = {
        ...mockProject,
        budget: { totalBudget: 75000 } as unknown as number,
      }
      render(<ProjectListItem project={project} />)
      expect(screen.getByText(/ألف/)).toBeInTheDocument()
    })

    it('should handle zero budget', () => {
      const project = { ...mockProject, budget: 0 }
      const { container } = render(<ProjectListItem project={project} />)
      expect(container.querySelector('[class*="dollar-sign"]')).not.toBeInTheDocument()
    })
  })

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle missing client', () => {
      const project = { ...mockProject, client: undefined }
      render(<ProjectListItem project={project as EnhancedProject} />)
      expect(screen.queryByText('Test Client')).not.toBeInTheDocument()
    })

    it('should handle missing status', () => {
      const project = { ...mockProject, status: undefined }
      render(<ProjectListItem project={project as any} />)
      expect(screen.getByText('غير محدد')).toBeInTheDocument()
    })

    it('should handle missing dates', () => {
      const project = { ...mockProject, startDate: undefined, endDate: undefined }
      const { container } = render(<ProjectListItem project={project as EnhancedProject} />)
      const calendarIcon = container.querySelector('[class*="Calendar"]')
      expect(calendarIcon).not.toBeInTheDocument()
    })

    it('should handle zero progress', () => {
      const project = { ...mockProject, progress: 0 }
      render(<ProjectListItem project={project} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should handle 100% progress', () => {
      const project = { ...mockProject, progress: 100 }
      render(<ProjectListItem project={project} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('should handle undefined progress', () => {
      const project = { ...mockProject, progress: undefined }
      render(<ProjectListItem project={project as EnhancedProject} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  // ========================================================================
  // Accessibility
  // ========================================================================

  describe('Accessibility', () => {
    it('should have role=button when clickable', () => {
      render(<ProjectListItem project={mockProject} onClick={vi.fn()} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should be keyboard navigable when clickable', () => {
      render(<ProjectListItem project={mockProject} onClick={vi.fn()} />)
      const item = screen.getByRole('button')
      expect(item).toHaveAttribute('tabIndex', '0')
    })

    it('should have aria-label on checkbox', () => {
      render(<ProjectListItem project={mockProject} showSelection />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAccessibleName(`تحديد ${mockProject.name}`)
    })

    it('should not have tabIndex when not clickable', () => {
      const { container } = render(<ProjectListItem project={mockProject} />)
      const item = container.firstChild as HTMLElement
      expect(item).not.toHaveAttribute('tabIndex')
    })
  })

  // ========================================================================
  // Responsive Layout
  // ========================================================================

  describe('Responsive Layout', () => {
    it('should use grid layout on desktop', () => {
      const { container } = render(<ProjectListItem project={mockProject} />)
      const gridContainer = container.querySelector('[class*="md:grid-cols-12"]')
      expect(gridContainer).toBeInTheDocument()
    })

    it('should stack content on mobile', () => {
      const { container } = render(<ProjectListItem project={mockProject} />)
      const gridContainer = container.querySelector('[class*="grid-cols-1"]')
      expect(gridContainer).toBeInTheDocument()
    })
  })
})
