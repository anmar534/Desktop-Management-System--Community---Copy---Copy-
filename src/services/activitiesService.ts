/**
 * Activities Service
 *
 * خدمة إدارة الأنشطة وسجل العمليات
 * تتبع جميع الأنشطة والتغييرات في النظام
 *
 * @version 1.0.0
 * @date 2024-01-15
 */

import { CentralDataService } from '@/application/services/centralDataService'
import type { Activity } from '@/components/analytics/enhanced/EnhancedDashboardLayout'
import { safeLocalStorage } from '@/utils/storage'

/**
 * خدمة الأنشطة
 */
export class ActivitiesService {
  private static instance: ActivitiesService
  private centralDataService: CentralDataService
  private activitiesCache: Activity[] = []

  private constructor() {
    this.centralDataService = CentralDataService.getInstance()
    this.loadActivities()
    void this.generateRecentActivities()
  }

  public static getInstance(): ActivitiesService {
    if (!ActivitiesService.instance) {
      ActivitiesService.instance = new ActivitiesService()
    }
    return ActivitiesService.instance
  }

  /**
   * جلب الأنشطة الحديثة
   */
  async getRecentActivities(limit = 20): Promise<Activity[]> {
    // تحديث الأنشطة من مصادر البيانات
    await this.generateRecentActivities()

    return this.activitiesCache
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * جلب الأنشطة حسب النوع
   */
  async getActivitiesByType(type: Activity['type'], limit = 10): Promise<Activity[]> {
    return this.activitiesCache
      .filter((activity) => activity.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * جلب الأنشطة حسب المستخدم
   */
  async getActivitiesByUser(user: string, limit = 10): Promise<Activity[]> {
    return this.activitiesCache
      .filter((activity) => activity.user === user)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * تسجيل نشاط جديد
   */
  async logActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Promise<string> {
    const newActivity: Activity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }

    this.activitiesCache.unshift(newActivity)

    // الاحتفاظ بآخر 500 نشاط فقط
    this.activitiesCache = this.activitiesCache.slice(0, 500)

    this.saveActivities()
    return newActivity.id
  }

  /**
   * حذف نشاط
   */
  async deleteActivity(activityId: string): Promise<void> {
    this.activitiesCache = this.activitiesCache.filter((activity) => activity.id !== activityId)
    this.saveActivities()
  }

  /**
   * توليد الأنشطة الحديثة من بيانات النظام
   */
  private async generateRecentActivities(): Promise<void> {
    const newActivities: Activity[] = []

    // أنشطة المشاريع
    const projectActivities = await this.generateProjectActivities()
    newActivities.push(...projectActivities)

    // أنشطة المناقصات
    const tenderActivities = await this.generateTenderActivities()
    newActivities.push(...tenderActivities)

    // أنشطة مالية
    const financialActivities = await this.generateFinancialActivities()
    newActivities.push(...financialActivities)

    // أنشطة الموارد
    const resourceActivities = await this.generateResourceActivities()
    newActivities.push(...resourceActivities)

    // إضافة الأنشطة الجديدة فقط (تجنب التكرار)
    for (const activity of newActivities) {
      const exists = this.activitiesCache.some(
        (existing) =>
          existing.type === activity.type &&
          existing.title === activity.title &&
          this.isSameHour(existing.timestamp, activity.timestamp),
      )

      if (!exists) {
        this.activitiesCache.unshift(activity)
      }
    }

    // الاحتفاظ بآخر 500 نشاط فقط
    this.activitiesCache = this.activitiesCache.slice(0, 500)
    this.saveActivities()
  }

  /**
   * توليد أنشطة المشاريع
   */
  private async generateProjectActivities(): Promise<Activity[]> {
    const projects = this.centralDataService.getProjects()
    const activities: Activity[] = []

    // محاكاة أنشطة حديثة للمشاريع
    const recentProjects = projects.slice(0, 3)

    for (const project of recentProjects) {
      // نشاط تحديث نسبة الإنجاز
      if (project.progress && project.progress > 0) {
        activities.push({
          id: `project_progress_${project.id}`,
          type: 'project',
          title: `تم تحديث حالة مشروع ${project.name}`,
          description: `تم رفع نسبة الإنجاز إلى ${project.progress}%`,
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // خلال آخر 24 ساعة
          user: this.getRandomUser(),
          metadata: {
            projectId: project.id,
            projectName: project.name,
            progress: project.progress,
          },
        })
      }

      // نشاط بدء مرحلة جديدة
      if (project.status === 'active') {
        activities.push({
          id: `project_phase_${project.id}`,
          type: 'project',
          title: `بدء مرحلة جديدة في مشروع ${project.name}`,
          description: 'تم بدء مرحلة الأعمال الإنشائية',
          timestamp: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000), // خلال آخر 48 ساعة
          user: this.getRandomUser(),
          metadata: {
            projectId: project.id,
            projectName: project.name,
            phase: 'construction',
          },
        })
      }
    }

    return activities
  }

  /**
   * توليد أنشطة المناقصات
   */
  private async generateTenderActivities(): Promise<Activity[]> {
    const tenders = this.centralDataService.getTenders()
    const activities: Activity[] = []

    // محاكاة أنشطة حديثة للمناقصات
    const recentTenders = tenders.slice(0, 2)

    for (const tender of recentTenders) {
      // نشاط تقديم عرض
      activities.push({
        id: `tender_submission_${tender.id}`,
        type: 'tender',
        title: `تم تقديم عرض لمناقصة ${tender.title}`,
        description: `تم تقديم العرض الفني والمالي بقيمة ${(tender.totalValue ?? tender.value).toLocaleString('ar-SA')} ريال`,
        timestamp: new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000), // خلال آخر 3 أيام
        user: this.getRandomUser(),
        metadata: {
          tenderId: tender.id,
          tenderTitle: tender.title,
          estimatedValue: tender.totalValue ?? tender.value,
        },
      })

      // نشاط تحديث حالة المناقصة
      if (tender.status === 'submitted') {
        activities.push({
          id: `tender_status_${tender.id}`,
          type: 'tender',
          title: `تحديث حالة مناقصة ${tender.title}`,
          description: 'تم تحديث الحالة إلى "مقدم"',
          timestamp: new Date(Date.now() - Math.random() * 96 * 60 * 60 * 1000), // خلال آخر 4 أيام
          user: this.getRandomUser(),
          metadata: {
            tenderId: tender.id,
            tenderTitle: tender.title,
            status: tender.status,
          },
        })
      }
    }

    return activities
  }

  /**
   * توليد أنشطة مالية
   */
  private async generateFinancialActivities(): Promise<Activity[]> {
    const activities: Activity[] = []

    // محاكاة أنشطة مالية
    activities.push(
      {
        id: 'payment_received_001',
        type: 'financial',
        title: 'تم استلام دفعة مالية',
        description: 'تم استلام دفعة بقيمة 850,000 ريال من مشروع برج الرياض',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // منذ ساعتين
        user: this.getRandomUser(),
        metadata: {
          amount: 850000,
          projectName: 'برج الرياض',
          paymentType: 'milestone',
        },
      },
      {
        id: 'invoice_generated_001',
        type: 'financial',
        title: 'تم إنشاء فاتورة جديدة',
        description: 'فاتورة رقم INV-2024-001 بقيمة 1,200,000 ريال',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // منذ 6 ساعات
        user: this.getRandomUser(),
        metadata: {
          invoiceNumber: 'INV-2024-001',
          amount: 1200000,
        },
      },
      {
        id: 'expense_approved_001',
        type: 'financial',
        title: 'تم اعتماد مصروف',
        description: 'اعتماد مصروف شراء مواد بناء بقيمة 45,000 ريال',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // منذ 12 ساعة
        user: this.getRandomUser(),
        metadata: {
          expenseType: 'materials',
          amount: 45000,
        },
      },
    )

    return activities
  }

  /**
   * توليد أنشطة الموارد
   */
  private async generateResourceActivities(): Promise<Activity[]> {
    const activities: Activity[] = []

    // محاكاة أنشطة الموارد
    activities.push(
      {
        id: 'equipment_assigned_001',
        type: 'resource',
        title: 'تم تخصيص معدة لمشروع',
        description: 'تم تخصيص حفارة CAT-320 لمشروع مجمع الأعمال',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // منذ 4 ساعات
        user: this.getRandomUser(),
        metadata: {
          equipmentName: 'حفارة CAT-320',
          projectName: 'مجمع الأعمال',
        },
      },
      {
        id: 'material_delivered_001',
        type: 'resource',
        title: 'تم توريد مواد',
        description: 'تم توريد 50 طن أسمنت لمشروع الفيلا السكنية',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // منذ 8 ساعات
        user: this.getRandomUser(),
        metadata: {
          materialType: 'أسمنت',
          quantity: 50,
          unit: 'طن',
          projectName: 'الفيلا السكنية',
        },
      },
      {
        id: 'maintenance_completed_001',
        type: 'resource',
        title: 'تم إكمال صيانة معدة',
        description: 'تم إكمال الصيانة الدورية لرافعة LIEBHERR-130',
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000), // منذ 18 ساعة
        user: this.getRandomUser(),
        metadata: {
          equipmentName: 'رافعة LIEBHERR-130',
          maintenanceType: 'دورية',
        },
      },
    )

    return activities
  }

  /**
   * الحصول على مستخدم عشوائي (محاكاة)
   */
  private getRandomUser(): string {
    const users = [
      'أحمد محمد',
      'فاطمة علي',
      'محمد السعد',
      'نورا أحمد',
      'خالد العتيبي',
      'سارة المطيري',
      'عبدالله الشمري',
      'هند القحطاني',
    ]
    return users[Math.floor(Math.random() * users.length)]
  }

  /**
   * تحميل الأنشطة من التخزين المحلي
   */
  private loadActivities(): void {
    const stored = safeLocalStorage.getItem<Activity[]>('dashboard_activities', [])
    this.activitiesCache = stored.map((activity) => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    }))
  }

  /**
   * حفظ الأنشطة في التخزين المحلي
   */
  private saveActivities(): void {
    safeLocalStorage.setItem('dashboard_activities', this.activitiesCache)
  }

  /**
   * التحقق من تطابق الساعة
   */
  private isSameHour(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate() &&
      date1.getHours() === date2.getHours()
    )
  }
}
