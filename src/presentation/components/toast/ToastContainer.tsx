/**
 * Toast Container Component - مكون حاوية الإشعارات
 * Sprint 5.4.6: تحسين الرسائل والتنبيهات
 */

import type React from 'react'
import styled from 'styled-components'
import { createPortal } from 'react-dom'
import { designTokens } from '@/styles/design-system'
import type { ToastProps } from './Toast'
import Toast from './Toast'

// ============================================================================
// Types
// ============================================================================

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToastContainerProps {
  /** Toast position / موضع الإشعارات */
  position?: ToastPosition

  /** Maximum number of toasts / الحد الأقصى للإشعارات */
  maxToasts?: number

  /** RTL mode / وضع RTL */
  rtl?: boolean
}

export interface ToastData extends Omit<ToastProps, 'onClose'> {
  id: string
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.div<{ position: ToastPosition }>`
  position: fixed;
  z-index: ${designTokens.zIndex.toast};
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[3]};
  pointer-events: none;

  ${(props) => {
    const [vertical, horizontal] = props.position.split('-')

    let styles = ''

    // Vertical positioning
    if (vertical === 'top') {
      styles += `top: ${designTokens.spacing[6]};`
    } else {
      styles += `bottom: ${designTokens.spacing[6]};`
    }

    // Horizontal positioning
    if (horizontal === 'left') {
      styles += `left: ${designTokens.spacing[6]};`
    } else if (horizontal === 'right') {
      styles += `right: ${designTokens.spacing[6]};`
    } else {
      styles += `
        left: 50%;
        transform: translateX(-50%);
      `
    }

    return styles
  }}

  > * {
    pointer-events: auto;
  }
`

// ============================================================================
// Component
// ============================================================================

export const ToastContainer: React.FC<ToastContainerProps & { toasts: ToastData[] }> = ({
  position = 'top-right',
  maxToasts = 5,
  rtl = false,
  toasts,
}) => {
  // Limit number of toasts
  const visibleToasts = toasts.slice(0, maxToasts)

  // Create portal to render toasts at document body level
  return createPortal(
    <Container position={position}>
      {visibleToasts.map((toast) => (
        <Toast key={toast.id} {...toast} rtl={rtl} />
      ))}
    </Container>,
    document.body,
  )
}

export default ToastContainer
