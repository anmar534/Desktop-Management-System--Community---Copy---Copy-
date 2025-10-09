/**
 * List Widget
 *
 * عرض قائمة من العناصر مع إمكانية الإجراءات
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type React from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import type { ListWidgetData, BaseWidgetProps } from '../types';
import clsx from 'clsx';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';

export interface ListWidgetProps extends Omit<BaseWidgetProps, 'data'> {
  data: ListWidgetData;
}

export const ListWidget: React.FC<ListWidgetProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, items, maxItems = 5, showMore, status = 'normal' } = data;

  const displayItems = items.slice(0, maxItems);

  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  const footer = showMore && items.length > maxItems && (
    <button
      type="button"
      className={clsx(
        'flex w-full items-center justify-center gap-2',
        'text-sm font-medium text-primary transition-colors hover:text-primary/80',
      )}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span>عرض المزيد ({items.length - maxItems})</span>
    </button>
  );

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
      contentClassName="flex"
      footer={footer}
    >
      {displayItems.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          لا توجد عناصر
        </div>
      ) : (
        <div className="flex h-full flex-col overflow-hidden">
          <div className="divide-y divide-border overflow-y-auto">
            {displayItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={clsx(
                  'flex w-full items-center gap-3 px-2 py-2 text-right transition-colors md:px-3',
                  item.action ? 'cursor-pointer hover:bg-accent/60' : 'cursor-default',
                )}
              >
                {item.icon && <div className="flex-shrink-0 text-muted-foreground">{item.icon}</div>}
                <div className="flex-1 text-right">
                  <div className="text-sm font-medium text-foreground">{item.title}</div>
                  {item.subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</div>}
                </div>
                {item.value !== undefined && (
                  <div className="flex-shrink-0 text-sm font-semibold text-foreground">{item.value}</div>
                )}
                {item.action && <ChevronLeft className="h-4 w-4 text-muted-foreground" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </WidgetContainer>
  );
};

export default ListWidget;
