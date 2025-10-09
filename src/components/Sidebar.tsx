'use client'

import { useMemo, useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react'
import { useFinancialState, useNavigation } from '@/application/context'
import type { Tender } from '@/data/centralData'
import type { AppSection } from '@/application/navigation/navigationSchema'

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

type SidebarBadgeVariant = 'muted' | 'highlight' | 'alert' | 'notice' | 'successAlt' | 'infoAlt' | 'default'

interface SidebarSectionStyle {
  color: string
  badge: SidebarBadgeVariant
  iconBg: string
}

const SECTION_STYLES: Partial<Record<AppSection, SidebarSectionStyle>> = {
  dashboard: { color: 'text-primary', badge: 'highlight', iconBg: 'bg-primary/10' },
  tenders: { color: 'text-warning', badge: 'notice', iconBg: 'bg-warning/10' },
  projects: { color: 'text-secondary', badge: 'infoAlt', iconBg: 'bg-secondary/10' },
  financial: { color: 'text-success', badge: 'successAlt', iconBg: 'bg-success/10' },
  development: { color: 'text-accent-foreground', badge: 'infoAlt', iconBg: 'bg-accent/10' },
  reports: { color: 'text-destructive', badge: 'alert', iconBg: 'bg-destructive/10' },
  settings: { color: 'text-muted-foreground', badge: 'muted', iconBg: 'bg-muted/20' },
  'administrative-expenses': { color: 'text-accent-foreground', badge: 'infoAlt', iconBg: 'bg-accent/10' },
  invoices: { color: 'text-info', badge: 'infoAlt', iconBg: 'bg-info/10' },
  'bank-accounts': { color: 'text-success', badge: 'successAlt', iconBg: 'bg-success/10' },
  budgets: { color: 'text-primary', badge: 'highlight', iconBg: 'bg-primary/10' },
  'financial-reports': { color: 'text-info', badge: 'infoAlt', iconBg: 'bg-info/10' }
}

const DEFAULT_SECTION_STYLE: SidebarSectionStyle = {
  color: 'text-muted-foreground',
  badge: 'muted',
  iconBg: 'bg-muted/20'
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { sidebarNodes, activeSection, navigate } = useNavigation()

  const { projects: projectsState, tenders: tendersState, financial, clients: clientsState } = useFinancialState()
  const { projects } = projectsState
  const { tenders } = tendersState
  const { financialData } = financial
  const { clients } = clientsState

  const delayedProjects = useMemo(
    () => projects.filter(project => project.status === 'delayed').length,
    [projects]
  )

  const activeProjects = useMemo(
    () => projects.filter(project => project.status === 'active').length,
    [projects]
  )

  const activeTenders = useMemo(
    () => tenders.filter(tender => ['new', 'under_action', 'ready_to_submit'].includes(tender.status)).length,
    [tenders]
  )

  const urgentTenders = useMemo(() => {
    const urgentStatuses = new Set(['new', 'under_action', 'ready_to_submit'])
    const now = Date.now()

    return tenders.filter(tender => {
      if (!tender) return false
      if (!urgentStatuses.has(tender.status)) return false

      const daysLeft = resolveDaysLeft(tender, now)
      return typeof daysLeft === 'number' && daysLeft <= 7 && daysLeft >= 0
    }).length
  }, [tenders])

  const financialAlerts = financialData.cashFlow.current < Math.max(financialData.cashFlow.outgoing, 1) ? 1 : 0

  const totalProjects = projects.length
  const totalClients = clients.length
  const totalTenders = tenders.length

  const sectionNotifications = useMemo<Partial<Record<AppSection, number>>>(() => ({
    projects: delayedProjects,
    tenders: urgentTenders,
    financial: financialAlerts,
    reports: 0,
    settings: 0,
    development: 0,
    dashboard: 0,
    invoices: 0,
    budgets: 0,
    'bank-accounts': 0,
    'financial-reports': 0,
    'administrative-expenses': 0
  }), [delayedProjects, urgentTenders, financialAlerts])

  const totalNotifications = useMemo(
    () => Object.values(sectionNotifications).reduce((sum, count) => sum + (count ?? 0), 0),
    [sectionNotifications]
  )

  const systemHealthStatusMessage = useMemo(() => {
    if (totalNotifications === 0) return 'جميع الأنظمة تعمل بكفاءة'
    if (totalNotifications < 10) return 'النظام يعمل بكفاءة جيدة'
    return 'يحتاج متابعة'
  }, [totalNotifications])

  const systemHealthBarColorClass = useMemo(() => {
    if (totalNotifications === 0) return 'bg-success'
    if (totalNotifications < 10) return 'bg-primary'
    if (totalNotifications < 20) return 'bg-warning'
    return 'bg-destructive'
  }, [totalNotifications])

  const systemHealthTextColorClass = useMemo(() => {
    if (totalNotifications === 0) return 'text-success'
    if (totalNotifications < 10) return 'text-primary'
    if (totalNotifications < 20) return 'text-warning'
    return 'text-destructive'
  }, [totalNotifications])

  const systemHealthStatusLabel = useMemo(() => {
    if (totalNotifications === 0) return 'مستقر'
    if (totalNotifications < 10) return 'مراقب'
    if (totalNotifications < 20) return 'تحذير'
    return 'عاجل'
  }, [totalNotifications])

  const systemHealthWidthClass = useMemo(() => {
    if (totalNotifications === 0) return 'w-full'
    if (totalNotifications <= 5) return 'w-5/6'
    if (totalNotifications <= 10) return 'w-2/3'
    if (totalNotifications <= 20) return 'w-1/2'
    return 'w-1/4'
  }, [totalNotifications])

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} h-full bg-card border-l border-border flex flex-col transition-all duration-300 ease-in-out`}>
      
      {/* هيدر الشريط الجانبي */}
  <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-lg">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">المقاولات</h2>
              <p className="text-xs text-muted-foreground">نظام إدارة متكامل</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 h-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* إحصائيات سريعة محدثة من البيانات المركزية */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="bg-card border border-border/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">النشاط اليوم</span>
              </div>
              <Badge variant={
                totalNotifications > 20 ? 'alert' :
                totalNotifications > 10 ? 'notice' : 'infoAlt'
              }>
                {totalNotifications}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold text-success">{activeProjects}</div>
                <div className="text-muted-foreground">مشاريع نشطة</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-warning">{activeTenders}</div>
                <div className="text-muted-foreground">منافسات نشطة</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* قائمة الروابط */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarNodes.map(node => {
          const isActive = activeSection === node.id
          const Icon = node.icon
          const style = SECTION_STYLES[node.id] ?? DEFAULT_SECTION_STYLE
          const notificationsCount = sectionNotifications[node.id] ?? 0
          
          return (
            <Button
              key={node.id}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={`w-full ${isCollapsed ? 'px-2 justify-center' : 'justify-start'} h-11 transition-all duration-200`}
              onClick={() => navigate(node.id)}
              title={node.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-1.5 rounded-md transition-colors ${isActive ? style.iconBg : 'bg-muted/20'}`}>
                  <Icon className={`h-4 w-4 transition-colors ${isActive ? style.color : 'text-muted-foreground'}`} />
                </div>
                
                {!isCollapsed && (
                  <>
                    <span className={`flex-1 text-right text-sm ${
                      isActive ? `${style.color} font-semibold` : 'text-muted-foreground'
                    }`}>
                      {node.label}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {notificationsCount > 0 && (
                        <Badge 
                          variant={
                            notificationsCount > 15 ? 'alert' : 
                            notificationsCount > 5 ? 'notice' : style.badge
                          }
                          className="text-xs px-1.5 py-0.5 h-auto"
                        >
                          {notificationsCount > 99 ? '99+' : notificationsCount}
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

      {/* أسفل الشريط الجانبي - محدث بالبيانات الفعلية */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="bg-card border border-border/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-foreground">كفاءة النظام</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {systemHealthStatusMessage}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${systemHealthBarColorClass} ${systemHealthWidthClass}`}
                ></div>
              </div>
              <span className={`text-xs font-medium ${systemHealthTextColorClass}`}>
                {systemHealthStatusLabel}
              </span>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              {totalProjects} مشاريع • {totalClients} عملاء • {totalTenders} منافسات
            </p>
          </div>
        </div>
      )}
    </div>
  )
}