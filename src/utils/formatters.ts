/**
 * 🎨 ملف التنسيق الموحد - Unified Formatters
 * دوال تنسيق موحدة لتجنب التكرار في النظام
 */

// ===== أنواع وخيارات شائعة =====

export interface CurrencyOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
}

export type NumberFormatOptionsWithLocale = Intl.NumberFormatOptions & { locale?: string };
export type DateTimeFormatOptionsWithLocale = Intl.DateTimeFormatOptions & { locale?: string };
export type DateOptions = DateTimeFormatOptionsWithLocale;
export type DateLike = string | number | Date | null | undefined;

const DEFAULT_LOCALE = 'ar-SA';

const numberFormatterCache = new Map<string, Intl.NumberFormat>();
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

const cacheKey = (prefix: string, locale: string, options: Record<string, unknown>): string =>
  `${prefix}:${locale}:${JSON.stringify(options)}`;

const getNumberFormatter = (options: NumberFormatOptionsWithLocale = {}): Intl.NumberFormat => {
  const { locale = DEFAULT_LOCALE, ...rest } = options;
  const key = cacheKey('number', locale, rest);
  let formatter = numberFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, rest);
    numberFormatterCache.set(key, formatter);
  }
  return formatter;
};

const getDateFormatter = (options: DateTimeFormatOptionsWithLocale = {}): Intl.DateTimeFormat => {
  const { locale = DEFAULT_LOCALE, ...rest } = options;
  const key = cacheKey('date', locale, rest);
  let formatter = dateFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, rest);
    dateFormatterCache.set(key, formatter);
  }
  return formatter;
};

const sanitizeNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDateOrNull = (value: DateLike): Date | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// ===== دوال تنسيق الأرقام =====

export const formatNumber = (
  value: number | string | null | undefined,
  options?: NumberFormatOptionsWithLocale,
  fallback = '0'
): string => {
  const numeric = sanitizeNumber(value);
  if (numeric === null) return fallback;
  return getNumberFormatter(options).format(numeric);
};

export const formatInteger = (
  value: number | string | null | undefined,
  options?: NumberFormatOptionsWithLocale,
  fallback = '0'
): string => {
  return formatNumber(
    value,
    { minimumFractionDigits: 0, maximumFractionDigits: 0, ...options },
    fallback
  );
};

export const formatDecimal = (
  value: number | string | null | undefined,
  options?: NumberFormatOptionsWithLocale,
  fallback = '0'
): string => {
  return formatNumber(
    value,
    { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options },
    fallback
  );
};

// ===== دوال تنسيق الوقت والتاريخ =====

export const formatDateValue = (
  value: DateLike,
  options?: DateTimeFormatOptionsWithLocale,
  fallback = '—'
): string => {
  const date = toDateOrNull(value);
  if (!date) return fallback;
  return getDateFormatter(options).format(date);
};

export const formatDateTime = (
  value: DateLike,
  options?: DateTimeFormatOptionsWithLocale,
  fallback = '—'
): string => {
  return formatDateValue(
    value,
    {
      dateStyle: 'short',
      timeStyle: 'short',
      ...options
    },
    fallback
  );
};

export const formatTime = (
  value: DateLike,
  options?: DateTimeFormatOptionsWithLocale,
  fallback = '—'
): string => {
  return formatDateValue(
    value,
    {
      timeStyle: 'short',
      ...options
    },
    fallback
  );
};

export const formatDateOnly = (
  value: DateLike,
  options?: DateTimeFormatOptionsWithLocale,
  fallback = '—'
): string => {
  return formatDateValue(
    value,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    },
    fallback
  );
};

export const formatDate = (date: string | Date, options?: DateOptions): string => {
  return formatDateValue(date, options);
};

