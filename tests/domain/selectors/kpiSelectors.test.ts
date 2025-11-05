/**
 * Tests for KPI Selectors
 */

import { describe, it, expect } from 'vitest'
import {
  selectTotalRevenue,
  selectTotalProfit,
  selectWonTendersCount,
  selectActiveProjectsCount,
  selectTotalProjectsCount,
  selectAverageProjectProgress,
  selectTotalTendersCount,
  selectAllKPIMetrics,
} from '@/domain/selectors/kpiSelectors'
import type { Project, Tender } from '@/data/centralData'

describe('KPI Selectors', () => {
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Project 1',
      status: 'active',
      contractValue: 5000000,
      progress: 75,
    } as Project,
    {
      id: '2',
      name: 'Project 2',
      status: 'active',
      contractValue: 3000000,
      progress: 60,
    } as Project,
    {
      id: '3',
      name: 'Project 3',
      status: 'completed',
      contractValue: 2000000,
      progress: 100,
    } as Project,
  ]

  const mockTenders: Tender[] = [
    { id: '1', status: 'won', value: 1000000 } as Tender,
    { id: '2', status: 'won', value: 2000000 } as Tender,
    { id: '3', status: 'submitted', value: 1500000 } as Tender,
    { id: '4', status: 'lost', value: 1000000 } as Tender,
  ]

  describe('selectTotalRevenue', () => {
    it('should calculate total revenue from active projects', () => {
      const revenue = selectTotalRevenue(mockProjects)
      expect(revenue).toBe(8000000) // 5M + 3M
    })

    it('should return 0 for empty projects', () => {
      const revenue = selectTotalRevenue([])
      expect(revenue).toBe(0)
    })
  })

  describe('selectTotalProfit', () => {
    it('should calculate profit as 15% of revenue', () => {
      const profit = selectTotalProfit(mockProjects)
      expect(profit).toBe(1200000) // 8M * 0.15
    })
  })

  describe('selectWonTendersCount', () => {
    it('should count won tenders', () => {
      const count = selectWonTendersCount(mockTenders)
      expect(count).toBe(2)
    })
  })

  describe('selectTotalTendersCount', () => {
    it('should count all tenders', () => {
      const count = selectTotalTendersCount(mockTenders)
      expect(count).toBe(4)
    })
  })

  describe('selectActiveProjectsCount', () => {
    it('should count active projects', () => {
      const count = selectActiveProjectsCount(mockProjects)
      expect(count).toBe(2)
    })
  })

  describe('selectTotalProjectsCount', () => {
    it('should count all projects', () => {
      const count = selectTotalProjectsCount(mockProjects)
      expect(count).toBe(3)
    })
  })

  describe('selectAverageProjectProgress', () => {
    it('should calculate average progress', () => {
      const avg = selectAverageProjectProgress(mockProjects)
      expect(avg).toBe(78) // (75 + 60 + 100) / 3 = 78.33 -> 78
    })

    it('should return 0 for projects without progress', () => {
      const projectsWithoutProgress = [{ id: '1', status: 'active' } as Project]
      const avg = selectAverageProjectProgress(projectsWithoutProgress)
      expect(avg).toBe(0)
    })
  })

  describe('selectAllKPIMetrics', () => {
    it('should return all metrics', () => {
      const metrics = selectAllKPIMetrics(mockProjects, mockTenders)

      expect(metrics.totalProjects).toBe(3)
      expect(metrics.activeProjects).toBe(2)
      expect(metrics.completedProjects).toBe(1)
      expect(metrics.totalRevenue).toBe(8000000)
      expect(metrics.totalRevenueMillions).toBe(8)
      expect(metrics.totalProfit).toBe(1200000)
      expect(metrics.totalProfitMillions).toBeCloseTo(1.2)
      expect(metrics.totalTenders).toBe(4)
      expect(metrics.wonTendersCount).toBe(2)
      expect(metrics.wonTendersValueMillions).toBeCloseTo(3)
    })
  })
})
