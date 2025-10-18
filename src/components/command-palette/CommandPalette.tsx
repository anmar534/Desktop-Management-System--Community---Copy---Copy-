/**
 * Command Palette Component - مكون لوحة الأوامر
 * Sprint 5.4.3: إضافة Command Palette
 * 
 * A powerful command palette for quick access to all features
 * لوحة أوامر قوية للوصول السريع لجميع الميزات
 */

import type React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
  Search,
  Command,
  ArrowRight,
  Hash,
  FileText,
  FolderKanban,
  DollarSign,
  ShoppingCart,
  Settings,
  User,
  LogOut,
} from 'lucide-react'
import { designTokens } from '@/styles/design-system'

// ============================================================================
// Types
// ============================================================================

export interface CommandItem {
  /** Unique identifier / معرف فريد */
  id: string
  
  /** Label / التسمية */
  label: string
  
  /** Arabic label / التسمية بالعربية */
  labelAr?: string
  
  /** Description / الوصف */
  description?: string
  
  /** Arabic description / الوصف بالعربية */
  descriptionAr?: string
  
  /** Icon component / مكون الأيقونة */
  icon?: React.ReactNode
  
  /** Category / الفئة */
  category?: string
  
  /** Keywords for search / كلمات مفتاحية للبحث */
  keywords?: string[]
  
  /** Keyboard shortcut / اختصار لوحة المفاتيح */
  shortcut?: string[]
  
  /** Action to perform / الإجراء المطلوب */
  action?: () => void
  
  /** Path to navigate / المسار للانتقال */
  path?: string
}

export interface CommandPaletteProps {
  /** Show/hide state / حالة الإظهار/الإخفاء */
  open: boolean
  
  /** On close callback / عند الإغلاق */
  onClose: () => void
  
  /** Command items / عناصر الأوامر */
  commands?: CommandItem[]
  
  /** RTL mode / وضع RTL */
  rtl?: boolean
  
  /** Placeholder text / نص العنصر النائب */
  placeholder?: string
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

const Container = styled.div<{ show: boolean }>`
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%) ${props => props.show ? 'translateY(0)' : 'translateY(-20px)'};
  width: 90%;
  max-width: 640px;
  background-color: ${designTokens.colors.background.paper};
  border-radius: ${designTokens.borderRadius.xl};
  box-shadow: ${designTokens.shadows['2xl']};
  overflow: hidden;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transition: all ${designTokens.transitions.duration.normal} ${designTokens.transitions.timing.easeOut};
  z-index: ${designTokens.zIndex.modal + 1};
`

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[3]};
  padding: ${designTokens.spacing[4]} ${designTokens.spacing[5]};
  border-bottom: 1px solid ${designTokens.colors.border.light};
`

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${designTokens.colors.text.hint};
`

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: ${designTokens.typography.fontSize.lg};
  color: ${designTokens.colors.text.primary};
  background-color: transparent;

  &::placeholder {
    color: ${designTokens.colors.text.hint};
  }
`

const ResultsContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: ${designTokens.spacing[2]};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${designTokens.colors.neutral[300]};
    border-radius: ${designTokens.borderRadius.full};
  }
`

const CategoryLabel = styled.div`
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[3]};
  font-size: ${designTokens.typography.fontSize.xs};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.text.hint};
  text-transform: uppercase;
  letter-spacing: ${designTokens.typography.letterSpacing.wide};
`

const CommandItemContainer = styled.button<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[3]};
  width: 100%;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  border: none;
  background-color: ${props => props.selected ? designTokens.colors.primary[50] : 'transparent'};
  border-radius: ${designTokens.borderRadius.md};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};
  text-align: left;

  &:hover {
    background-color: ${props => props.selected ? designTokens.colors.primary[100] : designTokens.colors.neutral[100]};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: -2px;
  }
