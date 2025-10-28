import { memo } from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { InlineAlert } from '@/presentation/components/ui/inline-alert'
import { Progress } from '@/presentation/components/ui/progress'
import { StatusBadge } from '@/presentation/components/ui/status-badge'
import { EntityActions } from '@/presentation/components/ui/ActionButtons'
import { motion } from 'framer-motion'
import { Users, Calendar, Building2, DollarSign, BarChart3 } from 'lucide-react'
import { getStatusIcon, getProjectStatusBadge } from '@/shared/utils/projectStatusHelpers'
import { getHealthColor } from '@/shared/utils/ui/statusColors'
import type { Project } from '@/data/centralData'

/**
 * مكون بطاقة المشروع
 *
 * ⚠️ CRITICAL DESIGN PRESERVATION:
 * هذا المكون تم استخراجه في Phase 4 مع الحفاظ على 100% من التصميم الأصلي
 *
 * العناصر الحرجة المحفوظة:
 * - Motion animations: opacity 0→1, y: 20→0, delay based on index
 * - Card styling: shadow-sm hover:shadow-md transition-all duration-300 group
 * - Grid layouts: grid-cols-2 for basic info and financial info
 * - Color classes: text-success, text-warning, text-destructive, text-primary
 * - Health indicator: w-3 h-3 rounded-full with dynamic color
 * - Conditional renders: profit display, cost input for completed projects
 * - InlineAlert with cost input for completed projects without actualCost
 * - Progress bar: h-1.5 exact height
 * - EntityActions at bottom with border-t separator
 * - All icon sizes: h-4 w-4
 * - All text sizes: text-xs, text-sm, text-base
 * - All spacing: gap-2, gap-3, mb-2, mb-3, p-4, etc.
 *
 * تحذير: أي تغيير في هذه العناصر سيؤدي إلى فقدان التصميم!
 */

type ProjectWithLegacyFields = Project & { profit?: number; profitMargin?: number }

export interface ProjectCardProps {
  project: ProjectWithLegacyFields
  index: number
  formatCurrencyValue: (value: number) => string
  costInputs: Record<string, string>
  isSavingCosts: Record<string, boolean>
  onCostInputChange: (projectId: string, value: string) => void
  onSaveCosts: (project: ProjectWithLegacyFields) => void
  onViewProject: (projectId: string) => void
  onEditProject: (project: ProjectWithLegacyFields) => void
  onDeleteProject: (projectId: string) => void
}

