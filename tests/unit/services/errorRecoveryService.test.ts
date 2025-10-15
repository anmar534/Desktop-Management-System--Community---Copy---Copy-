/**
 * اختبارات خدمة مراقبة الأخطاء والاسترداد
 * Error Recovery Service Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock storage
vi.mock('../../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

import {
  errorRecoveryService,
  ErrorEvent,
  RecoveryStrategy,
  ErrorSummary,
  SystemStability
} from '../../../src/services/errorRecoveryService'

// Mock session storage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Test User Agent'
  },
  writable: true
})

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test'
  },
  writable: true
})

describe('ErrorRecoveryService', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mocked storage
    const { asyncStorage } = await import('../../../src/utils/storage')
    vi.mocked(asyncStorage.getItem).mockResolvedValue(null)
    vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)

    // Mock session storage
    vi.mocked(window.sessionStorage.getItem).mockReturnValue(null)
    vi.mocked(window.sessionStorage.setItem).mockReturnValue(undefined)
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(errorRecoveryService.initialize()).resolves.not.toThrow()
    })

    it('should load existing data during initialization', async () => {
      const mockErrors: ErrorEvent[] = [
        {
          id: 'test-error',
          timestamp: new Date().toISOString(),
          type: 'runtime',
          severity: 'medium',
          message: 'Test error',
          component: 'test-component',
          userAgent: 'Test Agent',
          url: 'http://test.com',
          sessionId: 'test-session',
          resolved: false,
          recoveryAttempts: 0
        }
      ]

      const { asyncStorage } = await import('../../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockImplementation((key) => {
        if (key === 'app_error_logs') return Promise.resolve(mockErrors)
        return Promise.resolve(null)
      })

      await errorRecoveryService.initialize()

      expect(asyncStorage.getItem).toHaveBeenCalledWith('app_error_logs')
      expect(asyncStorage.getItem).toHaveBeenCalledWith('app_recovery_attempts')
    })
  })

  describe('Error Capture', () => {
    beforeEach(async () => {
      await errorRecoveryService.initialize()
    })

    it('should capture runtime errors', async () => {
      const errorId = await errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'high',
        message: 'Test runtime error',
        component: 'test-component'
      })

      expect(typeof errorId).toBe('string')
      expect(errorId).toMatch(/^error_/)

      const { asyncStorage } = await import('../../../src/utils/storage')
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('should capture network errors', async () => {
      const errorId = await errorRecoveryService.captureError({
        type: 'network',
        severity: 'medium',
        message: 'Network request failed',
        component: 'api-client',
        context: { url: '/api/test', status: 500 }
      })

      expect(typeof errorId).toBe('string')

      const { asyncStorage } = await import('../../../src/utils/storage')
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('should capture UI errors', async () => {
      const errorId = await errorRecoveryService.captureError({
        type: 'ui',
        severity: 'low',
        message: 'Component render failed',
        component: 'TestComponent',
        stack: 'Error stack trace'
      })

      expect(typeof errorId).toBe('string')

      const { asyncStorage } = await import('../../../src/utils/storage')
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('should capture business logic errors', async () => {
      const errorId = await errorRecoveryService.captureError({
        type: 'business',
        severity: 'critical',
        message: 'Data validation failed',
        component: 'validation-service',
        context: { field: 'email', value: 'invalid-email' }
      })

      expect(typeof errorId).toBe('string')

      const { asyncStorage } = await import('../../../src/utils/storage')
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('should generate unique error IDs', async () => {
      const errorId1 = await errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'medium',
        message: 'Error 1',
        component: 'component-1'
      })

      const errorId2 = await errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'medium',
        message: 'Error 2',
        component: 'component-2'
      })

      expect(errorId1).not.toBe(errorId2)
    })
  })

  describe('Error Retrieval', () => {
    beforeEach(async () => {
      await errorRecoveryService.initialize()
      
      // Add some test errors
      await errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'high',
        message: 'Runtime error',
        component: 'test-component'
      })
      
      await errorRecoveryService.captureError({
        type: 'network',
        severity: 'medium',
        message: 'Network error',
        component: 'api-client'
      })
    })

    it('should get all errors', () => {
      const errors = errorRecoveryService.getErrors()
      expect(Array.isArray(errors)).toBe(true)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should filter errors by type', () => {
      const runtimeErrors = errorRecoveryService.getErrors({ type: 'runtime' })
      expect(runtimeErrors.every(e => e.type === 'runtime')).toBe(true)
    })

    it('should filter errors by severity', () => {
      const highSeverityErrors = errorRecoveryService.getErrors({ severity: 'high' })
      expect(highSeverityErrors.every(e => e.severity === 'high')).toBe(true)
    })

    it('should filter errors by resolution status', () => {
      const unresolvedErrors = errorRecoveryService.getErrors({ resolved: false })
      expect(unresolvedErrors.every(e => !e.resolved)).toBe(true)
    })

    it('should limit number of errors returned', () => {
      const limitedErrors = errorRecoveryService.getErrors({ limit: 1 })
      expect(limitedErrors.length).toBe(1)
    })
  })

  describe('Error Resolution', () => {
    let errorId: string

    beforeEach(async () => {
      await errorRecoveryService.initialize()
      errorId = await errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'medium',
        message: 'Test error for resolution',
        component: 'test-component'
      })
    })

    it('should resolve errors manually', async () => {
      const resolved = await errorRecoveryService.resolveError(errorId, 'Fixed by manual intervention')
      expect(resolved).toBe(true)
      
      const errors = errorRecoveryService.getErrors({ resolved: true })
      const resolvedError = errors.find(e => e.id === errorId)
      expect(resolvedError?.resolved).toBe(true)
      expect(resolvedError?.resolution).toBe('Fixed by manual intervention')
    })

    it('should return false for non-existent error IDs', async () => {
      const resolved = await errorRecoveryService.resolveError('non-existent-id', 'Test resolution')
      expect(resolved).toBe(false)
    })
  })

  describe('Error Summary', () => {
    beforeEach(async () => {
      await errorRecoveryService.initialize()
      
      // Add various types of errors
      await errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'high',
        message: 'Runtime error 1',
        component: 'component-1'
      })
      
      await errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'medium',
        message: 'Runtime error 2',
        component: 'component-2'
      })
      
      await errorRecoveryService.captureError({
        type: 'network',
        severity: 'low',
        message: 'Network error',
        component: 'api-client'
      })
    })

    it('should generate error summary', () => {
      const summary = errorRecoveryService.getErrorSummary()
      
      expect(summary).toHaveProperty('total')
      expect(summary).toHaveProperty('resolved')
      expect(summary).toHaveProperty('pending')
      expect(summary).toHaveProperty('byType')
      expect(summary).toHaveProperty('bySeverity')
      expect(summary).toHaveProperty('recentErrors')
      expect(summary).toHaveProperty('recoveryRate')
      expect(summary).toHaveProperty('avgRecoveryTime')
      
      expect(typeof summary.total).toBe('number')
      expect(typeof summary.resolved).toBe('number')
      expect(typeof summary.pending).toBe('number')
      expect(Array.isArray(summary.recentErrors)).toBe(true)
    })

    it('should count errors by type correctly', () => {
      const summary = errorRecoveryService.getErrorSummary()
      
      expect(summary.byType.runtime).toBe(2)
      expect(summary.byType.network).toBe(1)
    })

    it('should count errors by severity correctly', () => {
      const summary = errorRecoveryService.getErrorSummary()
      
      expect(summary.bySeverity.high).toBe(1)
      expect(summary.bySeverity.medium).toBe(1)
      expect(summary.bySeverity.low).toBe(1)
    })
  })

  describe('System Stability', () => {
    beforeEach(async () => {
      await errorRecoveryService.initialize()
    })

    it('should calculate system stability', () => {
      const stability = errorRecoveryService.getSystemStability()
      
      expect(stability).toHaveProperty('uptime')
      expect(stability).toHaveProperty('errorRate')
      expect(stability).toHaveProperty('recoverySuccessRate')
      expect(stability).toHaveProperty('criticalErrors')
      expect(stability).toHaveProperty('stability')
      
      expect(typeof stability.uptime).toBe('number')
      expect(typeof stability.errorRate).toBe('number')
      expect(typeof stability.recoverySuccessRate).toBe('number')
      expect(typeof stability.criticalErrors).toBe('number')
      expect(['excellent', 'good', 'unstable', 'critical']).toContain(stability.stability)
    })

    it('should detect critical system state', async () => {
      // Add multiple critical errors
      for (let i = 0; i < 6; i++) {
        await errorRecoveryService.captureError({
          type: 'runtime',
          severity: 'critical',
          message: `Critical error ${i}`,
          component: 'system'
        })
      }
      
      const stability = errorRecoveryService.getSystemStability()
      expect(stability.stability).toBe('critical')
    })
  })

  describe('Recovery Strategies', () => {
    beforeEach(async () => {
      await errorRecoveryService.initialize()
    })

    it('should get recovery strategies', () => {
      const strategies = errorRecoveryService.getRecoveryStrategies()
      
      expect(Array.isArray(strategies)).toBe(true)
      expect(strategies.length).toBeGreaterThan(0)
      
      strategies.forEach(strategy => {
        expect(strategy).toHaveProperty('id')
        expect(strategy).toHaveProperty('name')
        expect(strategy).toHaveProperty('nameEn')
        expect(strategy).toHaveProperty('description')
        expect(strategy).toHaveProperty('errorTypes')
        expect(strategy).toHaveProperty('severity')
        expect(strategy).toHaveProperty('enabled')
        expect(strategy).toHaveProperty('priority')
      })
    })

    it('should toggle recovery strategies', () => {
      const strategies = errorRecoveryService.getRecoveryStrategies()
      const strategy = strategies[0]
      const originalState = strategy.enabled
      
      const toggled = errorRecoveryService.toggleRecoveryStrategy(strategy.id, !originalState)
      expect(toggled).toBe(true)
      
      const updatedStrategies = errorRecoveryService.getRecoveryStrategies()
      const updatedStrategy = updatedStrategies.find(s => s.id === strategy.id)
      expect(updatedStrategy?.enabled).toBe(!originalState)
    })

    it('should return false for non-existent strategy IDs', () => {
      const toggled = errorRecoveryService.toggleRecoveryStrategy('non-existent-id', true)
      expect(toggled).toBe(false)
    })
  })

  describe('Recovery Attempts', () => {
    beforeEach(async () => {
      await errorRecoveryService.initialize()
    })

    it('should get recovery attempts', () => {
      const attempts = errorRecoveryService.getRecoveryAttempts()
      expect(Array.isArray(attempts)).toBe(true)
    })

    it('should filter recovery attempts by error ID', async () => {
      const errorId = await errorRecoveryService.captureError({
        type: 'network',
        severity: 'medium',
        message: 'Network error for recovery test',
        component: 'api-client'
      })
      
      const attempts = errorRecoveryService.getRecoveryAttempts(errorId)
      expect(Array.isArray(attempts)).toBe(true)
      // Note: Actual recovery attempts would be created by the automatic recovery system
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully during initialization', async () => {
      const { asyncStorage } = await import('../../../src/utils/storage')
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      await expect(errorRecoveryService.initialize()).resolves.not.toThrow()
    })

    it('should handle save errors gracefully', async () => {
      const { asyncStorage } = await import('../../../src/utils/storage')
      vi.mocked(asyncStorage.setItem).mockRejectedValue(new Error('Save error'))

      await errorRecoveryService.initialize()

      await expect(errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'medium',
        message: 'Test error',
        component: 'test'
      })).resolves.toBeDefined()
    })
  })

  describe('Session Management', () => {
    beforeEach(async () => {
      await errorRecoveryService.initialize()
    })

    it('should generate session ID when not present', async () => {
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(null)

      await errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'medium',
        message: 'Test error',
        component: 'test'
      })

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'error_session_id',
        expect.stringMatching(/^session_/)
      )
    })

    it('should use existing session ID when present', async () => {
      const existingSessionId = 'existing-session-id'
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(existingSessionId)

      await errorRecoveryService.captureError({
        type: 'runtime',
        severity: 'medium',
        message: 'Test error',
        component: 'test'
      })

      const errors = errorRecoveryService.getErrors({ limit: 1 })
      expect(errors[0].sessionId).toBe(existingSessionId)
    })
  })
})
