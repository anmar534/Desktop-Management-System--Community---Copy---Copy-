import { DetailCard } from '@/presentation/components/layout/PageLayout'
import { DollarSign, Calendar, Award, Users } from 'lucide-react'
import type { ProjectsManagementData } from '@/application/hooks/useProjectsManagementData'

/**
 * مكون بطاقات تحليل المشاريع
 * 
 * ⚠️ CRITICAL: هذا المكون تم فقدانه في محاولة الـ refactoring السابقة!
 * يجب الحفاظ على:
 * - Grid layout: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
 * - الألوان الدقيقة لكل بطاقة (success, primary, accent, warning)
 * - اتجاهات الـ trends الشرطية
 * - النصوص الفرعية الشرطية
 * 
 * الخسارة السابقة: 4 DetailCard components مع التنسيق الكامل
 * الاستعادة: Phase 3 - 100% design preservation
 */

interface ProjectAnalysisCardsProps {
  managementData: ProjectsManagementData
}

export function ProjectAnalysisCards({ managementData }: ProjectAnalysisCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DetailCard
        title="أداء الميزانية"
        value={`${Math.abs(managementData.performance.budgetVariance).toFixed(1)}%`}
        subtitle={
          managementData.performance.budgetVariance < 0 ? 'توفير في التكلفة' : 'تجاوز الميزانية'
        }
        icon={DollarSign}
        color="text-success"
        bgColor="bg-success/10"
        trend={{
          value: `${managementData.performance.budgetVariance.toFixed(1)}%`,
          direction: managementData.performance.budgetVariance < 0 ? 'up' : 'down',
        }}
      />
      <DetailCard
        title="أداء الجدولة"
        value={`${Math.abs(managementData.performance.scheduleVariance)}%`}
        subtitle={
          managementData.performance.scheduleVariance > 0 ? 'متقدم على الجدول' : 'متأخر عن الجدول'
        }
        icon={Calendar}
        color="text-primary"
        bgColor="bg-primary/10"
        trend={{
          value: `${managementData.performance.scheduleVariance}%`,
          direction: managementData.performance.scheduleVariance > 0 ? 'up' : 'down',
        }}
      />
      <DetailCard
        title="درجة الجودة"
        value={`${managementData.performance.qualityScore}%`}
        subtitle="معايير الجودة العامة"
        icon={Award}
        color="text-accent"
        bgColor="bg-accent/10"
        trend={{ value: '+2.1%', direction: 'up' }}
      />
      <DetailCard
        title="رضا العملاء"
        value={`${managementData.performance.clientSatisfaction}%`}
        subtitle="تقييم العملاء"
        icon={Users}
        color="text-warning"
        bgColor="bg-warning/10"
        trend={{ value: '+0.8%', direction: 'up' }}
      />
    </div>
  )
}
