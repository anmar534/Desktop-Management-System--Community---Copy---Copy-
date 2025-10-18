/**
 * Dashboard Alerts Hook
 *
 * Hook مخصص لإدارة التنبيهات والأنشطة في لوحة التحكم
 * يوفر واجهة موحدة للتعامل مع التنبيهات والأنشطة
 *
 * @version 1.0.0
 * @date 2024-01-15
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertsService } from '@/services/alertsService'
import { ActivitiesService } from '@/services/activitiesService'
import type { Alert, Activity } from '@/components/analytics/enhanced/EnhancedDashboardLayout'

interface UseDashboardAlertsReturn {
  // التنبيهات
  alerts: Alert[]
  criticalAlerts: Alert[]
  unreadAlertsCount: number

  // الأنشطة
  activities: Activity[]
  recentActivities: Activity[]

  // حالة التحميل
  isLoading: boolean
  isRefreshing: boolean

  // الأخطاء
  error: string | null

  // إجراءات التنبيهات
  markAsRead: (alertId: string) => Promise<void>
  dismissAlert: (alertId: string) => Promise<void>
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => Promise<string>

  // إجراءات الأنشطة
  logActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Promise<string>
  getActivitiesByType: (type: Activity['type']) => Activity[]
  getActivitiesByUser: (user: string) => Activity[]

  // إجراءات عامة
  refresh: () => Promise<void>
  refreshAlerts: () => Promise<void>
  refreshActivities: () => Promise<void>

  // معلومات إضافية
  lastUpdated: Date | null
  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (enabled: boolean) => void
}

interface UseDashboardAlertsOptions {
  autoRefresh?: boolean
  refreshInterval?: number // بالميلي ثانية
  loadOnMount?: boolean
  maxAlerts?: number
  maxActivities?: number
}

/**
 * Hook للتنبيهات والأنشطة
 */
