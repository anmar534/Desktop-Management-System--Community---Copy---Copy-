/**
 * Status Badge Component
 *
 * مكون Badge موحد لعرض حالات المشاريع والمنافسات والميزانية
 * مستوحى من Procore Status Indicators
 *
 * @version 1.0.0
 * @date 2025-10-08
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Badge } from './badge';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Circle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

// ============================================
// Status Badge Variants
// ============================================

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium transition-colors',
  {
    variants: {
      status: {
        // Project/Tender Status
        overdue: 'bg-status-overdue/10 text-status-overdue border-status-overdue/30',
        dueSoon: 'bg-status-due-soon/10 text-foreground border-status-due-soon/30',
        onTrack: 'bg-status-on-track/10 text-status-on-track border-status-on-track/30',
        notStarted: 'bg-muted text-muted-foreground border-border',
        completed: 'bg-status-completed/10 text-status-completed border-status-completed/30',

        // Financial Status
        underBudget: 'bg-financial-underBudget/10 text-financial-underBudget border-financial-underBudget/30',
        onBudget: 'bg-financial-onBudget/10 text-financial-onBudget border-financial-onBudget/30',
        nearBudget: 'bg-financial-nearBudget/10 text-foreground border-financial-nearBudget/30',
        overBudget: 'bg-financial-overBudget/10 text-financial-overBudget border-financial-overBudget/30',

        // Generic Status
        success: 'bg-success/10 text-success border-success/30',
        warning: 'bg-warning/10 text-foreground border-warning/30',
        error: 'bg-error/10 text-error border-error/30',
        info: 'bg-info/10 text-info border-info/30',
        default: 'bg-muted text-muted-foreground border-border',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        default: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
      },
    },
    defaultVariants: {
      status: 'default',
      size: 'default',
    },
  }
);

// ============================================
// Status Icon Mapping
// ============================================

const statusIconMap: Record<string, LucideIcon> = {
  // Project/Tender Status
  overdue: AlertCircle,
  dueSoon: AlertTriangle,
  onTrack: CheckCircle2,
  notStarted: Circle,
  completed: CheckCircle2,

  // Financial Status
  underBudget: TrendingDown,
  onBudget: DollarSign,
  nearBudget: Minus,
  overBudget: TrendingUp,

  // Generic
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Clock,
  default: Circle,
};

// ============================================
// Status Labels (Arabic)
// ============================================

const statusLabels: Record<string, string> = {
  // Project/Tender Status
  overdue: 'متأخر',
  dueSoon: 'يستحق قريباً',
  onTrack: 'على المسار',
  notStarted: 'لم يبدأ',
  completed: 'مكتمل',

  // Financial Status
  underBudget: 'أقل من الميزانية',
  onBudget: 'ضمن الميزانية',
  nearBudget: 'قرب الميزانية',
  overBudget: 'تجاوز الميزانية',

  // Generic
  success: 'نجاح',
  warning: 'تحذير',
  error: 'خطأ',
  info: 'معلومات',
  default: 'افتراضي',
};

// ============================================
// StatusBadge Props
// ============================================

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof statusBadgeVariants> {
  /**
   * إظهار الأيقونة
   * @default true
   */
  showIcon?: boolean;

  /**
   * أيقونة مخصصة (بديل عن الأيقونة الافتراضية)
   */
  icon?: LucideIcon;

  /**
   * نص مخصص (بديل عن النص الافتراضي)
   */
  label?: string;

  /**
   * قيمة إضافية للعرض (مثل: عدد الأيام المتبقية)
   */
  value?: string | number;
}

// ============================================
// StatusBadge Component
// ============================================

