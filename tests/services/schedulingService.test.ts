/**
 * Scheduling Service Tests
 * اختبارات خدمة الجدولة الزمنية
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { schedulingService } from '../../src/services/schedulingService'
import type { 
  ProjectSchedule, 
  GanttTask, 
  SchedulingOptions,
  WorkingCalendar 
} from '../../src/types/scheduling'
import type { Task } from '../../src/types/tasks'

// Mock dependencies
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn()
  }
}))

vi.mock('../../src/repository/task.repository', () => ({
  taskRepository: {
    getTasksByProject: vi.fn()
  }
}))

vi.mock('../../src/services/criticalPathCalculator', () => ({
  criticalPathCalculator: {
    calculateCriticalPath: vi.fn()
  }
}))

const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'project-1',
    title: 'مهمة التصميم',
    titleEn: 'Design Task',
    description: 'تصميم واجهة المستخدم',
    descriptionEn: 'UI Design',
    type: 'task',
    status: 'in_progress',
    priority: 'high',
    progress: 30,
    plannedStartDate: '2024-10-01',
    plannedEndDate: '2024-10-15',
    estimatedHours: 80,
    actualHours: 24,
    estimatedCost: 8000,
    actualCost: 2400,
    dependencies: [],
    subtasks: [],
    attachments: [],
    comments: [],
    timeEntries: [],
    tags: ['ui', 'design'],
    createdAt: '2024-10-01T08:00:00Z',
    updatedAt: '2024-10-01T08:00:00Z',
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
    status: 'not_started',
    priority: 'medium',
    progress: 0,
    plannedStartDate: '2024-10-16',
    plannedEndDate: '2024-10-30',
    estimatedHours: 120,
    actualHours: 0,
    estimatedCost: 12000,
    actualCost: 0,
    dependencies: [
      {
        id: 'dep-1',
        taskId: 'task-2',
        dependsOnTaskId: 'task-1',
        type: 'finish_to_start',
        lag: 0,
        createdAt: '2024-10-01T08:00:00Z'
      }
    ],
    subtasks: [],
    attachments: [],
    comments: [],
    timeEntries: [],
    tags: ['development'],
    createdAt: '2024-10-01T08:00:00Z',
    updatedAt: '2024-10-01T08:00:00Z',
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    version: 1
  }
]

const mockSchedulingOptions: SchedulingOptions = {
  autoSchedule: true,
  levelResources: false,
  respectDependencies: true,
  calendar: {
    id: 'default',
    name: 'التقويم الافتراضي',
    workingDays: [1, 2, 3, 4, 5],
    workingHours: {
      start: '08:00',
      end: '17:00'
    },
    holidays: [],
    exceptions: []
  },
  constraintType: 'asap'
}

describe('SchedulingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSchedule', () => {
    it('should create a new schedule for a project', async () => {
      // Arrange
      const projectId = 'project-1'
      const { taskRepository } = await import('../../src/repository/task.repository')
      const { asyncStorage } = await import('../../src/utils/storage')
      const { criticalPathCalculator } = await import('../../src/services/criticalPathCalculator')

      vi.mocked(taskRepository.getTasksByProject).mockResolvedValue(mockTasks)
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)
      vi.mocked(criticalPathCalculator.calculateCriticalPath).mockReturnValue({
        path: ['task-1', 'task-2'],
        duration: 29,
        slack: 0,
        tasks: [],
        bottlenecks: []
      })

      // Act
      const result = await schedulingService.createSchedule(projectId, mockSchedulingOptions)

      // Assert
      expect(result).toBeDefined()
      expect(result.projectId).toBe(projectId)
      expect(result.tasks).toHaveLength(2)
      expect(result.criticalPath).toEqual(['task-1', 'task-2'])
      expect(result.totalDuration).toBe(29)
      expect(taskRepository.getTasksByProject).toHaveBeenCalledWith(projectId)
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('should handle empty task list', async () => {
      // Arrange
      const projectId = 'empty-project'
      const { taskRepository } = await import('../../src/repository/task.repository')
      const { asyncStorage } = await import('../../src/utils/storage')
      const { criticalPathCalculator } = await import('../../src/services/criticalPathCalculator')

      vi.mocked(taskRepository.getTasksByProject).mockResolvedValue([])
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)
      vi.mocked(criticalPathCalculator.calculateCriticalPath).mockReturnValue({
        path: [],
        duration: 0,
        slack: 0,
        tasks: [],
        bottlenecks: []
      })

      // Act
      const result = await schedulingService.createSchedule(projectId, mockSchedulingOptions)

      // Assert
      expect(result).toBeDefined()
      expect(result.tasks).toHaveLength(0)
      expect(result.criticalPath).toEqual([])
    })
  })

  describe('getSchedule', () => {
    it('should return existing schedule', async () => {
      // Arrange
      const projectId = 'project-1'
      const mockSchedule: ProjectSchedule = {
        id: 'schedule-1',
        projectId,
        name: 'Test Schedule',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-30'),
        tasks: [],
        milestones: [],
        criticalPath: [],
        totalDuration: 29,
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
        createdAt: '2024-10-01T08:00:00Z',
        updatedAt: '2024-10-01T08:00:00Z',
        version: 1
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([mockSchedule])

      // Act
      const result = await schedulingService.getSchedule(projectId)

      // Assert
      expect(result).toEqual(mockSchedule)
    })

    it('should return null for non-existent schedule', async () => {
      // Arrange
      const projectId = 'non-existent'
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      // Act
      const result = await schedulingService.getSchedule(projectId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('updateSchedule', () => {
    it('should update existing schedule', async () => {
      // Arrange
      const projectId = 'project-1'
      const existingSchedule: ProjectSchedule = {
        id: 'schedule-1',
        projectId,
        name: 'Old Name',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-30'),
        tasks: [],
        milestones: [],
        criticalPath: [],
        totalDuration: 29,
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
        createdAt: '2024-10-01T08:00:00Z',
        updatedAt: '2024-10-01T08:00:00Z',
        version: 1
      }

      const updates = { name: 'New Name' }
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingSchedule])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      // Act
      const result = await schedulingService.updateSchedule(projectId, updates)

      // Assert
      expect(result.name).toBe('New Name')
      expect(result.version).toBe(2)
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('should throw error for non-existent schedule', async () => {
      // Arrange
      const projectId = 'non-existent'
      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      // Act & Assert
      await expect(
        schedulingService.updateSchedule(projectId, { name: 'New Name' })
      ).rejects.toThrow('فشل في تحديث الجدولة')
    })
  })

  describe('scheduleTask', () => {
    it('should add new task to schedule', async () => {
      // Arrange
      const projectId = 'project-1'
      const existingSchedule: ProjectSchedule = {
        id: 'schedule-1',
        projectId,
        name: 'Test Schedule',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-30'),
        tasks: [],
        milestones: [],
        criticalPath: [],
        totalDuration: 29,
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
        createdAt: '2024-10-01T08:00:00Z',
        updatedAt: '2024-10-01T08:00:00Z',
        version: 1
      }

      const newTask: Partial<GanttTask> = {
        name: 'New Task',
        start: new Date('2024-10-01'),
        end: new Date('2024-10-05'),
        progress: 0,
        type: 'task'
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingSchedule])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      // Act
      const result = await schedulingService.scheduleTask(projectId, newTask)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe('New Task')
      expect(result.type).toBe('task')
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('addDependency', () => {
    it('should add dependency between tasks', async () => {
      // Arrange
      const projectId = 'project-1'
      const task1: GanttTask = {
        id: 'task-1',
        name: 'Task 1',
        start: new Date('2024-10-01'),
        end: new Date('2024-10-05'),
        progress: 0,
        dependencies: [],
        type: 'task'
      }

      const existingSchedule: ProjectSchedule = {
        id: 'schedule-1',
        projectId,
        name: 'Test Schedule',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-30'),
        tasks: [task1],
        milestones: [],
        criticalPath: [],
        totalDuration: 29,
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
        createdAt: '2024-10-01T08:00:00Z',
        updatedAt: '2024-10-01T08:00:00Z',
        version: 1
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingSchedule])
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

      // Act
      await schedulingService.addDependency(projectId, 'task-1', 'task-0')

      // Assert
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('validateDependencies', () => {
    it('should detect circular dependencies', async () => {
      // Arrange
      const projectId = 'project-1'
      const task1: GanttTask = {
        id: 'task-1',
        name: 'Task 1',
        start: new Date('2024-10-01'),
        end: new Date('2024-10-05'),
        progress: 0,
        dependencies: ['task-2'],
        type: 'task'
      }

      const task2: GanttTask = {
        id: 'task-2',
        name: 'Task 2',
        start: new Date('2024-10-06'),
        end: new Date('2024-10-10'),
        progress: 0,
        dependencies: ['task-1'],
        type: 'task'
      }

      const existingSchedule: ProjectSchedule = {
        id: 'schedule-1',
        projectId,
        name: 'Test Schedule',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-30'),
        tasks: [task1, task2],
        milestones: [],
        criticalPath: [],
        totalDuration: 29,
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
        createdAt: '2024-10-01T08:00:00Z',
        updatedAt: '2024-10-01T08:00:00Z',
        version: 1
      }

      const { asyncStorage } = await import('../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockResolvedValue([existingSchedule])

      // Act
      const conflicts = await schedulingService.validateDependencies(projectId)

      // Assert
      expect(conflicts).toHaveLength(2) // Both tasks have circular dependency
      expect(conflicts[0].type).toBe('dependency_violation')
      expect(conflicts[0].severity).toBe('high')
    })
  })

  describe('calculateWorkingDays', () => {
    it('should calculate working days correctly', async () => {
      // Arrange
      const start = new Date('2024-10-01') // Tuesday
      const end = new Date('2024-10-07')   // Monday
      const calendar: WorkingCalendar = {
        id: 'test',
        name: 'Test Calendar',
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        workingHours: { start: '08:00', end: '17:00' },
        holidays: [],
        exceptions: []
      }

      // Act
      const workingDays = await schedulingService.calculateWorkingDays(start, end, calendar)

      // Assert
      expect(workingDays).toBe(5) // Tue, Wed, Thu, Fri, Mon
    })

    it('should exclude weekends', async () => {
      // Arrange
      const start = new Date('2024-10-05') // Saturday
      const end = new Date('2024-10-06')   // Sunday
      const calendar: WorkingCalendar = {
        id: 'test',
        name: 'Test Calendar',
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        workingHours: { start: '08:00', end: '17:00' },
        holidays: [],
        exceptions: []
      }

      // Act
      const workingDays = await schedulingService.calculateWorkingDays(start, end, calendar)

      // Assert
      expect(workingDays).toBe(0) // No working days on weekend
    })
  })
})
