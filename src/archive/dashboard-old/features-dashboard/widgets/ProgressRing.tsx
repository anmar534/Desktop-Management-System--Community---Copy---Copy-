/**
 * Progress Ring Widget
 *
 * حلقة تقدم دائرية مع نسبة مئوية
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type React from 'react';
import type { ProgressRingData, BaseWidgetProps } from '../types';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';

export interface ProgressRingProps extends Omit<BaseWidgetProps, 'data'> {
  data: ProgressRingData;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ data, loading, error, onRefresh }) => {
  const { title, subtitle, percentage, label, current, total, color, status = 'normal' } = data;

  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  // حجم الدائرة
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // تحديد اللون حسب النسبة أو الحالة
  const getColor = () => {
    if (color) return color;

    if (status === 'error') return 'hsl(var(--destructive))';
    if (status === 'warning') return 'hsl(var(--warning))';
    if (status === 'success') return 'hsl(var(--success))';

    // تلوين تلقائي حسب النسبة
    if (percentage >= 80) return 'hsl(var(--success))';
    if (percentage >= 50) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
      contentClassName="flex"
    >
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4">
        <div className="relative h-[120px] w-[120px]">
          <svg className="-rotate-90 transform" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              className="text-muted/20"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={getColor()}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-foreground">{percentage}%</div>
            <div className="mt-1 text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{current.toLocaleString('ar-SA')}</span>
          <span>/</span>
          <span>{total.toLocaleString('ar-SA')}</span>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default ProgressRing;
