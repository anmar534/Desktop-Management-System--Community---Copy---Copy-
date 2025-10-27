import { Users, FileText, BarChart3, Plus } from 'lucide-react'
import type { QuickAction } from '@/presentation/components/layout/PageLayout'

/**
 * تكوين الإجراءات السريعة لصفحة المشاريع
 * 
 * يوفر 4 أزرار إجراءات سريعة:
 * 1. إدارة العملاء (Users icon)
 * 2. تقارير المشاريع (FileText icon)
 * 3. إحصائيات الأداء (BarChart3 icon)
 * 4. مشروع جديد (Plus icon) - primary button
 */

interface ProjectQuickActionsConfig {
  onViewClients: () => void
  onViewReports: () => void
  onNewProject: () => void
}

export function ProjectQuickActions({
  onViewClients,
  onViewReports,
  onNewProject,
}: ProjectQuickActionsConfig): QuickAction[] {
  return [
    {
      label: 'إدارة العملاء',
      icon: Users,
      onClick: onViewClients,
      variant: 'outline' as const,
    },
    {
      label: 'تقارير المشاريع',
      icon: FileText,
      onClick: onViewReports,
      variant: 'outline' as const,
    },
    {
      label: 'إحصائيات الأداء',
      icon: BarChart3,
      onClick: onViewReports,
      variant: 'outline' as const,
    },
    {
      label: 'مشروع جديد',
      icon: Plus,
      onClick: onNewProject,
      primary: true,
    },
  ]
}
