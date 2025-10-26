/**
 * Quick Actions Bar Component
 *
 * شريط الإجراءات السريعة لشركات المقاولات
 * يوفر وصول سريع للمهام الأكثر استخداماً
 *
 * @version 1.0.0
 * @date 2024-01-15
 */

import React from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Separator } from '@/presentation/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/presentation/components/ui/tooltip'
import {
  FileText,
  Calculator,
  Calendar,
  Users,
  Truck,
  AlertTriangle,
  DollarSign,
  Building,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/presentation/components/ui/utils'
import type { LucideIcon } from 'lucide-react'

export interface QuickAction {
  id: string
  label: string
  icon: LucideIcon
  onClick: () => void
  badge?: number
  color?: string
  shortcut?: string
  category: 'projects' | 'tenders' | 'financial' | 'resources' | 'reports' | 'settings'
  priority: 'high' | 'medium' | 'low'
  enabled?: boolean
  description?: string
}

export interface QuickActionsBarProps {
  actions: QuickAction[]
  maxVisible?: number
  layout?: 'horizontal' | 'grid'
  showLabels?: boolean
  showCategories?: boolean
  enableKeyboardShortcuts?: boolean
  className?: string
}

export const defaultQuickActions: QuickAction[] = [
  {
    id: 'new-project',
    label: 'مشروع جديد',
    icon: Building,
    onClick: () => console.log('إنشاء مشروع جديد'),
    category: 'projects',
    priority: 'high',
    shortcut: 'Ctrl+N',
    description: 'إنشاء مشروع جديد',
    color: '#3b82f6',
  },
  {
    id: 'new-tender',
    label: 'منافسة جديدة',
    icon: FileText,
    onClick: () => console.log('تقديم على منافسة'),
    category: 'tenders',
    priority: 'high',
    shortcut: 'Ctrl+T',
    description: 'تقديم على منافسة جديدة',
    color: '#8b5cf6',
  },
  {
    id: 'calculate-cost',
    label: 'حساب التكلفة',
    icon: Calculator,
    onClick: () => console.log('فتح حاسبة التكلفة'),
    category: 'financial',
    priority: 'high',
    shortcut: 'Ctrl+C',
    description: 'حساب تكلفة مشروع',
    color: '#10b981',
  },
  {
    id: 'schedule-meeting',
    label: 'جدولة اجتماع',
    icon: Calendar,
    onClick: () => console.log('جدولة اجتماع'),
    category: 'projects',
    priority: 'medium',
    description: 'جدولة اجتماع أو زيارة موقع',
    color: '#f59e0b',
  },
  {
    id: 'team-management',
    label: 'إدارة الفريق',
    icon: Users,
    onClick: () => console.log('إدارة الفريق'),
    badge: 3,
    category: 'resources',
    priority: 'medium',
    description: 'إدارة الفرق والموارد البشرية',
    color: '#ef4444',
  },
  {
    id: 'equipment-booking',
    label: 'حجز معدات',
    icon: Truck,
    onClick: () => console.log('حجز معدات'),
    category: 'resources',
    priority: 'medium',
    description: 'حجز وإدارة المعدات',
    color: '#6366f1',
  },
  {
    id: 'safety-report',
    label: 'تقرير سلامة',
    icon: AlertTriangle,
    onClick: () => console.log('تقرير سلامة'),
    badge: 1,
    category: 'reports',
    priority: 'high',
    description: 'تسجيل تقرير سلامة',
    color: '#dc2626',
  },
  {
    id: 'financial-report',
    label: 'تقرير مالي',
    icon: DollarSign,
    onClick: () => console.log('تقرير مالي'),
    category: 'financial',
    priority: 'medium',
    description: 'إنشاء تقرير مالي',
    color: '#059669',
  },
]

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  actions = defaultQuickActions,
  maxVisible = 8,
  layout = 'horizontal',
  showLabels = true,
  showCategories = false,
  enableKeyboardShortcuts = true,
  className,
}) => {
  const sortedActions = React.useMemo(() => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return [...actions]
      .filter((action) => action.enabled !== false)
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  }, [actions])

  const visibleActions = sortedActions.slice(0, maxVisible)
  const hiddenActions = sortedActions.slice(maxVisible)

  React.useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = actions.find(
        (a) =>
          a.shortcut &&
          a.shortcut.toLowerCase() === `${event.ctrlKey ? 'ctrl+' : ''}${event.key.toLowerCase()}`,
      )

      if (action && action.enabled !== false) {
        event.preventDefault()
        action.onClick()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [actions, enableKeyboardShortcuts])

  const groupedActions = React.useMemo(() => {
    if (!showCategories) return { all: visibleActions }

    return visibleActions.reduce(
      (groups, action) => {
        const category = action.category
        if (!groups[category]) groups[category] = []
        groups[category].push(action)
        return groups
      },
      {} as Record<string, QuickAction[]>,
    )
  }, [visibleActions, showCategories])

  const categoryNames = {
    projects: 'المشاريع',
    tenders: 'المنافسات',
    financial: 'المالية',
    resources: 'الموارد',
    reports: 'التقارير',
    settings: 'الإعدادات',
  }

  const renderActionButton = (action: QuickAction) => (
    <TooltipProvider key={action.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={showLabels ? 'default' : 'icon'}
            onClick={action.onClick}
            className={cn(
              'relative h-auto flex-col gap-1 p-3 hover:scale-105 transition-all duration-200',
              !showLabels && 'w-12 h-12',
              showLabels && 'min-w-[100px]',
            )}
            style={
              action.color
                ? ({
                    '--action-color': action.color,
                    borderColor: action.color + '20',
                  } as React.CSSProperties)
                : undefined
            }
          >
            <div className="relative">
              <action.icon
                className="h-5 w-5"
                style={action.color ? { color: action.color } : undefined}
              />
              {action.badge && action.badge > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {action.badge > 99 ? '99+' : action.badge}
                </Badge>
              )}
            </div>
            {showLabels && (
              <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{action.label}</p>
            {action.description && (
              <p className="text-xs text-muted-foreground">{action.description}</p>
            )}
            {action.shortcut && (
              <p className="text-xs text-muted-foreground">اختصار: {action.shortcut}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">الإجراءات السريعة</h3>
            {hiddenActions.length > 0 && (
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4 ml-1" />
                المزيد ({hiddenActions.length})
              </Button>
            )}
          </div>

          {showCategories ? (
            <div className="space-y-4">
              {Object.entries(groupedActions).map(([category, categoryActions]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {categoryNames[category as keyof typeof categoryNames] || category}
                  </h4>
                  <div
                    className={cn(
                      'flex gap-2',
                      layout === 'grid'
                        ? 'grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                        : 'flex-wrap',
                    )}
                  >
                    {categoryActions.map(renderActionButton)}
                  </div>
                  {category !==
                    Object.keys(groupedActions)[Object.keys(groupedActions).length - 1] && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'flex gap-2',
                layout === 'grid' ? 'grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' : 'flex-wrap',
              )}
            >
              {visibleActions.map(renderActionButton)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickActionsBar
