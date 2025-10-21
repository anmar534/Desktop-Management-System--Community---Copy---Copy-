/**
 * Project Details Component
 * Display comprehensive project information and management options
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Tag,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
  Target,
  BarChart3,
  Settings
} from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { Progress } from '@/presentation/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import { Separator } from '@/presentation/components/ui/separator'
import type { EnhancedProject } from '../../types/projects'
import { enhancedProjectService } from '../../services/enhancedProjectService'

interface ProjectDetailsProps {
  projectId: string
  onBack?: () => void
  onEdit?: (project: EnhancedProject) => void
  onDelete?: (projectId: string) => void
  className?: string
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  projectId,
  onBack,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [project, setProject] = useState<EnhancedProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      const projectData = await enhancedProjectService.getProjectById(projectId)
      setProject(projectData)
    } catch (error) {
      console.error('Error loading project:', error)
      // TODO: Show error notification
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return
    
    // TODO: Show confirmation dialog
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا المشروع؟')
    if (!confirmed) return

    try {
      await enhancedProjectService.deleteProject(project.id)
      onDelete?.(project.id)
    } catch (error) {
      console.error('Error deleting project:', error)
      // TODO: Show error notification
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="h-5 w-5" />
      case 'completed':
        return <CheckCircle className="h-5 w-5" />
      case 'delayed':
        return <AlertTriangle className="h-5 w-5" />
      case 'paused':
        return <Pause className="h-5 w-5" />
      case 'planning':
        return <Clock className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'delayed':
        return 'bg-red-100 text-red-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'planning':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
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
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green':
        return 'bg-green-500'
      case 'yellow':
        return 'bg-yellow-500'
      case 'red':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString))
  }

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`} dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل المشروع...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className={`text-center py-12 ${className}`} dir="rtl">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">المشروع غير موجود</h3>
        <p className="text-gray-600 mb-4">لم يتم العثور على المشروع المطلوب</p>
        <Button onClick={onBack}>
          <ArrowLeft className="h-4 w-4 ml-2" />
          العودة
        </Button>
      </div>
    )
  }

  const daysRemaining = calculateDaysRemaining(project.endDate)

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">{project.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit?.(project)}>
            <Edit className="h-4 w-4 ml-2" />
            تعديل
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 ml-2" />
            حذف
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الحالة</p>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusIcon(project.status)}
                  <span className="mr-1">
                    {project.status === 'active' && 'نشط'}
                    {project.status === 'completed' && 'مكتمل'}
                    {project.status === 'delayed' && 'متأخر'}
                    {project.status === 'paused' && 'متوقف'}
                    {project.status === 'planning' && 'تخطيط'}
                    {project.status === 'cancelled' && 'ملغي'}
                  </span>
                </Badge>
              </div>
              <div className={`w-3 h-3 rounded-full ${getHealthColor(project.health)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">التقدم</p>
                <p className="text-2xl font-bold">{project.progress}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={project.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الميزانية</p>
                <p className="text-lg font-bold">{formatCurrency(project.budget.totalBudget)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الأيام المتبقية</p>
                <p className={`text-2xl font-bold ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {Math.abs(daysRemaining)}
                </p>
                <p className="text-xs text-gray-500">
                  {daysRemaining < 0 ? 'متأخر' : 'يوم متبقي'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="budget">الميزانية</TabsTrigger>
          <TabsTrigger value="team">الفريق</TabsTrigger>
          <TabsTrigger value="timeline">الجدول الزمني</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  معلومات المشروع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">الوصف</label>
                  <p className="text-gray-900 mt-1">{project.description}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">الفئة</label>
                    <p className="text-gray-900 mt-1">{project.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">النوع</label>
                    <p className="text-gray-900 mt-1">{project.type}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">الموقع</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{project.location}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">الأولوية</label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority === 'critical' && 'حرجة'}
                      {project.priority === 'high' && 'عالية'}
                      {project.priority === 'medium' && 'متوسطة'}
                      {project.priority === 'low' && 'منخفضة'}
                    </Badge>
                  </div>
                </div>

                {project.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">العلامات</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          <Tag className="h-3 w-3 ml-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client and Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  العميل والتواريخ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">العميل</label>
                  <p className="text-gray-900 mt-1">{project.client}</p>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-gray-600">تاريخ البدء</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{formatDate(project.startDate)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">تاريخ الانتهاء المخطط</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{formatDate(project.endDate)}</p>
                  </div>
                </div>

                {project.actualStartDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">تاريخ البدء الفعلي</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-green-400" />
                      <p className="text-gray-900">{formatDate(project.actualStartDate)}</p>
                    </div>
                  </div>
                )}

                {project.actualEndDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">تاريخ الانتهاء الفعلي</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-green-400" />
                      <p className="text-gray-900">{formatDate(project.actualEndDate)}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">تاريخ الإنشاء</label>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(project.createdAt)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">آخر تحديث</label>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(project.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الميزانية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">إجمالي الميزانية</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(project.budget.totalBudget)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">المبلغ المنفق</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(project.budget.spentBudget)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">المبلغ المتبقي</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(project.budget.remainingBudget)}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>استخدام الميزانية</span>
                  <span>{((project.budget.spentBudget / project.budget.totalBudget) * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={(project.budget.spentBudget / project.budget.totalBudget) * 100} 
                  className="h-3"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>فريق المشروع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">مدير المشروع</h4>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {project.team.projectManager.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{project.team.projectManager.name}</p>
                      <p className="text-sm text-gray-600">{project.team.projectManager.role}</p>
                    </div>
                  </div>
                </div>

                {project.team.members.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">أعضاء الفريق</h4>
                    <div className="space-y-2">
                      {project.team.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {project.team.members.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لم يتم تعيين أعضاء فريق بعد
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>الجدول الزمني والمراحل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.phases.map((phase, index) => (
                  <div key={phase.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                        index === 0 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {phase.order}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{phase.name}</h4>
                      <p className="text-sm text-gray-600">{phase.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        المدة المقدرة: {phase.estimatedDuration} يوم
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>المستندات والمرفقات</CardTitle>
            </CardHeader>
            <CardContent>
              {project.attachments.length > 0 ? (
                <div className="space-y-2">
                  {project.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium">{attachment.name}</p>
                        <p className="text-sm text-gray-600">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        تحميل
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  لا توجد مستندات مرفقة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProjectDetails


