import type React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { FinancialSummaryData, BaseWidgetProps, FinancialSummaryItem } from '../types';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';

export interface FinancialSummaryProps extends Omit<BaseWidgetProps, 'data'> {
  data: FinancialSummaryData;
}

const trendIcon: Record<NonNullable<FinancialSummaryItem['trend']>['direction'], React.ReactNode> = {
  up: <TrendingUp className="h-4 w-4" />,
  down: <TrendingDown className="h-4 w-4" />,
  stable: <Minus className="h-4 w-4" />,
};

const trendClasses: Record<NonNullable<FinancialSummaryItem['trend']>['direction'], string> = {
  up: 'text-success',
  down: 'text-destructive',
  stable: 'text-muted-foreground',
};

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, summary, period, status = 'normal' } = data;
  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  return (
    <WidgetContainer
      title={title}
      description={subtitle ?? period}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {summary.map((item) => (
          <div key={item.id} className="flex flex-col gap-1 rounded-xl border border-border/50 bg-background/70 p-3">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-lg font-semibold text-foreground">{item.value}</span>
            {item.sublabel && <span className="text-xs text-muted-foreground">{item.sublabel}</span>}
            {item.trend && (
              <span className={clsx('flex items-center gap-1 text-xs font-medium', trendClasses[item.trend.direction])}>
                {trendIcon[item.trend.direction]}
                {item.trend.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
};

export default FinancialSummary;
