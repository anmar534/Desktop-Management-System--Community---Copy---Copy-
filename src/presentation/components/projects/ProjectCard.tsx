/**
 * ProjectCard Component
 *
 * Displays a project summary card with:
 * - Status badge and progress indicator
 * - Financial metrics (budget, contract value)
 * - Timeline information
 * - Quick actions menu
 *
 * Fully responsive with design token integration
 * Supports both grid and list view modes
 */

import React from 'react'
import { MoreVertical, Calendar, DollarSign, MapPin, User } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Progress } from '@/presentation/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu'
import { formatCurrency, formatDateValue } from '@/shared/utils/formatters/formatters'
import type { EnhancedProject } from '@/shared/types/projects'

export interface ProjectCardProps {
  /** Project data to display */
  project: EnhancedProject

  /** View mode: grid (default) or list */
  viewMode?: 'grid' | 'list'

  /** Callback when card is clicked */
  onClick?: (project: EnhancedProject) => void

  /** Callback when edit action is selected */
  onEdit?: (project: EnhancedProject) => void

  /** Callback when delete action is selected */
  onDelete?: (project: EnhancedProject) => void

  /** Callback when duplicate action is selected */
  onDuplicate?: (project: EnhancedProject) => void

  /** Whether to show actions menu */
  showActions?: boolean

  /** Additional CSS classes */
  className?: string
}

/**
 * Status badge color mapping
 */
const statusColors: Record<string, string> = {
  active: 'bg-info/10 text-info border-info/20',
  'in-progress': 'bg-info/10 text-info border-info/20',
  completed: 'bg-success/10 text-success border-success/30',
  finished: 'bg-success/10 text-success border-success/30',
  delayed: 'bg-destructive/10 text-destructive border-destructive/30',
  'on-hold': 'bg-warning/10 text-foreground border-warning/30',
  paused: 'bg-warning/10 text-foreground border-warning/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
  planning: 'bg-muted text-muted-foreground border-border',
  default: 'bg-muted text-muted-foreground border-border',
}

/**
 * Get budget value from various budget formats
 */
const getBudgetValue = (budget: EnhancedProject['budget']): number => {
  if (typeof budget === 'number') return budget
  if (budget && typeof budget === 'object' && 'totalBudget' in budget) {
    return budget.totalBudget ?? 0
  }
  return 0
}

/**
 * ProjectCard Component
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  viewMode = 'grid',
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
  className = '',
}) => {
  const budgetValue = getBudgetValue(project.budget)
  const contractValue = project.contractValue ?? 0
  const progress = project.progress ?? 0
  const statusClass = statusColors[project.status ?? 'default'] ?? statusColors.default

  const handleCardClick = () => {
    onClick?.(project)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(project)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(project)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDuplicate?.(project)
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault()
          onClick(project)
        }
      }}
      className={`
        group
        transition-all duration-200
        hover:border-primary/40 hover:shadow-md
        focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20
        ${viewMode === 'list' ? 'md:flex md:items-center md:gap-6' : ''}
        ${className}
      `}
    >
      <CardHeader className={`space-y-3 ${viewMode === 'list' ? 'md:flex-shrink-0 md:w-1/3' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            {project.client && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{project.client}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusClass}>
              {project.status ?? 'غير محدد'}
            </Badge>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">فتح القائمة</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>تعديل المشروع</DropdownMenuItem>
                  {onDuplicate && (
                    <DropdownMenuItem onClick={handleDuplicate}>نسخ المشروع</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      حذف المشروع
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`space-y-4 ${viewMode === 'list' ? 'md:flex-1' : ''}`}>
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>نسبة الإنجاز</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Project Details Grid */}
        <div
          className={`
          grid gap-4
          ${viewMode === 'list' ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}
        `}
        >
          {/* Timeline */}
          {(project.startDate || project.endDate) && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">الجدول الزمني</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {formatDateValue(project.startDate, { month: 'short', day: 'numeric' }, '—')}
                  {' - '}
                  {formatDateValue(project.endDate, { month: 'short', day: 'numeric' }, '—')}
                </p>
              </div>
            </div>
          )}

          {/* Location */}
          {project.location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">الموقع</p>
                <p
                  className="text-sm font-medium text-foreground truncate"
                  title={project.location}
                >
                  {project.location}
                </p>
              </div>
            </div>
          )}

          {/* Budget */}
          {budgetValue > 0 && (
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">الميزانية</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {formatCurrency(budgetValue, { currency: 'SAR', notation: 'compact' })}
                </p>
              </div>
            </div>
          )}

          {/* Contract Value */}
          {contractValue > 0 && (
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">قيمة العقد</p>
                <p className="text-sm font-medium text-success truncate">
                  {formatCurrency(contractValue, { currency: 'SAR', notation: 'compact' })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Phase Badge (if available) */}
        {project.phase && viewMode === 'grid' && (
          <div className="pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">المرحلة: </span>
            <span className="text-xs font-medium text-foreground">{project.phase}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

ProjectCard.displayName = 'ProjectCard'
