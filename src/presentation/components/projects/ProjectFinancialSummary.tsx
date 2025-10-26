import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/components/ui/utils';

/**
 * Financial Summary Component Props
 */
export interface ProjectFinancialSummaryProps {
  /** Total budget */
  budget: number;
  /** Actual spent amount */
  spent: number;
  /** Currency symbol */
  currency?: string;
  /** Show variance indicator */
  showVariance?: boolean;
  /** Compact view */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Format currency value
 */
const formatCurrency = (value: number, currency: string = 'ر.س.'): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ` ${currency}`;
};

/**
 * Calculate variance percentage
 */
const calculateVariance = (budget: number, spent: number): number => {
  if (budget === 0) return 0;
  return ((spent - budget) / budget) * 100;
};

/**
 * ProjectFinancialSummary Component
 * 
 * Displays budget vs actual spending with variance indicators.
 * Shows visual feedback for over/under budget scenarios.
 * 
 * @example
 * ```tsx
 * <ProjectFinancialSummary budget={100000} spent={75000} showVariance />
 * <ProjectFinancialSummary budget={50000} spent={60000} compact />
 * ```
 */
export const ProjectFinancialSummary: React.FC<ProjectFinancialSummaryProps> = ({
  budget,
  spent,
  currency = 'ر.س.',
  showVariance = true,
  compact = false,
  className = '',
}) => {
  const remaining = budget - spent;
  const variance = calculateVariance(budget, spent);
  const isOverBudget = spent > budget;
  const isOnTrack = Math.abs(variance) <= 10; // Within 10% is on track

  const VarianceIcon = isOverBudget ? TrendingUp : remaining === 0 ? AlertTriangle : TrendingDown;
  const varianceColor = isOverBudget
    ? 'text-red-600 dark:text-red-400'
    : isOnTrack
    ? 'text-green-600 dark:text-green-400'
    : 'text-yellow-600 dark:text-yellow-400';

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)} data-testid="financial-summary-compact">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-sm font-medium">{formatCurrency(spent, currency)}</div>
          <div className="text-xs text-muted-foreground">
            من {formatCurrency(budget, currency)}
          </div>
        </div>
        {showVariance && (
          <div className={cn('text-xs font-medium flex items-center gap-1', varianceColor)}>
            <VarianceIcon className="h-3 w-3" />
            {Math.abs(variance).toFixed(1)}%
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('', className)} data-testid="financial-summary-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          الملخص المالي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Budget */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">الميزانية</span>
          <span className="text-sm font-semibold" data-testid="budget-value">
            {formatCurrency(budget, currency)}
          </span>
        </div>

        {/* Spent */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">المصروف</span>
          <span className="text-sm font-semibold" data-testid="spent-value">
            {formatCurrency(spent, currency)}
          </span>
        </div>

        {/* Remaining */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm font-medium">المتبقي</span>
          <span
            className={cn(
              'text-sm font-bold',
              remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            )}
            data-testid="remaining-value"
          >
            {formatCurrency(Math.abs(remaining), currency)}
            {remaining < 0 && ' (تجاوز)'}
          </span>
        </div>

        {/* Variance */}
        {showVariance && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">نسبة الانحراف</span>
            <div className={cn('flex items-center gap-1 text-xs font-semibold', varianceColor)} data-testid="variance">
              <VarianceIcon className="h-3 w-3" />
              {variance > 0 ? '+' : ''}
              {variance.toFixed(1)}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Get financial status text
 */
export const getFinancialStatus = (budget: number, spent: number): string => {
  const variance = calculateVariance(budget, spent);
  if (variance > 10) return 'تجاوز الميزانية';
  if (variance < -10) return 'أقل من الميزانية';
  return 'ضمن الميزانية';
};

export default ProjectFinancialSummary;
