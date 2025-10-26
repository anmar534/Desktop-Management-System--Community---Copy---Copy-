/**
 * ProjectListPage - Refactored
 *
 * Presents the enhanced projects catalogue with design-token friendly styling,
 * integrated filtering, search, pagination, and grid/list toggles.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectListStore } from '@/application/stores/projectListStore'
import { useProjectData } from '@/application/hooks/useProjectData'
import type { EnhancedProject } from '@/shared/types/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Badge } from '@/presentation/components/ui/badge'
import { Progress } from '@/presentation/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Separator } from '@/presentation/components/ui/separator'
import { formatCurrency, formatDateValue } from '@/shared/utils/formatters/formatters'
import { LayoutGrid, List, Plus, Search, X } from 'lucide-react'

type ViewMode = 'grid' | 'list'

interface ProjectCardProps {
  project: EnhancedProject
  viewMode: ViewMode
  onOpen: () => void
}

const statusBadgeClasses: Record<string, string> = {
  active: 'bg-info/10 text-info border-info/20',
  completed: 'bg-success/10 text-success border-success/30',
  delayed: 'bg-destructive/10 text-destructive border-destructive/30',
  paused: 'bg-warning/10 text-foreground border-warning/30',
  planning: 'bg-muted text-muted-foreground border-border',
  default: 'bg-muted text-muted-foreground border-border',
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, viewMode, onOpen }) => {
  const budgetValue =
    typeof project.budget === 'number' ? project.budget : (project.budget?.totalBudget ?? 0)

  const contractValue = project.contractValue ?? 0
  const progress = project.progress ?? 0
  const statusClass = statusBadgeClasses[project.status ?? 'default'] ?? statusBadgeClasses.default

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      className={`transition hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
        viewMode === 'list' ? 'md:flex md:items-center md:justify-between' : ''
      }`}
    >
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground">{project.name}</CardTitle>
          <Badge variant="outline" className={statusClass}>
            {project.status ?? 'غير محدد'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{project.client || 'عميل غير محدد'}</p>
      </CardHeader>
      <CardContent className={`space-y-4 ${viewMode === 'list' ? 'md:w-2/3' : ''}`}>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>
            البداية:{' '}
            {formatDateValue(
              project.startDate,
              { year: 'numeric', month: 'short', day: 'numeric' },
              '—',
            )}
          </span>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <span>
            الانتهاء:{' '}
            {formatDateValue(
              project.endDate,
              { year: 'numeric', month: 'short', day: 'numeric' },
              '—',
            )}
          </span>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <span>الأولوية: {project.priority ?? 'غير محدد'}</span>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>نسبة الإنجاز</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">قيمة العقد</p>
            <p className="font-semibold text-foreground">
              {formatCurrency(contractValue, { currency: 'SAR', notation: 'compact' })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">الميزانية</p>
            <p className="font-semibold text-foreground">
              {formatCurrency(budgetValue, { currency: 'SAR', notation: 'compact' })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">المرحلة الحالية</p>
            <p className="font-semibold text-foreground">{project.phase || 'غير محددة'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showStats, setShowStats] = useState(true)

  const {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    page,
    pageSize,
    setPage,
    setPageSize,
    getFilteredProjects,
    getTotalPages,
    applyFilters,
    applySearch,
    applySort,
    totalItems,
    activeFilters,
    clearFilters,
  } = useProjectListStore()

  const { projects, loadProjects, isLoading, error } = useProjectData()

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const allProjects = projects ?? []

  const filteredProjects = useMemo(() => {
    const filtered = applyFilters(allProjects)
    const searched = applySearch(filtered)
    return applySort(searched)
  }, [allProjects, applyFilters, applySearch, applySort])

  const paginatedProjects = useMemo(() => {
    return getFilteredProjects(allProjects)
  }, [allProjects, getFilteredProjects, filters, searchQuery, page, pageSize])

  const totalPages = Math.max(1, getTotalPages())

  const clients = useMemo(() => {
    const unique = new Set<string>()
    allProjects.forEach((project) => {
      if (project.client) unique.add(project.client)
    })
    return Array.from(unique).sort()
  }, [allProjects])

  const stats = useMemo(() => {
    if (filteredProjects.length === 0) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalBudget: 0,
        totalContractValue: 0,
        averageProgress: 0,
      }
    }

    const totalProjects = filteredProjects.length
    const activeProjects = filteredProjects.filter((project) => project.status === 'active').length
    const completedProjects = filteredProjects.filter(
      (project) => project.status === 'completed',
    ).length
    const onHoldProjects = filteredProjects.filter((project) => project.status === 'paused').length
    const totalBudget = filteredProjects.reduce((acc, project) => {
      const value =
        typeof project.budget === 'number' ? project.budget : (project.budget?.totalBudget ?? 0)
      return acc + value
    }, 0)
    const totalContractValue = filteredProjects.reduce(
      (acc, project) => acc + (project.contractValue ?? 0),
      0,
    )
    const averageProgress =
      filteredProjects.reduce((acc, project) => acc + (project.progress ?? 0), 0) / totalProjects

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalBudget,
      totalContractValue,
      averageProgress,
    }
  }, [filteredProjects])

  const handleCreateProject = () => navigate('/projects/new')
  const handleProjectClick = (project: EnhancedProject) => navigate(`/projects/${project.id}`)

  const handleStatusChange = (value: string) => {
    setFilters({ status: value === 'all' ? undefined : value })
    setPage(1)
  }

  const handleClientChange = (value: string) => {
    setFilters({ client: value === 'all' ? undefined : value })
    setPage(1)
  }

  const handleClearFilters = () => {
    clearFilters()
    setSearchQuery('')
    setPage(1)
  }

  const statusValue = (() => {
    const current = filters.status
    if (!current) return 'all'
    return Array.isArray(current) ? (current[0] ?? 'all') : current
  })()

  const clientValue = filters.client ?? 'all'
  const showingFrom = (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, totalItems)

  const isFiltering = Boolean(searchQuery || activeFilters)

  return (
    <div className="min-h-screen bg-muted/10 py-6">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background px-6 py-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">إدارة المشاريع</h1>
            <p className="text-sm text-muted-foreground">
              راقب التقدم والميزانيات، وابحث عن المشاريع بسرعة باستخدام الفلاتر المتقدمة.
            </p>
          </div>
          <Button onClick={handleCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            مشروع جديد
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats((value) => !value)}
            className="gap-2"
          >
            {showStats ? 'إخفاء الإحصائيات' : 'عرض الإحصائيات'}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              شبكة
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              قائمة
            </Button>
          </div>
        </div>

        <Card className="mt-6">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex w-full items-center md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="ابحث باسم المشروع أو العميل"
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusValue} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="حالة المشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="paused">متوقفة</SelectItem>
                  <SelectItem value="planning">قيد التخطيط</SelectItem>
                  <SelectItem value="delayed">متأخرة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clientValue} onValueChange={handleClientChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="كل العملاء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل العملاء</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                disabled={!isFiltering}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                مسح الفلاتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {showStats && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-muted-foreground">إجمالي المشاريع</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{stats.totalProjects}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-muted-foreground">مشاريع نشطة</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {stats.activeProjects}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-muted-foreground">مشاريع مكتملة</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {stats.completedProjects}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-muted-foreground">متوقفة أو قيد الانتظار</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {stats.onHoldProjects}
                </p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2 xl:col-span-2">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الميزانية</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatCurrency(stats.totalBudget, { currency: 'SAR', notation: 'compact' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي قيمة العقود</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatCurrency(stats.totalContractValue, {
                      currency: 'SAR',
                      notation: 'compact',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">متوسط الإنجاز</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {Math.round(stats.averageProgress)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        )}

        {error && !isLoading && (
          <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && paginatedProjects.length === 0 && (
          <Card className="mt-8 text-center">
            <CardContent className="space-y-4 py-12">
              <div className="text-5xl" aria-hidden>
                📁
              </div>
              <h2 className="text-xl font-semibold text-foreground">لا توجد مشاريع مطابقة</h2>
              <p className="text-sm text-muted-foreground">
                {isFiltering
                  ? 'عدّل خيارات البحث أو جرّب كلمات مفتاحية مختلفة.'
                  : 'ابدأ بإضافة مشروع جديد للبدء في تتبع أعمالك.'}
              </p>
              {!isFiltering && <Button onClick={handleCreateProject}>إضافة مشروع جديد</Button>}
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && paginatedProjects.length > 0 && (
          <div className="mt-8 space-y-6">
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
                  : 'flex flex-col gap-4'
              }
            >
              {paginatedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  onOpen={() => handleProjectClick(project)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm">
                  <div className="text-muted-foreground">
                    عرض {showingFrom} - {showingTo} من {totalItems} مشروع
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      السابق
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                        (pageNumber) => (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        ),
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      التالي
                    </Button>
                  </div>

                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 عناصر في الصفحة</SelectItem>
                      <SelectItem value="25">25 عنصراً</SelectItem>
                      <SelectItem value="50">50 عنصراً</SelectItem>
                      <SelectItem value="100">100 عنصر</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
