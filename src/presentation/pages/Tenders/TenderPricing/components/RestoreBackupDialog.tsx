import React from 'react'
import type { TenderBackupEntry } from '@/shared/types/pricing'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import { RotateCcw } from 'lucide-react'
import { formatDateValue } from '@/shared/utils/formatters/formatters'

interface RestoreBackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backupsList: TenderBackupEntry[]
  onLoadBackupsList: () => Promise<void>
  onRestoreBackup: (backupId: string) => Promise<void>
  formatCurrencyValue: (
    amount: number,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
  ) => string
  formatTimestamp: (timestamp: string | number | Date | null | undefined) => string
}

export const RestoreBackupDialog: React.FC<RestoreBackupDialogProps> = ({
  open,
  onOpenChange,
  backupsList,
  onLoadBackupsList,
  onRestoreBackup,
  formatCurrencyValue,
  formatTimestamp,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(openState) => {
        onOpenChange(openState)
        if (openState) void onLoadBackupsList()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>استرجاع نسخة احتياطية</DialogTitle>
          <DialogDescription>اختر نسخة لاسترجاع بيانات التسعير.</DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-auto mt-2 space-y-2" dir="rtl">
          {backupsList.length === 0 && (
            <EmptyState
              icon={RotateCcw}
              title="لا توجد نسخ احتياطية"
              description="لم يتم إنشاء أي نسخ احتياطية لهذه المنافسة بعد."
            />
          )}
          {backupsList.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between border border-border rounded p-2"
            >
              <div className="text-sm">
                <div className="font-medium">{formatTimestamp(b.timestamp)}</div>
                <div className="text-muted-foreground">
                  نسبة الإكمال: {Math.round(b.completionPercentage)}% • الإجمالي:{' '}
                  {formatCurrencyValue(b.totalValue, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  العناصر المسعرة: {b.itemsPriced}/{b.itemsTotal}
                  {b.retentionExpiresAt
                    ? ` • الاحتفاظ حتى ${formatDateValue(b.retentionExpiresAt, {
                        locale: 'ar-SA',
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                      })}`
                    : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => onRestoreBackup(b.id)}>
                  استرجاع
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button variant="outline">إغلاق</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
