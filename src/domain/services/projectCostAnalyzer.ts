import type {
  CategoryVarianceSummary,
  ProjectCostSnapshot,
  ProjectCostSummary,
  VarianceBreakdown,
  VarianceStatus
} from '@/domain/contracts/metrics';

const VARIANCE_TOLERANCE = 1e-6;

const clampNumber = (value: number): number =>
  Number.isFinite(value) ? Number(value) : 0;

const calculateVariance = (estimated: number, actual: number): VarianceBreakdown => {
  const safeEstimated = clampNumber(estimated);
  const safeActual = clampNumber(actual);
  const value = safeActual - safeEstimated;
  let pct: number;
  if (safeEstimated > 0) {
    pct = (value / safeEstimated) * 100;
  } else {
    pct = safeActual > 0 ? 100 : 0;
  }

  const status = determineVarianceStatus(value, pct);
  return {
    value,
    pct,
    status
  };
};

const determineVarianceStatus = (varianceValue: number, variancePct: number): VarianceStatus => {
  if (Math.abs(varianceValue) <= VARIANCE_TOLERANCE || Math.abs(variancePct) <= VARIANCE_TOLERANCE) {
    return 'on-track';
  }
  return varianceValue > 0 ? 'over' : 'under';
};

interface CategoryAccumulator {
  totalEstimated: number;
  totalActual: number;
  itemCount: number;
}

const buildCategorySummaries = (
  map: Map<string, CategoryAccumulator>
): CategoryVarianceSummary[] => {
  return Array.from(map.entries())
    .map(([category, data]) => {
      const variance = calculateVariance(data.totalEstimated, data.totalActual);
      return {
        category,
        itemCount: data.itemCount,
        totalEstimated: data.totalEstimated,
        totalActual: data.totalActual,
        value: variance.value,
        pct: variance.pct,
        status: variance.status
      };
    })
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
};

export class ProjectCostAnalyzer {
  static summarize(items: ProjectCostSnapshot[]): ProjectCostSummary {
    if (items.length === 0) {
      return {
        totals: {
          estimated: 0,
          actual: 0,
          variance: { value: 0, pct: 0, status: 'on-track' },
          grossMarginValue: 0,
          grossMarginPct: 0
        },
        items: {
          count: 0,
          overBudgetCount: 0,
          underBudgetCount: 0,
          onTrackCount: 0,
          averageVariancePct: 0
        },
        categories: []
      };
    }

    let totalEstimated = 0;
    let totalActual = 0;
    let overBudgetCount = 0;
    let underBudgetCount = 0;
    let onTrackCount = 0;
    let variancePctSum = 0;

    const categories = new Map<string, CategoryAccumulator>();

    for (const item of items) {
      const estimated = clampNumber(item.estimatedTotal);
      const actual = clampNumber(item.actualTotal);

      totalEstimated += estimated;
      totalActual += actual;

      const variance = calculateVariance(estimated, actual);
      variancePctSum += variance.pct;

      if (variance.status === 'over') {
        overBudgetCount += 1;
      } else if (variance.status === 'under') {
        underBudgetCount += 1;
      } else {
        onTrackCount += 1;
      }

      const categoryKey = (item.category ?? 'غير مصنّف').trim() || 'غير مصنّف';
      const entry = categories.get(categoryKey) ?? {
        totalEstimated: 0,
        totalActual: 0,
        itemCount: 0
      };
      entry.totalEstimated += estimated;
      entry.totalActual += actual;
      entry.itemCount += 1;
      categories.set(categoryKey, entry);
    }

    const varianceTotals = calculateVariance(totalEstimated, totalActual);
    const grossMarginValue = totalEstimated - totalActual;
    const grossMarginPct = totalEstimated > 0 ? (grossMarginValue / totalEstimated) * 100 : 0;

    return {
      totals: {
        estimated: totalEstimated,
        actual: totalActual,
        variance: varianceTotals,
        grossMarginValue,
        grossMarginPct
      },
      items: {
        count: items.length,
        overBudgetCount,
        underBudgetCount,
        onTrackCount,
        averageVariancePct: variancePctSum / items.length
      },
      categories: buildCategorySummaries(categories)
    };
  }

  static calculateVariance(estimated: number, actual: number): VarianceBreakdown {
    return calculateVariance(estimated, actual);
  }
}

export const projectCostAnalyzer = new ProjectCostAnalyzer();
