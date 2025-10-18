/**
 * Local Task Repository Implementation
 * تنفيذ مستودع المهام المحلي
 */

import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskFilters, 
  TaskSortOptions, 
  TaskStatistics,
  TaskDependency,
  TaskComment,
  TaskAttachment,
  TaskTimeEntry,
  TaskStatus,
  TaskPriority
} from '../../types/tasks'
import type { TaskRepository } from '../task.repository'
import { safeLocalStorage } from '../../utils/storage'

class LocalTaskRepository implements TaskRepository {
  private readonly STORAGE_KEY = 'tasks'
  private readonly DEPENDENCIES_KEY = 'task_dependencies'
  private readonly COMMENTS_KEY = 'task_comments'
  private readonly ATTACHMENTS_KEY = 'task_attachments'
  private readonly TIME_ENTRIES_KEY = 'task_time_entries'

  constructor() {
    this.initializeDefaultData()
  }

  /**
   * تهيئة البيانات الافتراضية
   */
  private initializeDefaultData(): void {
    const existingTasks = safeLocalStorage.getItem(this.STORAGE_KEY)
    if (!existingTasks) {
      const defaultTasks: Task[] = []
      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultTasks))
    }

    // تهيئة المفاتيح الأخرى
    if (!safeLocalStorage.getItem(this.DEPENDENCIES_KEY)) {
      safeLocalStorage.setItem(this.DEPENDENCIES_KEY, JSON.stringify([]))
    }
    if (!safeLocalStorage.getItem(this.COMMENTS_KEY)) {
      safeLocalStorage.setItem(this.COMMENTS_KEY, JSON.stringify([]))
    }
    if (!safeLocalStorage.getItem(this.ATTACHMENTS_KEY)) {
      safeLocalStorage.setItem(this.ATTACHMENTS_KEY, JSON.stringify([]))
    }
    if (!safeLocalStorage.getItem(this.TIME_ENTRIES_KEY)) {
      safeLocalStorage.setItem(this.TIME_ENTRIES_KEY, JSON.stringify([]))
    }
  }

  /**
   * الحصول على جميع المهام
   */
  async getAll(filters?: TaskFilters, sort?: TaskSortOptions): Promise<Task[]> {
    try {
      const tasksData = safeLocalStorage.getItem(this.STORAGE_KEY)
      let tasks: Task[] = tasksData ? JSON.parse(tasksData) : []

      // تطبيق الفلاتر
      if (filters) {
        tasks = this.applyFilters(tasks, filters)
      }

      // تطبيق الترتيب
      if (sort) {
        tasks = this.applySorting(tasks, sort)
      }

      return tasks
    } catch (error) {
      console.error('خطأ في الحصول على المهام:', error)
      throw new Error('فشل في تحميل المهام من التخزين المحلي')
    }
  }

  /**
   * الحصول على مهمة بالمعرف
   */
  async getById(id: string): Promise<Task | null> {
    try {
      const tasks = await this.getAll()
      return tasks.find(task => task.id === id) || null
    } catch (error) {
      console.error('خطأ في الحصول على المهمة:', error)
      throw new Error('فشل في تحميل المهمة')
    }
  }

  /**
   * إنشاء مهمة جديدة
   */
  async create(request: CreateTaskRequest): Promise<Task> {
    try {
      const tasks = await this.getAll()
      
      const newTask: Task = {
        id: this.generateId(),
        ...request,
        status: 'not_started',
        progress: 0,
        actualHours: 0,
        actualCost: 0,
        dependencies: [],
        subtasks: [],
        attachments: [],
        comments: [],
        timeEntries: [],
        tags: request.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current_user', // يجب الحصول على المستخدم الحالي
        lastModifiedBy: 'current_user',
        version: 1
      }

      tasks.push(newTask)
      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks))

      return newTask
    } catch (error) {
      console.error('خطأ في إنشاء المهمة:', error)
      throw new Error('فشل في إنشاء المهمة')
    }
  }

  /**
   * تحديث مهمة
   */
  async update(request: UpdateTaskRequest): Promise<Task> {
    try {
      const tasks = await this.getAll()
      const taskIndex = tasks.findIndex(task => task.id === request.id)
      
      if (taskIndex === -1) {
        throw new Error('المهمة غير موجودة')
      }

      const existingTask = tasks[taskIndex]
      
      // التحقق من الإصدار (Optimistic Locking)
      if (existingTask.version !== request.version) {
        throw new Error('تم تعديل المهمة من قبل مستخدم آخر')
      }

      // تحديث المهمة
      const updatedTask: Task = {
        ...existingTask,
        ...request,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: 'current_user',
        version: existingTask.version + 1
      }

      tasks[taskIndex] = updatedTask
      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks))

      return updatedTask
    } catch (error) {
      console.error('خطأ في تحديث المهمة:', error)
      throw error
    }
  }

  /**
   * حذف مهمة
   */
  async delete(id: string): Promise<void> {
    try {
      const tasks = await this.getAll()
      const filteredTasks = tasks.filter(task => task.id !== id)
      
      if (filteredTasks.length === tasks.length) {
        throw new Error('المهمة غير موجودة')
      }

      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTasks))

      // حذف البيانات المرتبطة
      await this.deleteRelatedData(id)
    } catch (error) {
      console.error('خطأ في حذف المهمة:', error)
      throw error
    }
  }

  /**
   * الحصول على إحصائيات المهام
   */
  async getStatistics(filters?: TaskFilters): Promise<TaskStatistics> {
    try {
      const tasks = await this.getAll(filters)
      
      const totalTasks = tasks.length
      const completedTasks = tasks.filter(task => task.status === 'completed').length
      const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length
      const overdueTasks = tasks.filter(task => {
        const today = new Date()
        const endDate = new Date(task.plannedEndDate)
        return endDate < today && task.status !== 'completed'
      }).length

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // حساب متوسط وقت الإنجاز
      const completedTasksWithDates = tasks.filter(task => 
        task.status === 'completed' && task.actualStartDate && task.actualEndDate
      )
      
      const averageCompletionTime = completedTasksWithDates.length > 0 
        ? completedTasksWithDates.reduce((sum, task) => {
            const start = new Date(task.actualStartDate!).getTime()
            const end = new Date(task.actualEndDate!).getTime()
            return sum + (end - start) / (1000 * 60 * 60 * 24) // بالأيام
          }, 0) / completedTasksWithDates.length
        : 0

      // إحصائيات الساعات والتكلفة
      const totalEstimatedHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0)
      const totalActualHours = tasks.reduce((sum, task) => sum + task.actualHours, 0)
      const totalEstimatedCost = tasks.reduce((sum, task) => sum + task.estimatedCost, 0)
      const totalActualCost = tasks.reduce((sum, task) => sum + task.actualCost, 0)

      // إحصائيات حسب الحالة
      const tasksByStatus: Record<TaskStatus, number> = {
        not_started: tasks.filter(t => t.status === 'not_started').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        on_hold: tasks.filter(t => t.status === 'on_hold').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length
      }

      // إحصائيات حسب الأولوية
      const tasksByPriority: Record<TaskPriority, number> = {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        critical: tasks.filter(t => t.priority === 'critical').length
      }

      // إحصائيات حسب المخصص له
      const tasksByAssignee: Record<string, number> = {}
      tasks.forEach(task => {
        if (task.assigneeId) {
          tasksByAssignee[task.assigneeId] = (tasksByAssignee[task.assigneeId] || 0) + 1
        }
      })

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
        averageCompletionTime,
        totalEstimatedHours,
        totalActualHours,
        totalEstimatedCost,
        totalActualCost,
        tasksByStatus,
        tasksByPriority,
        tasksByAssignee
      }
    } catch (error) {
      console.error('خطأ في حساب إحصائيات المهام:', error)
      throw new Error('فشل في حساب إحصائيات المهام')
    }
  }

  /**
   * الحصول على تبعيات المهمة
   */
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    try {
      const dependenciesData = safeLocalStorage.getItem(this.DEPENDENCIES_KEY)
      const dependencies: TaskDependency[] = dependenciesData ? JSON.parse(dependenciesData) : []
      return dependencies.filter(dep => dep.taskId === taskId || dep.dependsOnTaskId === taskId)
    } catch (error) {
      console.error('خطأ في الحصول على تبعيات المهمة:', error)
      throw new Error('فشل في تحميل تبعيات المهمة')
    }
  }

  /**
   * إضافة تبعية للمهمة
   */
  async addTaskDependency(dependency: Omit<TaskDependency, 'id' | 'createdAt'>): Promise<TaskDependency> {
    try {
      const dependencies = await this.getTaskDependencies('')
      
      const newDependency: TaskDependency = {
        ...dependency,
        id: this.generateId(),
        createdAt: new Date().toISOString()
      }

      dependencies.push(newDependency)
      safeLocalStorage.setItem(this.DEPENDENCIES_KEY, JSON.stringify(dependencies))

      return newDependency
    } catch (error) {
      console.error('خطأ في إضافة تبعية المهمة:', error)
      throw new Error('فشل في إضافة تبعية المهمة')
    }
  }

  /**
   * حذف تبعية المهمة
   */
  async removeTaskDependency(dependencyId: string): Promise<void> {
    try {
      const dependenciesData = safeLocalStorage.getItem(this.DEPENDENCIES_KEY)
      const dependencies: TaskDependency[] = dependenciesData ? JSON.parse(dependenciesData) : []
      
      const filteredDependencies = dependencies.filter(dep => dep.id !== dependencyId)
      safeLocalStorage.setItem(this.DEPENDENCIES_KEY, JSON.stringify(filteredDependencies))
    } catch (error) {
      console.error('خطأ في حذف تبعية المهمة:', error)
      throw new Error('فشل في حذف تبعية المهمة')
    }
  }

  // باقي الطرق سيتم إضافتها في الجزء التالي...
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    // تنفيذ مؤقت
    return []
  }

  async addTaskComment(comment: Omit<TaskComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskComment> {
    // تنفيذ مؤقت
    throw new Error('لم يتم تنفيذها بعد')
  }

  async updateTaskComment(commentId: string, content: string): Promise<TaskComment> {
    // تنفيذ مؤقت
    throw new Error('لم يتم تنفيذها بعد')
  }

  async deleteTaskComment(commentId: string): Promise<void> {
    // تنفيذ مؤقت
  }

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    // تنفيذ مؤقت
    return []
  }

  async addTaskAttachment(attachment: Omit<TaskAttachment, 'id' | 'uploadedAt'>): Promise<TaskAttachment> {
    // تنفيذ مؤقت
    throw new Error('لم يتم تنفيذها بعد')
  }

  async deleteTaskAttachment(attachmentId: string): Promise<void> {
    // تنفيذ مؤقت
  }

  async getTaskTimeEntries(taskId: string): Promise<TaskTimeEntry[]> {
    // تنفيذ مؤقت
    return []
  }

  async addTaskTimeEntry(timeEntry: Omit<TaskTimeEntry, 'id' | 'createdAt'>): Promise<TaskTimeEntry> {
    // تنفيذ مؤقت
    throw new Error('لم يتم تنفيذها بعد')
  }

  async updateTaskTimeEntry(timeEntryId: string, updates: Partial<Omit<TaskTimeEntry, 'id' | 'taskId' | 'createdAt'>>): Promise<TaskTimeEntry> {
    // تنفيذ مؤقت
    throw new Error('لم يتم تنفيذها بعد')
  }

  async deleteTaskTimeEntry(timeEntryId: string): Promise<void> {
    // تنفيذ مؤقت
  }

  /**
   * تطبيق الفلاتر على المهام
   */
  private applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter(task => {
      // فلتر المشروع
      if (filters.projectId && task.projectId !== filters.projectId) {
        return false
      }

      // فلتر الحالة
      if (filters.status && filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false
      }

      // فلتر الأولوية
      if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false
      }

      // فلتر المخصص له
      if (filters.assigneeId && task.assigneeId !== filters.assigneeId) {
        return false
      }

      // فلتر النوع
      if (filters.type && filters.type.length > 0 && !filters.type.includes(task.type)) {
        return false
      }

      // فلتر البحث
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const titleMatch = task.title.toLowerCase().includes(searchLower)
        const descriptionMatch = task.description.toLowerCase().includes(searchLower)
        const tagsMatch = task.tags.some(tag => tag.toLowerCase().includes(searchLower))
        
        if (!titleMatch && !descriptionMatch && !tagsMatch) {
          return false
        }
      }

      // فلاتر التواريخ
      if (filters.startDateFrom && task.plannedStartDate < filters.startDateFrom) {
        return false
      }

      if (filters.startDateTo && task.plannedStartDate > filters.startDateTo) {
        return false
      }

      if (filters.endDateFrom && task.plannedEndDate < filters.endDateFrom) {
        return false
      }

      if (filters.endDateTo && task.plannedEndDate > filters.endDateTo) {
        return false
      }

      return true
    })
  }

  /**
   * تطبيق الترتيب على المهام
   */
  private applySorting(tasks: Task[], sort: TaskSortOptions): Task[] {
    return tasks.sort((a, b) => {
      let aValue: any = a[sort.field]
      let bValue: any = b[sort.field]

      // معالجة خاصة للتواريخ
      if (sort.field.includes('Date')) {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      // معالجة خاصة للأولوية
      if (sort.field === 'priority') {
        const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
        aValue = priorityOrder[aValue as TaskPriority]
        bValue = priorityOrder[bValue as TaskPriority]
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  /**
   * حذف البيانات المرتبطة بالمهمة
   */
  private async deleteRelatedData(taskId: string): Promise<void> {
    // حذف التبعيات
    const dependencies = await this.getTaskDependencies(taskId)
    for (const dep of dependencies) {
      await this.removeTaskDependency(dep.id)
    }

    // حذف التعليقات والمرفقات وسجلات الوقت
    // سيتم تنفيذها لاحقاً
  }

  /**
   * توليد معرف فريد
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // باقي الطرق المطلوبة - سيتم إضافتها في الجزء التالي
  async getTasksByAssignee(assigneeId: string, filters?: Omit<TaskFilters, 'assigneeId'>): Promise<Task[]> {
    const allFilters = { ...filters, assigneeId }
    return this.getAll(allFilters)
  }

  async getOverdueTasks(projectId?: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0]
    const filters: TaskFilters = {
      projectId,
      endDateTo: today,
      status: ['not_started', 'in_progress']
    }
    return this.getAll(filters)
  }

  async getUpcomingTasks(days: number, projectId?: string): Promise<Task[]> {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    
    const filters: TaskFilters = {
      projectId,
      endDateFrom: today.toISOString().split('T')[0],
      endDateTo: futureDate.toISOString().split('T')[0],
      status: ['not_started', 'in_progress']
    }
    return this.getAll(filters)
  }

  // طرق أخرى مؤقتة
  async duplicateTask(taskId: string, newProjectId?: string): Promise<Task> { throw new Error('لم يتم تنفيذها بعد') }
  async moveTaskToProject(taskId: string, newProjectId: string): Promise<Task> { throw new Error('لم يتم تنفيذها بعد') }
  async updateTaskOrder(taskIds: string[]): Promise<void> { }
  async searchTasks(query: string, filters?: TaskFilters): Promise<Task[]> { return this.getAll({ ...filters, search: query }) }
  async getTaskPerformanceReport(projectId: string, startDate: string, endDate: string): Promise<any> { return {} }
  async exportTasks(filters?: TaskFilters, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob> { throw new Error('لم يتم تنفيذها بعد') }
  async importTasks(file: File, projectId: string): Promise<Task[]> { throw new Error('لم يتم تنفيذها بعد') }
  async getTaskTemplates(): Promise<any[]> { return [] }
  async createTasksFromTemplate(templateId: string, projectId: string): Promise<Task[]> { throw new Error('لم يتم تنفيذها بعد') }
  async saveTaskTemplate(name: string, tasks: Task[]): Promise<any> { throw new Error('لم يتم تنفيذها بعد') }
  async getCriticalPath(projectId: string): Promise<Task[]> { return [] }
  async calculateProjectDates(projectId: string): Promise<{ startDate: string; endDate: string; duration: number }> { return { startDate: '', endDate: '', duration: 0 } }
  async updateProjectProgress(projectId: string): Promise<number> { return 0 }
  async getResourceAnalysis(projectId: string): Promise<any> { return {} }
  async getCostAnalysis(projectId: string): Promise<any> { return {} }
  async getGanttData(projectId: string): Promise<any> { return {} }
  async rescheduleTask(taskId: string, newStartDate: string, newEndDate: string): Promise<Task> { throw new Error('لم يتم تنفيذها بعد') }
  async getRiskAnalysis(projectId: string): Promise<any> { return {} }
  async getCompletionForecast(projectId: string): Promise<any> { return {} }
}

export const taskRepository = new LocalTaskRepository()
