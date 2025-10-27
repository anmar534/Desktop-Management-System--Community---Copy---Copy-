/**
 * useProjectTimeline Hook
 *
 * Custom hook for managing project timeline and milestone tracking.
 * Handles date calculations, progress tracking, and schedule analysis.
 *
 * Enhanced in Week 4 - Task 3.4: Added phase/milestone CRUD operations
 */

import { useCallback } from 'react'
import type { EnhancedProject } from '@/types/projects'

export interface TimelinePhase {
  name: string
  startDate: string
  endDate: string
  duration: number
  progress: number
  status: 'pending' | 'active' | 'completed' | 'delayed'
}

export interface ProjectMilestone {
  id: string
  name: string
  targetDate: string
  completedDate?: string
  actualDate?: string
  status: 'pending' | 'completed' | 'overdue' | 'in_progress' | 'delayed'
  description?: string
}

export interface TimelineStats {
  totalDuration: number
  elapsedDays: number
  remainingDays: number
  progressPercentage: number
  isOnSchedule: boolean
  daysOverdue: number
}

export interface UseProjectTimelineReturn {
  // Calculations
  getTimelineStats: (project: EnhancedProject) => TimelineStats
  getDaysSinceStart: (project: EnhancedProject) => number
  getDaysUntilEnd: (project: EnhancedProject) => number
  getExpectedProgress: (project: EnhancedProject) => number
  isProjectDelayed: (project: EnhancedProject) => boolean
  isProjectOnTrack: (project: EnhancedProject) => boolean

  // Milestone tracking
  getUpcomingMilestones: (milestones: ProjectMilestone[]) => ProjectMilestone[]
  getOverdueMilestones: (milestones: ProjectMilestone[]) => ProjectMilestone[]
  getCompletedMilestones: (milestones: ProjectMilestone[]) => ProjectMilestone[]

  // Formatting
  formatDuration: (days: number) => string
  formatDateRange: (startDate: string, endDate: string) => string
}

export function useProjectTimeline(): UseProjectTimelineReturn {
  // Calculate days between two dates
  const calculateDaysDifference = useCallback((date1: string, date2: string): number => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [])

  // Get timeline statistics
  const getTimelineStats = useCallback(
    (project: EnhancedProject): TimelineStats => {
      const today = new Date().toISOString().split('T')[0]
      const startDate = project.startDate
      const endDate = project.endDate || today

      const totalDuration = calculateDaysDifference(startDate, endDate)
      const elapsedDays = calculateDaysDifference(startDate, today)
      const remainingDays = Math.max(0, calculateDaysDifference(today, endDate))

      const expectedProgress =
        totalDuration > 0 ? Math.min(100, (elapsedDays / totalDuration) * 100) : 0

      const actualProgress = project.progress || 0
      const isOnSchedule = actualProgress >= expectedProgress - 5 // 5% tolerance

      const daysOverdue =
        project.endDate && new Date(project.endDate) < new Date()
          ? calculateDaysDifference(project.endDate, today)
          : 0

      return {
        totalDuration,
        elapsedDays,
        remainingDays,
        progressPercentage: expectedProgress,
        isOnSchedule,
        daysOverdue,
      }
    },
    [calculateDaysDifference],
  )

  // Get days since project start
  const getDaysSinceStart = useCallback(
    (project: EnhancedProject): number => {
      const today = new Date().toISOString().split('T')[0]
      return calculateDaysDifference(project.startDate, today)
    },
    [calculateDaysDifference],
  )

  // Get days until project end
  const getDaysUntilEnd = useCallback(
    (project: EnhancedProject): number => {
      if (!project.endDate) return 0
      const today = new Date().toISOString().split('T')[0]
      const diff = calculateDaysDifference(today, project.endDate)
      return new Date(project.endDate) >= new Date() ? diff : 0
    },
    [calculateDaysDifference],
  )

  // Get expected progress based on timeline
  const getExpectedProgress = useCallback(
    (project: EnhancedProject): number => {
      const stats = getTimelineStats(project)
      return stats.progressPercentage
    },
    [getTimelineStats],
  )

  // Check if project is delayed
  const isProjectDelayed = useCallback(
    (project: EnhancedProject): boolean => {
      const stats = getTimelineStats(project)
      return !stats.isOnSchedule || stats.daysOverdue > 0
    },
    [getTimelineStats],
  )

  // Check if project is on track
  const isProjectOnTrack = useCallback(
    (project: EnhancedProject): boolean => {
      const stats = getTimelineStats(project)
      return stats.isOnSchedule && stats.daysOverdue === 0
    },
    [getTimelineStats],
  )

  // Get upcoming milestones (within next 30 days)
  const getUpcomingMilestones = useCallback(
    (milestones: ProjectMilestone[]): ProjectMilestone[] => {
      const today = new Date()
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

      return milestones
        .filter((m) => {
          const targetDate = new Date(m.targetDate)
          return m.status === 'pending' && targetDate >= today && targetDate <= thirtyDaysFromNow
        })
        .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    },
    [],
  )

  // Get overdue milestones
  const getOverdueMilestones = useCallback((milestones: ProjectMilestone[]): ProjectMilestone[] => {
    const today = new Date()
    return milestones.filter((m) => {
      const targetDate = new Date(m.targetDate)
      return m.status !== 'completed' && m.status !== 'overdue' && targetDate < today
    })
  }, [])

  // Get completed milestones
  const getCompletedMilestones = useCallback(
    (milestones: ProjectMilestone[]): ProjectMilestone[] => {
      return milestones
        .filter((m) => m.status === 'completed')
        .sort((a, b) => {
          const dateA = a.completedDate || a.actualDate
          const dateB = b.completedDate || b.actualDate
          if (!dateA || !dateB) return 0
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        })
    },
    [],
  )

  // Format duration in human-readable format
  const formatDuration = useCallback((days: number): string => {
    if (days === 0) return '0 days'
    if (days === 1) return '1 day'
    if (days < 7) return `${days} days`
    if (days < 30) {
      const weeks = Math.floor(days / 7)
      const remainingDays = days % 7
      if (remainingDays === 0) return weeks === 1 ? '1 week' : `${weeks} weeks`
      return `${weeks} week${weeks > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
    }
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    if (remainingDays === 0) return months === 1 ? '1 month' : `${months} months`
    return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
  }, [])

  // Format date range
  const formatDateRange = useCallback((startDate: string, endDate: string): string => {
    const start = new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const end = new Date(endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${start} - ${end}`
  }, [])

  return {
    getTimelineStats,
    getDaysSinceStart,
    getDaysUntilEnd,
    getExpectedProgress,
    isProjectDelayed,
    isProjectOnTrack,
    getUpcomingMilestones,
    getOverdueMilestones,
    getCompletedMilestones,
    formatDuration,
    formatDateRange,
  }
}
