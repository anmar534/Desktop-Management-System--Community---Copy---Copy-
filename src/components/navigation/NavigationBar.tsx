/**
 * Navigation Bar Component - مكون شريط التنقل
 * Sprint 5.4.2: تحسين التنقل والقوائم
 */

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react'
import styled from 'styled-components'
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Globe,
  ChevronDown,
} from 'lucide-react'
import { designTokens } from '@/styles/design-system'

// ============================================================================
// Types
// ============================================================================

export interface NavigationBarProps {
  /** User name / اسم المستخدم */
  userName?: string
  
  /** User avatar URL / رابط صورة المستخدم */
  userAvatar?: string
  
  /** Notification count / عدد الإشعارات */
  notificationCount?: number
  
  /** On search / عند البحث */
  onSearch?: (query: string) => void
  
  /** On notification click / عند النقر على الإشعارات */
  onNotificationClick?: () => void
  
  /** On profile click / عند النقر على الملف الشخصي */
  onProfileClick?: () => void
  
  /** On settings click / عند النقر على الإعدادات */
  onSettingsClick?: () => void
  
  /** On logout / عند تسجيل الخروج */
  onLogout?: () => void
  
  /** On theme toggle / عند تبديل السمة */
  onThemeToggle?: () => void
  
  /** On language toggle / عند تبديل اللغة */
  onLanguageToggle?: () => void
  
  /** Dark mode / الوضع الداكن */
  darkMode?: boolean
  
  /** Current language / اللغة الحالية */
  language?: 'en' | 'ar'
  
  /** RTL mode / وضع RTL */
  rtl?: boolean
}

// ============================================================================
// Styled Components
// ============================================================================

const NavBarContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 ${designTokens.spacing[6]};
  background-color: ${designTokens.colors.background.paper};
  border-bottom: 1px solid ${designTokens.colors.border.light};
  position: sticky;
  top: 0;
  z-index: ${designTokens.zIndex.sticky};
`

const NavSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[4]};
`

const SearchContainer = styled.div`
  position: relative;
  width: 400px;

  @media (max-width: ${designTokens.breakpoints.md}) {
    width: 200px;
  }
`

const SearchInput = styled.input<{ rtl?: boolean }>`
  width: 100%;
  height: 40px;
  padding-inline-start: ${({ rtl }) => rtl ? designTokens.spacing[4] : designTokens.spacing[10]};
  padding-inline-end: ${({ rtl }) => rtl ? designTokens.spacing[10] : designTokens.spacing[4]};
  border: 1px solid ${designTokens.colors.border.light};
  border-radius: ${designTokens.borderRadius.lg};
  font-size: ${designTokens.typography.fontSize.sm};
  background-color: ${designTokens.colors.background.default};
  transition: ${designTokens.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${designTokens.colors.primary[500]};
    box-shadow: 0 0 0 3px ${designTokens.colors.primary[50]};
  }

  &::placeholder {
    color: ${designTokens.colors.text.hint};
  }
`

const SearchIcon = styled.div<{ rtl?: boolean }>`
  position: absolute;
  inset-inline-start: ${({ rtl }) => rtl ? 'auto' : designTokens.spacing[3]};
  inset-inline-end: ${({ rtl }) => rtl ? designTokens.spacing[3] : 'auto'};
  top: 50%;
  transform: translateY(-50%);
  color: ${designTokens.colors.text.hint};
  pointer-events: none;
`

