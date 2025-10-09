/**
 * Insights Panel Component
 *
 * لوحة عرض الإحصاءات الذكية
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import type React from 'react';
import { useState } from 'react';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { SmartInsight } from '../types';
import { cn } from '@/utils/cn';

export interface InsightsPanelProps {
  insights: SmartInsight[];
  onDismiss?: (insightId: string) => void;
  className?: string;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, onDismiss, className }) => {
  const [expanded, setExpanded] = useState(true);

  if (insights.length === 0) {
    return null;
  }

  // تصفية الإحصاءات غير المرفوضة
  const activeInsights = insights.filter((insight) => !insight.dismissed);

  if (activeInsights.length === 0) {
    return null;
  }

  // الحصول على أيقونة حسب النوع
  const getIcon = (type: SmartInsight['type']) => {
    const iconClass = 'h-5 w-5';

    switch (type) {
      case 'alert':
        return <AlertCircle className={cn(iconClass, 'text-destructive')} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClass, 'text-warning')} />;
      case 'success':
        return <CheckCircle className={cn(iconClass, 'text-success')} />;
      case 'info':
        return <Info className={cn(iconClass, 'text-info')} />;
      default:
        return <Info className={cn(iconClass, 'text-muted-foreground')} />;
    }
  };

  // الحصول على أنماط حسب النوع
  const getInsightStyles = (type: SmartInsight['type']) => {
    switch (type) {
      case 'alert':
        return 'border-destructive/20 bg-destructive/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'info':
        return 'border-info/20 bg-info/5';
      default:
        return 'border-border bg-card';
    }
  };

  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full px-6 py-4 flex items-center justify-between',
          'hover:bg-accent/50 transition-colors'
        )}
      >
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">إحصاءات ذكية</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {activeInsights.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Insights List */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {activeInsights.map((insight) => (
            <div
              key={insight.id}
              className={cn('p-4 relative', getInsightStyles(insight.type))}
            >
              {/* Close Button */}
              {onDismiss && (
                <button
                  type="button"
                  onClick={() => onDismiss(insight.id)}
                  className={cn(
                    'absolute top-2 left-2',
                    'p-1 rounded-md',
                    'hover:bg-background/50',
                    'text-muted-foreground hover:text-foreground',
                    'transition-colors'
                  )}
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Content */}
              <div className="flex gap-3 pl-8">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">{getIcon(insight.type)}</div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>

                  {/* Data */}
                  {insight.data && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {insight.data.metric}: <strong className="text-foreground">{insight.data.value}</strong>
                      </span>
                      {insight.data.threshold && (
                        <span>
                          الحد: <strong className="text-foreground">{insight.data.threshold}</strong>
                        </span>
                      )}
                      {insight.data.trend && (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded',
                            insight.data.trend === 'increasing' && 'bg-success/10 text-success',
                            insight.data.trend === 'decreasing' && 'bg-destructive/10 text-destructive',
                            insight.data.trend === 'stable' && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {insight.data.trend === 'increasing' && '↗ متزايد'}
                          {insight.data.trend === 'decreasing' && '↘ متناقص'}
                          {insight.data.trend === 'stable' && '→ مستقر'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  {insight.action && (
                    <button
                      type="button"
                      onClick={insight.action.onClick}
                      className={cn(
                        'mt-3 px-3 py-1.5 rounded-md',
                        'text-xs font-medium',
                        'bg-primary text-primary-foreground',
                        'hover:bg-primary/90',
                        'transition-colors'
                      )}
                    >
                      {insight.action.label}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
