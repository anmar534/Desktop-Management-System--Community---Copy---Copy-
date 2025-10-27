/**
 * Enhanced Project Repository Implementation
 * Local storage implementation for enhanced project management
 */

import type { IEnhancedProjectRepository } from '../enhancedProject.repository'
import type {
  EnhancedProject,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
  ProjectSortOptions,
  ProjectMetrics,
  ProjectKPI,
  ProjectValidationResult,
  TenderProjectLink,
  ProjectBudget,
  ProjectTeam,
  ProjectPhase,
} from '../../types/projects'
import type { Status, Health } from '../../types/contracts'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { APP_EVENTS, emit } from '@/events/bus'

const ENHANCED_PROJECTS_KEY = 'enhanced_projects'

const generateId = () => `project_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
const generateCode = () => `PRJ-${Date.now().toString().slice(-6)}`

export class LocalEnhancedProjectRepository implements IEnhancedProjectRepository {
  // Basic CRUD Operations
  async getAll(): Promise<EnhancedProject[]> {
    try {
      const projects = safeLocalStorage.getItem<EnhancedProject[]>(ENHANCED_PROJECTS_KEY, [])
      return this.initializeDefaultProjects(projects)
    } catch (error) {
      console.error('Error getting all projects:', error)
      return []
    }
  }

  async getById(id: string): Promise<EnhancedProject | null> {
    try {
      const projects = await this.getAll()
      return projects.find((project) => project.id === id) || null
    } catch (error) {
      console.error('Error getting project by id:', error)
      return null
    }
  }

  async create(data: CreateProjectRequest): Promise<EnhancedProject> {
    try {
      const projects = await this.getAll()

      // Validate the request
      const validation = await this.validateProject(data)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      const now = new Date().toISOString()
      const projectId = generateId()

      // Create enhanced project with all required fields
      const enhancedProject: EnhancedProject = {
        id: projectId,
        name: data.name,
        nameEn: data.nameEn,
        description: data.description,
        code: generateCode(),

        // Client Information
        client: '', // Will be populated from clientId
        clientId: data.clientId,
        clientContact: '',
        clientContactId: undefined,

        // Status and Progress
        status: 'planning' as Status,
        priority: data.priority,
        health: 'green' as Health,
        progress: 0,
        phase: 'initiation',
        phaseId: 'phase_initiation',

        // Dates
        startDate: data.startDate,
        endDate: data.endDate,
        actualStartDate: undefined,
        actualEndDate: undefined,
        createdAt: now,
        updatedAt: now,

        // Location and Classification
        location: data.location,
        address: undefined,
        coordinates: undefined,
        category: data.category,
        type: data.type,
        tags: data.tags || [],

        // Financial Information
        budget: this.createDefaultBudget(projectId, data.budget),
        contractValue: data.budget,
        profitMargin: 0,

        // Team and Resources
        team: this.createDefaultTeam(projectId, data.projectManagerId),

        // Planning and Execution
        phases: this.createDefaultPhases(),
        milestones: [],
        risks: [],

        // Tender Integration
        tenderLink: data.fromTenderId
          ? {
              id: generateId(),
              tenderId: data.fromTenderId,
              projectId: projectId,
              linkType: 'created_from',
              linkDate: now,
              metadata: {},
            }
          : undefined,
        fromTender: undefined,

        // Documentation
        attachments: [],
        notes: '',

        // Metadata
        metadata: {},

        // Audit Trail
        createdBy: 'current_user', // TODO: Get from auth context
        lastModifiedBy: 'current_user',
        version: 1,
      }

      projects.push(enhancedProject)
      safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, projects)
      // Projects updated

      return enhancedProject
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  async update(data: UpdateProjectRequest): Promise<EnhancedProject | null> {
    try {
      const projects = await this.getAll()
      const index = projects.findIndex((p) => p.id === data.id)

      if (index === -1) {
        return null
      }

      const existingProject = projects[index]

      // Version check for optimistic locking
      if (existingProject.version !== data.version) {
        throw new Error('Project has been modified by another user. Please refresh and try again.')
      }

      // Validate the update
      const validation = await this.validateProject(data)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      const now = new Date().toISOString()

      // Update the project
      const updatedProject: EnhancedProject = {
        ...existingProject,
        ...data,
        id: existingProject.id, // Ensure ID doesn't change
        updatedAt: now,
        lastModifiedBy: 'current_user', // TODO: Get from auth context
        version: existingProject.version + 1,
      }

      projects[index] = updatedProject
      safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, projects)
      // Projects updated

      return updatedProject
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const projects = await this.getAll()
      const index = projects.findIndex((p) => p.id === id)

      if (index === -1) {
        return false
      }

      projects.splice(index, 1)
      safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, projects)
      // Projects updated

      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  // Advanced Query Operations
  async findByFilters(
    filters: ProjectFilters,
    sort?: ProjectSortOptions,
  ): Promise<EnhancedProject[]> {
    try {
      let projects = await this.getAll()

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        projects = projects.filter((p) => filters.status!.includes(p.status))
      }

      if (filters.priority && filters.priority.length > 0) {
        projects = projects.filter((p) => filters.priority!.includes(p.priority))
      }

      if (filters.health && filters.health.length > 0) {
        projects = projects.filter((p) => filters.health!.includes(p.health))
      }

      if (filters.phase && filters.phase.length > 0) {
        projects = projects.filter((p) => filters.phase!.includes(p.phase))
      }

      if (filters.category && filters.category.length > 0) {
        projects = projects.filter((p) => filters.category!.includes(p.category))
      }

      if (filters.client && filters.client.length > 0) {
        projects = projects.filter((p) => filters.client!.includes(p.clientId))
      }

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        projects = projects.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term) ||
            p.location.toLowerCase().includes(term),
        )
      }

      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start)
        const end = new Date(filters.dateRange.end)
        projects = projects.filter((p) => {
          const projectStart = new Date(p.startDate)
          return projectStart >= start && projectStart <= end
        })
      }

      if (filters.budgetRange) {
        projects = projects.filter(
          (p) =>
            p.budget.totalBudget >= filters.budgetRange!.min &&
            p.budget.totalBudget <= filters.budgetRange!.max,
        )
      }

      if (filters.tags && filters.tags.length > 0) {
        projects = projects.filter((p) => filters.tags!.some((tag) => p.tags.includes(tag)))
      }

      // Apply sorting
      if (sort) {
        projects.sort((a, b) => {
          let aValue: string | number | Date
          let bValue: string | number | Date

          switch (sort.field) {
            case 'name':
              aValue = a.name
              bValue = b.name
              break
            case 'startDate':
              aValue = new Date(a.startDate)
              bValue = new Date(b.startDate)
              break
            case 'endDate':
              aValue = new Date(a.endDate)
              bValue = new Date(b.endDate)
              break
            case 'budget':
              aValue = a.budget.totalBudget
              bValue = b.budget.totalBudget
              break
            case 'progress':
              aValue = a.progress
              bValue = b.progress
              break
            default:
              aValue = a[sort.field]
              bValue = b[sort.field]
          }

          if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1
          if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1
          return 0
        })
      }

      return projects
    } catch (error) {
      console.error('Error filtering projects:', error)
      return []
    }
  }

  async search(query: string, filters?: ProjectFilters): Promise<EnhancedProject[]> {
    const searchFilters: ProjectFilters = {
      ...filters,
      searchTerm: query,
    }
    return this.findByFilters(searchFilters)
  }

  async getByClient(clientId: string): Promise<EnhancedProject[]> {
    return this.findByFilters({ client: [clientId] })
  }

  async getByProjectManager(managerId: string): Promise<EnhancedProject[]> {
    const projects = await this.getAll()
    return projects.filter((p) => p.team.projectManager.id === managerId)
  }

  async getByStatus(status: string[]): Promise<EnhancedProject[]> {
    return this.findByFilters({ status: status as Status[] })
  }

  async getByPhase(phase: string[]): Promise<EnhancedProject[]> {
    return this.findByFilters({ phase })
  }

  // Helper methods
  private createDefaultBudget(projectId: string, totalBudget: number): ProjectBudget {
    return {
      id: generateId(),
      projectId,
      totalBudget,
      allocatedBudget: totalBudget,
      spentBudget: 0,
      remainingBudget: totalBudget,
      contingencyBudget: totalBudget * 0.1, // 10% contingency
      categories: [],
      approvals: [],
      lastUpdated: new Date().toISOString(),
    }
  }

  private createDefaultTeam(projectId: string, projectManagerId: string): ProjectTeam {
    return {
      id: generateId(),
      projectId,
      projectManager: {
        id: projectManagerId,
        name: 'Project Manager', // TODO: Get from user service
        email: '',
        phone: '',
        role: 'Project Manager',
        department: 'Projects',
        responsibilities: ['Project Planning', 'Team Management', 'Client Communication'],
        startDate: new Date().toISOString(),
        isActive: true,
      },
      members: [],
      consultants: [],
      contractors: [],
      lastUpdated: new Date().toISOString(),
    }
  }

  private createDefaultPhases(): ProjectPhase[] {
    return [
      {
        id: 'phase_initiation',
        name: 'البدء',
        nameEn: 'Initiation',
        order: 1,
        description: 'مرحلة بدء المشروع وتحديد المتطلبات',
        estimatedDuration: 14,
        dependencies: [],
        milestones: [],
      },
      {
        id: 'phase_planning',
        name: 'التخطيط',
        nameEn: 'Planning',
        order: 2,
        description: 'مرحلة التخطيط التفصيلي للمشروع',
        estimatedDuration: 21,
        dependencies: ['phase_initiation'],
        milestones: [],
      },
      {
        id: 'phase_execution',
        name: 'التنفيذ',
        nameEn: 'Execution',
        order: 3,
        description: 'مرحلة تنفيذ المشروع',
        estimatedDuration: 90,
        dependencies: ['phase_planning'],
        milestones: [],
      },
      {
        id: 'phase_closure',
        name: 'الإغلاق',
        nameEn: 'Closure',
        order: 4,
        description: 'مرحلة إغلاق المشروع وتسليم النتائج',
        estimatedDuration: 7,
        dependencies: ['phase_execution'],
        milestones: [],
      },
    ]
  }

  private async initializeDefaultProjects(projects: EnhancedProject[]): Promise<EnhancedProject[]> {
    if (projects.length === 0) {
      // Create sample projects for development
      const sampleProjects: EnhancedProject[] = []
      this.persist(sampleProjects)
      return sampleProjects
    }
    return projects
  }

  private persist(projects: EnhancedProject[]): void {
    safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, projects)
  }

  // Placeholder implementations for remaining methods
  async createFromTender(
    _tenderId: string,
    _projectData: Partial<CreateProjectRequest>,
  ): Promise<EnhancedProject> {
    throw new Error('Method not implemented.')
  }

  /**
   * ربط مشروع بمنافسة
   */
  async linkToTender(
    projectId: string,
    tenderId: string,
    linkType = 'created_from',
  ): Promise<TenderProjectLink> {
    try {
      // 1. التحقق من وجود المشروع
      const projects = await this.getAll()
      const projectIndex = projects.findIndex((p) => p.id === projectId)

      if (projectIndex === -1) {
        throw new Error(`Project not found: ${projectId}`)
      }

      // 2. التحقق من عدم وجود ربط سابق
      if (projects[projectIndex].tenderLink) {
        throw new Error(
          `Project ${projectId} is already linked to tender ${projects[projectIndex].tenderLink?.tenderId}`,
        )
      }

      // 3. إنشاء الربط
      const link: TenderProjectLink = {
        id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tenderId,
        projectId,
        linkType: linkType as 'created_from' | 'related_to' | 'derived_from',
        linkDate: new Date().toISOString(),
        metadata: {
          createdBy: 'system',
          source: 'manual_link',
        },
      }

      // 4. حفظ الربط
      projects[projectIndex].tenderLink = link

      // 5. Persist التغييرات
      safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, projects)
      // Projects updated

      console.log(`✅ Project ${projectId} linked to tender ${tenderId}`)
      return link
    } catch (error) {
      console.error('Error linking project to tender:', error)
      throw error
    }
  }

  /**
   * فك ربط مشروع من منافسة
   */
  async unlinkFromTender(projectId: string, tenderId: string): Promise<boolean> {
    try {
      // 1. تحميل المشاريع
      const projects = await this.getAll()
      const projectIndex = projects.findIndex((p) => p.id === projectId)

      // 2. التحقق من وجود المشروع
      if (projectIndex === -1) {
        console.warn(`Project not found: ${projectId}`)
        return false
      }

      const project = projects[projectIndex]

      // 3. التحقق من وجود ربط
      if (!project.tenderLink) {
        console.warn(`Project ${projectId} has no tender link`)
        return false
      }

      // 4. التحقق من تطابق المنافسة
      if (project.tenderLink.tenderId !== tenderId) {
        console.warn(
          `Project ${projectId} is linked to different tender: ${project.tenderLink.tenderId}`,
        )
        return false
      }

      // 5. حذف الربط
      delete projects[projectIndex].tenderLink

      // 6. Persist
      safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, projects)
      // Projects updated

      console.log(`✅ Project ${projectId} unlinked from tender ${tenderId}`)
      return true
    } catch (error) {
      console.error('Error unlinking project from tender:', error)
      return false
    }
  }

  /**
   * الحصول على جميع المشاريع المرتبطة بمنافسة
   */
  async getProjectsFromTender(tenderId: string): Promise<EnhancedProject[]> {
    try {
      const projects = await this.getAll()

      // البحث في كل من tenderLink و fromTender
      const linkedProjects = projects.filter(
        (project) =>
          project.tenderLink?.tenderId === tenderId || project.fromTender?.tenderId === tenderId,
      )

      console.log(`✅ Found ${linkedProjects.length} projects for tender ${tenderId}`)
      return linkedProjects
    } catch (error) {
      console.error('Error getting projects from tender:', error)
      return []
    }
  }

  /**
   * الحصول على معلومات الربط بالمنافسة
   */
  async getTenderLink(projectId: string): Promise<TenderProjectLink | null> {
    try {
      const projects = await this.getAll()
      const project = projects.find((p) => p.id === projectId)

      if (!project) {
        return null
      }

      return project.tenderLink || null
    } catch (error) {
      console.error('Error getting tender link:', error)
      return null
    }
  }

  async getProjectMetrics(_projectId: string): Promise<ProjectMetrics> {
    throw new Error('Method not implemented.')
  }

  async getProjectKPIs(_projectId: string): Promise<ProjectKPI[]> {
    throw new Error('Method not implemented.')
  }

  async getPortfolioMetrics(_filters?: ProjectFilters): Promise<ProjectMetrics[]> {
    throw new Error('Method not implemented.')
  }

  async validateProject(
    data: CreateProjectRequest | UpdateProjectRequest,
  ): Promise<ProjectValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('اسم المشروع مطلوب')
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('وصف المشروع مطلوب')
    }

    if (!data.clientId) {
      errors.push('العميل مطلوب')
    }

    if (!data.startDate) {
      errors.push('تاريخ البدء مطلوب')
    }

    if (!data.endDate) {
      errors.push('تاريخ الانتهاء مطلوب')
    }

    if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
      errors.push('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء')
    }

    if (!data.budget || data.budget <= 0) {
      errors.push('الميزانية يجب أن تكون أكبر من صفر')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  async checkNameUniqueness(name: string, excludeId?: string): Promise<boolean> {
    const projects = await this.getAll()
    return !projects.some((p) => p.name === name && p.id !== excludeId)
  }

  async checkCodeUniqueness(code: string, excludeId?: string): Promise<boolean> {
    const projects = await this.getAll()
    return !projects.some((p) => p.code === code && p.id !== excludeId)
  }

  async importMany(
    projects: CreateProjectRequest[],
    options?: { replace?: boolean },
  ): Promise<EnhancedProject[]> {
    throw new Error('Method not implemented.')
  }

  async exportMany(filters?: ProjectFilters): Promise<EnhancedProject[]> {
    return this.findByFilters(filters || {})
  }

  async bulkUpdate(
    updates: { id: string; data: Partial<UpdateProjectRequest> }[],
  ): Promise<EnhancedProject[]> {
    throw new Error('Method not implemented.')
  }

  async bulkDelete(ids: string[]): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async reload(): Promise<EnhancedProject[]> {
    return this.getAll()
  }

  async getStatistics(): Promise<{
    total: number
    byStatus: Record<string, number>
    byPhase: Record<string, number>
    byPriority: Record<string, number>
    byHealth: Record<string, number>
  }> {
    const projects = await this.getAll()

    const stats = {
      total: projects.length,
      byStatus: {} as Record<string, number>,
      byPhase: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byHealth: {} as Record<string, number>,
    }

    projects.forEach((project) => {
      // Count by status
      stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1

      // Count by phase
      stats.byPhase[project.phase] = (stats.byPhase[project.phase] || 0) + 1

      // Count by priority
      stats.byPriority[project.priority] = (stats.byPriority[project.priority] || 0) + 1

      // Count by health
      stats.byHealth[project.health] = (stats.byHealth[project.health] || 0) + 1
    })

    return stats
  }
}

// Export default instance for service registry
export default new LocalEnhancedProjectRepository()
