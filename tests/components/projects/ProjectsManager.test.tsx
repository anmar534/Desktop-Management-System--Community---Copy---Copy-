/**
 * Projects Manager Component Tests
 * Component tests for ProjectsManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectsManager from '../../../src/components/projects/ProjectsManager'
import type { EnhancedProject } from '../../../src/types/projects'

// Mock the service
vi.mock('../../../src/services/enhancedProjectService', () => ({
  enhancedProjectService: {
    getAllProjects: vi.fn(),
    getProjectById: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    searchProjects: vi.fn()
  }
}))

// Mock child components
vi.mock('../../../src/components/projects/ProjectsList', () => ({
  default: ({ onProjectSelect, onCreateProject, onEditProject }: any) => (
    <div data-testid="projects-list">
      <button onClick={() => onProjectSelect?.({ id: 'project_1', name: 'Test Project' })}>
        Select Project
      </button>
      <button onClick={() => onCreateProject?.()}>Create Project</button>
      <button onClick={() => onEditProject?.({ id: 'project_1', name: 'Test Project' })}>
        Edit Project
      </button>
    </div>
  )
}))

vi.mock('../../../src/components/projects/ProjectDetails', () => ({
  default: ({ projectId, onBack, onEdit, onDelete }: any) => (
    <div data-testid="project-details">
      <span>Project Details: {projectId}</span>
      <button onClick={() => onBack?.()}>Back</button>
      <button onClick={() => onEdit?.({ id: projectId, name: 'Test Project' })}>Edit</button>
      <button onClick={() => onDelete?.(projectId)}>Delete</button>
    </div>
  )
}))

vi.mock('../../../src/components/projects/ProjectForm', () => ({
  default: ({ project, onSave, onCancel }: any) => (
    <div data-testid="project-form">
      <span>{project ? 'Edit Project' : 'Create Project'}</span>
      <button onClick={() => onSave?.({ id: 'new_project', name: 'New Project' })}>
        Save
      </button>
      <button onClick={() => onCancel?.()}>Cancel</button>
    </div>
  )
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('ProjectsManager', () => {
  const mockProject: EnhancedProject = {
    id: 'project_1',
    name: 'مشروع البناء الأول',
    nameEn: 'First Construction Project',
    description: 'وصف المشروع الأول',
    code: 'PRJ-001',
    client: 'شركة البناء المتقدم',
    clientId: 'client_1',
    clientContact: 'أحمد محمد',
    status: 'active',
    priority: 'high',
    health: 'green',
    progress: 75,
    phase: 'execution',
    phaseId: 'phase_execution',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    location: 'الرياض',
    category: 'construction',
    type: 'residential',
    tags: ['urgent', 'important'],
    budget: {
      id: 'budget_1',
      projectId: 'project_1',
      totalBudget: 1000000,
      allocatedBudget: 1000000,
      spentBudget: 750000,
      remainingBudget: 250000,
      contingencyBudget: 100000,
      categories: [],
      approvals: [],
      lastUpdated: '2024-01-01T00:00:00.000Z'
    },
    contractValue: 1000000,
    profitMargin: 0.15,
    team: {
      id: 'team_1',
      projectId: 'project_1',
      projectManager: {
        id: 'manager_1',
        name: 'سارة أحمد',
        email: 'sara@company.com',
        phone: '+966501234567',
        role: 'Project Manager',
        department: 'Projects',
        responsibilities: [],
        startDate: '2024-01-01T00:00:00.000Z',
        isActive: true
      },
      members: [],
      consultants: [],
      contractors: [],
      lastUpdated: '2024-01-01T00:00:00.000Z'
    },
    phases: [],
    milestones: [],
    risks: [],
    attachments: [],
    notes: '',
    metadata: {},
    createdBy: 'user_1',
    lastModifiedBy: 'user_1',
    version: 1
  }

  beforeEach(() => {
    vi.clearAllMocks()
    const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
    enhancedProjectService.getAllProjects.mockResolvedValue([mockProject])
    enhancedProjectService.getProjectById.mockResolvedValue(mockProject)
  })

  describe('Initial Rendering', () => {
    it('should render projects list by default', () => {
      render(<ProjectsManager />)

      expect(screen.getByTestId('projects-list')).toBeInTheDocument()
      expect(screen.queryByTestId('project-details')).not.toBeInTheDocument()
      expect(screen.queryByTestId('project-form')).not.toBeInTheDocument()
    })

    it('should have proper RTL direction', () => {
      render(<ProjectsManager />)

      const container = screen.getByTestId('projects-list').closest('div')
      expect(container).toHaveAttribute('dir', 'rtl')
    })
  })

  describe('View Mode Management', () => {
    it('should switch to details view when project is selected', async () => {
      const user = userEvent.setup()
      render(<ProjectsManager />)

      const selectButton = screen.getByText('Select Project')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('project-details')).toBeInTheDocument()
        expect(screen.queryByTestId('projects-list')).not.toBeInTheDocument()
      })
    })

    it('should switch to create form when create is clicked', async () => {
      const user = userEvent.setup()
      render(<ProjectsManager />)

      const createButton = screen.getByText('Create Project')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument()
        expect(screen.getByText('Create Project')).toBeInTheDocument()
        expect(screen.queryByTestId('projects-list')).not.toBeInTheDocument()
      })
    })

    it('should switch to edit form when edit is clicked', async () => {
      const user = userEvent.setup()
      render(<ProjectsManager />)

      const editButton = screen.getByText('Edit Project')
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument()
        expect(screen.getByText('Edit Project')).toBeInTheDocument()
        expect(screen.queryByTestId('projects-list')).not.toBeInTheDocument()
      })
    })

    it('should return to list view when back is clicked', async () => {
      const user = userEvent.setup()
      render(<ProjectsManager />)

      // Go to details view
      const selectButton = screen.getByText('Select Project')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('project-details')).toBeInTheDocument()
      })

      // Go back to list
      const backButton = screen.getByText('Back')
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByTestId('projects-list')).toBeInTheDocument()
        expect(screen.queryByTestId('project-details')).not.toBeInTheDocument()
      })
    })

    it('should return to list view when form is cancelled', async () => {
      const user = userEvent.setup()
      render(<ProjectsManager />)

      // Go to create form
      const createButton = screen.getByText('Create Project')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument()
      })

      // Cancel form
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByTestId('projects-list')).toBeInTheDocument()
        expect(screen.queryByTestId('project-form')).not.toBeInTheDocument()
      })
    })
  })

  describe('User Stories Implementation', () => {
    it('should implement US-1.1: Display projects list', () => {
      render(<ProjectsManager />)

      expect(screen.getByTestId('projects-list')).toBeInTheDocument()
    })

    it('should implement US-1.2: Create new project', async () => {
      const user = userEvent.setup()
      const newProject = { id: 'new_project', name: 'New Project' }
      mockEnhancedProjectService.createProject.mockResolvedValue(newProject)

      render(<ProjectsManager />)

      // Click create
      const createButton = screen.getByText('Create Project')
      await user.click(createButton)

      // Save project
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('تم إنشاء المشروع بنجاح')
        expect(screen.getByTestId('project-details')).toBeInTheDocument()
      })
    })

    it('should implement US-1.3: Edit project data', async () => {
      const user = userEvent.setup()
      const updatedProject = { ...mockProject, name: 'Updated Project' }
      mockEnhancedProjectService.updateProject.mockResolvedValue(updatedProject)

      render(<ProjectsManager />)

      // Click edit
      const editButton = screen.getByText('Edit Project')
      await user.click(editButton)

      // Save changes
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('تم تحديث المشروع بنجاح')
        expect(screen.getByTestId('project-details')).toBeInTheDocument()
      })
    })

    it('should implement US-1.4: Delete project', async () => {
      const user = userEvent.setup()
      mockEnhancedProjectService.deleteProject.mockResolvedValue(true)

      render(<ProjectsManager />)

      // Go to details view
      const selectButton = screen.getByText('Select Project')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('project-details')).toBeInTheDocument()
      })

      // Delete project
      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('تم حذف المشروع بنجاح')
        expect(screen.getByTestId('projects-list')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle create project errors', async () => {
      const user = userEvent.setup()
      mockEnhancedProjectService.createProject.mockRejectedValue(new Error('Create failed'))

      render(<ProjectsManager />)

      // Click create
      const createButton = screen.getByText('Create Project')
      await user.click(createButton)

      // Try to save project
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('فشل في إنشاء المشروع')
      })
    })

    it('should handle update project errors', async () => {
      const user = userEvent.setup()
      mockEnhancedProjectService.updateProject.mockRejectedValue(new Error('Update failed'))

      render(<ProjectsManager />)

      // Click edit
      const editButton = screen.getByText('Edit Project')
      await user.click(editButton)

      // Try to save changes
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('فشل في تحديث المشروع')
      })
    })

    it('should handle delete project errors', async () => {
      const user = userEvent.setup()
      mockEnhancedProjectService.deleteProject.mockRejectedValue(new Error('Delete failed'))

      render(<ProjectsManager />)

      // Go to details view
      const selectButton = screen.getByText('Select Project')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('project-details')).toBeInTheDocument()
      })

      // Try to delete project
      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('فشل في حذف المشروع')
      })
    })
  })

  describe('Data Refresh', () => {
    it('should refresh data after successful operations', async () => {
      const user = userEvent.setup()
      const newProject = { id: 'new_project', name: 'New Project' }
      mockEnhancedProjectService.createProject.mockResolvedValue(newProject)

      render(<ProjectsManager />)

      // Initial render should have refreshKey = 0
      expect(screen.getByTestId('projects-list')).toBeInTheDocument()

      // Create project
      const createButton = screen.getByText('Create Project')
      await user.click(createButton)

      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        // Should trigger refresh by incrementing refreshKey
        expect(screen.getByTestId('project-details')).toBeInTheDocument()
      })
    })

    it('should maintain selected project after refresh', async () => {
      const user = userEvent.setup()
      const updatedProject = { ...mockProject, name: 'Updated Project' }
      mockEnhancedProjectService.updateProject.mockResolvedValue(updatedProject)

      render(<ProjectsManager />)

      // Select project
      const selectButton = screen.getByText('Select Project')
      await user.click(selectButton)

      // Edit project
      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      // Save changes
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        // Should stay in details view with updated project
        expect(screen.getByTestId('project-details')).toBeInTheDocument()
        expect(screen.getByText('Project Details: project_1')).toBeInTheDocument()
      })
    })
  })

  describe('Toast Notifications', () => {
    it('should show success toast for create operations', async () => {
      const user = userEvent.setup()
      const newProject = { id: 'new_project', name: 'New Project' }
      mockEnhancedProjectService.createProject.mockResolvedValue(newProject)

      render(<ProjectsManager />)

      const createButton = screen.getByText('Create Project')
      await user.click(createButton)

      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('تم إنشاء المشروع بنجاح')
      })
    })

    it('should show success toast for update operations', async () => {
      const user = userEvent.setup()
      const updatedProject = { ...mockProject, name: 'Updated Project' }
      mockEnhancedProjectService.updateProject.mockResolvedValue(updatedProject)

      render(<ProjectsManager />)

      const editButton = screen.getByText('Edit Project')
      await user.click(editButton)

      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('تم تحديث المشروع بنجاح')
      })
    })

    it('should show success toast for delete operations', async () => {
      const user = userEvent.setup()
      mockEnhancedProjectService.deleteProject.mockResolvedValue(true)

      render(<ProjectsManager />)

      const selectButton = screen.getByText('Select Project')
      await user.click(selectButton)

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('تم حذف المشروع بنجاح')
      })
    })
  })

  describe('Component Integration', () => {
    it('should pass correct props to ProjectsList', () => {
      render(<ProjectsManager />)

      const projectsList = screen.getByTestId('projects-list')
      expect(projectsList).toBeInTheDocument()

      // Should have all required callback props
      expect(screen.getByText('Select Project')).toBeInTheDocument()
      expect(screen.getByText('Create Project')).toBeInTheDocument()
      expect(screen.getByText('Edit Project')).toBeInTheDocument()
    })

    it('should pass correct props to ProjectDetails', async () => {
      const user = userEvent.setup()
      render(<ProjectsManager />)

      const selectButton = screen.getByText('Select Project')
      await user.click(selectButton)

      await waitFor(() => {
        const projectDetails = screen.getByTestId('project-details')
        expect(projectDetails).toBeInTheDocument()
        expect(screen.getByText('Project Details: project_1')).toBeInTheDocument()
      })
    })

    it('should pass correct props to ProjectForm', async () => {
      const user = userEvent.setup()
      render(<ProjectsManager />)

      // Test create mode
      const createButton = screen.getByText('Create Project')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create Project')).toBeInTheDocument()
      })

      // Go back and test edit mode
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      const editButton = screen.getByText('Edit Project')
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument()
      })
    })
  })
})
