import { ProjectHeaderBadges } from './ProjectHeaderBadges'
import { ProjectAnalysisCards } from './ProjectAnalysisCards'
import type { ProjectsManagementData } from '@/application/hooks/useProjectsManagementData'

/**
 * مكون wrapper للهيدر الإضافي في صفحة المشاريع
 * 
 * ⚠️ CRITICAL: يجب الحفاظ على الـ gradients والـ shadows الدقيقة:
 * - First div: rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm
 * - Second div: rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm
 */

interface ProjectStats {
  total: number
  active: number
  completed: number
  paused: number
  planning: number
  averageProgress: number
}

interface BadgesProps {
  stats: ProjectStats
  totalNetProfit: number
  formatCurrencyValue: (value: number, options?: { notation?: 'standard' | 'compact' }) => string
}

interface AnalysisCardsProps {
  managementData: ProjectsManagementData
}

interface ProjectHeaderExtrasProps {
  badgesProps: BadgesProps
  analysisCardsProps: AnalysisCardsProps
}

export function ProjectHeaderExtras({ badgesProps, analysisCardsProps }: ProjectHeaderExtrasProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
        <ProjectHeaderBadges {...badgesProps} />
      </div>
      <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
        <ProjectAnalysisCards {...analysisCardsProps} />
      </div>
    </div>
  )
}
