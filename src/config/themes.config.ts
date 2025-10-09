/**
 * Theme Configuration
 * 
 * نظام السمات (Themes) للتطبيق
 * يتضمن: Light Theme, Dark Theme, High Contrast Theme
 * 
 * @module ThemesConfig
 * @version 1.0.0
 * @created 2025-10-07
 */

import { tokens } from './tokens.config';

// ===== Theme Type Definitions =====

import { safeLocalStorage } from '../utils/storage';

/**
 * أنواع الـ Themes المتاحة
 */
export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export interface Theme {
  mode: ThemeMode;
  colors: {
    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textDisabled: string;
    textInverse: string;
    textLink: string;
    textLinkHover: string;

    // Background
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgInverse: string;
    bgDisabled: string;
    bgOverlay: string;

    // Border
    borderPrimary: string;
    borderSecondary: string;
    borderFocus: string;
    borderError: string;
    borderSuccess: string;
    borderWarning: string;

    // Status
    statusSuccess: string;
    statusSuccessBg: string;
    statusSuccessBorder: string;
    statusError: string;
    statusErrorBg: string;
    statusErrorBorder: string;
    statusWarning: string;
    statusWarningBg: string;
    statusWarningBorder: string;
    statusInfo: string;
    statusInfoBg: string;
    statusInfoBorder: string;

    // Brand
    brandPrimary: string;
    brandPrimaryHover: string;
    brandPrimaryActive: string;
    brandPrimaryBg: string;
    brandSecondary: string;
    brandSecondaryHover: string;
    brandSecondaryActive: string;
    brandSecondaryBg: string;

    // Interactive
    interactiveDefault: string;
    interactiveHover: string;
    interactiveActive: string;
    interactiveDisabled: string;
    interactiveFocus: string;

    // Surface (Cards, Modals, etc.)
    surfacePrimary: string;
    surfaceSecondary: string;
    surfaceElevated: string;

    // Sidebar
    sidebarBg: string;
    sidebarItemHover: string;
    sidebarItemActive: string;
    sidebarItemText: string;
    sidebarItemIcon: string;

    // Header
    headerBg: string;
    headerBorder: string;
    headerText: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// ===== Light Theme =====

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Text
    textPrimary: tokens.colors.semantic.text.primary,
    textSecondary: tokens.colors.semantic.text.secondary,
    textTertiary: tokens.colors.semantic.text.tertiary,
    textDisabled: tokens.colors.semantic.text.disabled,
    textInverse: tokens.colors.semantic.text.inverse,
    textLink: tokens.colors.semantic.text.link,
    textLinkHover: tokens.colors.semantic.text.linkHover,

    // Background
    bgPrimary: tokens.colors.semantic.background.primary,
    bgSecondary: tokens.colors.semantic.background.secondary,
    bgTertiary: tokens.colors.semantic.background.tertiary,
    bgInverse: tokens.colors.semantic.background.inverse,
    bgDisabled: tokens.colors.semantic.background.disabled,
    bgOverlay: tokens.colors.semantic.background.overlay,

    // Border
    borderPrimary: tokens.colors.semantic.border.primary,
    borderSecondary: tokens.colors.semantic.border.secondary,
    borderFocus: tokens.colors.semantic.border.focus,
    borderError: tokens.colors.semantic.border.error,
    borderSuccess: tokens.colors.semantic.border.success,
    borderWarning: tokens.colors.semantic.border.warning,

    // Status
    statusSuccess: tokens.colors.semantic.status.success,
    statusSuccessBg: tokens.colors.semantic.status.successBg,
    statusSuccessBorder: tokens.colors.semantic.status.successBorder,
    statusError: tokens.colors.semantic.status.error,
    statusErrorBg: tokens.colors.semantic.status.errorBg,
    statusErrorBorder: tokens.colors.semantic.status.errorBorder,
    statusWarning: tokens.colors.semantic.status.warning,
    statusWarningBg: tokens.colors.semantic.status.warningBg,
    statusWarningBorder: tokens.colors.semantic.status.warningBorder,
    statusInfo: tokens.colors.semantic.status.info,
    statusInfoBg: tokens.colors.semantic.status.infoBg,
    statusInfoBorder: tokens.colors.semantic.status.infoBorder,

    // Brand
    brandPrimary: tokens.colors.semantic.brand.primary,
    brandPrimaryHover: tokens.colors.semantic.brand.primaryHover,
    brandPrimaryActive: tokens.colors.semantic.brand.primaryActive,
    brandPrimaryBg: tokens.colors.semantic.brand.primaryBg,
    brandSecondary: tokens.colors.semantic.brand.secondary,
    brandSecondaryHover: tokens.colors.semantic.brand.secondaryHover,
    brandSecondaryActive: tokens.colors.semantic.brand.secondaryActive,
    brandSecondaryBg: tokens.colors.semantic.brand.secondaryBg,

    // Interactive
    interactiveDefault: tokens.colors.semantic.interactive.default,
    interactiveHover: tokens.colors.semantic.interactive.hover,
    interactiveActive: tokens.colors.semantic.interactive.active,
    interactiveDisabled: tokens.colors.semantic.interactive.disabled,
    interactiveFocus: tokens.colors.semantic.interactive.focus,

    // Surface
    surfacePrimary: tokens.colors.primitive.white,
    surfaceSecondary: tokens.colors.primitive.gray[50],
    surfaceElevated: tokens.colors.primitive.white,

    // Sidebar
    sidebarBg: tokens.colors.primitive.white,
    sidebarItemHover: tokens.colors.primitive.gray[100],
    sidebarItemActive: tokens.colors.primitive.blue[50],
    sidebarItemText: tokens.colors.primitive.gray[700],
    sidebarItemIcon: tokens.colors.primitive.gray[500],

    // Header
    headerBg: tokens.colors.primitive.white,
    headerBorder: tokens.colors.primitive.gray[200],
    headerText: tokens.colors.primitive.gray[900],
  },
  shadows: {
    sm: tokens.shadows.sm,
    md: tokens.shadows.md,
    lg: tokens.shadows.lg,
    xl: tokens.shadows.xl,
  },
};

