/**
 * Project Helper Functions
 * Utility functions for creating default project entities and generating IDs
 */

import type { ProjectBudget, ProjectTeam, ProjectPhase } from '@/types/projects'

// ============================================================================
// ID and Code Generation
// ============================================================================

export const generateProjectId = (): string =>
  `project_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

export const generateProjectCode = (): string => `PRJ-${Date.now().toString().slice(-6)}`

export const generateId = (): string => `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

// ============================================================================
// Default Entity Creators
// ============================================================================

/**
 * Create default budget structure for a project
 */
export function createDefaultBudget(projectId: string, totalBudget: number): ProjectBudget {
  return {
    id: generateId(),
    projectId,
    totalBudget,
    allocatedBudget: totalBudget,
    spentBudget: 0,
    remainingBudget: totalBudget,
    contingencyBudget: totalBudget * 0.1, // 10% contingency
    categories: [],
    approvals: [],
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Create default team structure for a project
 */
export function createDefaultTeam(projectId: string, projectManagerId: string): ProjectTeam {
  return {
    id: generateId(),
    projectId,
    projectManager: {
      id: projectManagerId,
      name: 'Project Manager', // TODO: Get from user service
      email: '',
      phone: '',
      role: 'Project Manager',
      department: 'Projects',
      responsibilities: ['Project Planning', 'Team Management', 'Client Communication'],
      startDate: new Date().toISOString(),
      isActive: true,
    },
    members: [],
    consultants: [],
    contractors: [],
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Create default project phases
 */
export function createDefaultPhases(): ProjectPhase[] {
  return [
    {
      id: 'phase_initiation',
      name: 'البدء',
      nameEn: 'Initiation',
      order: 1,
      description: 'مرحلة بدء المشروع وتحديد المتطلبات',
      estimatedDuration: 14,
      dependencies: [],
      milestones: [],
    },
    {
      id: 'phase_planning',
      name: 'التخطيط',
      nameEn: 'Planning',
      order: 2,
      description: 'مرحلة التخطيط التفصيلي للمشروع',
      estimatedDuration: 21,
      dependencies: ['phase_initiation'],
      milestones: [],
    },
    {
      id: 'phase_execution',
      name: 'التنفيذ',
      nameEn: 'Execution',
      order: 3,
      description: 'مرحلة تنفيذ المشروع',
      estimatedDuration: 90,
      dependencies: ['phase_planning'],
      milestones: [],
    },
    {
      id: 'phase_closure',
      name: 'الإغلاق',
      nameEn: 'Closure',
      order: 4,
      description: 'مرحلة إغلاق المشروع وتسليم النتائج',
      estimatedDuration: 7,
      dependencies: ['phase_execution'],
      milestones: [],
    },
  ]
}

// ============================================================================
// Statistics Computation
// ============================================================================

/**
 * Compute project statistics from a list of projects
 */
export function computeProjectStatistics(
  projects: Array<{
    status: string
    phase: string
    priority: string
    health: string
  }>,
): {
  total: number
  byStatus: Record<string, number>
  byPhase: Record<string, number>
  byPriority: Record<string, number>
  byHealth: Record<string, number>
} {
  const stats = {
    total: projects.length,
    byStatus: {} as Record<string, number>,
    byPhase: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    byHealth: {} as Record<string, number>,
  }

  projects.forEach((project) => {
    // Count by status
    stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1

    // Count by phase
    stats.byPhase[project.phase] = (stats.byPhase[project.phase] || 0) + 1

    // Count by priority
    stats.byPriority[project.priority] = (stats.byPriority[project.priority] || 0) + 1

    // Count by health
    stats.byHealth[project.health] = (stats.byHealth[project.health] || 0) + 1
  })

  return stats
}
