/**
 * @fileoverview Financial summary card component
 * @module components/FinancialSummaryCard
 *
 * Reusable card component for displaying financial metrics and summaries.
 * Can be used across multiple pages (tender details, pricing, reports).
 * Integrates with useQuantityFormatter for consistent number formatting.
 */

import { useMemo } from 'react'
import { useQuantityFormatter } from '../../../application/hooks/useQuantityFormatter'
import './FinancialSummaryCard.css'

/**
 * Financial metric item
 */
export interface FinancialMetric {
  /** Metric identifier */
  id: string
  /** Metric label */
  label: string
  /** Metric value */
  value: number
  /** Value type (currency, percentage, number) */
  type?: 'currency' | 'percentage' | 'number'
  /** Metric description/tooltip */
  description?: string
  /** Icon or emoji */
  icon?: string
  /** Highlight this metric */
  highlighted?: boolean
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral'
  /** Comparison value (for showing change) */
  previousValue?: number
}

/**
 * Props for FinancialSummaryCard component
 */
export interface FinancialSummaryCardProps {
  /** Card title */
  title: string
  /** Financial metrics to display */
  metrics: FinancialMetric[]
  /** Card subtitle/description */
  subtitle?: string
  /** Show trend indicators */
  showTrends?: boolean
  /** Show comparison values */
  showComparison?: boolean
  /** Compact mode */
  compact?: boolean
  /** Card variant */
  variant?: 'default' | 'outlined' | 'elevated'
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Custom footer content */
  footer?: React.ReactNode
  /** Additional CSS class */
  className?: string
  /** Click handler for the card */
  onClick?: () => void
}

/**
 * FinancialSummaryCard Component
 *
 * Displays financial metrics in a card layout with formatting and trends.
 *
 * @example
 * ```tsx
 * const metrics = [
 *   { id: 'total', label: 'الإجمالي', value: 100000, type: 'currency', highlighted: true },
 *   { id: 'tax', label: 'الضريبة', value: 15000, type: 'currency' },
 *   { id: 'profit', label: 'الربح', value: 12.5, type: 'percentage', trend: 'up' },
 * ];
 *
 * <FinancialSummaryCard
 *   title="ملخص المنافسة"
 *   metrics={metrics}
 *   showTrends
 * />
 * ```
 */
export function FinancialSummaryCard({
  title,
  metrics,
  subtitle,
  showTrends = false,
  showComparison = false,
  compact = false,
  variant = 'default',
  loading = false,
  error,
  footer,
  className = '',
  onClick,
}: FinancialSummaryCardProps) {
  const formatter = useQuantityFormatter()

  /**
   * Format metric value based on type
   */
  const formatValue = (metric: FinancialMetric): string => {
    switch (metric.type) {
      case 'currency':
        return formatter.formatCurrency(metric.value)
      case 'percentage':
        return formatter.formatPercentage(metric.value)
      case 'number':
      default:
        return formatter.formatNumber(metric.value)
    }
  }

  /**
   * Calculate percentage change
   */
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  /**
   * Get trend icon
   */
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral'): string => {
    switch (trend) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      case 'neutral':
      default:
        return '→'
    }
  }

  /**
   * Get trend CSS class
   */
  const getTrendClass = (trend: 'up' | 'down' | 'neutral'): string => {
    return `financial-summary-card-metric-trend--${trend}`
  }

  /**
   * Build container CSS classes
   */
  const containerClasses = useMemo(
    () =>
      [
        'financial-summary-card',
        `financial-summary-card--${variant}`,
        compact && 'financial-summary-card--compact',
        loading && 'financial-summary-card--loading',
        error && 'financial-summary-card--error',
        onClick && 'financial-summary-card--clickable',
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [variant, compact, loading, error, onClick, className],
  )

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="financial-summary-card-loading">
          <div className="financial-summary-card-loading-spinner" />
          <div className="financial-summary-card-loading-text">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className={containerClasses}>
        <div className="financial-summary-card-error">
          <div className="financial-summary-card-error-icon">⚠</div>
          <div className="financial-summary-card-error-message">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      {...(onClick
        ? {
            role: 'button',
            tabIndex: 0,
          }
        : {})}
    >
      {/* Header */}
      <div className="financial-summary-card-header">
        <div className="financial-summary-card-header-content">
          <h3 className="financial-summary-card-title">{title}</h3>
          {subtitle && <p className="financial-summary-card-subtitle">{subtitle}</p>}
        </div>
      </div>

      {/* Metrics */}
      <div className="financial-summary-card-metrics">
        {metrics.map((metric) => {
          const change =
            showComparison && metric.previousValue !== undefined
              ? calculateChange(metric.value, metric.previousValue)
              : null

          return (
            <div
              key={metric.id}
              className={[
                'financial-summary-card-metric',
                metric.highlighted && 'financial-summary-card-metric--highlighted',
                compact && 'financial-summary-card-metric--compact',
              ]
                .filter(Boolean)
                .join(' ')}
              title={metric.description}
            >
              {/* Metric icon */}
              {metric.icon && (
                <div className="financial-summary-card-metric-icon">{metric.icon}</div>
              )}

              {/* Metric content */}
              <div className="financial-summary-card-metric-content">
                <div className="financial-summary-card-metric-label">{metric.label}</div>
                <div className="financial-summary-card-metric-value">{formatValue(metric)}</div>

                {/* Trend indicator */}
                {showTrends && metric.trend && (
                  <div
                    className={[
                      'financial-summary-card-metric-trend',
                      getTrendClass(metric.trend),
                    ].join(' ')}
                  >
                    {getTrendIcon(metric.trend)}
                  </div>
                )}

                {/* Comparison value */}
                {change !== null && (
                  <div
                    className={[
                      'financial-summary-card-metric-change',
                      change > 0
                        ? 'financial-summary-card-metric-change--positive'
                        : change < 0
                          ? 'financial-summary-card-metric-change--negative'
                          : 'financial-summary-card-metric-change--neutral',
                    ].join(' ')}
                  >
                    {change > 0 ? '+' : ''}
                    {formatter.formatPercentage(change)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {footer && <div className="financial-summary-card-footer">{footer}</div>}
    </div>
  )
}

export default FinancialSummaryCard
