/**
 * Enhanced Project Service
 * Business logic layer for enhanced project management
 */

import type { 
  EnhancedProject, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectFilters,
  ProjectSortOptions,
  ProjectMetrics,
  ProjectKPI,
  ProjectValidationResult,
  TenderProjectLink
} from '../types/projects'
import { LocalEnhancedProjectRepository } from '../repository/providers/enhancedProject.local'

export class EnhancedProjectService {
  private repository: LocalEnhancedProjectRepository

  constructor() {
    this.repository = new LocalEnhancedProjectRepository()
  }

  // Basic CRUD Operations
  async getAllProjects(): Promise<EnhancedProject[]> {
    try {
      return await this.repository.getAll()
    } catch (error) {
      console.error('Error getting all projects:', error)
      throw new Error('فشل في جلب المشاريع')
    }
  }

  async getProjectById(id: string): Promise<EnhancedProject | null> {
    try {
      if (!id) {
        throw new Error('معرف المشروع مطلوب')
      }
      return await this.repository.getById(id)
    } catch (error) {
      console.error('Error getting project by id:', error)
      throw new Error('فشل في جلب المشروع')
    }
  }

  async createProject(data: CreateProjectRequest): Promise<EnhancedProject> {
    try {
      // Validate input
      const validation = await this.repository.validateProject(data)
      if (!validation.isValid) {
        throw new Error(`فشل في التحقق: ${validation.errors.join(', ')}`)
      }

      // Check name uniqueness
      const isNameUnique = await this.repository.checkNameUniqueness(data.name)
      if (!isNameUnique) {
        throw new Error('اسم المشروع موجود بالفعل')
      }

      return await this.repository.create(data)
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  async updateProject(data: UpdateProjectRequest): Promise<EnhancedProject | null> {
    try {
      // Validate input
      const validation = await this.repository.validateProject(data)
      if (!validation.isValid) {
        throw new Error(`فشل في التحقق: ${validation.errors.join(', ')}`)
      }

      // Check name uniqueness if name is being updated
      if (data.name) {
        const isNameUnique = await this.repository.checkNameUniqueness(data.name, data.id)
        if (!isNameUnique) {
          throw new Error('اسم المشروع موجود بالفعل')
        }
      }

      return await this.repository.update(data)
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error('معرف المشروع مطلوب')
      }

      // Check if project exists
      const project = await this.repository.getById(id)
      if (!project) {
        throw new Error('المشروع غير موجود')
      }

      // Check if project can be deleted (business rules)
      if (project.status === 'active' && project.progress > 0) {
        throw new Error('لا يمكن حذف مشروع نشط قيد التنفيذ')
      }

      return await this.repository.delete(id)
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  // Advanced Query Operations
  async searchProjects(filters: ProjectFilters, sort?: ProjectSortOptions): Promise<EnhancedProject[]> {
    try {
      return await this.repository.findByFilters(filters, sort)
    } catch (error) {
      console.error('Error searching projects:', error)
      throw new Error('فشل في البحث عن المشاريع')
    }
  }

  async getProjectsByClient(clientId: string): Promise<EnhancedProject[]> {
    try {
      if (!clientId) {
        throw new Error('معرف العميل مطلوب')
      }
      return await this.repository.getByClient(clientId)
    } catch (error) {
      console.error('Error getting projects by client:', error)
      throw new Error('فشل في جلب مشاريع العميل')
    }
  }

  async getProjectsByManager(managerId: string): Promise<EnhancedProject[]> {
    try {
      if (!managerId) {
        throw new Error('معرف مدير المشروع مطلوب')
      }
      return await this.repository.getByProjectManager(managerId)
    } catch (error) {
      console.error('Error getting projects by manager:', error)
      throw new Error('فشل في جلب مشاريع المدير')
    }
  }

  async getActiveProjects(): Promise<EnhancedProject[]> {
    try {
      return await this.repository.getByStatus(['active', 'planning'])
    } catch (error) {
      console.error('Error getting active projects:', error)
      throw new Error('فشل في جلب المشاريع النشطة')
    }
  }

  async getCompletedProjects(): Promise<EnhancedProject[]> {
    try {
      return await this.repository.getByStatus(['completed'])
    } catch (error) {
      console.error('Error getting completed projects:', error)
      throw new Error('فشل في جلب المشاريع المكتملة')
    }
  }

  async getDelayedProjects(): Promise<EnhancedProject[]> {
    try {
      return await this.repository.getByStatus(['delayed'])
    } catch (error) {
      console.error('Error getting delayed projects:', error)
      throw new Error('فشل في جلب المشاريع المتأخرة')
    }
  }

  // Tender Integration
  async createProjectFromTender(tenderId: string, projectData: Partial<CreateProjectRequest>): Promise<EnhancedProject> {
    try {
      if (!tenderId) {
        throw new Error('معرف المناقصة مطلوب')
      }

      // TODO: Get tender details and populate project data
      const fullProjectData: CreateProjectRequest = {
        name: projectData.name || `مشروع من المناقصة ${tenderId}`,
        nameEn: projectData.nameEn,
        description: projectData.description || 'مشروع تم إنشاؤه من مناقصة',
        clientId: projectData.clientId || '',
        projectManagerId: projectData.projectManagerId || '',
        startDate: projectData.startDate || new Date().toISOString(),
        endDate: projectData.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        budget: projectData.budget || 0,
        location: projectData.location || '',
        category: projectData.category || 'general',
        type: projectData.type || 'construction',
        priority: projectData.priority || 'medium',
        tags: projectData.tags || ['من-مناقصة'],
        fromTenderId: tenderId
      }

      return await this.createProject(fullProjectData)
    } catch (error) {
      console.error('Error creating project from tender:', error)
      throw error
    }
  }

  // Analytics and Reporting
  async getProjectStatistics(): Promise<{
    total: number
    byStatus: Record<string, number>
    byPhase: Record<string, number>
    byPriority: Record<string, number>
    byHealth: Record<string, number>
  }> {
    try {
      return await this.repository.getStatistics()
    } catch (error) {
      console.error('Error getting project statistics:', error)
      throw new Error('فشل في جلب إحصائيات المشاريع')
    }
  }

  async getProjectsOverview(): Promise<{
    totalProjects: number
    activeProjects: number
    completedProjects: number
    delayedProjects: number
    totalBudget: number
    spentBudget: number
    averageProgress: number
  }> {
    try {
      const projects = await this.getAllProjects()
      
      const overview = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        delayedProjects: projects.filter(p => p.status === 'delayed').length,
        totalBudget: projects.reduce((sum, p) => sum + p.budget.totalBudget, 0),
        spentBudget: projects.reduce((sum, p) => sum + p.budget.spentBudget, 0),
        averageProgress: projects.length > 0 
          ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length 
          : 0
      }

      return overview
    } catch (error) {
      console.error('Error getting projects overview:', error)
      throw new Error('فشل في جلب نظرة عامة على المشاريع')
    }
  }

  // Utility Methods
  async validateProjectData(data: CreateProjectRequest | UpdateProjectRequest): Promise<ProjectValidationResult> {
    try {
      return await this.repository.validateProject(data)
    } catch (error) {
      console.error('Error validating project data:', error)
      return {
        isValid: false,
        errors: ['فشل في التحقق من البيانات'],
        warnings: []
      }
    }
  }

  async isProjectNameUnique(name: string, excludeId?: string): Promise<boolean> {
    try {
      return await this.repository.checkNameUniqueness(name, excludeId)
    } catch (error) {
      console.error('Error checking name uniqueness:', error)
      return false
    }
  }

  async exportProjects(filters?: ProjectFilters): Promise<EnhancedProject[]> {
    try {
      return await this.repository.exportMany(filters)
    } catch (error) {
      console.error('Error exporting projects:', error)
      throw new Error('فشل في تصدير المشاريع')
    }
  }

  // Project Status Management
  async updateProjectStatus(projectId: string, status: string): Promise<EnhancedProject | null> {
    try {
      const project = await this.getProjectById(projectId)
      if (!project) {
        throw new Error('المشروع غير موجود')
      }

      return await this.updateProject({
        id: projectId,
        status: status as any,
        version: project.version
      })
    } catch (error) {
      console.error('Error updating project status:', error)
      throw error
    }
  }

  async updateProjectProgress(projectId: string, progress: number): Promise<EnhancedProject | null> {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error('نسبة التقدم يجب أن تكون بين 0 و 100')
      }

      const project = await this.getProjectById(projectId)
      if (!project) {
        throw new Error('المشروع غير موجود')
      }

      // Auto-update status based on progress
      let newStatus = project.status
      if (progress === 0 && project.status === 'active') {
        newStatus = 'planning'
      } else if (progress > 0 && progress < 100 && project.status === 'planning') {
        newStatus = 'active'
      } else if (progress === 100) {
        newStatus = 'completed'
      }

      return await this.updateProject({
        id: projectId,
        progress,
        status: newStatus,
        version: project.version
      })
    } catch (error) {
      console.error('Error updating project progress:', error)
      throw error
    }
  }
}

// Export singleton instance
export const enhancedProjectService = new EnhancedProjectService()
