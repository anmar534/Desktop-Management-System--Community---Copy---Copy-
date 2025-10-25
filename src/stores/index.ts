/**
 * Stores Index
 *
 * Central export point for all Zustand stores
 */

// Tender Pricing Store
export {
  useTenderPricingStore,
  selectors as tenderPricingSelectors,
  computed as tenderPricingComputed,
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
  DataSlice,
  UISlice,
  EffectsSlice,
} from './tenderPricing'

// BOQ Store (Week -1, Day -5) ✅
export {
  useBOQStore,
  selectBOQ,
  selectPricedBOQ,
  selectIsApproved,
  selectIsCached,
} from './boqStore'

export type { BOQItem as BOQStoreItem, PricedBOQItem, BOQCacheEntry, BOQStore } from './boqStore'

// Future stores will be added here:
// export { useTendersStore } from './tenders';
// export { useAttachmentsStore } from './attachments';
