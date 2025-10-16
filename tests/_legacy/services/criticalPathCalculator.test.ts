/**
 * Critical Path Calculator Tests
 * اختبارات محرك حساب المسار الحرج
 */

import { describe, it, expect } from 'vitest'
import { criticalPathCalculator } from '../../src/services/criticalPathCalculator'
import type { ProjectSchedule, GanttTask } from '../../src/types/scheduling'

const createMockSchedule = (tasks: GanttTask[]): ProjectSchedule => ({
  id: 'test-schedule',
  projectId: 'test-project',
  name: 'Test Schedule',
  nameEn: 'Test Schedule',
  startDate: new Date('2024-10-01'),
  endDate: new Date('2024-10-31'),
  tasks,
  milestones: [],
  criticalPath: [],
  totalDuration: 0,
  workingDays: [1, 2, 3, 4, 5],
  holidays: [],
  createdAt: '2024-10-01T08:00:00Z',
  updatedAt: '2024-10-01T08:00:00Z',
  version: 1
})

describe('CriticalPathCalculator', () => {
  describe('calculateCriticalPath', () => {
    it('should calculate critical path for simple linear tasks', () => {
      // Arrange
      const tasks: GanttTask[] = [
        {
          id: 'A',
          name: 'Task A',
          start: new Date('2024-10-01'),
          end: new Date('2024-10-03'), // 2 days
          progress: 0,
          dependencies: [],
          type: 'task'
        },
        {
          id: 'B',
          name: 'Task B',
          start: new Date('2024-10-04'),
          end: new Date('2024-10-07'), // 3 days
          progress: 0,
          dependencies: ['A'],
          type: 'task'
        },
        {
          id: 'C',
          name: 'Task C',
          start: new Date('2024-10-08'),
          end: new Date('2024-10-11'), // 3 days
          progress: 0,
          dependencies: ['B'],
          type: 'task'
        }
      ]

      const schedule = createMockSchedule(tasks)

      // Act
      const result = criticalPathCalculator.calculateCriticalPath(schedule)

      // Assert
      expect(result.path).toEqual(['A', 'B', 'C'])
      expect(result.duration).toBe(8) // 2 + 3 + 3 days
      expect(result.tasks).toHaveLength(3)
      expect(result.tasks.every(task => task.isCritical)).toBe(true)
      expect(result.tasks.every(task => task.totalSlack === 0)).toBe(true)
    })

    it('should identify critical path in parallel tasks', () => {
      // Arrange
      const tasks: GanttTask[] = [
        {
          id: 'A',
          name: 'Task A',
          start: new Date('2024-10-01'),
          end: new Date('2024-10-03'), // 2 days
          progress: 0,
          dependencies: [],
          type: 'task'
        },
        {
          id: 'B',
          name: 'Task B',
          start: new Date('2024-10-04'),
          end: new Date('2024-10-08'), // 4 days (longer path)
          progress: 0,
          dependencies: ['A'],
          type: 'task'
        },
        {
          id: 'C',
          name: 'Task C',
          start: new Date('2024-10-04'),
          end: new Date('2024-10-06'), // 2 days (shorter path)
          progress: 0,
          dependencies: ['A'],
          type: 'task'
        },
        {
          id: 'D',
          name: 'Task D',
          start: new Date('2024-10-09'),
          end: new Date('2024-10-11'), // 2 days
          progress: 0,
          dependencies: ['B', 'C'],
          type: 'task'
        }
      ]

      const schedule = createMockSchedule(tasks)

      // Act
      const result = criticalPathCalculator.calculateCriticalPath(schedule)

      // Assert
      expect(result.path).toEqual(['A', 'B', 'D'])
      expect(result.duration).toBe(8) // 2 + 4 + 2 days
      
      // Task C should have slack since it's not on critical path
      const taskC = result.tasks.find(t => t.id === 'C')
      expect(taskC?.isCritical).toBe(false)
      expect(taskC?.totalSlack).toBeGreaterThan(0)
    })

    it('should handle single task', () => {
      // Arrange
      const tasks: GanttTask[] = [
        {
          id: 'A',
          name: 'Single Task',
          start: new Date('2024-10-01'),
          end: new Date('2024-10-05'), // 4 days
          progress: 0,
          dependencies: [],
          type: 'task'
        }
      ]

      const schedule = createMockSchedule(tasks)

      // Act
      const result = criticalPathCalculator.calculateCriticalPath(schedule)

      // Assert
      expect(result.path).toEqual(['A'])
      expect(result.duration).toBe(4)
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0].isCritical).toBe(true)
      expect(result.tasks[0].totalSlack).toBe(0)
    })

    it('should handle empty task list', () => {
      // Arrange
      const schedule = createMockSchedule([])

      // Act
      const result = criticalPathCalculator.calculateCriticalPath(schedule)

      // Assert
      expect(result.path).toEqual([])
      expect(result.duration).toBe(0)
      expect(result.tasks).toHaveLength(0)
      expect(result.bottlenecks).toHaveLength(0)
    })

    it('should identify bottlenecks correctly', () => {
      // Arrange
      const tasks: GanttTask[] = [
        {
          id: 'A',
          name: 'Task A',
          start: new Date('2024-10-01'),
          end: new Date('2024-10-03'),
          progress: 0,
          dependencies: [],
          type: 'task'
        },
        {
          id: 'B',
          name: 'Task B',
          start: new Date('2024-10-01'),
          end: new Date('2024-10-03'),
          progress: 0,
          dependencies: [],
          type: 'task'
        },
        {
          id: 'C',
          name: 'Task C (Bottleneck)',
          start: new Date('2024-10-04'),
          end: new Date('2024-10-08'), // Critical task with multiple dependencies
          progress: 0,
          dependencies: ['A', 'B'], // Multiple dependencies
          type: 'task'
        },
        {
          id: 'D',
          name: 'Task D',
          start: new Date('2024-10-09'),
          end: new Date('2024-10-11'),
          progress: 0,
          dependencies: ['C'],
          type: 'task'
        },
        {
          id: 'E',
          name: 'Task E',
          start: new Date('2024-10-09'),
          end: new Date('2024-10-11'),
          progress: 0,
          dependencies: ['C'],
          type: 'task'
        },
        {
          id: 'F',
          name: 'Task F',
          start: new Date('2024-10-09'),
          end: new Date('2024-10-11'),
          progress: 0,
          dependencies: ['C'], // C affects multiple tasks
          type: 'task'
        }
      ]

      const schedule = createMockSchedule(tasks)

      // Act
      const result = criticalPathCalculator.calculateCriticalPath(schedule)

      // Assert
      expect(result.bottlenecks).toContain('C')
    })

    it('should calculate slack correctly for non-critical tasks', () => {
      // Arrange
      const tasks: GanttTask[] = [
        {
          id: 'A',
          name: 'Task A',
          start: new Date('2024-10-01'),
          end: new Date('2024-10-03'), // 2 days
          progress: 0,
          dependencies: [],
          type: 'task'
        },
        {
          id: 'B',
          name: 'Task B (Critical)',
          start: new Date('2024-10-04'),
          end: new Date('2024-10-10'), // 6 days
          progress: 0,
          dependencies: ['A'],
          type: 'task'
        },
        {
          id: 'C',
          name: 'Task C (Non-Critical)',
          start: new Date('2024-10-04'),
          end: new Date('2024-10-07'), // 3 days (has slack)
          progress: 0,
          dependencies: ['A'],
          type: 'task'
        },
        {
          id: 'D',
          name: 'Task D',
          start: new Date('2024-10-11'),
          end: new Date('2024-10-13'), // 2 days
          progress: 0,
          dependencies: ['B', 'C'],
          type: 'task'
        }
      ]

      const schedule = createMockSchedule(tasks)

      // Act
      const result = criticalPathCalculator.calculateCriticalPath(schedule)

      // Assert
      const taskC = result.tasks.find(t => t.id === 'C')
      expect(taskC?.isCritical).toBe(false)
      expect(taskC?.totalSlack).toBe(3) // Can be delayed by 3 days without affecting project
      
      const criticalTasks = result.tasks.filter(t => t.isCritical)
      expect(criticalTasks.map(t => t.id)).toEqual(['A', 'B', 'D'])
    })

    it('should handle milestones correctly', () => {
      // Arrange
      const tasks: GanttTask[] = [
        {
          id: 'A',
          name: 'Task A',
          start: new Date('2024-10-01'),
          end: new Date('2024-10-05'),
          progress: 0,
          dependencies: [],
          type: 'task'
        },
        {
          id: 'M1',
          name: 'Milestone 1',
          start: new Date('2024-10-06'),
          end: new Date('2024-10-06'), // 0 duration
          progress: 100,
          dependencies: ['A'],
          type: 'milestone'
        },
        {
          id: 'B',
          name: 'Task B',
          start: new Date('2024-10-07'),
          end: new Date('2024-10-10'),
          progress: 0,
          dependencies: ['M1'],
          type: 'task'
        }
      ]

      const schedule = createMockSchedule(tasks)

      // Act
      const result = criticalPathCalculator.calculateCriticalPath(schedule)

      // Assert
      expect(result.path).toEqual(['A', 'M1', 'B'])
      const milestone = result.tasks.find(t => t.id === 'M1')
      expect(milestone?.duration).toBe(0)
      expect(milestone?.isCritical).toBe(true)
    })

    it('should handle complex network with multiple paths', () => {
      // Arrange - Diamond network pattern
      const tasks: GanttTask[] = [
        {
          id: 'START',
          name: 'Start',
          start: new Date('2024-10-01'),
          end: new Date('2024-10-02'), // 1 day
          progress: 0,
          dependencies: [],
          type: 'task'
        },
        {
          id: 'A',
          name: 'Path A',
          start: new Date('2024-10-03'),
          end: new Date('2024-10-05'), // 2 days
          progress: 0,
          dependencies: ['START'],
          type: 'task'
        },
        {
          id: 'B',
          name: 'Path B',
          start: new Date('2024-10-03'),
          end: new Date('2024-10-08'), // 5 days (longer)
          progress: 0,
          dependencies: ['START'],
          type: 'task'
        },
        {
          id: 'C',
          name: 'Path C',
          start: new Date('2024-10-03'),
          end: new Date('2024-10-06'), // 3 days
          progress: 0,
          dependencies: ['START'],
          type: 'task'
        },
        {
          id: 'END',
          name: 'End',
          start: new Date('2024-10-09'),
          end: new Date('2024-10-10'), // 1 day
          progress: 0,
          dependencies: ['A', 'B', 'C'],
          type: 'task'
        }
      ]

      const schedule = createMockSchedule(tasks)

      // Act
      const result = criticalPathCalculator.calculateCriticalPath(schedule)

      // Assert
      expect(result.path).toEqual(['START', 'B', 'END'])
      expect(result.duration).toBe(7) // 1 + 5 + 1 days
      
      // Path B should be critical (longest path)
      const taskB = result.tasks.find(t => t.id === 'B')
      expect(taskB?.isCritical).toBe(true)
      
      // Paths A and C should have slack
      const taskA = result.tasks.find(t => t.id === 'A')
      const taskC = result.tasks.find(t => t.id === 'C')
      expect(taskA?.isCritical).toBe(false)
      expect(taskC?.isCritical).toBe(false)
      expect(taskA?.totalSlack).toBeGreaterThan(0)
      expect(taskC?.totalSlack).toBeGreaterThan(0)
    })
  })
})
