/**
 * 🏗️ ProjectDataService - خدمة إدارة بيانات المشاريع
 *
 * المسؤوليات:
 * ✅ CRUD operations للمشاريع
 * ✅ Load/Save من/إلى localStorage
 * ✅ Cache management
 * ✅ Import/Export functionality
 *
 * Single Responsibility: إدارة بيانات المشاريع فقط
 */

import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type { Project } from '@/data/centralData'
import { APP_EVENTS, emit } from '@/events/bus'

/**
 * خدمة بيانات المشاريع
 */
export class ProjectDataService {
  private static instance: ProjectDataService
  private projectCache = new Map<string, Project>()

  private constructor() {
    this.loadProjects()
  }

  public static getInstance(): ProjectDataService {
    if (!ProjectDataService.instance) {
      ProjectDataService.instance = new ProjectDataService()
    }
    return ProjectDataService.instance
  }

  // ===========================
  // 📊 Data Loading & Caching
  // ===========================

  /**
   * تحميل المشاريع من localStorage
   */
  private loadProjects(): void {
    try {
      const data = safeLocalStorage.getItem(STORAGE_KEYS.PROJECTS)
      if (data) {
        const projects = JSON.parse(data) as Project[]
        this.projectCache.clear()
        projects.forEach((project) => {
          this.projectCache.set(project.id, project)
        })
        console.log(`✅ تم تحميل ${projects.length} مشروع من localStorage`)
      } else {
        console.log('ℹ️ لا توجد مشاريع محفوظة')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل المشاريع:', error)
    }
  }

  /**
   * حفظ المشاريع إلى localStorage
   */
  private saveProjects(): void {
    try {
      const projects = Array.from(this.projectCache.values())
      safeLocalStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
      emit(APP_EVENTS.PROJECTS_UPDATED)
    } catch (error) {
      console.error('❌ خطأ في حفظ المشاريع:', error)
    }
  }

  // ===========================
  // 🔍 Read Operations
  // ===========================

  /**
   * الحصول على جميع المشاريع
   */
  public getProjects(): Project[] {
    return Array.from(this.projectCache.values())
  }

  /**
   * الحصول على مشروع بواسطة ID
   */
  public getProjectById(id: string): Project | null {
    return this.projectCache.get(id) ?? null
  }

  /**
   * البحث في المشاريع
   */
  public searchProjects(query: string): Project[] {
    const lowerQuery = query.toLowerCase()
    return this.getProjects().filter(
      (p) =>
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.projectNumber?.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery),
    )
  }

  // ===========================
  // ✏️ Write Operations
  // ===========================

  /**
   * إنشاء مشروع جديد
   */
  public createProject(projectData: Omit<Project, 'id'>): Project {
    const newProject: Project = {
      ...projectData,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.projectCache.set(newProject.id, newProject)
    this.saveProjects()

    console.log(`✅ تم إنشاء مشروع جديد: ${newProject.name}`)
    return newProject
  }

  /**
   * تحديث مشروع موجود
   */
  public updateProject(id: string, updates: Partial<Project>): Project | null {
    const existing = this.projectCache.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates }
    this.projectCache.set(id, updated)
    this.saveProjects()

    console.log(`🔄 تم تحديث المشروع: ${existing.name}`)
    return updated
  }

  /**
   * حذف مشروع
   * ملاحظة: يجب حذف العلاقات المرتبطة من RelationshipService
   */
  public deleteProject(id: string): boolean {
    const deleted = this.projectCache.delete(id)
    if (deleted) {
      this.saveProjects()
      console.log(`🗑️ تم حذف المشروع: ${id}`)
    }
    return deleted
  }

  /**
   * إنشاء أو تحديث مشروع (Upsert)
   * يحافظ على ID الموجود
   */
  public upsertProject(project: Project): Project {
    const existing = this.projectCache.get(project.id)
    const merged = existing ? { ...existing, ...project } : project
    this.projectCache.set(project.id, merged)
    this.saveProjects()
    return merged
  }

  // ===========================
  // 🔄 Utility Operations
  // ===========================

  /**
   * إعادة تحميل المشاريع من localStorage
   */
  public reloadProjects(): void {
    this.loadProjects()
    emit(APP_EVENTS.PROJECTS_UPDATED)
  }

  /**
   * مسح جميع المشاريع (للتطوير/الاختبار فقط)
   */
  public clearAllProjects(): void {
    this.projectCache.clear()
    this.saveProjects()
    console.log('🗑️ تم مسح جميع المشاريع')
  }

  /**
   * استيراد مشاريع (bulk import)
   * يُستخدم للترحيل من مفاتيح قديمة
   */
  public importProjects(projects: Project[], options: { replace?: boolean } = {}): void {
    if (options.replace) {
      this.projectCache.clear()
    }

    projects.forEach((project) => {
      this.projectCache.set(project.id, project)
    })

    this.saveProjects()
    console.log(`✅ تم استيراد ${projects.length} مشروع`)
  }

  /**
   * الحصول على إحصائيات المشاريع
   */
  public getProjectStats() {
    const projects = this.getProjects()
    const total = projects.length
    const active = projects.filter(
      (p) => p.status === 'active' || p.status === 'in_progress',
    ).length
    const completed = projects.filter((p) => p.status === 'completed').length
    const onHold = projects.filter((p) => p.status === 'on_hold').length

    return {
      total,
      active,
      completed,
      onHold,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    }
  }
}

// Export singleton instance
export const projectDataService = ProjectDataService.getInstance()
