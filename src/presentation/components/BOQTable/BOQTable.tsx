/**
 * @fileoverview Reusable BOQ table component
 * @module components/BOQTable
 *
 * Generic table component for displaying Bill of Quantities (BOQ) items
 * with formatting, sorting, and selection support
 */

import React, { useMemo } from 'react'
import { useQuantityFormatter } from '../../../application/hooks/useQuantityFormatter'

/**
 * Column configuration
 */
export interface BOQColumn<T = unknown> {
  /** Column key (must match data property) */
  key: string

  /** Column header label */
  label: string

  /** Column width (CSS value) */
  width?: string

  /** Text alignment */
  align?: 'left' | 'center' | 'right'

  /** Format type for automatic formatting */
  format?: 'number' | 'currency' | 'percentage' | 'quantity'

  /** Decimal places for formatting */
  decimals?: number

  /** Is column sortable */
  sortable?: boolean

  /** Custom render function */
  render?: (value: unknown, row: T, index: number) => React.ReactNode
}

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Column key to sort by */
  key: string

  /** Sort direction */
  direction: 'asc' | 'desc'
}

/**
 * BOQTable props
 */
export interface BOQTableProps<T = unknown> {
  /** Table data */
  data: T[]

  /** Column definitions */
  columns: BOQColumn<T>[]

  /** Current sort configuration */
  sortConfig?: SortConfig

  /** Sort change handler */
  onSortChange?: (config: SortConfig) => void

  /** Row selection enabled */
  selectable?: boolean

  /** Selected row keys */
  selectedKeys?: Set<string | number>

  /** Selection change handler */
  onSelectionChange?: (keys: Set<string | number>) => void

  /** Row key extractor */
  getRowKey?: (row: T, index: number) => string | number

  /** Row click handler */
  onRowClick?: (row: T, index: number) => void

  /** Empty state message */
  emptyMessage?: string

  /** Loading state */
  loading?: boolean

  /** Table CSS classes */
  className?: string

  /** Enable hover effect */
  hoverable?: boolean

  /** Enable striped rows */
  striped?: boolean

  /** Compact mode (smaller padding) */
  compact?: boolean
}

/**
 * BOQTable Component
 *
 * Reusable table component for displaying BOQ data with formatting and sorting
 *
 * @example
 * ```tsx
 * const columns: BOQColumn[] = [
 *   { key: 'code', label: 'رمز البند', width: '120px', sortable: true },
 *   { key: 'description', label: 'الوصف', sortable: true },
 *   { key: 'quantity', label: 'الكمية', format: 'quantity', align: 'right' },
 *   { key: 'unitPrice', label: 'سعر الوحدة', format: 'currency', align: 'right' },
 *   { key: 'total', label: 'الإجمالي', format: 'currency', align: 'right', sortable: true }
 * ];
 *
 * <BOQTable
 *   data={boqItems}
 *   columns={columns}
 *   sortConfig={sortConfig}
 *   onSortChange={handleSort}
 * />
 * ```
 */
export function BOQTable<T = Record<string, unknown>>({
  data,
  columns,
  sortConfig,
  onSortChange,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  getRowKey = (_, index) => index,
  onRowClick,
  emptyMessage = 'لا توجد بيانات',
  loading = false,
  className = '',
  hoverable = true,
  striped = false,
  compact = false,
}: BOQTableProps<T>) {
  const formatter = useQuantityFormatter()

  /**
   * Get formatted cell value
   */
  const getFormattedValue = (
    column: BOQColumn<T>,
    value: unknown,
    row: T,
    index: number,
  ): React.ReactNode => {
    if (value === null || value === undefined) {
      return '-'
    }

    // Use custom render if provided
    if (column.render) {
      return column.render(value, row, index)
    }

    // Apply format
    const numValue = typeof value === 'number' ? value : Number(value)
    const options = { decimals: column.decimals }

    switch (column.format) {
      case 'currency':
        return formatter.formatCurrency(numValue, options)
      case 'percentage':
        return formatter.formatPercentage(numValue, options)
      case 'quantity':
      case 'number':
        return formatter.formatQuantity(numValue, options)
      default:
        return String(value)
    }
  }

  /**
   * Handle column header click (for sorting)
   */
  const handleHeaderClick = (column: BOQColumn<T>) => {
    if (!column.sortable || !onSortChange) return

    const newDirection =
      sortConfig?.key === column.key && sortConfig.direction === 'asc' ? 'desc' : 'asc'

    onSortChange({ key: column.key, direction: newDirection })
  }

  /**
   * Handle select all checkbox
   */
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return

    if (checked) {
      const allKeys = new Set(data.map((row, index) => getRowKey(row, index)))
      onSelectionChange(allKeys)
    } else {
      onSelectionChange(new Set())
    }
  }

  /**
   * Handle row selection
   */
  const handleRowSelect = (row: T, index: number, checked: boolean) => {
    if (!onSelectionChange) return

    const key = getRowKey(row, index)
    const newSelection = new Set(selectedKeys)

    if (checked) {
      newSelection.add(key)
    } else {
      newSelection.delete(key)
    }

    onSelectionChange(newSelection)
  }

  /**
   * Check if all rows are selected
   */
  const isAllSelected = useMemo(() => {
    return data.length > 0 && data.every((row, index) => selectedKeys.has(getRowKey(row, index)))
  }, [data, selectedKeys, getRowKey])

  /**
   * Check if some (but not all) rows are selected
   */
  const isSomeSelected = useMemo(() => {
    return selectedKeys.size > 0 && !isAllSelected
  }, [selectedKeys.size, isAllSelected])

  /**
   * Table CSS classes
   */
  const tableClasses = [
    'boq-table',
    hoverable && 'boq-table--hoverable',
    striped && 'boq-table--striped',
    compact && 'boq-table--compact',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="boq-table-loading">
        <div className="boq-table-spinner" />
        <p>جاري التحميل...</p>
      </div>
    )
  }

  /**
   * Render empty state
   */
  if (data.length === 0) {
    return (
      <div className="boq-table-empty">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="boq-table-wrapper">
      <table className={tableClasses}>
        <thead>
          <tr>
            {selectable && (
              <th className="boq-table-cell--checkbox">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isSomeSelected
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="تحديد الكل"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={[
                  'boq-table-header',
                  column.sortable && 'boq-table-header--sortable',
                  column.align && `boq-table-cell--${column.align}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ width: column.width }}
                onClick={() => handleHeaderClick(column)}
              >
                <span className="boq-table-header-content">
                  {column.label}
                  {column.sortable && sortConfig?.key === column.key && (
                    <span className="boq-table-sort-icon">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => {
            const rowKey = getRowKey(row, rowIndex)
            const isSelected = selectedKeys.has(rowKey)

            return (
              <tr
                key={rowKey}
                className={[
                  'boq-table-row',
                  isSelected && 'boq-table-row--selected',
                  onRowClick && 'boq-table-row--clickable',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {selectable && (
                  <td className="boq-table-cell boq-table-cell--checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleRowSelect(row, rowIndex, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`تحديد الصف ${rowIndex + 1}`}
                    />
                  </td>
                )}
                {columns.map((column) => {
                  const value = (row as Record<string, unknown>)[column.key]
                  const formattedValue = getFormattedValue(column, value, row, rowIndex)

                  return (
                    <td
                      key={column.key}
                      className={[
                        'boq-table-cell',
                        column.align && `boq-table-cell--${column.align}`,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
