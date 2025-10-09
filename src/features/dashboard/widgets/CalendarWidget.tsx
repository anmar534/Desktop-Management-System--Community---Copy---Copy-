import type React from 'react';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import type { CalendarWidgetData, BaseWidgetProps, CalendarEvent } from '../types';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';

export interface CalendarWidgetProps extends Omit<BaseWidgetProps, 'data'> {
  data: CalendarWidgetData;
}

const formatKey = (date: Date) => date.toISOString().split('T')[0];

const statusBadgeStyles: Partial<Record<NonNullable<CalendarEvent['status']>, string>> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  critical: 'bg-destructive/15 text-destructive',
};

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, events, selectedDate, status = 'normal' } = data;
  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  const parsedEvents = useMemo(() =>
    events
      .map((event) => ({
        ...event,
        dateObj: new Date(event.date),
      }))
      .filter((event) => !Number.isNaN(event.dateObj.getTime())),
  [events]);

  const eventsByDay = useMemo(() => {
    const grouping = new Map<string, typeof parsedEvents>();
    parsedEvents.forEach((event) => {
      const key = formatKey(event.dateObj);
      const list = grouping.get(key) ?? [];
      list.push(event);
      grouping.set(key, list);
    });
    return grouping;
  }, [parsedEvents]);

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (selectedDate) {
      const parsed = new Date(selectedDate);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return parsedEvents[0]?.dateObj ?? new Date();
  });

  const selectedKey = formatKey(currentDate);
  const eventsForDay = eventsByDay.get(selectedKey) ?? [];

  const modifiers = useMemo(() => ({
    event: parsedEvents.map((event) => event.dateObj),
  }), [parsedEvents]);

  const modifiersClassNames = useMemo(() => ({
    event: 'bg-primary/15 text-primary hover:bg-primary/30 hover:text-primary border border-primary/40',
  }), []);

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
      contentClassName="flex flex-col gap-4"
    >
      <Calendar
        mode="single"
        selected={currentDate}
        onSelect={(day) => day && setCurrentDate(day)}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="rounded-xl border border-border/60 bg-background/80"
      />
      <div className="max-h-44 overflow-y-auto rounded-xl border border-border/60 bg-background/70 p-3">
        {eventsForDay.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا توجد أحداث في هذا اليوم.</p>
        ) : (
          <ul className="space-y-3">
            {eventsForDay.map((event) => (
              <li key={event.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{event.title}</span>
                  {event.status && (
                    <Badge variant="secondary" className={clsx('text-[10px]', statusBadgeStyles[event.status])}>
                      {event.status === 'critical' && 'حرج'}
                      {event.status === 'warning' && 'تنبيه'}
                      {event.status === 'success' && 'مكتمل'}
                      {event.status === 'default' && 'عام'}
                    </Badge>
                  )}
                </div>
                {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </WidgetContainer>
  );
};

export default CalendarWidget;
