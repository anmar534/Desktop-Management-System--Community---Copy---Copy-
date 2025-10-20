import { describe, it, expect } from 'vitest'
import type { Project } from '@/data/centralData'
import { UnifiedCalculationsService } from '@/application/services/unifiedCalculationsService'

const svc = UnifiedCalculationsService.getInstance()

describe('Project analytics (unified)', () => {
  it('returns zeros for empty projects', () => {
    const res = svc.analyzeProjects([])
    expect(res.totalProjects).toBe(0)
    expect(res.activeProjects).toBe(0)
    expect(res.completedProjects).toBe(0)
    expect(res.delayedProjects).toBe(0)
    expect(res.totalContractValue).toBe(0)
    expect(res.totalActualCost).toBe(0)
    expect(res.totalProfit).toBe(0)
    expect(res.averageProgress).toBe(0)
    expect(res.onTimeCompletionRate).toBe(0)
  })

  it('analyzes mixed projects correctly', () => {
    const projects: Project[] = [
      {
        id: 'p1',
        name: 'Active A',
        client: 'Client 1',
        status: 'active',
        priority: 'medium',
        progress: 40,
        contractValue: 1_000_000,
        estimatedCost: 700_000,
        actualCost: 300_000,
        spent: 300_000,
        remaining: 700_000,
        expectedProfit: 300_000,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        manager: 'M1',
        team: '',
        location: 'Riyadh',
        phase: 'Execution',
        health: 'green',
        lastUpdate: new Date().toISOString(),
        category: 'Building',
        efficiency: 100,
        riskLevel: 'low',
        budget: 1_000_000,
        value: 1_000_000,
        type: 'residential',
      },
      {
        id: 'p2',
        name: 'Completed B',
        client: 'Client 2',
        status: 'completed',
        priority: 'high',
        progress: 100,
        contractValue: 2_000_000,
        estimatedCost: 1_400_000,
        actualCost: 1_500_000,
        spent: 1_500_000,
        remaining: 500_000,
        expectedProfit: 600_000,
        actualProfit: 500_000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        manager: 'M2',
        team: '',
        location: 'Jeddah',
        phase: 'Closed',
        health: 'yellow',
        lastUpdate: new Date().toISOString(),
        category: 'Infrastructure',
        efficiency: 100,
        riskLevel: 'medium',
        budget: 2_000_000,
        value: 2_000_000,
        type: 'infrastructure',
      },
      {
        id: 'p3',
        name: 'Delayed C',
        client: 'Client 3',
        status: 'delayed',
        priority: 'critical',
        progress: 20,
        contractValue: 500_000,
        estimatedCost: 450_000,
        actualCost: 200_000,
        spent: 200_000,
        remaining: 300_000,
        expectedProfit: 50_000,
        startDate: '2025-03-01',
        endDate: '2025-10-01',
        manager: 'M3',
        team: '',
        location: 'Dammam',
        phase: 'Execution',
        health: 'red',
        lastUpdate: new Date().toISOString(),
        category: 'Maintenance',
        efficiency: 90,
        riskLevel: 'high',
        budget: 500_000,
        value: 500_000,
        type: 'maintenance',
      },
    ]

    const res = svc.analyzeProjects(projects)
    expect(res.totalProjects).toBe(3)
    expect(res.activeProjects).toBe(1)
    expect(res.completedProjects).toBe(1)
    expect(res.delayedProjects).toBe(1)

    expect(res.totalContractValue).toBe(3_500_000)
    expect(res.totalActualCost).toBe(2_000_000)
    expect(res.totalProfit).toBe(1_500_000)

    // averageProgress = (40 + 100 + 20) / 3 = 160/3 ≈ 53.33
    expect(Math.round(res.averageProgress)).toBe(53)

    // onTimeCompletionRate: with current logic, completed projects assumed on time if completed exists
    // we have 1 completed, so rate should be 100
    expect(res.onTimeCompletionRate).toBe(100)
  })
})
