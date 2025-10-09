/**
 * مفاتيح التخزين الموحدة - مصدر واحد للحقيقة
 * استخدم هذه المفاتيح فقط في كل من التخزين والخدمات
 */

export const STORAGE_KEYS = {
  // كيانات رئيسية
  TENDERS: 'app_tenders_data',
  PROJECTS: 'app_projects_data',
  CLIENTS: 'app_clients_data',

  // مالية/إعدادات (موجودة في utils/storage سابقًا)
  FINANCIAL: 'app_financial_data',
  SETTINGS: 'app_settings_data',
  BANK_ACCOUNTS: 'financial_bank_accounts',
  FINANCIAL_INVOICES: 'financial_invoices',
  FINANCIAL_BUDGETS: 'financial_budgets',
  FINANCIAL_REPORTS: 'financial_reports',

  // كيانات إضافية مستخدمة بالخدمات
  PURCHASE_ORDERS: 'app_purchase_orders_data',
  EXPENSES: 'app_expenses_data',
  BOQ_DATA: 'app_boq_data',
  PRICING_DATA: 'app_pricing_data',
  PRICING_SNAPSHOTS: 'app_pricing_snapshots', // تخزين اللقطات المحسوبة (Snapshot) لكل مناقصة
  // طبقات التسعير الجديدة (فصل الرسمي عن المسودة)
  PRICING_OFFICIAL: 'app_pricing_official',
  PRICING_DRAFT: 'app_pricing_draft',
  RELATIONS: 'app_entity_relations',
  // Backups & Stats (new unified keys)
  TENDER_BACKUPS: 'app_tender_backups',
  TENDER_STATS: 'app_tender_stats',
  TENDER_PRICING_WIZARDS: 'app_tender_pricing_wizards',
  // Notifications
  NOTIFICATIONS: 'app_tender_notifications'
  ,
  // Project Cost Management (Draft/Official Envelopes)
  PROJECT_COST_ENVELOPES: 'app_project_cost_envelopes',
  // Variance & Alerts
  COST_VARIANCE_CONFIG: 'app_cost_variance_config',
  COST_VARIANCE_CACHE: 'app_cost_variance_cache',
  // Security & Monitoring
  SECURITY_AUDIT_LOG: 'app_security_audit_log'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
