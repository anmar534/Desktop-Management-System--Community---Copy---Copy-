/**
 * useToast Hook - خطاف الإشعارات
 * Sprint 5.4.6: تحسين الرسائل والتنبيهات
 */

import { useState, useCallback } from 'react'
import { ToastType } from './Toast'
import { ToastData } from './ToastContainer'

// ============================================================================
// Types
// ============================================================================

export interface ShowToastOptions {
  /** Toast type / نوع الإشعار */
  type: ToastType
  
  /** Title / العنوان */
  title: string
  
  /** Message / الرسالة */
  message?: string
  
  /** Duration in milliseconds / المدة بالميلي ثانية */
  duration?: number
  
  /** Closable / قابل للإغلاق */
  closable?: boolean
}

export interface UseToastReturn {
  /** All toasts / جميع الإشعارات */
  toasts: ToastData[]
  
  /** Show a toast / عرض إشعار */
  showToast: (options: ShowToastOptions) => string
  
  /** Show success toast / عرض إشعار نجاح */
  success: (title: string, message?: string, duration?: number) => string
  
  /** Show error toast / عرض إشعار خطأ */
  error: (title: string, message?: string, duration?: number) => string
  
  /** Show warning toast / عرض إشعار تحذير */
  warning: (title: string, message?: string, duration?: number) => string
  
  /** Show info toast / عرض إشعار معلومات */
  info: (title: string, message?: string, duration?: number) => string
  
  /** Remove a toast / إزالة إشعار */
  removeToast: (id: string) => void
  
  /** Clear all toasts / مسح جميع الإشعارات */
  clearAll: () => void
}

// ============================================================================
// Helper Functions
// ============================================================================

let toastIdCounter = 0

function generateToastId(): string {
  toastIdCounter += 1
  return `toast-${Date.now()}-${toastIdCounter}`
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing toast notifications
 * خطاف لإدارة الإشعارات المنبثقة
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((options: ShowToastOptions): string => {
    const id = generateToastId()
    
    const toast: ToastData = {
      id,
      type: options.type,
      title: options.title,
      message: options.message,
      duration: options.duration ?? 5000,
      closable: options.closable ?? true,
      onClose: removeToast,
    }

    setToasts(prev => [...prev, toast])
    
    return id
  }, [removeToast])

  const success = useCallback((title: string, message?: string, duration?: number): string => {
    return showToast({ type: 'success', title, message, duration })
  }, [showToast])

  const error = useCallback((title: string, message?: string, duration?: number): string => {
    return showToast({ type: 'error', title, message, duration })
  }, [showToast])

  const warning = useCallback((title: string, message?: string, duration?: number): string => {
    return showToast({ type: 'warning', title, message, duration })
  }, [showToast])

  const info = useCallback((title: string, message?: string, duration?: number): string => {
    return showToast({ type: 'info', title, message, duration })
  }, [showToast])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearAll,
  }
}

export default useToast

