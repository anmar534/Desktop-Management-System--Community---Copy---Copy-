/**
 * Workflow Automation Service Tests
 * Comprehensive test suite for workflow automation functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { asyncStorage } from '../../src/utils/storage'
import workflowAutomationService from '../../src/services/workflowAutomationService'
import type {
  TenderAlert,
  WorkflowTask,
  TaskAssignmentRule,
  ComplianceCheck,
  ScheduledReport,
  NotificationTemplate,
  TaskStatus,
  TaskPriority,
  TaskType,
  NotificationChannel,
  NotificationType
} from '../../src/types/workflowAutomation'

// Mock the storage module
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    hasItem: vi.fn()
  }
}))

describe('WorkflowAutomationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock implementations
    vi.mocked(asyncStorage.getItem).mockResolvedValue([])
    vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)
    vi.mocked(asyncStorage.removeItem).mockResolvedValue(undefined)
    vi.mocked(asyncStorage.hasItem).mockResolvedValue(false)
  })

  describe('Tender Alert Management', () => {
    const mockAlert = {
      name: 'Construction Alerts',
      nameAr: 'تنبيهات البناء',
      description: 'Alerts for construction projects',
      descriptionAr: 'تنبيهات لمشاريع البناء',
      criteria: {
        keywords: ['construction', 'building'],
        keywordsAr: ['بناء', 'إنشاء'],
        categories: ['construction'],
        organizations: [],
        minValue: 1000000,
        maxValue: 100000000,
        locations: ['Riyadh'],
        excludeKeywords: [],
        excludeKeywordsAr: [],
        minRelevanceScore: 0.8
      },
      isActive: true,
      recipients: [],
      notifications: {
        channels: ['email' as NotificationChannel],
        frequency: {
          immediate: true,
          digest: false,
          digestInterval: 'daily' as const
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'Asia/Riyadh',
          weekendsOnly: false
        },
        escalation: {
          enabled: false,
          levels: []
        },
        templates: {} as Record<NotificationType, string>
      }
    }

    it('should create tender alert successfully', async () => {
      const result = await workflowAutomationService.createTenderAlert(mockAlert)

      expect(result).toMatchObject({
        ...mockAlert,
        id: expect.stringMatching(/^alert_/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        triggerCount: 0
      })
      expect(asyncStorage.setItem).toHaveBeenCalledWith('workflow_tender_alerts', [result])
    })

    it('should get tender alert by id', async () => {
      const mockAlerts = [{
        id: 'alert_123',
        ...mockAlert,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        triggerCount: 0
      }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockAlerts)

      const result = await workflowAutomationService.getTenderAlert('alert_123')

      expect(result).toEqual(mockAlerts[0])
      expect(asyncStorage.getItem).toHaveBeenCalledWith('workflow_tender_alerts', [])
    })

    it('should return null for non-existent alert', async () => {
      const result = await workflowAutomationService.getTenderAlert('non_existent')

      expect(result).toBeNull()
    })

    it('should get all tender alerts', async () => {
      const mockAlerts = [
        { id: 'alert_1', ...mockAlert, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', triggerCount: 0 },
        { id: 'alert_2', ...mockAlert, createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z', triggerCount: 0 }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockAlerts)

      const result = await workflowAutomationService.getTenderAlerts()

      expect(result).toEqual(mockAlerts)
    })

    it('should update tender alert', async () => {
      const mockAlerts = [{
        id: 'alert_123',
        ...mockAlert,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        triggerCount: 0
      }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockAlerts)

      const updates = { isActive: false }
      const result = await workflowAutomationService.updateTenderAlert('alert_123', updates)

      expect(result.isActive).toBe(false)
      expect(result.updatedAt).not.toBe('2024-01-01T00:00:00.000Z')
    })

    it('should throw error when updating non-existent alert', async () => {
      await expect(
        workflowAutomationService.updateTenderAlert('non_existent', { isActive: false })
      ).rejects.toThrow('تنبيه الفرص التجارية غير موجود')
    })

    it('should delete tender alert', async () => {
      const mockAlerts = [{
        id: 'alert_123',
        ...mockAlert,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        triggerCount: 0
      }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockAlerts)

      await workflowAutomationService.deleteTenderAlert('alert_123')

      expect(asyncStorage.setItem).toHaveBeenCalledWith('workflow_tender_alerts', [])
    })

    it('should check tender opportunities', async () => {
      const result = await workflowAutomationService.checkTenderOpportunities()

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        titleAr: expect.any(String),
        organization: expect.any(String),
        value: expect.any(Number),
        relevanceScore: expect.any(Number)
      })
    })

    it('should handle storage errors gracefully', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      await expect(workflowAutomationService.getTenderAlerts()).rejects.toThrow('فشل في استرجاع تنبيهات الفرص التجارية')
    })
  })

  describe('Task Management', () => {
    const mockTask = {
      title: 'Review Tender',
      titleAr: 'مراجعة العطاء',
      description: 'Review the new tender documents',
      descriptionAr: 'مراجعة وثائق العطاء الجديد',
      type: 'tender_review' as TaskType,
      priority: 'high' as TaskPriority,
      status: 'pending' as TaskStatus,
      assignedBy: 'user_123',
      estimatedDuration: 120,
      dependencies: [],
      tags: [],
      attachments: [],
      comments: [],
      metadata: {}
    }

    it('should create task successfully', async () => {
      const result = await workflowAutomationService.createTask(mockTask)

      expect(result).toMatchObject({
        ...mockTask,
        id: expect.stringMatching(/^task_/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    })

    it('should get task by id', async () => {
      const mockTasks = [{
        id: 'task_123',
        ...mockTask,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockTasks)

      const result = await workflowAutomationService.getTask('task_123')

      expect(result).toEqual(mockTasks[0])
    })

    it('should get tasks with filters', async () => {
      const mockTasks = [
        { id: 'task_1', ...mockTask, status: 'pending' as TaskStatus, priority: 'high' as TaskPriority, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'task_2', ...mockTask, status: 'completed' as TaskStatus, priority: 'low' as TaskPriority, createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockTasks)

      const result = await workflowAutomationService.getTasks({ status: ['pending'], priority: ['high'] })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('task_1')
    })

    it('should update task', async () => {
      const mockTasks = [{
        id: 'task_123',
        ...mockTask,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockTasks)

      const updates = { status: 'in_progress' as TaskStatus }
      const result = await workflowAutomationService.updateTask('task_123', updates)

      expect(result.status).toBe('in_progress')
    })

    it('should assign task', async () => {
      const mockTasks = [{
        id: 'task_123',
        ...mockTask,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockTasks)

      const result = await workflowAutomationService.assignTask('task_123', 'user_456')

      expect(result.assignedTo).toBe('user_456')
      expect(result.status).toBe('in_progress')
    })

    it('should complete task', async () => {
      const mockTasks = [{
        id: 'task_123',
        ...mockTask,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockTasks)

      const result = await workflowAutomationService.completeTask('task_123', { notes: 'Task completed successfully' })

      expect(result.status).toBe('completed')
      expect(result.completedAt).toBeDefined()
      expect(result.actualDuration).toBeDefined()
      expect(result.metadata.notes).toBe('Task completed successfully')
    })

    it('should throw error when completing non-existent task', async () => {
      await expect(
        workflowAutomationService.completeTask('non_existent')
      ).rejects.toThrow('المهمة غير موجودة')
    })
  })

  describe('Task Assignment Rules', () => {
    const mockRule = {
      name: 'Auto Assign High Priority',
      nameAr: 'تعيين تلقائي للأولوية العالية',
      description: 'Automatically assign high priority tasks',
      descriptionAr: 'تعيين تلقائي للمهام عالية الأولوية',
      isActive: true,
      priority: 1,
      conditions: [
        {
          field: 'priority',
          operator: 'equals' as const,
          value: 'high'
        }
      ],
      actions: [
        {
          type: 'assign_to_user' as const,
          parameters: { userId: 'senior_user' }
        }
      ]
    }

    it('should create assignment rule', async () => {
      const result = await workflowAutomationService.createAssignmentRule(mockRule)

      expect(result).toMatchObject({
        ...mockRule,
        id: expect.stringMatching(/^rule_/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    })

    it('should get assignment rules', async () => {
      const mockRules = [{
        id: 'rule_123',
        ...mockRule,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockRules)

      const result = await workflowAutomationService.getAssignmentRules()

      expect(result).toEqual(mockRules)
    })

    it('should execute assignment rules', async () => {
      const mockRules = [{
        id: 'rule_123',
        ...mockRule,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }]
      const mockTasks = []
      
      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce(mockRules) // For assignment rules
        .mockResolvedValueOnce(mockTasks) // For tasks

      const testTask = {
        id: 'task_123',
        title: 'Test Task',
        titleAr: 'مهمة اختبار',
        description: 'Test description',
        descriptionAr: 'وصف اختبار',
        type: 'tender_review' as TaskType,
        priority: 'high' as TaskPriority,
        status: 'pending' as TaskStatus,
        assignedBy: 'user_123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        estimatedDuration: 60,
        dependencies: [],
        tags: [],
        attachments: [],
        comments: [],
        metadata: {}
      }

      const result = await workflowAutomationService.executeAssignmentRules(testTask)

      expect(result.assignedTo).toBe('senior_user')
    })
  })

  describe('Analytics', () => {
    it('should get workflow statistics', async () => {
      const mockTasks = [
        { status: 'completed', priority: 'high', type: 'tender_review', dueDate: '2024-01-01T00:00:00.000Z', actualDuration: 120 },
        { status: 'pending', priority: 'medium', type: 'pricing_analysis', dueDate: '2024-12-31T00:00:00.000Z' }
      ]
      const mockAlerts = [{ triggerCount: 5 }, { triggerCount: 3 }]
      const mockReports = [{ generationCount: 2 }]
      const mockNotifications = [{ status: 'sent' }, { status: 'sent' }, { status: 'failed' }]
      const mockComplianceResults = [{ score: 85 }, { score: 92 }]

      vi.mocked(asyncStorage.getItem)
        .mockResolvedValueOnce(mockTasks)
        .mockResolvedValueOnce(mockAlerts)
        .mockResolvedValueOnce(mockReports)
        .mockResolvedValueOnce(mockNotifications)
        .mockResolvedValueOnce(mockComplianceResults)

      const result = await workflowAutomationService.getWorkflowStatistics()

      expect(result).toMatchObject({
        totalTasks: 2,
        completedTasks: 1,
        pendingTasks: 1,
        overdueTasks: 1,
        averageCompletionTime: 120,
        complianceScore: 88.5,
        alertsTriggered: 8,
        reportsGenerated: 2,
        notificationsSent: 2
      })
    })

    it('should get task metrics', async () => {
      const mockTasks = [
        {
          status: 'completed',
          actualDuration: 100,
          estimatedDuration: 120,
          dueDate: '2024-01-01T00:00:00.000Z',
          completedAt: '2023-12-31T00:00:00.000Z', // Completed before due date (on time)
          assignedTo: 'user_1'
        },
        {
          status: 'completed',
          actualDuration: 80,
          estimatedDuration: 90,
          dueDate: '2024-01-01T00:00:00.000Z',
          completedAt: '2024-01-02T00:00:00.000Z', // Completed after due date (late)
          assignedTo: 'user_1'
        }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockTasks)

      const result = await workflowAutomationService.getTaskMetrics()

      expect(result).toMatchObject({
        totalTasks: 2,
        completedTasks: 2,
        averageCompletionTime: 90,
        onTimeCompletion: 50, // 1 out of 2 tasks completed on time = 50%
        taskEfficiency: expect.any(Number),
        assignmentAccuracy: 95
      })
    })

    it('should get compliance metrics', async () => {
      const mockResults = [
        { status: 'passed', score: 90, summary: { criticalIssues: 0 } },
        { status: 'failed', score: 70, summary: { criticalIssues: 2 } }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockResults)

      const result = await workflowAutomationService.getComplianceMetrics()

      expect(result).toMatchObject({
        totalChecks: 2,
        passedChecks: 1,
        failedChecks: 1,
        averageScore: 80,
        criticalIssues: 2
      })
    })

    it('should get notification metrics', async () => {
      const mockNotifications = [
        { status: 'delivered' },
        { status: 'delivered' },
        { status: 'failed' }
      ]
      vi.mocked(asyncStorage.getItem).mockResolvedValue(mockNotifications)

      const result = await workflowAutomationService.getNotificationMetrics()

      expect(result).toMatchObject({
        totalSent: 3,
        deliveryRate: expect.any(Number),
        openRate: 65,
        clickRate: 12,
        bounceRate: 3
      })
    })
  })
})
