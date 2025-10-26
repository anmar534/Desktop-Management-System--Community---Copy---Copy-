import type { ReactNode } from 'react'
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from './utils'

export type InlineAlertVariant = 'info' | 'success' | 'warning' | 'destructive' | 'neutral'

interface VariantStyle {
  container: string
  accent: string
  icon: ReactNode
}

const VARIANT_STYLES: Record<InlineAlertVariant, VariantStyle> = {
  info: {
    container: 'border-info/30 bg-info/10',
    accent: 'text-info',
    icon: <Info className="h-4 w-4" aria-hidden />,
  },
  success: {
    container: 'border-success/30 bg-success/10',
    accent: 'text-success',
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
  },
  warning: {
    container: 'border-warning/30 bg-warning/10',
    accent: 'text-warning',
    icon: <AlertTriangle className="h-4 w-4" aria-hidden />,
  },
  destructive: {
    container: 'border-error/30 bg-error/10',
    accent: 'text-error',
    icon: <AlertOctagon className="h-4 w-4" aria-hidden />,
  },
  neutral: {
    container: 'border-muted/40 bg-muted/20',
    accent: 'text-muted-foreground',
    icon: <Info className="h-4 w-4" aria-hidden />,
  },
}

export interface InlineAlertProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  variant?: InlineAlertVariant
  children?: ReactNode
  className?: string
  id?: string
}

export const InlineAlert = ({
  title,
  description,
  actions,
  icon,
  variant = 'info',
  children,
  className,
  id,
}: InlineAlertProps) => {
  const style = VARIANT_STYLES[variant]

  return (
    <div
      id={id}
      role="status"
      className={cn(
        'flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm text-foreground transition-colors',
        'shadow-sm shadow-transparent',
        'supports-[backdrop-filter]:backdrop-blur-sm',
        style.container,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-start gap-2">
          <span
            className={cn(
              'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-card/70',
              style.accent,
            )}
          >
            {icon ?? style.icon}
          </span>
          <span className="flex flex-col">
            <span className="text-xs font-semibold leading-tight text-foreground">{title}</span>
            {description ? (
              <span className="text-xs text-muted-foreground leading-snug">{description}</span>
            ) : null}
          </span>
        </span>
        {actions ? (
          <span className="flex flex-shrink-0 items-center gap-2 text-xs">{actions}</span>
        ) : null}
      </div>
      {children ? (
        <div className="text-xs leading-snug text-muted-foreground">{children}</div>
      ) : null}
    </div>
  )
}

export default InlineAlert
