import { memo } from 'react'
import { StatusBadge } from '@/presentation/components/ui/status-badge'
import {
  ListChecks,
  PlayCircle,
  CheckCircle,
  PauseCircle,
  BarChart3,
  DollarSign,
} from 'lucide-react'

/**
 * مكون عرض الـ Badges في رأس صفحة المشاريع
 *
 * ⚠️ CRITICAL: يجب الحفاظ على التصميم الدقيق:
 * - shadow-none على جميع الـ badges
 * - size="sm" على جميع الـ badges
 * - الألوان الشرطية حسب القيم
 *
 * هذا المكون تم استخراجه في Phase 3 لتجنب فقدان التصميم
 */

interface ProjectStats {
  total: number
  active: number
  completed: number
  paused: number
  planning: number
  averageProgress: number
}

interface ProjectHeaderBadgesProps {
  stats: ProjectStats
  totalNetProfit: number
  formatCurrencyValue: (value: number, options?: { notation?: 'standard' | 'compact' }) => string
}

const ProjectHeaderBadgesComponent = function ProjectHeaderBadges({
  stats,
  totalNetProfit,
  formatCurrencyValue,
}: ProjectHeaderBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
      <StatusBadge
        status="default"
        label={`الكل ${stats.total}`}
        icon={ListChecks}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={stats.active > 0 ? 'info' : 'default'}
        label={`نشطة ${stats.active}`}
        icon={PlayCircle}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={stats.completed > 0 ? 'success' : 'default'}
        label={`مكتملة ${stats.completed}`}
        icon={CheckCircle}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={stats.paused > 0 ? 'warning' : 'default'}
        label={`متوقفة ${stats.paused}`}
        icon={PauseCircle}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="info"
        label={`معدل الإنجاز ${stats.averageProgress}%`}
        icon={BarChart3}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={totalNetProfit >= 0 ? 'success' : 'warning'}
        label={`صافي الربح ${formatCurrencyValue(totalNetProfit, { notation: 'compact' })}`}
        icon={DollarSign}
        size="sm"
        className="shadow-none"
      />
    </div>
  )
}

// Memoize to prevent unnecessary re-renders when stats don't change
export const ProjectHeaderBadges = memo(ProjectHeaderBadgesComponent)
