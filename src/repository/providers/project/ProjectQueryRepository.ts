/**
 * Project Query Repository
 * Handles advanced queries and filtering for projects
 */

import type { EnhancedProject, ProjectFilters, ProjectSortOptions } from '@/types/projects'
import type { Status } from '@/types/contracts'
import { projectCRUDRepository } from './ProjectCRUDRepository'

export class ProjectQueryRepository {
  /**
   * Find projects by filters with optional sorting
   */
  async findByFilters(
    filters: ProjectFilters,
    sort?: ProjectSortOptions,
  ): Promise<EnhancedProject[]> {
    const projects = await projectCRUDRepository.getAll()
    let filtered = [...projects]

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((p) => filters.status!.includes(p.status))
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((p) => filters.priority!.includes(p.priority))
    }

    if (filters.health && filters.health.length > 0) {
      filtered = filtered.filter((p) => filters.health!.includes(p.health))
    }

    if (filters.phase && filters.phase.length > 0) {
      filtered = filtered.filter((p) => filters.phase!.includes(p.phase))
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((p) => filters.category!.includes(p.category))
    }

    if (filters.client && filters.client.length > 0) {
      filtered = filtered.filter((p) => filters.client!.includes(p.clientId))
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          p.location.toLowerCase().includes(term),
      )
    }

    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start)
      const end = new Date(filters.dateRange.end)
      filtered = filtered.filter((p) => {
        const projectStart = new Date(p.startDate)
        return projectStart >= start && projectStart <= end
      })
    }

    if (filters.budgetRange) {
      filtered = filtered.filter(
        (p) =>
          p.budget.totalBudget >= filters.budgetRange!.min &&
          p.budget.totalBudget <= filters.budgetRange!.max,
      )
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((p) => filters.tags!.some((tag) => p.tags.includes(tag)))
    }

    // Apply sorting
    if (sort) {
      filtered.sort((a, b) => {
        let aValue: string | number | Date
        let bValue: string | number | Date

        switch (sort.field) {
          case 'name':
            aValue = a.name
            bValue = b.name
            break
          case 'startDate':
            aValue = new Date(a.startDate)
            bValue = new Date(b.startDate)
            break
          case 'endDate':
            aValue = new Date(a.endDate)
            bValue = new Date(b.endDate)
            break
          case 'budget':
            aValue = a.budget.totalBudget
            bValue = b.budget.totalBudget
            break
          case 'progress':
            aValue = a.progress
            bValue = b.progress
            break
          default:
            aValue = a[sort.field]
            bValue = b[sort.field]
        }

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }

  /**
   * Search projects by query string
   */
  async search(query: string, filters?: ProjectFilters): Promise<EnhancedProject[]> {
    const searchFilters: ProjectFilters = {
      ...filters,
      searchTerm: query,
    }
    return this.findByFilters(searchFilters)
  }

  /**
   * Get projects by client ID
   */
  async getByClient(clientId: string): Promise<EnhancedProject[]> {
    return this.findByFilters({ client: [clientId] })
  }

  /**
   * Get projects by project manager ID
   */
  async getByProjectManager(managerId: string): Promise<EnhancedProject[]> {
    const projects = await projectCRUDRepository.getAll()
    return projects.filter((p) => p.team.projectManager.id === managerId)
  }

  /**
   * Get projects by status
   */
  async getByStatus(status: string[]): Promise<EnhancedProject[]> {
    return this.findByFilters({ status: status as Status[] })
  }

  /**
   * Get projects by phase
   */
  async getByPhase(phase: string[]): Promise<EnhancedProject[]> {
    return this.findByFilters({ phase })
  }

  /**
   * Export projects matching filters
   */
  async exportMany(filters?: ProjectFilters): Promise<EnhancedProject[]> {
    return this.findByFilters(filters || {})
  }
}

// Export singleton instance
export const projectQueryRepository = new ProjectQueryRepository()
