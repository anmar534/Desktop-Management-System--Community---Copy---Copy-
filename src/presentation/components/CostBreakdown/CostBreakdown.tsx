/**
 * @fileoverview Cost breakdown component
 * @module components/CostBreakdown
 *
 * Displays detailed cost breakdown with categories and percentages
 * Used for BOQ analysis and financial summaries
 */

import React from 'react'
import { useQuantityFormatter } from '../../../application/hooks/useQuantityFormatter'

/**
 * Cost category
 */
export interface CostCategory {
  /** Category ID */
  id: string

  /** Category label */
  label: string

  /** Category amount */
  amount: number

  /** Category color (for visual distinction) */
  color?: string

  /** Category icon */
  icon?: React.ReactNode

  /** Category description */
  description?: string

  /** Sub-categories */
  children?: CostCategory[]
}

/**
 * CostBreakdown props
 */
export interface CostBreakdownProps {
  /** Cost categories */
  categories: CostCategory[]

  /** Total amount (for percentage calculation) */
  total: number

  /** Show percentages */
  showPercentages?: boolean

  /** Show progress bars */
  showProgressBars?: boolean

  /** Show amounts */
  showAmounts?: boolean

  /** Expandable categories */
  expandable?: boolean

  /** Initially expanded category IDs */
  defaultExpanded?: string[]

  /** Component title */
  title?: string

  /** Empty state message */
  emptyMessage?: string

  /** Compact mode */
  compact?: boolean

  /** Custom CSS class */
  className?: string

  /** Category click handler */
  onCategoryClick?: (category: CostCategory) => void
}

/**
 * CostBreakdown Component
 *
 * Displays cost breakdown with categories and percentages
 *
 * @example
 * ```tsx
 * const categories: CostCategory[] = [
 *   { id: '1', label: 'مواد', amount: 50000 },
 *   { id: '2', label: 'عمالة', amount: 30000 },
 *   { id: '3', label: 'معدات', amount: 20000 }
 * ];
 *
 * <CostBreakdown
 *   categories={categories}
 *   total={100000}
 *   showPercentages
 *   showProgressBars
 * />
 * ```
 */
export function CostBreakdown({
  categories,
  total,
  showPercentages = true,
  showProgressBars = true,
  showAmounts = true,
  expandable = true,
  defaultExpanded = [],
  title = 'تفصيل التكاليف',
  emptyMessage = 'لا توجد تكاليف',
  compact = false,
  className = '',
  onCategoryClick,
}: CostBreakdownProps) {
  const formatter = useQuantityFormatter()
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(defaultExpanded))

  /**
   * Calculate percentage
   */
  const calculatePercentage = (amount: number): number => {
    if (total === 0) return 0
    return (amount / total) * 100
  }

  /**
   * Toggle category expansion
   */
  const toggleExpanded = (categoryId: string) => {
    if (!expandable) return

    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  /**
   * Handle category click
   */
  const handleCategoryClick = (category: CostCategory, event: React.MouseEvent) => {
    // Toggle if has children
    if (category.children && category.children.length > 0) {
      toggleExpanded(category.id)
    }

    // Call custom handler
    if (onCategoryClick) {
      onCategoryClick(category)
    }

    event.stopPropagation()
  }

  /**
   * Render category item
   */
  const renderCategory = (category: CostCategory, level = 0): React.ReactNode => {
    const percentage = calculatePercentage(category.amount)
    const isExpanded = expandedIds.has(category.id)
    const hasChildren = category.children && category.children.length > 0

    return (
      <div key={category.id} className="cost-breakdown-category" data-level={level}>
        <div
          className={[
            'cost-breakdown-category-header',
            hasChildren && expandable && 'cost-breakdown-category-header--expandable',
            isExpanded && 'cost-breakdown-category-header--expanded',
            onCategoryClick && 'cost-breakdown-category-header--clickable',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={(e) => handleCategoryClick(category, e)}
          style={{ paddingLeft: `${level * 20}px` }}
          title={category.description}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && expandable && (
            <span className="cost-breakdown-category-toggle">{isExpanded ? '▼' : '▶'}</span>
          )}

          {/* Category Icon */}
          {category.icon && <span className="cost-breakdown-category-icon">{category.icon}</span>}

          {/* Category Label */}
          <span className="cost-breakdown-category-label">{category.label}</span>

          {/* Category Values */}
          <div className="cost-breakdown-category-values">
            {showPercentages && (
              <span className="cost-breakdown-category-percentage">
                {formatter.formatPercentage(percentage, { decimals: 1 })}
              </span>
            )}

            {showAmounts && (
              <span className="cost-breakdown-category-amount">
                {formatter.formatCurrency(category.amount)}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {showProgressBars && (
          <div className="cost-breakdown-category-progress">
            <div
              className="cost-breakdown-category-progress-bar"
              style={{
                width: `${percentage}%`,
                backgroundColor: category.color || '#3b82f6',
              }}
            />
          </div>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="cost-breakdown-category-children">
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  /**
   * Component CSS classes
   */
  const componentClasses = ['cost-breakdown', compact && 'cost-breakdown--compact', className]
    .filter(Boolean)
    .join(' ')

  /**
   * Render empty state
   */
  if (categories.length === 0) {
    return (
      <div className={componentClasses}>
        {title && <h3 className="cost-breakdown-title">{title}</h3>}
        <div className="cost-breakdown-empty">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className={componentClasses}>
      {title && <h3 className="cost-breakdown-title">{title}</h3>}

      <div className="cost-breakdown-categories">
        {categories.map((category) => renderCategory(category))}
      </div>

      {/* Total Row */}
      <div className="cost-breakdown-total">
        <span className="cost-breakdown-total-label">الإجمالي</span>
        <span className="cost-breakdown-total-value">{formatter.formatCurrency(total)}</span>
      </div>
    </div>
  )
}

export default CostBreakdown
