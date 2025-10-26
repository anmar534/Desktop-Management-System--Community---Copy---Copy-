/**
 * Tests for useProjectData hook
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectData } from '@/application/hooks/useProjectData'
import { useProjectStore } from '@/application/stores/projectStore'
import type { EnhancedProject } from '@/shared/types/projects'

// Mock the store
vi.mock('@/application/stores/projectStore')

const mockProjects: EnhancedProject[] = [
  {
    id: '1',
    name: 'Project Alpha',
    status: 'active',
    budget: 100000,
    startDate: '2025-01-01',
    clientName: 'Client A',
    location: 'Location A',
    phase: 'Design',
    description: 'Test project',
  } as EnhancedProject,
  {
    id: '2',
    name: 'Project Beta',
    status: 'completed',
    budget: 200000,
    startDate: '2025-02-01',
    clientName: 'Client B',
    location: 'Location B',
    phase: 'Construction',
    description: 'Test project',
  } as EnhancedProject,
]

describe('useProjectData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================================================
  // Hook Initialization
  // ========================================================================

  it('should return initial state', () => {
    vi.mocked(useProjectStore).mockReturnValue({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    expect(result.current.projects).toEqual([])
    expect(result.current.currentProject).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should expose all store state', () => {
    vi.mocked(useProjectStore).mockReturnValue({
      projects: mockProjects,
      currentProject: mockProjects[0],
      loading: true,
      error: 'Test error',
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    expect(result.current.projects).toHaveLength(2)
    expect(result.current.currentProject?.id).toBe('1')
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe('Test error')
  })

  // ========================================================================
  // Actions
  // ========================================================================

  it('should call loadProjects', async () => {
    const loadProjects = vi.fn()
    vi.mocked(useProjectStore).mockReturnValue({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      loadProjects,
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    await act(async () => {
      await result.current.loadProjects()
    })

    expect(loadProjects).toHaveBeenCalled()
  })

  it('should call loadProject with id', async () => {
    const loadProject = vi.fn()
    vi.mocked(useProjectStore).mockReturnValue({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject,
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    await act(async () => {
      await result.current.loadProject('1')
    })

    expect(loadProject).toHaveBeenCalledWith('1')
  })

  it('should call createProject with data', async () => {
    const createProject = vi.fn().mockResolvedValue(mockProjects[0])
    vi.mocked(useProjectStore).mockReturnValue({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject,
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    const newProject = { name: 'New Project', status: 'active' } as Omit<EnhancedProject, 'id'>

    await act(async () => {
      await result.current.createProject(newProject)
    })

    expect(createProject).toHaveBeenCalledWith(newProject)
  })

  it('should call updateProject with id and data', async () => {
    const saveProject = vi.fn()
    vi.mocked(useProjectStore).mockReturnValue({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject,
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    const updates = { name: 'Updated Name' }

    await act(async () => {
      await result.current.updateProject('1', updates)
    })

    expect(saveProject).toHaveBeenCalledWith('1', updates)
  })

  it('should call deleteProject with id', async () => {
    const removeProject = vi.fn()
    vi.mocked(useProjectStore).mockReturnValue({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject,
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    await act(async () => {
      await result.current.deleteProject('1')
    })

    expect(removeProject).toHaveBeenCalledWith('1')
  })

  it('should call setCurrentProject', () => {
    const setCurrentProject = vi.fn()
    vi.mocked(useProjectStore).mockReturnValue({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject,
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    act(() => {
      result.current.setCurrentProject(mockProjects[0])
    })

    expect(setCurrentProject).toHaveBeenCalledWith(mockProjects[0])
  })

  it('should call clearError', () => {
    const clearError = vi.fn()
    vi.mocked(useProjectStore).mockReturnValue({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError,
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    act(() => {
      result.current.clearError()
    })

    expect(clearError).toHaveBeenCalled()
  })

  // ========================================================================
  // Selectors
  // ========================================================================

  it('should call getProjectById', () => {
    const getProjectById = vi.fn(() => mockProjects[0])
    vi.mocked(useProjectStore).mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById,
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    const project = result.current.getProjectById('1')

    expect(getProjectById).toHaveBeenCalledWith('1')
    expect(project?.id).toBe('1')
  })

  it('should call getActiveProjects', () => {
    const getActiveProjects = vi.fn(() => [mockProjects[0]])
    vi.mocked(useProjectStore).mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects,
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    const projects = result.current.getActiveProjects()

    expect(getActiveProjects).toHaveBeenCalled()
    expect(projects).toHaveLength(1)
  })

  it('should call getCompletedProjects', () => {
    const getCompletedProjects = vi.fn(() => [mockProjects[1]])
    vi.mocked(useProjectStore).mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects,
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    const projects = result.current.getCompletedProjects()

    expect(getCompletedProjects).toHaveBeenCalled()
    expect(projects).toHaveLength(1)
  })

  it('should call getProjectsByStatus', () => {
    const getProjectsByStatus = vi.fn(() => [mockProjects[0]])
    vi.mocked(useProjectStore).mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus,
      getTotalValue: vi.fn(() => 0),
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    const projects = result.current.getProjectsByStatus('active')

    expect(getProjectsByStatus).toHaveBeenCalledWith('active')
    expect(projects).toHaveLength(1)
  })

  it('should call getTotalValue', () => {
    const getTotalValue = vi.fn(() => 300000)
    vi.mocked(useProjectStore).mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue,
      getAverageBudget: vi.fn(() => 0),
    } as any)

    const { result } = renderHook(() => useProjectData())

    const total = result.current.getTotalValue()

    expect(getTotalValue).toHaveBeenCalled()
    expect(total).toBe(300000)
  })

  it('should call getAverageBudget', () => {
    const getAverageBudget = vi.fn(() => 150000)
    vi.mocked(useProjectStore).mockReturnValue({
      projects: mockProjects,
      currentProject: null,
      loading: false,
      error: null,
      loadProjects: vi.fn(),
      loadProject: vi.fn(),
      createProject: vi.fn(),
      saveProject: vi.fn(),
      removeProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn(),
      getProjectById: vi.fn(),
      getActiveProjects: vi.fn(() => []),
      getCompletedProjects: vi.fn(() => []),
      getProjectsByStatus: vi.fn(() => []),
      getTotalValue: vi.fn(() => 0),
      getAverageBudget,
    } as any)

    const { result } = renderHook(() => useProjectData())

    const avg = result.current.getAverageBudget()

    expect(getAverageBudget).toHaveBeenCalled()
    expect(avg).toBe(150000)
  })
})
