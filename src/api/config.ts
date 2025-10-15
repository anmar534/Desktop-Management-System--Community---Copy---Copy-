/**
 * API Configuration
 * Sprint 5.3: تطوير APIs للتكامل الخارجي
 */

import type { ApiEndpoint, RateLimitConfig } from './types'

// ============================================================================
// API Version and Base Configuration
// ============================================================================

export const API_VERSION = 'v1'
export const API_BASE_PATH = `/api/${API_VERSION}`

export const API_CONFIG = {
  version: API_VERSION,
  basePath: API_BASE_PATH,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

export const RATE_LIMIT_CONFIG: Record<string, RateLimitConfig> = {
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
  },
  write: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
  },
  reports: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
}

// ============================================================================
// API Endpoints Registry
// ============================================================================

export const API_ENDPOINTS: ApiEndpoint[] = [
  // Authentication Endpoints
  {
    path: '/auth/login',
    method: 'POST',
    description: 'Authenticate user and get access token',
    descriptionAr: 'تسجيل الدخول والحصول على رمز الوصول',
    permissions: [],
    version: API_VERSION,
  },
  {
    path: '/auth/refresh',
    method: 'POST',
    description: 'Refresh access token',
    descriptionAr: 'تحديث رمز الوصول',
    permissions: [],
    version: API_VERSION,
  },
  {
    path: '/auth/logout',
    method: 'POST',
    description: 'Logout and invalidate token',
    descriptionAr: 'تسجيل الخروج وإلغاء الرمز',
    permissions: [],
    version: API_VERSION,
  },

  // Tenders Endpoints
  {
    path: '/tenders',
    method: 'GET',
    description: 'Get all tenders',
    descriptionAr: 'الحصول على جميع المنافسات',
    permissions: ['tenders:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/tenders/:id',
    method: 'GET',
    description: 'Get tender by ID',
    descriptionAr: 'الحصول على منافسة محددة',
    permissions: ['tenders:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/tenders',
    method: 'POST',
    description: 'Create new tender',
    descriptionAr: 'إنشاء منافسة جديدة',
    permissions: ['tenders:write'],
    rateLimit: 50,
    version: API_VERSION,
  },
  {
    path: '/tenders/:id',
    method: 'PUT',
    description: 'Update tender',
    descriptionAr: 'تحديث منافسة',
    permissions: ['tenders:write'],
    rateLimit: 50,
    version: API_VERSION,
  },
  {
    path: '/tenders/:id',
    method: 'DELETE',
    description: 'Delete tender',
    descriptionAr: 'حذف منافسة',
    permissions: ['tenders:delete'],
    rateLimit: 50,
    version: API_VERSION,
  },
  {
    path: '/tenders/:id/pricing',
    method: 'GET',
    description: 'Get tender pricing data',
    descriptionAr: 'الحصول على بيانات تسعير المنافسة',
    permissions: ['tenders:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/tenders/:id/boq',
    method: 'GET',
    description: 'Get tender BOQ',
    descriptionAr: 'الحصول على جدول الكميات',
    permissions: ['tenders:read'],
    rateLimit: 200,
    version: API_VERSION,
  },

  // Projects Endpoints
  {
    path: '/projects',
    method: 'GET',
    description: 'Get all projects',
    descriptionAr: 'الحصول على جميع المشاريع',
    permissions: ['projects:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/projects/:id',
    method: 'GET',
    description: 'Get project by ID',
    descriptionAr: 'الحصول على مشروع محدد',
    permissions: ['projects:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/projects',
    method: 'POST',
    description: 'Create new project',
    descriptionAr: 'إنشاء مشروع جديد',
    permissions: ['projects:write'],
    rateLimit: 50,
    version: API_VERSION,
  },
  {
    path: '/projects/:id',
    method: 'PUT',
    description: 'Update project',
    descriptionAr: 'تحديث مشروع',
    permissions: ['projects:write'],
    rateLimit: 50,
    version: API_VERSION,
  },
  {
    path: '/projects/:id',
    method: 'DELETE',
    description: 'Delete project',
    descriptionAr: 'حذف مشروع',
    permissions: ['projects:delete'],
    rateLimit: 50,
    version: API_VERSION,
  },
  {
    path: '/projects/:id/costs',
    method: 'GET',
    description: 'Get project costs',
    descriptionAr: 'الحصول على تكاليف المشروع',
    permissions: ['projects:read', 'financial:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/projects/:id/schedule',
    method: 'GET',
    description: 'Get project schedule',
    descriptionAr: 'الحصول على جدول المشروع',
    permissions: ['projects:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/projects/:id/tasks',
    method: 'GET',
    description: 'Get project tasks',
    descriptionAr: 'الحصول على مهام المشروع',
    permissions: ['projects:read'],
    rateLimit: 200,
    version: API_VERSION,
  },

  // Financial Endpoints
  {
    path: '/financial/invoices',
    method: 'GET',
    description: 'Get all invoices',
    descriptionAr: 'الحصول على جميع الفواتير',
    permissions: ['financial:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/financial/invoices/:id',
    method: 'GET',
    description: 'Get invoice by ID',
    descriptionAr: 'الحصول على فاتورة محددة',
    permissions: ['financial:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/financial/invoices',
    method: 'POST',
    description: 'Create new invoice',
    descriptionAr: 'إنشاء فاتورة جديدة',
    permissions: ['financial:write'],
    rateLimit: 50,
    version: API_VERSION,
  },
  {
    path: '/financial/bank-accounts',
    method: 'GET',
    description: 'Get all bank accounts',
    descriptionAr: 'الحصول على جميع الحسابات البنكية',
    permissions: ['financial:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/financial/budgets',
    method: 'GET',
    description: 'Get all budgets',
    descriptionAr: 'الحصول على جميع الميزانيات',
    permissions: ['financial:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/financial/reports',
    method: 'GET',
    description: 'Get financial reports',
    descriptionAr: 'الحصول على التقارير المالية',
    permissions: ['financial:read', 'reports:read'],
    rateLimit: 10,
    version: API_VERSION,
  },
  {
    path: '/financial/statements',
    method: 'GET',
    description: 'Get financial statements',
    descriptionAr: 'الحصول على القوائم المالية',
    permissions: ['financial:read', 'reports:read'],
    rateLimit: 10,
    version: API_VERSION,
  },

  // Procurement Endpoints
  {
    path: '/procurement/orders',
    method: 'GET',
    description: 'Get all purchase orders',
    descriptionAr: 'الحصول على جميع أوامر الشراء',
    permissions: ['procurement:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/procurement/orders/:id',
    method: 'GET',
    description: 'Get purchase order by ID',
    descriptionAr: 'الحصول على أمر شراء محدد',
    permissions: ['procurement:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/procurement/orders',
    method: 'POST',
    description: 'Create new purchase order',
    descriptionAr: 'إنشاء أمر شراء جديد',
    permissions: ['procurement:write'],
    rateLimit: 50,
    version: API_VERSION,
  },
  {
    path: '/procurement/suppliers',
    method: 'GET',
    description: 'Get all suppliers',
    descriptionAr: 'الحصول على جميع الموردين',
    permissions: ['procurement:read'],
    rateLimit: 200,
    version: API_VERSION,
  },
  {
    path: '/procurement/inventory',
    method: 'GET',
    description: 'Get inventory items',
    descriptionAr: 'الحصول على عناصر المخزون',
    permissions: ['procurement:read'],
    rateLimit: 200,
    version: API_VERSION,
  },

  // Analytics & Reports Endpoints
  {
    path: '/analytics/dashboard',
    method: 'GET',
    description: 'Get dashboard analytics',
    descriptionAr: 'الحصول على تحليلات لوحة التحكم',
    permissions: ['analytics:read'],
    rateLimit: 100,
    version: API_VERSION,
  },
  {
    path: '/analytics/kpis',
    method: 'GET',
    description: 'Get KPIs',
    descriptionAr: 'الحصول على مؤشرات الأداء',
    permissions: ['analytics:read'],
    rateLimit: 100,
    version: API_VERSION,
  },
  {
    path: '/reports/generate',
    method: 'POST',
    description: 'Generate custom report',
    descriptionAr: 'إنشاء تقرير مخصص',
    permissions: ['reports:write'],
    rateLimit: 10,
    version: API_VERSION,
  },
]

// ============================================================================
// Error Codes
// ============================================================================

export const API_ERROR_CODES = {
  // Authentication Errors (1xxx)
  UNAUTHORIZED: '1001',
  INVALID_CREDENTIALS: '1002',
  TOKEN_EXPIRED: '1003',
  INVALID_TOKEN: '1004',
  INSUFFICIENT_PERMISSIONS: '1005',

  // Validation Errors (2xxx)
  VALIDATION_ERROR: '2001',
  INVALID_INPUT: '2002',
  MISSING_REQUIRED_FIELD: '2003',
  INVALID_FORMAT: '2004',

  // Resource Errors (3xxx)
  RESOURCE_NOT_FOUND: '3001',
  RESOURCE_ALREADY_EXISTS: '3002',
  RESOURCE_CONFLICT: '3003',

  // Rate Limiting Errors (4xxx)
  RATE_LIMIT_EXCEEDED: '4001',
  QUOTA_EXCEEDED: '4002',

  // Server Errors (5xxx)
  INTERNAL_SERVER_ERROR: '5001',
  SERVICE_UNAVAILABLE: '5002',
  DATABASE_ERROR: '5003',
  EXTERNAL_SERVICE_ERROR: '5004',
} as const

