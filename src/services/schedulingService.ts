/**
 * Scheduling Service
 * خدمة الجدولة الزمنية ومخططات جانت
 */

import { asyncStorage } from '../utils/storage'
import type {
  ProjectSchedule,
  GanttTask,
  Milestone,
  CriticalPathAnalysis,
  CriticalPathTask,
  SchedulingOptions,
  ScheduleBaseline,
  ScheduleVariance,
  ResourceAssignment,
  WorkingCalendar,
  ScheduleConflict,
  ScheduleExport,
  SchedulingServiceInterface
} from '../types/scheduling'
import type { Task } from '../types/tasks'
import { taskRepository } from '../repository/task.repository'
import { criticalPathCalculator } from './criticalPathCalculator'

class SchedulingServiceImpl implements SchedulingServiceInterface {
  private readonly STORAGE_KEYS = {
    SCHEDULES: 'project_schedules',
    BASELINES: 'schedule_baselines',
    CALENDARS: 'working_calendars',
    RESOURCE_ASSIGNMENTS: 'resource_assignments'
  }

  private readonly DEFAULT_CALENDAR: WorkingCalendar = {
    id: 'default',
    name: 'التقويم الافتراضي',
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    workingHours: {
      start: '08:00',
      end: '17:00',
      break: {
        start: '12:00',
        end: '13:00'
      }
    },
    holidays: [],
    exceptions: []
  }