export const useDashboardAlerts = (
  options: UseDashboardAlertsOptions = {},
): UseDashboardAlertsReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 2 * 60 * 1000, // دقيقتان افتراضياً
    loadOnMount = true,
    maxAlerts = 50,
    maxActivities = 20,
  } = options

  // الحالة
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh)

  // المراجع
  const alertsService = useRef(AlertsService.getInstance())
  const activitiesService = useRef(ActivitiesService.getInstance())
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  /**
   * تحميل التنبيهات
   */
  const loadAlerts = useCallback(async (): Promise<void> => {
    try {
      const allAlerts = await alertsService.current.getAllAlerts()
      if (mountedRef.current) {
        setAlerts(allAlerts.slice(0, maxAlerts))
      }
    } catch (err) {
      console.error('خطأ في تحميل التنبيهات:', err)
      if (mountedRef.current) {
        setError('فشل في تحميل التنبيهات')
      }
    }
  }, [maxAlerts])

  /**
   * تحميل الأنشطة
   */
  const loadActivities = useCallback(async (): Promise<void> => {
    try {
      const recentActivities = await activitiesService.current.getRecentActivities(maxActivities)
      if (mountedRef.current) {
        setActivities(recentActivities)
      }
    } catch (err) {
      console.error('خطأ في تحميل الأنشطة:', err)
      if (mountedRef.current) {
        setError('فشل في تحميل الأنشطة')
      }
    }
  }, [maxActivities])

  /**
   * تحميل جميع البيانات
   */
  const loadAllData = useCallback(
    async (showLoading = true): Promise<void> => {
      if (showLoading && mountedRef.current) {
        setIsLoading(true)
      }

      setError(null)

      try {
        await Promise.all([loadAlerts(), loadActivities()])

        if (mountedRef.current) {
          setLastUpdated(new Date())
        }
      } catch (err) {
        console.error('خطأ في تحميل البيانات:', err)
        if (mountedRef.current) {
          setError('فشل في تحميل البيانات')
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [loadAlerts, loadActivities],
  )

  /**
   * تحديث جميع البيانات
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (mountedRef.current) {
      setIsRefreshing(true)
    }
    await loadAllData(false)
  }, [loadAllData])

  /**
   * تحديث التنبيهات فقط
   */
  const refreshAlerts = useCallback(async (): Promise<void> => {
    setIsRefreshing(true)
    try {
      await loadAlerts()
      if (mountedRef.current) {
        setLastUpdated(new Date())
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false)
      }
    }
  }, [loadAlerts])

  /**
   * تحديث الأنشطة فقط
   */
  const refreshActivities = useCallback(async (): Promise<void> => {
    setIsRefreshing(true)
    try {
      await loadActivities()
      if (mountedRef.current) {
        setLastUpdated(new Date())
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false)
      }
    }
  }, [loadActivities])

  /**
   * وضع علامة "تم القراءة" على التنبيه
   */
  const markAsRead = useCallback(async (alertId: string): Promise<void> => {
    try {
      await alertsService.current.markAlertAsRead(alertId)

      // تحديث الحالة المحلية
      if (mountedRef.current) {
        setAlerts((prev) =>
          prev.map((alert) => (alert.id === alertId ? { ...alert, isRead: true } : alert)),
        )
      }
    } catch (err) {
      console.error('خطأ في وضع علامة القراءة:', err)
      if (mountedRef.current) {
        setError('فشل في تحديث حالة التنبيه')
      }
    }
  }, [])

  /**
   * إخفاء التنبيه
   */
  const dismissAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      await alertsService.current.dismissAlert(alertId)

      // تحديث الحالة المحلية
      if (mountedRef.current) {
        setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
      }
    } catch (err) {
      console.error('خطأ في إخفاء التنبيه:', err)
      if (mountedRef.current) {
        setError('فشل في إخفاء التنبيه')
      }
    }
  }, [])

  /**
   * إضافة تنبيه جديد
   */
  const addAlert = useCallback(
    async (alert: Omit<Alert, 'id' | 'timestamp'>): Promise<string> => {
      try {
        const alertId = await alertsService.current.addAlert(alert)

        // تحديث الحالة المحلية
        await refreshAlerts()

        return alertId
      } catch (err) {
        console.error('خطأ في إضافة التنبيه:', err)
        if (mountedRef.current) {
          setError('فشل في إضافة التنبيه')
        }
        throw err
      }
    },
    [refreshAlerts],
  )

  /**
   * تسجيل نشاط جديد
   */
  const logActivity = useCallback(
    async (activity: Omit<Activity, 'id' | 'timestamp'>): Promise<string> => {
      try {
        const activityId = await activitiesService.current.logActivity(activity)

        // تحديث الحالة المحلية
        await refreshActivities()

        return activityId
      } catch (err) {
        console.error('خطأ في تسجيل النشاط:', err)
        if (mountedRef.current) {
          setError('فشل في تسجيل النشاط')
        }
        throw err
      }
    },
    [refreshActivities],
  )

  /**
   * جلب الأنشطة حسب النوع
   */
  const getActivitiesByType = useCallback(
    (type: Activity['type']): Activity[] => {
      return activities.filter((activity) => activity.type === type)
    },
    [activities],
  )

  /**
   * جلب الأنشطة حسب المستخدم
   */
  const getActivitiesByUser = useCallback(
    (user: string): Activity[] => {
      return activities.filter((activity) => activity.user === user)
    },
    [activities],
  )

  /**
   * إعداد التحديث التلقائي
   */
  const setupAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    if (autoRefreshEnabled && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refresh()
      }, refreshInterval)
    }
  }, [autoRefreshEnabled, refreshInterval, refresh])

  // القيم المحسوبة
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === 'high' || alert.severity === 'critical',
  )

  const unreadAlertsCount = alerts.filter((alert) => !alert.isRead).length

  const recentActivities = activities.slice(0, 10)

  /**
   * تحميل البيانات عند التحميل الأولي
   */
  useEffect(() => {
    if (loadOnMount) {
      loadAllData()
    }
  }, [loadOnMount, loadAllData])

  /**
   * إعداد التحديث التلقائي
   */
  useEffect(() => {
    setupAutoRefresh()

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [setupAutoRefresh])

  /**
   * تنظيف عند إلغاء التحميل
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

  return {
    // التنبيهات
    alerts,
    criticalAlerts,
    unreadAlertsCount,

    // الأنشطة
    activities,
    recentActivities,

    // حالة التحميل
    isLoading,
    isRefreshing,

    // الأخطاء
    error,

    // إجراءات التنبيهات
    markAsRead,
    dismissAlert,
    addAlert,

    // إجراءات الأنشطة
    logActivity,
    getActivitiesByType,
    getActivitiesByUser,

    // إجراءات عامة
    refresh,
    refreshAlerts,
    refreshActivities,

    // معلومات إضافية
    lastUpdated,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
  }
}
