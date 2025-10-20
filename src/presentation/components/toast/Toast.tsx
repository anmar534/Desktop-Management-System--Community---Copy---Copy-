/**
 * Toast Component - مكون الإشعارات المنبثقة
 * Sprint 5.4.6: تحسين الرسائل والتنبيهات
 */

import React, { useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { designTokens } from '@/styles/design-system'

// ============================================================================
// Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  /** Unique identifier / معرف فريد */
  id: string
  
  /** Toast type / نوع الإشعار */
  type: ToastType
  
  /** Title / العنوان */
  title: string
  
  /** Message / الرسالة */
  message?: string
  
  /** Duration in milliseconds / المدة بالميلي ثانية */
  duration?: number
  
  /** On close callback / عند الإغلاق */
  onClose: (id: string) => void
  
  /** RTL mode / وضع RTL */
  rtl?: boolean
  
  /** Show close button / عرض زر الإغلاء */
  closable?: boolean
}

// ============================================================================
// Animations
// ============================================================================

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`

const slideInRTL = keyframes`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`

const slideOutRTL = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
`

// ============================================================================
// Styled Components
// ============================================================================

const ToastContainer = styled.div<{ type: ToastType; rtl: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${designTokens.spacing[3]};
  min-width: 320px;
  max-width: 480px;
  padding: ${designTokens.spacing[4]};
  background-color: ${designTokens.colors.background.paper};
  border-radius: ${designTokens.borderRadius.lg};
  box-shadow: ${designTokens.shadows.xl};
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return designTokens.colors.success[500]
      case 'error': return designTokens.colors.error[500]
      case 'warning': return designTokens.colors.warning[500]
      case 'info': return designTokens.colors.info[500]
      default: return designTokens.colors.neutral[500]
    }
  }};
  animation: ${props => props.rtl ? slideInRTL : slideIn} ${designTokens.transitions.duration.normal} ${designTokens.transitions.timing.easeOut};
  
  &.closing {
    animation: ${props => props.rtl ? slideOutRTL : slideOut} ${designTokens.transitions.duration.fast} ${designTokens.transitions.timing.easeIn};
  }

  ${props => props.rtl && `
    border-left: none;
    border-right: 4px solid ${(() => {
      switch (props.type) {
        case 'success': return designTokens.colors.success[500]
        case 'error': return designTokens.colors.error[500]
        case 'warning': return designTokens.colors.warning[500]
        case 'info': return designTokens.colors.info[500]
        default: return designTokens.colors.neutral[500]
      }
    })()};
  `}
`

const IconWrapper = styled.div<{ type: ToastType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: ${props => {
    switch (props.type) {
      case 'success': return designTokens.colors.success[500]
      case 'error': return designTokens.colors.error[500]
      case 'warning': return designTokens.colors.warning[500]
      case 'info': return designTokens.colors.info[500]
      default: return designTokens.colors.neutral[500]
    }
  }};
`

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[1]};
`

const Title = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.text.primary};
  line-height: ${designTokens.typography.lineHeight.tight};
`

const Message = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.text.secondary};
  line-height: ${designTokens.typography.lineHeight.normal};
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  color: ${designTokens.colors.text.hint};
  cursor: pointer;
  border-radius: ${designTokens.borderRadius.sm};
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${designTokens.colors.neutral[100]};
    color: ${designTokens.colors.text.secondary};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`

// ============================================================================
// Component
// ============================================================================

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  rtl = false,
  closable = true,
}) => {
  const [isClosing, setIsClosing] = React.useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, id])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose(id)
    }, 200) // Match animation duration
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} />
      case 'error':
        return <AlertCircle size={24} />
      case 'warning':
        return <AlertTriangle size={24} />
      case 'info':
        return <Info size={24} />
      default:
        return <Info size={24} />
    }
  }

  return (
    <ToastContainer 
      type={type} 
      rtl={rtl}
      className={isClosing ? 'closing' : ''}
      role="alert"
      aria-live="polite"
    >
      <IconWrapper type={type}>
        {getIcon()}
      </IconWrapper>

      <Content>
        <Title>{title}</Title>
        {message && <Message>{message}</Message>}
      </Content>

      {closable && (
        <CloseButton onClick={handleClose} aria-label="Close">
          <X size={16} />
        </CloseButton>
      )}
    </ToastContainer>
  )
}

export default Toast

