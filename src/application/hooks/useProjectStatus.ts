/**
 * useProjectStatus Hook
 *
 * Custom hook for determining and managing project status.
 * Provides status calculations, health indicators, and risk assessment.
 */

import { useCallback } from 'react'
import type { EnhancedProject } from '@/shared/types/projects'

export type ProjectHealthStatus = 'excellent' | 'good' | 'warning' | 'critical'
export type ProjectRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface ProjectHealthIndicators {
  overall: ProjectHealthStatus
  schedule: ProjectHealthStatus
  budget: ProjectHealthStatus
  progress: ProjectHealthStatus
}

export interface ProjectRiskAssessment {
  level: ProjectRiskLevel
  factors: string[]
  recommendations: string[]
}

export interface UseProjectStatusReturn {
  // Status determination
  getProjectStatus: (project: EnhancedProject) => string
  isProjectActive: (project: EnhancedProject) => boolean
  isProjectCompleted: (project: EnhancedProject) => boolean
  isProjectOnHold: (project: EnhancedProject) => boolean
  isProjectCancelled: (project: EnhancedProject) => boolean

  // Health & Risk
  getHealthIndicators: (project: EnhancedProject) => ProjectHealthIndicators
  getRiskAssessment: (project: EnhancedProject) => ProjectRiskAssessment
  getProgressHealth: (actual: number, expected: number) => ProjectHealthStatus
  getBudgetHealth: (actual: number, estimated: number) => ProjectHealthStatus

  // Status helpers
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => string
  getHealthColor: (health: ProjectHealthStatus) => string
  getRiskColor: (risk: ProjectRiskLevel) => string
}

export function useProjectStatus(): UseProjectStatusReturn {
  // Get project status string
  const getProjectStatus = useCallback((project: EnhancedProject): string => {
    return project.status || 'unknown'
  }, [])

  // Status checks
  const isProjectActive = useCallback((project: EnhancedProject): boolean => {
    return project.status === 'active'
  }, [])

  const isProjectCompleted = useCallback((project: EnhancedProject): boolean => {
    return project.status === 'completed'
  }, [])

  const isProjectOnHold = useCallback((project: EnhancedProject): boolean => {
    return project.status === 'paused'
  }, [])

  const isProjectCancelled = useCallback((project: EnhancedProject): boolean => {
    return project.status === 'cancelled'
  }, [])

  // Progress health based on actual vs expected
  const getProgressHealth = useCallback((actual: number, expected: number): ProjectHealthStatus => {
    if (actual >= expected - 5) return 'excellent'
    if (actual >= expected - 15) return 'good'
    if (actual >= expected - 30) return 'warning'
    return 'critical'
  }, [])

  // Budget health based on actual vs estimated
  const getBudgetHealth = useCallback((actual: number, estimated: number): ProjectHealthStatus => {
    if (estimated === 0) return 'excellent'
    const variance = ((actual - estimated) / estimated) * 100

    if (variance <= 0) return 'excellent' // Under budget
    if (variance <= 5) return 'good'
    if (variance <= 10) return 'warning'
    return 'critical'
  }, [])

  // Get overall health indicators
  const getHealthIndicators = useCallback(
    (project: EnhancedProject): ProjectHealthIndicators => {
      // Calculate expected progress based on timeline
      const today = new Date()
      const start = new Date(project.startDate)
      const end = project.endDate ? new Date(project.endDate) : today
      const totalDuration = end.getTime() - start.getTime()
      const elapsed = today.getTime() - start.getTime()
      const expectedProgress =
        totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0

      const actualProgress = project.progress || 0

      // Schedule health (based on progress vs timeline)
      const schedule = getProgressHealth(actualProgress, expectedProgress)

      // Budget health (simplified - would need actual budget data)
      const budget: ProjectHealthStatus = 'good'

      // Progress health
      const progress =
        actualProgress >= 75
          ? 'excellent'
          : actualProgress >= 50
            ? 'good'
            : actualProgress >= 25
              ? 'warning'
              : 'critical'

      // Overall health (worst of all indicators)
      const healthScores = { excellent: 4, good: 3, warning: 2, critical: 1 }
      const minScore = Math.min(
        healthScores[schedule],
        healthScores[budget],
        healthScores[progress],
      )
      const overall =
        (Object.entries(healthScores).find(
          ([_, score]) => score === minScore,
        )?.[0] as ProjectHealthStatus) || 'good'

      return { overall, schedule, budget, progress }
    },
    [getProgressHealth],
  )

  // Risk assessment
  const getRiskAssessment = useCallback(
    (project: EnhancedProject): ProjectRiskAssessment => {
      const factors: string[] = []
      const recommendations: string[] = []

      // Check progress
      const health = getHealthIndicators(project)
      if (health.schedule === 'critical' || health.schedule === 'warning') {
        factors.push('Behind schedule')
        recommendations.push('Review project timeline and allocate additional resources')
      }

      if (health.budget === 'critical') {
        factors.push('Budget overrun')
        recommendations.push('Review cost controls and adjust budget forecasts')
      }

      if (!project.endDate) {
        factors.push('No defined end date')
        recommendations.push('Establish clear project timeline and milestones')
      }

      // Determine risk level
      let level: ProjectRiskLevel = 'low'
      if (factors.length === 0) {
        level = 'low'
      } else if (factors.length === 1) {
        level = 'medium'
      } else if (factors.length === 2) {
        level = 'high'
      } else {
        level = 'critical'
      }

      return { level, factors, recommendations }
    },
    [getHealthIndicators],
  )

  // UI helpers
  const getStatusColor = useCallback((status: string): string => {
    const colors: Record<string, string> = {
      active: 'green',
      'in-progress': 'green',
      completed: 'blue',
      finished: 'blue',
      'on-hold': 'yellow',
      paused: 'yellow',
      cancelled: 'red',
      terminated: 'red',
    }
    return colors[status] || 'gray'
  }, [])

  const getStatusIcon = useCallback((status: string): string => {
    const icons: Record<string, string> = {
      active: '🚀',
      'in-progress': '⚡',
      completed: '✅',
      finished: '🎉',
      'on-hold': '⏸️',
      paused: '⏸️',
      cancelled: '❌',
      terminated: '🚫',
    }
    return icons[status] || '📋'
  }, [])

  const getHealthColor = useCallback((health: ProjectHealthStatus): string => {
    const colors: Record<ProjectHealthStatus, string> = {
      excellent: 'green',
      good: 'blue',
      warning: 'yellow',
      critical: 'red',
    }
    return colors[health]
  }, [])

  const getRiskColor = useCallback((risk: ProjectRiskLevel): string => {
    const colors: Record<ProjectRiskLevel, string> = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red',
    }
    return colors[risk]
  }, [])

  return {
    getProjectStatus,
    isProjectActive,
    isProjectCompleted,
    isProjectOnHold,
    isProjectCancelled,
    getHealthIndicators,
    getRiskAssessment,
    getProgressHealth,
    getBudgetHealth,
    getStatusColor,
    getStatusIcon,
    getHealthColor,
    getRiskColor,
  }
}
