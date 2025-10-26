// Shared Utilities

// Analytics
export * from './analytics/analyticsExport'
export * from './analytics/analyticsUtils'

// BOQ
export * from './boq/boqCalculations'

// Pricing
export * from './pricing/normalizePricing'
export * from './pricing/priceOptimization'
export type {
  EnrichedPricingItem,
  ItemBreakdown,
  PricingResource,
  PricingItemInput,
  RawPricingInput,
} from './pricing/pricingHelpers'
export * from './pricing/unifiedCalculations'

// Tender
export * from './tender/tenderNotifications'
export * from './tender/tenderProgressCalculator'
export * from './tender/tenderStatusHelpers'
export * from './tender/tenderStatusMigration'

// Data
export * from './data/dataImport'
// export * from './data/dataMigration'; // DISABLED: Legacy migration tool with dependencies on deleted Phase 1 services
export * from './data/excelProcessor'

// Security
export * from './security/desktopSecurity'
export * from './security/secureStore'
export * from './security/securityUpdates'

// Storage
export * from './storage/backupManager'
export * from './storage/storage'
export * from './storage/storageSchema'

// Formatters - export specific to avoid conflicts
export {
  formatDate,
  formatShortDate,
  daysBetween,
  formatInteger,
  formatNumber,
} from './formatters/formatters'
export * from './formatters/numberHelpers'

// UI
export * from './ui/buttonStyles'
export * from './ui/designTokens'
export { getHealthColor, getStatusColor } from './ui/statusColors'

// ML
export * from './ml/historicalComparison'
export * from './ml/patternRecognition'
export type { WinProbabilityPrediction, PredictionFactor } from './ml/predictionModels'

// Root utilities - export specific to avoid conflicts
export * from './storage/auditLog'
export * from './cn'
export * from './defaultPercentagesPropagation'
export * from './eventManager'
export * from './exporters'
export * from './fileUploadService'
export { generateId } from './helpers'
