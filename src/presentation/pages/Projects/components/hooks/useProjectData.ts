/**
 * 🎣 Custom Hook: useProjectData
 * Manages project data fetching and related entities (tender, purchase orders)
 *
 * Purpose:
 * - Centralize project data loading logic
 * - Fetch related tender and purchase orders
 * - Provide loading and error states
 * - Handle data synchronization
 *
 * @module useProjectData
 */

import { useState, useEffect } from 'react'
import { useFinancialState } from '@/application/context'
import {
  getTenderRepository,
  getPurchaseOrderRepository,
} from '@/application/services/serviceRegistry'
import { whenStorageReady } from '@/shared/utils/storage/storage'
import type { Tender } from '@/data/centralData'
import type { PurchaseOrder } from '@/shared/types/contracts'

interface UseProjectDataOptions {
  projectId: string
}

export interface UseProjectDataReturn {
  // Project data
  project: ReturnType<typeof useFinancialState>['projects']['projects'][0] | undefined

  // Related entities
  relatedTender: Tender | null
  purchaseOrders: PurchaseOrder[]

  // State flags
  loading: boolean
  error: Error | null

  // Refresh function
  refresh: () => void
}

/**
 * Hook to fetch and manage project data with related entities
 *
 * @param options - Configuration options
 * @returns Project data, related entities, and loading states
 *
 * @example
 * ```tsx
 * const { project, relatedTender, loading } = useProjectData({ projectId: '123' })
 *
 * if (loading) return <Spinner />
 * if (!project) return <EmptyState />
 *
 * return <ProjectView project={project} tender={relatedTender} />
 * ```
 */
export function useProjectData({ projectId }: UseProjectDataOptions): UseProjectDataReturn {
  const { projects: projectsState } = useFinancialState()
  const { projects } = projectsState

  const [relatedTender, setRelatedTender] = useState<Tender | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  // Find the project from state
  const project = projects.find((p) => p.id === projectId)

  // Fetch related tender and purchase orders
  useEffect(() => {
    let cancelled = false

    if (!project) {
      setRelatedTender(null)
      setPurchaseOrders([])
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    const tenderRepository = getTenderRepository()
    const purchaseOrderRepository = getPurchaseOrderRepository()

    const loadRelatedData = async () => {
      try {
        setLoading(true)
        setError(null)

        await whenStorageReady()

        // Fetch tender and purchase orders in parallel
        const tenderPromise =
          typeof tenderRepository.getByProjectId === 'function'
            ? tenderRepository.getByProjectId(project.id)
            : Promise.resolve(null)

        const ordersPromise = purchaseOrderRepository.getByProjectId(project.id)

        const [tenderResult, ordersResult] = await Promise.all([tenderPromise, ordersPromise])

        if (!cancelled) {
          setRelatedTender(tenderResult ?? null)
          setPurchaseOrders(Array.isArray(ordersResult) ? ordersResult : [])
          setLoading(false)

          console.log('✅ [useProjectData] Loaded:', {
            projectId: project.id,
            tenderId: tenderResult?.id ?? 'none',
            purchaseOrders: Array.isArray(ordersResult) ? ordersResult.length : 0,
          })
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Failed to load project data')
          console.warn('❌ [useProjectData] Error loading related data:', error)

          setError(error)
          setRelatedTender(null)
          setPurchaseOrders([])
          setLoading(false)
        }
      }
    }

    void loadRelatedData()

    return () => {
      cancelled = true
    }
  }, [project, refreshTick])

  // Refresh function to manually reload data
  const refresh = () => {
    setRefreshTick((prev) => prev + 1)
  }

  return {
    project,
    relatedTender,
    purchaseOrders,
    loading,
    error,
    refresh,
  }
}