// ===== Dark Theme =====

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Text
    textPrimary: tokens.colors.primitive.gray[50],
    textSecondary: tokens.colors.primitive.gray[400],
    textTertiary: tokens.colors.primitive.gray[500],
    textDisabled: tokens.colors.primitive.gray[600],
    textInverse: tokens.colors.primitive.gray[900],
    textLink: tokens.colors.primitive.blue[400],
    textLinkHover: tokens.colors.primitive.blue[300],

    // Background
    bgPrimary: tokens.colors.primitive.gray[950],
    bgSecondary: tokens.colors.primitive.gray[900],
    bgTertiary: tokens.colors.primitive.gray[800],
    bgInverse: tokens.colors.primitive.gray[50],
    bgDisabled: tokens.colors.primitive.gray[800],
    bgOverlay: 'rgba(0, 0, 0, 0.7)',

    // Border
    borderPrimary: tokens.colors.primitive.gray[800],
    borderSecondary: tokens.colors.primitive.gray[700],
    borderFocus: tokens.colors.primitive.blue[500],
    borderError: tokens.colors.primitive.red[500],
    borderSuccess: tokens.colors.primitive.green[500],
    borderWarning: tokens.colors.primitive.yellow[500],

    // Status
    statusSuccess: tokens.colors.primitive.green[400],
    statusSuccessBg: tokens.colors.primitive.green[950],
    statusSuccessBorder: tokens.colors.primitive.green[800],
    statusError: tokens.colors.primitive.red[400],
    statusErrorBg: tokens.colors.primitive.red[950],
    statusErrorBorder: tokens.colors.primitive.red[800],
    statusWarning: tokens.colors.primitive.yellow[400],
    statusWarningBg: tokens.colors.primitive.yellow[950],
    statusWarningBorder: tokens.colors.primitive.yellow[800],
    statusInfo: tokens.colors.primitive.cyan[400],
    statusInfoBg: tokens.colors.primitive.cyan[950],
    statusInfoBorder: tokens.colors.primitive.cyan[800],

    // Brand
    brandPrimary: tokens.colors.primitive.blue[500],
    brandPrimaryHover: tokens.colors.primitive.blue[400],
    brandPrimaryActive: tokens.colors.primitive.blue[600],
    brandPrimaryBg: tokens.colors.primitive.blue[950],
    brandSecondary: tokens.colors.primitive.purple[500],
    brandSecondaryHover: tokens.colors.primitive.purple[400],
    brandSecondaryActive: tokens.colors.primitive.purple[600],
    brandSecondaryBg: tokens.colors.primitive.purple[950],

    // Interactive
    interactiveDefault: tokens.colors.primitive.blue[500],
    interactiveHover: tokens.colors.primitive.blue[400],
    interactiveActive: tokens.colors.primitive.blue[600],
    interactiveDisabled: tokens.colors.primitive.gray[700],
    interactiveFocus: tokens.colors.primitive.blue[500],

    // Surface
    surfacePrimary: tokens.colors.primitive.gray[900],
    surfaceSecondary: tokens.colors.primitive.gray[800],
    surfaceElevated: '#1C2432', // Between gray[800] and gray[900]

    // Sidebar
    sidebarBg: tokens.colors.primitive.gray[900],
    sidebarItemHover: tokens.colors.primitive.gray[800],
    sidebarItemActive: tokens.colors.primitive.blue[950],
    sidebarItemText: tokens.colors.primitive.gray[300],
    sidebarItemIcon: tokens.colors.primitive.gray[500],

    // Header
    headerBg: tokens.colors.primitive.gray[900],
    headerBorder: tokens.colors.primitive.gray[800],
    headerText: tokens.colors.primitive.gray[50],
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
  },
};