const IconButton = styled.button<{ active?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background-color: ${({ active }: { active?: boolean }) =>
    active ? designTokens.colors.primary[50] : 'transparent'};
  color: ${({ active }: { active?: boolean }) =>
    active ? designTokens.colors.primary[500] : designTokens.colors.text.secondary};
  border-radius: ${designTokens.borderRadius.lg};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${({ active }: { active?: boolean }) =>
      active
        ? designTokens.colors.primary[100]
        : designTokens.colors.neutral[100]};
    color: ${({ active }: { active?: boolean }) =>
      active ? designTokens.colors.primary[600] : designTokens.colors.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`

const Badge = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background-color: ${designTokens.colors.error[500]};
  color: ${designTokens.colors.neutral[0]};
  font-size: ${designTokens.typography.fontSize.xs};
  font-weight: ${designTokens.typography.fontWeight.bold};
  border-radius: ${designTokens.borderRadius.full};
  border: 2px solid ${designTokens.colors.background.paper};
`

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[2]};
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[3]};
  border: none;
  background-color: transparent;
  border-radius: ${designTokens.borderRadius.lg};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${designTokens.colors.neutral[100]};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`

const UserAvatar = styled.div<{ src?: string }>`
  width: 32px;
  height: 32px;
  border-radius: ${designTokens.borderRadius.full};
  background-color: ${designTokens.colors.primary[500]};
  background-image: ${({ src }: { src?: string }) =>
    src ? `url(${src})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${designTokens.colors.neutral[0]};
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
`

const UserName = styled.span`
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  color: ${designTokens.colors.text.primary};

  @media (max-width: ${designTokens.breakpoints.md}) {
    display: none;
  }
`

const Dropdown = styled.div<{ show: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background-color: ${designTokens.colors.background.paper};
  border: 1px solid ${designTokens.colors.border.light};
  border-radius: ${designTokens.borderRadius.lg};
  box-shadow: ${designTokens.shadows.lg};
  opacity: ${({ show }: { show: boolean }) => (show ? 1 : 0)};
  visibility: ${({ show }: { show: boolean }) => (show ? 'visible' : 'hidden')};
  transform: ${({ show }: { show: boolean }) =>
    show ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all ${designTokens.transitions.duration.fast} ${designTokens.transitions.timing.easeOut};
  z-index: ${designTokens.zIndex.dropdown};
`

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[3]};
  width: 100%;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  border: none;
  background-color: transparent;
  color: ${designTokens.colors.text.primary};
  font-size: ${designTokens.typography.fontSize.sm};
  text-align: left;
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:first-child {
    border-top-left-radius: ${designTokens.borderRadius.lg};
    border-top-right-radius: ${designTokens.borderRadius.lg};
  }

  &:last-child {
    border-bottom-left-radius: ${designTokens.borderRadius.lg};
    border-bottom-right-radius: ${designTokens.borderRadius.lg};
  }

  &:hover {
    background-color: ${designTokens.colors.neutral[100]};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: -2px;
  }
`

const DropdownDivider = styled.div`
  height: 1px;
  background-color: ${designTokens.colors.border.light};
  margin: ${designTokens.spacing[2]} 0;
`

const UserMenuContainer = styled.div`
  position: relative;
`

// ============================================================================
// Component
// ============================================================================

export function NavigationBar({
  userName = 'User',
  userAvatar,
  notificationCount = 0,
  onSearch,
  onNotificationClick,
  onProfileClick,
  onSettingsClick,
  onLogout,
  onThemeToggle,
  onLanguageToggle,
  darkMode = false,
  language = 'en',
  rtl = false,
}: NavigationBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu on outside click or Escape key
  useEffect(() => {
    if (!showUserMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showUserMenu])

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch?.(searchQuery)
  }

  const getUserInitials = () => {
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <NavBarContainer>
      <NavSection>
        <SearchContainer>
          <form onSubmit={handleSearchSubmit}>
            <SearchIcon rtl={rtl}>
              <Search size={18} />
            </SearchIcon>
            <SearchInput
              rtl={rtl}
              type="text"
              aria-label={rtl ? 'البحث' : 'Search'}
              placeholder={rtl ? 'بحث...' : 'Search...'}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </form>
        </SearchContainer>
      </NavSection>

      <NavSection>
        <IconButton
          onClick={onThemeToggle}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </IconButton>

        <IconButton
          onClick={onLanguageToggle}
          aria-label={language === 'ar' ? 'تغيير اللغة' : 'Change language'}
        >
          <Globe size={20} />
        </IconButton>

        <IconButton
          onClick={onNotificationClick}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {notificationCount > 0 && <Badge>{notificationCount}</Badge>}
        </IconButton>

        <UserMenuContainer ref={userMenuRef}>
          <UserButton
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <UserAvatar src={userAvatar}>
              {!userAvatar && getUserInitials()}
            </UserAvatar>
            <UserName>{userName}</UserName>
            <ChevronDown size={16} />
          </UserButton>

          <Dropdown show={showUserMenu}>
            <DropdownItem onClick={onProfileClick}>
              <User size={18} />
              {rtl ? 'الملف الشخصي' : 'Profile'}
            </DropdownItem>
            <DropdownItem onClick={onSettingsClick}>
              <Settings size={18} />
              {rtl ? 'الإعدادات' : 'Settings'}
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem onClick={onLogout}>
              <LogOut size={18} />
              {rtl ? 'تسجيل الخروج' : 'Logout'}
            </DropdownItem>
          </Dropdown>
        </UserMenuContainer>
      </NavSection>
    </NavBarContainer>
  )
}

export default NavigationBar

