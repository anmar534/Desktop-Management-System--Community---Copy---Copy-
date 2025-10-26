/**
 * Company Settings Types
 * أنواع إعدادات الشركة
 */

export interface CompanySettings {
  companyName: string
  companyNameEn?: string
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  taxNumber?: string
  commercialRegister?: string
}

export interface CompanySettingsContextValue {
  settings: CompanySettings
  updateSettings: (settings: Partial<CompanySettings>) => void
  resetSettings: () => void
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'شركة',
  companyNameEn: 'Company',
  primaryColor: '#3b82f6',
  secondaryColor: '#10b981',
}
