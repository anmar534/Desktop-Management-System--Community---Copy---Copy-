/**
 * GanttChart Component Tests
 * اختبارات مكون مخطط جانت
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GanttChart } from '../../../src/components/scheduling/GanttChart'
import type { ProjectSchedule, GanttTask } from '../../../src/types/scheduling'

// Mock dependencies
vi.mock('../../../src/services/schedulingService', () => ({
  schedulingService: {
    getSchedule: vi.fn(),
    calculateCriticalPath: vi.fn(),
    updateTaskSchedule: vi.fn(),
    exportSchedule: vi.fn()
  }
}))

vi.mock('gantt-task-react', () => ({
  Gantt: ({ tasks, onDateChange, onProgressChange, onSelect }: any) => (
    <div data-testid="gantt-chart">
      {tasks.map((task: any) => (
        <div
          key={task.id}
          data-testid={`task-${task.id}`}
          onClick={() => onSelect?.(task, true)}
        >
          <span>{task.name}</span>
          <button
            data-testid={`update-${task.id}`}
            onClick={() => onDateChange?.({ ...task, progress: 50 })}
          >
            Update
          </button>
        </div>
      ))}
    </div>
  ),
  ViewMode: {
    Day: 'Day',
    Week: 'Week',
    Month: 'Month'
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockTasks: GanttTask[] = [
  {
    id: 'task-1',
    name: 'مهمة التصميم',
    nameEn: 'Design Task',
    start: new Date('2024-10-01'),
    end: new Date('2024-10-05'),
    progress: 30,
    dependencies: [],
    type: 'task',
    critical: false
  },
  {
    id: 'task-2',
    name: 'مهمة التطوير',
    nameEn: 'Development Task',
    start: new Date('2024-10-06'),
    end: new Date('2024-10-15'),
    progress: 0,
    dependencies: ['task-1'],
    type: 'task',
    critical: true
  },
  {
    id: 'milestone-1',
    name: 'معلم مهم',
    nameEn: 'Important Milestone',
    start: new Date('2024-10-16'),
    end: new Date('2024-10-16'),
    progress: 0,
    dependencies: ['task-2'],
    type: 'milestone',
    critical: true
  }
]

const mockSchedule: ProjectSchedule = {
  id: 'schedule-1',
  projectId: 'project-1',
  name: 'جدولة المشروع التجريبي',
  nameEn: 'Test Project Schedule',
  startDate: new Date('2024-10-01'),
  endDate: new Date('2024-10-16'),
  tasks: mockTasks,
  milestones: [
    {
      id: 'milestone-1',
      name: 'معلم مهم',
      nameEn: 'Important Milestone',
      date: new Date('2024-10-16'),
      type: 'deliverable',
      status: 'pending',
      dependencies: ['task-2']
    }
  ],
  criticalPath: ['task-2', 'milestone-1'],
  totalDuration: 15,
  workingDays: [1, 2, 3, 4, 5],
  holidays: [],
  createdAt: '2024-10-01T08:00:00Z',
  updatedAt: '2024-10-01T08:00:00Z',
  version: 1
}

const mockCriticalPath = {
  path: ['task-2', 'milestone-1'],
  duration: 10,
  slack: 0,
  tasks: [],
  bottlenecks: []
}

describe('GanttChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with provided schedule', () => {
      // Act
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Assert
      expect(screen.getByTestId('gantt-chart')).toBeInTheDocument()
      expect(screen.getByText('مخطط جانت - جدولة المشروع التجريبي')).toBeInTheDocument()
      expect(screen.getByText('المدة: 15 يوم')).toBeInTheDocument()
      expect(screen.getByText('المهام: 3')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      // Arrange
      const { schedulingService } = require('../../../src/services/schedulingService')
      schedulingService.getSchedule.mockImplementation(() => new Promise(() => {})) // Never resolves

      // Act
      render(<GanttChart projectId="project-1" />)

      // Assert
      expect(screen.getByText('جاري تحميل الجدولة الزمنية...')).toBeInTheDocument()
    })

    it('should show empty state when no schedule exists', async () => {
      // Arrange
      const { schedulingService } = require('../../../src/services/schedulingService')
      schedulingService.getSchedule.mockResolvedValue(null)

      // Act
      render(<GanttChart projectId="project-1" />)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('لا توجد جدولة زمنية للمشروع')).toBeInTheDocument()
        expect(screen.getByText('إنشاء جدولة جديدة')).toBeInTheDocument()
      })
    })

    it('should render all tasks in gantt chart', () => {
      // Act
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Assert
      expect(screen.getByTestId('task-task-1')).toBeInTheDocument()
      expect(screen.getByTestId('task-task-2')).toBeInTheDocument()
      expect(screen.getByTestId('task-milestone-1')).toBeInTheDocument()
      expect(screen.getByText('مهمة التصميم')).toBeInTheDocument()
      expect(screen.getByText('مهمة التطوير')).toBeInTheDocument()
      expect(screen.getByText('معلم مهم')).toBeInTheDocument()
    })
  })

  describe('Task Interaction', () => {
    it('should handle task selection', async () => {
      // Arrange
      const onTaskSelect = vi.fn()
      render(
        <GanttChart 
          projectId="project-1" 
          schedule={mockSchedule} 
          onTaskSelect={onTaskSelect}
        />
      )

      // Act
      fireEvent.click(screen.getByTestId('task-task-1'))

      // Assert
      await waitFor(() => {
        expect(onTaskSelect).toHaveBeenCalledWith('task-1', expect.any(Object))
      })
      
      // Should show task details
      expect(screen.getByText('تفاصيل المهمة')).toBeInTheDocument()
      expect(screen.getByText('مهمة التصميم')).toBeInTheDocument()
    })

    it('should handle task updates', async () => {
      // Arrange
      const { schedulingService } = require('../../../src/services/schedulingService')
      const { toast } = require('sonner')
      const onTaskUpdate = vi.fn()
      
      schedulingService.updateTaskSchedule.mockResolvedValue({})
      
      render(
        <GanttChart 
          projectId="project-1" 
          schedule={mockSchedule} 
          onTaskUpdate={onTaskUpdate}
        />
      )

      // Act
      fireEvent.click(screen.getByTestId('update-task-1'))

      // Assert
      await waitFor(() => {
        expect(schedulingService.updateTaskSchedule).toHaveBeenCalledWith(
          'project-1',
          'task-1',
          expect.objectContaining({ progress: 50 })
        )
        expect(onTaskUpdate).toHaveBeenCalledWith('task-1', expect.any(Object))
        expect(toast.success).toHaveBeenCalledWith('تم تحديث المهمة بنجاح')
      })
    })

    it('should handle task update errors', async () => {
      // Arrange
      const { schedulingService } = require('../../../src/services/schedulingService')
      const { toast } = require('sonner')
      
      schedulingService.updateTaskSchedule.mockRejectedValue(new Error('Update failed'))
      
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Act
      fireEvent.click(screen.getByTestId('update-task-1'))

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('فشل في تحديث المهمة')
      })
    })
  })

  describe('View Mode Controls', () => {
    it('should change view mode when buttons are clicked', () => {
      // Act
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Assert - Default should be Day view
      expect(screen.getByRole('button', { name: 'يوم' })).toHaveClass('bg-primary')

      // Act - Click Week view
      fireEvent.click(screen.getByRole('button', { name: 'أسبوع' }))

      // Assert
      expect(screen.getByRole('button', { name: 'أسبوع' })).toHaveClass('bg-primary')
    })

    it('should show all view mode options', () => {
      // Act
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Assert
      expect(screen.getByRole('button', { name: 'يوم' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'أسبوع' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'شهر' })).toBeInTheDocument()
    })
  })

  describe('Export Functionality', () => {
    it('should export to PDF', async () => {
      // Arrange
      const { schedulingService } = require('../../../src/services/schedulingService')
      const { toast } = require('sonner')
      
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      schedulingService.exportSchedule.mockResolvedValue(mockBlob)
      
      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      global.URL.revokeObjectURL = vi.fn()
      
      // Mock createElement and click
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)

      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Act
      fireEvent.click(screen.getByText('تصدير PDF'))

      // Assert
      await waitFor(() => {
        expect(schedulingService.exportSchedule).toHaveBeenCalledWith(
          'project-1',
          expect.objectContaining({
            format: 'pdf',
            options: expect.any(Object)
          })
        )
        expect(mockAnchor.download).toBe('schedule_project-1.pdf')
        expect(mockAnchor.click).toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith('تم تصدير الجدولة بنجاح')
      })
    })

    it('should export to Excel', async () => {
      // Arrange
      const { schedulingService } = require('../../../src/services/schedulingService')
      
      const mockBlob = new Blob(['excel content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      schedulingService.exportSchedule.mockResolvedValue(mockBlob)
      
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      const mockAnchor = { href: '', download: '', click: vi.fn() }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)

      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Act
      fireEvent.click(screen.getByText('تصدير Excel'))

      // Assert
      await waitFor(() => {
        expect(schedulingService.exportSchedule).toHaveBeenCalledWith(
          'project-1',
          expect.objectContaining({ format: 'excel' })
        )
        expect(mockAnchor.download).toBe('schedule_project-1.excel')
      })
    })

    it('should handle export errors', async () => {
      // Arrange
      const { schedulingService } = require('../../../src/services/schedulingService')
      const { toast } = require('sonner')
      
      schedulingService.exportSchedule.mockRejectedValue(new Error('Export failed'))
      
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Act
      fireEvent.click(screen.getByText('تصدير PDF'))

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('فشل في تصدير الجدولة')
      })
    })
  })

  describe('Critical Path Display', () => {
    it('should load and display critical path information', async () => {
      // Arrange
      const { schedulingService } = require('../../../src/services/schedulingService')
      schedulingService.calculateCriticalPath.mockResolvedValue(mockCriticalPath)

      // Act
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('المسار الحرج: 2 مهمة')).toBeInTheDocument()
      })
    })

    it('should handle critical path calculation errors gracefully', async () => {
      // Arrange
      const { schedulingService } = require('../../../src/services/schedulingService')
      schedulingService.calculateCriticalPath.mockRejectedValue(new Error('Critical path failed'))

      // Act
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Assert - Should not crash and should still render the chart
      await waitFor(() => {
        expect(screen.getByTestId('gantt-chart')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Act
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Assert
      expect(screen.getByRole('button', { name: 'يوم' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'تصدير PDF' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'تصدير Excel' })).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      // Act
      render(<GanttChart projectId="project-1" schedule={mockSchedule} />)

      // Assert - All interactive elements should be focusable
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })
})
