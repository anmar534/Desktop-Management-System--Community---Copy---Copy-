import type { Project } from '@/data/centralData';

export type VarianceStatus = 'over' | 'under' | 'on-track';

export interface ProjectCostSnapshot {
  id: string;
  description?: string;
  category?: string | null;
  estimatedTotal: number;
  actualTotal: number;
}

export interface VarianceBreakdown {
  value: number;
  pct: number;
  status: VarianceStatus;
}

export interface CategoryVarianceSummary extends VarianceBreakdown {
  category: string;
  itemCount: number;
  totalEstimated: number;
  totalActual: number;
}

export interface ProjectCostSummary {
  totals: {
    estimated: number;
    actual: number;
    variance: VarianceBreakdown;
    grossMarginValue: number;
    grossMarginPct: number;
  };
  items: {
    count: number;
    overBudgetCount: number;
    underBudgetCount: number;
    onTrackCount: number;
    averageVariancePct: number;
  };
  categories: CategoryVarianceSummary[];
}

export interface TenderSnapshot {
  id: string;
  status: string;
  value?: number | null;
  submissionDate?: string | null;
  winDate?: string | null;
  lostDate?: string | null;
  documentPrice?: number | string | null;
  bookletPrice?: number | string | null;
}

export interface TenderMetricsSummary {
  total: number;
  submitted: number;
  won: number;
  lost: number;
  waiting: number;
  underReview: number;
  submittedValue: number;
  wonValue: number;
  lostValue: number;
  winRate: number;
  averageCycleDays: number | null;
}

export interface TenderMonthlyStat {
  month: number;
  year: number;
  submitted: number;
  submittedValue: number;
  won: number;
  wonValue: number;
  winRate: number;
}

export interface CashflowEntry {
  id?: string;
  type: 'inflow' | 'outflow';
  amount: number;
  date: string;
  category?: string;
  projectId?: string;
  notes?: string;
}

export interface CashflowOptions {
  startingBalance?: number;
}

export interface CashflowCategoryBreakdown {
  category: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface CashflowMonthlyBreakdown {
  month: number;
  year: number;
  inflow: number;
  outflow: number;
  net: number;
}

export interface CashflowSummary {
  totals: {
    inflow: number;
    outflow: number;
    net: number;
    startingBalance: number;
    endingBalance: number;
    averageDailyInflow: number;
    averageDailyOutflow: number;
    burnRate: number;
    runwayDays: number | null;
    periodDays: number;
  };
  categories: CashflowCategoryBreakdown[];
  monthly: CashflowMonthlyBreakdown[];
}

export type ProjectSnapshot = Pick<
  Project,
  | 'id'
  | 'name'
  | 'contractValue'
  | 'estimatedCost'
  | 'actualCost'
  | 'spent'
  | 'expectedProfit'
  | 'actualProfit'
  | 'startDate'
  | 'endDate'
  | 'status'
  | 'progress'
  | 'category'
  | 'priority'
  | 'health'
>;
