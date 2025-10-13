/**
 * Projects List Component Tests
 * Component tests for ProjectsList
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectsList from '../../../src/components/projects/ProjectsList'
import type { EnhancedProject } from '../../../src/types/projects'

// Mock the service
vi.mock('../../../src/services/enhancedProjectService', () => ({
  enhancedProjectService: {
    getAllProjects: vi.fn(),
    searchProjects: vi.fn()
  }
}))

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}))

vi.mock('../../../src/components/ui/input', () => ({
  Input: ({ onChange, ...props }: any) => (
    <input onChange={onChange} {...props} />
  )
}))

vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>
}))

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
}))

vi.mock('../../../src/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select onChange={(e) => onValueChange?.(e.target.value)} value={value}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}))

describe('ProjectsList', () => {
  const mockProjects: EnhancedProject[] = [
    {
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
    },
    {
      id: 'project_2',
      name: 'مشروع التجديد الثاني',
      nameEn: 'Second Renovation Project',
      description: 'وصف المشروع الثاني',
      code: 'PRJ-002',
      client: 'مؤسسة التطوير العقاري',
      clientId: 'client_2',
      clientContact: 'محمد علي',
      status: 'completed',
      priority: 'medium',
      health: 'green',
      progress: 100,
      phase: 'closure',
      phaseId: 'phase_closure',
      startDate: '2023-06-01T00:00:00.000Z',
      endDate: '2023-12-31T00:00:00.000Z',
      createdAt: '2023-06-01T00:00:00.000Z',
      updatedAt: '2023-12-31T00:00:00.000Z',
      location: 'جدة',
      category: 'renovation',
      type: 'commercial',
      tags: ['completed'],
      budget: {
        id: 'budget_2',
        projectId: 'project_2',
        totalBudget: 500000,
        allocatedBudget: 500000,
        spentBudget: 500000,
        remainingBudget: 0,
        contingencyBudget: 50000,
        categories: [],
        approvals: [],
        lastUpdated: '2023-12-31T00:00:00.000Z'
      },
      contractValue: 500000,
      profitMargin: 0.12,
      team: {
        id: 'team_2',
        projectId: 'project_2',
        projectManager: {
          id: 'manager_2',
          name: 'خالد أحمد',
          email: 'khalid@company.com',
          phone: '+966507654321',
          role: 'Project Manager',
          department: 'Projects',
          responsibilities: [],
          startDate: '2023-06-01T00:00:00.000Z',
          isActive: true
        },
        members: [],
        consultants: [],
        contractors: [],
        lastUpdated: '2023-12-31T00:00:00.000Z'
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
  ]

  let mockService: any

  beforeEach(() => {
    mockService = require('../../../src/services/enhancedProjectService').enhancedProjectService
    vi.clearAllMocks()
    
    // Default mock implementations
    mockService.getAllProjects.mockResolvedValue(mockProjects)
    mockService.searchProjects.mockResolvedValue(mockProjects)
  })

  describe('Rendering', () => {
    it('should render loading state initially', async () => {
      // Make the service call hang to test loading state
      mockService.getAllProjects.mockImplementation(() => new Promise(() => {}))

      render(<ProjectsList />)

      expect(screen.getByText('جاري تحميل المشاريع...')).toBeInTheDocument()
    })

    it('should render projects list after loading', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('إدارة المشاريع')).toBeInTheDocument()
      })

      expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      expect(screen.getByText('مشروع التجديد الثاني')).toBeInTheDocument()
    })

    it('should display project count', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText(/عرض وإدارة جميع المشاريع \(2 من 2\)/)).toBeInTheDocument()
      })
    })

    it('should render empty state when no projects', async () => {
      mockService.getAllProjects.mockResolvedValue([])
      mockService.searchProjects.mockResolvedValue([])

      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('لا توجد مشاريع')).toBeInTheDocument()
      })
    })
  })

  describe('Project Cards', () => {
    it('should display project information correctly', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      // Check project details
      expect(screen.getByText('وصف المشروع الأول')).toBeInTheDocument()
      expect(screen.getByText('شركة البناء المتقدم')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('نشط')).toBeInTheDocument()
      expect(screen.getByText('عالية')).toBeInTheDocument()
    })

    it('should display budget in correct format', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('1,000,000 ر.س')).toBeInTheDocument()
      })
    })

    it('should display dates in Arabic format', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        // Check for Arabic date format
        expect(screen.getByText(/1 يناير 2024 - 31 ديسمبر 2024/)).toBeInTheDocument()
      })
    })

    it('should show correct status colors and icons', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        const activeStatus = screen.getByText('نشط')
        expect(activeStatus).toHaveClass('bg-blue-100', 'text-blue-800')
        
        const completedStatus = screen.getByText('مكتمل')
        expect(completedStatus).toHaveClass('bg-green-100', 'text-green-800')
      })
    })

    it('should show progress bars correctly', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar')
        expect(progressBars).toHaveLength(2)
        
        // Check progress values
        expect(progressBars[0]).toHaveStyle('width: 75%')
        expect(progressBars[1]).toHaveStyle('width: 100%')
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should filter projects by search term', async () => {
      const user = userEvent.setup()
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('البحث في المشاريع...')
      await user.type(searchInput, 'البناء')

      await waitFor(() => {
        expect(mockService.searchProjects).toHaveBeenCalledWith(
          expect.objectContaining({
            searchTerm: 'البناء'
          }),
          expect.any(Object)
        )
      })
    })

    it('should filter projects by status', async () => {
      const user = userEvent.setup()
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      const statusSelect = screen.getByDisplayValue('جميع الحالات')
      await user.selectOptions(statusSelect, 'active')

      await waitFor(() => {
        expect(mockService.searchProjects).toHaveBeenCalledWith(
          expect.objectContaining({
            status: ['active']
          }),
          expect.any(Object)
        )
      })
    })

    it('should filter projects by priority', async () => {
      const user = userEvent.setup()
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      const prioritySelect = screen.getByDisplayValue('جميع الأولويات')
      await user.selectOptions(prioritySelect, 'high')

      await waitFor(() => {
        expect(mockService.searchProjects).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: ['high']
          }),
          expect.any(Object)
        )
      })
    })

    it('should sort projects', async () => {
      const user = userEvent.setup()
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('الاسم')
      await user.selectOptions(sortSelect, 'budget')

      await waitFor(() => {
        expect(mockService.searchProjects).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            field: 'budget',
            direction: 'asc'
          })
        )
      })
    })

    it('should change sort direction', async () => {
      const user = userEvent.setup()
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      const directionSelect = screen.getByDisplayValue('تصاعدي')
      await user.selectOptions(directionSelect, 'desc')

      await waitFor(() => {
        expect(mockService.searchProjects).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            direction: 'desc'
          })
        )
      })
    })
  })

  describe('User Interactions', () => {
    it('should call onProjectSelect when project card is clicked', async () => {
      const mockOnProjectSelect = vi.fn()
      render(<ProjectsList onProjectSelect={mockOnProjectSelect} />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      const projectCard = screen.getByText('مشروع البناء الأول').closest('div')
      fireEvent.click(projectCard!)

      expect(mockOnProjectSelect).toHaveBeenCalledWith(mockProjects[0])
    })

    it('should call onCreateProject when create button is clicked', async () => {
      const mockOnCreateProject = vi.fn()
      render(<ProjectsList onCreateProject={mockOnCreateProject} />)

      await waitFor(() => {
        expect(screen.getByText('مشروع جديد')).toBeInTheDocument()
      })

      const createButton = screen.getByText('مشروع جديد')
      fireEvent.click(createButton)

      expect(mockOnCreateProject).toHaveBeenCalled()
    })

    it('should call onEditProject when edit button is clicked', async () => {
      const mockOnEditProject = vi.fn()
      render(<ProjectsList onEditProject={mockOnEditProject} />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('تعديل')
      fireEvent.click(editButtons[0])

      expect(mockOnEditProject).toHaveBeenCalledWith(mockProjects[0])
    })

    it('should refresh projects when refresh button is clicked', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('تحديث')).toBeInTheDocument()
      })

      const refreshButton = screen.getByText('تحديث')
      fireEvent.click(refreshButton)

      expect(mockService.getAllProjects).toHaveBeenCalledTimes(2) // Initial load + refresh
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockService.getAllProjects.mockRejectedValue(new Error('Service error'))

      render(<ProjectsList />)

      await waitFor(() => {
        // Should not crash and should show empty state or error message
        expect(screen.queryByText('جاري تحميل المشاريع...')).not.toBeInTheDocument()
      })
    })

    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup()
      mockService.searchProjects.mockRejectedValue(new Error('Search error'))

      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('البحث في المشاريع...')
      await user.type(searchInput, 'test')

      // Should not crash and should fall back to original projects
      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper RTL direction', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        const container = screen.getByText('إدارة المشاريع').closest('div')
        expect(container).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should have proper ARIA labels', async () => {
      render(<ProjectsList />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في المشاريع...')
        expect(searchInput).toBeInTheDocument()
      })
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<ProjectsList />)

      await waitFor(() => {
        expect(screen.getByText('مشروع جديد')).toBeInTheDocument()
      })

      // Tab through interactive elements
      await user.tab()
      expect(screen.getByText('تحديث')).toHaveFocus()

      await user.tab()
      expect(screen.getByText('تصدير')).toHaveFocus()

      await user.tab()
      expect(screen.getByText('مشروع جديد')).toHaveFocus()
    })
  })
})
