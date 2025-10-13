/**
 * Task Management Service
 * خدمة إدارة المهام والأنشطة
 */

import { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskFilters, 
  TaskSortOptions, 
  TaskStatistics,
  TaskValidationResult,
  TaskProgressUpdate,
  TaskNotification,
  TaskPerformanceReport
} from '../types/tasks'
import { taskRepository } from '../repository/task.repository'
import { enhancedProjectService } from './enhancedProjectService'

export class TaskManagementService {
  /**
   * الحصول على جميع المهام
   */
  async getAllTasks(filters?: TaskFilters, sort?: TaskSortOptions): Promise<Task[]> {
    try {
      return await taskRepository.getAll(filters, sort)
    } catch (error) {
      console.error('خطأ في الحصول على المهام:', error)
      throw new Error('فشل في تحميل المهام')
    }
  }

  /**
   * الحصول على مهمة بالمعرف
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      return await taskRepository.getById(id)
    } catch (error) {
      console.error('خطأ في الحصول على المهمة:', error)
      throw new Error('فشل في تحميل المهمة')
    }
  }

  /**
   * الحصول على مهام المشروع
   */
  async getProjectTasks(projectId: string, filters?: Omit<TaskFilters, 'projectId'>): Promise<Task[]> {
    try {
      const projectFilters: TaskFilters = { ...filters, projectId }
      return await taskRepository.getAll(projectFilters)
    } catch (error) {
      console.error('خطأ في الحصول على مهام المشروع:', error)
      throw new Error('فشل في تحميل مهام المشروع')
    }
  }

  /**
   * إنشاء مهمة جديدة
   */
  async createTask(request: CreateTaskRequest): Promise<Task> {
    try {
      // التحقق من صحة البيانات
      const validation = await this.validateTask(request)
      if (!validation.isValid) {
        throw new Error(`بيانات المهمة غير صحيحة: ${validation.errors.join(', ')}`)
      }

      // التحقق من وجود المشروع
      const project = await enhancedProjectService.getProjectById(request.projectId)
      if (!project) {
        throw new Error('المشروع غير موجود')
      }

      // إنشاء المهمة
      const task = await taskRepository.create(request)

      // إرسال إشعار للمخصص له
      if (request.assigneeId) {
        await this.sendTaskNotification(task.id, 'assignment', request.assigneeId)
      }

      return task
    } catch (error) {
      console.error('خطأ في إنشاء المهمة:', error)
      throw error
    }
  }

  /**
   * تحديث مهمة
   */
  async updateTask(request: UpdateTaskRequest): Promise<Task> {
    try {
      // التحقق من وجود المهمة
      const existingTask = await taskRepository.getById(request.id)
      if (!existingTask) {
        throw new Error('المهمة غير موجودة')
      }

      // التحقق من الإصدار (Optimistic Locking)
      if (existingTask.version !== request.version) {
        throw new Error('تم تعديل المهمة من قبل مستخدم آخر. يرجى إعادة تحميل الصفحة.')
      }

      // التحقق من صحة البيانات
      const validation = await this.validateTaskUpdate(request, existingTask)
      if (!validation.isValid) {
        throw new Error(`بيانات التحديث غير صحيحة: ${validation.errors.join(', ')}`)
      }

      // تحديث المهمة
      const updatedTask = await taskRepository.update(request)

      // إرسال إشعارات عند تغيير الحالة أو المخصص له
      if (request.status && request.status !== existingTask.status) {
        await this.sendTaskNotification(updatedTask.id, 'status_change', updatedTask.assigneeId)
      }

      if (request.assigneeId && request.assigneeId !== existingTask.assigneeId) {
        await this.sendTaskNotification(updatedTask.id, 'assignment', request.assigneeId)
      }

      return updatedTask
    } catch (error) {
      console.error('خطأ في تحديث المهمة:', error)
      throw error
    }
  }

  /**
   * حذف مهمة
   */
  async deleteTask(id: string): Promise<void> {
    try {
      const task = await taskRepository.getById(id)
      if (!task) {
        throw new Error('المهمة غير موجودة')
      }

      // التحقق من وجود مهام فرعية
      const subtasks = await taskRepository.getAll({ parentTaskId: id })
      if (subtasks.length > 0) {
        throw new Error('لا يمكن حذف المهمة لأنها تحتوي على مهام فرعية')
      }

      // التحقق من وجود تبعيات
      const dependencies = await taskRepository.getTaskDependencies(id)
      if (dependencies.length > 0) {
        throw new Error('لا يمكن حذف المهمة لأن مهام أخرى تعتمد عليها')
      }

      await taskRepository.delete(id)
    } catch (error) {
      console.error('خطأ في حذف المهمة:', error)
      throw error
    }
  }

