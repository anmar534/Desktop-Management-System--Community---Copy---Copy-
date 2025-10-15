/**
 * HR System Integration Connector
 * Sprint 5.3.5: تكامل مع أنظمة HR و CRM
 */

import type { ExternalIntegration, IntegrationConfig, WebhookPayload } from '../types'
import { apiClient } from '../client'

// ============================================================================
// Types
// ============================================================================

export interface HRSystem {
  id: string
  name: string
  type: HRSystemType
  version: string
  config: IntegrationConfig
  isActive: boolean
}

export type HRSystemType = 
  | 'bamboohr'
  | 'workday'
  | 'adp'
  | 'namely'
  | 'zenefits'
  | 'custom'

export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  fullName: string
  fullNameAr?: string
  email: string
  phone?: string
  department: string
  position: string
  positionAr?: string
  hireDate: string
  status: EmployeeStatus
  salary?: number
  currency?: string
  manager?: string
  skills?: string[]
  certifications?: string[]
  syncedAt?: string
}

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated'

export interface Department {
  id: string
  code: string
  name: string
  nameAr?: string
  manager?: string
  employeeCount: number
  isActive: boolean
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn?: string
  checkOut?: string
  hoursWorked: number
  status: AttendanceStatus
  notes?: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'on_leave' | 'holiday'

export interface LeaveRequest {
  id: string
  employeeId: string
  type: LeaveType
  startDate: string
  endDate: string
  days: number
  reason?: string
  status: LeaveStatus
  approvedBy?: string
  approvedAt?: string
}

export type LeaveType = 'annual' | 'sick' | 'emergency' | 'unpaid' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Payroll {
  id: string
  employeeId: string
  period: string
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  currency: string
  status: PayrollStatus
  paidAt?: string
}

export type PayrollStatus = 'draft' | 'approved' | 'paid'

// ============================================================================
// HR Connector Class
// ============================================================================

export class HRConnector {
  private integration: ExternalIntegration | null = null

  /**
   * Initialize connection to HR system
   * تهيئة الاتصال بنظام الموارد البشرية
   */
  async connect(config: IntegrationConfig): Promise<boolean> {
    try {
      const response = await apiClient.post<ExternalIntegration>(
        '/integrations/hr/connect',
        config
      )

      if (response.success && response.data) {
        this.integration = response.data
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to connect to HR system:', error)
      return false
    }
  }

  /**
   * Disconnect from HR system
   * قطع الاتصال بنظام الموارد البشرية
   */
  async disconnect(): Promise<void> {
    if (this.integration) {
      await apiClient.post(`/integrations/hr/${this.integration.id}/disconnect`)
      this.integration = null
    }
  }

  // ==========================================================================
  // Employees
  // ==========================================================================

  /**
   * Sync employees from HR system
   * مزامنة الموظفين من نظام الموارد البشرية
   */
  async syncEmployees(): Promise<{ employees: Employee[]; syncedAt: string }> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.post<{ employees: Employee[]; syncedAt: string }>(
      `/integrations/hr/${this.integration.id}/employees/sync`
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      employees: [],
      syncedAt: new Date().toISOString(),
    }
  }

  /**
   * Get employee by ID
   * الحصول على موظف محدد
   */
  async getEmployee(employeeId: string): Promise<Employee | null> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.get<Employee>(
      `/integrations/hr/${this.integration.id}/employees/${employeeId}`
    )

    return response.success && response.data ? response.data : null
  }

  /**
   * Get all employees
   * الحصول على جميع الموظفين
   */
  async getEmployees(filters?: {
    department?: string
    status?: EmployeeStatus
  }): Promise<Employee[]> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.get<Employee[]>(
      `/integrations/hr/${this.integration.id}/employees`,
      { query: filters as Record<string, string> }
    )

