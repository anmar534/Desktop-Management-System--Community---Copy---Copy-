/**
 * Toast Provider - موفر الإشعارات
 * Sprint 5.4.6: تحسين الرسائل والتنبيهات
 */

import type React from 'react'
import { createContext, useContext } from 'react'
import type { ToastPosition } from './ToastContainer'
import ToastContainer from './ToastContainer'
import type { UseToastReturn } from './useToast'
import { useToast } from './useToast'

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<UseToastReturn | undefined>(undefined)

// ============================================================================
// Provider Props
// ============================================================================

export interface ToastProviderProps {
  /** Children / العناصر الفرعية */
  children: React.ReactNode

  /** Toast position / موضع الإشعارات */
  position?: ToastPosition

  /** Maximum number of toasts / الحد الأقصى للإشعارات */
  maxToasts?: number

  /** RTL mode / وضع RTL */
  rtl?: boolean
}

// ============================================================================
// Provider Component
// ============================================================================

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
  rtl = false,
}) => {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} position={position} maxToasts={maxToasts} rtl={rtl} />
    </ToastContext.Provider>
  )
}

// ============================================================================
// Hook to use Toast Context
// ============================================================================

/**
 * Hook to access toast notifications
 * خطاف للوصول إلى الإشعارات
 */
export function useToastContext(): UseToastReturn {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider')
  }

  return context
}

export default ToastProvider
