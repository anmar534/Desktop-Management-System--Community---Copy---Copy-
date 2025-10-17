/**
 * Company Settings Types
 * أنواع إعدادات الشركة
 */

/**
 * Company Settings Interface
 * واجهة إعدادات الشركة
 */
export interface CompanySettings {
  /** اسم الشركة / Company Name */
  companyName: string

  /** شعار الشركة (Base64 أو URL) / Company Logo (Base64 or URL) */
  companyLogo: string | null

  /** رقم السجل التجاري / Commercial Registration Number */
  commercialRegister?: string

  /** الرقم الضريبي / Tax Number */
  taxNumber?: string

  /** تصنيف المقاولين / Contractor Classification */
  classification?: string

  /** العنوان / Address */
  address?: string

  /** رقم الهاتف / Phone Number */
  phone?: string

  /** البريد الإلكتروني / Email */
  email?: string

  /** الموقع الإلكتروني / Website */
  website?: string

  /** تاريخ آخر تحديث / Last Updated Date */
  lastUpdated?: string
}

/**
 * Default Company Settings
 * إعدادات الشركة الافتراضية
 */
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'شركة المقاولات المتطورة',
  companyLogo: null,
  commercialRegister: '1234567890',
  taxNumber: '300012345600003',
  classification: 'الدرجة الأولى',
  address: 'شارع الملك فهد، الرياض، المملكة العربية السعودية',
  phone: '',
  email: '',
  website: '',
  lastUpdated: new Date().toISOString(),
}

/**
 * Company Settings Context Value
 * قيمة سياق إعدادات الشركة
 */
export interface CompanySettingsContextValue {
  /** إعدادات الشركة الحالية / Current Company Settings */
  settings: CompanySettings

  /** تحديث إعدادات الشركة / Update Company Settings */
  updateSettings: (settings: Partial<CompanySettings>) => void

  /** تحديث شعار الشركة / Update Company Logo */
  updateLogo: (logo: string | null) => void

  /** تحديث اسم الشركة / Update Company Name */
  updateCompanyName: (name: string) => void

  /** إعادة تعيين إلى الإعدادات الافتراضية / Reset to Default Settings */
  resetToDefaults: () => void

  /** حالة التحميل / Loading State */
  isLoading: boolean
}