export const formatShortDate = (date: string | Date, locale = DEFAULT_LOCALE): string => {
  return formatDateValue(date, {
    locale,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateWithDay = (date: string | Date, locale = DEFAULT_LOCALE): string => {
  return formatDateValue(date, {
    locale,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ===== دوال تنسيق العملة =====

export const formatCurrency = (amount: number, options?: CurrencyOptions): string => {
  const {
    currency = 'SAR',
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    notation = 'standard'
  } = options ?? {};

  const normalized = sanitizeNumber(amount) ?? 0;

  return getNumberFormatter({
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
    locale
  }).format(normalized);
};

export const formatCurrencyCompact = (amount: number, options?: Omit<CurrencyOptions, 'notation'>): string => {
  return formatCurrency(amount, { ...options, notation: 'compact' });
};

export const formatSmartCurrency = (amount: number, showCurrency = true): string => {
  const normalized = sanitizeNumber(amount) ?? 0;
  if (normalized >= 1_000_000) {
    const millions = normalized / 1_000_000;
    const formatted = millions.toFixed(millions >= 100 ? 0 : millions >= 10 ? 1 : 2);
    return showCurrency ? `${formatted} مليون ريال` : `${formatted} مليون`;
  }
  if (normalized >= 1_000) {
    const thousands = normalized / 1_000;
    const formatted = thousands.toFixed(thousands >= 100 ? 0 : thousands >= 10 ? 1 : 2);
    return showCurrency ? `${formatted} ألف ريال` : `${formatted} ألف`;
  }
  const base = formatInteger(normalized);
  return showCurrency ? `${base} ريال` : base;
};

export const formatLargeNumber = (num: number): string => {
  const normalized = sanitizeNumber(num) ?? 0;
  if (normalized >= 1_000_000_000) {
    return `${(normalized / 1_000_000_000).toFixed(1)}B`;
  }
  if (normalized >= 1_000_000) {
    return `${(normalized / 1_000_000).toFixed(1)}M`;
  }
  if (normalized >= 1_000) {
    return `${(normalized / 1_000).toFixed(1)}K`;
  }
  return formatInteger(normalized);
};

// ===== دوال تنسيق النسب =====

export const formatPercentage = (percentage: number, decimals = 1): string => {
  const normalized = sanitizeNumber(percentage) ?? 0;
  return `${normalized.toFixed(decimals)}%`;
};

export const formatPercentageIntl = (
  value: number,
  options?: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  const {
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 1
  } = options ?? {};

  const normalized = sanitizeNumber(value) ?? 0;

  return getNumberFormatter({
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
    locale
  }).format(normalized);
};

// ===== دوال مساعدة للوقت =====

export const daysBetween = (date1: string | Date, date2: string | Date): number => {
  const d1 = toDateOrNull(date1) ?? new Date(0);
  const d2 = toDateOrNull(date2) ?? new Date(0);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDuration = (days: number): string => {
  const normalized = sanitizeNumber(days) ?? 0;
  if (normalized === 0) return 'اليوم';
  if (normalized === 1) return 'يوم واحد';
  if (normalized === 2) return 'يومان';
  if (normalized >= 3 && normalized <= 10) return `${normalized} أيام`;
  if (normalized >= 11 && normalized <= 30) return `${normalized} يوماً`;
  if (normalized >= 31 && normalized <= 60) return `${normalized} يوماً`;
  if (normalized >= 61 && normalized <= 365) return `${Math.round(normalized / 30)} شهر`;
  return `${Math.round(normalized / 365)} سنة`;
};

// ===== دوال تنسيق خاصة بالمنافسات =====

export const formatTenderValue = (totalValue?: number | null, fallbackValue?: number | null): string => {
  const value = sanitizeNumber(totalValue) ?? sanitizeNumber(fallbackValue) ?? 0;
  return formatCurrency(value);
};

export const formatTenderName = (name: string, maxLength = 50): string => {
  if (!name) return 'غير محدد';
  if (name.length <= maxLength) return name;
  return `${name.substring(0, maxLength)}...`;
};

export const formatTenderClient = (client: string): string => {
  if (!client) return 'غير محدد';
  return client.trim();
};

export const formatTenderType = (type: string): string => {
  if (!type) return 'غير محدد';
  return type;
};

export const formatTenderDate = (deadline: string): string => {
  if (!deadline) return 'غير محدد';
  return formatDateValue(deadline, undefined, 'تاريخ غير صحيح');
};

// ===== تصدير الدوال المتوافقة مع الإصدارات السابقة =====

export const formatTenderCurrency = formatCurrency;

export default {
  formatCurrency,
  formatCurrencyCompact,
  formatSmartCurrency,
  formatLargeNumber,
  formatNumber,
  formatInteger,
  formatDecimal,
  formatDate,
  formatShortDate,
  formatDateWithDay,
  formatDateTime,
  formatTime,
  formatDateOnly,
  formatDateValue,
  formatPercentage,
  formatPercentageIntl,
  daysBetween,
  formatDuration,
  formatTenderValue,
  formatTenderName,
  formatTenderClient,
  formatTenderType,
  formatTenderDate,
  formatTenderCurrency
};