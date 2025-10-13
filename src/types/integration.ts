/**
 * Integration & API Development Types
 * Comprehensive type definitions for external data integration and ERP connectivity
 */

// Core Integration Types
export interface IntegrationConfig {
  id: string
  name: string
  nameEn?: string
  type: IntegrationType
  status: IntegrationStatus
  endpoint: string
  apiKey?: string
  credentials?: IntegrationCredentials
  settings: IntegrationSettings
  lastSync: string
  nextSync: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export type IntegrationType = 
  | 'material_cost_db'
  | 'economic_data'
  | 'government_tender'
  | 'industry_association'
  | 'weather_data'
  | 'accounting_system'
  | 'project_management'
  | 'crm_system'
  | 'document_management'
  | 'business_intelligence'

export type IntegrationStatus = 
  | 'connected'
  | 'disconnected'
  | 'syncing'
  | 'error'
  | 'pending'
  | 'maintenance'

export interface IntegrationCredentials {
  username?: string
  password?: string
  token?: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
  refreshToken?: string
  expiresAt?: string
}

export interface IntegrationSettings {
  syncInterval: number // minutes
  autoSync: boolean
  retryAttempts: number
  timeout: number // seconds
  batchSize: number
  filters?: Record<string, any>
  mapping?: FieldMapping[]
  webhookUrl?: string
  notificationSettings: NotificationSettings
}

export interface FieldMapping {
  sourceField: string
  targetField: string
  transformation?: string
  required: boolean
  defaultValue?: any
}

export interface NotificationSettings {
  onSuccess: boolean
  onError: boolean
  onWarning: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  recipients: string[]
}

// External Data Types
export interface MaterialCostData {
  id: string
  materialCode: string
  materialName: string
  materialNameEn?: string
  category: string
  unit: string
  unitPrice: number
  currency: string
  region: string
  supplier: string
  effectiveDate: string
  expiryDate: string
  source: string
  lastUpdated: string
  priceHistory: PriceHistoryEntry[]
}

export interface PriceHistoryEntry {
  date: string
  price: number
  currency: string
  source: string
  changePercentage: number
}

export interface EconomicData {
  id: string
  indicator: EconomicIndicator
  value: number
  unit: string
  period: string
  region: string
  source: string
  lastUpdated: string
  forecast?: EconomicForecast[]
}

export type EconomicIndicator = 
  | 'inflation_rate'
  | 'currency_exchange'
  | 'interest_rate'
  | 'gdp_growth'
  | 'construction_index'
  | 'material_price_index'
  | 'labor_cost_index'

export interface EconomicForecast {
  period: string
  forecastValue: number
  confidence: number
  methodology: string
}

export interface GovernmentTenderData {
  id: string
  tenderNumber: string
  title: string
  titleEn?: string
  description: string
  agency: string
  category: string
  estimatedValue: number
  currency: string
  publishDate: string
  submissionDeadline: string
  openingDate: string
  status: TenderStatus
  location: string
  requirements: string[]
  documents: TenderDocument[]
  source: string
  lastUpdated: string
}

export type TenderStatus = 
  | 'published'
  | 'open'
  | 'closed'
  | 'awarded'
  | 'cancelled'
  | 'postponed'

export interface TenderDocument {
  id: string
  name: string
  type: string
  url: string
  size: number
  downloadedAt?: string
}

// ERP Integration Types
export interface ERPIntegration {
  id: string
  systemName: string
  systemType: ERPSystemType
  version: string
  config: IntegrationConfig
  modules: ERPModule[]
  syncStatus: SyncStatus
  lastSync: string
  dataMapping: ERPDataMapping
}

export type ERPSystemType = 
  | 'sap'
  | 'oracle'
  | 'microsoft_dynamics'
  | 'quickbooks'
  | 'sage'
  | 'custom'

export interface ERPModule {
  name: string
  enabled: boolean
  endpoints: string[]
  permissions: string[]
  lastSync: string
}

export interface ERPDataMapping {
  projects: FieldMapping[]
  customers: FieldMapping[]
  suppliers: FieldMapping[]
  materials: FieldMapping[]
  costs: FieldMapping[]
  invoices: FieldMapping[]
}

export interface SyncStatus {
  isRunning: boolean
  progress: number
  totalRecords: number
  processedRecords: number
  errorCount: number
  warnings: string[]
  errors: SyncError[]
  startTime: string
  estimatedCompletion?: string
}

export interface SyncError {
  id: string
  type: 'validation' | 'connection' | 'permission' | 'data'
  message: string
  details: string
  recordId?: string
  timestamp: string
  resolved: boolean
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  metadata?: APIMetadata
}

export interface APIError {
  code: string
  message: string
  details?: string
  timestamp: string
}

export interface APIMetadata {
  totalCount?: number
  pageSize?: number
  currentPage?: number
  totalPages?: number
  hasNext?: boolean
  hasPrevious?: boolean
  requestId: string
  responseTime: number
}

// Sync Operations
export interface SyncOperation {
  id: string
  integrationId: string
  type: SyncType
  direction: SyncDirection
  status: SyncOperationStatus
  startTime: string
  endTime?: string
  duration?: number
  recordsProcessed: number
  recordsSuccess: number
  recordsError: number
  errors: SyncError[]
  summary: SyncSummary
}

export type SyncType = 
  | 'full'
  | 'incremental'
  | 'manual'
  | 'scheduled'

export type SyncDirection = 
  | 'import'
  | 'export'
  | 'bidirectional'

export type SyncOperationStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface SyncSummary {
  totalRecords: number
  newRecords: number
  updatedRecords: number
  deletedRecords: number
  skippedRecords: number
  errorRecords: number
  dataQualityScore: number
  recommendations: string[]
}

// Integration Analytics
export interface IntegrationAnalytics {
  integrationId: string
  period: string
  metrics: IntegrationMetrics
  performance: PerformanceMetrics
  dataQuality: DataQualityMetrics
  trends: TrendAnalysis[]
}

export interface IntegrationMetrics {
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  averageSyncTime: number
  dataVolume: number
  uptime: number
  errorRate: number
}

export interface PerformanceMetrics {
  averageResponseTime: number
  throughput: number
  peakUsage: number
  resourceUtilization: number
  bottlenecks: string[]
}

export interface DataQualityMetrics {
  completeness: number
  accuracy: number
  consistency: number
  timeliness: number
  validity: number
  issues: DataQualityIssue[]
}

export interface DataQualityIssue {
  type: 'missing' | 'invalid' | 'duplicate' | 'outdated'
  field: string
  count: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export interface TrendAnalysis {
  metric: string
  trend: 'increasing' | 'decreasing' | 'stable'
  changePercentage: number
  period: string
  forecast?: number
}

// Service Interfaces
export interface IntegrationService {
  // Configuration Management
  createIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig>
  updateIntegration(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig>
  deleteIntegration(id: string): Promise<void>
  getIntegration(id: string): Promise<IntegrationConfig | null>
  getAllIntegrations(): Promise<IntegrationConfig[]>
  
  // Connection Management
  testConnection(id: string): Promise<boolean>
  connectIntegration(id: string): Promise<void>
  disconnectIntegration(id: string): Promise<void>
  
  // Sync Operations
  startSync(id: string, type: SyncType): Promise<SyncOperation>
  stopSync(operationId: string): Promise<void>
  getSyncStatus(operationId: string): Promise<SyncOperation>
  getSyncHistory(integrationId: string): Promise<SyncOperation[]>
  
  // Data Access
  getMaterialCosts(filters?: any): Promise<MaterialCostData[]>
  getEconomicData(indicator: EconomicIndicator, period?: string): Promise<EconomicData[]>
  getGovernmentTenders(filters?: any): Promise<GovernmentTenderData[]>
  
  // Analytics
  getIntegrationAnalytics(integrationId: string, period: string): Promise<IntegrationAnalytics>
  getSystemHealth(): Promise<any>
  
  // Utilities
  validateConfiguration(config: IntegrationConfig): Promise<ValidationResult>
  exportConfiguration(id: string): Promise<string>
  importConfiguration(configData: string): Promise<IntegrationConfig>
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}
