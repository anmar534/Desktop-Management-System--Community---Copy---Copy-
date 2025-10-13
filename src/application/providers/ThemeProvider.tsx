/**
 * Theme Provider Component
 *
 * مزود السمات - يدير السمات المختلفة للتطبيق
 * يدعم: Light، Dark، High Contrast themes
 * يتكامل مع localStorage للحفاظ على تفضيلات المستخدم
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ThemeName } from '../../config/design/themes.config';
import { applyTheme } from '../../config/design/themes.config';
import { safeLocalStorage } from '../../utils/storage';

// ============================================
// Types
// ============================================

interface ThemeContextValue {
  /** السمة الحالية */
  theme: ThemeName;

  /** تغيير السمة */
  setTheme: (theme: ThemeName) => void;

  /** التبديل بين السمات */
  toggleTheme: () => void;

  /** قائمة السمات المتاحة */
  availableThemes: ThemeName[];

  /** هل السمة الحالية داكنة؟ */
  isDark: boolean;

  /** هل السمة الحالية ذات تباين عالي؟ */
  isHighContrast: boolean;
}

// ============================================
// Context
// ============================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================
// Storage Key
// ============================================

const THEME_STORAGE_KEY = 'app_ui_theme_preference';

// ============================================
// Helper Functions
// ============================================

/**
 * الحصول على السمة المحفوظة من storage
 */
const getStoredTheme = (): ThemeName | null => {
  try {
    const stored = safeLocalStorage.getItem<string | null>(THEME_STORAGE_KEY, null);
    if (stored && ['light', 'dark', 'high-contrast'].includes(stored)) {
      return stored as ThemeName;
    }
  } catch (error) {
    console.warn('Failed to get stored theme:', error);
  }
  return null;
};

/**
 * حفظ السمة في storage
 */
const storeTheme = (theme: ThemeName): void => {
  try {
    safeLocalStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to store theme:', error);
  }
};

/**
 * اكتشاف تفضيلات النظام
 */
