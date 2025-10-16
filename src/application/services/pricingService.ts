import {
  pricingStorage,
  type DefaultPercentages,
  type TenderPricingPayload,
} from '@/storage/modules/PricingStorage'

export type { DefaultPercentages, TenderPricingPayload }

export const pricingService = {
  async loadTenderPricing(tenderId: string): Promise<TenderPricingPayload | null> {
    return pricingStorage.loadTenderPricing(tenderId)
  },

  async saveTenderPricing(tenderId: string, payload: TenderPricingPayload): Promise<void> {
    await pricingStorage.saveTenderPricing(tenderId, payload)
  },

  async getDefaultPercentages(tenderId: string): Promise<DefaultPercentages | null> {
    return pricingStorage.getDefaultPercentages(tenderId)
  },

  async setDefaultPercentages(tenderId: string, defaults: DefaultPercentages): Promise<void> {
    await pricingStorage.updateDefaultPercentages(tenderId, defaults)
  },
}
