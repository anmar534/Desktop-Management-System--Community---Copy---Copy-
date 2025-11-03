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
import type { TenderSummary } from '@/shared/utils/tender/tenderSummaryCalculator'

interface TendersHeaderSectionProps {
  tenderSummary: TenderSummary
}

/**
 * Header section component with metadata and performance cards
 */
export const TendersHeaderSection: React.FC<TendersHeaderSectionProps> = ({ tenderSummary }) => {
  return (
    <div className="space-y-4">
      {/* Metadata Badges */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
          <StatusBadge
            status="default"
            label={`الكل ${tenderSummary.total}`}
            icon={ListChecks}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={tenderSummary.urgent > 0 ? 'warning' : 'default'}
            label={`عاجل ${tenderSummary.urgent}`}
            icon={AlertTriangle}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={tenderSummary.new > 0 ? 'info' : 'default'}
            label={`جديد ${tenderSummary.new}`}
            icon={FileText}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={tenderSummary.underAction > 0 ? 'info' : 'default'}
            label={`تحت الإجراء ${tenderSummary.underAction}`}
            icon={Clock}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={tenderSummary.waitingResults > 0 ? 'warning' : 'default'}
            label={`بانتظار النتائج ${tenderSummary.waitingResults}`}
            icon={Calendar}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={tenderSummary.won > 0 ? 'success' : 'default'}
            label={`فائز ${tenderSummary.won}`}
            icon={CheckCircle}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status={tenderSummary.lost > 0 ? 'error' : 'default'}
            label={`خاسر ${tenderSummary.lost}`}
            icon={XCircle}
            size="sm"
            className="shadow-none"
          />
          <StatusBadge
            status="info"
            label={`معدل الفوز ${tenderSummary.winRate.toFixed(1)}%`}
            icon={Trophy}
            size="sm"
            className="shadow-none"
          />
        </div>
      </div>

      {/* Performance Cards */}
      <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
        <TenderPerformanceCards tenderSummary={tenderSummary} />
      </div>
    </div>
  )
}
