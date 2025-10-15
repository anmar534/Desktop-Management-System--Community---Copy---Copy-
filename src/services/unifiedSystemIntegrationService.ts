/**
 * خدمة التكامل الشامل للنظام
 * تربط جميع وحدات النظام في تدفق بيانات سلس ومتكامل
 */

import { asyncStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/storageKeys'

// واجهات البيانات للتكامل
export interface SystemModule {
  id: string
  name: string
  nameEn: string
  status: 'active' | 'inactive' | 'maintenance'
  version: string
  lastSync: string
  dependencies: string[]
  dataCount: number
  errorCount: number
}

export interface DataFlow {
  id: string
  sourceModule: string
  targetModule: string
  dataType: string
  status: 'active' | 'paused' | 'error'
  lastSync: string
  recordsProcessed: number
  errorCount: number
  syncFrequency: 'realtime' | 'hourly' | 'daily'
}

export interface IntegrationSummary {
  totalModules: number
  activeModules: number
  totalDataFlows: number
  activeDataFlows: number
  lastFullSync: string
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical'
  overallSyncStatus: 'synced' | 'syncing' | 'error'
  dataConsistencyScore: number
  performanceScore: number
}

export interface ConflictResolution {
  id: string
  conflictType: 'data_mismatch' | 'version_conflict' | 'dependency_error'
  sourceModule: string
  targetModule: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'resolved' | 'ignored'
  resolutionStrategy: string
  createdAt: string
  resolvedAt?: string
}

export interface RealTimeUpdate {
  id: string
  moduleId: string
  dataType: string
  operation: 'create' | 'update' | 'delete'
  recordId: string
  timestamp: string
  propagated: boolean
  affectedModules: string[]
}

class UnifiedSystemIntegrationService {
  private modules: SystemModule[] = []
  private dataFlows: DataFlow[] = []
  private conflicts: ConflictResolution[] = []
  private realTimeUpdates: RealTimeUpdate[] = []

  /**
   * تهيئة النظام وتحميل البيانات
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSystemData()
      await this.initializeModules()
      await this.setupDataFlows()
      console.log('تم تهيئة نظام التكامل الشامل بنجاح')
    } catch (error) {
      console.error('خطأ في تهيئة نظام التكامل:', error)
      throw new Error('فشل في تهيئة نظام التكامل')
    }
  }

  /**
   * تحميل بيانات النظام من التخزين
   */
  private async loadSystemData(): Promise<void> {
    try {
      const modulesData = await asyncStorage.getItem(STORAGE_KEYS.SYSTEM_MODULES) || []
      const dataFlowsData = await asyncStorage.getItem(STORAGE_KEYS.DATA_FLOWS) || []
      const conflictsData = await asyncStorage.getItem(STORAGE_KEYS.INTEGRATION_CONFLICTS) || []
      const updatesData = await asyncStorage.getItem(STORAGE_KEYS.REALTIME_UPDATES) || []

      this.modules = Array.isArray(modulesData) ? modulesData : []
      this.dataFlows = Array.isArray(dataFlowsData) ? dataFlowsData : []
      this.conflicts = Array.isArray(conflictsData) ? conflictsData : []
      this.realTimeUpdates = Array.isArray(updatesData) ? updatesData : []
    } catch (error) {
      console.error('خطأ في تحميل بيانات النظام:', error)
      // تهيئة البيانات الافتراضية في حالة الخطأ
      this.modules = []
      this.dataFlows = []
      this.conflicts = []
      this.realTimeUpdates = []
    }
  }

  /**
   * تهيئة وحدات النظام
   */
  private async initializeModules(): Promise<void> {
    if (this.modules.length === 0) {
      // إنشاء الوحدات الافتراضية
      this.modules = [
        {
          id: 'tenders',
          name: 'إدارة المنافسات',
          nameEn: 'Tender Management',
          status: 'active',
          version: '2.1.0',
          lastSync: new Date().toISOString(),
          dependencies: [],
          dataCount: 0,
          errorCount: 0
        },
        {
          id: 'projects',
          name: 'إدارة المشاريع',
          nameEn: 'Project Management',
          status: 'active',
          version: '2.0.0',
          lastSync: new Date().toISOString(),
          dependencies: ['tenders'],
          dataCount: 0,
          errorCount: 0
        },
        {
          id: 'financial',
          name: 'الإدارة المالية',
          nameEn: 'Financial Management',
          status: 'active',
          version: '2.0.0',
          lastSync: new Date().toISOString(),
          dependencies: ['projects'],
          dataCount: 0,
          errorCount: 0
        },
        {
          id: 'procurement',
          name: 'إدارة المشتريات',
          nameEn: 'Procurement Management',
          status: 'active',
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          dependencies: ['projects', 'financial'],
          dataCount: 0,
          errorCount: 0
        }
      ]

      await this.saveSystemData()
    }

    // تحديث عدد البيانات لكل وحدة
    await this.updateModuleDataCounts()
  }

  /**
   * إعداد تدفقات البيانات بين الوحدات
   */
  private async setupDataFlows(): Promise<void> {
    if (this.dataFlows.length === 0) {
      this.dataFlows = [
        {
          id: 'tenders-to-projects',
          sourceModule: 'tenders',
          targetModule: 'projects',
          dataType: 'tender_awards',
          status: 'active',
          lastSync: new Date().toISOString(),
          recordsProcessed: 0,
          errorCount: 0,
          syncFrequency: 'realtime'
        },
        {
          id: 'projects-to-financial',
          sourceModule: 'projects',
          targetModule: 'financial',
          dataType: 'project_budgets',
          status: 'active',
          lastSync: new Date().toISOString(),
          recordsProcessed: 0,
          errorCount: 0,
          syncFrequency: 'realtime'
        },
        {
          id: 'projects-to-procurement',
          sourceModule: 'projects',
          targetModule: 'procurement',
          dataType: 'project_requirements',
          status: 'active',
          lastSync: new Date().toISOString(),
          recordsProcessed: 0,
          errorCount: 0,
          syncFrequency: 'hourly'
        },
        {
          id: 'financial-to-procurement',
          sourceModule: 'financial',
          targetModule: 'procurement',
          dataType: 'budget_allocations',
          status: 'active',
          lastSync: new Date().toISOString(),
          recordsProcessed: 0,
          errorCount: 0,
          syncFrequency: 'daily'
        },
        {
          id: 'procurement-to-financial',
          sourceModule: 'procurement',
          targetModule: 'financial',
          dataType: 'purchase_orders',
          status: 'active',
          lastSync: new Date().toISOString(),
          recordsProcessed: 0,
          errorCount: 0,
          syncFrequency: 'realtime'
        }
      ]

      await this.saveSystemData()
    }
  }

  /**
   * تحديث عدد البيانات لكل وحدة
   */
  private async updateModuleDataCounts(): Promise<void> {
    try {
      // تحديث عدد المنافسات
      const tenders = await asyncStorage.getItem(STORAGE_KEYS.TENDERS_DATA) || []
      const tendersModule = this.modules.find(m => m.id === 'tenders')
      if (tendersModule) {
        tendersModule.dataCount = Array.isArray(tenders) ? tenders.length : 0
      }

      // تحديث عدد المشاريع
      const projects = await asyncStorage.getItem(STORAGE_KEYS.PROJECTS_DATA) || []
      const projectsModule = this.modules.find(m => m.id === 'projects')
      if (projectsModule) {
        projectsModule.dataCount = Array.isArray(projects) ? projects.length : 0
      }

      // تحديث عدد البيانات المالية
      const budgets = await asyncStorage.getItem(STORAGE_KEYS.BUDGETS) || []
      const financialModule = this.modules.find(m => m.id === 'financial')
      if (financialModule) {
        financialModule.dataCount = Array.isArray(budgets) ? budgets.length : 0
      }

      // تحديث عدد أوامر الشراء
      const purchaseOrders = await asyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS_DATA) || []
      const procurementModule = this.modules.find(m => m.id === 'procurement')
      if (procurementModule) {
        procurementModule.dataCount = Array.isArray(purchaseOrders) ? purchaseOrders.length : 0
      }

      await this.saveSystemData()
    } catch (error) {
      console.error('خطأ في تحديث عدد البيانات:', error)
    }
  }

  /**
   * حفظ بيانات النظام
   */
  private async saveSystemData(): Promise<void> {
    try {
      await asyncStorage.setItem(STORAGE_KEYS.SYSTEM_MODULES, this.modules)
      await asyncStorage.setItem(STORAGE_KEYS.DATA_FLOWS, this.dataFlows)
      await asyncStorage.setItem(STORAGE_KEYS.INTEGRATION_CONFLICTS, this.conflicts)
      await asyncStorage.setItem(STORAGE_KEYS.REALTIME_UPDATES, this.realTimeUpdates)
    } catch (error) {
      console.error('خطأ في حفظ بيانات النظام:', error)
      throw new Error('فشل في حفظ بيانات النظام')
    }
  }

  /**
   * الحصول على جميع وحدات النظام
   */
  async getSystemModules(): Promise<SystemModule[]> {
    await this.updateModuleDataCounts()
    return [...this.modules]
  }

  /**
   * الحصول على تدفقات البيانات
   */
  async getDataFlows(): Promise<DataFlow[]> {
    return [...this.dataFlows]
  }

  /**
   * الحصول على ملخص التكامل
   */
  async getIntegrationSummary(): Promise<IntegrationSummary> {
    await this.updateModuleDataCounts()

    const totalModules = this.modules.length
    const activeModules = this.modules.filter(m => m.status === 'active').length
    const totalDataFlows = this.dataFlows.length
    const activeDataFlows = this.dataFlows.filter(df => df.status === 'active').length

    // حساب نقاط الصحة والأداء
    const healthScore = this.calculateSystemHealth()
    const performanceScore = this.calculatePerformanceScore()
    const consistencyScore = this.calculateDataConsistencyScore()

    return {
      totalModules,
      activeModules,
      totalDataFlows,
      activeDataFlows,
      lastFullSync: new Date().toISOString(),
      systemHealth: this.getHealthStatus(healthScore),
      overallSyncStatus: this.getSyncStatus(),
      dataConsistencyScore: consistencyScore,
      performanceScore
    }
  }

  /**
   * مزامنة جميع البيانات بين الوحدات
   */
  async syncAllData(): Promise<void> {
    try {
      console.log('بدء مزامنة جميع البيانات...')

      // مزامنة المنافسات مع المشاريع
      await this.syncTendersToProjects()

      // مزامنة المشاريع مع النظام المالي
      await this.syncProjectsToFinancial()

      // مزامنة المشاريع مع المشتريات
      await this.syncProjectsToProcurement()

      // مزامنة النظام المالي مع المشتريات
      await this.syncFinancialToProcurement()

      // مزامنة المشتريات مع النظام المالي
      await this.syncProcurementToFinancial()

      // تحديث تاريخ آخر مزامنة
      await asyncStorage.setItem(STORAGE_KEYS.LAST_FULL_SYNC, new Date().toISOString())

      console.log('تمت مزامنة جميع البيانات بنجاح')
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error)
      throw new Error('فشل في مزامنة البيانات')
    }
  }

  /**
   * مزامنة المنافسات مع المشاريع
   */
  private async syncTendersToProjects(): Promise<void> {
    try {
      const tenders = await asyncStorage.getItem(STORAGE_KEYS.TENDERS_DATA) || []
      const projects = await asyncStorage.getItem(STORAGE_KEYS.PROJECTS_DATA) || []

      // البحث عن المنافسات المرسية التي لم تتحول إلى مشاريع
      const awardedTenders = Array.isArray(tenders) ?
        tenders.filter((tender: any) => tender.status === 'awarded' && !tender.projectCreated) : []

      for (const tender of awardedTenders) {
        // إنشاء مشروع جديد من المنافسة
        const newProject = {
          id: `project-${tender.id}`,
          name: tender.title,
          description: tender.description,
          tenderId: tender.id,
          budget: tender.estimatedValue,
          startDate: new Date().toISOString(),
          status: 'planning',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        projects.push(newProject)

        // تحديث المنافسة لتشير إلى إنشاء المشروع
        tender.projectCreated = true
        tender.projectId = newProject.id
      }

      // حفظ البيانات المحدثة
      await asyncStorage.setItem(STORAGE_KEYS.TENDERS_DATA, tenders)
      await asyncStorage.setItem(STORAGE_KEYS.PROJECTS_DATA, projects)

      // تحديث إحصائيات تدفق البيانات
      const dataFlow = this.dataFlows.find(df => df.id === 'tenders-to-projects')
      if (dataFlow) {
        dataFlow.recordsProcessed += awardedTenders.length
        dataFlow.lastSync = new Date().toISOString()
      }
    } catch (error) {
      console.error('خطأ في مزامنة المنافسات مع المشاريع:', error)
      const dataFlow = this.dataFlows.find(df => df.id === 'tenders-to-projects')
      if (dataFlow) {
        dataFlow.errorCount++
        dataFlow.status = 'error'
      }
    }
  }

  /**
   * مزامنة المشاريع مع النظام المالي
   */
  private async syncProjectsToFinancial(): Promise<void> {
    try {
      const projects = await asyncStorage.getItem(STORAGE_KEYS.PROJECTS_DATA) || []
      const budgets = await asyncStorage.getItem(STORAGE_KEYS.BUDGETS) || []

      // البحث عن المشاريع التي لم يتم إنشاء ميزانيات لها
      const projectsWithoutBudgets = Array.isArray(projects) ?
        projects.filter((project: any) => !budgets.some((budget: any) => budget.projectId === project.id)) : []

      for (const project of projectsWithoutBudgets) {
        // إنشاء ميزانية جديدة للمشروع
        const newBudget = {
          id: `budget-${project.id}`,
          projectId: project.id,
          projectName: project.name,
          totalBudget: project.budget || 0,
          allocatedBudget: 0,
          spentBudget: 0,
          remainingBudget: project.budget || 0,
          categories: [
            { name: 'مواد', allocated: 0, spent: 0 },
            { name: 'عمالة', allocated: 0, spent: 0 },
            { name: 'معدات', allocated: 0, spent: 0 },
            { name: 'أخرى', allocated: 0, spent: 0 }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        budgets.push(newBudget)
      }

      // حفظ البيانات المحدثة
      await asyncStorage.setItem(STORAGE_KEYS.BUDGETS, budgets)

      // تحديث إحصائيات تدفق البيانات
      const dataFlow = this.dataFlows.find(df => df.id === 'projects-to-financial')
      if (dataFlow) {
        dataFlow.recordsProcessed += projectsWithoutBudgets.length
        dataFlow.lastSync = new Date().toISOString()
      }
    } catch (error) {
      console.error('خطأ في مزامنة المشاريع مع النظام المالي:', error)
      const dataFlow = this.dataFlows.find(df => df.id === 'projects-to-financial')
      if (dataFlow) {
        dataFlow.errorCount++
        dataFlow.status = 'error'
      }
    }
  }

  /**
   * مزامنة المشاريع مع المشتريات
   */
  private async syncProjectsToProcurement(): Promise<void> {
    try {
      const projects = await asyncStorage.getItem(STORAGE_KEYS.PROJECTS_DATA) || []
      const purchaseOrders = await asyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS_DATA) || []

      // تحديث أوامر الشراء بمعلومات المشاريع
      if (Array.isArray(purchaseOrders)) {
        for (const order of purchaseOrders) {
          if (order.projectId) {
            const project = projects.find((p: any) => p.id === order.projectId)
            if (project) {
              order.projectName = project.name
              order.projectBudget = project.budget
            }
          }
        }

        await asyncStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS_DATA, purchaseOrders)
      }

      const dataFlow = this.dataFlows.find(df => df.id === 'projects-to-procurement')
      if (dataFlow) {
        dataFlow.recordsProcessed += Array.isArray(purchaseOrders) ? purchaseOrders.length : 0
        dataFlow.lastSync = new Date().toISOString()
      }
    } catch (error) {
      console.error('خطأ في مزامنة المشاريع مع المشتريات:', error)
      const dataFlow = this.dataFlows.find(df => df.id === 'projects-to-procurement')
      if (dataFlow) {
        dataFlow.errorCount++
        dataFlow.status = 'error'
      }
    }
  }

  /**
   * مزامنة النظام المالي مع المشتريات
   */
  private async syncFinancialToProcurement(): Promise<void> {
    try {
      const budgets = await asyncStorage.getItem(STORAGE_KEYS.BUDGETS) || []
      const purchaseOrders = await asyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS_DATA) || []

      // تحديث أوامر الشراء بمعلومات الميزانية
      if (Array.isArray(purchaseOrders)) {
        for (const order of purchaseOrders) {
          if (order.projectId) {
            const budget = budgets.find((b: any) => b.projectId === order.projectId)
            if (budget) {
              order.availableBudget = budget.remainingBudget
              order.budgetCategory = this.determineBudgetCategory(order.items)
            }
          }
        }

        await asyncStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS_DATA, purchaseOrders)
      }

      const dataFlow = this.dataFlows.find(df => df.id === 'financial-to-procurement')
      if (dataFlow) {
        dataFlow.recordsProcessed += Array.isArray(purchaseOrders) ? purchaseOrders.length : 0
        dataFlow.lastSync = new Date().toISOString()
      }
    } catch (error) {
      console.error('خطأ في مزامنة النظام المالي مع المشتريات:', error)
      const dataFlow = this.dataFlows.find(df => df.id === 'financial-to-procurement')
      if (dataFlow) {
        dataFlow.errorCount++
        dataFlow.status = 'error'
      }
    }
  }

  /**
   * مزامنة المشتريات مع النظام المالي
   */
  private async syncProcurementToFinancial(): Promise<void> {
    try {
      const purchaseOrders = await asyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS_DATA) || []
      const budgets = await asyncStorage.getItem(STORAGE_KEYS.BUDGETS) || []

      // تحديث الميزانيات بناءً على أوامر الشراء
      if (Array.isArray(budgets)) {
        for (const budget of budgets) {
          const projectOrders = purchaseOrders.filter((order: any) =>
            order.projectId === budget.projectId && order.status === 'completed'
          )

          // حساب إجمالي المصروفات
          const totalSpent = projectOrders.reduce((sum: number, order: any) =>
            sum + (order.totalAmount || 0), 0
          )

          budget.spentBudget = totalSpent
          budget.remainingBudget = budget.totalBudget - totalSpent
          budget.updatedAt = new Date().toISOString()
        }

        await asyncStorage.setItem(STORAGE_KEYS.BUDGETS, budgets)
      }

      const dataFlow = this.dataFlows.find(df => df.id === 'procurement-to-financial')
      if (dataFlow) {
        dataFlow.recordsProcessed += Array.isArray(purchaseOrders) ? purchaseOrders.length : 0
        dataFlow.lastSync = new Date().toISOString()
      }
    } catch (error) {
      console.error('خطأ في مزامنة المشتريات مع النظام المالي:', error)
      const dataFlow = this.dataFlows.find(df => df.id === 'procurement-to-financial')
      if (dataFlow) {
        dataFlow.errorCount++
        dataFlow.status = 'error'
      }
    }
  }

  /**
   * تحديد فئة الميزانية بناءً على عناصر الطلب
   */
  private determineBudgetCategory(items: any[]): string {
    if (!Array.isArray(items) || items.length === 0) return 'أخرى'

    // تحليل العناصر لتحديد الفئة الأكثر شيوعاً
    const categories = items.map(item => {
      const name = item.name?.toLowerCase() || ''
      if (name.includes('مواد') || name.includes('خامات')) return 'مواد'
      if (name.includes('عمالة') || name.includes('أجور')) return 'عمالة'
      if (name.includes('معدات') || name.includes('آلات')) return 'معدات'
      return 'أخرى'
    })

    // إرجاع الفئة الأكثر تكراراً
    const categoryCount = categories.reduce((acc: any, cat) => {
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    return Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[a] > categoryCount[b] ? a : b
    )
  }

  /**
   * حساب صحة النظام
   */
  private calculateSystemHealth(): number {
    const totalModules = this.modules.length
    const activeModules = this.modules.filter(m => m.status === 'active').length
    const totalErrors = this.modules.reduce((sum, m) => sum + m.errorCount, 0)

    if (totalModules === 0) return 0

    const activeRatio = activeModules / totalModules
    const errorPenalty = Math.min(totalErrors * 0.1, 0.5) // خصم حتى 50% للأخطاء

    return Math.max(0, (activeRatio - errorPenalty) * 100)
  }

  /**
   * حساب نقاط الأداء
   */
  private calculatePerformanceScore(): number {
    const totalFlows = this.dataFlows.length
    const activeFlows = this.dataFlows.filter(df => df.status === 'active').length
    const totalErrors = this.dataFlows.reduce((sum, df) => sum + df.errorCount, 0)

    if (totalFlows === 0) return 100

    const activeRatio = activeFlows / totalFlows
    const errorPenalty = Math.min(totalErrors * 0.05, 0.3) // خصم حتى 30% للأخطاء

    return Math.max(0, (activeRatio - errorPenalty) * 100)
  }

  /**
   * حساب نقاط اتساق البيانات
   */
  private calculateDataConsistencyScore(): number {
    const totalConflicts = this.conflicts.length
    const resolvedConflicts = this.conflicts.filter(c => c.status === 'resolved').length
    const criticalConflicts = this.conflicts.filter(c => c.severity === 'critical').length

    if (totalConflicts === 0) return 100

    const resolutionRatio = resolvedConflicts / totalConflicts
    const criticalPenalty = criticalConflicts * 0.2 // خصم 20% لكل تضارب حرج

    return Math.max(0, (resolutionRatio - criticalPenalty) * 100)
  }

  /**
   * تحديد حالة صحة النظام
   */
  private getHealthStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 50) return 'warning'
    return 'critical'
  }

  /**
   * تحديد حالة المزامنة
   */
  private getSyncStatus(): 'synced' | 'syncing' | 'error' {
    const errorFlows = this.dataFlows.filter(df => df.status === 'error').length
    const activeFlows = this.dataFlows.filter(df => df.status === 'active').length

    if (errorFlows > 0) return 'error'
    if (activeFlows === this.dataFlows.length) return 'synced'
    return 'syncing'
  }

  /**
   * إضافة تحديث في الوقت الفعلي
   */
  async addRealTimeUpdate(update: Omit<RealTimeUpdate, 'id' | 'timestamp' | 'propagated'>): Promise<void> {
    const newUpdate: RealTimeUpdate = {
      ...update,
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      propagated: false
    }

    this.realTimeUpdates.push(newUpdate)

    // الاحتفاظ بآخر 1000 تحديث فقط
    if (this.realTimeUpdates.length > 1000) {
      this.realTimeUpdates = this.realTimeUpdates.slice(-1000)
    }

    await this.saveSystemData()

    // نشر التحديث للوحدات المتأثرة
    await this.propagateUpdate(newUpdate)
  }

  /**
   * نشر التحديث للوحدات المتأثرة
   */
  private async propagateUpdate(update: RealTimeUpdate): Promise<void> {
    try {
      // تحديد الوحدات المتأثرة بناءً على تدفقات البيانات
      const affectedFlows = this.dataFlows.filter(df =>
        df.sourceModule === update.moduleId && df.syncFrequency === 'realtime'
      )

      for (const flow of affectedFlows) {
        // تحديث إحصائيات التدفق
        flow.recordsProcessed++
        flow.lastSync = new Date().toISOString()

        // إضافة الوحدة المستهدفة للوحدات المتأثرة
        if (!update.affectedModules.includes(flow.targetModule)) {
          update.affectedModules.push(flow.targetModule)
        }
      }

      update.propagated = true
      await this.saveSystemData()
    } catch (error) {
      console.error('خطأ في نشر التحديث:', error)
    }
  }

  /**
   * الحصول على التحديثات الأخيرة
   */
  async getRecentUpdates(limit: number = 50): Promise<RealTimeUpdate[]> {
    return this.realTimeUpdates
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * الحصول على التضاربات المعلقة
   */
  async getPendingConflicts(): Promise<ConflictResolution[]> {
    return this.conflicts.filter(c => c.status === 'pending')
  }

  /**
   * حل تضارب
   */
  async resolveConflict(conflictId: string, resolutionStrategy: string): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId)
    if (!conflict) {
      throw new Error('التضارب غير موجود')
    }

    conflict.status = 'resolved'
    conflict.resolutionStrategy = resolutionStrategy
    conflict.resolvedAt = new Date().toISOString()

    await this.saveSystemData()
  }
}

// إنشاء مثيل واحد من الخدمة
export const unifiedSystemIntegrationService = new UnifiedSystemIntegrationService()

// تصدير الخدمة كافتراضية
export default unifiedSystemIntegrationService
