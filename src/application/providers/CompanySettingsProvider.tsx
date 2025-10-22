/**
 * Company Settings Provider
 * موفر إعدادات الشركة
 *
 * Manages company branding and information across the application
 * يدير العلامة التجارية ومعلومات الشركة عبر التطبيق
 */

import type React from 'react'
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { CompanySettings, CompanySettingsContextValue } from './companySettings.types'
import { DEFAULT_COMPANY_SETTINGS } from './companySettings.types'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'

// ============================================
// Context
// ============================================

const CompanySettingsContext = createContext<CompanySettingsContextValue | undefined>(undefined)

// ============================================
// Storage Key
// ============================================

const COMPANY_SETTINGS_STORAGE_KEY = STORAGE_KEYS.COMPANY_SETTINGS

// ============================================
// Storage Helpers
// ============================================

/**
 * Get stored company settings from localStorage
 * الحصول على إعدادات الشركة المحفوظة من التخزين المحلي
 */
const getStoredSettings = (): CompanySettings | null => {
  try {
    const stored = safeLocalStorage.getItem<CompanySettings | null>(
      COMPANY_SETTINGS_STORAGE_KEY,
      null,
    )
    if (stored && typeof stored === 'object' && 'companyName' in stored) {
      return stored
    }
  } catch (error) {
    console.warn('Failed to get stored company settings:', error)
  }
  return null
}

/**
 * Store company settings to localStorage
 * حفظ إعدادات الشركة في التخزين المحلي
 */
const storeSettings = (settings: CompanySettings): void => {
  try {
    safeLocalStorage.setItem(COMPANY_SETTINGS_STORAGE_KEY, settings)
  } catch (error) {
    console.warn('Failed to store company settings:', error)
  }
}

// ============================================
// Provider Props
// ============================================

interface CompanySettingsProviderProps {
  children: React.ReactNode
  defaultSettings?: Partial<CompanySettings>
}

// ============================================
// Provider Component
// ============================================

export const CompanySettingsProvider: React.FC<CompanySettingsProviderProps> = ({
  children,
  defaultSettings,
}) => {
  const mergedDefaults = useMemo(
    () => ({
      ...DEFAULT_COMPANY_SETTINGS,
      ...(defaultSettings ?? {}),
    }),
    [defaultSettings],
  )
  const [settings, setSettingsState] = useState<CompanySettings>(() => {
    // Try to load from storage first
    const stored = getStoredSettings()
    if (stored) {
      return stored
    }

    // Otherwise use defaults
    return mergedDefaults
  })

  // Initialize settings on mount
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const stored = getStoredSettings()
        if (stored) {
          setSettingsState(stored)
        } else {
          // Store default settings if none exist
          storeSettings(mergedDefaults)
          setSettingsState(mergedDefaults)
        }
      } catch (error) {
        console.error('Failed to initialize company settings:', error)
      }
    }

    void initializeSettings()
  }, [mergedDefaults])

  /**
   * Update company settings
   * تحديث إعدادات الشركة
   */
  const updateSettings = useCallback((updates: Partial<CompanySettings>) => {
    setSettingsState((prev) => {
      const newSettings: CompanySettings = {
        ...prev,
        ...updates,
      }
      storeSettings(newSettings)
      return newSettings
    })
  }, [])

  /**
   * Reset settings to defaults
   * إعادة تعيين الإعدادات إلى القيم الافتراضية
   */
  const resetSettings = useCallback(() => {
    const defaults: CompanySettings = {
      companyName: '',
      companyNameEn: '',
      primaryColor: '#1a73e8',
      secondaryColor: '#34a853',
      address: '',
      phone: '',
      email: '',
      website: '',
      taxNumber: '',
      commercialRegister: '',
    }
    updateSettings(defaults)
  }, [updateSettings])

  const value: CompanySettingsContextValue = {
    settings,
    updateSettings,
    resetSettings,
  }

  return <CompanySettingsContext.Provider value={value}>{children}</CompanySettingsContext.Provider>
}

// ============================================
// Hook
// ============================================

/**
 * Use Company Settings Hook
 * خطاف استخدام إعدادات الشركة
 *
 * @returns Company settings context value
 * @throws Error if used outside of CompanySettingsProvider
 */
export const useCompanySettings = (): CompanySettingsContextValue => {
  const context = useContext(CompanySettingsContext)

  if (context === undefined) {
    throw new Error('useCompanySettings must be used within a CompanySettingsProvider')
  }

  return context
}

// ============================================
// Exports
// ============================================

export default CompanySettingsProvider
