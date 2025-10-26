/**
 * Design Tokens Configuration
 *
 * نظام شامل للـ Design Tokens يدعم:
 * - ألوان semantic متعددة المستويات
 * - Typography scale احترافي
 * - Spacing system متسق
 * - Shadows وتأثيرات بصرية
 * - Border radius وأنماط الحواف
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

// ============================================
// Color Tokens
// ============================================

/**
 * نظام الألوان الأساسي (HSL format)
 * يدعم Light و Dark و High Contrast themes
 */
export const colorTokens = {
  // Neutral Colors - 11 درجة من الرمادي
  neutral: {
    50: { h: 0, s: 0, l: 98 }, // أفتح درجة - backgrounds
    100: { h: 0, s: 0, l: 96 }, // خلفيات ثانوية
    200: { h: 0, s: 0, l: 91 }, // borders فاتحة
    300: { h: 0, s: 0, l: 83 }, // disabled states
    400: { h: 0, s: 0, l: 64 }, // placeholders
    500: { h: 0, s: 0, l: 45 }, // النص الثانوي
    600: { h: 0, s: 0, l: 38 }, // النص الأساسي
    700: { h: 0, s: 0, l: 26 }, // headings
    800: { h: 0, s: 0, l: 15 }, // dark emphasis
    900: { h: 0, s: 0, l: 9 }, // أغمق درجة
    950: { h: 0, s: 0, l: 4 }, // خلفيات داكنة جداً
  },

  // Brand Colors - الهوية البصرية
  brand: {
    primary: {
      50: { h: 222, s: 47, l: 95 },
      100: { h: 222, s: 47, l: 90 },
      200: { h: 222, s: 47, l: 80 },
      300: { h: 222, s: 47, l: 70 },
      400: { h: 222, s: 47, l: 50 },
      500: { h: 222, s: 47, l: 40 },
      600: { h: 222, s: 47, l: 30 },
      700: { h: 222, s: 47, l: 20 },
      800: { h: 222, s: 47, l: 15 },
      900: { h: 222, s: 47, l: 11 },
    },
    secondary: {
      50: { h: 210, s: 40, l: 98 },
      100: { h: 210, s: 40, l: 96 },
      200: { h: 210, s: 40, l: 90 },
      300: { h: 210, s: 40, l: 80 },
      400: { h: 210, s: 40, l: 70 },
      500: { h: 210, s: 40, l: 60 },
      600: { h: 210, s: 40, l: 50 },
      700: { h: 210, s: 40, l: 40 },
      800: { h: 210, s: 40, l: 30 },
      900: { h: 210, s: 40, l: 20 },
    },
  },

  // Semantic Colors - الألوان الدلالية
  semantic: {
    // Success states
    success: {
      50: { h: 142, s: 76, l: 95 },
      100: { h: 142, s: 76, l: 90 },
      200: { h: 142, s: 76, l: 80 },
      300: { h: 142, s: 76, l: 70 },
      400: { h: 142, s: 76, l: 55 },
      500: { h: 142, s: 76, l: 45 },
      600: { h: 142, s: 76, l: 36 }, // Default success
      700: { h: 142, s: 76, l: 28 },
      800: { h: 142, s: 76, l: 20 },
      900: { h: 142, s: 76, l: 15 },
    },
    // Warning states
    warning: {
      50: { h: 45, s: 93, l: 95 },
      100: { h: 45, s: 93, l: 90 },
      200: { h: 45, s: 93, l: 80 },
      300: { h: 45, s: 93, l: 70 },
      400: { h: 45, s: 93, l: 60 },
      500: { h: 45, s: 93, l: 47 }, // Default warning
      600: { h: 45, s: 93, l: 40 },
      700: { h: 45, s: 93, l: 30 },
      800: { h: 45, s: 93, l: 22 },
      900: { h: 45, s: 93, l: 15 },
    },
    // Error/Destructive states
    error: {
      50: { h: 0, s: 84, l: 95 },
      100: { h: 0, s: 84, l: 90 },
      200: { h: 0, s: 84, l: 80 },
      300: { h: 0, s: 84, l: 70 },
      400: { h: 0, s: 84, l: 65 },
      500: { h: 0, s: 84, l: 60 }, // Default error
      600: { h: 0, s: 84, l: 50 },
      700: { h: 0, s: 84, l: 40 },
      800: { h: 0, s: 62, l: 30 },
      900: { h: 0, s: 62, l: 20 },
    },
    // Info states
    info: {
      50: { h: 204, s: 94, l: 95 },
      100: { h: 204, s: 94, l: 90 },
      200: { h: 204, s: 94, l: 80 },
      300: { h: 204, s: 94, l: 70 },
      400: { h: 204, s: 94, l: 60 },
      500: { h: 204, s: 94, l: 50 }, // Default info
      600: { h: 204, s: 94, l: 40 },
      700: { h: 204, s: 94, l: 30 },
      800: { h: 204, s: 94, l: 22 },
      900: { h: 204, s: 94, l: 15 },
    },
  },

  // Tender-specific Colors - ألوان المنافسات
  tender: {
    urgent: {
      50: { h: 0, s: 84, l: 95 },
      500: { h: 0, s: 84, l: 60 },
      900: { h: 0, s: 62, l: 30 },
    },
    normal: {
      50: { h: 222, s: 47, l: 95 },
      500: { h: 222, s: 47, l: 40 },
      900: { h: 222, s: 47, l: 11 },
    },
  },

  // Data Visualization Colors - ألوان الرسوم البيانية
  charts: {
    blue: { h: 221, s: 83, l: 53 },
    green: { h: 142, s: 76, l: 36 },
    yellow: { h: 45, s: 93, l: 47 },
    red: { h: 0, s: 84, l: 60 },
    purple: { h: 262, s: 52, l: 47 },
    orange: { h: 24, s: 94, l: 50 },
    teal: { h: 173, s: 80, l: 40 },
    pink: { h: 330, s: 81, l: 60 },
    indigo: { h: 243, s: 75, l: 59 },
    lime: { h: 84, s: 81, l: 44 },
  },
} as const

