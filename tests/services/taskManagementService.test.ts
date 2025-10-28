/**
 * Task Management Service Tests
 * اختبارات خدمة إدارة المهام
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../../src/types/tasks'

// Create a mock service object
const mockTaskManagementService = {
  getAllTasks: vi.fn(),
  getTaskById: vi.fn(),
  getProjectTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  updateTaskProgress: vi.fn(),
  getTaskStatistics: vi.fn(),
  searchTasks: vi.fn(),
  getOverdueTasks: vi.fn(),
  validateTask: vi.fn(),
}

// Mock the module
vi.mock('../../src/services/taskManagementService', () => ({
  taskManagementService: mockTaskManagementService,
}))

describe('TaskManagementService', () => {
  const mockTask: Task = {
    id: 'task-1',
    projectId: 'project-1',
    title: 'مهمة اختبار',
    titleEn: 'Test Task',
    description: 'وصف المهمة',
    descriptionEn: 'Task description',
    type: 'task',
    status: 'not_started',
    priority: 'medium',
    progress: 0,
    plannedStartDate: '2024-01-01',
    plannedEndDate: '2024-01-31',
    estimatedHours: 40,
    actualHours: 0,
    estimatedCost: 5000,
    actualCost: 0,
    dependencies: [],
    subtasks: [],
    attachments: [],
    comments: [],
    timeEntries: [],
    tags: ['اختبار'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    version: 1,
  }

  const mockTaskStatistics = {
    totalTasks: 10,
    completedTasks: 3,
    inProgressTasks: 4,
    notStartedTasks: 2,
    onHoldTasks: 1,
    cancelledTasks: 0,
    overdueTasks: 1,
    completionRate: 30,
    averageProgress: 45,
    totalEstimatedHours: 400,
    totalActualHours: 180,
    totalEstimatedCost: 50000,
    totalActualCost: 22000,
    tasksByPriority: {
      low: 2,
      medium: 5,
      high: 2,
      critical: 1,
    },
    tasksByType: {
      task: 7,
      milestone: 2,
      phase: 1,
      deliverable: 0,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllTasks', () => {
    it('should return all tasks', async () => {
      const mockTasks = [mockTask]
      mockTaskManagementService.getAllTasks.mockResolvedValue(mockTasks)

      const { taskManagementService } = await import('../../src/services/taskManagementService')
      const result = await taskManagementService.getAllTasks()

      expect(result).toEqual(mockTasks)
      expect(mockTaskManagementService.getAllTasks).toHaveBeenCalledWith()
    })

    it('should return filtered tasks', async () => {
      const filters = { projectId: 'project-1', status: 'in_progress' as TaskStatus }
      const mockTasks = [{ ...mockTask, status: 'in_progress' as TaskStatus }]
      mockTaskManagementService.getAllTasks.mockResolvedValue(mockTasks)

      const { taskManagementService } = await import('../../src/services/taskManagementService')
      const result = await taskManagementService.getAllTasks(filters)

      expect(result).toEqual(mockTasks)
      expect(mockTaskManagementService.getAllTasks).toHaveBeenCalledWith(filters)
    })

    it('should handle errors', async () => {
      mockTaskManagementService.getAllTasks.mockRejectedValue(new Error('فشل في تحميل المهام'))

      const { taskManagementService } = await import('../../src/services/taskManagementService')
      await expect(taskManagementService.getAllTasks()).rejects.toThrow('فشل في تحميل المهام')
    })
  })

  describe('getTaskById', () => {
    it('should return task by id', async () => {
      vi.mocked(taskManagementService.getTaskById).mockResolvedValue(mockTask)

      const result = await taskManagementService.getTaskById('task-1')

      expect(result).toEqual(mockTask)
      expect(taskManagementService.getTaskById).toHaveBeenCalledWith('task-1')
    })

    it('should return null for non-existent task', async () => {
      vi.mocked(taskManagementService.getTaskById).mockResolvedValue(null)

      const result = await taskManagementService.getTaskById('non-existent')

      expect(result).toBeNull()
    })

    it('should handle errors', async () => {
      vi.mocked(taskManagementService.getTaskById).mockRejectedValue(
        new Error('فشل في تحميل المهمة'),
      )

      await expect(taskManagementService.getTaskById('task-1')).rejects.toThrow(
        'فشل في تحميل المهمة',
      )
    })
  })

  describe('getProjectTasks', () => {
    it('should return tasks for project', async () => {
      const mockTasks = [mockTask]
      vi.mocked(taskManagementService.repository.getByProject).mockResolvedValue(mockTasks)

      const result = await taskManagementService.getProjectTasks('project-1')

      expect(result).toEqual(mockTasks)
      expect(taskManagementService.repository.getByProject).toHaveBeenCalledWith(
        'project-1',
        undefined,
      )
    })

    it('should return filtered project tasks', async () => {
      const filters = { status: 'completed' as TaskStatus }
      const mockTasks = [{ ...mockTask, status: 'completed' as TaskStatus }]
      vi.mocked(taskManagementService.repository.getByProject).mockResolvedValue(mockTasks)

      const result = await taskManagementService.getProjectTasks('project-1', filters)

      expect(result).toEqual(mockTasks)
      expect(taskManagementService.repository.getByProject).toHaveBeenCalledWith(
        'project-1',
        filters,
      )
    })
  })

  describe('createTask', () => {
    it('should create a new task', async () => {
      const createRequest: CreateTaskRequest = {
        projectId: 'project-1',
        title: 'مهمة جديدة',
        description: 'وصف المهمة الجديدة',
        type: 'task',
        priority: 'high',
        plannedStartDate: '2024-02-01',
        plannedEndDate: '2024-02-28',
        estimatedHours: 60,
        estimatedCost: 7500,
        tags: ['جديد'],
      }

      const createdTask = { ...mockTask, ...createRequest, id: 'new-task-id' }
      vi.mocked(taskManagementService.repository.create).mockResolvedValue(createdTask)

      const result = await taskManagementService.createTask(createRequest)

      expect(result).toEqual(createdTask)
      expect(taskManagementService.repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createRequest,
          status: 'not_started',
          progress: 0,
          actualHours: 0,
          actualCost: 0,
        }),
      )
    })

    it('should validate task data', async () => {
      const invalidRequest = {
        projectId: '',
        title: '',
        description: 'وصف',
        type: 'task' as const,
        priority: 'medium' as const,
        plannedStartDate: '2024-02-01',
        plannedEndDate: '2024-01-01', // تاريخ نهاية قبل البداية
        estimatedHours: -10, // ساعات سالبة
        estimatedCost: 1000,
        tags: [],
      }

      await expect(taskManagementService.createTask(invalidRequest)).rejects.toThrow(
        'بيانات المهمة غير صحيحة',
      )
    })

    it('should handle creation errors', async () => {
      const createRequest: CreateTaskRequest = {
        projectId: 'project-1',
        title: 'مهمة جديدة',
        description: 'وصف المهمة الجديدة',
        type: 'task',
        priority: 'high',
        plannedStartDate: '2024-02-01',
        plannedEndDate: '2024-02-28',
        estimatedHours: 60,
        estimatedCost: 7500,
        tags: [],
      }

      vi.mocked(taskManagementService.repository.create).mockRejectedValue(
        new Error('Database error'),
      )

      await expect(taskManagementService.createTask(createRequest)).rejects.toThrow(
        'فشل في إنشاء المهمة',
      )
    })
  })

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const updateRequest: UpdateTaskRequest = {
        id: 'task-1',
        title: 'مهمة محدثة',
        progress: 50,
        status: 'in_progress',
        actualHours: 20,
        version: 1,
      }

      const updatedTask = { ...mockTask, ...updateRequest, version: 2 }
      vi.mocked(taskManagementService.repository.getById).mockResolvedValue(mockTask)
      vi.mocked(taskManagementService.repository.update).mockResolvedValue(updatedTask)

      const result = await taskManagementService.updateTask(updateRequest)

      expect(result).toEqual(updatedTask)
      expect(taskManagementService.repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateRequest,
          updatedAt: expect.any(String),
          version: 2,
        }),
      )
    })

    it('should handle version conflicts', async () => {
      const updateRequest: UpdateTaskRequest = {
        id: 'task-1',
        title: 'مهمة محدثة',
        version: 0, // إصدار قديم
      }

      vi.mocked(taskManagementService.repository.getById).mockResolvedValue(mockTask)

      await expect(taskManagementService.updateTask(updateRequest)).rejects.toThrow(
        'تم تحديث المهمة من قبل مستخدم آخر',
      )
    })

    it('should handle non-existent task', async () => {
      const updateRequest: UpdateTaskRequest = {
        id: 'non-existent',
        title: 'مهمة محدثة',
        version: 1,
      }

      vi.mocked(taskManagementService.repository.getById).mockResolvedValue(null)

      await expect(taskManagementService.updateTask(updateRequest)).rejects.toThrow(
        'المهمة غير موجودة',
      )
    })
  })

  describe('deleteTask', () => {
    it('should delete an existing task', async () => {
      vi.mocked(taskManagementService.repository.getById).mockResolvedValue(mockTask)
      vi.mocked(taskManagementService.repository.delete).mockResolvedValue(undefined)

      await taskManagementService.deleteTask('task-1')

      expect(taskManagementService.repository.delete).toHaveBeenCalledWith('task-1')
    })

    it('should handle non-existent task', async () => {
      vi.mocked(taskManagementService.repository.getById).mockResolvedValue(null)

      await expect(taskManagementService.deleteTask('non-existent')).rejects.toThrow(
        'المهمة غير موجودة',
      )
    })

    it('should prevent deletion of tasks with dependencies', async () => {
      const taskWithDependents = {
        ...mockTask,
        subtasks: [{ ...mockTask, id: 'subtask-1' }],
      }
      vi.mocked(taskManagementService.repository.getById).mockResolvedValue(taskWithDependents)

      await expect(taskManagementService.deleteTask('task-1')).rejects.toThrow(
        'لا يمكن حذف مهمة تحتوي على مهام فرعية',
      )
    })
  })

  describe('updateTaskProgress', () => {
    it('should update task progress', async () => {
      const progressUpdate = {
        taskId: 'task-1',
        progress: 75,
        actualHours: 30,
        notes: 'تقدم جيد',
      }

      const updatedTask = {
        ...mockTask,
        progress: 75,
        actualHours: 30,
        status: 'in_progress' as TaskStatus,
      }
      vi.mocked(taskManagementService.repository.getById).mockResolvedValue(mockTask)
      vi.mocked(taskManagementService.repository.update).mockResolvedValue(updatedTask)

      const result = await taskManagementService.updateTaskProgress(progressUpdate)

      expect(result).toEqual(updatedTask)
      expect(taskManagementService.repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task-1',
          progress: 75,
          actualHours: 30,
          status: 'in_progress',
        }),
      )
    })

    it('should auto-complete task at 100% progress', async () => {
      const progressUpdate = {
        taskId: 'task-1',
        progress: 100,
        actualHours: 40,
      }

      const completedTask = {
        ...mockTask,
        progress: 100,
        actualHours: 40,
        status: 'completed' as TaskStatus,
      }
      vi.mocked(taskManagementService.repository.getById).mockResolvedValue(mockTask)
      vi.mocked(taskManagementService.repository.update).mockResolvedValue(completedTask)

      const result = await taskManagementService.updateTaskProgress(progressUpdate)

      expect(result.status).toBe('completed')
      expect(result.progress).toBe(100)
    })

    it('should validate progress range', async () => {
      const invalidUpdate = {
        taskId: 'task-1',
        progress: 150, // تجاوز 100%
      }

      await expect(taskManagementService.updateTaskProgress(invalidUpdate)).rejects.toThrow(
        'نسبة التقدم يجب أن تكون بين 0 و 100',
      )
    })
  })

  describe('getTaskStatistics', () => {
    it('should return task statistics', async () => {
      vi.mocked(taskManagementService.repository.getStatistics).mockResolvedValue(
        mockTaskStatistics,
      )

      const result = await taskManagementService.getTaskStatistics()

      expect(result).toEqual(mockTaskStatistics)
      expect(taskManagementService.repository.getStatistics).toHaveBeenCalledWith(undefined)
    })

    it('should return project-specific statistics', async () => {
      vi.mocked(taskManagementService.repository.getStatistics).mockResolvedValue(
        mockTaskStatistics,
      )

      const result = await taskManagementService.getTaskStatistics('project-1')

      expect(result).toEqual(mockTaskStatistics)
      expect(taskManagementService.repository.getStatistics).toHaveBeenCalledWith('project-1')
    })
  })

  describe('searchTasks', () => {
    it('should search tasks by query', async () => {
      const mockTasks = [mockTask]
      vi.mocked(taskManagementService.repository.search).mockResolvedValue(mockTasks)

      const result = await taskManagementService.searchTasks('اختبار')

      expect(result).toEqual(mockTasks)
      expect(taskManagementService.repository.search).toHaveBeenCalledWith('اختبار', undefined)
    })

    it('should search with filters', async () => {
      const filters = { projectId: 'project-1', priority: 'high' as TaskPriority }
      const mockTasks = [{ ...mockTask, priority: 'high' as TaskPriority }]
      vi.mocked(taskManagementService.repository.search).mockResolvedValue(mockTasks)

      const result = await taskManagementService.searchTasks('اختبار', filters)

      expect(result).toEqual(mockTasks)
      expect(taskManagementService.repository.search).toHaveBeenCalledWith('اختبار', filters)
    })
  })

  describe('getOverdueTasks', () => {
    it('should return overdue tasks', async () => {
      const overdueTasks = [{ ...mockTask, plannedEndDate: '2023-12-31' }]
      vi.mocked(taskManagementService.repository.getOverdue).mockResolvedValue(overdueTasks)

      const result = await taskManagementService.getOverdueTasks()

      expect(result).toEqual(overdueTasks)
      expect(taskManagementService.repository.getOverdue).toHaveBeenCalledWith(undefined)
    })

    it('should return project-specific overdue tasks', async () => {
      const overdueTasks = [{ ...mockTask, plannedEndDate: '2023-12-31' }]
      vi.mocked(taskManagementService.repository.getOverdue).mockResolvedValue(overdueTasks)

      const result = await taskManagementService.getOverdueTasks('project-1')

      expect(result).toEqual(overdueTasks)
      expect(taskManagementService.repository.getOverdue).toHaveBeenCalledWith('project-1')
    })
  })

  describe('validateTask', () => {
    it('should validate correct task data', async () => {
      const validTask = {
        projectId: 'project-1',
        title: 'مهمة صحيحة',
        description: 'وصف المهمة',
        type: 'task' as const,
        priority: 'medium' as const,
        plannedStartDate: '2024-01-01',
        plannedEndDate: '2024-01-31',
        estimatedHours: 40,
        estimatedCost: 5000,
      }

      const result = await taskManagementService.validateTask(validTask)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect validation errors', async () => {
      const invalidTask = {
        projectId: '',
        title: '',
        description: 'وصف',
        type: 'task' as const,
        priority: 'medium' as const,
        plannedStartDate: '2024-02-01',
        plannedEndDate: '2024-01-01',
        estimatedHours: -10,
        estimatedCost: 1000,
      }

      const result = await taskManagementService.validateTask(invalidTask)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContain('معرف المشروع مطلوب')
      expect(result.errors).toContain('عنوان المهمة مطلوب')
      expect(result.errors).toContain('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')
      expect(result.errors).toContain('الساعات المقدرة يجب أن تكون أكبر من صفر')
    })
  })
})
