/**
 * Task Management Service
 * طبقة الخدمات المسؤولة عن العمليات عالية المستوى الخاصة بالمهام
 */

import { taskRepository } from '@/repository/providers/task.local'
import type {
  CreateTaskRequest,
  Task,
  TaskFilters,
  TaskStatistics,
  UpdateTaskRequest,
} from '@/types/tasks'

class TaskManagementService {
  async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const filters: TaskFilters = { projectId }
      return await taskRepository.getAll(filters, {
        field: 'plannedEndDate',
        direction: 'asc',
      })
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل مهام المشروع')
    }
  }

  async getTaskById(taskId: string): Promise<Task> {
    try {
      const task = await taskRepository.getById(taskId)
      if (!task) {
        throw new Error('لم يتم العثور على المهمة المطلوبة')
      }
      return task
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحميل تفاصيل المهمة')
    }
  }

  async createTask(request: CreateTaskRequest): Promise<Task> {
    try {
      const normalized: CreateTaskRequest = {
        ...request,
        tags: request.tags ?? [],
        dependencies: request.dependencies ?? [],
        subtasks: request.subtasks ?? [],
        attachments: request.attachments ?? [],
      }

      return await taskRepository.create(normalized)
    } catch (error) {
      throw this.wrapError(error, 'فشل في إنشاء المهمة')
    }
  }

  async updateTask(request: UpdateTaskRequest): Promise<Task> {
    if (!request.id) {
      throw new Error('معرّف المهمة مطلوب للتحديث')
    }

    if (typeof request.version !== 'number') {
      throw new Error('رقم الإصدار مطلوب للتحديث')
    }

    try {
      const normalized: UpdateTaskRequest = {
        ...request,
        tags: request.tags ?? undefined,
      }
      return await taskRepository.update(normalized)
    } catch (error) {
      throw this.wrapError(error, 'فشل في تحديث بيانات المهمة')
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await taskRepository.delete(taskId)
    } catch (error) {
      throw this.wrapError(error, 'فشل في حذف المهمة')
    }
  }

  async getProjectStatistics(projectId: string): Promise<TaskStatistics> {
    try {
      const filters: TaskFilters = { projectId }
      return await taskRepository.getStatistics(filters)
    } catch (error) {
      throw this.wrapError(error, 'فشل في حساب إحصائيات المهام')
    }
  }

  private wrapError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error) {
      return error.message ? error : new Error(fallbackMessage)
    }
    return new Error(fallbackMessage)
  }
}

export const taskManagementService = new TaskManagementService()