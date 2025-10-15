/**
 * خدمة إدارة الموردين
 * Supplier Management Service
 * 
 * تدير جميع عمليات الموردين والعقود وتقييم الأداء
 * Manages all supplier operations, contracts, and performance evaluation
 */

import { asyncStorage } from '../utils/storage'

// ===========================
// 📊 Types & Interfaces
// ===========================

export interface Supplier {
  id: string
  name: string
  nameEn?: string
  category: string
  contactPerson: string
  email: string
  phone: string
  address: string
  taxNumber?: string
  commercialRegister?: string
  
  // معلومات مالية
  paymentTerms: string // مثل "30 يوم"
  creditLimit: number
  currentBalance: number
  totalPurchases: number
  
  // تقييم الأداء
  rating: number // من 1 إلى 5
  qualityScore: number // من 1 إلى 100
  deliveryScore: number // من 1 إلى 100
  serviceScore: number // من 1 إلى 100
  
  // حالة المورد
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  
  // تواريخ
  registrationDate: string
  lastTransactionDate?: string
  lastEvaluationDate?: string
  
  // معلومات إضافية
  notes?: string
  documents?: SupplierDocument[]
  contracts?: SupplierContract[]
  
  createdAt: string
  updatedAt: string
}

export interface SupplierDocument {
  id: string
  type: 'commercial_register' | 'tax_certificate' | 'quality_certificate' | 'insurance' | 'other'
  name: string
  url?: string
  expiryDate?: string
  uploadedAt: string
}

export interface SupplierContract {
  id: string
  supplierId: string
  contractNumber: string
  title: string
  description?: string
  
  // تفاصيل العقد
  startDate: string
  endDate: string
  value: number
  currency: string
  
  // شروط العقد
  paymentTerms: string
  deliveryTerms: string
  qualityStandards?: string
  penaltyClause?: string
  
  // حالة العقد
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed'
  
  // مرفقات
  documents?: SupplierDocument[]
  
  createdAt: string
  updatedAt: string
}

export interface SupplierEvaluation {
  id: string
  supplierId: string
  evaluationDate: string
  evaluatedBy: string
  
  // معايير التقييم
  qualityScore: number // جودة المنتجات/الخدمات
  deliveryScore: number // الالتزام بمواعيد التسليم
  serviceScore: number // جودة خدمة العملاء
  priceScore: number // تنافسية الأسعار
  complianceScore: number // الالتزام بالشروط
  
  // التقييم الإجمالي
  overallRating: number
  
  // ملاحظات وتوصيات
  strengths?: string[]
  weaknesses?: string[]
  recommendations?: string[]
  notes?: string
  
  // إجراءات متابعة
  followUpActions?: string[]
  nextEvaluationDate?: string
  
  createdAt: string
  updatedAt: string
}

export interface SupplierPerformanceMetrics {
  supplierId: string
  period: string // مثل "2024-Q1"
  
  // مؤشرات الأداء
  totalOrders: number
  completedOrders: number
  onTimeDeliveries: number
  qualityIssues: number
  
  // معدلات الأداء
  completionRate: number // نسبة إكمال الطلبات
  onTimeDeliveryRate: number // نسبة التسليم في الوقت
  qualityRate: number // نسبة الجودة
  
  // مؤشرات مالية
  totalValue: number
  averageOrderValue: number
  paymentDelays: number
  
  calculatedAt: string
}

// ===========================
// 🔧 Storage Keys
// ===========================

const STORAGE_KEYS = {
  SUPPLIERS: 'supplier_management_suppliers',
  CONTRACTS: 'supplier_management_contracts',
  EVALUATIONS: 'supplier_management_evaluations',
  PERFORMANCE_METRICS: 'supplier_management_performance'
} as const

// ===========================
// 💼 Supplier Management Service
// ===========================

export class SupplierManagementService {
  
