/**
 * Projects Components Export Index
 * Centralized exports for all project management components
 */

export { default as ProjectsManager } from './ProjectsManager'
export { default as ProjectsList } from './ProjectsList'
// export { default as ProjectDetails } from './ProjectDetails' // TODO: Create this component
export { default as ProjectForm } from './ProjectForm'

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
