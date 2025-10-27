/**
 * ProjectFilterSection Component
 *
 * Search and filter controls for project list:
 * - Search by project name or client
 * - Filter by status
 * - Filter by client
 * - Clear filters button
 */

import React from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Search, X } from 'lucide-react'

interface ProjectFilterSectionProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusValue: string
  onStatusChange: (value: string) => void
  clientValue: string
  onClientChange: (value: string) => void
  clients: string[]
  onClearFilters: () => void
  isFiltering: boolean
}

export const ProjectFilterSection: React.FC<ProjectFilterSectionProps> = ({
  searchQuery,
  onSearchChange,
  statusValue,
  onStatusChange,
  clientValue,
  onClientChange,
  clients,
  onClearFilters,
  isFiltering,
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex w-full items-center md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="ابحث باسم المشروع أو العميل"
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusValue} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="حالة المشروع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">نشطة</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="paused">متوقفة</SelectItem>
              <SelectItem value="planning">قيد التخطيط</SelectItem>
              <SelectItem value="delayed">متأخرة</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientValue} onValueChange={onClientChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="كل العملاء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل العملاء</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            disabled={!isFiltering}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            مسح الفلاتر
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
