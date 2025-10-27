/**
 * Projects Components Export Index
 * Centralized exports for all project management components
 */

// Phase 3 Components - Small UI Components
export { ProjectHeaderBadges } from './ProjectHeaderBadges'
export { ProjectAnalysisCards } from './ProjectAnalysisCards'
export { ProjectHeaderExtras } from './ProjectHeaderExtras'
export { ProjectQuickActions } from './ProjectQuickActions'

// Week 1 Components (keeping only existing ones)
export {
  ProjectStatusBadge,
  getStatusLabel as getProjectStatusLabel,
  getStatusColorClass as getProjectStatusColorClass,
  type ProjectStatusBadgeProps,
} from './ProjectStatusBadge'
export {
  ProjectProgressBar,
  getProgressStatus,
  type ProjectProgressBarProps,
} from './ProjectProgressBar'
export {
  ProjectFinancialSummary,
  getFinancialStatus,
  type ProjectFinancialSummaryProps,
} from './ProjectFinancialSummary'
export {
  ProjectBudgetComparisonTable,
  type ProjectBudgetComparisonTableProps,
} from './ProjectBudgetComparisonTable'
export { ProjectTimelineChart, type ProjectTimelineChartProps } from './ProjectTimelineChart'

// Default export - Using enhanced ProjectsView from pages
export {
  ProjectsView as default,
  type ProjectsViewProps,
} from '@/presentation/pages/Projects/ProjectsPage'

// Re-export types for convenience
export type {
  EnhancedProject,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
  ProjectSortOptions,
  ProjectMetrics,
  ProjectKPI,
  ProjectValidationResult,
  TenderProjectLink,
  ProjectFromTender,
  ProjectBudget,
  ProjectTeam,
  ProjectPhase,
  ProjectMilestone,
  ProjectRisk,
  RiskCategory,
  RiskLevel,
} from '../../types/projects'
