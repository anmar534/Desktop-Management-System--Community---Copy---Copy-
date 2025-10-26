/**
 * Design Tokens Configuration
 *
 * نظام Design Tokens الشامل للتطبيق
 * يتضمن 300+ token للألوان، Typography، Spacing، Shadows، وغيرها
 *
 * @module DesignTokens
 * @version 1.0.0
 * @created 2025-10-07
 */

// ===== Color System =====

/**
 * نظام الألوان الأساسية (Primitive Colors)
 * ألوان خام لا تحمل معنى دلالي، تُستخدم كأساس للألوان الدلالية
 */
export const primitiveColors = {
  // Neutrals (Grayscale)
  white: '#FFFFFF',
  black: '#000000',

  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Primary Brand Colors
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  // Success Colors
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },

  // Warning Colors
  yellow: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#FACC15',
    500: '#EAB308',
    600: '#CA8A04',
    700: '#A16207',
    800: '#854D0E',
    900: '#713F12',
    950: '#422006',
  },

  // Error Colors
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },

  // Info Colors
  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
    950: '#083344',
  },

  // Accent Colors
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
    950: '#3B0764',
  },

  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
    950: '#431407',
  },
} as const

/**
 * الألوان الدلالية (Semantic Colors)
 * ألوان تحمل معنى محدد في سياق التطبيق
 */
