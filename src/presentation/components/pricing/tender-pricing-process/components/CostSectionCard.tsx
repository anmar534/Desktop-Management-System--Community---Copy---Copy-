/**
 * Enhanced Cost Section Card Component (v5 Design with Inline Editing)
 * مكون بطاقة قسم التكاليف المحسّن مع التعديل المباشر
 *
 * الميزات:
 * - تصميم محسّن مع ألوان وأيقونات مميزة
 * - هيدر قابل للنقر للتوسع/الطي
 * - زر + للإضافة مباشرة
 * - جدول قابل للتعديل المباشر (inline editing)
 * - قوائم منسدلة للوحدات
 * - حقل الهدر للمواد
 * - حساب تلقائي للإجماليات
 * - تحسينات الأداء مع debouncing
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Package, Users, Truck, Briefcase, Trash2 } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Card } from '@/presentation/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { cn } from '@/presentation/components/ui/utils';
import { UNIT_OPTIONS } from '../constants';

interface CostItem {
  id: string;
  description?: string;
  name?: string;
  unit?: string;
  quantity?: number;
  price?: number;
  total: number;
  wastePercentage?: number; // للمواد فقط
  hasWaste?: boolean; // للمواد فقط
}

interface CostSectionCardProps {
  title: string;
  type: 'materials' | 'labor' | 'equipment' | 'subcontractors';
  items?: CostItem[];
  isCollapsed: boolean;
  onToggle: () => void;
  onAddRow: () => void;
  onUpdateRow: (id: string, field: string, value: any) => void;
  onDeleteRow: (id: string) => void;
  formatCurrency: (value: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => string;
}

// تكوين الألوان والأيقونات لكل نوع
const RESOURCE_CONFIG = {
  materials: {
    icon: Package,
    label: 'المواد',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    hoverBg: 'hover:bg-blue-100',
    tableBg: 'bg-blue-100',
  },
  labor: {
    icon: Users,
    label: 'العمالة',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
    hoverBg: 'hover:bg-purple-100',
    tableBg: 'bg-purple-100',
  },
  equipment: {
    icon: Truck,
    label: 'المعدات',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700',
    hoverBg: 'hover:bg-orange-100',
    tableBg: 'bg-orange-100',
  },
  subcontractors: {
    icon: Briefcase,
    label: 'مقاولو الباطن',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    hoverBg: 'hover:bg-green-100',
    tableBg: 'bg-green-100',
  },
};

// مكون Input محسّن مع debouncing لتحسين الأداء
const DebouncedInput: React.FC<{
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
}> = ({ value, onChange, type = 'text', placeholder, className, step, min, max }) => {
  const [localValue, setLocalValue] = useState(String(value));
  const timeoutRef = useRef<NodeJS.Timeout>();

  // تحديث القيمة المحلية عند تغيير القيمة الخارجية
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // إلغاء التايمر السابق
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // تأخير التحديث 300ms
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }, [onChange]);

  // تنظيف التايمر عند إلغاء المكون
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Input
      type={type}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      step={step}
      min={min}
      max={max}
    />
  );
};

export const CostSectionCard: React.FC<CostSectionCardProps> = ({
  title,
  type,
  items,
  isCollapsed,
  onToggle,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  formatCurrency
}) => {
  const config = RESOURCE_CONFIG[type];
  const Icon = config.icon;
  const hasItems = items && items.length > 0;

  // حساب الإجمالي مع مراعاة الهدر للمواد
  const total = hasItems
    ? items.reduce((sum, item) => {
        if (type === 'materials' && item.hasWaste && item.wastePercentage) {
          const wastageMultiplier = 1 + (item.wastePercentage / 100);
          return sum + ((item.quantity || 0) * (item.price || 0) * wastageMultiplier);
        }
        return sum + (item.total || 0);
      }, 0)
    : 0;

  const handleAddRow = () => {
    if (!isCollapsed) {
      // الجدول مفتوح، أضف الصف فقط
      onAddRow();
    } else {
      // الجدول مغلق، افتحه أولاً ثم أضف الصف
      onToggle();
      setTimeout(() => onAddRow(), 50);
    }
  };

  return (
    <div className="space-y-2">
      {/* الهيدر - قابل للنقر */}
      <div
        className={cn(
          'w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all',
          config.borderColor,
          config.bgColor,
          config.hoverBg,
          'group'
        )}
      >
        <div className="flex items-center gap-3">
          {/* زر الإضافة */}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleAddRow();
            }}
            className={cn(
              'h-8 w-8 p-0 rounded-full',
              config.textColor,
              'hover:bg-white/80'
            )}
            title={`إضافة ${title}`}
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* الأيقونة والعنوان */}
          <div className={cn('p-2 rounded-lg bg-white/80', config.textColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-right">
            <h4 className={cn('font-bold text-base', config.textColor)}>{title}</h4>
            <p className="text-sm text-muted-foreground">
              {hasItems ? `${items.length} ${items.length === 1 ? 'عنصر' : 'عناصر'}` : 'لا توجد عناصر'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* الإجمالي */}
          <div className="text-left">
            <p className="text-xs text-muted-foreground">الإجمالي</p>
            <p className={cn('text-lg font-bold tabular-nums', config.textColor)}>
              {formatCurrency(total, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* أيقونة التوسع - قابلة للنقر */}
          {hasItems && (
            <button
              onClick={onToggle}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              type="button"
            >
              {isCollapsed ? (
                <ChevronDown className={cn('h-5 w-5', config.textColor, 'group-hover:scale-110 transition-transform')} />
              ) : (
                <ChevronUp className={cn('h-5 w-5', config.textColor, 'group-hover:scale-110 transition-transform')} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* الجدول - يظهر عند التوسع */}
      {hasItems && !isCollapsed && (
        <Card className="border-2 border-muted overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn('border-b-2', config.borderColor, config.tableBg)}>
                  <th className="text-right p-3 font-bold text-sm">الوصف</th>
                  <th className="text-center p-3 font-bold text-sm w-32">الوحدة</th>
                  <th className="text-center p-3 font-bold text-sm w-28">الكمية</th>
                  {type === 'materials' && (
                    <th className="text-center p-3 font-bold text-sm w-24">الهدر (%)</th>
                  )}
                  <th className="text-center p-3 font-bold text-sm w-32">السعر</th>
                  <th className="text-center p-3 font-bold text-sm w-36">الإجمالي</th>
                  <th className="text-center p-3 font-bold text-sm w-16">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item, index) => {
                    // حساب الإجمالي مع الهدر للمواد
                    let displayTotal = item.total;
                    if (type === 'materials' && item.hasWaste && item.wastePercentage) {
                      const wastageMultiplier = 1 + (item.wastePercentage / 100);
                      displayTotal = (item.quantity || 0) * (item.price || 0) * wastageMultiplier;
                    }

                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          'border-b transition-colors',
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/30',
                          'hover:bg-muted/50'
                        )}
                      >
                        {/* الوصف - قابل للتعديل */}
                        <td className="p-2">
                          <DebouncedInput
                            value={item.name || item.description || ''}
                            onChange={(value) => onUpdateRow(item.id, 'name', value)}
                            placeholder="أدخل الوصف..."
                            className="h-9 text-sm border-muted-foreground/20 focus:border-primary"
                          />
                        </td>

                        {/* الوحدة - قائمة منسدلة */}
                        <td className="p-2">
                          <Select
                            value={item.unit || ''}
                            onValueChange={(value) => onUpdateRow(item.id, 'unit', value)}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="اختر..." />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS[type]?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* الكمية - قابل للتعديل */}
                        <td className="p-2">
                          <DebouncedInput
                            type="number"
                            value={item.quantity || ''}
                            onChange={(value) => onUpdateRow(item.id, 'quantity', parseFloat(value) || 0)}
                            placeholder="0"
                            className="h-9 text-sm text-center tabular-nums"
                            step="0.01"
                          />
                        </td>

                        {/* الهدر - فقط للمواد */}
                        {type === 'materials' && (
                          <td className="p-2">
                            <DebouncedInput
                              type="number"
                              value={item.wastePercentage || ''}
                              onChange={(value) => onUpdateRow(item.id, 'wastePercentage', parseFloat(value) || 0)}
                              placeholder="0"
                              className="h-9 text-sm text-center tabular-nums"
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </td>
                        )}

                        {/* السعر - قابل للتعديل */}
                        <td className="p-2">
                          <DebouncedInput
                            type="number"
                            value={item.price || ''}
                            onChange={(value) => onUpdateRow(item.id, 'price', parseFloat(value) || 0)}
                            placeholder="0.00"
                            className="h-9 text-sm text-center tabular-nums"
                            step="0.01"
                          />
                        </td>

                        {/* الإجمالي - للعرض فقط */}
                        <td className="p-2">
                          <div className={cn(
                            'px-3 py-2 flex flex-col items-center justify-center rounded-md font-bold tabular-nums text-sm',
                            config.bgColor,
                            config.textColor
                          )}>
                            <span>
                              {formatCurrency(displayTotal, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </span>
                            {type === 'materials' && item.hasWaste && item.wastePercentage && item.wastePercentage > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                (+ {item.wastePercentage}% هدر)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* حذف */}
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteRow(item.id)}
                            className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={type === 'materials' ? 7 : 6} className="p-8 text-center text-muted-foreground">
                      <p className="text-sm">لا توجد صفوف</p>
                      <p className="text-xs mt-1">اضغط على زر + لإضافة صف جديد</p>
                    </td>
                  </tr>
                )}
              </tbody>
              {hasItems && (
                <tfoot>
                  <tr className={cn('border-t-2', config.borderColor, config.tableBg)}>
                    <td colSpan={type === 'materials' ? 5 : 4} className="p-3 text-right font-bold">
                      الإجمالي:
                    </td>
                    <td className="p-3">
                      <div className={cn(
                        'px-3 py-2 rounded-md font-bold text-base tabular-nums text-center',
                        'bg-white/80',
                        config.textColor
                      )}>
                        {formatCurrency(total, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

