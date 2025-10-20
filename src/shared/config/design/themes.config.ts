/**
 * Themes Configuration
 *
 * نظام السمات المتعددة:
 * - Light Theme (السمة الفاتحة - الافتراضية)
 * - Dark Theme (السمة الداكنة)
 * - High Contrast Theme (سمة التباين العالي - لإمكانية الوصول)
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import { colorTokens, hslToString } from './tokens.config';

// ============================================
// Theme Types
// ============================================

export type ThemeName = 'light' | 'dark' | 'high-contrast';

export interface ThemeColors {
  // Base colors
  background: string;
  foreground: string;

  // Card colors
  card: string;
  cardForeground: string;

  // Popover colors
  popover: string;
  popoverForeground: string;

  // Primary colors
  primary: string;
  primaryForeground: string;

  // Secondary colors
  secondary: string;
  secondaryForeground: string;

  // Muted colors
  muted: string;
  mutedForeground: string;

  // Accent colors
  accent: string;
  accentForeground: string;

  // Destructive colors
  destructive: string;
  destructiveForeground: string;

  // Border colors
  border: string;
  input: string;
  ring: string;

  // Semantic colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  error: string;
  errorForeground: string;
  info: string;
  infoForeground: string;

  // Tender-specific colors
  tenderUrgent: string;
  tenderUrgentForeground: string;
  tenderNormal: string;
  tenderNormalForeground: string;

  // Chart colors
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  chart6: string;
  chart7: string;
  chart8: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: ThemeColors;
}

// ============================================
// Light Theme
// ============================================

export const lightTheme: Theme = {
  name: 'light',
  displayName: 'فاتح',
  colors: {
    // Base
    background: hslToString(colorTokens.neutral[50]),
    foreground: hslToString(colorTokens.neutral[900]),

    // Card
    card: hslToString(colorTokens.neutral[50]),
    cardForeground: hslToString(colorTokens.neutral[900]),

    // Popover
    popover: hslToString(colorTokens.neutral[50]),
    popoverForeground: hslToString(colorTokens.neutral[900]),

    // Primary
    primary: hslToString(colorTokens.brand.primary[900]),
    primaryForeground: hslToString(colorTokens.neutral[50]),

    // Secondary
    secondary: hslToString(colorTokens.brand.secondary[100]),
    secondaryForeground: hslToString(colorTokens.brand.primary[900]),

    // Muted
    muted: hslToString(colorTokens.neutral[100]),
    mutedForeground: hslToString(colorTokens.neutral[500]),

    // Accent
    accent: hslToString(colorTokens.brand.secondary[100]),
    accentForeground: hslToString(colorTokens.brand.primary[900]),

    // Destructive
    destructive: hslToString(colorTokens.semantic.error[500]),
    destructiveForeground: hslToString(colorTokens.neutral[50]),

    // Borders
    border: hslToString(colorTokens.neutral[200]),
    input: hslToString(colorTokens.neutral[200]),
    ring: hslToString(colorTokens.brand.primary[900]),

    // Semantic
    success: hslToString(colorTokens.semantic.success[600]),
    successForeground: hslToString(colorTokens.neutral[50]),
    warning: hslToString(colorTokens.semantic.warning[500]),
    warningForeground: hslToString(colorTokens.neutral[900]),
    error: hslToString(colorTokens.semantic.error[500]),
    errorForeground: hslToString(colorTokens.neutral[50]),
    info: hslToString(colorTokens.semantic.info[500]),
    infoForeground: hslToString(colorTokens.neutral[50]),

    // Tender-specific
    tenderUrgent: hslToString(colorTokens.tender.urgent[500]),
    tenderUrgentForeground: hslToString(colorTokens.neutral[50]),
    tenderNormal: hslToString(colorTokens.tender.normal[500]),
    tenderNormalForeground: hslToString(colorTokens.neutral[50]),

    // Charts
    chart1: hslToString(colorTokens.charts.blue),
    chart2: hslToString(colorTokens.charts.green),
    chart3: hslToString(colorTokens.charts.yellow),
    chart4: hslToString(colorTokens.charts.red),
    chart5: hslToString(colorTokens.charts.purple),
    chart6: hslToString(colorTokens.charts.orange),
    chart7: hslToString(colorTokens.charts.teal),
    chart8: hslToString(colorTokens.charts.pink),
  },
};

// ============================================
// Dark Theme
// ============================================

export const darkTheme: Theme = {
  name: 'dark',
  displayName: 'داكن',
  colors: {
    // Base
    background: hslToString(colorTokens.neutral[950]),
    foreground: hslToString(colorTokens.neutral[50]),

    // Card
    card: hslToString(colorTokens.neutral[900]),
    cardForeground: hslToString(colorTokens.neutral[50]),

    // Popover
    popover: hslToString(colorTokens.neutral[900]),
    popoverForeground: hslToString(colorTokens.neutral[50]),

    // Primary
    primary: hslToString(colorTokens.brand.primary[400]),
    primaryForeground: hslToString(colorTokens.neutral[950]),

    // Secondary
    secondary: hslToString(colorTokens.neutral[800]),
    secondaryForeground: hslToString(colorTokens.neutral[50]),

    // Muted
    muted: hslToString(colorTokens.neutral[800]),
    mutedForeground: hslToString(colorTokens.neutral[400]),

    // Accent
    accent: hslToString(colorTokens.neutral[800]),
    accentForeground: hslToString(colorTokens.neutral[50]),

    // Destructive
    destructive: hslToString(colorTokens.semantic.error[800]),
    destructiveForeground: hslToString(colorTokens.neutral[50]),

    // Borders
    border: hslToString(colorTokens.neutral[800]),
    input: hslToString(colorTokens.neutral[800]),
    ring: hslToString(colorTokens.brand.primary[400]),

    // Semantic
    success: hslToString(colorTokens.semantic.success[600]),
    successForeground: hslToString(colorTokens.neutral[50]),
    warning: hslToString(colorTokens.semantic.warning[500]),
    warningForeground: hslToString(colorTokens.neutral[900]),
    error: hslToString(colorTokens.semantic.error[500]),
    errorForeground: hslToString(colorTokens.neutral[50]),
    info: hslToString(colorTokens.semantic.info[400]),
    infoForeground: hslToString(colorTokens.neutral[50]),

    // Tender-specific
    tenderUrgent: hslToString(colorTokens.tender.urgent[500]),
    tenderUrgentForeground: hslToString(colorTokens.neutral[50]),
    tenderNormal: hslToString(colorTokens.brand.primary[400]),
    tenderNormalForeground: hslToString(colorTokens.neutral[950]),

    // Charts (brightened for dark theme)
    chart1: hslToString({ h: 221, s: 83, l: 65 }), // lighter blue
    chart2: hslToString({ h: 142, s: 76, l: 50 }), // lighter green
    chart3: hslToString({ h: 45, s: 93, l: 60 }),  // lighter yellow
    chart4: hslToString({ h: 0, s: 84, l: 70 }),   // lighter red
    chart5: hslToString({ h: 262, s: 52, l: 60 }), // lighter purple
    chart6: hslToString({ h: 24, s: 94, l: 65 }),  // lighter orange
    chart7: hslToString({ h: 173, s: 80, l: 55 }), // lighter teal
    chart8: hslToString({ h: 330, s: 81, l: 70 }), // lighter pink
  },
};

// ============================================
// High Contrast Theme
// ============================================

export const highContrastTheme: Theme = {
  name: 'high-contrast',
  displayName: 'تباين عالي',
  colors: {
    // Base - أقصى تباين
    background: hslToString({ h: 0, s: 0, l: 0 }),    // أسود نقي
    foreground: hslToString({ h: 0, s: 0, l: 100 }),  // أبيض نقي

    // Card
    card: hslToString({ h: 0, s: 0, l: 5 }),
    cardForeground: hslToString({ h: 0, s: 0, l: 100 }),

    // Popover
    popover: hslToString({ h: 0, s: 0, l: 5 }),
    popoverForeground: hslToString({ h: 0, s: 0, l: 100 }),

    // Primary - أصفر فاتح جداً للتباين
    primary: hslToString({ h: 60, s: 100, l: 50 }),
    primaryForeground: hslToString({ h: 0, s: 0, l: 0 }),

    // Secondary
    secondary: hslToString({ h: 0, s: 0, l: 15 }),
    secondaryForeground: hslToString({ h: 0, s: 0, l: 100 }),

    // Muted
    muted: hslToString({ h: 0, s: 0, l: 20 }),
    mutedForeground: hslToString({ h: 0, s: 0, l: 85 }),

    // Accent
    accent: hslToString({ h: 180, s: 100, l: 50 }),   // سماوي فاتح
    accentForeground: hslToString({ h: 0, s: 0, l: 0 }),

    // Destructive
    destructive: hslToString({ h: 0, s: 100, l: 50 }), // أحمر نقي
    destructiveForeground: hslToString({ h: 0, s: 0, l: 100 }),

    // Borders - حدود واضحة
    border: hslToString({ h: 0, s: 0, l: 40 }),
    input: hslToString({ h: 0, s: 0, l: 40 }),
    ring: hslToString({ h: 60, s: 100, l: 50 }),

    // Semantic - ألوان مشبعة للتباين
    success: hslToString({ h: 120, s: 100, l: 50 }),  // أخضر نقي
    successForeground: hslToString({ h: 0, s: 0, l: 0 }),
    warning: hslToString({ h: 45, s: 100, l: 50 }),   // برتقالي فاتح
    warningForeground: hslToString({ h: 0, s: 0, l: 0 }),
    error: hslToString({ h: 0, s: 100, l: 50 }),      // أحمر نقي
    errorForeground: hslToString({ h: 0, s: 0, l: 100 }),
    info: hslToString({ h: 200, s: 100, l: 50 }),     // أزرق فاتح
    infoForeground: hslToString({ h: 0, s: 0, l: 0 }),

    // Tender-specific
    tenderUrgent: hslToString({ h: 0, s: 100, l: 50 }),
    tenderUrgentForeground: hslToString({ h: 0, s: 0, l: 100 }),
    tenderNormal: hslToString({ h: 60, s: 100, l: 50 }),
    tenderNormalForeground: hslToString({ h: 0, s: 0, l: 0 }),

    // Charts - ألوان مشبعة للتباين
    chart1: hslToString({ h: 220, s: 100, l: 60 }),
    chart2: hslToString({ h: 120, s: 100, l: 50 }),
    chart3: hslToString({ h: 60, s: 100, l: 50 }),
    chart4: hslToString({ h: 0, s: 100, l: 50 }),
    chart5: hslToString({ h: 280, s: 100, l: 60 }),
    chart6: hslToString({ h: 30, s: 100, l: 50 }),
    chart7: hslToString({ h: 180, s: 100, l: 50 }),
    chart8: hslToString({ h: 320, s: 100, l: 60 }),
  },
};

// ============================================
// Theme Registry
// ============================================

export const themes: Record<ThemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  'high-contrast': highContrastTheme,
};

// ============================================
// Helper Functions
// ============================================

/**
 * الحصول على سمة حسب الاسم
 */
