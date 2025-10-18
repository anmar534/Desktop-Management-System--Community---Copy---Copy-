/**
 * خدمة مراقبة الأخطاء والاسترداد التلقائي
 * Error Monitoring and Automatic Recovery Service
 *
 * مراقبة الأخطاء وتطبيق آليات الاسترداد التلقائي
 * Monitor errors and apply automatic recovery mechanisms
 */

import { asyncStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/storageKeys'

// واجهات مراقبة الأخطاء والاسترداد
export interface ErrorEvent {
  id: string
  timestamp: string
  type: 'runtime' | 'network' | 'storage' | 'ui' | 'business'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  stack?: string
  component: string
  userAgent: string
  url: string
  userId?: string
  sessionId: string
  context?: Record<string, any>
  resolved: boolean
  recoveryAttempts: number
  lastRecoveryAttempt?: string
  resolution?: string
}

export interface RecoveryStrategy {
  id: string
  name: string
  nameEn: string
  description: string
  errorTypes: string[]
  severity: ('low' | 'medium' | 'high' | 'critical')[]
  enabled: boolean
  priority: number
  maxAttempts: number
  cooldownPeriod: number // بالميلي ثانية
  implementation: (error: ErrorEvent) => Promise<boolean>
  validation: (error: ErrorEvent) => Promise<boolean>
}

export interface RecoveryAttempt {
  id: string
  errorId: string
  strategyId: string
  timestamp: string
  success: boolean
  duration: number
  details?: Record<string, any>
  nextAttemptAt?: string
}

export interface ErrorSummary {
  total: number
  resolved: number
  pending: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  recentErrors: ErrorEvent[]
  recoveryRate: number
  avgRecoveryTime: number
}

export interface SystemStability {
  uptime: number // بالميلي ثانية
  errorRate: number // أخطاء في الدقيقة
  recoverySuccessRate: number // نسبة مئوية
  criticalErrors: number
  lastCrash?: string
  stability: 'excellent' | 'good' | 'unstable' | 'critical'
}

class ErrorRecoveryService {
  private errors: ErrorEvent[] = []
  private recoveryAttempts: RecoveryAttempt[] = []
  private strategies: RecoveryStrategy[] = []
  private isMonitoring = false
  private startTime = Date.now()
  private errorHandler: ((event: ErrorEvent) => void) | null = null
  private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null

  /**
   * تهيئة خدمة مراقبة الأخطاء
   */
  async initialize(): Promise<void> {
    try {
      // تحميل البيانات المحفوظة
      await this.loadData()

      // تهيئة استراتيجيات الاسترداد
      await this.initializeRecoveryStrategies()

      // بدء المراقبة
      this.startErrorMonitoring()

      console.log('Error Recovery Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Error Recovery Service:', error)
      throw error
    }
  }

  /**
   * تحميل البيانات المحفوظة
   */
  private async loadData(): Promise<void> {
    try {
      const [errorsData, attemptsData] = await Promise.all([
        asyncStorage.getItem(STORAGE_KEYS.ERROR_LOGS),
        asyncStorage.getItem(STORAGE_KEYS.RECOVERY_ATTEMPTS),
      ])

      this.errors = errorsData || []
      this.recoveryAttempts = attemptsData || []
    } catch (error) {
      console.error('Failed to load error recovery data:', error)
    }
  }

  /**
   * حفظ البيانات
   */
  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        asyncStorage.setItem(STORAGE_KEYS.ERROR_LOGS, this.errors),
        asyncStorage.setItem(STORAGE_KEYS.RECOVERY_ATTEMPTS, this.recoveryAttempts),
      ])
    } catch (error) {
      console.error('Failed to save error recovery data:', error)
    }
  }

  /**
   * تهيئة استراتيجيات الاسترداد
   */
  private async initializeRecoveryStrategies(): Promise<void> {
    this.strategies = [
      {
        id: 'network-retry',
        name: 'إعادة محاولة الشبكة',
        nameEn: 'Network Retry',
        description: 'إعادة محاولة طلبات الشبكة الفاشلة',
        errorTypes: ['network'],
        severity: ['medium', 'high'],
        enabled: true,
        priority: 1,
        maxAttempts: 3,
        cooldownPeriod: 5000,
        implementation: this.retryNetworkRequest.bind(this),
        validation: this.validateNetworkRecovery.bind(this),
      },
      {
        id: 'storage-fallback',
        name: 'بديل التخزين',
        nameEn: 'Storage Fallback',
        description: 'استخدام تخزين بديل عند فشل التخزين الأساسي',
        errorTypes: ['storage'],
        severity: ['medium', 'high', 'critical'],
        enabled: true,
        priority: 2,
        maxAttempts: 2,
        cooldownPeriod: 1000,
        implementation: this.fallbackStorage.bind(this),
        validation: this.validateStorageRecovery.bind(this),
      },
      {
        id: 'ui-refresh',
        name: 'تحديث الواجهة',
        nameEn: 'UI Refresh',
        description: 'تحديث مكونات الواجهة المعطلة',
        errorTypes: ['ui'],
        severity: ['low', 'medium'],
        enabled: true,
        priority: 3,
        maxAttempts: 2,
        cooldownPeriod: 2000,
        implementation: this.refreshUIComponent.bind(this),
        validation: this.validateUIRecovery.bind(this),
      },
      {
        id: 'data-recovery',
        name: 'استرداد البيانات',
        nameEn: 'Data Recovery',
        description: 'استرداد البيانات من النسخ الاحتياطية',
        errorTypes: ['business', 'storage'],
        severity: ['high', 'critical'],
        enabled: true,
        priority: 4,
        maxAttempts: 1,
        cooldownPeriod: 10000,
        implementation: this.recoverData.bind(this),
        validation: this.validateDataRecovery.bind(this),
      },
      {
        id: 'system-restart',
        name: 'إعادة تشغيل النظام',
        nameEn: 'System Restart',
        description: 'إعادة تشغيل أجزاء من النظام',
        errorTypes: ['runtime', 'critical'],
        severity: ['critical'],
        enabled: false, // يتطلب تفعيل يدوي
        priority: 5,
        maxAttempts: 1,
        cooldownPeriod: 60000,
        implementation: this.restartSystem.bind(this),
        validation: this.validateSystemRestart.bind(this),
      },
    ]
  }

  /**
   * بدء مراقبة الأخطاء
   */
  private startErrorMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true

    // مراقبة أخطاء JavaScript العامة
    this.errorHandler = (event) => {
      this.captureError({
        type: 'runtime',
        severity: 'high',
        message: event.message,
        stack: event.error?.stack,
        component: 'global',
        url: event.filename || window.location.href,
      })
    }
    window.addEventListener('error', this.errorHandler as unknown as EventListener)

    // مراقبة أخطاء Promise غير المعالجة
    this.rejectionHandler = (event) => {
      this.captureError({
        type: 'runtime',
        severity: 'high',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        component: 'promise',
        url: window.location.href,
      })
    }
    window.addEventListener('unhandledrejection', this.rejectionHandler as unknown as EventListener)

    console.log('Error monitoring started')
  }

  /**
   * إيقاف مراقبة الأخطاء وتنظيف الموارد
   */
  public shutdown(): void {
    if (!this.isMonitoring) return

    // إزالة event listeners
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler as unknown as EventListener)
      this.errorHandler = null
    }

    if (this.rejectionHandler) {
      window.removeEventListener(
        'unhandledrejection',
        this.rejectionHandler as unknown as EventListener,
      )
      this.rejectionHandler = null
    }

    this.isMonitoring = false
    console.log('Error monitoring stopped')
  }

  /**
   * التقاط خطأ جديد
   */
  async captureError(errorData: {
    type: ErrorEvent['type']
    severity: ErrorEvent['severity']
    message: string
    stack?: string
    component: string
    url?: string
    context?: Record<string, any>
  }): Promise<string> {
    const error: ErrorEvent = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: errorData.type,
      severity: errorData.severity,
      message: errorData.message,
      stack: errorData.stack,
      component: errorData.component,
      userAgent: navigator.userAgent,
      url: errorData.url || window.location.href,
      sessionId: this.getSessionId(),
      context: errorData.context,
      resolved: false,
      recoveryAttempts: 0,
    }

    this.errors.push(error)

    // الاحتفاظ بآخر 1000 خطأ فقط
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000)
    }

    await this.saveData()

    // محاولة الاسترداد التلقائي
    if (error.severity !== 'low') {
      await this.attemptRecovery(error)
    }

    console.error('Error captured:', error)
    return error.id
  }

  /**
   * محاولة الاسترداد التلقائي
   */
  private async attemptRecovery(error: ErrorEvent): Promise<void> {
    // العثور على الاستراتيجيات المناسبة
    const applicableStrategies = this.strategies
      .filter(
        (strategy) =>
          strategy.enabled &&
          strategy.errorTypes.includes(error.type) &&
          strategy.severity.includes(error.severity) &&
          error.recoveryAttempts < strategy.maxAttempts,
      )
      .sort((a, b) => a.priority - b.priority)

    for (const strategy of applicableStrategies) {
      // التحقق من فترة التهدئة
      const lastAttempt = this.recoveryAttempts
        .filter((attempt) => attempt.errorId === error.id && attempt.strategyId === strategy.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

      if (lastAttempt) {
        const timeSinceLastAttempt = Date.now() - new Date(lastAttempt.timestamp).getTime()
        if (timeSinceLastAttempt < strategy.cooldownPeriod) {
          continue // تخطي هذه الاستراتيجية
        }
      }

      const attempt: RecoveryAttempt = {
        id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        errorId: error.id,
        strategyId: strategy.id,
        timestamp: new Date().toISOString(),
        success: false,
        duration: 0,
      }

      const startTime = performance.now()

      try {
        const success = await strategy.implementation(error)
        attempt.success = success
        attempt.duration = performance.now() - startTime

        if (success) {
          error.resolved = true
          error.resolution = `Recovered using strategy: ${strategy.name}`
          console.log(`Error ${error.id} recovered using strategy: ${strategy.name}`)
          break
        }
      } catch (recoveryError) {
        attempt.success = false
        attempt.duration = performance.now() - startTime
        attempt.details = { error: recoveryError.message }
        console.error(`Recovery strategy ${strategy.name} failed:`, recoveryError)
      }

      error.recoveryAttempts++
      error.lastRecoveryAttempt = attempt.timestamp
      this.recoveryAttempts.push(attempt)
    }

    await this.saveData()
  }

  /**
   * الحصول على معرف الجلسة
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('error_session_id', sessionId)
    }
    return sessionId
  }

  // استراتيجيات الاسترداد
  private async retryNetworkRequest(error: ErrorEvent): Promise<boolean> {
    // محاولة إعادة طلب الشبكة
    console.log('Retrying network request for error:', error.id)
    return true // مؤقت
  }

  private async fallbackStorage(error: ErrorEvent): Promise<boolean> {
    // استخدام تخزين بديل
    console.log('Using fallback storage for error:', error.id)
    return true // مؤقت
  }

  private async refreshUIComponent(error: ErrorEvent): Promise<boolean> {
    // تحديث مكون الواجهة
    console.log('Refreshing UI component for error:', error.id)
    return true // مؤقت
  }

  private async recoverData(error: ErrorEvent): Promise<boolean> {
    // استرداد البيانات
    console.log('Recovering data for error:', error.id)
    return true // مؤقت
  }

  private async restartSystem(error: ErrorEvent): Promise<boolean> {
    // إعادة تشغيل النظام
    console.log('Restarting system for error:', error.id)
    return false // يتطلب تدخل يدوي
  }

  // وظائف التحقق
  private async validateNetworkRecovery(error: ErrorEvent): Promise<boolean> {
    return true
  }

  private async validateStorageRecovery(error: ErrorEvent): Promise<boolean> {
    return true
  }

  private async validateUIRecovery(error: ErrorEvent): Promise<boolean> {
    return true
  }

  private async validateDataRecovery(error: ErrorEvent): Promise<boolean> {
    return true
  }

  private async validateSystemRestart(error: ErrorEvent): Promise<boolean> {
    return true
  }

  /**
   * الحصول على ملخص الأخطاء
   */
  getErrorSummary(): ErrorSummary {
    const total = this.errors.length
    const resolved = this.errors.filter((e) => e.resolved).length
    const pending = total - resolved

    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    this.errors.forEach((error) => {
      byType[error.type] = (byType[error.type] || 0) + 1
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
    })

    const recentErrors = this.errors
      .filter((e) => Date.now() - new Date(e.timestamp).getTime() < 3600000) // آخر ساعة
      .slice(-10)

    const successfulRecoveries = this.recoveryAttempts.filter((a) => a.success).length
    const totalRecoveries = this.recoveryAttempts.length
    const recoveryRate = totalRecoveries > 0 ? (successfulRecoveries / totalRecoveries) * 100 : 0

    const avgRecoveryTime =
      this.recoveryAttempts.length > 0
        ? this.recoveryAttempts.reduce((sum, a) => sum + a.duration, 0) /
          this.recoveryAttempts.length
        : 0

    return {
      total,
      resolved,
      pending,
      byType,
      bySeverity,
      recentErrors,
      recoveryRate,
      avgRecoveryTime,
    }
  }

  /**
   * الحصول على استقرار النظام
   */
  getSystemStability(): SystemStability {
    const uptime = Date.now() - this.startTime
    const recentErrors = this.errors.filter(
      (e) => Date.now() - new Date(e.timestamp).getTime() < 60000, // آخر دقيقة
    )
    const errorRate = recentErrors.length

    const criticalErrors = this.errors.filter((e) => e.severity === 'critical').length
    const lastCrash = this.errors
      .filter((e) => e.severity === 'critical')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

    const successfulRecoveries = this.recoveryAttempts.filter((a) => a.success).length
    const totalRecoveries = this.recoveryAttempts.length
    const recoverySuccessRate =
      totalRecoveries > 0 ? (successfulRecoveries / totalRecoveries) * 100 : 100

    let stability: SystemStability['stability'] = 'excellent'
    if (errorRate > 10 || criticalErrors > 5) stability = 'critical'
    else if (errorRate > 5 || criticalErrors > 2) stability = 'unstable'
    else if (errorRate > 2 || criticalErrors > 0) stability = 'good'

    return {
      uptime,
      errorRate,
      recoverySuccessRate,
      criticalErrors,
      lastCrash: lastCrash?.timestamp,
      stability,
    }
  }

  /**
   * حل خطأ يدوياً
   */
  async resolveError(errorId: string, resolution: string): Promise<boolean> {
    const error = this.errors.find((e) => e.id === errorId)
    if (!error) return false

    error.resolved = true
    error.resolution = resolution
    await this.saveData()
    return true
  }

  /**
   * الحصول على الأخطاء
   */
  getErrors(filters?: {
    type?: ErrorEvent['type']
    severity?: ErrorEvent['severity']
    resolved?: boolean
    limit?: number
  }): ErrorEvent[] {
    let filteredErrors = this.errors

    if (filters?.type) {
      filteredErrors = filteredErrors.filter((e) => e.type === filters.type)
    }
    if (filters?.severity) {
      filteredErrors = filteredErrors.filter((e) => e.severity === filters.severity)
    }
    if (filters?.resolved !== undefined) {
      filteredErrors = filteredErrors.filter((e) => e.resolved === filters.resolved)
    }

    // ترتيب حسب الوقت (الأحدث أولاً)
    filteredErrors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    if (filters?.limit) {
      filteredErrors = filteredErrors.slice(0, filters.limit)
    }

    return filteredErrors
  }

  /**
   * الحصول على محاولات الاسترداد
   */
  getRecoveryAttempts(errorId?: string): RecoveryAttempt[] {
    let attempts = this.recoveryAttempts

    if (errorId) {
      attempts = attempts.filter((a) => a.errorId === errorId)
    }

    return attempts.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }

  /**
   * تفعيل/تعطيل استراتيجية استرداد
   */
  toggleRecoveryStrategy(strategyId: string, enabled: boolean): boolean {
    const strategy = this.strategies.find((s) => s.id === strategyId)
    if (!strategy) return false

    strategy.enabled = enabled
    return true
  }

  /**
   * الحصول على استراتيجيات الاسترداد
   */
  getRecoveryStrategies(): RecoveryStrategy[] {
    return this.strategies
  }
}

export const errorRecoveryService = new ErrorRecoveryService()
