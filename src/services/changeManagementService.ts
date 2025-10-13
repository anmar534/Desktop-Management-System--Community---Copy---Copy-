/**
 * Change Management Service
 * خدمة إدارة التغييرات
 */

import { asyncStorage } from '../utils/storage'
import type {
  ChangeRequest,
  ChangeOrder,
  ChangeComment,
  ChangeOrderDocument,
  ChangeImpact,
  ChangeManagementDashboard,
  ChangeOrderFilters,
  ChangeMetrics,
  ApprovalMetrics,
  ChangeManagementServiceInterface,
  ChangeStatus,
  ChangePriority,
  ChangeOrderType
} from '../types/change'

class ChangeManagementServiceImpl implements ChangeManagementServiceInterface {
  private readonly STORAGE_KEYS = {
    CHANGE_REQUESTS: 'change_requests',
    CHANGE_ORDERS: 'change_orders',
    CHANGE_COMMENTS: 'change_comments',
    CHANGE_DOCUMENTS: 'change_documents'
  } as const

  // Change Requests
  async createChangeRequest(request: Omit<ChangeRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChangeRequest> {
    try {
      const newRequest: ChangeRequest = {
        ...request,
        id: this.generateId('req'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const requests = await this.getAllChangeRequests()
      requests.push(newRequest)
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_REQUESTS, requests)

      return newRequest
    } catch (error) {
      console.error('Error creating change request:', error)
      throw new Error('فشل في إنشاء طلب التغيير')
    }
  }

  async getChangeRequest(requestId: string): Promise<ChangeRequest | null> {
    try {
      const requests = await this.getAllChangeRequests()
      return requests.find(r => r.id === requestId) || null
    } catch (error) {
      console.error('Error getting change request:', error)
      throw new Error('فشل في استرجاع طلب التغيير')
    }
  }

  async updateChangeRequest(requestId: string, updates: Partial<ChangeRequest>): Promise<ChangeRequest> {
    try {
      const requests = await this.getAllChangeRequests()
      const index = requests.findIndex(r => r.id === requestId)
      
      if (index === -1) {
        throw new Error('طلب التغيير غير موجود')
      }

      const updatedRequest = {
        ...requests[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      requests[index] = updatedRequest
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_REQUESTS, requests)

      return updatedRequest
    } catch (error) {
      console.error('Error updating change request:', error)
      throw new Error('فشل في تحديث طلب التغيير')
    }
  }

  async deleteChangeRequest(requestId: string): Promise<void> {
    try {
      const requests = await this.getAllChangeRequests()
      const filteredRequests = requests.filter(r => r.id !== requestId)
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_REQUESTS, filteredRequests)
    } catch (error) {
      console.error('Error deleting change request:', error)
      throw new Error('فشل في حذف طلب التغيير')
    }
  }

  async getChangeRequestsByProject(projectId: string): Promise<ChangeRequest[]> {
    try {
      const requests = await this.getAllChangeRequests()
      return requests.filter(r => r.projectId === projectId)
    } catch (error) {
      console.error('Error getting change requests by project:', error)
      throw new Error('فشل في استرجاع طلبات التغيير للمشروع')
    }
  }

  async convertRequestToOrder(requestId: string, additionalData?: Partial<ChangeOrder>): Promise<ChangeOrder> {
    try {
      const request = await this.getChangeRequest(requestId)
      if (!request) {
        throw new Error('طلب التغيير غير موجود')
      }

      // Create change order from request
      const changeOrder: Omit<ChangeOrder, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
        projectId: request.projectId,
        number: await this.generateChangeOrderNumber(request.projectId),
        title: request.title,
        titleAr: request.titleAr,
        description: request.description,
        descriptionAr: request.descriptionAr,
        type: request.type,
        priority: request.priority,
        status: 'draft',
        requestedBy: request.requestedBy,
        requestedByName: request.requestedByName,
        requestedAt: request.requestedAt,
        requestReason: request.reason,
        requestReasonAr: request.reasonAr,
        impacts: [],
        totalCostImpact: request.estimatedCost || 0,
        totalScheduleImpact: request.estimatedDuration || 0,
        approvalWorkflow: await this.createDefaultApprovalWorkflow(),
        documents: request.documents,
        comments: [],
        ...additionalData
      }

      const newOrder = await this.createChangeOrder(changeOrder)

      // Update request status
      await this.updateChangeRequest(requestId, { status: 'converted_to_order' })

      return newOrder
    } catch (error) {
      console.error('Error converting request to order:', error)
      throw new Error('فشل في تحويل طلب التغيير إلى أمر تغيير')
    }
  }

  // Change Orders
  async createChangeOrder(order: Omit<ChangeOrder, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ChangeOrder> {
    try {
      const newOrder: ChangeOrder = {
        ...order,
        id: this.generateId('co'),
        number: order.number || await this.generateChangeOrderNumber(order.projectId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      const orders = await this.getAllChangeOrders()
      orders.push(newOrder)
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_ORDERS, orders)

      return newOrder
    } catch (error) {
      console.error('Error creating change order:', error)
      throw new Error('فشل في إنشاء أمر التغيير')
    }
  }

  async getChangeOrder(orderId: string): Promise<ChangeOrder | null> {
    try {
      const orders = await this.getAllChangeOrders()
      return orders.find(o => o.id === orderId) || null
    } catch (error) {
      console.error('Error getting change order:', error)
      throw new Error('فشل في استرجاع أمر التغيير')
    }
  }

  async updateChangeOrder(orderId: string, updates: Partial<ChangeOrder>): Promise<ChangeOrder> {
    try {
      const orders = await this.getAllChangeOrders()
      const index = orders.findIndex(o => o.id === orderId)
      
      if (index === -1) {
        throw new Error('أمر التغيير غير موجود')
      }

      const updatedOrder = {
        ...orders[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        version: orders[index].version + 1
      }

      orders[index] = updatedOrder
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_ORDERS, orders)

      return updatedOrder
    } catch (error) {
      console.error('Error updating change order:', error)
      throw new Error('فشل في تحديث أمر التغيير')
    }
  }

  async deleteChangeOrder(orderId: string): Promise<void> {
    try {
      const orders = await this.getAllChangeOrders()
      const filteredOrders = orders.filter(o => o.id !== orderId)
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_ORDERS, filteredOrders)

      // Also delete related comments and documents
      await this.deleteCommentsByOrder(orderId)
      await this.deleteDocumentsByOrder(orderId)
    } catch (error) {
      console.error('Error deleting change order:', error)
      throw new Error('فشل في حذف أمر التغيير')
    }
  }

  async getChangeOrdersByProject(projectId: string, filters?: ChangeOrderFilters): Promise<ChangeOrder[]> {
    try {
      const orders = await this.getAllChangeOrders()
      let filteredOrders = orders.filter(o => o.projectId === projectId)

      if (filters) {
        filteredOrders = this.applyFilters(filteredOrders, filters)
      }

      return filteredOrders
    } catch (error) {
      console.error('Error getting change orders by project:', error)
      throw new Error('فشل في استرجاع أوامر التغيير للمشروع')
    }
  }

  // Approval Workflow
  async submitForApproval(orderId: string): Promise<ChangeOrder> {
    try {
      const order = await this.getChangeOrder(orderId)
      if (!order) {
        throw new Error('أمر التغيير غير موجود')
      }

      const updatedOrder = await this.updateChangeOrder(orderId, {
        status: 'submitted',
        currentApprovalStep: 0
      })

      return updatedOrder
    } catch (error) {
      console.error('Error submitting for approval:', error)
      throw new Error('فشل في تقديم أمر التغيير للموافقة')
    }
  }

  async approveChangeOrder(orderId: string, stepId: string, approverId: string, comments?: string): Promise<ChangeOrder> {
    try {
      const order = await this.getChangeOrder(orderId)
      if (!order) {
        throw new Error('أمر التغيير غير موجود')
      }

      // Update approval step
      const updatedWorkflow = order.approvalWorkflow.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            status: 'approved' as const,
            approverId,
            comments,
            approvedAt: new Date().toISOString()
          }
        }
        return step
      })

