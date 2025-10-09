import type {
  CashflowCategoryBreakdown,
  CashflowEntry,
  CashflowMonthlyBreakdown,
  CashflowOptions,
  CashflowSummary
} from '@/domain/contracts/metrics';

const DEFAULT_CATEGORY = 'غير مصنّف';

const clampNumber = (value: number): number =>
  Number.isFinite(value) ? Number(value) : 0;

const parseAmount = (entry: CashflowEntry): number => clampNumber(entry.amount);

const safeDate = (value: string): Date | null => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

interface CategoryAccumulator {
  inflow: number;
  outflow: number;
}

interface MonthlyAccumulator {
  inflow: number;
  outflow: number;
}

const buildCategoryBreakdown = (
  map: Map<string, CategoryAccumulator>
): CashflowCategoryBreakdown[] =>
  Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      inflow: data.inflow,
      outflow: data.outflow,
      net: data.inflow - data.outflow
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

const buildMonthlyBreakdown = (
  map: Map<string, MonthlyAccumulator>
): CashflowMonthlyBreakdown[] =>
  Array.from(map.entries())
    .map(([key, data]) => {
      const [year, month] = key.split('-').map((val) => parseInt(val, 10));
      return {
        year,
        month,
        inflow: data.inflow,
        outflow: data.outflow,
        net: data.inflow - data.outflow
      };
    })
    .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year));

const monthlyKey = (date: Date): string => `${date.getFullYear()}-${date.getMonth() + 1}`;

export class CashflowService {
  static summarize(entries: CashflowEntry[], options: CashflowOptions = {}): CashflowSummary {
    if (entries.length === 0) {
      const startingBalance = clampNumber(options.startingBalance ?? 0);
      return {
        totals: {
          inflow: 0,
          outflow: 0,
          net: 0,
          startingBalance,
          endingBalance: startingBalance,
          averageDailyInflow: 0,
          averageDailyOutflow: 0,
          burnRate: 0,
          runwayDays: null,
          periodDays: 0
        },
        categories: [],
        monthly: []
      };
    }

    const startingBalance = clampNumber(options.startingBalance ?? 0);
    let totalInflow = 0;
    let totalOutflow = 0;
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    const categories = new Map<string, CategoryAccumulator>();
    const monthly = new Map<string, MonthlyAccumulator>();

    for (const entry of entries) {
      const amount = parseAmount(entry);
      const type = entry.type === 'outflow' ? 'outflow' : 'inflow';
      const categoryKey = (entry.category ?? DEFAULT_CATEGORY).trim() || DEFAULT_CATEGORY;
      const bucket = categories.get(categoryKey) ?? { inflow: 0, outflow: 0 };
      const entryDate = safeDate(entry.date);
      if (entryDate) {
        if (!minDate || entryDate < minDate) {
          minDate = entryDate;
        }
        if (!maxDate || entryDate > maxDate) {
          maxDate = entryDate;
        }
        const key = monthlyKey(entryDate);
        const monthlyBucket = monthly.get(key) ?? { inflow: 0, outflow: 0 };
        if (type === 'inflow') {
          monthlyBucket.inflow += amount;
        } else {
          monthlyBucket.outflow += amount;
        }
        monthly.set(key, monthlyBucket);
      }

      if (type === 'inflow') {
        bucket.inflow += amount;
        totalInflow += amount;
      } else {
        bucket.outflow += amount;
        totalOutflow += amount;
      }

      categories.set(categoryKey, bucket);
    }

    const net = totalInflow - totalOutflow;
    const endingBalance = startingBalance + net;

    const periodDays = minDate && maxDate ? Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : entries.length > 0 ? 1 : 0;
    const averageDailyInflow = periodDays > 0 ? totalInflow / periodDays : 0;
    const averageDailyOutflow = periodDays > 0 ? totalOutflow / periodDays : 0;
    const burnRate = periodDays > 0 ? Math.max(0, (totalOutflow - totalInflow) / periodDays) : 0;
    const runwayDays = burnRate > 0 ? Math.max(0, endingBalance / burnRate) : null;

    return {
      totals: {
        inflow: totalInflow,
        outflow: totalOutflow,
        net,
        startingBalance,
        endingBalance,
        averageDailyInflow,
        averageDailyOutflow,
        burnRate,
        runwayDays,
        periodDays
      },
      categories: buildCategoryBreakdown(categories),
      monthly: buildMonthlyBreakdown(monthly)
    };
  }
}

export const cashflowService = new CashflowService();