  /**
   * إنشاء جدولة جديدة للمشروع
   */
  async createSchedule(projectId: string, options: SchedulingOptions): Promise<ProjectSchedule> {
    try {
      // جلب المهام من المشروع
      const tasks = await taskRepository.getTasksByProject(projectId)
      
      // تحويل المهام إلى مهام جانت
      const ganttTasks = await this.convertTasksToGantt(tasks)
      
      // إنشاء الجدولة
      const schedule: ProjectSchedule = {
        id: `schedule_${projectId}_${Date.now()}`,
        projectId,
        name: `جدولة مشروع ${projectId}`,
        nameEn: `Project ${projectId} Schedule`,
        startDate: this.calculateProjectStart(ganttTasks),
        endDate: this.calculateProjectEnd(ganttTasks),
        tasks: ganttTasks,
        milestones: await this.extractMilestones(ganttTasks),
        criticalPath: [],
        totalDuration: 0,
        workingDays: options.calendar.workingDays,
        holidays: options.calendar.holidays,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      // حساب المسار الحرج
      const criticalPath = criticalPathCalculator.calculateCriticalPath(schedule)
      schedule.criticalPath = criticalPath.path
      schedule.totalDuration = criticalPath.duration

      // حفظ الجدولة
      const schedules = await asyncStorage.getItem(this.STORAGE_KEYS.SCHEDULES, [])
      schedules.push(schedule)
      await asyncStorage.setItem(this.STORAGE_KEYS.SCHEDULES, schedules)

      return schedule
    } catch (error) {
      console.error('Error creating schedule:', error)
      throw new Error('فشل في إنشاء الجدولة الزمنية')
    }
  }

  /**
   * جلب جدولة المشروع
   */
  async getSchedule(projectId: string): Promise<ProjectSchedule | null> {
    try {
      const schedules = await asyncStorage.getItem(this.STORAGE_KEYS.SCHEDULES, [])
      return schedules.find((s: ProjectSchedule) => s.projectId === projectId) || null
    } catch (error) {
      console.error('Error getting schedule:', error)
      return null
    }
  }

  /**
   * تحديث الجدولة
   */
  async updateSchedule(projectId: string, updates: Partial<ProjectSchedule>): Promise<ProjectSchedule> {
    try {
      const schedules = await asyncStorage.getItem(this.STORAGE_KEYS.SCHEDULES, [])
      const index = schedules.findIndex((s: ProjectSchedule) => s.projectId === projectId)
      
      if (index === -1) {
        throw new Error('الجدولة غير موجودة')
      }

      schedules[index] = {
        ...schedules[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        version: schedules[index].version + 1
      }

      await asyncStorage.setItem(this.STORAGE_KEYS.SCHEDULES, schedules)
      return schedules[index]
    } catch (error) {
      console.error('Error updating schedule:', error)
      throw new Error('فشل في تحديث الجدولة')
    }
  }

  /**
   * حذف الجدولة
   */
  async deleteSchedule(projectId: string): Promise<void> {
    try {
      const schedules = await asyncStorage.getItem(this.STORAGE_KEYS.SCHEDULES, [])
      const filtered = schedules.filter((s: ProjectSchedule) => s.projectId !== projectId)
      await asyncStorage.setItem(this.STORAGE_KEYS.SCHEDULES, filtered)
    } catch (error) {
      console.error('Error deleting schedule:', error)
      throw new Error('فشل في حذف الجدولة')
    }
  }

  /**
   * جدولة مهمة جديدة
   */
  async scheduleTask(projectId: string, task: Partial<GanttTask>): Promise<GanttTask> {
    try {
      const schedule = await this.getSchedule(projectId)
      if (!schedule) {
        throw new Error('الجدولة غير موجودة')
      }

      const newTask: GanttTask = {
        id: task.id || `task_${Date.now()}`,
        name: task.name || 'مهمة جديدة',
        nameEn: task.nameEn,
        start: task.start || new Date(),
        end: task.end || new Date(),
        progress: task.progress || 0,
        dependencies: task.dependencies || [],
        type: task.type || 'task',
        parent: task.parent,
        resource: task.resource,
        color: task.color,
        critical: false
      }

      schedule.tasks.push(newTask)
      await this.updateSchedule(projectId, { tasks: schedule.tasks })

      return newTask
    } catch (error) {
      console.error('Error scheduling task:', error)
      throw new Error('فشل في جدولة المهمة')
    }
  }

  /**
   * تحديث جدولة مهمة
   */
  async updateTaskSchedule(projectId: string, taskId: string, updates: Partial<GanttTask>): Promise<GanttTask> {
    try {
      const schedule = await this.getSchedule(projectId)
      if (!schedule) {
        throw new Error('الجدولة غير موجودة')
      }

      const taskIndex = schedule.tasks.findIndex(t => t.id === taskId)
      if (taskIndex === -1) {
        throw new Error('المهمة غير موجودة')
      }

      schedule.tasks[taskIndex] = {
        ...schedule.tasks[taskIndex],
        ...updates
      }

      await this.updateSchedule(projectId, { tasks: schedule.tasks })
      return schedule.tasks[taskIndex]
    } catch (error) {
      console.error('Error updating task schedule:', error)
      throw new Error('فشل في تحديث جدولة المهمة')
    }
  }

  /**
   * إعادة جدولة مهمة
   */
  async rescheduleTask(projectId: string, taskId: string, newStart: Date, newEnd?: Date): Promise<GanttTask> {
    try {
      const calculatedEnd = newEnd || new Date(newStart.getTime() + (24 * 60 * 60 * 1000)) // Default 1 day
      
      return await this.updateTaskSchedule(projectId, taskId, {
        start: newStart,
        end: calculatedEnd
      })
    } catch (error) {
      console.error('Error rescheduling task:', error)
      throw new Error('فشل في إعادة جدولة المهمة')
    }
  }

  /**
   * إضافة تبعية بين المهام
   */
  async addDependency(projectId: string, taskId: string, dependsOnTaskId: string, type = 'finish_to_start'): Promise<void> {
    try {
      const schedule = await this.getSchedule(projectId)
      if (!schedule) {
        throw new Error('الجدولة غير موجودة')
      }

      const task = schedule.tasks.find(t => t.id === taskId)
      if (!task) {
        throw new Error('المهمة غير موجودة')
      }

      if (!task.dependencies.includes(dependsOnTaskId)) {
        task.dependencies.push(dependsOnTaskId)
        await this.updateSchedule(projectId, { tasks: schedule.tasks })
      }
    } catch (error) {
      console.error('Error adding dependency:', error)
      throw new Error('فشل في إضافة التبعية')
    }
  }

  /**
   * إزالة تبعية بين المهام
   */
  async removeDependency(projectId: string, taskId: string, dependsOnTaskId: string): Promise<void> {
    try {
      const schedule = await this.getSchedule(projectId)
      if (!schedule) {
        throw new Error('الجدولة غير موجودة')
      }

      const task = schedule.tasks.find(t => t.id === taskId)
      if (!task) {
        throw new Error('المهمة غير موجودة')
      }

      task.dependencies = task.dependencies.filter(dep => dep !== dependsOnTaskId)
      await this.updateSchedule(projectId, { tasks: schedule.tasks })
    } catch (error) {
      console.error('Error removing dependency:', error)
      throw new Error('فشل في إزالة التبعية')
    }
  }

  /**
   * التحقق من صحة التبعيات
   */
  async validateDependencies(projectId: string): Promise<ScheduleConflict[]> {
    try {
      const schedule = await this.getSchedule(projectId)
      if (!schedule) {
        return []
      }

      const conflicts: ScheduleConflict[] = []
      
      // فحص التبعيات الدائرية
      for (const task of schedule.tasks) {
        if (this.hasCircularDependency(task, schedule.tasks)) {
          conflicts.push({
            id: `circular_${task.id}`,
            type: 'dependency_violation',
            severity: 'high',
            description: `تبعية دائرية في المهمة: ${task.name}`,
            affectedTasks: [task.id],
            autoResolvable: false
          })
        }
      }

      return conflicts
    } catch (error) {
      console.error('Error validating dependencies:', error)
      return []
    }
  }

  // Helper methods
  private async convertTasksToGantt(tasks: Task[]): Promise<GanttTask[]> {
    return tasks.map(task => ({
      id: task.id,
      name: task.title,
      nameEn: task.titleEn,
      start: new Date(task.plannedStartDate),
      end: new Date(task.plannedEndDate),
      progress: task.progress,
      dependencies: task.dependencies.map(dep => dep.dependsOnTaskId),
      type: task.type as any,
      parent: task.parentTaskId,
      critical: false
    }))
  }

  private calculateProjectStart(tasks: GanttTask[]): Date {
    if (tasks.length === 0) return new Date()
    return new Date(Math.min(...tasks.map(t => t.start.getTime())))
  }

  private calculateProjectEnd(tasks: GanttTask[]): Date {
    if (tasks.length === 0) return new Date()
    return new Date(Math.max(...tasks.map(t => t.end.getTime())))
  }

  private async extractMilestones(tasks: GanttTask[]): Promise<Milestone[]> {
    return tasks
      .filter(task => task.type === 'milestone')
      .map(task => ({
        id: task.id,
        name: task.name,
        nameEn: task.nameEn,
        date: task.end,
        type: 'deliverable' as const,
        status: 'pending' as const,
        dependencies: task.dependencies
      }))
  }

  private hasCircularDependency(task: GanttTask, allTasks: GanttTask[], visited = new Set<string>()): boolean {
    if (visited.has(task.id)) {
      return true
    }

    visited.add(task.id)

    for (const depId of task.dependencies) {
      const depTask = allTasks.find(t => t.id === depId)
      if (depTask && this.hasCircularDependency(depTask, allTasks, new Set(visited))) {
        return true
      }
    }

    return false
  }

  // Critical Path Methods
  async calculateCriticalPath(projectId: string): Promise<CriticalPathAnalysis> {
    try {
      const schedule = await this.getSchedule(projectId)
      if (!schedule) {
        throw new Error('الجدولة غير موجودة')
      }

      return criticalPathCalculator.calculateCriticalPath(schedule)
    } catch (error) {
      console.error('Error calculating critical path:', error)
      throw new Error('فشل في حساب المسار الحرج')
    }
  }

  async getCriticalTasks(projectId: string): Promise<CriticalPathTask[]> {
    const analysis = await this.calculateCriticalPath(projectId)
    return analysis.tasks
  }

  async createBaseline(projectId: string, name: string, description?: string): Promise<ScheduleBaseline> {
    throw new Error('Method not implemented')
  }

  async getBaselines(projectId: string): Promise<ScheduleBaseline[]> {
    return []
  }

  async compareToBaseline(projectId: string, baselineId: string): Promise<ScheduleVariance[]> {
    return []
  }

  async assignResource(projectId: string, assignment: Omit<ResourceAssignment, 'id'>): Promise<ResourceAssignment> {
    throw new Error('Method not implemented')
  }

  async getResourceAssignments(projectId: string, resourceId?: string): Promise<ResourceAssignment[]> {
    return []
  }

  async checkResourceConflicts(projectId: string): Promise<ScheduleConflict[]> {
    return []
  }

  async setWorkingCalendar(projectId: string, calendar: WorkingCalendar): Promise<void> {
    const calendars = await asyncStorage.getItem(this.STORAGE_KEYS.CALENDARS, {})
    calendars[projectId] = calendar
    await asyncStorage.setItem(this.STORAGE_KEYS.CALENDARS, calendars)
  }

  async getWorkingCalendar(projectId: string): Promise<WorkingCalendar> {
    const calendars = await asyncStorage.getItem(this.STORAGE_KEYS.CALENDARS, {})
    return calendars[projectId] || this.DEFAULT_CALENDAR
  }

  async calculateWorkingDays(start: Date, end: Date, calendar: WorkingCalendar): Promise<number> {
    let workingDays = 0
    const current = new Date(start)
    
    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (calendar.workingDays.includes(dayOfWeek)) {
        workingDays++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return workingDays
  }

  async exportSchedule(projectId: string, options: ScheduleExport): Promise<Blob> {
    throw new Error('Method not implemented')
  }

  async importSchedule(projectId: string, file: File): Promise<ProjectSchedule> {
    throw new Error('Method not implemented')
  }

  async getScheduleMetrics(projectId: string): Promise<any> {
    return {}
  }

  async getProgressReport(projectId: string): Promise<any> {
    return {}
  }
}

export const schedulingService = new SchedulingServiceImpl()
