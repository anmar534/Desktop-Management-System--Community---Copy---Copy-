/**
 * Authentication Service
 * Sprint 5.3.2: تطوير نظام مصادقة وتفويض
 */

import type { AuthCredentials, AuthToken, ApiKey, ApiPermission } from '../types'
import { apiClient } from '../client'
import type { ApiResponse } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string
  username: string
  email: string
  fullName: string
  fullNameAr?: string
  role: UserRole
  permissions: ApiPermission[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export type UserRole = 
  | 'admin'
  | 'manager'
  | 'project_manager'
  | 'financial_manager'
  | 'procurement_manager'
  | 'user'
  | 'viewer'

export interface LoginResponse {
  user: User
  token: AuthToken
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ResetPasswordRequest {
  email: string
}

export interface ResetPasswordConfirmRequest {
  token: string
  newPassword: string
}

// ============================================================================
// Role-Based Permissions
// ============================================================================

export const ROLE_PERMISSIONS: Record<UserRole, ApiPermission[]> = {
  admin: ['admin:all'],
  manager: [
    'tenders:read',
    'tenders:write',
    'tenders:delete',
    'projects:read',
    'projects:write',
    'projects:delete',
    'financial:read',
    'financial:write',
    'financial:delete',
    'procurement:read',
    'procurement:write',
    'procurement:delete',
    'reports:read',
    'reports:write',
    'analytics:read',
    'settings:read',
    'settings:write',
  ],
  project_manager: [
    'tenders:read',
    'tenders:write',
    'projects:read',
    'projects:write',
    'financial:read',
    'procurement:read',
    'procurement:write',
    'reports:read',
    'analytics:read',
  ],
  financial_manager: [
    'financial:read',
    'financial:write',
    'financial:delete',
    'reports:read',
    'reports:write',
    'analytics:read',
    'tenders:read',
    'projects:read',
  ],
  procurement_manager: [
    'procurement:read',
    'procurement:write',
    'procurement:delete',
    'financial:read',
    'projects:read',
    'reports:read',
    'analytics:read',
  ],
  user: [
    'tenders:read',
    'tenders:write',
    'projects:read',
    'projects:write',
    'financial:read',
    'procurement:read',
    'reports:read',
    'analytics:read',
  ],
  viewer: [
    'tenders:read',
    'projects:read',
    'financial:read',
    'procurement:read',
    'reports:read',
    'analytics:read',
  ],
}

// ============================================================================
// Authentication Service Class
// ============================================================================

export class AuthService {
  private currentUser: User | null = null
  private currentToken: AuthToken | null = null

  /**
   * Login with credentials
   * تسجيل الدخول باستخدام بيانات الاعتماد
   */
  async login(credentials: AuthCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    
    if (response.success && response.data) {
      this.currentUser = response.data.user
      this.currentToken = response.data.token
      apiClient.setToken(response.data.token.accessToken)
      
      // Store in secure storage
      await this.storeAuthData(response.data)
    }
    
    return response
  }

  /**
   * Logout
   * تسجيل الخروج
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      this.currentUser = null
      this.currentToken = null
      apiClient.clearToken()
      await this.clearAuthData()
    }
  }

  /**
   * Refresh access token
   * تحديث رمز الوصول
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthToken>> {
    const response = await apiClient.post<AuthToken>('/auth/refresh', { refreshToken })
    
    if (response.success && response.data) {
      this.currentToken = response.data
      apiClient.setToken(response.data.accessToken)
      await this.storeToken(response.data)
    }
    
    return response
  }

  /**
   * Get current user
   * الحصول على المستخدم الحالي
   */
  getCurrentUser(): User | null {
    return this.currentUser
  }

  /**
   * Get current token
   * الحصول على الرمز الحالي
   */
  getCurrentToken(): AuthToken | null {
    return this.currentToken
  }

  /**
   * Check if user is authenticated
   * التحقق من تسجيل الدخول
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentToken !== null
  }

  /**
   * Check if user has permission
   * التحقق من صلاحية المستخدم
   */
  hasPermission(permission: ApiPermission): boolean {
    if (!this.currentUser) return false
    
    // Admin has all permissions
    if (this.currentUser.permissions.includes('admin:all')) return true
    
    return this.currentUser.permissions.includes(permission)
  }

  /**
   * Check if user has any of the permissions
   * التحقق من وجود أي من الصلاحيات
   */
  hasAnyPermission(permissions: ApiPermission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * Check if user has all permissions
   * التحقق من وجود جميع الصلاحيات
   */
  hasAllPermissions(permissions: ApiPermission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  /**
   * Change password
   * تغيير كلمة المرور
   */
  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/change-password', request)
  }

  /**
   * Request password reset
   * طلب إعادة تعيين كلمة المرور
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password', { email })
  }

  /**
   * Confirm password reset
   * تأكيد إعادة تعيين كلمة المرور
   */
  async confirmPasswordReset(request: ResetPasswordConfirmRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password/confirm', request)
  }

  /**
   * Get user profile
   * الحصول على ملف المستخدم
   */
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<User>('/auth/profile')
    
    if (response.success && response.data) {
      this.currentUser = response.data
    }
    
    return response
  }

  /**
   * Update user profile
   * تحديث ملف المستخدم
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put<User>('/auth/profile', data)
    
    if (response.success && response.data) {
      this.currentUser = response.data
    }
    
    return response
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  private async storeAuthData(data: LoginResponse): Promise<void> {
    if (window.electronAPI?.secureStore) {
      await window.electronAPI.secureStore.set('auth_user', JSON.stringify(data.user))
      await window.electronAPI.secureStore.set('auth_token', JSON.stringify(data.token))
    }
  }

  private async storeToken(token: AuthToken): Promise<void> {
    if (window.electronAPI?.secureStore) {
      await window.electronAPI.secureStore.set('auth_token', JSON.stringify(token))
    }
  }

  private async clearAuthData(): Promise<void> {
    if (window.electronAPI?.secureStore) {
      await window.electronAPI.secureStore.delete('auth_user')
      await window.electronAPI.secureStore.delete('auth_token')
    }
  }

  /**
   * Restore session from storage
   * استعادة الجلسة من التخزين
   */
  async restoreSession(): Promise<boolean> {
    if (!window.electronAPI?.secureStore) return false

    try {
      const userStr = await window.electronAPI.secureStore.get('auth_user')
      const tokenStr = await window.electronAPI.secureStore.get('auth_token')

      if (userStr && tokenStr) {
        this.currentUser = JSON.parse(userStr) as User
        this.currentToken = JSON.parse(tokenStr) as AuthToken
        apiClient.setToken(this.currentToken.accessToken)
        return true
      }
    } catch (error) {
      console.error('Failed to restore session:', error)
    }

    return false
  }
}

// ============================================================================
// Default Auth Service Instance
// ============================================================================

export const authService = new AuthService()