export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  (
    {
      status = 'default',
      size = 'default',
      showIcon = true,
      icon,
      label,
      value,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Icon = icon || (status ? statusIconMap[status] : statusIconMap.default);
    const displayLabel = label || (status ? statusLabels[status] : '');

    return (
      <Badge
        ref={ref}
        variant="outline"
        className={cn(statusBadgeVariants({ status, size }), className)}
        {...props}
      >
        {showIcon && Icon && <Icon className="h-3.5 w-3.5" />}
        {children || (
          <>
            {displayLabel}
            {value && <span className="font-semibold">({value})</span>}
          </>
        )}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// ============================================
// Project Status Badge
// ============================================

export interface ProjectStatusBadgeProps
  extends Omit<StatusBadgeProps, 'status'> {
  /**
   * تاريخ الاستحقاق
   */
  deadline: Date | string;

  /**
   * حالة المشروع (اختياري، سيتم حسابها تلقائياً من deadline)
   */
  status?: 'overdue' | 'dueSoon' | 'onTrack' | 'completed';
}

export const ProjectStatusBadge = React.forwardRef<
  HTMLDivElement,
  ProjectStatusBadgeProps
>(({ deadline, status, ...props }, ref) => {
  const calculateStatus = (): 'overdue' | 'dueSoon' | 'onTrack' | 'completed' => {
    if (status) return status;

    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysRemaining = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 7) return 'dueSoon';
    return 'onTrack';
  };

  const getDaysRemaining = (): number => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const computedStatus = calculateStatus();
  const daysRemaining = getDaysRemaining();

  return (
    <StatusBadge
      ref={ref}
      status={computedStatus}
      value={computedStatus !== 'completed' ? `${Math.abs(daysRemaining)} يوم` : undefined}
      {...props}
    />
  );
});

ProjectStatusBadge.displayName = 'ProjectStatusBadge';

// ============================================
// Financial Status Badge
// ============================================

export interface FinancialStatusBadgeProps
  extends Omit<StatusBadgeProps, 'status'> {
  /**
   * المبلغ المخطط
   */
  planned: number;

  /**
   * المبلغ الفعلي
   */
  actual: number;

  /**
   * نسبة التحذير (عند الوصول إليها يصبح nearBudget)
   * @default 0.9
   */
  warningThreshold?: number;
}

export const FinancialStatusBadge = React.forwardRef<
  HTMLDivElement,
  FinancialStatusBadgeProps
>(({ planned, actual, warningThreshold = 0.9, ...props }, ref) => {
  const calculateFinancialStatus = (): 'underBudget' | 'onBudget' | 'nearBudget' | 'overBudget' => {
    const percentage = actual / planned;

    if (percentage > 1) return 'overBudget';
    if (percentage >= warningThreshold) return 'nearBudget';
    if (percentage >= 0.5) return 'onBudget';
    return 'underBudget';
  };

  const getPercentage = (): string => {
    const percentage = (actual / planned) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  const status = calculateFinancialStatus();

  return (
    <StatusBadge
      ref={ref}
      status={status}
      value={getPercentage()}
      {...props}
    />
  );
});

FinancialStatusBadge.displayName = 'FinancialStatusBadge';

// ============================================
// Simple Status Indicator (Dot only)
// ============================================

export interface StatusIndicatorProps {
  /**
   * الحالة
   */
  status: StatusBadgeProps['status'];

  /**
   * الحجم
   * @default "default"
   */
  size?: 'sm' | 'default' | 'lg';

  /**
   * عرض التسمية بجانب النقطة
   * @default false
   */
  showLabel?: boolean;

  /**
   * تسمية مخصصة
   */
  label?: string;

  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status = 'default',
  size = 'default',
  showLabel = false,
  label,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    default: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const colorClasses = {
    overdue: 'bg-status-overdue',
    dueSoon: 'bg-status-due-soon',
    onTrack: 'bg-status-on-track',
    notStarted: 'bg-muted-foreground',
    completed: 'bg-status-completed',
    underBudget: 'bg-financial-underBudget',
    onBudget: 'bg-financial-onBudget',
    nearBudget: 'bg-financial-nearBudget',
    overBudget: 'bg-financial-overBudget',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    default: 'bg-muted-foreground',
  };

  const displayLabel = label || (status ? statusLabels[status] : '');

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'rounded-full',
          sizeClasses[size],
          status ? colorClasses[status] : colorClasses.default
        )}
        aria-label={displayLabel}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground">{displayLabel}</span>
      )}
    </div>
  );
};

StatusIndicator.displayName = 'StatusIndicator';
