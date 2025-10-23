/**
 * 📊 Project Overview Tab Component
 * Displays basic project information and financial summary
 *
 * Extracted from EnhancedProjectDetails.tsx as part of Phase 1.1 refactoring
 * Date: 2025-10-23
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Progress } from '@/presentation/components/ui/progress'
import { Label } from '@/presentation/components/ui/label'
import { Building2, DollarSign, User, MapPin, LinkIcon } from 'lucide-react'
import { formatCurrency } from '@/data/centralData'
import type { Project } from '@/data/centralData'

// ===============================
// 📎 Types & Interfaces
// ===============================

interface StatusInfo {
  text: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
}

interface FinancialMetrics {
  contractValue: number
  estimatedCost: number
  actualCost: number
  actualProfit: number
  profitMargin: number
  financialVariance: number
}

interface ProjectOverviewTabProps {
  project: Project
  statusInfo: StatusInfo
  financialMetrics: FinancialMetrics
  onNavigateTo: (section: string) => void
}

// ===============================
// 🎨 Component
// ===============================

export function ProjectOverviewTab({
  project,
  statusInfo,
  financialMetrics,
  onNavigateTo,
}: ProjectOverviewTabProps) {
  const {
    contractValue,
    estimatedCost,
    actualCost,
    actualProfit,
    profitMargin,
    financialVariance,
  } = financialMetrics

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
              <div className="flex items-center gap-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">الحالة</Label>
                  <div className="mt-1">
                    <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">نسبة الإنجاز</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={project.progress || 0} className="h-2 w-40" />
                    <span className="text-sm font-medium">{project.progress || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ملخص مالي سريع */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              ملخص مالي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">قيمة العقد (الإيرادات)</span>
                <span className="font-semibold text-info">{formatCurrency(contractValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  التكلفة التقديرية (الميزانية المخططة)
                </span>
                <span className="font-semibold text-warning">{formatCurrency(estimatedCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">التكلفة الفعلية</span>
                <span className="font-semibold text-destructive">{formatCurrency(actualCost)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm text-muted-foreground">الربح الفعلي</span>
                <span
                  className={`font-semibold ${actualProfit >= 0 ? 'text-success' : 'text-destructive'}`}
                >
                  {formatCurrency(actualProfit)} ({profitMargin.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">الانحراف المالي</span>
                <span
                  className={`font-semibold ${financialVariance <= 0 ? 'text-success' : 'text-destructive'}`}
                >
                  {financialVariance >= 0 ? '+' : ''}
                  {formatCurrency(financialVariance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
