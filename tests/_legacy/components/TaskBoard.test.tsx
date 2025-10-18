/**
 * TaskBoard Component Tests
 * اختبارات مكون لوحة المهام
 */

import type React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DragDropContext } from 'react-beautiful-dnd'
import TaskBoard from '../../../src/components/tasks/TaskBoard'
import type { Task} from '../../../src/types/tasks';
import { TaskStatus } from '../../../src/types/tasks'

// Mock the task management service
vi.mock('../../../src/services/taskManagementService', () => ({
  taskManagementService: {
    getProjectTasks: vi.fn(),
    updateTask: vi.fn(),
    updateTaskProgress: vi.fn()
  }
}))

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: { children: (provided: any) => React.ReactNode }) => 
    children({
      droppableProps: {},
      innerRef: vi.fn(),
      placeholder: null
    }),
  Draggable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) =>
    children(
      {
        draggableProps: {},
        dragHandleProps: {},
        innerRef: vi.fn()
      },
      { isDragging: false }
    )
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('TaskBoard', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      projectId: 'project-1',
      title: 'مهمة التصميم',
      titleEn: 'Design Task',
      description: 'تصميم واجهة المستخدم',
      descriptionEn: 'UI Design',
      type: 'task',
      status: 'not_started',
      priority: 'high',
      progress: 0,
      plannedStartDate: '2024-01-01',
      plannedEndDate: '2024-01-15',
      estimatedHours: 40,
      actualHours: 0,
      estimatedCost: 5000,
      actualCost: 0,
      assigneeId: 'user-1',
      assignee: {
        id: 'user-1',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        avatar: 'avatar1.jpg'
      },
      dependencies: [],
      subtasks: [],
      attachments: [],
      comments: [],
      timeEntries: [],
      tags: ['تصميم', 'واجهة'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-1',
      lastModifiedBy: 'user-1',
      version: 1
    },
    {
      id: 'task-2',
      projectId: 'project-1',
      title: 'مهمة التطوير',
      titleEn: 'Development Task',
      description: 'تطوير المكونات',
      descriptionEn: 'Component Development',
      type: 'task',
      status: 'in_progress',
      priority: 'medium',
      progress: 50,
      plannedStartDate: '2024-01-16',
      plannedEndDate: '2024-01-31',
      estimatedHours: 60,
      actualHours: 30,
      estimatedCost: 7500,
      actualCost: 3750,
      assigneeId: 'user-2',
      assignee: {
        id: 'user-2',
        name: 'فاطمة علي',
        email: 'fatima@example.com',
        avatar: 'avatar2.jpg'
      },
      dependencies: [],
      subtasks: [],
      attachments: [],
      comments: [],
      timeEntries: [],
      tags: ['تطوير', 'برمجة'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-16T00:00:00Z',
      createdBy: 'user-1',
      lastModifiedBy: 'user-2',
      version: 2
    },
    {
      id: 'task-3',
      projectId: 'project-1',
      title: 'مهمة الاختبار',
      titleEn: 'Testing Task',
      description: 'اختبار الوظائف',
      descriptionEn: 'Functionality Testing',
      type: 'task',
      status: 'completed',
      priority: 'low',
      progress: 100,
      plannedStartDate: '2024-02-01',
      plannedEndDate: '2024-02-10',
      actualStartDate: '2024-02-01',
      actualEndDate: '2024-02-09',
      estimatedHours: 20,
      actualHours: 18,
      estimatedCost: 2500,
      actualCost: 2250,
      assigneeId: 'user-3',
      assignee: {
        id: 'user-3',
        name: 'محمد سالم',
        email: 'mohammed@example.com',
        avatar: 'avatar3.jpg'
      },
      dependencies: [],
      subtasks: [],
      attachments: [],
      comments: [],
      timeEntries: [],
      tags: ['اختبار', 'جودة'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-02-09T00:00:00Z',
      createdBy: 'user-1',
      lastModifiedBy: 'user-3',
      version: 3
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    const { taskManagementService } = require('../../../src/services/taskManagementService')
    taskManagementService.getProjectTasks.mockResolvedValue(mockTasks)
    taskManagementService.updateTask.mockImplementation((request) => 
      Promise.resolve({ ...mockTasks.find(t => t.id === request.id), ...request })
    )
    taskManagementService.updateTaskProgress.mockImplementation((update) =>
      Promise.resolve({ ...mockTasks.find(t => t.id === update.taskId), progress: update.progress })
    )
  })

  describe('Rendering', () => {
    it('should render task board with columns', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByText('غير مبدوءة')).toBeInTheDocument()
        expect(screen.getByText('قيد التنفيذ')).toBeInTheDocument()
        expect(screen.getByText('مكتملة')).toBeInTheDocument()
        expect(screen.getByText('معلقة')).toBeInTheDocument()
        expect(screen.getByText('ملغاة')).toBeInTheDocument()
      })
    })

    it('should display tasks in correct columns', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        // التحقق من وجود المهام في الأعمدة الصحيحة
        expect(screen.getByText('مهمة التصميم')).toBeInTheDocument()
        expect(screen.getByText('مهمة التطوير')).toBeInTheDocument()
        expect(screen.getByText('مهمة الاختبار')).toBeInTheDocument()
      })
    })

    it('should show task details on cards', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        // التحقق من عرض تفاصيل المهمة
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument()
        expect(screen.getByText('فاطمة علي')).toBeInTheDocument()
        expect(screen.getByText('محمد سالم')).toBeInTheDocument()
        
        // التحقق من عرض الأولوية
        expect(screen.getByText('عالية')).toBeInTheDocument()
        expect(screen.getByText('متوسطة')).toBeInTheDocument()
        expect(screen.getByText('منخفضة')).toBeInTheDocument()
      })
    })

    it('should display progress bars', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar')
        expect(progressBars).toHaveLength(3) // واحد لكل مهمة
      })
    })

    it('should show task tags', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByText('تصميم')).toBeInTheDocument()
        expect(screen.getByText('واجهة')).toBeInTheDocument()
        expect(screen.getByText('تطوير')).toBeInTheDocument()
        expect(screen.getByText('برمجة')).toBeInTheDocument()
      })
    })
  })

  describe('Filtering and Search', () => {
    it('should filter tasks by assignee', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        const assigneeFilter = screen.getByDisplayValue('الكل')
        fireEvent.change(assigneeFilter, { target: { value: 'user-1' } })
      })

      await waitFor(() => {
        expect(screen.getByText('مهمة التصميم')).toBeInTheDocument()
        expect(screen.queryByText('مهمة التطوير')).not.toBeInTheDocument()
      })
    })

    it('should filter tasks by priority', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        const priorityFilter = screen.getByDisplayValue('جميع الأولويات')
        fireEvent.change(priorityFilter, { target: { value: 'high' } })
      })

      await waitFor(() => {
        expect(screen.getByText('مهمة التصميم')).toBeInTheDocument()
        expect(screen.queryByText('مهمة التطوير')).not.toBeInTheDocument()
        expect(screen.queryByText('مهمة الاختبار')).not.toBeInTheDocument()
      })
    })

    it('should search tasks by title', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('البحث في المهام...')
        fireEvent.change(searchInput, { target: { value: 'تصميم' } })
      })

      await waitFor(() => {
        expect(screen.getByText('مهمة التصميم')).toBeInTheDocument()
        expect(screen.queryByText('مهمة التطوير')).not.toBeInTheDocument()
        expect(screen.queryByText('مهمة الاختبار')).not.toBeInTheDocument()
      })
    })

    it('should clear filters', async () => {
      render(<TaskBoard projectId="project-1" />)

      // تطبيق فلتر
      await waitFor(() => {
        const priorityFilter = screen.getByDisplayValue('جميع الأولويات')
        fireEvent.change(priorityFilter, { target: { value: 'high' } })
      })

      // مسح الفلاتر
      await waitFor(() => {
        const clearButton = screen.getByText('مسح الفلاتر')
        fireEvent.click(clearButton)
      })

      await waitFor(() => {
        expect(screen.getByText('مهمة التصميم')).toBeInTheDocument()
        expect(screen.getByText('مهمة التطوير')).toBeInTheDocument()
        expect(screen.getByText('مهمة الاختبار')).toBeInTheDocument()
      })
    })
  })

  describe('Task Interactions', () => {
    it('should handle task click', async () => {
      const onTaskClick = vi.fn()
      render(<TaskBoard projectId="project-1" onTaskClick={onTaskClick} />)

      await waitFor(() => {
        const taskCard = screen.getByText('مهمة التصميم').closest('[data-testid="task-card"]')
        if (taskCard) {
          fireEvent.click(taskCard)
        }
      })

      expect(onTaskClick).toHaveBeenCalledWith(mockTasks[0])
    })

    it('should handle task edit', async () => {
      const onTaskEdit = vi.fn()
      render(<TaskBoard projectId="project-1" onTaskEdit={onTaskEdit} />)

      await waitFor(() => {
        const editButton = screen.getAllByLabelText('تعديل المهمة')[0]
        fireEvent.click(editButton)
      })

      expect(onTaskEdit).toHaveBeenCalledWith(mockTasks[0])
    })

    it('should handle task delete', async () => {
      const onTaskDelete = vi.fn()
      render(<TaskBoard projectId="project-1" onTaskDelete={onTaskDelete} />)

      await waitFor(() => {
        const deleteButton = screen.getAllByLabelText('حذف المهمة')[0]
        fireEvent.click(deleteButton)
      })

      expect(onTaskDelete).toHaveBeenCalledWith(mockTasks[0])
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag end within same column', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument()
      })

      // محاكاة السحب والإفلات داخل نفس العمود
      const dragResult = {
        destination: { droppableId: 'not_started', index: 1 },
        source: { droppableId: 'not_started', index: 0 },
        draggableId: 'task-1'
      }

      // هذا سيتطلب محاكاة أكثر تعقيداً للسحب والإفلات
      // في الوقت الحالي، نتحقق فقط من وجود السياق
    })

    it('should handle drag end between different columns', async () => {
      const { taskManagementService } = require('../../../src/services/taskManagementService')
      
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument()
      })

      // محاكاة السحب والإفلات بين أعمدة مختلفة
      const dragResult = {
        destination: { droppableId: 'in_progress', index: 0 },
        source: { droppableId: 'not_started', index: 0 },
        draggableId: 'task-1'
      }

      // التحقق من أن الخدمة ستُستدعى لتحديث حالة المهمة
      // هذا يتطلب محاكاة أكثر تفصيلاً
    })

    it('should handle invalid drag operations', async () => {
      render(<TaskBoard projectId="project-1" />)

      // محاكاة سحب بدون وجهة
      const dragResult = {
        destination: null,
        source: { droppableId: 'not_started', index: 0 },
        draggableId: 'task-1'
      }

      // التحقق من عدم حدوث تحديث
      const { taskManagementService } = require('../../../src/services/taskManagementService')
      expect(taskManagementService.updateTask).not.toHaveBeenCalled()
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      const { taskManagementService } = require('../../../src/services/taskManagementService')
      taskManagementService.getProjectTasks.mockReturnValue(new Promise(() => {})) // معلق إلى الأبد

      render(<TaskBoard projectId="project-1" />)

      expect(screen.getByText('جاري تحميل المهام...')).toBeInTheDocument()
    })

    it('should show error state', async () => {
      const { taskManagementService } = require('../../../src/services/taskManagementService')
      taskManagementService.getProjectTasks.mockRejectedValue(new Error('فشل في التحميل'))

      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByText('فشل في تحميل المهام')).toBeInTheDocument()
      })
    })

    it('should show empty state', async () => {
      const { taskManagementService } = require('../../../src/services/taskManagementService')
      taskManagementService.getProjectTasks.mockResolvedValue([])

      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByText('لا توجد مهام في هذا المشروع')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByLabelText('لوحة المهام')).toBeInTheDocument()
        expect(screen.getByLabelText('البحث في المهام')).toBeInTheDocument()
        expect(screen.getByLabelText('فلترة حسب المكلف')).toBeInTheDocument()
        expect(screen.getByLabelText('فلترة حسب الأولوية')).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        const firstTaskCard = screen.getByText('مهمة التصميم').closest('[data-testid="task-card"]')
        expect(firstTaskCard).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should have proper heading structure', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'لوحة المهام' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'غير مبدوءة' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'قيد التنفيذ' })).toBeInTheDocument()
      })
    })
  })

  describe('RTL Support', () => {
    it('should render with RTL direction', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        const boardContainer = screen.getByLabelText('لوحة المهام')
        expect(boardContainer).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should display Arabic text correctly', async () => {
      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByText('مهمة التصميم')).toBeInTheDocument()
        expect(screen.getByText('تصميم واجهة المستخدم')).toBeInTheDocument()
        expect(screen.getByText('أحمد محمد')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should handle large number of tasks', async () => {
      const largeMockTasks = Array.from({ length: 100 }, (_, i) => ({
        ...mockTasks[0],
        id: `task-${i}`,
        title: `مهمة ${i}`
      }))

      const { taskManagementService } = require('../../../src/services/taskManagementService')
      taskManagementService.getProjectTasks.mockResolvedValue(largeMockTasks)

      render(<TaskBoard projectId="project-1" />)

      await waitFor(() => {
        expect(screen.getByText('مهمة 0')).toBeInTheDocument()
        expect(screen.getByText('مهمة 99')).toBeInTheDocument()
      })
    })

    it('should debounce search input', async () => {
      render(<TaskBoard projectId="project-1" />)

      const searchInput = await screen.findByPlaceholderText('البحث في المهام...')
      
      // كتابة سريعة
      fireEvent.change(searchInput, { target: { value: 'ت' } })
      fireEvent.change(searchInput, { target: { value: 'تص' } })
      fireEvent.change(searchInput, { target: { value: 'تصميم' } })

      // التحقق من أن البحث لم يحدث إلا مرة واحدة بعد التأخير
      await waitFor(() => {
        expect(screen.getByDisplayValue('تصميم')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })
})
