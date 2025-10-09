/**
 * Stat Card Widget
 *
 * بطاقة إحصائية مع إحصائيات فرعية
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type React from 'react';
import type { StatCardData, BaseWidgetProps } from '../types';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';

export interface StatCardProps extends Omit<BaseWidgetProps, 'data'> {
  data: StatCardData;
}

export const StatCard: React.FC<StatCardProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, mainStat, subStats, status = 'normal' } = data;
  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
    >
      <div className="flex h-full flex-col gap-4">
        <div>
          <div className="text-4xl font-bold text-foreground">
            {mainStat.value}
            {mainStat.unit && <span className="mr-2 text-xl text-muted-foreground">{mainStat.unit}</span>}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{mainStat.label}</div>
        </div>

        {subStats && subStats.length > 0 && (
          <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-4">
            {subStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {stat.value}
                  {stat.unit && <span className="mr-1 text-sm text-muted-foreground">{stat.unit}</span>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default StatCard;