// ===== High Contrast Theme =====

export const highContrastTheme: Theme = {
  mode: 'high-contrast',
  colors: {
    // Text - Higher contrast ratios (AAA compliant)
    textPrimary: tokens.colors.primitive.black,
    textSecondary: tokens.colors.primitive.gray[800],
    textTertiary: tokens.colors.primitive.gray[700],
    textDisabled: tokens.colors.primitive.gray[500],
    textInverse: tokens.colors.primitive.white,
    textLink: tokens.colors.primitive.blue[700],
    textLinkHover: tokens.colors.primitive.blue[900],

    // Background - Pure white/black for maximum contrast
    bgPrimary: tokens.colors.primitive.white,
    bgSecondary: tokens.colors.primitive.gray[100],
    bgTertiary: tokens.colors.primitive.gray[200],
    bgInverse: tokens.colors.primitive.black,
    bgDisabled: tokens.colors.primitive.gray[200],
    bgOverlay: 'rgba(0, 0, 0, 0.8)',

    // Border - Thicker, more visible borders
    borderPrimary: tokens.colors.primitive.gray[900],
    borderSecondary: tokens.colors.primitive.gray[700],
    borderFocus: tokens.colors.primitive.blue[700],
    borderError: tokens.colors.primitive.red[700],
    borderSuccess: tokens.colors.primitive.green[700],
    borderWarning: tokens.colors.primitive.yellow[700],

    // Status - Higher contrast versions
    statusSuccess: tokens.colors.primitive.green[800],
    statusSuccessBg: tokens.colors.primitive.green[100],
    statusSuccessBorder: tokens.colors.primitive.green[900],
    statusError: tokens.colors.primitive.red[800],
    statusErrorBg: tokens.colors.primitive.red[100],
    statusErrorBorder: tokens.colors.primitive.red[900],
    statusWarning: tokens.colors.primitive.yellow[800],
    statusWarningBg: tokens.colors.primitive.yellow[100],
    statusWarningBorder: tokens.colors.primitive.yellow[900],
    statusInfo: tokens.colors.primitive.cyan[800],
    statusInfoBg: tokens.colors.primitive.cyan[100],
    statusInfoBorder: tokens.colors.primitive.cyan[900],

    // Brand
    brandPrimary: tokens.colors.primitive.blue[700],
    brandPrimaryHover: tokens.colors.primitive.blue[800],
    brandPrimaryActive: tokens.colors.primitive.blue[900],
    brandPrimaryBg: tokens.colors.primitive.blue[100],
    brandSecondary: tokens.colors.primitive.purple[700],
    brandSecondaryHover: tokens.colors.primitive.purple[800],
    brandSecondaryActive: tokens.colors.primitive.purple[900],
    brandSecondaryBg: tokens.colors.primitive.purple[100],

    // Interactive
    interactiveDefault: tokens.colors.primitive.blue[700],
    interactiveHover: tokens.colors.primitive.blue[800],
    interactiveActive: tokens.colors.primitive.blue[900],
    interactiveDisabled: tokens.colors.primitive.gray[400],
    interactiveFocus: tokens.colors.primitive.blue[700],

    // Surface
    surfacePrimary: tokens.colors.primitive.white,
    surfaceSecondary: tokens.colors.primitive.gray[100],
    surfaceElevated: tokens.colors.primitive.white,

    // Sidebar
    sidebarBg: tokens.colors.primitive.white,
    sidebarItemHover: tokens.colors.primitive.gray[200],
    sidebarItemActive: tokens.colors.primitive.blue[100],
    sidebarItemText: tokens.colors.primitive.black,
    sidebarItemIcon: tokens.colors.primitive.gray[800],

    // Header
    headerBg: tokens.colors.primitive.white,
    headerBorder: tokens.colors.primitive.black,
    headerText: tokens.colors.primitive.black,
  },
  shadows: {
    // More prominent shadows for better depth perception
    sm: '0 2px 4px 0 rgba(0, 0, 0, 0.3)',
    md: '0 6px 10px -1px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    lg: '0 12px 20px -3px rgba(0, 0, 0, 0.3), 0 6px 10px -4px rgba(0, 0, 0, 0.3)',
    xl: '0 24px 36px -5px rgba(0, 0, 0, 0.4), 0 10px 14px -6px rgba(0, 0, 0, 0.4)',
  },
};

