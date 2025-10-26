/**
 * Reusable confirmation dialogs for tender operations
 */

import { Trash2, Send } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog'
import type { Tender } from '@/data/centralData'

interface TenderDeleteDialogProps {
  tender: Tender | null
  onConfirm: () => void
  onCancel: () => void
}

export function TenderDeleteDialog({ tender, onConfirm, onCancel }: TenderDeleteDialogProps) {
  return (
    <AlertDialog open={!!tender} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            تأكيد الحذف
          </AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من حذف المنافسة &quot;{tender?.name}&quot;؟ هذا الإجراء لا يمكن التراجع
            عنه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface TenderSubmitDialogProps {
  tender: Tender | null
  submissionPrice: number
  formatCurrency: (value: number) => string
  onConfirm: () => void
  onCancel: () => void
}

export function TenderSubmitDialog({
  tender,
  submissionPrice,
  formatCurrency,
  onConfirm,
  onCancel,
}: TenderSubmitDialogProps) {
  return (
    <AlertDialog open={!!tender} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-success" />
            تأكيد تقديم العرض
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>هل أنت متأكد من تقديم العرض للمنافسة &quot;{tender?.name}&quot;؟</p>

              {submissionPrice > 0 ? (
                <div className="rounded-lg border border-info/30 bg-info/10 p-3">
                  <p className="text-sm text-info font-medium">سيتم تلقائياً:</p>
                  <ul className="mt-1 space-y-1 text-xs text-info opacity-90">
                    <li>• تحديث حالة المنافسة إلى &ldquo;بانتظار النتائج&rdquo;</li>
                    <li>• إضافة مصروف كراسة المنافسة ({formatCurrency(submissionPrice)})</li>
                    <li>• تحديث إحصائيات المنافسات المقدمة</li>
                  </ul>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-sm text-muted-foreground">
                    سيتم تحديث حالة المنافسة إلى &ldquo;بانتظار النتائج&rdquo;
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            تأكيد التقديم
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