  /**
   * الحصول على جميع الموردين
   */
  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      return await asyncStorage.getItem(STORAGE_KEYS.SUPPLIERS, [])
    } catch (error) {
      console.error('خطأ في جلب الموردين:', error)
      return []
    }
  }

  /**
   * الحصول على مورد بالمعرف
   */
  async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const suppliers = await this.getAllSuppliers()
      return suppliers.find(supplier => supplier.id === id) ?? null
    } catch (error) {
      console.error('خطأ في جلب المورد:', error)
      return null
    }
  }

  /**
   * إنشاء مورد جديد
   */
  async createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    try {
      const suppliers = await this.getAllSuppliers()
      
      // Generate collision-resistant ID
      let newId = ''
      let isUnique = false
      let attempts = 0
      const maxAttempts = 10
      
      while (!isUnique && attempts < maxAttempts) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          // Use crypto.randomUUID() when available
          newId = `supplier_${crypto.randomUUID()}`
        } else {
          // Fallback: Date.now() + secure random suffix
          const timestamp = Date.now()
          const randomSuffix = Math.random().toString(36).substring(2, 15) + 
                              Math.random().toString(36).substring(2, 15)
          newId = `supplier_${timestamp}_${randomSuffix}`
        }
        
        // Verify uniqueness against existing suppliers
        isUnique = !suppliers.some(s => s.id === newId)
        attempts++
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique supplier ID after maximum attempts')
      }
      
      const supplier: Supplier = {
        ...data,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      suppliers.push(supplier)
      await asyncStorage.setItem(STORAGE_KEYS.SUPPLIERS, suppliers)

      return supplier
    } catch (error) {
      throw new Error(`فشل في إنشاء المورد: ${error}`)
    }
  }

  /**
   * تحديث مورد
   */
  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const suppliers = await this.getAllSuppliers()
    const index = suppliers.findIndex(supplier => supplier.id === id)
    
    if (index === -1) {
      throw new Error('المورد غير موجود')
    }

    suppliers[index] = {
      ...suppliers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    await asyncStorage.setItem(STORAGE_KEYS.SUPPLIERS, suppliers)
    return suppliers[index]
  }

  /**
   * حذف مورد
   */
  async deleteSupplier(id: string): Promise<boolean> {
    try {
      const suppliers = await this.getAllSuppliers()
      const filteredSuppliers = suppliers.filter(supplier => supplier.id !== id)
      
      if (filteredSuppliers.length === suppliers.length) {
        // المورد غير موجود - عودة false كنتيجة عادية
        return false
      }

      await asyncStorage.setItem(STORAGE_KEYS.SUPPLIERS, filteredSuppliers)
      return true
    } catch (error) {
      console.error('خطأ في حذف المورد:', error)
      return false
    }
  }

  /**
   * البحث في الموردين
   */
  async searchSuppliers(query: string): Promise<Supplier[]> {
    try {
      const suppliers = await this.getAllSuppliers()
      const searchTerm = query.toLowerCase()
      
      return suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm) ||
        (supplier.nameEn?.toLowerCase().includes(searchTerm) ?? false) ||
        supplier.category.toLowerCase().includes(searchTerm) ||
        supplier.contactPerson.toLowerCase().includes(searchTerm) ||
        supplier.email.toLowerCase().includes(searchTerm)
      )
    } catch (error) {
      console.error('خطأ في البحث:', error)
      return []
    }
  }

  /**
   * تصفية الموردين حسب الفئة
   */
  async getSuppliersByCategory(category: string): Promise<Supplier[]> {
    try {
      const suppliers = await this.getAllSuppliers()
      return suppliers.filter(supplier => supplier.category === category)
    } catch (error) {
      console.error('خطأ في تصفية الموردين:', error)
      return []
    }
  }

  /**
   * تصفية الموردين حسب الحالة
   */
  async getSuppliersByStatus(status: Supplier['status']): Promise<Supplier[]> {
    try {
      const suppliers = await this.getAllSuppliers()
      return suppliers.filter(supplier => supplier.status === status)
    } catch (error) {
      console.error('خطأ في تصفية الموردين:', error)
      return []
    }
  }

  /**
   * الحصول على أفضل الموردين حسب التقييم
   */
  async getTopRatedSuppliers(limit = 10): Promise<Supplier[]> {
    try {
      const suppliers = await this.getAllSuppliers()
      return suppliers
        .filter(supplier => supplier.status === 'active')
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit)
    } catch (error) {
      console.error('خطأ في جلب أفضل الموردين:', error)
      return []
    }
  }

  /**
   * حساب إحصائيات الموردين
   */
  async getSupplierStatistics(): Promise<{
    total: number
    active: number
    inactive: number
    suspended: number
    averageRating: number
    totalPurchases: number
    categoriesCount: number
  }> {
    try {
      const suppliers = await this.getAllSuppliers()
      
      const total = suppliers.length
      const active = suppliers.filter(s => s.status === 'active').length
      const inactive = suppliers.filter(s => s.status === 'inactive').length
      const suspended = suppliers.filter(s => s.status === 'suspended').length
      
      const averageRating = suppliers.length > 0 
        ? suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length 
        : 0
      
      const totalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0)
      
      const categories = new Set(suppliers.map(s => s.category))
      const categoriesCount = categories.size

      return {
        total,
        active,
        inactive,
        suspended,
        averageRating,
        totalPurchases,
        categoriesCount
      }
    } catch (error) {
      console.error('خطأ في حساب الإحصائيات:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        averageRating: 0,
        totalPurchases: 0,
        categoriesCount: 0
      }
    }
  }

  // ===========================
  // 📋 Contract Management
  // ===========================

  // الحصول على جميع العقود
  async getAllContracts(): Promise<SupplierContract[]> {
    try {
      const contracts = await asyncStorage.getItem(STORAGE_KEYS.CONTRACTS, [])
      return contracts
    } catch (error) {
      console.error('خطأ في تحميل العقود:', error)
      return []
    }
  }

  // الحصول على عقد بالمعرف
  async getContractById(id: string): Promise<SupplierContract | null> {
    try {
      const contracts = await this.getAllContracts()
      return contracts.find(contract => contract.id === id) ?? null
    } catch (error) {
      console.error('خطأ في تحميل العقد:', error)
      return null
    }
  }

  // إنشاء عقد جديد
  async createContract(contractData: SupplierContract): Promise<SupplierContract> {
    try {
      const contracts = await this.getAllContracts()
      
      let finalId: string
      
      // If caller provided an id, validate it's unique
      if (contractData.id) {
        if (contracts.some(c => c.id === contractData.id)) {
          throw new Error(`Contract ID '${contractData.id}' already exists`)
        }
        finalId = contractData.id
      } else {
        // Generate collision-resistant ID
        let newId = ''
        let isUnique = false
        let attempts = 0
        const maxAttempts = 10
        
        while (!isUnique && attempts < maxAttempts) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            // Use crypto.randomUUID() when available
            newId = `contract_${crypto.randomUUID()}`
          } else {
            // Fallback: Date.now() + secure random suffix
            const timestamp = Date.now()
            const randomSuffix = Math.random().toString(36).substring(2, 15) + 
                                Math.random().toString(36).substring(2, 15)
            newId = `contract_${timestamp}_${randomSuffix}`
          }
          
          // Verify uniqueness
          isUnique = !contracts.some(c => c.id === newId)
          attempts++
        }
        
        if (!isUnique) {
          throw new Error('Failed to generate unique contract ID after maximum attempts')
        }
        
        finalId = newId
      }
      
      const newContract: SupplierContract = {
        ...contractData,
        id: finalId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      contracts.push(newContract)
      await asyncStorage.setItem(STORAGE_KEYS.CONTRACTS, contracts)

      return newContract
    } catch (error) {
      console.error('خطأ في إنشاء العقد:', error)
      throw error
    }
  }

  // تحديث عقد
  async updateContract(id: string, updates: Partial<SupplierContract>): Promise<SupplierContract> {
    const contracts = await this.getAllContracts()
    const contractIndex = contracts.findIndex(contract => contract.id === id)

    if (contractIndex === -1) {
      throw new Error('العقد غير موجود')
    }

    const updatedContract = {
      ...contracts[contractIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    contracts[contractIndex] = updatedContract
    await asyncStorage.setItem(STORAGE_KEYS.CONTRACTS, contracts)

    return updatedContract
  }

  // حذف عقد
  async deleteContract(id: string): Promise<void> {
    try {
      const contracts = await this.getAllContracts()
      const filteredContracts = contracts.filter(contract => contract.id !== id)
      await asyncStorage.setItem(STORAGE_KEYS.CONTRACTS, filteredContracts)
    } catch (error) {
      console.error('خطأ في حذف العقد:', error)
      throw error
    }
  }

  // الحصول على عقود مورد معين
  async getContractsBySupplier(supplierId: string): Promise<SupplierContract[]> {
    try {
      const contracts = await this.getAllContracts()
      return contracts.filter(contract => contract.supplierId === supplierId)
    } catch (error) {
      console.error('خطأ في تحميل عقود المورد:', error)
      return []
    }
  }

  // الحصول على العقود المنتهية قريباً
  async getExpiringContracts(daysAhead = 30): Promise<SupplierContract[]> {
    try {
      const contracts = await this.getAllContracts()
      const today = new Date()
      const futureDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000))

      return contracts.filter(contract => {
        const endDate = new Date(contract.endDate)
        return endDate >= today && endDate <= futureDate && contract.status === 'active'
      })
    } catch (error) {
      console.error('خطأ في تحميل العقود المنتهية قريباً:', error)
      return []
    }
  }

  // البحث في العقود
  async searchContracts(query: string): Promise<SupplierContract[]> {
    try {
      const contracts = await this.getAllContracts()
      const suppliers = await this.getAllSuppliers()

      const lowerQuery = query.toLowerCase()

      return contracts.filter(contract => {
        const supplier = suppliers.find(s => s.id === contract.supplierId)
        return (
          contract.title.toLowerCase().includes(lowerQuery) ||
          contract.contractNumber.toLowerCase().includes(lowerQuery) ||
          (contract.description?.toLowerCase().includes(lowerQuery) ?? false) ||
          (supplier?.name.toLowerCase().includes(lowerQuery) ?? false)
        )
      })
    } catch (error) {
      console.error('خطأ في البحث في العقود:', error)
      return []
    }
  }

  // فلترة العقود حسب الحالة
  async getContractsByStatus(status: SupplierContract['status']): Promise<SupplierContract[]> {
    try {
      const contracts = await this.getAllContracts()
      return contracts.filter(contract => contract.status === status)
    } catch (error) {
      console.error('خطأ في فلترة العقود:', error)
      return []
    }
  }

  // ===========================
  // 📊 Evaluation Management
  // ===========================

  // الحصول على جميع التقييمات
  async getAllEvaluations(): Promise<SupplierEvaluation[]> {
    try {
      const evaluations = await asyncStorage.getItem(STORAGE_KEYS.EVALUATIONS, [])
      return evaluations
    } catch (error) {
      console.error('خطأ في تحميل التقييمات:', error)
      return []
    }
  }

  // الحصول على تقييم بالمعرف
  async getEvaluationById(id: string): Promise<SupplierEvaluation | null> {
    try {
      const evaluations = await this.getAllEvaluations()
      return evaluations.find(evaluation => evaluation.id === id) ?? null
    } catch (error) {
      console.error('خطأ في تحميل التقييم:', error)
      return null
    }
  }

  // إنشاء تقييم جديد
  async createEvaluation(evaluationData: SupplierEvaluation): Promise<SupplierEvaluation> {
    try {
      const evaluations = await this.getAllEvaluations()
      
      let finalId: string
      
      // If caller provided an id, validate it's unique
      if (evaluationData.id) {
        if (evaluations.some(e => e.id === evaluationData.id)) {
          throw new Error(`Evaluation ID '${evaluationData.id}' already exists`)
        }
        finalId = evaluationData.id
      } else {
        // Generate collision-resistant ID
        let newId = ''
        let isUnique = false
        let attempts = 0
        const maxAttempts = 10
        
        while (!isUnique && attempts < maxAttempts) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            // Use crypto.randomUUID() when available
            newId = `eval_${crypto.randomUUID()}`
          } else {
            // Fallback: Date.now() + secure random suffix
            const timestamp = Date.now()
            const randomSuffix = Math.random().toString(36).substring(2, 15) + 
                                Math.random().toString(36).substring(2, 15)
            newId = `eval_${timestamp}_${randomSuffix}`
          }
          
          // Verify uniqueness against existing evaluations
          isUnique = !evaluations.some(e => e.id === newId)
          attempts++
        }
        
        if (!isUnique) {
          throw new Error('Failed to generate unique evaluation ID after maximum attempts')
        }
        
        finalId = newId
      }
      
      const newEvaluation: SupplierEvaluation = {
        ...evaluationData,
        id: finalId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      evaluations.push(newEvaluation)
      await asyncStorage.setItem(STORAGE_KEYS.EVALUATIONS, evaluations)

      // تحديث تقييم المورد
      await this.updateSupplierRating(evaluationData.supplierId)

      return newEvaluation
    } catch (error) {
      console.error('خطأ في إنشاء التقييم:', error)
      throw error
    }
  }

  // تحديث تقييم
  async updateEvaluation(id: string, updates: Partial<SupplierEvaluation>): Promise<SupplierEvaluation> {
    const evaluations = await this.getAllEvaluations()
    const evaluationIndex = evaluations.findIndex(evaluation => evaluation.id === id)

    if (evaluationIndex === -1) {
      throw new Error('التقييم غير موجود')
    }

    const updatedEvaluation = {
      ...evaluations[evaluationIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    evaluations[evaluationIndex] = updatedEvaluation
    await asyncStorage.setItem(STORAGE_KEYS.EVALUATIONS, evaluations)

    // تحديث تقييم المورد
    await this.updateSupplierRating(updatedEvaluation.supplierId)

    return updatedEvaluation
  }

  // حذف تقييم
  async deleteEvaluation(id: string): Promise<boolean> {
    try {
      const evaluations = await this.getAllEvaluations()
      const evaluation = evaluations.find(e => e.id === id)
      
      if (!evaluation) {
        // التقييم غير موجود - عودة false كنتيجة عادية
        return false
      }
      
      const filteredEvaluations = evaluations.filter(e => e.id !== id)
      await asyncStorage.setItem(STORAGE_KEYS.EVALUATIONS, filteredEvaluations)

      // تحديث تقييم المورد
      await this.updateSupplierRating(evaluation.supplierId)
      
      return true
    } catch (error) {
      console.error('خطأ في حذف التقييم:', error)
      return false
    }
  }

  // الحصول على تقييمات مورد معين
  async getEvaluationsBySupplier(supplierId: string): Promise<SupplierEvaluation[]> {
    try {
      const evaluations = await this.getAllEvaluations()
      return evaluations.filter(evaluation => evaluation.supplierId === supplierId)
    } catch (error) {
      console.error('خطأ في تحميل تقييمات المورد:', error)
      return []
    }
  }

  // تحديث تقييم المورد بناءً على التقييمات
  private async updateSupplierRating(supplierId: string): Promise<void> {
    try {
      const evaluations = await this.getEvaluationsBySupplier(supplierId)

      if (evaluations.length === 0) return

      const totalRating = evaluations.reduce((sum, e) => sum + e.overallRating, 0)
      const averageRating = totalRating / evaluations.length

      const totalQuality = evaluations.reduce((sum, e) => sum + e.qualityScore, 0)
      const averageQuality = totalQuality / evaluations.length

      const totalDelivery = evaluations.reduce((sum, e) => sum + e.deliveryScore, 0)
      const averageDelivery = totalDelivery / evaluations.length

      const totalService = evaluations.reduce((sum, e) => sum + e.serviceScore, 0)
      const averageService = totalService / evaluations.length

      await this.updateSupplier(supplierId, {
        rating: averageRating,
        qualityScore: averageQuality,
        deliveryScore: averageDelivery,
        serviceScore: averageService,
        lastEvaluationDate: new Date().toISOString()
      })
    } catch (error) {
      console.error('خطأ في تحديث تقييم المورد:', error)
    }
  }
}

// إنشاء نسخة واحدة من الخدمة
export const supplierManagementService = new SupplierManagementService()
export default supplierManagementService
