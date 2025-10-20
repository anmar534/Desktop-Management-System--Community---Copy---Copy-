/**
 * Task Details Component
 * مكون تفاصيل المهمة
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
// import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Separator } from '../ui/separator'
import { 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  MessageSquare,
  Paperclip,
  Timer,
  TrendingUp,
  Target
} from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '../../types/tasks'
import { taskManagementService } from '../../services/taskManagementService'
import { toast } from 'sonner'

interface TaskDetailsProps {
  taskId: string
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onClose?: () => void
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
    icon: <Clock className="w-4 h-4" />
  },
  in_progress: {
    label: 'قيد التنفيذ',
    color: 'bg-blue-100 text-blue-800',
    icon: <Timer className="w-4 h-4" />
  },
  completed: {
    label: 'مكتملة',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="w-4 h-4" />
  },
  on_hold: {
    label: 'معلقة',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <AlertTriangle className="w-4 h-4" />
  },
  cancelled: {
    label: 'ملغية',
    color: 'bg-red-100 text-red-800',
    icon: <AlertTriangle className="w-4 h-4" />
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

export const TaskDetails: React.FC<TaskDetailsProps> = ({
  taskId,
  onEdit,
  onDelete,
  onClose,
  className = ''
}) => {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTask()
  }, [taskId])

  const loadTask = async () => {
    try {
      setLoading(true)
      const taskData = await taskManagementService.getTaskById(taskId)
      setTask(taskData)
    } catch (error) {
      console.error('خطأ في تحميل المهمة:', error)
      toast.error('فشل في تحميل تفاصيل المهمة')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return

    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      try {
        await taskManagementService.deleteTask(task.id)
        toast.success('تم حذف المهمة بنجاح')
        onDelete?.(task.id)
        onClose?.()
      } catch (error) {
        console.error('خطأ في حذف المهمة:', error)
        toast.error('فشل في حذف المهمة')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  const isOverdue = (task: Task) => {
    const today = new Date()
    const endDate = new Date(task.plannedEndDate)
    return endDate < today && task.status !== 'completed'
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل تفاصيل المهمة...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">المهمة غير موجودة</h3>
        <p className="text-muted-foreground">لم يتم العثور على المهمة المطلوبة</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* رأس المهمة */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{task.title}</CardTitle>
              {task.titleEn && (
                <p className="text-sm text-muted-foreground">{task.titleEn}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(task)}
              >
                <Edit className="w-4 h-4 mr-2" />
                تعديل
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                حذف
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* الحالة */}
            <div className="flex items-center gap-2">
              <Badge className={statusConfig[task.status].color}>
                {statusConfig[task.status].icon}
                <span className="mr-1">{statusConfig[task.status].label}</span>
              </Badge>
              
              {isOverdue(task) && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  متأخرة
                </Badge>
              )}
            </div>

            {/* الأولوية */}
            <div className="flex items-center gap-2">
              <Badge className={priorityConfig[task.priority].color}>
                {priorityConfig[task.priority].label}
              </Badge>
            </div>

            {/* النوع */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {task.type === 'task' && 'مهمة'}
                {task.type === 'milestone' && 'معلم'}
                {task.type === 'phase' && 'مرحلة'}
                {task.type === 'deliverable' && 'مخرج'}
              </Badge>
            </div>
          </div>

          {/* التقدم */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">التقدم</span>
              <span className="text-sm text-muted-foreground">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* التفاصيل */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="timeline">الجدولة</TabsTrigger>
          <TabsTrigger value="resources">الموارد</TabsTrigger>
          <TabsTrigger value="activity">النشاط</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الوصف</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {task.description}
              </p>
              {task.descriptionEn && (
                <>
                  <Separator className="my-4" />
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {task.descriptionEn}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* المخصص له */}
          {task.assignee && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">المخصص له</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {task.assignee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{task.assignee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.assignee.role} - {task.assignee.department}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {task.assignee.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* العلامات */}
          {task.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">العلامات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* الجدولة */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">التواريخ المخططة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">تاريخ البداية</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(task.plannedStartDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">تاريخ النهاية</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(task.plannedEndDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">المدة المخططة</p>
                  <p className="text-sm text-muted-foreground">
                    {calculateDuration(task.plannedStartDate, task.plannedEndDate)} يوم
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* التواريخ الفعلية */}
          {(task.actualStartDate || task.actualEndDate) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">التواريخ الفعلية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.actualStartDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">تاريخ البداية الفعلي</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(task.actualStartDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {task.actualEndDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">تاريخ النهاية الفعلي</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(task.actualEndDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* الموارد */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الساعات والتكلفة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* الساعات */}
                <div className="space-y-3">
                  <h4 className="font-medium">الساعات</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">مقدرة</span>
                    <span className="font-medium">{task.estimatedHours} ساعة</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">فعلية</span>
                    <span className="font-medium">{task.actualHours} ساعة</span>
                  </div>
                  
                  {task.estimatedHours > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">الانحراف</span>
                      <span className={`font-medium ${
                        task.actualHours > task.estimatedHours 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {task.actualHours - task.estimatedHours > 0 ? '+' : ''}
                        {task.actualHours - task.estimatedHours} ساعة
                      </span>
                    </div>
                  )}
                </div>

                {/* التكلفة */}
                <div className="space-y-3">
                  <h4 className="font-medium">التكلفة</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">مقدرة</span>
                    <span className="font-medium">{formatCurrency(task.estimatedCost)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">فعلية</span>
                    <span className="font-medium">{formatCurrency(task.actualCost)}</span>
                  </div>
                  
                  {task.estimatedCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">الانحراف</span>
                      <span className={`font-medium ${
                        task.actualCost > task.estimatedCost 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {formatCurrency(task.actualCost - task.estimatedCost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* النشاط */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">سجل النشاط</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">تم إنشاء المهمة</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(task.createdAt)} بواسطة {task.createdBy}
                    </p>
                  </div>
                </div>
                
                {task.updatedAt !== task.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">تم تحديث المهمة</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(task.updatedAt)} بواسطة {task.lastModifiedBy}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TaskDetails

