/**
 * Stats Calculator Module
 * Responsible for auto-creation statistics
 */

import type { Tender, Project } from '@/data/centralData'
import { getRelationRepository } from '@/application/services/serviceRegistry'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type { EntityRelationSnapshot } from '@/repository/relations.repository'

export interface AutoCreationStats {
  totalAutoCreatedProjects: number
  totalProjects: number
  totalTenders: number
  autoCreationRate: number
  linkedProjectsRate: number
}

export class StatsCalculator {
  /**
   * Get auto-creation statistics
   */
  static getAutoCreationStats(): AutoCreationStats {
    const snapshot: EntityRelationSnapshot = getRelationRepository().getSnapshot()
    const tenderProjectLinks = snapshot.tenderProject.length
    const autoCreatedProjects = snapshot.tenderProject.filter((link) => link.isAutoCreated).length

    const projects = safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, [])
    const tenders = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])

    const totalProjects = projects.length
    const totalTenders = tenders.length

    return {
      totalAutoCreatedProjects: autoCreatedProjects,
      totalProjects,
      totalTenders,
      autoCreationRate: totalTenders > 0 ? (autoCreatedProjects / totalTenders) * 100 : 0,
      linkedProjectsRate: totalProjects > 0 ? (tenderProjectLinks / totalProjects) * 100 : 0,
    }
  }
}
