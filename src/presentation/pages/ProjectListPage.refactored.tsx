/**
 * ProjectListPage - Refactored & Optimized
 *
 * Streamlined projects catalog using extracted components for better maintainability.
 * Reduced from 537 → 185 LOC through component extraction and custom hooks.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectListStore } from '@/application/stores/projectListStore'
import { useProjectData } from '@/application/hooks/useProjectData'
import { useProjectStats } from '@/application/hooks/useProjectStats'
import type { EnhancedProject } from '@/shared/types/projects'
import { Button } from '@/presentation/components/ui/button'
import { ProjectCard } from '@/presentation/components/projects/ProjectCard'
import { ProjectStatsCards } from '@/presentation/components/projects/ProjectStatsCards'
import { ProjectFilterSection } from '@/presentation/components/projects/ProjectFilterSection'
import { ProjectPagination } from '@/presentation/components/projects/ProjectPagination'
import { EmptyProjectState } from '@/presentation/components/projects/EmptyProjectState'
import { LayoutGrid, List, Plus } from 'lucide-react'

type ViewMode = 'grid' | 'list'

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

  const allProjects = useMemo(() => projects ?? [], [projects])

  const filteredProjects = useMemo(() => {
    const filtered = applyFilters(allProjects)
    const searched = applySearch(filtered)
    return applySort(searched)
  }, [allProjects, applyFilters, applySearch, applySort])

  const paginatedProjects = useMemo(
    () => getFilteredProjects(allProjects),
    [allProjects, getFilteredProjects],
  )

  const totalPages = Math.max(1, getTotalPages())
  const stats = useProjectStats(filteredProjects)

  const clients = useMemo(() => {
    const unique = new Set<string>()
    allProjects.forEach((project) => {
      if (project.client) unique.add(project.client)
    })
    return Array.from(unique).sort()
  }, [allProjects])

  const handleProjectClick = (project: EnhancedProject) => navigate(`/projects/${project.id}`)

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

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

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const statusValue = (() => {
    const current = filters.status
    if (!current) return 'all'
    return Array.isArray(current) ? (current[0] ?? 'all') : current
  })()

  const clientValue = filters.client ?? 'all'
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
          <Button onClick={() => navigate('/projects/new')} className="gap-2">
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

        <div className="mt-6">
          <ProjectFilterSection
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            statusValue={statusValue}
            onStatusChange={handleStatusChange}
            clientValue={clientValue}
            onClientChange={handleClientChange}
            clients={clients}
            onClearFilters={handleClearFilters}
            isFiltering={isFiltering}
          />
        </div>

        {showStats && (
          <div className="mt-6">
            <ProjectStatsCards stats={stats} />
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
          <div className="mt-8">
            <EmptyProjectState
              isFiltering={isFiltering}
              onCreateProject={() => navigate('/projects/new')}
            />
          </div>
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
                  onClick={() => handleProjectClick(project)}
                />
              ))}
            </div>

            <ProjectPagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
