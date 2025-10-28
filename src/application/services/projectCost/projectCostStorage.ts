/**
 * Project Cost Storage Layer
 * Handles localStorage persistence for cost envelopes
 */

import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { safeLocalStorage, whenStorageReady } from '@/shared/utils/storage/storage'
import type { ProjectCostEnvelope, StoredEnvelopesIndex } from './projectCostTypes'

/**
 * Load all project cost envelopes from storage
 */
export function loadAll(): StoredEnvelopesIndex {
  return safeLocalStorage.getItem(STORAGE_KEYS.PROJECT_COST_ENVELOPES, {})
}

/**
 * Save all project cost envelopes to storage
 */
export function saveAll(data: StoredEnvelopesIndex) {
  safeLocalStorage.setItem(STORAGE_KEYS.PROJECT_COST_ENVELOPES, data)
}

/**
 * Get specific project cost envelope
 */
export function getEnvelope(projectId: string): ProjectCostEnvelope | null {
  const all = loadAll()
  return all[projectId] || null
}

/**
 * Persist single envelope update
 */
export function persistEnvelope(projectId: string, envelope: ProjectCostEnvelope) {
  const all = loadAll()
  all[projectId] = envelope
  saveAll(all)
}

/**
 * Initialize storage when ready
 */
export function initializeStorage() {
  return whenStorageReady()
}
