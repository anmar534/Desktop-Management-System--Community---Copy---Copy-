import React from 'react'
import type { EditableTenderPricingResult } from '@/application/hooks/useEditableTenderPricing'
import type { PricingData } from '@/shared/types/pricing'
import type { TenderWithPricingSources } from '@/presentation/pages/Tenders/TenderPricing/types'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/presentation/components/ui/dropdown-menu'
import { ConfirmationDialog } from '@/presentation/components/ui/confirmation-dialog'
import { confirmationMessages } from '@/shared/config/confirmationMessages'
import {
  ArrowRight,
  CheckCircle,
  Settings,
  Layers,
  Save,
  RotateCcw,
  Download,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

interface PricingHeaderProps {
  tender: TenderWithPricingSources
  editablePricing: EditableTenderPricingResult
  pricingData: Map<string, PricingData>
  quantityItemsCount: number
  onBack: () => void
  onTemplateManagerOpen: () => void
  onSaveCurrentItem: () => void
  onCreateBackup: () => Promise<void>
  onRestoreBackupOpen: () => void
  onExportToExcel: () => void
  onUpdateStatus: () => void
  recordAudit: (
    level: string,
    action: string,
    metadata?: Record<string, unknown>,
    status?: string,
  ) => void
  getErrorMessage: (error: unknown) => string
}

export const PricingHeader: React.FC<PricingHeaderProps> = ({
  tender,
  editablePricing,
  pricingData,
  quantityItemsCount,
  onBack,
  onTemplateManagerOpen,
  onSaveCurrentItem,
  onCreateBackup,
  onRestoreBackupOpen,
  onExportToExcel,
  onUpdateStatus,
  recordAudit,
  getErrorMessage,
}) => {
  const completedCount = Array.from(pricingData.values()).filter((value) => value?.completed).length
  const completionPercentage =
    quantityItemsCount > 0 ? Math.round((completedCount / quantityItemsCount) * 100) : 0

  return (
    <div className="flex items-center gap-3 mb-4 sticky top-0 bg-background/80 backdrop-blur z-20 py-2 border-b">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={onBack}
        className="flex items-center gap-2 hover:bg-muted/30"
      >
        <ArrowRight className="w-4 h-4" />
        العودة
      </Button>

      {/* Title and Status */}
      <div className="flex-1">
        <h1 className="text-xl font-bold text-foreground">عملية التسعير</h1>
        <p className="text-muted-foreground text-sm">
          {tender.name || tender.title || 'منافسة جديدة'}
        </p>

        {/* Status Badges */}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          {editablePricing.source === 'official' && (
            <Badge className="bg-success text-success-foreground hover:bg-success/90">
              نسخة رسمية معتمدة
            </Badge>
          )}
          {editablePricing.source === 'draft' && editablePricing.isDraftNewer && (
            <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">
              مسودة أحدث (غير معتمدة)
            </Badge>
          )}
          {editablePricing.hasDraft &&
            !editablePricing.isDraftNewer &&
            editablePricing.source === 'official' && (
              <Badge variant="secondary" className="bg-muted/30 text-muted-foreground">
                مسودة محفوظة
              </Badge>
            )}
          {editablePricing.dirty && (
            <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse">
              تغييرات غير محفوظة رسمياً
            </Badge>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {/* Templates Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onTemplateManagerOpen}
          className="flex items-center gap-2"
        >
          <Layers className="w-4 h-4" />
          القوالب
        </Button>

        {/* Approve Official Button */}
        <ConfirmationDialog
          title={confirmationMessages.approveOfficial.title}
          description={confirmationMessages.approveOfficial.description}
          confirmText={confirmationMessages.approveOfficial.confirmText}
          cancelText={confirmationMessages.approveOfficial.cancelText}
          variant="success"
          icon="confirm"
          onConfirm={async () => {
            try {
              await editablePricing.saveOfficial()
              toast.success('تم اعتماد التسعير رسمياً', { duration: 2500 })
            } catch (error) {
              recordAudit(
                'error',
                'official-save-failed',
                {
                  message: getErrorMessage(error),
                },
                'error',
              )
              toast.error('فشل اعتماد النسخة الرسمية')
            }
          }}
          trigger={
            <Button
              size="sm"
              className="flex items-center gap-2 bg-success text-success-foreground hover:bg-success/90"
              disabled={
                editablePricing.status !== 'ready' ||
                (!editablePricing.dirty &&
                  !editablePricing.isDraftNewer &&
                  editablePricing.source === 'official')
              }
            >
              <CheckCircle className="w-4 h-4" />
              اعتماد
            </Button>
          }
        />

        {/* Progress Indicator */}
        <div className="px-3 py-1.5 rounded-md border border-info/30 bg-gradient-to-l from-info/20 to-success/20 text-xs text-info flex flex-col items-center leading-tight">
          <span className="font-bold">{completionPercentage}%</span>
          <span className="text-xs leading-none">
            {completedCount}/{quantityItemsCount}
          </span>
        </div>

        {/* Tools Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              أدوات
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* Save Item */}
            <ConfirmationDialog
              title={confirmationMessages.saveItem.title}
              description={confirmationMessages.saveItem.description}
              confirmText={confirmationMessages.saveItem.confirmText}
              cancelText={confirmationMessages.saveItem.cancelText}
              variant="success"
              icon="save"
              onConfirm={onSaveCurrentItem}
              trigger={
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Save className="w-4 h-4 text-success" /> حفظ تسعير البند
                </DropdownMenuItem>
              }
            />
            <DropdownMenuSeparator />

            {/* Create Backup */}
            <ConfirmationDialog
              title="إنشاء نسخة احتياطية"
              description="سيتم حفظ نسخة احتياطية من حالة التسعير الحالية (يتم الاحتفاظ بآخر 10 فقط). هل تريد المتابعة؟"
              confirmText="نعم، إنشاء نسخة"
              cancelText="إلغاء"
              variant="success"
              icon="save"
              onConfirm={() => {
                void onCreateBackup()
              }}
              trigger={
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <RotateCcw className="w-4 h-4 text-info" /> إنشاء نسخة احتياطية
                </DropdownMenuItem>
              }
            />

            {/* Restore Backup */}
            <DropdownMenuItem
              onClick={onRestoreBackupOpen}
              className="flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-info" /> استرجاع نسخة
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Export */}
            <DropdownMenuLabel>التصدير</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onExportToExcel}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-success" /> تصدير Excel
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Update Status */}
            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                onUpdateStatus()
                toast.success('تم تحديث حالة المنافسة')
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-secondary" /> تحديث الحالة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
