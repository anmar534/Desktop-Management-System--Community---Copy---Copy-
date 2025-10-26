/**
 * Projects List Component
 * Display and manage list of projects with filtering and search
 */

import type React from 'react'
import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
} from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import type { Project } from '@/data/centralData'
import { useFinancialState } from '@/application/context'

interface ProjectsListProps {
  onProjectSelect?: (project: Project) => void
  onCreateProject?: () => void
  onEditProject?: (project: Project) => void
  className?: string
}

export const ProjectsList: React.FC<ProjectsListProps> = ({
  onProjectSelect,
  onCreateProject,
  onEditProject,
  className = '',
}) => {
  const financialState = useFinancialState()
  const allProjects = financialState.projects.projects || []
  const isLoading = financialState.projects.isLoading || false
  const refreshProjects = financialState.projects.refreshProjects
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Apply filters and search when dependencies change
  useEffect(() => {
    applyFiltersAndSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProjects, searchTerm, statusFilter, priorityFilter, sortBy, sortDirection])

  const applyFiltersAndSearch = () => {
    try {
      if (!Array.isArray(allProjects) || allProjects.length === 0) {
        setFilteredProjects([])
        return
      }

      let filtered = [...allProjects]

      // Apply search
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (project) =>
            project.name?.toLowerCase().includes(term) ||
            project.client?.toLowerCase().includes(term),
        )
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter((project) => project.status === statusFilter)
      }

      // Apply priority filter
      if (priorityFilter !== 'all') {
        filtered = filtered.filter((project) => project.priority === priorityFilter)
      }

      // Apply sorting
      filtered.sort((a, b) => {
        const aValue = a[sortBy as keyof Project]
        const bValue = b[sortBy as keyof Project]

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0
        if (aValue === undefined) return 1
        if (bValue === undefined) return -1

        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const aStr = aValue.toLowerCase()
          const bStr = bValue.toLowerCase()
          if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1
          if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1
          return 0
        }

        // Handle number comparison
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        }

        // Default comparison
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })

      setFilteredProjects(filtered)
    } catch (error) {
      console.error('Error filtering projects:', error)
      setFilteredProjects([])
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
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  if (isLoading) {
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
            عرض وإدارة جميع المشاريع ({filteredProjects.length} من {allProjects.length})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshProjects && refreshProjects()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              /* TODO: Export functionality */
            }}
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Button size="sm" onClick={onCreateProject}>
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
            <Select
              value={sortDirection}
              onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}
            >
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
                      {project.client} - {project.location}
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
                      {formatCurrency(project.budget || project.contractValue)}
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
                    <span className="font-medium truncate">{project.client}</span>
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
