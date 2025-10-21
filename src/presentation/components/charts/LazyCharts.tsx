/**
 * Lazy Loaded Charts Components
 * 
 * This module provides lazy-loaded wrappers for heavy chart components.
 * Charts are loaded on-demand to reduce initial bundle size.
 * 
 * Phase 1.5: Performance Optimization - Charts Lazy Loading
 * 
 * @author Desktop Management System Team
 * @version 1.0.0
 */

import { lazy, Suspense } from 'react';
import { ChartSkeleton, PieChartSkeleton, CompactChartSkeleton } from './ChartSkeleton';

// ============================================================================
// LAZY LOADED CHART COMPONENTS (743 KB vendor-charts chunk)
// ============================================================================

/**
 * Lazy load AnalyticsCharts component
 * This component contains multiple chart types and analytics visualizations
 */
export const AnalyticsCharts = lazy(() => 
  import('../analytics/AnalyticsCharts').then(module => ({
    default: module.default || module.AnalyticsCharts
  }))
);

/**
 * Lazy load FinancialAnalytics component
 * Heavy component with financial charts and KPIs
 */
export const FinancialAnalytics = lazy(() => 
  import('../financial/FinancialAnalytics').then(module => ({
    default: module.default || module.FinancialAnalytics
  }))
);

/**
 * Lazy load EVMDashboard component
 * Earned Value Management dashboard with multiple charts
 */
export const EVMDashboard = lazy(() => 
  import('../evm/EVMDashboard').then(module => ({
    default: module.default || module.EVMDashboard
  }))
);

/**
 * Lazy load MonthlyExpensesChart component
 */
export const MonthlyExpensesChart = lazy(() =>
  import('../../pages/Financial/components/MonthlyExpensesChart').then(module => ({
    default: module.default || module.MonthlyExpensesChart
  }))
);

/**
 * Lazy load ProjectsDashboard with charts
 */
export const ProjectsDashboard = lazy(() => 
  import('../reports/ProjectsDashboard').then(module => ({
    default: module.default || module.ProjectsDashboard
  }))
);

/**
 * Lazy load QualityControlDashboard with charts
 */
export const QualityControlDashboard = lazy(() => 
  import('../quality/QualityControlDashboard').then(module => ({
    default: module.default || module.QualityControlDashboard
  }))
);

// ============================================================================
// WRAPPED COMPONENTS WITH SUSPENSE BOUNDARIES
// ============================================================================

/**
 * AnalyticsCharts with loading state
 */
export function LazyAnalyticsCharts(props: Record<string, unknown>) {
  return (
    <Suspense fallback={<ChartSkeleton title="جارٍ تحميل الرسوم البيانية..." items={6} />}>
      <AnalyticsCharts {...props} />
    </Suspense>
  );
}

/**
 * FinancialAnalytics with loading state
 */
export function LazyFinancialAnalytics(props: Record<string, unknown>) {
  return (
    <Suspense fallback={<ChartSkeleton title="جارٍ تحميل التحليلات المالية..." items={5} />}>
      <FinancialAnalytics {...props} />
    </Suspense>
  );
}

/**
 * EVMDashboard with loading state
 */
export function LazyEVMDashboard(props: Record<string, unknown>) {
  return (
    <Suspense fallback={<ChartSkeleton title="جارٍ تحميل لوحة القيمة المكتسبة..." items={4} />}>
      <EVMDashboard {...props} />
    </Suspense>
  );
}

/**
 * MonthlyExpensesChart with loading state
 */
export function LazyMonthlyExpensesChart(props: Record<string, unknown>) {
  return (
    <Suspense fallback={<CompactChartSkeleton />}>
      <MonthlyExpensesChart {...props} />
    </Suspense>
  );
}

/**
 * ProjectsDashboard with loading state
 */
export function LazyProjectsDashboard(props: Record<string, unknown>) {
  return (
    <Suspense fallback={<ChartSkeleton title="جارٍ تحميل لوحة المشاريع..." items={5} />}>
      <ProjectsDashboard {...props} />
    </Suspense>
  );
}

/**
 * QualityControlDashboard with loading state
 */
export function LazyQualityControlDashboard(props: Record<string, unknown>) {
  return (
    <Suspense fallback={<PieChartSkeleton title="جارٍ تحميل لوحة مراقبة الجودة..." />}>
      <QualityControlDashboard {...props} />
    </Suspense>
  );
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export { ChartSkeleton, PieChartSkeleton, CompactChartSkeleton } from './ChartSkeleton';
