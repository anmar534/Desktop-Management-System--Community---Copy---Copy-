/**
 * Alert Component - مكون التنبيهات
 * Sprint 5.4.6: تحسين الرسائل والتنبيهات
 */

import type React from 'react'
import styled from 'styled-components'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { designTokens } from '@/styles/design-system'

// ============================================================================
// Types
// ============================================================================

export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

export interface AlertProps {
  /** Alert variant / نوع التنبيه */
  variant: AlertVariant
  
  /** Title / العنوان */
  title?: string
  
  /** Children / المحتوى */
  children: React.ReactNode
  
  /** Show icon / عرض الأيقونة */
  showIcon?: boolean
  
  /** Closable / قابل للإغلاق */
  closable?: boolean
  
  /** On close callback / عند الإغلاق */
  onClose?: () => void
  
  /** RTL mode / وضع RTL */
  rtl?: boolean
  
  /** Custom icon / أيقونة مخصصة */
  icon?: React.ReactNode
}

// ============================================================================
// Styled Components
// ============================================================================

const AlertContainer = styled.div<{ variant: AlertVariant }>`
  display: flex;
  align-items: flex-start;
  gap: ${designTokens.spacing[3]};
  padding: ${designTokens.spacing[4]};
  border-radius: ${designTokens.borderRadius.lg};
  border: 1px solid;
  
  ${props => {
    switch (props.variant) {
      case 'success':
        return `
          background-color: ${designTokens.colors.success[50]};
          border-color: ${designTokens.colors.success[200]};
          color: ${designTokens.colors.success[900]};
        `
      case 'error':
        return `
          background-color: ${designTokens.colors.error[50]};
          border-color: ${designTokens.colors.error[200]};
          color: ${designTokens.colors.error[900]};
        `
      case 'warning':
        return `
          background-color: ${designTokens.colors.warning[50]};
          border-color: ${designTokens.colors.warning[200]};
          color: ${designTokens.colors.warning[900]};
        `
      case 'info':
        return `
          background-color: ${designTokens.colors.info[50]};
          border-color: ${designTokens.colors.info[200]};
          color: ${designTokens.colors.info[900]};
        `
      default:
        return ''
    }
  }}
`

const IconWrapper = styled.div<{ variant: AlertVariant }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  
  ${props => {
    switch (props.variant) {
      case 'success':
        return `color: ${designTokens.colors.success[600]};`
      case 'error':
        return `color: ${designTokens.colors.error[600]};`
      case 'warning':
        return `color: ${designTokens.colors.warning[600]};`
      case 'info':
        return `color: ${designTokens.colors.info[600]};`
      default:
        return ''
    }
  }}
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
  line-height: ${designTokens.typography.lineHeight.tight};
`

const Message = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  line-height: ${designTokens.typography.lineHeight.normal};
  opacity: 0.9;
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
  cursor: pointer;
  border-radius: ${designTokens.borderRadius.sm};
  opacity: 0.6;
  transition: ${designTokens.transitions.fast};

  &:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`

// ============================================================================
// Component
// ============================================================================

export const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  children,
  showIcon = true,
  closable = false,
  onClose,
  rtl = false,
  icon,
}) => {
  const getDefaultIcon = () => {
    switch (variant) {
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
    <AlertContainer variant={variant} role="alert">
      {showIcon && (
        <IconWrapper variant={variant}>
          {icon || getDefaultIcon()}
        </IconWrapper>
      )}

      <Content>
        {title && <Title>{title}</Title>}
        <Message>{children}</Message>
      </Content>

      {closable && onClose && (
        <CloseButton onClick={onClose} aria-label="Close">
          <X size={16} />
        </CloseButton>
      )}
    </AlertContainer>
  )
}

export default Alert

