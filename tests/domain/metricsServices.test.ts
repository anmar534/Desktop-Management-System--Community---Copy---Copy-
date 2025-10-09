import { describe, it, expect } from 'vitest';
import { ProjectCostAnalyzer } from '@/domain/services/projectCostAnalyzer';
import { TenderMetricsService } from '@/domain/services/tenderMetricsService';
import { CashflowService } from '@/domain/services/cashflowService';
import type {
  CashflowEntry,
  ProjectCostSnapshot,
  TenderSnapshot
} from '@/domain/contracts/metrics';

describe('ProjectCostAnalyzer', () => {
  it('summarizes variance totals and categories', () => {
    const items: ProjectCostSnapshot[] = [
      {
        id: 'item-1',
        description: 'خرسانة',
        category: 'مواد',
        estimatedTotal: 100,
        actualTotal: 130
      },
      {
        id: 'item-2',
        description: 'أعمال تشطيبات',
        category: 'عمالة',
        estimatedTotal: 200,
        actualTotal: 180
      },
      {
        id: 'item-3',
        description: 'حديد تسليح',
        category: 'مواد',
        estimatedTotal: 50,
        actualTotal: 50
      }
    ];

    const summary = ProjectCostAnalyzer.summarize(items);

    expect(summary.totals.estimated).toBe(350);
    expect(summary.totals.actual).toBe(360);
    expect(summary.totals.variance.value).toBeCloseTo(10, 6);
    expect(summary.items.overBudgetCount).toBe(1);
    expect(summary.items.underBudgetCount).toBe(1);
    expect(summary.items.onTrackCount).toBe(1);

    const materials = summary.categories.find((cat) => cat.category === 'مواد');
    expect(materials).toBeDefined();
    expect(materials?.itemCount).toBe(2);
    expect(materials?.value).toBeCloseTo(30, 6);
  });

  it('handles empty snapshots gracefully', () => {
    const summary = ProjectCostAnalyzer.summarize([]);
    expect(summary.totals.estimated).toBe(0);
    expect(summary.items.count).toBe(0);
  });

  it('normalizes invalid numbers and falls back to default category', () => {
    const summary = ProjectCostAnalyzer.summarize([
      {
        id: 'invalid-1',
        description: 'بيانات ناقصة',
        category: '',
        estimatedTotal: Number.NaN,
        actualTotal: Number.POSITIVE_INFINITY
      },
      {
        id: 'invalid-2',
        description: 'قيمة سالبة',
        category: undefined,
        estimatedTotal: -50,
        actualTotal: -25
      }
    ]);

  expect(summary.totals.estimated).toBe(-50);
  expect(summary.totals.actual).toBe(-25);
    expect(summary.items.count).toBe(2);
    expect(summary.categories).toHaveLength(1);
    expect(summary.categories[0]?.category).toBe('غير مصنّف');
    expect(summary.categories[0]?.itemCount).toBe(2);
    expect(summary.items.onTrackCount + summary.items.overBudgetCount + summary.items.underBudgetCount).toBe(2);
  });
});

describe('TenderMetricsService', () => {
  const tenders: TenderSnapshot[] = [
    {
      id: 't1',
      status: 'submitted',
      value: 100,
      submissionDate: '2025-01-01'
    },
    {
      id: 't2',
      status: 'won',
      value: 200,
      submissionDate: '2025-01-05',
      winDate: '2025-02-01'
    },
    {
      id: 't3',
      status: 'lost',
      value: 150,
      submissionDate: '2025-01-10',
      lostDate: '2025-01-20'
    },
    {
      id: 't4',
      status: 'new',
      value: 80
    }
  ];

  it('computes summary totals and averages', () => {
    const summary = TenderMetricsService.summarize(tenders);
    expect(summary.total).toBe(4);
    expect(summary.submitted).toBe(1);
    expect(summary.won).toBe(1);
    expect(summary.lost).toBe(1);
    expect(summary.waiting).toBe(1);
    expect(summary.winRate).toBeCloseTo(50, 6);
    expect(summary.averageCycleDays).toBeCloseTo((27 + 10) / 2, 6);
  });

  it('produces monthly breakdown including wins', () => {
    const monthly = TenderMetricsService.monthly(tenders);
    const january = monthly.find((stat) => stat.month === 1 && stat.year === 2025);
    const february = monthly.find((stat) => stat.month === 2 && stat.year === 2025);

    expect(january).toBeDefined();
    expect(january?.submitted).toBe(3);
    expect(january?.submittedValue).toBe(450);

    expect(february).toBeDefined();
    expect(february?.won).toBe(1);
    expect(february?.wonValue).toBe(200);
  });

  it('parses string values and ignores invalid cycles', () => {
    const noisyTenders: TenderSnapshot[] = [
      {
        id: 't5',
        status: 'won',
        value: 'SAR 350,000' as unknown as number,
        submissionDate: '2025-03-01',
        winDate: '2025-03-15'
      },
      {
        id: 't6',
        status: 'unknown-status',
        value: 'USD 50,000' as unknown as number,
        submissionDate: 'invalid-date'
      },
      {
        id: 't7',
        status: 'lost',
        value: null,
        submissionDate: '2025-03-02'
      }
    ];

    const summary = TenderMetricsService.summarize(noisyTenders);
    expect(summary.total).toBe(3);
    expect(summary.won).toBe(1);
    expect(summary.wonValue).toBe(350000);
    expect(summary.lostValue).toBe(0);
    expect(summary.waiting).toBe(1);
    expect(summary.averageCycleDays).toBeCloseTo(14, 6);

    const monthly = TenderMetricsService.monthly(noisyTenders);
    const march = monthly.find((m) => m.year === 2025 && m.month === 3);
    expect(march).toBeDefined();
    expect(march?.submitted).toBe(2);
    expect(march?.submittedValue).toBe(350000);
    expect(march?.won).toBe(1);
  });
});

