import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '../button'
import { Badge } from '../badge'
import { useFinancialState, useNavigation } from '@/application/context'
import type { Tender } from '@/data/centralData'
import type { AppSection } from '@/application/navigation/navigationSchema'
import { formatInteger } from '@/shared/utils/formatters/formatters'

const MS_PER_DAY = 1000 * 60 * 60 * 24

const resolveDaysLeft = (tender: Tender, now: number): number | null => {
  if (typeof tender.daysLeft === 'number' && Number.isFinite(tender.daysLeft)) {
    return tender.daysLeft
  }

  if (!tender.deadline) {
    return null
  }

  const deadlineTime = new Date(tender.deadline).getTime()
  if (!Number.isFinite(deadlineTime)) {
    return null
  }

  return Math.ceil((deadlineTime - now) / MS_PER_DAY)
}

type SidebarBadgeVariant =
  | 'muted'
  | 'highlight'
  | 'alert'
  | 'notice'
  | 'successAlt'
  | 'infoAlt'
  | 'default'

interface SidebarSectionStyle {
  badge: SidebarBadgeVariant
}

const SECTION_STYLES: Partial<Record<AppSection, SidebarSectionStyle>> = {
  dashboard: { badge: 'highlight' },
  tenders: { badge: 'notice' },
  projects: { badge: 'infoAlt' },
  financial: { badge: 'successAlt' },
  development: { badge: 'infoAlt' },
  reports: { badge: 'alert' },
  settings: { badge: 'muted' },
  'administrative-expenses': { badge: 'infoAlt' },
}

const DEFAULT_SECTION_STYLE: SidebarSectionStyle = {
  badge: 'muted',
}

const ACTIVE_ICON_BG_CLASS = 'bg-primary/20'
const ACTIVE_ICON_COLOR_CLASS = 'text-primary'
const ACTIVE_LABEL_CLASS = 'text-primary'

