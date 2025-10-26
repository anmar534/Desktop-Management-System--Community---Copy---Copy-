/**
 * Tests for useProjectNavigation hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectNavigation } from '@/application/hooks/useProjectNavigation'
import { useNavigate, useParams } from 'react-router-dom'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(),
}))

describe('useProjectNavigation', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  })

  // ========================================================================
  // View Detection
  // ========================================================================

  it('should detect list view when no params', () => {
    vi.mocked(useParams).mockReturnValue({})

    const { result } = renderHook(() => useProjectNavigation())

    expect(result.current.currentView).toBe('list')
    expect(result.current.isListView).toBe(true)
    expect(result.current.projectId).toBeUndefined()
  })

  it('should detect details view when id param present', () => {
    vi.mocked(useParams).mockReturnValue({ id: 'proj-123' })

    const { result } = renderHook(() => useProjectNavigation())

    expect(result.current.currentView).toBe('details')
    expect(result.current.isDetailsView).toBe(true)
    expect(result.current.projectId).toBe('proj-123')
  })

  it('should detect create view when view=create', () => {
    vi.mocked(useParams).mockReturnValue({ view: 'create' })

    const { result } = renderHook(() => useProjectNavigation())

    expect(result.current.currentView).toBe('create')
    expect(result.current.isCreateView).toBe(true)
  })

  it('should detect edit view when view=edit', () => {
    vi.mocked(useParams).mockReturnValue({ id: 'proj-123', view: 'edit' })

    const { result } = renderHook(() => useProjectNavigation())

    expect(result.current.currentView).toBe('edit')
    expect(result.current.isEditView).toBe(true)
  })

  // ========================================================================
  // Navigation Actions
  // ========================================================================

  it('should navigate to list', () => {
    vi.mocked(useParams).mockReturnValue({})

    const { result } = renderHook(() => useProjectNavigation())

    act(() => {
      result.current.goToList()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/projects')
  })

  it('should navigate to details with id', () => {
    vi.mocked(useParams).mockReturnValue({})

    const { result } = renderHook(() => useProjectNavigation())

    act(() => {
      result.current.goToDetails('proj-456')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-456')
  })

  it('should navigate to create', () => {
    vi.mocked(useParams).mockReturnValue({})

    const { result } = renderHook(() => useProjectNavigation())

    act(() => {
      result.current.goToCreate()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/projects/create')
  })

  it('should navigate to edit with id', () => {
    vi.mocked(useParams).mockReturnValue({})

    const { result } = renderHook(() => useProjectNavigation())

    act(() => {
      result.current.goToEdit('proj-789')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-789/edit')
  })

  it('should navigate back', () => {
    vi.mocked(useParams).mockReturnValue({})

    const { result } = renderHook(() => useProjectNavigation())

    act(() => {
      result.current.goBack()
    })

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  // ========================================================================
  // View Checks
  // ========================================================================

  it('should have correct view checks for list', () => {
    vi.mocked(useParams).mockReturnValue({})

    const { result } = renderHook(() => useProjectNavigation())

    expect(result.current.isListView).toBe(true)
    expect(result.current.isDetailsView).toBe(false)
    expect(result.current.isCreateView).toBe(false)
    expect(result.current.isEditView).toBe(false)
  })

  it('should have correct view checks for details', () => {
    vi.mocked(useParams).mockReturnValue({ id: 'proj-123' })

    const { result } = renderHook(() => useProjectNavigation())

    expect(result.current.isListView).toBe(false)
    expect(result.current.isDetailsView).toBe(true)
    expect(result.current.isCreateView).toBe(false)
    expect(result.current.isEditView).toBe(false)
  })

  it('should have correct view checks for create', () => {
    vi.mocked(useParams).mockReturnValue({ view: 'create' })

    const { result } = renderHook(() => useProjectNavigation())

    expect(result.current.isListView).toBe(false)
    expect(result.current.isDetailsView).toBe(false)
    expect(result.current.isCreateView).toBe(true)
    expect(result.current.isEditView).toBe(false)
  })

  it('should have correct view checks for edit', () => {
    vi.mocked(useParams).mockReturnValue({ id: 'proj-123', view: 'edit' })

    const { result } = renderHook(() => useProjectNavigation())

    expect(result.current.isListView).toBe(false)
    expect(result.current.isDetailsView).toBe(false)
    expect(result.current.isCreateView).toBe(false)
    expect(result.current.isEditView).toBe(true)
  })
})
