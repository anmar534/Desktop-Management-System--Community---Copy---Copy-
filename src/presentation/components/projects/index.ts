/**
 * Projects Components Export Index
 * Centralized exports for all project management components
 */

export { default as ProjectsManager } from './ProjectsManager'
export { default as ProjectsList } from './ProjectsList'
export { default as ProjectDetails } from './ProjectDetails'
export { default as ProjectForm } from './ProjectForm'

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
  RiskLevel
} from '../../types/projects'

