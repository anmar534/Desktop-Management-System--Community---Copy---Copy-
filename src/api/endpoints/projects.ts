/**
 * Projects API Endpoints
 * Sprint 5.3: تطوير APIs للتكامل الخارجي
 */

import { apiClient } from '../client'
import type { ApiResponse, PaginatedRequest, FilteredRequest } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface Project {
  id: string
  code: string
  name: string
  nameEn?: string
  description?: string
  client: string
  status: ProjectStatus
  startDate: string
  endDate?: string
  budget: number
  actualCost: number
  progress: number
  tenderId?: string
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 
  | 'planning'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'

export interface ProjectCosts {
  projectId: string
  plannedCost: number
  actualCost: number
  earnedValue: number
  costVariance: number
  costPerformanceIndex: number
  estimateAtCompletion: number
  estimateToComplete: number
  varianceAtCompletion: number
  breakdown: CostBreakdown[]
}

export interface CostBreakdown {
  category: string
  categoryAr: string
  planned: number
  actual: number
  variance: number
}

export interface ProjectSchedule {
  projectId: string
  startDate: string
  endDate: string
  duration: number
  tasks: ScheduleTask[]
  milestones: Milestone[]
  criticalPath: string[]
}

export interface ScheduleTask {
  id: string
  name: string
  nameAr?: string
  startDate: string
  endDate: string
  duration: number
  progress: number
  dependencies: string[]
  isCritical: boolean
}

export interface Milestone {
  id: string
  name: string
  nameAr?: string
  date: string
  status: 'pending' | 'completed' | 'delayed'
}

export interface ProjectTask {
  id: string
  projectId: string
  name: string
  nameAr?: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: string
  startDate?: string
  dueDate?: string
  progress: number
  estimatedHours?: number
  actualHours?: number
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 
  | 'not_started'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface CreateProjectRequest {
  code: string
  name: string
  nameEn?: string
  description?: string
  client: string
  startDate: string
  endDate?: string
  budget: number
  tenderId?: string
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus
  progress?: number
}

export interface ProjectListResponse {
  projects: Project[]
  total: number
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get all projects
 * الحصول على جميع المشاريع
 */
export async function getProjects(
  params?: PaginatedRequest & FilteredRequest
): Promise<ApiResponse<ProjectListResponse>> {
  return apiClient.get<ProjectListResponse>('/projects', { query: params as Record<string, string | number | boolean> })
}

/**
 * Get project by ID
 * الحصول على مشروع محدد
 */
export async function getProjectById(id: string): Promise<ApiResponse<Project>> {
  return apiClient.get<Project>(`/projects/${id}`)
}

/**
 * Create new project
 * إنشاء مشروع جديد
 */
export async function createProject(
  data: CreateProjectRequest
): Promise<ApiResponse<Project>> {
  return apiClient.post<Project>('/projects', data)
}

/**
 * Update project
 * تحديث مشروع
 */
export async function updateProject(
  id: string,
  data: UpdateProjectRequest
): Promise<ApiResponse<Project>> {
  return apiClient.put<Project>(`/projects/${id}`, data)
}

/**
 * Delete project
 * حذف مشروع
 */
export async function deleteProject(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/projects/${id}`)
}

/**
 * Get project costs
 * الحصول على تكاليف المشروع
 */
export async function getProjectCosts(
  id: string
): Promise<ApiResponse<ProjectCosts>> {
  return apiClient.get<ProjectCosts>(`/projects/${id}/costs`)
}

/**
 * Get project schedule
 * الحصول على جدول المشروع
 */
export async function getProjectSchedule(
  id: string
): Promise<ApiResponse<ProjectSchedule>> {
  return apiClient.get<ProjectSchedule>(`/projects/${id}/schedule`)
}

/**
 * Get project tasks
 * الحصول على مهام المشروع
 */
export async function getProjectTasks(
  id: string,
  params?: PaginatedRequest
): Promise<ApiResponse<{ tasks: ProjectTask[]; total: number }>> {
  return apiClient.get<{ tasks: ProjectTask[]; total: number }>(
    `/projects/${id}/tasks`,
    { query: params as Record<string, string | number | boolean> }
  )
}

/**
 * Create project task
 * إنشاء مهمة مشروع
 */
export async function createProjectTask(
  projectId: string,
  data: Omit<ProjectTask, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<ProjectTask>> {
  return apiClient.post<ProjectTask>(`/projects/${projectId}/tasks`, data)
}

/**
 * Update project task
 * تحديث مهمة مشروع
 */
export async function updateProjectTask(
  projectId: string,
  taskId: string,
  data: Partial<ProjectTask>
): Promise<ApiResponse<ProjectTask>> {
  return apiClient.put<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, data)
}

/**
 * Delete project task
 * حذف مهمة مشروع
 */
export async function deleteProjectTask(
  projectId: string,
  taskId: string
): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/projects/${projectId}/tasks/${taskId}`)
}

/**
 * Update project status
 * تحديث حالة المشروع
 */
export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<ApiResponse<Project>> {
  return apiClient.patch<Project>(`/projects/${id}`, { status })
}

/**
 * Get projects by status
 * الحصول على المشاريع حسب الحالة
 */
export async function getProjectsByStatus(
  status: ProjectStatus,
  params?: PaginatedRequest
): Promise<ApiResponse<ProjectListResponse>> {
  return apiClient.get<ProjectListResponse>('/projects', {
    query: { ...params, filters: { status } } as Record<string, string | number | boolean>,
  })
}

/**
 * Get project statistics
 * الحصول على إحصائيات المشاريع
 */
export async function getProjectStatistics(): Promise<ApiResponse<ProjectStatistics>> {
  return apiClient.get<ProjectStatistics>('/projects/statistics')
}

export interface ProjectStatistics {
  total: number
  byStatus: Record<ProjectStatus, number>
  totalBudget: number
  totalActualCost: number
  averageProgress: number
  onTimeProjects: number
  delayedProjects: number
}

/**
 * Export projects
 * تصدير المشاريع
 */
export async function exportProjects(
  format: 'csv' | 'xlsx' | 'pdf',
  params?: FilteredRequest
): Promise<ApiResponse<{ url: string; filename: string }>> {
  return apiClient.post<{ url: string; filename: string }>('/projects/export', {
    format,
    ...params,
  })
}

