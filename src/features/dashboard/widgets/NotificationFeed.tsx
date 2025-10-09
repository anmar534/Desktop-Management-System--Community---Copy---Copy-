import type React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import clsx from 'clsx';
import type { NotificationFeedData, NotificationItem, BaseWidgetProps } from '../types';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';

export interface NotificationFeedProps extends Omit<BaseWidgetProps, 'data'> {
  data: NotificationFeedData;
  onDismiss?: (id: string) => void;
}

const iconByCategory: Record<NotificationItem['category'], React.ReactNode> = {
  alert: <AlertTriangle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  success: <CheckCircle className="h-4 w-4 text-success" />,
  info: <Info className="h-4 w-4 text-info" />,
};

const chipStyles: Record<NotificationItem['category'], string> = {
  alert: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  success: 'bg-success/10 text-success border-success/20',
  info: 'bg-primary/10 text-primary border-primary/20',
};

const formatRelativeTime = (value: string) => {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) {
    return value;
  }
  const diffMs = target.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
};

export const NotificationFeed: React.FC<NotificationFeedProps> = ({ data, loading, error, onRefresh, onDismiss }) => {
  const { title, subtitle, items, status = 'normal', emptyState } = data;
  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      icon={<Bell className="h-4 w-4 text-primary" />}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
    >
      {items.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          {emptyState ?? 'لا توجد تنبيهات حالياً.'}
        </div>
      ) : (
        <div className="flex h-full flex-col gap-3 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className={clsx(
                'relative flex items-start gap-3 rounded-xl border p-3 pr-4 transition-colors',
                chipStyles[item.category],
                item.unread && 'ring-2 ring-primary/30',
              )}
            >
              <div className="mt-0.5 flex-shrink-0">{iconByCategory[item.category]}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
              {onDismiss && (
                <button
                  type="button"
                  onClick={() => onDismiss(item.id)}
                  className="absolute left-2 top-2 rounded-full p-1 text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
                  aria-label="إخفاء"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </WidgetContainer>
  );
};

export default NotificationFeed;
