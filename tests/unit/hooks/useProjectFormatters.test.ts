/**
 * Tests for useProjectFormatters hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useProjectFormatters } from '@/application/hooks/useProjectFormatters'
import type { EnhancedProject } from '@/shared/types/projects'

describe('useProjectFormatters', () => {
  const mockProject: EnhancedProject = {
    id: 'proj-1',
    name: 'Test Project',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    budget: 100000,
  } as EnhancedProject

  // ========================================================================
  // Currency Formatting
  // ========================================================================

  it('should format currency', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatCurrency(100000)

    expect(formatted).toContain('100')
    expect(formatted).toBeTruthy()
  })

  it('should format budget', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatBudget(50000)

    expect(formatted).toBeTruthy()
    expect(formatted).toContain('50')
  })

  it('should format cost', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatCost(75000)

    expect(formatted).toBeTruthy()
    expect(formatted).toContain('75')
  })

  // ========================================================================
  // Date Formatting
  // ========================================================================

  it('should format date', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatDate('2025-01-15')

    expect(formatted).toContain('Jan')
    expect(formatted).toContain('15')
    expect(formatted).toContain('2025')
  })

  it('should format date short', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatDateShort('2025-01-15')

    expect(formatted).toContain('Jan')
    expect(formatted).toContain('15')
  })

  it('should format date long', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatDateLong('2025-01-15')

    expect(formatted).toContain('January')
    expect(formatted).toContain('15')
    expect(formatted).toContain('2025')
  })

  it('should format relative date - today', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const today = new Date().toISOString().split('T')[0]
    const formatted = result.current.formatRelativeDate(today)

    expect(formatted).toBe('Today')
  })

  it('should format relative date - future', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const formatted = result.current.formatRelativeDate(tomorrow)

    expect(formatted).toBe('Tomorrow')
  })

  it('should format relative date - past', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const formatted = result.current.formatRelativeDate(yesterday)

    expect(formatted).toBe('Yesterday')
  })

  // ========================================================================
  // Number Formatting
  // ========================================================================

  it('should format number', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatNumber(1000000)

    expect(formatted).toContain('1,000,000')
  })

  it('should format percentage', () => {
    const { result } = renderHook(() => useProjectFormatters())

    expect(result.current.formatPercentage(75.5)).toBe('75.5%')
    expect(result.current.formatPercentage(75.567, 2)).toBe('75.57%')
  })

  it('should format progress', () => {
    const { result } = renderHook(() => useProjectFormatters())

    expect(result.current.formatProgress(75)).toBe('75%')
    expect(result.current.formatProgress(100)).toBe('100%')
    expect(result.current.formatProgress(0)).toBe('0%')
  })

  it('should clamp progress to 0-100 range', () => {
    const { result } = renderHook(() => useProjectFormatters())

    expect(result.current.formatProgress(-10)).toBe('0%')
    expect(result.current.formatProgress(150)).toBe('100%')
  })

  // ========================================================================
  // Project-specific Formatting
  // ========================================================================

  it('should format project name', () => {
    const { result } = renderHook(() => useProjectFormatters())

    expect(result.current.formatProjectName(mockProject)).toBe('Test Project')
    expect(result.current.formatProjectName({ ...mockProject, name: '' } as EnhancedProject)).toBe(
      'Untitled Project',
    )
  })

  it('should format project duration - days', () => {
    const project = {
      ...mockProject,
      startDate: '2025-01-01',
      endDate: '2025-01-15',
    } as EnhancedProject

    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatProjectDuration(project)

    expect(formatted).toContain('days')
  })

  it('should format project duration - months', () => {
    const project = {
      ...mockProject,
      startDate: '2025-01-01',
      endDate: '2025-06-01',
    } as EnhancedProject

    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatProjectDuration(project)

    expect(formatted).toContain('month')
  })

  it('should format project duration - years', () => {
    const project = {
      ...mockProject,
      startDate: '2023-01-01',
      endDate: '2025-01-01',
    } as EnhancedProject

    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatProjectDuration(project)

    expect(formatted).toContain('year')
  })

  it('should format budget range', () => {
    const { result } = renderHook(() => useProjectFormatters())
    const formatted = result.current.formatProjectBudgetRange(50000, 100000)

    expect(formatted).toContain('50')
    expect(formatted).toContain('100')
    expect(formatted).toContain(' - ')
  })
})
