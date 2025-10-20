import { describe, it, expect } from 'vitest'
import type { Project } from '@/data/centralData'
import { UnifiedCalculationsService } from '@/application/services/unifiedCalculationsService'

const svc = UnifiedCalculationsService.getInstance()

describe('Project efficiency', () => {
  it('handles project with no costs/dates', () => {
    const project: Project = {
      id: 'p0',
      name: 'NoData',
      client: 'X',
      status: 'planning',
      priority: 'low',
      progress: 0,
      contractValue: 0,
      estimatedCost: 0,
      actualCost: 0,
      spent: 0,
      remaining: 0,
      expectedProfit: 0,
      startDate: '',
      endDate: '',
      manager: '',
      team: '',
      location: '',
      phase: '',
      health: 'green',
      lastUpdate: new Date().toISOString(),
      category: '',
      efficiency: 100,
      riskLevel: 'low',
      budget: 0,
      value: 0,
      type: '',
    }
    const eff = svc.calculateProjectEfficiency(project)
    expect(eff.costEfficiency).toBe(100)
    expect(eff.timeEfficiency).toBe(100)
    expect(eff.overallEfficiency).toBe(100)
  })

  it('calculates reasonable efficiency with data', () => {
    const project: Project = {
      id: 'p1',
      name: 'Data',
      client: 'Y',
      status: 'active',
      priority: 'medium',
      progress: 50,
      contractValue: 1_000_000,
      estimatedCost: 600_000,
      actualCost: 400_000,
      spent: 400_000,
      remaining: 600_000,
      expectedProfit: 400_000,
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
      endDate: new Date(new Date().getFullYear(), 11, 31).toISOString(),
      manager: '',
      team: '',
      location: '',
      phase: '',
      health: 'green',
      lastUpdate: new Date().toISOString(),
      category: '',
      efficiency: 100,
      riskLevel: 'low',
      budget: 1_000_000,
      value: 1_000_000,
      type: '',
    }
    const eff = svc.calculateProjectEfficiency(project)
    expect(eff.costEfficiency).toBeGreaterThan(0)
    expect(eff.timeEfficiency).toBeGreaterThan(0)
    expect(eff.overallEfficiency).toBeGreaterThan(0)
  })
})
