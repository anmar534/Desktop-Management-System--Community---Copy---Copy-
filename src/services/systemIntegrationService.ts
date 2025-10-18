/**
 * System Integration Service
 * خدمة التكامل مع الأنظمة
 */

import { asyncStorage } from '../utils/storage'
import type { EnhancedProject } from '../types/project'
import { enhancedProjectService } from './enhancedProjectService'

export interface TenderSystem {
  id: string
  name: string
  nameEn: string
  endpoint: string
  apiKey?: string
  isActive: boolean
  lastSync: string
  syncStatus: 'success' | 'error' | 'pending'
  errorMessage?: string
}

export interface FinancialSystem {
  id: string
  name: string
  nameEn: string
  endpoint: string
  credentials?: {
    username: string
    password: string
    apiKey?: string
  }
  isActive: boolean
  lastSync: string
  syncStatus: 'success' | 'error' | 'pending'
  supportedOperations: string[]
}

export interface SyncResult {
  success: boolean
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsSkipped: number
  errors: string[]
  duration: number
  timestamp: string
}

export interface IntegrationMapping {
  id: string
  sourceSystem: string
  targetSystem: string
  sourceField: string
  targetField: string
  transformation?: string
  isActive: boolean
}

class SystemIntegrationService {
  private readonly STORAGE_KEYS = {
    TENDER_SYSTEMS: 'tender_systems',
    FINANCIAL_SYSTEMS: 'financial_systems',
    INTEGRATION_MAPPINGS: 'integration_mappings',
    SYNC_HISTORY: 'sync_history'
  }

  /**
   * إعداد نظام المنافسات
   */
  async setupTenderSystem(system: Omit<TenderSystem, 'id' | 'lastSync' | 'syncStatus'>): Promise<TenderSystem> {
    try {
      const newSystem: TenderSystem = {
        ...system,
        id: `tender_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastSync: new Date().toISOString(),
        syncStatus: 'pending'
      }

      const systems = await this.getTenderSystems()
      systems.push(newSystem)
      await asyncStorage.setItem(this.STORAGE_KEYS.TENDER_SYSTEMS, systems)

      return newSystem
    } catch (error) {
      throw new Error(`فشل في إعداد نظام المنافسات: ${error}`)
    }
  }

  /**
   * إعداد النظام المالي
   */
  async setupFinancialSystem(system: Omit<FinancialSystem, 'id' | 'lastSync' | 'syncStatus'>): Promise<FinancialSystem> {
    try {
      const newSystem: FinancialSystem = {
        ...system,
        id: `financial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastSync: new Date().toISOString(),
        syncStatus: 'pending'
      }

      const systems = await this.getFinancialSystems()
      systems.push(newSystem)
      await asyncStorage.setItem(this.STORAGE_KEYS.FINANCIAL_SYSTEMS, systems)

      return newSystem
    } catch (error) {
      throw new Error(`فشل في إعداد النظام المالي: ${error}`)
    }
  }

