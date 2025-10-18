/**
 * Sidebar Component - مكون القائمة الجانبية
 * Sprint 5.4.2: تحسين التنقل والقوائم
 */

import type React from 'react';
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import {
  Home,
  FileText,
  FolderKanban,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { designTokens } from '@/styles/design-system'

// ============================================================================
// Types
// ============================================================================

export interface MenuItem {
  /** Unique identifier / معرف فريد */
  id: string
  
  /** Label / التسمية */
  label: string
  
  /** Arabic label / التسمية بالعربية */
  labelAr?: string
  
  /** Icon component / مكون الأيقونة */
  icon?: React.ReactNode
  
  /** Path to navigate / المسار */
  path?: string
  
  /** Sub-menu items / عناصر القائمة الفرعية */
  children?: MenuItem[]
  
  /** Badge count / عدد الشارة */
  badge?: number
  
  /** Disabled state / حالة التعطيل */
  disabled?: boolean
}

export interface SidebarProps {
  /** Menu items / عناصر القائمة */
  items: MenuItem[]
  
  /** Collapsed state / حالة الطي */
  collapsed?: boolean
  
  /** On collapse toggle / عند تبديل الطي */
  onCollapseToggle?: (collapsed: boolean) => void
  
  /** RTL mode / وضع RTL */
  rtl?: boolean
  
  /** Logo component / مكون الشعار */
  logo?: React.ReactNode
  
  /** Footer component / مكون التذييل */
  footer?: React.ReactNode
}

// ============================================================================
// Styled Components
// ============================================================================

const SidebarContainer = styled.aside<{ collapsed: boolean; rtl: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${props => props.collapsed ? '80px' : '280px'};
  height: 100vh;
  background-color: ${designTokens.colors.background.paper};
  border-${props => props.rtl ? 'left' : 'right'}: 1px solid ${designTokens.colors.border.light};
  transition: width ${designTokens.transitions.duration.normal} ${designTokens.transitions.timing.easeInOut};
  overflow: hidden;
  position: sticky;
  top: 0;
  z-index: ${designTokens.zIndex.sticky};
`

const SidebarHeader = styled.div<{ collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${props => props.collapsed ? 'center' : 'space-between'};
  padding: ${designTokens.spacing[4]};
  border-bottom: 1px solid ${designTokens.colors.border.light};
  min-height: 64px;
`

const Logo = styled.div<{ collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[3]};
  font-size: ${designTokens.typography.fontSize.lg};
  font-weight: ${designTokens.typography.fontWeight.bold};
  color: ${designTokens.colors.primary[500]};
  opacity: ${props => props.collapsed ? 0 : 1};
  transition: opacity ${designTokens.transitions.duration.fast};
`

const CollapseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: ${designTokens.colors.text.secondary};
  border-radius: ${designTokens.borderRadius.md};
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

const SidebarContent = styled.nav`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${designTokens.spacing[2]} 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${designTokens.colors.neutral[300]};
    border-radius: ${designTokens.borderRadius.full};
  }
`

const MenuList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

const MenuItemContainer = styled.li<{ level: number }>`
  padding-left: ${props => props.level * 16}px;
`

const MenuItemLink = styled(Link)<{ active: boolean; disabled: boolean; collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[3]};
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  color: ${props => props.active ? designTokens.colors.primary[500] : designTokens.colors.text.secondary};
  background-color: ${props => props.active ? designTokens.colors.primary[50] : 'transparent'};
  text-decoration: none;
  transition: ${designTokens.transitions.fast};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  position: relative;
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};

  &:hover:not([disabled]) {
    background-color: ${props => props.active ? designTokens.colors.primary[100] : designTokens.colors.neutral[100]};
    color: ${props => props.active ? designTokens.colors.primary[600] : designTokens.colors.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: -2px;
  }

  ${props => props.active && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: ${designTokens.colors.primary[500]};
    }
  `}
`

const MenuItemButton = styled.button<{ active: boolean; collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[3]};
  width: 100%;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  border: none;
  background-color: ${props => props.active ? designTokens.colors.primary[50] : 'transparent'};
  color: ${props => props.active ? designTokens.colors.primary[500] : designTokens.colors.text.secondary};
  text-align: left;
  cursor: pointer;
  transition: ${designTokens.transitions.fast};
  justify-content: ${props => props.collapsed ? 'center' : 'flex-start'};

  &:hover {
    background-color: ${props => props.active ? designTokens.colors.primary[100] : designTokens.colors.neutral[100]};
    color: ${props => props.active ? designTokens.colors.primary[600] : designTokens.colors.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: -2px;
  }
`

const MenuItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
`

const MenuItemLabel = styled.span<{ collapsed: boolean }>`
  flex: 1;
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  white-space: nowrap;
  opacity: ${props => props.collapsed ? 0 : 1};
  transition: opacity ${designTokens.transitions.duration.fast};
`

const MenuItemBadge = styled.span<{ collapsed: boolean }>`
  display: ${props => props.collapsed ? 'none' : 'flex'};
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background-color: ${designTokens.colors.error[500]};
  color: ${designTokens.colors.neutral[0]};
  font-size: ${designTokens.typography.fontSize.xs};
  font-weight: ${designTokens.typography.fontWeight.bold};
  border-radius: ${designTokens.borderRadius.full};
