/**
 * Smoke Test: CRUD Operations
 *
 * Verifies that basic Create, Read, Update, Delete operations
 * work correctly for core entities.
 *
 * @smoke
 * @priority critical
 */

import { describe, it, expect, beforeEach } from 'vitest'
import storage from '../../src/utils/storage'

describe('Smoke Test: CRUD Operations', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  })

  describe('Create Operations', () => {
    it('should create a new tender', () => {
      const tender = {
        id: 'tender_1',
        title: 'Test Tender',
        description: 'Test Description',
        status: 'draft',
        createdAt: new Date().toISOString(),
      }

      storage.setItem('app_tenders_data', [tender])
      const tenders = storage.getItem('app_tenders_data', [])

      expect(Array.isArray(tenders)).toBe(true)
      expect((tenders as unknown[]).length).toBe(1)
    })

    it('should create a new project', () => {
      const project = {
        id: 'project_1',
        name: 'Test Project',
        description: 'Project Description',
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      storage.setItem('app_projects_data', [project])
      const projects = storage.getItem('app_projects_data', [])

      expect(Array.isArray(projects)).toBe(true)
      expect((projects as unknown[]).length).toBe(1)
    })

    it('should create a new client', () => {
      const client = {
        id: 'client_1',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '1234567890',
        createdAt: new Date().toISOString(),
      }

      storage.setItem('app_clients_data', [client])
      const clients = storage.getItem('app_clients_data', [])

      expect(Array.isArray(clients)).toBe(true)
      expect((clients as unknown[]).length).toBe(1)
    })
  })

  describe('Read Operations', () => {
    it('should read existing tenders', () => {
      const tenders = [
        { id: '1', title: 'Tender 1' },
        { id: '2', title: 'Tender 2' },
        { id: '3', title: 'Tender 3' },
      ]

      storage.setItem('app_tenders_data', tenders)
      const retrieved = storage.getItem('app_tenders_data', [])

      // Storage may add additional fields, so we check structure
      expect((retrieved as unknown[]).length).toBe(3)
      expect((retrieved as { id: string; title: string }[])[0].id).toBe('1')
      expect((retrieved as { id: string; title: string }[])[0].title).toBe('Tender 1')
    })

    it('should read existing projects', () => {
      const projects = [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' },
      ]

      storage.setItem('app_projects_data', projects)
      const retrieved = storage.getItem('app_projects_data', [])

      // Storage may add additional fields, so we check structure
      expect((retrieved as unknown[]).length).toBe(2)
      expect((retrieved as { id: string; name: string }[])[0].id).toBe('1')
      expect((retrieved as { id: string; name: string }[])[0].name).toBe('Project 1')
    })

    it('should return empty array for non-existent data', () => {
      const data = storage.getItem('non_existent_data', [])
      expect(Array.isArray(data)).toBe(true)
      expect((data as unknown[]).length).toBe(0)
    })
  })

  describe('Update Operations', () => {
    it('should update a tender', () => {
      interface Tender {
        id: string
        title: string
        status: string
        updatedAt?: string
      }

      const tenders: Tender[] = [
        { id: '1', title: 'Tender 1', status: 'draft' },
        { id: '2', title: 'Tender 2', status: 'draft' },
      ]

      storage.setItem('app_tenders_data', tenders)

      // Update tender 1
      const retrieved = storage.getItem('app_tenders_data', []) as unknown as Tender[]
      const updated = retrieved.map((t: Tender) =>
        t.id === '1' ? { ...t, status: 'submitted', updatedAt: new Date().toISOString() } : t,
      )

      storage.setItem('app_tenders_data', updated)
      const final = storage.getItem('app_tenders_data', []) as unknown as Tender[]

      expect(final[0].status).toBe('submitted')
      expect(final[0].updatedAt).toBeDefined()
      expect(final[1].status).toBe('draft')
    })

    it('should update a project', () => {
      interface Project {
        id: string
        name: string
        status: string
      }

      const projects: Project[] = [{ id: '1', name: 'Project 1', status: 'active' }]

      storage.setItem('app_projects_data', projects)

      const retrieved = storage.getItem('app_projects_data', []) as unknown as Project[]
      const updated = retrieved.map((p: Project) =>
        p.id === '1' ? { ...p, status: 'completed' } : p,
      )

      storage.setItem('app_projects_data', updated)
      const final = storage.getItem('app_projects_data', []) as unknown as Project[]

      expect(final[0].status).toBe('completed')
    })
  })

  describe('Delete Operations', () => {
    it('should delete a tender', () => {
      interface Tender {
        id: string
        title: string
      }

      const tenders: Tender[] = [
        { id: '1', title: 'Tender 1' },
        { id: '2', title: 'Tender 2' },
        { id: '3', title: 'Tender 3' },
      ]

      storage.setItem('app_tenders_data', tenders)

      // Delete tender 2
      const retrieved = storage.getItem('app_tenders_data', []) as unknown as Tender[]
      const filtered = retrieved.filter((t: Tender) => t.id !== '2')

      storage.setItem('app_tenders_data', filtered)
      const final = storage.getItem('app_tenders_data', []) as unknown as Tender[]

      expect(final.length).toBe(2)
      expect(final.find((t: Tender) => t.id === '2')).toBeUndefined()
    })

    it('should delete a project', () => {
      interface Project {
        id: string
        name: string
      }

      const projects: Project[] = [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' },
      ]

      storage.setItem('app_projects_data', projects)

      const retrieved = storage.getItem('app_projects_data', []) as unknown as Project[]
      const filtered = retrieved.filter((p: Project) => p.id !== '1')

      storage.setItem('app_projects_data', filtered)
      const final = storage.getItem('app_projects_data', []) as unknown as Project[]

      expect(final.length).toBe(1)
      expect(final[0].id).toBe('2')
    })

    it('should delete all items', () => {
      storage.setItem('app_tenders_data', [{ id: '1' }, { id: '2' }])
      storage.setItem('app_tenders_data', [])

      const tenders = storage.getItem('app_tenders_data', [])
      expect((tenders as unknown[]).length).toBe(0)
    })
  })

  describe('Complex CRUD Scenarios', () => {
    it('should handle multiple operations in sequence', () => {
      interface Item {
        id: string
        name: string
        status?: string
      }

      // Create
      const items: Item[] = [{ id: '1', name: 'Item 1' }]
      storage.setItem('test_items', items)

      // Read
      let current = storage.getItem('test_items', []) as unknown as Item[]
      expect(current.length).toBe(1)

      // Update
      current = current.map((i: Item) => ({ ...i, status: 'active' }))
      storage.setItem('test_items', current)

      // Read again
      current = storage.getItem('test_items', []) as unknown as Item[]
      expect(current[0].status).toBe('active')

      // Create another
      current.push({ id: '2', name: 'Item 2' })
      storage.setItem('test_items', current)

      // Read
      current = storage.getItem('test_items', []) as unknown as Item[]
      expect(current.length).toBe(2)

      // Delete one
      current = current.filter((i: Item) => i.id !== '1')
      storage.setItem('test_items', current)

      // Final read
      current = storage.getItem('test_items', []) as unknown as Item[]
      expect(current.length).toBe(1)
      expect(current[0].id).toBe('2')
    })

    it('should handle concurrent CRUD operations', () => {
      interface Item {
        id: string
        value: number
      }

      // Initialize
      storage.setItem('counter_items', [] as Item[])

      // Multiple creates
      for (let i = 0; i < 5; i++) {
        const items = storage.getItem('counter_items', []) as unknown as Item[]
        items.push({ id: `item_${i}`, value: i })
        storage.setItem('counter_items', items)
      }

      const items = storage.getItem('counter_items', []) as unknown as Item[]
      expect(items.length).toBe(5)

      // Multiple updates
      const updated = items.map((item: Item) => ({
        ...item,
        value: item.value * 2,
      }))
      storage.setItem('counter_items', updated)

      const final = storage.getItem('counter_items', []) as unknown as Item[]
      expect(final[0].value).toBe(0)
      expect(final[4].value).toBe(8)
    })
  })
})
