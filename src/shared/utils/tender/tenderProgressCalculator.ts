// utils/tenderProgressCalculator.ts
// دوال حساب نسبة التقدم في المنافسات

import type { Tender } from '@/data/centralData'
import { FileUploadService } from '../fileUploadService'
import { safeLocalStorage, STORAGE_KEYS } from '@/utils/storage'

type TenderStatus = Tender['status'];

interface StoredPricingEntry {
  pricing?: readonly unknown[] | null
}

type StoredPricingMap = Record<string, StoredPricingEntry>

const TERMINAL_STATUSES: readonly TenderStatus[] = [
  'expired',
  'cancelled',
  'won',
  'lost',
  'submitted'
]

const hasPricingEntries = (entry?: StoredPricingEntry): boolean => {
  const entries = entry?.pricing
  return Array.isArray(entries) && entries.length > 0
}

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

const coalesce = <T>(...values: readonly (T | null | undefined)[]): T | undefined => {
  for (const value of values) {
    if (value !== null && value !== undefined) {
      return value
    }
  }
  return undefined
}

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') {
      return true
    }
    if (normalized === 'false' || normalized === '0' || normalized === '') {
      return false
    }
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  return false
}

const toDateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

const getPricingCounts = (tender: Tender): { totalItems: number; pricedItems: number } => {
  const totalItems = toFiniteNumber(tender.totalItems, 0)
  const pricedCandidate = coalesce(tender.pricedItems, tender.itemsPriced)
  const pricedItems = toFiniteNumber(pricedCandidate, 0)

  if (totalItems <= 0) {
    return { totalItems: 0, pricedItems: 0 }
  }

  return {
    totalItems,
    pricedItems: clamp(pricedItems, 0, totalItems)
  }
}

const calculatePricingRatio = (tender: Tender): number => {
  const { totalItems, pricedItems } = getPricingCounts(tender)
  if (totalItems === 0) {
    return 0
  }
  return pricedItems / totalItems
}

const hasSubmittedStatus = (status: TenderStatus): boolean => {
  return status === 'submitted' || status === 'won' || status === 'lost'
}

/**
 * حساب نسبة التقدم للمنافسة بناءً على المراحل المحددة:
 * 70% للتسعير (حسب عدد البنود المُسعَّرة)
 * 20% لرفع ملفات العرض الفني
 * 10% لتقديم المنافسة
 * 
 * @param tender - بيانات المنافسة
 * @returns نسبة التقدم من 0 إلى 100
 */
export const calculateTenderProgress = (tender: Tender): number => {
  let progress = 0

  // 70% للتسعير - تفضيل الحقول المركزية، والرجوع إلى التخزين فقط عند غيابها
  const pricingProgress = calculatePricingProgressPreferCentral(tender)
  progress += pricingProgress

  // 20% لرفع ملفات العرض الفني - تفضيل الحقول المركزية مع رجوع بسيط إلى خدمة الملفات
  const technicalFilesProgress = calculateTechnicalFilesProgressPreferCentral(tender)
  progress += technicalFilesProgress

  // 10% لتقديم المنافسة
  if (hasSubmittedStatus(tender.status)) {
    progress += 10
  }

  return clamp(progress, 0, 100) // التأكد من عدم تجاوز 100%
}

/**
 * حساب نسبة التقدم في التسعير (70% من الإجمالي)
 * - يفضل الحقول المركزية داخل الكيان
 * - كرجوع: يستخدم التخزين الموحد عبر electron-store (STORAGE_KEYS.PRICING_DATA)
 * 
 * @param tender - بيانات المنافسة
 * @returns نسبة التقدم في التسعير (0 إلى 70)
 */
export const calculatePricingProgressPreferCentral = (tender: Tender): number => {
  try {
    // إن وجدت القيم المركزية، استخدمها مباشرة
    if (toFiniteNumber(tender.totalItems, 0) > 0) {
      return calculatePricingProgress(tender)
    }
    // كرجوع حديث: استخدم التخزين الموحد عبر electron-store
    // نتوقع أن تكون بيانات التسعير في شكل كائن مفهرس بمعرف المنافسة
    const allPricing = safeLocalStorage.getItem<StoredPricingMap>(STORAGE_KEYS.PRICING_DATA, {})
    const pricingData = allPricing[tender.id]
    if (hasPricingEntries(pricingData)) {
      return 70
    }
    // لا بيانات
    return 0
  } catch (error) {
    console.warn('Error calculating pricing progress from storage:', error)
    return calculatePricingProgress(tender)
  }
}

