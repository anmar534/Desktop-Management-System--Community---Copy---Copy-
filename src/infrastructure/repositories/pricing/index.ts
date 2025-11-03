/**
 * Pricing Repositories - Public API
 *
 * @module infrastructure/repositories/pricing
 * @description Unified export for all pricing-related repositories
 *
 * Architecture:
 * - PricingOrchestrator: Facade/Coordinator for high-level operations
 * - PricingDataRepository: Handles pricing data persistence
 * - BOQSyncRepository: Synchronizes pricing with BOQ
 * - TenderStatusRepository: Updates tender status based on pricing
 *
 * Usage:
 * ```typescript
 * // For high-level operations (recommended)
 * import { pricingOrchestrator } from '@/infrastructure/repositories/pricing'
 * await pricingOrchestrator.persistPricingAndBOQ(...)
 *
 * // For direct repository access (advanced)
 * import { pricingDataRepository } from '@/infrastructure/repositories/pricing'
 * await pricingDataRepository.savePricing(...)
 * ```
 */

// Orchestrator (Facade) - Primary interface
export { PricingOrchestrator, pricingOrchestrator } from './PricingOrchestrator'
export type { SavePricingOptions } from './PricingOrchestrator'

// Specialized Repositories - Direct access when needed
export { PricingDataRepository, pricingDataRepository } from './PricingDataRepository'
export { BOQSyncRepository, boqSyncRepository } from './BOQSyncRepository'
export { TenderStatusRepository, tenderStatusRepository } from './TenderStatusRepository'

// Types
export type { BOQSyncOptions } from './BOQSyncRepository'
export type { StatusUpdateOptions } from './TenderStatusRepository'
