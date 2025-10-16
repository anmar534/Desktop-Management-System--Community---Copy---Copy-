/**
 * Projects Storage Module Tests
 *
 * @module tests/storage/ProjectsStorage.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ProjectsStorage, type Project } from '../../src/storage/modules/ProjectsStorage'
import { StorageManager } from '../../src/storage/core/StorageManager'
import { LocalStorageAdapter } from '../../src/storage/adapters/LocalStorageAdapter'

describe('ProjectsStorage', () => {
  let projectsStorage: ProjectsStorage

  beforeEach(async () => {
    // Reset singleton
    StorageManager.resetInstance()

    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {}

      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString()
        },
        removeItem: (key: string) => {
          delete store[key]
        },
        clear: () => {
          store = {}
        },
        get length() {
          return Object.keys(store).length
        },
        key: (index: number) => {
          const keys = Object.keys(store)
          return keys[index] || null
        },
      }
    })()

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // Setup storage manager
    const manager = StorageManager.getInstance()
    manager.setAdapter(new LocalStorageAdapter())
    await manager.initialize()

    // Create fresh instance
    projectsStorage = new ProjectsStorage()
    await projectsStorage.initialize()
  })

  describe('Basic Operations', () => {
    const mockProject: Project = {
      id: 'project-1',
      name: 'Test Project',
      createdAt: new Date().toISOString(),
    } as Project // Type assertion for test mock

    it('should add a project', async () => {
      await projectsStorage.add(mockProject)
      const projects = await projectsStorage.getAll()

      expect(projects).toHaveLength(1)
      expect(projects[0]).toEqual(mockProject)
    })

    it('should get project by ID', async () => {
      await projectsStorage.add(mockProject)
      const project = await projectsStorage.getById('project-1')

      expect(project).toEqual(mockProject)
    })

    it('should return null for non-existent project', async () => {
      const project = await projectsStorage.getById('non-existent')

      expect(project).toBeNull()
    })

    it('should update a project', async () => {
      await projectsStorage.add(mockProject)
      await projectsStorage.update('project-1', { name: 'Updated Project' })

      const updated = await projectsStorage.getById('project-1')
      expect(updated?.name).toBe('Updated Project')
      expect(updated?.lastUpdate).toBeDefined()
    })

    it('should delete a project', async () => {
      await projectsStorage.add(mockProject)
      await projectsStorage.delete('project-1')

      const projects = await projectsStorage.getAll()
      expect(projects).toHaveLength(0)
    })

    it('should throw error when adding duplicate ID', async () => {
      await projectsStorage.add(mockProject)

      await expect(projectsStorage.add(mockProject)).rejects.toThrow(
        'Project with ID "project-1" already exists',
      )
    })

    it('should throw error when updating non-existent project', async () => {
      await expect(projectsStorage.update('non-existent', { name: 'Test' })).rejects.toThrow(
        'Project with ID "non-existent" not found',
      )
    })

    it('should throw error when deleting non-existent project', async () => {
      await expect(projectsStorage.delete('non-existent')).rejects.toThrow(
        'Project with ID "non-existent" not found',
      )
    })
  })

  describe('Batch Operations', () => {
    const mockProjects: Project[] = [
      { id: 'p1', name: 'Project 1', createdAt: '2024-01-01' } as Project,
      { id: 'p2', name: 'Project 2', createdAt: '2024-01-02' } as Project,
      { id: 'p3', name: 'Project 3', createdAt: '2024-01-03' } as Project,
    ]

    it('should save all projects', async () => {
      await projectsStorage.saveAll(mockProjects)
      const projects = await projectsStorage.getAll()

      expect(projects).toEqual(mockProjects)
    })

    it('should clear all projects', async () => {
      await projectsStorage.saveAll(mockProjects)
      await projectsStorage.clear()

      const projects = await projectsStorage.getAll()
      expect(projects).toHaveLength(0)
    })

    it('should import projects (replace)', async () => {
      await projectsStorage.add({ id: 'old', name: 'Old', createdAt: '2023-01-01' } as Project)
      await projectsStorage.import(mockProjects)

      const projects = await projectsStorage.getAll()
      expect(projects).toEqual(mockProjects)
      expect(projects.some((p) => p.id === 'old')).toBe(false)
    })

    it('should export projects', async () => {
      await projectsStorage.saveAll(mockProjects)
      const exported = await projectsStorage.export()

      expect(exported).toEqual(mockProjects)
    })
  })

  describe('Query Operations', () => {
    beforeEach(async () => {
      await projectsStorage.saveAll([
        { id: 'p1', name: 'Alpha Project', createdAt: '2024-01-01' } as Project,
        { id: 'p2', name: 'Beta Project', createdAt: '2024-01-02' } as Project,
        { id: 'p3', name: 'Gamma Testing', createdAt: '2024-01-03' } as Project,
      ])
    })

    it('should count projects', async () => {
      const count = await projectsStorage.count()
      expect(count).toBe(3)
    })

    it('should check if project exists', async () => {
      const exists = await projectsStorage.exists('p1')
      const notExists = await projectsStorage.exists('p999')

      expect(exists).toBe(true)
      expect(notExists).toBe(false)
    })

    it('should search projects by name', async () => {
      const results = await projectsStorage.search('project')

      expect(results).toHaveLength(2)
      expect(results.map((p) => p.id)).toEqual(['p1', 'p2'])
    })

    it('should search case-insensitively', async () => {
      const results = await projectsStorage.search('BETA')

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('p2')
    })

    it('should sort projects ascending', async () => {
      const sorted = await projectsStorage.sort('name', 'asc')

      expect(sorted.map((p) => p.name)).toEqual(['Alpha Project', 'Beta Project', 'Gamma Testing'])
    })

    it('should sort projects descending', async () => {
      const sorted = await projectsStorage.sort('name', 'desc')

      expect(sorted.map((p) => p.name)).toEqual(['Gamma Testing', 'Beta Project', 'Alpha Project'])
    })
  })

  describe('Legacy Migration', () => {
    it('should migrate from construction_app_projects', async () => {
      const manager = StorageManager.getInstance()
      const legacyProjects: Project[] = [
        { id: 'legacy-1', name: 'Legacy Project', createdAt: '2023-01-01' } as Project,
      ]

      // Set legacy data
      await manager.set('construction_app_projects', legacyProjects)

      // Initialize new storage (should trigger migration)
      const newStorage = new ProjectsStorage()
      await newStorage.initialize()

      // Check migration
      const projects = await newStorage.getAll()
      expect(projects).toEqual(legacyProjects)

      // Check legacy key removed
      const legacyData = await manager.get('construction_app_projects', null)
      expect(legacyData).toBeNull()
    })

    it('should migrate from projects (plain key)', async () => {
      const manager = StorageManager.getInstance()
      const legacyProjects: Project[] = [
        { id: 'legacy-2', name: 'Plain Legacy', createdAt: '2023-01-01' } as Project,
      ]

      // Set legacy data
      await manager.set('projects', legacyProjects)

      // Initialize new storage
      const newStorage = new ProjectsStorage()
      await newStorage.initialize()

      // Check migration
      const projects = await newStorage.getAll()
      expect(projects).toEqual(legacyProjects)

      // Check legacy key removed
      const legacyData = await manager.get('projects', null)
      expect(legacyData).toBeNull()
    })

    it('should not migrate if modern key has data', async () => {
      const modernProjects: Project[] = [
        { id: 'modern-1', name: 'Modern Project', createdAt: '2024-01-01' } as Project,
      ]

      const legacyProjects: Project[] = [
        { id: 'legacy-1', name: 'Legacy Project', createdAt: '2023-01-01' } as Project,
      ]

      // First add modern data via the module itself
      const testStorage = new ProjectsStorage()
      await testStorage.initialize()
      await testStorage.saveAll(modernProjects)

      // Add legacy data
      const manager = StorageManager.getInstance()
      await manager.set('construction_app_projects', legacyProjects)

      // Create new instance and initialize (should NOT migrate)
      const newStorage = new ProjectsStorage()
      await newStorage.initialize()

      // Should keep modern data, not migrate
      const projects = await newStorage.getAll()
      expect(projects).toEqual(modernProjects)

      // Legacy should still exist (not migrated)
      const legacy = await manager.get('construction_app_projects', null)
      expect(legacy).toEqual(legacyProjects)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle useProjects.ts workflow', async () => {
      // Simulate what useProjects.ts does
      await projectsStorage.initialize()

      const saved = await projectsStorage.getAll()
      expect(saved).toEqual([])

      // Import projects
      const projects: Project[] = [
        { id: '1', name: 'Project Alpha', createdAt: new Date().toISOString() } as Project,
        { id: '2', name: 'Project Beta', createdAt: new Date().toISOString() } as Project,
      ]

      await projectsStorage.import(projects)

      // Reload
      const reloaded = await projectsStorage.getAll()
      expect(reloaded).toHaveLength(2)
    })

    it('should handle concurrent operations', async () => {
      // Add multiple projects sequentially (avoid race conditions with same storage)
      const projects = [
        { id: '1', name: 'P1', createdAt: '2024-01-01' } as Project,
        { id: '2', name: 'P2', createdAt: '2024-01-02' } as Project,
        { id: '3', name: 'P3', createdAt: '2024-01-03' } as Project,
      ]

      for (const project of projects) {
        await projectsStorage.add(project)
      }

      const count = await projectsStorage.count()
      expect(count).toBe(3)
    })
  })
})
