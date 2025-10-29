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
   * Load BOQ data by tender ID
   * BOQ is stored with tenderId, not projectId
   */
  static async loadProjectBOQ(tenderIdOrProjectId: string): Promise<BOQData | null> {
    try {
      const boqRepository = getBOQRepository()

      // أولاً حاول البحث بـ tenderId مباشرة
      const boqByTender = await boqRepository.getByTenderId(tenderIdOrProjectId)
      if (boqByTender) {
        console.log('✅ [DataLoader] Found BOQ by tenderId:', tenderIdOrProjectId)
        return boqByTender
      }

      // إذا لم يُعثر عليه، حاول البحث بـ projectId
      const boqByProject = await boqRepository.getByProjectId(tenderIdOrProjectId)
      if (boqByProject) {
        console.log('✅ [DataLoader] Found BOQ by projectId:', tenderIdOrProjectId)
        return boqByProject
      }

      console.warn('❌ [DataLoader] No BOQ found for:', tenderIdOrProjectId)
      return null
    } catch (error) {
      console.error('تعذر تحميل بيانات BOQ من المستودع', error)
      return null
    }
  }
}
