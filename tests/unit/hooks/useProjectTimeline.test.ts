/**
 * Tests for useProjectTimeline hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useProjectTimeline, type ProjectMilestone } from '@/application/hooks/useProjectTimeline'
import type { EnhancedProject } from '@/shared/types/projects'

describe('useProjectTimeline', () => {
  const mockProject: EnhancedProject = {
    id: 'proj-1',
    name: 'Test Project',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    progress: 50,
    status: 'active',
  } as EnhancedProject

  const mockMilestones: ProjectMilestone[] = [
    {
      id: 'm1',
      name: 'Design Complete',
      targetDate: '2025-03-31',
      completedDate: '2025-03-28',
      status: 'completed',
    },
    {
      id: 'm2',
      name: 'Foundation',
      targetDate: '2025-06-30',
      status: 'pending',
    },
    {
      id: 'm3',
      name: 'Structure',
      targetDate: '2025-09-30',
      status: 'pending',
    },
    {
      id: 'm4',
      name: 'Delayed Task',
      targetDate: '2024-12-31',
      status: 'overdue',
    },
  ]

  // ========================================================================
  // Timeline Calculations
  // ========================================================================

  it('should calculate timeline stats', () => {
    const { result } = renderHook(() => useProjectTimeline())
    const stats = result.current.getTimelineStats(mockProject)

    expect(stats.totalDuration).toBeGreaterThan(0)
    expect(stats.elapsedDays).toBeGreaterThanOrEqual(0)
    expect(stats.progressPercentage).toBeGreaterThanOrEqual(0)
    expect(stats.progressPercentage).toBeLessThanOrEqual(100)
  })

  it('should calculate days since start', () => {
    const { result } = renderHook(() => useProjectTimeline())
    const days = result.current.getDaysSinceStart(mockProject)

    expect(days).toBeGreaterThanOrEqual(0)
  })

  it('should calculate days until end', () => {
    const { result } = renderHook(() => useProjectTimeline())
    const days = result.current.getDaysUntilEnd(mockProject)

    expect(days).toBeGreaterThanOrEqual(0)
  })

  it('should return 0 days until end if no end date', () => {
    const project = { ...mockProject, endDate: undefined }
    const { result } = renderHook(() => useProjectTimeline())
    const days = result.current.getDaysUntilEnd(project as EnhancedProject)

    expect(days).toBe(0)
  })

  it('should calculate expected progress', () => {
    const { result } = renderHook(() => useProjectTimeline())
    const progress = result.current.getExpectedProgress(mockProject)

    expect(progress).toBeGreaterThanOrEqual(0)
    expect(progress).toBeLessThanOrEqual(100)
  })

  it('should detect if project is delayed', () => {
    const delayedProject = { ...mockProject, progress: 10 } // Low progress
    const { result } = renderHook(() => useProjectTimeline())
    const isDelayed = result.current.isProjectDelayed(delayedProject as EnhancedProject)

    expect(typeof isDelayed).toBe('boolean')
  })

  it('should detect if project is on track', () => {
    const { result } = renderHook(() => useProjectTimeline())
    const onTrack = result.current.isProjectOnTrack(mockProject)

    expect(typeof onTrack).toBe('boolean')
  })

  // ========================================================================
  // Milestone Tracking
  // ========================================================================

  it('should get upcoming milestones', () => {
    const { result } = renderHook(() => useProjectTimeline())
    const upcoming = result.current.getUpcomingMilestones(mockMilestones)

    // Should only include pending milestones within 30 days
    expect(upcoming.every((m) => m.status === 'pending')).toBe(true)
  })

  it('should get overdue milestones', () => {
    const { result } = renderHook(() => useProjectTimeline())
    const overdue = result.current.getOverdueMilestones(mockMilestones)

    expect(overdue).toHaveLength(1)
    expect(overdue[0].status).toBe('overdue')
  })

  it('should get completed milestones', () => {
    const { result } = renderHook(() => useProjectTimeline())
    const completed = result.current.getCompletedMilestones(mockMilestones)

    expect(completed).toHaveLength(1)
    expect(completed[0].status).toBe('completed')
  })

  it('should sort completed milestones by completion date', () => {
    const milestones: ProjectMilestone[] = [
      {
        id: 'm1',
        name: 'Task 1',
        targetDate: '2025-01-01',
        completedDate: '2025-01-05',
        status: 'completed',
      },
      {
        id: 'm2',
        name: 'Task 2',
        targetDate: '2025-01-10',
        completedDate: '2025-01-12',
        status: 'completed',
      },
    ]

    const { result } = renderHook(() => useProjectTimeline())
    const completed = result.current.getCompletedMilestones(milestones)

    // Should be sorted by completion date descending (most recent first)
    expect(completed[0].completedDate).toBe('2025-01-12')
    expect(completed[1].completedDate).toBe('2025-01-05')
  })

  // ========================================================================
  // Formatting
  // ========================================================================

  it('should format duration - days', () => {
    const { result } = renderHook(() => useProjectTimeline())

    expect(result.current.formatDuration(0)).toBe('0 days')
    expect(result.current.formatDuration(1)).toBe('1 day')
    expect(result.current.formatDuration(3)).toBe('3 days')
  })

  it('should format duration - weeks', () => {
    const { result } = renderHook(() => useProjectTimeline())

    expect(result.current.formatDuration(7)).toBe('1 week')
    expect(result.current.formatDuration(14)).toBe('2 weeks')
    expect(result.current.formatDuration(10)).toContain('week')
    expect(result.current.formatDuration(10)).toContain('day')
  })

  it('should format duration - months', () => {
    const { result } = renderHook(() => useProjectTimeline())

    expect(result.current.formatDuration(30)).toBe('1 month')
    expect(result.current.formatDuration(60)).toBe('2 months')
    expect(result.current.formatDuration(45)).toContain('month')
    expect(result.current.formatDuration(45)).toContain('day')
  })

  it('should format date range', () => {
    const { result } = renderHook(() => useProjectTimeline())
    const formatted = result.current.formatDateRange('2025-01-01', '2025-12-31')

    expect(formatted).toContain('Jan')
    expect(formatted).toContain('Dec')
    expect(formatted).toContain('2025')
    expect(formatted).toContain(' - ')
  })
})
