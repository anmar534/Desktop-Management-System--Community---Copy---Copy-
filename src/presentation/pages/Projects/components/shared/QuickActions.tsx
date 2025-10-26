/**
 * 🎯 Quick Actions Component
 * Displays action buttons for project operations (edit, delete, export)
 *
 * @module QuickActions
 */

import { Button } from '@/presentation/components/ui/button'
import { Edit, Trash2, Download } from 'lucide-react'

export interface QuickActionsProps {
  onEdit: () => void
  onDelete: () => void
  onExport?: () => void
  showExport?: boolean
  editLabel?: string
  deleteLabel?: string
  exportLabel?: string
}

export function QuickActions({
  onEdit,
  onDelete,
  onExport,
  showExport = false,
  editLabel = 'تعديل',
  deleteLabel = 'حذف',
  exportLabel = 'تصدير',
}: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
        <Edit className="h-4 w-4" />
        {editLabel}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 className="h-4 w-4" />
        {deleteLabel}
      </Button>

      {showExport && onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
          <Download className="h-4 w-4" />
          {exportLabel}
        </Button>
      )}
    </div>
  )
}
