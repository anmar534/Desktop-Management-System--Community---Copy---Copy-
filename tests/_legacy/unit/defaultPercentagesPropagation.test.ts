// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  applyDefaultsToPricingMap,
  type Percentages,
  type PricingEntryLike,
} from '../../src/utils/defaultPercentagesPropagation';

type PricingEntry = PricingEntryLike & {
  id: string;
  value?: number;
};

describe('applyDefaultsToPricingMap', () => {
  it('updates items still bound to previous defaults', () => {
    const prev: Percentages = { administrative: 5, operational: 5, profit: 10 };
    const next: Percentages = { administrative: 7, operational: 6, profit: 12 };
    const map = new Map<string, PricingEntry>([
      ['a', { id: 'a', additionalPercentages: { ...prev }, value: 1 }],
      ['b', {
        id: 'b',
        additionalPercentages: { administrative: 9, operational: 5, profit: 10 },
        value: 2,
      }], // customized, should not change
      ['c', { id: 'c', value: 3 }], // no percentages => treated as default-bound
    ]);
    const { updated, changedCount } = applyDefaultsToPricingMap(map, prev, next);
    expect(changedCount).toBe(2);
  const a = updated.get('a')!;
  const b = updated.get('b')!;
  const c = updated.get('c')!;
  expect(a.additionalPercentages).toEqual(next);
  expect(b.additionalPercentages).toEqual({ administrative: 9, operational: 5, profit: 10 });
  expect(c.additionalPercentages).toEqual(next);
  });

  it('returns zero changes if no item matches', () => {
    const prev: Percentages = { administrative: 5, operational: 5, profit: 10 };
    const next: Percentages = { administrative: 6, operational: 6, profit: 11 };
    const map = new Map<string, PricingEntry>([
      ['a', { id: 'a', additionalPercentages: { administrative: 8, operational: 5, profit: 10 } }],
      ['b', { id: 'b', additionalPercentages: { administrative: 7, operational: 5, profit: 9 } }],
    ]);
    const { changedCount } = applyDefaultsToPricingMap(map, prev, next);
    expect(changedCount).toBe(0);
  });
});
