/**
 * @fileoverview Tender Performance Cards Header
 * @module components/TendersHeaderSection
 *
 * Displays performance cards and statistics in the header area
 */

import React from 'react'
import {
  ListChecks,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Trophy,
} from 'lucide-react'
import { StatusBadge } from '@/presentation/components/ui/status-badge'
import { TenderPerformanceCards } from '@/presentation/components/tenders'
import { useTenders } from '@/application/hooks/useTenders'

/**
 * Header section component with metadata and performance cards
 * Uses unified system (useTenders hook) - no props needed
 */
export const TendersHeaderSection: React.FC = () => {
  const { stats } = useTenders()

  // Safe win rate calculation with fallback for NaN/undefined
  const safeWinRate = Number.isFinite(stats.winRate) ? stats.winRate : null

  // Dynamic status based on win rate
  const getWinRateStatus = (rate: number | null): 'success' | 'info' | 'warning' => {
    if (rate === null) return 'warning'
    if (rate >= 70) return 'success'
    if (rate >= 40) return 'info'
    return 'warning'
  }

  const winRateStatus = getWinRateStatus(safeWinRate)
  const winRateDisplay = safeWinRate !== null ? `${safeWinRate.toFixed(1)}%` : '-'

  return (
    <div className="space-y-4">
      {/* Metadata Badges */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
          <StatusBadge
            status="default"
            label={`الكل ${stats.totalTenders}`}
            icon={ListChecks}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={stats.urgentTenders > 0 ? 'warning' : 'default'}
            label={`عاجل ${stats.urgentTenders}`}
            icon={AlertTriangle}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={stats.newTenders > 0 ? 'info' : 'default'}
            label={`جديد ${stats.newTenders}`}
            icon={FileText}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={stats.underActionTenders > 0 ? 'info' : 'default'}
            label={`تحت الإجراء ${stats.underActionTenders}`}
            icon={Clock}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={stats.submittedTenders > 0 ? 'warning' : 'default'}
            label={`بانتظار النتائج ${stats.submittedTenders}`}
            icon={Calendar}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={stats.wonTenders > 0 ? 'success' : 'default'}
            label={`فائز ${stats.wonTenders}`}
            icon={CheckCircle}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={stats.lostTenders > 0 ? 'error' : 'default'}
            label={`خاسر ${stats.lostTenders}`}
            icon={XCircle}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={winRateStatus}
            label={`معدل الفوز ${winRateDisplay}`}
            icon={Trophy}
            size="sm"
            className="shadow-none"
          />
        </div>
      </div>

      {/* Performance Cards */}
      <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
        <TenderPerformanceCards />
      </div>
    </div>
  )
}
