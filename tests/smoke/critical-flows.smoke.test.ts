/**
 * Smoke Test: Critical User Flows
 *
 * Verifies that critical end-to-end user journeys work correctly.
 * These tests ensure the most important features of the application
 * are functioning properly.
 *
 * @smoke
 * @priority critical
 */

import { describe, it, expect, beforeEach } from 'vitest'
import storage from '../../src/utils/storage'

describe('Smoke Test: Critical User Flows', () => {
  beforeEach(() => {
    // Clean slate for each test
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  })

  describe('Tender Lifecycle', () => {
    it('should create, edit, and finalize a tender', () => {
      interface Tender {
        id: string
        title: string
        status: string
        description?: string
        budget?: number
        createdAt: string
        updatedAt?: string
        finalizedAt?: string
      }

      // Step 1: Create new tender
      const newTender: Tender = {
        id: 'tender_001',
        title: 'New Construction Project',
        status: 'draft',
        createdAt: new Date().toISOString(),
      }

      storage.setItem('app_tenders_data', [newTender])
      let tenders = storage.getItem('app_tenders_data', []) as unknown as Tender[]
      expect(tenders.length).toBe(1)
      expect(tenders[0].status).toBe('draft')

      // Step 2: Edit tender details
      tenders = tenders.map((t) =>
        t.id === 'tender_001'
          ? {
              ...t,
              description: 'Building renovation project',
              budget: 500000,
              updatedAt: new Date().toISOString(),
            }
          : t,
      )
      storage.setItem('app_tenders_data', tenders)

      tenders = storage.getItem('app_tenders_data', []) as unknown as Tender[]
      expect(tenders[0].description).toBe('Building renovation project')
      expect(tenders[0].budget).toBe(500000)

      // Step 3: Submit tender
      tenders = tenders.map((t) =>
        t.id === 'tender_001'
          ? {
              ...t,
              status: 'submitted',
              updatedAt: new Date().toISOString(),
            }
          : t,
      )
      storage.setItem('app_tenders_data', tenders)

      tenders = storage.getItem('app_tenders_data', []) as unknown as Tender[]
      expect(tenders[0].status).toBe('submitted')

      // Step 4: Finalize tender
      tenders = tenders.map((t) =>
        t.id === 'tender_001'
          ? {
              ...t,
              status: 'finalized',
              finalizedAt: new Date().toISOString(),
            }
          : t,
      )
      storage.setItem('app_tenders_data', tenders)

      tenders = storage.getItem('app_tenders_data', []) as unknown as Tender[]
      expect(tenders[0].status).toBe('finalized')
      expect(tenders[0].finalizedAt).toBeDefined()
    })
  })

  describe('Project Management Flow', () => {
    it('should create project, add tasks, and track progress', () => {
      interface Task {
        id: string
        title: string
        status: string
        progress: number
      }

      interface Project {
        id: string
        name: string
        status: string
        tasks?: Task[]
        progress?: number
      }

      // Step 1: Create project
      const project: Project = {
        id: 'project_001',
        name: 'Q1 Construction Project',
        status: 'active',
        tasks: [],
      }

      storage.setItem('app_projects_data', [project])
      let projects = storage.getItem('app_projects_data', []) as unknown as Project[]
      expect(projects.length).toBe(1)

      // Step 2: Add tasks to project
      const tasks: Task[] = [
        { id: 'task_001', title: 'Site Survey', status: 'completed', progress: 100 },
        { id: 'task_002', title: 'Foundation Work', status: 'in-progress', progress: 60 },
        { id: 'task_003', title: 'Framing', status: 'pending', progress: 0 },
      ]

      projects = projects.map((p) => (p.id === 'project_001' ? { ...p, tasks } : p))
      storage.setItem('app_projects_data', projects)

      projects = storage.getItem('app_projects_data', []) as unknown as Project[]
      expect(projects[0].tasks?.length).toBe(3)

      // Step 3: Calculate overall progress
      const totalProgress =
        (projects[0].tasks?.reduce((sum, task) => sum + task.progress, 0) ?? 0) /
        (projects[0].tasks?.length ?? 1)

      projects = projects.map((p) =>
        p.id === 'project_001' ? { ...p, progress: Math.round(totalProgress) } : p,
      )
      storage.setItem('app_projects_data', projects)

      projects = storage.getItem('app_projects_data', []) as unknown as Project[]
      expect(projects[0].progress).toBeGreaterThan(0)
      expect(projects[0].progress).toBeLessThan(100)
    })
  })

  describe('Client Onboarding Flow', () => {
    it('should onboard client with full profile', () => {
      interface Client {
        id: string
        name: string
        email: string
        phone: string
        status: string
        address?: {
          street: string
          city: string
          country: string
        }
        projects?: string[]
        createdAt: string
      }

      // Step 1: Create basic client profile
      const client: Client = {
        id: 'client_001',
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1234567890',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      storage.setItem('app_clients_data', [client])
      let clients = storage.getItem('app_clients_data', []) as unknown as Client[]
      expect(clients.length).toBe(1)

      // Step 2: Complete client profile
      clients = clients.map((c) =>
        c.id === 'client_001'
          ? {
              ...c,
              address: {
                street: '123 Main St',
                city: 'New York',
                country: 'USA',
              },
              status: 'active',
            }
          : c,
      )
      storage.setItem('app_clients_data', clients)

      clients = storage.getItem('app_clients_data', []) as unknown as Client[]
      expect(clients[0].status).toBe('active')
      expect(clients[0].address?.city).toBe('New York')

      // Step 3: Verify data persistence through storage
      expect(clients.length).toBe(1)
      expect(clients[0].status).toBe('active')
      expect(clients[0].address?.city).toBe('New York')
    })
  })

  describe('Data Export Flow', () => {
    it('should prepare and export data', () => {
      interface ExportData {
        tenders: unknown[]
        projects: unknown[]
        clients: unknown[]
        exportedAt: string
        version: string
      }

      // Step 1: Populate data
      storage.setItem('app_tenders_data', [
        { id: '1', title: 'Tender 1' },
        { id: '2', title: 'Tender 2' },
      ])
      storage.setItem('app_projects_data', [{ id: '1', name: 'Project 1' }])
      storage.setItem('app_clients_data', [
        { id: '1', name: 'Client 1' },
        { id: '2', name: 'Client 2' },
        { id: '3', name: 'Client 3' },
      ])

      // Step 2: Collect all data for export
      const exportData: ExportData = {
        tenders: storage.getItem('app_tenders_data', []),
        projects: storage.getItem('app_projects_data', []),
        clients: storage.getItem('app_clients_data', []),
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      }

      // Step 3: Verify export structure
      expect(exportData.tenders).toBeDefined()
      expect(exportData.projects).toBeDefined()
      expect(exportData.clients).toBeDefined()
      expect((exportData.tenders as unknown[]).length).toBe(2)
      expect((exportData.projects as unknown[]).length).toBe(1)
      expect((exportData.clients as unknown[]).length).toBe(3)

      // Step 4: Save export
      storage.setItem('app_last_export', exportData)
      const savedExport = storage.getItem('app_last_export', null) as unknown as ExportData
      expect(savedExport).toEqual(exportData)
    })
  })

  describe('Data Import Flow', () => {
    it('should import and validate data', () => {
      interface ImportData {
        tenders: { id: string; title: string }[]
        projects: { id: string; name: string }[]
        clients: { id: string; name: string }[]
      }

      // Step 1: Prepare import data
      const importData: ImportData = {
        tenders: [
          { id: 'imp_tender_1', title: 'Imported Tender 1' },
          { id: 'imp_tender_2', title: 'Imported Tender 2' },
        ],
        projects: [{ id: 'imp_project_1', name: 'Imported Project 1' }],
        clients: [{ id: 'imp_client_1', name: 'Imported Client 1' }],
      }

      // Step 2: Validate import structure
      expect(Array.isArray(importData.tenders)).toBe(true)
      expect(Array.isArray(importData.projects)).toBe(true)
      expect(Array.isArray(importData.clients)).toBe(true)

      // Step 3: Import data
      storage.setItem('app_tenders_data', importData.tenders)
      storage.setItem('app_projects_data', importData.projects)
      storage.setItem('app_clients_data', importData.clients)

      // Step 4: Verify imported data
      const tenders = storage.getItem('app_tenders_data', [])
      const projects = storage.getItem('app_projects_data', [])
      const clients = storage.getItem('app_clients_data', [])

      expect((tenders as unknown[]).length).toBe(2)
      expect((projects as unknown[]).length).toBe(1)
      expect((clients as unknown[]).length).toBe(1)
    })
  })

  describe('Search and Filter Flow', () => {
    it('should search and filter tenders by criteria', () => {
      interface Tender {
        id: string
        title: string
        status: string
        budget: number
        priority: string
      }

      // Step 1: Create sample tenders
      const tenders: Tender[] = [
        {
          id: '1',
          title: 'High Priority Tender',
          status: 'active',
          budget: 100000,
          priority: 'high',
        },
        { id: '2', title: 'Low Priority Tender', status: 'draft', budget: 50000, priority: 'low' },
        {
          id: '3',
          title: 'Medium Priority Tender',
          status: 'active',
          budget: 75000,
          priority: 'medium',
        },
        { id: '4', title: 'Urgent Tender', status: 'active', budget: 200000, priority: 'high' },
      ]

      storage.setItem('app_tenders_data', tenders)

      // Step 2: Filter by status
      const retrieved = storage.getItem('app_tenders_data', []) as unknown as Tender[]
      const activeTenders = retrieved.filter((t) => t.status === 'active')
      expect(activeTenders.length).toBe(3)

      // Step 3: Filter by priority
      const highPriority = activeTenders.filter((t) => t.priority === 'high')
      expect(highPriority.length).toBe(2)

      // Step 4: Filter by budget range
      const budgetFiltered = highPriority.filter((t) => t.budget >= 100000)
      expect(budgetFiltered.length).toBe(2)

      // Step 5: Search by title
      const searchResults = budgetFiltered.filter((t) => t.title.toLowerCase().includes('tender'))
      expect(searchResults.length).toBeGreaterThan(0)
    })
  })

  describe('Batch Operations Flow', () => {
    it('should handle batch status updates', () => {
      interface Item {
        id: string
        name: string
        status: string
      }

      // Step 1: Create multiple items
      const items: Item[] = Array.from({ length: 10 }, (_, i) => ({
        id: `item_${i}`,
        name: `Item ${i}`,
        status: 'pending',
      }))

      storage.setItem('batch_items', items)

      // Step 2: Select items for batch update
      const selectedIds = ['item_0', 'item_2', 'item_4', 'item_6', 'item_8']

      // Step 3: Perform batch update
      const retrieved = storage.getItem('batch_items', []) as unknown as Item[]
      const updated = retrieved.map((item) =>
        selectedIds.includes(item.id) ? { ...item, status: 'approved' } : item,
      )

      storage.setItem('batch_items', updated)

      // Step 4: Verify batch update
      const final = storage.getItem('batch_items', []) as unknown as Item[]
      const approvedCount = final.filter((item) => item.status === 'approved').length
      expect(approvedCount).toBe(5)

      const pendingCount = final.filter((item) => item.status === 'pending').length
      expect(pendingCount).toBe(5)
    })
  })

  describe('User Preferences Flow', () => {
    it('should save and load user preferences', () => {
      interface Preferences {
        theme: string
        language: string
        notifications: {
          email: boolean
          push: boolean
          sms: boolean
        }
        display: {
          density: string
          sidebar: boolean
        }
      }

      // Step 1: Set default preferences
      const defaultPrefs: Preferences = {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        display: {
          density: 'comfortable',
          sidebar: true,
        },
      }

      storage.setItem('user_preferences', defaultPrefs)

      // Step 2: Load preferences
      const loaded = storage.getItem('user_preferences', null) as unknown as Preferences
      expect(loaded).toEqual(defaultPrefs)

      // Step 3: Update specific preference
      const updated: Preferences = {
        ...loaded,
        theme: 'dark',
        notifications: {
          ...loaded.notifications,
          push: false,
        },
      }

      storage.setItem('user_preferences', updated)

      // Step 4: Verify updates
      const final = storage.getItem('user_preferences', null) as unknown as Preferences
      expect(final.theme).toBe('dark')
      expect(final.notifications.push).toBe(false)
      expect(final.notifications.email).toBe(true)
    })
  })
})