`

const MenuItemExpand = styled.span<{ expanded: boolean; collapsed: boolean }>`
  display: ${props => props.collapsed ? 'none' : 'flex'};
  align-items: center;
  justify-content: center;
  transition: transform ${designTokens.transitions.duration.fast};
  transform: ${props => props.expanded ? 'rotate(0deg)' : 'rotate(-90deg)'};
`

const SidebarFooter = styled.div`
  padding: ${designTokens.spacing[4]};
  border-top: 1px solid ${designTokens.colors.border.light};
`

// ============================================================================
// Component
// ============================================================================

const MenuItemComponent: React.FC<{
  item: MenuItem
  level: number
  collapsed: boolean
  rtl: boolean
}> = ({ item, level, collapsed, rtl }) => {
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  
  const isActive = item.path ? location.pathname === item.path : false
  const hasChildren = item.children && item.children.length > 0
  const displayLabel = rtl && item.labelAr ? item.labelAr : item.label

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded)
    }
  }

  return (
    <MenuItemContainer level={level}>
      {hasChildren ? (
        <>
          <MenuItemButton
            onClick={handleClick}
            active={isActive}
            collapsed={collapsed}
            aria-expanded={expanded}
          >
            {item.icon && <MenuItemIcon>{item.icon}</MenuItemIcon>}
            <MenuItemLabel collapsed={collapsed}>{displayLabel}</MenuItemLabel>
            {item.badge && <MenuItemBadge collapsed={collapsed}>{item.badge}</MenuItemBadge>}
            <MenuItemExpand expanded={expanded} collapsed={collapsed}>
              <ChevronDown size={16} />
            </MenuItemExpand>
          </MenuItemButton>
          
          {expanded && !collapsed && (
            <MenuList>
              {item.children.map(child => (
                <MenuItemComponent
                  key={child.id}
                  item={child}
                  level={level + 1}
                  collapsed={collapsed}
                  rtl={rtl}
                />
              ))}
            </MenuList>
          )}
        </>
      ) : (
        <MenuItemLink
          to={item.path || '#'}
          active={isActive}
          disabled={item.disabled || false}
          collapsed={collapsed}
          aria-current={isActive ? 'page' : undefined}
        >
          {item.icon && <MenuItemIcon>{item.icon}</MenuItemIcon>}
          <MenuItemLabel collapsed={collapsed}>{displayLabel}</MenuItemLabel>
          {item.badge && <MenuItemBadge collapsed={collapsed}>{item.badge}</MenuItemBadge>}
        </MenuItemLink>
      )}
    </MenuItemContainer>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  collapsed = false,
  onCollapseToggle,
  rtl = false,
  logo,
  footer,
}) => {
  const handleCollapseToggle = () => {
    onCollapseToggle?.(!collapsed)
  }

  return (
    <SidebarContainer collapsed={collapsed} rtl={rtl}>
      <SidebarHeader collapsed={collapsed}>
        {logo && <Logo collapsed={collapsed}>{logo}</Logo>}
        <CollapseButton
          onClick={handleCollapseToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </CollapseButton>
      </SidebarHeader>

      <SidebarContent>
        <MenuList>
          {items.map(item => (
            <MenuItemComponent
              key={item.id}
              item={item}
              level={0}
              collapsed={collapsed}
              rtl={rtl}
            />
          ))}
        </MenuList>
      </SidebarContent>

      {footer && <SidebarFooter>{footer}</SidebarFooter>}
    </SidebarContainer>
  )
}

// ============================================================================
// Default Menu Items
// ============================================================================

export const defaultMenuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    labelAr: 'الرئيسية',
    icon: <Home size={20} />,
    path: '/',
  },
  {
    id: 'tenders',
    label: 'Tenders',
    labelAr: 'المنافسات',
    icon: <FileText size={20} />,
    path: '/tenders',
  },
  {
    id: 'projects',
    label: 'Projects',
    labelAr: 'المشاريع',
    icon: <FolderKanban size={20} />,
    path: '/projects',
  },
  {
    id: 'financial',
    label: 'Financial',
    labelAr: 'المالية',
    icon: <DollarSign size={20} />,
    children: [
      {
        id: 'invoices',
        label: 'Invoices',
        labelAr: 'الفواتير',
        path: '/financial/invoices',
      },
      {
        id: 'budgets',
        label: 'Budgets',
        labelAr: 'الميزانيات',
        path: '/financial/budgets',
      },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    labelAr: 'المشتريات',
    icon: <ShoppingCart size={20} />,
    children: [
      {
        id: 'orders',
        label: 'Purchase Orders',
        labelAr: 'أوامر الشراء',
        path: '/procurement/orders',
      },
      {
        id: 'suppliers',
        label: 'Suppliers',
        labelAr: 'الموردين',
        path: '/procurement/suppliers',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    labelAr: 'التقارير',
    icon: <BarChart3 size={20} />,
    path: '/reports',
  },
  {
    id: 'settings',
    label: 'Settings',
    labelAr: 'الإعدادات',
    icon: <Settings size={20} />,
    path: '/settings',
  },
]

export default Sidebar

