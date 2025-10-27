/**
 * ProjectStatsCards Component
 *
 * Displays project statistics dashboard with cards showing:
 * - Total projects count
 * - Active projects count
 * - Completed projects count
 * - On-hold/paused projects count
 * - Total budget and contract value
 * - Average progress
 */

import React from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { formatCurrency } from '@/shared/utils/formatters/formatters'

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  totalBudget: number
  totalContractValue: number
  averageProgress: number
}

interface ProjectStatsCardsProps {
  stats: ProjectStats
}

export const ProjectStatsCards: React.FC<ProjectStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardContent className="py-5">
          <p className="text-sm text-muted-foreground">إجمالي المشاريع</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{stats.totalProjects}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-5">
          <p className="text-sm text-muted-foreground">مشاريع نشطة</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{stats.activeProjects}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-5">
          <p className="text-sm text-muted-foreground">مشاريع مكتملة</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{stats.completedProjects}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-5">
          <p className="text-sm text-muted-foreground">متوقفة أو قيد الانتظار</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{stats.onHoldProjects}</p>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 xl:col-span-2">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="text-sm text-muted-foreground">إجمالي الميزانية</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatCurrency(stats.totalBudget, { currency: 'SAR', notation: 'compact' })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">إجمالي قيمة العقود</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatCurrency(stats.totalContractValue, {
                currency: 'SAR',
                notation: 'compact',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">متوسط الإنجاز</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {Math.round(stats.averageProgress)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
