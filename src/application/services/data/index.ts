/**
 * 📦 Data Services - Focused Services Layer
 *
 * تم تقسيم centralDataService (767 سطر) إلى 7 خدمات متخصصة:
 *
 * 1. TenderDataService.ts (226 سطر) - إدارة المنافسات
 * 2. ProjectDataService.ts (195 سطر) - إدارة المشاريع
 * 3. ClientDataService.ts (178 سطر) - إدارة العملاء
 * 4. RelationshipService.ts (262 سطر) - إدارة العلاقات بين الكيانات
 * 5. BOQDataService.ts (213 سطر) - إدارة جداول الكميات
 * 6. PurchaseOrderService.ts (196 سطر) - إدارة أوامر الشراء
 * 7. TenderAnalyticsService.ts (330 سطر) - تحليلات وإحصائيات المنافسات
 *
 * Total: 1,600 سطر (مقابل 767 سطر)
 * السبب: Separation of Concerns + Better Documentation + More Features
 */

// Export services
export { TenderDataService, tenderDataService } from './TenderDataService'
export { ProjectDataService, projectDataService } from './ProjectDataService'
export { ClientDataService, clientDataService } from './ClientDataService'
export {
  RelationshipService,
  relationshipService,
  type TenderProjectRelation,
  type ProjectPurchaseRelation,
} from './RelationshipService'
export { BOQDataService, boqDataService } from './BOQDataService'
export { PurchaseOrderService, purchaseOrderService } from './PurchaseOrderService'
export {
  TenderAnalyticsService,
  tenderAnalyticsService,
  type TenderStatsByStatus,
  type ComprehensiveTenderStats,
  type FinancialSummary,
  type PerformanceMetrics,
} from './TenderAnalyticsService'

// Re-export types for convenience
export type { Tender, Project, Client } from '@/data/centralData'
export type { BOQData } from '@/shared/types/boq'
export type { PurchaseOrder } from '@/shared/types/contracts'
