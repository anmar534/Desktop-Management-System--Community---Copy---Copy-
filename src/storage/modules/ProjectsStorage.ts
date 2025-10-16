/**
 * Projects Storage Module
 *
 * @module storage/modules/ProjectsStorage
 * @description Specialized storage module for projects data
 */

import { StorageManager } from '../core/StorageManager'
import type { IStorageModule } from '../core/types'
import { STORAGE_KEYS } from '../../config/storageKeys'
import type { Project } from '../../data/centralData'

/**
 * Projects storage module
 * Handles all project-related storage operations
 */
export class ProjectsStorage implements IStorageModule {
  readonly name = 'ProjectsStorage'
  readonly keys = [
    STORAGE_KEYS.PROJECTS,
    'construction_app_projects', // Legacy key
    'projects', // Legacy fallback key
  ] as const

  private manager: StorageManager

  constructor() {
    this.manager = StorageManager.getInstance()
  }

  /**
   * Initialize projects storage
   */
  async initialize(): Promise<void> {
    await this.manager.waitForReady()

    // Try to migrate legacy data
    await this.migrateLegacyProjects()
  }

  /**
   * Get all projects
   * @param defaultValue Default value if no projects found
   */
  async getAll(defaultValue: Project[] = []): Promise<Project[]> {
    return this.manager.get<Project[]>(STORAGE_KEYS.PROJECTS, defaultValue)
  }

  /**
   * Save all projects
   * @param projects Projects array to save
   */
  async saveAll(projects: Project[]): Promise<void> {
    await this.manager.set(STORAGE_KEYS.PROJECTS, projects)
  }

  /**
   * Get project by ID
   * @param id Project ID
   */
  async getById(id: string): Promise<Project | null> {
    const projects = await this.getAll()
    return projects.find((p) => p.id === id) ?? null
  }

  /**
   * Add new project
   * @param project Project to add
   */
  async add(project: Project): Promise<void> {
    const projects = await this.getAll()

    // Check for duplicate ID
    if (projects.some((p) => p.id === project.id)) {
      throw new Error(`Project with ID "${project.id}" already exists`)
    }

    projects.push(project)
    await this.saveAll(projects)
  }

  /**
   * Update existing project
   * @param id Project ID
   * @param updates Partial project data to update
   */
  async update(id: string, updates: Partial<Project>): Promise<void> {
    const projects = await this.getAll()
    const index = projects.findIndex((p) => p.id === id)

    if (index === -1) {
      throw new Error(`Project with ID "${id}" not found`)
    }

    projects[index] = {
      ...projects[index],
      ...updates,
      lastUpdate: new Date().toISOString(),
    }

    await this.saveAll(projects)
  }

  /**
   * Delete project
   * @param id Project ID
   */
  async delete(id: string): Promise<void> {
    const projects = await this.getAll()
    const filtered = projects.filter((p) => p.id !== id)

    if (filtered.length === projects.length) {
      throw new Error(`Project with ID "${id}" not found`)
    }

    await this.saveAll(filtered)
  }

  /**
   * Clear all projects
   */
  async clear(): Promise<void> {
    await this.manager.set(STORAGE_KEYS.PROJECTS, [])
  }

  /**
   * Import projects (replace existing)
   * @param projects Projects to import
   */
  async import(projects: Project[]): Promise<void> {
    await this.saveAll(projects)
  }

  /**
   * Export projects
   */
  async export(): Promise<Project[]> {
    return this.getAll()
  }

  /**
   * Migrate legacy projects from old storage keys
   */
  private async migrateLegacyProjects(): Promise<void> {
    // Check if modern key already has data
    const existing = await this.manager.get<Project[] | null>(STORAGE_KEYS.PROJECTS, null)
    if (existing && existing.length > 0) {
      // Already migrated
      return
    }

    // Try legacy prefixed key
    const legacyPrefixed = await this.manager.get<Project[] | null>(
      'construction_app_projects',
      null,
    )
    if (legacyPrefixed && legacyPrefixed.length > 0) {
      await this.import(legacyPrefixed)
      await this.manager.remove('construction_app_projects')
      console.log('✅ Migrated projects from construction_app_projects')
      return
    }

    // Try legacy plain key
    const legacyPlain = await this.manager.get<Project[] | null>('projects', null)
    if (legacyPlain && legacyPlain.length > 0) {
      await this.import(legacyPlain)
      await this.manager.remove('projects')
      console.log('✅ Migrated projects from legacy projects key')
      return
    }

    // Try localStorage directly (for very old data)
    /* eslint-disable no-restricted-properties */
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEYS.PROJECTS)
        if (raw) {
          const parsed = JSON.parse(raw) as Project[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            await this.import(parsed)
            window.localStorage.removeItem(STORAGE_KEYS.PROJECTS)
            console.log('✅ Migrated projects from localStorage')
            return
          }
        }
      }
    } catch (error) {
      console.warn('Failed to migrate from localStorage:', error)
    }
    /* eslint-enable no-restricted-properties */
  }

  /**
   * Cleanup module resources
   */
  async cleanup(): Promise<void> {
    // Nothing to cleanup for now
  }

  /**
   * Get projects count
   */
  async count(): Promise<number> {
    const projects = await this.getAll()
    return projects.length
  }

  /**
   * Check if project exists
   * @param id Project ID
   */
  async exists(id: string): Promise<boolean> {
    const project = await this.getById(id)
    return project !== null
  }

  /**
   * Search projects by name
   * @param query Search query
   */
  async search(query: string): Promise<Project[]> {
    const projects = await this.getAll()
    const lowerQuery = query.toLowerCase()

    return projects.filter((p) => p.name.toLowerCase().includes(lowerQuery))
  }

  /**
   * Sort projects by field
   * @param field Field to sort by
   * @param order Sort order
   */
  async sort(field: keyof Project, order: 'asc' | 'desc' = 'asc'): Promise<Project[]> {
    const projects = await this.getAll()

    return projects.sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]

      if (aVal === bVal) return 0

      // Type-safe comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal)
        return order === 'asc' ? comparison : -comparison
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        const comparison = aVal - bVal
        return order === 'asc' ? comparison : -comparison
      }

      // Fallback to string comparison
      const comparison = String(aVal).localeCompare(String(bVal))
      return order === 'asc' ? comparison : -comparison
    })
  }
}

// Export singleton instance
export const projectsStorage = new ProjectsStorage()