export const semanticColors = {
  // Text Colors
  text: {
    primary: primitiveColors.gray[900],
    secondary: primitiveColors.gray[600],
    tertiary: primitiveColors.gray[500],
    disabled: primitiveColors.gray[400],
    inverse: primitiveColors.white,
    link: primitiveColors.blue[600],
    linkHover: primitiveColors.blue[700],
  },

  // Background Colors
  background: {
    primary: primitiveColors.white,
    secondary: primitiveColors.gray[50],
    tertiary: primitiveColors.gray[100],
    inverse: primitiveColors.gray[900],
    disabled: primitiveColors.gray[100],
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Border Colors
  border: {
    primary: primitiveColors.gray[200],
    secondary: primitiveColors.gray[300],
    focus: primitiveColors.blue[500],
    error: primitiveColors.red[500],
    success: primitiveColors.green[500],
    warning: primitiveColors.yellow[500],
  },

  // Status Colors
  status: {
    success: primitiveColors.green[600],
    successBg: primitiveColors.green[50],
    successBorder: primitiveColors.green[200],

    error: primitiveColors.red[600],
    errorBg: primitiveColors.red[50],
    errorBorder: primitiveColors.red[200],

    warning: primitiveColors.yellow[600],
    warningBg: primitiveColors.yellow[50],
    warningBorder: primitiveColors.yellow[200],

    info: primitiveColors.cyan[600],
    infoBg: primitiveColors.cyan[50],
    infoBorder: primitiveColors.cyan[200],
  },

  // Brand Colors
  brand: {
    primary: primitiveColors.blue[600],
    primaryHover: primitiveColors.blue[700],
    primaryActive: primitiveColors.blue[800],
    primaryBg: primitiveColors.blue[50],

    secondary: primitiveColors.purple[600],
    secondaryHover: primitiveColors.purple[700],
    secondaryActive: primitiveColors.purple[800],
    secondaryBg: primitiveColors.purple[50],
  },

  // Interactive Elements
  interactive: {
    default: primitiveColors.blue[600],
    hover: primitiveColors.blue[700],
    active: primitiveColors.blue[800],
    disabled: primitiveColors.gray[300],
    focus: primitiveColors.blue[500],
  },
} as const

// ===== Typography System =====

/**
 * نظام Typography الشامل
 * يتضمن أحجام الخطوط، الأوزان، وارتفاعات الأسطر
 */
export const typography = {
  // Font Families
  fontFamily: {
    sans: '"Inter", "Cairo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "Monaco", "Courier New", monospace',
    arabic: '"Cairo", "Tajawal", "IBM Plex Sans Arabic", sans-serif',
  },

  // Font Sizes (rem based on 16px base)
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem', // 72px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// ===== Spacing System =====

/**
 * نظام المسافات (Spacing Scale)
 * استخدام مقياس 4px base (0.25rem)
 */
export const spacing = {
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

// ===== Shadow System =====

/**
 * نظام الظلال (Shadow Scale)
 * ظلال متدرجة من خفيفة إلى قوية
 */
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

  // Colored Shadows
  primary: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -4px rgba(59, 130, 246, 0.1)',
  success: '0 10px 15px -3px rgba(34, 197, 94, 0.2), 0 4px 6px -4px rgba(34, 197, 94, 0.1)',
  error: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -4px rgba(239, 68, 68, 0.1)',
  warning: '0 10px 15px -3px rgba(234, 179, 8, 0.2), 0 4px 6px -4px rgba(234, 179, 8, 0.1)',
} as const

// ===== Border Radius System =====

/**
 * نظام تدوير الحواف (Border Radius)
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const

// ===== Border Width =====

/**
 * سماكات الحدود (Border Width)
 */
export const borderWidth = {
  0: '0',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
} as const

// ===== Z-Index Scale =====

/**
 * مقياس الطبقات (Z-Index)
 */
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',

  // Semantic Z-Index
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
} as const

// ===== Transition & Animation =====

/**
 * إعدادات الانتقالات والحركات
 */
export const transitions = {
  // Duration
  duration: {
    instant: '0ms',
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Timing Functions
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',

    // Custom Easing
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Common Transitions
  common: {
    all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'background-color 200ms, color 200ms, border-color 200ms',
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

// ===== Breakpoints (Desktop Only) =====

/**
 * نقاط القطع للشاشات المختلفة (سطح المكتب فقط)
 */
export const breakpoints = {
  sm: '1280px', // Small desktop (720p)
  md: '1440px', // Medium desktop (900p)
  lg: '1920px', // Large desktop (1080p)
  xl: '2560px', // Extra large (1440p)
  '2xl': '3840px', // 4K displays
} as const

// ===== Icon Sizes =====

/**
 * أحجام الأيقونات
 */
export const iconSizes = {
  xs: '0.75rem', // 12px
  sm: '1rem', // 16px
  base: '1.25rem', // 20px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem', // 48px
} as const

// ===== Component-Specific Tokens =====

/**
 * Tokens خاصة بالمكونات
 */
export const components = {
  // Button
  button: {
    height: {
      sm: spacing[8],
      base: spacing[10],
      lg: spacing[12],
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,
      base: `${spacing[2.5]} ${spacing[4]}`,
      lg: `${spacing[3]} ${spacing[6]}`,
    },
    fontSize: {
      sm: typography.fontSize.sm,
      base: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
    borderRadius: borderRadius.md,
  },

  // Input
  input: {
    height: {
      sm: spacing[8],
      base: spacing[10],
      lg: spacing[12],
    },
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.base,
    borderRadius: borderRadius.md,
    borderWidth: borderWidth[1],
  },

  // Card
  card: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    shadow: shadows.sm,
    borderWidth: borderWidth[1],
  },

  // Modal
  modal: {
    padding: spacing[6],
    borderRadius: borderRadius.xl,
    shadow: shadows.xl,
    backdropBlur: '8px',
  },

  // Sidebar
  sidebar: {
    width: '280px',
    itemHeight: spacing[10],
    itemPadding: `${spacing[2]} ${spacing[4]}`,
    borderRadius: borderRadius.md,
  },

  // Header
  header: {
    height: spacing[16],
    padding: `${spacing[0]} ${spacing[6]}`,
    shadow: shadows.sm,
  },
} as const

// ===== Export All Tokens =====

export const tokens = {
  colors: {
    primitive: primitiveColors,
    semantic: semanticColors,
  },
  typography,
  spacing,
  shadows,
  borderRadius,
  borderWidth,
  zIndex,
  transitions,
  breakpoints,
  iconSizes,
  components,
} as const

export default tokens
