/**
 * Utilities Module - Re-exports from shared/utils
 * This file provides a unified entry point for all utility functions
 */

// Storage utilities
export * from '@/shared/utils/storage/storage'
export * from '@/shared/utils/storage/storageSchema'
export * from '@/shared/utils/storage/backupManager'

// BOQ utilities
export * from '@/shared/utils/boq/boqCalculations'

// Pricing utilities
export * from '@/shared/utils/pricing/normalizePricing'
export * from '@/shared/utils/pricing/priceOptimization'
export * from '@/shared/utils/pricing/pricingHelpers'
export * from '@/shared/utils/pricing/unifiedCalculations'

// Tender utilities
export * from '@/shared/utils/tender/tenderNotifications'
export * from '@/shared/utils/tender/tenderProgressCalculator'
export * from '@/shared/utils/tender/tenderStatusHelpers'
export * from '@/shared/utils/tender/tenderStatusMigration'

// Data utilities
export * from '@/shared/utils/data/dataImport'
export * from '@/shared/utils/data/dataMigration'
export * from '@/shared/utils/data/excelProcessor'

// Security utilities
export * from '@/shared/utils/security/desktopSecurity'
export * from '@/shared/utils/security/secureStore'
export * from '@/shared/utils/security/securityUpdates'

// Formatters
export * from '@/shared/utils/formatters/formatters'
export * from '@/shared/utils/formatters/numberFormat'
export * from '@/shared/utils/formatters/numberHelpers'

// UI utilities
export * from '@/shared/utils/ui/buttonStyles'
export * from '@/shared/utils/ui/designTokens'
export * from '@/shared/utils/ui/statusColors'

// ML utilities
export * from '@/shared/utils/ml/historicalComparison'
export * from '@/shared/utils/ml/patternRecognition'
export * from '@/shared/utils/ml/predictionModels'

// Analytics utilities
export * from '@/shared/utils/analytics/analyticsExport'
export * from '@/shared/utils/analytics/analyticsUtils'

// Root utilities
export * from '@/shared/utils/auditLog'
export * from '@/shared/utils/cn'
export * from '@/shared/utils/defaultPercentagesPropagation'
export * from '@/shared/utils/eventManager'
export * from '@/shared/utils/exporters'
export * from '@/shared/utils/fileUploadService'
export * from '@/shared/utils/helpers'

