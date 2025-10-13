'use client'

import type { ComponentType, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  ArrowRight
} from 'lucide-react'

import { Card, CardContent } from '../card'
import { Button } from '../button'
import { Input } from '../input'
import { LastUpdateIndicator } from '../LastUpdateIndicator'
import { cn } from '../utils'

const PAGE_LAYOUT_TONE_STYLES = {
  primary: {
    background: 'bg-gradient-to-r from-primary/95 via-primary to-primary/85',
    icon: 'text-primary-foreground',
    primaryAction: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary'
  },
  secondary: {
    background: 'bg-gradient-to-r from-secondary/95 via-secondary to-secondary/80',
    icon: 'text-secondary-foreground',
    primaryAction: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:ring-secondary'
  },
  accent: {
    background: 'bg-gradient-to-r from-accent/95 via-accent to-accent/80',
    icon: 'text-accent-foreground',
    primaryAction: 'bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent'
  },
  success: {
    background: 'bg-gradient-to-r from-success/95 via-success to-success/80',
    icon: 'text-success-foreground',
    primaryAction: 'bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success'
  },
  info: {
    background: 'bg-gradient-to-r from-info/95 via-info to-info/80',
    icon: 'text-info-foreground',
    primaryAction: 'bg-info text-info-foreground hover:bg-info/90 focus-visible:ring-info'
  },
  warning: {
    background: 'bg-gradient-to-r from-warning/95 via-warning to-warning/80',
    icon: 'text-warning-foreground',
    primaryAction: 'bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning'
  },
  destructive: {
    background: 'bg-gradient-to-r from-destructive/95 via-destructive to-destructive/80',
    icon: 'text-destructive-foreground',
    primaryAction: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive'
  },
  neutral: {
    background: 'bg-muted',
    icon: 'text-muted-foreground',
    primaryAction: 'bg-muted text-foreground hover:bg-muted/90 focus-visible:ring-muted'
  }
} as const

type PageLayoutTone = keyof typeof PAGE_LAYOUT_TONE_STYLES

type IconComponent = ComponentType<{ className?: string }>

interface QuickStat {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color: string
  bgColor: string
}

interface QuickAction {
  label: string
  icon: IconComponent
  onClick: () => void
  variant?: 'default' | 'outline'
  primary?: boolean
  className?: string
}

interface PageLayoutProps {
  tone?: PageLayoutTone
  title: string
  description: string
  icon: IconComponent
  quickStats: QuickStat[]
  quickActions: QuickAction[]
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  showFilters?: boolean
  onFilterClick?: () => void
  children: ReactNode
  tabs?: ReactNode
  headerExtra?: ReactNode
  sidebar?: ReactNode
  showSearch?: boolean
  showStats?: boolean
  hideHeader?: boolean
  showLastUpdate?: boolean
  showBackButton?: boolean
  onBack?: () => void
  backLabel?: string
}

