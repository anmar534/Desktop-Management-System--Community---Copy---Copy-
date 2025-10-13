/**
 * Task Repository Interface
 * واجهة مستودع المهام
 */

import { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskFilters, 
  TaskSortOptions, 
  TaskStatistics,
  TaskDependency,
  TaskComment,
  TaskAttachment,
  TaskTimeEntry
} from '../types/tasks'

export interface TaskRepository {
  /**
   * الحصول على جميع المهام
   */
  getAll(filters?: TaskFilters, sort?: TaskSortOptions): Promise<Task[]>

  /**
   * الحصول على مهمة بالمعرف
   */
  getById(id: string): Promise<Task | null>

  /**
   * إنشاء مهمة جديدة
   */
  create(request: CreateTaskRequest): Promise<Task>

  /**
   * تحديث مهمة
   */
  update(request: UpdateTaskRequest): Promise<Task>

  /**
   * حذف مهمة
   */
  delete(id: string): Promise<void>

  /**
   * الحصول على إحصائيات المهام
   */
  getStatistics(filters?: TaskFilters): Promise<TaskStatistics>

  /**
   * الحصول على تبعيات المهمة
   */
  getTaskDependencies(taskId: string): Promise<TaskDependency[]>

  /**
   * إضافة تبعية للمهمة
   */
  addTaskDependency(dependency: Omit<TaskDependency, 'id' | 'createdAt'>): Promise<TaskDependency>

  /**
   * حذف تبعية المهمة
   */
  removeTaskDependency(dependencyId: string): Promise<void>

  /**
   * الحصول على تعليقات المهمة
   */
  getTaskComments(taskId: string): Promise<TaskComment[]>

  /**
   * إضافة تعليق للمهمة
   */
  addTaskComment(comment: Omit<TaskComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskComment>

  /**
   * تحديث تعليق المهمة
   */
  updateTaskComment(commentId: string, content: string): Promise<TaskComment>

  /**
   * حذف تعليق المهمة
   */
  deleteTaskComment(commentId: string): Promise<void>

  /**
   * الحصول على مرفقات المهمة
   */
  getTaskAttachments(taskId: string): Promise<TaskAttachment[]>

  /**
   * إضافة مرفق للمهمة
   */
  addTaskAttachment(attachment: Omit<TaskAttachment, 'id' | 'uploadedAt'>): Promise<TaskAttachment>

  /**
   * حذف مرفق المهمة
   */
  deleteTaskAttachment(attachmentId: string): Promise<void>

  /**
   * الحصول على سجلات الوقت للمهمة
   */
  getTaskTimeEntries(taskId: string): Promise<TaskTimeEntry[]>

  /**
   * إضافة سجل وقت للمهمة
   */
  addTaskTimeEntry(timeEntry: Omit<TaskTimeEntry, 'id' | 'createdAt'>): Promise<TaskTimeEntry>

  /**
   * تحديث سجل وقت المهمة
   */
  updateTaskTimeEntry(timeEntryId: string, updates: Partial<Omit<TaskTimeEntry, 'id' | 'taskId' | 'createdAt'>>): Promise<TaskTimeEntry>

  /**
   * حذف سجل وقت المهمة
   */
  deleteTaskTimeEntry(timeEntryId: string): Promise<void>

  /**
   * الحصول على المهام المخصصة للمستخدم
   */
  getTasksByAssignee(assigneeId: string, filters?: Omit<TaskFilters, 'assigneeId'>): Promise<Task[]>

  /**
   * الحصول على المهام المتأخرة
   */
  getOverdueTasks(projectId?: string): Promise<Task[]>

  /**
   * الحصول على المهام القادمة الاستحقاق
   */
  getUpcomingTasks(days: number, projectId?: string): Promise<Task[]>

  /**
   * نسخ مهمة
   */
  duplicateTask(taskId: string, newProjectId?: string): Promise<Task>

  /**
   * نقل مهمة إلى مشروع آخر
   */
  moveTaskToProject(taskId: string, newProjectId: string): Promise<Task>

  /**
   * تحديث ترتيب المهام
   */
  updateTaskOrder(taskIds: string[]): Promise<void>

  /**
   * البحث في المهام
   */
  searchTasks(query: string, filters?: TaskFilters): Promise<Task[]>

  /**
   * الحصول على تقرير أداء المهام
   */
  getTaskPerformanceReport(projectId: string, startDate: string, endDate: string): Promise<any>

  /**
   * تصدير المهام
   */
  exportTasks(filters?: TaskFilters, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob>

  /**
   * استيراد المهام
   */
  importTasks(file: File, projectId: string): Promise<Task[]>

  /**
   * الحصول على قالب المهام
   */
  getTaskTemplates(): Promise<any[]>

  /**
   * إنشاء مهام من قالب
   */
  createTasksFromTemplate(templateId: string, projectId: string): Promise<Task[]>

  /**
   * حفظ قالب مهام
   */
  saveTaskTemplate(name: string, tasks: Task[]): Promise<any>

  /**
   * الحصول على المسار الحرج
   */
  getCriticalPath(projectId: string): Promise<Task[]>

  /**
   * حساب تواريخ المشروع
   */
  calculateProjectDates(projectId: string): Promise<{ startDate: string; endDate: string; duration: number }>

  /**
   * تحديث تقدم المشروع بناءً على المهام
   */
  updateProjectProgress(projectId: string): Promise<number>

  /**
   * الحصول على تحليل الموارد
   */
  getResourceAnalysis(projectId: string): Promise<any>

  /**
   * الحصول على تحليل التكلفة
   */
  getCostAnalysis(projectId: string): Promise<any>

  /**
   * الحصول على مخطط جانت
   */
  getGanttData(projectId: string): Promise<any>

  /**
   * تحديث جدولة المهام
   */
  rescheduleTask(taskId: string, newStartDate: string, newEndDate: string): Promise<Task>

  /**
   * الحصول على تحليل المخاطر
   */
  getRiskAnalysis(projectId: string): Promise<any>

  /**
   * الحصول على توقعات الإنجاز
   */
  getCompletionForecast(projectId: string): Promise<any>
}

// تصدير المستودع الافتراضي
export { taskRepository } from './providers/task.local'
