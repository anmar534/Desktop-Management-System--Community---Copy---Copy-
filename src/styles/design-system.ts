/**
 * Design System - نظام التصميم الموحد
 * Sprint 5.4.1: توحيد نظام التصميم
 * 
 * A comprehensive design system for consistent UI/UX across the application
 * نظام تصميم شامل لواجهة مستخدم متسقة عبر التطبيق
 */

// ============================================================================
// Colors / الألوان
// ============================================================================

export const colors = {
  // Primary Colors / الألوان الأساسية
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main primary color
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Secondary Colors / الألوان الثانوية
  secondary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#9C27B0', // Main secondary color
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },

  // Success Colors / ألوان النجاح
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // Main success color
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Warning Colors / ألوان التحذير
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800', // Main warning color
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },

  // Error Colors / ألوان الخطأ
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336', // Main error color
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },

  // Info Colors / ألوان المعلومات
  info: {
    50: '#E1F5FE',
    100: '#B3E5FC',
    200: '#81D4FA',
    300: '#4FC3F7',
    400: '#29B6F6',
    500: '#03A9F4', // Main info color
    600: '#039BE5',
    700: '#0288D1',
    800: '#0277BD',
    900: '#01579B',
  },

  // Neutral Colors / الألوان المحايدة
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },

  // Background Colors / ألوان الخلفية
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
    dark: '#121212',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors / ألوان النص
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.60)',
    disabled: 'rgba(0, 0, 0, 0.38)',
    hint: 'rgba(0, 0, 0, 0.38)',
  },

  // Border Colors / ألوان الحدود
  border: {
    light: '#E0E0E0',
    main: '#BDBDBD',
    dark: '#9E9E9E',
  },
} as const

// ============================================================================
// Typography / الطباعة
// ============================================================================

export const typography = {
  // Font Families / عائلات الخطوط
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    arabic: "'Tajawal', 'Cairo', 'Noto Sans Arabic', sans-serif",
    mono: "'Fira Code', 'Courier New', monospace",
  },

  // Font Sizes / أحجام الخطوط
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },

  // Font Weights / أوزان الخطوط
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights / ارتفاعات الأسطر
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing / تباعد الأحرف
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// ============================================================================
// Spacing / المسافات
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
} as const

// ============================================================================
// Border Radius / نصف قطر الحدود
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const

// ============================================================================
// Shadows / الظلال
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const

// ============================================================================
// Z-Index / ترتيب العمق
// ============================================================================

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const

// ============================================================================
// Transitions / الانتقالات
// ============================================================================

export const transitions = {
  duration: {
    fastest: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '400ms',
    slowest: '500ms',
  },
  
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // Predefined transitions
  default: 'all 300ms ease-in-out',
  fast: 'all 200ms ease-in-out',
  slow: 'all 400ms ease-in-out',
} as const

// ============================================================================
// Breakpoints / نقاط التوقف
// ============================================================================

export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================================================
// Component Sizes / أحجام المكونات
// ============================================================================

export const componentSizes = {
  button: {
    xs: {
      height: '24px',
      padding: '0 8px',
      fontSize: typography.fontSize.xs,
    },
    sm: {
      height: '32px',
      padding: '0 12px',
      fontSize: typography.fontSize.sm,
    },
    md: {
      height: '40px',
      padding: '0 16px',
      fontSize: typography.fontSize.base,
    },
    lg: {
      height: '48px',
      padding: '0 20px',
      fontSize: typography.fontSize.lg,
    },
    xl: {
      height: '56px',
      padding: '0 24px',
      fontSize: typography.fontSize.xl,
    },
  },
  
  input: {
    sm: {
      height: '32px',
      padding: '0 12px',
      fontSize: typography.fontSize.sm,
    },
    md: {
      height: '40px',
      padding: '0 16px',
      fontSize: typography.fontSize.base,
    },
    lg: {
      height: '48px',
      padding: '0 20px',
      fontSize: typography.fontSize.lg,
    },
  },
} as const

// ============================================================================
// Design Tokens / رموز التصميم
// ============================================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  transitions,
  breakpoints,
  componentSizes,
} as const

// ============================================================================
// Theme Type / نوع السمة
// ============================================================================

export type DesignSystem = typeof designTokens

// ============================================================================
// Helper Functions / وظائف مساعدة
// ============================================================================

/**
 * Get color with opacity
 * الحصول على لون مع الشفافية
 */
export function colorWithOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Get responsive value based on breakpoint
 * الحصول على قيمة متجاوبة بناءً على نقطة التوقف
 */
export function responsive<T>(values: Partial<Record<keyof typeof breakpoints, T>>): string {
  return Object.entries(values)
    .map(([breakpoint, value]) => {
      const bp = breakpoints[breakpoint as keyof typeof breakpoints]
      return `@media (min-width: ${bp}) { ${value} }`
    })
    .join(' ')
}

/**
 * Create CSS variable
 * إنشاء متغير CSS
 */
export function cssVar(name: string, value: string): string {
  return `--${name}: ${value};`
}

// ============================================================================
// Export Default
// ============================================================================

export default designTokens

