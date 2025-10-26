/**
 * Projects Components Export Index
 * Centralized exports for all project management components
 */

export { default as ProjectsManager } from './ProjectsManager'
export { default as ProjectsList } from './ProjectsList'
// export { default as ProjectDetails } from './ProjectDetails' // TODO: Create this component
export { default as ProjectForm } from './ProjectForm'

// Week 1 Components
export { ProjectCard, type ProjectCardProps } from './ProjectCard'
export { ProjectListItem, type ProjectListItemProps } from './ProjectListItem'
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
export { ProjectOverviewPanel, type ProjectOverviewPanelProps } from './ProjectOverviewPanel'
export { ProjectCostsPanel, type ProjectCostsPanelProps } from './ProjectCostsPanel'
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
