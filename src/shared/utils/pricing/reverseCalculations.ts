/**
 * دوال الحساب العكسي لاستخراج نسب الربح والتكاليف من السعر الإجمالي
 * Reverse calculation utilities to derive profit and cost percentages from total price
 */

import type { PricingPercentages } from '@/shared/types/pricing'

export interface ReverseCalculationInput {
  itemTotalPrice: number // السعر الإجمالي للبند (شامل كل شيء ماعدا VAT)
  quantity: number // الكمية
  defaultPercentages: PricingPercentages // النسب الافتراضية المُستخدمة كمرجع
}

export interface ReverseCalculationResult {
  unitPrice: number // السعر الإفرادي
  subtotal: number // التكلفة الأساسية (قبل النسب)
  administrativeCost: number // قيمة التكاليف الإدارية
  operationalCost: number // قيمة التكاليف التشغيلية
  profitCost: number // قيمة الأرباح
  derivedPercentages: PricingPercentages // النسب المستخرجة
  totalPercentage: number // مجموع النسب
}

/**
 * حساب عكسي: استخراج النسب من السعر الإجمالي
 *
 * المعادلة الأساسية:
 * itemTotal = subtotal + (subtotal * admin%) + (subtotal * operational%) + (subtotal * profit%)
 * itemTotal = subtotal * (1 + admin% + operational% + profit%)
 *
 * إذاً:
 * subtotal = itemTotal / (1 + totalPercentage/100)
 *
 * @param input - بيانات الإدخال
 * @returns نتيجة الحساب العكسي
 */
export const calculateReversePricing = (
  input: ReverseCalculationInput,
): ReverseCalculationResult => {
  const { itemTotalPrice, quantity, defaultPercentages } = input

  // التحقق من صحة المدخلات
  if (itemTotalPrice <= 0 || quantity <= 0) {
    return {
      unitPrice: 0,
      subtotal: 0,
      administrativeCost: 0,
      operationalCost: 0,
      profitCost: 0,
      derivedPercentages: { ...defaultPercentages },
      totalPercentage: 0,
    }
  }

  // السعر الإفرادي
  const unitPrice = itemTotalPrice / quantity

  // مجموع النسب الافتراضية
  const totalPercentage =
    defaultPercentages.administrative + defaultPercentages.operational + defaultPercentages.profit

  // حساب التكلفة الأساسية (عكسياً)
  // itemTotal = subtotal * (1 + totalPercentage/100)
  // subtotal = itemTotal / (1 + totalPercentage/100)
  const subtotal = itemTotalPrice / (1 + totalPercentage / 100)

  // حساب قيمة كل نسبة
  const administrativeCost = (subtotal * defaultPercentages.administrative) / 100
  const operationalCost = (subtotal * defaultPercentages.operational) / 100
  const profitCost = (subtotal * defaultPercentages.profit) / 100

  // التحقق من صحة الحسابات
  const calculatedTotal = subtotal + administrativeCost + operationalCost + profitCost
  const difference = Math.abs(calculatedTotal - itemTotalPrice)

  // إذا كان الفرق كبير، نحتاج لتعديل بسيط (بسبب الـ rounding)
  if (difference > 0.01) {
    console.warn(`Reverse calculation mismatch: expected ${itemTotalPrice}, got ${calculatedTotal}`)
  }

  return {
    unitPrice,
    subtotal,
    administrativeCost,
    operationalCost,
    profitCost,
    derivedPercentages: {
      administrative: defaultPercentages.administrative,
      operational: defaultPercentages.operational,
      profit: defaultPercentages.profit,
    },
    totalPercentage,
  }
}

/**
 * حساب السعر الإجمالي من السعر الإفرادي
 * (للتحقق من صحة الحسابات)
 *
 * @param unitPrice - السعر الإفرادي
 * @param quantity - الكمية
 * @param percentages - النسب المطلوبة
 * @returns السعر الإجمالي
 */
export const calculateTotalFromUnitPrice = (
  unitPrice: number,
  quantity: number,
  _percentages: PricingPercentages,
): number => {
  if (unitPrice <= 0 || quantity <= 0) return 0

  const itemTotal = unitPrice * quantity

  // السعر الإجمالي يشمل التكلفة الأساسية + النسب
  // لكن هنا السعر الإفرادي يُفترض أنه يشمل كل شيء
  return itemTotal
}

/**
 * استخراج التكلفة الأساسية (subtotal) من السعر الإفرادي
 *
 * @param unitPrice - السعر الإفرادي الشامل للنسب
 * @param percentages - النسب المستخدمة
 * @returns التكلفة الأساسية للوحدة الواحدة
 */
export const deriveSubtotalFromUnitPrice = (
  unitPrice: number,
  percentages: PricingPercentages,
): number => {
  if (unitPrice <= 0) return 0

  const totalPercentage = percentages.administrative + percentages.operational + percentages.profit
  return unitPrice / (1 + totalPercentage / 100)
}
