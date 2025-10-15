/**
 * API Module - Main Export
 * Sprint 5.3: تطوير APIs للتكامل الخارجي
 */

// Export client
export { ApiClient, apiClient, setAuthToken, clearAuthToken, getStoredAuthToken } from './client'

// Export types
export type {
  ApiResponse,
  ApiError,
  ApiRequest,
  PaginatedRequest,
  FilteredRequest,
  AuthCredentials,
  AuthToken,
  ApiKey,
  ApiPermission,
  ApiEndpoint,
  HttpMethod,
  ExternalIntegration,
  IntegrationType,
  IntegrationStatus,
  IntegrationConfig,
  WebhookConfig,
  WebhookPayload,
  WebhookDelivery,
  RateLimitConfig,
  RateLimitInfo,
  ResponseMetadata,
  PaginationMetadata,
  RateLimitMetadata,
} from './types'

// Export config
export { API_VERSION, API_BASE_PATH, API_CONFIG, API_ENDPOINTS, API_ERROR_CODES, RATE_LIMIT_CONFIG } from './config'

// Export tenders endpoints
export * as TendersAPI from './endpoints/tenders'
export type {
  Tender,
  TenderStatus,
  TenderPricing,
  TenderBOQ,
  BOQItem,
  CreateTenderRequest,
  UpdateTenderRequest,
  TenderListResponse,
  TenderStatistics,
} from './endpoints/tenders'

// Export projects endpoints
export * as ProjectsAPI from './endpoints/projects'
export type {
  Project,
  ProjectStatus,
  ProjectCosts,
  ProjectSchedule,
  ProjectTask,
  TaskStatus,
  TaskPriority,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListResponse,
  ProjectStatistics,
} from './endpoints/projects'

// Export financial endpoints
export * as FinancialAPI from './endpoints/financial'
export type {
  Invoice,
  InvoiceType,
  InvoiceStatus,
  InvoiceItem,
  BankAccount,
  Budget,
  BudgetCategory,
  FinancialReport,
  ReportType,
  ReportPeriod,
  FinancialStatement,
  FinancialSummary,
  CashFlowAnalysis,
  ProfitabilityAnalysis,
} from './endpoints/financial'

// Export procurement endpoints
export * as ProcurementAPI from './endpoints/procurement'
export type {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderItem,
  Supplier,
  InventoryItem,
  InventoryMovement,
  MovementType,
  SupplierPerformance,
  InventoryValuation,
  ProcurementSummary,
  SpendAnalysis,
  SupplierComparison,
} from './endpoints/procurement'

