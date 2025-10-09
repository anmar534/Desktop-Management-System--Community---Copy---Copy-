/**
 * Theme Provider
 * 
 * مزود السمات (Theme Provider) للتطبيق
 * يدير حالة السمة الحالية ويطبقها على DOM
 * 
 * @module ThemeProvider
 * @version 1.0.0
 * @created 2025-10-07
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  type ThemeMode, 
  type Theme, 
  themes, 
  applyTheme, 
  getStoredTheme, 
  storeTheme 
} from '../../config/themes.config';

// ===== Theme Context =====

interface ThemeContextValue {
  /** السمة الحالية */
  theme: Theme;
  
  /** وضع السمة الحالي */
  mode: ThemeMode;
  
  /** تغيير السمة */
  setThemeMode: (mode: ThemeMode) => void;
  
  /** التبديل بين Light/Dark */
  toggleTheme: () => void;
  
  /** هل السمة الحالية داكنة */
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ===== Theme Provider Component =====

interface ThemeProviderProps {
  children: ReactNode;
  /** السمة الافتراضية (اختياري) */
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ children, defaultMode }: ThemeProviderProps): JSX.Element {
  // Initialize theme from storage or default
  const [mode, setMode] = useState<ThemeMode>(() => {
    return defaultMode ?? getStoredTheme();
  });

  const theme = themes[mode];
  const isDark = mode === 'dark';

  // Apply theme to DOM when mode changes
  useEffect(() => {
    applyTheme(theme);
    storeTheme(mode);
  }, [mode, theme]);

  // Handle system color scheme preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent): void => {
      // Only auto-switch if user hasn't manually set a theme
      const storedTheme = getStoredTheme();
      if (!storedTheme) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setThemeMode = (newMode: ThemeMode): void => {
    setMode(newMode);
  };

  const toggleTheme = (): void => {
    setMode((current: ThemeMode) => current === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextValue = {
    theme,
    mode,
    setThemeMode,
    toggleTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ===== useTheme Hook =====

/**
 * Hook للوصول إلى معلومات السمة الحالية
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { mode, setThemeMode, isDark } = useTheme();
 *   
 *   return (
 *     <button onClick={() => setThemeMode('dark')}>
 *       Current: {mode}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  
  return context;
}

// ===== Theme Switcher Component =====

interface ThemeSwitcherProps {
  /** نمط العرض */
  variant?: 'dropdown' | 'buttons' | 'toggle';
  /** حجم المكون */
  size?: 'sm' | 'md' | 'lg';
  /** عرض أسماء السمات */
  showLabels?: boolean;
}

export function ThemeSwitcher({ 
  variant = 'dropdown', 
  size = 'md',
  showLabels = true 
}: ThemeSwitcherProps): JSX.Element {
  const { mode, setThemeMode, toggleTheme } = useTheme();

  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'فاتح', icon: '☀️' },
    { value: 'dark', label: 'داكن', icon: '🌙' },
    { value: 'high-contrast', label: 'تباين عالي', icon: '◐' },
  ];

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3',
  };

  if (variant === 'toggle') {
    return (
      <button
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 
                   hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${sizeClasses[size]}`}
        aria-label="تبديل السمة"
      >
        <span className="text-xl">{mode === 'light' ? '☀️' : '🌙'}</span>
        {showLabels && <span>{mode === 'light' ? 'فاتح' : 'داكن'}</span>}
      </button>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className="inline-flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
        {themeOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setThemeMode(option.value)}
            className={`inline-flex items-center gap-2 rounded-md transition-all ${sizeClasses[size]}
                       ${mode === option.value 
                         ? 'bg-white dark:bg-gray-700 shadow-sm' 
                         : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label={`تغيير السمة إلى ${option.label}`}
            aria-current={mode === option.value ? 'true' : 'false'}
          >
            <span>{option.icon}</span>
            {showLabels && <span>{option.label}</span>}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <select
      value={mode}
      onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
      className={`rounded-md border border-gray-300 dark:border-gray-700 
                 bg-white dark:bg-gray-800 transition-colors ${sizeClasses[size]}`}
      aria-label="اختيار السمة"
    >
      {themeOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.icon} {option.label}
        </option>
      ))}
    </select>
  );
}

export default ThemeProvider;
