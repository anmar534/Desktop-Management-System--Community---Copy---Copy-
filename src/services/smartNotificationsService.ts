/**
 * خدمة الإشعارات والتنبيهات الذكية
 * Smart Notifications Service
 *
 * يوفر نظام شامل للإشعارات والتنبيهات الذكية مع تحليل البيانات والتنبؤ
 */

import { asyncStorage } from '../utils/storage'

export interface NotificationRule {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  type:
    | 'project_critical'
    | 'deadline_warning'
    | 'budget_overrun'
    | 'opportunity'
    | 'risk'
    | 'performance'
    | 'custom'
  category: 'urgent' | 'warning' | 'info' | 'success'
  priority: 'high' | 'medium' | 'low'
  conditions: NotificationCondition[]
  actions: NotificationAction[]
  isActive: boolean
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  channels: ('in_app' | 'email' | 'sms' | 'desktop')[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface NotificationCondition {
  field: string
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'between'
    | 'contains'
    | 'starts_with'
    | 'ends_with'
  value: any
  dataSource: 'projects' | 'tenders' | 'expenses' | 'invoices' | 'tasks' | 'custom'
}

export interface NotificationAction {
  type: 'send_notification' | 'send_email' | 'create_task' | 'update_status' | 'log_event'
  config: Record<string, any>
}

export interface SmartNotification {
  id: string
  ruleId: string
  title: string
  titleEn: string
  message: string
  messageEn: string
  type:
    | 'project_critical'
    | 'deadline_warning'
    | 'budget_overrun'
    | 'opportunity'
    | 'risk'
    | 'performance'
    | 'custom'
  category: 'urgent' | 'warning' | 'info' | 'success'
  priority: 'high' | 'medium' | 'low'
  status: 'unread' | 'read' | 'dismissed' | 'archived'
  data: Record<string, any>
  recipients: string[]
  channels: ('in_app' | 'email' | 'sms' | 'desktop')[]
  scheduledAt?: string
  sentAt?: string
  readAt?: string
  dismissedAt?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationSettings {
  userId: string
  enableInApp: boolean
  enableEmail: boolean
  enableSMS: boolean
  enableDesktop: boolean
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  categories: {
    urgent: boolean
    warning: boolean
    info: boolean
    success: boolean
  }
  types: {
    project_critical: boolean
    deadline_warning: boolean
    budget_overrun: boolean
    opportunity: boolean
    risk: boolean
    performance: boolean
    custom: boolean
  }
  frequency: {
    immediate: boolean
    daily: boolean
    weekly: boolean
    monthly: boolean
  }
  updatedAt: string
}

export interface NotificationAnalytics {
  totalSent: number
  totalRead: number
  totalDismissed: number
  readRate: number
  dismissalRate: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  byChannel: Record<string, number>
  trends: {
    daily: { date: string; count: number }[]
    weekly: { week: string; count: number }[]
    monthly: { month: string; count: number }[]
  }
}

export class SmartNotificationsService {
  private readonly RULES_KEY = 'notification_rules'
  private readonly NOTIFICATIONS_KEY = 'smart_notifications'
  private readonly SETTINGS_KEY = 'notification_settings'
  private readonly ANALYTICS_KEY = 'notification_analytics'

  // إنشاء قاعدة إشعار جديدة
  async createRule(
    rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<NotificationRule> {
    const newRule: NotificationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const rules = await this.getAllRules()
    rules.push(newRule)
    await asyncStorage.setItem(this.RULES_KEY, rules)

    return newRule
  }

  // الحصول على جميع قواعد الإشعارات
  async getAllRules(): Promise<NotificationRule[]> {
    try {
      const rules = (await asyncStorage.getItem(this.RULES_KEY)) || []
      return Array.isArray(rules) ? rules : []
    } catch (error) {
      console.error('Error loading notification rules:', error)
      return []
    }
  }

  // تحديث قاعدة إشعار
  async updateRule(
    ruleId: string,
    updates: Partial<NotificationRule>,
  ): Promise<NotificationRule | null> {
    const rules = await this.getAllRules()
    const ruleIndex = rules.findIndex((r) => r.id === ruleId)

    if (ruleIndex === -1) return null

    rules[ruleIndex] = {
      ...rules[ruleIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await asyncStorage.setItem(this.RULES_KEY, rules)
    return rules[ruleIndex]
  }

  // حذف قاعدة إشعار
  async deleteRule(ruleId: string): Promise<boolean> {
    const rules = await this.getAllRules()
    const filteredRules = rules.filter((r) => r.id !== ruleId)

    if (filteredRules.length === rules.length) return false

    await asyncStorage.setItem(this.RULES_KEY, filteredRules)
    return true
  }

  // تقييم القواعد وإنشاء الإشعارات
  async evaluateRules(): Promise<SmartNotification[]> {
    const rules = await this.getAllRules()
    const activeRules = rules.filter((rule) => rule.isActive)
    const newNotifications: SmartNotification[] = []

    for (const rule of activeRules) {
      const matchingData = await this.evaluateConditions(rule.conditions)

      if (matchingData.length > 0) {
        for (const data of matchingData) {
          const notification = await this.createNotificationFromRule(rule, data)
          newNotifications.push(notification)
        }
      }
    }

    // حفظ الإشعارات الجديدة
    if (newNotifications.length > 0) {
      const existingNotifications = await this.getAllNotifications()
      const allNotifications = [...existingNotifications, ...newNotifications]
      await asyncStorage.setItem(this.NOTIFICATIONS_KEY, allNotifications)
    }

    return newNotifications
  }

  // تقييم شروط القاعدة
  private async evaluateConditions(
    conditions: NotificationCondition[],
  ): Promise<Record<string, any>[]> {
    const results: Record<string, any>[] = []

    for (const condition of conditions) {
      const data = await this.getDataFromSource(condition.dataSource)
      const matchingItems = data.filter((item) => this.evaluateCondition(item, condition))
      results.push(...matchingItems)
    }

    return results
  }

  // تقييم شرط واحد
  private evaluateCondition(item: Record<string, any>, condition: NotificationCondition): boolean {
    const value = item[condition.field]
    const conditionValue = condition.value

    switch (condition.operator) {
      case 'equals':
        return value === conditionValue
      case 'not_equals':
        return value !== conditionValue
      case 'greater_than':
        return Number(value) > Number(conditionValue)
      case 'less_than':
        return Number(value) < Number(conditionValue)
      case 'between':
        return (
          Number(value) >= Number(conditionValue[0]) && Number(value) <= Number(conditionValue[1])
        )
      case 'contains':
        return String(value).toLowerCase().includes(String(conditionValue).toLowerCase())
      case 'starts_with':
        return String(value).toLowerCase().startsWith(String(conditionValue).toLowerCase())
      case 'ends_with':
        return String(value).toLowerCase().endsWith(String(conditionValue).toLowerCase())
      default:
        return false
    }
  }

  // الحصول على البيانات من المصدر
  private async getDataFromSource(dataSource: string): Promise<Record<string, any>[]> {
    switch (dataSource) {
      case 'projects':
        return (await asyncStorage.getItem('projects')) || []
      case 'tenders':
        return (await asyncStorage.getItem('tenders')) || []
      case 'expenses':
        return (await asyncStorage.getItem('expenses')) || []
      case 'invoices':
        return (await asyncStorage.getItem('invoices')) || []
      case 'tasks':
        return (await asyncStorage.getItem('tasks')) || []
      default:
        return []
    }
  }

  // إنشاء إشعار من قاعدة
  private async createNotificationFromRule(
    rule: NotificationRule,
    data: Record<string, any>,
  ): Promise<SmartNotification> {
    const notification: SmartNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      title: this.generateNotificationTitle(rule, data),
      titleEn: this.generateNotificationTitleEn(rule, data),
      message: this.generateNotificationMessage(rule, data),
      messageEn: this.generateNotificationMessageEn(rule, data),
      type: rule.type,
      category: rule.category,
      priority: rule.priority,
      status: 'unread',
      data,
      recipients: rule.recipients,
      channels: rule.channels,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // تنفيذ الإجراءات
    await this.executeActions(rule.actions, notification)

    return notification
  }

  // توليد عنوان الإشعار
  private generateNotificationTitle(rule: NotificationRule, data: Record<string, any>): string {
    switch (rule.type) {
      case 'project_critical':
        return `تنبيه حرج: مشروع ${data.name || 'غير محدد'}`
      case 'deadline_warning':
        return `تحذير موعد نهائي: ${data.name || 'مهمة'}`
      case 'budget_overrun':
        return `تجاوز الميزانية: ${data.name || 'مشروع'}`
      case 'opportunity':
        return `فرصة جديدة: ${data.title || 'منافسة'}`
      case 'risk':
        return `تحذير مخاطر: ${data.name || 'عنصر'}`
      case 'performance':
        return `تنبيه أداء: ${data.name || 'مؤشر'}`
      default:
        return rule.name
    }
  }

  // توليد عنوان الإشعار بالإنجليزية
  private generateNotificationTitleEn(rule: NotificationRule, data: Record<string, any>): string {
    switch (rule.type) {
      case 'project_critical':
        return `Critical Alert: Project ${data.nameEn || data.name || 'Unknown'}`
      case 'deadline_warning':
        return `Deadline Warning: ${data.nameEn || data.name || 'Task'}`
      case 'budget_overrun':
        return `Budget Overrun: ${data.nameEn || data.name || 'Project'}`
      case 'opportunity':
        return `New Opportunity: ${data.titleEn || data.title || 'Tender'}`
      case 'risk':
        return `Risk Warning: ${data.nameEn || data.name || 'Item'}`
      case 'performance':
        return `Performance Alert: ${data.nameEn || data.name || 'Metric'}`
      default:
        return rule.nameEn || rule.name
    }
  }

  // توليد رسالة الإشعار
  private generateNotificationMessage(rule: NotificationRule, _data: Record<string, any>): string {
    return rule.description || 'تم تشغيل قاعدة إشعار'
  }

  // توليد رسالة الإشعار بالإنجليزية
  private generateNotificationMessageEn(
    rule: NotificationRule,
    _data: Record<string, any>,
  ): string {
    return rule.descriptionEn || rule.description || 'Notification rule triggered'
  }

  // تنفيذ الإجراءات
  private async executeActions(
    actions: NotificationAction[],
    notification: SmartNotification,
  ): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'send_notification':
          await this.sendNotification(notification)
          break
        case 'send_email':
          await this.sendEmail(notification, action.config)
          break
        case 'create_task':
          await this.createTask(notification, action.config)
          break
        case 'update_status':
          await this.updateStatus(notification, action.config)
          break
        case 'log_event':
          await this.logEvent(notification, action.config)
          break
      }
    }
  }

  // إرسال الإشعار
  private async sendNotification(notification: SmartNotification): Promise<void> {
    // تنفيذ إرسال الإشعار (سيتم تطويره مع النظام الفعلي)
    console.log('Sending notification:', notification.title)
  }

  // إرسال بريد إلكتروني
  private async sendEmail(
    notification: SmartNotification,
    _config: Record<string, any>,
  ): Promise<void> {
    // تنفيذ إرسال البريد الإلكتروني
    console.log('Sending email for notification:', notification.title)
  }

  // إنشاء مهمة
  private async createTask(
    notification: SmartNotification,
    _config: Record<string, any>,
  ): Promise<void> {
    // تنفيذ إنشاء مهمة
    console.log('Creating task for notification:', notification.title)
  }

  // تحديث الحالة
  private async updateStatus(
    notification: SmartNotification,
    _config: Record<string, any>,
  ): Promise<void> {
    // تنفيذ تحديث الحالة
    console.log('Updating status for notification:', notification.title)
  }

  // تسجيل حدث
  private async logEvent(
    notification: SmartNotification,
    _config: Record<string, any>,
  ): Promise<void> {
    // تنفيذ تسجيل الحدث
    console.log('Logging event for notification:', notification.title)
  }

  // الحصول على جميع الإشعارات
  async getAllNotifications(): Promise<SmartNotification[]> {
    try {
      const notifications = (await asyncStorage.getItem(this.NOTIFICATIONS_KEY)) || []
      return Array.isArray(notifications) ? notifications : []
    } catch (error) {
      console.error('Error loading notifications:', error)
      return []
    }
  }

  // تحديث حالة الإشعار
  async updateNotificationStatus(
    notificationId: string,
    status: 'read' | 'dismissed' | 'archived',
  ): Promise<boolean> {
    const notifications = await this.getAllNotifications()
    const notificationIndex = notifications.findIndex((n) => n.id === notificationId)

    if (notificationIndex === -1) return false

    notifications[notificationIndex].status = status
    notifications[notificationIndex].updatedAt = new Date().toISOString()

    if (status === 'read') {
      notifications[notificationIndex].readAt = new Date().toISOString()
    } else if (status === 'dismissed') {
      notifications[notificationIndex].dismissedAt = new Date().toISOString()
    }

    await asyncStorage.setItem(this.NOTIFICATIONS_KEY, notifications)
    return true
  }

  // الحصول على إعدادات الإشعارات للمستخدم
  async getUserSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const allSettings = (await asyncStorage.getItem(this.SETTINGS_KEY)) || {}
      return allSettings[userId] || null
    } catch (error) {
      console.error('Error loading user notification settings:', error)
      return null
    }
  }

  // حفظ إعدادات الإشعارات للمستخدم
  async saveUserSettings(settings: NotificationSettings): Promise<void> {
    try {
      const allSettings = (await asyncStorage.getItem(this.SETTINGS_KEY)) || {}
      allSettings[settings.userId] = {
        ...settings,
        updatedAt: new Date().toISOString(),
      }
      await asyncStorage.setItem(this.SETTINGS_KEY, allSettings)
    } catch (error) {
      console.error('Error saving user notification settings:', error)
      throw error
    }
  }

  // الحصول على تحليلات الإشعارات
  async getAnalytics(): Promise<NotificationAnalytics> {
    const notifications = await this.getAllNotifications()

    const totalSent = notifications.length
    const totalRead = notifications.filter((n) => n.status === 'read').length
    const totalDismissed = notifications.filter((n) => n.status === 'dismissed').length

    const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0
    const dismissalRate = totalSent > 0 ? (totalDismissed / totalSent) * 100 : 0

    const byType: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    const byChannel: Record<string, number> = {}

    notifications.forEach((notification) => {
      byType[notification.type] = (byType[notification.type] || 0) + 1
      byCategory[notification.category] = (byCategory[notification.category] || 0) + 1
      notification.channels.forEach((channel) => {
        byChannel[channel] = (byChannel[channel] || 0) + 1
      })
    })

    return {
      totalSent,
      totalRead,
      totalDismissed,
      readRate,
      dismissalRate,
      byType,
      byCategory,
      byChannel,
      trends: {
        daily: this.calculateDailyTrends(notifications),
        weekly: this.calculateWeeklyTrends(notifications),
        monthly: this.calculateMonthlyTrends(notifications),
      },
    }
  }

  // حساب الاتجاهات اليومية
  private calculateDailyTrends(
    notifications: SmartNotification[],
  ): { date: string; count: number }[] {
    const trends: Record<string, number> = {}

    notifications.forEach((notification) => {
      const date = notification.createdAt.split('T')[0]
      trends[date] = (trends[date] || 0) + 1
    })

    return Object.entries(trends).map(([date, count]) => ({ date, count }))
  }

  // حساب الاتجاهات الأسبوعية
  private calculateWeeklyTrends(
    _notifications: SmartNotification[],
  ): { week: string; count: number }[] {
    // تنفيذ حساب الاتجاهات الأسبوعية
    return []
  }

  // حساب الاتجاهات الشهرية
  private calculateMonthlyTrends(
    _notifications: SmartNotification[],
  ): { month: string; count: number }[] {
    // تنفيذ حساب الاتجاهات الشهرية
    return []
  }
}

export const smartNotificationsService = new SmartNotificationsService()
