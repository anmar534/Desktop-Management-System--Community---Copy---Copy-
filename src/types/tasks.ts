/**
 * Task Management Types
 * أنواع البيانات لإدارة المهام والأنشطة
 */

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskType = 'task' | 'milestone' | 'phase' | 'deliverable'

export interface TaskAssignee {
  id: string
  name: string
  nameEn?: string
  email: string
  role: string
  department: string
  avatar?: string
  isActive: boolean
}

export interface TaskDependency {
  id: string
  taskId: string
  dependsOnTaskId: string
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
  lag: number // في الأيام
  createdAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  authorName: string
  content: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

export interface TaskAttachment {
  id: string
  taskId: string
  fileName: string
  fileSize: number
  fileType: string
  filePath: string
  uploadedBy: string
  uploadedAt: string
}

export interface TaskTimeEntry {
  id: string
  taskId: string
  userId: string
  userName: string
  description: string
  hoursSpent: number
  date: string
  billable: boolean
  createdAt: string
}

export interface Task {
  id: string
  projectId: string
  parentTaskId?: string
  
  // معلومات أساسية
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  type: TaskType
  
  // الحالة والأولوية
  status: TaskStatus
  priority: TaskPriority
  progress: number // 0-100
  
  // التوقيتات
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  estimatedHours: number
  actualHours: number
  
  // التخصيص
  assigneeId?: string
  assignee?: TaskAssignee
  reviewerId?: string
  reviewer?: TaskAssignee
  
  // التكلفة والميزانية
  estimatedCost: number
  actualCost: number
  budgetCode?: string
  
  // العلاقات
  dependencies: TaskDependency[]
  subtasks: Task[]
  
  // المرفقات والتعليقات
  attachments: TaskAttachment[]
  comments: TaskComment[]
  timeEntries: TaskTimeEntry[]
  
  // العلامات والتصنيف
  tags: string[]
  category?: string
  phase?: string
  
  // البيانات الوصفية
  createdAt: string
  updatedAt: string
  createdBy: string
  lastModifiedBy: string
  version: number
}

export interface CreateTaskRequest {
  projectId: string
  parentTaskId?: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  type: TaskType
  priority: TaskPriority
  plannedStartDate: string
  plannedEndDate: string
  estimatedHours: number
  estimatedCost: number
  assigneeId?: string
  reviewerId?: string
  budgetCode?: string
  tags?: string[]
  category?: string
  phase?: string
}

export interface UpdateTaskRequest {
  id: string
  title?: string
  titleEn?: string
  description?: string
  descriptionEn?: string
  status?: TaskStatus
  priority?: TaskPriority
  progress?: number
  plannedStartDate?: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  assigneeId?: string
  reviewerId?: string
  budgetCode?: string
  tags?: string[]
  category?: string
  phase?: string
  version: number
}

export interface TaskFilters {
  projectId?: string
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assigneeId?: string
  type?: TaskType[]
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
  tags?: string[]
  category?: string
  phase?: string
  search?: string
}

export interface TaskSortOptions {
  field: 'title' | 'priority' | 'status' | 'plannedStartDate' | 'plannedEndDate' | 'progress' | 'createdAt'
  direction: 'asc' | 'desc'
}

export interface TaskStatistics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  completionRate: number
  averageCompletionTime: number
  totalEstimatedHours: number
  totalActualHours: number
  totalEstimatedCost: number
  totalActualCost: number
  tasksByStatus: Record<TaskStatus, number>
  tasksByPriority: Record<TaskPriority, number>
  tasksByAssignee: Record<string, number>
}

export interface TaskBoard {
  id: string
  projectId: string
  name: string
  nameEn?: string
  description?: string
  columns: TaskBoardColumn[]
  settings: TaskBoardSettings
  createdAt: string
  updatedAt: string
}

export interface TaskBoardColumn {
  id: string
  boardId: string
  name: string
  nameEn?: string
  status: TaskStatus
  order: number
  color: string
  wipLimit?: number // Work In Progress limit
  tasks: Task[]
}

export interface TaskBoardSettings {
  allowWipLimits: boolean
  showEstimates: boolean
  showAssignees: boolean
  showDueDates: boolean
  showProgress: boolean
  autoMoveCompleted: boolean
  swimlanes: 'none' | 'assignee' | 'priority' | 'phase'
}

export interface TaskTemplate {
  id: string
  name: string
  nameEn?: string
  description: string
  category: string
  tasks: Omit<CreateTaskRequest, 'projectId'>[]
  createdAt: string
  updatedAt: string
}

export interface TaskValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface TaskProgressUpdate {
  taskId: string
  progress: number
  actualHours?: number
  actualCost?: number
  status?: TaskStatus
  notes?: string
  updatedBy: string
  updatedAt: string
}

export interface TaskNotification {
  id: string
  taskId: string
  type: 'assignment' | 'status_change' | 'due_date' | 'overdue' | 'completion' | 'comment'
  recipientId: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

// إعدادات التنبيهات
export interface TaskNotificationSettings {
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  notifyOnAssignment: boolean
  notifyOnStatusChange: boolean
  notifyOnDueDate: boolean
  notifyOnOverdue: boolean
  notifyOnComments: boolean
  reminderDaysBefore: number
}

// تقرير أداء المهام
export interface TaskPerformanceReport {
  projectId: string
  period: {
    startDate: string
    endDate: string
  }
  statistics: TaskStatistics
  trends: {
    completionRate: { date: string; rate: number }[]
    productivity: { date: string; tasksCompleted: number }[]
    efficiency: { date: string; hoursPerTask: number }[]
  }
  topPerformers: {
    assigneeId: string
    assigneeName: string
    tasksCompleted: number
    averageCompletionTime: number
    efficiency: number
  }[]
  bottlenecks: {
    taskId: string
    taskTitle: string
    daysOverdue: number
    blockedTasks: number
  }[]
  recommendations: string[]
}
