import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { cn } from '@/presentation/components/ui/utils'
import { Building2, User, MapPin, Tag } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { ProjectProgressBar } from './ProjectProgressBar'
import { ProjectFinancialSummary } from './ProjectFinancialSummary'

interface QuickMetric {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative' | 'warning'
}

interface ProjectOverviewDetails {
  name: string
  code?: string
  client?: string
  manager?: string
  location?: string
  status: string
  priority?: string
  progress?: number
  description?: string
}

interface ProjectOverviewDates {
  start?: string
  end?: string
  lastUpdated?: string
}

interface ProjectFinancialSummaryInput {
  budget: number
  spent: number
  currency?: string
  showVariance?: boolean
}

export interface ProjectOverviewPanelProps {
  project: ProjectOverviewDetails
  dates?: ProjectOverviewDates
  tags?: string[]
  metrics?: QuickMetric[]
  financialSummary?: ProjectFinancialSummaryInput
  onViewClient?: () => void
  className?: string
}

const PRIORITY_METADATA: Record<string, { label: string; className: string }> = {
  critical: { label: 'حرجة', className: 'border-error/30 text-error bg-error/10' },
  high: { label: 'عالية', className: 'border-warning/30 text-warning bg-warning/10' },
  medium: { label: 'متوسطة', className: 'border-muted text-muted-foreground bg-muted/20' },
  low: { label: 'منخفضة', className: 'border-muted text-muted-foreground bg-muted/20' },
  default: { label: 'غير محددة', className: 'border-muted text-muted-foreground bg-muted/20' },
}

const METRIC_TONE_CLASSES: Record<NonNullable<QuickMetric['tone']>, string> = {
  default: 'text-foreground',
  positive: 'text-success',
  negative: 'text-error',
  warning: 'text-warning',
}

const normalizePriority = (priority?: string): string => priority?.trim().toLowerCase() ?? ''

const getPriorityMeta = (priority?: string) => {
  const normalized = normalizePriority(priority)
  return PRIORITY_METADATA[normalized] ?? PRIORITY_METADATA.default
}

interface InfoItemProps {
  icon: LucideIcon
  label: string
  value: string
  testId: string
  action?: React.ReactNode
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, testId, action }) => {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground" data-testid={testId}>
          {value}
        </div>
      </div>
      {action ?? null}
    </div>
  )
}

export const ProjectOverviewPanel: React.FC<ProjectOverviewPanelProps> = memo(
  ({ project, dates, tags = [], metrics = [], financialSummary, onViewClient, className = '' }) => {
    const priorityMeta = getPriorityMeta(project.priority)
    const progressValue = Number.isFinite(project.progress)
      ? Math.min(Math.max(project.progress ?? 0, 0), 100)
      : 0
    const layoutClass = financialSummary
      ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'
      : 'lg:grid-cols-1'

    const clientValue = project.client?.trim() || 'غير متوفر'
    const locationValue = project.location?.trim() || 'غير محدد'
    const managerValue = project.manager?.trim() || 'غير معين'

    return (
      <div
        className={cn('grid gap-4', layoutClass, className)}
        data-testid="project-overview-panel"
      >
        <Card data-testid="project-overview-card" className="border-border/70">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle
                  className="text-lg font-semibold text-foreground"
                  data-testid="project-name"
                >
                  {project.name}
                </CardTitle>
                {project.code && (
                  <span className="text-sm text-muted-foreground" data-testid="project-code">
                    {project.code}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {project.priority && (
                  <Badge
                    variant="outline"
                    className={cn('font-medium', priorityMeta.className)}
                    data-testid="project-priority"
                  >
                    {priorityMeta.label}
                  </Badge>
                )}
                <ProjectStatusBadge
                  status={project.status}
                  showIcon
                  subtle
                  className="border-none"
                />
              </div>
            </div>

            <div className="space-y-2" data-testid="project-progress">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>نسبة الإنجاز</span>
                <span
                  className="font-semibold text-foreground"
                  data-testid="project-progress-value"
                >
                  {Math.round(progressValue)}%
                </span>
              </div>
              <ProjectProgressBar progress={progressValue} labelPosition="both" />
            </div>

            {dates && (dates.start || dates.end || dates.lastUpdated) && (
              <div className="grid gap-3 sm:grid-cols-3" data-testid="project-dates">
                {dates.start && (
                  <div className="rounded-md border border-muted bg-muted/20 px-3 py-2">
                    <div className="text-xs text-muted-foreground">بداية المشروع</div>
                    <div className="text-sm font-medium" data-testid="project-start-date">
                      {dates.start}
                    </div>
                  </div>
                )}
                {dates.end && (
                  <div className="rounded-md border border-muted bg-muted/20 px-3 py-2">
                    <div className="text-xs text-muted-foreground">نهاية المشروع</div>
                    <div className="text-sm font-medium" data-testid="project-end-date">
                      {dates.end}
                    </div>
                  </div>
                )}
                {dates.lastUpdated && (
                  <div className="rounded-md border border-muted bg-muted/20 px-3 py-2">
                    <div className="text-xs text-muted-foreground">آخر تحديث</div>
                    <div className="text-sm font-medium" data-testid="project-updated-date">
                      {dates.lastUpdated}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={Building2}
                label="الجهة العميلة"
                value={clientValue}
                testId="project-client"
                action={
                  onViewClient ? (
                    <Button
                      onClick={onViewClient}
                      size="xs"
                      variant="outline"
                      className="ml-auto"
                      data-testid="view-client-button"
                    >
                      فتح العميل
                    </Button>
                  ) : undefined
                }
              />

              <InfoItem
                icon={User}
                label="مدير المشروع"
                value={managerValue}
                testId="project-manager"
              />

              <InfoItem
                icon={MapPin}
                label="الموقع"
                value={locationValue}
                testId="project-location"
              />

              <InfoItem
                icon={Tag}
                label="الأولوية"
                value={priorityMeta.label}
                testId="project-priority-label"
              />
            </div>

            {project.description && (
              <div
                className="rounded-lg border border-dashed border-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground"
                data-testid="project-description"
              >
                {project.description}
              </div>
            )}

            {metrics.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">مؤشرات سريعة</h3>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {metrics.map((metric, index) => (
                    <div
                      key={`${metric.label}-${index}`}
                      className="rounded-md border border-muted bg-muted/10 px-3 py-2"
                    >
                      <dt className="text-xs text-muted-foreground">{metric.label}</dt>
                      <dd
                        className={cn(
                          'text-sm font-semibold',
                          METRIC_TONE_CLASSES[metric.tone ?? 'default'],
                        )}
                        data-testid={`project-metric-${index}`}
                      >
                        {metric.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid="project-tags">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-secondary/20 text-secondary-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {financialSummary && (
          <ProjectFinancialSummary
            budget={financialSummary.budget}
            spent={financialSummary.spent}
            currency={financialSummary.currency}
            showVariance={financialSummary.showVariance}
            className="lg:h-full"
          />
        )}
      </div>
    )
  },
)

ProjectOverviewPanel.displayName = 'ProjectOverviewPanel'

export default ProjectOverviewPanel
