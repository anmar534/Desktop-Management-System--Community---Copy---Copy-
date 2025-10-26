/**
 * useProjectNavigation Hook
 *
 * Custom hook for managing project view navigation.
 * Handles view states, routing, and navigation logic.
 */

import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export type ProjectView = 'list' | 'details' | 'create' | 'edit'

export interface UseProjectNavigationReturn {
  // Current state
  currentView: ProjectView
  projectId: string | undefined

  // Navigation actions
  goToList: () => void
  goToDetails: (id: string) => void
  goToCreate: () => void
  goToEdit: (id: string) => void
  goBack: () => void

  // View checks
  isListView: boolean
  isDetailsView: boolean
  isCreateView: boolean
  isEditView: boolean
}

export function useProjectNavigation(): UseProjectNavigationReturn {
  const navigate = useNavigate()
  const params = useParams<{ id?: string; view?: string }>()

  // Determine current view from URL
  const getCurrentView = (): ProjectView => {
    if (params.view === 'create') return 'create'
    if (params.view === 'edit') return 'edit'
    if (params.id) return 'details'
    return 'list'
  }

  const currentView = getCurrentView()
  const projectId = params.id

  // Navigation actions
  const goToList = useCallback(() => {
    navigate('/projects')
  }, [navigate])

  const goToDetails = useCallback(
    (id: string) => {
      navigate(`/projects/${id}`)
    },
    [navigate],
  )

  const goToCreate = useCallback(() => {
    navigate('/projects/create')
  }, [navigate])

  const goToEdit = useCallback(
    (id: string) => {
      navigate(`/projects/${id}/edit`)
    },
    [navigate],
  )

  const goBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // View checks
  const isListView = currentView === 'list'
  const isDetailsView = currentView === 'details'
  const isCreateView = currentView === 'create'
  const isEditView = currentView === 'edit'

  return {
    // Current state
    currentView,
    projectId,

    // Navigation actions
    goToList,
    goToDetails,
    goToCreate,
    goToEdit,
    goBack,

    // View checks
    isListView,
    isDetailsView,
    isCreateView,
    isEditView,
  }
}
