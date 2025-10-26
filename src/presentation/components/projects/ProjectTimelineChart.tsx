import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { cn } from '@/presentation/components/ui/utils'
import { CalendarClock, CalendarPlus, CalendarRange, AlertTriangle } from 'lucide-react'
import { ProjectProgressBar } from './ProjectProgressBar'

interface TimelinePhase {
  id: string
  name: string
  startDate: string
  endDate: string
  progress: number
  status?: 'not-started' | 'in-progress' | 'completed' | 'delayed'
  owner?: string
}

interface TimelineMilestone {
  id: string
  title: string
  date: string
  status: 'completed' | 'in-progress' | 'at-risk' | 'upcoming'
  description?: string
  owner?: string
}

interface TimelineActions {
  onViewCalendar?: () => void
  onAddMilestone?: () => void
}

interface TimelineOverview {
  startDate: string
  endDate: string
  progress: number
  health?: 'on-track' | 'at-risk' | 'delayed'
  criticalPath?: string[]
}

export interface ProjectTimelineChartProps {
  overview: TimelineOverview
  phases: TimelinePhase[]
  milestones?: TimelineMilestone[]
  actions?: TimelineActions
  className?: string
}

const clampProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 100)
}

const PHASE_STATUS_META: Record<
  NonNullable<TimelinePhase['status']>,
  { label: string; className: string }
> = {
  'not-started': {
    label: 'لم يبدأ',
    className: 'border-muted text-muted-foreground',
  },
  'in-progress': {
    label: 'قيد التنفيذ',
    className: 'border-info/40 text-info',
  },
  completed: {
    label: 'اكتمل',
    className: 'border-success/40 text-success',
  },
  delayed: {
    label: 'متأخر',
    className: 'border-error/40 text-error',
  },
}

const MILESTONE_STATUS_META: Record<
  TimelineMilestone['status'],
  { label: string; className: string }
> = {
  completed: {
    label: 'تم الإنجاز',
    className: 'bg-success/10 text-success',
  },
  'in-progress': {
    label: 'قيد التنفيذ',
    className: 'bg-info/10 text-info',
  },
  'at-risk': {
    label: 'معرض للخطر',
    className: 'bg-warning/10 text-warning',
  },
  upcoming: {
    label: 'قادمة',
    className: 'bg-muted text-muted-foreground',
  },
}

const OVERVIEW_HEALTH_META: Record<
  NonNullable<TimelineOverview['health']>,
  { label: string; className: string }
> = {
  'on-track': {
    label: 'ضمن الجدول',
    className: 'text-success',
  },
  'at-risk': {
    label: 'قد يتأخر',
    className: 'text-warning',
  },
  delayed: {
    label: 'متأخر',
    className: 'text-error',
  },
}

export const ProjectTimelineChart: React.FC<ProjectTimelineChartProps> = memo(
  ({ overview, phases, milestones = [], actions, className = '' }) => {
    const overallProgress = clampProgress(overview.progress)
    const overviewHealth = overview.health ? OVERVIEW_HEALTH_META[overview.health] : undefined
    const hasPhases = phases.length > 0
    const hasMilestones = milestones.length > 0

    return (
      <Card className={cn('border-border/70', className)} data-testid="project-timeline-chart">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CalendarClock className="h-5 w-5" />
              الجدول الزمني للمشروع
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              يغطي الفترة من {overview.startDate} حتى {overview.endDate}
            </div>
          </div>
          {(actions?.onViewCalendar || actions?.onAddMilestone) && (
            <div className="flex flex-wrap items-center gap-2" data-testid="timeline-actions">
              {actions?.onViewCalendar && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={actions.onViewCalendar}
                  data-testid="timeline-view-calendar"
                >
                  <CalendarRange className="h-4 w-4" />
                  <span className="ml-1">عرض التقويم</span>
                </Button>
              )}
              {actions?.onAddMilestone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={actions.onAddMilestone}
                  data-testid="timeline-add-milestone"
                >
                  <CalendarPlus className="h-4 w-4" />
                  <span className="ml-1">إضافة معلم</span>
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3" data-testid="timeline-overview">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">التقدم الكلي</span>
              <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            </div>
            <ProjectProgressBar progress={overallProgress} showLabel={false} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{overview.startDate}</span>
              <span>{overview.endDate}</span>
            </div>
            {overviewHealth && (
              <div
                className={cn('text-sm font-semibold', overviewHealth.className)}
                data-testid="timeline-health"
              >
                {overviewHealth.label}
              </div>
            )}
            {overview.criticalPath && overview.criticalPath.length > 0 && (
              <div className="space-y-2" data-testid="timeline-critical-path">
                <div className="text-xs font-semibold text-muted-foreground">المسار الحرج</div>
                <div className="flex flex-wrap gap-2">
                  {overview.criticalPath.map((entry, index) => (
                    <Badge
                      key={`${entry}-${index}`}
                      variant="outline"
                      className="bg-warning/10 text-warning"
                    >
                      {entry}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3" data-testid="timeline-phases">
            <div className="text-sm font-semibold text-muted-foreground">مراحل التنفيذ</div>
            {hasPhases ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {phases.map((phase, index) => {
                  const progress = clampProgress(phase.progress)
                  const statusMeta = PHASE_STATUS_META[phase.status ?? 'in-progress']
                  return (
                    <div
                      key={phase.id}
                      className="rounded-lg border border-muted bg-muted/10 p-4"
                      data-testid={`timeline-phase-${index}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{phase.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {phase.startDate} → {phase.endDate}
                          </div>
                          {phase.owner && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              المسؤول: {phase.owner}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('border', statusMeta.className)}
                          data-testid={`timeline-phase-status-${index}`}
                        >
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>التقدم</span>
                          <span>{progress}%</span>
                        </div>
                        <ProjectProgressBar progress={progress} showLabel={false} height="sm" />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div
                className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground"
                data-testid="timeline-no-phases"
              >
                <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-warning" />
                لم يتم تعريف مراحل تنفيذ للمشروع بعد.
              </div>
            )}
          </div>

          <div className="space-y-3" data-testid="timeline-milestones">
            <div className="text-sm font-semibold text-muted-foreground">المعالِم الرئيسية</div>
            {hasMilestones ? (
              <div className="space-y-2">
                {milestones.map((milestone, index) => {
                  const statusMeta = MILESTONE_STATUS_META[milestone.status]
                  return (
                    <div
                      key={milestone.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-muted bg-muted/5 p-3"
                      data-testid={`timeline-milestone-${index}`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {milestone.title}
                        </div>
                        <div className="text-xs text-muted-foreground">{milestone.date}</div>
                        {milestone.description && (
                          <div
                            className="mt-1 text-xs text-muted-foreground"
                            data-testid={`timeline-milestone-description-${index}`}
                          >
                            {milestone.description}
                          </div>
                        )}
                        {milestone.owner && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            المسؤول: {milestone.owner}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn('px-2 py-1', statusMeta.className)}
                        data-testid={`timeline-milestone-status-${index}`}
                      >
                        {statusMeta.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div
                className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground"
                data-testid="timeline-no-milestones"
              >
                <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-warning" />
                لم يتم تسجيل معالِم زمنية لهذا المشروع حتى الآن.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  },
)

ProjectTimelineChart.displayName = 'ProjectTimelineChart'

export default ProjectTimelineChart
