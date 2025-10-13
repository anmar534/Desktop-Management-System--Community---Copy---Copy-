import type React from 'react';
import type { QuickActionsData, BaseWidgetProps } from '../types';
import { Button } from '@/components/ui/button';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';
import { cn } from '@/utils/cn';

export interface QuickActionsProps extends Omit<BaseWidgetProps, 'data'> {
  data: QuickActionsData;
}

const intentVariant: Record<NonNullable<QuickActionsData['actions'][number]['intent']>, 'default' | 'secondary' | 'destructive'> = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
};

export const QuickActions: React.FC<QuickActionsProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, actions, columns = 2, status = 'normal' } = data;
  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  const gridClass = cn('grid gap-3', {
    'sm:grid-cols-2 md:grid-cols-3': columns >= 3,
    'sm:grid-cols-2': columns === 2,
    'grid-cols-1': columns <= 1,
  });

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
    >
      <div className={gridClass}>
        {actions.map((action) => {
          const variant = action.intent ? intentVariant[action.intent] : 'secondary';
          return (
            <Button
              key={action.id}
              type="button"
              variant={variant}
              onClick={action.onClick}
              className={cn(
                'flex h-auto flex-col items-start gap-2 rounded-xl border border-border bg-card/40 px-4 py-3 text-right shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary/40',
                variant === 'secondary' && 'bg-muted/40 hover:bg-muted/60',
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {action.icon}
                <span>{action.label}</span>
              </span>
              {action.description && (
                <span className="text-xs text-muted-foreground">{action.description}</span>
              )}
              {action.hotkey && (
                <span className="text-xs font-medium text-primary opacity-80">{action.hotkey}</span>
              )}
            </Button>
          );
        })}
      </div>
    </WidgetContainer>
  );
};

export default QuickActions;