describe('CashflowService', () => {
  it('summarizes totals, categories, and runway', () => {
    const entries: CashflowEntry[] = [
      {
        id: 'c1',
        type: 'inflow',
        amount: 1000,
        date: '2025-01-01',
        category: 'المشاريع'
      },
      {
        id: 'c2',
        type: 'outflow',
        amount: 400,
        date: '2025-01-02',
        category: 'الرواتب'
      },
      {
        id: 'c3',
        type: 'outflow',
        amount: 200,
        date: '2025-01-15',
        category: 'المشاريع'
      },
      {
        id: 'c4',
        type: 'inflow',
        amount: 500,
        date: '2025-02-01',
        category: 'المشاريع'
      }
    ];

    const summary = CashflowService.summarize(entries, { startingBalance: 300 });

    expect(summary.totals.inflow).toBe(1500);
    expect(summary.totals.outflow).toBe(600);
    expect(summary.totals.net).toBe(900);
    expect(summary.totals.endingBalance).toBe(1200);
    expect(summary.totals.periodDays).toBe(32);
    expect(summary.totals.burnRate).toBe(0);
    expect(summary.totals.runwayDays).toBeNull();

    const projects = summary.categories.find((cat) => cat.category === 'المشاريع');
    expect(projects?.net).toBe(1300);

    const january = summary.monthly.find((stat) => stat.month === 1 && stat.year === 2025);
    const february = summary.monthly.find((stat) => stat.month === 2 && stat.year === 2025);
    expect(january?.inflow).toBe(1000);
    expect(january?.outflow).toBe(600);
    expect(february?.inflow).toBe(500);
    expect(february?.outflow).toBe(0);
  });

  it('handles empty entries with default balance', () => {
    const summary = CashflowService.summarize([], { startingBalance: 100 });
    expect(summary.totals.startingBalance).toBe(100);
    expect(summary.totals.endingBalance).toBe(100);
    expect(summary.totals.periodDays).toBe(0);
  });

  it('computes burn rate and runway with mixed validity', () => {
    const summary = CashflowService.summarize(
      [
        {
          id: 'bad-date',
          type: 'outflow',
          amount: 500,
          date: 'invalid-date'
        },
        {
          id: 'out-1',
          type: 'outflow',
          amount: 6000,
          date: '2025-04-01',
          category: 'المشاريع'
        },
        {
          id: 'in-1',
          type: 'inflow',
          amount: 2000,
          date: '2025-04-02',
          category: 'عقود'
        }
      ],
      { startingBalance: 5000 }
    );

  expect(summary.totals.inflow).toBe(2000);
  expect(summary.totals.outflow).toBe(6500);
  expect(summary.totals.net).toBe(-4500);
    expect(summary.totals.burnRate).toBeGreaterThan(0);
    expect(summary.totals.runwayDays).toBeGreaterThan(0);
  expect(summary.totals.endingBalance).toBe(500);
  expect(summary.totals.runwayDays).toBeGreaterThan(0);
  expect(summary.totals.periodDays).toBeGreaterThanOrEqual(1);
  const uncategorized = summary.categories.find((cat) => cat.category === 'غير مصنّف');
  expect(uncategorized).toBeDefined();
  expect(uncategorized?.outflow).toBe(500);
  });
});
