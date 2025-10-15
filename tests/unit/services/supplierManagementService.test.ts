/**
 * اختبارات وحدة خدمة إدارة الموردين
 * Supplier Management Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { supplierManagementService, type Supplier } from '../../../src/services/supplierManagementService'
import { asyncStorage } from '../../../src/utils/storage'

// Mock storage
vi.mock('../../../src/utils/storage', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

// Mock data
const mockSuppliers: Supplier[] = [
  {
    id: 'supplier1',
    name: 'شركة الرياض للمواد',
    nameEn: 'Riyadh Materials Company',
    category: 'مواد البناء',
    contactPerson: 'أحمد محمد',
    email: 'ahmed@riyadh-materials.com',
    phone: '+966501234567',
    address: 'الرياض، المملكة العربية السعودية',
    taxNumber: '123456789',
    commercialRegister: 'CR123456',
    paymentTerms: '30 يوم',
    creditLimit: 500000,
    currentBalance: 0,
    totalPurchases: 1500000,
    rating: 4.5,
    qualityScore: 85,
    deliveryScore: 90,
    serviceScore: 88,
    status: 'active',
    approvalStatus: 'approved',
    registrationDate: '2024-01-01T00:00:00Z',
    lastTransactionDate: '2024-01-15T10:00:00Z',
    notes: 'مورد موثوق للمواد الأساسية',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'supplier2',
    name: 'شركة جدة للحديد',
    nameEn: 'Jeddah Steel Company',
    category: 'حديد ومعادن',
    contactPerson: 'فاطمة أحمد',
    email: 'fatima@jeddah-steel.com',
    phone: '+966507654321',
    address: 'جدة، المملكة العربية السعودية',
    taxNumber: '987654321',
    commercialRegister: 'CR987654',
    paymentTerms: '45 يوم',
    creditLimit: 750000,
    currentBalance: 25000,
    totalPurchases: 2200000,
    rating: 4.8,
    qualityScore: 92,
    deliveryScore: 95,
    serviceScore: 90,
    status: 'active',
    approvalStatus: 'approved',
    registrationDate: '2023-12-01T00:00:00Z',
    lastTransactionDate: '2024-01-20T14:00:00Z',
    notes: 'أفضل مورد للحديد والمعادن',
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z',
  },
  {
    id: 'supplier3',
    name: 'شركة الدمام للخرسانة',
    nameEn: 'Dammam Concrete Company',
    category: 'خرسانة',
    contactPerson: 'محمد علي',
    email: 'mohammed@dammam-concrete.com',
    phone: '+966509876543',
    address: 'الدمام، المملكة العربية السعودية',
    taxNumber: '456789123',
    commercialRegister: 'CR456789',
    paymentTerms: '15 يوم',
    creditLimit: 300000,
    currentBalance: 15000,
    totalPurchases: 800000,
    rating: 3.8,
    qualityScore: 75,
    deliveryScore: 80,
    serviceScore: 78,
    status: 'inactive',
    approvalStatus: 'approved',
    registrationDate: '2024-01-10T00:00:00Z',
    lastTransactionDate: '2024-01-12T09:00:00Z',
    notes: 'مورد محلي للخرسانة',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-12T09:00:00Z',
  },
]

describe('SupplierManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(asyncStorage.getItem).mockResolvedValue(mockSuppliers)
    vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllSuppliers', () => {
    it('يجب أن يجلب جميع الموردين بنجاح', async () => {
      const suppliers = await supplierManagementService.getAllSuppliers()

      expect(suppliers).toEqual(mockSuppliers)
      expect(asyncStorage.getItem).toHaveBeenCalledWith('supplier_management_suppliers')
    })

    it('يجب أن يعيد مصفوفة فارغة عند عدم وجود موردين', async () => {
      vi.mocked(asyncStorage.getItem).mockResolvedValue(null)

      const suppliers = await supplierManagementService.getAllSuppliers()

      expect(suppliers).toEqual([])
    })

    it('يجب أن يتعامل مع الأخطاء بشكل صحيح', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const suppliers = await supplierManagementService.getAllSuppliers()

      expect(suppliers).toEqual([])
    })
  })

  describe('getSupplierById', () => {
    it('يجب أن يجلب مورد بالمعرف بنجاح', async () => {
      const supplier = await supplierManagementService.getSupplierById('supplier1')

      expect(supplier).toEqual(mockSuppliers[0])
    })

    it('يجب أن يعيد null عند عدم وجود المورد', async () => {
      const supplier = await supplierManagementService.getSupplierById('nonexistent')

      expect(supplier).toBeNull()
    })

    it('يجب أن يتعامل مع الأخطاء بشكل صحيح', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const supplier = await supplierManagementService.getSupplierById('supplier1')

      expect(supplier).toBeNull()
    })
  })

  describe('createSupplier', () => {
    const newSupplierData = {
      name: 'شركة المدينة للأدوات',
      nameEn: 'Medina Tools Company',
      category: 'أدوات ومعدات',
      contactPerson: 'سارة محمد',
      email: 'sara@medina-tools.com',
      phone: '+966502345678',
      address: 'المدينة المنورة، المملكة العربية السعودية',
      taxNumber: '789123456',
      commercialRegister: 'CR789123',
      paymentTerms: '20 يوم',
      creditLimit: 200000,
      currentBalance: 0,
      totalPurchases: 0,
      rating: 5,
      qualityScore: 0,
      deliveryScore: 0,
      serviceScore: 0,
      status: 'active' as const,
      approvalStatus: 'approved' as const,
      registrationDate: '2024-01-25T00:00:00Z',
      notes: 'مورد جديد للأدوات',
    }

    it('يجب أن ينشئ مورد جديد بنجاح', async () => {
      const createdSupplier = await supplierManagementService.createSupplier(newSupplierData)

      expect(createdSupplier).toMatchObject(newSupplierData)
      expect(createdSupplier.id).toBeDefined()
      expect(createdSupplier.createdAt).toBeDefined()
      expect(createdSupplier.updatedAt).toBeDefined()
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'supplier_management_suppliers',
        expect.arrayContaining([...mockSuppliers, createdSupplier])
      )
    })

    it('يجب أن يتعامل مع أخطاء الإنشاء', async () => {
      vi.mocked(asyncStorage.setItem).mockRejectedValue(new Error('Storage error'))

      await expect(supplierManagementService.createSupplier(newSupplierData))
        .rejects.toThrow('فشل في إنشاء المورد')
    })
  })

  describe('updateSupplier', () => {
    const updates = {
      name: 'شركة الرياض للمواد المحدثة',
      rating: 4.7,
      notes: 'تم تحديث المعلومات',
    }

    it('يجب أن يحدث مورد موجود بنجاح', async () => {
      const updatedSupplier = await supplierManagementService.updateSupplier('supplier1', updates)

      expect(updatedSupplier).toMatchObject({
        ...mockSuppliers[0],
        ...updates,
      })
      expect(updatedSupplier?.updatedAt).toBeDefined()
      expect(asyncStorage.setItem).toHaveBeenCalled()
    })

    it('يجب أن يعيد null عند عدم وجود المورد', async () => {
      const updatedSupplier = await supplierManagementService.updateSupplier('nonexistent', updates)

      expect(updatedSupplier).toBeNull()
    })

    it('يجب أن يتعامل مع أخطاء التحديث', async () => {
      vi.mocked(asyncStorage.setItem).mockRejectedValue(new Error('Storage error'))

      const updatedSupplier = await supplierManagementService.updateSupplier('supplier1', updates)

      expect(updatedSupplier).toBeNull()
    })
  })

  describe('deleteSupplier', () => {
    it('يجب أن يحذف مورد موجود بنجاح', async () => {
      const result = await supplierManagementService.deleteSupplier('supplier1')

      expect(result).toBe(true)
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        'supplier_management_suppliers',
        expect.arrayContaining([mockSuppliers[1], mockSuppliers[2]])
      )
    })

    it('يجب أن يعيد false عند عدم وجود المورد', async () => {
      const result = await supplierManagementService.deleteSupplier('nonexistent')

      expect(result).toBe(false)
    })

    it('يجب أن يتعامل مع أخطاء الحذف', async () => {
      vi.mocked(asyncStorage.setItem).mockRejectedValue(new Error('Storage error'))

      const result = await supplierManagementService.deleteSupplier('supplier1')

      expect(result).toBe(false)
    })
  })

  describe('searchSuppliers', () => {
    it('يجب أن يبحث في أسماء الموردين', async () => {
      const results = await supplierManagementService.searchSuppliers('الرياض')

      expect(results).toHaveLength(1)
      expect(results[0].name).toContain('الرياض')
    })

    it('يجب أن يبحث في الأسماء الإنجليزية', async () => {
      const results = await supplierManagementService.searchSuppliers('Steel')

      expect(results).toHaveLength(1)
      expect(results[0].nameEn).toContain('Steel')
    })

    it('يجب أن يبحث في الفئات', async () => {
      const results = await supplierManagementService.searchSuppliers('مواد البناء')

      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('مواد البناء')
    })

    it('يجب أن يبحث في أسماء الأشخاص المسؤولين', async () => {
      const results = await supplierManagementService.searchSuppliers('أحمد')

      expect(results).toHaveLength(1)
      expect(results[0].contactPerson).toContain('أحمد')
    })

    it('يجب أن يبحث في عناوين البريد الإلكتروني', async () => {
      const results = await supplierManagementService.searchSuppliers('jeddah-steel')

      expect(results).toHaveLength(1)
      expect(results[0].email).toContain('jeddah-steel')
    })

    it('يجب أن يعيد مصفوفة فارغة عند عدم وجود نتائج', async () => {
      const results = await supplierManagementService.searchSuppliers('غير موجود')

      expect(results).toHaveLength(0)
    })

    it('يجب أن يتعامل مع أخطاء البحث', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const results = await supplierManagementService.searchSuppliers('الرياض')

      expect(results).toEqual([])
    })
  })

  describe('getSuppliersByCategory', () => {
    it('يجب أن يصفي الموردين بالفئة', async () => {
      const results = await supplierManagementService.getSuppliersByCategory('مواد البناء')

      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('مواد البناء')
    })

    it('يجب أن يعيد مصفوفة فارغة للفئة غير الموجودة', async () => {
      const results = await supplierManagementService.getSuppliersByCategory('فئة غير موجودة')

      expect(results).toHaveLength(0)
    })
  })

  describe('getSuppliersByStatus', () => {
    it('يجب أن يصفي الموردين بالحالة النشطة', async () => {
      const results = await supplierManagementService.getSuppliersByStatus('active')

      expect(results).toHaveLength(2)
      expect(results.every(s => s.status === 'active')).toBe(true)
    })

    it('يجب أن يصفي الموردين بالحالة غير النشطة', async () => {
      const results = await supplierManagementService.getSuppliersByStatus('inactive')

      expect(results).toHaveLength(1)
      expect(results[0].status).toBe('inactive')
    })
  })

  describe('getTopRatedSuppliers', () => {
    it('يجب أن يعيد أفضل الموردين مرتبين بالتقييم', async () => {
      const results = await supplierManagementService.getTopRatedSuppliers(2)

      expect(results).toHaveLength(2)
      expect(results[0].rating).toBeGreaterThanOrEqual(results[1].rating)
      expect(results.every(s => s.status === 'active')).toBe(true)
    })

    it('يجب أن يحدد عدد النتائج', async () => {
      const results = await supplierManagementService.getTopRatedSuppliers(1)

      expect(results).toHaveLength(1)
      expect(results[0].rating).toBe(4.8) // أعلى تقييم
    })
  })

  describe('getSupplierStatistics', () => {
    it('يجب أن يحسب الإحصائيات بشكل صحيح', async () => {
      const stats = await supplierManagementService.getSupplierStatistics()

      expect(stats).toEqual({
        total: 3,
        active: 2,
        inactive: 1,
        suspended: 0,
        averageRating: (4.5 + 4.8 + 3.8) / 3,
        totalPurchases: 1500000 + 2200000 + 800000,
        categoriesCount: 3, // مواد البناء، حديد ومعادن، خرسانة
      })
    })

    it('يجب أن يتعامل مع قائمة فارغة من الموردين', async () => {
      vi.mocked(asyncStorage.getItem).mockResolvedValue([])

      const stats = await supplierManagementService.getSupplierStatistics()

      expect(stats).toEqual({
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        averageRating: 0,
        totalPurchases: 0,
        categoriesCount: 0,
      })
    })

    it('يجب أن يتعامل مع أخطاء حساب الإحصائيات', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'))

      const stats = await supplierManagementService.getSupplierStatistics()

      expect(stats).toEqual({
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        averageRating: 0,
        totalPurchases: 0,
        categoriesCount: 0,
      })
    })
  })
})
