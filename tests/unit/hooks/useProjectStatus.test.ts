/**
 * Tests for useProjectStatus hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useProjectStatus } from '@/application/hooks/useProjectStatus'
import type { EnhancedProject } from '@/shared/types/projects'

describe('useProjectStatus', () => {
  const mockProject: EnhancedProject = {
    id: 'proj-1',
    name: 'Test Project',
    status: 'active',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    progress: 50,
    budget: 100000,
  } as EnhancedProject

  // ========================================================================
  // Status Determination
  // ========================================================================

  it('should get project status', () => {
    const { result } = renderHook(() => useProjectStatus())
    const status = result.current.getProjectStatus(mockProject)

    expect(status).toBe('active')
  })

  it('should detect active project', () => {
    const { result } = renderHook(() => useProjectStatus())
    expect(result.current.isProjectActive(mockProject)).toBe(true)
    expect(
      result.current.isProjectActive({ ...mockProject, status: 'in-progress' } as EnhancedProject),
    ).toBe(true)
    expect(
      result.current.isProjectActive({ ...mockProject, status: 'completed' } as EnhancedProject),
    ).toBe(false)
  })

  it('should detect completed project', () => {
    const { result } = renderHook(() => useProjectStatus())
    const completed = { ...mockProject, status: 'completed' } as EnhancedProject

    expect(result.current.isProjectCompleted(completed)).toBe(true)
    expect(
      result.current.isProjectCompleted({ ...mockProject, status: 'finished' } as EnhancedProject),
    ).toBe(true)
    expect(result.current.isProjectCompleted(mockProject)).toBe(false)
  })

  it('should detect on-hold project', () => {
    const { result } = renderHook(() => useProjectStatus())
    const onHold = { ...mockProject, status: 'on-hold' } as EnhancedProject

    expect(result.current.isProjectOnHold(onHold)).toBe(true)
    expect(
      result.current.isProjectOnHold({ ...mockProject, status: 'paused' } as EnhancedProject),
    ).toBe(true)
    expect(result.current.isProjectOnHold(mockProject)).toBe(false)
  })

  it('should detect cancelled project', () => {
    const { result } = renderHook(() => useProjectStatus())
    const cancelled = { ...mockProject, status: 'cancelled' } as EnhancedProject

    expect(result.current.isProjectCancelled(cancelled)).toBe(true)
    expect(
      result.current.isProjectCancelled({
        ...mockProject,
        status: 'terminated',
      } as EnhancedProject),
    ).toBe(true)
    expect(result.current.isProjectCancelled(mockProject)).toBe(false)
  })

  // ========================================================================
  // Health Indicators
  // ========================================================================

  it('should calculate progress health', () => {
    const { result } = renderHook(() => useProjectStatus())

    expect(result.current.getProgressHealth(100, 100)).toBe('excellent')
    expect(result.current.getProgressHealth(90, 100)).toBe('good')
    expect(result.current.getProgressHealth(75, 100)).toBe('warning')
    expect(result.current.getProgressHealth(50, 100)).toBe('critical')
  })

  it('should calculate budget health', () => {
    const { result } = renderHook(() => useProjectStatus())

    expect(result.current.getBudgetHealth(90000, 100000)).toBe('excellent') // Under budget
    expect(result.current.getBudgetHealth(104000, 100000)).toBe('good') // 4% over
    expect(result.current.getBudgetHealth(108000, 100000)).toBe('warning') // 8% over
    expect(result.current.getBudgetHealth(115000, 100000)).toBe('critical') // 15% over
  })

  it('should get overall health indicators', () => {
    const { result } = renderHook(() => useProjectStatus())
    const health = result.current.getHealthIndicators(mockProject)

    expect(health).toHaveProperty('overall')
    expect(health).toHaveProperty('schedule')
    expect(health).toHaveProperty('budget')
    expect(health).toHaveProperty('progress')

    expect(['excellent', 'good', 'warning', 'critical']).toContain(health.overall)
  })

  it('should calculate health for high-progress project', () => {
    const highProgress = { ...mockProject, progress: 90 } as EnhancedProject
    const { result } = renderHook(() => useProjectStatus())
    const health = result.current.getHealthIndicators(highProgress)

    expect(health.progress).toBe('excellent')
  })

  // ========================================================================
  // Risk Assessment
  // ========================================================================

  it('should assess project risk', () => {
    const { result } = renderHook(() => useProjectStatus())
    const risk = result.current.getRiskAssessment(mockProject)

    expect(risk).toHaveProperty('level')
    expect(risk).toHaveProperty('factors')
    expect(risk).toHaveProperty('recommendations')

    expect(['low', 'medium', 'high', 'critical']).toContain(risk.level)
    expect(Array.isArray(risk.factors)).toBe(true)
    expect(Array.isArray(risk.recommendations)).toBe(true)
  })

  it('should assess low risk for healthy project', () => {
    const healthy = { ...mockProject, progress: 80, endDate: '2025-12-31' } as EnhancedProject
    const { result } = renderHook(() => useProjectStatus())
    const risk = result.current.getRiskAssessment(healthy)

    expect(['low', 'medium']).toContain(risk.level)
  })

  it('should identify risk factors', () => {
    const noEndDate = { ...mockProject, endDate: undefined } as EnhancedProject
    const { result } = renderHook(() => useProjectStatus())
    const risk = result.current.getRiskAssessment(noEndDate)

    expect(risk.factors.length).toBeGreaterThan(0)
    expect(risk.recommendations.length).toBeGreaterThan(0)
  })

  // ========================================================================
  // UI Helpers
  // ========================================================================

  it('should get status color', () => {
    const { result } = renderHook(() => useProjectStatus())

    expect(result.current.getStatusColor('active')).toBe('green')
    expect(result.current.getStatusColor('completed')).toBe('blue')
    expect(result.current.getStatusColor('on-hold')).toBe('yellow')
    expect(result.current.getStatusColor('cancelled')).toBe('red')
    expect(result.current.getStatusColor('unknown')).toBe('gray')
  })

  it('should get status icon', () => {
    const { result } = renderHook(() => useProjectStatus())

    expect(result.current.getStatusIcon('active')).toBeTruthy()
    expect(result.current.getStatusIcon('completed')).toBeTruthy()
    expect(result.current.getStatusIcon('on-hold')).toBeTruthy()
    expect(result.current.getStatusIcon('cancelled')).toBeTruthy()
  })

  it('should get health color', () => {
    const { result } = renderHook(() => useProjectStatus())

    expect(result.current.getHealthColor('excellent')).toBe('green')
    expect(result.current.getHealthColor('good')).toBe('blue')
    expect(result.current.getHealthColor('warning')).toBe('yellow')
    expect(result.current.getHealthColor('critical')).toBe('red')
  })

  it('should get risk color', () => {
    const { result } = renderHook(() => useProjectStatus())

    expect(result.current.getRiskColor('low')).toBe('green')
    expect(result.current.getRiskColor('medium')).toBe('yellow')
    expect(result.current.getRiskColor('high')).toBe('orange')
    expect(result.current.getRiskColor('critical')).toBe('red')
  })
})
