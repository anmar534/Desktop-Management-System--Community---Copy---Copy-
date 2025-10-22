/**
 * Data Import Utilities for Historical Data Integration
 *
 * This file provides utilities for importing historical tender and project data
 * from various sources including CSV, Excel, JSON, and legacy system exports.
 *
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 Implementation - Historical Data Integration
 */

import { analyticsService } from '@/application/services/analyticsService'
import type { BidPerformance } from '../types/analytics'

/**
 * Supported import file formats
 */
export type ImportFormat = 'csv' | 'excel' | 'json' | 'xml'

/**
 * Import configuration options
 */
export interface ImportConfig {
  /** File format */
  format: ImportFormat
  /** Whether to validate data before import */
  validateData?: boolean
  /** Whether to skip duplicate records */
  skipDuplicates?: boolean
  /** Batch size for processing large files */
  batchSize?: number
  /** Field mapping for custom data structures */
  fieldMapping?: Record<string, string>
  /** Date format for parsing dates */
  dateFormat?: string
  /** Default values for missing fields */
  defaultValues?: Record<string, any>
}

/**
 * Import result summary
 */
export interface ImportResult {
  /** Total records processed */
  totalRecords: number
  /** Successfully imported records */
  successfulImports: number
  /** Failed imports */
  failedImports: number
  /** Skipped duplicates */
  skippedDuplicates: number
  /** Import errors */
  errors: {
    row: number
    field?: string
    message: string
    data?: any
  }[]
  /** Import warnings */
  warnings: {
    row: number
    field?: string
    message: string
    data?: any
  }[]
  /** Processing time in milliseconds */
  processingTime: number
}

/**
 * Historical tender data structure for import
 */
export interface HistoricalTenderData {
  /** Tender reference number */
  tenderRef: string
  /** Tender title */
  title: string
  /** Client information */
  client: {
    name: string
    type: 'government' | 'private' | 'semi-government'
    sector?: string
  }
  /** Project details */
  project: {
    category: string
    region: string
    estimatedValue: number
    actualValue?: number
    duration?: number
    complexity?: 'low' | 'medium' | 'high'
  }
  /** Bidding information */
  bidding: {
    submissionDate: string
    bidAmount: number
    competitorCount: number
    outcome: 'won' | 'lost' | 'cancelled'
    winnerBidAmount?: number
    preparationTime: number
    teamSize?: number
  }
  /** Financial details */
  financial: {
    plannedMargin: number
    actualMargin?: number
    directCosts?: number
    indirectCosts?: number
    contingency?: number
  }
  /** Performance metrics */
  performance?: {
    deliveryOnTime?: boolean
    budgetVariance?: number
    qualityScore?: number
    clientSatisfaction?: number
  }
  /** Additional metadata */
  metadata?: {
    source: string
    importDate?: string
    notes?: string
    tags?: string[]
  }
}

/**
 * Data Import Service Class
 */
class DataImportService {
  /**
   * Import historical tender data from file content
   */
  async importHistoricalTenders(fileContent: string, config: ImportConfig): Promise<ImportResult> {
    const startTime = Date.now()
    const result: ImportResult = {
      totalRecords: 0,
      successfulImports: 0,
      failedImports: 0,
      skippedDuplicates: 0,
      errors: [],
      warnings: [],
      processingTime: 0,
    }

    try {
      // Parse data based on format
      const rawData = await this.parseFileContent(fileContent, config.format)
      result.totalRecords = rawData.length

      // Process data in batches
      const batchSize = config.batchSize || 100
      for (let i = 0; i < rawData.length; i += batchSize) {
        const batch = rawData.slice(i, i + batchSize)
        await this.processBatch(batch, config, result, i)
      }
    } catch (error) {
      result.errors.push({
        row: 0,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error },
      })
    }