`

const CommandIcon = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${designTokens.borderRadius.md};
  background-color: ${props => props.selected ? designTokens.colors.primary[100] : designTokens.colors.neutral[100]};
  color: ${props => props.selected ? designTokens.colors.primary[600] : designTokens.colors.text.secondary};
  flex-shrink: 0;
`

const CommandContent = styled.div`
  flex: 1;
  min-width: 0;
`

const CommandLabel = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  color: ${designTokens.colors.text.primary};
  margin-bottom: 2px;
`

const CommandDescription = styled.div`
  font-size: ${designTokens.typography.fontSize.xs};
  color: ${designTokens.colors.text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CommandShortcut = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[1]};
  flex-shrink: 0;
`

const ShortcutKey = styled.kbd`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 ${designTokens.spacing[2]};
  background-color: ${designTokens.colors.neutral[100]};
  border: 1px solid ${designTokens.colors.border.light};
  border-radius: ${designTokens.borderRadius.sm};
  font-size: ${designTokens.typography.fontSize.xs};
  font-family: ${designTokens.typography.fontFamily.mono};
  color: ${designTokens.colors.text.secondary};
  box-shadow: ${designTokens.shadows.sm};
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${designTokens.spacing[12]} ${designTokens.spacing[6]};
  color: ${designTokens.colors.text.hint};
  text-align: center;
`

const EmptyStateIcon = styled.div`
  margin-bottom: ${designTokens.spacing[4]};
  opacity: 0.5;
`

const EmptyStateText = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[5]};
  border-top: 1px solid ${designTokens.colors.border.light};
  background-color: ${designTokens.colors.neutral[50]};
`

const FooterHint = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[4]};
  font-size: ${designTokens.typography.fontSize.xs};
  color: ${designTokens.colors.text.hint};
`

const HintItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[1]};
`

// ============================================================================
// Default Commands
// ============================================================================

const defaultCommands: CommandItem[] = [
  // Navigation
  {
    id: 'nav-home',
    label: 'Go to Home',
    labelAr: 'الذهاب إلى الرئيسية',
    icon: <Hash size={18} />,
    category: 'Navigation',
    path: '/',
    keywords: ['home', 'dashboard', 'الرئيسية'],
  },
  {
    id: 'nav-tenders',
    label: 'Go to Tenders',
    labelAr: 'الذهاب إلى المنافسات',
    icon: <FileText size={18} />,
    category: 'Navigation',
    path: '/tenders',
    keywords: ['tenders', 'المنافسات'],
  },
  {
    id: 'nav-projects',
    label: 'Go to Projects',
    labelAr: 'الذهاب إلى المشاريع',
    icon: <FolderKanban size={18} />,
    category: 'Navigation',
    path: '/projects',
    keywords: ['projects', 'المشاريع'],
  },
  {
    id: 'nav-financial',
    label: 'Go to Financial',
    labelAr: 'الذهاب إلى المالية',
    icon: <DollarSign size={18} />,
    category: 'Navigation',
    path: '/financial',
    keywords: ['financial', 'المالية', 'invoices', 'الفواتير'],
  },
  {
    id: 'nav-procurement',
    label: 'Go to Procurement',
    labelAr: 'الذهاب إلى المشتريات',
    icon: <ShoppingCart size={18} />,
    category: 'Navigation',
    path: '/procurement',
    keywords: ['procurement', 'المشتريات', 'orders', 'أوامر'],
  },
  
  // Actions
  {
    id: 'action-settings',
    label: 'Open Settings',
    labelAr: 'فتح الإعدادات',
    description: 'Configure application settings',
    descriptionAr: 'تكوين إعدادات التطبيق',
    icon: <Settings size={18} />,
    category: 'Actions',
    path: '/settings',
    shortcut: ['Ctrl', ','],
    keywords: ['settings', 'preferences', 'الإعدادات', 'التفضيلات'],
  },
  {
    id: 'action-profile',
    label: 'View Profile',
    labelAr: 'عرض الملف الشخصي',
    description: 'View and edit your profile',
    descriptionAr: 'عرض وتعديل ملفك الشخصي',
    icon: <User size={18} />,
    category: 'Actions',
    path: '/profile',
    keywords: ['profile', 'account', 'الملف', 'الحساب'],
  },
]