const ProjectCardComponent = function ProjectCard({
  project,
  index,
  formatCurrencyValue,
  costInputs,
  isSavingCosts,
  onCostInputChange,
  onSaveCosts,
  onViewProject,
  onEditProject,
  onDeleteProject,
}: ProjectCardProps) {
  const statusBadge = getProjectStatusBadge(project.status)
  const isCompleted = project.status === 'completed'
  const profitValue = project.actualProfit ?? project.profit ?? 0
  const profitClass = profitValue >= 0 ? 'text-success' : 'text-destructive'
  const contractValueDisplay = project.contractValue
    ? formatCurrencyValue(project.contractValue)
    : project.value
      ? formatCurrencyValue(project.value)
      : project.budget
        ? formatCurrencyValue(project.budget)
        : 'غير محدد'
  const estimatedCostDisplay = project.estimatedCost
    ? formatCurrencyValue(project.estimatedCost)
    : 'غير محددة'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 group">
        <CardContent className="p-4">
          {/* العنوان والحالة */}
          <div
            className="flex items-start justify-between mb-3"
            onClick={() => onViewProject(project.id)}
          >
            <div className="flex items-center gap-2 flex-1">
              {getStatusIcon(project.status)}
              <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors cursor-pointer">
                {project.name || 'مشروع غير محدد'}
              </h3>
            </div>
            <div className={`w-3 h-3 rounded-full ${getHealthColor(project.health)}`} />
          </div>

          {/* المعلومات الأساسية في grid متساوي */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <span className="text-muted-foreground text-xs">العميل:</span>
                <div className="font-medium truncate">{project.client || 'غير محدد'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <span className="text-muted-foreground text-xs">التاريخ:</span>
                <div className="font-medium truncate">{project.startDate || 'غير محدد'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <span className="text-muted-foreground text-xs">النوع:</span>
                <div className="font-medium truncate">{project.type || 'غير محدد'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge
                status={statusBadge.status}
                label={statusBadge.label}
                size="sm"
                className="whitespace-nowrap"
              />
            </div>
          </div>

          {/* المعلومات المالية في grid متساوي */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground text-xs">قيمة العقد:</span>
                <div className="font-medium text-success truncate">{contractValueDisplay}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground text-xs">التكلفة التقديرية:</span>
                <div className="font-medium text-warning truncate">{estimatedCostDisplay}</div>
              </div>
            </div>
          </div>

          {/* عرض الربح المتوقع إذا توفرت البيانات */}
          {project.contractValue && project.estimatedCost && (
            <div className="mb-2 text-xs text-muted-foreground">
              <span>الربح المتوقع: </span>
              <span
                className={`font-medium ${project.contractValue - project.estimatedCost >= 0 ? 'text-success' : 'text-destructive'}`}
              >
                {formatCurrencyValue(project.contractValue - project.estimatedCost)}
              </span>
            </div>
          )}

          {/* سطر ملخص صغير جدًا للبيانات المهمة عند توفرها (لا يزيد حجم البطاقة) */}
          {isCompleted && (project.actualCost || project.spent) && (
            <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                الربح الفعلي:
                <span className={`mx-1 font-medium ${profitClass}`}>
                  {formatCurrencyValue(profitValue)}
                  {project.profitMargin && (
                    <span className="text-xs opacity-75">
                      {' '}
                      ({project.profitMargin.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </span>
              <span className="opacity-60">•</span>
              <span>
                التكلفة الفعلية:
                <span className="mx-1 font-medium text-warning">
                  {formatCurrencyValue(project.actualCost || project.spent || 0)}
                </span>
              </span>
            </div>
          )}

          {/* شريط التقدم */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground text-xs">نسبة الإنجاز</span>
              <span className="font-medium text-foreground text-xs">
                {isCompleted ? '100' : project.progress || 0}%
              </span>
            </div>
            <Progress value={isCompleted ? 100 : project.progress || 0} className="h-1.5" />
          </div>

          {/* قسم إدخال التكاليف للمشاريع المكتملة بدون تكاليف فعلية */}
          {isCompleted && !project.actualCost && !project.spent && (
            <InlineAlert
              variant="warning"
              title="إدخال التكلفة الفعلية للمشروع"
              description={
                <span>
                  قيمة العقد:{' '}
                  <span className="font-semibold text-foreground">{contractValueDisplay}</span>
                  {' • '}
                  التكلفة التقديرية:{' '}
                  <span className="font-semibold text-foreground">{estimatedCostDisplay}</span>
                </span>
              }
              icon={<DollarSign className="h-4 w-4" />}
              className="mt-3"
            >
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="التكلفة الفعلية النهائية"
                  value={costInputs[project.id] || ''}
                  onChange={(e) => onCostInputChange(project.id, e.target.value)}
                  className="text-xs h-7 flex-1"
                  min="0"
                  step="0.01"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSaveCosts(project)}
                  disabled={isSavingCosts[project.id] || !costInputs[project.id]}
                  className="h-7 px-2 text-xs"
                >
                  {isSavingCosts[project.id] ? '...' : 'حفظ'}
                </Button>
              </div>
            </InlineAlert>
          )}

          {/* الأيقونات في أسفل البطاقة */}
          <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-border">
            <EntityActions
              onView={() => {
                onViewProject(project.id)
              }}
              onEdit={() => {
                onEditProject(project)
              }}
              onDelete={() => {
                void onDeleteProject(project.id)
              }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Memoize ProjectCard to prevent unnecessary re-renders
export const ProjectCard = memo(ProjectCardComponent)
