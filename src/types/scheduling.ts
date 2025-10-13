/**
 * Scheduling and Gantt Chart Types
 * أنواع البيانات للجدولة الزمنية ومخططات جانت
 */

export interface GanttTask {
  id: string
  name: string
  nameEn?: string
  start: Date
  end: Date
  progress: number // 0-100
  dependencies: string[] // IDs of dependent tasks
  type: 'task' | 'milestone' | 'project' | 'group'
  parent?: string
  children?: GanttTask[]
  resource?: string
  color?: string
  critical?: boolean
  baseline?: {
    start: Date
    end: Date
  }
}

export interface ProjectSchedule {
  id: string
  projectId: string
  name: string
  nameEn?: string
  startDate: Date
  endDate: Date
  tasks: GanttTask[]
  milestones: Milestone[]
  criticalPath: string[] // Task IDs in critical path
  totalDuration: number // in days
  workingDays: number[]
  holidays: Date[]
  createdAt: string
  updatedAt: string
  version: number
}

export interface Milestone {
  id: string
  name: string
  nameEn?: string
  date: Date
  description?: string
  type: 'start' | 'finish' | 'deliverable' | 'review' | 'approval'
  status: 'pending' | 'achieved' | 'missed' | 'at_risk'
  dependencies: string[]
  responsible?: string
}

export interface CriticalPathAnalysis {
  path: string[] // Task IDs
  duration: number // Total duration in days
  slack: number // Total slack in days
  tasks: CriticalPathTask[]
  bottlenecks: string[] // Task IDs that are bottlenecks
}

export interface CriticalPathTask {
  id: string
  name: string
  duration: number
  earlyStart: Date
  earlyFinish: Date
  lateStart: Date
  lateFinish: Date
  totalSlack: number
  freeSlack: number
  isCritical: boolean
}

export interface ResourceAssignment {
  id: string
  taskId: string
  resourceId: string
  resourceName: string
  allocation: number // percentage 0-100
  startDate: Date
  endDate: Date
  cost: number
  units: number
}

export interface ScheduleBaseline {
  id: string
  projectId: string
  name: string
  description?: string
  baselineDate: Date
  tasks: GanttTask[]
  milestones: Milestone[]
  totalDuration: number
  totalCost: number
  createdAt: string
  createdBy: string
}

export interface ScheduleVariance {
  taskId: string
  taskName: string
  plannedStart: Date
  actualStart?: Date
  plannedEnd: Date
  actualEnd?: Date
  startVariance: number // days
  finishVariance: number // days
  durationVariance: number // days
  status: 'on_track' | 'ahead' | 'behind' | 'not_started'
}

export interface WorkingCalendar {
  id: string
  name: string
  workingDays: number[] // 0=Sunday, 1=Monday, etc.
  workingHours: {
    start: string // HH:mm
    end: string // HH:mm
    break?: {
      start: string
      end: string
    }
  }
  holidays: Date[]
  exceptions: CalendarException[]
}

export interface CalendarException {
  date: Date
  type: 'working' | 'non_working'
  hours?: {
    start: string
    end: string
  }
  description?: string
}

export interface SchedulingOptions {
  autoSchedule: boolean
  levelResources: boolean
  respectDependencies: boolean
  calendar: WorkingCalendar
  constraintType: 'asap' | 'alap' | 'snet' | 'snlt' | 'fnet' | 'fnlt' | 'mso' | 'mfo'
  constraintDate?: Date
}

export interface ScheduleUpdate {
  taskId: string
  field: 'start' | 'end' | 'duration' | 'progress' | 'dependencies'
  oldValue: any
  newValue: any
  timestamp: string
  userId: string
  reason?: string
}

export interface ScheduleConflict {
  id: string
  type: 'resource_overallocation' | 'dependency_violation' | 'date_constraint' | 'calendar_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedTasks: string[]
  suggestedResolution?: string
  autoResolvable: boolean
}

export interface GanttViewOptions {
  timeScale: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  showCriticalPath: boolean
  showBaseline: boolean
  showProgress: boolean
  showDependencies: boolean
  showResources: boolean
  groupBy?: 'none' | 'phase' | 'resource' | 'priority' | 'status'
  filterBy?: {
    status?: string[]
    priority?: string[]
    resource?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
  }
}

export interface ScheduleExport {
  format: 'pdf' | 'excel' | 'mpp' | 'json' | 'csv'
  options: {
    includeBaseline?: boolean
    includeCriticalPath?: boolean
    includeResources?: boolean
    dateRange?: {
      start: Date
      end: Date
    }
    template?: string
  }
}

// Service interfaces
export interface SchedulingServiceInterface {
  // Schedule Management
  createSchedule(projectId: string, options: SchedulingOptions): Promise<ProjectSchedule>
  getSchedule(projectId: string): Promise<ProjectSchedule | null>
  updateSchedule(projectId: string, updates: Partial<ProjectSchedule>): Promise<ProjectSchedule>
  deleteSchedule(projectId: string): Promise<void>
  
  // Task Scheduling
  scheduleTask(projectId: string, task: Partial<GanttTask>): Promise<GanttTask>
  updateTaskSchedule(projectId: string, taskId: string, updates: Partial<GanttTask>): Promise<GanttTask>
  rescheduleTask(projectId: string, taskId: string, newStart: Date, newEnd?: Date): Promise<GanttTask>
  
  // Dependencies
  addDependency(projectId: string, taskId: string, dependsOnTaskId: string, type?: string): Promise<void>
  removeDependency(projectId: string, taskId: string, dependsOnTaskId: string): Promise<void>
  validateDependencies(projectId: string): Promise<ScheduleConflict[]>
  
  // Critical Path
  calculateCriticalPath(projectId: string): Promise<CriticalPathAnalysis>
  getCriticalTasks(projectId: string): Promise<CriticalPathTask[]>
  
  // Baseline Management
  createBaseline(projectId: string, name: string, description?: string): Promise<ScheduleBaseline>
  getBaselines(projectId: string): Promise<ScheduleBaseline[]>
  compareToBaseline(projectId: string, baselineId: string): Promise<ScheduleVariance[]>
  
  // Resource Management
  assignResource(projectId: string, assignment: Omit<ResourceAssignment, 'id'>): Promise<ResourceAssignment>
  getResourceAssignments(projectId: string, resourceId?: string): Promise<ResourceAssignment[]>
  checkResourceConflicts(projectId: string): Promise<ScheduleConflict[]>
  
  // Calendar Management
  setWorkingCalendar(projectId: string, calendar: WorkingCalendar): Promise<void>
  getWorkingCalendar(projectId: string): Promise<WorkingCalendar>
  calculateWorkingDays(start: Date, end: Date, calendar: WorkingCalendar): Promise<number>
  
  // Export and Import
  exportSchedule(projectId: string, options: ScheduleExport): Promise<Blob>
  importSchedule(projectId: string, file: File): Promise<ProjectSchedule>
  
  // Analytics
  getScheduleMetrics(projectId: string): Promise<any>
  getProgressReport(projectId: string): Promise<any>
}
