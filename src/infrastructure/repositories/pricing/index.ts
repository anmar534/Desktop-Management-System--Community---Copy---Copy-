/**
 * Pricing Repositories - Public API
 *
 * @module infrastructure/repositories/pricing
 * @description Unified export for all pricing-related repositories
 *
 * Architecture:
 * - PricingOrchestrator: Facade/Coordinator for high-level operations
 * - Pricing data helpers: Handle pricing data persistence
 * - BOQ sync helpers: Synchronize pricing with BOQ
 * - Tender status helpers: Update tender status based on pricing
 *
 * Usage:
 * ```typescript
 * // For high-level operations (recommended)
 * import { pricingOrchestrator } from '@/infrastructure/repositories/pricing'
 * await pricingOrchestrator.persistPricingAndBOQ(...)
 *
 * // For direct storage helpers (advanced)
 * import { savePricingData } from '@/infrastructure/repositories/pricing'
 * await savePricingData(...)
 * ```
 */

// Orchestrator (Facade) - Primary interface
export { PricingOrchestrator, pricingOrchestrator } from './PricingOrchestrator'
export type { SavePricingOptions } from './PricingOrchestrator'

// Specialized helpers - Direct access when needed
export {
  loadPricingData,
  savePricingData,
  loadDefaultPercentages,
  updateDefaultPercentages,
} from './PricingDataRepository'
export { syncPricingToBOQ } from './BOQSyncRepository'
export { updateTenderStatus, calculateTotalValue } from './TenderStatusRepository'

// Types
export type { BOQSyncOptions } from './BOQSyncRepository'
export type { StatusUpdateOptions } from './TenderStatusRepository'
