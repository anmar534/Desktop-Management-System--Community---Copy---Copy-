/**
 * Alerts Service
 *
 * خدمة إدارة التنبيهات والإشعارات الحرجة
 * تراقب النظام وتنشئ تنبيهات للحالات المهمة
 *
 * @version 1.0.0
 * @date 2024-01-15
 */

import { CentralDataService } from '@/application/services/centralDataService'
import type { Alert } from '@/components/analytics/enhanced/EnhancedDashboardLayout'
import { safeLocalStorage } from '@/utils/storage'

type StoredAlert = Omit<Alert, 'timestamp' | 'actions'> & {
  timestamp: string
  actions?: { label: string; href?: string }[]
}

/**
 * خدمة التنبيهات
 */
export class AlertsService {
  private static instance: AlertsService
  private centralDataService: CentralDataService
  private alertsCache: Alert[] = []

  private constructor() {
    this.centralDataService = CentralDataService.getInstance()
    this.loadAlerts()
  }

  private createNavigationAction(label: string, href: string) {
    return {
      label,
      href,
      onClick: () => {
        window.location.href = href
      },
    } satisfies NonNullable<Alert['actions']>[number]
  }

  public static getInstance(): AlertsService {
    if (!AlertsService.instance) {
      AlertsService.instance = new AlertsService()
    }
    return AlertsService.instance
  }

  /**
   * جلب التنبيهات الحرجة
   */
  async getCriticalAlerts(): Promise<Alert[]> {
    // تحديث التنبيهات من مصادر البيانات
    await this.generateSystemAlerts()

    // ترتيب التنبيهات حسب الأولوية والوقت
    return this.alertsCache
      .filter((alert) => alert.severity === 'high' || alert.severity === 'critical')
      .sort((a, b) => {
        // ترتيب حسب الأولوية أولاً
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
        if (severityDiff !== 0) return severityDiff

        // ثم حسب الوقت (الأحدث أولاً)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
      .slice(0, 10) // أهم 10 تنبيهات
  }

  /**
   * جلب جميع التنبيهات
   */
  async getAllAlerts(): Promise<Alert[]> {
    await this.generateSystemAlerts()
    return this.alertsCache.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }

  /**
   * وضع علامة "تم القراءة" على التنبيه
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    const alertIndex = this.alertsCache.findIndex((alert) => alert.id === alertId)
    if (alertIndex !== -1) {
      this.alertsCache[alertIndex].isRead = true
      this.saveAlerts()
    }
  }

  /**
   * إخفاء التنبيه
   */
  async dismissAlert(alertId: string): Promise<void> {
    this.alertsCache = this.alertsCache.filter((alert) => alert.id !== alertId)
    this.saveAlerts()
  }

  /**
   * إضافة تنبيه جديد
   */
  async addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<string> {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false,
    }

    this.alertsCache.unshift(newAlert)
    this.saveAlerts()

    return newAlert.id
  }

  /**
   * توليد تنبيهات النظام تلقائياً
   */
  private async generateSystemAlerts(): Promise<void> {
    const newAlerts: Alert[] = []

    // تنبيهات المشاريع المتأخرة
    const delayedProjectAlerts = await this.generateDelayedProjectAlerts()
    newAlerts.push(...delayedProjectAlerts)

    // تنبيهات الميزانية
    const budgetAlerts = await this.generateBudgetAlerts()
    newAlerts.push(...budgetAlerts)

    // تنبيهات المستحقات
    const receivableAlerts = await this.generateReceivableAlerts()
    newAlerts.push(...receivableAlerts)

    // تنبيهات السلامة
    const safetyAlerts = await this.generateSafetyAlerts()
    newAlerts.push(...safetyAlerts)

    // تنبيهات الموارد
    const resourceAlerts = await this.generateResourceAlerts()
    newAlerts.push(...resourceAlerts)

    // إضافة التنبيهات الجديدة فقط (تجنب التكرار)
    for (const alert of newAlerts) {
      const exists = this.alertsCache.some(
        (existing) =>
          existing.type === alert.type &&
          existing.title === alert.title &&
          this.isSameDay(existing.timestamp, alert.timestamp),
      )

      if (!exists) {
        this.alertsCache.unshift(alert)
      }
    }

    // الاحتفاظ بآخر 100 تنبيه فقط
    this.alertsCache = this.alertsCache.slice(0, 100)
    this.saveAlerts()
  }

  /**
   * توليد تنبيهات المشاريع المتأخرة
   */
  private async generateDelayedProjectAlerts(): Promise<Alert[]> {
    const projects = this.centralDataService.getProjects()
    const today = new Date()
    const alerts: Alert[] = []

    for (const project of projects) {
      if (!project.endDate || project.status === 'completed') continue

      const endDate = new Date(project.endDate)
      const daysOverdue = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysOverdue > 0) {
        alerts.push({
          id: `delayed_project_${project.id}`,
          type: 'project',
          severity: daysOverdue > 7 ? 'critical' : 'high',
          title: `تأخير في مشروع ${project.name}`,
          description: `المشروع متأخر ${daysOverdue} يوم عن الجدول المحدد`,
          timestamp: new Date(),
          isRead: false,
          actions: [
            this.createNavigationAction('مراجعة المشروع', `/projects/${project.id}`),
            this.createNavigationAction('تحديث الجدول', `/projects/${project.id}/schedule`),
          ],
        })
      }
    }

    return alerts
  }

