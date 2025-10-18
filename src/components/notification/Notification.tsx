/**
 * Notification Component - مكون الإشعارات المتقدمة
 * Sprint 5.4.6: تحسين الرسائل والتنبيهات
 */

import type React from 'react'
import styled from 'styled-components'
import { X, Bell } from 'lucide-react'
import { designTokens } from '@/styles/design-system'

// ============================================================================
// Types
// ============================================================================

export interface NotificationAction {
  /** Action label / تسمية الإجراء */
  label: string
  
  /** Action callback / دالة الإجراء */
  onClick: () => void
  
  /** Primary action / إجراء أساسي */
  primary?: boolean
}

export interface NotificationProps {
  /** Unique identifier / معرف فريد */
  id: string
  
  /** Title / العنوان */
  title: string
  
  /** Message / الرسالة */
  message: string
  
  /** Timestamp / الوقت */
  timestamp?: Date
  
  /** Read status / حالة القراءة */
  read?: boolean
  
  /** Icon / الأيقونة */
  icon?: React.ReactNode
  
  /** Actions / الإجراءات */
  actions?: NotificationAction[]
  
  /** On close callback / عند الإغلاق */
  onClose?: (id: string) => void
  
  /** On click callback / عند النقر */
  onClick?: (id: string) => void
  
  /** RTL mode / وضع RTL */
  rtl?: boolean
}

// ============================================================================
// Styled Components
// ============================================================================

const NotificationContainer = styled.div<{ read: boolean; clickable: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${designTokens.spacing[3]};
  padding: ${designTokens.spacing[4]};
  background-color: ${props => props.read 
    ? designTokens.colors.background.paper 
    : designTokens.colors.primary[50]};
  border-radius: ${designTokens.borderRadius.lg};
  border: 1px solid ${designTokens.colors.border.light};
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${props => props.read 
      ? designTokens.colors.neutral[50] 
      : designTokens.colors.primary[100]};
  }
`

const IconWrapper = styled.div<{ read: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background-color: ${props => props.read 
    ? designTokens.colors.neutral[100] 
    : designTokens.colors.primary[100]};
  color: ${props => props.read 
    ? designTokens.colors.neutral[600] 
    : designTokens.colors.primary[600]};
  border-radius: ${designTokens.borderRadius.full};
`

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[1]};
  min-width: 0;
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${designTokens.spacing[2]};
`

const Title = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.text.primary};
  line-height: ${designTokens.typography.lineHeight.tight};
`

const Timestamp = styled.div`
  font-size: ${designTokens.typography.fontSize.xs};
  color: ${designTokens.colors.text.hint};
  white-space: nowrap;
`

const Message = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.text.secondary};
  line-height: ${designTokens.typography.lineHeight.normal};
`

const Actions = styled.div`
  display: flex;
  gap: ${designTokens.spacing[2]};
  margin-top: ${designTokens.spacing[2]};
`

const ActionButton = styled.button<{ primary?: boolean }>`
  padding: ${designTokens.spacing[1]} ${designTokens.spacing[3]};
  border: 1px solid ${props => props.primary 
    ? designTokens.colors.primary[500] 
    : designTokens.colors.border.main};
  background-color: ${props => props.primary 
    ? designTokens.colors.primary[500] 
    : 'transparent'};
  color: ${props => props.primary 
    ? designTokens.colors.neutral[0] 
    : designTokens.colors.text.primary};
  font-size: ${designTokens.typography.fontSize.xs};
  font-weight: ${designTokens.typography.fontWeight.medium};
  border-radius: ${designTokens.borderRadius.md};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${props => props.primary 
      ? designTokens.colors.primary[600] 
      : designTokens.colors.neutral[100]};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
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
// Helper Functions
// ============================================================================

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

// ============================================================================
// Component
// ============================================================================

export const Notification: React.FC<NotificationProps> = ({
  id,
  title,
  message,
  timestamp,
  read = false,
  icon,
  actions,
  onClose,
  onClick,
  rtl = false,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(id)
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClose) {
      onClose(id)
    }
  }

  return (
    <NotificationContainer 
      read={read} 
      clickable={!!onClick}
      onClick={handleClick}
    >
      <IconWrapper read={read}>
        {icon || <Bell size={20} />}
      </IconWrapper>

      <Content>
        <Header>
          <Title>{title}</Title>
          {timestamp && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
        </Header>

        <Message>{message}</Message>

        {actions && actions.length > 0 && (
          <Actions>
            {actions.map((action, index) => (
              <ActionButton
                key={index}
                primary={action.primary}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick()
                }}
              >
                {action.label}
              </ActionButton>
            ))}
          </Actions>
        )}
      </Content>

      {onClose && (
        <CloseButton onClick={handleClose} aria-label="Close">
          <X size={16} />
        </CloseButton>
      )}
    </NotificationContainer>
  )
}

export default Notification

