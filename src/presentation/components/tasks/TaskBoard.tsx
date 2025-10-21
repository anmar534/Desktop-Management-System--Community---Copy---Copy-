/**
 * Task Board Component - Kanban Style
 * مكون لوحة المهام بنمط كانبان
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import type { DropResult } from 'react-beautiful-dnd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
// import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Progress } from '../ui/progress'
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  Circle,
  Pause,
  X
} from 'lucide-react'
import type { Task, TaskStatus, TaskPriority, TaskBoardColumn } from '../../types/tasks'
import { taskManagementService } from '@/services/taskManagementService'
import { toast } from 'sonner'

interface TaskBoardProps {
  projectId: string
  onTaskClick?: (task: Task) => void
  onCreateTask?: (status: TaskStatus) => void
  className?: string
}

const statusConfig: Record<TaskStatus, { 
  label: string
  color: string
  icon: React.ReactNode
}> = {
  not_started: {
    label: 'لم تبدأ',
    color: 'bg-gray-100 text-gray-800',
    icon: <Circle className="w-4 h-4" />
  },
  in_progress: {
    label: 'قيد التنفيذ',
    color: 'bg-blue-100 text-blue-800',
    icon: <Clock className="w-4 h-4" />
  },
  completed: {
    label: 'مكتملة',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="w-4 h-4" />
  },
  on_hold: {
    label: 'معلقة',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Pause className="w-4 h-4" />
  },
  cancelled: {
    label: 'ملغية',
    color: 'bg-red-100 text-red-800',
    icon: <X className="w-4 h-4" />
  }
}

const priorityConfig: Record<TaskPriority, {
  label: string
  color: string
}> = {
  low: { label: 'منخفضة', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'متوسطة', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'عالية', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'حرجة', color: 'bg-red-100 text-red-800' }
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  projectId,
  onTaskClick,
  onCreateTask,
  className = ''
}) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState<TaskBoardColumn[]>([])

  // تحميل المهام
  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const projectTasks = await taskManagementService.getProjectTasks(projectId)
      setTasks(projectTasks)
      
      // تنظيم المهام في أعمدة
      organizeTasksIntoColumns(projectTasks)
    } catch (error) {
      console.error('خطأ في تحميل المهام:', error)
      toast.error('فشل في تحميل المهام')
    } finally {
      setLoading(false)
    }
  }

  const organizeTasksIntoColumns = (tasks: Task[]) => {
    const statuses: TaskStatus[] = ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']
    
    const newColumns: TaskBoardColumn[] = statuses.map((status, index) => ({
      id: status,
      boardId: projectId,
      name: statusConfig[status].label,
      status,
      order: index,
      color: statusConfig[status].color,
      tasks: tasks.filter(task => task.status === status)
    }))

    setColumns(newColumns)
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // إذا لم يتم إسقاط العنصر في مكان صحيح
    if (!destination) return

    // إذا تم إسقاط العنصر في نفس المكان
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    try {
      const task = tasks.find(t => t.id === draggableId)
      if (!task) return

      const newStatus = destination.droppableId as TaskStatus

      // تحديث حالة المهمة
      await taskManagementService.updateTask({
        id: task.id,
        status: newStatus,
        version: task.version
      })

      // إعادة تحميل المهام
      await loadTasks()
      
      toast.success('تم تحديث حالة المهمة بنجاح')
    } catch (error) {
      console.error('خطأ في تحديث حالة المهمة:', error)
      toast.error('فشل في تحديث حالة المهمة')
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString))
  }

  const isOverdue = (task: Task) => {
    const today = new Date()
    const endDate = new Date(task.plannedEndDate)
    return endDate < today && task.status !== 'completed'
  }

  const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
            snapshot.isDragging ? 'shadow-lg rotate-2' : ''
          } ${isOverdue(task) ? 'border-red-300 bg-red-50' : ''}`}
          onClick={() => onTaskClick?.(task)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm font-medium line-clamp-2">
                {task.title}
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* الوصف */}
            {task.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* الأولوية */}
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${priorityConfig[task.priority].color}`}
              >
                {priorityConfig[task.priority].label}
              </Badge>
              
              {isOverdue(task) && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  متأخرة
                </Badge>
              )}
            </div>

            {/* التقدم */}
            {task.progress > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>التقدم</span>
                  <span>{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-1" />
              </div>
            )}

            {/* التواريخ */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.plannedEndDate)}</span>
            </div>

            {/* المخصص له */}
            {task.assignee && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  {task.assignee.name.charAt(0)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {task.assignee.name}
                </span>
              </div>
            )}

            {/* العلامات */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{task.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  )

  const ColumnHeader: React.FC<{ column: TaskBoardColumn }> = ({ column }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {statusConfig[column.status].icon}
        <h3 className="font-medium">{column.name}</h3>
        <Badge variant="secondary" className="text-xs">
          {column.tasks.length}
        </Badge>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCreateTask?.(column.status)}
        className="h-8 w-8 p-0"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل المهام...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full ${className}`} dir="rtl">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 h-full">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              <ColumnHeader column={column} />
              
              <Droppable droppableId={column.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'bg-muted/50 border-2 border-dashed border-primary' 
                        : 'bg-muted/20'
                    }`}
                  >
                    {column.tasks.map((task, index) => (
                      <TaskCard key={task.id} task={task} index={index} />
                    ))}
                    {provided.placeholder}
                    
                    {column.tasks.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        لا توجد مهام
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

export default TaskBoard