  /**
   * مزامنة المشاريع من نظام المنافسات
   */
  async syncProjectsFromTender(systemId: string): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString()
    }

    try {
      const systems = await this.getTenderSystems()
      const system = systems.find(s => s.id === systemId)
      
      if (!system) {
        throw new Error('نظام المنافسات غير موجود')
      }

      if (!system.isActive) {
        throw new Error('نظام المنافسات غير نشط')
      }

      // محاكاة جلب البيانات من نظام المنافسات
      const tenderProjects = await this.fetchTenderProjects(system)
      result.recordsProcessed = tenderProjects.length

      for (const tenderProject of tenderProjects) {
        try {
          // التحقق من وجود المشروع
          const existingProjects = await enhancedProjectService.getAllProjects()
          const existingProject = existingProjects.find(p => p.tenderReference === tenderProject.tenderNumber)

          if (existingProject) {
            // تحديث المشروع الموجود
            const updatedProject = await this.mapTenderToProject(tenderProject, existingProject)
            await enhancedProjectService.updateProject(existingProject.id, updatedProject)
            result.recordsUpdated++
          } else {
            // إنشاء مشروع جديد
            const newProject = await this.mapTenderToProject(tenderProject)
            await enhancedProjectService.createProject(newProject)
            result.recordsCreated++
          }
        } catch (error) {
          result.errors.push(`خطأ في معالجة المشروع ${tenderProject.tenderNumber}: ${error}`)
          result.recordsSkipped++
        }
      }

      // تحديث حالة النظام
      system.lastSync = new Date().toISOString()
      system.syncStatus = result.errors.length === 0 ? 'success' : 'error'
      if (result.errors.length > 0) {
        system.errorMessage = result.errors.join('; ')
      }

      await this.updateTenderSystem(system)
      
      result.success = true
      result.duration = Date.now() - startTime

      // حفظ تاريخ المزامنة
      await this.saveSyncHistory('tender', systemId, result)

      return result

    } catch (error) {
      result.errors.push(`خطأ عام في المزامنة: ${error}`)
      result.duration = Date.now() - startTime
      return result
    }
  }

  /**
   * مزامنة البيانات المالية
   */
  async syncFinancialData(systemId: string, projectId: string): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 0,
      timestamp: new Date().toISOString()
    }

    try {
      const systems = await this.getFinancialSystems()
      const system = systems.find(s => s.id === systemId)
      
      if (!system) {
        throw new Error('النظام المالي غير موجود')
      }

      if (!system.isActive) {
        throw new Error('النظام المالي غير نشط')
      }

      // جلب البيانات المالية
      const financialData = await this.fetchFinancialData(system, projectId)
      result.recordsProcessed = financialData.length

      // تحديث المشروع بالبيانات المالية
      const project = await enhancedProjectService.getProject(projectId)
      if (project) {
        const updatedProject = await this.updateProjectFinancials(project, financialData)
        await enhancedProjectService.updateProject(projectId, updatedProject)
        result.recordsUpdated++
      }

      result.success = true
      result.duration = Date.now() - startTime

      // حفظ تاريخ المزامنة
      await this.saveSyncHistory('financial', systemId, result)

      return result

    } catch (error) {
      result.errors.push(`خطأ في مزامنة البيانات المالية: ${error}`)
      result.duration = Date.now() - startTime
      return result
    }
  }

  /**
   * جلب أنظمة المنافسات
   */
  async getTenderSystems(): Promise<TenderSystem[]> {
    try {
      return await asyncStorage.getItem(this.STORAGE_KEYS.TENDER_SYSTEMS) || []
    } catch (error) {
      console.error('خطأ في جلب أنظمة المنافسات:', error)
      return []
    }
  }

  /**
   * جلب الأنظمة المالية
   */
  async getFinancialSystems(): Promise<FinancialSystem[]> {
    try {
      return await asyncStorage.getItem(this.STORAGE_KEYS.FINANCIAL_SYSTEMS) || []
    } catch (error) {
      console.error('خطأ في جلب الأنظمة المالية:', error)
      return []
    }
  }

  /**
   * تحديث نظام المنافسات
   */
  private async updateTenderSystem(updatedSystem: TenderSystem): Promise<void> {
    const systems = await this.getTenderSystems()
    const index = systems.findIndex(s => s.id === updatedSystem.id)
    if (index !== -1) {
      systems[index] = updatedSystem
      await asyncStorage.setItem(this.STORAGE_KEYS.TENDER_SYSTEMS, systems)
    }
  }

  /**
   * جلب مشاريع المنافسات (محاكاة)
   */
  private async fetchTenderProjects(system: TenderSystem): Promise<any[]> {
    // محاكاة API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return [
      {
        tenderNumber: 'T2024001',
        projectName: 'مشروع إنشاء مبنى إداري',
        projectNameEn: 'Administrative Building Construction',
        contractValue: 2500000,
        startDate: '2024-11-01',
        endDate: '2025-05-01',
        clientName: 'وزارة التعليم',
        status: 'awarded'
      },
      {
        tenderNumber: 'T2024002',
        projectName: 'مشروع تطوير شبكة الطرق',
        projectNameEn: 'Road Network Development',
        contractValue: 5000000,
        startDate: '2024-12-01',
        endDate: '2025-12-01',
        clientName: 'وزارة النقل',
        status: 'awarded'
      }
    ]
  }

  /**
   * جلب البيانات المالية (محاكاة)
   */
  private async fetchFinancialData(system: FinancialSystem, projectId: string): Promise<any[]> {
    // محاكاة API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return [
      {
        type: 'expense',
        amount: 150000,
        date: '2024-10-01',
        description: 'مواد البناء',
        category: 'materials'
      },
      {
        type: 'expense',
        amount: 80000,
        date: '2024-10-05',
        description: 'أجور العمالة',
        category: 'labor'
      }
    ]
  }

  /**
   * تحويل بيانات المنافسة إلى مشروع
   */
  private async mapTenderToProject(tenderData: any, existingProject?: EnhancedProject): Promise<Partial<EnhancedProject>> {
    const baseProject = existingProject || {}
    
    return {
      ...baseProject,
      name: tenderData.projectName,
      nameEn: tenderData.projectNameEn,
      description: `مشروع من منافسة رقم ${tenderData.tenderNumber}`,
      descriptionEn: `Project from tender ${tenderData.tenderNumber}`,
      budget: tenderData.contractValue,
      startDate: tenderData.startDate,
      endDate: tenderData.endDate,
      clientName: tenderData.clientName,
      tenderReference: tenderData.tenderNumber,
      status: this.mapTenderStatus(tenderData.status),
      category: 'construction',
      priority: 'medium',
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * تحديث البيانات المالية للمشروع
   */
  private async updateProjectFinancials(project: EnhancedProject, financialData: any[]): Promise<Partial<EnhancedProject>> {
    const totalExpenses = financialData
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0)

    return {
      ...project,
      actualCost: (project.actualCost || 0) + totalExpenses,
      lastFinancialSync: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * تحويل حالة المنافسة إلى حالة المشروع
   */
  private mapTenderStatus(tenderStatus: string): string {
    const statusMap: Record<string, string> = {
      'awarded': 'active',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'pending': 'planning'
    }
    
    return statusMap[tenderStatus] || 'planning'
  }

  /**
   * حفظ تاريخ المزامنة
   */
  private async saveSyncHistory(type: string, systemId: string, result: SyncResult): Promise<void> {
    try {
      const history = await asyncStorage.getItem(this.STORAGE_KEYS.SYNC_HISTORY) || []
      
      history.push({
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        systemId,
        result,
        timestamp: new Date().toISOString()
      })

      // الاحتفاظ بآخر 100 عملية مزامنة فقط
      if (history.length > 100) {
        history.splice(0, history.length - 100)
      }

      await asyncStorage.setItem(this.STORAGE_KEYS.SYNC_HISTORY, history)
    } catch (error) {
      console.error('خطأ في حفظ تاريخ المزامنة:', error)
    }
  }

  /**
   * جلب تاريخ المزامنة
   */
  async getSyncHistory(limit = 20): Promise<any[]> {
    try {
      const history = await asyncStorage.getItem(this.STORAGE_KEYS.SYNC_HISTORY) || []
      return history.slice(-limit).reverse()
    } catch (error) {
      console.error('خطأ في جلب تاريخ المزامنة:', error)
      return []
    }
  }

  /**
   * اختبار الاتصال بالنظام
   */
  async testConnection(systemType: 'tender' | 'financial', systemId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (systemType === 'tender') {
        const systems = await this.getTenderSystems()
        const system = systems.find(s => s.id === systemId)
        if (!system) {
          return { success: false, message: 'النظام غير موجود' }
        }
        
        // محاكاة اختبار الاتصال
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { success: true, message: 'تم الاتصال بنجاح' }
      } else {
        const systems = await this.getFinancialSystems()
        const system = systems.find(s => s.id === systemId)
        if (!system) {
          return { success: false, message: 'النظام غير موجود' }
        }
        
        // محاكاة اختبار الاتصال
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { success: true, message: 'تم الاتصال بنجاح' }
      }
    } catch (error) {
      return { success: false, message: `فشل في الاتصال: ${error}` }
    }
  }
}

export const systemIntegrationService = new SystemIntegrationService()
