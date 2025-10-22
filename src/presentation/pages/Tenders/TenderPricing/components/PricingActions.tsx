/**
 * @fileoverview PricingActions Component
 * @description Action buttons for pricing page (Save, Export, etc.)
 */

import React from 'react'
import { Button } from '@/presentation/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/presentation/components/ui/dropdown-menu'
import {
  Save,
  Download,
  Upload,
  RotateCcw,
  Settings,
  FileText,
  Layers,
  ArrowLeft,
} from 'lucide-react'

interface PricingActionsProps {
  onSave?: () => void
  onExport?: () => void
  onImport?: () => void
  onRestore?: () => void
  onTemplate?: () => void
  onSettings?: () => void
  onBack?: () => void
  isSaving?: boolean
  isDirty?: boolean
  className?: string
}

export const PricingActions: React.FC<PricingActionsProps> = ({
  onSave,
  onExport,
  onImport,
  onRestore,
  onTemplate,
  onSettings: _onSettings,
  onBack,
  isSaving = false,
  isDirty = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Back Button */}
      {onBack && (
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 ml-2" />
          رجوع
        </Button>
      )}

      {/* Save Button */}
      {onSave && (
        <Button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          size="sm"
          variant={isDirty ? 'default' : 'outline'}
        >
          <Save className="h-4 w-4 ml-2" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      )}

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 ml-2" />
            المزيد
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {onTemplate && (
            <DropdownMenuItem onClick={onTemplate}>
              <Layers className="h-4 w-4 ml-2" />
              إدارة القوالب
            </DropdownMenuItem>
          )}

          {onRestore && (
            <DropdownMenuItem onClick={onRestore}>
              <RotateCcw className="h-4 w-4 ml-2" />
              استعادة نسخة احتياطية
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {onExport && (
            <DropdownMenuItem onClick={onExport}>
              <Download className="h-4 w-4 ml-2" />
              تصدير Excel
            </DropdownMenuItem>
          )}

          {onImport && (
            <DropdownMenuItem onClick={onImport}>
              <Upload className="h-4 w-4 ml-2" />
              استيراد Excel
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <FileText className="h-4 w-4 ml-2" />
            طباعة التقرير
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
