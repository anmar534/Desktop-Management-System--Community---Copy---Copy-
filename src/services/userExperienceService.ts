/**
 * User Experience Service
 * خدمة تحسين تجربة المستخدم
 */

import { asyncStorage } from '../utils/storage'

export interface UserPreferences {
  id: string
  userId: string
  theme: 'light' | 'dark' | 'auto'
  language: 'ar' | 'en'
  dateFormat: 'hijri' | 'gregorian'
  currency: 'SAR' | 'USD' | 'EUR'
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
    sound: boolean
  }
  dashboard: {
    defaultView: string
    widgetLayout: string[]
    refreshInterval: number
  }
  accessibility: {
    highContrast: boolean
    largeText: boolean
    reducedMotion: boolean
    screenReader: boolean
  }
  shortcuts: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface UserSession {
  id: string
  userId: string
  startTime: string
  endTime?: string
  duration?: number
  pageViews: number
  actions: UserAction[]
  device: {
    type: 'desktop' | 'tablet' | 'mobile'
    os: string
    browser: string
    screenResolution: string
  }
  performance: {
    loadTime: number
    interactionTime: number
    errorCount: number
  }
}

export interface UserAction {
  id: string
  type: 'click' | 'navigation' | 'form_submit' | 'search' | 'export' | 'error'
  target: string
  timestamp: string
  duration?: number
  success: boolean
  metadata?: Record<string, any>
}

export interface AccessibilityReport {
  score: number
  issues: {
    level: 'error' | 'warning' | 'info'
    rule: string
    description: string
    element?: string
    suggestion: string
  }[]
  recommendations: string[]
}

class UserExperienceService {
  private readonly STORAGE_KEYS = {
    USER_PREFERENCES: 'user_preferences',
    USER_SESSIONS: 'user_sessions',
    USER_ACTIONS: 'user_actions',
    ACCESSIBILITY_SETTINGS: 'accessibility_settings'
  }

  private currentSession: UserSession | null = null
  private actionBuffer: UserAction[] = []

