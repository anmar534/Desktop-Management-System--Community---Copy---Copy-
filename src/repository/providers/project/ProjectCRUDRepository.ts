/**
 * Project CRUD Repository
 * Handles basic Create, Read, Update, Delete operations for projects
 */

import type { EnhancedProject, CreateProjectRequest, UpdateProjectRequest } from '@/types/projects'
import type { Status, Health } from '@/types/contracts'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import {
  generateProjectId,
  generateProjectCode,
  generateId,
  createDefaultBudget,
  createDefaultTeam,
  createDefaultPhases,
} from './ProjectHelpers'
import { projectValidationRepository } from './ProjectValidationRepository'

const ENHANCED_PROJECTS_KEY = 'enhanced_projects'

export class ProjectCRUDRepository {
  // ============================================================================
  // Read Operations
  // ============================================================================

  /**
   * Get all projects from storage
   */
  async getAll(): Promise<EnhancedProject[]> {
    try {
      const projects = safeLocalStorage.getItem<EnhancedProject[]>(ENHANCED_PROJECTS_KEY, [])
      return this.initializeDefaultProjects(projects)
    } catch (error) {
      console.error('Error getting all projects:', error)
      return []
    }
  }

  /**
   * Get project by ID
   */
  async getById(id: string): Promise<EnhancedProject | null> {
    try {
      const projects = await this.getAll()
      return projects.find((project) => project.id === id) || null
    } catch (error) {
      console.error('Error getting project by id:', error)
      return null
    }
  }

  // ============================================================================
  // Create Operation
  // ============================================================================

  /**
   * Create a new project
   */
  async create(data: CreateProjectRequest): Promise<EnhancedProject> {
    try {
      const projects = await this.getAll()

      // Validate the request
      const validation = await projectValidationRepository.validateProject(data)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      const now = new Date().toISOString()
      const projectId = generateProjectId()

      // Create enhanced project with all required fields
      const enhancedProject: EnhancedProject = {
        id: projectId,
        name: data.name,
        nameEn: data.nameEn,
        description: data.description,
        code: generateProjectCode(),

        // Client Information
        client: '', // Will be populated from clientId
        clientId: data.clientId,
        clientContact: '',
        clientContactId: undefined,

        // Status and Progress
        status: 'planning' as Status,
        priority: data.priority,
        health: 'green' as Health,
        progress: 0,
        phase: 'initiation',
        phaseId: 'phase_initiation',

        // Dates
        startDate: data.startDate,
        endDate: data.endDate,
        actualStartDate: undefined,
        actualEndDate: undefined,
        createdAt: now,
        updatedAt: now,

        // Location and Classification
        location: data.location,
        address: undefined,
        coordinates: undefined,
        category: data.category,
        type: data.type,
        tags: data.tags || [],

        // Financial Information
        budget: createDefaultBudget(projectId, data.budget),
        contractValue: data.budget,
        profitMargin: 0,

        // Team and Resources
        team: createDefaultTeam(projectId, data.projectManagerId),

        // Planning and Execution
        phases: createDefaultPhases(),
        milestones: [],
        risks: [],

        // Tender Integration
        tenderLink: data.fromTenderId
          ? {
              id: generateId(),
              tenderId: data.fromTenderId,
              projectId: projectId,
              linkType: 'created_from',
              linkDate: now,
              metadata: {},
            }
          : undefined,
        fromTender: undefined,

        // Documentation
        attachments: [],
        notes: '',

        // Metadata
        metadata: {},

        // Audit Trail
        createdBy: 'current_user', // TODO: Get from auth context
        lastModifiedBy: 'current_user',
        version: 1,
      }

      projects.push(enhancedProject)
      this.persist(projects)

      return enhancedProject
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  // ============================================================================
  // Update Operation
  // ============================================================================

  /**
   * Update an existing project
   */
  async update(data: UpdateProjectRequest): Promise<EnhancedProject | null> {
    try {
      const projects = await this.getAll()
      const index = projects.findIndex((p) => p.id === data.id)

      if (index === -1) {
        return null
      }

      const existingProject = projects[index]

      // Version check for optimistic locking
      if (existingProject.version !== data.version) {
        throw new Error('Project has been modified by another user. Please refresh and try again.')
      }

      // Validate the update
      const validation = await projectValidationRepository.validateProject(data)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      const now = new Date().toISOString()

      // Update the project - preserve budget type
      const updatedProject: EnhancedProject = {
        ...existingProject,
        ...data,
        id: existingProject.id, // Ensure ID doesn't change
        budget:
          typeof data.budget === 'number'
            ? createDefaultBudget(existingProject.id, data.budget)
            : data.budget || existingProject.budget,
        updatedAt: now,
        lastModifiedBy: 'current_user', // TODO: Get from auth context
        version: existingProject.version + 1,
      }

      projects[index] = updatedProject
      this.persist(projects)

      return updatedProject
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  // ============================================================================
  // Delete Operation
  // ============================================================================

  /**
   * Delete a project
   */
  async delete(id: string): Promise<boolean> {
    try {
      const projects = await this.getAll()
      const index = projects.findIndex((p) => p.id === id)

      if (index === -1) {
        return false
      }

      projects.splice(index, 1)
      this.persist(projects)

      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  // ============================================================================
  // Utility Operations
  // ============================================================================

  /**
   * Reload projects from storage
   */
  async reload(): Promise<EnhancedProject[]> {
    return this.getAll()
  }

  /**
   * Persist projects to storage
   */
  private persist(projects: EnhancedProject[]): void {
    safeLocalStorage.setItem(ENHANCED_PROJECTS_KEY, projects)
  }

  /**
   * Initialize with default projects if empty
   */
  private async initializeDefaultProjects(projects: EnhancedProject[]): Promise<EnhancedProject[]> {
    if (projects.length === 0) {
      // Create sample projects for development
      const sampleProjects: EnhancedProject[] = []
      this.persist(sampleProjects)
      return sampleProjects
    }
    return projects
  }
}

// Export singleton instance
export const projectCRUDRepository = new ProjectCRUDRepository()
