/**
 * Data Loader Module
 * Responsible for loading data from repositories
 */

import type { Tender } from '@/data/centralData'
import type { BOQData } from '@/shared/types/boq'
import {
  getBOQRepository,
  getRelationRepository,
  getTenderRepository,
} from '@/application/services/serviceRegistry'

export class DataLoader {
  /**
   * Resolve tender for project via relations
   */
  static async resolveTenderForProject(projectId: string): Promise<Tender | null> {
    try {
      const tenderRepository = getTenderRepository()
      const relationRepository = getRelationRepository()
      const tenderIdFromRelations = relationRepository.getTenderIdByProjectId(projectId)

      if (tenderIdFromRelations) {
        const related = await tenderRepository.getById(tenderIdFromRelations)
        if (related) return related
      }

      if (typeof tenderRepository.getByProjectId === 'function') {
        return await tenderRepository.getByProjectId(projectId)
      }

      return null
    } catch (error) {
      console.error('تعذر تحديد المنافسة المرتبطة بالمشروع عبر المستودع', error)
      return null
    }
  }

  /**
   * Load project BOQ data
   */
  static async loadProjectBOQ(projectId: string): Promise<BOQData | null> {
    try {
      const boqRepository = getBOQRepository()
      return await boqRepository.getByProjectId(projectId)
    } catch (error) {
      console.error('تعذر تحميل بيانات BOQ للمشروع من المستودع', error)
      return null
    }
  }
}
