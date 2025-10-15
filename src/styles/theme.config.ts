/**
 * Theme Configuration - إعدادات السمة
 * Sprint 5.4.1: توحيد نظام التصميم
 * 
 * Centralized theme configuration for Tailwind CSS and styled-components
 * إعدادات سمة مركزية لـ Tailwind CSS و styled-components
 */

import { designTokens } from './design-system'

// ============================================================================
// Tailwind Theme Extension
// ============================================================================

export const tailwindTheme = {
  colors: {
    // Primary
    primary: {
      50: designTokens.colors.primary[50],
      100: designTokens.colors.primary[100],
      200: designTokens.colors.primary[200],
      300: designTokens.colors.primary[300],
      400: designTokens.colors.primary[400],
      500: designTokens.colors.primary[500],
      600: designTokens.colors.primary[600],
      700: designTokens.colors.primary[700],
      800: designTokens.colors.primary[800],
      900: designTokens.colors.primary[900],
      DEFAULT: designTokens.colors.primary[500],
    },
    
    // Secondary
    secondary: {
      50: designTokens.colors.secondary[50],
      100: designTokens.colors.secondary[100],
      200: designTokens.colors.secondary[200],
      300: designTokens.colors.secondary[300],
      400: designTokens.colors.secondary[400],
      500: designTokens.colors.secondary[500],
      600: designTokens.colors.secondary[600],
      700: designTokens.colors.secondary[700],
      800: designTokens.colors.secondary[800],
      900: designTokens.colors.secondary[900],
      DEFAULT: designTokens.colors.secondary[500],
    },
    
    // Success
    success: {
      50: designTokens.colors.success[50],
      100: designTokens.colors.success[100],
      200: designTokens.colors.success[200],
      300: designTokens.colors.success[300],
      400: designTokens.colors.success[400],
      500: designTokens.colors.success[500],
      600: designTokens.colors.success[600],
      700: designTokens.colors.success[700],
      800: designTokens.colors.success[800],
      900: designTokens.colors.success[900],
      DEFAULT: designTokens.colors.success[500],
    },
    
    // Warning
    warning: {
      50: designTokens.colors.warning[50],
      100: designTokens.colors.warning[100],
      200: designTokens.colors.warning[200],
      300: designTokens.colors.warning[300],
      400: designTokens.colors.warning[400],
      500: designTokens.colors.warning[500],
      600: designTokens.colors.warning[600],
      700: designTokens.colors.warning[700],
      800: designTokens.colors.warning[800],
      900: designTokens.colors.warning[900],
      DEFAULT: designTokens.colors.warning[500],
    },
    
    // Error
    error: {
      50: designTokens.colors.error[50],
      100: designTokens.colors.error[100],
      200: designTokens.colors.error[200],
      300: designTokens.colors.error[300],
      400: designTokens.colors.error[400],
      500: designTokens.colors.error[500],
      600: designTokens.colors.error[600],
      700: designTokens.colors.error[700],
      800: designTokens.colors.error[800],
      900: designTokens.colors.error[900],
      DEFAULT: designTokens.colors.error[500],
    },
    
    // Info
    info: {
      50: designTokens.colors.info[50],
      100: designTokens.colors.info[100],
      200: designTokens.colors.info[200],
      300: designTokens.colors.info[300],
      400: designTokens.colors.info[400],
      500: designTokens.colors.info[500],
      600: designTokens.colors.info[600],
      700: designTokens.colors.info[700],
      800: designTokens.colors.info[800],
      900: designTokens.colors.info[900],
      DEFAULT: designTokens.colors.info[500],
    },
    
    // Neutral
    neutral: {
      0: designTokens.colors.neutral[0],
      50: designTokens.colors.neutral[50],
      100: designTokens.colors.neutral[100],
      200: designTokens.colors.neutral[200],
      300: designTokens.colors.neutral[300],
      400: designTokens.colors.neutral[400],
      500: designTokens.colors.neutral[500],
      600: designTokens.colors.neutral[600],
      700: designTokens.colors.neutral[700],
      800: designTokens.colors.neutral[800],
      900: designTokens.colors.neutral[900],
      1000: designTokens.colors.neutral[1000],
      DEFAULT: designTokens.colors.neutral[500],
    },
  },
  
  fontFamily: {
    sans: designTokens.typography.fontFamily.primary.split(', '),
    arabic: designTokens.typography.fontFamily.arabic.split(', '),
    mono: designTokens.typography.fontFamily.mono.split(', '),
  },
  
  fontSize: {
    xs: [designTokens.typography.fontSize.xs, { lineHeight: designTokens.typography.lineHeight.normal }],
    sm: [designTokens.typography.fontSize.sm, { lineHeight: designTokens.typography.lineHeight.normal }],
    base: [designTokens.typography.fontSize.base, { lineHeight: designTokens.typography.lineHeight.normal }],
    lg: [designTokens.typography.fontSize.lg, { lineHeight: designTokens.typography.lineHeight.normal }],
    xl: [designTokens.typography.fontSize.xl, { lineHeight: designTokens.typography.lineHeight.normal }],
    '2xl': [designTokens.typography.fontSize['2xl'], { lineHeight: designTokens.typography.lineHeight.tight }],
    '3xl': [designTokens.typography.fontSize['3xl'], { lineHeight: designTokens.typography.lineHeight.tight }],
    '4xl': [designTokens.typography.fontSize['4xl'], { lineHeight: designTokens.typography.lineHeight.tight }],
    '5xl': [designTokens.typography.fontSize['5xl'], { lineHeight: designTokens.typography.lineHeight.none }],
    '6xl': [designTokens.typography.fontSize['6xl'], { lineHeight: designTokens.typography.lineHeight.none }],
  },
  
  fontWeight: {
    light: designTokens.typography.fontWeight.light,
    normal: designTokens.typography.fontWeight.regular,
    medium: designTokens.typography.fontWeight.medium,
    semibold: designTokens.typography.fontWeight.semibold,
    bold: designTokens.typography.fontWeight.bold,
    extrabold: designTokens.typography.fontWeight.extrabold,
  },
  
  spacing: {
    0: designTokens.spacing[0],
    1: designTokens.spacing[1],
    2: designTokens.spacing[2],
    3: designTokens.spacing[3],
    4: designTokens.spacing[4],
    5: designTokens.spacing[5],
    6: designTokens.spacing[6],
    8: designTokens.spacing[8],
    10: designTokens.spacing[10],
    12: designTokens.spacing[12],
    16: designTokens.spacing[16],
    20: designTokens.spacing[20],
    24: designTokens.spacing[24],
    32: designTokens.spacing[32],
    40: designTokens.spacing[40],
    48: designTokens.spacing[48],
    56: designTokens.spacing[56],
    64: designTokens.spacing[64],
  },
  
  borderRadius: {
    none: designTokens.borderRadius.none,
    sm: designTokens.borderRadius.sm,
    DEFAULT: designTokens.borderRadius.base,
    md: designTokens.borderRadius.md,
    lg: designTokens.borderRadius.lg,
    xl: designTokens.borderRadius.xl,
    '2xl': designTokens.borderRadius['2xl'],
    '3xl': designTokens.borderRadius['3xl'],
    full: designTokens.borderRadius.full,
  },
  
  boxShadow: {
    none: designTokens.shadows.none,
    sm: designTokens.shadows.sm,
    DEFAULT: designTokens.shadows.base,
    md: designTokens.shadows.md,
    lg: designTokens.shadows.lg,
    xl: designTokens.shadows.xl,
    '2xl': designTokens.shadows['2xl'],
    inner: designTokens.shadows.inner,
  },
  
  zIndex: {
    hide: designTokens.zIndex.hide,
    base: designTokens.zIndex.base,
    dropdown: designTokens.zIndex.dropdown,
    sticky: designTokens.zIndex.sticky,
    fixed: designTokens.zIndex.fixed,
    'modal-backdrop': designTokens.zIndex.modalBackdrop,
    modal: designTokens.zIndex.modal,
    popover: designTokens.zIndex.popover,
    tooltip: designTokens.zIndex.tooltip,
    notification: designTokens.zIndex.notification,
  },
  
  transitionDuration: {
    fastest: designTokens.transitions.duration.fastest,
    fast: designTokens.transitions.duration.fast,
    DEFAULT: designTokens.transitions.duration.normal,
    slow: designTokens.transitions.duration.slow,
    slowest: designTokens.transitions.duration.slowest,
  },
  
  screens: {
    xs: designTokens.breakpoints.xs,
    sm: designTokens.breakpoints.sm,
    md: designTokens.breakpoints.md,
    lg: designTokens.breakpoints.lg,
    xl: designTokens.breakpoints.xl,
    '2xl': designTokens.breakpoints['2xl'],
  },
}

// ============================================================================
// Styled Components Theme
// ============================================================================

export const styledComponentsTheme = {
  ...designTokens,
  
  // Helper functions
  getColor: (path: string) => {
    const keys = path.split('.')
    let value: any = designTokens.colors
    
    for (const key of keys) {
      value = value[key]
      if (value === undefined) return undefined
    }
    
    return value
  },
  
  getSpacing: (multiplier: number) => {
    const baseSpacing = 4 // 4px
    return `${baseSpacing * multiplier}px`
  },
  
  mediaQuery: {
    xs: `@media (min-width: ${designTokens.breakpoints.xs})`,
    sm: `@media (min-width: ${designTokens.breakpoints.sm})`,
    md: `@media (min-width: ${designTokens.breakpoints.md})`,
    lg: `@media (min-width: ${designTokens.breakpoints.lg})`,
    xl: `@media (min-width: ${designTokens.breakpoints.xl})`,
    '2xl': `@media (min-width: ${designTokens.breakpoints['2xl']})`,
  },
}

// ============================================================================
// Theme Type
// ============================================================================

export type Theme = typeof styledComponentsTheme

// ============================================================================
// Export
// ============================================================================

export default {
  tailwind: tailwindTheme,
  styledComponents: styledComponentsTheme,
}

