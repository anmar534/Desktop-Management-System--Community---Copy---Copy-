import { describe, expect, it } from 'vitest';
import { createDefaultLayouts } from '@/features/dashboard/presets';

const REQUIRED_WIDGET_IDS = [
  'calendar',
  'documents',
  'financial',
  'micro',
  'insights',
  'team',
];

describe('dashboard preset layouts', () => {
  it('includes the enhanced widget set for the executive preset', () => {
    const layouts = createDefaultLayouts();
    const executiveIds = new Set(layouts.executive.lg.map((layout) => layout.i));

    REQUIRED_WIDGET_IDS.forEach((id) => {
      expect(executiveIds.has(id)).toBe(true);
    });
  });

  it('keeps financial preset aligned with new widgets', () => {
    const layouts = createDefaultLayouts();
    const financialIds = new Set(layouts.financial.lg.map((layout) => layout.i));

    ['calendar', 'documents', 'financial', 'micro'].forEach((id) => {
      expect(financialIds.has(id)).toBe(true);
    });
  });
});