// ============================================
// Typography Tokens
// ============================================

/**
 * نظام Typography احترافي مع دعم اللغة العربية
 */
export const typographyTokens = {
  // Font Families
  fontFamily: {
    sans: '"Segoe UI", "Cairo", "Tajawal", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    mono: '"Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace',
    arabic: '"Cairo", "Tajawal", "IBM Plex Sans Arabic", sans-serif',
  },

  // Font Sizes - مقياس نوع Modular Scale (1.250)
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px - القاعدة
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem', // 72px
    '8xl': '6rem', // 96px
    '9xl': '8rem', // 128px
  },

  // Font Weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line Heights - تناسب قراءة مريحة
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// ============================================
// Spacing Tokens
// ============================================

/**
 * نظام المسافات - مقياس 4px base
 */
export const spacingTokens = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const

// ============================================
// Shadow Tokens
// ============================================

/**
 * نظام الظلال - من subtle إلى dramatic
 */
export const shadowTokens = {
  none: 'none',

  // Subtle shadows - للعناصر الخفيفة
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',

  // Default shadows - للبطاقات والعناصر الأساسية
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',

  // Elevated shadows - للعناصر المرتفعة
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

  // Dramatic shadows - للـ modals والعناصر المميزة
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Inner shadow
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

  // Colored shadows - للتركيز والحالات الخاصة
  focus: '0 0 0 3px rgba(66, 153, 225, 0.5)',
  error: '0 0 0 3px rgba(245, 101, 101, 0.5)',
  success: '0 0 0 3px rgba(72, 187, 120, 0.5)',

  // Glow effects
  glow: {
    sm: '0 0 10px rgba(66, 153, 225, 0.5)',
    md: '0 0 20px rgba(66, 153, 225, 0.5)',
    lg: '0 0 30px rgba(66, 153, 225, 0.5)',
  },
} as const

// ============================================
// Border Radius Tokens
// ============================================

/**
 * نظام Border Radius
 */
export const borderRadiusTokens = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px', // للدوائر والحبوب
} as const

// ============================================
// Z-Index Tokens
// ============================================

/**
 * نظام الطبقات (Z-Index)
 */
export const zIndexTokens = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  drawer: 1045,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
  toast: 1090,
  debug: 9999,
} as const

// ============================================
// Transition Tokens
// ============================================

/**
 * نظام الانتقالات والحركة
 */
export const transitionTokens = {
  // Durations
  duration: {
    instant: '0ms',
    fast: '150ms',
    base: '200ms',
    medium: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },

  // Timing Functions
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Common Transitions
  all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'background-color 200ms, border-color 200ms, color 200ms',
  opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// ============================================
// Breakpoint Tokens
// ============================================

/**
 * نقاط التوقف للتصميم المتجاوب
 * مصممة لتطبيقات سطح المكتب (Electron)
 */
export const breakpointTokens = {
  sm: '640px', // شاشات صغيرة (tablet portrait)
  md: '768px', // شاشات متوسطة (tablet landscape)
  lg: '1024px', // شاشات كبيرة (laptop)
  xl: '1280px', // شاشات أكبر (desktop)
  '2xl': '1536px', // شاشات كبيرة جداً (large desktop)
  '3xl': '1920px', // Full HD
  '4xl': '2560px', // 2K/QHD
} as const

// ============================================
// Opacity Tokens
// ============================================

/**
 * مستويات الشفافية
 */
export const opacityTokens = {
  0: '0',
  5: '0.05',
  10: '0.1',
  20: '0.2',
  25: '0.25',
  30: '0.3',
  40: '0.4',
  50: '0.5',
  60: '0.6',
  70: '0.7',
  75: '0.75',
  80: '0.8',
  90: '0.9',
  95: '0.95',
  100: '1',
} as const

// ============================================
// Helper Functions
// ============================================

/**
 * تحويل HSL object إلى CSS string
 */
export const hslToString = (color: { h: number; s: number; l: number }): string => {
  return `${color.h} ${color.s}% ${color.l}%`
}

/**
 * الحصول على لون مع alpha
 */
export const hslWithAlpha = (color: { h: number; s: number; l: number }, alpha: number): string => {
  return `hsla(${color.h}, ${color.s}%, ${color.l}%, ${alpha})`
}

/**
 * تصدير جميع الـ tokens
 */
export const designTokens = {
  colors: colorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  shadows: shadowTokens,
  borderRadius: borderRadiusTokens,
  zIndex: zIndexTokens,
  transitions: transitionTokens,
  breakpoints: breakpointTokens,
  opacity: opacityTokens,
} as const

export default designTokens