      // Check if all steps are approved
      const allApproved = updatedWorkflow.every(step => step.status === 'approved' || step.status === 'skipped')
      const newStatus: ChangeStatus = allApproved ? 'approved' : 'under_review'

      const updatedOrder = await this.updateChangeOrder(orderId, {
        approvalWorkflow: updatedWorkflow,
        status: newStatus,
        currentApprovalStep: allApproved ? undefined : (order.currentApprovalStep || 0) + 1
      })

      // Add comment if provided
      if (comments) {
        await this.addComment(orderId, {
          author: approverId,
          authorName: 'Approver', // This should be fetched from user service
          content: comments,
          type: 'approval',
          isInternal: true
        })
      }

      return updatedOrder
    } catch (error) {
      console.error('Error approving change order:', error)
      throw new Error('فشل في الموافقة على أمر التغيير')
    }
  }

  async rejectChangeOrder(orderId: string, stepId: string, approverId: string, reason: string): Promise<ChangeOrder> {
    try {
      const order = await this.getChangeOrder(orderId)
      if (!order) {
        throw new Error('أمر التغيير غير موجود')
      }

      // Update approval step
      const updatedWorkflow = order.approvalWorkflow.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            status: 'rejected' as const,
            approverId,
            comments: reason,
            approvedAt: new Date().toISOString()
          }
        }
        return step
      })

      const updatedOrder = await this.updateChangeOrder(orderId, {
        approvalWorkflow: updatedWorkflow,
        status: 'rejected'
      })

      // Add rejection comment
      await this.addComment(orderId, {
        author: approverId,
        authorName: 'Approver', // This should be fetched from user service
        content: reason,
        type: 'rejection',
        isInternal: true
      })

      return updatedOrder
    } catch (error) {
      console.error('Error rejecting change order:', error)
      throw new Error('فشل في رفض أمر التغيير')
    }
  }

  async skipApprovalStep(orderId: string, stepId: string, reason: string): Promise<ChangeOrder> {
    try {
      const order = await this.getChangeOrder(orderId)
      if (!order) {
        throw new Error('أمر التغيير غير موجود')
      }

      // Update approval step
      const updatedWorkflow = order.approvalWorkflow.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            status: 'skipped' as const,
            comments: reason,
            approvedAt: new Date().toISOString()
          }
        }
        return step
      })

      // Check if all remaining steps are completed
      const allCompleted = updatedWorkflow.every(step => 
        step.status === 'approved' || step.status === 'skipped' || step.status === 'rejected'
      )
      const newStatus: ChangeStatus = allCompleted ? 'approved' : 'under_review'

      const updatedOrder = await this.updateChangeOrder(orderId, {
        approvalWorkflow: updatedWorkflow,
        status: newStatus,
        currentApprovalStep: allCompleted ? undefined : (order.currentApprovalStep || 0) + 1
      })

      return updatedOrder
    } catch (error) {
      console.error('Error skipping approval step:', error)
      throw new Error('فشل في تخطي خطوة الموافقة')
    }
  }

  // Implementation
  async startImplementation(orderId: string, implementedBy: string, plan?: string): Promise<ChangeOrder> {
    try {
      const updatedOrder = await this.updateChangeOrder(orderId, {
        status: 'implementing',
        implementedBy,
        implementedByName: 'Implementation Team', // This should be fetched from user service
        implementationPlan: plan,
        implementationStartDate: new Date().toISOString()
      })

      return updatedOrder
    } catch (error) {
      console.error('Error starting implementation:', error)
      throw new Error('فشل في بدء تنفيذ أمر التغيير')
    }
  }

  async completeImplementation(orderId: string, actualCost?: number, notes?: string): Promise<ChangeOrder> {
    try {
      const updatedOrder = await this.updateChangeOrder(orderId, {
        status: 'completed',
        implementationEndDate: new Date().toISOString(),
        actualCost
      })

      if (notes) {
        await this.addComment(orderId, {
          author: updatedOrder.implementedBy || 'system',
          authorName: 'Implementation Team',
          content: notes,
          type: 'implementation',
          isInternal: true
        })
      }

      return updatedOrder
    } catch (error) {
      console.error('Error completing implementation:', error)
      throw new Error('فشل في إكمال تنفيذ أمر التغيير')
    }
  }

  // Impact Assessment
  async assessImpact(orderId: string, impacts: ChangeImpact[]): Promise<ChangeOrder> {
    try {
      const { costImpact, scheduleImpact } = this.calculateTotalImpact(impacts)

      const updatedOrder = await this.updateChangeOrder(orderId, {
        impacts,
        totalCostImpact: costImpact,
        totalScheduleImpact: scheduleImpact
      })

      return updatedOrder
    } catch (error) {
      console.error('Error assessing impact:', error)
      throw new Error('فشل في تقييم تأثير التغيير')
    }
  }

  calculateTotalImpact(impacts: ChangeImpact[]): { costImpact: number; scheduleImpact: number } {
    const costImpact = impacts.reduce((total, impact) => total + (impact.estimatedCost || 0), 0)
    const scheduleImpact = impacts.reduce((total, impact) => total + (impact.estimatedDuration || 0), 0)

    return { costImpact, scheduleImpact }
  }

  // Comments
  async addComment(orderId: string, comment: Omit<ChangeComment, 'id' | 'changeOrderId' | 'createdAt'>): Promise<ChangeComment> {
    try {
      const newComment: ChangeComment = {
        ...comment,
        id: this.generateId('comment'),
        changeOrderId: orderId,
        createdAt: new Date().toISOString()
      }

      const comments = await this.getAllComments()
      comments.push(newComment)
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_COMMENTS, comments)

      return newComment
    } catch (error) {
      console.error('Error adding comment:', error)
      throw new Error('فشل في إضافة التعليق')
    }
  }

  async getComments(orderId: string): Promise<ChangeComment[]> {
    try {
      const comments = await this.getAllComments()
      return comments.filter(c => c.changeOrderId === orderId)
    } catch (error) {
      console.error('Error getting comments:', error)
      throw new Error('فشل في استرجاع التعليقات')
    }
  }

  // Documents
  async addDocument(orderId: string, document: Omit<ChangeOrderDocument, 'id' | 'uploadedAt'>): Promise<ChangeOrderDocument> {
    try {
      const newDocument: ChangeOrderDocument = {
        ...document,
        id: this.generateId('doc'),
        uploadedAt: new Date().toISOString()
      }

      const documents = await this.getAllDocuments()
      documents.push(newDocument)
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_DOCUMENTS, documents)

      // Update change order with new document
      const order = await this.getChangeOrder(orderId)
      if (order) {
        await this.updateChangeOrder(orderId, {
          documents: [...order.documents, newDocument]
        })
      }

      return newDocument
    } catch (error) {
      console.error('Error adding document:', error)
      throw new Error('فشل في إضافة الوثيقة')
    }
  }

  async removeDocument(documentId: string): Promise<void> {
    try {
      const documents = await this.getAllDocuments()
      const filteredDocuments = documents.filter(d => d.id !== documentId)
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_DOCUMENTS, filteredDocuments)

      // Also remove from change orders
      const orders = await this.getAllChangeOrders()
      for (const order of orders) {
        const updatedDocuments = order.documents.filter(d => d.id !== documentId)
        if (updatedDocuments.length !== order.documents.length) {
          await this.updateChangeOrder(order.id, { documents: updatedDocuments })
        }
      }
    } catch (error) {
      console.error('Error removing document:', error)
      throw new Error('فشل في حذف الوثيقة')
    }
  }

  // Dashboard and Reporting
  async getDashboard(projectId: string): Promise<ChangeManagementDashboard> {
    try {
      const orders = await this.getChangeOrdersByProject(projectId)

      const summary = {
        totalChangeOrders: orders.length,
        pendingApprovals: orders.filter(o => o.status === 'under_review' || o.status === 'submitted').length,
        inProgress: orders.filter(o => o.status === 'implementing').length,
        completed: orders.filter(o => o.status === 'completed').length,
        totalCostImpact: orders.reduce((total, o) => total + o.totalCostImpact, 0),
        totalScheduleImpact: orders.reduce((total, o) => total + o.totalScheduleImpact, 0),
        averageApprovalTime: this.calculateAverageApprovalTime(orders)
      }

      const recentChanges = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

      const pendingApprovals = orders.filter(o =>
        o.status === 'under_review' || o.status === 'submitted'
      )

      const costImpactTrend = this.calculateCostImpactTrend(orders)
      const changesByType = this.groupChangesByType(orders)
      const approvalMetrics = await this.calculateApprovalMetrics(orders)

      return {
        projectId,
        summary,
        recentChanges,
        pendingApprovals,
        costImpactTrend,
        changesByType,
        approvalMetrics
      }
    } catch (error) {
      console.error('Error getting dashboard:', error)
      throw new Error('فشل في استرجاع لوحة المعلومات')
    }
  }

  async generateChangeReport(projectId: string, format: 'pdf' | 'excel'): Promise<Blob> {
    try {
      // This is a placeholder implementation
      // In a real application, this would generate actual PDF/Excel files
      const orders = await this.getChangeOrdersByProject(projectId)
      const reportData = JSON.stringify(orders, null, 2)

      return new Blob([reportData], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    } catch (error) {
      console.error('Error generating change report:', error)
      throw new Error('فشل في إنشاء تقرير التغييرات')
    }
  }

  // Analytics
  async getChangeMetrics(projectId: string, period: { start: string; end: string }): Promise<ChangeMetrics> {
    try {
      const orders = await this.getChangeOrdersByProject(projectId)
      const filteredOrders = orders.filter(o => {
        const createdDate = new Date(o.createdAt)
        return createdDate >= new Date(period.start) && createdDate <= new Date(period.end)
      })

      const totalChanges = filteredOrders.length
      const approvedChanges = filteredOrders.filter(o => o.status === 'approved' || o.status === 'completed').length
      const rejectedChanges = filteredOrders.filter(o => o.status === 'rejected').length
      const pendingChanges = filteredOrders.filter(o =>
        o.status === 'draft' || o.status === 'submitted' || o.status === 'under_review'
      ).length

      const averageCostImpact = totalChanges > 0
        ? filteredOrders.reduce((sum, o) => sum + o.totalCostImpact, 0) / totalChanges
        : 0

      const averageScheduleImpact = totalChanges > 0
        ? filteredOrders.reduce((sum, o) => sum + o.totalScheduleImpact, 0) / totalChanges
        : 0

      const changesByType = this.groupByType(filteredOrders)
      const changesByPriority = this.groupByPriority(filteredOrders)
      const monthlyTrends = this.calculateMonthlyTrends(filteredOrders)

      return {
        totalChanges,
        approvedChanges,
        rejectedChanges,
        pendingChanges,
        averageCostImpact,
        averageScheduleImpact,
        changesByType,
        changesByPriority,
        monthlyTrends
      }
    } catch (error) {
      console.error('Error getting change metrics:', error)
      throw new Error('فشل في استرجاع مقاييس التغييرات')
    }
  }

  async getApprovalMetrics(projectId: string): Promise<ApprovalMetrics> {
    try {
      const orders = await this.getChangeOrdersByProject(projectId)
      const completedOrders = orders.filter(o =>
        o.status === 'approved' || o.status === 'rejected' || o.status === 'completed'
      )

      const averageApprovalTime = this.calculateAverageApprovalTime(completedOrders)
      const approvalRate = completedOrders.length > 0
        ? orders.filter(o => o.status === 'approved' || o.status === 'completed').length / completedOrders.length
        : 0
      const rejectionRate = completedOrders.length > 0
        ? orders.filter(o => o.status === 'rejected').length / completedOrders.length
        : 0

      const bottleneckSteps = this.identifyBottleneckSteps(orders)
      const approverPerformance = this.calculateApproverPerformance(orders)

      return {
        averageApprovalTime,
        approvalRate,
        rejectionRate,
        bottleneckSteps,
        approverPerformance
      }
    } catch (error) {
      console.error('Error getting approval metrics:', error)
      throw new Error('فشل في استرجاع مقاييس الموافقات')
    }
  }

  // Helper Methods
  private async getAllChangeRequests(): Promise<ChangeRequest[]> {
    try {
      return await asyncStorage.getItem(this.STORAGE_KEYS.CHANGE_REQUESTS, [])
    } catch (error) {
      console.error('Error getting all change requests:', error)
      return []
    }
  }

  private async getAllChangeOrders(): Promise<ChangeOrder[]> {
    try {
      return await asyncStorage.getItem(this.STORAGE_KEYS.CHANGE_ORDERS, [])
    } catch (error) {
      console.error('Error getting all change orders:', error)
      return []
    }
  }

  private async getAllComments(): Promise<ChangeComment[]> {
    try {
      return await asyncStorage.getItem(this.STORAGE_KEYS.CHANGE_COMMENTS, [])
    } catch (error) {
      console.error('Error getting all comments:', error)
      return []
    }
  }

  private async getAllDocuments(): Promise<ChangeOrderDocument[]> {
    try {
      return await asyncStorage.getItem(this.STORAGE_KEYS.CHANGE_DOCUMENTS, [])
    } catch (error) {
      console.error('Error getting all documents:', error)
      return []
    }
  }

  private generateId(prefix: string = 'change'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async generateChangeOrderNumber(projectId: string): Promise<string> {
    const orders = await this.getChangeOrdersByProject(projectId)
    const nextNumber = orders.length + 1
    return `CO-${String(nextNumber).padStart(3, '0')}`
  }

  private async createDefaultApprovalWorkflow() {
    // This would typically be configured per project or organization
    return [
      {
        id: this.generateId('step'),
        stepNumber: 1,
        name: 'Technical Review',
        nameAr: 'المراجعة التقنية',
        approverRole: 'Technical Manager',
        approverRoleAr: 'المدير التقني',
        status: 'pending' as const,
        requiredDocuments: ['technical_drawing', 'specification'],
        conditions: ['Impact assessment completed', 'Cost estimate provided'],
        conditionsAr: ['تم إكمال تقييم التأثير', 'تم توفير تقدير التكلفة']
      },
      {
        id: this.generateId('step'),
        stepNumber: 2,
        name: 'Financial Approval',
        nameAr: 'الموافقة المالية',
        approverRole: 'Finance Manager',
        approverRoleAr: 'المدير المالي',
        status: 'pending' as const,
        requiredDocuments: ['cost_estimate'],
        conditions: ['Budget impact within limits'],
        conditionsAr: ['تأثير الميزانية ضمن الحدود المسموحة']
      },
      {
        id: this.generateId('step'),
        stepNumber: 3,
        name: 'Project Manager Approval',
        nameAr: 'موافقة مدير المشروع',
        approverRole: 'Project Manager',
        approverRoleAr: 'مدير المشروع',
        status: 'pending' as const,
        requiredDocuments: [],
        conditions: ['All previous approvals obtained'],
        conditionsAr: ['تم الحصول على جميع الموافقات السابقة']
      }
    ]
  }

  private applyFilters(orders: ChangeOrder[], filters: ChangeOrderFilters): ChangeOrder[] {
    let filtered = orders

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(o => filters.status!.includes(o.status))
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(o => filters.type!.includes(o.type))
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(o => filters.priority!.includes(o.priority))
    }

    if (filters.requestedBy) {
      filtered = filtered.filter(o => o.requestedBy === filters.requestedBy)
    }

    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start)
      const end = new Date(filters.dateRange.end)
      filtered = filtered.filter(o => {
        const createdDate = new Date(o.createdAt)
        return createdDate >= start && createdDate <= end
      })
    }

    if (filters.costRange) {
      filtered = filtered.filter(o =>
        o.totalCostImpact >= filters.costRange!.min &&
        o.totalCostImpact <= filters.costRange!.max
      )
    }

    return filtered
  }

  private calculateAverageApprovalTime(orders: ChangeOrder[]): number {
    const approvedOrders = orders.filter(o => o.status === 'approved' || o.status === 'completed')
    if (approvedOrders.length === 0) return 0

    const totalTime = approvedOrders.reduce((sum, order) => {
      const requestedDate = new Date(order.requestedAt)
      const lastApprovalDate = order.approvalWorkflow
        .filter(step => step.approvedAt)
        .map(step => new Date(step.approvedAt!))
        .sort((a, b) => b.getTime() - a.getTime())[0]

      if (lastApprovalDate) {
        return sum + (lastApprovalDate.getTime() - requestedDate.getTime()) / (1000 * 60 * 60 * 24) // days
      }
      return sum
    }, 0)

    return totalTime / approvedOrders.length
  }

  private calculateCostImpactTrend(orders: ChangeOrder[]) {
    const monthlyData: Record<string, { totalImpact: number; approvedImpact: number }> = {}

    orders.forEach(order => {
      const month = new Date(order.createdAt).toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { totalImpact: 0, approvedImpact: 0 }
      }
      monthlyData[month].totalImpact += order.totalCostImpact
      if (order.status === 'approved' || order.status === 'completed') {
        monthlyData[month].approvedImpact += order.totalCostImpact
      }
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }))
  }

  private groupChangesByType(orders: ChangeOrder[]) {
    const grouped: Record<ChangeOrderType, { count: number; totalCost: number }> = {} as any

    orders.forEach(order => {
      if (!grouped[order.type]) {
        grouped[order.type] = { count: 0, totalCost: 0 }
      }
      grouped[order.type].count++
      grouped[order.type].totalCost += order.totalCostImpact
    })

    return Object.entries(grouped).map(([type, data]) => ({
      type: type as ChangeOrderType,
      ...data
    }))
  }

  private async calculateApprovalMetrics(orders: ChangeOrder[]) {
    const averageApprovalTime = this.calculateAverageApprovalTime(orders)
    const completedOrders = orders.filter(o =>
      o.status === 'approved' || o.status === 'rejected' || o.status === 'completed'
    )

    const approvalRate = completedOrders.length > 0
      ? orders.filter(o => o.status === 'approved' || o.status === 'completed').length / completedOrders.length
      : 0

    const onTimeApprovals = completedOrders.filter(order => {
      const approvalTime = this.calculateOrderApprovalTime(order)
      return approvalTime <= 5 // Assuming 5 days is the target
    }).length

    return {
      averageApprovalTime,
      approvalRate,
      rejectionRate: 1 - approvalRate,
      onTimeApprovals
    }
  }

  private groupByType(orders: ChangeOrder[]): Record<ChangeOrderType, number> {
    const grouped: Record<ChangeOrderType, number> = {} as any
    orders.forEach(order => {
      grouped[order.type] = (grouped[order.type] || 0) + 1
    })
    return grouped
  }

  private groupByPriority(orders: ChangeOrder[]): Record<ChangePriority, number> {
    const grouped: Record<ChangePriority, number> = {} as any
    orders.forEach(order => {
      grouped[order.priority] = (grouped[order.priority] || 0) + 1
    })
    return grouped
  }

  private calculateMonthlyTrends(orders: ChangeOrder[]) {
    const monthlyData: Record<string, { count: number; totalCost: number; approvalTimes: number[] }> = {}

    orders.forEach(order => {
      const month = new Date(order.createdAt).toISOString().substring(0, 7)
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, totalCost: 0, approvalTimes: [] }
      }
      monthlyData[month].count++
      monthlyData[month].totalCost += order.totalCostImpact

      const approvalTime = this.calculateOrderApprovalTime(order)
      if (approvalTime > 0) {
        monthlyData[month].approvalTimes.push(approvalTime)
      }
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      totalCost: data.totalCost,
      averageApprovalTime: data.approvalTimes.length > 0
        ? data.approvalTimes.reduce((sum, time) => sum + time, 0) / data.approvalTimes.length
        : 0
    }))
  }

  private identifyBottleneckSteps(orders: ChangeOrder[]) {
    const stepData: Record<string, { totalTime: number; count: number }> = {}

    orders.forEach(order => {
      order.approvalWorkflow.forEach(step => {
        if (step.approvedAt) {
          const stepTime = 1 // Placeholder - would calculate actual time spent on step
          if (!stepData[step.name]) {
            stepData[step.name] = { totalTime: 0, count: 0 }
          }
          stepData[step.name].totalTime += stepTime
          stepData[step.name].count++
        }
      })
    })

    return Object.entries(stepData)
      .map(([stepName, data]) => ({
        stepName,
        averageTime: data.count > 0 ? data.totalTime / data.count : 0,
        count: data.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5)
  }

  private calculateApproverPerformance(orders: ChangeOrder[]) {
    const approverData: Record<string, { totalTime: number; approvals: number; rejections: number }> = {}

    orders.forEach(order => {
      order.approvalWorkflow.forEach(step => {
        if (step.approverId && step.approvedAt) {
          if (!approverData[step.approverId]) {
            approverData[step.approverId] = { totalTime: 0, approvals: 0, rejections: 0 }
          }

          const stepTime = 1 // Placeholder - would calculate actual time
          approverData[step.approverId].totalTime += stepTime

          if (step.status === 'approved') {
            approverData[step.approverId].approvals++
          } else if (step.status === 'rejected') {
            approverData[step.approverId].rejections++
          }
        }
      })
    })

    return Object.entries(approverData).map(([approverId, data]) => {
      const totalDecisions = data.approvals + data.rejections
      return {
        approverId,
        approverName: 'Approver Name', // Would be fetched from user service
        averageTime: totalDecisions > 0 ? data.totalTime / totalDecisions : 0,
        approvalRate: totalDecisions > 0 ? data.approvals / totalDecisions : 0,
        totalApprovals: data.approvals
      }
    })
  }

  private calculateOrderApprovalTime(order: ChangeOrder): number {
    if (order.status !== 'approved' && order.status !== 'completed' && order.status !== 'rejected') {
      return 0
    }

    const requestedDate = new Date(order.requestedAt)
    const lastApprovalDate = order.approvalWorkflow
      .filter(step => step.approvedAt)
      .map(step => new Date(step.approvedAt!))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    if (lastApprovalDate) {
      return (lastApprovalDate.getTime() - requestedDate.getTime()) / (1000 * 60 * 60 * 24) // days
    }
    return 0
  }

  private async deleteCommentsByOrder(orderId: string): Promise<void> {
    const comments = await this.getAllComments()
    const filteredComments = comments.filter(c => c.changeOrderId !== orderId)
    await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_COMMENTS, filteredComments)
  }

  private async deleteDocumentsByOrder(orderId: string): Promise<void> {
    const order = await this.getChangeOrder(orderId)
    if (order) {
      const documents = await this.getAllDocuments()
      const documentIds = order.documents.map(d => d.id)
      const filteredDocuments = documents.filter(d => !documentIds.includes(d.id))
      await asyncStorage.setItem(this.STORAGE_KEYS.CHANGE_DOCUMENTS, filteredDocuments)
    }
  }
}

// تصدير مثيل واحد من الخدمة
export const changeManagementService = new ChangeManagementServiceImpl()
