/**
 * Core Authentication Service Tests
 * اختبارات خدمة المصادقة الأساسية
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../../src/api/auth/authService'
import type { User, LoginResponse } from '../../src/api/auth/authService'
import type { AuthToken, AuthCredentials } from '../../src/api/types'

// Mock API client
vi.mock('../../src/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}))

// Mock Electron API
const mockElectronAPI = {
  secureStore: {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}

global.window = {
  electronAPI: mockElectronAPI,
} as any

describe('AuthService - خدمة المصادقة', () => {
  let authService: AuthService
  let apiClient: any

  const mockUser: User = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    fullNameAr: 'مستخدم تجريبي',
    role: 'admin',
    permissions: ['admin:all'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  }

  const mockToken: AuthToken = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    expiresIn: 3600,
    tokenType: 'Bearer',
  }

  const mockLoginResponse: LoginResponse = {
    user: mockUser,
    token: mockToken,
  }

  beforeEach(async () => {
    const client = await import('../../src/api/client')
    apiClient = client.apiClient
    authService = new AuthService()
    vi.clearAllMocks()
  })

  describe('login - تسجيل الدخول', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials: AuthCredentials = {
        username: 'testuser',
        password: 'password123',
      }

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      })

      const result = await authService.login(credentials)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockLoginResponse)
      expect(authService.getCurrentUser()).toEqual(mockUser)
      expect(authService.getCurrentToken()).toEqual(mockToken)
      expect(authService.isAuthenticated()).toBe(true)
      expect(apiClient.setToken).toHaveBeenCalledWith(mockToken.accessToken)
    })

    it('should handle login failure', async () => {
      const credentials: AuthCredentials = {
        username: 'testuser',
        password: 'wrongpassword',
      }

      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          messageAr: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        },
      })

      const result = await authService.login(credentials)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVALID_CREDENTIALS')
      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('logout - تسجيل الخروج', () => {
    it('should logout successfully', async () => {
      // Setup authenticated state
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      })
      await authService.login({ username: 'test', password: 'test' })

      // Logout
      vi.mocked(apiClient.post).mockResolvedValue({ success: true })
      await authService.logout()

      expect(authService.getCurrentUser()).toBeNull()
      expect(authService.getCurrentToken()).toBeNull()
      expect(authService.isAuthenticated()).toBe(false)
      expect(apiClient.clearToken).toHaveBeenCalled()
    })


  })

  describe('permissions - الصلاحيات', () => {
    beforeEach(async () => {
      const client = await import('../../src/api/client')
      apiClient = client.apiClient
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      })
      await authService.login({ username: 'test', password: 'test' })
    })

    it('should check permission correctly for admin', () => {
      expect(authService.hasPermission('admin:all')).toBe(true)
      expect(authService.hasPermission('tender:create')).toBe(true)
      expect(authService.hasPermission('project:delete')).toBe(true)
    })

    it('should check any permission correctly', () => {
      expect(authService.hasAnyPermission(['tender:create', 'project:create'])).toBe(true)
    })

    it('should check all permissions correctly', () => {
      expect(authService.hasAllPermissions(['admin:all'])).toBe(true)
    })

    it('should return false for unauthenticated user', async () => {
      await authService.logout()
      expect(authService.hasPermission('admin:all')).toBe(false)
    })
  })

  describe('refreshToken - تحديث الرمز', () => {
    it('should refresh token successfully', async () => {
      const newToken: AuthToken = {
        ...mockToken,
        accessToken: 'new-access-token',
      }

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: newToken,
      })

      const result = await authService.refreshToken('refresh-token-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(newToken)
      expect(authService.getCurrentToken()).toEqual(newToken)
      expect(apiClient.setToken).toHaveBeenCalledWith(newToken.accessToken)
    })
  })

  describe('getProfile - الحصول على الملف الشخصي', () => {
    it('should get user profile successfully', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockUser,
      })

      const result = await authService.getProfile()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(authService.getCurrentUser()).toEqual(mockUser)
    })
  })

  describe('updateProfile - تحديث الملف الشخصي', () => {
    it('should update user profile successfully', async () => {
      const updatedUser = {
        ...mockUser,
        fullName: 'Updated Name',
      }

      vi.mocked(apiClient.put).mockResolvedValue({
        success: true,
        data: updatedUser,
      })

      const result = await authService.updateProfile({ fullName: 'Updated Name' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedUser)
      expect(authService.getCurrentUser()).toEqual(updatedUser)
    })
  })

  describe('restoreSession - استعادة الجلسة', () => {
    it('should restore session from storage', async () => {
      vi.mocked(mockElectronAPI.secureStore.get)
        .mockResolvedValueOnce(JSON.stringify(mockUser))
        .mockResolvedValueOnce(JSON.stringify(mockToken))

      const restored = await authService.restoreSession()

      expect(restored).toBe(true)
      expect(authService.getCurrentUser()).toEqual(mockUser)
      expect(authService.getCurrentToken()).toEqual(mockToken)
      expect(authService.isAuthenticated()).toBe(true)
    })

    it('should return false if no session data', async () => {
      vi.mocked(mockElectronAPI.secureStore.get).mockResolvedValue(null)

      const restored = await authService.restoreSession()

      expect(restored).toBe(false)
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('should handle restore errors gracefully', async () => {
      vi.mocked(mockElectronAPI.secureStore.get).mockRejectedValue(new Error('Storage error'))

      const restored = await authService.restoreSession()

      expect(restored).toBe(false)
    })
  })

  describe('changePassword - تغيير كلمة المرور', () => {
    it('should change password successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
      })

      const result = await authService.changePassword({
        currentPassword: 'old123',
        newPassword: 'new123',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('password reset - إعادة تعيين كلمة المرور', () => {
    it('should request password reset successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
      })

      const result = await authService.requestPasswordReset('test@example.com')

      expect(result.success).toBe(true)
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        email: 'test@example.com',
      })
    })

    it('should confirm password reset successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
      })

      const result = await authService.confirmPasswordReset({
        token: 'reset-token',
        newPassword: 'newpass123',
      })

      expect(result.success).toBe(true)
    })
  })
})

