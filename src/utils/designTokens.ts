/**
 * Mapping between semantic token keys and their CSS variable identifiers.
 * Keep this in sync with `globals.css` and `tokens.config.ts`.
 */
const TOKEN_VARIABLES = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  success: '--success',
  successForeground: '--success-foreground',
  warning: '--warning',
  warningForeground: '--warning-foreground',
  error: '--error',
  errorForeground: '--error-foreground',
  info: '--info',
  infoForeground: '--info-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
  chart1: '--chart-1',
  chart2: '--chart-2',
  chart3: '--chart-3',
  chart4: '--chart-4',
  chart5: '--chart-5',
  chart6: '--chart-6',
  chart7: '--chart-7',
  chart8: '--chart-8',
} as const;

export type DesignTokenKey = keyof typeof TOKEN_VARIABLES;

const CSS_VARIABLE_TO_TOKEN = new Map<string, DesignTokenKey>(
  Object.entries(TOKEN_VARIABLES).map(([key, cssVar]) => [cssVar, key as DesignTokenKey])
);

const FALLBACK_COLORS: Partial<Record<DesignTokenKey, string>> = {
  primary: 'hsl(221, 83%, 53%)',
  secondary: 'hsl(210, 16%, 82%)',
  accent: 'hsl(24, 94%, 50%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(45, 93%, 47%)',
  error: 'hsl(0, 84%, 60%)',
  info: 'hsl(221, 83%, 65%)',
  background: '#ffffff',
  foreground: '#111827',
  chart1: 'hsl(221, 83%, 53%)',
  chart2: 'hsl(142, 76%, 36%)',
  chart3: 'hsl(45, 93%, 47%)',
  chart4: 'hsl(0, 84%, 60%)',
  chart5: 'hsl(260, 60%, 60%)',
  chart6: 'hsl(24, 94%, 50%)',
  chart7: 'hsl(173, 80%, 45%)',
  chart8: 'hsl(330, 81%, 60%)',
};

export interface GetTokenValueOptions {
  element?: HTMLElement | null;
}

export interface GetTokenColorOptions extends GetTokenValueOptions {
  alpha?: number;
  fallback?: string;
}

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

const formatCssHsl = (value: string): string => value.trim().replace(/\s+/g, ', ');

const clampAlpha = (value: number): number => {
  if (Number.isNaN(value)) {
    return 1;
  }
  return Math.min(Math.max(value, 0), 1);
};

/**
 * Resolve the CSS variable assigned to a given token key.
 */
export const getDesignTokenVariable = (token: DesignTokenKey): string => TOKEN_VARIABLES[token];

/**
 * Returns an expression suitable for CSS usage, e.g. `hsl(var(--primary))`.
 */
export const getDesignTokenExpression = (token: DesignTokenKey, mode: 'hsl' | 'var' = 'hsl'): string => {
  const cssVar = getDesignTokenVariable(token);
  if (mode === 'var') {
    return `var(${cssVar})`;
  }
  return `hsl(var(${cssVar}))`;
};

/**
 * Attempts to read the computed value of a CSS custom property backing the token.
 */
export const getDesignTokenValue = (
  token: DesignTokenKey,
  options: GetTokenValueOptions = {}
): string | null => {
  if (!isBrowser()) {
    return null;
  }

  const target = options.element ?? document.documentElement;
  const cssVar = getDesignTokenVariable(token);
  const computed = getComputedStyle(target).getPropertyValue(cssVar);
  if (!computed) {
    return null;
  }
  const trimmed = computed.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Resolve the token value into a usable color string (hsl/hsla) for Canvas/Web APIs.
 */
export const getDesignTokenColor = (
  token: DesignTokenKey,
  options: GetTokenColorOptions = {}
): string | null => {
  const rawValue = getDesignTokenValue(token, options);
  if (!rawValue) {
    const fallback = options.fallback ?? FALLBACK_COLORS[token];
    if (!fallback) {
      return null;
    }
    if (typeof options.alpha === 'number') {
      return fallback.replace(/hsla?\(/, 'hsla(').replace(/\)$/, `, ${clampAlpha(options.alpha)})`);
    }
    return fallback;
  }

  const formatted = formatCssHsl(rawValue);
  if (typeof options.alpha === 'number') {
    return `hsla(${formatted}, ${clampAlpha(options.alpha)})`;
  }
  return `hsl(${formatted})`;
};

/**
 * Extract a token key from a `var(--token)` expression.
 */
export const resolveTokenFromExpression = (expression: string): DesignTokenKey | null => {
  const match = /--[a-z0-9-]+/i.exec(expression);
  if (!match) {
    return null;
  }
  const cssVar = match[0];
  return CSS_VARIABLE_TO_TOKEN.get(cssVar) ?? null;
};

/**
 * Quick reference for external tooling / Storybook docs.
 */
export const listDesignTokens = (): DesignTokenKey[] => Object.keys(TOKEN_VARIABLES) as DesignTokenKey[];

export default {
  getDesignTokenVariable,
  getDesignTokenExpression,
  getDesignTokenValue,
  getDesignTokenColor,
  resolveTokenFromExpression,
  listDesignTokens,
};
