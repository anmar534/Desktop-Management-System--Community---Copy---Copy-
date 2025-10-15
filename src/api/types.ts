/**
 * REST API Types and Interfaces
 * Sprint 5.3: تطوير APIs للتكامل الخارجي
 */

// ============================================================================
// Core API Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  metadata?: ResponseMetadata
}

export interface ApiError {
  code: string
  message: string
  messageAr: string
  details?: Record<string, unknown>
  timestamp: string
  requestId?: string
}

export interface ResponseMetadata {
  timestamp: string
  requestId: string
  version: string
  pagination?: PaginationMetadata
  rateLimit?: RateLimitMetadata
}

export interface PaginationMetadata {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface RateLimitMetadata {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// ============================================================================
// Request Types
// ============================================================================

export interface ApiRequest {
  headers?: Record<string, string>
  params?: Record<string, string>
  query?: Record<string, string | number | boolean>
  body?: unknown
}

export interface PaginatedRequest {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilteredRequest {
  filters?: Record<string, unknown>
  search?: string
}

// ============================================================================
// Authentication & Authorization
// ============================================================================

export interface AuthCredentials {
  username: string
  password: string
}

export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
  scope: string[]
}

export interface ApiKey {
  id: string
  key: string
  name: string
  nameEn?: string
  description?: string
  permissions: ApiPermission[]
  rateLimit: number
  expiresAt?: string
  createdAt: string
  lastUsedAt?: string
  isActive: boolean
}

export type ApiPermission = 
  | 'tenders:read'
  | 'tenders:write'
  | 'tenders:delete'
  | 'projects:read'
  | 'projects:write'
  | 'projects:delete'
  | 'financial:read'
  | 'financial:write'
  | 'financial:delete'
  | 'procurement:read'
  | 'procurement:write'
  | 'procurement:delete'
  | 'reports:read'
  | 'reports:write'
  | 'analytics:read'
  | 'settings:read'
  | 'settings:write'
  | 'admin:all'

// ============================================================================
// API Endpoints Configuration
// ============================================================================

export interface ApiEndpoint {
  path: string
  method: HttpMethod
  description: string
  descriptionAr: string
  permissions: ApiPermission[]
  rateLimit?: number
  deprecated?: boolean
  version: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// ============================================================================
// External Integration Types
// ============================================================================

export interface ExternalIntegration {
  id: string
  name: string
  nameEn?: string
  type: IntegrationType
  status: IntegrationStatus
  config: IntegrationConfig
  lastSync?: string
  nextSync?: string
  createdAt: string
  updatedAt: string
}

export type IntegrationType = 
  | 'accounting'
  | 'hr'
  | 'crm'
  | 'banking'
  | 'erp'
  | 'custom'

export type IntegrationStatus = 
  | 'active'
  | 'inactive'
  | 'error'
  | 'syncing'
  | 'pending'

export interface IntegrationConfig {
  endpoint: string
  apiKey?: string
  credentials?: Record<string, string>
  settings: Record<string, unknown>
  webhooks?: WebhookConfig[]
  syncInterval?: number
  retryPolicy?: RetryPolicy
}

export interface WebhookConfig {
  id: string
  url: string
  events: string[]
  secret?: string
  isActive: boolean
  headers?: Record<string, string>
}

export interface RetryPolicy {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
  maxDelay: number
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookPayload<T = unknown> {
  id: string
  event: string
  timestamp: string
  data: T
  signature?: string
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  payload: WebhookPayload
  status: 'pending' | 'success' | 'failed'
  attempts: number
  lastAttempt?: string
  nextAttempt?: string
  response?: {
    statusCode: number
    body: string
    headers: Record<string, string>
  }
}

// ============================================================================
// API Documentation Types
// ============================================================================

export interface ApiDocumentation {
  version: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  baseUrl: string
  endpoints: ApiEndpoint[]
  schemas: Record<string, unknown>
  examples: ApiExample[]
}

export interface ApiExample {
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  endpoint: string
  method: HttpMethod
  request: {
    headers?: Record<string, string>
    params?: Record<string, string>
    query?: Record<string, string>
    body?: unknown
  }
  response: {
    status: number
    body: unknown
  }
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: ApiRequest) => string
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