  /**
   * تحديث تقدم المهمة
   */
  async updateTaskProgress(update: TaskProgressUpdate): Promise<Task> {
    try {
      const task = await taskRepository.getById(update.taskId)
      if (!task) {
        throw new Error('المهمة غير موجودة')
      }

      // تحديث التقدم
      const updateRequest: UpdateTaskRequest = {
        id: update.taskId,
        progress: update.progress,
        actualHours: update.actualHours,
        actualCost: update.actualCost,
        status: update.status,
        version: task.version
      }

      // إذا وصل التقدم إلى 100%، تحديث الحالة إلى مكتملة
      if (update.progress === 100 && !update.status) {
        updateRequest.status = 'completed'
        updateRequest.actualEndDate = new Date().toISOString()
      }

      return await this.updateTask(updateRequest)
    } catch (error) {
      console.error('خطأ في تحديث تقدم المهمة:', error)
      throw error
    }
  }

  /**
   * الحصول على إحصائيات المهام
   */
  async getTaskStatistics(projectId?: string): Promise<TaskStatistics> {
    try {
      const filters: TaskFilters = projectId ? { projectId } : {}
      return await taskRepository.getStatistics(filters)
    } catch (error) {
      console.error('خطأ في الحصول على إحصائيات المهام:', error)
      throw new Error('فشل في تحميل إحصائيات المهام')
    }
  }

  /**
   * البحث في المهام
   */
  async searchTasks(query: string, filters?: TaskFilters): Promise<Task[]> {
    try {
      const searchFilters: TaskFilters = { ...filters, search: query }
      return await taskRepository.getAll(searchFilters)
    } catch (error) {
      console.error('خطأ في البحث في المهام:', error)
      throw new Error('فشل في البحث في المهام')
    }
  }

  /**
   * الحصول على المهام المتأخرة
   */
  async getOverdueTasks(projectId?: string): Promise<Task[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const filters: TaskFilters = {
        projectId,
        endDateTo: today,
        status: ['not_started', 'in_progress']
      }
      return await taskRepository.getAll(filters)
    } catch (error) {
      console.error('خطأ في الحصول على المهام المتأخرة:', error)
      throw new Error('فشل في تحميل المهام المتأخرة')
    }
  }

  /**
   * التحقق من صحة بيانات المهمة
   */
  private async validateTask(request: CreateTaskRequest): Promise<TaskValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // التحقق من الحقول المطلوبة
    if (!request.title?.trim()) {
      errors.push('عنوان المهمة مطلوب')
    }

    if (!request.description?.trim()) {
      errors.push('وصف المهمة مطلوب')
    }

    if (!request.plannedStartDate) {
      errors.push('تاريخ البداية المخطط مطلوب')
    }

    if (!request.plannedEndDate) {
      errors.push('تاريخ النهاية المخطط مطلوب')
    }

    // التحقق من التواريخ
    if (request.plannedStartDate && request.plannedEndDate) {
      const startDate = new Date(request.plannedStartDate)
      const endDate = new Date(request.plannedEndDate)
      
      if (startDate >= endDate) {
        errors.push('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')
      }
    }

    // التحقق من الساعات والتكلفة
    if (request.estimatedHours < 0) {
      errors.push('الساعات المقدرة يجب أن تكون أكبر من أو تساوي صفر')
    }

    if (request.estimatedCost < 0) {
      errors.push('التكلفة المقدرة يجب أن تكون أكبر من أو تساوي صفر')
    }

    // تحذيرات
    if (request.estimatedHours > 1000) {
      warnings.push('الساعات المقدرة عالية جداً (أكثر من 1000 ساعة)')
    }

    if (request.estimatedCost > 1000000) {
      warnings.push('التكلفة المقدرة عالية جداً (أكثر من مليون ريال)')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * التحقق من صحة تحديث المهمة
   */
  private async validateTaskUpdate(request: UpdateTaskRequest, existingTask: Task): Promise<TaskValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // التحقق من التقدم
    if (request.progress !== undefined) {
      if (request.progress < 0 || request.progress > 100) {
        errors.push('نسبة التقدم يجب أن تكون بين 0 و 100')
      }
    }

    // التحقق من الساعات الفعلية
    if (request.actualHours !== undefined && request.actualHours < 0) {
      errors.push('الساعات الفعلية يجب أن تكون أكبر من أو تساوي صفر')
    }

    // التحقق من التكلفة الفعلية
    if (request.actualCost !== undefined && request.actualCost < 0) {
      errors.push('التكلفة الفعلية يجب أن تكون أكبر من أو تساوي صفر')
    }

    // التحقق من التواريخ الفعلية
    if (request.actualStartDate && request.actualEndDate) {
      const startDate = new Date(request.actualStartDate)
      const endDate = new Date(request.actualEndDate)
      
      if (startDate >= endDate) {
        errors.push('تاريخ النهاية الفعلي يجب أن يكون بعد تاريخ البداية الفعلي')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * إرسال إشعار المهمة
   */
  private async sendTaskNotification(taskId: string, type: TaskNotification['type'], recipientId?: string): Promise<void> {
    if (!recipientId) return

    try {
      // هنا يمكن إضافة منطق إرسال الإشعارات
      // مثل إرسال بريد إلكتروني أو إشعار push
      console.log(`إرسال إشعار ${type} للمهمة ${taskId} إلى المستخدم ${recipientId}`)
    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error)
      // لا نرمي خطأ هنا لأن فشل الإشعار لا يجب أن يوقف العملية الأساسية
    }
  }
}

export const taskManagementService = new TaskManagementService()