/**
 * حساب نسبة التقدم في رفع الملفات الفنية (20% من الإجمالي)
 * - يفضل الحقول المركزية
 * - كرجوع: استخدام خدمة الملفات فقط
 */
export const calculateTechnicalFilesProgressPreferCentral = (tender: Tender): number => {
  try {
    // تفضيل الحقل المركزي
    if (toBoolean(tender.technicalFilesUploaded)) return 20
    // رجوع إلى الملفات المحملة عبر الخدمة
    const files = FileUploadService.getFilesByTender(tender.id)
    if ((files?.length ?? 0) > 0) return 20
    return 0
  } catch (error) {
    console.warn('Error calculating technical files progress from storage:', error)
    // إذا حدث خطأ، استخدم البيانات التقليدية
    return toBoolean(tender.technicalFilesUploaded) ? 20 : 0
  }
}

/**
 * حساب نسبة التقدم في التسعير (70% من الإجمالي)
 * 
 * @param tender - بيانات المنافسة
 * @returns نسبة التقدم في التسعير (0 إلى 70)
 */
export const calculatePricingProgress = (tender: Tender): number => {
  const ratio = calculatePricingRatio(tender)
  const pricingPercentage = ratio * 70
  return clamp(pricingPercentage, 0, 70)
}

/**
 * تحديث حالة المنافسة تلقائياً بناءً على التقدم من التخزين الموحد
 * 
 * @param tender - بيانات المنافسة
 * @returns الحالة المحدثة
 */
export const updateTenderStatusBasedOnProgress = (tender: Tender): Tender['status'] => {
  // إذا كانت منتهية أو فائزة أو خاسرة، لا تغيير
  if (TERMINAL_STATUSES.includes(tender.status)) {
    return tender.status
  }

  const pricingProgress = calculatePricingProgressPreferCentral(tender)
  const technicalFilesProgress = calculateTechnicalFilesProgressPreferCentral(tender)
  
  // جاهزة للتقديم: تم التسعير كاملاً + ملفات العرض الفني
  if (pricingProgress === 70 && technicalFilesProgress === 20) {
    return 'ready_to_submit'
  }

  // تحت الإجراء: بدأ أي عمل (تسعير أو ملفات)
  if (pricingProgress > 0 || technicalFilesProgress > 0) {
    return 'under_action'
  }

  // جديدة: لم يبدأ أي عمل
  return 'new'
}

/**
 * الحصول على وصف الحالة باللغة العربية
 * 
 * @param status - حالة المنافسة
 * @returns الوصف باللغة العربية
 */
export const getTenderStatusDescription = (status: Tender['status']): string => {
  const descriptions: Record<Tender['status'], string> = {
    new: 'جديدة',
    under_action: 'تحت الإجراء',
    ready_to_submit: 'جاهزة للتقديم',
    submitted: 'بانتظار النتائج',
    won: 'فائزة',
    lost: 'خاسرة',
    expired: 'منتهية',
    cancelled: 'ملغاة'
  }

  return descriptions[status] ?? 'حالة غير معروفة'
}

/**
 * فحص ما إذا كانت المنافسة منتهية (لا تحسب في الإحصائيات)
 * 
 * @param tender - بيانات المنافسة
 * @returns true إذا كانت منتهية
 */
export const isTenderExpired = (tender: Tender): boolean => {
  // المنافسات المنتهية صراحة
  if (tender.status === 'expired' || tender.status === 'cancelled') {
    return true
  }

  // فحص انتهاء المدة للمنافسات النشطة
  if (['new', 'under_action', 'ready_to_submit'].includes(tender.status)) {
    const deadline = toDateOrNull(tender.deadline)
    if (!deadline) {
      return false
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    deadline.setHours(0, 0, 0, 0)
    return deadline < today
  }

  return false
}

/**
 * حساب الأيام المتبقية
 * 
 * @param deadline - الموعد النهائي
 * @returns عدد الأيام المتبقية
 */
export const getDaysRemaining = (deadline: string): number => {
  const deadlineDate = toDateOrNull(deadline)
  if (!deadlineDate) {
    return 0
  }
  const today = new Date()
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return Math.ceil(diffDays)
}