/**
 * @fileoverview Tenders Pagination Component
 * @module components/TendersPagination
 *
 * Displays pagination controls for tender lists:
 * - Page info (current page / total pages)
 * - Page size selector (10, 20, 50, 100)
 * - Navigation buttons (previous/next)
 */

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TendersPaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

/**
 * Pagination component for tenders list
 */
export const TendersPagination: React.FC<TendersPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    onPageSizeChange(newSize)
    onPageChange(1) // Reset to first page
  }

  return (
    <div className="mt-6 flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-4">
      {/* Page Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          الصفحة {currentPage} من {totalPages}
        </span>
        <span className="text-xs">({totalItems} منافسة)</span>
      </div>

      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="pageSize" className="text-sm text-muted-foreground">
          عدد العناصر:
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="rounded-md border border-border/40 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="flex items-center gap-1 rounded-md border border-border/40 bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
          <span>السابق</span>
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 rounded-md border border-border/40 bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>التالي</span>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
