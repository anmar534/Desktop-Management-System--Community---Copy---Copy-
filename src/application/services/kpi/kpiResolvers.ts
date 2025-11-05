import type { KPIMetrics } from '@/domain/selectors/kpiSelectors'

type KPIResolver = (metrics: KPIMetrics) => number

const BASE_RESOLVERS: Record<string, KPIResolver> = {
  tenders: (metrics) => metrics.totalTenders,
  projects: (metrics) => metrics.totalProjects,
  revenue: (metrics) => metrics.totalRevenueMillions,
  profit: (metrics) => metrics.totalProfitMillions,
  performance: (metrics) => metrics.averageProgress,
}

const customResolvers = new Map<string, KPIResolver>()

export function registerCustomKPIResolver(category: string, resolver: KPIResolver): void {
  customResolvers.set(category, resolver)
}

export function unregisterCustomKPIResolver(category: string): void {
  customResolvers.delete(category)
}

export function resolveKpiCurrentValue(
  category: string,
  metrics: KPIMetrics,
  fallback: number,
): number {
  const resolver = customResolvers.get(category) ?? BASE_RESOLVERS[category]
  if (!resolver) return fallback
  try {
    const value = resolver(metrics)
    return Number.isFinite(value) ? value : fallback
  } catch (error) {
    console.error('[KPI] Failed to resolve KPI value for category:', category, error)
    return fallback
  }
}
