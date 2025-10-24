/**
 * Stores Index
 *
 * Central export point for all Zustand stores
 */

// Tender Pricing Store
export {
  useTenderPricingStore,
  useTenderPricingComputed,
  tenderPricingSelectors,
  getTenderPricingStore,
  subscribeTenderPricing,
  resetTenderPricingStore,
} from './tenderPricing'

export type {
  TenderPricingState,
  TenderPricingSelector,
  PricingItem,
  BOQItem,
  FilterState,
} from './tenderPricing'

// Middleware
export {
  electronStorage,
  saveToElectronStorage,
  loadFromElectronStorage,
  clearElectronStorage,
  logger,
  conditionalLogger,
} from './middleware'

export type { ElectronStorageOptions, LoggerOptions } from './middleware'

// Future stores will be added here:
// export { useTendersStore } from './tenders';
// export { useAttachmentsStore } from './attachments';
