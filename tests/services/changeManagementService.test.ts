/**
 * Change Management Service Tests
 * اختبارات خدمة إدارة التغييرات
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { changeManagementService } from '../../src/services/changeManagementService'
import type { ChangeRequest, ChangeOrder, ChangeImpact } from '../../src/types/change'

// Mock asyncStorage
const mockStorage = new Map()
vi.mock('../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn((key: string, defaultValue: any) => {
      return Promise.resolve(mockStorage.get(key) || defaultValue)
    }),
    setItem: vi.fn((key: string, value: any) => {
      mockStorage.set(key, value)
      return Promise.resolve()
    }),
    removeItem: vi.fn((key: string) => {
      mockStorage.delete(key)
      return Promise.resolve()
    }),
    clear: vi.fn(() => {
      mockStorage.clear()
      return Promise.resolve()
    })
  }
}))

describe('ChangeManagementService', () => {
  beforeEach(() => {
    mockStorage.clear()
    vi.clearAllMocks()
  })

  describe('Change Request Operations', () => {
    it('should create a new change request', async () => {
      const requestData = {
        projectId: 'project_1',
        title: 'Test Change Request',
        titleAr: 'طلب تغيير اختبار',
        description: 'Test change request description',
        descriptionAr: 'وصف طلب تغيير الاختبار',
        type: 'scope_change' as const,
        priority: 'high' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        reason: 'Client requirement change',
        reasonAr: 'تغيير متطلبات العميل',
        estimatedCost: 5000,
        estimatedDuration: 10,
        urgency: 'urgent' as const,
        status: 'draft' as const,
        documents: []
      }

      const request = await changeManagementService.createChangeRequest(requestData)

      expect(request).toBeDefined()
      expect(request.id).toBeDefined()
      expect(request.title).toBe(requestData.title)
      expect(request.titleAr).toBe(requestData.titleAr)
      expect(request.projectId).toBe(requestData.projectId)
      expect(request.type).toBe(requestData.type)
      expect(request.priority).toBe(requestData.priority)
      expect(request.status).toBe(requestData.status)
      expect(request.createdAt).toBeDefined()
      expect(request.updatedAt).toBeDefined()
    })

    it('should retrieve a change request by ID', async () => {
      const requestData = {
        projectId: 'project_1',
        title: 'Test Change Request',
        titleAr: 'طلب تغيير اختبار',
        description: 'Test change request description',
        descriptionAr: 'وصف طلب تغيير الاختبار',
        type: 'scope_change' as const,
        priority: 'high' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        reason: 'Client requirement change',
        reasonAr: 'تغيير متطلبات العميل',
        urgency: 'urgent' as const,
        status: 'draft' as const,
        documents: []
      }

      const createdRequest = await changeManagementService.createChangeRequest(requestData)
      const retrievedRequest = await changeManagementService.getChangeRequest(createdRequest.id)

      expect(retrievedRequest).toBeDefined()
      expect(retrievedRequest!.id).toBe(createdRequest.id)
      expect(retrievedRequest!.title).toBe(createdRequest.title)
    })

    it('should return null for non-existent change request', async () => {
      const request = await changeManagementService.getChangeRequest('non_existent_id')
      expect(request).toBeNull()
    })

    it('should update a change request', async () => {
      const requestData = {
        projectId: 'project_1',
        title: 'Test Change Request',
        titleAr: 'طلب تغيير اختبار',
        description: 'Test change request description',
        descriptionAr: 'وصف طلب تغيير الاختبار',
        type: 'scope_change' as const,
        priority: 'high' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        reason: 'Client requirement change',
        reasonAr: 'تغيير متطلبات العميل',
        urgency: 'urgent' as const,
        status: 'draft' as const,
        documents: []
      }

      const createdRequest = await changeManagementService.createChangeRequest(requestData)
      const updates = {
        title: 'Updated Change Request',
        priority: 'medium' as const,
        status: 'submitted' as const
      }

      const updatedRequest = await changeManagementService.updateChangeRequest(createdRequest.id, updates)

      expect(updatedRequest.title).toBe(updates.title)
      expect(updatedRequest.priority).toBe(updates.priority)
      expect(updatedRequest.status).toBe(updates.status)
      expect(new Date(updatedRequest.updatedAt).getTime()).toBeGreaterThan(new Date(createdRequest.updatedAt).getTime())
    })

    it('should delete a change request', async () => {
      const requestData = {
        projectId: 'project_1',
        title: 'Test Change Request',
        titleAr: 'طلب تغيير اختبار',
        description: 'Test change request description',
        descriptionAr: 'وصف طلب تغيير الاختبار',
        type: 'scope_change' as const,
        priority: 'high' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        reason: 'Client requirement change',
        reasonAr: 'تغيير متطلبات العميل',
        urgency: 'urgent' as const,
        status: 'draft' as const,
        documents: []
      }

      const createdRequest = await changeManagementService.createChangeRequest(requestData)
      await changeManagementService.deleteChangeRequest(createdRequest.id)

      const retrievedRequest = await changeManagementService.getChangeRequest(createdRequest.id)
      expect(retrievedRequest).toBeNull()
    })

    it('should convert change request to change order', async () => {
      const requestData = {
        projectId: 'project_1',
        title: 'Test Change Request',
        titleAr: 'طلب تغيير اختبار',
        description: 'Test change request description',
        descriptionAr: 'وصف طلب تغيير الاختبار',
        type: 'scope_change' as const,
        priority: 'high' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        reason: 'Client requirement change',
        reasonAr: 'تغيير متطلبات العميل',
        estimatedCost: 5000,
        estimatedDuration: 10,
        urgency: 'urgent' as const,
        status: 'submitted' as const,
        documents: []
      }

      const createdRequest = await changeManagementService.createChangeRequest(requestData)
      const changeOrder = await changeManagementService.convertRequestToOrder(createdRequest.id)

      expect(changeOrder).toBeDefined()
      expect(changeOrder.id).toBeDefined()
      expect(changeOrder.number).toBeDefined()
      expect(changeOrder.title).toBe(createdRequest.title)
      expect(changeOrder.titleAr).toBe(createdRequest.titleAr)
      expect(changeOrder.projectId).toBe(createdRequest.projectId)
      expect(changeOrder.type).toBe(createdRequest.type)
      expect(changeOrder.priority).toBe(createdRequest.priority)
      expect(changeOrder.status).toBe('draft')
      expect(changeOrder.totalCostImpact).toBe(createdRequest.estimatedCost)
      expect(changeOrder.totalScheduleImpact).toBe(createdRequest.estimatedDuration)
      expect(changeOrder.approvalWorkflow).toBeDefined()
      expect(changeOrder.approvalWorkflow.length).toBeGreaterThan(0)

      // Verify request status is updated
      const updatedRequest = await changeManagementService.getChangeRequest(createdRequest.id)
      expect(updatedRequest!.status).toBe('converted_to_order')
    })
  })

  describe('Change Order Operations', () => {
    it('should create a new change order', async () => {
      const orderData = {
        projectId: 'project_1',
        title: 'Test Change Order',
        titleAr: 'أمر تغيير اختبار',
        description: 'Test change order description',
        descriptionAr: 'وصف أمر تغيير الاختبار',
        type: 'design_change' as const,
        priority: 'medium' as const,
        status: 'draft' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        requestReason: 'Design improvement',
        requestReasonAr: 'تحسين التصميم',
        impacts: [],
        totalCostImpact: 3000,
        totalScheduleImpact: 5,
        approvalWorkflow: [],
        documents: [],
        comments: []
      }

      const order = await changeManagementService.createChangeOrder(orderData)

      expect(order).toBeDefined()
      expect(order.id).toBeDefined()
      expect(order.number).toBeDefined()
      expect(order.title).toBe(orderData.title)
      expect(order.titleAr).toBe(orderData.titleAr)
      expect(order.projectId).toBe(orderData.projectId)
      expect(order.type).toBe(orderData.type)
      expect(order.priority).toBe(orderData.priority)
      expect(order.status).toBe(orderData.status)
      expect(order.version).toBe(1)
      expect(order.createdAt).toBeDefined()
      expect(order.updatedAt).toBeDefined()
    })

    it('should submit change order for approval', async () => {
      const orderData = {
        projectId: 'project_1',
        title: 'Test Change Order',
        titleAr: 'أمر تغيير اختبار',
        description: 'Test change order description',
        descriptionAr: 'وصف أمر تغيير الاختبار',
        type: 'design_change' as const,
        priority: 'medium' as const,
        status: 'draft' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        requestReason: 'Design improvement',
        requestReasonAr: 'تحسين التصميم',
        impacts: [],
        totalCostImpact: 3000,
        totalScheduleImpact: 5,
        approvalWorkflow: [],
        documents: [],
        comments: []
      }

      const createdOrder = await changeManagementService.createChangeOrder(orderData)
      const submittedOrder = await changeManagementService.submitForApproval(createdOrder.id)

      expect(submittedOrder.status).toBe('submitted')
      expect(submittedOrder.currentApprovalStep).toBe(0)
    })

    it('should approve change order', async () => {
      const orderData = {
        projectId: 'project_1',
        title: 'Test Change Order',
        titleAr: 'أمر تغيير اختبار',
        description: 'Test change order description',
        descriptionAr: 'وصف أمر تغيير الاختبار',
        type: 'design_change' as const,
        priority: 'medium' as const,
        status: 'draft' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        requestReason: 'Design improvement',
        requestReasonAr: 'تحسين التصميم',
        impacts: [],
        totalCostImpact: 3000,
        totalScheduleImpact: 5,
        approvalWorkflow: [
          {
            id: 'step_1',
            stepNumber: 1,
            name: 'Technical Review',
            nameAr: 'المراجعة التقنية',
            approverRole: 'Technical Manager',
            approverRoleAr: 'المدير التقني',
            status: 'pending' as const,
            requiredDocuments: [],
            conditions: []
          }
        ],
        documents: [],
        comments: []
      }

      const createdOrder = await changeManagementService.createChangeOrder(orderData)
      const submittedOrder = await changeManagementService.submitForApproval(createdOrder.id)
      const approvedOrder = await changeManagementService.approveChangeOrder(
        submittedOrder.id,
        'step_1',
        'approver_1',
        'Approved with conditions'
      )

      expect(approvedOrder.status).toBe('approved')
      expect(approvedOrder.approvalWorkflow[0].status).toBe('approved')
      expect(approvedOrder.approvalWorkflow[0].approverId).toBe('approver_1')
      expect(approvedOrder.approvalWorkflow[0].comments).toBe('Approved with conditions')
      expect(approvedOrder.approvalWorkflow[0].approvedAt).toBeDefined()
    })

    it('should reject change order', async () => {
      const orderData = {
        projectId: 'project_1',
        title: 'Test Change Order',
        titleAr: 'أمر تغيير اختبار',
        description: 'Test change order description',
        descriptionAr: 'وصف أمر تغيير الاختبار',
        type: 'design_change' as const,
        priority: 'medium' as const,
        status: 'draft' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        requestReason: 'Design improvement',
        requestReasonAr: 'تحسين التصميم',
        impacts: [],
        totalCostImpact: 3000,
        totalScheduleImpact: 5,
        approvalWorkflow: [
          {
            id: 'step_1',
            stepNumber: 1,
            name: 'Technical Review',
            nameAr: 'المراجعة التقنية',
            approverRole: 'Technical Manager',
            approverRoleAr: 'المدير التقني',
            status: 'pending' as const,
            requiredDocuments: [],
            conditions: []
          }
        ],
        documents: [],
        comments: []
      }

      const createdOrder = await changeManagementService.createChangeOrder(orderData)
      const submittedOrder = await changeManagementService.submitForApproval(createdOrder.id)
      const rejectedOrder = await changeManagementService.rejectChangeOrder(
        submittedOrder.id,
        'step_1',
        'approver_1',
        'Insufficient technical details'
      )

      expect(rejectedOrder.status).toBe('rejected')
      expect(rejectedOrder.approvalWorkflow[0].status).toBe('rejected')
      expect(rejectedOrder.approvalWorkflow[0].approverId).toBe('approver_1')
      expect(rejectedOrder.approvalWorkflow[0].comments).toBe('Insufficient technical details')
    })
  })

  describe('Impact Assessment', () => {
    it('should assess change impact', async () => {
      const orderData = {
        projectId: 'project_1',
        title: 'Test Change Order',
        titleAr: 'أمر تغيير اختبار',
        description: 'Test change order description',
        descriptionAr: 'وصف أمر تغيير الاختبار',
        type: 'design_change' as const,
        priority: 'medium' as const,
        status: 'draft' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        requestReason: 'Design improvement',
        requestReasonAr: 'تحسين التصميم',
        impacts: [],
        totalCostImpact: 0,
        totalScheduleImpact: 0,
        approvalWorkflow: [],
        documents: [],
        comments: []
      }

      const createdOrder = await changeManagementService.createChangeOrder(orderData)

      const impacts: ChangeImpact[] = [
        {
          id: 'impact_1',
          category: 'cost',
          categoryAr: 'التكلفة',
          description: 'Additional material costs',
          descriptionAr: 'تكاليف مواد إضافية',
          severity: 'medium',
          estimatedCost: 2000,
          estimatedDuration: 3,
          affectedAreas: ['Construction', 'Procurement']
        },
        {
          id: 'impact_2',
          category: 'schedule',
          categoryAr: 'الجدولة',
          description: 'Delay in completion',
          descriptionAr: 'تأخير في الإنجاز',
          severity: 'high',
          estimatedCost: 1000,
          estimatedDuration: 7,
          affectedAreas: ['Construction']
        }
      ]

      const assessedOrder = await changeManagementService.assessImpact(createdOrder.id, impacts)

      expect(assessedOrder.impacts).toEqual(impacts)
      expect(assessedOrder.totalCostImpact).toBe(3000) // 2000 + 1000
      expect(assessedOrder.totalScheduleImpact).toBe(10) // 3 + 7
    })

    it('should calculate total impact correctly', () => {
      const impacts: ChangeImpact[] = [
        {
          id: 'impact_1',
          category: 'cost',
          categoryAr: 'التكلفة',
          description: 'Cost impact 1',
          descriptionAr: 'تأثير التكلفة 1',
          severity: 'medium',
          estimatedCost: 1500,
          estimatedDuration: 5,
          affectedAreas: ['Area 1']
        },
        {
          id: 'impact_2',
          category: 'schedule',
          categoryAr: 'الجدولة',
          description: 'Schedule impact 1',
          descriptionAr: 'تأثير الجدولة 1',
          severity: 'high',
          estimatedCost: 2500,
          estimatedDuration: 8,
          affectedAreas: ['Area 2']
        }
      ]

      const totalImpact = changeManagementService.calculateTotalImpact(impacts)

      expect(totalImpact.costImpact).toBe(4000)
      expect(totalImpact.scheduleImpact).toBe(13)
    })
  })

  describe('Implementation', () => {
    let testOrder: ChangeOrder

    beforeEach(async () => {
      const orderData = {
        projectId: 'project_1',
        title: 'Test Change Order',
        titleAr: 'أمر تغيير اختبار',
        description: 'Test change order description',
        descriptionAr: 'وصف أمر تغيير الاختبار',
        type: 'design_change' as const,
        priority: 'medium' as const,
        status: 'approved' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        requestReason: 'Design improvement',
        requestReasonAr: 'تحسين التصميم',
        impacts: [],
        totalCostImpact: 3000,
        totalScheduleImpact: 5,
        approvalWorkflow: [],
        documents: [],
        comments: []
      }
      testOrder = await changeManagementService.createChangeOrder(orderData)
    })

    it('should start implementation', async () => {
      const implementedOrder = await changeManagementService.startImplementation(
        testOrder.id,
        'implementer_1',
        'Implementation plan details'
      )

      expect(implementedOrder.status).toBe('implementing')
      expect(implementedOrder.implementedBy).toBe('implementer_1')
      expect(implementedOrder.implementationPlan).toBe('Implementation plan details')
      expect(implementedOrder.implementationStartDate).toBeDefined()
    })

    it('should complete implementation', async () => {
      const startedOrder = await changeManagementService.startImplementation(
        testOrder.id,
        'implementer_1'
      )

      const completedOrder = await changeManagementService.completeImplementation(
        startedOrder.id,
        2800,
        'Implementation completed successfully'
      )

      expect(completedOrder.status).toBe('completed')
      expect(completedOrder.actualCost).toBe(2800)
      expect(completedOrder.implementationEndDate).toBeDefined()
    })
  })

  describe('Comments and Documents', () => {
    let testOrder: ChangeOrder

    beforeEach(async () => {
      const orderData = {
        projectId: 'project_1',
        title: 'Test Change Order',
        titleAr: 'أمر تغيير اختبار',
        description: 'Test change order description',
        descriptionAr: 'وصف أمر تغيير الاختبار',
        type: 'design_change' as const,
        priority: 'medium' as const,
        status: 'draft' as const,
        requestedBy: 'user_1',
        requestedByName: 'Test User',
        requestedAt: new Date().toISOString(),
        requestReason: 'Design improvement',
        requestReasonAr: 'تحسين التصميم',
        impacts: [],
        totalCostImpact: 3000,
        totalScheduleImpact: 5,
        approvalWorkflow: [],
        documents: [],
        comments: []
      }
      testOrder = await changeManagementService.createChangeOrder(orderData)
    })

    it('should add comment to change order', async () => {
      const commentData = {
        author: 'user_1',
        authorName: 'Test User',
        content: 'This is a test comment',
        type: 'general' as const,
        isInternal: false
      }

      const comment = await changeManagementService.addComment(testOrder.id, commentData)

      expect(comment).toBeDefined()
      expect(comment.id).toBeDefined()
      expect(comment.changeOrderId).toBe(testOrder.id)
      expect(comment.author).toBe(commentData.author)
      expect(comment.content).toBe(commentData.content)
      expect(comment.type).toBe(commentData.type)
      expect(comment.createdAt).toBeDefined()
    })

    it('should get comments for change order', async () => {
      const commentData1 = {
        author: 'user_1',
        authorName: 'Test User 1',
        content: 'First comment',
        type: 'general' as const,
        isInternal: false
      }

      const commentData2 = {
        author: 'user_2',
        authorName: 'Test User 2',
        content: 'Second comment',
        type: 'clarification' as const,
        isInternal: true
      }

      await changeManagementService.addComment(testOrder.id, commentData1)
      await changeManagementService.addComment(testOrder.id, commentData2)

      const comments = await changeManagementService.getComments(testOrder.id)

      expect(comments).toHaveLength(2)
      expect(comments[0].content).toBe(commentData1.content)
      expect(comments[1].content).toBe(commentData2.content)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when updating non-existent change request', async () => {
      await expect(
        changeManagementService.updateChangeRequest('non_existent_id', { title: 'Updated' })
      ).rejects.toThrow('طلب التغيير غير موجود')
    })

    it('should throw error when converting non-existent change request', async () => {
      await expect(
        changeManagementService.convertRequestToOrder('non_existent_id')
      ).rejects.toThrow('طلب التغيير غير موجود')
    })

    it('should throw error when updating non-existent change order', async () => {
      await expect(
        changeManagementService.updateChangeOrder('non_existent_id', { title: 'Updated' })
      ).rejects.toThrow('أمر التغيير غير موجود')
    })

    it('should throw error when approving non-existent change order', async () => {
      await expect(
        changeManagementService.approveChangeOrder('non_existent_id', 'step_1', 'approver_1')
      ).rejects.toThrow('أمر التغيير غير موجود')
    })
  })
})
