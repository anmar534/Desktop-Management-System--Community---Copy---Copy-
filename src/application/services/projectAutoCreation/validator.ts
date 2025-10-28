/**
 * Validator Module
 * Responsible for validation and eligibility checks
 */

import type { Tender } from '@/data/centralData'
import { getRelationRepository } from '@/application/services/serviceRegistry'

export class Validator {
  /**
   * Check if project can be created from tender
   * Returns validation result with reasons
   */
  static canCreateProjectFromTender(tender: Tender): {
    canCreate: boolean
    reasons: string[]
  } {
    const reasons: string[] = []

    if (tender.status !== 'won') {
      reasons.push('Tender is not in won status')
    }

    const existingProjectId = getRelationRepository().getProjectIdByTenderId(tender.id)
    if (existingProjectId) {
      reasons.push('Project already linked to this tender')
    }

    if (!tender.client || tender.client.trim() === '') {
      reasons.push('Client data missing')
    }

    if (!tender.value || tender.value <= 0) {
      reasons.push('Invalid tender value')
    }

    return {
      canCreate: reasons.length === 0,
      reasons,
    }
  }
}
