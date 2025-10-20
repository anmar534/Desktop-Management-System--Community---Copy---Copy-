/**
 * @fileoverview Analytics Context Provider
 * @description Centralized data management and synchronization for analytics components
 * with caching, real-time updates, and cross-component data sharing.
 *
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 - Unified Analytics Navigation
 */

import type React from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { BidPerformance, CompetitorData, AnalyticsFilter } from '@/shared/types/analytics'
import type { MarketOpportunity, MarketTrend, SWOTAnalysis, CompetitiveBenchmark } from '@/shared/types/competitive'
import { analyticsService } from '@/application/services/analyticsService'
import { competitiveService } from '@/application/services/competitiveService'

// Analytics state interface
interface AnalyticsState {
  // Data
  bidPerformances: BidPerformance[]
  competitors: CompetitorData[]
  marketOpportunities: MarketOpportunity[]
  marketTrends: MarketTrend[]
  swotAnalyses: SWOTAnalysis[]
  competitiveBenchmarks: CompetitiveBenchmark[]
  
  // UI State
  loading: boolean
  error: string | null
  lastUpdated: string | null
  
  // Filters and settings
  globalFilter: AnalyticsFilter
  refreshInterval: number
  
  // Cache management
  cache: Record<string, { data: any; timestamp: number; ttl: number }>
}

// Action types
type AnalyticsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BID_PERFORMANCES'; payload: BidPerformance[] }
  | { type: 'SET_COMPETITORS'; payload: CompetitorData[] }
  | { type: 'SET_MARKET_OPPORTUNITIES'; payload: MarketOpportunity[] }
  | { type: 'SET_MARKET_TRENDS'; payload: MarketTrend[] }
  | { type: 'SET_SWOT_ANALYSES'; payload: SWOTAnalysis[] }
  | { type: 'SET_COMPETITIVE_BENCHMARKS'; payload: CompetitiveBenchmark[] }
  | { type: 'SET_GLOBAL_FILTER'; payload: AnalyticsFilter }
  | { type: 'SET_REFRESH_INTERVAL'; payload: number }
  | { type: 'UPDATE_CACHE'; payload: { key: string; data: any; ttl?: number } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'SET_LAST_UPDATED'; payload: string }

// Initial state
const initialState: AnalyticsState = {
  bidPerformances: [],
  competitors: [],
  marketOpportunities: [],
  marketTrends: [],
  swotAnalyses: [],
  competitiveBenchmarks: [],
  loading: false,
  error: null,
  lastUpdated: null,
  globalFilter: {},
  refreshInterval: 300000, // 5 minutes
  cache: {}
}

// Reducer
function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    
    case 'SET_BID_PERFORMANCES':
      return { ...state, bidPerformances: action.payload }
    
    case 'SET_COMPETITORS':
      return { ...state, competitors: action.payload }
    
    case 'SET_MARKET_OPPORTUNITIES':
      return { ...state, marketOpportunities: action.payload }
    
    case 'SET_MARKET_TRENDS':
      return { ...state, marketTrends: action.payload }
    
    case 'SET_SWOT_ANALYSES':
      return { ...state, swotAnalyses: action.payload }
    
    case 'SET_COMPETITIVE_BENCHMARKS':
      return { ...state, competitiveBenchmarks: action.payload }
    
    case 'SET_GLOBAL_FILTER':
      return { ...state, globalFilter: action.payload }
    
    case 'SET_REFRESH_INTERVAL':
      return { ...state, refreshInterval: action.payload }
    
    case 'UPDATE_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: {
            data: action.payload.data,
            timestamp: Date.now(),
            ttl: action.payload.ttl || 300000 // 5 minutes default
          }
        }
      }
    
    case 'CLEAR_CACHE':
      return { ...state, cache: {} }
    
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload }
    
    default:
      return state
  }
}

// Context interface
interface AnalyticsContextValue {
  state: AnalyticsState
  
  // Data loading functions
  loadBidPerformances: (filter?: AnalyticsFilter) => Promise<void>
  loadCompetitors: (filter?: AnalyticsFilter) => Promise<void>
  loadMarketOpportunities: () => Promise<void>
  loadMarketTrends: () => Promise<void>
  loadAllData: (filter?: AnalyticsFilter) => Promise<void>
  
