import type { ReactNode } from 'react';
import { RefreshCcw } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export type WidgetStatusVariant = 'default' | 'warning' | 'error' | 'success' | 'info';

interface WidgetContainerProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  status?: WidgetStatusVariant;
  isLoading?: boolean;
  loadingContent?: ReactNode;
  error?: string | Error | null;
  onRefresh?: () => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  disableHeader?: boolean;
}

const statusStyles: Record<WidgetStatusVariant, string> = {
  default: 'border-border/80 bg-card/95',
  warning: 'border-warning/30 bg-warning/5',
  error: 'border-destructive/30 bg-destructive/5',
  success: 'border-success/30 bg-success/5',
  info: 'border-primary/30 bg-primary/5',
};

export const WidgetContainer = ({
  title,
  description,
  icon,
  actions,
  footer,
  status = 'default',
  isLoading = false,
  loadingContent,
  error,
  onRefresh,
  children,
  className,
  contentClassName,
  disableHeader = false,
}: WidgetContainerProps) => {
  const headerVisible = !disableHeader && (title || description || icon || actions || onRefresh);

  return (
    <Card
      className={clsx(
        'flex h-full flex-col gap-3 rounded-2xl border p-4 shadow-sm backdrop-blur transition-colors duration-200',
        statusStyles[status],
        className,
      )}
    >
      {headerVisible && (
  <div className="widget-drag-handle flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            {icon && <span className="mt-1 text-muted-foreground">{icon}</span>}
            <div>
              {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {onRefresh && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onRefresh}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

  <div className={clsx('relative flex-1 overflow-hidden', contentClassName)}>
        {isLoading ? (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center">
            {loadingContent ?? <Skeleton className="h-full w-full" />}
          </div>
        ) : error ? (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {typeof error === 'string' ? error : error.message ?? 'حدث خطأ أثناء تحميل البيانات'}
          </div>
        ) : (
          <div className="h-full">{children}</div>
        )}
      </div>

      {footer && <div className="border-t border-border/60 pt-2 text-xs text-muted-foreground">{footer}</div>}
    </Card>
  );
};

export default WidgetContainer;
