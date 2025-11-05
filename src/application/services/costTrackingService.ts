/**
 * Cost Tracking Service
 * خدمة تتبع التكاليف
 */

import { CostTrackingEntry } from '../types/evm'
import { safeLocalStorage } from '../utils/storage'

export class CostTrackingService {
  private readonly STORAGE_KEY = 'cost_tracking_entries'

  constructor() {
    this.initializeDefaultData()
  }

  /**
   * تهيئة البيانات الافتراضية
   */
  private initializeDefaultData(): void {
    const existingEntries = safeLocalStorage.getItem(this.STORAGE_KEY)
    if (!existingEntries) {
      const defaultEntries: CostTrackingEntry[] = []
      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultEntries))
    }
  }

  /**
   * الحصول على جميع إدخالات التكلفة
   */
  async getAllCostEntries(projectId?: string): Promise<CostTrackingEntry[]> {
    try {
      const entriesData = safeLocalStorage.getItem(this.STORAGE_KEY)
      let entries: CostTrackingEntry[] = entriesData ? JSON.parse(entriesData) : []

      if (projectId) {
        entries = entries.filter(entry => entry.projectId === projectId)
      }

      return entries.sort((a, b) => new Date(b.incurredDate).getTime() - new Date(a.incurredDate).getTime())
    } catch (error) {
      console.error('خطأ في الحصول على إدخالات التكلفة:', error)
      throw new Error('فشل في تحميل إدخالات التكلفة')
    }
  }

  /**
   * الحصول على إدخال تكلفة بالمعرف
   */
  async getCostEntryById(id: string): Promise<CostTrackingEntry | null> {
    try {
      const entries = await this.getAllCostEntries()
      return entries.find(entry => entry.id === id) || null
    } catch (error) {
      console.error('خطأ في الحصول على إدخال التكلفة:', error)
      throw new Error('فشل في تحميل إدخال التكلفة')
    }
  }

  /**
   * إنشاء إدخال تكلفة جديد
   */
  async createCostEntry(entry: Omit<CostTrackingEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<CostTrackingEntry> {
    try {
      const entries = await this.getAllCostEntries()
      
      const newEntry: CostTrackingEntry = {
        ...entry,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      entries.push(newEntry)
      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries))

      return newEntry
    } catch (error) {
      console.error('خطأ في إنشاء إدخال التكلفة:', error)
      throw new Error('فشل في إنشاء إدخال التكلفة')
    }
  }

  /**
   * تحديث إدخال تكلفة
   */
  async updateCostEntry(
    id: string, 
    updates: Partial<Omit<CostTrackingEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<CostTrackingEntry> {
    try {
      const entries = await this.getAllCostEntries()
      const entryIndex = entries.findIndex(entry => entry.id === id)
      
      if (entryIndex === -1) {
        throw new Error('إدخال التكلفة غير موجود')
      }

      const updatedEntry: CostTrackingEntry = {
        ...entries[entryIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      entries[entryIndex] = updatedEntry
      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries))

      return updatedEntry
    } catch (error) {
      console.error('خطأ في تحديث إدخال التكلفة:', error)
      throw error
    }
  }

  /**
   * حذف إدخال تكلفة
   */
  async deleteCostEntry(id: string): Promise<void> {
    try {
      const entries = await this.getAllCostEntries()
      const filteredEntries = entries.filter(entry => entry.id !== id)
      
      if (filteredEntries.length === entries.length) {
        throw new Error('إدخال التكلفة غير موجود')
      }

      safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredEntries))
    } catch (error) {
      console.error('خطأ في حذف إدخال التكلفة:', error)
      throw error
    }
  }

  /**
   * الحصول على إدخالات التكلفة حسب المهمة
   */
  async getCostEntriesByTask(taskId: string): Promise<CostTrackingEntry[]> {
    try {
      const entries = await this.getAllCostEntries()
      return entries.filter(entry => entry.taskId === taskId)
    } catch (error) {
      console.error('خطأ في الحصول على إدخالات تكلفة المهمة:', error)
      throw new Error('فشل في تحميل إدخالات تكلفة المهمة')
    }
  }

  /**
   * الحصول على إدخالات التكلفة حسب الفئة
   */
  async getCostEntriesByCategory(
    projectId: string, 
    category: CostTrackingEntry['category']
  ): Promise<CostTrackingEntry[]> {
    try {
      const entries = await this.getAllCostEntries(projectId)
      return entries.filter(entry => entry.category === category)
    } catch (error) {
      console.error('خطأ في الحصول على إدخالات التكلفة حسب الفئة:', error)
      throw new Error('فشل في تحميل إدخالات التكلفة حسب الفئة')
    }
  }

  /**
   * الحصول على إجمالي التكلفة للمشروع
   */
  async getProjectTotalCost(projectId: string): Promise<{
    totalCost: number
    approvedCost: number
    pendingCost: number
    costByCategory: Record<CostTrackingEntry['category'], number>
  }> {
    try {
      const entries = await this.getAllCostEntries(projectId)
      
      const totalCost = entries.reduce((sum, entry) => sum + entry.amount, 0)
      const approvedCost = entries
        .filter(entry => entry.status === 'approved')
        .reduce((sum, entry) => sum + entry.amount, 0)
      const pendingCost = entries
        .filter(entry => entry.status === 'submitted')
        .reduce((sum, entry) => sum + entry.amount, 0)

      const costByCategory: Record<CostTrackingEntry['category'], number> = {
        labor: 0,
        material: 0,
        equipment: 0,
        subcontractor: 0,
        overhead: 0,
        other: 0
      }

      entries.forEach(entry => {
        if (entry.status === 'approved') {
          costByCategory[entry.category] += entry.amount
        }
      })

      return {
        totalCost,
        approvedCost,
        pendingCost,
        costByCategory
      }
    } catch (error) {
      console.error('خطأ في حساب إجمالي تكلفة المشروع:', error)
      throw new Error('فشل في حساب إجمالي تكلفة المشروع')
    }
  }

  /**
   * الحصول على إدخالات التكلفة في فترة زمنية
   */
  async getCostEntriesByDateRange(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<CostTrackingEntry[]> {
    try {
      const entries = await this.getAllCostEntries(projectId)
      const start = new Date(startDate)
      const end = new Date(endDate)

      return entries.filter(entry => {
        const entryDate = new Date(entry.incurredDate)
        return entryDate >= start && entryDate <= end
      })
    } catch (error) {
      console.error('خطأ في الحصول على إدخالات التكلفة في الفترة الزمنية:', error)
      throw new Error('فشل في تحميل إدخالات التكلفة في الفترة الزمنية')
    }
  }

  /**
   * الحصول على تحليل التكلفة الشهري
   */
  async getMonthlyCostAnalysis(projectId: string, year: number): Promise<{
    month: string
    totalCost: number
    costByCategory: Record<CostTrackingEntry['category'], number>
  }[]> {
    try {
      const entries = await this.getAllCostEntries(projectId)
      const monthlyData: Record<string, any> = {}

      entries
        .filter(entry => entry.status === 'approved')
        .forEach(entry => {
          const date = new Date(entry.incurredDate)
          if (date.getFullYear() === year) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                month: monthKey,
                totalCost: 0,
                costByCategory: {
                  labor: 0,
                  material: 0,
                  equipment: 0,
                  subcontractor: 0,
                  overhead: 0,
                  other: 0
                }
              }
            }

            monthlyData[monthKey].totalCost += entry.amount
            monthlyData[monthKey].costByCategory[entry.category] += entry.amount
          }
        })

      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
    } catch (error) {
      console.error('خطأ في تحليل التكلفة الشهري:', error)
      throw new Error('فشل في تحليل التكلفة الشهري')
    }
  }

  /**
   * الموافقة على إدخال تكلفة
   */
  async approveCostEntry(id: string, approvedBy: string): Promise<CostTrackingEntry> {
    try {
      return await this.updateCostEntry(id, {
        status: 'approved',
        approvedBy,
        approvedDate: new Date().toISOString()
      })
    } catch (error) {
      console.error('خطأ في الموافقة على إدخال التكلفة:', error)
      throw new Error('فشل في الموافقة على إدخال التكلفة')
    }
  }

  /**
   * رفض إدخال تكلفة
   */
  async rejectCostEntry(id: string, reason: string): Promise<CostTrackingEntry> {
    try {
      return await this.updateCostEntry(id, {
        status: 'rejected',
        notes: reason
      })
    } catch (error) {
      console.error('خطأ في رفض إدخال التكلفة:', error)
      throw new Error('فشل في رفض إدخال التكلفة')
    }
  }

  /**
   * البحث في إدخالات التكلفة
   */
  async searchCostEntries(
    projectId: string,
    query: string,
    filters?: {
      category?: CostTrackingEntry['category']
      status?: CostTrackingEntry['status']
      startDate?: string
      endDate?: string
    }
  ): Promise<CostTrackingEntry[]> {
    try {
      let entries = await this.getAllCostEntries(projectId)

      // تطبيق البحث النصي
      if (query.trim()) {
        const searchLower = query.toLowerCase()
        entries = entries.filter(entry =>
          entry.description.toLowerCase().includes(searchLower) ||
          entry.budgetCode?.toLowerCase().includes(searchLower) ||
          entry.costCenter?.toLowerCase().includes(searchLower)
        )
      }

      // تطبيق الفلاتر
      if (filters) {
        if (filters.category) {
          entries = entries.filter(entry => entry.category === filters.category)
        }
        if (filters.status) {
          entries = entries.filter(entry => entry.status === filters.status)
        }
        if (filters.startDate) {
          entries = entries.filter(entry => entry.incurredDate >= filters.startDate!)
        }
        if (filters.endDate) {
          entries = entries.filter(entry => entry.incurredDate <= filters.endDate!)
        }
      }

      return entries
    } catch (error) {
      console.error('خطأ في البحث في إدخالات التكلفة:', error)
      throw new Error('فشل في البحث في إدخالات التكلفة')
    }
  }

  /**
   * تصدير إدخالات التكلفة
   */
  async exportCostEntries(
    projectId: string,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<string> {
    try {
      const entries = await this.getAllCostEntries(projectId)
      
      if (format === 'csv') {
        return this.generateCSV(entries)
      } else {
        // تنفيذ تصدير Excel لاحقاً
        throw new Error('تصدير Excel غير مدعوم حالياً')
      }
    } catch (error) {
      console.error('خطأ في تصدير إدخالات التكلفة:', error)
      throw new Error('فشل في تصدير إدخالات التكلفة')
    }
  }

  /**
   * توليد ملف CSV
   */
  private generateCSV(entries: CostTrackingEntry[]): string {
    const headers = [
      'التاريخ',
      'الوصف',
      'الفئة',
      'المبلغ',
      'العملة',
      'الحالة',
      'رمز الميزانية',
      'مركز التكلفة'
    ]

    const rows = entries.map(entry => [
      entry.incurredDate,
      entry.description,
      this.getCategoryLabel(entry.category),
      entry.amount.toString(),
      entry.currency,
      this.getStatusLabel(entry.status),
      entry.budgetCode || '',
      entry.costCenter || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return csvContent
  }

  /**
   * الحصول على تسمية الفئة
   */
  private getCategoryLabel(category: CostTrackingEntry['category']): string {
    const labels = {
      labor: 'عمالة',
      material: 'مواد',
      equipment: 'معدات',
      subcontractor: 'مقاولين فرعيين',
      overhead: 'مصاريف عامة',
      other: 'أخرى'
    }
    return labels[category]
  }

  /**
   * الحصول على تسمية الحالة
   */
  private getStatusLabel(status: CostTrackingEntry['status']): string {
    const labels = {
      draft: 'مسودة',
      submitted: 'مقدم',
      approved: 'موافق عليه',
      rejected: 'مرفوض'
    }
    return labels[status]
  }

  /**
   * توليد معرف فريد
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export const costTrackingService = new CostTrackingService()