  /**
   * توليد تنبيهات الميزانية
   */
  private async generateBudgetAlerts(): Promise<Alert[]> {
    const projects = this.centralDataService.getProjects()
    const alerts: Alert[] = []

    for (const project of projects) {
      if (!project.budget || project.status === 'completed') continue

      // محاكاة التكلفة الفعلية (في التطبيق الحقيقي ستأتي من قاعدة البيانات)
      const actualCost = project.budget * (0.8 + Math.random() * 0.4) // 80% - 120% من الميزانية
      const budgetVariance = ((actualCost - project.budget) / project.budget) * 100

      if (budgetVariance > 10) {
        alerts.push({
          id: `budget_overrun_${project.id}`,
          type: 'financial',
          severity: budgetVariance > 20 ? 'critical' : 'high',
          title: `تجاوز ميزانية مشروع ${project.name}`,
          description: `تجاوزت التكلفة الميزانية بنسبة ${budgetVariance.toFixed(1)}%`,
          timestamp: new Date(),
          isRead: false,
          actions: [
            this.createNavigationAction('مراجعة التكاليف', `/projects/${project.id}/budget`),
          ],
        })
      }
    }

    return alerts
  }

  /**
   * توليد تنبيهات المستحقات
   */
  private async generateReceivableAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = []

    // محاكاة مستحقات متأخرة
    const overdueAmount = 450000
    if (overdueAmount > 300000) {
      alerts.push({
        id: 'overdue_receivables',
        type: 'financial',
        severity: overdueAmount > 500000 ? 'critical' : 'high',
        title: 'مستحقات متأخرة',
        description: `يوجد مستحقات متأخرة بقيمة ${overdueAmount.toLocaleString('ar-SA')} ريال`,
        timestamp: new Date(),
        isRead: false,
        actions: [
          this.createNavigationAction('متابعة التحصيل', '/finance/receivables?filter=overdue'),
        ],
      })
    }

    return alerts
  }

  /**
   * توليد تنبيهات السلامة
   */
  private async generateSafetyAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = []

    // محاكاة تنبيهات السلامة
    const incidentCount = 1
    if (incidentCount > 0) {
      alerts.push({
        id: 'safety_incidents',
        type: 'safety',
        severity: incidentCount > 2 ? 'critical' : 'high',
        title: 'حوادث سلامة مسجلة',
        description: `تم تسجيل ${incidentCount} حادث سلامة هذا الشهر`,
        timestamp: new Date(),
        isRead: false,
        actions: [this.createNavigationAction('مراجعة التقارير', '/safety/incidents')],
      })
    }

    // تنبيه انتهاء صلاحية التدريبات
    const expiredTrainings = 3
    if (expiredTrainings > 0) {
      alerts.push({
        id: 'expired_trainings',
        type: 'safety',
        severity: 'medium',
        title: 'تدريبات منتهية الصلاحية',
        description: `${expiredTrainings} موظفين يحتاجون تجديد تدريبات السلامة`,
        timestamp: new Date(),
        isRead: false,
        actions: [this.createNavigationAction('جدولة التدريبات', '/safety/training')],
      })
    }

    return alerts
  }

  /**
   * توليد تنبيهات الموارد
   */
  private async generateResourceAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = []

    // محاكاة تنبيهات الموارد
    const lowStockItems = ['أسمنت', 'حديد التسليح']
    if (lowStockItems.length > 0) {
      alerts.push({
        id: 'low_stock_materials',
        type: 'resource',
        severity: 'medium',
        title: 'نقص في المواد',
        description: `نقص في المخزون: ${lowStockItems.join(', ')}`,
        timestamp: new Date(),
        isRead: false,
        actions: [this.createNavigationAction('طلب شراء', '/inventory/purchase-orders/new')],
      })
    }

    // تنبيه صيانة المعدات
    const maintenanceDue = ['حفارة 001', 'رافعة 003']
    if (maintenanceDue.length > 0) {
      alerts.push({
        id: 'equipment_maintenance',
        type: 'resource',
        severity: 'medium',
        title: 'صيانة معدات مستحقة',
        description: `معدات تحتاج صيانة: ${maintenanceDue.join(', ')}`,
        timestamp: new Date(),
        isRead: false,
        actions: [this.createNavigationAction('جدولة الصيانة', '/equipment/maintenance')],
      })
    }

    return alerts
  }

  /**
   * تحميل التنبيهات من التخزين المحلي
   */
  private loadAlerts(): void {
    const stored = safeLocalStorage.getItem<StoredAlert[]>('dashboard_alerts', [])
    this.alertsCache = stored.map((alert) => ({
      ...alert,
      timestamp: new Date(alert.timestamp),
      actions: alert.actions?.map((action): NonNullable<Alert['actions']>[number] => {
        if (action.href) {
          return {
            ...action,
            onClick: () => {
              window.location.href = action.href!
            },
          }
        }
        return { label: action.label }
      }),
    }))
  }

  /**
   * حفظ التنبيهات في التخزين المحلي
   */
  private saveAlerts(): void {
    const serializable: StoredAlert[] = this.alertsCache.map((alert) => ({
      ...alert,
      timestamp:
        alert.timestamp instanceof Date
          ? alert.timestamp.toISOString()
          : new Date(alert.timestamp).toISOString(),
      actions: alert.actions?.map((action) => ({
        label: action.label,
        href: action.href,
      })),
    }))
    safeLocalStorage.setItem('dashboard_alerts', serializable)
  }

  /**
   * التحقق من تطابق التاريخ
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString()
  }
}
