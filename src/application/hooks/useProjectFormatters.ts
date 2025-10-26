/**
 * useProjectFormatters Hook
 *
 * Custom hook for formatting project data for display.
 * Provides consistent formatting utilities for dates, currency, numbers, etc.
 */

import { useCallback } from 'react'
import type { EnhancedProject } from '@/shared/types/projects'

export interface UseProjectFormattersReturn {
  // Currency formatting
  formatCurrency: (amount: number, currency?: string) => string
  formatBudget: (budget: number) => string
  formatCost: (cost: number) => string

  // Date formatting
  formatDate: (date: string) => string
  formatDateShort: (date: string) => string
  formatDateLong: (date: string) => string
  formatRelativeDate: (date: string) => string

  // Number formatting
  formatNumber: (value: number) => string
  formatPercentage: (value: number, decimals?: number) => string
  formatProgress: (progress: number) => string

  // Project-specific formatting
  formatProjectName: (project: EnhancedProject) => string
  formatProjectDuration: (project: EnhancedProject) => string
  formatProjectBudgetRange: (min: number, max: number) => string
}

export function useProjectFormatters(): UseProjectFormattersReturn {
  // Currency formatting
  const formatCurrency = useCallback((amount: number, currency = 'SAR'): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }, [])

  const formatBudget = useCallback(
    (budget: number): string => {
      return formatCurrency(budget)
    },
    [formatCurrency],
  )

  const formatCost = useCallback(
    (cost: number): string => {
      return formatCurrency(cost)
    },
    [formatCurrency],
  )

  // Date formatting
  const formatDate = useCallback((date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const formatDateShort = useCallback((date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const formatDateLong = useCallback((date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  const formatRelativeDate = useCallback(
    (date: string): string => {
      const now = new Date()
      const target = new Date(date)
      const diffMs = target.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Tomorrow'
      if (diffDays === -1) return 'Yesterday'
      if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`
      if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`
      if (diffDays > 0 && diffDays < 30) {
        const weeks = Math.ceil(diffDays / 7)
        return `In ${weeks} week${weeks > 1 ? 's' : ''}`
      }
      if (diffDays < 0 && diffDays > -30) {
        const weeks = Math.ceil(Math.abs(diffDays) / 7)
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`
      }

      return formatDate(date)
    },
    [formatDate],
  )

  // Number formatting
  const formatNumber = useCallback((value: number): string => {
    return new Intl.NumberFormat('en-US').format(value)
  }, [])

  const formatPercentage = useCallback((value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)}%`
  }, [])

  const formatProgress = useCallback(
    (progress: number): string => {
      return formatPercentage(Math.max(0, Math.min(100, progress)), 0)
    },
    [formatPercentage],
  )

  // Project-specific formatting
  const formatProjectName = useCallback((project: EnhancedProject): string => {
    return project.name || 'Untitled Project'
  }, [])

  const formatProjectDuration = useCallback((project: EnhancedProject): string => {
    const start = new Date(project.startDate)
    const end = project.endDate ? new Date(project.endDate) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months > 1 ? 's' : ''}`
    }
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    if (months === 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`
  }, [])

  const formatProjectBudgetRange = useCallback(
    (min: number, max: number): string => {
      return `${formatBudget(min)} - ${formatBudget(max)}`
    },
    [formatBudget],
  )

  return {
    formatCurrency,
    formatBudget,
    formatCost,
    formatDate,
    formatDateShort,
    formatDateLong,
    formatRelativeDate,
    formatNumber,
    formatPercentage,
    formatProgress,
    formatProjectName,
    formatProjectDuration,
    formatProjectBudgetRange,
  }
}
