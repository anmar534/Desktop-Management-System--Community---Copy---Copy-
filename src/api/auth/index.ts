/**
 * Authentication Module - Main Export
 * Sprint 5.3.2: تطوير نظام مصادقة وتفويض
 */

// Export auth service
export { AuthService, authService, ROLE_PERMISSIONS } from './authService'
export type {
  User,
  UserRole,
  LoginResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest,
} from './authService'

// Export API key service
export { ApiKeyService, apiKeyService, validateApiKeyFromHeaders, checkApiKeyPermission, checkApiKeyAnyPermission, checkApiKeyAllPermissions } from './apiKeyService'
export type {
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ApiKeyUsage,
  ApiKeyValidationResult,
} from './apiKeyService'

// Export rate limiter
export { RateLimiter, rateLimiter, generateRateLimitKey, checkUserRateLimit, checkApiKeyRateLimit, checkIpRateLimit, getRateLimitHeaders, createRateLimitError } from './rateLimiter'

