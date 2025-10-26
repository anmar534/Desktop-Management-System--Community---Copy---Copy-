/*
 * Task domain types
 */

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskType = 'task' | 'milestone' | 'phase' | 'deliverable'

export interface TaskAssignee {
  id: string
  name: string
  email?: string
  role?: string
  department?: string
  phone?: string
  avatarUrl?: string
}

export type TaskDependencyType =
  | 'finish_to_start'
  | 'start_to_start'
  | 'finish_to_finish'
  | 'start_to_finish'

export interface TaskDependency {
  id: string
  taskId: string
  dependsOnTaskId: string
  type?: TaskDependencyType
  lagDays?: number
  createdAt: string
  notes?: string
}

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  updatedAt: string
  mentions?: string[]
}

export interface TaskAttachment {
  id: string
  taskId: string
  name: string
  fileName?: string
  fileType?: string
  fileSize?: number
  url?: string
  uploadedBy: string
  uploadedAt: string
  description?: string
}

export interface TaskTimeEntry {
  id: string
  taskId: string
  userId: string
  hours: number
  description?: string
  entryDate?: string
  billable?: boolean
  createdAt: string
}

export interface TaskSubtask {
  id: string
  parentTaskId: string
  title: string
  status: TaskStatus
  progress: number
  assigneeId?: string
  dueDate?: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  progress: number
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  estimatedHours: number
  estimatedCost: number
  actualHours: number
  actualCost: number
  assigneeId?: string
  reviewerId?: string
  budgetCode?: string
  category?: string
  phase?: string
  tags: string[]
  dependencies: TaskDependency[]
  subtasks: TaskSubtask[]
  attachments: TaskAttachment[]
  comments: TaskComment[]
  timeEntries: TaskTimeEntry[]
  assignee?: TaskAssignee
  reviewer?: TaskAssignee
  createdBy: string
  lastModifiedBy: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface TaskBoardColumn {
  id: string
  boardId: string
  name: string
  status: TaskStatus
  order: number
  color?: string
  tasks: Task[]
}

export interface TaskFilters {
  projectId?: string
  status?: TaskStatus[]
  priority?: TaskPriority[]
  type?: TaskType[]
  assigneeId?: string
  search?: string
  tags?: string[]
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
}

export interface TaskSortOptions {
  field:
    | 'title'
    | 'priority'
    | 'status'
    | 'plannedStartDate'
    | 'plannedEndDate'
    | 'progress'
    | 'createdAt'
    | 'updatedAt'
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

export interface CreateTaskRequest {
  projectId: string
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
  category?: string
  phase?: string
  tags?: string[]
  dependencies?: TaskDependency[]
  subtasks?: TaskSubtask[]
  attachments?: TaskAttachment[]
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string
  status?: TaskStatus
  progress?: number
  actualHours?: number
  actualCost?: number
  actualStartDate?: string
  actualEndDate?: string
  tags?: string[]
  version: number
}
