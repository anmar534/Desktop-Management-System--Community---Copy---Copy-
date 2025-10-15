/**
 * Shortcuts Dialog Component - مكون حوار الاختصارات
 * Sprint 5.4.4: اختصارات لوحة المفاتيح
 */

import React, { useMemo } from 'react'
import styled from 'styled-components'
import { X, Keyboard } from 'lucide-react'
import { designTokens } from '@/styles/design-system'
import { KeyboardShortcut, formatShortcut } from '@/hooks/useKeyboardShortcuts'

// ============================================================================
// Types
// ============================================================================

export interface ShortcutsDialogProps {
  /** Show/hide state / حالة الإظهار/الإخفاء */
  open: boolean
  
  /** On close callback / عند الإغلاق */
  onClose: () => void
  
  /** Keyboard shortcuts / اختصارات لوحة المفاتيح */
  shortcuts: KeyboardShortcut[]
  
  /** RTL mode / وضع RTL */
  rtl?: boolean
}

// ============================================================================
// Styled Components
// ============================================================================

const Overlay = styled.div<{ show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${designTokens.colors.background.overlay};
  backdrop-filter: blur(4px);
  z-index: ${designTokens.zIndex.modal};
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transition: all ${designTokens.transitions.duration.fast} ${designTokens.transitions.timing.easeOut};
`

const Dialog = styled.div<{ show: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) ${props => props.show ? 'scale(1)' : 'scale(0.95)'};
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  background-color: ${designTokens.colors.background.paper};
  border-radius: ${designTokens.borderRadius.xl};
  box-shadow: ${designTokens.shadows['2xl']};
  overflow: hidden;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transition: all ${designTokens.transitions.duration.normal} ${designTokens.transitions.timing.easeOut};
  z-index: ${designTokens.zIndex.modal + 1};
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${designTokens.spacing[6]};
  border-bottom: 1px solid ${designTokens.colors.border.light};
`

const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[3]};
  font-size: ${designTokens.typography.fontSize['2xl']};
  font-weight: ${designTokens.typography.fontWeight.bold};
  color: ${designTokens.colors.text.primary};
  margin: 0;
`

const TitleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: ${designTokens.colors.primary[50]};
  color: ${designTokens.colors.primary[500]};
  border-radius: ${designTokens.borderRadius.lg};
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background-color: transparent;
  color: ${designTokens.colors.text.secondary};
  border-radius: ${designTokens.borderRadius.lg};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${designTokens.colors.neutral[100]};
    color: ${designTokens.colors.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${designTokens.spacing[6]};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${designTokens.colors.neutral[300]};
    border-radius: ${designTokens.borderRadius.full};
  }
`

const CategorySection = styled.div`
  margin-bottom: ${designTokens.spacing[8]};

  &:last-child {
    margin-bottom: 0;
  }
`

const CategoryTitle = styled.h3`
  font-size: ${designTokens.typography.fontSize.lg};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.text.primary};
  margin: 0 0 ${designTokens.spacing[4]} 0;
  padding-bottom: ${designTokens.spacing[2]};
  border-bottom: 2px solid ${designTokens.colors.border.light};
`

const ShortcutsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[2]};
`

const ShortcutItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  background-color: ${designTokens.colors.neutral[50]};
  border-radius: ${designTokens.borderRadius.md};
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${designTokens.colors.neutral[100]};
  }
`

const ShortcutDescription = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.text.primary};
`

const ShortcutKeys = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[1]};
  flex-shrink: 0;
  margin-left: ${designTokens.spacing[4]};
`

const Key = styled.kbd`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 ${designTokens.spacing[2]};
  background-color: ${designTokens.colors.background.paper};
  border: 1px solid ${designTokens.colors.border.main};
  border-bottom-width: 3px;
  border-radius: ${designTokens.borderRadius.md};
  font-size: ${designTokens.typography.fontSize.sm};
  font-family: ${designTokens.typography.fontFamily.mono};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.text.primary};
  box-shadow: ${designTokens.shadows.sm};
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${designTokens.spacing[12]};
  color: ${designTokens.colors.text.hint};
  text-align: center;
`

const EmptyStateIcon = styled.div`
  margin-bottom: ${designTokens.spacing[4]};
  opacity: 0.5;
`

const EmptyStateText = styled.div`
  font-size: ${designTokens.typography.fontSize.base};
`

const Footer = styled.div`
  padding: ${designTokens.spacing[4]} ${designTokens.spacing[6]};
  border-top: 1px solid ${designTokens.colors.border.light};
  background-color: ${designTokens.colors.neutral[50]};
  text-align: center;
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.text.secondary};
`

// ============================================================================
// Component
// ============================================================================

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({
  open,
  onClose,
  shortcuts,
  rtl = false,
}) => {
  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {}
    
    shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'Other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(shortcut)
    })
    
    return groups
  }, [shortcuts])

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <>
      <Overlay show={open} onClick={handleOverlayClick} />
      <Dialog show={open}>
        <Header>
          <Title>
            <TitleIcon>
              <Keyboard size={24} />
            </TitleIcon>
            {rtl ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
          </Title>
          <CloseButton onClick={onClose} aria-label="Close">
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          {shortcuts.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>
                <Keyboard size={64} />
              </EmptyStateIcon>
              <EmptyStateText>
                {rtl ? 'لا توجد اختصارات متاحة' : 'No shortcuts available'}
              </EmptyStateText>
            </EmptyState>
          ) : (
            Object.entries(groupedShortcuts).map(([category, items]) => (
              <CategorySection key={category}>
                <CategoryTitle>{category}</CategoryTitle>
                <ShortcutsList>
                  {items.map(shortcut => {
                    const description = rtl && shortcut.descriptionAr 
                      ? shortcut.descriptionAr 
                      : shortcut.description
                    
                    return (
                      <ShortcutItem key={shortcut.id}>
                        <ShortcutDescription>{description}</ShortcutDescription>
                        <ShortcutKeys>
                          {formatShortcut(shortcut.keys).split('+').map((key, index) => (
                            <React.Fragment key={index}>
                              <Key>{key}</Key>
                              {index < shortcut.keys.length - 1 && <span>+</span>}
                            </React.Fragment>
                          ))}
                        </ShortcutKeys>
                      </ShortcutItem>
                    )
                  })}
                </ShortcutsList>
              </CategorySection>
            ))
          )}
        </Content>

        <Footer>
          {rtl 
            ? 'اضغط ? لفتح هذا الحوار في أي وقت' 
            : 'Press ? to open this dialog anytime'}
        </Footer>
      </Dialog>
    </>
  )
}

export default ShortcutsDialog

