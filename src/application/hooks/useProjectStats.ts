/**
 * useProjectStats Hook
 *
 * Calculates project statistics from filtered projects
 */

import { useMemo } from 'react'
import type { EnhancedProject } from '@/shared/types/projects'

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  totalBudget: number
  totalContractValue: number
  averageProgress: number
}

export const useProjectStats = (filteredProjects: EnhancedProject[]): ProjectStats => {
  return useMemo(() => {
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
    const activeProjects = filteredProjects.filter((p) => p.status === 'active').length
    const completedProjects = filteredProjects.filter((p) => p.status === 'completed').length
    const onHoldProjects = filteredProjects.filter((p) => p.status === 'paused').length
    const totalBudget = filteredProjects.reduce((acc, p) => {
      const value = typeof p.budget === 'number' ? p.budget : (p.budget?.totalBudget ?? 0)
      return acc + value
    }, 0)
    const totalContractValue = filteredProjects.reduce((acc, p) => acc + (p.contractValue ?? 0), 0)
    const averageProgress =
      filteredProjects.reduce((acc, p) => acc + (p.progress ?? 0), 0) / totalProjects

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
}
