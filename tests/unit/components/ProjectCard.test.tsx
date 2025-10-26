/**
 * Tests for ProjectCard Component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectCard } from '@/presentation/components/projects/ProjectCard'
import type { EnhancedProject } from '@/shared/types/projects'

const mockProject: EnhancedProject = {
  id: 'proj-1',
  name: 'Test Project',
  client: 'Test Client',
  status: 'active',
  budget: 100000,
  contractValue: 120000,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  progress: 75,
  location: 'Riyadh',
  phase: 'Implementation',
  estimatedCost: 95000,
}

describe('ProjectCard', () => {
  // ========================================================================
  // Rendering
  // ========================================================================

  describe('Rendering', () => {
    it('should render project name', () => {
      render(<ProjectCard project={mockProject} />)
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('should render client name', () => {
      render(<ProjectCard project={mockProject} />)
      expect(screen.getByText('Test Client')).toBeInTheDocument()
    })

    it('should render status badge', () => {
      render(<ProjectCard project={mockProject} />)
      expect(screen.getByText('active')).toBeInTheDocument()
    })

    it('should render progress percentage', () => {
      render(<ProjectCard project={mockProject} />)
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('should render location', () => {
      render(<ProjectCard project={mockProject} />)
      expect(screen.getByText('Riyadh')).toBeInTheDocument()
    })

    it('should render phase in grid mode', () => {
      render(<ProjectCard project={mockProject} viewMode="grid" />)
      expect(screen.getByText(/Implementation/)).toBeInTheDocument()
    })

    it('should hide phase in list mode', () => {
      const { container } = render(<ProjectCard project={mockProject} viewMode="list" />)
      const phaseElement = container.querySelector('[class*="border-t"]')
      expect(phaseElement).not.toBeInTheDocument()
    })
  })

  // ========================================================================
  // Click Interactions
  // ========================================================================

  describe('Click Interactions', () => {
    it('should call onClick when card is clicked', () => {
      const handleClick = vi.fn()
      render(<ProjectCard project={mockProject} onClick={handleClick} />)

      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledWith(mockProject)
    })

    it('should call onClick on Enter key', () => {
      const handleClick = vi.fn()
      render(<ProjectCard project={mockProject} onClick={handleClick} />)

      const card = screen.getByRole('button')
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledWith(mockProject)
    })

    it('should call onClick on Space key', () => {
      const handleClick = vi.fn()
      render(<ProjectCard project={mockProject} onClick={handleClick} />)

      const card = screen.getByRole('button')
      fireEvent.keyDown(card, { key: ' ' })
      expect(handleClick).toHaveBeenCalledWith(mockProject)
    })

    it('should not trigger onClick when actions menu is clicked', () => {
      const handleClick = vi.fn()
      render(<ProjectCard project={mockProject} onClick={handleClick} showActions />)

      const menuButton = screen.getByLabelText('فتح القائمة')
      fireEvent.click(menuButton)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  // ========================================================================
  // Actions Menu
  // ========================================================================

  describe('Actions Menu', () => {
    it('should show actions menu when showActions is true', () => {
      render(<ProjectCard project={mockProject} showActions />)
      expect(screen.getByRole('button', { name: /فتح القائمة|menu/i })).toBeInTheDocument()
    })

    it('should hide actions menu when showActions is false', () => {
      render(<ProjectCard project={mockProject} showActions={false} />)
      expect(screen.queryByRole('button', { name: /فتح القائمة|menu/i })).not.toBeInTheDocument()
    })

    it('should call onEdit when edit is clicked', async () => {
      const handleEdit = vi.fn()
      render(<ProjectCard project={mockProject} onEdit={handleEdit} showActions />)

      // Open menu
      fireEvent.click(screen.getByLabelText('فتح القائمة'))

      // Click edit
      const editButton = await screen.findByText('تعديل المشروع')
      fireEvent.click(editButton)

      expect(handleEdit).toHaveBeenCalledWith(mockProject)
    })

    it('should call onDelete when delete is clicked', async () => {
      const handleDelete = vi.fn()
      render(<ProjectCard project={mockProject} onDelete={handleDelete} showActions />)

      // Open menu
      fireEvent.click(screen.getByLabelText('فتح القائمة'))

      // Click delete
      const deleteButton = await screen.findByText('حذف المشروع')
      fireEvent.click(deleteButton)

      expect(handleDelete).toHaveBeenCalledWith(mockProject)
    })

    it('should call onDuplicate when duplicate is clicked', async () => {
      const handleDuplicate = vi.fn()
      render(<ProjectCard project={mockProject} onDuplicate={handleDuplicate} showActions />)

      // Open menu
      fireEvent.click(screen.getByLabelText('فتح القائمة'))

      // Click duplicate
      const duplicateButton = await screen.findByText('نسخ المشروع')
      fireEvent.click(duplicateButton)

      expect(handleDuplicate).toHaveBeenCalledWith(mockProject)
    })

    it('should hide duplicate option when onDuplicate is not provided', async () => {
      render(<ProjectCard project={mockProject} showActions />)

      // Open menu
      fireEvent.click(screen.getByLabelText('فتح القائمة'))

      expect(screen.queryByText('نسخ المشروع')).not.toBeInTheDocument()
    })
  })

  // ========================================================================
  // View Modes
  // ========================================================================

  describe('View Modes', () => {
    it('should apply grid layout classes by default', () => {
      const { container } = render(<ProjectCard project={mockProject} />)
      const card = container.firstChild as HTMLElement
      expect(card.className).not.toContain('md:flex')
    })

    it('should apply list layout classes in list mode', () => {
      const { container } = render(<ProjectCard project={mockProject} viewMode="list" />)
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('md:flex')
    })
  })

  // ========================================================================
  // Budget Handling
  // ========================================================================

  describe('Budget Handling', () => {
    it('should display numeric budget', () => {
      render(<ProjectCard project={{ ...mockProject, budget: 50000 }} />)
      expect(screen.getByText(/50/)).toBeInTheDocument()
    })

    it('should display budget object with totalBudget', () => {
      const project = {
        ...mockProject,
        budget: { totalBudget: 75000 },
      }
      render(<ProjectCard project={project as any} />)
      expect(screen.getByText(/75/)).toBeInTheDocument()
    })

    it('should handle missing budget gracefully', () => {
      const project = { ...mockProject, budget: undefined }
      const { container } = render(<ProjectCard project={project as EnhancedProject} />)
      expect(container).toBeInTheDocument()
    })
  })

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle missing client', () => {
      const project = { ...mockProject, client: undefined }
      render(<ProjectCard project={project as EnhancedProject} />)
      expect(screen.queryByText('Test Client')).not.toBeInTheDocument()
    })

    it('should handle missing status', () => {
      const project = { ...mockProject, status: undefined }
      render(<ProjectCard project={project as any} />)
      expect(screen.getByText('غير محدد')).toBeInTheDocument()
    })

    it('should handle missing dates', () => {
      const project = { ...mockProject, startDate: undefined, endDate: undefined }
      const { container } = render(<ProjectCard project={project as EnhancedProject} />)
      expect(container.querySelector('[class*="Calendar"]')).not.toBeInTheDocument()
    })

    it('should handle missing location', () => {
      const project = { ...mockProject, location: undefined }
      render(<ProjectCard project={project as EnhancedProject} />)
      expect(screen.queryByText('Riyadh')).not.toBeInTheDocument()
    })

    it('should handle zero progress', () => {
      const project = { ...mockProject, progress: 0 }
      render(<ProjectCard project={project} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should handle 100% progress', () => {
      const project = { ...mockProject, progress: 100 }
      render(<ProjectCard project={project} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  // ========================================================================
  // Accessibility
  // ========================================================================

  describe('Accessibility', () => {
    it('should have role=button', () => {
      render(<ProjectCard project={mockProject} onClick={vi.fn()} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should be keyboard navigable', () => {
      const { container } = render(<ProjectCard project={mockProject} onClick={vi.fn()} />)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('should have accessible menu button', () => {
      render(<ProjectCard project={mockProject} showActions />)
      const menuButtons = screen.getAllByRole('button', { name: /فتح القائمة/i })
      expect(menuButtons.length).toBeGreaterThan(0)
    })
  })
})
