/**
 * Project Form Component Tests
 * Component tests for ProjectForm
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectForm from '../../../src/components/projects/ProjectForm'
import type { EnhancedProject } from '../../../src/types/projects'

// Mock the service
vi.mock('../../../src/services/enhancedProjectService', () => ({
  enhancedProjectService: {
    createProject: vi.fn(),
    updateProject: vi.fn()
  }
}))

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  )
}))

vi.mock('../../../src/components/ui/input', () => ({
  Input: ({ onChange, value, ...props }: any) => (
    <input onChange={onChange} value={value} {...props} />
  )
}))

vi.mock('../../../src/components/ui/textarea', () => ({
  Textarea: ({ onChange, value, ...props }: any) => (
    <textarea onChange={onChange} value={value} {...props} />
  )
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

vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>
}))

describe('ProjectForm', () => {
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
  })

  describe('Create Mode', () => {
    it('should render create form with empty fields', () => {
      render(<ProjectForm />)

      expect(screen.getByText('إنشاء مشروع جديد')).toBeInTheDocument()
      expect(screen.getByLabelText('اسم المشروع *')).toHaveValue('')
      expect(screen.getByLabelText('الوصف *')).toHaveValue('')
      expect(screen.getByText('إنشاء المشروع')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)

      const submitButton = screen.getByText('إنشاء المشروع')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('اسم المشروع مطلوب')).toBeInTheDocument()
        expect(screen.getByText('الوصف مطلوب')).toBeInTheDocument()
        expect(screen.getByText('العميل مطلوب')).toBeInTheDocument()
      })
    })

    it('should create project with valid data', async () => {
      const user = userEvent.setup()
      const mockOnSave = vi.fn()
      const newProject = { ...mockProject, id: 'new_project' }
      
      mockEnhancedProjectService.createProject.mockResolvedValue(newProject)

      render(<ProjectForm onSave={mockOnSave} />)

      // Fill required fields
      await user.type(screen.getByLabelText('اسم المشروع *'), 'مشروع جديد')
      await user.type(screen.getByLabelText('الوصف *'), 'وصف المشروع الجديد')
      await user.selectOptions(screen.getByLabelText('العميل *'), 'client_1')
      await user.selectOptions(screen.getByLabelText('مدير المشروع *'), 'manager_1')
      await user.type(screen.getByLabelText('الميزانية *'), '500000')
      await user.type(screen.getByLabelText('الموقع *'), 'جدة')

      const submitButton = screen.getByText('إنشاء المشروع')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockEnhancedProjectService.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'مشروع جديد',
            description: 'وصف المشروع الجديد',
            clientId: 'client_1',
            projectManagerId: 'manager_1',
            budget: 500000,
            location: 'جدة'
          })
        )
        expect(mockOnSave).toHaveBeenCalledWith(newProject)
      })
    })

    it('should handle create errors gracefully', async () => {
      const user = userEvent.setup()
      mockEnhancedProjectService.createProject.mockRejectedValue(new Error('فشل في إنشاء المشروع'))

      render(<ProjectForm />)

      // Fill required fields
      await user.type(screen.getByLabelText('اسم المشروع *'), 'مشروع جديد')
      await user.type(screen.getByLabelText('الوصف *'), 'وصف المشروع الجديد')
      await user.selectOptions(screen.getByLabelText('العميل *'), 'client_1')
      await user.selectOptions(screen.getByLabelText('مدير المشروع *'), 'manager_1')
      await user.type(screen.getByLabelText('الميزانية *'), '500000')
      await user.type(screen.getByLabelText('الموقع *'), 'جدة')

      const submitButton = screen.getByText('إنشاء المشروع')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('فشل في إنشاء المشروع')).toBeInTheDocument()
      })
    })
  })

  describe('Edit Mode', () => {
    it('should render edit form with project data', () => {
      render(<ProjectForm project={mockProject} />)

      expect(screen.getByText('تعديل المشروع')).toBeInTheDocument()
      expect(screen.getByDisplayValue('مشروع البناء الأول')).toBeInTheDocument()
      expect(screen.getByDisplayValue('وصف المشروع الأول')).toBeInTheDocument()
      expect(screen.getByText('حفظ التغييرات')).toBeInTheDocument()
    })

    it('should update project with modified data', async () => {
      const user = userEvent.setup()
      const mockOnSave = vi.fn()
      const updatedProject = { ...mockProject, name: 'اسم محدث' }
      
      mockEnhancedProjectService.updateProject.mockResolvedValue(updatedProject)

      render(<ProjectForm project={mockProject} onSave={mockOnSave} />)

      const nameInput = screen.getByDisplayValue('مشروع البناء الأول')
      await user.clear(nameInput)
      await user.type(nameInput, 'اسم محدث')

      const submitButton = screen.getByText('حفظ التغييرات')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockEnhancedProjectService.updateProject).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'project_1',
            name: 'اسم محدث',
            version: 1
          })
        )
        expect(mockOnSave).toHaveBeenCalledWith(updatedProject)
      })
    })

    it('should handle update errors gracefully', async () => {
      const user = userEvent.setup()
      mockEnhancedProjectService.updateProject.mockRejectedValue(new Error('فشل في تحديث المشروع'))

      render(<ProjectForm project={mockProject} />)

      const nameInput = screen.getByDisplayValue('مشروع البناء الأول')
      await user.clear(nameInput)
      await user.type(nameInput, 'اسم محدث')

      const submitButton = screen.getByText('حفظ التغييرات')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('فشل في تحديث المشروع')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should validate date range', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)

      // Set end date before start date
      await user.type(screen.getByLabelText('تاريخ البداية *'), '2024-12-31')
      await user.type(screen.getByLabelText('تاريخ النهاية *'), '2024-01-01')

      const submitButton = screen.getByText('إنشاء المشروع')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')).toBeInTheDocument()
      })
    })

    it('should validate budget amount', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)

      await user.type(screen.getByLabelText('الميزانية *'), '-1000')

      const submitButton = screen.getByText('إنشاء المشروع')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('الميزانية يجب أن تكون أكبر من صفر')).toBeInTheDocument()
      })
    })

    it('should show warnings for large budgets', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)

      await user.type(screen.getByLabelText('الميزانية *'), '50000000')

      await waitFor(() => {
        expect(screen.getByText('تحذير: الميزانية كبيرة جداً')).toBeInTheDocument()
      })
    })
  })

  describe('Tag Management', () => {
    it('should add new tags', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)

      const tagInput = screen.getByPlaceholderText('إضافة علامة...')
      await user.type(tagInput, 'علامة جديدة')
      await user.keyboard('{Enter}')

      expect(screen.getByText('علامة جديدة')).toBeInTheDocument()
    })

    it('should remove existing tags', async () => {
      const user = userEvent.setup()
      render(<ProjectForm project={mockProject} />)

      const removeButton = screen.getByLabelText('إزالة علامة urgent')
      await user.click(removeButton)

      expect(screen.queryByText('urgent')).not.toBeInTheDocument()
    })

    it('should prevent duplicate tags', async () => {
      const user = userEvent.setup()
      render(<ProjectForm project={mockProject} />)

      const tagInput = screen.getByPlaceholderText('إضافة علامة...')
      await user.type(tagInput, 'urgent')
      await user.keyboard('{Enter}')

      // Should not add duplicate
      expect(screen.getAllByText('urgent')).toHaveLength(1)
    })
  })

  describe('User Interactions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnCancel = vi.fn()
      
      render(<ProjectForm onCancel={mockOnCancel} />)

      const cancelButton = screen.getByText('إلغاء')
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup()
      mockEnhancedProjectService.createProject.mockImplementation(() => new Promise(() => {}))

      render(<ProjectForm />)

      // Fill required fields
      await user.type(screen.getByLabelText('اسم المشروع *'), 'مشروع جديد')
      await user.type(screen.getByLabelText('الوصف *'), 'وصف المشروع الجديد')
      await user.selectOptions(screen.getByLabelText('العميل *'), 'client_1')
      await user.selectOptions(screen.getByLabelText('مدير المشروع *'), 'manager_1')
      await user.type(screen.getByLabelText('الميزانية *'), '500000')
      await user.type(screen.getByLabelText('الموقع *'), 'جدة')

      const submitButton = screen.getByText('إنشاء المشروع')
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(screen.getByText('جاري الإنشاء...')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper RTL direction', () => {
      render(<ProjectForm />)

      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('dir', 'rtl')
    })

    it('should have proper labels for all inputs', () => {
      render(<ProjectForm />)

      expect(screen.getByLabelText('اسم المشروع *')).toBeInTheDocument()
      expect(screen.getByLabelText('الوصف *')).toBeInTheDocument()
      expect(screen.getByLabelText('العميل *')).toBeInTheDocument()
      expect(screen.getByLabelText('مدير المشروع *')).toBeInTheDocument()
      expect(screen.getByLabelText('الميزانية *')).toBeInTheDocument()
      expect(screen.getByLabelText('الموقع *')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)

      // Tab through form fields
      await user.tab()
      expect(screen.getByLabelText('اسم المشروع *')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('الاسم بالإنجليزية')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('الوصف *')).toHaveFocus()
    })
  })

  describe('Data Formatting', () => {
    it('should format budget input correctly', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)

      const budgetInput = screen.getByLabelText('الميزانية *')
      await user.type(budgetInput, '1000000')

      expect(budgetInput).toHaveValue('1000000')
    })

    it('should format dates correctly', () => {
      render(<ProjectForm project={mockProject} />)

      const startDateInput = screen.getByLabelText('تاريخ البداية *')
      const endDateInput = screen.getByLabelText('تاريخ النهاية *')

      expect(startDateInput).toHaveValue('2024-01-01')
      expect(endDateInput).toHaveValue('2024-12-31')
    })
  })
})