  /**
   * بدء جلسة مستخدم جديدة
   */
  async startSession(userId: string): Promise<UserSession> {
    try {
      const session: UserSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        startTime: new Date().toISOString(),
        pageViews: 0,
        actions: [],
        device: this.getDeviceInfo(),
        performance: {
          loadTime: performance.now(),
          interactionTime: 0,
          errorCount: 0
        }
      }

      this.currentSession = session
      await this.saveSession(session)
      
      return session
    } catch (error) {
      throw new Error(`فشل في بدء الجلسة: ${error}`)
    }
  }

  /**
   * إنهاء الجلسة الحالية
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return

    try {
      const endTime = new Date().toISOString()
      const duration = Date.now() - new Date(this.currentSession.startTime).getTime()

      this.currentSession.endTime = endTime
      this.currentSession.duration = duration
      this.currentSession.actions = [...this.currentSession.actions, ...this.actionBuffer]

      await this.saveSession(this.currentSession)
      
      this.currentSession = null
      this.actionBuffer = []
    } catch (error) {
      console.error('خطأ في إنهاء الجلسة:', error)
    }
  }

  /**
   * تسجيل إجراء المستخدم
   */
  trackUserAction(
    type: UserAction['type'],
    target: string,
    success = true,
    metadata?: Record<string, any>
  ): void {
    if (!this.currentSession) return

    const action: UserAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      target,
      timestamp: new Date().toISOString(),
      success,
      metadata
    }

    this.actionBuffer.push(action)

    // حفظ الإجراءات كل 10 إجراءات
    if (this.actionBuffer.length >= 10) {
      this.flushActionBuffer()
    }
  }

  /**
   * حفظ تفضيلات المستخدم
   */
  async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const existingPrefs = await this.getUserPreferences(preferences.userId!)
      
      const updatedPrefs: UserPreferences = {
        ...existingPrefs,
        ...preferences,
        updatedAt: new Date().toISOString()
      }

      const allPreferences = await this.getAllUserPreferences()
      const index = allPreferences.findIndex(p => p.userId === preferences.userId)
      
      if (index !== -1) {
        allPreferences[index] = updatedPrefs
      } else {
        allPreferences.push(updatedPrefs)
      }

      await asyncStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, allPreferences)
      
      // تطبيق التفضيلات فوراً
      this.applyPreferences(updatedPrefs)
      
      return updatedPrefs
    } catch (error) {
      throw new Error(`فشل في حفظ التفضيلات: ${error}`)
    }
  }

  /**
   * جلب تفضيلات المستخدم
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const allPreferences = await this.getAllUserPreferences()
      const userPrefs = allPreferences.find(p => p.userId === userId)
      
      if (userPrefs) {
        return userPrefs
      }

      // إنشاء تفضيلات افتراضية
      const defaultPrefs: UserPreferences = {
        id: `prefs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        theme: 'light',
        language: 'ar',
        dateFormat: 'gregorian',
        currency: 'SAR',
        timezone: 'Asia/Riyadh',
        notifications: {
          email: true,
          push: true,
          desktop: true,
          sound: false
        },
        dashboard: {
          defaultView: 'projects',
          widgetLayout: ['projects', 'tasks', 'reports', 'calendar'],
          refreshInterval: 30000
        },
        accessibility: {
          highContrast: false,
          largeText: false,
          reducedMotion: false,
          screenReader: false
        },
        shortcuts: {
          'ctrl+n': 'new_project',
          'ctrl+s': 'save',
          'ctrl+f': 'search',
          'ctrl+r': 'refresh'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await this.saveUserPreferences(defaultPrefs)
      return defaultPrefs
    } catch (error) {
      throw new Error(`فشل في جلب التفضيلات: ${error}`)
    }
  }

  /**
   * تطبيق التفضيلات على الواجهة
   */
  private applyPreferences(preferences: UserPreferences): void {
    try {
      // تطبيق السمة
      document.documentElement.setAttribute('data-theme', preferences.theme)
      
      // تطبيق اللغة
      document.documentElement.setAttribute('lang', preferences.language)
      document.documentElement.setAttribute('dir', preferences.language === 'ar' ? 'rtl' : 'ltr')
      
      // تطبيق إعدادات إمكانية الوصول
      if (preferences.accessibility.highContrast) {
        document.documentElement.classList.add('high-contrast')
      } else {
        document.documentElement.classList.remove('high-contrast')
      }
      
      if (preferences.accessibility.largeText) {
        document.documentElement.classList.add('large-text')
      } else {
        document.documentElement.classList.remove('large-text')
      }
      
      if (preferences.accessibility.reducedMotion) {
        document.documentElement.classList.add('reduced-motion')
      } else {
        document.documentElement.classList.remove('reduced-motion')
      }

      // تطبيق اختصارات لوحة المفاتيح
      this.setupKeyboardShortcuts(preferences.shortcuts)
      
    } catch (error) {
      console.error('خطأ في تطبيق التفضيلات:', error)
    }
  }

  /**
   * إعداد اختصارات لوحة المفاتيح
   */
  private setupKeyboardShortcuts(shortcuts: Record<string, string>): void {
    // إزالة المستمعين السابقين
    document.removeEventListener('keydown', this.handleKeyboardShortcut)
    
    // إضافة مستمع جديد
    document.addEventListener('keydown', this.handleKeyboardShortcut.bind(this))
  }

  /**
   * معالج اختصارات لوحة المفاتيح
   */
  private handleKeyboardShortcut(event: KeyboardEvent): void {
    const key = this.getKeyboardShortcut(event)
    const preferences = this.currentSession ? 
      this.getUserPreferences(this.currentSession.userId) : null
    
    if (!preferences) return

    // البحث عن الاختصار في التفضيلات
    // تنفيذ الإجراء المطلوب
    this.trackUserAction('click', `keyboard_shortcut_${key}`)
  }

  /**
   * تحويل حدث لوحة المفاتيح إلى نص اختصار
   */
  private getKeyboardShortcut(event: KeyboardEvent): string {
    const parts: string[] = []
    
    if (event.ctrlKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    if (event.metaKey) parts.push('meta')
    
    parts.push(event.key.toLowerCase())
    
    return parts.join('+')
  }

  /**
   * تقييم إمكانية الوصول
   */
  async evaluateAccessibility(): Promise<AccessibilityReport> {
    const issues: AccessibilityReport['issues'] = []
    const recommendations: string[] = []
    
    // فحص العناصر الأساسية
    const images = document.querySelectorAll('img:not([alt])')
    if (images.length > 0) {
      issues.push({
        level: 'error',
        rule: 'WCAG 1.1.1',
        description: 'صور بدون نص بديل',
        suggestion: 'إضافة خاصية alt لجميع الصور'
      })
    }

    const buttons = document.querySelectorAll('button:not([aria-label]):not([title])')
    if (buttons.length > 0) {
      issues.push({
        level: 'warning',
        rule: 'WCAG 4.1.2',
        description: 'أزرار بدون تسميات واضحة',
        suggestion: 'إضافة aria-label أو title للأزرار'
      })
    }

    // حساب النقاط
    const totalChecks = 10
    const passedChecks = totalChecks - issues.filter(i => i.level === 'error').length
    const score = (passedChecks / totalChecks) * 100

    // توصيات عامة
    if (score < 80) {
      recommendations.push('تحسين إمكانية الوصول للواجهة')
    }
    if (issues.some(i => i.rule.includes('1.1.1'))) {
      recommendations.push('إضافة نصوص بديلة للصور')
    }
    if (issues.some(i => i.rule.includes('4.1.2'))) {
      recommendations.push('تحسين تسميات العناصر التفاعلية')
    }

    return {
      score,
      issues,
      recommendations
    }
  }

  /**
   * حفظ الجلسة
   */
  private async saveSession(session: UserSession): Promise<void> {
    try {
      const sessions = await asyncStorage.getItem(this.STORAGE_KEYS.USER_SESSIONS) || []
      const index = sessions.findIndex((s: UserSession) => s.id === session.id)
      
      if (index !== -1) {
        sessions[index] = session
      } else {
        sessions.push(session)
      }

      // الاحتفاظ بآخر 50 جلسة فقط
      if (sessions.length > 50) {
        sessions.splice(0, sessions.length - 50)
      }

      await asyncStorage.setItem(this.STORAGE_KEYS.USER_SESSIONS, sessions)
    } catch (error) {
      console.error('خطأ في حفظ الجلسة:', error)
    }
  }

  /**
   * حفظ الإجراءات المؤقتة
   */
  private async flushActionBuffer(): Promise<void> {
    if (!this.currentSession || this.actionBuffer.length === 0) return

    try {
      this.currentSession.actions.push(...this.actionBuffer)
      await this.saveSession(this.currentSession)
      this.actionBuffer = []
    } catch (error) {
      console.error('خطأ في حفظ الإجراءات:', error)
    }
  }

  /**
   * جلب جميع التفضيلات
   */
  private async getAllUserPreferences(): Promise<UserPreferences[]> {
    try {
      return await asyncStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES) || []
    } catch (error) {
      console.error('خطأ في جلب التفضيلات:', error)
      return []
    }
  }

  /**
   * الحصول على معلومات الجهاز
   */
  private getDeviceInfo(): UserSession['device'] {
    const userAgent = navigator.userAgent
    
    return {
      type: this.getDeviceType(),
      os: this.getOperatingSystem(userAgent),
      browser: this.getBrowser(userAgent),
      screenResolution: `${screen.width}x${screen.height}`
    }
  }

  /**
   * تحديد نوع الجهاز
   */
  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  /**
   * تحديد نظام التشغيل
   */
  private getOperatingSystem(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  /**
   * تحديد المتصفح
   */
  private getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  /**
   * جلب إحصائيات تجربة المستخدم
   */
  async getUserExperienceStats(userId: string): Promise<{
    totalSessions: number
    averageSessionDuration: number
    totalActions: number
    mostUsedFeatures: string[]
    accessibilityScore: number
  }> {
    try {
      const sessions = await asyncStorage.getItem(this.STORAGE_KEYS.USER_SESSIONS) || []
      const userSessions = sessions.filter((s: UserSession) => s.userId === userId)
      
      const totalSessions = userSessions.length
      const averageSessionDuration = userSessions.reduce((sum: number, s: UserSession) => 
        sum + (s.duration || 0), 0) / totalSessions || 0
      
      const allActions = userSessions.flatMap((s: UserSession) => s.actions)
      const totalActions = allActions.length
      
      // حساب الميزات الأكثر استخداماً
      const featureUsage = allActions.reduce((acc: Record<string, number>, action: UserAction) => {
        acc[action.target] = (acc[action.target] || 0) + 1
        return acc
      }, {})
      
      const mostUsedFeatures = Object.entries(featureUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([feature]) => feature)

      // تقييم إمكانية الوصول
      const accessibilityReport = await this.evaluateAccessibility()
      
      return {
        totalSessions,
        averageSessionDuration,
        totalActions,
        mostUsedFeatures,
        accessibilityScore: accessibilityReport.score
      }
    } catch (error) {
      console.error('خطأ في جلب إحصائيات تجربة المستخدم:', error)
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        totalActions: 0,
        mostUsedFeatures: [],
        accessibilityScore: 0
      }
    }
  }
}

export const userExperienceService = new UserExperienceService()
