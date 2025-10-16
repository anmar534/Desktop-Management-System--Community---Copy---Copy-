/**
 * Storage Modules
 *
 * @module storage/modules
 * @description Exports for specialized storage modules
 */

export { ProjectsStorage, projectsStorage } from './ProjectsStorage'
export { PricingStorage, pricingStorage } from './PricingStorage'
export { SnapshotStorage, snapshotStorage } from './SnapshotStorage'
export { BackupStorage, backupStorage } from './BackupStorage'
export { ClientsStorage, clientsStorage } from './ClientsStorage'
export { BOQStorage, boqStorage } from './BOQStorage'
export type { Project } from '../../data/centralData'
export type { DefaultPercentages, TenderPricingPayload } from './PricingStorage'
export type {
  PricingSnapshot,
  PricingSnapshotItem,
  PricingSnapshotTotals,
  PricingSnapshotMeta,
} from './SnapshotStorage'
export type {
  TenderPricingBackupPayload,
  TenderBackupRecord,
  BackupStore,
  BackupFailureState,
  BackupExportSnapshot,
  BackupMetadata,
  BackupData,
  RetentionRule,
  BackupDataset,
} from './BackupStorage'
