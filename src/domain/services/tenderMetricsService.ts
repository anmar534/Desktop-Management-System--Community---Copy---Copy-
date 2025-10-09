import type {
  TenderMetricsSummary,
  TenderMonthlyStat,
  TenderSnapshot
} from '@/domain/contracts/metrics';

const SUBMITTED_STATUSES = new Set(['submitted', 'ready_to_submit']);
const WON_STATUSES = new Set(['won']);
const LOST_STATUSES = new Set(['lost']);
const UNDER_REVIEW_STATUSES = new Set(['under_review']);
const WAITING_STATUSES = new Set(['new', 'under_action', 'ready_to_submit']);

const parseAmount = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const safeDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const diffInDays = (start: Date, end: Date): number => {
  const diff = end.getTime() - start.getTime();
  return diff / (1000 * 60 * 60 * 24);
};

interface CycleAccumulator {
  totalDays: number;
  samples: number;
}

interface MonthlyAccumulator {
  submitted: number;
  submittedValue: number;
  won: number;
  wonValue: number;
}

const buildMonthlyStats = (map: Map<string, MonthlyAccumulator>): TenderMonthlyStat[] => {
  return Array.from(map.entries())
    .map(([key, data]) => {
      const [year, month] = key.split('-').map((val) => parseInt(val, 10));
      const winRate = data.submitted > 0 ? (data.won / data.submitted) * 100 : data.won > 0 ? 100 : 0;
      return {
        year,
        month,
        submitted: data.submitted,
        submittedValue: data.submittedValue,
        won: data.won,
        wonValue: data.wonValue,
        winRate
      };
    })
    .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year));
};

const monthlyKey = (date: Date): string => `${date.getFullYear()}-${date.getMonth() + 1}`;

export class TenderMetricsService {
  static summarize(tenders: TenderSnapshot[]): TenderMetricsSummary {
    if (tenders.length === 0) {
      return {
        total: 0,
        submitted: 0,
        won: 0,
        lost: 0,
        waiting: 0,
        underReview: 0,
        submittedValue: 0,
        wonValue: 0,
        lostValue: 0,
        winRate: 0,
        averageCycleDays: null
      };
    }

    let submitted = 0;
    let won = 0;
    let lost = 0;
    let waiting = 0;
    let underReview = 0;
    let submittedValue = 0;
    let wonValue = 0;
    let lostValue = 0;

    const cycle: CycleAccumulator = { totalDays: 0, samples: 0 };

    for (const tender of tenders) {
      const status = tender.status ?? '';
      if (WON_STATUSES.has(status)) {
        won += 1;
        wonValue += parseAmount(tender.value);
      } else if (LOST_STATUSES.has(status)) {
        lost += 1;
        lostValue += parseAmount(tender.value);
      } else if (SUBMITTED_STATUSES.has(status)) {
        submitted += 1;
        submittedValue += parseAmount(tender.value);
      } else if (UNDER_REVIEW_STATUSES.has(status)) {
        underReview += 1;
      } else if (WAITING_STATUSES.has(status)) {
        waiting += 1;
      } else {
        waiting += 1;
      }

      const submissionDate = safeDate(tender.submissionDate);
      const completionDate = safeDate(tender.winDate ?? tender.lostDate);
      if (submissionDate && completionDate) {
        cycle.totalDays += Math.max(0, diffInDays(submissionDate, completionDate));
        cycle.samples += 1;
      }
    }

    const winRateDenominator = won + lost;
    const winRate = winRateDenominator > 0 ? (won / winRateDenominator) * 100 : 0;
    const averageCycleDays = cycle.samples > 0 ? cycle.totalDays / cycle.samples : null;

    return {
      total: tenders.length,
      submitted,
      won,
      lost,
      waiting,
      underReview,
      submittedValue,
      wonValue,
      lostValue,
      winRate,
      averageCycleDays
    };
  }

  static monthly(tenders: TenderSnapshot[]): TenderMonthlyStat[] {
    if (tenders.length === 0) {
      return [];
    }

    const accumulator = new Map<string, MonthlyAccumulator>();

    for (const tender of tenders) {
      const tenderValue = parseAmount(tender.value);
      const submission = safeDate(tender.submissionDate);
      if (submission) {
        const key = monthlyKey(submission);
        const bucket = accumulator.get(key) ?? {
          submitted: 0,
          submittedValue: 0,
          won: 0,
          wonValue: 0
        };
        bucket.submitted += 1;
        bucket.submittedValue += tenderValue;
        accumulator.set(key, bucket);
      }

      if (WON_STATUSES.has(tender.status ?? '')) {
        const winDate = safeDate(tender.winDate) ?? submission;
        if (winDate) {
          const key = monthlyKey(winDate);
          const bucket = accumulator.get(key) ?? {
            submitted: 0,
            submittedValue: 0,
            won: 0,
            wonValue: 0
          };
          bucket.won += 1;
          bucket.wonValue += tenderValue;
          accumulator.set(key, bucket);
        }
      }
    }

    return buildMonthlyStats(accumulator);
  }
}

export const tenderMetricsService = new TenderMetricsService();
