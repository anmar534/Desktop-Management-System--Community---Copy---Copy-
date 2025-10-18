/**
 * Projects List Component
 * Display and manage list of projects with filtering and search
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EnhancedProject, ProjectFilters, ProjectSortOptions } from '../../types/projects'
import { enhancedProjectService } from '../../services/enhancedProjectService'

interface ProjectsListProps {
  onProjectSelect?: (project: EnhancedProject) => void
  onCreateProject?: () => void
  onEditProject?: (project: EnhancedProject) => void
  className?: string
}

export const ProjectsList: React.FC<ProjectsListProps> = ({
  onProjectSelect,
  onCreateProject,
  onEditProject,
  className = ''
}) => {
  const [projects, setProjects] = useState<EnhancedProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<EnhancedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Load projects on component mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Apply filters and search when dependencies change
  useEffect(() => {
    applyFiltersAndSearch()
  }, [projects, searchTerm, statusFilter, priorityFilter, sortBy, sortDirection])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const projectsData = await enhancedProjectService.getAllProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
      // TODO: Show error notification
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSearch = async () => {
    try {
      const filters: ProjectFilters = {
        searchTerm: searchTerm || undefined,
        status: statusFilter !== 'all' ? [statusFilter as any] : undefined,
        priority: priorityFilter !== 'all' ? [priorityFilter as any] : undefined
      }

      const sortOptions: ProjectSortOptions = {
        field: sortBy as any,
        direction: sortDirection
      }

      const filtered = await enhancedProjectService.searchProjects(filters, sortOptions)
      setFilteredProjects(filtered)
    } catch (error) {
      console.error('Error filtering projects:', error)
      setFilteredProjects(projects)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'delayed':
        return <AlertTriangle className="h-4 w-4" />
      case 'paused':
        return <Pause className="h-4 w-4" />
      case 'planning':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
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
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`} dir="rtl">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">جاري تحميل المشاريع...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة المشاريع</h2>
          <p className="text-gray-600 mt-1">
            عرض وإدارة جميع المشاريع ({filteredProjects.length} من {projects.length})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProjects}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* TODO: Export functionality */}}
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Button
            size="sm"
            onClick={onCreateProject}
          >
            <Plus className="h-4 w-4 ml-2" />
            مشروع جديد
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المشاريع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="planning">التخطيط</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="delayed">متأخر</SelectItem>
                <SelectItem value="paused">متوقف</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="critical">حرجة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">الاسم</SelectItem>
                <SelectItem value="startDate">تاريخ البدء</SelectItem>
                <SelectItem value="endDate">تاريخ الانتهاء</SelectItem>
                <SelectItem value="budget">الميزانية</SelectItem>
                <SelectItem value="progress">التقدم</SelectItem>
                <SelectItem value="priority">الأولوية</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Direction */}
            <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}>
              <SelectTrigger>
                <SelectValue placeholder="الاتجاه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">تصاعدي</SelectItem>
                <SelectItem value="desc">تنازلي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مشاريع</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'لا توجد مشاريع تطابق معايير البحث المحددة'
                : 'لم يتم إنشاء أي مشاريع بعد'}
            </p>
            {onCreateProject && (
              <Button onClick={onCreateProject}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء مشروع جديد
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onProjectSelect?.(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {project.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getHealthColor(project.health)}`} />
                </div>
                
                <div className="flex items-center gap-2 mt-3">
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
                  <Badge variant="outline" className={getPriorityColor(project.priority)}>
                    {project.priority === 'critical' && 'حرجة'}
                    {project.priority === 'high' && 'عالية'}
                    {project.priority === 'medium' && 'متوسطة'}
                    {project.priority === 'low' && 'منخفضة'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">التقدم</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 ml-1" />
                      الميزانية
                    </div>
                    <span className="font-medium">
                      {formatCurrency(project.budget.totalBudget)}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 ml-1" />
                      المدة
                    </div>
                    <span className="font-medium">
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </span>
                  </div>

                  {/* Client */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 ml-1" />
                      العميل
                    </div>
                    <span className="font-medium truncate">
                      {project.client}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditProject?.(project)
                    }}
                  >
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onProjectSelect?.(project)
                    }}
                  >
                    عرض
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectsList
