/**
 * Workflow Automation Component
 * Comprehensive interface for automated workflow management and task automation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Play, 
  Pause, 
  BarChart3,
  Users,
  FileText,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Mail,
  MessageSquare,
  Shield,
  Activity
} from 'lucide-react'

import workflowAutomationService from '@/application/services/workflowAutomationService'
import type {
  TenderAlert,
  WorkflowTask,
  TaskAssignmentRule,
  ComplianceCheck,
  ScheduledReport,
  NotificationTemplate,
  WorkflowStatistics,
  TaskMetrics,
  ComplianceMetrics,
  NotificationMetrics,
  TaskStatus,
  TaskPriority,
  TaskType,
  NotificationChannel,
  NotificationType
} from '@/shared/types/workflowAutomation'

interface WorkflowAutomationProps {
  className?: string
  onTaskCreated?: (task: WorkflowTask) => void
  onAlertTriggered?: (alert: TenderAlert) => void
  onComplianceIssue?: (issue: any) => void
}

const WorkflowAutomation: React.FC<WorkflowAutomationProps> = React.memo(({
  className = '',
  onTaskCreated,
  onAlertTriggered,
  onComplianceIssue
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [statistics, setStatistics] = useState<WorkflowStatistics | null>(null)
  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics | null>(null)
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics | null>(null)
  const [notificationMetrics, setNotificationMetrics] = useState<NotificationMetrics | null>(null)
  const [tenderAlerts, setTenderAlerts] = useState<TenderAlert[]>([])
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [assignmentRules, setAssignmentRules] = useState<TaskAssignmentRule[]>([])
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([])
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([])

  // Form states
  const [newAlert, setNewAlert] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    keywords: '',
    categories: '',
    minValue: '',
    maxValue: ''
  })

  const [newTask, setNewTask] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    type: 'tender_review' as TaskType,
    priority: 'medium' as TaskPriority,
    assignedTo: '',
    dueDate: '',
    estimatedDuration: ''
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        statsData,
        taskMetricsData,
        complianceMetricsData,
        notificationMetricsData,
        alertsData,
        tasksData,
        rulesData,
        checksData,
        reportsData,
        templatesData
      ] = await Promise.all([
        workflowAutomationService.getWorkflowStatistics(),
        workflowAutomationService.getTaskMetrics(),
        workflowAutomationService.getComplianceMetrics(),
        workflowAutomationService.getNotificationMetrics(),
        workflowAutomationService.getTenderAlerts(),
        workflowAutomationService.getTasks(),
        workflowAutomationService.getAssignmentRules(),
        workflowAutomationService.getComplianceChecks(),
        workflowAutomationService.getScheduledReports(),
        workflowAutomationService.getNotificationTemplates()
      ])

      setStatistics(statsData)
      setTaskMetrics(taskMetricsData)
      setComplianceMetrics(complianceMetricsData)
      setNotificationMetrics(notificationMetricsData)
      setTenderAlerts(alertsData)
      setTasks(tasksData)
      setAssignmentRules(rulesData)
      setComplianceChecks(checksData)
      setScheduledReports(reportsData)
      setNotificationTemplates(templatesData)
    } catch (err) {
      console.error('Error loading workflow data:', err)
      setError(err instanceof Error ? err.message : 'فشل في تحميل بيانات سير العمل')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreateAlert = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const alertData = {
        name: newAlert.name,
        nameAr: newAlert.nameAr,
        description: newAlert.description,
        descriptionAr: newAlert.descriptionAr,
        criteria: {
          keywords: newAlert.keywords.split(',').map(k => k.trim()).filter(k => k),
          keywordsAr: [],
          categories: newAlert.categories.split(',').map(c => c.trim()).filter(c => c),
          organizations: [],
          minValue: newAlert.minValue ? parseFloat(newAlert.minValue) : undefined,
          maxValue: newAlert.maxValue ? parseFloat(newAlert.maxValue) : undefined,
          locations: [],
          excludeKeywords: [],
          excludeKeywordsAr: [],
          minRelevanceScore: 0.7
        },
        isActive: true,
        recipients: [],
        notifications: {
          channels: ['email' as NotificationChannel],
          frequency: {
            immediate: true,
            digest: false,
            digestInterval: 'daily' as const
          },
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00',
            timezone: 'Asia/Riyadh',
            weekendsOnly: false
          },
          escalation: {
            enabled: false,
            levels: []
          },
          templates: {} as Record<NotificationType, string>
        }
      }

      const createdAlert = await workflowAutomationService.createTenderAlert(alertData)
      setTenderAlerts(prev => [...prev, createdAlert])
      
      // Reset form
      setNewAlert({
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        keywords: '',
        categories: '',
        minValue: '',
        maxValue: ''
      })

      if (onAlertTriggered) {
        onAlertTriggered(createdAlert)
      }
    } catch (err) {
      console.error('Error creating alert:', err)
      setError(err instanceof Error ? err.message : 'فشل في إنشاء التنبيه')
    } finally {
      setLoading(false)
    }
  }, [newAlert, onAlertTriggered])

  const handleCreateTask = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const taskData = {
        title: newTask.title,
        titleAr: newTask.titleAr,
        description: newTask.description,
        descriptionAr: newTask.descriptionAr,
        type: newTask.type,
        priority: newTask.priority,
        status: 'pending' as TaskStatus,
        assignedTo: newTask.assignedTo || undefined,
        assignedBy: 'current_user', // In real app, get from auth context
        dueDate: newTask.dueDate || undefined,
        estimatedDuration: newTask.estimatedDuration ? parseInt(newTask.estimatedDuration) : 60,
        dependencies: [],
        tags: [],
        attachments: [],
        comments: [],
        metadata: {}
      }

      const createdTask = await workflowAutomationService.createTask(taskData)
      setTasks(prev => [...prev, createdTask])
      
      // Reset form
      setNewTask({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        type: 'tender_review',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        estimatedDuration: ''
      })

      if (onTaskCreated) {
        onTaskCreated(createdTask)
      }
    } catch (err) {
      console.error('Error creating task:', err)
      setError(err instanceof Error ? err.message : 'فشل في إنشاء المهمة')
    } finally {
      setLoading(false)
    }
  }, [newTask, onTaskCreated])

  const handleToggleAlert = useCallback(async (alertId: string, isActive: boolean) => {
    try {
      await workflowAutomationService.updateTenderAlert(alertId, { isActive })
      setTenderAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isActive } : alert
      ))
    } catch (err) {
      console.error('Error toggling alert:', err)
      setError(err instanceof Error ? err.message : 'فشل في تحديث التنبيه')
    }
  }, [])

  const handleToggleRule = useCallback(async (ruleId: string, isActive: boolean) => {
    try {
      await workflowAutomationService.updateAssignmentRule(ruleId, { isActive })
      setAssignmentRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive } : rule
      ))
    } catch (err) {
      console.error('Error toggling rule:', err)
      setError(err instanceof Error ? err.message : 'فشل في تحديث القاعدة')
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'warning':
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getPriorityColor = useCallback((priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours} ساعة ${remainingMinutes} دقيقة` : `${hours} ساعة`
  }, [])

  const memoizedStatistics = useMemo(() => statistics, [statistics])
  const memoizedTaskMetrics = useMemo(() => taskMetrics, [taskMetrics])
  const memoizedComplianceMetrics = useMemo(() => complianceMetrics, [complianceMetrics])
  const memoizedNotificationMetrics = useMemo(() => notificationMetrics, [notificationMetrics])

  if (loading && !statistics) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`} dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات سير العمل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">أتمتة سير العمل</h1>
          <p className="text-gray-600">إدارة وأتمتة العمليات والمهام التلقائية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Activity className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="alerts">تنبيهات الفرص</TabsTrigger>
          <TabsTrigger value="tasks">إدارة المهام</TabsTrigger>
          <TabsTrigger value="compliance">فحص الامتثال</TabsTrigger>
          <TabsTrigger value="reports">التقارير المجدولة</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {memoizedStatistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Statistics Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المهام</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memoizedStatistics.totalTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {memoizedStatistics.completedTasks} مكتملة
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">نقاط الامتثال</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(memoizedStatistics.complianceScore)}%</div>
                  <Progress value={memoizedStatistics.complianceScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">التنبيهات المفعلة</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memoizedStatistics.alertsTriggered}</div>
                  <p className="text-xs text-muted-foreground">
                    إجمالي التفعيلات
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الإشعارات المرسلة</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memoizedStatistics.notificationsSent}</div>
                  <p className="text-xs text-muted-foreground">
                    هذا الشهر
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Task Status Distribution */}
          {memoizedTaskMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>توزيع حالة المهام</CardTitle>
                <CardDescription>نظرة عامة على حالة المهام الحالية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{memoizedTaskMetrics.totalTasks}</div>
                    <p className="text-sm text-gray-600">إجمالي المهام</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{memoizedTaskMetrics.completedTasks}</div>
                    <p className="text-sm text-gray-600">مكتملة</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{Math.round(memoizedTaskMetrics.onTimeCompletion)}%</div>
                    <p className="text-sm text-gray-600">في الوقت المحدد</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{Math.round(memoizedTaskMetrics.taskEfficiency)}%</div>
                    <p className="text-sm text-gray-600">الكفاءة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>المهام الحديثة</CardTitle>
              <CardDescription>آخر المهام المنشأة والمحدثة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.titleAr || task.title}</h4>
                      <p className="text-sm text-gray-600">{task.descriptionAr || task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority === 'critical' ? 'حرج' :
                           task.priority === 'high' ? 'عالي' :
                           task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === 'pending' ? 'معلقة' :
                           task.status === 'in_progress' ? 'قيد التنفيذ' :
                           task.status === 'completed' ? 'مكتملة' :
                           task.status === 'cancelled' ? 'ملغية' : 'متوقفة'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {task.dueDate && new Date(task.dueDate).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tender Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* Create New Alert */}
          <Card>
            <CardHeader>
              <CardTitle>إنشاء تنبيه جديد</CardTitle>
              <CardDescription>إعداد تنبيه تلقائي للفرص التجارية الجديدة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-name">اسم التنبيه</Label>
                  <Input
                    id="alert-name"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: تنبيهات مشاريع البناء"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-name-ar">الاسم بالعربية</Label>
                  <Input
                    id="alert-name-ar"
                    value={newAlert.nameAr}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, nameAr: e.target.value }))}
                    placeholder="تنبيهات مشاريع البناء"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-description">الوصف</Label>
                  <Input
                    id="alert-description"
                    value={newAlert.description}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف التنبيه"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-description-ar">الوصف بالعربية</Label>
                  <Input
                    id="alert-description-ar"
                    value={newAlert.descriptionAr}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, descriptionAr: e.target.value }))}
                    placeholder="وصف التنبيه بالعربية"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-keywords">الكلمات المفتاحية</Label>
                  <Input
                    id="alert-keywords"
                    value={newAlert.keywords}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="بناء، إنشاءات، مستشفى (مفصولة بفواصل)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-categories">الفئات</Label>
                  <Input
                    id="alert-categories"
                    value={newAlert.categories}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, categories: e.target.value }))}
                    placeholder="إنشاءات، صحة، تعليم (مفصولة بفواصل)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-min-value">الحد الأدنى للقيمة (ريال)</Label>
                  <Input
                    id="alert-min-value"
                    type="number"
                    value={newAlert.minValue}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, minValue: e.target.value }))}
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-max-value">الحد الأقصى للقيمة (ريال)</Label>
                  <Input
                    id="alert-max-value"
                    type="number"
                    value={newAlert.maxValue}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, maxValue: e.target.value }))}
                    placeholder="100000000"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateAlert}
                disabled={loading || !newAlert.name}
                className="w-full"
              >
                <Bell className="h-4 w-4 ml-2" />
                إنشاء التنبيه
              </Button>
            </CardContent>
          </Card>

          {/* Existing Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات الحالية</CardTitle>
              <CardDescription>إدارة التنبيهات الموجودة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenderAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد تنبيهات مُعدة حالياً
                  </div>
                ) : (
                  tenderAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.nameAr || alert.name}</h4>
                        <p className="text-sm text-gray-600">{alert.descriptionAr || alert.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={alert.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {alert.isActive ? 'نشط' : 'متوقف'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            تم التفعيل {alert.triggerCount} مرة
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAlert(alert.id, !alert.isActive)}
                        >
                          {alert.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {alert.isActive ? 'إيقاف' : 'تشغيل'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                          تعديل
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {/* Create New Task */}
          <Card>
            <CardHeader>
              <CardTitle>إنشاء مهمة جديدة</CardTitle>
              <CardDescription>إضافة مهمة جديدة إلى سير العمل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">عنوان المهمة</Label>
                  <Input
                    id="task-title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: مراجعة العطاء الجديد"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-title-ar">العنوان بالعربية</Label>
                  <Input
                    id="task-title-ar"
                    value={newTask.titleAr}
                    onChange={(e) => setNewTask(prev => ({ ...prev, titleAr: e.target.value }))}
                    placeholder="مراجعة العطاء الجديد"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-description">الوصف</Label>
                  <Input
                    id="task-description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف تفصيلي للمهمة"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description-ar">الوصف بالعربية</Label>
                  <Input
                    id="task-description-ar"
                    value={newTask.descriptionAr}
                    onChange={(e) => setNewTask(prev => ({ ...prev, descriptionAr: e.target.value }))}
                    placeholder="وصف تفصيلي للمهمة بالعربية"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-type">نوع المهمة</Label>
                  <select
                    id="task-type"
                    value={newTask.type}
                    onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value as TaskType }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    aria-label="نوع المهمة"
                  >
                    <option value="tender_review">مراجعة العطاء</option>
                    <option value="pricing_analysis">تحليل التسعير</option>
                    <option value="compliance_check">فحص الامتثال</option>
                    <option value="document_preparation">إعداد الوثائق</option>
                    <option value="submission">التقديم</option>
                    <option value="follow_up">المتابعة</option>
                    <option value="reporting">التقارير</option>
                    <option value="quality_assurance">ضمان الجودة</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority">الأولوية</Label>
                  <select
                    id="task-priority"
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    aria-label="أولوية المهمة"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="critical">حرجة</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-duration">المدة المقدرة (دقيقة)</Label>
                  <Input
                    id="task-duration"
                    type="number"
                    value={newTask.estimatedDuration}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">المُعيَّن إليه</Label>
                  <Input
                    id="task-assignee"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                    placeholder="معرف المستخدم أو اتركه فارغاً للتعيين التلقائي"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due-date">تاريخ الاستحقاق</Label>
                  <Input
                    id="task-due-date"
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateTask}
                disabled={loading || !newTask.title}
                className="w-full"
              >
                <FileText className="h-4 w-4 ml-2" />
                إنشاء المهمة
              </Button>
            </CardContent>
          </Card>

          {/* Task Assignment Rules */}
          <Card>
            <CardHeader>
              <CardTitle>قواعد تعيين المهام</CardTitle>
              <CardDescription>إدارة القواعد التلقائية لتعيين المهام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignmentRules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد قواعد تعيين مُعدة حالياً
                  </div>
                ) : (
                  assignmentRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{rule.nameAr || rule.name}</h4>
                        <p className="text-sm text-gray-600">{rule.descriptionAr || rule.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {rule.isActive ? 'نشط' : 'متوقف'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            أولوية: {rule.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRule(rule.id, !rule.isActive)}
                        >
                          {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {rule.isActive ? 'إيقاف' : 'تشغيل'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                          تعديل
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>المهام الحديثة</CardTitle>
              <CardDescription>آخر المهام المنشأة والمحدثة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد مهام حالياً
                  </div>
                ) : (
                  tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.titleAr || task.title}</h4>
                        <p className="text-sm text-gray-600">{task.descriptionAr || task.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority === 'critical' ? 'حرج' :
                             task.priority === 'high' ? 'عالي' :
                             task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status === 'pending' ? 'معلقة' :
                             task.status === 'in_progress' ? 'قيد التنفيذ' :
                             task.status === 'completed' ? 'مكتملة' :
                             task.status === 'cancelled' ? 'ملغية' : 'متوقفة'}
                          </Badge>
                          {task.assignedTo && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 ml-1" />
                              {task.assignedTo}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.dueDate && (
                          <div>
                            <Clock className="h-4 w-4 inline ml-1" />
                            {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                          </div>
                        )}
                        {task.estimatedDuration && (
                          <div className="mt-1">
                            {formatDuration(task.estimatedDuration)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          {/* Compliance Metrics */}
          {memoizedComplianceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الفحوصات</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memoizedComplianceMetrics.totalChecks}</div>
                  <p className="text-xs text-muted-foreground">
                    {memoizedComplianceMetrics.passedChecks} نجح
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">نقاط الامتثال</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(memoizedComplianceMetrics.averageScore)}%</div>
                  <Progress value={memoizedComplianceMetrics.averageScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">القضايا الحرجة</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{memoizedComplianceMetrics.criticalIssues}</div>
                  <p className="text-xs text-muted-foreground">
                    تحتاج إلى إجراء فوري
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((memoizedComplianceMetrics.passedChecks / memoizedComplianceMetrics.totalChecks) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    من إجمالي الفحوصات
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Compliance Checks */}
          <Card>
            <CardHeader>
              <CardTitle>فحوصات الامتثال</CardTitle>
              <CardDescription>إدارة فحوصات الامتثال التلقائية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceChecks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد فحوصات امتثال مُعدة حالياً
                  </div>
                ) : (
                  complianceChecks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{check.nameAr || check.name}</h4>
                        <p className="text-sm text-gray-600">{check.descriptionAr || check.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={check.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {check.isActive ? 'نشط' : 'متوقف'}
                          </Badge>
                          <Badge className={check.isMandatory ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                            {check.isMandatory ? 'إجباري' : 'اختياري'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            تم التنفيذ {check.executionCount} مرة
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                          تشغيل
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                          تعديل
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          {/* Scheduled Reports */}
          <Card>
            <CardHeader>
              <CardTitle>التقارير المجدولة</CardTitle>
              <CardDescription>إدارة التقارير التلقائية المجدولة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد تقارير مجدولة حالياً
                  </div>
                ) : (
                  scheduledReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{report.nameAr || report.name}</h4>
                        <p className="text-sm text-gray-600">{report.descriptionAr || report.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={report.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {report.isActive ? 'نشط' : 'متوقف'}
                          </Badge>
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 ml-1" />
                            {report.schedule.type === 'daily' ? 'يومي' :
                             report.schedule.type === 'weekly' ? 'أسبوعي' :
                             report.schedule.type === 'monthly' ? 'شهري' :
                             report.schedule.type === 'quarterly' ? 'ربع سنوي' :
                             report.schedule.type === 'yearly' ? 'سنوي' : 'مخصص'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            تم التوليد {report.generationCount} مرة
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          التوليد التالي: {new Date(report.nextGeneration).toLocaleString('ar-SA')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                          توليد الآن
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                          تعديل
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Notification Metrics */}
          {memoizedNotificationMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المرسل</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memoizedNotificationMetrics.totalSent}</div>
                  <p className="text-xs text-muted-foreground">
                    إشعار هذا الشهر
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل التسليم</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{Math.round(memoizedNotificationMetrics.deliveryRate)}%</div>
                  <Progress value={memoizedNotificationMetrics.deliveryRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل الفتح</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{memoizedNotificationMetrics.openRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    من الإشعارات المرسلة
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل النقر</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{memoizedNotificationMetrics.clickRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    من الإشعارات المفتوحة
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notification Templates */}
          <Card>
            <CardHeader>
              <CardTitle>قوالب الإشعارات</CardTitle>
              <CardDescription>إدارة قوالب الإشعارات المختلفة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationTemplates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد قوالب إشعارات مُعدة حالياً
                  </div>
                ) : (
                  notificationTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{template.nameAr || template.name}</h4>
                        <p className="text-sm text-gray-600">{template.subjectAr || template.subject}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {template.isActive ? 'نشط' : 'متوقف'}
                          </Badge>
                          <Badge variant="outline">
                            <MessageSquare className="h-3 w-3 ml-1" />
                            {template.channel === 'email' ? 'بريد إلكتروني' :
                             template.channel === 'sms' ? 'رسالة نصية' :
                             template.channel === 'push' ? 'إشعار فوري' :
                             template.channel === 'in_app' ? 'داخل التطبيق' : 'ويب هوك'}
                          </Badge>
                          <Badge variant="outline">
                            {template.type === 'tender_alert' ? 'تنبيه عطاء' :
                             template.type === 'task_assignment' ? 'تعيين مهمة' :
                             template.type === 'deadline_reminder' ? 'تذكير موعد' :
                             template.type === 'compliance_issue' ? 'مشكلة امتثال' :
                             template.type === 'report_ready' ? 'تقرير جاهز' :
                             template.type === 'system_alert' ? 'تنبيه نظام' : 'طلب موافقة'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4" />
                          اختبار
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                          تعديل
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
})

WorkflowAutomation.displayName = 'WorkflowAutomation'

export default WorkflowAutomation


