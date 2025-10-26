/**
 * profitabilityAnalysisService
 */

export interface ProjectProfitability {
  projectId: string
  profitMargin: number
}

export interface ClientProfitability {
  clientId: string
  profitMargin: number
}

export class ProfitabilityAnalysisService {
  // Stub implementation
}

export const profitabilityAnalysisService = new ProfitabilityAnalysisService()