// ===== Theme Collection =====

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  'high-contrast': highContrastTheme,
} as const;

// ===== CSS Variables Generator =====

/**
 * توليد متغيرات CSS من Theme
 */
export function generateCSSVariables(theme: Theme): Record<string, string> {
  const cssVars: Record<string, string> = {};

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    cssVars[`--color-${cssKey}`] = value;
  });

  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });

  // Typography
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = value;
  });

  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    cssVars[`--font-weight-${key}`] = value;
  });

  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    cssVars[`--line-height-${key}`] = value;
  });

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    const cssKey = key.toString().replace('.', '-');
    cssVars[`--spacing-${cssKey}`] = value;
  });

  // Border Radius
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value;
  });

  // Transitions
  Object.entries(tokens.transitions.duration).forEach(([key, value]) => {
    cssVars[`--duration-${key}`] = value;
  });

  return cssVars;
}

/**
 * تطبيق Theme على DOM
 */
export function applyTheme(theme: Theme): void {
  const cssVars = generateCSSVariables(theme);
  const root = document.documentElement;

  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Set data attribute for theme mode
  root.setAttribute('data-theme', theme.mode);
}

/**
 * الحصول على Theme الحالي من التخزين المحلي
 */
export function getStoredTheme(): ThemeMode {
  try {
    const stored = safeLocalStorage.getItem('theme', 'light') as ThemeMode;
    if (stored && ['light', 'dark', 'high-contrast'].includes(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to get stored theme:', error);
  }
  return 'light'; // Default
}

/**
 * حفظ Theme في التخزين المحلي
 */
export function storeTheme(mode: ThemeMode): void {
  try {
    safeLocalStorage.setItem('theme', mode);
  } catch (error) {
    console.warn('Failed to store theme:', error);
  }
}

export default themes;
