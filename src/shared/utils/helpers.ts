/**
 * 🔧 وظائف مساعدة للنظام
 * System Utility Functions
 */

// تنسيق العملة (موقوف - استخدم formatters.ts)
// Deprecated: use functions from formatters.ts instead. Left as wrapper for backward compatibility.
import { formatCurrency as _formatCurrency, formatDate as _formatDate, formatShortDate as _formatShortDate } from './formatters';
import { authorizeExport } from './security/desktopSecurity';
export const formatCurrency = (amount: number, currency = 'SAR'): string => _formatCurrency(amount, { currency });
export const formatDate = (date: string | Date, locale = 'ar-SA'): string => _formatDate(date, { locale });
export const formatShortDate = (date: string | Date, locale = 'ar-SA'): string => _formatShortDate(date, locale);

// حساب عدد الأيام بين تاريخين
export const daysBetween = (date1: string | Date, date2: string | Date): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// تنسيق الأرقام الكبيرة (موقوف) - استبدل بـ formatLargeNumber في formatters.ts
import { formatLargeNumber as _formatLargeNumber } from './formatters';
export const formatLargeNumber = (num: number): string => _formatLargeNumber(num);

// ألوان الحالة / الأولوية / الصحة / التقدم (موقوفة – تفويض للوحدة الجديدة)
// Deprecated color helpers: delegate to unified statusColors to avoid divergence.
import { getStatusColor as _getStatusColor, getPriorityColor as _getPriorityColor, getHealthColor as _getHealthColor, getProgressColor as _getProgressColor } from './ui/statusColors';
/**
 * @deprecated استخدم getStatusColor من statusColors.ts مباشرة
 */
export const getStatusColor = (status: string): string => _getStatusColor(status);
/**
 * @deprecated استخدم getPriorityColor من statusColors.ts مباشرة
 */
export const getPriorityColor = (priority: string): string => _getPriorityColor(priority);
/**
 * @deprecated استخدم getHealthColor من statusColors.ts مباشرة (يدعم أيضاً aliases: good|warning|critical)
 */
export const getHealthColor = (health: string): string => _getHealthColor(health);
/**
 * @deprecated استخدم getProgressColor من statusColors.ts مباشرة
 */
export const getProgressColor = (progress: number): string => _getProgressColor(progress);

// توليد ID فريد
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// تحويل النص إلى slug
export const slugify = (text: string): string => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// تحقق من صحة الإيميل
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// تحقق من صحة رقم الهاتف السعودي
export const validateSaudiPhone = (phone: string): boolean => {
  const saudiPhoneRegex = /^(\+966|966|0)?(5[0-9]{8})$/;
  return saudiPhoneRegex.test(phone);
};

// تحقق من قوة كلمة المرور
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 1;
  else feedback.push('يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('يجب أن تحتوي على حرف صغير');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('يجب أن تحتوي على حرف كبير');

  if (/\d/.test(password)) score += 1;
  else feedback.push('يجب أن تحتوي على رقم');

  if (/[^A-Za-z\d]/.test(password)) score += 1;
  else feedback.push('يجب أن تحتوي على رمز خاص');

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

// تحويل البيانات للتصدير
export const exportToCSV = async <T extends Record<string, unknown>>(data: T[], filename: string): Promise<void> => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]) as (keyof T)[];
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value ?? '';
        })
        .join(',')
    )
  ].join('\n');

  const encoder = new TextEncoder();
  const bytes = encoder.encode(csvContent).length;

  const authorization = await authorizeExport({
    format: 'csv',
    filename,
    bytes,
    rows: data.length,
    origin: 'helpers.exportToCSV'
  });

  if (!authorization.allowed) {
    throw new Error(authorization.reason ?? 'export-not-authorized');
  }

  const sanitizedFilename = authorization.payload?.filename ?? filename;
  const finalFilename = sanitizedFilename.endsWith('.csv') ? sanitizedFilename : `${sanitizedFilename}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = finalFilename;
  link.click();
};

// تحويل البيانات إلى JSON للتصدير
export const exportToJSON = async <T>(data: T, filename: string): Promise<void> => {
  const jsonStr = JSON.stringify(data, null, 2);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(jsonStr).length;

  const authorization = await authorizeExport({
    format: 'json',
    filename,
    bytes,
    origin: 'helpers.exportToJSON'
  });

  if (!authorization.allowed) {
    throw new Error(authorization.reason ?? 'export-not-authorized');
  }

  const sanitizedFilename = authorization.payload?.filename ?? filename;
  const finalFilename = sanitizedFilename.endsWith('.json') ? sanitizedFilename : `${sanitizedFilename}.json`;

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = finalFilename;
  link.click();
};

// ضغط وإلغاء ضغط البيانات
export const compressData = <T>(data: T): string => {
  return btoa(encodeURIComponent(JSON.stringify(data)));
};

export const decompressData = <T>(compressedData: string): T => {
  return JSON.parse(decodeURIComponent(atob(compressedData))) as T;
};

// وظائف البحث والتصفية
export const searchInArray = <T extends Record<string, unknown>>(
  array: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] => {
  if (!searchTerm) return array;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return array.filter(item =>
    fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) {
        return false;
      }
      return String(value).toLowerCase().includes(lowerSearchTerm);
    })
  );
};

// ترقيم الصفحات
export const paginate = <T>(array: T[], page: number, limit: number): {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
} => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const data = array.slice(startIndex, endIndex);
  const totalPages = Math.ceil(array.length / limit);

  return {
    data,
    total: array.length,
    totalPages,
    currentPage: page,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

// تحديث التخزين المحلي بشكل آمن
// تم نقل safeLocalStorage إلى storage.ts للتوافق مع electron-store
// Safe storage interface moved to storage.ts for electron-store compatibility
// استخدم: import { safeLocalStorage } from '@/utils/storage';
export { safeLocalStorage } from './storage';

// معاينة التقدم كنسبة مئوية
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
};

// تحويل الوقت إلى صيغة قابلة للقراءة
export const timeAgo = (date: string | Date, locale = 'ar-SA'): string => {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return rtf.format(-diffYears, 'year');
  if (diffMonths > 0) return rtf.format(-diffMonths, 'month');
  if (diffWeeks > 0) return rtf.format(-diffWeeks, 'week');
  if (diffDays > 0) return rtf.format(-diffDays, 'day');
  if (diffHours > 0) return rtf.format(-diffHours, 'hour');
  if (diffMinutes > 0) return rtf.format(-diffMinutes, 'minute');
  return rtf.format(-diffSeconds, 'second');
};

// تحقق من حالة الشبكة
export const checkOnlineStatus = (): boolean => {
  return navigator.onLine;
};

// إضافة مستمع لحالة الشبكة
export const addNetworkListener = (
  onOnline: () => void,
  onOffline: () => void
): () => void => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

// تحديد نوع الجهاز
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// تحسين الأداء - Debounce
export const debounce = <TArgs extends unknown[]>(
  func: (...params: TArgs) => void,
  delay: number
): ((...args: TArgs) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// تحسين الأداء - Throttle
export const throttle = <TArgs extends unknown[]>(
  func: (...params: TArgs) => void,
  delay: number
): ((...args: TArgs) => void) => {
  let lastCall = 0;
  return (...args: TArgs) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};
