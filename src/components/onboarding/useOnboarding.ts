/**
 * useOnboarding Hook - خطاف الجولة التعريفية
 * Sprint 5.4.5: جولة تعريفية تفاعلية
 */

import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// Types
// ============================================================================

export interface UseOnboardingOptions {
  /** Tour ID / معرف الجولة */
  tourId: string
  
  /** Auto-start tour / بدء تلقائي للجولة */
  autoStart?: boolean
  
  /** Storage key prefix / بادئة مفتاح التخزين */
  storageKeyPrefix?: string
}

export interface UseOnboardingReturn {
  /** Is tour active / هل الجولة نشطة */
  isActive: boolean
  
  /** Has completed tour / هل تم إكمال الجولة */
  hasCompleted: boolean
  
  /** Start tour / بدء الجولة */
  start: () => void
  
  /** Complete tour / إكمال الجولة */
  complete: () => void
  
  /** Reset tour / إعادة تعيين الجولة */
  reset: () => void
  
  /** Skip tour / تخطي الجولة */
  skip: () => void
}

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY_PREFIX = 'onboarding_'

function getStorageKey(tourId: string, prefix: string = STORAGE_KEY_PREFIX): string {
  return `${prefix}${tourId}`
}

// ============================================================================
// Storage Functions
// ============================================================================

function getTourStatus(tourId: string, prefix?: string): boolean {
  try {
    const key = getStorageKey(tourId, prefix)
    const value = localStorage.getItem(key)
    return value === 'completed'
  } catch (error) {
    console.error('Error reading tour status:', error)
    return false
  }
}

function setTourStatus(tourId: string, completed: boolean, prefix?: string): void {
  try {
    const key = getStorageKey(tourId, prefix)
    if (completed) {
      localStorage.setItem(key, 'completed')
    } else {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error('Error saving tour status:', error)
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing onboarding tour state
 * خطاف لإدارة حالة الجولة التعريفية
 */
export function useOnboarding(options: UseOnboardingOptions): UseOnboardingReturn {
  const {
    tourId,
    autoStart = false,
    storageKeyPrefix,
  } = options

  const [isActive, setIsActive] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(() => 
    getTourStatus(tourId, storageKeyPrefix)
  )

  // Auto-start tour if not completed
  useEffect(() => {
    if (autoStart && !hasCompleted) {
      setIsActive(true)
    }
  }, [autoStart, hasCompleted])

  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  const complete = useCallback(() => {
    setIsActive(false)
    setHasCompleted(true)
    setTourStatus(tourId, true, storageKeyPrefix)
  }, [tourId, storageKeyPrefix])

  const reset = useCallback(() => {
    setIsActive(false)
    setHasCompleted(false)
    setTourStatus(tourId, false, storageKeyPrefix)
  }, [tourId, storageKeyPrefix])

  const skip = useCallback(() => {
    setIsActive(false)
    // Don't mark as completed when skipped
  }, [])

  return {
    isActive,
    hasCompleted,
    start,
    complete,
    reset,
    skip,
  }
}

export default useOnboarding