export const getTheme = (name: ThemeName): Theme => {
  return themes[name];
};

/**
 * الحصول على قائمة بجميع السمات المتاحة
 */
export const getAllThemes = (): Theme[] => {
  return Object.values(themes);
};

/**
 * تحويل ألوان السمة إلى CSS variables
 */
export const themeToCSSVariables = (theme: Theme): Record<string, string> => {
  const cssVars: Record<string, string> = {};

  // Base colors
  cssVars['--background'] = theme.colors.background;
  cssVars['--foreground'] = theme.colors.foreground;

  // Card
  cssVars['--card'] = theme.colors.card;
  cssVars['--card-foreground'] = theme.colors.cardForeground;

  // Popover
  cssVars['--popover'] = theme.colors.popover;
  cssVars['--popover-foreground'] = theme.colors.popoverForeground;

  // Primary
  cssVars['--primary'] = theme.colors.primary;
  cssVars['--primary-foreground'] = theme.colors.primaryForeground;

  // Secondary
  cssVars['--secondary'] = theme.colors.secondary;
  cssVars['--secondary-foreground'] = theme.colors.secondaryForeground;

  // Muted
  cssVars['--muted'] = theme.colors.muted;
  cssVars['--muted-foreground'] = theme.colors.mutedForeground;

  // Accent
  cssVars['--accent'] = theme.colors.accent;
  cssVars['--accent-foreground'] = theme.colors.accentForeground;

  // Destructive
  cssVars['--destructive'] = theme.colors.destructive;
  cssVars['--destructive-foreground'] = theme.colors.destructiveForeground;

  // Borders
  cssVars['--border'] = theme.colors.border;
  cssVars['--input'] = theme.colors.input;
  cssVars['--ring'] = theme.colors.ring;

  // Semantic
  cssVars['--success'] = theme.colors.success;
  cssVars['--success-foreground'] = theme.colors.successForeground;
  cssVars['--warning'] = theme.colors.warning;
  cssVars['--warning-foreground'] = theme.colors.warningForeground;
  cssVars['--error'] = theme.colors.error;
  cssVars['--error-foreground'] = theme.colors.errorForeground;
  cssVars['--info'] = theme.colors.info;
  cssVars['--info-foreground'] = theme.colors.infoForeground;

  // Tender-specific
  cssVars['--tender-urgent'] = theme.colors.tenderUrgent;
  cssVars['--tender-urgent-foreground'] = theme.colors.tenderUrgentForeground;
  cssVars['--tender-normal'] = theme.colors.tenderNormal;
  cssVars['--tender-normal-foreground'] = theme.colors.tenderNormalForeground;

  // Charts
  cssVars['--chart-1'] = theme.colors.chart1;
  cssVars['--chart-2'] = theme.colors.chart2;
  cssVars['--chart-3'] = theme.colors.chart3;
  cssVars['--chart-4'] = theme.colors.chart4;
  cssVars['--chart-5'] = theme.colors.chart5;
  cssVars['--chart-6'] = theme.colors.chart6;
  cssVars['--chart-7'] = theme.colors.chart7;
  cssVars['--chart-8'] = theme.colors.chart8;

  return cssVars;
};

/**
 * تطبيق سمة على document root
 */
export const applyTheme = (themeName: ThemeName): void => {
  const theme = getTheme(themeName);
  const cssVars = themeToCSSVariables(theme);

  const root = document.documentElement;

  // إزالة جميع فئات السمات السابقة
  root.classList.remove('light', 'dark', 'high-contrast');

  // إضافة فئة السمة الجديدة
  root.classList.add(themeName);

  // تطبيق CSS variables
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export default themes;
