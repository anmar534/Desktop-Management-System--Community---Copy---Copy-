// ============================================================================
// Central Exports - Tenders Components
// ============================================================================
// Organized following the same pattern as projects/index.ts

// Week 1 Components - Core Display Components
export { TenderMetricsDisplay } from './TenderMetricsDisplay'
export type { TenderMetricsDisplayProps } from './TenderMetricsDisplay'

export { TenderPerformanceCards } from './TenderPerformanceCards'
export { EnhancedTenderCard } from './EnhancedTenderCard'
export { VirtualizedTenderList } from './VirtualizedTenderList'

// Tender Details & Management
export { TenderDetails } from './TenderDetails'
export { TenderDeleteDialog, TenderSubmitDialog } from './TenderDialogs'
export { TenderTabs } from './TenderTabs'

// Tender Sections
export { AttachmentsSection } from './AttachmentsSection'
export type { AttachmentsSectionProps } from './AttachmentsSection'

export { TenderBasicInfoSection } from './TenderBasicInfoSection'
export type { TenderBasicInfoSectionProps } from './TenderBasicInfoSection'

export { QuantityTableSection } from './QuantityTableSection'
export type { QuantityTableSectionProps } from './QuantityTableSection'

// Pricing & Templates
export { PricingTemplateManager } from './PricingTemplateManager'
export { RiskAssessmentMatrix } from './RiskAssessmentMatrix'

// Default export - Main view (if exists)
// Note: TenderDetails serves as the main detailed view
