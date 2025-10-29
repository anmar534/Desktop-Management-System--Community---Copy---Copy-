/**
 * Project Builder Module
 * Responsible for building project data structure from tender
 */

import type { Tender, Project } from '@/data/centralData'
import type { ProjectCreationOptions } from './types'

export class ProjectBuilder {
  /**
   * Calculate project end date based on tender deadline
   */
  static calculateProjectEndDate(tenderDeadline: string): string {
    try {
      const deadline = new Date(tenderDeadline)
      deadline.setMonth(deadline.getMonth() + 6)
      return deadline.toISOString().split('T')[0]
    } catch {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 6)
      return futureDate.toISOString().split('T')[0]
    }
  }

  /**
   * Build project data structure from tender
   */
  static buildProjectFromTender(
    tender: Tender,
    options: ProjectCreationOptions,
  ): {
    projectData: Omit<Project, 'id'>
    warnings: string[]
  } {
    const { inheritBudget = true } = options
    const warnings: string[] = []

    let contractValue = tender.value ?? 0
    let estimatedCost = contractValue * 0.8

    console.log('🔍 [ProjectBuilder] Building project from tender:', {
      tenderName: tender.name,
      tenderValue: tender.value,
      tenderTotalValue: tender.totalValue,
      inheritBudget,
    })

    if (inheritBudget && tender.totalValue != null) {
      contractValue = tender.totalValue
      estimatedCost = contractValue * 0.8
      console.log('✅ [ProjectBuilder] Using tender.totalValue (includes VAT):', contractValue)
    } else {
      console.log('⚠️ [ProjectBuilder] Using tender.value (may not include VAT):', contractValue)
    }

    if (contractValue === 0) {
      warnings.push('Contract value is zero - please review tender data')
      console.warn('⚠️ [ProjectBuilder] Contract value is zero!')
    }

    const managerName = this.coalesceString(tender.manager, 'Unassigned')
    const teamName = this.coalesceString(tender.team, 'Project Team')
    const projectLocation = this.coalesceString(tender.location, 'TBD')
    const projectCategory = this.coalesceString(tender.category, 'General')
    const projectType = this.coalesceString(tender.type, 'Construction Project')
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = this.calculateProjectEndDate(tender.deadline)
    const lastUpdate = new Date().toISOString()

    // Don't add "Project" prefix if tender name already contains it
    const projectName = tender.name.toLowerCase().includes('project')
      ? tender.name
      : `Project ${tender.name}`

    console.log('📝 [ProjectBuilder] Project name:', projectName)

    const projectData: Omit<Project, 'id'> = {
      name: projectName,
      client: tender.client,
      status: 'planning' as const,
      priority: 'medium' as const,
      progress: 0,
      contractValue,
      estimatedCost,
      actualCost: 0,
      spent: 0,
      remaining: contractValue,
      expectedProfit: contractValue - estimatedCost,
      startDate,
      endDate,
      manager: managerName,
      team: teamName,
      location: projectLocation,
      phase: 'Planning',
      health: 'green' as const,
      lastUpdate,
      category: projectCategory,
      efficiency: 0,
      riskLevel: 'low' as const,
      budget: contractValue,
      value: contractValue,
      type: projectType,
    }

    return { projectData, warnings }
  }

  /**
   * Coalesce string value with fallback
   */
  private static toNonEmptyString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  /**
   * Coalesce string value with fallback
   */
  private static coalesceString(value: unknown, fallback: string): string {
    return this.toNonEmptyString(value) ?? fallback
  }

  /**
   * Coalesce from multiple candidate values
   */
  static coalesceFromCandidates(values: unknown[], fallback: string): string {
    for (const value of values) {
      const candidate = ProjectBuilder.toNonEmptyString(value)
      if (candidate) {
        return candidate
      }
    }
    return fallback
  }
}
