/**
 * Enhanced Project Service
 * طبقة الخدمات المسؤولة عن العمليات المتقدمة لإدارة المشاريع
 */

import type {
  CreateProjectRequest,
  EnhancedProject,
  ProjectFilters,
  ProjectKPI,
  ProjectMetrics,
  ProjectSortOptions,
  ProjectValidationResult,
  TenderProjectLink,
  UpdateProjectRequest,
} from '@/shared/types/projects'
import type { IEnhancedProjectRepository } from '@/repository/enhancedProject.repository'
import { LocalEnhancedProjectRepository } from '@/repository/providers/enhancedProject.local'

class EnhancedProjectService {
  private readonly repository: IEnhancedProjectRepository

  constructor(repository: IEnhancedProjectRepository = new LocalEnhancedProjectRepository()) {
    this.repository = repository
  }

  async getAllProjects(
    filters?: ProjectFilters,
    sort?: ProjectSortOptions,
  ): Promise<EnhancedProject[]> {
    try {
      if (!filters && !sort) {
        return await this.repository.getAll()
      }

      const normalizedFilters: ProjectFilters = filters ? { ...filters } : {}
      return await this.repository.findByFilters(normalizedFilters, sort)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل بيانات المشاريع')
    }
  }

  async getProjectById(projectId: string): Promise<EnhancedProject> {
    try {
      const project = await this.repository.getById(projectId)
      if (!project) {
        throw new Error('المشروع المطلوب غير موجود')
      }
      return project
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل تفاصيل المشروع')
    }
  }

  async createProject(request: CreateProjectRequest): Promise<EnhancedProject> {
    try {
      const normalized = this.normalizeCreateRequest(request)
      return await this.repository.create(normalized)
    } catch (error) {
      throw this.wrapError(error, 'فشل في إنشاء المشروع')
    }
  }

  async updateProject(request: UpdateProjectRequest): Promise<EnhancedProject> {
    if (!request.id) {
      throw new Error('معرّف المشروع مطلوب للتحديث')
    }

    if (typeof request.version !== 'number') {
      throw new Error('رقم الإصدار مطلوب للتحديث')
    }

    try {
      const normalized = this.normalizeUpdateRequest(request)
      const updated = await this.repository.update(normalized)
      if (!updated) {
        throw new Error('تعذر تحديث المشروع المطلوب')
      }
      return updated
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحديث المشروع')
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const deleted = await this.repository.delete(projectId)
      if (!deleted) {
        throw new Error('تعذر العثور على المشروع المطلوب لحذفه')
      }
    } catch (error) {
      throw this.wrapError(error, 'فشل في حذف المشروع')
    }
  }

  async searchProjects(query: string, filters?: ProjectFilters): Promise<EnhancedProject[]> {
    try {
      return await this.repository.search(query, filters)
    } catch (error) {
      throw this.wrapError(error, 'فشل في البحث عن المشاريع')
    }
  }

  async getProjectsByClient(clientId: string): Promise<EnhancedProject[]> {
    try {
      return await this.repository.getByClient(clientId)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل مشاريع العميل')
    }
  }

  async getProjectsByManager(managerId: string): Promise<EnhancedProject[]> {
    try {
      return await this.repository.getByProjectManager(managerId)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل مشاريع مدير المشروع')
    }
  }

  async getProjectsByStatus(status: string[]): Promise<EnhancedProject[]> {
    try {
      return await this.repository.getByStatus(status)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل المشاريع حسب الحالة')
    }
  }

  async getProjectsByPhase(phases: string[]): Promise<EnhancedProject[]> {
    try {
      return await this.repository.getByPhase(phases)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل المشاريع حسب المرحلة')
    }
  }

  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      return await this.repository.getProjectMetrics(projectId)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل مؤشرات المشروع')
    }
  }

  async getProjectKPIs(projectId: string): Promise<ProjectKPI[]> {
    try {
      return await this.repository.getProjectKPIs(projectId)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل مؤشرات الأداء الرئيسية للمشروع')
    }
  }

  async getPortfolioMetrics(filters?: ProjectFilters): Promise<ProjectMetrics[]> {
    try {
      return await this.repository.getPortfolioMetrics(filters)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل مؤشرات المحفظة')
    }
  }

  async validateProject(
    request: CreateProjectRequest | UpdateProjectRequest,
  ): Promise<ProjectValidationResult> {
    try {
      return await this.repository.validateProject(request)
    } catch (error) {
      throw this.wrapError(error, 'فشل في التحقق من صحة بيانات المشروع')
    }
  }

  async checkNameUniqueness(name: string, excludeId?: string): Promise<boolean> {
    try {
      return await this.repository.checkNameUniqueness(name, excludeId)
    } catch (error) {
      throw this.wrapError(error, 'فشل في التحقق من اسم المشروع')
    }
  }

  async checkCodeUniqueness(code: string, excludeId?: string): Promise<boolean> {
    try {
      return await this.repository.checkCodeUniqueness(code, excludeId)
    } catch (error) {
      throw this.wrapError(error, 'فشل في التحقق من كود المشروع')
    }
  }

  async linkProjectToTender(
    projectId: string,
    tenderId: string,
    linkType: string,
  ): Promise<TenderProjectLink> {
    try {
      return await this.repository.linkToTender(projectId, tenderId, linkType)
    } catch (error) {
      throw this.wrapError(error, 'فشل في ربط المشروع بالمناقصة')
    }
  }

  async unlinkProjectFromTender(projectId: string, tenderId: string): Promise<void> {
    try {
      const unlinked = await this.repository.unlinkFromTender(projectId, tenderId)
      if (!unlinked) {
        throw new Error('تعذر فك الارتباط بالمناقصة المطلوبة')
      }
    } catch (error) {
      throw this.wrapError(error, 'فشل في فك ارتباط المشروع بالمناقصة')
    }
  }

  async getProjectsFromTender(tenderId: string): Promise<EnhancedProject[]> {
    try {
      return await this.repository.getProjectsFromTender(tenderId)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل المشاريع المرتبطة بالمناقصة')
    }
  }

  async reloadProjects(): Promise<EnhancedProject[]> {
    try {
      return await this.repository.reload()
    } catch (error) {
      throw this.wrapError(error, 'فشل في إعادة تحميل المشاريع')
    }
  }

  async getStatistics(): Promise<{
    total: number
    byStatus: Record<string, number>
    byPhase: Record<string, number>
    byPriority: Record<string, number>
    byHealth: Record<string, number>
  }> {
    try {
      return await this.repository.getStatistics()
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل إحصائيات المشاريع')
    }
  }

  private normalizeCreateRequest(request: CreateProjectRequest): CreateProjectRequest {
    return {
      ...request,
      name: request.name.trim(),
      description: request.description.trim(),
      location: request.location.trim(),
      category: request.category.trim(),
      type: request.type.trim(),
      tags: request.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
    }
  }

  private normalizeUpdateRequest(request: UpdateProjectRequest): UpdateProjectRequest {
    return {
      ...request,
      name: request.name?.trim(),
      description: request.description?.trim(),
      location: request.location?.trim(),
      category: request.category?.trim(),
      type: request.type?.trim(),
      tags: request.tags?.map((tag) => tag.trim()).filter(Boolean),
    }
  }

  private wrapError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error && error.message) {
      return error
    }
    return new Error(fallbackMessage)
  }
}

export const enhancedProjectService = new EnhancedProjectService()
