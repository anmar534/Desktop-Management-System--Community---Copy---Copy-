import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { Project } from '@/data/centralData'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { useProjects } from '@/application/hooks/useProjects'
import type { IProjectRepository } from '@/repository/project.repository'
import { registerProjectRepository } from '@/application/services/serviceRegistry'
import { projectRepository as defaultProjectRepository } from '@/repository/providers/project.local'

const { mockLoadFromStorage, mockRemoveFromStorage } = vi.hoisted(() => ({
  mockLoadFromStorage: vi.fn(),
  mockRemoveFromStorage: vi.fn(),
}))

vi.mock('@/utils/storage', async () => {
  const actual = await vi.importActual('@/utils/storage')
  return {
    ...actual,
    loadFromStorage: mockLoadFromStorage,
    removeFromStorage: mockRemoveFromStorage,
  }
})

const baseProject: Project = {
  id: 'project-1',
  name: 'مشروع ترحيل اختباري',
  client: 'شركة الاختبار الموحدة',
  status: 'active',
  priority: 'medium',
  progress: 45,
  contractValue: 500000,
  estimatedCost: 420000,
  actualCost: 210000,
  spent: 210000,
  remaining: 290000,
  expectedProfit: 80000,
  actualProfit: 0,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T00:00:00.000Z',
  manager: 'مدير المشاريع',
  team: 'فريق التنفيذ أ',
  location: 'الرياض',
  phase: 'التنفيذ',
  health: 'green',
  lastUpdate: '2024-06-01T10:00:00.000Z',
  nextMilestone: 'تسليم المخطط التنفيذي',
  milestoneDate: '2024-08-15T00:00:00.000Z',
  category: 'بنية تحتية',
  efficiency: 85,
  riskLevel: 'medium',
  budget: 500000,
  value: 500000,
  type: 'إنشائي',
}

const createProject = (overrides: Partial<Project> = {}): Project => ({
  ...baseProject,
  ...overrides,
})

const createStubRepository = (): IProjectRepository => {
  let projects: Project[] = []

  const clone = (entries: Project[]): Project[] => entries.map((project) => ({ ...project }))

  return {
    async getAll() {
      return clone(projects)
    },
    async getById(id: string) {
      return clone(projects).find((project) => project.id === id) ?? null
    },
    async create(data: Omit<Project, 'id'>) {
      const created: Project = { ...data, id: `project-${Date.now()}` }
      projects = [...projects, created]
      return { ...created }
    },
    async upsert(project: Project) {
      const index = projects.findIndex((entry) => entry.id === project.id)
      if (index >= 0) {
        projects = projects.map((entry, idx) => (idx === index ? { ...entry, ...project } : entry))
        return { ...projects[index] }
      }
      projects = [...projects, { ...project }]
      return { ...project }
    },
    async update(id: string, updates: Partial<Project>) {
      const index = projects.findIndex((entry) => entry.id === id)
      if (index === -1) return null
      projects = projects.map((entry, idx) =>
        idx === index ? ({ ...entry, ...updates } as Project) : entry,
      )
      return { ...projects[index] }
    },
    async delete(id: string) {
      const initialLength = projects.length
      projects = projects.filter((project) => project.id !== id)
      return projects.length < initialLength
    },
    async importMany(payload: Project[], options: { replace?: boolean } = {}) {
      const shouldReplace = options.replace ?? true
      if (shouldReplace) {
        projects = clone(payload)
        return clone(projects)
      }

      const merged = new Map(projects.map((project) => [project.id, { ...project }]))
      for (const project of payload) {
        merged.set(project.id, { ...project })
      }
      projects = Array.from(merged.values())
      return clone(projects)
    },
    async reload() {
      return clone(projects)
    },
  }
}

describe('useProjects migration', () => {
  beforeEach(async () => {
    registerProjectRepository(createStubRepository())
    if (typeof localStorage !== 'undefined') localStorage.clear()
    mockLoadFromStorage.mockReset()
    mockRemoveFromStorage.mockReset()
    mockRemoveFromStorage.mockResolvedValue(undefined)

    // Initialize mocked storage to return empty array by default
    mockLoadFromStorage.mockImplementation(
      async (_key: string, defaultValue: unknown) => defaultValue,
    )
  })

  afterEach(() => {
    registerProjectRepository(defaultProjectRepository)
    vi.restoreAllMocks()
  })

  it('loads from unified storage key when available', async () => {
    const unifiedKey = STORAGE_KEYS.PROJECTS
    const project = createProject()

    // Setup mock to return project data
    mockLoadFromStorage.mockImplementation(async (key: string, defaultValue: unknown) => {
      if (key === unifiedKey) {
        return [project]
      }
      return defaultValue
    })

    const { result } = renderHook(() => useProjects())

    // Wait for initialization and data load
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 3000 },
    )

    await waitFor(
      () => {
        expect(result.current.projects).toHaveLength(1)
        expect(result.current.projects[0]).toMatchObject({
          id: project.id,
          name: project.name,
          client: project.client,
        })
      },
      { timeout: 3000 },
    )
  })
})
