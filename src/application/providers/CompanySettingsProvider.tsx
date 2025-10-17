/**
 * Company Settings Provider
 * موفر إعدادات الشركة
 *
 * Manages company branding and information across the application
 * يدير العلامة التجارية ومعلومات الشركة عبر التطبيق
 */

import type React from 'react'
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { CompanySettings, CompanySettingsContextValue } from '@/types/companySettings'
import { DEFAULT_COMPANY_SETTINGS } from '@/types/companySettings'
import { safeLocalStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storageKeys'

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
  const [isLoading, setIsLoading] = useState(true)
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
      } finally {
        setIsLoading(false)
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
        lastUpdated: new Date().toISOString(),
      }
      storeSettings(newSettings)
      return newSettings
    })
  }, [])

  /**
   * Update company logo
   * تحديث شعار الشركة
   */
  const updateLogo = useCallback(
    (logo: string | null) => {
      updateSettings({ companyLogo: logo })
    },
    [updateSettings],
  )

  /**
   * Update company name
   * تحديث اسم الشركة
   */
  const updateCompanyName = useCallback(
    (name: string) => {
      updateSettings({ companyName: name })
    },
    [updateSettings],
  )

  /**
   * Reset to default settings
   * إعادة تعيين إلى الإعدادات الافتراضية
   */
  const resetToDefaults = useCallback(() => {
    const resetSettings: CompanySettings = {
      ...mergedDefaults,
      lastUpdated: new Date().toISOString(),
    }
    setSettingsState(resetSettings)
    storeSettings(resetSettings)
  }, [mergedDefaults])

  const value: CompanySettingsContextValue = {
    settings,
    updateSettings,
    updateLogo,
    updateCompanyName,
    resetToDefaults,
    isLoading,
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
