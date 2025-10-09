import type { Layout } from 'react-grid-layout';

export const DASHBOARD_BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
} as const;

export const DASHBOARD_COLS: Record<keyof typeof DASHBOARD_BREAKPOINTS, number> = {
  lg: 12,
  md: 10,
  sm: 8,
  xs: 4,
  xxs: 2,
};

export const BASE_GRID_COLS = DASHBOARD_COLS.lg;

export type DashboardBreakpoint = keyof typeof DASHBOARD_BREAKPOINTS;

export type DashboardLayouts = Record<DashboardBreakpoint, Layout[]>;
