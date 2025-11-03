/**
 * @fileoverview Virtual scrolling for large tender lists
 * @module components/tenders/VirtualizedTenderList
 *
 * Uses react-window for efficient rendering of large lists
 * Provides smooth scrolling and reduced memory usage
 */

import { memo, CSSProperties } from 'react'
import { FixedSizeList as List } from 'react-window'
import type { Tender } from '@/data/centralData'
import { EnhancedTenderCard } from './EnhancedTenderCard'

interface VirtualizedTenderListProps {
  items: Tender[]
  itemHeight?: number
  height?: number
  width?: string | number
  onOpenDetails?: (tender: Tender) => void
  onStartPricing?: (tender: Tender) => void
  onSubmitTender?: (tender: Tender) => void
  onEdit?: (tender: Tender) => void
  onDelete?: (tender: Tender) => void
  onOpenResults?: (tender: Tender) => void
  onRevertStatus?: (tender: Tender, newStatus: Tender['status']) => void
  formatCurrencyValue: (amount: string | number | null | undefined) => string
  isLoading?: boolean
}

const ITEM_HEIGHT = 550
const LIST_HEIGHT = 800

interface RowProps {
  index: number
  style: CSSProperties
}

/**
 * Virtual list row component
 */
const Row = memo(
  ({
    index,
    style,
    items,
    onOpenDetails,
    onStartPricing,
    onSubmitTender,
    onEdit,
    onDelete,
    onOpenResults,
    onRevertStatus,
    formatCurrencyValue,
  }: RowProps & {
    items: Tender[]
    onOpenDetails?: (tender: Tender) => void
    onStartPricing?: (tender: Tender) => void
    onSubmitTender?: (tender: Tender) => void
    onEdit?: (tender: Tender) => void
    onDelete?: (tender: Tender) => void
    onOpenResults?: (tender: Tender) => void
    onRevertStatus?: (tender: Tender, newStatus: Tender['status']) => void
    formatCurrencyValue: (amount: string | number | null | undefined) => string
  }) => {
    const item = items[index]
    if (!item) return null

    return (
      <div key={item.id} className="px-2 py-1" style={style}>
        <EnhancedTenderCard
          tender={item}
          index={index}
          formatCurrencyValue={formatCurrencyValue}
          onOpenDetails={onOpenDetails ?? (() => {})}
          onStartPricing={onStartPricing ?? (() => {})}
          onSubmitTender={onSubmitTender ?? (() => {})}
          onEdit={onEdit ?? (() => {})}
          onDelete={onDelete ?? (() => {})}
          onOpenResults={onOpenResults}
          onRevertStatus={onRevertStatus}
        />
      </div>
    )
  },
)

Row.displayName = 'VirtualRow'

/**
 * Virtualized tender list using react-window
 * Efficiently renders large lists by only rendering visible items
 */
export const VirtualizedTenderList = memo(
  ({
    items,
    itemHeight = ITEM_HEIGHT,
    height = LIST_HEIGHT,
    width = '100%',
    onOpenDetails,
    onStartPricing,
    onSubmitTender,
    onEdit,
    onDelete,
    onOpenResults,
    onRevertStatus,
    formatCurrencyValue,
    isLoading,
  }: VirtualizedTenderListProps) => {
    // Show fallback for small lists or loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted">
          <div className="text-muted-foreground">جاري التحميل...</div>
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted">
          <div className="text-muted-foreground">لا توجد منافسات للعرض</div>
        </div>
      )
    }

    // Use normal list for small datasets (up to 100 items for better UX)
    if (items.length < 100) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <EnhancedTenderCard
              key={item.id}
              tender={item}
              index={index}
              formatCurrencyValue={formatCurrencyValue}
              onOpenDetails={onOpenDetails ?? (() => {})}
              onStartPricing={onStartPricing ?? (() => {})}
              onSubmitTender={onSubmitTender ?? (() => {})}
              onEdit={onEdit ?? (() => {})}
              onDelete={onDelete ?? (() => {})}
              onOpenResults={onOpenResults}
              onRevertStatus={onRevertStatus}
            />
          ))}
        </div>
      )
    }

    // Use virtual scrolling for large datasets
    return (
      <List
        height={typeof height === 'string' ? 600 : height}
        itemCount={items.length}
        itemSize={itemHeight}
        width={width}
      >
        {(rowProps: RowProps) => (
          <Row
            {...rowProps}
            items={items}
            onOpenDetails={onOpenDetails}
            onStartPricing={onStartPricing}
            onSubmitTender={onSubmitTender}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenResults={onOpenResults}
            onRevertStatus={onRevertStatus}
            formatCurrencyValue={formatCurrencyValue}
          />
        )}
      </List>
    )
  },
)

VirtualizedTenderList.displayName = 'VirtualizedTenderList'
