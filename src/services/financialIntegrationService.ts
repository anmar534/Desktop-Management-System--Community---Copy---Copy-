/**
 * financialIntegrationService
 */

export interface IntegrationSettings {
  apiKey?: string
  endpoint?: string
}

export interface SyncResult {
  success: boolean
  message: string
}

export class FinancialIntegrationService {
  // Stub implementation
}

export const financialIntegrationService = new FinancialIntegrationService()