    return response.success && response.data ? response.data : []
  }

  // ==========================================================================
  // Departments
  // ==========================================================================

  /**
   * Sync departments from HR system
   * مزامنة الأقسام من نظام الموارد البشرية
   */
  async syncDepartments(): Promise<{ departments: Department[]; syncedAt: string }> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.post<{ departments: Department[]; syncedAt: string }>(
      `/integrations/hr/${this.integration.id}/departments/sync`
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      departments: [],
      syncedAt: new Date().toISOString(),
    }
  }

  /**
   * Get all departments
   * الحصول على جميع الأقسام
   */
  async getDepartments(): Promise<Department[]> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.get<Department[]>(
      `/integrations/hr/${this.integration.id}/departments`
    )

    return response.success && response.data ? response.data : []
  }

  // ==========================================================================
  // Attendance
  // ==========================================================================

  /**
   * Get attendance records
   * الحصول على سجلات الحضور
   */
  async getAttendance(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<Attendance[]> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.get<Attendance[]>(
      `/integrations/hr/${this.integration.id}/attendance`,
      { query: { employeeId, startDate, endDate } }
    )

    return response.success && response.data ? response.data : []
  }

  /**
   * Sync attendance records
   * مزامنة سجلات الحضور
   */
  async syncAttendance(
    startDate: string,
    endDate: string
  ): Promise<{ records: Attendance[]; syncedAt: string }> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.post<{ records: Attendance[]; syncedAt: string }>(
      `/integrations/hr/${this.integration.id}/attendance/sync`,
      { startDate, endDate }
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      records: [],
      syncedAt: new Date().toISOString(),
    }
  }

  // ==========================================================================
  // Leave Requests
  // ==========================================================================

  /**
   * Get leave requests
   * الحصول على طلبات الإجازات
   */
  async getLeaveRequests(
    employeeId?: string,
    status?: LeaveStatus
  ): Promise<LeaveRequest[]> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.get<LeaveRequest[]>(
      `/integrations/hr/${this.integration.id}/leave-requests`,
      { query: { employeeId, status } as Record<string, string> }
    )

    return response.success && response.data ? response.data : []
  }

  /**
   * Create leave request
   * إنشاء طلب إجازة
   */
  async createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest | null> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.post<LeaveRequest>(
      `/integrations/hr/${this.integration.id}/leave-requests`,
      request
    )

    return response.success && response.data ? response.data : null
  }

  // ==========================================================================
  // Payroll
  // ==========================================================================

  /**
   * Get payroll records
   * الحصول على سجلات الرواتب
   */
  async getPayroll(
    employeeId?: string,
    period?: string
  ): Promise<Payroll[]> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.get<Payroll[]>(
      `/integrations/hr/${this.integration.id}/payroll`,
      { query: { employeeId, period } as Record<string, string> }
    )

    return response.success && response.data ? response.data : []
  }

  /**
   * Sync payroll records
   * مزامنة سجلات الرواتب
   */
  async syncPayroll(period: string): Promise<{ records: Payroll[]; syncedAt: string }> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.post<{ records: Payroll[]; syncedAt: string }>(
      `/integrations/hr/${this.integration.id}/payroll/sync`,
      { period }
    )

    if (response.success && response.data) {
      return response.data
    }

    return {
      records: [],
      syncedAt: new Date().toISOString(),
    }
  }

  // ==========================================================================
  // Webhooks
  // ==========================================================================

  /**
   * Register webhook for employee updates
   * تسجيل webhook لتحديثات الموظفين
   */
  async registerEmployeeWebhook(url: string, events: string[]): Promise<boolean> {
    if (!this.integration) {
      throw new Error('Not connected to HR system')
    }

    const response = await apiClient.post(
      `/integrations/hr/${this.integration.id}/webhooks`,
      {
        url,
        events,
        type: 'employee_updates',
      }
    )

    return response.success
  }

  /**
   * Handle webhook payload
   * معالجة بيانات webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    console.log('HR Webhook received:', payload.event)
    
    switch (payload.event) {
      case 'employee.created':
      case 'employee.updated':
        await this.syncEmployees()
        break
      case 'employee.terminated':
        // Handle employee termination
        break
      case 'department.created':
      case 'department.updated':
        await this.syncDepartments()
        break
      default:
        console.log('Unhandled webhook event:', payload.event)
    }
  }
}

// ============================================================================
// Default HR Connector Instance
// ============================================================================

export const hrConnector = new HRConnector()

