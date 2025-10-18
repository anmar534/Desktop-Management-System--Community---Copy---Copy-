/**
 * Gantt Chart Component
 * مكون مخطط جانت التفاعلي
 */

import type React from 'react';
import { useState, useEffect, useMemo } from 'react'
import type { Task, DisplayOption } from 'gantt-task-react';
import { Gantt, ViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Pause,
  ZoomIn,
  ZoomOut,
  Filter,
  Download,
  Settings
} from 'lucide-react'
import type { 
  ProjectSchedule, 
  GanttTask as CustomGanttTask, 
  CriticalPathAnalysis,
  GanttViewOptions 
} from '../../types/scheduling'
import { schedulingService } from '../../services/schedulingService'
import { toast } from 'sonner'

interface GanttChartProps {
  projectId: string
  schedule?: ProjectSchedule
  onTaskUpdate?: (taskId: string, updates: Partial<CustomGanttTask>) => void
  onTaskSelect?: (task: CustomGanttTask) => void
  className?: string
}

export const GanttChart: React.FC<GanttChartProps> = ({
  projectId,
  schedule,
  onTaskUpdate,
  onTaskSelect,
  className = ''
}) => {
  const [currentSchedule, setCurrentSchedule] = useState<ProjectSchedule | null>(schedule || null)
  const [criticalPath, setCriticalPath] = useState<CriticalPathAnalysis | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day)
  const [viewOptions, setViewOptions] = useState<GanttViewOptions>({
    timeScale: 'day',
    showCriticalPath: true,
    showBaseline: false,
    showProgress: true,
    showDependencies: true,
    showResources: false,
    groupBy: 'none'
  })
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  // تحويل المهام إلى تنسيق gantt-task-react
  const ganttTasks = useMemo(() => {
    if (!currentSchedule) return []

    return currentSchedule.tasks.map((task): Task => ({
      start: task.start,
      end: task.end,
      name: task.name,
      id: task.id,
      type: task.type === 'milestone' ? 'milestone' : 
            task.type === 'project' ? 'project' : 'task',
      progress: task.progress,
      isDisabled: false,
      styles: {
        backgroundColor: task.critical ? '#ef4444' : 
                        task.color || '#3b82f6',
        backgroundSelectedColor: '#1d4ed8',
        progressColor: '#10b981',
        progressSelectedColor: '#059669'
      },
      dependencies: task.dependencies,
      project: task.parent
    }))
  }, [currentSchedule])

  // تحميل الجدولة
  useEffect(() => {
    if (!schedule) {
      loadSchedule()
    }
  }, [projectId, schedule])

  // تحميل المسار الحرج
  useEffect(() => {
    if (currentSchedule && viewOptions.showCriticalPath) {
      loadCriticalPath()
    }
  }, [currentSchedule, viewOptions.showCriticalPath])

  const loadSchedule = async () => {
    try {
      setLoading(true)
      const scheduleData = await schedulingService.getSchedule(projectId)
      setCurrentSchedule(scheduleData)
    } catch (error) {
      console.error('Error loading schedule:', error)
      toast.error('فشل في تحميل الجدولة الزمنية')
    } finally {
      setLoading(false)
    }
  }

  const loadCriticalPath = async () => {
    try {
      const analysis = await schedulingService.calculateCriticalPath(projectId)
      setCriticalPath(analysis)
    } catch (error) {
      console.error('Error loading critical path:', error)
    }
  }

  const handleTaskChange = async (task: Task) => {
    try {
      const updates: Partial<CustomGanttTask> = {
        start: task.start,
        end: task.end,
        progress: task.progress
      }

      await schedulingService.updateTaskSchedule(projectId, task.id, updates)
      
      // تحديث الحالة المحلية
      if (currentSchedule) {
        const updatedTasks = currentSchedule.tasks.map(t => 
          t.id === task.id ? { ...t, ...updates } : t
        )
        setCurrentSchedule({ ...currentSchedule, tasks: updatedTasks })
      }

      onTaskUpdate?.(task.id, updates)
      toast.success('تم تحديث المهمة بنجاح')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('فشل في تحديث المهمة')
    }
  }

  const handleTaskSelect = (task: Task, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTask(task.id)
      const customTask = currentSchedule?.tasks.find(t => t.id === task.id)
      if (customTask) {
        onTaskSelect?.(customTask)
      }
    } else {
      setSelectedTask(null)
    }
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    setViewOptions(prev => ({
      ...prev,
      timeScale: mode === ViewMode.Hour ? 'hour' :
                mode === ViewMode.Day ? 'day' :
                mode === ViewMode.Week ? 'week' :
                mode === ViewMode.Month ? 'month' : 'day'
    }))
  }

  const exportSchedule = async (format: 'pdf' | 'excel') => {
    try {
      const blob = await schedulingService.exportSchedule(projectId, {
        format,
        options: {
          includeBaseline: viewOptions.showBaseline,
          includeCriticalPath: viewOptions.showCriticalPath,
          includeResources: viewOptions.showResources
        }
      })
      
      // تحميل الملف
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `schedule_${projectId}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('تم تصدير الجدولة بنجاح')
    } catch (error) {
      console.error('Error exporting schedule:', error)
      toast.error('فشل في تصدير الجدولة')
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الجدولة الزمنية...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!currentSchedule || ganttTasks.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">لا توجد جدولة زمنية للمشروع</p>
            <Button onClick={loadSchedule}>
              إنشاء جدولة جديدة
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`} dir="ltr">
      {/* شريط الأدوات */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              مخطط جانت - {currentSchedule.name}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* أزرار العرض */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === ViewMode.Day ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange(ViewMode.Day)}
                >
                  يوم
                </Button>
                <Button
                  variant={viewMode === ViewMode.Week ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange(ViewMode.Week)}
                >
                  أسبوع
                </Button>
                <Button
                  variant={viewMode === ViewMode.Month ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange(ViewMode.Month)}
                >
                  شهر
                </Button>
              </div>

              {/* أزرار الإجراءات */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSchedule('pdf')}
              >
                <Download className="h-4 w-4 mr-1" />
                تصدير PDF
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSchedule('excel')}
              >
                <Download className="h-4 w-4 mr-1" />
                تصدير Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* معلومات المشروع */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                المدة: {currentSchedule.totalDuration} يوم
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                المهام: {ganttTasks.length}
              </span>
            </div>
            
            {criticalPath && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm">
                  المسار الحرج: {criticalPath.path.length} مهمة
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                الإصدار {currentSchedule.version}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مخطط جانت */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: '600px', overflow: 'auto' }}>
            <Gantt
              tasks={ganttTasks}
              viewMode={viewMode}
              onDateChange={handleTaskChange}
              onProgressChange={handleTaskChange}
              onSelect={handleTaskSelect}
              listCellWidth="200px"
              columnWidth={viewMode === ViewMode.Day ? 65 : 
                          viewMode === ViewMode.Week ? 250 : 300}
              locale="ar"
              rtl={false} // Keep LTR for better chart readability
              displayOption={{
                viewMode,
                locale: 'ar'
              } as DisplayOption}
            />
          </div>
        </CardContent>
      </Card>

      {/* معلومات المهمة المحددة */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل المهمة</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const task = currentSchedule.tasks.find(t => t.id === selectedTask)
              if (!task) return null
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">اسم المهمة</label>
                    <p className="text-sm text-gray-600">{task.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">تاريخ البداية</label>
                    <p className="text-sm text-gray-600">
                      {task.start.toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">تاريخ النهاية</label>
                    <p className="text-sm text-gray-600">
                      {task.end.toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">نسبة الإنجاز</label>
                    <p className="text-sm text-gray-600">{task.progress}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">النوع</label>
                    <Badge variant="outline">{task.type}</Badge>
                  </div>
                  {task.critical && (
                    <div>
                      <label className="text-sm font-medium">المسار الحرج</label>
                      <Badge variant="destructive">مهمة حرجة</Badge>
                    </div>
                  )}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
