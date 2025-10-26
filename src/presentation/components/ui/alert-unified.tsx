/**
 * Unified Alert Component
 *
 * مكون موحد للرسائل التحذيرية والتنبيهية
 * مستوحى من أفضل الممارسات في Procore وAutodesk ACC
 *
 * @version 1.0.0
 * @date 2025-10-08
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, AlertOctagon } from 'lucide-react'

// ============================================
// Alert Variants
// ============================================

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pr-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:right-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        success: 'bg-success/10 text-success border-success/30 [&>svg]:text-success',
        warning: 'bg-warning/10 text-warning-foreground border-warning/30 [&>svg]:text-warning',
        error: 'bg-error/10 text-error-foreground border-error/30 [&>svg]:text-error',
        info: 'bg-info/10 text-info-foreground border-info/30 [&>svg]:text-info',
        // Construction-specific status variants
        overdue:
          'bg-status-overdue/10 text-status-overdue border-status-overdue/30 [&>svg]:text-status-overdue',
        dueSoon:
          'bg-status-due-soon/10 text-foreground border-status-due-soon/30 [&>svg]:text-status-due-soon',
        onTrack:
          'bg-status-on-track/10 text-status-on-track border-status-on-track/30 [&>svg]:text-status-on-track',
      },
      size: {
        default: 'p-4',
        sm: 'p-3 text-sm',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

// ============================================
// Alert Props
// ============================================

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * إظهار/إخفاء أيقونة الحالة
   * @default true
   */
  showIcon?: boolean

  /**
   * إمكانية إغلاق التنبيه
   * @default false
   */
  dismissible?: boolean

  /**
   * دالة يتم استدعاؤها عند الإغلاق
   */
  onDismiss?: () => void

  /**
   * أيقونة مخصصة (بديل عن الأيقونة الافتراضية)
   */
  icon?: React.ReactNode
}

// ============================================
// Icon Mapping
// ============================================

const iconMap = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  overdue: AlertOctagon,
  dueSoon: AlertTriangle,
  onTrack: CheckCircle2,
}

// ============================================
// Alert Component
// ============================================

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      showIcon = true,
      dismissible = false,
      onDismiss,
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(true)

    const handleDismiss = () => {
      setIsVisible(false)
      onDismiss?.()
    }

    if (!isVisible) return null

    const IconComponent = variant ? iconMap[variant] : iconMap.default

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, size }), className)}
        {...props}
      >
        {showIcon && (
          <div className="absolute right-4 top-4">
            {icon ?? <IconComponent className="h-4 w-4" />}
          </div>
        )}
        <div className={cn(showIcon && 'pr-8', dismissible && 'pl-8')}>{children}</div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  },
)

Alert.displayName = 'Alert'

// ============================================
// Alert Title Component
// ============================================

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
)

AlertTitle.displayName = 'AlertTitle'

// ============================================
// Alert Description Component
// ============================================

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
))

AlertDescription.displayName = 'AlertDescription'

// ============================================
// Alert Banner (Full-Width Alert)
// ============================================

export interface AlertBannerProps extends AlertProps {
  /**
   * محاذاة المحتوى
   * @default "start"
   */
  align?: 'start' | 'center' | 'end'
}

const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  ({ className, align = 'start', ...props }, ref) => {
    const alignmentClasses = {
      start: 'justify-start text-right',
      center: 'justify-center text-center',
      end: 'justify-end text-left',
    }

    return (
      <Alert
        ref={ref}
        className={cn('rounded-none border-x-0 border-t-0', alignmentClasses[align], className)}
        {...props}
      />
    )
  },
)

AlertBanner.displayName = 'AlertBanner'

// ============================================
// Toast-like Alert (Auto-dismiss)
// ============================================

export interface ToastAlertProps extends AlertProps {
  /**
   * مدة العرض بالميلي ثانية قبل الإغلاق التلقائي
   * @default 5000
   */
  duration?: number

  /**
   * موضع العرض
   * @default "bottom-right"
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const ToastAlert = React.forwardRef<HTMLDivElement, ToastAlertProps>(
  ({ duration = 5000, position = 'bottom-right', onDismiss, className, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          onDismiss?.()
        }, duration)

        return () => clearTimeout(timer)
      }
    }, [duration, onDismiss])

    if (!isVisible) return null

    const positionClasses = {
      'top-right': 'fixed top-4 right-4 z-toast',
      'top-left': 'fixed top-4 left-4 z-toast',
      'bottom-right': 'fixed bottom-4 right-4 z-toast',
      'bottom-left': 'fixed bottom-4 left-4 z-toast',
    }

    return (
      <Alert
        ref={ref}
        dismissible
        onDismiss={() => {
          setIsVisible(false)
          onDismiss?.()
        }}
        className={cn(
          positionClasses[position],
          'max-w-md shadow-lg animate-slide-in-right',
          className,
        )}
        {...props}
      />
    )
  },
)

ToastAlert.displayName = 'ToastAlert'

// ============================================
// Status Alert (Project/Tender Status)
// ============================================

export interface StatusAlertProps extends Omit<AlertProps, 'variant'> {
  /**
   * حالة المشروع/المنافسة
   */
  status: 'overdue' | 'dueSoon' | 'onTrack' | 'completed'

  /**
   * عدد الأيام المتبقية (اختياري)
   */
  daysRemaining?: number
}

const StatusAlert = React.forwardRef<HTMLDivElement, StatusAlertProps>(
  ({ status, daysRemaining, children, ...props }, ref) => {
    const statusMessages = {
      overdue: 'متأخر',
      dueSoon: `يستحق خلال ${daysRemaining ?? ''} أيام`,
      onTrack: 'على المسار الصحيح',
      completed: 'مكتمل',
    }

    const variantMap = {
      overdue: 'overdue' as const,
      dueSoon: 'dueSoon' as const,
      onTrack: 'onTrack' as const,
      completed: 'success' as const,
    }

    return (
      <Alert ref={ref} variant={variantMap[status]} {...props}>
        <AlertTitle>{statusMessages[status]}</AlertTitle>
        {children && <AlertDescription>{children}</AlertDescription>}
      </Alert>
    )
  },
)

StatusAlert.displayName = 'StatusAlert'

// ============================================
// Exports
// ============================================

export { Alert, AlertTitle, AlertDescription, AlertBanner, ToastAlert, StatusAlert }
