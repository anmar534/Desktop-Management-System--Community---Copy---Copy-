/**
 * Project Details Component Tests
 * Component tests for ProjectDetails
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectDetails from '../../../src/components/projects/ProjectDetails'
import type { EnhancedProject } from '../../../src/types/projects'

// Mock the service
vi.mock('../../../src/services/enhancedProjectService', () => ({
  enhancedProjectService: {
    getProjectById: vi.fn(),
    deleteProject: vi.fn()
  }
}))

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
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

vi.mock('../../../src/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-${value}`}>{children}</button>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>
}))

describe('ProjectDetails', () => {
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
    enhancedProjectService.getProjectById.mockResolvedValue(mockProject)
  })

  describe('Rendering', () => {
    it('should render loading state initially', async () => {
      const { enhancedProjectService } = require('../../../src/services/enhancedProjectService')
      enhancedProjectService.getProjectById.mockImplementation(() => new Promise(() => {}))

      render(<ProjectDetails projectId="project_1" />)

      expect(screen.getByText('جاري تحميل تفاصيل المشروع...')).toBeInTheDocument()
    })

    it('should render project details after loading', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByText('مشروع البناء الأول')).toBeInTheDocument()
      })

      expect(screen.getByText('PRJ-001')).toBeInTheDocument()
      expect(screen.getByText('وصف المشروع الأول')).toBeInTheDocument()
      expect(screen.getByText('شركة البناء المتقدم')).toBeInTheDocument()
    })

    it('should render project not found when project is null', async () => {
      mockEnhancedProjectService.getProjectById.mockResolvedValue(null)

      render(<ProjectDetails projectId="nonexistent" />)

      await waitFor(() => {
        expect(screen.getByText('المشروع غير موجود')).toBeInTheDocument()
      })
    })

    it('should display status cards with correct information', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument()
        expect(screen.getByText('1,000,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('250,000 ر.س')).toBeInTheDocument()
      })
    })

    it('should display health indicator with correct color', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        const healthIndicator = screen.getByText('ممتاز')
        expect(healthIndicator).toHaveClass('text-green-600')
      })
    })
  })

  describe('Tabs Navigation', () => {
    it('should render all tabs', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByTestId('tab-overview')).toBeInTheDocument()
        expect(screen.getByTestId('tab-budget')).toBeInTheDocument()
        expect(screen.getByTestId('tab-team')).toBeInTheDocument()
        expect(screen.getByTestId('tab-timeline')).toBeInTheDocument()
        expect(screen.getByTestId('tab-documents')).toBeInTheDocument()
      })
    })

    it('should show overview tab by default', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        const tabs = screen.getByTestId('tabs')
        expect(tabs).toHaveAttribute('data-default-value', 'overview')
      })
    })

    it('should display overview content', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByText('معلومات أساسية')).toBeInTheDocument()
        expect(screen.getByText('الموقع:')).toBeInTheDocument()
        expect(screen.getByText('الرياض')).toBeInTheDocument()
        expect(screen.getByText('الفئة:')).toBeInTheDocument()
        expect(screen.getByText('بناء')).toBeInTheDocument()
      })
    })

    it('should display budget information', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByText('الميزانية الإجمالية:')).toBeInTheDocument()
        expect(screen.getByText('المبلغ المنفق:')).toBeInTheDocument()
        expect(screen.getByText('المبلغ المتبقي:')).toBeInTheDocument()
        expect(screen.getByText('ميزانية الطوارئ:')).toBeInTheDocument()
      })
    })

    it('should display team information', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByText('مدير المشروع:')).toBeInTheDocument()
        expect(screen.getByText('سارة أحمد')).toBeInTheDocument()
        expect(screen.getByText('sara@company.com')).toBeInTheDocument()
        expect(screen.getByText('+966501234567')).toBeInTheDocument()
      })
    })
  })

  describe('Actions', () => {
    it('should call onBack when back button is clicked', async () => {
      const mockOnBack = vi.fn()
      render(<ProjectDetails projectId="project_1" onBack={mockOnBack} />)

      await waitFor(() => {
        expect(screen.getByText('رجوع')).toBeInTheDocument()
      })

      const backButton = screen.getByText('رجوع')
      fireEvent.click(backButton)

      expect(mockOnBack).toHaveBeenCalled()
    })

    it('should call onEdit when edit button is clicked', async () => {
      const mockOnEdit = vi.fn()
      render(<ProjectDetails projectId="project_1" onEdit={mockOnEdit} />)

      await waitFor(() => {
        expect(screen.getByText('تعديل')).toBeInTheDocument()
      })

      const editButton = screen.getByText('تعديل')
      fireEvent.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockProject)
    })

    it('should call onDelete when delete button is clicked and confirmed', async () => {
      const mockOnDelete = vi.fn()
      mockEnhancedProjectService.deleteProject.mockResolvedValue(true)

      // Mock window.confirm
      const originalConfirm = window.confirm
      window.confirm = vi.fn(() => true)

      render(<ProjectDetails projectId="project_1" onDelete={mockOnDelete} />)

      await waitFor(() => {
        expect(screen.getByText('حذف')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('حذف')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockEnhancedProjectService.deleteProject).toHaveBeenCalledWith('project_1')
        expect(mockOnDelete).toHaveBeenCalledWith('project_1')
      })

      // Restore original confirm
      window.confirm = originalConfirm
    })

    it('should not delete when confirmation is cancelled', async () => {
      const mockOnDelete = vi.fn()

      // Mock window.confirm to return false
      const originalConfirm = window.confirm
      window.confirm = vi.fn(() => false)

      render(<ProjectDetails projectId="project_1" onDelete={mockOnDelete} />)

      await waitFor(() => {
        expect(screen.getByText('حذف')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('حذف')
      fireEvent.click(deleteButton)

      expect(mockEnhancedProjectService.deleteProject).not.toHaveBeenCalled()
      expect(mockOnDelete).not.toHaveBeenCalled()

      // Restore original confirm
      window.confirm = originalConfirm
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockEnhancedProjectService.getProjectById.mockRejectedValue(new Error('Service error'))

      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByText('حدث خطأ في تحميل تفاصيل المشروع')).toBeInTheDocument()
      })
    })

    it('should handle delete errors gracefully', async () => {
      const mockOnDelete = vi.fn()
      mockEnhancedProjectService.deleteProject.mockRejectedValue(new Error('Delete error'))

      // Mock window.confirm and alert
      const originalConfirm = window.confirm
      const originalAlert = window.alert
      window.confirm = vi.fn(() => true)
      window.alert = vi.fn()

      render(<ProjectDetails projectId="project_1" onDelete={mockOnDelete} />)

      await waitFor(() => {
        expect(screen.getByText('حذف')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('حذف')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('حدث خطأ في حذف المشروع')
      })

      // Restore original functions
      window.confirm = originalConfirm
      window.alert = originalAlert
    })
  })

  describe('Accessibility', () => {
    it('should have proper RTL direction', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        const container = screen.getByText('مشروع البناء الأول').closest('div')
        expect(container).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should have proper heading structure', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4) // Status cards
      })
    })
  })

  describe('Data Formatting', () => {
    it('should format currency correctly', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByText('1,000,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('750,000 ر.س')).toBeInTheDocument()
        expect(screen.getByText('250,000 ر.س')).toBeInTheDocument()
      })
    })

    it('should format dates correctly', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByText('1 يناير 2024')).toBeInTheDocument()
        expect(screen.getByText('31 ديسمبر 2024')).toBeInTheDocument()
      })
    })

    it('should display progress percentage correctly', async () => {
      render(<ProjectDetails projectId="project_1" />)

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument()
      })
    })
  })
})