const FINANCIAL_CHILD_SECTIONS = new Set<AppSection>([
  'invoices',
  'budgets',
  'bank-accounts',
  'financial-reports',
])

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { sidebarNodes, activeSection, navigate } = useNavigation()
  const resolvedActiveSection = FINANCIAL_CHILD_SECTIONS.has(activeSection)
    ? 'financial'
    : activeSection

  const { projects: projectsState, tenders: tendersState, financial } = useFinancialState()
  const { projects } = projectsState
  const { tenders } = tendersState
  const { financialData } = financial

  const delayedProjects = useMemo(
    () => projects.filter((project) => project.status === 'delayed').length,
    [projects],
  )

  const urgentTenders = useMemo(() => {
    const urgentStatuses = new Set(['new', 'under_action', 'ready_to_submit'])
    const now = Date.now()

    return tenders.filter((tender) => {
      if (!tender) return false
      if (!urgentStatuses.has(tender.status)) return false

      const daysLeft = resolveDaysLeft(tender, now)
      return typeof daysLeft === 'number' && daysLeft <= 7 && daysLeft >= 0
    }).length
  }, [tenders])

  const financialAlerts =
    financialData.cashFlow.current < Math.max(financialData.cashFlow.outgoing, 1) ? 1 : 0

  const sectionNotifications = useMemo<Partial<Record<AppSection, number>>>(
    () => ({
      projects: delayedProjects,
      tenders: urgentTenders,
      financial: financialAlerts,
      reports: 0,
      settings: 0,
      development: 0,
      dashboard: 0,
      'administrative-expenses': 0,
    }),
    [delayedProjects, urgentTenders, financialAlerts],
  )

  const toggleLabel = isCollapsed ? 'توسيع الشريط الجانبي' : 'تصغير الشريط الجانبي'

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-72'} max-h-[calc(100vh-10rem)] transition-all duration-300 ease-in-out`}
    >
      <div className="relative h-full">
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl border border-border/25 bg-gradient-to-b from-background/50 via-background/28 to-background/50 shadow-xl backdrop-blur-xl"
          aria-hidden
        />
        <div className="relative flex h-full flex-col">
          <div className="border-b border-border/20 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden />
                  <span>مسارات العمل</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`h-9 rounded-xl border border-border/25 bg-background/45 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 ${
                  isCollapsed ? 'w-9 justify-center px-0' : 'gap-2 px-3'
                }`}
                aria-label={toggleLabel}
                title={toggleLabel}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">تصغير</span>
                  </>
                )}
              </Button>
            </div>

            {/* عناصر المعاينة المؤقتة حُذفت بعد الانتقال للتصميم النهائي */}
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
            {sidebarNodes.map((node) => {
              const isActive = resolvedActiveSection === node.id
              const Icon = node.icon
              const style = SECTION_STYLES[node.id] ?? DEFAULT_SECTION_STYLE
              const notificationsCount = sectionNotifications[node.id] ?? 0

              return (
                <Button
                  key={node.id}
                  variant="ghost"
                  size="sm"
                  className={`group relative w-full ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4'} h-12 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/12 text-primary shadow-md ring-1 ring-primary/25 hover:bg-primary/16'
                      : 'hover:bg-muted/15'
                  }`}
                  onClick={() => navigate(node.id)}
                  title={node.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {!isCollapsed && (
                    <span
                      className={`absolute inset-y-3 right-2 w-1 rounded-full transition-colors ${
                        isActive
                          ? 'bg-primary'
                          : 'bg-transparent group-hover:bg-muted-foreground/60'
                      }`}
                      aria-hidden
                    />
                  )}
                  {isCollapsed && notificationsCount > 0 && (
                    <span
                      className={`absolute top-2 left-2 h-2 w-2 rounded-full ${
                        notificationsCount > 15
                          ? 'bg-destructive'
                          : notificationsCount > 5
                            ? 'bg-warning'
                            : 'bg-primary'
                      }`}
                      aria-hidden
                    />
                  )}
                  <div className="flex w-full items-center gap-3">
                    <div
                      className={`rounded-xl p-2 transition-colors ${isActive ? ACTIVE_ICON_BG_CLASS : 'bg-muted/15'}`}
                    >
                      <Icon
                        className={`h-4 w-4 transition-colors ${isActive ? ACTIVE_ICON_COLOR_CLASS : 'text-muted-foreground'}`}
                      />
                    </div>

                    {!isCollapsed && (
                      <>
                        <span
                          className={`flex-1 text-right text-sm ${
                            isActive
                              ? `${ACTIVE_LABEL_CLASS} font-semibold`
                              : 'text-muted-foreground'
                          }`}
                        >
                          {node.label}
                        </span>

                        <div className="flex items-center gap-2">
                          {notificationsCount > 0 && (
                            <Badge
                              variant={
                                notificationsCount > 15
                                  ? 'alert'
                                  : notificationsCount > 5
                                    ? 'notice'
                                    : style.badge
                              }
                              className="h-auto px-1.5 py-0.5 text-xs"
                            >
                              {notificationsCount > 99
                                ? `${formatInteger(99)}+`
                                : formatInteger(notificationsCount)}
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Button>
              )
            })}
          </nav>

          {!isCollapsed && (
            <div className="mt-auto px-3 pb-4">
              <div className="rounded-2xl border border-border/20 bg-background/40 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold text-muted-foreground">لقطة سريعة</p>
                <div className="mt-3 space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>المشاريع المتأخرة</span>
                    <span
                      className={`rounded-full bg-warning/15 px-2 py-0.5 font-semibold ltr-numbers ${delayedProjects > 0 ? 'text-warning' : 'text-muted-foreground'}`}
                    >
                      {formatInteger(delayedProjects)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>المنافسات العاجلة</span>
                    <span
                      className={`rounded-full bg-destructive/15 px-2 py-0.5 font-semibold ltr-numbers ${urgentTenders > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      {formatInteger(urgentTenders)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>تنبيهات السيولة</span>
                    <span
                      className={`rounded-full bg-primary/12 px-2 py-0.5 font-semibold ltr-numbers ${financialAlerts > 0 ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {formatInteger(financialAlerts)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