const getSystemTheme = (): ThemeName => {
  if (typeof window === 'undefined') return 'light';

  // التحقق من تفضيل التباين العالي
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  if (prefersHighContrast) {
    return 'high-contrast';
  }

  // التحقق من تفضيل الوضع الداكن
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

// ============================================
// Provider Component
// ============================================

interface ThemeProviderProps {
  children: React.ReactNode;
  /** السمة الافتراضية (اختياري) */
  defaultTheme?: ThemeName;
  /** استخدام تفضيلات النظام (افتراضي: true) */
  useSystemTheme?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  useSystemTheme = true,
}) => {
  // تحديد السمة الأولية
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // 1. التحقق من السمة المحفوظة
    const stored = getStoredTheme();
    if (stored) return stored;

    // 2. استخدام تفضيلات النظام إذا كان مفعّلاً
    if (useSystemTheme) {
      return getSystemTheme();
    }

    // 3. استخدام السمة الافتراضية
    return defaultTheme;
  });

  // تطبيق السمة عند التغيير
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // الاستماع لتغييرات تفضيلات النظام
  useEffect(() => {
    if (!useSystemTheme) return;

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // فقط إذا لم يكن هناك سمة محفوظة
      if (!getStoredTheme()) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        setThemeState(e.matches ? 'high-contrast' : getSystemTheme());
      }
    };

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    // Modern browsers
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener('change', handleSystemThemeChange);
      highContrastQuery.addEventListener('change', handleHighContrastChange);
    } else {
      // Fallback for older browsers
      darkModeQuery.addListener(handleSystemThemeChange);
      highContrastQuery.addListener(handleHighContrastChange);
    }

    return () => {
      if (darkModeQuery.removeEventListener) {
        darkModeQuery.removeEventListener('change', handleSystemThemeChange);
        highContrastQuery.removeEventListener('change', handleHighContrastChange);
      } else {
        darkModeQuery.removeListener(handleSystemThemeChange);
        highContrastQuery.removeListener(handleHighContrastChange);
      }
    };
  }, [useSystemTheme]);

  // دالة تغيير السمة
  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
  }, []);

  // دالة التبديل بين السمات
  const toggleTheme = useCallback(() => {
    const themes: ThemeName[] = ['light', 'dark', 'high-contrast'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  // القيم المشتقة
  const isDark = theme === 'dark';
  const isHighContrast = theme === 'high-contrast';
  const availableThemes: ThemeName[] = ['light', 'dark', 'high-contrast'];

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
    availableThemes,
    isDark,
    isHighContrast,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ============================================
// Hook
// ============================================

/**
 * Hook للوصول إلى سياق السمة
 *
 * @example
 * ```tsx
 * const { theme, setTheme, toggleTheme, isDark } = useTheme();
 * ```
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ============================================
// Theme Selector Component
// ============================================

/**
 * مكون اختيار السمة - يمكن استخدامه في الإعدادات
 */
export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, availableThemes } = useTheme();

  const themeLabels: Record<ThemeName, string> = {
    light: 'فاتح',
    dark: 'داكن',
    'high-contrast': 'تباين عالي',
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">السمة</label>
      <div className="flex gap-2">
        {availableThemes.map((themeName) => (
          <button
            key={themeName}
            type="button"
            onClick={() => setTheme(themeName)}
            className={`
              px-4 py-2 rounded-md border transition-all
              ${
                theme === themeName
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              }
            `}
          >
            {themeLabels[themeName]}
          </button>
        ))}
      </div>
    </div>
  );
};

interface ThemeSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'toggle';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const themeOptionMeta: Record<ThemeName, { label: string; icon: string }> = {
  light: { label: 'فاتح', icon: '☀️' },
  dark: { label: 'داكن', icon: '🌙' },
  'high-contrast': { label: 'تباين عالي', icon: '◐' },
};

const sizeClasses: Record<Required<ThemeSwitcherProps>['size'], string> = {
  sm: 'text-sm px-2 py-1',
  md: 'text-base px-3 py-2',
  lg: 'text-lg px-4 py-3',
};

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'dropdown',
  size = 'md',
  showLabels = true,
}) => {
  const { theme, availableThemes, setTheme, toggleTheme } = useTheme();

  if (variant === 'toggle') {
    const nextLabel = theme === 'light' ? 'التبديل للوضع الداكن' : 'التبديل للوضع الفاتح';
    const icon = theme === 'light' ? '☀️' : '🌙';

    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${sizeClasses[size]}`}
        aria-label={nextLabel}
      >
        <span aria-hidden>{icon}</span>
        {showLabels && <span>{themeOptionMeta[theme]?.label ?? 'سمة'}</span>}
      </button>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className="inline-flex gap-2 p-1 rounded-lg border border-border bg-background">
        {availableThemes.map((themeName) => {
          const isActive = theme === themeName;
          const { label, icon } = themeOptionMeta[themeName];

          return (
            <button
              key={themeName}
              type="button"
              onClick={() => setTheme(themeName)}
              className={`inline-flex items-center gap-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sizeClasses[size]} ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-card-foreground hover:bg-muted'
              }`}
              aria-label={`تغيير السمة إلى ${label}`}
              aria-pressed={isActive ? 'true' : 'false'}
            >
              <span aria-hidden>{icon}</span>
              {showLabels && <span>{label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <select
      value={theme}
      onChange={(event) => setTheme(event.target.value as ThemeName)}
      className={`rounded-md border border-border bg-background text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sizeClasses[size]}`}
      aria-label="اختيار السمة"
    >
      {availableThemes.map((themeName) => {
        const { label, icon } = themeOptionMeta[themeName];
        return (
          <option key={themeName} value={themeName}>
            {icon} {label}
          </option>
        );
      })}
    </select>
  );
};

export default ThemeProvider;