    result.processingTime = Date.now() - startTime
    return result
  }

  /**
   * Parse file content based on format
   */
  private async parseFileContent(content: string, format: ImportFormat): Promise<any[]> {
    switch (format) {
      case 'csv':
        return this.parseCSV(content)
      case 'json':
        return this.parseJSON(content)
      case 'excel':
        throw new Error('Excel format not yet implemented. Please convert to CSV.')
      case 'xml':
        throw new Error('XML format not yet implemented. Please convert to JSON.')
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  /**
   * Parse CSV content
   */
  private parseCSV(content: string): any[] {
    const lines = content.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
    const data: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
      const row: any = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      data.push(row)
    }

    return data
  }

  /**
   * Parse JSON content
   */
  private parseJSON(content: string): any[] {
    try {
      const parsed = JSON.parse(content)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (error) {
      throw new Error(
        `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Process a batch of records
   */
  private async processBatch(
    batch: any[],
    config: ImportConfig,
    result: ImportResult,
    batchStartIndex: number,
  ): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const rowIndex = batchStartIndex + i + 2 // +2 for header and 1-based indexing
      const rawRecord = batch[i]

      try {
        // Transform raw data to HistoricalTenderData
        const historicalData = this.transformToHistoricalData(rawRecord, config, rowIndex, result)

        if (!historicalData) {
          continue // Skip invalid records
        }

        // Check for duplicates if enabled
        if (config.skipDuplicates && (await this.isDuplicate(historicalData))) {
          result.skippedDuplicates++
          continue
        }

        // Convert to BidPerformance and import
        const bidPerformance = this.convertToBidPerformance(historicalData)
        await analyticsService.createBidPerformance(bidPerformance)

        result.successfulImports++
      } catch (error) {
        result.failedImports++
        result.errors.push({
          row: rowIndex,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: rawRecord,
        })
      }
    }
  }

  /**
   * Transform raw data to HistoricalTenderData
   */
  private transformToHistoricalData(
    rawRecord: any,
    config: ImportConfig,
    rowIndex: number,
    result: ImportResult,
  ): HistoricalTenderData | null {
    try {
      // Apply field mapping if provided
      const mappedRecord = config.fieldMapping
        ? this.applyFieldMapping(rawRecord, config.fieldMapping)
        : rawRecord

      // Apply default values
      const recordWithDefaults = {
        ...config.defaultValues,
        ...mappedRecord,
      }

      // Validate required fields
      const requiredFields = ['tenderRef', 'title', 'submissionDate', 'bidAmount', 'outcome']
      for (const field of requiredFields) {
        if (!recordWithDefaults[field]) {
          throw new Error(`Missing required field: ${field}`)
        }
      }

      // Transform to HistoricalTenderData structure
      const historicalData: HistoricalTenderData = {
        tenderRef: String(recordWithDefaults.tenderRef),
        title: String(recordWithDefaults.title),
        client: {
          name: String(recordWithDefaults.clientName || 'Unknown Client'),
          type: this.validateClientType(recordWithDefaults.clientType),
          sector: recordWithDefaults.clientSector,
        },
        project: {
          category: String(recordWithDefaults.category || 'General'),
          region: String(recordWithDefaults.region || 'Unknown'),
          estimatedValue: this.parseNumber(recordWithDefaults.estimatedValue),
          actualValue: this.parseNumber(recordWithDefaults.actualValue),
          duration: this.parseNumber(recordWithDefaults.duration),
          complexity: this.validateComplexity(recordWithDefaults.complexity),
        },
        bidding: {
          submissionDate: this.parseDate(recordWithDefaults.submissionDate, config.dateFormat),
          bidAmount: this.parseNumber(recordWithDefaults.bidAmount, true),
          competitorCount: this.parseNumber(recordWithDefaults.competitorCount) || 1,
          outcome: this.validateOutcome(recordWithDefaults.outcome),
          winnerBidAmount: this.parseNumber(recordWithDefaults.winnerBidAmount),
          preparationTime: this.parseNumber(recordWithDefaults.preparationTime) || 40,
          teamSize: this.parseNumber(recordWithDefaults.teamSize),
        },
        financial: {
          plannedMargin: this.parseNumber(recordWithDefaults.plannedMargin) || 15,
          actualMargin: this.parseNumber(recordWithDefaults.actualMargin),
          directCosts: this.parseNumber(recordWithDefaults.directCosts),
          indirectCosts: this.parseNumber(recordWithDefaults.indirectCosts),
          contingency: this.parseNumber(recordWithDefaults.contingency),
        },
        performance:
          recordWithDefaults.deliveryOnTime !== undefined
            ? {
                deliveryOnTime: this.parseBoolean(recordWithDefaults.deliveryOnTime),
                budgetVariance: this.parseNumber(recordWithDefaults.budgetVariance),
                qualityScore: this.parseNumber(recordWithDefaults.qualityScore),
                clientSatisfaction: this.parseNumber(recordWithDefaults.clientSatisfaction),
              }
            : undefined,
        metadata: {
          source: 'import',
          importDate: new Date().toISOString(),
          notes: recordWithDefaults.notes,
          tags: recordWithDefaults.tags
            ? String(recordWithDefaults.tags)
                .split(',')
                .map((t) => t.trim())
            : undefined,
        },
      }

      return historicalData
    } catch (error) {
      result.errors.push({
        row: rowIndex,
        message: `Data transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: rawRecord,
      })
      return null
    }
  }

  /**
   * Apply field mapping to raw record
   */
  private applyFieldMapping(record: any, mapping: Record<string, string>): any {
    const mapped: any = {}

    for (const [targetField, sourceField] of Object.entries(mapping)) {
      if (record[sourceField] !== undefined) {
        mapped[targetField] = record[sourceField]
      }
    }

    // Include unmapped fields
    for (const [key, value] of Object.entries(record)) {
      if (!Object.values(mapping).includes(key)) {
        mapped[key] = value
      }
    }

    return mapped
  }

  /**
   * Check if record is duplicate
   */
  private async isDuplicate(data: HistoricalTenderData): Promise<boolean> {
    try {
      const existingPerformances = await analyticsService.getAllBidPerformances()
      return existingPerformances.some(
        (p) =>
          p.tenderId === data.tenderRef ||
          (p.submissionDate === data.bidding.submissionDate &&
            p.bidAmount === data.bidding.bidAmount),
      )
    } catch (error) {
      return false // If we can't check, assume not duplicate
    }
  }

  /**
   * Convert HistoricalTenderData to BidPerformance
   */
  private convertToBidPerformance(
    data: HistoricalTenderData,
  ): Omit<BidPerformance, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      tenderId: data.tenderRef,
      submissionDate: data.bidding.submissionDate,
      outcome: data.bidding.outcome,
      bidAmount: data.bidding.bidAmount,
      estimatedValue: data.project.estimatedValue,
      actualMargin: data.financial.actualMargin,
      plannedMargin: data.financial.plannedMargin,
      winProbability: this.calculateWinProbability(data),
      competitorCount: data.bidding.competitorCount,
      preparationTime: data.bidding.preparationTime,
      category: data.project.category,
      region: data.project.region,
      client: {
        id: `client_${data.client.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: data.client.name,
        type: data.client.type,
        paymentHistory: this.inferPaymentHistory(data),
      },
      riskScore: this.calculateRiskScore(data),
      metrics: {
        roi: this.calculateROI(data),
        efficiency: this.calculateEfficiency(data),
        strategicValue: this.calculateStrategicValue(data),
      },
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private parseNumber(value: any, required = false): number {
    if (value === undefined || value === null || value === '') {
      if (required) throw new Error('Required numeric value is missing')
      return 0
    }
    const num =
      typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : Number(value)
    if (isNaN(num)) {
      if (required) throw new Error(`Invalid number: ${value}`)
      return 0
    }
    return num
  }

  private parseDate(value: any, format?: string): string {
    if (!value) throw new Error('Date value is required')

    // Try to parse as ISO date first
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }

    throw new Error(`Invalid date format: ${value}`)
  }

  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      return lower === 'true' || lower === 'yes' || lower === '1'
    }
    return Boolean(value)
  }

  private validateClientType(value: any): 'government' | 'private' | 'semi-government' {
    const validTypes = ['government', 'private', 'semi-government']
    const type = String(value).toLowerCase()
    return validTypes.includes(type) ? (type as any) : 'private'
  }

  private validateComplexity(value: any): 'low' | 'medium' | 'high' {
    const validComplexities = ['low', 'medium', 'high']
    const complexity = String(value).toLowerCase()
    return validComplexities.includes(complexity) ? (complexity as any) : 'medium'
  }

  private validateOutcome(value: any): 'won' | 'lost' | 'cancelled' {
    const validOutcomes = ['won', 'lost', 'cancelled']
    const outcome = String(value).toLowerCase()
    if (!validOutcomes.includes(outcome)) {
      throw new Error(`Invalid outcome: ${value}. Must be one of: ${validOutcomes.join(', ')}`)
    }
    return outcome as any
  }

  private calculateWinProbability(data: HistoricalTenderData): number {
    // Simple heuristic based on historical factors
    let probability = 50 // Base probability

    if (data.bidding.competitorCount <= 3) probability += 20
    else if (data.bidding.competitorCount >= 8) probability -= 20

    if (data.financial.plannedMargin < 10) probability += 15
    else if (data.financial.plannedMargin > 25) probability -= 15

    return Math.max(0, Math.min(100, probability))
  }

  private calculateRiskScore(data: HistoricalTenderData): number {
    let risk = 30 // Base risk

    if (data.project.complexity === 'high') risk += 20
    else if (data.project.complexity === 'low') risk -= 10

    if (data.client.type === 'government') risk -= 10
    else if (data.client.type === 'private') risk += 10

    return Math.max(0, Math.min(100, risk))
  }

  private calculateROI(data: HistoricalTenderData): number {
    if (data.bidding.outcome !== 'won') return 0

    const margin = data.financial.actualMargin || data.financial.plannedMargin
    const preparationCost = data.bidding.preparationTime * 100 // Assume $100/hour
    const revenue = data.bidding.bidAmount * (margin / 100)

    return preparationCost > 0 ? ((revenue - preparationCost) / preparationCost) * 100 : 0
  }

  private calculateEfficiency(data: HistoricalTenderData): number {
    // Efficiency based on preparation time vs project value
    const valuePerHour = data.bidding.bidAmount / data.bidding.preparationTime
    return Math.min(100, (valuePerHour / 50000) * 100) // Normalize to 100
  }

  private calculateStrategicValue(data: HistoricalTenderData): number {
    let value = 50 // Base value

    if (data.project.estimatedValue > 10000000) value += 20 // Large projects
    if (data.client.type === 'government') value += 15 // Government clients
    if (data.project.category === 'infrastructure') value += 10 // Strategic category

    return Math.min(100, value)
  }

  private inferPaymentHistory(data: HistoricalTenderData): string {
    // Infer payment history from available data
    if (data.performance?.clientSatisfaction && data.performance.clientSatisfaction > 80) {
      return 'excellent'
    } else if (data.client.type === 'government') {
      return 'good'
    } else {
      return 'average'
    }
  }
}

// Export singleton instance
export const dataImportService = new DataImportService()

/**
 * Convenience function to import CSV data
 */
export async function importTenderDataFromCSV(
  csvContent: string,
  options: Partial<ImportConfig> = {},
): Promise<ImportResult> {
  const config: ImportConfig = {
    format: 'csv',
    validateData: true,
    skipDuplicates: true,
    batchSize: 50,
    ...options,
  }

  return dataImportService.importHistoricalTenders(csvContent, config)
}

/**
 * Convenience function to import JSON data
 */
export async function importTenderDataFromJSON(
  jsonContent: string,
  options: Partial<ImportConfig> = {},
): Promise<ImportResult> {
  const config: ImportConfig = {
    format: 'json',
    validateData: true,
    skipDuplicates: true,
    batchSize: 100,
    ...options,
  }

  return dataImportService.importHistoricalTenders(jsonContent, config)
}
