import type React from 'react';
import { Clock } from 'lucide-react';
import type { TimelineWidgetData, TimelineEvent, BaseWidgetProps } from '../types';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';
import { cn } from '@/utils/cn';

export interface TimelineWidgetProps extends Omit<BaseWidgetProps, 'data'> {
  data: TimelineWidgetData;
}

const statusColors: Partial<Record<NonNullable<TimelineEvent['status']>, string>> = {
  completed: 'border-success/40 bg-success/10 text-success',
  'in-progress': 'border-warning/40 bg-warning/10 text-warning',
  upcoming: 'border-primary/40 bg-primary/10 text-primary',
};

export const TimelineWidget: React.FC<TimelineWidgetProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, events, status = 'normal' } = data;
  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      icon={<Clock className="h-4 w-4 text-primary" />}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
      contentClassName="flex flex-col"
    >
      <div className="relative flex-1 overflow-y-auto pl-4">
        <div className="absolute right-4 top-0 h-full w-px bg-border" />
        <ul className="flex flex-col gap-4">
          {events.map((event, index) => (
            <li key={event.id} className="relative flex flex-col gap-1 pr-6">
              <div className="absolute right-[13px] top-1 h-2 w-2 rounded-full bg-primary" />
              <div
                className={cn(
                  'w-fit rounded-full border px-2 py-0.5 text-xs font-medium',
                  event.status ? statusColors[event.status] : 'border-border text-muted-foreground',
                )}
              >
                {event.badge ?? `الحدث ${index + 1}`}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{event.title}</span>
                <span className="text-xs text-muted-foreground">{event.date}</span>
              </div>
              {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </WidgetContainer>
  );
};

export default TimelineWidget;
