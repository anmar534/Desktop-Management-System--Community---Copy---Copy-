/**
 * 📊 Project Overview Tab Component
 * Displays basic project information and financial summary
 *
 * Updated in Phase 1.3 to use new helper components
 * Date: 2025-10-23
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Label } from '@/presentation/components/ui/label'
import { Building2, User, MapPin, LinkIcon } from 'lucide-react'
import type { Project } from '@/data/centralData'
import { ProjectStatusBadge, ProjectProgressBar, FinancialMetricsCard } from '../shared'
import type { ProjectFinancialMetrics } from '@/domain/services/ProjectFinancialService'

// ===============================
// 📎 Types & Interfaces
// ===============================

interface ProjectOverviewTabProps {
  project: Project
  financialMetrics: ProjectFinancialMetrics | null
  financialHealth: 'green' | 'yellow' | 'red' | null
  onNavigateTo: (section: string) => void
}

// ===============================
// 🎨 Component
// ===============================

export function ProjectOverviewTab({
  project,
  financialMetrics,
  financialHealth,
  onNavigateTo,
}: ProjectOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* المعلومات الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">اسم المشروع</Label>
                <div className="text-lg font-semibold mt-1">{project.name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">العميل</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{project.client}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-auto"
                    onClick={() => onNavigateTo('clients')}
                  >
                    <LinkIcon className="h-3 w-3 ml-1" />
                    فتح بطاقة العميل
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">الموقع</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {project.location || 'غير محدد'}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    الحالة والأولوية
                  </Label>
                  <div className="mt-1">
                    <ProjectStatusBadge
                      status={project.status}
                      priority={project.priority}
                      showPriority={true}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">نسبة الإنجاز</Label>
                  <div className="mt-2">
                    <ProjectProgressBar
                      progress={project.progress || 0}
                      startDate={project.startDate}
                      endDate={project.endDate}
                      showDates={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ملخص مالي سريع */}
        <FinancialMetricsCard
          metrics={financialMetrics}
          healthStatus={financialHealth}
          tenderCost={financialMetrics?.estimatedCost}
          actualCost={financialMetrics?.actualCost}
          variance={financialMetrics?.financialVariance}
          variancePercentage={
            financialMetrics && financialMetrics.estimatedCost > 0
              ? (financialMetrics.financialVariance / financialMetrics.estimatedCost) * 100
              : 0
          }
        />
      </div>
    </div>
  )
}
