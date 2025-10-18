/**
 * API Client
 * Sprint 5.3: تطوير APIs للتكامل الخارجي
 */

import type { ApiResponse, ApiRequest, ApiError, AuthToken, RateLimitInfo } from './types'
import { API_CONFIG, API_ERROR_CODES } from './config'

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private rateLimitInfo: RateLimitInfo | null = null

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || API_CONFIG.basePath
  }

  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  setToken(token: string): void {
    this.token = token
  }

  clearToken(): void {
    this.token = null
  }

  getToken(): string | null {
    return this.token
  }

  // ==========================================================================
  // Rate Limit Methods
  // ==========================================================================

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo
  }

  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit')
    const remaining = headers.get('X-RateLimit-Remaining')
    const reset = headers.get('X-RateLimit-Reset')

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      }
    }
  }

  // ==========================================================================
  // HTTP Methods
  // ==========================================================================

  async get<T>(path: string, options?: Partial<ApiRequest>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, options)
  }

  async post<T>(
    path: string,
    data?: unknown,
    options?: Partial<ApiRequest>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, { ...options, body: data })
  }

  async put<T>(
    path: string,
    data?: unknown,
    options?: Partial<ApiRequest>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, { ...options, body: data })
  }

  async patch<T>(
    path: string,
    data?: unknown,
    options?: Partial<ApiRequest>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, { ...options, body: data })
  }

  async delete<T>(path: string, options?: Partial<ApiRequest>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, options)
  }

  // ==========================================================================
  // Core Request Method
  // ==========================================================================

  private async request<T>(
    method: string,
    path: string,
    options?: Partial<ApiRequest>,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options?.query)
    const headers = this.buildHeaders(options?.headers)

    const requestOptions: RequestInit = {
      method,
      headers,
    }

    if (options?.body && method !== 'GET') {
      requestOptions.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, requestOptions)

      // Update rate limit info from response headers
      this.updateRateLimitInfo(response.headers)

      // Handle response
      if (!response.ok) {
        return this.handleErrorResponse<T>(response)
      }

      const data = await response.json()

      return {
        success: true,
        data: data as T,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('X-Request-ID') || '',
          version: API_CONFIG.version,
          rateLimit: this.rateLimitInfo || undefined,
        },
      }
    } catch (error) {
      return this.handleNetworkError<T>(error)
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private buildUrl(path: string, query?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.baseUrl)

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    return url.toString()
  }

  private buildHeaders(customHeaders?: Record<string, string>): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': 'ar,en',
    })

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`)
    }

    if (customHeaders) {
      Object.entries(customHeaders).forEach(([key, value]) => {
        headers.set(key, value)
      })
    }

    return headers
  }

  private async handleErrorResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let error: ApiError

    try {
      const errorData = await response.json()
      error = errorData.error || this.createDefaultError(response.status)
    } catch {
      error = this.createDefaultError(response.status)
    }

    return {
      success: false,
      error,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: response.headers.get('X-Request-ID') || '',
        version: API_CONFIG.version,
        rateLimit: this.rateLimitInfo || undefined,
      },
    }
  }

  private handleNetworkError<T>(error: unknown): ApiResponse<T> {
    const apiError: ApiError = {
      code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: error instanceof Error ? error.message : 'Network error occurred',
      messageAr: 'حدث خطأ في الاتصال بالشبكة',
      timestamp: new Date().toISOString(),
    }

    return {
      success: false,
      error: apiError,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: '',
        version: API_CONFIG.version,
      },
    }
  }

  private createDefaultError(status: number): ApiError {
    const errorMessages: Record<number, { code: string; message: string; messageAr: string }> = {
      400: {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'Bad request',
        messageAr: 'طلب غير صحيح',
      },
      401: {
        code: API_ERROR_CODES.UNAUTHORIZED,
        message: 'Unauthorized',
        messageAr: 'غير مصرح',
      },
      403: {
        code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        message: 'Forbidden',
        messageAr: 'محظور',
      },
      404: {
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Resource not found',
        messageAr: 'المورد غير موجود',
      },
      429: {
        code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded',
        messageAr: 'تم تجاوز حد الطلبات',
      },
      500: {
        code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        messageAr: 'خطأ داخلي في الخادم',
      },
      503: {
        code: API_ERROR_CODES.SERVICE_UNAVAILABLE,
        message: 'Service unavailable',
        messageAr: 'الخدمة غير متاحة',
      },
    }

    const errorInfo = errorMessages[status] || errorMessages[500]

    return {
      ...errorInfo,
      timestamp: new Date().toISOString(),
    }
  }
}

// ============================================================================
// Default API Client Instance
// ============================================================================

export const apiClient = new ApiClient()

// ============================================================================
// Convenience Functions
// ============================================================================

export async function setAuthToken(token: AuthToken): Promise<void> {
  apiClient.setToken(token.accessToken)

  // Store token in secure storage if available
  if (window.electronAPI?.secureStore) {
    await window.electronAPI.secureStore.set('auth_token', JSON.stringify(token))
  }
}

export async function clearAuthToken(): Promise<void> {
  apiClient.clearToken()

  // Clear token from secure storage if available
  if (window.electronAPI?.secureStore) {
    await window.electronAPI.secureStore.delete('auth_token')
  }
}

export async function getStoredAuthToken(): Promise<AuthToken | null> {
  if (window.electronAPI?.secureStore) {
    const tokenStr = await window.electronAPI.secureStore.get('auth_token')
    if (tokenStr && typeof tokenStr === 'string') {
      return JSON.parse(tokenStr) as AuthToken
    }
  }
  return null
}
