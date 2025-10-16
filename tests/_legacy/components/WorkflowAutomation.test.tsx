/**
 * Workflow Automation Component Tests
 * Comprehensive test suite for the WorkflowAutomation React component
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/matchers'

import WorkflowAutomation from '../../../src/components/automation/WorkflowAutomation'
import workflowAutomationService from '../../../src/services/workflowAutomationService'

// Mock the workflow automation service
vi.mock('../../../src/services/workflowAutomationService', () => ({
  default: {
    getWorkflowStatistics: vi.fn(),
    getTaskMetrics: vi.fn(),
    getComplianceMetrics: vi.fn(),
    getNotificationMetrics: vi.fn(),
    getTenderAlerts: vi.fn(),
    getTasks: vi.fn(),
    getAssignmentRules: vi.fn(),
    getComplianceChecks: vi.fn(),
    getScheduledReports: vi.fn(),
    getNotificationTemplates: vi.fn(),
    createTenderAlert: vi.fn(),
    createTask: vi.fn(),
    updateTenderAlert: vi.fn(),
    updateAssignmentRule: vi.fn()
  }
}))

// Mock data
const mockStatistics = {
  totalTasks: 25,
  completedTasks: 18,
  pendingTasks: 5,
  overdueTasks: 2,
  averageCompletionTime: 120,
  tasksByPriority: { critical: 2, high: 8, medium: 10, low: 5 },
  tasksByType: { tender_review: 10, pricing_analysis: 8, compliance_check: 4, document_preparation: 3 },
  tasksByStatus: { pending: 5, in_progress: 2, completed: 18, cancelled: 0, on_hold: 0 },
  complianceScore: 88.5,
  alertsTriggered: 12,
  reportsGenerated: 8,
  notificationsSent: 156
}

const mockTaskMetrics = {
  totalTasks: 25,
  completedTasks: 18,
  averageCompletionTime: 120,
  onTimeCompletion: 85,
  taskEfficiency: 92,
  assignmentAccuracy: 95,
  userProductivity: { user_1: 90, user_2: 85 },
  departmentMetrics: {
    engineering: { totalTasks: 10, completedTasks: 8, averageCompletionTime: 130, efficiency: 85 },
    procurement: { totalTasks: 8, completedTasks: 6, averageCompletionTime: 100, efficiency: 92 }
  }
}

const mockComplianceMetrics = {
  totalChecks: 15,
  passedChecks: 12,
  failedChecks: 3,
  averageScore: 88.5,
  complianceByCategory: { document_completeness: 92, pricing_validation: 88, technical_requirements: 85 },
  criticalIssues: 1,
  trendsOverTime: [
    { date: '2024-01-01', score: 85, totalChecks: 5, passedChecks: 4 },
    { date: '2024-01-08', score: 90, totalChecks: 6, passedChecks: 5 }
  ]
}

const mockNotificationMetrics = {
  totalSent: 156,
  deliveryRate: 95,
  openRate: 65,
  clickRate: 12,
  bounceRate: 3,
  channelPerformance: {
    email: { sent: 100, delivered: 95, failed: 5, deliveryRate: 95 },
    sms: { sent: 30, delivered: 29, failed: 1, deliveryRate: 97 },
    push: { sent: 20, delivered: 18, failed: 2, deliveryRate: 90 },
    in_app: { sent: 5, delivered: 5, failed: 0, deliveryRate: 100 },
    webhook: { sent: 1, delivered: 1, failed: 0, deliveryRate: 100 }
  },
  templatePerformance: {
    tender_alert: { sent: 50, opened: 35, clicked: 8, openRate: 70, clickRate: 16 },
    task_assignment: { sent: 40, opened: 34, clicked: 10, openRate: 85, clickRate: 25 }
  }
}

const mockTenderAlerts = [
  {
    id: 'alert_1',
    name: 'Construction Alerts',
    nameAr: 'تنبيهات البناء',
    description: 'Alerts for construction projects',
    descriptionAr: 'تنبيهات لمشاريع البناء',
    isActive: true,
    triggerCount: 5,
    criteria: { keywords: ['construction'], keywordsAr: [], categories: [], organizations: [], locations: [], excludeKeywords: [], excludeKeywordsAr: [], minRelevanceScore: 0.8 },
    recipients: [],
    notifications: { channels: ['email'], frequency: { immediate: true, digest: false, digestInterval: 'daily' }, quietHours: { enabled: false, startTime: '22:00', endTime: '08:00', timezone: 'Asia/Riyadh', weekendsOnly: false }, escalation: { enabled: false, levels: [] }, templates: {} },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

const mockTasks = [
  {
    id: 'task_1',
    title: 'Review Tender',
    titleAr: 'مراجعة العطاء',
    description: 'Review the new tender documents',
    descriptionAr: 'مراجعة وثائق العطاء الجديد',
    type: 'tender_review',
    priority: 'high',
    status: 'pending',
    assignedTo: 'user_1',
    assignedBy: 'manager_1',
    dueDate: '2024-12-31T00:00:00.000Z',
    estimatedDuration: 120,
    dependencies: [],
    tags: [],
    attachments: [],
    comments: [],
    metadata: {},
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

const mockAssignmentRules = [
  {
    id: 'rule_1',
    name: 'Auto Assign High Priority',
    nameAr: 'تعيين تلقائي للأولوية العالية',
    description: 'Automatically assign high priority tasks',
    descriptionAr: 'تعيين تلقائي للمهام عالية الأولوية',
    isActive: true,
    priority: 1,
    conditions: [],
    actions: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

const mockComplianceChecks = [
  {
    id: 'check_1',
    name: 'Document Completeness',
    nameAr: 'اكتمال الوثائق',
    description: 'Check if all required documents are present',
    descriptionAr: 'فحص وجود جميع الوثائق المطلوبة',
    type: 'document_completeness',
    category: 'documentation',
    categoryAr: 'الوثائق',
    rules: [],
    isActive: true,
    isMandatory: true,
    executionCount: 10,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

const mockScheduledReports = [
  {
    id: 'report_1',
    name: 'Weekly Summary',
    nameAr: 'ملخص أسبوعي',
    description: 'Weekly workflow summary report',
    descriptionAr: 'تقرير ملخص سير العمل الأسبوعي',
    templateId: 'template_1',
    schedule: { type: 'weekly', interval: 1, time: '09:00', timezone: 'Asia/Riyadh', startDate: '2024-01-01', dayOfWeek: 1 },
    parameters: {},
    recipients: [],
    isActive: true,
    generationCount: 4,
    format: ['pdf'],
    deliveryMethod: ['email'],
    nextGeneration: '2024-12-31T09:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

const mockNotificationTemplates = [
  {
    id: 'template_1',
    name: 'Task Assignment',
    nameAr: 'تعيين مهمة',
    type: 'task_assignment',
    channel: 'email',
    subject: 'New Task Assigned',
    subjectAr: 'تم تعيين مهمة جديدة',
    content: 'You have been assigned a new task',
    contentAr: 'تم تعيين مهمة جديدة لك',
    variables: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

describe('WorkflowAutomation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    vi.mocked(workflowAutomationService.getWorkflowStatistics).mockResolvedValue(mockStatistics)
    vi.mocked(workflowAutomationService.getTaskMetrics).mockResolvedValue(mockTaskMetrics)
    vi.mocked(workflowAutomationService.getComplianceMetrics).mockResolvedValue(mockComplianceMetrics)
    vi.mocked(workflowAutomationService.getNotificationMetrics).mockResolvedValue(mockNotificationMetrics)
    vi.mocked(workflowAutomationService.getTenderAlerts).mockResolvedValue(mockTenderAlerts)
    vi.mocked(workflowAutomationService.getTasks).mockResolvedValue(mockTasks)
    vi.mocked(workflowAutomationService.getAssignmentRules).mockResolvedValue(mockAssignmentRules)
    vi.mocked(workflowAutomationService.getComplianceChecks).mockResolvedValue(mockComplianceChecks)
    vi.mocked(workflowAutomationService.getScheduledReports).mockResolvedValue(mockScheduledReports)
    vi.mocked(workflowAutomationService.getNotificationTemplates).mockResolvedValue(mockNotificationTemplates)
  })

  describe('Component Rendering', () => {
    it('should render workflow automation component', async () => {
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('أتمتة سير العمل')).toBeInTheDocument()
        expect(screen.getByText('إدارة وأتمتة العمليات والمهام التلقائية')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      render(<WorkflowAutomation />)
      
      expect(screen.getByText('جاري تحميل بيانات سير العمل...')).toBeInTheDocument()
    })

    it('should display statistics after loading', async () => {
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument() // Total tasks
        expect(screen.getByText('89%')).toBeInTheDocument() // Compliance score
        expect(screen.getByText('12')).toBeInTheDocument() // Alerts triggered
        expect(screen.getByText('156')).toBeInTheDocument() // Notifications sent
      })
    })

    it('should render all tab triggers', async () => {
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('نظرة عامة')).toBeInTheDocument()
        expect(screen.getByText('تنبيهات الفرص')).toBeInTheDocument()
        expect(screen.getByText('إدارة المهام')).toBeInTheDocument()
        expect(screen.getByText('فحص الامتثال')).toBeInTheDocument()
        expect(screen.getByText('التقارير المجدولة')).toBeInTheDocument()
        expect(screen.getByText('الإشعارات')).toBeInTheDocument()
      })
    })
  })

  describe('Overview Tab', () => {
    it('should display workflow statistics', async () => {
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('إجمالي المهام')).toBeInTheDocument()
        expect(screen.getByText('نقاط الامتثال')).toBeInTheDocument()
        expect(screen.getByText('التنبيهات المفعلة')).toBeInTheDocument()
        expect(screen.getByText('الإشعارات المرسلة')).toBeInTheDocument()
      })
    })

    it('should display task metrics', async () => {
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('توزيع حالة المهام')).toBeInTheDocument()
        expect(screen.getByText('85%')).toBeInTheDocument() // On-time completion
        expect(screen.getByText('92%')).toBeInTheDocument() // Task efficiency
      })
    })

    it('should display recent tasks', async () => {
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('المهام الحديثة')).toBeInTheDocument()
        expect(screen.getByText('مراجعة العطاء')).toBeInTheDocument()
        expect(screen.getByText('مراجعة وثائق العطاء الجديد')).toBeInTheDocument()
      })
    })
  })

  describe('Tender Alerts Tab', () => {
    it('should switch to alerts tab', async () => {
      const user = userEvent.setup()
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('تنبيهات الفرص')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('تنبيهات الفرص'))
      
      await waitFor(() => {
        expect(screen.getByText('إنشاء تنبيه جديد')).toBeInTheDocument()
        expect(screen.getByText('التنبيهات الحالية')).toBeInTheDocument()
      })
    })

    it('should display existing alerts', async () => {
      const user = userEvent.setup()
      render(<WorkflowAutomation />)
      
      await user.click(screen.getByText('تنبيهات الفرص'))
      
      await waitFor(() => {
        expect(screen.getByText('تنبيهات البناء')).toBeInTheDocument()
        expect(screen.getByText('تنبيهات لمشاريع البناء')).toBeInTheDocument()
        expect(screen.getByText('تم التفعيل 5 مرة')).toBeInTheDocument()
      })
    })

    it('should create new alert', async () => {
      const user = userEvent.setup()
      const mockCreatedAlert = { ...mockTenderAlerts[0], id: 'alert_new' }
      vi.mocked(workflowAutomationService.createTenderAlert).mockResolvedValue(mockCreatedAlert)
      
      render(<WorkflowAutomation />)
      
      await user.click(screen.getByText('تنبيهات الفرص'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('اسم التنبيه')).toBeInTheDocument()
      })
      
      await user.type(screen.getByLabelText('اسم التنبيه'), 'New Alert')
      await user.type(screen.getByLabelText('الاسم بالعربية'), 'تنبيه جديد')
      await user.click(screen.getByText('إنشاء التنبيه'))
      
      await waitFor(() => {
        expect(workflowAutomationService.createTenderAlert).toHaveBeenCalled()
      })
    })

    it('should toggle alert status', async () => {
      const user = userEvent.setup()
      vi.mocked(workflowAutomationService.updateTenderAlert).mockResolvedValue({ ...mockTenderAlerts[0], isActive: false })
      
      render(<WorkflowAutomation />)
      
      await user.click(screen.getByText('تنبيهات الفرص'))
      
      await waitFor(() => {
        expect(screen.getByText('إيقاف')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('إيقاف'))
      
      await waitFor(() => {
        expect(workflowAutomationService.updateTenderAlert).toHaveBeenCalledWith('alert_1', { isActive: false })
      })
    })
  })

  describe('Tasks Tab', () => {
    it('should switch to tasks tab', async () => {
      const user = userEvent.setup()
      render(<WorkflowAutomation />)
      
      await user.click(screen.getByText('إدارة المهام'))
      
      await waitFor(() => {
        expect(screen.getByText('إنشاء مهمة جديدة')).toBeInTheDocument()
        expect(screen.getByText('قواعد تعيين المهام')).toBeInTheDocument()
      })
    })

    it('should create new task', async () => {
      const user = userEvent.setup()
      const mockCreatedTask = { ...mockTasks[0], id: 'task_new' }
      vi.mocked(workflowAutomationService.createTask).mockResolvedValue(mockCreatedTask)
      
      render(<WorkflowAutomation />)
      
      await user.click(screen.getByText('إدارة المهام'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('عنوان المهمة')).toBeInTheDocument()
      })
      
      await user.type(screen.getByLabelText('عنوان المهمة'), 'New Task')
      await user.type(screen.getByLabelText('العنوان بالعربية'), 'مهمة جديدة')
      await user.click(screen.getByText('إنشاء المهمة'))
      
      await waitFor(() => {
        expect(workflowAutomationService.createTask).toHaveBeenCalled()
      })
    })

    it('should display assignment rules', async () => {
      const user = userEvent.setup()
      render(<WorkflowAutomation />)
      
      await user.click(screen.getByText('إدارة المهام'))
      
      await waitFor(() => {
        expect(screen.getByText('تعيين تلقائي للأولوية العالية')).toBeInTheDocument()
        expect(screen.getByText('تعيين تلقائي للمهام عالية الأولوية')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      vi.mocked(workflowAutomationService.getWorkflowStatistics).mockRejectedValue(new Error('Network error'))
      
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })

    it('should handle create alert error', async () => {
      const user = userEvent.setup()
      vi.mocked(workflowAutomationService.createTenderAlert).mockRejectedValue(new Error('Creation failed'))
      
      render(<WorkflowAutomation />)
      
      await user.click(screen.getByText('تنبيهات الفرص'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('اسم التنبيه')).toBeInTheDocument()
      })
      
      await user.type(screen.getByLabelText('اسم التنبيه'), 'Test Alert')
      await user.click(screen.getByText('إنشاء التنبيه'))
      
      await waitFor(() => {
        expect(screen.getByText(/Creation failed/)).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should refresh data when refresh button is clicked', async () => {
      const user = userEvent.setup()
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('تحديث البيانات')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('تحديث البيانات'))
      
      await waitFor(() => {
        expect(workflowAutomationService.getWorkflowStatistics).toHaveBeenCalledTimes(2)
      })
    })

    it('should call callback when task is created', async () => {
      const onTaskCreated = vi.fn()
      const user = userEvent.setup()
      const mockCreatedTask = { ...mockTasks[0], id: 'task_new' }
      vi.mocked(workflowAutomationService.createTask).mockResolvedValue(mockCreatedTask)
      
      render(<WorkflowAutomation onTaskCreated={onTaskCreated} />)
      
      await user.click(screen.getByText('إدارة المهام'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('عنوان المهمة')).toBeInTheDocument()
      })
      
      await user.type(screen.getByLabelText('عنوان المهمة'), 'New Task')
      await user.click(screen.getByText('إنشاء المهمة'))
      
      await waitFor(() => {
        expect(onTaskCreated).toHaveBeenCalledWith(mockCreatedTask)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('أتمتة سير العمل')).toBeInTheDocument()
      })
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('أتمتة سير العمل')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<WorkflowAutomation />)
      
      await waitFor(() => {
        expect(screen.getByText('تنبيهات الفرص')).toBeInTheDocument()
      })
      
      // Tab navigation should work
      await user.tab()
      await user.tab()
      
      // Should be able to activate tabs with keyboard
      const alertsTab = screen.getByText('تنبيهات الفرص')
      alertsTab.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('إنشاء تنبيه جديد')).toBeInTheDocument()
      })
    })
  })
})
