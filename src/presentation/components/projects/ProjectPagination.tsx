/**
 * ProjectPagination Component
 *
 * Pagination controls with:
 * - Results count display
 * - Previous/Next navigation
 * - Page number buttons
 * - Items per page selector
 */

import React from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'

interface ProjectPaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export const ProjectPagination: React.FC<ProjectPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const showingFrom = (currentPage - 1) * pageSize + 1
  const showingTo = Math.min(currentPage * pageSize, totalItems)

  if (totalPages <= 1) return null

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm">
        <div className="text-muted-foreground">
          عرض {showingFrom} - {showingTo} من {totalItems} مشروع
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            السابق
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            التالي
          </Button>
        </div>

        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            onPageSizeChange(Number(value))
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 عناصر في الصفحة</SelectItem>
            <SelectItem value="25">25 عنصراً</SelectItem>
            <SelectItem value="50">50 عنصراً</SelectItem>
            <SelectItem value="100">100 عنصر</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