  // Data manipulation
  addBidPerformance: (performance: Omit<BidPerformance, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateBidPerformance: (id: string, updates: Partial<BidPerformance>) => Promise<void>
  deleteBidPerformance: (id: string) => Promise<void>
  
  // Filter management
  setGlobalFilter: (filter: AnalyticsFilter) => void
  clearFilters: () => void
  
  // Cache management
  getCachedData: (key: string) => any | null
  setCachedData: (key: string, data: any, ttl?: number) => void
  clearCache: () => void
  
  // Utility functions
  refreshData: () => Promise<void>
  setRefreshInterval: (interval: number) => void
}

// Create context
const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

// Provider component
interface AnalyticsProviderProps {
  children: React.ReactNode
  autoRefresh?: boolean
}

export function AnalyticsProvider({ children, autoRefresh = true }: AnalyticsProviderProps) {
  const [state, dispatch] = useReducer(analyticsReducer, initialState)

  // Load bid performances
  const loadBidPerformances = useCallback(async (filter?: AnalyticsFilter) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const performances = await analyticsService.getAllBidPerformances({ filters: filter || state.globalFilter })
      dispatch({ type: 'SET_BID_PERFORMANCES', payload: performances })
      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ في تحميل بيانات الأداء' })
      console.error('Error loading bid performances:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.globalFilter])

  // Load competitors
  const loadCompetitors = useCallback(async (filter?: AnalyticsFilter) => {
    try {
      const competitors = await competitiveService.getAllCompetitors(filter || state.globalFilter)
      dispatch({ type: 'SET_COMPETITORS', payload: competitors })
    } catch (error) {
      console.error('Error loading competitors:', error)
    }
  }, [state.globalFilter])

  // Load market opportunities
  const loadMarketOpportunities = useCallback(async () => {
    try {
      const opportunities = await competitiveService.getMarketOpportunities()
      dispatch({ type: 'SET_MARKET_OPPORTUNITIES', payload: opportunities })
    } catch (error) {
      console.error('Error loading market opportunities:', error)
    }
  }, [])

  // Load market trends
  const loadMarketTrends = useCallback(async () => {
    try {
      const trends = await competitiveService.getMarketTrends()
      dispatch({ type: 'SET_MARKET_TRENDS', payload: trends })
    } catch (error) {
      console.error('Error loading market trends:', error)
    }
  }, [])

  // Load all data
  const loadAllData = useCallback(async (filter?: AnalyticsFilter) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      await Promise.all([
        loadBidPerformances(filter),
        loadCompetitors(filter),
        loadMarketOpportunities(),
        loadMarketTrends()
      ])
      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ في تحميل البيانات' })
      console.error('Error loading all data:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [loadBidPerformances, loadCompetitors, loadMarketOpportunities, loadMarketTrends])

  // Add bid performance
  const addBidPerformance = useCallback(async (performance: Omit<BidPerformance, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await analyticsService.createBidPerformance(performance)
      await loadBidPerformances()
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ في إضافة بيانات الأداء' })
      console.error('Error adding bid performance:', error)
    }
  }, [loadBidPerformances])

  // Update bid performance
  const updateBidPerformance = useCallback(async (id: string, updates: Partial<BidPerformance>) => {
    try {
      await analyticsService.updateBidPerformance(id, updates)
      await loadBidPerformances()
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ في تحديث بيانات الأداء' })
      console.error('Error updating bid performance:', error)
    }
  }, [loadBidPerformances])

  // Delete bid performance
  const deleteBidPerformance = useCallback(async (id: string) => {
    try {
      await analyticsService.deleteBidPerformance(id)
      await loadBidPerformances()
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ في حذف بيانات الأداء' })
      console.error('Error deleting bid performance:', error)
    }
  }, [loadBidPerformances])

  // Set global filter
  const setGlobalFilter = useCallback((filter: AnalyticsFilter) => {
    dispatch({ type: 'SET_GLOBAL_FILTER', payload: filter })
  }, [])

  // Clear filters
  const clearFilters = useCallback(() => {
    dispatch({ type: 'SET_GLOBAL_FILTER', payload: {} })
  }, [])

  // Cache management
  const getCachedData = useCallback((key: string) => {
    const cached = state.cache[key]
    if (!cached) return null
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      return null
    }
    
    return cached.data
  }, [state.cache])

  const setCachedData = useCallback((key: string, data: any, ttl = 300000) => {
    dispatch({ type: 'UPDATE_CACHE', payload: { key, data, ttl } })
  }, [])

  const clearCache = useCallback(() => {
    dispatch({ type: 'CLEAR_CACHE' })
  }, [])

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadAllData()
  }, [loadAllData])

  // Set refresh interval
  const setRefreshInterval = useCallback((interval: number) => {
    dispatch({ type: 'SET_REFRESH_INTERVAL', payload: interval })
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || state.refreshInterval <= 0) return

    const interval = setInterval(() => {
      refreshData()
    }, state.refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, state.refreshInterval, refreshData])

  // Initial data load
  useEffect(() => {
    loadAllData()
  }, []) // Only run once on mount

  const contextValue: AnalyticsContextValue = {
    state,
    loadBidPerformances,
    loadCompetitors,
    loadMarketOpportunities,
    loadMarketTrends,
    loadAllData,
    addBidPerformance,
    updateBidPerformance,
    deleteBidPerformance,
    setGlobalFilter,
    clearFilters,
    getCachedData,
    setCachedData,
    clearCache,
    refreshData,
    setRefreshInterval
  }

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

// Hook to use analytics context
export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

export { AnalyticsContext }

