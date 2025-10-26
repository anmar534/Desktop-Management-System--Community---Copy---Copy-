import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'
import { Trash2, Save, Edit3, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface ConfirmationDialogProps {
  title: string
  description: string
  onConfirm: () => void
  onCancel?: () => void
  trigger?: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  icon?: 'delete' | 'save' | 'edit' | 'confirm' | 'warning'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const iconMap = {
  delete: Trash2,
  save: Save,
  edit: Edit3,
  confirm: Check,
  warning: AlertTriangle,
}

const variantStyles = {
  default: {
    icon: 'text-primary',
    button: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  destructive: {
    icon: 'text-destructive',
    button: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  success: {
    icon: 'text-success',
    button: 'bg-success text-success-foreground hover:bg-success/90',
  },
  warning: {
    icon: 'text-warning',
    button: 'bg-warning text-warning-foreground hover:bg-warning/90',
  },
}

export function ConfirmationDialog({
  title,
  description,
  onConfirm,
  onCancel,
  trigger,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'default',
  icon = 'confirm',
  open,
  onOpenChange,
}: ConfirmationDialogProps) {
  const Icon = iconMap[icon]
  const styles = variantStyles[variant]

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-full',
                variant === 'destructive' && 'bg-destructive/10',
                variant === 'success' && 'bg-success/10',
                variant === 'warning' && 'bg-warning/10',
                variant === 'default' && 'bg-primary/10',
              )}
            >
              <Icon className={cn('h-5 w-5', styles.icon)} />
            </div>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onCancel} className="bg-muted hover:bg-muted/80">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={cn(styles.button)}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// رسائل تأكيدية جاهزة للاستخدام
export const DeleteConfirmation = ({
  itemName,
  onConfirm,
  trigger,
  open,
  onOpenChange,
}: {
  itemName: string
  onConfirm: () => void
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => (
  <ConfirmationDialog
    title="تأكيد الحذف"
    description={`هل أنت متأكد من حذف "${itemName}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
    onConfirm={onConfirm}
    trigger={trigger}
    variant="destructive"
    icon="delete"
    confirmText="حذف"
    cancelText="إلغاء"
    open={open}
    onOpenChange={onOpenChange}
  />
)

export const SaveConfirmation = ({
  onConfirm,
  trigger,
  open,
  onOpenChange,
}: {
  onConfirm: () => void
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => (
  <ConfirmationDialog
    title="حفظ التغييرات"
    description="هل تريد حفظ التغييرات التي أجريتها؟"
    onConfirm={onConfirm}
    trigger={trigger}
    variant="success"
    icon="save"
    confirmText="حفظ"
    cancelText="إلغاء"
    open={open}
    onOpenChange={onOpenChange}
  />
)

export const EditConfirmation = ({
  itemName,
  onConfirm,
  trigger,
  open,
  onOpenChange,
}: {
  itemName: string
  onConfirm: () => void
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => (
  <ConfirmationDialog
    title="تحرير البيانات"
    description={`هل تريد تحرير "${itemName}"؟`}
    onConfirm={onConfirm}
    trigger={trigger}
    variant="default"
    icon="edit"
    confirmText="تحرير"
    cancelText="إلغاء"
    open={open}
    onOpenChange={onOpenChange}
  />
)
