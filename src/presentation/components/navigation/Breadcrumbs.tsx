/**
 * Breadcrumbs Component - مكون التنقل التفصيلي
 * Sprint 5.4.2: تحسين التنقل والقوائم
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { ChevronRight, Home } from 'lucide-react'
import { designTokens } from '@/styles/design-system'

// ============================================================================
// Types
// ============================================================================

export interface BreadcrumbItem {
  /** Label to display / التسمية للعرض */
  label: string
  
  /** Arabic label / التسمية بالعربية */
  labelAr?: string
  
  /** Path to navigate to / المسار للانتقال إليه */
  path?: string
  
  /** Icon component / مكون الأيقونة */
  icon?: React.ReactNode
}

export interface BreadcrumbsProps {
  /** Breadcrumb items / عناصر التنقل */
  items?: BreadcrumbItem[]
  
  /** Auto-generate from route / توليد تلقائي من المسار */
  autoGenerate?: boolean
  
  /** Show home icon / عرض أيقونة الرئيسية */
  showHomeIcon?: boolean
  
  /** Separator icon / أيقونة الفاصل */
  separator?: React.ReactNode
  
  /** Maximum items to show / الحد الأقصى للعناصر */
  maxItems?: number
  
  /** RTL mode / وضع RTL */
  rtl?: boolean
}

// ============================================================================
// Styled Components
// ============================================================================

const BreadcrumbsContainer = styled.nav<{ rtl?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[2]};
  padding: ${designTokens.spacing[3]} 0;
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.text.secondary};
  direction: ${props => props.rtl ? 'rtl' : 'ltr'};
`

const BreadcrumbList = styled.ol`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
`

const BreadcrumbItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[2]};
`

const BreadcrumbLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[1]};
  color: ${designTokens.colors.text.secondary};
  text-decoration: none;
  transition: ${designTokens.transitions.fast};
  padding: ${designTokens.spacing[1]} ${designTokens.spacing[2]};
  border-radius: ${designTokens.borderRadius.sm};

  &:hover {
    color: ${designTokens.colors.primary[500]};
    background-color: ${designTokens.colors.primary[50]};
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`

const BreadcrumbText = styled.span<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[1]};
  color: ${props => props.active ? designTokens.colors.text.primary : designTokens.colors.text.secondary};
  font-weight: ${props => props.active ? designTokens.typography.fontWeight.medium : designTokens.typography.fontWeight.regular};
  padding: ${designTokens.spacing[1]} ${designTokens.spacing[2]};
`

const Separator = styled.span`
  display: flex;
  align-items: center;
  color: ${designTokens.colors.text.disabled};
  user-select: none;
`

const Ellipsis = styled.span`
  padding: ${designTokens.spacing[1]} ${designTokens.spacing[2]};
  color: ${designTokens.colors.text.disabled};
  cursor: default;
`

// ============================================================================
// Route Labels Map
// ============================================================================

const routeLabels: Record<string, { en: string; ar: string }> = {
  '/': { en: 'Home', ar: 'الرئيسية' },
  '/dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  '/tenders': { en: 'Tenders', ar: 'المنافسات' },
  '/tenders/new': { en: 'New Tender', ar: 'منافسة جديدة' },
  '/projects': { en: 'Projects', ar: 'المشاريع' },
  '/projects/new': { en: 'New Project', ar: 'مشروع جديد' },
  '/financial': { en: 'Financial', ar: 'المالية' },
  '/financial/invoices': { en: 'Invoices', ar: 'الفواتير' },
  '/financial/budgets': { en: 'Budgets', ar: 'الميزانيات' },
  '/procurement': { en: 'Procurement', ar: 'المشتريات' },
  '/procurement/orders': { en: 'Purchase Orders', ar: 'أوامر الشراء' },
  '/procurement/suppliers': { en: 'Suppliers', ar: 'الموردين' },
  '/reports': { en: 'Reports', ar: 'التقارير' },
  '/settings': { en: 'Settings', ar: 'الإعدادات' },
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateBreadcrumbsFromPath(pathname: string, rtl: boolean): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Add home
  breadcrumbs.push({
    label: 'Home',
    labelAr: 'الرئيسية',
    path: '/',
    icon: <Home size={16} />,
  })

  // Build breadcrumbs from path segments
  let currentPath = ''
  paths.forEach((segment, index) => {
    currentPath += `/${segment}`
    const labels = routeLabels[currentPath]
    
    breadcrumbs.push({
      label: labels?.en || segment.charAt(0).toUpperCase() + segment.slice(1),
      labelAr: labels?.ar,
      path: index === paths.length - 1 ? undefined : currentPath,
    })
  })

  return breadcrumbs
}

function collapseBreadcrumbs(items: BreadcrumbItem[], maxItems: number): BreadcrumbItem[] {
  if (items.length <= maxItems) {
    return items
  }

  const first = items[0]
  const last = items[items.length - 1]
  const remaining = items.slice(1, -1)

  return [
    first,
    { label: '...', labelAr: '...' },
    ...remaining.slice(-(maxItems - 2)),
    last,
  ]
}

// ============================================================================
// Component
// ============================================================================

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  autoGenerate = false,
  showHomeIcon = true,
  separator,
  maxItems = 5,
  rtl = false,
}) => {
  const location = useLocation()

  // Generate breadcrumbs from route if autoGenerate is true
  const breadcrumbItems = React.useMemo(() => {
    if (items) {
      return items
    }
    
    if (autoGenerate) {
      return generateBreadcrumbsFromPath(location.pathname, rtl)
    }
    
    return []
  }, [items, autoGenerate, location.pathname, rtl])

  // Collapse breadcrumbs if needed
  const displayItems = React.useMemo(() => {
    return collapseBreadcrumbs(breadcrumbItems, maxItems)
  }, [breadcrumbItems, maxItems])

  // Default separator
  const defaultSeparator = rtl ? (
    <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
  ) : (
    <ChevronRight size={16} />
  )

  if (displayItems.length === 0) {
    return null
  }

  return (
    <BreadcrumbsContainer rtl={rtl} aria-label="Breadcrumb">
      <BreadcrumbList>
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1
          const isEllipsis = item.label === '...'
          const displayLabel = rtl && item.labelAr ? item.labelAr : item.label

          return (
            <BreadcrumbItem key={index}>
              {isEllipsis ? (
                <Ellipsis>...</Ellipsis>
              ) : item.path ? (
                <BreadcrumbLink to={item.path}>
                  {index === 0 && showHomeIcon && item.icon}
                  {!(index === 0 && showHomeIcon && item.icon) && displayLabel}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbText active={isLast} aria-current={isLast ? 'page' : undefined}>
                  {item.icon}
                  {displayLabel}
                </BreadcrumbText>
              )}
              
              {!isLast && (
                <Separator aria-hidden="true">
                  {separator || defaultSeparator}
                </Separator>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </BreadcrumbsContainer>
  )
}

export default Breadcrumbs

