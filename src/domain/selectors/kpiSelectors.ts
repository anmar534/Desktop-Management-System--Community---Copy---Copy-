/**
 * KPI Selectors - انتقائيات موحدة لحسابات مؤشرات الأداء
 *
 * توفر هذه الـ Selectors حسابات نقية ومستقلة عن React
 * يمكن استخدامها في:
 * - Hooks (useKPIs)
 * - Services
 * - Tests
 * - Background workers
 */

import type { Project, Tender } from '@/data/centralData'
import { calculateTenderStats } from '@/calculations/tender'
import { selectWonTendersCount as selectWonTendersCountFromTenderSelectors } from '@/domain/selectors/tenderSelectors'

/**
 * حساب إجمالي الإيرادات من المشاريع النشطة
 */
export function selectTotalRevenue(projects: Project[]): number {
  return projects
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + (p.contractValue || 0), 0)
}

/**
 * حساب صافي الأرباح (تقدير 15% من الإيرادات)
 */
export function selectTotalProfit(projects: Project[]): number {
  const revenue = selectTotalRevenue(projects)
  return revenue * 0.15
}

/**
 * حساب إجمالي عدد المنافسات
 */
export function selectTotalTendersCount(tenders: Tender[]): number {
  return tenders.length
}

/**
 * حساب عدد المنافسات الفائزة
 *
 * ملاحظة: تم نقل التنفيذ إلى tenderSelectors.ts لتجنب التكرار
 */
export function selectWonTendersCount(tenders: Tender[]): number {
  return selectWonTendersCountFromTenderSelectors(tenders)
}

/**
 * حساب عدد المشاريع النشطة
 */
export function selectActiveProjectsCount(projects: Project[]): number {
  const activeStatuses: Project['status'][] = ['active', 'delayed', 'planning']
  return projects.filter((p) => activeStatuses.includes(p.status)).length
}

/**
 * حساب إجمالي عدد المشاريع
 */
export function selectTotalProjectsCount(projects: Project[]): number {
  return projects.length
}

/**
 * حساب معدل فوز المنافسات
 */
export function selectTenderWinRate(tenders: Tender[]): number {
  const stats = calculateTenderStats(tenders)
  return stats.winRate
}

/**
 * حساب متوسط تقدم المشاريع
 */
export function selectAverageProjectProgress(projects: Project[]): number {
  const projectsWithProgress = projects.filter((p) => typeof p.progress === 'number')

  if (projectsWithProgress.length === 0) {
    return 0
  }

  const total = projectsWithProgress.reduce((sum, p) => sum + (p.progress ?? 0), 0)

  return Math.round(total / projectsWithProgress.length)
}

/**
 * حساب إجمالي قيمة المنافسات الفائزة
 */
export function selectWonTendersValue(tenders: Tender[]): number {
  return tenders
    .filter((t) => t.status === 'won')
    .reduce((sum, t) => sum + (t.value ?? t.totalValue ?? 0), 0)
}

/**
 * حساب إجمالي قيمة المنافسات الفائزة بالملايين
 */
export function selectWonTendersValueInMillions(tenders: Tender[]): number {
  return selectWonTendersValue(tenders) / 1_000_000
}

/**
 * حساب عدد المشاريع المكتملة
 */
export function selectCompletedProjectsCount(projects: Project[]): number {
  return projects.filter((p) => p.status === 'completed').length
}

/**
 * حساب عدد المشاريع المتأخرة
 */
export function selectDelayedProjectsCount(projects: Project[]): number {
  return projects.filter((p) => p.status === 'delayed').length
}

/**
 * ملخص شامل لجميع المؤشرات
 */
export interface KPIMetrics {
  // منافسات
  tenderWinRate: number
  wonTendersCount: number
  wonTendersValue: number
  wonTendersValueMillions: number
  totalTenders: number

  // مشاريع
  totalProjects: number
  activeProjects: number
  completedProjects: number
  delayedProjects: number
  averageProgress: number

  // مالي
  totalRevenue: number
  totalRevenueMillions: number
  totalProfit: number
  totalProfitMillions: number
}

/**
 * حساب جميع المؤشرات دفعة واحدة
 */
export function selectAllKPIMetrics(projects: Project[], tenders: Tender[]): KPIMetrics {
  const totalRevenue = selectTotalRevenue(projects)
  const totalProfit = selectTotalProfit(projects)
  return {
    tenderWinRate: selectTenderWinRate(tenders),
    wonTendersCount: selectWonTendersCount(tenders),
    wonTendersValue: selectWonTendersValue(tenders),
    wonTendersValueMillions: selectWonTendersValueInMillions(tenders),
    totalTenders: selectTotalTendersCount(tenders),
    totalProjects: selectTotalProjectsCount(projects),
    activeProjects: selectActiveProjectsCount(projects),
    completedProjects: selectCompletedProjectsCount(projects),
    delayedProjects: selectDelayedProjectsCount(projects),
    averageProgress: selectAverageProjectProgress(projects),
    totalRevenue,
    totalRevenueMillions: totalRevenue / 1_000_000,
    totalProfit,
    totalProfitMillions: totalProfit / 1_000_000,
  }
}
