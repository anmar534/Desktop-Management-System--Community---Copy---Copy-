/**
 * 🎣 Project Hooks - Barrel Export
 * Centralized export point for all project-related custom hooks
 *
 * @module hooks
 */

// Re-export hooks
export { useProjectData } from './useProjectData'
export { useBOQSync } from './useBOQSync'
export { useProjectCosts } from './useProjectCosts'
export { useProjectAttachments } from './useProjectAttachments'
export { useProjectFormatters } from './useProjectFormatters'

// Re-export types
export type { UseProjectDataReturn } from './useProjectData'
export type { BOQAvailability, UseBOQSyncReturn } from './useBOQSync'
export type { BudgetSummary, UseProjectCostsReturn } from './useProjectCosts'
export type { ProjectAttachment, UseProjectAttachmentsReturn } from './useProjectAttachments'
export type { UseProjectFormattersReturn } from './useProjectFormatters'
