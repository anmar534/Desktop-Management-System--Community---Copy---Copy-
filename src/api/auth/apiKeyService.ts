/**
 * API Key Management Service
 * Sprint 5.3.2: تطوير نظام مصادقة وتفويض
 */

import { apiClient } from '../client'
import type { ApiResponse, ApiKey, ApiPermission } from '../types'
import { nanoid } from 'nanoid'

// ============================================================================
// Types
// ============================================================================

export interface CreateApiKeyRequest {
  name: string
  nameEn?: string
  description?: string
  permissions: ApiPermission[]
  rateLimit?: number
  expiresAt?: string
}

export interface UpdateApiKeyRequest {
  name?: string
  nameEn?: string
  description?: string
  permissions?: ApiPermission[]
  rateLimit?: number
  isActive?: boolean
}

export interface ApiKeyUsage {
  apiKeyId: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  lastUsedAt?: string
  requestsByEndpoint: Record<string, number>
  requestsByDay: Array<{
    date: string
    count: number
  }>
}

// ============================================================================
// API Key Service Class
// ============================================================================

export class ApiKeyService {
  /**
   * Get all API keys
   * الحصول على جميع مفاتيح API
   */
  async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    return apiClient.get<ApiKey[]>('/auth/api-keys')
  }

  /**
   * Get API key by ID
   * الحصول على مفتاح API محدد
   */
  async getApiKeyById(id: string): Promise<ApiResponse<ApiKey>> {
    return apiClient.get<ApiKey>(`/auth/api-keys/${id}`)
  }

  /**
   * Create new API key
   * إنشاء مفتاح API جديد
   */
  async createApiKey(request: CreateApiKeyRequest): Promise<ApiResponse<ApiKey>> {
    // Generate secure API key
    const key = this.generateApiKey()
    
    const apiKey: Omit<ApiKey, 'id' | 'createdAt'> = {
      key,
      name: request.name,
      nameEn: request.nameEn,
      description: request.description,
      permissions: request.permissions,
      rateLimit: request.rateLimit || 100,
      expiresAt: request.expiresAt,
      isActive: true,
    }

    return apiClient.post<ApiKey>('/auth/api-keys', apiKey)
  }

  /**
   * Update API key
   * تحديث مفتاح API
   */
  async updateApiKey(
    id: string,
    request: UpdateApiKeyRequest
  ): Promise<ApiResponse<ApiKey>> {
    return apiClient.put<ApiKey>(`/auth/api-keys/${id}`, request)
  }

  /**
   * Delete API key
   * حذف مفتاح API
   */
  async deleteApiKey(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/auth/api-keys/${id}`)
  }

  /**
   * Revoke API key
   * إلغاء مفتاح API
   */
  async revokeApiKey(id: string): Promise<ApiResponse<ApiKey>> {
    return apiClient.post<ApiKey>(`/auth/api-keys/${id}/revoke`)
  }

  /**
   * Regenerate API key
   * إعادة إنشاء مفتاح API
   */
  async regenerateApiKey(id: string): Promise<ApiResponse<ApiKey>> {
    const newKey = this.generateApiKey()
    return apiClient.post<ApiKey>(`/auth/api-keys/${id}/regenerate`, { key: newKey })
  }

  /**
   * Get API key usage statistics
   * الحصول على إحصائيات استخدام مفتاح API
   */
  async getApiKeyUsage(id: string): Promise<ApiResponse<ApiKeyUsage>> {
    return apiClient.get<ApiKeyUsage>(`/auth/api-keys/${id}/usage`)
  }

  /**
   * Validate API key
   * التحقق من صحة مفتاح API
   */
  async validateApiKey(key: string): Promise<ApiResponse<{ valid: boolean; apiKey?: ApiKey }>> {
    return apiClient.post<{ valid: boolean; apiKey?: ApiKey }>('/auth/api-keys/validate', { key })
  }

  /**
   * Check if API key has permission
   * التحقق من صلاحية مفتاح API
   */
  hasPermission(apiKey: ApiKey, permission: ApiPermission): boolean {
    // Admin permission grants all access
    if (apiKey.permissions.includes('admin:all')) return true
    
    return apiKey.permissions.includes(permission)
  }

  /**
   * Check if API key is valid
   * التحقق من صلاحية مفتاح API
   */
  isValid(apiKey: ApiKey): boolean {
    // Check if active
    if (!apiKey.isActive) return false
    
    // Check if expired
    if (apiKey.expiresAt) {
      const expiryDate = new Date(apiKey.expiresAt)
      if (expiryDate < new Date()) return false
    }
    
    return true
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Generate secure API key
   * إنشاء مفتاح API آمن
   */
  private generateApiKey(): string {
    // Generate a secure random key with prefix
    const prefix = 'dms' // Desktop Management System
    const key = nanoid(32)
    return `${prefix}_${key}`
  }
}

// ============================================================================
// Default API Key Service Instance
// ============================================================================

export const apiKeyService = new ApiKeyService()

// ============================================================================
// API Key Middleware (for use in API routes)
// ============================================================================

export interface ApiKeyValidationResult {
  valid: boolean
  apiKey?: ApiKey
  error?: string
}

/**
 * Validate API key from request headers
 * التحقق من مفتاح API من رؤوس الطلب
 */
export async function validateApiKeyFromHeaders(
  headers: Headers
): Promise<ApiKeyValidationResult> {
  const apiKey = headers.get('X-API-Key')
  
  if (!apiKey) {
    return {
      valid: false,
      error: 'API key is required',
    }
  }

  try {
    const response = await apiKeyService.validateApiKey(apiKey)
    
    if (response.success && response.data?.valid && response.data.apiKey) {
      const key = response.data.apiKey
      
      // Check if key is still valid
      if (!apiKeyService.isValid(key)) {
        return {
          valid: false,
          error: 'API key is expired or inactive',
        }
      }
      
      return {
        valid: true,
        apiKey: key,
      }
    }
    
    return {
      valid: false,
      error: 'Invalid API key',
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate API key',
    }
  }
}

/**
 * Check if API key has required permission
 * التحقق من صلاحية مفتاح API المطلوبة
 */
export function checkApiKeyPermission(
  apiKey: ApiKey,
  requiredPermission: ApiPermission
): boolean {
  return apiKeyService.hasPermission(apiKey, requiredPermission)
}

/**
 * Check if API key has any of the required permissions
 * التحقق من وجود أي من الصلاحيات المطلوبة
 */
export function checkApiKeyAnyPermission(
  apiKey: ApiKey,
  requiredPermissions: ApiPermission[]
): boolean {
  return requiredPermissions.some(permission => 
    apiKeyService.hasPermission(apiKey, permission)
  )
}

/**
 * Check if API key has all required permissions
 * التحقق من وجود جميع الصلاحيات المطلوبة
 */
export function checkApiKeyAllPermissions(
  apiKey: ApiKey,
  requiredPermissions: ApiPermission[]
): boolean {
  return requiredPermissions.every(permission => 
    apiKeyService.hasPermission(apiKey, permission)
  )
}

