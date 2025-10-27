/**
 * GanttChart Component
 * مخطط جانت للجدول الزمني
 *
 * Visual timeline representation of project phases and milestones:
 * - SVG-based rendering for flexibility
 * - Horizontal bars for phases
 * - Diamond markers for milestones
 * - Dependency lines between tasks
 * - Interactive tooltips and zoom
 * - Date grid and time scale
 */

import React, { useMemo, useState, useCallback } from 'react'
import { format, differenceInDays, addDays, startOfMonth, endOfMonth } from 'date-fns'
import { ar } from 'date-fns/locale'
import type { ProjectPhase, ProjectMilestone } from '@/types/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Calendar } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface GanttChartProps {
  phases: ProjectPhase[]
  milestones?: ProjectMilestone[]
  projectStartDate: string // Required: project start date to calculate phase positions
  projectEndDate?: string
  onPhaseClick?: (phaseId: string) => void
  onMilestoneClick?: (milestoneId: string) => void
  className?: string
  height?: number
}

interface TimelineItem {
  id: string
  name: string
  type: 'phase' | 'milestone'
  startDate: Date
  endDate: Date
  status?: string
  progress?: number
  color: string
}

export const GanttChart: React.FC<GanttChartProps> = ({
  phases = [],
  milestones = [],
  projectStartDate,
  projectEndDate,
  onPhaseClick,
  onMilestoneClick,
  className,
  height = 500,
}) => {
  const [zoom, setZoom] = useState(1)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Chart dimensions
  const CHART_CONFIG = {
    rowHeight: 40,
    headerHeight: 60,
    leftPanelWidth: 200,
    rightMargin: 20,
    dayWidth: 30 * zoom, // Base day width with zoom
    milestoneSize: 12,
  }

  /**
   * Calculate timeline boundaries
   */
  const timelineBounds = useMemo(() => {
    let minDate: Date = new Date(projectStartDate)
    let maxDate: Date = addDays(minDate, 90) // Default 90 days

    // Calculate phase dates from project start + estimated duration
    let currentDate = minDate
    phases.forEach((phase) => {
      const phaseEnd = addDays(currentDate, phase.estimatedDuration)
      currentDate = phaseEnd
      if (phaseEnd > maxDate) maxDate = phaseEnd
    })

    // Check milestones
    milestones.forEach((milestone) => {
      const date = new Date(milestone.targetDate)
      if (date > maxDate) maxDate = date
    })

    // Use project end date if provided
    if (projectEndDate) {
      const projectEnd = new Date(projectEndDate)
      if (projectEnd > maxDate) maxDate = projectEnd
    }

    // Add padding
    minDate = addDays(minDate, -7)
    maxDate = addDays(maxDate, 7)

    return { minDate, maxDate }
  }, [phases, milestones, projectStartDate, projectEndDate])

  /**
   * Get status color - fallback for phases without status
   */
  const getStatusColor = (status?: string, type: 'phase' | 'milestone' = 'phase') => {
    if (!status) return '#94a3b8' // Default gray

    if (type === 'phase') {
      const colors: Record<string, string> = {
        pending: '#94a3b8',
        in_progress: '#3b82f6',
        completed: '#10b981',
        on_hold: '#f59e0b',
        cancelled: '#ef4444',
      }
      return colors[status] || colors.pending
    } else {
      const colors: Record<string, string> = {
        pending: '#94a3b8',
        in_progress: '#3b82f6',
        completed: '#10b981',
        delayed: '#ef4444',
      }
      return colors[status] || colors.pending
    }
  }

  /**
   * Convert timeline items to chart data
   */
  const timelineItems: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = []
    const projectStart = new Date(projectStartDate)

    // Add phases - calculate dates based on project start + estimated duration
    let currentPhaseStart = projectStart
    phases.forEach((phase) => {
      const phaseEnd = addDays(currentPhaseStart, phase.estimatedDuration)

      items.push({
        id: phase.id,
        name: phase.name,
        type: 'phase',
        startDate: currentPhaseStart,
        endDate: phaseEnd,
        color: getStatusColor(undefined, 'phase'), // No status in ProjectPhase
      })

      currentPhaseStart = phaseEnd // Next phase starts when this ends
    })

    // Add milestones
    milestones.forEach((milestone) => {
      const date = new Date(milestone.targetDate)
      items.push({
        id: milestone.id,
        name: milestone.name,
        type: 'milestone',
        startDate: date,
        endDate: date,
        status: milestone.status,
        progress: milestone.progress,
        color: getStatusColor(milestone.status, 'milestone'),
      })
    })

    return items
  }, [phases, milestones, projectStartDate])

  /**
   * Calculate position on timeline
   */
  const getDatePosition = useCallback(
    (date: Date): number => {
      const daysDiff = differenceInDays(date, timelineBounds.minDate)
      return daysDiff * CHART_CONFIG.dayWidth
    },
    [timelineBounds.minDate, CHART_CONFIG.dayWidth],
  )

  /**
   * Generate month headers
   */
  const monthHeaders = useMemo(() => {
    const headers: Array<{ label: string; x: number; width: number }> = []
    let currentDate = new Date(timelineBounds.minDate)
    const endDate = timelineBounds.maxDate

    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const x = getDatePosition(monthStart)
      const width = getDatePosition(monthEnd) - x

      headers.push({
        label: format(monthStart, 'MMMM yyyy', { locale: ar }),
        x,
        width,
      })

      currentDate = addDays(monthEnd, 1)
    }

    return headers
  }, [timelineBounds, getDatePosition])

  /**
   * Calculate chart width
   */
  const chartWidth = useMemo(() => {
    const timelineDays = differenceInDays(timelineBounds.maxDate, timelineBounds.minDate)
    return (
      CHART_CONFIG.leftPanelWidth + timelineDays * CHART_CONFIG.dayWidth + CHART_CONFIG.rightMargin
    )
  }, [timelineBounds, CHART_CONFIG.leftPanelWidth, CHART_CONFIG.dayWidth, CHART_CONFIG.rightMargin])

  /**
   * Handle zoom
   */
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5))

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <CardTitle>المخطط الزمني (جانت)</CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <svg width={chartWidth} height={height}>
            {/* Month Headers */}
            <g>
              {monthHeaders.map((month, index) => (
                <g key={index}>
                  <rect
                    x={CHART_CONFIG.leftPanelWidth + month.x}
                    y={0}
                    width={month.width}
                    height={CHART_CONFIG.headerHeight}
                    fill={index % 2 === 0 ? '#f8fafc' : '#f1f5f9'}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text
                    x={CHART_CONFIG.leftPanelWidth + month.x + month.width / 2}
                    y={CHART_CONFIG.headerHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-medium fill-foreground"
                  >
                    {month.label}
                  </text>
                </g>
              ))}
            </g>

            {/* Grid Lines */}
            <g>
              {monthHeaders.map((month, index) => (
                <line
                  key={index}
                  x1={CHART_CONFIG.leftPanelWidth + month.x}
                  y1={CHART_CONFIG.headerHeight}
                  x2={CHART_CONFIG.leftPanelWidth + month.x}
                  y2={height}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
              ))}
            </g>

            {/* Timeline Items */}
            {timelineItems.map((item, index) => {
              const y =
                CHART_CONFIG.headerHeight +
                index * CHART_CONFIG.rowHeight +
                CHART_CONFIG.rowHeight / 2

              if (item.type === 'phase') {
                const x = CHART_CONFIG.leftPanelWidth + getDatePosition(item.startDate)
                const width = getDatePosition(item.endDate) - getDatePosition(item.startDate)

                return (
                  <g
                    key={item.id}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => onPhaseClick?.(item.id)}
                    className="cursor-pointer"
                  >
                    {/* Phase Bar Background */}
                    <rect
                      x={x}
                      y={y - 12}
                      width={width}
                      height={24}
                      fill={item.color}
                      opacity={0.2}
                      rx="4"
                    />

                    {/* Phase Progress Bar */}
                    {item.progress !== undefined && (
                      <rect
                        x={x}
                        y={y - 12}
                        width={width * (item.progress / 100)}
                        height={24}
                        fill={item.color}
                        opacity={0.8}
                        rx="4"
                      />
                    )}

                    {/* Phase Border */}
                    <rect
                      x={x}
                      y={y - 12}
                      width={width}
                      height={24}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={hoveredItem === item.id ? '2' : '1'}
                      rx="4"
                    />

                    {/* Phase Name (Left Panel) */}
                    <text
                      x={10}
                      y={y}
                      textAnchor="start"
                      dominantBaseline="middle"
                      className="text-sm font-medium fill-foreground"
                    >
                      {item.name}
                    </text>

                    {/* Progress Label */}
                    {item.progress !== undefined && width > 50 && (
                      <text
                        x={x + width / 2}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-semibold fill-primary-foreground"
                      >
                        {item.progress}%
                      </text>
                    )}
                  </g>
                )
              } else {
                // Milestone
                const x = CHART_CONFIG.leftPanelWidth + getDatePosition(item.startDate)

                return (
                  <g
                    key={item.id}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => onMilestoneClick?.(item.id)}
                    className="cursor-pointer"
                  >
                    {/* Diamond Shape */}
                    <path
                      d={`
                        M ${x} ${y - CHART_CONFIG.milestoneSize}
                        L ${x + CHART_CONFIG.milestoneSize} ${y}
                        L ${x} ${y + CHART_CONFIG.milestoneSize}
                        L ${x - CHART_CONFIG.milestoneSize} ${y}
                        Z
                      `}
                      fill={item.color}
                      stroke={hoveredItem === item.id ? '#000' : item.color}
                      strokeWidth={hoveredItem === item.id ? '2' : '1'}
                    />

                    {/* Milestone Name (Left Panel) */}
                    <text
                      x={10}
                      y={y}
                      textAnchor="start"
                      dominantBaseline="middle"
                      className="text-sm font-medium fill-foreground"
                    >
                      {item.name}
                    </text>

                    {/* Completion Checkmark */}
                    {item.status === 'completed' && (
                      <text
                        x={x}
                        y={y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-primary-foreground"
                      >
                        ✓
                      </text>
                    )}
                  </g>
                )
              }
            })}

            {/* Today Line */}
            {(() => {
              const today = new Date()
              if (today >= timelineBounds.minDate && today <= timelineBounds.maxDate) {
                const x = CHART_CONFIG.leftPanelWidth + getDatePosition(today)
                return (
                  <g>
                    <line
                      x1={x}
                      y1={CHART_CONFIG.headerHeight}
                      x2={x}
                      y2={height}
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <text
                      x={x + 5}
                      y={CHART_CONFIG.headerHeight + 20}
                      className="text-xs font-semibold fill-destructive"
                    >
                      اليوم
                    </text>
                  </g>
                )
              }
              return null
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 p-4 border-t bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-primary rounded" />
            <span className="text-xs text-muted-foreground">جارية</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-success rounded" />
            <span className="text-xs text-muted-foreground">مكتملة</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-muted rounded" />
            <span className="text-xs text-muted-foreground">معلقة</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary transform rotate-45" />
            <span className="text-xs text-muted-foreground">معلم</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default GanttChart