// ============================================================================
// Component
// ============================================================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  commands = defaultCommands,
  rtl = false,
  placeholder,
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commands
    }

    const lowerQuery = query.toLowerCase()
    
    return commands.filter(cmd => {
      const label = rtl && cmd.labelAr ? cmd.labelAr : cmd.label
      const description = rtl && cmd.descriptionAr ? cmd.descriptionAr : cmd.description
      
      return (
        label.toLowerCase().includes(lowerQuery) ||
        description?.toLowerCase().includes(lowerQuery) ||
        cmd.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery))
      )
    })
  }, [query, commands, rtl])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    
    filteredCommands.forEach(cmd => {
      const category = cmd.category || 'Other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(cmd)
    })
    
    return groups
  }, [filteredCommands])

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      inputRef.current?.focus()
    }
  }, [open])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          handleSelectCommand(filteredCommands[selectedIndex])
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, filteredCommands, onClose])

  const handleSelectCommand = (command: CommandItem) => {
    if (command.action) {
      command.action()
    } else if (command.path) {
      navigate(command.path)
    }
    onClose()
  }

  if (!open) return null

  return (
    <>
      <Overlay show={open} onClick={onClose} />
      <Container show={open}>
        <SearchContainer>
          <SearchIcon>
            <Search size={20} />
          </SearchIcon>
          <SearchInput
            ref={inputRef}
            type="text"
            placeholder={placeholder || (rtl ? 'ابحث عن أمر...' : 'Search for a command...')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </SearchContainer>

        <ResultsContainer>
          {filteredCommands.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>
                <Search size={48} />
              </EmptyStateIcon>
              <EmptyStateText>
                {rtl ? 'لم يتم العثور على نتائج' : 'No results found'}
              </EmptyStateText>
            </EmptyState>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category}>
                <CategoryLabel>{category}</CategoryLabel>
                {items.map((cmd, index) => {
                  const globalIndex = filteredCommands.indexOf(cmd)
                  const label = rtl && cmd.labelAr ? cmd.labelAr : cmd.label
                  const description = rtl && cmd.descriptionAr ? cmd.descriptionAr : cmd.description

                  return (
                    <CommandItemContainer
                      key={cmd.id}
                      selected={globalIndex === selectedIndex}
                      onClick={() => handleSelectCommand(cmd)}
                    >
                      <CommandIcon selected={globalIndex === selectedIndex}>
                        {cmd.icon}
                      </CommandIcon>
                      <CommandContent>
                        <CommandLabel>{label}</CommandLabel>
                        {description && <CommandDescription>{description}</CommandDescription>}
                      </CommandContent>
                      {cmd.shortcut && (
                        <CommandShortcut>
                          {cmd.shortcut.map((key, i) => (
                            <ShortcutKey key={i}>{key}</ShortcutKey>
                          ))}
                        </CommandShortcut>
                      )}
                    </CommandItemContainer>
                  )
                })}
              </div>
            ))
          )}
        </ResultsContainer>

        <Footer>
          <FooterHint>
            <HintItem>
              <ShortcutKey>↑</ShortcutKey>
              <ShortcutKey>↓</ShortcutKey>
              <span>{rtl ? 'للتنقل' : 'to navigate'}</span>
            </HintItem>
            <HintItem>
              <ShortcutKey>↵</ShortcutKey>
              <span>{rtl ? 'للتحديد' : 'to select'}</span>
            </HintItem>
            <HintItem>
              <ShortcutKey>Esc</ShortcutKey>
              <span>{rtl ? 'للإغلاق' : 'to close'}</span>
            </HintItem>
          </FooterHint>
        </Footer>
      </Container>
    </>
  )
}

export default CommandPalette

