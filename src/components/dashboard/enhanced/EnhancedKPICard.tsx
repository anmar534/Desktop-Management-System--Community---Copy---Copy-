/**
 * Enhanced KPI Card Component
 * 
 * بطاقة مؤشر أداء محسّنة لشركات المقاولات
 * تعرض المؤشرات الحرجة مع تنبيهات بصرية وإجراءات سريعة
 * 
 * @version 2.0.0
 * @date 2024-01-15
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  Target,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import type { LucideIcon } from 'lucide-react';

export interface EnhancedKPICardProps {
  /** عنوان المؤشر */
  title: string;
  /** القيمة الحالية */
  value: number | string;
  /** وحدة القياس */
  unit?: string;
  /** القيمة المستهدفة */
  target?: number;
  /** اتجاه التغيير */
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  /** حالة المؤشر */
  status: 'success' | 'warning' | 'danger' | 'info';
  /** أيقونة المؤشر */
  icon: LucideIcon;
  /** لون مخصص */
  color?: string;
  /** إجراء سريع */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** وصف إضافي */
  description?: string;
  /** إظهار شريط التقدم */
  showProgress?: boolean;
  /** حجم البطاقة */
  size?: 'small' | 'medium' | 'large';
  /** تفعيل الحركة */
  animated?: boolean;
}

export const EnhancedKPICard: React.FC<EnhancedKPICardProps> = ({
  title,
  value,
  unit,
  target,
  trend,
  status,
  icon: Icon,
  color,
  action,
  description,
  showProgress = false,
  size = 'medium',
  animated = true,
}) => {
  // حساب نسبة التقدم
  const progressPercentage = target && typeof value === 'number' 
    ? Math.min((value / target) * 100, 100) 
    : 0;

  // تحديد ألوان الحالة
  const statusColors = {
    success: {
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
  };

  // تحديد أيقونة الاتجاه
  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      case 'stable':
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // تحديد لون الاتجاه
  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return '';
    }
  };

  // تحديد أيقونة الحالة
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'danger':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // تحديد حجم البطاقة
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const currentColors = statusColors[status];

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        currentColors.bg,
        currentColors.border,
        animated && 'hover:scale-105 hover:-translate-y-1',
        'border-2'
      )}
      style={color ? { borderColor: color } : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Icon 
            className={cn('h-5 w-5', currentColors.icon)} 
            style={color ? { color } : undefined}
          />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <Badge 
          variant="secondary" 
          className={cn('flex items-center gap-1', currentColors.badge)}
        >
          {getStatusIcon()}
          <span className="text-xs">
            {status === 'success' && 'ممتاز'}
            {status === 'warning' && 'تحذير'}
            {status === 'danger' && 'حرج'}
            {status === 'info' && 'معلومات'}
          </span>
        </Badge>
      </CardHeader>

      <CardContent className={sizeClasses[size]}>
        {/* القيمة الرئيسية */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2 space-x-reverse">
            <span className="text-3xl font-bold text-foreground">
              {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
            </span>
            {unit && (
              <span className="text-lg text-muted-foreground">{unit}</span>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* شريط التقدم */}
        {showProgress && target && typeof value === 'number' && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">التقدم نحو الهدف</span>
              <span className="font-medium">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
              indicatorClassName={cn(
                status === 'success' && 'bg-green-500',
                status === 'warning' && 'bg-yellow-500',
                status === 'danger' && 'bg-red-500',
                status === 'info' && 'bg-blue-500'
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>الحالي: {value.toLocaleString('ar-SA')}</span>
              <span>الهدف: {target.toLocaleString('ar-SA')}</span>
            </div>
          </div>
        )}

        {/* معلومات الاتجاه */}
        <div className="mt-4 flex items-center justify-between">
          <div className={cn('flex items-center space-x-1 space-x-reverse text-sm', getTrendColor())}>
            {getTrendIcon()}
            <span className="font-medium">
              {trend.percentage > 0 ? '+' : ''}
              {trend.percentage}%
            </span>
            <span className="text-muted-foreground text-xs">
              {trend.period}
            </span>
          </div>

          {/* الهدف */}
          {target && (
            <div className="flex items-center space-x-1 space-x-reverse text-sm text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>{target.toLocaleString('ar-SA')}</span>
            </div>
          )}
        </div>

        {/* الإجراء السريع */}
        {action && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="w-full justify-between text-sm hover:bg-background/80"
            >
              <span>{action.label}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>

      {/* تأثير بصري للحالة الحرجة */}
      {status === 'danger' && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-500">
          <div className="absolute -top-[18px] -right-[15px]">
            <AlertTriangle className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedKPICard;
