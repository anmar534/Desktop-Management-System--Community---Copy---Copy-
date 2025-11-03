/**
 * مفاتيح التخزين الموحدة - مصدر واحد للحقيقة
 * استخدم هذه المفاتيح فقط في كل من التخزين والخدمات
 */

export const STORAGE_KEYS = {
  // كيانات رئيسية
  TENDERS: 'app_tenders_data',
  PROJECTS: 'app_projects_data',
  CLIENTS: 'app_clients_data',

  // إدارة التطوير
  DEVELOPMENT_GOALS: 'development_goals',
  DASHBOARD_KPI_SELECTION: 'dashboard_kpi_selection',

  // مالية/إعدادات (موجودة في utils/storage سابقًا)
  FINANCIAL: 'app_financial_data',
  SETTINGS: 'app_settings_data',
  COMPANY_SETTINGS: 'app_company_settings',
  BANK_ACCOUNTS: 'financial_bank_accounts',
  FINANCIAL_INVOICES: 'financial_invoices',
  FINANCIAL_BUDGETS: 'financial_budgets',
  FINANCIAL_REPORTS: 'financial_reports',

  // كيانات إضافية مستخدمة بالخدمات
  PURCHASE_ORDERS: 'app_purchase_orders_data',
  EXPENSES: 'app_expenses_data',
  BOQ_DATA: 'app_boq_data',
  PRICING_DATA: 'app_pricing_data',

  // علاقات بين الكيانات (Relationships)
  TENDER_PROJECT_RELATIONS: 'app_tender_project_relations',
  PROJECT_PURCHASE_RELATIONS: 'app_project_purchase_relations',

  // Procurement Management
  SUPPLIERS: 'app_suppliers',
  SUPPLIER_CONTRACTS: 'app_supplier_contracts',
  SUPPLIER_EVALUATIONS: 'app_supplier_evaluations',
  PROCUREMENT_REPORTS: 'app_procurement_reports',
  PROCUREMENT_COST_LINKS: 'app_procurement_cost_links',
  BUDGET_CATEGORIES: 'app_budget_categories',
  BUDGET_ALERTS: 'app_budget_alerts',
  STOCK_MOVEMENTS: 'app_stock_movements',
  CONTRACTS: 'app_contracts',

  // Integration Keys
  PROJECT_PROCUREMENT_INTEGRATION: 'app_project_procurement_integration',
  FINANCIAL_PROCUREMENT_INTEGRATION: 'app_financial_procurement_integration',
  LAST_SYNC_DATE: 'app_last_sync_date',

  // System Integration Keys
  SYSTEM_MODULES: 'app_system_modules',
  DATA_FLOWS: 'app_data_flows',
  INTEGRATION_CONFLICTS: 'app_integration_conflicts',
  REALTIME_UPDATES: 'app_realtime_updates',
  LAST_FULL_SYNC: 'app_last_full_sync',

  // Performance Optimization Keys
  PERFORMANCE_METRICS: 'app_performance_metrics',
  ERROR_LOGS: 'app_error_logs',
  OPTIMIZATION_CONFIG: 'app_optimization_config',
  SYSTEM_HEALTH: 'app_system_health',
  RECOVERY_ATTEMPTS: 'app_recovery_attempts',

  // Inventory Management
  INVENTORY_ITEMS: 'app_inventory_items',
  INVENTORY_MOVEMENTS: 'app_inventory_movements',
  INVENTORY_ALERTS: 'app_inventory_alerts',
  INVENTORY_LOCATIONS: 'app_inventory_locations',
  INVENTORY_COUNTS: 'app_inventory_counts',
  INVENTORY_REPORTS: 'app_inventory_reports',

  RELATIONS: 'app_entity_relations',
  // Backups & Stats (new unified keys)
  TENDER_BACKUPS: 'app_tender_backups',
  TENDER_STATS: 'app_tender_stats',
  TENDER_PRICING_WIZARDS: 'app_tender_pricing_wizards',
  // Notifications
  NOTIFICATIONS: 'app_tender_notifications',

  // Enhanced Features (Phase 1)
  PRICING_TEMPLATES: 'app_pricing_templates',
  RISK_ASSESSMENTS: 'app_risk_assessments',

  // Analytics & Competitive Intelligence (Phase 2)
  BID_PERFORMANCES: 'app_bid_performances',
  MARKET_INTELLIGENCE: 'app_market_intelligence',
  COMPETITORS: 'app_competitors',
  MARKET_OPPORTUNITIES: 'app_market_opportunities',
  MARKET_TRENDS: 'app_market_trends',
  SWOT_ANALYSES: 'app_swot_analyses',
  COMPETITIVE_BENCHMARKS: 'app_competitive_benchmarks',
  INTELLIGENCE_REPORTS: 'app_intelligence_reports',
  COMPETITIVE_ALERTS: 'app_competitive_alerts',
  COMPETITIVE_DASHBOARDS: 'app_competitive_dashboards',

  // Historical Data Integration (Phase 2)
  LESSONS_LEARNED: 'app_lessons_learned',
  MIGRATION_HISTORY: 'app_migration_history',
  PATTERN_ANALYSIS: 'app_pattern_analysis',
  HISTORICAL_COMPARISONS: 'app_historical_comparisons',

  // Project Cost Management (Draft/Official Envelopes)
  PROJECT_COST_ENVELOPES: 'app_project_cost_envelopes',
  // Variance & Alerts
  COST_VARIANCE_CONFIG: 'app_cost_variance_config',
  COST_VARIANCE_CACHE: 'app_cost_variance_cache',
  // Security & Monitoring
  SECURITY_AUDIT_LOG: 'app_security_audit_log',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
