/**
 * KPI Card Widget
 *
 * بطاقة مؤشر أداء رئيسي (KPI)
 * تعرض قيمة، اتجاه، وهدف
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type React from 'react';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import type { KPICardData, BaseWidgetProps } from '../types';
import clsx from 'clsx';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';

export interface KPICardProps extends Omit<BaseWidgetProps, 'data'> {
  data: KPICardData;
}

export const KPICard: React.FC<KPICardProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, value, unit, trend, icon, target, status = 'normal' } = data;

  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  // تحديد لون الاتجاه
  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      case 'neutral':
        return 'text-muted-foreground';
      default:
        return '';
    }
  };

  // تحديد أيقونة الاتجاه
  const getTrendIcon = () => {
    if (!trend) return null;
  const iconClass = clsx('h-4 w-4', getTrendColor());

    switch (trend.direction) {
      case 'up':
        return <TrendingUp className={iconClass} />;
      case 'down':
        return <TrendingDown className={iconClass} />;
      case 'neutral':
        return <Minus className={iconClass} />;
      default:
        return null;
    }
  };

  // حساب نسبة الإنجاز من الهدف
  const getTargetPercentage = () => {
    if (!target || typeof value !== 'number') return null;
    return Math.round((value / target) * 100);
  };

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      icon={icon}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
      contentClassName="flex"
    >
      <div className="flex h-full flex-1 flex-col justify-between gap-4">
        <div className="flex-1">
          <div className="text-3xl font-bold text-foreground">
            {value}
            {unit && <span className="text-lg text-muted-foreground mr-1">{unit}</span>}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          {trend && (
            <div className={clsx('flex items-center gap-1', getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">
                {trend.percentage > 0 ? '+' : ''}
                {trend.percentage}%
              </span>
              <span className="text-muted-foreground text-xs">{trend.period}</span>
            </div>
          )}
          {target && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span className="text-xs">{getTargetPercentage()}% من الهدف</span>
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default KPICard;