export function PageLayout({
  tone = 'primary',
  title,
  description,
  icon: Icon,
  quickStats,
  quickActions,
  searchPlaceholder = 'البحث...',
  searchValue = '',
  onSearchChange,
  showFilters = true,
  onFilterClick,
  children,
  tabs,
  headerExtra,
  sidebar,
  showSearch = true,
  showStats = true,
  hideHeader = false,
  showLastUpdate = true,
  showBackButton,
  onBack,
  backLabel = 'العودة'
}: PageLayoutProps) {
  const toneStyles = PAGE_LAYOUT_TONE_STYLES[tone] ?? PAGE_LAYOUT_TONE_STYLES.primary
  const prefersReducedMotion = useReducedMotion()
  const shouldShowBackButton = typeof onBack === 'function' && (showBackButton ?? true)

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="p-6 space-y-6">
        {!hideHeader && (
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: -20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {shouldShowBackButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onBack}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span className="hidden sm:inline">{backLabel}</span>
                    </Button>
                  )}

                  <div className={cn('p-3 rounded-xl shadow-lg', toneStyles.background)}>
                    <Icon className={cn('h-6 w-6', toneStyles.icon)} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                    <p className="text-muted-foreground mt-1">{description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {quickActions.map((action, index) => {
                    const ActionIcon = action.icon
                    const isPrimaryAction = action.primary ?? index === 0
                    const resolvedVariant = action.variant ?? (isPrimaryAction ? 'default' : 'outline')
                    return (
                      <motion.div
                        key={index}
                        initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
                        animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                        transition={prefersReducedMotion ? undefined : { delay: index * 0.1 }}
                      >
                        <Button
                          variant={resolvedVariant}
                          onClick={action.onClick}
                          className={cn(
                            'flex items-center gap-2',
                            isPrimaryAction ? toneStyles.primaryAction : undefined,
                            action.className
                          )}
                        >
                          <ActionIcon className="h-4 w-4 ml-2" />
                          <span className="hidden sm:inline">{action.label}</span>
                        </Button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {headerExtra && <div className="mt-4">{headerExtra}</div>}

              {showLastUpdate && (
                <div className="mt-4 pt-4 border-t border-border">
                  <LastUpdateIndicator compact={false} showRefreshButton />
                </div>
              )}
            </div>

            {showStats && quickStats.length > 0 && (
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {quickStats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={prefersReducedMotion ? undefined : { delay: index * 0.05 }}
                      className={`p-4 ${stat.bgColor} rounded-lg border border-border/20 hover:border-border/40 transition-all cursor-pointer group`}
                    >
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${stat.color} group-hover:scale-105 transition-transform`}>
                          {stat.value}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                        {stat.trend && stat.trendValue && (
                          <div
                            className={`flex items-center justify-center gap-1 mt-2 text-xs ${
                              stat.trend === 'up'
                                ? 'text-success'
                                : stat.trend === 'down'
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <TrendingUp
                              className={`h-3 w-3 ${
                                stat.trend === 'down'
                                  ? 'rotate-180'
                                  : stat.trend === 'stable'
                                  ? 'rotate-90'
                                  : ''
                              }`}
                            />
                            <span>{stat.trendValue}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {showSearch && (
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
            transition={prefersReducedMotion ? undefined : { delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pr-10"
                />
              </div>
              {showFilters && (
                <Button variant="outline" onClick={onFilterClick}>
                  <Filter className="h-4 w-4 ml-2" />
                  <span className="hidden sm:inline">فلترة</span>
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {tabs && (
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? undefined : { delay: 0.3 }}
          >
            {tabs}
          </motion.div>
        )}

        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? undefined : { delay: 0.4 }}
          className={sidebar ? 'grid grid-cols-1 lg:grid-cols-4 gap-6' : ''}
        >
          <div className={sidebar ? 'lg:col-span-3' : 'w-full'}>{children}</div>
          {sidebar && <div className="lg:col-span-1">{sidebar}</div>}
        </motion.div>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon: IconComponent
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.div
      className="text-center py-12"
      initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? undefined : { delay: 0.2 }}
    >
      <Icon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 ml-2" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

interface DetailStatsProps {
  stats: {
    label: string
    value: string | number
    subValue?: string
    icon: IconComponent
    color: string
    bgColor: string
    trend?: 'up' | 'down' | 'stable'
    trendValue?: string
  }[]
}

export function DetailStats({ stats }: DetailStatsProps) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon
        return (
          <motion.div
            key={index}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? undefined : { delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <StatIcon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.trend && stat.trendValue && (
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        stat.trend === 'up'
                          ? 'text-success'
                          : stat.trend === 'down'
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <TrendingUp
                        className={`h-3 w-3 ${
                          stat.trend === 'down'
                            ? 'rotate-180'
                            : stat.trend === 'stable'
                            ? 'rotate-90'
                            : ''
                        }`}
                      />
                      <span>{stat.trendValue}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  {stat.subValue && (
                    <div className="text-xs text-muted-foreground/80 mt-1">{stat.subValue}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

interface DetailCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: IconComponent
  color: string
  bgColor: string
  trend?: {
    value: string
    direction: 'up' | 'down' | 'stable'
  }
  onClick?: () => void
}

export function DetailCard({ title, value, subtitle, icon: Icon, color, bgColor, trend, onClick }: DetailCardProps) {
  return (
    <Card
      className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        onClick ? 'hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 ${bgColor} rounded-lg group-hover:scale-110 transition-transform`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm ${
                trend.direction === 'up'
                  ? 'text-success'
                  : trend.direction === 'down'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              <TrendingUp
                className={`h-3 w-3 ${
                  trend.direction === 'down'
                    ? 'rotate-180'
                    : trend.direction === 'stable'
                    ? 'rotate-90'
                    : ''
                }`}
              />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{value}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground/80 mt-1">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

export type { PageLayoutTone }
