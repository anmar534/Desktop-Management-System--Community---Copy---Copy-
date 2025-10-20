/**
 * Pricing Constants and Options
 * ثوابت وخيارات التسعير
 */

// خيارات الوحدات لكل نوع مورد
export const UNIT_OPTIONS = {
  materials: [
    { value: 'م', label: 'متر' },
    { value: 'م²', label: 'متر مربع' },
    { value: 'م³', label: 'متر مكعب' },
    { value: 'كجم', label: 'كيلوجرام' },
    { value: 'طن', label: 'طن' },
    { value: 'قطعة', label: 'قطعة' },
    { value: 'لتر', label: 'لتر' },
    { value: 'كيس', label: 'كيس' },
    { value: 'صندوق', label: 'صندوق' },
    { value: 'رولة', label: 'رولة' },
  ],
  labor: [
    { value: 'يوم عمل', label: 'يوم عمل' },
    { value: 'ساعة', label: 'ساعة' },
    { value: 'شهر', label: 'شهر' },
    { value: 'أسبوع', label: 'أسبوع' },
  ],
  equipment: [
    { value: 'ساعة', label: 'ساعة' },
    { value: 'يوم', label: 'يوم' },
    { value: 'شهر', label: 'شهر' },
    { value: 'أسبوع', label: 'أسبوع' },
    { value: 'رحلة', label: 'رحلة' },
  ],
  subcontractors: [
    { value: 'م', label: 'متر' },
    { value: 'م²', label: 'متر مربع' },
    { value: 'نقطة', label: 'نقطة' },
    { value: 'مجموع', label: 'مجموع' },
    { value: 'بند', label: 'بند' },
  ],
} as const

// النسب الافتراضية
export const DEFAULT_PERCENTAGES = {
  administrative: 5,
  operational: 5,
  profit: 15,
} as const

// نسب مقترحة حسب نوع المشروع
export const SUGGESTED_PERCENTAGES = {
  residential: {
    administrative: 8,
    operational: 12,
    profit: 18,
    label: 'مشروع سكني',
  },
  commercial: {
    administrative: 10,
    operational: 15,
    profit: 20,
    label: 'مشروع تجاري',
  },
  infrastructure: {
    administrative: 12,
    operational: 18,
    profit: 22,
    label: 'مشروع بنية تحتية',
  },
  industrial: {
    administrative: 10,
    operational: 16,
    profit: 20,
    label: 'مشروع صناعي',
  },
} as const
