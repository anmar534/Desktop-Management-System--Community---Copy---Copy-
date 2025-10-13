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

  /**
   * إنشاء مشروع من مناقصة
   */
  async createProjectFromTender(tenderId: string, additionalData?: Partial<CreateProjectRequest>): Promise<EnhancedProject> {
    try {
      // جلب بيانات المناقصة
      const tenderData = await this.getTenderData(tenderId)

      if (!tenderData) {
        throw new Error('المناقصة غير موجودة')
      }

      // إنشاء بيانات المشروع من المناقصة
      const projectData: CreateProjectRequest = {
        name: tenderData.title,
        nameEn: tenderData.titleEn,
        description: tenderData.description,
        startDate: tenderData.startDate,
        endDate: tenderData.endDate,
        priority: 'high', // المشاريع من المناقصات عادة عالية الأولوية
        category: tenderData.category || 'construction',
        tags: ['من_مناقصة', tenderData.category || 'عام'],
        client: tenderData.client,
        location: tenderData.location,
        budget: {
          total: tenderData.value,
          spent: 0,
          remaining: tenderData.value,
          contingency: tenderData.value * 0.1, // 10% طوارئ افتراضي
          currency: tenderData.currency || 'SAR'
        },
        team: {
          projectManager: 'مدير المشروع', // سيتم تحديده لاحقاً
          members: []
        },
        phases: this.createPhasesFromTender(tenderData),
        milestones: this.createMilestonesFromTender(tenderData),
        risks: this.createDefaultRisks(),
        metadata: {
          tenderId,
          importedFromTender: true,
          tenderValue: tenderData.value,
          boqItems: tenderData.boq?.length || 0,
          requirements: tenderData.requirements || [],
          deliverables: tenderData.deliverables || []
        },
        ...additionalData // دمج البيانات الإضافية
      }

      const project = await this.createProject(projectData)

      // إنشاء المهام من جدول الكميات إذا كان متوفراً
      if (tenderData.boq && tenderData.boq.length > 0) {
        await this.createTasksFromBoq(project.id, tenderData.boq)
      }

      return project
    } catch (error) {
      console.error('خطأ في إنشاء مشروع من مناقصة:', error)
      throw new Error('فشل في إنشاء مشروع من مناقصة')
    }
  }

  /**
   * جلب بيانات المناقصة
   */
  private async getTenderData(tenderId: string): Promise<any> {
    // في التطبيق الحقيقي، سيتم جلب البيانات من API المناقصات
    // مؤقتاً سنعيد بيانات تجريبية
    return {
      id: tenderId,
      title: 'مشروع إنشاء مجمع سكني',
      titleEn: 'Residential Complex Construction Project',
      description: 'إنشاء مجمع سكني يتكون من 50 وحدة سكنية مع المرافق المساندة',
      client: 'شركة التطوير العقاري المحدودة',
      value: 15000000,
      currency: 'SAR',
      startDate: '2024-11-01',
      endDate: '2025-10-31',
      location: 'الرياض، المملكة العربية السعودية',
      category: 'construction',
      status: 'won',
      boq: [
        {
          id: '1',
          description: 'أعمال الحفر والأساسات',
          quantity: 1000,
          unit: 'م3',
          unitPrice: 150,
          totalPrice: 150000,
          category: 'earthwork'
        },
        {
          id: '2',
          description: 'أعمال الخرسانة المسلحة',
          quantity: 2500,
          unit: 'م3',
          unitPrice: 800,
          totalPrice: 2000000,
          category: 'concrete'
        }
      ],
      requirements: [
        'الحصول على تراخيص البناء',
        'تطبيق معايير السلامة والأمان',
        'استخدام مواد بناء عالية الجودة'
      ],
      deliverables: [
        'المخططات التنفيذية المعتمدة',
        'تقارير الجودة والسلامة',
        'شهادات الإنجاز والتسليم'
      ],
      timeline: [
        {
          phase: 'التخطيط والتصميم',
          duration: 60,
          dependencies: []
        },
        {
          phase: 'أعمال الحفر والأساسات',
          duration: 90,
          dependencies: ['التخطيط والتصميم']
        },
        {
          phase: 'الهيكل الإنشائي',
          duration: 180,
          dependencies: ['أعمال الحفر والأساسات']
        }
      ]
    }
  }

  /**
   * إنشاء المراحل من بيانات المناقصة
   */
  private createPhasesFromTender(tenderData: any): any[] {
    if (!tenderData.timeline) return []

    const startDate = new Date(tenderData.startDate)
    let currentDate = new Date(startDate)

    return tenderData.timeline.map((phase: any, index: number) => {
      const phaseStartDate = new Date(currentDate)
      const phaseEndDate = new Date(currentDate.getTime() + phase.duration * 24 * 60 * 60 * 1000)

      currentDate = new Date(phaseEndDate)

      return {
        id: `phase_${index + 1}`,
        name: phase.phase,
        description: `مرحلة ${phase.phase} - مدة ${phase.duration} يوم`,
        startDate: phaseStartDate.toISOString(),
        endDate: phaseEndDate.toISOString(),
        status: 'planned',
        progress: 0,
        budget: tenderData.value / tenderData.timeline.length,
        deliverables: [],
        dependencies: phase.dependencies || []
      }
    })
  }

  /**
   * إنشاء المعالم من بيانات المناقصة
   */
  private createMilestonesFromTender(tenderData: any): any[] {
    const milestones = []
    const startDate = new Date(tenderData.startDate)
    const endDate = new Date(tenderData.endDate)
    const duration = endDate.getTime() - startDate.getTime()

    // معلم البداية
    milestones.push({
      id: 'milestone_start',
      title: 'بداية المشروع',
      description: 'نقطة انطلاق المشروع',
      targetDate: tenderData.startDate,
      status: 'pending',
      progress: 0
    })

    // معلم منتصف المشروع
    milestones.push({
      id: 'milestone_mid',
      title: 'منتصف المشروع',
      description: 'مراجعة منتصف المشروع',
      targetDate: new Date(startDate.getTime() + duration / 2).toISOString(),
      status: 'pending',
      progress: 0
    })

    // معلم النهاية
    milestones.push({
      id: 'milestone_end',
      title: 'إنهاء المشروع',
      description: 'تسليم المشروع النهائي',
      targetDate: tenderData.endDate,
      status: 'pending',
      progress: 0
    })

    return milestones
  }

  /**
   * إنشاء المخاطر الافتراضية
   */
  private createDefaultRisks(): any[] {
    return [
      {
        id: 'risk_permits',
        title: 'تأخير في التراخيص',
        description: 'احتمالية تأخير الحصول على التراخيص المطلوبة',
        probability: 'medium',
        impact: 'high',
        status: 'active',
        mitigation: 'التقديم المبكر للتراخيص ومتابعة الجهات المختصة'
      },
      {
        id: 'risk_weather',
        title: 'تأثير الطقس',
        description: 'تأثير الظروف الجوية على سير العمل',
        probability: 'low',
        impact: 'medium',
        status: 'active',
        mitigation: 'وضع خطة بديلة للعمل في الظروف الجوية السيئة'
      },
      {
        id: 'risk_materials',
        title: 'نقص المواد',
        description: 'احتمالية نقص أو تأخير في توريد المواد',
        probability: 'medium',
        impact: 'high',
        status: 'active',
        mitigation: 'التعاقد مع موردين متعددين وإنشاء مخزون احتياطي'
      }
    ]
  }

  /**
   * إنشاء المهام من جدول الكميات
   */
  private async createTasksFromBoq(projectId: string, boq: any[]): Promise<void> {
    // سيتم تطوير هذه الوظيفة لاحقاً عند ربطها بنظام إدارة المهام
    console.log(`إنشاء ${boq.length} مهمة من جدول الكميات للمشروع ${projectId}`)
  }
}

// Export singleton instance
export const enhancedProjectService = new EnhancedProjectService()
